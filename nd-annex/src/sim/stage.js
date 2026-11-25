// 871 (TJ 9:37 PM): Room 1 stage variation — two speaker stacks, a raised stage (with a front step) and two
// tiered risers at the back of the crowd (balcony side). Room-1-local metres; y = top surface height.
// Every perch rect sits inside both phones' stereo wedge so perched pins still triangulate.
export const SURFACES = [
  // risers at the BACK of the crowd (balcony side, +z), rising away from the booth/cameras so they never block the front rows
  { id: 'riser1', kind: 'riser', x0: -3.2, x1: 1.2, z0: 2.6, z1: 3.15, y: 0.25 },
  { id: 'riser2', kind: 'riser', x0: -3.2, x1: 1.2, z0: 3.15, z1: 3.7, y: 0.5 },
  { id: 'stage', kind: 'stage', x0: 1.0, x1: 3.4, z0: 0.6, z1: 2.0, y: 0.45 },
  { id: 'stageStep', kind: 'step', x0: 1.4, x1: 3.0, z0: 2.0, z1: 2.35, y: 0.22 },
  { id: 'spkL', kind: 'speaker', x0: -3.15, x1: -2.35, z0: 0.0, z1: 0.8, y: 0.9 },
  { id: 'spkR', kind: 'speaker', x0: 2.7, x1: 3.5, z0: 3.0, z1: 3.8, y: 0.9 },
];
// perched dancers (by dancer index) -> surface + inset; they wander only inside the inset top (feet never past an edge)
export const PERCHES = [
  { i: 1, s: 'spkL', inset: 0.3 }, { i: 12, s: 'spkR', inset: 0.3 },
  { i: 4, s: 'stage', inset: 0.32 }, { i: 6, s: 'stage', inset: 0.32 },
  { i: 9, s: 'riser1', inset: 0.22 }, { i: 3, s: 'riser2', inset: 0.22 }, { i: 11, s: 'riser2', inset: 0.22 },
];
export const byId = Object.fromEntries(SURFACES.map(s => [s.id, s]));
export function surfaceAt(x, z) { let y = 0; for (const s of SURFACES) if (x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1 && s.y > y) y = s.y; return y; }
// any footprint (with margin) — floor dancers keep out
export function inFootprint(x, z, m = 0) { for (const s of SURFACES) if (x > s.x0 - m && x < s.x1 + m && z > s.z0 - m && z < s.z1 + m) return s; return null; }
export function perchFor(i) { const p = PERCHES.find(q => q.i === i); if (!p) return null; const s = byId[p.s];
  // dancers sharing a surface each get their own slot (split along x) so they never stack on one spot
  const mates = PERCHES.filter(q => q.s === p.s), j = mates.indexOf(p), n = mates.length, sw = (s.x1 - s.x0) / n, sx0 = s.x0 + j * sw, sx1 = sx0 + sw;
  const insX = Math.min(p.inset, sw / 2 - 0.01), insZ = Math.min(p.inset, (s.z1 - s.z0) / 2 - 0.01);
  return { id: s.id, y: s.y, x0: sx0 + insX, x1: sx1 - insX, z0: s.z0 + insZ, z1: s.z1 - insZ }; }
export const clampTo = (r, p) => [Math.max(r.x0, Math.min(r.x1, p[0])), Math.max(r.z0, Math.min(r.z1, p[1]))];
// nearest point just outside every footprint (margin m) — used to place / eject floor dancers
export function exitFootprint(x, z, m = 0.5) { for (let k = 0; k < 6; k++) { const s = inFootprint(x, z, m); if (!s) break;
  const opts = [[s.x0 - m - 0.01, z, x - (s.x0 - m)], [s.x1 + m + 0.01, z, (s.x1 + m) - x], [x, s.z0 - m - 0.01, z - (s.z0 - m)], [x, s.z1 + m + 0.01, (s.z1 + m) - z]].sort((a, b) => a[2] - b[2]);
  [x, z] = opts[0]; } return [x, z]; }
