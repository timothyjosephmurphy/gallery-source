// #808 (TJ Oct 28 2026): cafe corner in courtyard-fountain-sw: striped awning on 4 posts, round bistro table, 4 chairs, a wine bottle + 2 glasses.
// Original procedural geometry. Data: openCourts[].cafe808. Decor only (no colliders).
import * as THREE from 'three';
export function installCafe808(root, T, low) {
  const out = { cafes: 0 }, box = new THREE.BoxGeometry(1, 1, 1), M = (c, r = 0.8, m = 0, o) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...(o || {}) });
  const add = (g, geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.userData.decor808 = true; g.add(m); return m; };
  const iron = M(0x1f1f1f, 0.5, 0.7), wood = M(0x7a5232, 0.7), cloth = M(0xf4efe4, 0.9), glassM = M(0xdfe9ee, 0.1, 0, { transparent: true, opacity: 0.45 }), wine = M(0x1c3b22, 0.25, 0.1), label = M(0xe8dcc0, 0.8), red = M(0x5a0f1a, 0.4);
  for (const oc of T.openCourts || []) { const C = oc.cafe808; if (!C) continue; const g = new THREE.Group(); g.name = 'cafe808'; g.position.set(C.at[0], 0, C.at[1]); g.rotation.y = Math.atan2(C.face[0], C.face[1]); root.add(g);
    const S = 3.0, H = 2.5, seg = low ? 10 : 18;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(g, box, wood, sx * S / 2, H / 2, sz * S / 2, 0.07, H, 0.07);
    const ac = document.createElement('canvas'); ac.width = 64; ac.height = 8; const a = ac.getContext('2d'); for (let i = 0; i < 8; i++) { a.fillStyle = i % 2 ? '#f3efe4' : C.awning; a.fillRect(i * 8, 0, 8, 8); }
    const at = new THREE.CanvasTexture(ac); at.colorSpace = THREE.SRGBColorSpace; const am = new THREE.MeshStandardMaterial({ map: at, roughness: 0.95, side: THREE.DoubleSide });
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(S + 0.3, S + 0.3), am); roof.rotation.x = -Math.PI / 2 + 0.1; roof.position.set(0, H + 0.08, 0); g.add(roof);
    for (const sz of [-1, 1]) { const v = new THREE.Mesh(new THREE.PlaneGeometry(S + 0.3, 0.3), am); v.position.set(0, H - 0.07 + (sz > 0 ? -0.08 : 0.08), sz * (S + 0.3) / 2); g.add(v); }
    // table
    add(g, new THREE.CylinderGeometry(0.4, 0.4, 0.03, seg), cloth, 0, 0.74, 0); add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.72, 8), iron, 0, 0.37, 0); add(g, new THREE.CylinderGeometry(0.22, 0.25, 0.03, seg), iron, 0, 0.015, 0);
    // bottle + glasses
    add(g, new THREE.CylinderGeometry(0.037, 0.037, 0.22, 12), wine, 0.06, 0.865, -0.05); add(g, new THREE.CylinderGeometry(0.013, 0.035, 0.07, 12), wine, 0.06, 1.01, -0.05); add(g, new THREE.CylinderGeometry(0.014, 0.014, 0.05, 8), wine, 0.06, 1.07, -0.05);
    add(g, new THREE.CylinderGeometry(0.0375, 0.0375, 0.08, 12, 1, true), label, 0.06, 0.85, -0.05);
    for (const [gx, gz] of [[-0.18, 0.12], [0.2, 0.15]]) { add(g, new THREE.CylinderGeometry(0.035, 0.022, 0.08, 10), glassM, gx, 0.87, gz); add(g, new THREE.CylinderGeometry(0.005, 0.005, 0.08, 6), glassM, gx, 0.79, gz); add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.005, 10), glassM, gx, 0.755, gz); add(g, new THREE.CylinderGeometry(0.026, 0.02, 0.025, 10), red, gx, 0.85, gz); }
    // 4 bistro chairs facing the table
    for (let k = 0; k < 4; k++) { const ang = k * Math.PI / 2 + Math.PI / 4, ch = new THREE.Group(); ch.position.set(Math.sin(ang) * 0.75, 0, Math.cos(ang) * 0.75); ch.rotation.y = ang; g.add(ch);
      add(ch, new THREE.CylinderGeometry(0.21, 0.21, 0.04, seg), wood, 0, 0.46, 0);
      for (const [lx, lz] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]) add(ch, box, iron, lx, 0.22, lz, 0.025, 0.44, 0.025);
      for (const lx of [-0.16, 0.16]) add(ch, box, iron, lx, 0.7, 0.19, 0.025, 0.5, 0.025); add(ch, box, wood, 0, 0.85, 0.2, 0.38, 0.12, 0.03); add(ch, box, wood, 0, 0.66, 0.2, 0.38, 0.06, 0.03); }
    out.cafes++; }
  return out;
}
