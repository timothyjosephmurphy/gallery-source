// #786 (TJ, refs gallery-tj-feedback/garden-mural-fountain-court/): the two west open-air courts.
// Garden Patio (NW, off H3): flagstone floor, low see-through wood fence on the outer edge with a taller board panel carrying the Cormorant mural + QR plate,
// wicker sofa + 2 chairs + coffee table, low shrubs/grasses along the fence base. Fountain Courtyard (SW, off H8): a round stone fountain placeholder.
// Original procedural low-poly meshes. Data: catalog openCourts[].patio / .fountain; colliders are added in tags-world.js.
import * as THREE from 'three';
export function installWest786(root, W, T, low) {
  const out = { patio: 0, fountain: 0, fence: 0 }, box = new THREE.BoxGeometry(1, 1, 1), M = (c, r = 0.85, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const wood = M(0x8a6040), woodD = M(0x5e3f28), wick = M(0x9c7a4e, 0.95), cush = M(0xe9e2d2, 0.95), stone = M(0xa8a196), glass = M(0x30383c, 0.15, 0.4), leaf = M(0x4f6b34, 0.95), grass = M(0x8b8a4a, 0.95);
  const G = (x, z, yaw) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; root.add(g); return g; };
  const add = (g, mat, sx, sy, sz, x, y, z, geo = box) => { const m = new THREE.Mesh(geo, mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); g.add(m); return m; };
  const yawOf = f => Math.atan2(f[0], f[1]); // local +z faces f
  // ---- low wood fence (horizontal boards with gaps, posts every 2 m): see the mountains over it
  for (const f of (W.fences || []).filter(f => f.wood)) { const L = Math.hypot(f.x1 - f.x0, f.z1 - f.z0), g = G((f.x0 + f.x1) / 2, (f.z0 + f.z1) / 2, -Math.atan2(f.z1 - f.z0, f.x1 - f.x0));
    for (const y of [0.22, 0.52, 0.82, 1.1]) add(g, wood, L, 0.16, 0.035, 0, y, 0);
    for (let i = 0, n = Math.ceil(L / 2); i <= n; i++) add(g, woodD, 0.09, 1.25, 0.09, -L / 2 + i * L / n, 0.625, 0); out.fence++; }
  for (const oc of T.openCourts || []) {
    const P = oc.patio; if (P) {
      // flagstone floor: canvas texture on the court polygon
      const cv = document.createElement('canvas'); cv.width = cv.height = low ? 256 : 512; const x = cv.getContext('2d'), S = cv.width; x.fillStyle = '#6f6a61'; x.fillRect(0, 0, S, S);
      let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) { const c = 150 + rnd() * 40 | 0; x.fillStyle = `rgb(${c},${c - 6},${c - 16})`; const w = S / 6; x.fillRect(i * w + 3 + rnd() * 3, j * w + 3 + rnd() * 3, w - 8 - rnd() * 4, w - 8 - rnd() * 4); }
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      const sh = new THREE.Shape(oc.poly.map(([px, pz]) => new THREE.Vector2(px, -pz))), geo = new THREE.ShapeGeometry(sh), uv = geo.attributes.uv, pos = geo.attributes.position;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 2.4, pos.getY(i) / 2.4);
      const fl = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })); fl.rotation.x = -Math.PI / 2; fl.position.y = 0.012; fl.name = 'patioFloor786'; root.add(fl);
      // board panel behind the mural (same wood, taller section of the fence)
      const pn = P.panel, gp = G(pn.at[0], pn.at[1], yawOf(pn.face)); add(gp, wood, pn.w, pn.h, 0.05, 0, pn.h / 2, -0.04); for (const sd of [-1, 1]) add(gp, woodD, 0.12, pn.h + 0.1, 0.12, sd * pn.w / 2, (pn.h + 0.1) / 2, -0.04);
      if (window.__wallRecs) window.__wallRecs.push({ pos: [pn.at[0] - pn.face[0] * 0.04, pn.h / 2, pn.at[1] - pn.face[1] * 0.04], ry: yawOf(pn.face), L: pn.w, h: pn.h, th: 0.05, kind: 'patioPanel786', room: oc.id }); // backs the mural (sticker/audit rays)
      for (let i = 1; i < 9; i++) add(gp, woodD, 0.012, pn.h, 0.01, -pn.w / 2 + i * pn.w / 9, pn.h / 2, -0.012);
      for (const f of P.furniture) { const g = G(f.at[0], f.at[1], yawOf(f.face));
        if (f.kind === 'sofa') { add(g, wick, 1.9, 0.38, 0.8, 0, 0.19, 0); add(g, wick, 1.9, 0.42, 0.14, 0, 0.59, -0.33); for (const sd of [-1, 1]) add(g, wick, 0.14, 0.24, 0.8, sd * 0.88, 0.5, 0);
          for (const sd of [-1, 1]) { add(g, cush, 0.8, 0.12, 0.62, sd * 0.41, 0.44, 0.04); add(g, cush, 0.78, 0.36, 0.1, sd * 0.41, 0.66, -0.22); } }
        else if (f.kind === 'chair') { add(g, wick, 0.78, 0.36, 0.74, 0, 0.18, 0); add(g, wick, 0.78, 0.42, 0.12, 0, 0.57, -0.31); for (const sd of [-1, 1]) add(g, wick, 0.12, 0.22, 0.74, sd * 0.33, 0.47, 0);
          add(g, cush, 0.56, 0.12, 0.58, 0, 0.42, 0.04); add(g, cush, 0.54, 0.34, 0.09, 0, 0.64, -0.21); }
        else { add(g, wick, 1.0, 0.36, 0.6, 0, 0.18, 0); add(g, glass, 1.04, 0.02, 0.64, 0, 0.37, 0); }
        out.patio++; }
      const blob = new THREE.IcosahedronGeometry(1, 0), blade = new THREE.ConeGeometry(1, 1, 5);
      P.shrubs.forEach(([sx, sz], i) => { const g = G(sx, sz, i); if (i % 2) { for (let k = 0; k < 5; k++) add(g, grass, 0.05, 0.6 + 0.1 * (k % 3), 0.05, Math.cos(k * 1.3) * 0.18, 0.32, Math.sin(k * 1.3) * 0.12, blade); }
        else { add(g, leaf, 0.42, 0.34, 0.36, 0, 0.3, 0, blob); add(g, leaf, 0.3, 0.26, 0.3, 0.28, 0.24, 0.05, blob); } }); }
    const F = oc.fountain; if (F && !oc.ist811) { /* #811 Ottoman fountain drawn by fountainIstanbul811 */ const g = G(F.at[0], F.at[1], 0), seg = low ? 20 : 40, r = F.r;
      const prof = [[r - 0.2, 0], [r, 0], [r, 0.5], [r - 0.18, 0.5], [r - 0.18, 0.12]].map(([a, b]) => new THREE.Vector2(a, b));
      g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, seg), stone));
      const water = M(0x3d6f86, 0.1, 0.2); water.transparent = true; water.opacity = 0.85; add(g, water, 1, 1, 1, 0, 0.4, 0, new THREE.CylinderGeometry(r - 0.2, r - 0.2, 0.02, seg));
      add(g, stone, 1, 1, 1, 0, 0.6, 0, new THREE.CylinderGeometry(0.16, 0.24, 1.2, 12)); add(g, stone, 1, 1, 1, 0, 1.22, 0, new THREE.CylinderGeometry(0.55, 0.2, 0.18, seg));
      add(g, water, 1, 1, 1, 0, 1.32, 0, new THREE.CylinderGeometry(0.48, 0.48, 0.02, seg)); add(g, stone, 1, 1, 1, 0, 1.45, 0, new THREE.SphereGeometry(0.12, 10, 8)); g.name = 'fountain786'; out.fountain++; }
  }
  return out;
}
