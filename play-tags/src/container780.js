// #780 (TJ, Oct 27 2026 via Studio manager): the H1 courtyard Friends Club mural sits on a real 40 ft high-cube SHIPPING CONTAINER
// (corrugated, light-blue, 12.192 x 2.438 x 2.896 m) instead of a plain white freestanding wall, with a pine treeline behind it
// (refs: gallery-tj-feedback/bitcoin-mural-court/container-far.png). The mural itself is bent onto the corrugation so it reads in 3D.
// Data: catalog openCourts[].walls[].container = {art, len, depth, height, lift}. Wall stays a collider; its plain slab is not drawn.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
const TREE852 = 'https://img.tjm.art/play/preview-251/trees-199/';
const PITCH = 0.278, DEPTH = 0.032;
const wave = u => { const p = ((u / PITCH) % 1 + 1) % 1; return p < 0.2 ? p / 0.2 : p < 0.5 ? 1 : p < 0.7 ? 1 - (p - 0.5) / 0.2 : 0; }; // trapezoid profile 0..1
function corrPlane(L, H, depth, seg) { const g = new THREE.PlaneGeometry(L, H, seg, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, -depth * wave(p.getX(i) + L / 2)); g.computeVertexNormals(); return g; }
export function installContainer780(root, W, T) {
  const out = []; const blue = new THREE.MeshStandardMaterial({ color: 0x8cc4d8, roughness: 0.72, metalness: 0.25, side: THREE.DoubleSide }), steel = new THREE.MeshStandardMaterial({ color: 0x5f7f8c, roughness: 0.6, metalness: 0.35 }), sleeper = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.95 });
  for (const oc of T.openCourts || []) for (const w of oc.walls || []) { const C = w.container; if (!C) continue;
    const L = C.len, D = C.depth, H = C.height, y0 = C.lift; const fx = w.nx, fz = w.nz; // facing into the court
    const mx = (w.x0 + w.x1) / 2 - fx * 0.08, mz = (w.z0 + w.z1) / 2 - fz * 0.08; // container front face on the court-side wall line
    const g = new THREE.Group(); g.name = 'container780-' + oc.id; g.position.set(mx, 0, mz); g.rotation.y = Math.atan2(fx, fz); root.add(g); // local +z = toward the court, box extends to -z
    const seg = Math.ceil(L / PITCH * 5), segD = Math.ceil(D / PITCH * 5);
    const face = (geo, x, y, z, ry) => { const m = new THREE.Mesh(geo, blue); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m; };
    face(corrPlane(L, H, DEPTH, seg), 0, y0 + H / 2, 0, 0);                   // front (mural side)
    face(corrPlane(L, H, DEPTH, seg), 0, y0 + H / 2, -D, Math.PI);           // back
    face(corrPlane(D, H, DEPTH, segD), -L / 2, y0 + H / 2, -D / 2, -Math.PI / 2); // left end (doors)
    face(corrPlane(D, H, DEPTH, segD), L / 2, y0 + H / 2, -D / 2, Math.PI / 2);   // right end
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(L, D), blue); roof.rotation.x = -Math.PI / 2; roof.position.set(0, y0 + H, -D / 2); g.add(roof);
    const beam = (sx, sy, sz, x, y, z, m = steel) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); b.position.set(x, y, z); g.add(b); };
    for (const y of [y0 + 0.08, y0 + H - 0.06]) for (const z of [0.02, -D - 0.02]) beam(L + 0.04, y === y0 + 0.08 ? 0.16 : 0.12, 0.08, 0, y, z); // top/bottom side rails
    for (const x of [-L / 2, L / 2]) for (const z of [0.02, -D - 0.02]) beam(0.16, H, 0.16, x, y0 + H / 2, z);                         // corner posts
    for (const x of [-L / 2 + 0.6, 0, L / 2 - 0.6]) beam(0.25, y0, D + 0.4, x, y0 / 2, -D / 2, sleeper);                             // sleepers it rests on
    // door locking bars on the left end
    for (const k of [-0.75, -0.35, 0.35, 0.75]) beam(0.04, H - 0.3, 0.04, -L / 2 - 0.06, y0 + H / 2, -D / 2 + k);
    // bend the mural onto the corrugation (same unit plane, scaled; only z is displaced)
    if (C.art) { const tryBend = () => { const a = root.getObjectByName(C.art) || root.parent?.getObjectByName?.(C.art); const m = a && a.getObjectByName('mural'); if (!m) return false;
        const ug = new THREE.PlaneGeometry(1, 1, Math.ceil(m.scale.x / PITCH * 5), 1), p = ug.attributes.position, gx = a.position.x, gz = a.position.z, tx = -fz, tz = fx, s0 = (gx - mx) * tx + (gz - mz) * tz;
        for (let i = 0; i < p.count; i++) { const u = p.getX(i) * m.scale.x + s0 + L / 2; p.setZ(i, -DEPTH * wave(u) - 0.0); } ug.computeVertexNormals(); m.geometry.dispose(); m.geometry = ug;
        const fr = a.getObjectByName('muralFrame'); if (fr) fr.visible = false; return true; };
      if (!tryBend()) { let n = 0; const iv = setInterval(() => { if (tryBend() || ++n > 40) clearInterval(iv); }, 250); } }
    // pine treeline behind the container (decor only: outside the court, no colliders)
    const trunkG = new THREE.CylinderGeometry(0.14, 0.22, 1, 7), crownG = new THREE.ConeGeometry(1, 1, 9);
    const N = 34, trunk = new THREE.InstancedMesh(trunkG, new THREE.MeshStandardMaterial({ color: 0x4b3424, roughness: 1 }), N), crown = new THREE.InstancedMesh(crownG, new THREE.MeshStandardMaterial({ color: 0x23402c, roughness: 1 }), N * 2);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = (x, y, z) => new THREE.Vector3(x, y, z); let r = 7.80, ci = 0; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    const spots852 = [];
    for (let i = 0; i < N; i++) { const x = -L / 2 - 4 + (L + 8) * (i + rnd() * 0.8) / N, z = -D - 2.2 - rnd() * 7 - (i % 3) * 1.6, h = 9 + rnd() * 8, rad = 1.6 + rnd() * 1.1; spots852.push([x, z]);
      trunk.setMatrixAt(i, M.compose(V(x, h * 0.2, z), Q, V(1, h * 0.4, 1)));
      crown.setMatrixAt(ci++, M.compose(V(x, h * 0.25 + h * 0.4, z), Q, V(rad, h * 0.75, rad))); crown.setMatrixAt(ci++, M.compose(V(x, h * 0.72, z), Q, V(rad * 0.7, h * 0.5, rad * 0.7))); }
    trunk.name = 'container780-trunks'; crown.name = 'container780-pines'; g.add(trunk, crown); out.push(g.name); 
    { /* #852 meshopt pine GLBs (Visual lock pack): mix pine-01..04, random yaw + scale 0.8-1.25, same spots; procedural stays until all load, kept on failure */
      const lo = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window, lod = lo ? 1 : 0, ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder); ld.setCrossOrigin('anonymous');
      let s2 = 8.52; const r2 = () => (s2 = (s2 * 9301 + 49297) % 233280) / 233280; const pick = spots852.map((p, i) => ({ p, k: Math.floor(r2() * 4), yaw: r2() * Math.PI * 2, sc: 0.8 + r2() * 0.45 }));
      const st = (window.__trees852 = window.__trees852 || {}); st.lod = lod;
      Promise.all([1, 2, 3, 4].map(n => ld.loadAsync(TREE852 + 'pine-0' + n + '-lod' + lod + '.glb'))).then(gs => { const tg = new THREE.Group(); tg.name = 'container780-trees852'; let cnt = 0;
        gs.forEach((gl, k) => { const use = pick.filter(q => q.k === k); if (!use.length) return; gl.scene.updateMatrixWorld(true);
          gl.scene.traverse(o => { if (!o.isMesh) return; const im = new THREE.InstancedMesh(o.geometry, o.material, use.length); im.name = 'trees852-' + k + '-' + o.name; const Mi = new THREE.Matrix4(), Qi = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
            use.forEach((q, j) => { Qi.setFromAxisAngle(Y, q.yaw); Mi.compose(new THREE.Vector3(q.p[0], 0, q.p[1]), Qi, new THREE.Vector3(q.sc, q.sc, q.sc)).multiply(o.matrixWorld); im.setMatrixAt(j, Mi); });
            im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); tg.add(im); cnt++; }); });
        g.add(tg); g.remove(trunk, crown); trunk.dispose(); crown.dispose(); st.ok = true; st.meshes = cnt; st.trees = pick.length; }).catch(e => { console.warn('[852] pine GLBs failed, keeping procedural', e); st.ok = false; }); }
  }
  return out; }
