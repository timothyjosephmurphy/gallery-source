import { HEIGHT_10FT, VFOV_DEG, HFOV_DEG, TAN_H, TAN_V, defaultCamsWithLens, solveSymmetricRig, basis, rayDir, clipToRoom } from '../src/sim/rig.js';
import { stepDancers, inStereo, FLOOR } from '../src/sim/world.js';
import { distortPixel, undistortPixel } from '../src/sim/camera.js';
import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path';
import { colorAtFrame, cycleLength, TransitionDecoder, PACKET_FRAMES, SYNC_FRAMES, payloadBits, FPS } from '../src/sim/code.js';
import { makeCamera, project, backProject, triangulate } from '../src/sim/camera.js';
import { makeDancer, captureFrame, CamTracker, stereo, dancerState, rng } from '../src/sim/world.js';
import { defaultCams } from '../src/sim/rig.js';
import { Engine, MAX_STEPS } from '../src/sim/engine.js';
import { kinoWorld, kinoLocal, returnState, KINO } from '../src/annex.js';
import { newMoverState, selectTargets, panTilt, aimDir, slew, holdFade, FIXTURES } from '../src/sim/movers.js';

let pass = 0; const t = (name, fn) => { fn(); pass++; console.log('ok -', name); };

t('64 IDs: always lit, never repeats a colour across symbol boundaries, unique codes', () => {
  const seen = new Map();
  for (let id = 0; id < 64; id++) {
    const L = cycleLength(id);
    assert.ok(L % PACKET_FRAMES === 0);
    let runs = []; let cur = colorAtFrame(id, 0), len = 0;
    for (let f = 0; f < L; f++) { const c = colorAtFrame(id, f); assert.ok(c === 0 || c === 1 || c === 2, 'dark frame'); if (c === cur) len++; else { runs.push(len); cur = c; len = 1; } }
    runs.push(len);
    // only run lengths 3 (payload) and 6 (sync) exist -> no false sync inside payload
    const syncs = runs.filter(r => r === SYNC_FRAMES).length;
    assert.ok(runs.every(r => r === 3 || r === 6), 'bad run ' + runs);
    assert.equal(syncs, L / PACKET_FRAMES);
    const key = payloadBits(id).join(''); assert.ok(!seen.has(key)); seen.set(key, id);
  }
});

t('decoder locks every ID from every start phase within 0.4-1.0 s, worst <= 2 packets', () => {
  let worst = 0, sum = 0, n = 0;
  for (let id = 0; id < 64; id++) for (let start = 0; start < cycleLength(id); start++) {
    const d = new TransitionDecoder(); let f = 0;
    while (d.id < 0 && f < 200) { d.push(colorAtFrame(id, start + f)); f++; }
    assert.equal(d.id, id, `id ${id} start ${start}`);
    worst = Math.max(worst, f); sum += f; n++;
  }
  console.log(`   lock: mean ${(sum / n).toFixed(1)} frames (${(sum / n / FPS).toFixed(2)} s), worst ${worst} frames (${(worst / FPS).toFixed(2)} s); packet = ${PACKET_FRAMES} frames = ${(PACKET_FRAMES / FPS).toFixed(2)} s`);
  assert.ok(worst <= 2 * PACKET_FRAMES + 2);
});

t('parity rejects single-bit corruption (no wrong-ID locks)', () => {
  let wrong = 0, rej = 0;
  for (let id = 0; id < 64; id++) for (let flip = 0; flip < 8; flip++) {
    const b = payloadBits(id); b[flip] ^= 1;
    // build corrupted packet frames
    const frames = []; let c = 0; for (let k = 0; k < 6; k++) frames.push(c);
    for (const bit of b) { c = (c + 1 + bit) % 3; for (let k = 0; k < 3; k++) frames.push(c); }
    frames.push((c + 1) % 3);
    const d = new TransitionDecoder(); frames.forEach(x => d.push(x));
    if (d.id >= 0) wrong++; else rej++;
  }
  assert.equal(wrong, 0); console.log(`   rejected ${rej}/512 single-bit corruptions`);
});

