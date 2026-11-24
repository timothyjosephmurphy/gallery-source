// #358 / Visual #479: facade window mesh cards (public /img/play/preview-251/window-mesh-cards/) on courtyard-facing room walls, avoiding door cuts,
// with Visual's night glows (window-glows/, glows.json) attached at each card's GlowAttach, quad = 1.8x window (1.44x2.16 m), arched enabled.
// Visibility of glows: lerp 0->1 as sun elev goes +2 -> -4 deg (glows.json), elev from S.elev / S.sunElev / clockSunElev.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clockSunElev } from './horizon352.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const BASE = import.meta.env.BASE_URL + 'img/play/preview-251/window-glows/', CARDS = import.meta.env.BASE_URL + 'img/play/preview-251/window-mesh-cards/';
const SHAPES = { single: 'window-single.glb', mullion: 'window-mullion.glb', arched: 'window-arched.glb' };
const CARD_S = 1.2, SILL_Y = 2.75, END_M = 0.75, STEP = 2.6, GLOW_X = 1.8;
export function facadeSlots358(W) {
  const courts = W.rooms.filter(r => r.kind === 'court'), rms = W.rooms.filter(r => r.kind === 'room'), slots = [];
  if (!courts.length) courts.push(...W.rooms.filter(r => r.kind === 'hub')); // #774 honeycomb: no inner courts, the facades face the pavilion
  const inPoly = (x, z, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > z) !== (p[j][1] > z) && x < (p[j][0] - p[i][0]) * (z - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c; };
  for (const w of W.walls || []) { if (!w.room || !rms.some(r => r.id === w.room)) continue;
    const mx = (w.x0 + w.x1) / 2, mz = (w.z0 + w.z1) / 2, px = mx + w.nx * 1.5, pz = mz + w.nz * 1.5;
    if (!courts.some(c => Math.hypot(px - c.center[0], pz - c.center[1]) < c.radius) || rms.some(r => inPoly(px, pz, r.poly))) continue;
    const L = Math.hypot(w.x1 - w.x0, w.z1 - w.z0), U = L - 2 * END_M; if (U < 0.8) continue; const n = Math.floor(U / STEP) + 1, tx = (w.x1 - w.x0) / L, tz = (w.z1 - w.z0) / L;
    for (let i = 0; i < n; i++) { const s = END_M + (n === 1 ? U / 2 : (U * i) / (n - 1)), x = w.x0 + tx * s + w.nx * 0.03, z = w.z0 + tz * s + w.nz * 0.03;
      if ((W.doors || []).some(d => Math.hypot(d.x - x, d.z - z) < (d.width || 1.8) / 2 + 0.9)) continue;
      if ((W.art || []).some(a => Math.hypot(a.x - x, a.z - z) < 1.3 && (a.ix * w.nx + a.iz * w.nz) > 0.5)) continue;
      slots.push({ x, z, nx: w.nx, nz: w.nz, room: w.room }); } }
  if (!slots.length && !W.rooms.some(r => r.kind === 'court')) for (const w of W.walls || []) { if (!w.room || !rms.some(r => r.id === w.room)) continue; /* #777 nest: no courts and every pavilion wall is an arch -> windows on the exterior faces */
    const r = rms.find(q => q.id === w.room), mx = (w.x0 + w.x1) / 2, mz = (w.z0 + w.z1) / 2; let nx = w.nx, nz = w.nz; if (nx * (mx - r.center[0]) + nz * (mz - r.center[1]) < 0) { nx = -nx; nz = -nz; }
    const px = mx + nx * 1.5, pz = mz + nz * 1.5; if (rms.some(q => inPoly(px, pz, q.poly)) || Math.hypot(px, pz) < 9) continue;
    const L = Math.hypot(w.x1 - w.x0, w.z1 - w.z0), U = L - 2 * END_M; if (U < 0.8) continue; const n = Math.floor(U / STEP) + 1, tx = (w.x1 - w.x0) / L, tz = (w.z1 - w.z0) / L;
    for (let i = 0; i < n; i++) { const s = END_M + (n === 1 ? U / 2 : (U * i) / (n - 1)), x = w.x0 + tx * s + nx * 0.03, z = w.z0 + tz * s + nz * 0.03;
      if ((W.doors || []).some(d => Math.hypot(d.x - x, d.z - z) < (d.width || 1.8) / 2 + 0.9)) continue; slots.push({ x, z, nx, nz, room: w.room }); } }
  return slots;
}
export function installGlows358({ scene, low, S, W }) {
  const G = S.glow358 = { count: 0, cards: 0, lit: 0, k: 0, ready: false, err: null, gain: 1, update() {} };
  const q = new URLSearchParams(location.search); if (q.get('glows') === '0') { G.err = 'off'; return G; } const gq = +q.get('glowGain'); if (isFinite(gq) && gq > 0) G.gain = gq;
  if (!W) { G.err = 'no world'; return G; }
  const slots = facadeSlots358(W); G.count = slots.length; G.slots = slots; if (!slots.length) { G.err = 'no facade slots'; return G; }
  let seed = 358; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); const names = Object.keys(SHAPES);
  slots.forEach(s => { s.shape = names[Math.floor(rnd() * names.length)]; });
  const loader = new GLTFLoader(), load = f => new Promise((res, rej) => loader.load(CARDS + f, res, undefined, rej));
  const group = new THREE.Group(); group.name = 'windowCards358'; scene.add(group);
  Promise.all([fetch(BASE + 'glows.json').then(r => r.json()), ...names.map(n => load(SHAPES[n]))]).then(([cfg, ...gl]) => {
    const proto = {}; names.forEach((n, i) => { proto[n] = gl[i].scene; });
    const ttl = new THREE.TextureLoader();
    if (low) for (const n of names) proto[n].traverse(o => { if (o.isMesh && /Frame$/.test(o.name) && o.material.map) { const m = o.material; ttl.load(CARDS + 'frame-' + n + '.phone.webp', t => { t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; m.map = t; m.needsUpdate = true; }); } });
    const [lo, hi] = (cfg.nightOnly && cfg.nightOnly.fadeInDeg) || [-4, 2], fl = cfg.flicker || {}, amp = fl.enabled ? (fl.amp || 0) : 0, hz = fl.hz || 0.3;
    const bySprite = new Map(), mats = [], m4 = new THREE.Matrix4(), pos = new THREE.Vector3(), quat = new THREE.Quaternion(), scl = new THREE.Vector3();
    for (const s of slots) {
      const c = proto[s.shape].clone(true); c.position.set(s.x, SILL_Y, s.z); c.scale.setScalar(CARD_S); c.rotation.y = Math.atan2(s.nx, s.nz); group.add(c); c.updateMatrixWorld(true); G.cards++;
      const ga = c.getObjectByName('GlowAttach'); if (!ga) throw new Error('GlowAttach missing ' + s.shape);
      if (rnd() > (cfg.litFraction ?? 0.6)) continue;
      const cur = rnd() < (cfg.curtainShare ?? 0.3), list = cfg.sprites.filter(p => p.shape === s.shape && p.curtain === cur), sp = list[0] || cfg.sprites.find(p => p.shape === s.shape);
      if (!sp) throw new Error('no glow sprite ' + s.shape);
      ga.getWorldPosition(pos); c.getWorldQuaternion(quat); (bySprite.get(sp) || bySprite.set(sp, []).get(sp)).push({ p: pos.clone(), q: quat.clone(), ph: rnd() * Math.PI * 2 }); }
    // #488: merge glTF card meshes per (name, shared material) across clones -> 1 draw each; originals hidden (fail soft).
    try { const M = window.__m488 = { err: null, from: 0, to: 0 }, grp = new Map(); group.updateMatrixWorld(true);
      group.traverse(o => { if (!o.isMesh || Array.isArray(o.material) || o.isSkinnedMesh || o.isInstancedMesh) return; const k = o.name + '|' + o.material.uuid; (grp.get(k) || grp.set(k, []).get(k)).push(o); });
      for (const [, L] of grp) { if (L.length < 3) continue; const gs = L.map(o => { const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld); return g; }); const mg = mergeGeometries(gs, false); gs.forEach(g => g.dispose()); if (!mg) throw new Error('merge null ' + L[0].name);
        const mm = new THREE.Mesh(mg, L[0].material); mm.name = L[0].name; mm.castShadow = L[0].castShadow; mm.receiveShadow = L[0].receiveShadow; mm.renderOrder = L[0].renderOrder - (/Glass$/.test(L[0].name) ? 1 : 0); /* glass (5 mm behind frame, no depthWrite) must draw before frame */ mm.userData.merge488 = L.length; scene.add(mm); L.forEach(o => { o.visible = false; }); M.from += L.length; M.to++; }
    } catch (e) { window.__m488 = { err: String(e && e.message || e) }; console.warn('[488 merge]', e); }
    const ww = 0.667 * CARD_S;
    for (const [sp, list] of bySprite) {
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(sp.color || '#F7A66E'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide });
      ttl.load(BASE + sp.files[low ? 'phone' : 'desktop'], t => { t.colorSpace = THREE.SRGBColorSpace; mat.map = t; mat.needsUpdate = true; }, undefined, () => { G.err = 'tex ' + sp.id; });
      const geo = new THREE.PlaneGeometry(1, 1.5), im = new THREE.InstancedMesh(geo, mat, list.length), sv = new THREE.Vector3(ww * GLOW_X, ww * GLOW_X, 1);
      list.forEach((g, j) => { m4.compose(g.p, g.q, sv); im.setMatrixAt(j, m4); });
      im.name = 'windowGlow358-' + sp.id; im.renderOrder = 3; im.frustumCulled = false; im.visible = false; scene.add(im); G.lit += list.length;
      mats.push({ mat, im, I: sp.emissiveIntensity || 1, ph: list[0].ph }); }
    G.ready = true;
    G.update = () => { const e = isFinite(S.elev) ? S.elev : (isFinite(S.sunElev) ? S.sunElev : clockSunElev()), k = Math.min(1, Math.max(0, (hi - e) / (hi - lo))); G.k = k; G.elev = e;
      const t = performance.now() / 1000; for (const m of mats) { m.im.visible = k > 0.005; if (!m.im.visible) continue; m.mat.opacity = Math.min(1, k * G.gain * (m.I / 1.4) * (1 + amp * Math.sin(t * hz * Math.PI * 2 + m.ph))); } };
  }).catch(e => { G.err = String(e && e.message || e); console.warn('[358w]', e); });
  return G;
}
