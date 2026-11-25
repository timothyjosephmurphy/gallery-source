// Shared dancer kinematics + per-camera sensor simulation + tracker + stereo.
// The tracker/stereo half consumes only blob lists {u,v,rgb,streak}; it never
// sees dancer indices or true positions.
import { colorAtFrame, classify, RGB, TransitionDecoder, FPS, cycleLength } from './code.js';
import { project, backProject, triangulate, segHitsSphere, v3 } from './camera.js';
import { perchFor, inFootprint, clampTo, exitFootprint } from './stage.js';

export const ROOM = { w: 10, d: 10, h: 4 }; // Room 1 capture floor (local): x,z in [-5,5]

export function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// Staggered dance-floor layout (rows offset by half a spacing, like a real crowd facing the booth),
// jittered so it never looks like a grid. Indices >= 14 fall back to random spots.
export function floorSpot(i, r) {
  const rows = [[-1.4, 3], [0.1, 4], [1.6, 3], [3.1, 4]], spots = [];
  rows.forEach(([z, n], ri) => { for (let k = 0; k < n; k++) spots.push([(k - (n - 1) / 2) * (n === 4 ? 1.75 : 1.9) + (ri % 2 ? 0.55 : -0.2), z]); });
  const j = () => (r() - 0.5) * 0.5;
  if (i < spots.length) return [spots[i][0] + j(), spots[i][1] + j()];
  return [(r() - 0.5) * 7.6, (r() - 0.5) * 7.0];
}
// ---------- floor wandering (TJ t2227u): waypoint strolls, pause-and-groove, personal space ----------
export const FLOOR = { x0: -3.7, x1: 3.7, z0: -2.0, z1: 3.7 };
// horizontal stereo wedge test against the two sensor cameras (sim cameras from makeCamera)
export function inStereo(cams, x, z, margin = 0.07) {
  if (x < FLOOR.x0 || x > FLOOR.x1 || z < FLOOR.z0 || z > FLOOR.z1) return false;
  if (!cams) return true;
  for (const c of cams) { const half = Math.atan(c.W / 2 / c.f) - margin, yaw = Math.atan2(c.fwd[0], c.fwd[2]); let d = Math.atan2(x - c.C[0], z - c.C[2]) - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) > half) return false; }
  return true;
}
// People drift toward open floor: best of 10 random candidate spots by clearance from everyone else's
// position and destination (keeps a realistic personal-space spread instead of random clumps).
function pickSpot(dn, cams, dancers = []) {
  let best = null, bs = -1;
  if (dn.perch) { const r = dn.perch; return [r.x0 + (r.x1 - r.x0) * dn.rng(), r.z0 + (r.z1 - r.z0) * dn.rng()]; } // 871: stay on the platform top
  for (let k = 0, got = 0; k < 300 && got < 10; k++) {
    const x = FLOOR.x0 + (FLOOR.x1 - FLOOR.x0) * dn.rng(), z = FLOOR.z0 + (FLOOR.z1 - FLOOR.z0) * dn.rng();
    if (!inStereo(cams, x, z, 0.1) || inFootprint(x, z, 0.45) || Math.hypot(x - dn.pos[0], z - dn.pos[1]) < 1.2) continue; got++;
    let c = 9; for (const o of dancers) { if (o === dn) continue; c = Math.min(c, Math.hypot(x - o.pos[0], z - o.pos[1])); if (o.target) c = Math.min(c, Math.hypot(x - o.target[0], z - o.target[1])); }
    if (c > bs) { bs = c; best = [x, z]; }
  }
  return best || [0, 1.2];
}
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
// Advance every dancer exactly once per 60 Hz tick (never inside the shutter sub-samples).
export function stepDancers(dancers, dt, t, dancing, cams) {
  for (const dn of dancers) {
    if (dn.stepT == null) { dn.stepT = t; let hp = dn.home.slice(); if (!dn.perch) for (let k = 0; k < 20 && !inStereo(cams, hp[0], hp[1], 0.1); k++) hp = [hp[0] * 0.9, 1 + (hp[1] - 1) * 0.9]; dn.pos = hp; dn.velXZ = [0, 0]; dn.walkPhase = 0; dn.walkSpeedCur = 0; dn.target = null; dn.pause = 0.5 + 2 * dn.rng(); dn.faceBase = dn.face; dn.prevPos = dn.pos.slice(); dn.travel = 0; dn.start = dn.pos.slice(); }
  }
  for (const dn of dancers) {
    dn.prevPos = dn.pos.slice();
    if (dn.dragged) { dn.velXZ = [0, 0]; dn.target = null; dn.pause = 1; dn.stepT = t; continue; }
    if (!dancing) { dn.velXZ = [0, 0]; dn.walkSpeedCur = 0; dn.stepT = t; continue; }
    let want = [0, 0];
    if (dn.pause > 0) { dn.pause -= dt; if (dn.pause <= 0) dn.target = pickSpot(dn, cams, dancers); }
    else if (dn.target) {
      const dx = dn.target[0] - dn.pos[0], dz = dn.target[1] - dn.pos[1], d = Math.hypot(dx, dz);
      if (d < 0.15) { dn.target = null; dn.pause = 1.5 + 2.5 * dn.rng(); }
      else { const sp = dn.walkSpeed * Math.min(1, d / 0.6); want = [dx / d * sp, dz / d * sp]; }
    }
    // soft personal space (0.95 m)
    for (const o of dancers) { if (o === dn) continue; const dx = dn.pos[0] - o.pos[0], dz = dn.pos[1] - o.pos[1], d = Math.hypot(dx, dz); if (d < 0.95 && d > 1e-6) { const k = (0.95 - d) / 0.95 * 3.0; want[0] += dx / d * k; want[1] += dz / d * k; } }
    // 870: a visitor walking the floor (annex stairs) gets the same soft personal space (1.1 m), so dancers drift aside
    if (dancers.player) { const dx = dn.pos[0] - dancers.player[0], dz = dn.pos[1] - dancers.player[1], d = Math.hypot(dx, dz); if (d < 1.1 && d > 1e-6) { const k = (1.1 - d) / 1.1 * 3.5; want[0] += dx / d * k; want[1] += dz / d * k; } }
    // smooth steering (accel limit 1.4 m/s^2)
    let ax = (want[0] - dn.velXZ[0]) / dt, az = (want[1] - dn.velXZ[1]) / dt; const am = Math.hypot(ax, az), AM = 1.4; if (am > AM) { ax *= AM / am; az *= AM / am; }
    dn.velXZ = [dn.velXZ[0] + ax * dt, dn.velXZ[1] + az * dt];
    let nx = dn.pos[0] + dn.velXZ[0] * dt, nz = dn.pos[1] + dn.velXZ[1] * dt;
    if (dn.perch) { // 871 traction: feet stay on the platform top (clamped inside the inset rect, velocity killed at the edge)
      const c = clampTo(dn.perch, [nx, nz]); if (c[0] !== nx) dn.velXZ[0] = 0; if (c[1] !== nz) dn.velXZ[1] = 0; nx = c[0]; nz = c[1];
    } else if (inFootprint(nx, nz, 0.32)) { // floor dancers never walk into a platform / speaker stack
      dn.velXZ = [0, 0]; nx = dn.pos[0]; nz = dn.pos[1]; if (inFootprint(nx, nz, 0.32)) { const q = exitFootprint(nx, nz, 0.33), dx = q[0] - nx, dz = q[1] - nz, d = Math.hypot(dx, dz) || 1, st = Math.min(d, 0.6 * dt); nx += dx / d * st; nz += dz / d * st; }
      dn.target = pickSpot(dn, cams, dancers); dn.pause = 0.2;
    } else if (!inStereo(cams, nx, nz, 0.05)) { // soft boundary: slide back toward the floor centre and re-plan
      const cx = 0 - dn.pos[0], cz = 1 - dn.pos[1], cd = Math.hypot(cx, cz) || 1; dn.velXZ = [cx / cd * 0.25, cz / cd * 0.25]; nx = dn.pos[0] + dn.velXZ[0] * dt; nz = dn.pos[1] + dn.velXZ[1] * dt; if (dn.target && !inStereo(cams, ...dn.target, 0.1)) dn.target = pickSpot(dn, cams, dancers);
    }
    dn.travel += Math.hypot(nx - dn.pos[0], nz - dn.pos[1]); dn.pos = [nx, nz];
    const sp = Math.hypot(dn.velXZ[0], dn.velXZ[1]); dn.walkSpeedCur = sp; dn.walkPhase += sp * 3.4 * dt;
    // heading: mostly toward the booth / cameras (-z, heading pi), turning up to 70 deg toward the walk direction
    let goal = dn.faceHome;
    if (sp > 0.08) { const wd = Math.atan2(dn.velXZ[0], dn.velXZ[1]); const rel = Math.max(-1.22, Math.min(1.22, wrapA(wd - Math.PI))); goal = wrapA(Math.PI + rel * Math.min(1, sp / 0.4)); }
    dn.face = dn.face + wrapA(goal - dn.face) * Math.min(1, dt * 2.5);
    dn.stepT = t;
  }
  if (dancing) separate(dancers, cams);
}
function separate(dancers, cams) {
  for (let it = 0; it < 2; it++) for (let i = 0; i < dancers.length; i++) for (let j = i + 1; j < dancers.length; j++) {
    const a = dancers[i], b = dancers[j]; const dx = b.pos[0] - a.pos[0], dz = b.pos[1] - a.pos[1], d = Math.hypot(dx, dz);
    if (d < 0.62 && d > 1e-6) { const k = (0.62 - d) / 2 / d; let pa = [a.pos[0] - dx * k, a.pos[1] - dz * k], pb = [b.pos[0] + dx * k, b.pos[1] + dz * k];
      const ok = (d, p) => !d.dragged && (d.perch ? true : inStereo(cams, p[0], p[1], 0.03) && !inFootprint(p[0], p[1], 0.3)); if (a.perch) pa = clampTo(a.perch, pa); if (b.perch) pb = clampTo(b.perch, pb); if (ok(a, pa)) a.pos = pa; if (ok(b, pb)) b.pos = pb; }
  }
}
export function makeDancer(i, r = rng(i * 977 + 13)) {
  const dn = {
    id: (i * 37 + 5) % 64, // unique 6-bit IDs for i<64 (37 odd -> bijection mod 64)
    home: floorSpot(i, r), pos: [0, 0],
    height: 1.64 + r() * 0.12, /* chest pin at height - 0.34 = 1.30..1.42 m */ phase: r() * Math.PI * 2, style: Math.floor(r() * 4),
    hat: false, wander: 0.3 + r() * 0.6, spin: r() < 0.12, jumpy: r(),
    clockOff: Math.floor(r() * 1000), clockPhase: r() / 60, // pins boot at different times
    face: Math.PI + (r() - 0.5) * 1.4, dragged: false, walkSpeed: 0.4 + r() * 0.32, rng: rng(i * 7919 + 101), velXZ: [0, 0], walkSpeedCur: 0, walkPhase: 0, heading: 0, jumpZ: 0, waveColor: null, palette: Math.floor(r() * 6),
  };
  // 871: some dancers stand on speaker stacks / the raised stage / the back risers
  dn.perch = perchFor(i); dn.surfY = dn.perch ? dn.perch.y : 0;
  if (dn.perch) { dn.home = [(dn.perch.x0 + dn.perch.x1) / 2, (dn.perch.z0 + dn.perch.z1) / 2]; dn.walkSpeed *= 0.45; }
  else if (inFootprint(dn.home[0], dn.home[1], 0.5)) { let best = null, bd = 1e9; // nearest free floor spot (grid search, deterministic)
    for (let x = FLOOR.x0 + 0.3; x <= FLOOR.x1 - 0.3; x += 0.25) for (let z = FLOOR.z0 + 0.3; z <= FLOOR.z1 - 0.3; z += 0.25) { if (inFootprint(x, z, 0.5)) continue; const d = Math.hypot(x - dn.home[0], z - dn.home[1]) + (dn.taken ? 0 : 0); if (d < bd) { bd = d; best = [x, z]; } }
    if (best) dn.home = best; }
  dn.faceHome = dn.face; return dn;
}

