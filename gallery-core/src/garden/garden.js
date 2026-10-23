// #251 garden: Roman courtyard props. Original procedural design (TJ Murphy gallery), no external assets.
// Clipped boxwood, cypress, laurel in terracotta, gravel + stone paths, marble benches, central basins and fountains.
// Draw calls: stone/gravel merged (1), water (1), boxwood, cypress, laurel instanced (3).
import { TAU, bake, merge, M, rng, fp, tierOf } from './util.js';

const GRAVEL = [0xcdbb98, 0xc4b08b, 0xd6c6a6], PAVER = [0xd9c6a2, 0xcfb991, 0xe0d0b0], MARBLE = 0xf1ece2, MARBLE_V = 0xe3ddd0, TRAVERTINE = 0xd8c39c, TERRA = 0xb7653f, TERRA_D = 0x9a4f30;

function instanced(THREE, parts, mat, list, name) { // parts: [[geo, matrix, colour]] baked into one geometry, drawn once per placement
  const g = merge(THREE, parts.map(([geo, m, c]) => bake(THREE, geo, m, c))), im = new THREE.InstancedMesh(g, mat, Math.max(1, list.length));
  list.forEach((p, i) => im.setMatrixAt(i, M(THREE, p))); im.count = list.length; im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere?.(); im.name = name; im.frustumCulled = false; return im;
}

