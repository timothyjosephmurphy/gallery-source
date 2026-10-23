// museum-eggs world model: reads the gallery (walkable(), wall boxes, paintings, doorways) without touching it and
// offers the finders the eggs need: free wall spots, floor spots (against a wall / in a corner, never in a doorway or
// a narrow hall, never in front of a painting), a secret-room wall, a coarse nav grid with paths, and colliders.
import { THREE, V, clamp } from './kit.js';
const C = 0.5; // nav cell (m)
function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
export function makeWorld(o) {
  const { scene, walkable, paintings = [], rooms = [] } = o;
  const gates = (o.gates || []).filter(Boolean).map(g => g.pos || g);
  const start = o.start ? o.start.clone() : V();
  scene.updateMatrixWorld(true);
  // ---- bounds of the walkable area ----
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (let x = -240; x <= 240; x += 1.5) for (let z = -240; z <= 240; z += 1.5) if (walkable(x, z)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  x0 -= 6; z0 -= 6; x1 += 6; z1 += 6;
  const NX = Math.ceil((x1 - x0) / C), NZ = Math.ceil((z1 - z0) / C), N = NX * NZ;
  const cx = i => x0 + (i + 0.5) * C, cz = j => z0 + (j + 0.5) * C, ci = x => Math.floor((x - x0) / C), cj = z => Math.floor((z - z0) / C);
  const inG = (i, j) => i >= 0 && j >= 0 && i < NX && j < NZ;
  // ---- every mesh's world box (for obstacle + emptiness tests) ----
  const own = new Set(); paintings.forEach(p => p.group && p.group.traverse(c => own.add(c)));
  const boxes = []; // {b: Box3, m, big}
  scene.traverse(m => { if (!m.isMesh || !m.geometry || m.userData.egg) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld); if (!isFinite(b.min.x)) return; const s = b.getSize(V()); boxes.push({ b, m, s, painting: own.has(m) }); });
  const obstacles = boxes.filter(q => !q.painting && q.b.max.y > 0.08 && q.b.min.y < 1.6 && q.s.y > 0.03 && q.s.x < 4 && q.s.z < 4 && !(q.m.material && q.m.material.transparent && q.m.material.depthWrite === false));
  const walk = new Uint8Array(N), blk = new Uint8Array(N);
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) walk[j * NX + i] = walkable(cx(i), cz(j)) ? 1 : 0;
  const stamp = (minX, maxX, minZ, maxZ, v = 1) => { for (let j = Math.max(0, cj(minZ)); j <= Math.min(NZ - 1, cj(maxZ)); j++) for (let i = Math.max(0, ci(minX)); i <= Math.min(NX - 1, ci(maxX)); i++) blk[j * NX + i] = v; };
  obstacles.forEach(q => stamp(q.b.min.x - 0.15, q.b.max.x + 0.15, q.b.min.z - 0.15, q.b.max.z + 0.15));
  // what a hovering drone (1.0-1.8 m) has to avoid: low plinths, benches and rails don't count
  const blkHi = new Uint8Array(N); obstacles.forEach(q => { if (q.b.max.y < 1.0) return; for (let j = Math.max(0, cj(q.b.min.z - 0.1)); j <= Math.min(NZ - 1, cj(q.b.max.z + 0.1)); j++) for (let i = Math.max(0, ci(q.b.min.x - 0.1)); i <= Math.min(NX - 1, ci(q.b.max.x + 0.1)); i++) blkHi[j * NX + i] = 1; });
  // distance transforms (metres): clr = to nearest non-free cell, wd = to nearest non-walkable cell
  const dt = (src) => { const d = new Float32Array(N); for (let k = 0; k < N; k++) d[k] = src[k] ? 1e6 : 0; const a = 1, b = 1.414;
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const k = j * NX + i; if (!d[k]) continue; let v = d[k]; if (i > 0) v = Math.min(v, d[k - 1] + a); if (j > 0) { v = Math.min(v, d[k - NX] + a); if (i > 0) v = Math.min(v, d[k - NX - 1] + b); if (i < NX - 1) v = Math.min(v, d[k - NX + 1] + b); } d[k] = v; }
    for (let j = NZ - 1; j >= 0; j--) for (let i = NX - 1; i >= 0; i--) { const k = j * NX + i; if (!d[k]) continue; let v = d[k]; if (i < NX - 1) v = Math.min(v, d[k + 1] + a); if (j < NZ - 1) { v = Math.min(v, d[k + NX] + a); if (i < NX - 1) v = Math.min(v, d[k + NX + 1] + b); if (i > 0) v = Math.min(v, d[k + NX - 1] + b); } d[k] = v; }
    for (let k = 0; k < N; k++) d[k] = d[k] * C - C / 2; return d; };
  let free, clr, freeHi, clrHi; const wd = dt(walk);
  const recompute = () => { free = new Uint8Array(N); freeHi = new Uint8Array(N); for (let k = 0; k < N; k++) { free[k] = walk[k] && !blk[k] ? 1 : 0; freeHi[k] = walk[k] && !blkHi[k] ? 1 : 0; } clr = dt(free); clrHi = dt(freeHi); };
  recompute();
  // doorways (as main.js builds them) and their approach zones
  const doors = []; rooms.forEach(r => (r.openings || []).forEach(op => { const c = op.wall === 'N' ? r.maxZ : op.wall === 'S' ? r.minZ : op.wall === 'W' ? r.minX : r.maxX, hz = op.wall === 'N' || op.wall === 'S';
    doors.push(hz ? { minX: op.from, maxX: op.to, minZ: c - 1, maxZ: c + 1 } : { minX: c - 1, maxX: c + 1, minZ: op.from, maxZ: op.to }); }));
  const nearDoor = (x, z, m) => doors.some(d => x > d.minX - m && x < d.maxX + m && z > d.minZ - m && z < d.maxZ + m);
  // a "narrow" spot is in a hallway or passage: the walkable run through it is short in x or z
  const run = (x, z, dx, dz) => { let a = 0, b = 0; while (a < 8 && walkable(x + dx * (a + 0.25), z + dz * (a + 0.25))) a += 0.25; while (b < 8 && walkable(x - dx * (b + 0.25), z - dz * (b + 0.25))) b += 0.25; return a + b; };
  const narrow = (x, z, m = 3.6) => run(x, z, 1, 0) < m || run(x, z, 0, 1) < m;
  // floor in front of each hung painting is kept clear (viewing zone)
  const paintZones = () => paintings.filter(p => p.state === 'wall' || !p.state).map(p => { const d = p.data; return { x: d.x, z: d.z, n: V(d.ix, 0, d.iz).normalize(), hw: (p.w || d.w) / 2 + 0.45, depth: 1.7, y0: d.y - (p.h || d.h) / 2 - 0.4, y1: d.y + (p.h || d.h) / 2 + 0.3 }; });
  const inPaintZone = (x, z, r) => paintZones().some(q => { const dx = x - q.x, dz = z - q.z, out = dx * q.n.x + dz * q.n.z, al = Math.abs(dx * q.n.z - dz * q.n.x); return out > -0.5 && out < q.depth + r && al < q.hw + r; });
  // the spot a visitor stands on to look at each painting (1.5 m out) must stay reachable: floor props keep r + margin from it
  const nearViewSpot = (x, z, m) => paintings.some(p => { const d = p.data; return d && (p.state === 'wall' || !p.state) && Math.hypot(x - (d.x + d.ix * 1.5), z - (d.z + d.iz * 1.5)) < m; });
  const reserved = [], wallRes = [], colliders = [];
  const farFromRes = (x, z, r, gap = 0.6) => reserved.every(q => Math.hypot(x - q.x, z - q.z) > r + q.r + gap);
  // wall clutter the gallery already hung (story boards, labels, signs, murals): thin vertical meshes that are not paintings
  scene.updateMatrixWorld(true);
  scene.traverse(m => { if (!m.isMesh || !m.geometry || own.has(m) || m.userData.egg) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    const b = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld), sx = b.max.x - b.min.x, sy = b.max.y - b.min.y, sz = b.max.z - b.min.z; if (!isFinite(sx)) return;
    if (m.material && m.material.transparent) { // window glass: keep the whole wall height under/over it clear too
      if (Math.min(sx, sz) < 0.08 && Math.max(sx, sz) > 0.6 && sy > 0.8) { const c = b.getCenter(V()), n = sx < sz ? V(1, 0, 0) : V(0, 0, 1); for (const sg of [1, -1]) wallRes.push({ pos: c.clone(), n: n.clone().multiplyScalar(sg), w: Math.max(sx, sz) + 0.4, h: 40, name: 'gallery:window' }); } return; }
    if (Math.min(sx, sz) > 0.08 || Math.max(sx, sz) < 0.12 || Math.max(sx, sz) > 14 || sy < 0.05 || b.min.y < 0.05 || b.max.y > 6) return;
    const c = b.getCenter(V()), n = sx < sz ? V(1, 0, 0) : V(0, 0, 1);
    for (const sg of [1, -1]) wallRes.push({ pos: c.clone(), n: n.clone().multiplyScalar(sg), w: Math.max(sx, sz), h: sy, name: 'gallery:' + (m.name || m.geometry.type) }); });
  const nearestWallDir = (x, z, R) => { let best = null, bd = 1e9; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, dx = Math.sin(a), dz = Math.cos(a); for (let s = 0.1; s < R; s += 0.1) if (!walkable(x + dx * s, z + dz * s)) { if (s < bd) { bd = s; best = [dx, dz]; } break; } } return best ? { dx: best[0], dz: best[1], d: bd } : null; };

  // which room a point is in (-1 = hall/corridor not listed as a room), and the visitor's starting room
  const roomOf = (x, z) => rooms.findIndex(r => x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ);
  const startRoom = roomOf(start.x, start.z);
  // starting in a hallway (e.g. Uffizi): the rooms that open right onto the start (within 4 m) count as the start room too
  const nearRoomD = (r, x, z) => Math.max(r.minX - x, 0, x - r.maxX) + Math.max(r.minZ - z, 0, z - r.maxZ);
  const startRooms = startRoom >= 0 ? [startRoom] : rooms.map((r, i) => nearRoomD(r, start.x, start.z) <= 4 ? i : -1).filter(i => i >= 0);
  // spawn rule for wandering critters: not in the starting room (and well away from the start), not in a room another critter took
  const spawnOk = (x, z, taken = [], minStart = 12, apart = 15, inRoom = rooms.length > 0) => { const rm = roomOf(x, z); if (Math.hypot(x - start.x, z - start.z) < minStart) return false; if (rm >= 0 && startRooms.includes(rm)) return false;
    if (inRoom && rm < 0) return false; // a real room of its own, not the hallway you start in
    return taken.every(t => Math.hypot(x - t.x, z - t.z) >= apart && (rm < 0 || rm !== t.room)); };
  const W = {
    NX, NZ, C, x0, z0, cx, cz, ci, cj, walk, blk, roomOf, startRoom, startRooms, spawnOk, gates, nearViewSpot, nearGate: (x, z, r = 0) => gates.some(g => Math.hypot(x - g.x, z - g.z) < 3 + r), start, spawns: [], get free() { return free; }, get clr() { return clr; }, get freeHi() { return freeHi; }, get clrHi() { return clrHi; }, wd, doors, obstacles, boxes, reserved, wallRes, colliders, nearDoor, narrow, inPaintZone, walkable,
    cell: (x, z) => { const i = ci(x), j = cj(z); return inG(i, j) ? j * NX + i : -1; },
    clearAt: (x, z) => { const k = W.cell(x, z); return k < 0 ? -1 : clr[k]; },
    // ---- floor spot: {r, place: 'wall'|'corner'|'open', seed, minStart, spread, test(x,z)} -> {x, z, yaw, back:{dx,dz}}
    findFloorSpot(q = {}) { const r = q.r || 0.5, rnd = seeded(q.seed || 7), place = q.place || 'wall'; const cand = [];
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const k = j * NX + i; if (!free[k] || clr[k] < r) continue; const x = cx(i), z = cz(j);
        if (place !== 'open' && (wd[k] > r + 0.45 || wd[k] < r - 0.05)) continue;
        if (place === 'open' && wd[k] < r + 1.2) continue;
        if (nearDoor(x, z, 1.4 + r) || Math.hypot(x - start.x, z - start.z) < (q.minStart || 3)) continue;
        if (gates.some(g => Math.hypot(x - g.x, z - g.z) < 3.5 + r)) continue;
        cand.push([x, z, rnd()]); }
      cand.sort((a, b) => a[2] - b[2]);
      let fallback = null;
      for (const [x, z] of cand) { if (!farFromRes(x, z, r) || inPaintZone(x, z, r) || nearViewSpot(x, z, r + 0.5) || narrow(x, z, q.minRun || 3.6)) continue;
        if (place === 'corner') { const hx = !walkable(x + r + 0.45, z) || !walkable(x - r - 0.45, z), hz = !walkable(x, z + r + 0.45) || !walkable(x, z - r - 0.45); if (!(hx && hz)) continue; }
        if (q.test && !q.test(x, z)) continue;
        const w = nearestWallDir(x, z, 3) || { dx: 0, dz: -1 }; let yaw = Math.atan2(-w.dx, -w.dz);
        if (place === 'corner') { const sx = walkable(x + r + 0.45, z) ? 1 : -1, sz = walkable(x, z + r + 0.45) ? 1 : -1; yaw = Math.atan2(sx, sz); }
        const spot = { x, z, yaw, r, back: w };
        if (q.spread && reserved.some(s => Math.hypot(x - s.x, z - s.z) < q.spread)) { fallback = fallback || spot; continue; }
        return spot; }
      return fallback; },
    // ---- window spot: a floor spot just inside a window, facing into the room, that leaves a clear walkway (>= 2.4 m) past it.
    // openings: ctx.openings (kind 'window'). Returns {x, z, yaw, r, window} or null (the gallery has no usable window).
    findWindowSpot(openings, q = {}) { const r = q.r || 0.6, rnd = seeded(q.seed || 5); const wins = (openings || []).filter(o => o && o.kind === 'window' && o.c && o.n).map(o => [o, rnd()]).sort((a, b) => a[1] - b[1]).map(a => a[0]);
      for (const o of wins) { const n = V(o.n.x, 0, o.n.z).normalize(); const sg = walkable(o.c.x + n.x, o.c.z + n.z) ? 1 : -1, inw = n.clone().multiplyScalar(sg), t = V(inw.z, 0, -inw.x);
        if (reserved.some(rr => rr.window === o)) continue;
        for (const u of [0, -0.25, 0.25]) for (const dd of [0.3, 0.5, 0.7, 0.9]) { const d0 = r + dd; const x = o.c.x + inw.x * d0 + t.x * u * o.w, z = o.c.z + inw.z * d0 + t.z * u * o.w, k = W.cell(x, z); if (k < 0 || !free[k] || clr[k] < r - 0.15) continue;
          if (nearDoor(x, z, 1.4 + r) || inPaintZone(x, z, r) || nearViewSpot(x, z, r + 0.5) || !farFromRes(x, z, r) || gates.some(g => Math.hypot(x - g.x, z - g.z) < 3.5 + r) || Math.hypot(x - start.x, z - start.z) < (q.minStart || 4)) continue;
          let run = 0; while (run < 6 && walkable(x + inw.x * (r + run + 0.25), z + inw.z * (r + run + 0.25))) run += 0.25; if (run < (q.walkway || 2.4)) continue; // a path stays open in front
          if (q.test && !q.test(x, z)) continue;
          return { x, z, yaw: Math.atan2(inw.x, inw.z), r, window: o, back: { dx: -inw.x, dz: -inw.z } }; } }
      return null; },
    // ---- niche spot: a straight, painting-free stretch of wall (w wide) where a plinth d deep stands in its own lit alcove, with a clear
    // walkway in front; never by a door, a gate, a painting's viewing zone or another egg. -> {x, z, yaw, r, back, wall, zb, H}
    findNicheSpot(q = {}) { const w = q.w || 1.2, d = q.d || 0.9, r = q.r || 0.8, gap = 0.05; let out = null;
      for (const H of q.heights || [2.6, 2.25]) { for (const spread of [q.spread || 0, 0]) { const sp = W.findWallSpot({ w: w + 0.24, h: H + 0.1, y: (H + 0.1) / 2 + 0.02, seed: q.seed, spread, gap: 0.4, test: cd => { const { pos, n, t } = cd;
        const why = W.nicheWhy = W.nicheWhy || {}, no = r => { why[r] = (why[r] || 0) + 1; return false; }; let zb = d / 2 + gap; while (zb < d / 2 + 0.6 && !walkable(pos.x + n.x * zb, pos.z + n.z * zb)) zb += 0.05; if (!walkable(pos.x + n.x * zb, pos.z + n.z * zb)) return no('margin'); const c = pos.clone().addScaledVector(n, zb); c.y = 0; const fr = pos.clone().addScaledVector(n, zb + d / 2 + 0.3), kf = W.cell(fr.x, fr.z); if (kf < 0 || !walk[kf]) return no('cell');
        for (const u of [-0.5, 0, 0.5]) for (const v of [0.15, zb, zb + d / 2]) { const e = pos.clone().addScaledVector(t, u * (w + 0.2)).addScaledVector(n, v), kk = W.cell(e.x, e.z); if (kk < 0 || (blk[kk] && obstacles.some(o2 => o2.b.containsPoint(V(e.x, 0.5, e.z))))) return no('foot'); }
        { const e = pos.clone().addScaledVector(n, zb + d / 2 + 0.55 + (q.front || 0)); if (!walkable(e.x, e.z)) return no('front'); }
        if (nearDoor(c.x, c.z, 1.4 + r)) return no('door'); if (inPaintZone(c.x, c.z, r)) return no('paint'); if (nearViewSpot(c.x, c.z, r + 0.5)) return no('view'); if (!farFromRes(c.x, c.z, r)) return no('res'); if (Math.hypot(c.x - start.x, c.z - start.z) < (q.minStart || 4) || gates.some(g => Math.hypot(c.x - g.x, c.z - g.z) < 3.5 + r)) return no('start');
        const f0 = zb + d / 2 + 0.25 + (q.front || 0); let run = 0; while (run < 6 && walkable(pos.x + n.x * (f0 + run + 0.25), pos.z + n.z * (f0 + run + 0.25))) run += 0.25; if (run < (q.walkway || 2.4)) return no('walkway'); // a path stays open in front
        if (q.test && !q.test(c.x, c.z)) return no('test');
        why.ok = (why.ok || 0) + 1; out = { x: c.x, z: c.z, yaw: Math.atan2(n.x, n.z), r, back: { dx: -n.x, dz: -n.z }, zb, H, wall: { pos: pos.clone(), n: n.clone(), t: t.clone(), w: w + 0.24, h: H + 0.1 } }; return true; } }); if (sp && out && out.wall.pos.distanceTo(sp.pos) < 1e-6) return out; out = null; } }
      return null; },
    reserveFloor(s, r, name, solid = true) { reserved.push({ x: s.x, z: s.z, r, name, window: s.window || null }); if (solid) W.addCollider({ x: s.x, z: s.z, r, name }); },
    // ---- wall spot: {w, h, y, seed, spread} -> {pos, n, t, yaw}
    findWallSpot(q = {}) { const w = q.w || 1, h = q.h || 1, y = q.y || 1.6, rnd = seeded(q.seed || 11), ray = new THREE.Raycaster(); const ws = W.wallMeshes(); const cand = [];
      for (const m of ws) { const p = m.geometry.parameters, s = V(); m.getWorldScale(s); if (Math.abs(m.rotation.y) > 1e-3 && Math.abs(Math.abs(m.rotation.y) - Math.PI) > 1e-3) continue;
        const bw = p.width * s.x, bh = p.height * s.y, bd = p.depth * s.z, c = m.getWorldPosition(V()); if (bh < Math.max(2.2, y + h / 2 + 0.2) || c.y - bh / 2 > 0.1) continue;
        const along = bw > bd ? 'x' : 'z', L = Math.max(bw, bd), T = Math.min(bw, bd); if (L < w + 0.5) continue;
        for (const sgn of [1, -1]) { const n = along === 'x' ? V(0, 0, sgn) : V(sgn, 0, 0), t = V(n.z, 0, -n.x);
          for (let a = -L / 2 + w / 2 + 0.2; a <= L / 2 - w / 2 - 0.2; a += 0.3) { const pos = c.clone().addScaledVector(n, T / 2 + 0.035); if (along === 'x') pos.x += a; else pos.z += a; pos.y = y; cand.push({ pos, n, t, m, r: rnd() }); } } }
      cand.sort((a, b) => a.r - b.r); let fallback = null;
      const spreadOK = pos => !q.spread || !wallRes.some(s => !s.name.startsWith('gallery:') && s.pos.distanceTo(pos) < q.spread);
      for (const pass of [0, 1]) { for (const cd of cand) { const { pos, n, t } = cd; if (!pass && !spreadOK(pos)) continue; if (q.test && !q.test(cd)) continue; if (!W.wallFits(pos, n, w, h, ray, q.gap)) continue;
        return { pos, n, t, yaw: Math.atan2(n.x, n.z), w, h }; } if (!q.spread) break; }
      return fallback; },
    wallMeshes() { if (!W._wm) { W._wm = []; scene.traverse(m => { if (m.isMesh && m.geometry && m.geometry.type === 'BoxGeometry' && !(m.material && m.material.transparent) && m.visible !== false && !own.has(m) && !m.userData.egg) W._wm.push(m); }); } return W._wm; },
    wallFits(pos, n, w, h, ray = new THREE.Raycaster(), gap = 0.35) { const t = V(n.z, 0, -n.x), ws = W.wallMeshes(); if (!W._wb || W._wb.src !== ws) { W._wb = ws.map(m => ({ m, b: new THREE.Box3().setFromObject(m) })); W._wb.src = ws; }
      const R = Math.hypot(w / 2, h / 2) + 0.7, near = W._wb.filter(q => q.b.distanceToPoint(pos) < R).map(q => q.m);
      const front = pos.clone().addScaledVector(n, 1.0); if (!walkable(front.x, front.z) || nearDoor(front.x, front.z, 0.6)) return false;
      if (gates.some(g => Math.hypot(pos.x - g.x, pos.z - g.z) < 3.2 + w / 2)) return false;
      for (const s of [-1, 1]) { const e = pos.clone().addScaledVector(t, s * (w / 2 + 0.35)).addScaledVector(n, 0.7); if (!walkable(e.x, e.z)) return false; }
      for (const p of paintings) { if (p.state && p.state !== 'wall') continue; const d = p.data, qn = V(d.ix, 0, d.iz); if (qn.dot(n) < 0.99) continue; const dx = d.x - pos.x, dz = d.z - pos.z, perp = Math.abs(dx * n.x + dz * n.z), al = Math.abs(dx * t.x + dz * t.z); if (perp > 0.4) continue;
        if (al < ((p.w || d.w) + w) / 2 + gap) return false; }
      for (const s of wallRes) { if (s.n.dot(n) < 0.99) continue; const dx = s.pos.x - pos.x, dz = s.pos.z - pos.z, perp = Math.abs(dx * n.x + dz * n.z), al = Math.abs(dx * t.x + dz * t.z); if (perp < 0.4 && al < (s.w + w) / 2 + 0.3 && Math.abs(s.pos.y - pos.y) < (s.h + h) / 2 + 0.3) return false; }
      for (const s of reserved) { const e = pos.clone().addScaledVector(n, 0.4); if (Math.hypot(e.x - s.x, e.z - s.z) < s.r + w / 2 + 0.2) return false; }
      for (let u = -0.5; u <= 0.5; u += 0.25) for (const d of [0.3, 0.6]) { const e = pos.clone().addScaledVector(t, u * w).addScaledVector(n, d), k = W.cell(e.x, e.z); if (k >= 0 && blk[k] && obstacles.some(o2 => o2.b.containsPoint(V(e.x, Math.min(pos.y, 1.2), e.z)))) return false; }
      for (const u of [-0.48, -0.25, 0, 0.25, 0.48]) for (const v of [-0.45, 0, 0.45]) { const o2 = pos.clone().addScaledVector(t, u * w).add(V(0, v * h, 0)).addScaledVector(n, 0.25); ray.set(o2, n.clone().negate()); ray.far = 0.6; const hit = ray.intersectObjects(near, false)[0]; if (!hit || hit.distance < 0.17 || hit.distance > 0.33) return false; }
      return true; },
    // wall eggs also keep the floor in front of them clear (so nothing on the floor blocks the view)
    reserveWall(s, name, floor = true) { wallRes.push({ pos: s.pos.clone(), n: s.n.clone(), w: s.w, h: s.h, name }); if (floor) { const f = s.pos.clone().addScaledVector(s.n, 0.9); reserved.push({ x: f.x, z: f.z, r: s.w / 2 + 0.3, name: name + '-view', soft: true }); } },
    // ---- secret room wall: a straight floor-to-ceiling wall with nothing behind it (outside the building)
    findSecretWall(q = {}) { const ow = q.w || 1.4, RW = q.width || 3.2, RD = q.depth || 3.2, RHt = q.height || 2.8, rnd = seeded(q.seed || 5); const out = [];
      for (const m of W.wallMeshes()) { const p = m.geometry.parameters, c = m.getWorldPosition(V()); if (m.rotation.y !== 0 || m.parent !== scene) continue; const bw = p.width, bh = p.height, bd = p.depth;
        if (bh < RHt + 0.4 || c.y - bh / 2 > 0.05 || Math.min(bw, bd) > 0.6) continue; const along = bw > bd ? 'x' : 'z', L = Math.max(bw, bd), T = Math.min(bw, bd); if (L < RW + 1.2) continue;
        for (const sgn of [1, -1]) { const n = along === 'x' ? V(0, 0, sgn) : V(sgn, 0, 0), t = V(n.z, 0, -n.x);
          for (let a = -L / 2 + RW / 2 + 0.6; a <= L / 2 - RW / 2 - 0.6; a += 0.5) { const pos = c.clone().addScaledVector(n, T / 2); if (along === 'x') pos.x += a; else pos.z += a; pos.y = 0; out.push({ m, pos, n, t, T, a, along, L, r: rnd() }); } } }
      out.sort((a, b) => a.r - b.r);
      for (const cd of out) { const { pos, n, t, T, m } = cd; const f = pos.clone().addScaledVector(n, 1.2);
        if (!walkable(f.x, f.z) || nearDoor(f.x, f.z, 1.5) || narrow(f.x, f.z, 3.0) || gates.some(g => Math.hypot(pos.x - g.x, pos.z - g.z) < 5) || Math.hypot(pos.x - start.x, pos.z - start.z) < 6) continue;
        if (!W.wallFits(pos.clone().setY(1.5).addScaledVector(n, 0.035), n, RW + 0.4, 2.6, undefined, 0.5)) continue;
        // behind: empty and not walkable
        const back = pos.clone().addScaledVector(n, -T); let ok = true;
        for (let u = -RW / 2 - 0.4; u <= RW / 2 + 0.4 && ok; u += 0.4) for (let d = 0.05; d <= RD + 0.5 && ok; d += 0.4) { const pt = back.clone().addScaledVector(t, u).addScaledVector(n, -d); if (walkable(pt.x, pt.z)) ok = false; }
        if (!ok) continue;
        const reg = new THREE.Box3(); const c1 = back.clone().addScaledVector(t, -RW / 2 - 0.4).addScaledVector(n, -0.02), c2 = back.clone().addScaledVector(t, RW / 2 + 0.4).addScaledVector(n, -RD - 0.5); reg.setFromPoints([c1.setY(0.02), c2.setY(RHt + 0.2)]);
        if (boxes.some(q2 => q2.m !== m && q2.b.intersectsBox(reg) && q2.s.y > 0.02)) continue;
        return cd; }
      return null; },
    // ---- colliders: the player (and agents) are pushed out of egg props
    addCollider(c) { colliders.push(c); stamp(c.x - c.r, c.x + c.r, c.z - c.r, c.z + c.r); recompute(); return c; },
    pushOut(p, rad = 0.35) { for (const c of colliders) { if (c.off || c.pass) continue; /* #244: the guide bot and its cart never block the player */ const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = c.r + rad; if (d < m && d > 1e-4) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; } } },
    // ---- navigation over the free grid (BFS + line-of-sight smoothing); R = agent radius
    // A* over the nav grid (8-neighbour, octile). Cells must be free with clearance >= rmin; cells with clearance below R are
    // allowed but cost more, so the route keeps to the middle of rooms and squeezes through doorways on their centreline
    // instead of treating a doorway narrower than 2R as a wall. o.fly: use the hover grid (ignores low plinths/benches).
    // Returns smoothed waypoints [from-cell, ..., to-cell] or null.
    path(from, to, R = 0.4, o = {}) { const F = o.fly ? freeHi : free, CL = o.fly ? clrHi : clr, rmin = Math.min(R, o.rmin != null ? o.rmin : 0.2);
      const ok = k => F[k] && CL[k] >= rmin, cost = k => 1 + (CL[k] < R ? 4 * (R - CL[k]) / R : 0) + (CL[k] < 1 ? 0.25 * (1 - CL[k]) : 0);
      const near = (x, z) => { const i0 = ci(x), j0 = cj(z); let b = -1, bd = 1e9; for (let dj = -6; dj <= 6; dj++) for (let di = -6; di <= 6; di++) { const i = i0 + di, j = j0 + dj; if (!inG(i, j) || !ok(j * NX + i)) continue; const d = di * di + dj * dj - (CL[j * NX + i] >= R ? 0.5 : 0); if (d < bd) { bd = d; b = j * NX + i; } } return b; };
      const A = near(from.x, from.z), B = near(to.x, to.z); if (A < 0 || B < 0) return null;
      const g = W._g && W._g.length === N ? W._g : (W._g = new Float32Array(N)), prev = W._p && W._p.length === N ? W._p : (W._p = new Int32Array(N)), shut = W._s && W._s.length === N ? W._s : (W._s = new Uint8Array(N));
      g.fill(Infinity); prev.fill(-1); shut.fill(0); const bi = B % NX, bj = (B / NX) | 0, hf = k => { const dx = Math.abs(k % NX - bi), dz = Math.abs(((k / NX) | 0) - bj); return dx + dz + (1.4142 - 2) * Math.min(dx, dz); };
      const hk = [], hv = []; const hpush = (k, v) => { let n = hk.length; hk.push(k); hv.push(v); while (n) { const pn = (n - 1) >> 1; if (hv[pn] <= v) break; hk[n] = hk[pn]; hv[n] = hv[pn]; n = pn; } hk[n] = k; hv[n] = v; };
      const hpop = () => { const top = hk[0], lk = hk.pop(), lv = hv.pop(); if (hk.length) { let n = 0; for (;;) { let c = 2 * n + 1; if (c >= hk.length) break; if (c + 1 < hk.length && hv[c + 1] < hv[c]) c++; if (hv[c] >= lv) break; hk[n] = hk[c]; hv[n] = hv[c]; n = c; } hk[n] = lk; hv[n] = lv; } return top; };
      g[A] = 0; prev[A] = A; hpush(A, hf(A)); let found = false, it = 0;
      while (hk.length && it++ < N * 2) { const k = hpop(); if (shut[k]) continue; shut[k] = 1; if (k === B) { found = true; break; } const i = k % NX, j = (k / NX) | 0;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const a = i + di, b = j + dj; if (!inG(a, b)) continue; const nk = b * NX + a; if (shut[nk] || !ok(nk) || (di && dj && (!ok(j * NX + a) || !ok(b * NX + i)))) continue;
          const ng = g[k] + (di && dj ? 1.4142 : 1) * cost(nk); if (ng < g[nk]) { g[nk] = ng; prev[nk] = k; hpush(nk, ng + hf(nk)); } } }
      if (!found) return null; const ks = []; for (let k = B; ; k = prev[k]) { ks.push(k); if (k === prev[k]) break; } ks.reverse();
      const pts = ks.map(k => V(cx(k % NX), 0, cz((k / NX) | 0))), pc = ks.map(k => CL[k]);
      // string-pulling: extend each straight leg while every cell under it is at least as clear as the grid path it replaces
      const clear = (a, b, thr) => { const n = Math.ceil(a.distanceTo(b) / 0.2); for (let s = 1; s < n; s++) { const x = a.x + (b.x - a.x) * s / n, z = a.z + (b.z - a.z) * s / n, k = W.cell(x, z); if (k < 0 || !F[k] || CL[k] < thr) return false; } return true; };
      const out = [pts[0]]; let k = 0; while (k < pts.length - 1) { let m = k + 1, thr = Math.min(R, pc[k], pc[m]); while (m + 1 < pts.length) { const t2 = Math.min(thr, pc[m + 1]); if (!clear(pts[k], pts[m + 1], t2)) break; thr = t2; m++; } out.push(pts[m]); k = m; }
      return out; },
    randomFree(R = 0.5, test) { for (let n = 0; n < 400; n++) { const k = (Math.random() * N) | 0; if (free[k] && clr[k] >= R) { const x = cx(k % NX), z = cz((k / NX) | 0); if (!test || test(x, z)) return V(x, 0, z); } } return null; },
    // longest straight open run (a "hall" for the sandworm): {a: Vector3, b: Vector3, width}
    longestRun(minW = 3) { let best = null; const consider = (a, b, w) => { const L = a.distanceTo(b); if (!best || L > best.L) best = { a, b, L, width: w }; };
      for (let j = 0; j < NZ; j += 2) { let s = -1; for (let i = 0; i <= NX; i++) { const ok = i < NX && free[j * NX + i] && clr[j * NX + i] >= minW / 2; if (ok && s < 0) s = i; if (!ok && s >= 0) { consider(V(cx(s), 0, cz(j)), V(cx(i - 1), 0, cz(j)), minW); s = -1; } } }
      for (let i = 0; i < NX; i += 2) { let s = -1; for (let j = 0; j <= NZ; j++) { const ok = j < NZ && free[j * NX + i] && clr[j * NX + i] >= minW / 2; if (ok && s < 0) s = j; if (!ok && s >= 0) { consider(V(cx(i), 0, cz(s)), V(cx(i), 0, cz(j - 1)), minW); s = -1; } } }
      return best; },
  };
  return W;
}