// Kinematic state at absolute time t (seconds). beat: {phase in [0,1), energy}.
export function dancerState(dn, t, beat, dancing) {
  const e = dancing ? beat.energy : 0;
  if (dn.stepT != null) {
    // stepped floor walker: pure read-only linear interpolation inside the <= 1/15 s shutter window
    if (!dn.dragged) { const dt = t - dn.stepT; dn.posAt = [dn.pos[0] + dn.velXZ[0] * dt, dn.pos[1] + dn.velXZ[1] * dt]; } else dn.posAt = dn.pos;
  } else if (!dn.dragged) {
    const w = dancing ? dn.wander : 0;
    const sp = dn.speed || 1;
    dn.pos = [dn.home[0] + w * Math.sin(t * 0.31 * sp + dn.phase) * 0.9, dn.home[1] + w * Math.cos(t * 0.23 * sp + dn.phase * 1.7) * 0.7];
    if (dn.perch) dn.pos = clampTo(dn.perch, dn.pos);
  }
  const bp = beat.phase * Math.PI * 2;
  const bob = dancing ? 0.05 * e * Math.abs(Math.sin(bp)) : 0;
  // jump on some beats (deterministic per dancer and beat index)
  let jump = 0;
  if (dancing && dn.style !== 3) {
    const bi = beat.index;
    const h = ((bi * 2654435761 + dn.clockOff * 97) >>> 0) % 100 / 100;
    if (h < 0.18 + 0.25 * dn.jumpy) jump = 0.32 * e * Math.sin(Math.PI * beat.phase);
  }
  dn.jumpZ = jump;
  // 869: live Neural Dance pose drive (annex) sets turnYaw (spring-damped ±90° body turns) and headOff (posed head)
  const heading = dn.turnYaw != null ? dn.face + dn.turnYaw : dn.spin && dancing ? dn.face + 1.2 * Math.sin(t * 0.9 + dn.phase) + (Math.sin(t * 0.21 + dn.phase) > 0.8 ? t * 3 : 0) : dn.face + (dancing ? 0.45 * Math.sin(t * 0.7 + dn.phase) : 0);
  dn.heading = heading;
  const sway = dancing ? 0.06 * e * Math.sin(bp / 2 + dn.phase) : 0;
  const P = dn.stepT != null ? dn.posAt : dn.pos;
  const sy = dn.surfY || 0; // 871: standing surface (speaker stack / stage / riser top)
  if (dn.headOff) { const ho = dn.headOff, hf = heading + (dn.pinYaw || 0), fwd = [Math.sin(hf), 0, Math.cos(hf)], head = [P[0] + ho[0], ho[1] + sy, P[1] + ho[2]];
    const pin = [head[0] + fwd[0] * 0.11, head[1] + 0.03, head[2] + fwd[2] * 0.11], chest = [P[0] + ho[0] * 0.6, ho[1] - 0.33 + sy, P[1] + ho[2] * 0.6];
    return { base: [P[0], sy, P[1]], pin, head, chest, fwd, heading, sway: 0, bob: 0, jump: dn.liftY || 0 }; }
  const base = [P[0], sy + bob + jump, P[1]];
  const fwd = [Math.sin(heading), 0, Math.cos(heading)];
  const right = [Math.cos(heading), 0, -Math.sin(heading)];
  const pinLocal = [0.0, dn.height - 0.08, 0.13]; // headband clip at the forehead, 13 cm in front of the body axis
  const pin = [base[0] + right[0] * (pinLocal[0] + sway) + fwd[0] * pinLocal[2], base[1] + pinLocal[1], base[2] + right[2] * (pinLocal[0] + sway) + fwd[2] * pinLocal[2]];
  const head = [base[0] + right[0] * sway, base[1] + dn.height - 0.12, base[2] + right[2] * sway];
  const chest = [base[0], base[1] + dn.height - 0.45, base[2]];
  return { base, pin, head, chest, fwd, heading, sway, bob, jump };
}

