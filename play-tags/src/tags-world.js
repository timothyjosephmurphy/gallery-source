import { MUSEUM } from './museum.config.js'; // #284 plainCourts
// #251 tag gallery: pure geometry (no three.js) shared by the scene (tags.js) and the build-time doorway check (tools/doorcheck.mjs).
// Source of truth: tag-gallery/data/layout.json v4. x-z plane, metres.
export const PILLAR_W = 2.2, PILLAR_D = 1.0; // #278: the one central pillar (checkout portal on its +x face)
// #300 (TJ): wider, round-arched doorways. Straight jambs rise to DOOR_SPRING, then a semicircular arch (radius DOOR_W / 2) closes the top at DOOR_H.
export const DOOR_W = 2.2, DOOR_SPRING = 2.4, DOOR_H = DOOR_SPRING + DOOR_W / 2; // apex 3.5 m under the 4.2 m wall
export const FULL_SPRING = 2.6, FULL_APEX = 3.7; // #777 (TJ): full-width doorways: elliptical arch spanning the wall, crown 3.7 m under the 4.2 m wall
export const LANE_W = 1.6; // walkway lanes keep their original width (#300 widened doorways only)
export const WALL_H = 4.2, WT = 0.16, CORE_R = 4.6, RING_R = 9, MARGIN = 0.32;
const D = Math.PI / 180;
const segDist = (px, pz, x0, z0, x1, z1) => { const dx = x1 - x0, dz = z1 - z0, L2 = dx * dx + dz * dz || 1e-9; let t = ((px - x0) * dx + (pz - z0) * dz) / L2; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - x0 - t * dx, pz - z0 - t * dz); };
export { segDist };
export function makeWorld(T, paintings = []) {
  const rooms = [], doors = [], paths = [], rings = [], walls = [], colliders = [], art = [], arcs = [];
  const ROT = T.wallRot || 0; /* #778: revised nest plan rotated +30 deg: wall k normal at 60k+ROT */
  const hexPoly = (c, R) => [...Array(6)].map((_, i) => { const a = (60 * i - 30 + ROT) * D; return [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a)]; });
  const bounds = p => ({ minX: Math.min(...p.map(q => q[0])), maxX: Math.max(...p.map(q => q[0])), minZ: Math.min(...p.map(q => q[1])), maxZ: Math.max(...p.map(q => q[1])) });
  // ---- hex gallery rooms: 6 walls each, doors cut where layout.json puts them
  const doorKey = new Map();
  for (const r of T.rooms) {
    const poly = hexPoly(r.center, r.radius);
    rooms.push({ id: r.id, label: r.label, kind: 'room', center: r.center, radius: r.radius, apothem: r.apothem, poly, bounds: bounds(poly), wallH: WALL_H, src: r });
    for (let k = 0; k < 6; k++) {
      const th = (60 * k + ROT) * D, n = [Math.cos(th), Math.sin(th)], t = [-n[1], n[0]], m = [r.center[0] + r.apothem * n[0], r.center[1] + r.apothem * n[1]], h = r.radius / 2;
      const cuts = [];
      if (r.doorWalls.includes(k)) { const o = r.doorOffsets[String(k)] ?? 0, dw = (r.doorWidths || {})[String(k)] ?? DOOR_W; cuts.push([o, dw]); /* #777 per-wall width: full-width arches */ const x = m[0] + o * t[0], z = m[1] + o * t[1], key = (Math.round(x * 10) / 10).toFixed(1) + ',' + (Math.round(z * 10) / 10).toFixed(1); /* #778: -0.0 vs 0.0 must not double a door */
        const to = (r.neighbours || {})[String(k)] || (k === r.innerDoorWall ? 'courtyard' : 'outer');
        if (!doorKey.has(key)) { doorKey.set(key, 1); doors.push({ x, z, nx: n[0], nz: n[1], width: dw, height: dw > DOOR_W + 0.01 ? FULL_APEX : DOOR_H, spring: dw > DOOR_W + 0.01 ? FULL_SPRING : DOOR_SPRING, rise: dw > DOOR_W + 0.01 ? FULL_APEX - FULL_SPRING : undefined, full: dw > DOOR_W + 0.01, room: r.id, to, kind: to === 'courtyard' ? 'inner' : to === 'outer' ? 'outer' : 'room' }); } }
      let s0 = -h; for (const [o, dw] of cuts.sort((a, b) => a[0] - b[0])) { if (o - dw / 2 > s0 + 0.01) walls.push(seg(m, t, n, s0, o - dw / 2, r.id, k)); s0 = o + dw / 2; }
      if (h > s0 + 0.01) walls.push(seg(m, t, n, s0, h, r.id, k));
    } }
  function seg(m, t, n, a, b, room, k) { return { x0: m[0] + a * t[0], z0: m[1] + a * t[1], x1: m[0] + b * t[0], z1: m[1] + b * t[1], nx: n[0], nz: n[1], h: WALL_H, room, k }; }
  // ---- central pavilion: core round wall (gates + checkout on its inner face), openings, outer column ring
  const H = T.hub, openA = [60, 120, 180, 240, 300];
  rooms.push({ id: 'hub', label: H.label, kind: 'hub', center: [0, 0], radius: RING_R, apothem: RING_R, poly: hexPoly([0, 0], RING_R), bounds: bounds(hexPoly([0, 0], RING_R)), wallH: 5.2 });
  // #278 (TJ): no enclosed core room and no wall portals: the pavilion is open, with ONE pillar in the centre that carries
  // only the checkout portal (on its +x face). #273: the museum gates are gone.
  const gates = H.gates.filter(g => g.id === 'checkout').map(g => ({ ...g, x: PILLAR_D / 2 + 0.02, z: 0, nx: 1, nz: 0, a: 0 })), niches = [];
  for (const g of gates) doors.push({ x: g.x, z: g.z, nx: g.nx, nz: g.nz, width: 1.8, height: DOOR_H, room: 'hub', to: g.id, kind: 'gate', active: g.active !== false, oneSided: true });
  // core wall arcs between openings (each opening 1.8 m of arc)
  const half = 0; // #278: no core wall arcs any more
  // ---- inner courtyards (peristyle gardens with fountains) + their spokes
  for (const c of T.courtyards) {
    rooms.push({ id: c.id, label: 'Garden court', kind: 'court', fountains: c.fountains, center: c.center, radius: c.radius, apothem: c.radius * 0.866, poly: hexPoly(c.center, c.radius), bounds: bounds(hexPoly(c.center, c.radius)), wallH: 0 });
    if (!MUSEUM.plainCourts) for (const f of c.fountains) colliders.push({ x: f.x, z: f.z, r: f.r, kind: 'fountain' }); // #284: plain green courts
    for (const f of c.fountainPaths) rings.push({ x: f.x, z: f.z, r0: f.r0, r1: f.r1, court: c.id });
    for (const s of c.spokes) { const dx = s.x1 - c.center[0], dz = s.z1 - c.center[1], L = Math.hypot(dx, dz), r0 = c.fountainPaths[0].r0; paths.push({ x0: c.center[0] + dx / L * r0, z0: c.center[1] + dz / L * r0, x1: s.x1, z1: s.z1, width: s.width, court: c.id }); }
    const a = Math.atan2(c.center[1], c.center[0]); // lane from the pavilion core out to this courtyard's fountain ring
    paths.push({ x0: 2.0 * Math.cos(a), z0: 2.0 * Math.sin(a), x1: c.center[0] - Math.cos(a) * c.fountainPaths[0].r1, z1: c.center[1] - Math.sin(a) * c.fountainPaths[0].r1, width: LANE_W });
  }
  // lane from each room's inner (courtyard-side) door to the nearest courtyard ring
  if (T.courtyards.length) for (const d of doors.filter(d => d.kind === 'inner')) { let best = null, bd = 1e9; for (const c of T.courtyards) { const q = Math.hypot(d.x - c.center[0], d.z - c.center[1]); if (q < bd) { bd = q; best = c; } }
    const r1 = best.fountainPaths[0].r1, ux = (d.x - best.center[0]) / bd, uz = (d.z - best.center[1]) / bd; paths.push({ x0: best.center[0] + ux * r1, z0: best.center[1] + uz * r1, x1: d.x + d.nx * 1.2, z1: d.z + d.nz * 1.2, width: LANE_W }); }
  // ---- outer courts (murals, Neural Dance wall, brass plates)
  const outer = [];
  for (const o of T.outerCourts) { if (o.virtual) { for (const a of o.art) art.push({ id: a.id, kind: a.kind, x: a.x + a.wallFacing[0] * 0.03, y: a.y, z: a.z + a.wallFacing[1] * 0.03, ix: a.wallFacing[0], iz: a.wallFacing[1], w: a.w, h: a.h, src: a, room: a.room || null }); continue; } /* #777 no outer court: art carrier only */
    const poly = hexPoly(o.center, o.radius); rooms.push({ id: o.id, label: o.id === 'friends-court' ? 'Friends Court' : 'Cormorant Garden', kind: 'outer', fountains: o.fountains, center: o.center, radius: o.radius, apothem: o.radius * 0.866, poly, bounds: bounds(poly), wallH: 0 });
    if (!MUSEUM.plainCourts) for (const f of o.fountains) colliders.push({ x: f.x, z: f.z, r: f.r, kind: 'fountain' });
    for (const f of o.fountainPaths || []) rings.push({ x: f.x, z: f.z, r0: f.r0, r1: f.r1, court: o.id });
    const fp = (o.fountainPaths || [])[0];
    for (const s of o.spokes) { const dx = s.x1 - s.x0, dz = s.z1 - s.z0, L = Math.hypot(dx, dz), r0 = fp ? fp.r0 : 0; paths.push({ x0: s.x0 + dx / L * r0, z0: s.z0 + dz / L * r0, x1: s.x1, z1: s.z1, width: s.width, court: o.id }); }
    const freeWalls = [];
    for (const a of o.art) if (a.wallCenter) { const [fx, fz] = a.wallFacing, t = [-fz, fx], L = a.wallLength + 0, cx = a.wallCenter[0] - fx * WT / 2, cz = a.wallCenter[1] - fz * WT / 2;
      freeWalls.push({ id: a.id, x0: cx - t[0] * L / 2, z0: cz - t[1] * L / 2, x1: cx + t[0] * L / 2, z1: cz + t[1] * L / 2, nx: fx, nz: fz, h: Math.max(3.4, a.y + a.h / 2 + 0.6), room: o.id, free: true }); }
    walls.push(...freeWalls); outer.push({ ...o, freeWalls });
    for (const a of o.art) { let x = a.x, z = a.z; if (x == null) { x = a.wallCenter[0]; z = a.wallCenter[1]; }
      const host = a.wallCenter ? a : o.art.find(b => b.id === a.onWallOf); // project onto the host wall face
      if (host && host.wallCenter) { const [fx, fz] = host.wallFacing, d = (x - host.wallCenter[0]) * fx + (z - host.wallCenter[1]) * fz; x -= d * fx; z -= d * fz; }
      art.push({ id: a.id, kind: a.kind, x: x + a.wallFacing[0] * 0.03, y: a.y, z: z + a.wallFacing[1] * 0.03, ix: a.wallFacing[0], iz: a.wallFacing[1], w: a.w, h: a.h, src: a, room: o.id }); }
  }
  // #779 (TJ): open-air courts (the H1 courtyard trapezoid): walkable polygon floor + freestanding walls; art rides the virtual carrier
  const polys = [];
  for (const oc of T.openCourts || []) { polys.push(oc.poly); rooms.push({ id: oc.id, label: oc.label, kind: 'outer', open: true, fountains: [], center: oc.center, radius: oc.radius, apothem: oc.radius * 0.866, poly: oc.poly, bounds: bounds(oc.poly), wallH: 0 });
    for (const w of oc.walls || []) walls.push({ x0: w.x0, z0: w.z0, x1: w.x1, z1: w.z1, nx: w.nx, nz: w.nz, h: (typeof w.h === 'number' ? w.h : WALL_H) /* #833 per-wall height */, room: oc.id, id: w.id, free: true, container: !!w.container /* #780 drawn as a shipping container */, kino800: !!w.kino800 /* #800 drawn by kino800.js */, low801: !!w.low801 /* #801 low parapet */ });
    for (const d of oc.doors800 || []) doors.push({ ...d, height: DOOR_H, spring: DOOR_SPRING }); /* #800 Paul market -> Kinoteka */
    for (const k of (oc.kino800 || {}).cols || []) colliders.push({ x: k.at[0], z: k.at[1], r: k.r, kind: 'kino800-column' }); }
  for (const p of paintings) { art.push({ id: p.id, kind: 'painting', x: p.x, y: p.y, z: p.z, ix: p.ix, iz: p.iz, w: p.fw, h: p.fh, room: p.room, src: p });
    if (false && p.plaqueAt) art.push({ id: p.id + ':plaque', kind: 'plaque', x: p.plaqueAt.x, y: p.plaqueAt.y || 1.45, z: p.plaqueAt.z, ix: p.ix, iz: p.iz, w: p.plaqueAt.w, h: p.plaqueAt.h, room: p.room }); }
  // a spoke that runs into a room wall with no door there stops 0.6 m short of it
  for (const p of paths) for (const w of walls) { const L = Math.hypot(p.x1 - p.x0, p.z1 - p.z0); for (let t = 0; t <= L; t += 0.1) { const x = p.x0 + (p.x1 - p.x0) * t / L, z = p.z0 + (p.z1 - p.z0) * t / L;
    if (segDist(x, z, w.x0, w.z0, w.x1, w.z1) < p.width / 2 && !doors.some(d => Math.hypot(d.x - x, d.z - z) < 1.2)) { const k = Math.max(0, t - 0.6) / L; p.x1 = p.x0 + (p.x1 - p.x0) * k; p.z1 = p.z0 + (p.z1 - p.z0) * k; p.cut = 1; break; } } }
  // ---- clearance tests
  const inDoorZone = (x, z, r) => doors.some(d => { const tx = -d.nz, tz = d.nx, u = (x - d.x) * tx + (z - d.z) * tz, v = (x - d.x) * d.nx + (z - d.z) * d.nz;
    return Math.abs(u) < d.width / 2 + r && v < 1.2 + r && v > (d.oneSided ? -0.2 : -1.2 - r); });
  const inDoorZone1 = (d, x, z, r) => { const tx = -d.nz, tz = d.nx, u = (x - d.x) * tx + (z - d.z) * tz, v = (x - d.x) * d.nx + (z - d.z) * d.nz; return Math.abs(u) < d.width / 2 + r && v < 1.2 + r && v > (d.oneSided ? -0.2 : -1.2 - r); };
  const inPath = (x, z, r) => paths.some(p => segDist(x, z, p.x0, p.z0, p.x1, p.z1) < p.width / 2 + r) || rings.some(g => { const q = Math.hypot(x - g.x, z - g.z); return q > g.r0 - r && q < g.r1 + r; });
  const inView = (x, z, r) => art.some(a => { const tx = a.iz, tz = -a.ix, u = (x - a.x) * tx + (z - a.z) * tz, v = (x - a.x) * a.ix + (z - a.z) * a.iz; return Math.abs(u) < a.w / 2 + r && v > -0.05 && v < 1.4 + r; });
  const keepClear = (x, z, r) => !inDoorZone(x, z, r) && !inPath(x, z, r) && !inView(x, z, r);
  // #288 (TJ): every exterior room entrance gets splayed returns on its OUTSIDE face only (#277: interiors and hung walls untouched),
  // and a centre-to-door ray (drawn as a walkway; #295 reuses the same rays for its sunburst). Flare ends are thin colliders.
  const flares = [], rays = [];
  const NO_FLARES758 = true; // #758 (TJ Oct 27 2026): stone flanges (splayed returns) beside every courtyard door/arch removed; walkway rays kept
  for (const d of doors.filter(d => (d.kind === 'inner' || d.kind === 'outer') && !d.full)) { /* #777: full-width arches have no splayed returns */ const r = T.rooms.find(q => q.id === d.room); let ox = d.x - r.center[0], oz = d.z - r.center[1]; const L = Math.hypot(ox, oz) || 1; ox /= L; oz /= L;
    const tx = -oz, tz = ox; for (const sd of [-1, 1]) { const ax = d.x + tx * sd * (d.width / 2 + 0.12), az = d.z + tz * sd * (d.width / 2 + 0.12), bx = ax + ox * 0.55 + tx * sd * 0.4, bz = az + oz * 0.55 + tz * sd * 0.4;
      if (inPath(bx, bz, 0.12) || inPath((ax + bx) / 2, (az + bz) / 2, 0.08) || doors.some(o => o !== d && (inDoorZone1(o, bx, bz, 0.12) || inDoorZone1(o, (ax + bx) / 2, (az + bz) / 2, 0.08)))) continue; /* #300: never into a neighbouring door zone */ if (!NO_FLARES758) { flares.push({ door: d, x0: ax, z0: az, x1: bx, z1: bz }); colliders.push({ x: bx, z: bz, r: 0.1, kind: 'flare' }); } }
    if (d.kind === 'inner') rays.push({ room: d.room, x0: 0, z0: 0, x1: d.x + ox * 0.6, z1: d.z + oz * 0.6, width: 1.5 }); }
  // #291 wall map board (posts) beside the checkout platform, between the room rays
  /* #295: the wall map moved flat onto an outer wall, so no kiosk posts here any more */ if (false) { const A = 95 * Math.PI / 180, R = 5.6, fx = Math.cos(A), fz = Math.sin(A), tx = -fz, tz = fx; for (const sd of [-1, 1]) colliders.push({ x: fx * (R + 0.08) + tx * sd * 0.6, z: fz * (R + 0.08) + tz * sd * 0.6, r: 0.62, kind: 'wallmap' }); }
  // ---- columns: pavilion ring, courtyard peristyles, outer-court colonnades; any that would stand in a door, path or view zone is left out
  const columns = [], skipped = []; const NO_COLUMNS = true; // #288 (TJ): no exterior columns or colonnades; rooms keep their domes
  // #284: from the start (beside the checkout pillar) every doorway within 20 m stays in clear view: no column on that sightline
  const START = [2.6, 1.9], sight = MUSEUM.plainCourts ? doors.filter(d => Math.hypot(d.x - START[0], d.z - START[1]) < 20).map(d => [START[0], START[1], d.x, d.z]) : [];
  const onSight = (x, z, r) => sight.some(q => segDist(x, z, q[0], q[1], q[2], q[3]) < r + 0.45);
  const col = (x, z, r, kind) => { if (NO_COLUMNS) { skipped.push({ x, z, kind: kind + ':removed-288' }); return; } if (keepClear(x, z, r + 0.15) && !onSight(x, z, r)) columns.push({ x, z, r, kind }); else skipped.push({ x, z, kind }); };
  { const n = Math.round(2 * Math.PI * RING_R / H.columnRing.every); for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * 2 * Math.PI; col(RING_R * Math.cos(a), RING_R * Math.sin(a), H.columnRing.dia / 2, 'pavilion'); } }
  for (const c of T.courtyards) { const p = c.peristyle, n = Math.round(2 * Math.PI * c.radius / p.columnEvery); for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * 2 * Math.PI; col(c.center[0] + c.radius * Math.cos(a), c.center[1] + c.radius * Math.sin(a), p.columnDia / 2, 'peristyle'); } }
  for (const o of T.outerCourts) for (const k of o.colonnadeSides || []) { const poly = hexPoly(o.center, o.radius * 0.8), A = poly[k], B = poly[(k + 1) % 6], L = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.floor(L / 2);
    for (let i = 0; i <= n; i++) { const t = i / n; col(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, 0.17, 'colonnade'); } }
  if (!MUSEUM.plainCourts) for (const c of T.courtyards) for (const b of c.beds) if (keepClear(b.x, b.z, b.r + 0.1)) colliders.push({ x: b.x, z: b.z, r: b.r, kind: 'bed' }); else skipped.push({ x: b.x, z: b.z, kind: 'bed' });
  for (const c of columns) colliders.push({ x: c.x, z: c.z, r: c.r, kind: 'column:' + c.kind });
  // ---- walkable floor
  const cells = [[0, 0, RING_R + 1.2], ...T.courtyards.map(c => [c.center[0], c.center[1], 6.6]), ...T.rooms.map(r => [r.center[0], r.center[1], r.radius + 1.6]), ...T.outerCourts.filter(o => !o.virtual).map(o => [o.center[0], o.center[1], o.radius * 0.95]), ...(T.grounds ? [[T.grounds.center[0], T.grounds.center[1], T.grounds.radius]] : [])]; // #774 honeycomb: open lawn round the rooms
  const extra = [];
  // #352: a low fence round the outer edge of the walkable ground (every cell arc that no other cell covers), so nobody walks off into the void
  const fences = [], FIN = 0.25, inCell = (x, z, skip) => cells.some((c, j) => j !== skip && Math.hypot(x - c[0], z - c[1]) < c[2] - 0.05) || polys.some(P => inPoly(x, z, P)); /* #779 open courts */
  cells.forEach(([cx, cz, r], i) => { const N = Math.max(24, Math.round(r * 6)), R = r - FIN; let prev = null;
    for (let k = 0; k <= N; k++) { const a = k / N * Math.PI * 2, x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R, out = !inCell(cx + Math.cos(a) * r, cz + Math.sin(a) * r, i) && !inCell(x, z, i);
      if (out && prev) fences.push({ x0: prev[0], z0: prev[1], x1: x, z1: z, cell: i }); prev = out ? [x, z] : null; } });
  for (const oc of T.openCourts || []) for (const f of oc.fences || []) fences.push({ x0: f.x0, z0: f.z0, x1: f.x1, z1: f.z1, court: oc.id, id: f.id, wood: !!f.wood, iron811: !!f.iron811 }); // #785 START outer-edge fence (#786 wood = patio fence, drawn by west786)
  for (const oc of T.openCourts || []) { for (const f of (oc.patio || {}).furniture || []) colliders.push({ x: f.at[0], z: f.at[1], r: f.r, kind: 'patio:' + f.kind }); if (oc.fountain) colliders.push({ x: oc.fountain.at[0], z: oc.fountain.at[1], r: oc.fountain.r, kind: 'fountain786' }); } // #786
  for (const oc of T.openCourts || []) for (const b of oc.booths798 || []) for (const r of b.racks) if (r.side !== 'back') { const L = Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]), n = Math.ceil(L / 0.3); for (let i = 0; i <= n; i++) colliders.push({ x: r.a[0] + (r.b[0] - r.a[0]) * i / n, z: r.a[1] + (r.b[1] - r.a[1]) * i / n, r: 0.08, kind: 'booth798' }); } // #798 Paul market side racks
  function walkable(x, z) {
    for (const f of extra) if (f(x, z)) return true;
    if (!cells.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r) && !polys.some(P => inPoly(x, z, P))) return false; // #779 open courts
    for (const w of walls) if (segDist(x, z, w.x0, w.z0, w.x1, w.z1) < MARGIN) return false;
    for (const w of fences) if (segDist(x, z, w.x0, w.z0, w.x1, w.z1) < MARGIN) return false; // #352 fence
    if (Math.hypot(x, z) < 0.7) return false; // #290: the checkout bubble's core (touching it at r < 1.2 checks out)
    for (const c of colliders) if (Math.hypot(x - c.x, z - c.z) < c.r + MARGIN) return false;
    return true; }
  function roomAt(x, z) { for (const r of rooms) if (r.kind === 'room' && inPoly(x, z, r.poly)) return r; if (Math.hypot(x, z) < RING_R + 1) return rooms.find(r => r.id === 'hub'); let b = null, bd = 1e9; for (const r of rooms) { const d = Math.hypot(x - r.center[0], z - r.center[1]); if (d < bd) { bd = d; b = r; } } return b; }
  return { flares, rays, T, rooms, doors, paths, rings, walls, arcs, colliders, columns, skipped, art, gates, niches, outer, keepClear, inDoorZone, inPath, inView, walkable, roomAt, extra, fences, openA, hexPoly };
}
export function inPoly(x, z, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; }
