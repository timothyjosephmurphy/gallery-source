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
  // #301 wire: strip UVs per frames.json -- V = arc length across profile, 0 = back/wall .. 1 = canvas lip; U = along side (0..1, scaled to world in shader via aLen)
  { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    let lip = pts.findIndex(q => q[0] === W); if (lip < 0) lip = pts.length - 1; const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) { const px = pos.getX(i), py = pos.getY(i); let b = 0, bd = 1e9; pts.forEach((q, k) => { const d = (q[0] - px) ** 2 + (q[1] - py) ** 2; if (d < bd) { bd = d; b = k; } }); uv.setXY(i, pos.getZ(i), Math.min(1, cum[b] / cum[lip])); }
    uv.needsUpdate = true; }
  const FR = (import.meta.env.BASE_URL || '/') + 'img/play/preview-251/frames/', FV = (import.meta.env.BASE_URL || '/') + 'img/play/preview-251/frames-variants/', sfx = low ? '.phone.webp' : '.webp', tl = new THREE.TextureLoader(), LINER = false; // LINER: optional gold lip on the black (#301) default
  const ORNATE = true; // #301v NOTES: festival/Burning Man/Temples -> dark-ornate is "optional"; false = they stay black
  // #301v variant per painting class (frames-301-variants/NOTES.md "When to use which")
  const VAR = { black: { dir: FR, id: 'frame-black', liner: LINER ? 'frame-liner-gold' : null, env: 0.6 }, walnut: { dir: FV, id: 'frame-walnut', liner: 'frame-liner-gold', env: 0.5 },
    white: { dir: FV, id: 'frame-white', liner: 'frame-liner-silver', env: 0.6 }, ornate: { dir: FV, id: 'frame-dark-ornate', liner: 'frame-liner-gold', env: 0.7 },
    // #301 wave2 (frames-301-wave2/NOTES.md)
    oak: { dir: FV, id: 'frame-oak', liner: 'frame-liner-copper', env: 0.5 }, maple: { dir: FV, id: 'frame-maple', liner: 'frame-liner-silver', env: 0.55 }, charcoal: { dir: FV, id: 'frame-float-charcoal', liner: null, env: 0.45 } };
  const classify = p => { const d = p.data || {}, t = (d.title || '') + ' ' + (d.caption || ''), med = (d.medium || '').toLowerCase();
    if (d.room === 'room-11' || /father paul|reiki|attendee/i.test(t)) return 'walnut';
    const sw = d.trueW || d.w || 1, shh = d.trueH || d.h || 1; if (/watercolor/.test(med) && !/pastel/.test(med) && Math.max(sw, shh) <= 0.4) return 'white';
    if (ORNATE && (d.room === 'room-04' || /burning man|temple|festival/i.test(t))) return 'ornate';
    if (/hummingbird/i.test(t) || (/watercolor/.test(med) && !/pastel/.test(med))) return 'maple'; // wave2: light watercolors (not already white) + Hummingbirds
    if (/bass coast|forest triptych|sunrise/i.test(t)) return 'oak'; // wave2: warm landscapes
    if (d.room === 'room-07' || d.room === 'room-10' || /bitcoiner|nakamoto|honeybadger/i.test(t) || Math.max(sw, shh) >= 1.2) return 'charcoal'; // wave2: contemporary / Bitcoiners / large
    return 'black'; };
  const tex = (dir, n, srgb) => { const t = tl.load((n === 'frame-liner-gold' ? FR : dir === FR && /^frame-liner-(silver|copper)$/.test(n) ? FV : dir) + n + sfx); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = low ? 2 : 8; return t; };
  const makeMat = v => { const c = VAR[v], mat = new THREE.MeshStandardMaterial({ map: tex(c.dir, c.id, true), roughnessMap: tex(c.dir, c.id + '_r'), normalMap: low ? null : tex(c.dir, c.id + '_n'), aoMap: tex(c.dir, c.id + '_ao'), roughness: 1.0, metalness: 0.0, envMapIntensity: c.env, side: THREE.DoubleSide });
  const liner = c.liner ? tex(c.dir, c.liner, true) : null, lr = c.liner === 'frame-liner-silver' ? '.4' : c.liner === 'frame-liner-copper' ? '.42' : '.45', lm = c.liner === 'frame-liner-copper' ? '.65' : '.6';
  mat.onBeforeCompile = sh2 => { // world-mm U: ~1 repeat per 0.6 m of side length; aoMap reuses uv (r152+ uses aoMap channel 0 = uv)
    sh2.vertexShader = 'attribute float aLen;\n' + sh2.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv.x *= aLen / 0.6;\n#endif\n#ifdef USE_ROUGHNESSMAP\n vRoughnessMapUv.x *= aLen / 0.6;\n#endif\n#ifdef USE_NORMALMAP\n vNormalMapUv.x *= aLen / 0.6;\n#endif\n#ifdef USE_AOMAP\n vAoMapUv.x *= aLen / 0.6;\n#endif');
    if (liner) { sh2.uniforms.uLiner = { value: liner }; sh2.fragmentShader = 'uniform sampler2D uLiner;\n' + sh2.fragmentShader
      .replace('#include <map_fragment>', '#include <map_fragment>\nfloat lipK = smoothstep(.875, .885, vMapUv.y);\ndiffuseColor.rgb = mix(diffuseColor.rgb, texture2D(uLiner, vMapUv).rgb, lipK);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, ' + lm + ', lipK);')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, ' + lr + ', lipK);'); } };
  return mat; };
  // one InstancedMesh per variant in use (own geometry clone so each has its own aLen attribute)
  const cls = P.map(classify), G = {}, slot = P.map((p, i) => { const v = cls[i]; (G[v] = G[v] || { n: 0 }); return { v, j: G[v].n++ }; });
  for (const v in G) { const g = geo.clone(), la = new THREE.InstancedBufferAttribute(new Float32Array(G[v].n * 4).fill(1), 1); g.setAttribute('aLen', la);
    const m = new THREE.InstancedMesh(g, makeMat(v), G[v].n * 4); m.name = 'frameBars-' + v; m.frustumCulled = true; G[v].mesh = m; G[v].len = la; game.scene.add(m); }
  const sc = document.createElement('canvas'); sc.width = sc.height = 128; const x = sc.getContext('2d'), id = x.createImageData(128, 128);
  for (let j = 0; j < 128; j++) for (let i = 0; i < 128; i++) { const u = Math.abs(i / 63.5 - 1), v = Math.abs(j / 63.5 - 1), k = 0.7, d = Math.min(1, Math.hypot(Math.max(0, (u - k) / (1 - k)), Math.max(0, (v - k) / (1 - k)))); const o = (j * 128 + i) * 4; id.data[o + 3] = Math.round(Math.pow(1 - d, 1.8) * 255); }
  x.putImageData(id, 0, 0); let stex = new THREE.CanvasTexture(sc); // procedural fallback; #301 baked ring replaces it once loaded
  tl.load(FR + 'frame-contact-shadow' + sfx, t => { t.colorSpace = THREE.SRGBColorSpace; shadow.material.alphaMap = null; shadow.material.map = t; shadow.material.needsUpdate = true; /* RGBA ring: alpha from map.a, colour stays black */ });
  const shadow = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: stex, transparent: true, opacity: low ? 0.28 : 0.38, depthWrite: false }), P.length); shadow.name = 'frameShadows'; shadow.frustumCulled = true;
  game.scene.add(shadow);
  const m4 = new THREE.Matrix4(), loc = new THREE.Matrix4(), zero = new THREE.Matrix4().makeScale(0, 0, 0), last = P.map(() => null);
  function place(i) { const p = P[i], g = p.group; g.updateMatrixWorld(); const on = p.state === 'wall' || p.state == null;
    if (!on) { const { mesh: bars } = G[slot[i].v], b0 = slot[i].j * 4; for (let k = 0; k < 4; k++) bars.setMatrixAt(b0 + k, zero); shadow.setMatrixAt(i, zero); p.frame.visible = true; return; }
    const { mesh: bars, len: lenAttr } = G[slot[i].v], b0 = slot[i].j * 4; const fs = p.frame.scale, fw = fs.x, fh = fs.y, z = p.frame.position.z - 0.0; p.frame.visible = true; // flat backing stays (fills behind the lip)
    // across (geometry X) -> inward, depth (Y) -> +z off the wall, length (Z) -> along the side
    const sides = [[V(-fw / 2, fh / 2), V(0, -1), V(1, 0), fw], [V(fw / 2, -fh / 2), V(0, 1), V(-1, 0), fw], [V(-fw / 2, -fh / 2), V(1, 0), V(0, 1), fh], [V(fw / 2, fh / 2), V(-1, 0), V(0, -1), fh]];
    const kk = thin745(p); sides.forEach(([o, a, t, L], k) => { loc.makeBasis(new THREE.Vector3(a.x * kk, a.y * kk, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(t.x * L, t.y * L, 0)); loc.setPosition(o.x, o.y, z); bars.setMatrixAt(b0 + k, m4.multiplyMatrices(g.matrixWorld, loc)); lenAttr.setX(b0 + k, L); });
    loc.makeScale(fw + 0.1, fh + 0.1, 1); loc.setPosition(0.018, -0.03, 0.0015); shadow.setMatrixAt(i, m4.multiplyMatrices(g.matrixWorld, loc)); }
  function V(x, y) { return { x, y }; }
  // #745 (TJ Oct 27 2026): thin mouldings on small paintings: the 3 cm profile shrinks to the frame margin (1.5 cm per side for canvases <= 0.40 m)
  function thin745(p) { const d = p.data || {}, m = Math.min((p.frame.scale.x - (d.w || 0)) / 2, (p.frame.scale.y - (d.h || 0)) / 2); return m > 0 && m < W ? Math.max(0.4, m / W) : 1; }
  const dirty = () => { for (const v in G) G[v].len.needsUpdate = G[v].mesh.instanceMatrix.needsUpdate = true; shadow.instanceMatrix.needsUpdate = true; for (const v in G) G[v].mesh.computeBoundingSphere(); shadow.computeBoundingSphere(); }; // perf pass: bounds for frustum culling
  P.forEach((p, i) => place(i)); dirty();
  let acc = 0; const key = p => p.state + '|' + p.group.position.x.toFixed(3) + p.group.position.y.toFixed(3) + p.group.position.z.toFixed(3) + p.frame.scale.x.toFixed(3);
  P.forEach((p, i) => last[i] = key(p));
  window.__frameBars = { count: P.length, low: !!low, draws: Object.keys(G).length + 1, variants: Object.fromEntries(Object.entries(G).map(([v, g]) => [v, g.n])) };
  return { update(dt) { if ((acc += dt) < 0.2) return; acc = 0; let ch = false; P.forEach((p, i) => { const k = key(p); if (k !== last[i]) { last[i] = k; place(i); ch = true; } }); if (ch) dirty(); } };
}