// Pin colour at absolute time t: pin frames tick at 60 Hz on its own clock.
export function pinRGB(dn, t, waveRGB) {
  if (waveRGB) return waveRGB;
  return RGB[colorAtFrame(dn.id, Math.floor((t + dn.clockPhase) * FPS) + dn.clockOff)];
}

// Sensor simulation for one camera frame captured at true time t (end of exposure).
export function captureFrame(cam, dancers, t, opts) {
  const { exposure, beatAt, dancing, waveAt, subSamples = 10, noisePx = 0.25, rand = Math.random } = opts;
  const blobs = [];
  const states = dancers.map(d => dancerState(d, t, beatAt(t), dancing));
  for (let i = 0; i < dancers.length; i++) {
    const dn = dancers[i];
    let su = 0, sv = 0, n = 0; const rgb = [0, 0, 0]; const streak = [];
    for (let k = 0; k < subSamples; k++) {
      const ts = t - exposure * (k / Math.max(1, subSamples - 1));
      const st = k === 0 ? states[i] : dancerState(dn, ts, beatAt(ts), dancing);
      const p = project(cam, st.pin);
      if (!p || !p.inView) continue;
      // self-occlusion: pin faces along body forward; hidden if facing away
      const toCam = v3.norm(v3.sub(cam.C, st.pin));
      // hat/headband dome: visible from any camera above the pin's horizon; shoulder clip with
      // wide-angle diffuser: visible within ~120 deg of its outward normal (forward-up)
      if (dn.hat ? toCam[1] < 0.05 : v3.dot(toCam, v3.norm([st.fwd[0], 0.9, st.fwd[2]])) < -0.25) continue;
      // inter-dancer occlusion (heads + torsos as spheres), at shutter-close state
      let occ = false;
      for (let j = 0; j < dancers.length && !occ; j++) {
        if (j === i) continue; const o = states[j];
        if (segHitsSphere(cam.C, st.pin, o.head, 0.12) || segHitsSphere(cam.C, st.pin, o.chest, 0.2)) occ = true;
      }
      if (occ) continue;
      const c = pinRGB(dn, ts, waveAt && waveAt(dn, ts));
      su += p.u; sv += p.v; n++; rgb[0] += c[0]; rgb[1] += c[1]; rgb[2] += c[2]; streak.push([p.u, p.v, c]);
    }
    if (n < subSamples * 0.5) continue; // mostly hidden during exposure
    // pixel quantisation of the integrated centroid + read noise
    const u = Math.round((su / n + gauss(rand) * noisePx) * 2) / 2, v = Math.round((sv / n + gauss(rand) * noisePx) * 2) / 2;
    blobs.push({ u, v, rgb: rgb.map(x => x / n), streak });
  }
  // shuffle so downstream cannot rely on order
  for (let i = blobs.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [blobs[i], blobs[j]] = [blobs[j], blobs[i]]; }
  return { blobs, states };
}
function gauss(r) { return Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r()); }