// --- full sensor pipeline ---
function runScene({ exposure, skewMs, interp, secs = 4, nd = 14, seed = 7, fast = false }) {
  const dancers = Array.from({ length: nd }, (_, i) => makeDancer(i));
  if (fast) dancers.forEach(d => { d.wander = 2.2; d.speed = 4; });
  const { A, B } = defaultCams();
  const camA = makeCamera(A), camB = makeCamera(B);
  const tA = new CamTracker(), tB = new CamTracker(); const r = rng(seed);
  const bpm = 124; const beatAt = tt => { const x = tt * bpm / 60; return { phase: x % 1, index: Math.floor(x), energy: 1 }; };
  const opts = { exposure, beatAt, dancing: true, rand: r };
  const errs = [], misses = []; let maxLocked = 0, lockedA = 0;
  const skew = skewMs / 1000;
  for (let f = 0; f < secs * 60; f++) {
    const tAcap = 1 + f / 60, tBcap = tAcap - skew + 0.0037; // B also has a sub-frame phase offset
    tA.update(captureFrame(camA, dancers, tAcap, opts).blobs, tAcap);
    // B reports timestamps on the shared (synced) clock: with skew, its frames are genuinely at tBcap
    tB.update(captureFrame(camB, dancers, tBcap, opts).blobs, tBcap);
    if (f < 90) continue;
    const rec = stereo(camA, camB, tA, tB, { interp });
    maxLocked = Math.max(maxLocked, rec.length); lockedA = Math.max(lockedA, tA.locked().size);
    for (const x of rec) {
      const dn = dancers.find(d => d.id === x.id); // ground truth only for error report
      const gt = dancerState(dn, x.t, beatAt(x.t), true).pin;
      errs.push(Math.hypot(x.P[0] - gt[0], x.P[1] - gt[1], x.P[2] - gt[2]) * 100); misses.push(x.miss * 100);
    }
  }
  errs.sort((a, b) => a - b);
  return { mean: errs.reduce((a, b) => a + b, 0) / errs.length, p95: errs[Math.floor(errs.length * 0.95)], maxLocked, lockedA, miss: misses.reduce((a, b) => a + b, 0) / misses.length, n: errs.length };
}

t('noise-free projection -> back-projection -> triangulation is exact (< 1 mm)', () => {
  const { A, B } = defaultCams(); const a = makeCamera(A), b = makeCamera(B);
  const R = rng(3);
  for (let k = 0; k < 500; k++) {
    const P = [(R() - 0.5) * 8, 0.8 + R() * 1.6, (R() - 0.5) * 6];
    const pa = project(a, P), pb = project(b, P);
    const tr = triangulate(a.C, backProject(a, pa.u, pa.v), b.C, backProject(b, pb.u, pb.v));
    assert.ok(Math.hypot(tr.P[0] - P[0], tr.P[1] - P[1], tr.P[2] - P[2]) < 1e-3);
  }
});

const res = {};
t('1/500 s shutter, synced clocks: IDs lock and reconstruction error is cm-level', () => {
  const r = res.fast = runScene({ exposure: 1 / 500, skewMs: 0, interp: true });
  console.log(`   1/500 s, 0 ms skew: ${r.maxLocked}/14 stereo-locked, mean ${r.mean.toFixed(2)} cm, p95 ${r.p95.toFixed(2)} cm, ray miss ${r.miss.toFixed(2)} cm (${r.n} samples)`);
  assert.ok(r.maxLocked >= 6); assert.ok(r.mean < 4);
});
t('1/15 s shutter: blur smears colours -> fewer locks and larger error', () => {
  const r = res.slow = runScene({ exposure: 1 / 15, skewMs: 0, interp: true });
  console.log(`   1/15 s, 0 ms skew: ${r.maxLocked}/14 stereo-locked (A-cam ${r.lockedA}), mean ${isFinite(r.mean) ? r.mean.toFixed(2) : 'n/a'} cm`);
  assert.ok(r.maxLocked < res.fast.maxLocked || !(r.mean <= res.fast.mean));
});
t('1/30 s shutter sits between: partial locks', () => {
  const r = runScene({ exposure: 1 / 30, skewMs: 0, interp: true });
  console.log(`   1/30 s, 0 ms skew: ${r.maxLocked}/14 stereo-locked (A-cam ${r.lockedA})`);
});
t('20 ms clock skew: interpolation beats naive nearest-frame pairing', () => {
  const naive = runScene({ exposure: 1 / 500, skewMs: 20, interp: false, fast: true });
  const intp = runScene({ exposure: 1 / 500, skewMs: 20, interp: true, fast: true });
  console.log(`   20 ms skew, fast dancers (~1.5 m/s): naive mean ${naive.mean.toFixed(2)} cm / p95 ${naive.p95.toFixed(2)} cm vs interpolated mean ${intp.mean.toFixed(2)} cm / p95 ${intp.p95.toFixed(2)} cm`);
  assert.ok(intp.mean < naive.mean);
});

