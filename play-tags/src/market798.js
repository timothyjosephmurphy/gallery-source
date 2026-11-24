// #798 (TJ Oct 27 2026): Paul Murphy annex as an art-festival market. Each ~10x10 ft booth: 4 wood posts, a striped fabric awning,
// a wood header, and black wire-grid racks (back + 2 sides) the works hang on. Original procedural geometry. Data: openCourts[].booths798. Decor only.
import * as THREE from 'three';
export function installMarket798(root, T, low) {
  const out = { booths: 0 }, box = new THREE.BoxGeometry(1, 1, 1), M = (c, r = 0.8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const post = M(0x8a6a48), wire = M(0xf2f1ec, 0.45, 0.3) /* #800 white wire */;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'); x.clearRect(0, 0, 128, 128); x.strokeStyle = '#f4f3ee'; x.lineWidth = 3; /* #800 white, wider grid (12.5 cm) */
  for (let i = 16; i < 128; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(128, i); x.stroke(); }
  const gt = new THREE.CanvasTexture(cv); gt.wrapS = gt.wrapT = THREE.RepeatWrapping;
  const add = (g, mat, sx, sy, sz, px, py, pz) => { const m = new THREE.Mesh(box, mat); m.scale.set(sx, sy, sz); m.position.set(px, py, pz); g.add(m); return m; };
  for (const oc of T.openCourts || []) for (const b of oc.booths798 || []) {
    const S = b.size, H = 2.45, g = new THREE.Group(); g.position.set(b.centre[0], 0, b.centre[1]); g.rotation.y = Math.atan2(b.face[0], b.face[1]); g.name = 'booth798-' + b.n; root.add(g);
    // local: +z = toward the aisle (front), -z = back rack, x = across
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(g, post, 0.07, H, 0.07, sx * S / 2, H / 2, sz * S / 2);
    add(g, post, S + 0.07, 0.18, 0.05, 0, H - 0.09, S / 2); // front header board
    // striped awning roof (slight pitch toward the front)
    const ac = document.createElement('canvas'); ac.width = 64; ac.height = 8; const a = ac.getContext('2d'); for (let i = 0; i < 8; i++) { a.fillStyle = i % 2 ? '#f3efe4' : b.awning; a.fillRect(i * 8, 0, 8, 8); }
    const at = new THREE.CanvasTexture(ac); at.colorSpace = THREE.SRGBColorSpace;
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(S + 0.2, S + 0.2), new THREE.MeshStandardMaterial({ map: at, roughness: 0.95, side: THREE.DoubleSide }));
    roof.rotation.x = -Math.PI / 2 + 0.08; roof.position.set(0, H + 0.06, 0); g.add(roof);
    const valance = new THREE.Mesh(new THREE.PlaneGeometry(S + 0.2, 0.22), new THREE.MeshStandardMaterial({ map: at, roughness: 0.95, side: THREE.DoubleSide })); valance.position.set(0, H - 0.05, S / 2 + 0.1); g.add(valance);
    // wire-grid racks: back (full width) and two sides (full depth), 0.25..2.15 m, tube frame + grid
    const rack = (w, px, pz, ry) => { const r = new THREE.Group(); r.position.set(px, 0, pz); r.rotation.y = ry; g.add(r); const h = 1.9, y0 = 0.25;
      const t = gt.clone(); t.needsUpdate = true; t.repeat.set(w / 0.5, h / 0.5);
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, metalness: 0.3, roughness: 0.45 })); pl.position.y = y0 + h / 2; r.add(pl);
      for (const yy of [y0, y0 + h]) add(r, wire, w, 0.025, 0.025, 0, yy, 0); for (const xx of [-w / 2, w / 2]) add(r, wire, 0.025, h, 0.025, xx, y0 + h / 2, 0);
      g.updateMatrixWorld(true); const wp = r.localToWorld(new THREE.Vector3(0, y0 + h / 2, 0)); if (window.__wallRecs) window.__wallRecs.push({ pos: [wp.x, wp.y, wp.z], ry: g.rotation.y + ry, L: w, h, th: 0.02, kind: 'rack798', room: oc.id }); };
    rack(S - 0.1, 0, -S / 2 + 0.0, 0); rack(S - 0.1, -S / 2, 0, Math.PI / 2); rack(S - 0.1, S / 2, 0, Math.PI / 2);
    g.traverse(o => { if (o.isMesh) o.userData.decor798 = true; }); out.booths++; }
  return out;
}