export function buildGarden(tags) {
  const { THREE } = tags, tier = tierOf(tags), low = tier === 'low', high = tier === 'high', R = rng(251), pick = (a) => a[Math.floor(R() * a.length)];
  const SEG = low ? 12 : high ? 48 : 24; // #276: smooth high-segment shapes on the high tier
  const group = new THREE.Group(); group.name = 'garden-props';
  const stone = [], water = [], colliders = [], hedges = [], cypress = [], laurel = [], fountains = [], skipped = [], lawn = [], beds = [], ivy = [];
  const box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(1, 1, 1, SEG);
  const add = (g, m, c) => stone.push(bake(THREE, g, m, c));
  const solid = (x, z, r, kind, id, yMax = 1) => { const c = fp(x, z, r, kind, id, 0, yMax); colliders.push(c); tags.addCollider?.({ x: c.x, z: c.z, r: c.r, kind }); return c; };
  // #275 sightline rule: anything taller than 1.0 m must stay out of every artwork's viewing wedge (tags.blocksSight)
  const tryPlace = (x, z, r, kind, id, yMax) => { if (!tags.keepClear(x, z, r) || (yMax > 1.0 && tags.blocksSight?.(x, z, r))) { skipped.push({ kind, id }); return false; } solid(x, z, r, kind, id, yMax); return true; };
  const courts = tags.rooms.filter(r => r.kind === 'court' || r.kind === 'outer');
  for (const c of courts) {
    const [cx, cz] = c.center, inR = c.apothem - 0.25, own = tags.paths.filter(p => p.court === c.id);
    // gravel ground: a jittered hex fan (colour variation per triangle), sitting just above the floor
    const rings = low ? 3 : 6, P = [], C = [], col = new THREE.Color();
    const hp = (ring, k) => { const a = (60 * Math.floor(k) - 30) * Math.PI / 180, b = (60 * (Math.floor(k) + 1) - 30) * Math.PI / 180, f = k - Math.floor(k), s = ring / rings * c.radius * 0.995;
      return [cx + s * ((1 - f) * Math.cos(a) + f * Math.cos(b)), cz + s * ((1 - f) * Math.sin(a) + f * Math.sin(b))]; };
    for (let ring = 0; ring < rings; ring++) for (let k = 0; k < 6; k++) for (let j = 0; j <= ring; j++) {
      const n0 = Math.max(1, ring), n1 = ring + 1, a0 = hp(ring, k + j / n0), b0 = hp(ring, k + (j + 1) / n0), a1 = hp(ring + 1, k + j / n1), b1 = hp(ring + 1, k + (j + 1) / n1);
      const tri = (p, q, r) => { col.set(pick(GRAVEL)); for (const v of [p, q, r]) { P.push(v[0], 0.018, v[1]); C.push(col.r, col.g, col.b); } };
      tri(a0, b1, a1); if (ring > 0 && j < ring) tri(a0, b0, b1);
    }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); gg.setAttribute('normal', new THREE.Float32BufferAttribute(P.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3)); gg.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); stone.push(gg);
    // stone paths: pavers along every straight lane, and a paved ring around each fountain
    for (const p of own) {
      if (p.r0 != null) { const n = Math.round(TAU * (p.r0 + p.r1) / 2 / 0.7); for (let i = 0; i < n; i++) { const a = i / n * TAU, rm = (p.r0 + p.r1) / 2;
        add(box, M(THREE, { x: p.x + Math.cos(a) * rm, y: 0.03, z: p.z + Math.sin(a) * rm, ry: -a, sx: p.r1 - p.r0 - 0.04, sy: 0.03, sz: TAU * rm / n - 0.04 }), pick(PAVER)); } continue; }
      const L = Math.hypot(p.x1 - p.x0, p.z1 - p.z0), n = Math.max(1, Math.round(L / 0.6)), ry = Math.atan2(p.x1 - p.x0, p.z1 - p.z0);
      for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; add(box, M(THREE, { x: p.x0 + (p.x1 - p.x0) * t, y: 0.028, z: p.z0 + (p.z1 - p.z0) * t, ry, sx: p.width - 0.06, sy: 0.026, sz: L / n - 0.04 }), pick(PAVER)); }
    }
    // central basin + fountain (travertine coping, marble pedestal and two bowls, finial); water in its own mesh
    for (const [fi, f] of (c.fountains || fountainsOf(c, own)).entries()) {
      const r = f.r || 1.2, id = `${c.id}/fountain${fi}`;
      const lip = new THREE.LatheGeometry([[r, 0], [r, 0.42], [r - 0.06, 0.48], [r - 0.2, 0.48], [r - 0.2, 0.1], [0, 0.1]].map(([a, b]) => new THREE.Vector2(a, b)), low ? 16 : high ? 96 : 32);
      add(lip, M(THREE, { x: f.x, z: f.z }), TRAVERTINE); lip.dispose();
      const ped = new THREE.LatheGeometry([[0.22, 0], [0.16, 0.2], [0.12, 0.7], [0.5, 0.82], [0.52, 0.9], [0.1, 0.92], [0.08, 1.25], [0.28, 1.32], [0.3, 1.38], [0.05, 1.4], [0.06, 1.55], [0.1, 1.6], [0, 1.68]].map(([a, b]) => new THREE.Vector2(a, b)), low ? 12 : high ? 64 : 24);
      add(ped, M(THREE, { x: f.x, z: f.z }), MARBLE); ped.dispose();
      water.push(bake(THREE, new THREE.CircleGeometry(r - 0.2, SEG * 2), M(THREE, { x: f.x, y: 0.4, z: f.z, rx: -Math.PI / 2 }), 0x6f9fa8));
      water.push(bake(THREE, new THREE.CircleGeometry(0.46, 16), M(THREE, { x: f.x, y: 0.885, z: f.z, rx: -Math.PI / 2 }), 0x7fb0b6));
      water.push(bake(THREE, new THREE.CylinderGeometry(0.5, 0.52, 0.45, SEG * 2, 1, true), M(THREE, { x: f.x, y: 0.64, z: f.z }), 0xbfe0e4)); // sheet falling from the bowl
      water.push(bake(THREE, new THREE.ConeGeometry(0.05, 0.5, 8, 1, true), M(THREE, { x: f.x, y: 1.9, z: f.z }), 0xd8f0f2)); // jet
      solid(f.x, f.z, r, 'fountain-basin', id, 1.7); fountains.push({ x: f.x, z: f.z, r });
    }
    // #276 greener, emptier courtyards: lawn panels set in the paving, low ground-cover beds along the edges, one cypress
    // per corner (sightline rule), two benches per fountain, no pots scattered on the open floor
    const fz = fountains.filter(f => Math.hypot(f.x - cx, f.z - cz) < c.radius), inPoly = (x, z) => { let k = 0; for (let i = 0; i < 6; i++) { const [ax, az] = c.poly[i], [bx, bz] = c.poly[(i + 1) % 6]; if ((bx - ax) * (z - az) - (bz - az) * (x - ax) < 0) k++; } return k === 0 || k === 6; };
    const edgeD = (x, z) => { let m = 99; for (let i = 0; i < 6; i++) { const [ax, az] = c.poly[i], [bx, bz] = c.poly[(i + 1) % 6], ex = bx - ax, ez = bz - az, L = Math.hypot(ex, ez); m = Math.min(m, Math.abs((x - ax) * ez - (z - az) * ex) / L); } return m; };
    const onPath = (x, z, r) => tags.paths.some(p => p.r0 != null ? Math.abs(Math.hypot(x - p.x, z - p.z) - (p.r0 + p.r1) / 2) < (p.r1 - p.r0) / 2 + r : segD(x, z, p.x0, p.z0, p.x1, p.z1) < p.width / 2 + r);
    const nearDoor = (x, z, r) => tags.doors.some(d => Math.hypot(x - d.x, z - d.z) < d.width / 2 + 1.2 + r);
    const cell = low ? 0.7 : 0.45;
    for (let x = cx - c.radius; x < cx + c.radius; x += cell) for (let z = cz - c.radius; z < cz + c.radius; z += cell) { const mx = x + cell / 2, mz = z + cell / 2;
      if (!inPoly(mx, mz)) continue; const e = edgeD(mx, mz); if (onPath(mx, mz, 0.3) || nearDoor(mx, mz, 0) || fz.some(f => Math.hypot(mx - f.x, mz - f.z) < f.r + 0.4)) continue;
      if (e < 0.95 && e > 0.12) { beds.push([mx, mz, cell]); continue; } if (e > 1.35) lawn.push([mx, mz, cell]); }
    c.poly.forEach(([vx, vz], k) => { const dx = cx - vx, dz = cz - vz, L = Math.hypot(dx, dz), x = vx + dx / L * 1.2, z = vz + dz / L * 1.2;
      if (tryPlace(x, z, 0.42, 'cypress', `${c.id}/cy${k}`, 6)) cypress.push({ x, z, ry: R() * TAU, sx: 0.9 + R() * 0.2, sy: (c.kind === 'outer' ? 1.15 : 0.85) + R() * 0.25, sz: 0.9 + R() * 0.2 }); });
    for (const f of fz) {
      const ring = own.find(p => p.r0 != null && Math.hypot(p.x - f.x, p.z - f.z) < 0.01), rb = (ring ? ring.r1 : f.r + 1.5) + 0.72; let nb = 0;
      for (let i = 0; i < 12 && nb < 2; i++) { const a = (i + 0.5) / 12 * TAU, x = f.x + Math.cos(a) * rb, z = f.z + Math.sin(a) * rb;
        if (Math.hypot(x - cx, z - cz) < inR - 0.3 && tryPlace(x, z, 0.62, 'bench', `${c.id}/bench${i}`, 0.5)) { nb++; i += 5;
          const m = { ry: -a + Math.PI / 2 }, t = [-Math.sin(a), Math.cos(a)];
          for (const s of [-0.42, 0.42]) add(box, M(THREE, { x: x + t[0] * s, y: 0.2, z: z + t[1] * s, ...m, sx: 0.12, sy: 0.4, sz: 0.36 }), MARBLE_V);
          add(box, M(THREE, { x, y: 0.43, z, ...m, sx: 1.2, sy: 0.07, sz: 0.42 }), MARBLE); } }
    }
  }
  // #276 climbing ivy on court-facing walls that carry no art (never over a door or an artwork)
  const W = tags.world;
  if (W && W.walls) for (const w of W.walls) { const L = Math.hypot(w.x1 - w.x0, w.z1 - w.z0); if (L < 1.2) continue;
    for (const sd of [1, -1]) { const nx = (w.nx || 0) * sd, nz = (w.nz || 0) * sd, mx = (w.x0 + w.x1) / 2 + nx * 0.6, mz = (w.z0 + w.z1) / 2 + nz * 0.6;
      const rr = W.roomAt ? W.roomAt(mx, mz) : null, ct = rr && (rr.kind === 'court' || rr.kind === 'outer') ? rr : courts.find(c => Math.hypot(mx - c.center[0], mz - c.center[1]) < c.apothem); if (!ct) continue;
      if (tags.art.some(a => segD(a.x, a.z, w.x0, w.z0, w.x1, w.z1) < 0.4 && (a.ix * nx + a.iz * nz) > 0.3)) continue; // art on THIS face only
      ivy.push({ w, nx, nz, L, h: Math.min(w.h || 4.2, 3.6) }); } }
  // hub band: laurel in terracotta between the column ring and the core wall, away from the six openings and gates
  const hub = tags.rooms.find(r => r.kind === 'hub');
  if (hub) for (let k = 0; k < 6; k++) for (const s of [8]) { const a = (60 * k + 30 + s) * Math.PI / 180, x = hub.center[0] + Math.cos(a) * 8.1, z = hub.center[1] + Math.sin(a) * 8.1;
    if (tryPlace(x, z, 0.4, 'laurel', `hub/laurel${k}${s}`, 1.8)) laurel.push({ x, z, ry: R() * TAU, sx: 1, sy: 1, sz: 1 }); }

  // instanced plant meshes (shared low-poly shapes, flat-coloured with vertex colours)
  const leaf = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: low });
  const det = low ? 0 : high ? 4 : 2, cs = low ? 7 : high ? 24 : 12;
  { const LAWN = [0x5f8a3e, 0x6a9444, 0x577f38], P = [], C = [], col = new THREE.Color(), q = (list, y, cols) => { for (const [x, z, s] of list) { col.set(pick(cols)); const h = s / 2 + 0.002;
      for (const [a, b] of [[-h, -h], [h, -h], [h, h], [-h, -h], [h, h], [-h, h]]) { P.push(x + a, y, z + b); C.push(col.r, col.g, col.b); } } };
    q(lawn, 0.022, LAWN); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(P.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    // reverse winding so the quads face up
    const pa = g.attributes.position.array, ca = g.attributes.color.array; for (let i = 0; i < pa.length; i += 9) for (let j = 0; j < 3; j++) { const t = pa[i + 3 + j]; pa[i + 3 + j] = pa[i + 6 + j]; pa[i + 6 + j] = t; const u = ca[i + 3 + j]; ca[i + 3 + j] = ca[i + 6 + j]; ca[i + 6 + j] = u; }
    const lm = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); lm.name = 'garden-lawn'; lm.receiveShadow = true; group.add(lm); }
  // ground cover: low mounded beds (0.3 m, walk-past height, below the 0.8 m sightline limit)
  // LOD: ground cover and ivy are one instanced mesh per courtyard, hidden beyond a tier-dependent distance
  const lods = [], LOD_D = low ? 22 : high ? 48 : 34, nearestCourt = (x, z) => { let b = null, bd = 1e9; for (const c of courts) { const d = Math.hypot(x - c.center[0], z - c.center[1]); if (d < bd) { bd = d; b = c; } } return b; };
  const perCourt = (list, xz) => { const m = new Map(); for (const it of list) { const c = nearestCourt(...xz(it)); if (!m.has(c)) m.set(c, []); m.get(c).push(it); } return m; };
  { const geo = new THREE.SphereGeometry(0.5, cs, Math.max(4, cs / 2), 0, TAU, 0, Math.PI / 2);
    for (const [c, L] of perCourt(beds, b => [b[0], b[1]])) { const im = instanced(THREE, [[geo, M(THREE, { sy: 0.6 }), 0x48703a]], leaf, L.map(([x, z, s]) => ({ x, z, ry: R() * TAU, sx: s * 1.5, sy: 0.4 + R() * 0.15, sz: s * 1.5 })), 'groundcover:' + c.id); group.add(im); lods.push({ o: im, x: c.center[0], z: c.center[1], r: c.radius }); } }
  // ivy: clusters of leaf cards climbing the plain walls
  { const card = new THREE.PlaneGeometry(0.16, 0.12), list = [], cols = [0x3d6b2f, 0x4b7a36, 0x335c28];
    for (const v of ivy) { const n = Math.round(v.L * v.h * (low ? 10 : high ? 60 : 28)); const tx = (v.w.x1 - v.w.x0) / v.L, tz = (v.w.z1 - v.w.z0) / v.L;
      for (let i = 0; i < n; i++) { const u = 0.1 + R() * (v.L - 0.2), y = Math.pow(R(), 0.7) * v.h * (0.55 + 0.45 * Math.sin(u * 1.7 + 1) ** 2);
        list.push({ x: v.w.x0 + tx * u + v.nx * (0.04 + R() * 0.05), y: 0.05 + y, z: v.w.z0 + tz * u + v.nz * (0.04 + R() * 0.05), ry: Math.atan2(v.nx, v.nz) + (R() - 0.5) * 0.8, rx: (R() - 0.5) * 0.9, rz: R() * TAU, sx: 0.7 + R() * 0.6, sy: 0.7 + R() * 0.6, sz: 1 }); } }
    const ivyMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide });
    for (const [c, L] of perCourt(list, q => [q.x, q.z])) { const im = instanced(THREE, [[card, M(THREE, {}), pick(cols)]], ivyMat, L, 'ivy:' + c.id); group.add(im); lods.push({ o: im, x: c.center[0], z: c.center[1], r: c.radius }); } }
  group.add(instanced(THREE, [[new THREE.BoxGeometry(1, 1, 1, 1, 1, 2), M(THREE, { y: 0.5 }), 0x3f6a34], [new THREE.BoxGeometry(1, 1, 1), M(THREE, { y: 0.98, sx: 0.92, sy: 0.04, sz: 0.98 }), 0x4d7a3c]], leaf, hedges, 'boxwood'));
  group.add(instanced(THREE, [[new THREE.CylinderGeometry(0.06, 0.08, 0.5, 6), M(THREE, { y: 0.25 }), 0x5b4330], [new THREE.CylinderGeometry(0.02, 0.36, 3.6, cs, high ? 12 : 3), M(THREE, { y: 2.2 }), 0x2c4a2a], [new THREE.CylinderGeometry(0.3, 0.12, 0.8, cs), M(THREE, { y: 0.8 }), 0x2f4f2c]], leaf, cypress, 'cypress'));
  group.add(instanced(THREE, [[new THREE.CylinderGeometry(0.3, 0.22, 0.5, cs), M(THREE, { y: 0.25 }), TERRA], [new THREE.TorusGeometry(0.3, 0.04, low ? 5 : 10, cs * 2), M(THREE, { y: 0.5, rx: Math.PI / 2 }), TERRA_D], [new THREE.CylinderGeometry(0.035, 0.045, 0.7, 5), M(THREE, { y: 0.8 }), 0x6a5038],
    [new THREE.IcosahedronGeometry(0.5, det), M(THREE, { y: 1.35, sy: 0.9 }), 0x4f6b37], [new THREE.IcosahedronGeometry(0.3, det), M(THREE, { x: 0.22, y: 1.55, z: 0.1 }), 0x5d7a40]], leaf, laurel, 'laurel'));
  const st = new THREE.Mesh(merge(THREE, stone), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 })); st.name = 'garden-stone'; group.add(st);
  let wm = null; if (water.length) { wm = new THREE.Mesh(merge(THREE, water), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })); wm.name = 'garden-water'; group.add(wm); }
  box.dispose(); cyl.dispose();
  const sound = createFountainSound(fountains);
  let t = 0;
  let lodT = 0;
  const update = (dt = 1 / 60, player = globalThis.game?.player?.()) => { t += dt;
    if (player && (lodT -= dt) <= 0) { lodT = 0.4; for (const l of lods) l.o.visible = Math.hypot(player.x - l.x, player.z - l.z) - l.r < LOD_D; } if (wm) wm.material.opacity = 0.76 + 0.06 * Math.sin(t * 3); sound.update(player); };
  return { group, colliders, fountains, skipped, counts: { lodMeshes: lods.length, lawn: lawn.length, beds: beds.length, ivyWalls: ivy.length, cypress: cypress.length, laurel: laurel.length, hedges: hedges.length }, update, sound, dispose: () => { sound.dispose(); group.traverse(o => { o.geometry?.dispose(); o.material?.dispose?.(); }); } };
}

