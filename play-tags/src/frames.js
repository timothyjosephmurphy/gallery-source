// #301 (preview): black frames with depth. One shared moulding profile (outer bead, flat, stepped slope, thin inner lip around the
// canvas, ~4 cm off the wall) drawn as ONE InstancedMesh (4 bars per painting, butt-jointed), with a subtle edge sheen from a low-
// roughness material, plus a soft baked contact shadow on the wall (one shared texture, one InstancedMesh). No lights. The outer
// edge stays exactly on the old flat frame's footprint, so painting size (true / 1.5x) and plaques are untouched. Phones: same
// two draw calls, simpler profile. Paintings off the wall (lifted, carried, bought) hide their instances.
import * as THREE from 'three';
export function installFrames(game, low) {
  const P = game.paintings.filter(p => p.frame && p.group); if (!P.length) return null;
  const W = 0.03, D = 0.042, sh = new THREE.Shape(); // profile in (across from outer edge, depth off wall)
  const pts = low ? [[0, 0], [0, D - 0.006], [0.006, D], [0.02, D], [W, 0.03], [W, 0]] : [[0, 0], [0, D - 0.007], [0.004, D - 0.001], [0.008, D], [0.015, D], [0.018, D - 0.006], [0.0255, 0.03], [0.0265, 0.033], [W, 0.033], [W, 0.02], [W, 0]];
  pts.forEach(([u, v], i) => i ? sh.lineTo(u, v) : sh.moveTo(u, v)); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false, steps: 1 }); geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: 0x15130f, roughness: 0.32, metalness: 0.25, side: THREE.DoubleSide });
  const bars = new THREE.InstancedMesh(geo, mat, P.length * 4); bars.name = 'frameBars'; bars.frustumCulled = false;
  const sc = document.createElement('canvas'); sc.width = sc.height = 128; const x = sc.getContext('2d'), id = x.createImageData(128, 128);
  for (let j = 0; j < 128; j++) for (let i = 0; i < 128; i++) { const u = Math.abs(i / 63.5 - 1), v = Math.abs(j / 63.5 - 1), k = 0.7, d = Math.min(1, Math.hypot(Math.max(0, (u - k) / (1 - k)), Math.max(0, (v - k) / (1 - k)))); const o = (j * 128 + i) * 4; id.data[o + 3] = Math.round(Math.pow(1 - d, 1.8) * 255); }
  x.putImageData(id, 0, 0); const stex = new THREE.CanvasTexture(sc);
  const shadow = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: stex, transparent: true, opacity: low ? 0.28 : 0.38, depthWrite: false }), P.length); shadow.name = 'frameShadows'; shadow.frustumCulled = false;
  game.scene.add(bars, shadow);
  const m4 = new THREE.Matrix4(), loc = new THREE.Matrix4(), zero = new THREE.Matrix4().makeScale(0, 0, 0), last = P.map(() => null);
  function place(i) { const p = P[i], g = p.group; g.updateMatrixWorld(); const on = p.state === 'wall' || p.state == null;
    if (!on) { for (let k = 0; k < 4; k++) bars.setMatrixAt(i * 4 + k, zero); shadow.setMatrixAt(i, zero); p.frame.visible = true; return; }
    const fs = p.frame.scale, fw = fs.x, fh = fs.y, z = p.frame.position.z - 0.0; p.frame.visible = true; // flat backing stays (fills behind the lip)
    // across (geometry X) -> inward, depth (Y) -> +z off the wall, length (Z) -> along the side
    const sides = [[V(-fw / 2, fh / 2), V(0, -1), V(1, 0), fw], [V(fw / 2, -fh / 2), V(0, 1), V(-1, 0), fw], [V(-fw / 2, -fh / 2), V(1, 0), V(0, 1), fh], [V(fw / 2, fh / 2), V(-1, 0), V(0, -1), fh]];
    sides.forEach(([o, a, t, L], k) => { loc.makeBasis(new THREE.Vector3(a.x, a.y, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(t.x * L, t.y * L, 0)); loc.setPosition(o.x, o.y, z); bars.setMatrixAt(i * 4 + k, m4.multiplyMatrices(g.matrixWorld, loc)); });
    loc.makeScale(fw + 0.1, fh + 0.1, 1); loc.setPosition(0.018, -0.03, 0.0015); shadow.setMatrixAt(i, m4.multiplyMatrices(g.matrixWorld, loc)); }
  function V(x, y) { return { x, y }; }
  P.forEach((p, i) => place(i)); bars.instanceMatrix.needsUpdate = shadow.instanceMatrix.needsUpdate = true;
  let acc = 0; const key = p => p.state + '|' + p.group.position.x.toFixed(3) + p.group.position.y.toFixed(3) + p.group.position.z.toFixed(3) + p.frame.scale.x.toFixed(3);
  P.forEach((p, i) => last[i] = key(p));
  window.__frames = { count: P.length, low: !!low, draws: 2 };
  return { update(dt) { if ((acc += dt) < 0.2) return; acc = 0; let ch = false; P.forEach((p, i) => { const k = key(p); if (k !== last[i]) { last[i] = k; place(i); ch = true; } }); if (ch) bars.instanceMatrix.needsUpdate = shadow.instanceMatrix.needsUpdate = true; } };
}