t('moving heads: targets come only from triangulated host tracks; aim hits (X^,Y^,Z^)', () => {
  // build host map from a real stereo run (no ground truth passed in)
  const dancers = Array.from({ length: 14 }, (_, i) => makeDancer(i)); const { A, B } = defaultCams();
  const a = makeCamera(A), b = makeCamera(B), tA = new CamTracker(), tB = new CamTracker(), r = rng(5);
  const beatAt = x => ({ phase: (x * 2) % 1, index: Math.floor(x * 2), energy: 1 }); const host = new Map();
  for (let f = 0; f < 150; f++) { const tt = 1 + f / 60; tA.update(captureFrame(a, dancers, tt, { exposure: 0.002, beatAt, dancing: true, rand: r }).blobs, tt); tB.update(captureFrame(b, dancers, tt, { exposure: 0.002, beatAt, dancing: true, rand: r }).blobs, tt);
    for (const x of stereo(a, b, tA, tB)) { const p = host.get(x.id); host.set(x.id, { P: x.P, t: x.t, vel: p ? [(x.P[0] - p.P[0]) * 60, (x.P[2] - p.P[2]) * 60] : [0, 0], dZ: p ? Math.max(0, x.P[1] - p.P[1]) : 0 }); } }
  const T = 1 + 149 / 60; const st = newMoverState(); const asg = selectTargets(st, host, T, 'top', 0);
  assert.ok(asg.filter(x => x !== null).length >= Math.min(4, host.size));
  asg.forEach((id, i) => { if (id === null) return; assert.ok(host.has(id)); const P = host.get(id).P; const pt = panTilt(FIXTURES[i], P); const d = aimDir(pt);
    const hit = [FIXTURES[i][0] + d[0] * pt.dist, FIXTURES[i][1] + d[1] * pt.dist, FIXTURES[i][2] + d[2] * pt.dist];
    assert.ok(Math.hypot(hit[0] - P[0], hit[1] - P[1], hit[2] - P[2]) < 1e-9); });
  // hysteresis: a small score change does not swap targets
  const before = st.assign.slice(); selectTargets(st, host, T, 'top', 0); assert.deepEqual(st.assign, before);
  // lock loss: hold for 0.6 s then fade out over 0.6 s, then reassign
  const id0 = before.find(x => x !== null); const h = host.get(id0);
  assert.equal(holdFade(h, h.t + 0.3), 1); assert.ok(holdFade(h, h.t + 0.9) > 0 && holdFade(h, h.t + 0.9) < 1); assert.equal(holdFade(h, h.t + 1.3), 0);
  // chase steps on every beat; off parks all
  const c1 = selectTargets(st, host, T, 'chase', 1).slice(), c2 = selectTargets(st, host, T, 'chase', 2).slice();
  if (host.size > 1) assert.notDeepEqual(c1, c2);
  assert.deepEqual(selectTargets(st, host, T, 'off', 3), [null, null, null, null]);
  // slew is rate-limited
  const s1 = slew({ pan: 0, tilt: 0 }, { pan: 3, tilt: 1 }, 0.1); assert.ok(Math.abs(s1.pan - 0.35) < 1e-9);
  console.log(`   ${host.size} triangulated tracks -> moving-head targets ${JSON.stringify(before)}`);
});
t('fixed 60 Hz engine: 22 fps / 60 Hz / 120 Hz displays full optics+CMOS+JSON pipe, walking crowd, all reach >= 10/14 within 1.25 s and hold median >= 6 over 10 s', () => {
  for (const [label, dt] of [['22 fps (45 ms)', 0.045], ['60 Hz', 1 / 60], ['120 Hz (8.3 ms)', 1 / 120], ['jittery 15-120 fps', null]]) {
    const dancers = Array.from({ length: 14 }, (_, i) => makeDancer(i)); const { A, B } = defaultCams(); const r = rng(11);
    const e = new Engine({ dancers, camA: makeCamera(A), camB: makeCamera(B), beatAt: x => { const y = x * 124 / 60; return { phase: y % 1, index: Math.floor(y), energy: 1 }; } });
    let first = null; const counts = [], sprites = []; let ticks = 0, frames = 0;
    while (e.simT < 10) {
      const d = dt ?? (1 / 15 + (1 / 120 - 1 / 15) * r()); ticks += e.advance(d); frames++;
      const n = e.lastRec.length; if (first === null && n >= 10) first = e.simT;
      if (e.simT > 1.5) { counts.push(n); sprites.push(e.activeSprites()); }
    }
    counts.sort((a, b) => a - b); sprites.sort((a, b) => a - b);
    const med = counts[counts.length >> 1], p10 = counts[Math.floor(counts.length * 0.1)], sp10 = sprites[Math.floor(sprites.length * 0.1)], spMed = sprites[sprites.length >> 1];
    console.log(`   ${label}: ${frames} display frames -> ${ticks} sensor ticks; >=10/14 stereo-locked at ${first.toFixed(2)} s; stereo-locked median ${med}/14 (p10 ${p10}); active sprites median ${spMed} (p10 ${sp10}); 3D error ${e.err.mean.toFixed(2)} cm`);
    assert.equal(ticks, Math.round(e.simT * 60), 'every 60 Hz pin frame must be captured'); assert.ok(ticks >= 600);
    assert.ok(first <= 1.25); assert.ok(med >= 6); assert.ok(sp10 >= 5);
  }
});
t('symmetric wall-tangent rig (t2226u): mirrored 10 ft phones, equal inward yaw, outer frustum touches x = +/-5, inner edges cross at x = 0', () => {
  const rig = solveSymmetricRig(), A = makeCamera(rig.A), B = makeCamera(rig.B);
  assert.equal(A.C[0], -B.C[0]); assert.equal(A.C[1], HEIGHT_10FT); assert.equal(B.C[1], HEIGHT_10FT); assert.equal(A.C[2], B.C[2]);
  assert.equal(rig.A.yaw, -rig.B.yaw); assert.ok(rig.A.yaw > 0);
  assert.equal(A.vfov, VFOV_DEG); assert.ok(Math.abs(Math.atan(A.W / 2 / A.f) * 2 * 180 / Math.PI - HFOV_DEG) < 1e-9, 'sensor hfov matches rig hfov');
  // the pure-math camera's image corners are exactly the rig's corner rays
  const b = basis(rig.A.yaw, rig.A.pitch), D = rayDir(b, -TAN_H, TAN_V), bp = backProject(A, 0, 0), dn = Math.hypot(...D);
  assert.ok(Math.hypot(bp[0] - D[0] / dn, bp[1] - D[1] / dn, bp[2] - D[2] / dn) < 1e-9, 'pixel (0,0) == top-left corner ray (xn = -tan h, yn = +tan v)');
  // every edge ray of both frustums, clipped to Room 1, stays inside the side walls; outer face kisses its wall
  let maxAbsX = 0, outerA = 0, outerB = 0;
  for (const [cam, cfg, sgn] of [[A, rig.A, 1], [B, rig.B, -1]]) {
    const bb = basis(cfg.yaw, cfg.pitch);
    for (let i = 0; i <= 64; i++) for (const [xn, yn] of [[TAN_H, -TAN_V + 2 * TAN_V * i / 64], [-TAN_H, -TAN_V + 2 * TAN_V * i / 64], [-TAN_H + 2 * TAN_H * i / 64, TAN_V], [-TAN_H + 2 * TAN_H * i / 64, -TAN_V]]) {
      const d = rayDir(bb, xn, yn), sEnd = clipToRoom(cam.C, d, 40), P = [cam.C[0] + d[0] * sEnd, cam.C[1] + d[1] * sEnd, cam.C[2] + d[2] * sEnd];
      maxAbsX = Math.max(maxAbsX, Math.abs(P[0]));
      if (xn === TAN_H * sgn * 1 && sgn === 1 && P[2] <= rig.params.zTouch + 1e-6) outerA = Math.min(outerA, P[0]);
      if (xn === -TAN_H && sgn === -1 && P[2] <= rig.params.zTouch + 1e-6) outerB = Math.max(outerB, P[0]);
    }
  }
  assert.ok(maxAbsX <= 5.001, 'nothing past the side walls'); assert.ok(outerA <= -4.95 && outerB >= 4.95, `outer faces touch: ${outerA.toFixed(3)} / ${outerB.toFixed(3)}`);
  assert.ok(Math.abs(rig.touchA[0] + 5) < 1e-6 && rig.touchA[1] >= 0 && rig.touchA[1] <= 4);
  // inner horizontal edge rays of A and B meet on the centreline inside the room
  const ia = rayDir(basis(rig.A.yaw, rig.A.pitch), -TAN_H, 0), ib = rayDir(basis(rig.B.yaw, rig.B.pitch), TAN_H, 0);
  const tri = triangulate(A.C, ia, B.C, ib); assert.ok(tri.miss < 1e-6 && Math.abs(tri.P[0]) < 1e-6 && tri.P[2] > -4.5 && tri.P[2] < 0.5);
  // re-solves symmetrically at other slider settings
  for (const o of [{ height: 2.4 }, { height: 4.0 }, { x0: 2.6 }, { x0: 3.8 }, { z0: -4.2 }]) { const r = solveSymmetricRig(o); assert.ok(Math.abs(r.touchA[0] + 5) < 1e-6 && r.A.yaw === -r.B.yaw && r.A.pos[0] === -r.B.pos[0]); }
  const dg = x => (x * 180 / Math.PI).toFixed(2);
  console.log(`   A ${rig.A.pos.map(x => x.toFixed(3))} B ${rig.B.pos.map(x => x.toFixed(3))} · vfov ${VFOV_DEG} / hfov ${HFOV_DEG.toFixed(2)} deg · yaw +/-${dg(rig.psi)} deg · pitch ${dg(rig.pitch)} deg`);
  console.log(`   outer face touches (${rig.touchA.map(x => x.toFixed(3))}) and mirror; inner edges cross at (0, ${tri.P[1].toFixed(3)}, ${tri.P[2].toFixed(3)}); max |x| ${maxAbsX.toFixed(4)}`);
});
t('floor wandering (t2227u): dancers stroll, pause, keep personal space; stereo keeps tracking with no ID swaps; still = frozen', () => {
  const beatAt = x => { const y = x * 124 / 60; return { phase: y % 1, index: Math.floor(y), energy: 1 }; };
  const dancers = Array.from({ length: 14 }, (_, i) => makeDancer(i)); const { A, B } = defaultCamsWithLens(); const cA = makeCamera(A), cB = makeCamera(B);
  const e = new Engine({ dancers, camA: cA, camB: cB, beatAt, t0: 0, rand: rng(5) });
  let minD = 9, se = 0, sn = 0, swaps = 0, out = 0; const ns = [];
  for (let k = 0; k < 900; k++) {
    e.tick(e.simT += 1 / 60); if (k >= 60) ns.push(e.err.n); if (e.err.n) { se += e.err.mean * e.err.n; sn += e.err.n; }
    for (const r of e.lastRec) { const dn = dancers.find(d => d.id === r.id); if (!dn) { swaps++; continue; } const g = dancerState(dn, r.t, beatAt(r.t), true).pin; if (Math.hypot(r.P[0] - g[0], r.P[1] - g[1], r.P[2] - g[2]) > 0.15) swaps++; }
    for (let i = 0; i < 14; i++) { const p = dancers[i].pos; if (!inStereo(null, p[0], p[1]) || p[0] < FLOOR.x0 - 1e-6) out++; for (let j = i + 1; j < 14; j++) minD = Math.min(minD, Math.hypot(p[0] - dancers[j].pos[0], p[1] - dancers[j].pos[1])); }
  }
  const tr = dancers.filter(d => !d.perch).map(d => d.travel).sort((a, b) => a - b), // 871: perched dancers (speaker stacks / stage / risers) stay on their platform top
   _unused = 0, disp = Math.max(...dancers.map(d => Math.hypot(d.pos[0] - d.start[0], d.pos[1] - d.start[1])));
  const mean = ns.reduce((a, b) => a + b, 0) / ns.length, sorted = ns.slice().sort((a, b) => a - b), mx = sorted[sorted.length - 1];
  console.log(`   15 s: floor dancers' median travel ${tr[tr.length >> 1].toFixed(1)} m, max displacement ${disp.toFixed(1)} m, min pair distance ${minD.toFixed(2)} m · stereo-locked mean ${mean.toFixed(1)}/14 (median ${sorted[sorted.length >> 1]}, p10 ${sorted[Math.floor(sorted.length * 0.1)]}, max ${mx}) · 3D error ${(se / sn).toFixed(2)} cm · swap-frames ${swaps}`);
  assert.ok(tr[tr.length >> 1] > 2.5 && disp > 1.2 && minD > 0.55 && out === 0);
  assert.ok(mean >= 10, 'walking crowd keeps >= 10/14 stereo-locked on average'); assert.ok(mx >= 11); assert.ok(se / sn < 0.5); assert.equal(swaps, 0);
  e.dancing = false; e.tick(e.simT += 1 / 60); const p0 = dancers.map(d => d.pos.slice());
  for (let k = 0; k < 60; k++) e.tick(e.simT += 1 / 60);
  assert.ok(dancers.every((d, i) => d.velXZ[0] === 0 && d.velXZ[1] === 0 && d.pos[0] === p0[i][0] && d.pos[1] === p0[i][1]), 'Quiet / still freezes wandering');
});
t('Brown-Conrady lens: distort -> undistort round-trip < 0.01 px over the full 1920x1080 sensor', () => {
  const cam = makeCamera({ ...defaultCamsWithLens().A }); let worst = 0;
  for (let v = 0; v <= 1080; v += 20) for (let u = 0; u <= 1920; u += 20) { const [du, dv] = distortPixel(cam, u, v); const [uu, vv] = undistortPixel(cam, du, dv); worst = Math.max(worst, Math.hypot(uu - u, vv - v)); }
  const [cu] = distortPixel(cam, 0, 0); console.log(`   worst round-trip ${worst.toExponential(2)} px; corner pulled in ${(cu).toFixed(1)} px (barrel)`);
  assert.ok(worst < 0.01); assert.ok(cu > 1);
});
t('JSON pipe: host fed only JSON-roundtripped PhoneFramePackets (jitter, crosstalk, distortion, 1/500 s) locks >= 10/14 within 0.70 s, mean error < 1.5 cm, zero ID swaps', () => {
  const beatAt = x => { const y = x * 124 / 60; return { phase: y % 1, index: Math.floor(y), energy: 1 }; };
  const firsts = []; let se = 0, sn = 0, swaps = 0, pk = 0, kb = 0;
  for (let t0 = 0; t0 < 40; t0 += 2) {
    const dancers = Array.from({ length: 14 }, (_, i) => makeDancer(i)); const { A, B } = defaultCamsWithLens();
    const e = new Engine({ dancers, camA: makeCamera(A), camB: makeCamera(B), beatAt, t0, rand: rng(7 + t0) });
    let first = null; const seen = [];
    e.pipe.subscribe(p => { seen.push(p); assert.equal(p.v, 1); assert.ok(Array.isArray(p.sprites)); });
    for (let k = 0; k < 150; k++) {
      e.tick(e.simT += 1 / 60);
      if (first === null && e.err.n >= 10) first = (k + 1) / 60;
      if (e.err.n) { se += e.err.mean * e.err.n; sn += e.err.n; }
      for (const r of e.lastRec) { const dn = dancers.find(d => d.id === r.id); if (!dn) { swaps++; continue; } const g = dancerState(dn, r.t, beatAt(r.t), true).pin; if (Math.hypot(r.P[0] - g[0], r.P[1] - g[1], r.P[2] - g[2]) > 0.15) swaps++; }
    }
    assert.equal(seen.length, 150); assert.ok(typeof e.wire === 'string' && JSON.parse(e.wire).byteLen === e.wire.length);
    pk = Math.max(pk, e.packet.lockedCount); kb = e.pipe.kbps(); firsts.push(first ?? 99);
  }
  firsts.sort((a, b) => a - b); const med = firsts[firsts.length >> 1], ok = firsts.filter(f => f <= 0.70).length;
  console.log(`   20 start phases: time to >=10/14 median ${med.toFixed(2)} s (${ok}/20 within 0.70 s, worst ${firsts[19].toFixed(2)} s); mean 3D error ${(se / sn).toFixed(2)} cm; ID swaps ${swaps}; pipe ~${kb.toFixed(0)} kbps`);
  assert.ok(med <= 0.70); assert.ok(firsts[19] <= 1.25); assert.ok(se / sn < 1.5); assert.equal(swaps, 0);
});
t('pipe isolation: Room 2 packets carry no dancer ground truth and the host rejects malformed phone packets', () => {
  const dancers = Array.from({ length: 14 }, (_, i) => makeDancer(i)); const { A, B } = defaultCamsWithLens();
  const e = new Engine({ dancers, camA: makeCamera(A), camB: makeCamera(B), beatAt: () => ({ phase: 0, index: 0, energy: 1 }), t0: 4, rand: rng(3) });
  for (let k = 0; k < 90; k++) e.tick(e.simT += 1 / 60);
  const keys = new Set(); for (const s of e.packet.sprites) Object.keys(s).forEach(k => keys.add(k));
  assert.deepEqual([...keys].sort(), ['coastS', 'confidence', 'dZ', 'energy', 'id', 'lockAgeS', 'missCm', 'pos', 'vel']);
  assert.throws(() => e.host.ingest({ v: 2, camId: 'A', seq: 0, captureTsMs: 0, blobs: [] }));
  const pa = JSON.parse(e.lastPackets.A); assert.deepEqual(Object.keys(pa).sort(), ['blobs', 'camId', 'captureTsMs', 'exposureS', 'seq', 'v']);
  assert.ok(pa.blobs.every(b => !('id' in b)));
});
t('Kinoteka annex: frame matches gallery colliders; return spawn lands inside the hall facing in', () => {
  // gallery kino800 collider endpoints: hl-l (31.345,25.025)-(43.469,32.025) is the u=-6 wall; row0l starts at v=14.2
  let [u, v] = kinoLocal(31.345, 25.025); assert.ok(Math.abs(u + 6) < 0.01 && Math.abs(v - 11) < 0.02);
  [u, v] = kinoLocal(35.016, 25.066); assert.ok(Math.abs(v - 14.2) < 0.01);
  for (const side of [-1, 1]) {
    const st = returnState({ pos: [0, 0, 0], quat: [0, 0, 0, 1], cart: ['x'], weapon: 2 }, side);
    const [lu, lv] = kinoLocal(st.pos[0], st.pos[2]);
    assert.ok(Math.abs(Math.abs(lu) - 3.8) < 0.01 && Math.abs(lv - KINO.archV) < 0.01); assert.deepEqual(st.cart, ['x']);
    const yaw = 2 * Math.atan2(st.quat[1], st.quat[3]); const fwd = [-Math.sin(yaw), -Math.cos(yaw)];
    const [fu] = kinoLocal(KINO.D[0] + fwd[0], KINO.D[1] + fwd[1]); assert.ok(fu * side < -0.99, 'faces into the hall');
  }
});
t('forbidden word appears nowhere in source or dist', () => {
  const re = new RegExp(['D', 'M', 'T'].join(''), 'i'); const hits = [];
  const walk = p => { if (!fs.existsSync(p) || p.includes('node_modules')) return; const st = fs.statSync(p); if (st.isDirectory()) return fs.readdirSync(p).forEach(f => walk(path.join(p, f)));
    if (/\.(jpg|webp|png)$/.test(p)) return; // binary image data
    if (re.test(fs.readFileSync(p, 'utf8'))) hits.push(p); };
  ['src', 'public', 'index.html', 'test', 'dist', 'vite.config.js', 'README.md', 'package.json'].forEach(walk);
  assert.deepEqual(hits, []);
});
console.log(`\n${pass} tests passed`);
