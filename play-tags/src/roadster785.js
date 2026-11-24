// #785 (TJ walk, ref gallery-tj-feedback/start-fence-roadster/outer-edge.png): a low-slung red two-seat roadster parked outside the START fence,
// against the mountains. Original procedural low-poly silhouette (boxes, tapered nose, cylinders). Decor only, no colliders, outside the walkable poly.
// Data: catalog openCourts[].roadster = {x, z, yaw}.
import * as THREE from 'three';
export function installRoadster785(root, T) {
  const out = [], red = new THREE.MeshStandardMaterial({ color: 0xb3121b, roughness: 0.35, metalness: 0.55 }), blk = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.5, metalness: 0.3 }),
    glass = new THREE.MeshStandardMaterial({ color: 0x1c2630, roughness: 0.1, metalness: 0.8 }), rim = new THREE.MeshStandardMaterial({ color: 0x9a9ea4, roughness: 0.3, metalness: 0.9 }), box = new THREE.BoxGeometry(1, 1, 1);
  for (const oc of T.openCourts || []) { const R = oc.roadster; if (!R) continue;
    const g = new THREE.Group(); g.name = 'roadster785'; g.position.set(R.x, 0, R.z); g.rotation.y = R.yaw || 0; root.add(g); // local x = length (nose +x)
    const add = (geo, mat, sx, sy, sz, x, y, z, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.rotation.z = rz; g.add(m); return m; };
    add(box, red, 3.9, 0.42, 1.78, 0, 0.48, 0);                       // body tub
    add(box, red, 1.3, 0.3, 1.7, 1.55, 0.42, 0, -0.16);              // sloped nose
    add(box, red, 0.9, 0.34, 1.74, -1.6, 0.66, 0, 0.12);             // rear deck rise
    add(box, blk, 0.9, 0.12, 1.5, -0.25, 0.75, 0);                    // open cockpit
    add(box, glass, 0.08, 0.36, 1.5, 0.35, 0.92, 0, -0.75);          // raked windscreen
    add(box, blk, 0.3, 0.25, 1.4, -0.85, 0.85, 0);                    // seat backs
    add(box, blk, 0.12, 0.18, 1.6, -2.0, 0.62, 0);                    // tail
    const wheel = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 14), hub = new THREE.CylinderGeometry(0.2, 0.2, 0.27, 10);
    for (const [x, z] of [[1.3, 0.82], [1.3, -0.82], [-1.25, 0.82], [-1.25, -0.82]]) { const w = new THREE.Mesh(wheel, blk); w.rotation.x = Math.PI / 2; w.position.set(x, 0.34, z); g.add(w);
      const h = new THREE.Mesh(hub, rim); h.rotation.x = Math.PI / 2; h.position.set(x, 0.34, z); g.add(h); }
    g.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; m.userData.decor = true; } }); out.push({ id: oc.id, x: R.x, z: R.z, meshes: g.children.length }); }
  return out;
}