// Code verification: once a track holds an ID, the host knows that ID's colour schedule. It finds the
// schedule phase from the track's recent colours, then checks every new frame against it; 3 wrong colours
// in 8 frames (two blobs swapped in 2D, or a bad hand-off) drops the ID at once instead of after 75 frames.
function observe(tr, c) {
  (tr.obs || (tr.obs = [])).push(c); if (tr.obs.length > 48) tr.obs.shift();
  tr.dec.push(c); const id = tr.dec.id;
  if (id < 0) { tr.vid = -1; return; }
  if (tr.vid !== id) {
    const L = cycleLength(id), ob = tr.obs; let bo = 0, bm = -1;
    for (let o = 0; o < L; o++) { let m = 0; for (let j = 0; j < ob.length; j++) if (ob[j] >= 0 && colorAtFrame(id, o + j) === ob[j]) m++; if (m > bm) { bm = m; bo = o; } }
    tr.vid = id; tr.vnext = bo + ob.length; tr.vbad = []; return;
  }
  const exp = colorAtFrame(id, tr.vnext++);
  if (c >= 0 && c === exp && tr.vbad.length >= 4 && !tr.vbad.some(x => x)) tr.dec.lastGood = tr.dec.frames; // schedule-verified frame counts as confirmation
  if (c >= 0) { tr.vbad.push(c !== exp ? 1 : 0); if (tr.vbad.length > 8) tr.vbad.shift(); }
  if (tr.vbad.reduce((a, b) => a + b, 0) >= 3) { tr.dec = new TransitionDecoder(); tr.vid = -1; tr.vbad = []; tr.obs = []; tr.inherited = false; }
}
// Per-camera 2D blob tracker + per-track transition decoder.
export class CamTracker {
  constructor() { this.tracks = []; this.nextKey = 1; this.frame = 0; this.lost = []; this.handoffs = 0; }
  update(blobs, stamp) {
    this.frame++;
    const used = new Set();
    // greedy nearest-neighbour association with constant-velocity prediction
    const pairs = [];
    for (const tr of this.tracks) {
      const pu = tr.u + tr.du, pv = tr.v + tr.dv;
      blobs.forEach((b, bi) => { const d = Math.hypot(b.u - pu, b.v - pv); if (d < 60) pairs.push([d, tr, bi]); });
    }
    pairs.sort((a, b) => a[0] - b[0]);
    const matched = new Set();
    for (const [, tr, bi] of pairs) {
      if (matched.has(tr) || used.has(bi)) continue;
      matched.add(tr); used.add(bi); const b = blobs[bi];
      tr.du = b.u - tr.u; tr.dv = b.v - tr.v; tr.u = b.u; tr.v = b.v; tr.miss = 0; tr.rgb = b.rgb; tr.streak = b.streak;
      tr.hist.push([stamp, b.u, b.v]); if (tr.hist.length > 6) tr.hist.shift();
      observe(tr, classify(b.rgb)); tr.age++;
    }
    for (const tr of this.tracks) if (!matched.has(tr)) { tr.miss++; observe(tr, -1); tr.streak = null; }
    // re-acquisition memory: a locked track that disappears behind a body leaves its ID + motion here
    for (const tr of this.tracks) if (tr.miss >= 5 && tr.dec.id >= 0) this.lost.push({ id: tr.dec.id, u: tr.u, v: tr.v, du: tr.du, dv: tr.dv, frame: this.frame - tr.miss, vnext: tr.vid === tr.dec.id ? tr.vnext : null, vframe: this.frame });
    this.tracks = this.tracks.filter(tr => tr.miss < 5);
    this.lost = this.lost.filter(l => this.frame - l.frame <= 30);
    blobs.forEach((b, bi) => {
      if (used.has(bi)) return;
      const tr = { key: this.nextKey++, u: b.u, v: b.v, du: 0, dv: 0, miss: 0, rgb: b.rgb, streak: b.streak, hist: [[stamp, b.u, b.v]], dec: new TransitionDecoder(), age: 1, born: stamp };
      observe(tr, classify(b.rgb)); this.tracks.push(tr);
      // ID hand-off: a new blob emerging where a recently-occluded locked pin is predicted inherits
      // that ID provisionally; the decoder keeps reading and overrides it if the code disagrees.
      const live = new Set(this.tracks.filter(o => o !== tr && o.dec.id >= 0).map(o => o.dec.id));
      let best = null, bd = 1e9, nc = 0;
      for (const l of this.lost) { if (live.has(l.id)) continue; const df = this.frame - l.frame; const d = Math.hypot(b.u - (l.u + l.du * df * 0.5), b.v - (l.v + l.dv * df * 0.5)); const gate = 24 + 3 * df; if (d < gate) { nc++; if (d < bd) { bd = d; best = l; } } }
      const crowded = this.tracks.some(o => o !== tr && !o.miss && Math.hypot(o.u - b.u, o.v - b.v) < 40);
      if (best && nc === 1 && best.vnext != null) { tr.dec.id = best.id; tr.dec.lastGood = tr.dec.frames; tr.inherited = true; if (best.vnext != null) { tr.vid = best.id; tr.vnext = best.vnext + this.frame - best.vframe; tr.vbad = []; } this.lost.splice(this.lost.indexOf(best), 1); this.handoffs++; }
    });
    // a track keeps its ID only while decodes keep confirming within ~2 packets
    for (const tr of this.tracks) if (tr.dec.id >= 0 && tr.dec.frames - tr.dec.lastGood > 75) { tr.dec.id = -1; tr.dec.searchFrom = tr.dec.frames; }
  }
  locked() {
    const m = new Map();
    for (const tr of this.tracks) if (tr.dec.id >= 0 && tr.miss === 0 && !(tr.inherited && tr.age < 40 && (!tr.vbad || tr.vbad.length < 6 || tr.vbad.some(x => x)))) { // hand-offs serve only after 6 schedule-verified frames
      const o = m.get(tr.dec.id); if (!o || tr.age > o.age) m.set(tr.dec.id, tr);
    }
    return m;
  }
}