function segD(px, pz, x0, z0, x1, z1) { const dx = x1 - x0, dz = z1 - z0, L = dx * dx + dz * dz || 1e-9; let t = ((px - x0) * dx + (pz - z0) * dz) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - x0 - t * dx, pz - z0 - t * dz); }
function fountainsOf(c, own) { const r = own.find(p => p.r0 != null); return r ? [{ x: r.x, z: r.z, r: 1.2 }] : []; }

// Fountain sound: procedural filtered noise (no samples). Nothing plays until start() is called from a user gesture,
// and the gain is hard 0 (context suspended) whenever window.game.holo.muted is true.
export function createFountainSound(fountains, isMuted = () => !!globalThis.game?.holo?.muted) {
  let ctx = null, gain = null, src = null;
  const api = {
    get playing() { return !!ctx && ctx.state === 'running' && gain && gain.gain.value > 0; },
    start() { if (ctx || isMuted() || !fountains.length) return; const AC = globalThis.AudioContext || globalThis.webkitAudioContext; if (!AC) return;
      ctx = new AC(); const n = ctx.sampleRate * 2, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0); let b = 0;
      for (let i = 0; i < n; i++) { b = 0.97 * b + 0.03 * (Math.random() * 2 - 1); d[i] = b * 3 + (Math.random() * 2 - 1) * 0.15; }
      src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.6;
      gain = ctx.createGain(); gain.gain.value = 0; src.connect(bp).connect(gain).connect(ctx.destination); src.start(); },
    update(player) { if (!ctx) return; if (isMuted()) { gain.gain.value = 0; if (ctx.state === 'running') ctx.suspend(); return; }
      if (ctx.state === 'suspended') ctx.resume(); let dmin = 99; if (player) for (const f of fountains) dmin = Math.min(dmin, Math.hypot(player.x - f.x, player.z - f.z));
      gain.gain.value = player ? Math.max(0, 0.12 * (1 - dmin / 9)) : 0; },
    dispose() { try { src?.stop(); ctx?.close(); } catch {} ctx = null; },
  };
  return api;
}
