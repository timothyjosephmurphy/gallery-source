// #251 garden: build a `tags` hooks object (HOOKS.md shape) from layout.json, for the harness and tests
// when window.game.tags is not available. keepClear() follows the HOOKS.md / doorcheck rules.
const WALL_H = 4.2, DOOR_W = 1.6, DOOR_H = 2.6, DOOR_DEPTH = 1.2, ART_ZONE = 1.4;
const hexPoly = (c, R) => [...Array(6)].map((_, k) => { const a = (60 * k - 30) * Math.PI / 180; return [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a)]; });
const bounds = (p) => ({ minX: Math.min(...p.map(q => q[0])), maxX: Math.max(...p.map(q => q[0])), minZ: Math.min(...p.map(q => q[1])), maxZ: Math.max(...p.map(q => q[1])) });

// Distance from point to a segment, and circle-vs-oriented-rectangle test.
function segDist(px, pz, x0, z0, x1, z1) { const dx = x1 - x0, dz = z1 - z0, L = dx * dx + dz * dz || 1e-9; let t = ((px - x0) * dx + (pz - z0) * dz) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - x0 - t * dx, pz - z0 - t * dz); }
function circleRect(x, z, r, cx, cz, ux, uz, hu, hv) { const dx = x - cx, dz = z - cz, u = dx * ux + dz * uz, v = -dx * uz + dz * ux; const qu = Math.max(-hu, Math.min(hu, u)), qv = Math.max(-hv, Math.min(hv, v)); return Math.hypot(u - qu, v - qv) < r; }

export function makeKeepClear(tags) {
  return (x, z, r) => {
    for (const d of tags.doors) if (circleRect(x, z, r, d.x, d.z, d.nx, d.nz, DOOR_DEPTH, d.width / 2)) return false; // width x 1.2 m each side
    for (const p of tags.paths) {
      if (p.r0 != null) { const q = Math.hypot(x - p.x, z - p.z); if (q + r > p.r0 && q - r < p.r1) return false; }
      else if (segDist(x, z, p.x0, p.z0, p.x1, p.z1) < p.width / 2 + r) return false;
    }
    for (const a of tags.art) { const L = Math.hypot(a.ix, a.iz) || 1, ix = a.ix / L, iz = a.iz / L; if (circleRect(x, z, r, a.x + ix * ART_ZONE / 2, a.z + iz * ART_ZONE / 2, ix, iz, ART_ZONE / 2, a.w / 2 + 0.1)) return false; }
    for (const c of tags.colliders) if (Math.hypot(x - c.x, z - c.z) < r + c.r) return false;
    return true;
  };
}

export function tagsFromLayout(L, THREE, scene = null, tier = 'medium') {
  const rooms = [], doors = [], paths = [], art = [], colliders = [];
  const room = (id, label, kind, center, radius, extra = {}) => { const poly = hexPoly(center, radius); rooms.push({ id, label, kind, center, radius, apothem: radius * Math.sqrt(3) / 2, poly, bounds: bounds(poly), wallH: WALL_H, ...extra }); };
  for (const r of L.rooms) {
    room(r.id, r.label, 'room', r.center, r.radius);
    for (const k of r.doorWalls) {
      const a = 60 * k * Math.PI / 180, nx = Math.cos(a), nz = Math.sin(a), off = (r.doorOffsets || {})[k] || 0;
      doors.push({ x: r.center[0] + r.apothem * nx - off * nz, z: r.center[1] + r.apothem * nz + off * nx, nx, nz, width: DOOR_W, height: DOOR_H, room: r.id, to: (r.neighbours || {})[k] || null, kind: k === r.innerDoorWall ? 'inner' : 'room' });
    }
  }
  const courtPaths = (c) => {
    for (const f of c.fountainPaths || []) paths.push({ x: f.x, z: f.z, r0: f.r0, r1: f.r1, court: c.id });
    const f0 = (c.fountains || [])[0] || { x: c.center[0], z: c.center[1] };
    for (const s of c.spokes || []) paths.push({ x0: s.x0 ?? f0.x, z0: s.z0 ?? f0.z, x1: s.x1, z1: s.z1, width: s.width, court: c.id });
  };
  for (const c of L.courtyards || []) { room(c.id, c.id, 'court', c.center, c.radius); courtPaths(c); }
  for (const c of L.outerCourts || []) { room(c.id, c.label || c.id, 'outer', c.center, c.radius); courtPaths(c); for (const m of c.art || []) if (m.x != null) art.push({ x: m.x, y: m.y ?? 1.6, z: m.z, ix: m.ix ?? 0, iz: m.iz ?? 1, w: m.w, h: m.h }); }
  if (L.hub) room('hub', L.hub.label, 'hub', L.hub.center, L.hub.radius, { coreRadius: L.hub.coreRadius, columnRing: L.hub.columnRing });
  for (const h of L.halls || []) if (h.p0 && h.p1) paths.push({ x0: h.p0[0], z0: h.p0[1], x1: h.p1[0], z1: h.p1[1], width: h.width || 2 });
  for (const c of L.corridors || []) if (c.p0 && c.p1) paths.push({ x0: c.p0[0], z0: c.p0[1], x1: c.p1[0], z1: c.p1[1], width: c.width || 1.6 });
  for (const p of L.paintings || []) { art.push({ x: p.x, y: p.y, z: p.z, ix: p.ix, iz: p.iz, w: p.fw || p.w, h: p.fh || p.h }); if (p.plaque) art.push({ x: p.plaque.x, y: p.plaque.y, z: p.plaque.z, ix: p.ix, iz: p.iz, w: p.plaque.w, h: p.plaque.h, plaque: true }); }
  const tags = { ready: true, rooms, doors, paths, art, colliders, tier, scene, THREE };
  tags.keepClear = makeKeepClear(tags);
  tags.addCollider = (c) => colliders.push(c);
  return tags;
}