// Interpolate (or extrapolate one step) a track's (u,v) at time t from its stamped history.
export function uvAt(hist, t) {
  const n = hist.length; if (!n) return null; if (n === 1) return [hist[0][1], hist[0][2]];
  let i = n - 2;
  for (let k = 0; k < n - 1; k++) if (hist[k + 1][0] >= t) { i = k; break; }
  const [t0, u0, v0] = hist[i], [t1, u1, v1] = hist[i + 1];
  const a = t1 === t0 ? 0 : Math.max(-1, Math.min(2, (t - t0) / (t1 - t0)));
  return [u0 + a * (u1 - u0), v0 + a * (v1 - v0)];
}

// Stereo: pair strictly by decoded ID, align timestamps, triangulate.
// Pairs whose rays miss by more than maxMiss are rejected as outliers (blob swaps).
export function stereo(camA, camB, trkA, trkB, { interp = true, maxMiss = 0.08 } = {}) {
  const A = trkA.locked(), B = trkB.locked(); const out = []; out.rejected = 0;
  for (const [id, ta] of A) {
    const tb = B.get(id); if (!tb) continue;
    const tStar = ta.hist[ta.hist.length - 1][0];
    const uvA = [ta.u, ta.v];
    const uvB = interp ? uvAt(tb.hist, tStar) : [tb.u, tb.v];
    const r = triangulate(camA.C, backProject(camA, uvA[0], uvA[1]), camB.C, backProject(camB, uvB[0], uvB[1]));
    if (!r) continue;
    if (r.miss > maxMiss) { out.rejected++; continue; }
    out.push({ id, P: r.P, miss: r.miss, t: tStar, uvA, uvB, trA: ta, trB: tb });
  }
  return out;
}
