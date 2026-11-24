// #790 (TJ, Oct 27 2026; ref gallery-tj-feedback/berlin-wall-blend/framed-mural.png): the Berlin-El Salvador mural loses its brown frame and the
// cream courtyard wall behind it is repainted from the mural's own edge colours (each row extended sideways, top/bottom rows carried up/down), so the
// photo reads as painted onto the basketball court wall instead of a framed panel. Data: catalog openCourts[].walls[].blend790 = art id. Decor only.
import * as THREE from 'three';
export function installBerlinWall790(root, W, T) {
  const S = { walls: [] };
  for (const oc of T.openCourts || []) for (const cw of oc.walls || []) { const id = cw.blend790; if (!id) continue;
    const w = W.walls.find(q => q.id === cw.id); if (!w) continue; const rec = { id, wall: cw.id }; S.walls.push(rec);
    const tryIt = () => { const g = root.getObjectByName(id), m = g && g.getObjectByName('mural'); if (!m) return false;
      const fr = g.getObjectByName('muralFrame'); if (fr) fr.visible = false; rec.frame = 'hidden';
      const img = m.material.map && m.material.map.image; if (!img || !(img.width || img.videoWidth)) return false; // wait for the texture
      const L = Math.hypot(w.x1 - w.x0, w.z1 - w.z0), H = w.h, cx = (w.x0 + w.x1) / 2, cz = (w.z0 + w.z1) / 2;
      const d = (g.position.x - cx) * w.nx + (g.position.z - cz) * w.nz; // mural plane distance from the wall line
      const N = 96, c0 = document.createElement('canvas'); c0.width = 8; c0.height = N; const x0 = c0.getContext('2d', { willReadFrequently: true });
      x0.drawImage(img, 0, 0, 3, img.height, 0, 0, 4, N); x0.drawImage(img, img.width - 3, 0, 3, img.height, 4, 0, 4, N); const px = x0.getImageData(0, 0, 8, N).data;
      const row = r => { let a = [0, 0, 0]; for (let k = 0; k < 8; k++) for (let j = 0; j < 3; j++) a[j] += px[(r * 8 + k) * 4 + j]; return a.map(v => v / 8 | 0); };
      const mh = m.scale.y, top = g.position.y + mh / 2, bot = g.position.y - mh / 2, R = 256, c = document.createElement('canvas'); c.width = 4; c.height = R; const x = c.getContext('2d');
      for (let i = 0; i < R; i++) { const y = H * (1 - (i + 0.5) / R), t = (top - y) / mh, r = Math.min(N - 1, Math.max(0, Math.floor(t * N))); x.fillStyle = `rgb(${row(r).join(',')})`; x.fillRect(0, i, 4, 1); }
      if (!m.userData.feather790) { const F = 128, fc = document.createElement('canvas'); fc.width = fc.height = F; const fx = fc.getContext('2d'), e = F * 0.06; // feather photo edges into the painted wall (no hard panel edge)
        for (let yy = 0; yy < F; yy++) for (let xx = 0; xx < F; xx++) { const k = Math.min(1, Math.min(xx + 0.5, F - xx - 0.5, yy + 0.5, F - yy - 0.5) / e), v = Math.round(255 * k * k * (3 - 2 * k)); fx.fillStyle = `rgb(${v},${v},${v})`; fx.fillRect(xx, yy, 1, 1); }
        m.material.alphaMap = new THREE.CanvasTexture(fc); m.material.transparent = true; m.material.needsUpdate = true; m.userData.feather790 = true; rec.feather = 0.06; }
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const p = new THREE.Mesh(new THREE.PlaneGeometry(L, H), new THREE.MeshBasicMaterial({ map: tex })); p.name = 'berlinWall790';
      p.position.set(cx + w.nx * (d - 0.015), H / 2, cz + w.nz * (d - 0.015)); p.rotation.y = Math.atan2(w.nx, w.nz); root.add(p);
      Object.assign(rec, { painted: true, L: +L.toFixed(2), H, d: +d.toFixed(3), topRgb: row(0), botRgb: row(N - 1) }); return true; };
    if (!tryIt()) { let n = 0; const iv = setInterval(() => { if (tryIt() || ++n > 1200) clearInterval(iv); }, 250); } }
  return S; }
