// #251 garden: shared helpers (original procedural code, TJ Murphy gallery). No external assets.
export const TAU = Math.PI * 2;

// Bake a geometry into world space with a flat vertex colour, then merge many into one (one draw call).
export function bake(THREE, geo, matrix, color) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  g.applyMatrix4(matrix);
  const n = g.attributes.position.count, c = new Float32Array(n * 3), col = new THREE.Color(color);
  for (let i = 0; i < n; i++) { c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k);
  return g;
}
export function merge(THREE, geos) {
  let n = 0; for (const g of geos) n += g.attributes.position.count;
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3); let o = 0;
  for (const g of geos) { P.set(g.attributes.position.array, o); N.set(g.attributes.normal.array, o); C.set(g.attributes.color.array, o); o += g.attributes.position.count * 3; g.dispose(); }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(P, 3)); m.setAttribute('normal', new THREE.BufferAttribute(N, 3)); m.setAttribute('color', new THREE.BufferAttribute(C, 3));
  m.computeBoundingSphere(); return m;
}
export function M(THREE, { x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1 } = {}) {
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));
}
// Small deterministic RNG so every build looks the same.
export function rng(seed = 251) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
export const tierOf = (tags) => tags.tier || 'medium';

// Footprint record for the doorway check: a solid circle on the x-z plane.
export function fp(x, z, r, kind, id, yMin = 0, yMax = 3) { return { x: +x.toFixed(3), z: +z.toFixed(3), r: +r.toFixed(3), kind, id, yMin, yMax }; }
