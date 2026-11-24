// #784 (TJ walk, ref gallery-tj-feedback/berlin-church-steeples/courtyard-view.png): church steeples peek over the Berlin mural wall
// of the Bitcoin courtyard (a basketball court outside a church). Original procedural silhouettes, decor only, outside the walkable poly.
// Data: catalog openCourts[].walls[].steeples = true.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
const ST854 = 'https://img.tjm.art/play/preview-251/steeples-784/';
export function installSteeples784(root, W, T) {
  const stone = new THREE.MeshStandardMaterial({ color: 0xc9bba4, roughness: 0.95 }), roof = new THREE.MeshStandardMaterial({ color: 0x4f6b63, roughness: 0.7, metalness: 0.2 }), dark = new THREE.MeshBasicMaterial({ color: 0x2a2622 });
  const box = new THREE.BoxGeometry(1, 1, 1), spire = new THREE.ConeGeometry(0.72, 1, 4, 1), out = [];
  // [along wall (m from centre), back from wall (m), shaft width, shaft height, spire height]
  const TOWERS = [[-3.2, 9, 3.2, 15, 9], [3.2, 9, 3.2, 15, 9], [0, 15, 4.2, 11, 6], [-9.5, 13, 2.4, 10, 6.5]];
  for (const oc of T.openCourts || []) for (const w of oc.walls || []) { if (!w.steeples) continue;
    const g = new THREE.Group(); g.name = 'steeples784-' + oc.id; g.position.set((w.x0 + w.x1) / 2, 0, (w.z0 + w.z1) / 2); g.rotation.y = Math.atan2(w.nx, w.nz); root.add(g); // local +z = into the court
    const S810 = w.steeples810; if (S810) { g.translateX(S810.along || 0); g.translateZ(-(S810.back || 0)); g.scale.setScalar(S810.scale || 1); } // #810: shifted aside so the mountain vista reads behind the court
    const proc = []; for (const [s, b, wd, h, sp] of TOWERS) { const n0 = g.children.length;
      const sh = new THREE.Mesh(box, stone); sh.scale.set(wd, h, wd); sh.position.set(s, h / 2, -b); g.add(sh);
      const bel = new THREE.Mesh(box, stone); bel.scale.set(wd * 1.12, 0.35, wd * 1.12); bel.position.set(s, h, -b); g.add(bel);
      const op = new THREE.Mesh(box, dark); op.scale.set(wd * 0.3, 1.6, 0.05); op.position.set(s, h - 1.6, -b + wd / 2 + 0.03); g.add(op); // belfry opening
      const c = new THREE.Mesh(spire, roof); c.scale.set(wd * 0.98, sp, wd * 0.98); c.rotation.y = Math.PI / 4; c.position.set(s, h + 0.17 + sp / 2, -b); g.add(c);
      const cv = new THREE.Mesh(box, roof); cv.scale.set(0.08, 1.1, 0.08); cv.position.set(s, h + sp + 0.7, -b); g.add(cv);
      const ch = new THREE.Mesh(box, roof); ch.scale.set(0.6, 0.08, 0.08); ch.position.set(s, h + sp + 0.85, -b); g.add(ch); proc.push(g.children.slice(n0)); }
    const nave = new THREE.Mesh(box, stone); nave.scale.set(10, 9, 6); nave.position.set(0, 4.5, -12); g.add(nave); // church body joining the towers (mostly hidden by the wall)
    g.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; m.userData.decor = true; } }); out.push(g.name);
    { /* #854 steeple-tower GLBs (Cascades asset pack): same TOWERS spots, scaled to prior shaft height (A 15 m, B 13 m); procedural kept until load / on failure */
      const lod = (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) ? 1 : 0, ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder); ld.setCrossOrigin('anonymous'); const st = (window.__steeples854 = window.__steeples854 || {}); st.lod = lod;
      Promise.all(['steeple-tower', 'steeple-tower-b'].map(n => ld.loadAsync(ST854 + n + '-lod' + lod + '.glb'))).then(([A, B]) => { let cnt = 0;
        TOWERS.forEach(([s, b, wd, h], i) => { const useB = i >= 2, src = (useB ? B : A).scene, t = src.clone(true), k = h / (useB ? 13 : 15); t.name = 'SteepleTower854-' + i; t.scale.setScalar(k); t.position.set(s, 0, -b);
          t.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; m.userData.decor = true; if (m.material) m.material.vertexColors = true; } }); g.add(t); for (const m of proc[i]) g.remove(m); cnt++; });
        st.ok = true; st.towers = cnt; }).catch(e => { console.warn('[854] steeple GLBs failed, keeping procedural', e); st.ok = false; }); } }
  return out;
}
