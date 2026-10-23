// Egg 14: now and then a sandworm ripple runs under one hall's floor (the floor itself bulges and travels), with dust and a
// low rumble; a brass plaque 'The spice must flow' hangs over a puddle of soup in the same hall.
import { THREE, V, builder, MAT, plaque, rand, clamp } from '../kit.js';
export function eggDune(E) {
  const { scene, world, A, camera } = E;
  const runL = world.longestRun(3.2); if (!runL || runL.L < 14) return null;
  const a = runL.a, b = runL.b, dir = V().subVectors(b, a).normalize(), side = V(dir.z, 0, -dir.x), mid = V().addVectors(a, b).multiplyScalar(0.5);
  let half = 1.6; while (half < 3 && world.walkable(mid.x + side.x * (half + 0.3), mid.z + side.z * (half + 0.3)) && world.walkable(mid.x - side.x * (half + 0.3), mid.z - side.z * (half + 0.3))) half += 0.25; half = Math.min(half, 2.6);
  // the floor under the run: re-use its own material + matching UVs so the bulge reads as the floor itself
  const ray = new THREE.Raycaster(V(mid.x, 3, mid.z), V(0, -1, 0), 0, 4); ray.camera = camera; const hits = ray.intersectObjects(scene.children, true).filter(h => h.object.isMesh && h.object.geometry && h.object.geometry.type === 'PlaneGeometry' && Math.abs(h.object.rotation.x + Math.PI / 2) < 1e-3);
  const fl = hits[0] && hits[0].object; const fp = fl && fl.geometry.parameters, fy = hits[0] ? hits[0].point.y : 0;
  const mat = fl ? fl.material.clone() : new THREE.MeshLambertMaterial({ color: 0xc8b48c }); mat.vertexColors = true; // same floor texture, shaded by slope so the bulge reads
  const NS = 26, NU = 9, LEN = 5.5; const geo = new THREE.PlaneGeometry(1, 1, NS, NU); geo.rotateX(-Math.PI / 2); const patch = new THREE.Mesh(geo, mat); patch.visible = false; patch.userData.egg = 1; patch.frustumCulled = false; scene.add(patch);
  const pa = geo.attributes.position, uv = geo.attributes.uv; const col = new THREE.BufferAttribute(new Float32Array(pa.count * 3).fill(1), 3); geo.setAttribute('color', col); const hs = new Float32Array(pa.count);
  const st = { on: false, s: 0, next: rand(60, 120), loop: null, L: runL.L };
  const inv = fl ? (fl.updateMatrixWorld(true), fl.matrixWorld.clone().invert()) : null, _l = V(); // floor-local coords -> same UVs as the floor
  function shape(s0) { // s along the run (m), mound at s0
    for (let j = 0; j <= NU; j++) for (let i = 0; i <= NS; i++) { const k = j * (NS + 1) + i, ls = (i / NS - 0.5) * LEN, lu = (j / NU - 0.5) * 2 * half, s = s0 + ls;
      const w = Math.exp(-Math.pow(ls / 1.0, 2)) * 0.3 + Math.exp(-Math.pow((ls + 1.9) / 0.6, 2)) * 0.07 * (0.6 + 0.4 * Math.sin(st.s * 3) ** 2) + Math.exp(-Math.pow((ls + 3.1) / 0.5, 2)) * 0.035, h = w * Math.max(0, 1 - Math.pow(lu / half, 2) * 0.85) * (Math.abs(lu) > half - 0.05 ? 0 : 1);
      const x = a.x + dir.x * s - side.x * lu, z = a.z + dir.z * s - side.z * lu; pa.setXYZ(k, x, fy + 0.003 + h, z); hs[k] = h; // -side keeps the triangles facing up
      if (fl) { _l.set(x, fy, z).applyMatrix4(inv); uv.setXY(k, _l.x / fp.width + 0.5, _l.y / fp.height + 0.5); } }
    for (let j = 0; j <= NU; j++) for (let i = 0; i <= NS; i++) { const k = j * (NS + 1) + i, ds = (hs[Math.min(NS, i + 1) + j * (NS + 1)] - hs[Math.max(0, i - 1) + j * (NS + 1)]) / (2 * LEN / NS), du = (hs[i + Math.min(NU, j + 1) * (NS + 1)] - hs[i + Math.max(0, j - 1) * (NS + 1)]) / (2 * 2 * half / NU);
      const sh = THREE.MathUtils.clamp(1 + ds * 1.6 - Math.abs(du) * 0.9 + hs[k] * 0.6, 0.45, 1.25); col.setXYZ(k, sh, sh * 0.97, sh * 0.9); }
    col.needsUpdate = true; pa.needsUpdate = true; uv.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere(); }
  // plaque + soup puddle on a wall of the same hall
  let puddle = null, pl = null, wspot = world.findWallSpot({ w: 0.5, h: 0.24, y: 0.95, seed: E.seed + 141, test: c => { const r = V().subVectors(c.pos, a), along = r.dot(dir), off = Math.abs(r.dot(side)); return along > 2 && along < runL.L - 2 && off < half + 3.6; } });
  if (wspot) { world.reserveWall(wspot, 'spice'); pl = plaque(['The spice must flow'], 0.46, 0.13, { brass: true, size: 46, italic: true }); pl.position.copy(wspot.pos).addScaledVector(wspot.n, 0.004); pl.rotation.y = wspot.yaw; scene.add(pl);
    const shp = new THREE.Shape(); for (let k = 0; k <= 24; k++) { const an = k / 24 * Math.PI * 2, r = 0.28 * (1 + 0.18 * Math.sin(an * 3 + 1) + 0.1 * Math.sin(an * 7)); const x = Math.cos(an) * r * 1.3, y = Math.sin(an) * r; k ? shp.lineTo(x, y) : shp.moveTo(x, y); }
    puddle = new THREE.Mesh(new THREE.ShapeGeometry(shp), new THREE.MeshStandardMaterial({ color: 0xb8361a, roughness: 0.08, metalness: 0.1, emissive: 0x2a0800 })); puddle.rotation.x = -Math.PI / 2; puddle.rotation.z = wspot.yaw; puddle.position.copy(wspot.pos).addScaledVector(wspot.n, 0.42).setY(0.006); scene.add(puddle); }
  function start() { if (st.on) return; st.on = true; st.s = -LEN / 2; patch.visible = true; shape(st.s); const d = camera.position.distanceTo(mid); st.loop = E.A.loop({ f: 34, type: 'sawtooth', vol: 0.0001, lp: 110, noise: 0.6 }); E.found('sandworm'); }
  function update(dt, tm) {
    if (!st.on) { if ((st.next -= dt) <= 0) { const near = Math.hypot(camera.position.x - mid.x, camera.position.z - mid.z) < runL.L / 2 + 10; if (near) start(); else st.next = 20; } return; }
    st.s += dt * 5.5; shape(st.s); const p = V(a.x + dir.x * st.s, 0.05, a.z + dir.z * st.s), d = camera.position.distanceTo(p);
    if (st.loop) st.loop.set(clamp(0.12 * (1 - d / 30), 0.0001, 0.12));
    for (let q = 0; q < 2; q++) if (Math.random() < dt * 16) E.puffs.emit(p.clone().addScaledVector(dir, rand(-0.6, 0.9)).addScaledVector(side, rand(-half, half) * 0.6).setY(0.12), V(rand(-0.4, 0.4), rand(0.4, 0.9), rand(-0.4, 0.4)), 1.1, 0.16, 0xc9b68a, 2.2, 1.4, 0.4);
    if (st.s > st.L + LEN / 2) { st.on = false; patch.visible = false; if (st.loop) st.loop.stop(0.5); st.loop = null; st.next = rand(110, 220); } }
  return { name: 'dune', group: pl || patch, anchor: wspot ? wspot.pos : mid, update, wormNow: start, get active() { return st.on; }, get progress() { return st.s / st.L; }, run: runL, usesFloor: !!fl, wspot,
    view: () => { const s0 = st.on ? st.s : runL.L * 0.3; return { from: a.clone().addScaledVector(dir, s0 + 3.2).addScaledVector(side, half * 0.8).setY(1.25), to: a.clone().addScaledVector(dir, s0 - 0.3).setY(0.05) }; },
    viewPlaque: () => wspot ? { from: wspot.pos.clone().addScaledVector(wspot.n, 1.6).setY(1.35), to: wspot.pos.clone().addScaledVector(wspot.n, 0.3).setY(0.45) } : null };
}
