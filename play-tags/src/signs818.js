// #818 (TJ Oct 28 2026): gold entrance-sign family (same look as the PAUL MURPHY gallery title: gold caps, dark-brown stroke + drop shadow).
// (1) outdoor location signs above outdoor arches (catalog layout.tags.locSigns818; locked list only), (2) Starship tower-catch far behind
// the START fence, played the SECOND time the view swings back to the START entrance after the Roadster has flown away. Original procedural.
import * as THREE from 'three';
export function goldSignTex(text, W = 1024, H = 128) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); let fs = Math.round(H * 0.62);
  const font = s => `900 ${s}px Impact, "Arial Black", "Helvetica Neue", sans-serif`; x.font = font(fs); while (x.measureText(text).width > W * 0.92 && fs > 20) x.font = font(fs -= 4);
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'; const cx = W / 2, cy = H / 2 + 2;
  x.fillStyle = '#1a0e06'; x.fillText(text, cx + 5, cy + 5); x.lineWidth = Math.max(4, fs * 0.09); x.strokeStyle = '#4a2a10'; x.strokeText(text, cx, cy);
  const g = x.createLinearGradient(0, cy - fs / 2, 0, cy + fs / 2); g.addColorStop(0, '#ffe08a'); g.addColorStop(0.55, '#e7b44a'); g.addColorStop(1, '#b97f22'); x.fillStyle = g; x.fillText(text, cx, cy);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
export function goldSignMesh(text, w, h) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: goldSignTex(text), transparent: true, alphaTest: 0.05, depthWrite: false, toneMapped: false }));
  m.renderOrder = 3; m.raycast = () => {}; m.userData.decor = true; return m;
}
// #824 (tracker #787): procedural mosaic-tile plaque for outdoor loc signs (tesserae border, cream field, slate tile letters, dark grout).
export function mosaicSignTex(text, W = 1536, H = 192) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), ts = 12, cols = Math.floor(W / ts), rows = Math.floor(H / ts);
  const mk = document.createElement('canvas'); mk.width = cols; mk.height = rows; const m = mk.getContext('2d'); let fs = Math.round(rows * 0.6);
  const font = s => `900 ${s}px Impact, "Arial Black", sans-serif`; m.font = font(fs); while (m.measureText(text.toUpperCase()).width > (cols - 8) && fs > 4) m.font = font(--fs);
  m.textAlign = 'center'; m.textBaseline = 'middle'; m.fillStyle = '#fff'; m.fillText(text.toUpperCase(), cols / 2, rows / 2 + 0.5); const md = m.getImageData(0, 0, cols, rows).data;
  let sd = 0; for (const ch of text) sd = (sd * 31 + ch.charCodeAt(0)) >>> 0; const rnd = () => ((sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296);
  const BORD = ['#d9822b', '#c4562a', '#e8a33c', '#b8452a', '#f0b84a'], FIELD = ['#f6efe2', '#efe6d4', '#f9f4ea', '#ece2cf'], ACC = ['#9fb8e0', '#c9a6e0', '#e8c46a', '#8fc0d8'], INK = ['#4e5d6c', '#566676', '#455260', '#5d6b78'];
  const pk = a => a[Math.floor(rnd() * a.length)];
  x.fillStyle = '#3a3330'; x.fillRect(0, 0, W, H);
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) { const b = r < 2 || q < 2 || r >= rows - 2 || q >= cols - 2, ink = md[(r * cols + q) * 4 + 3] > 110;
    x.fillStyle = b ? pk(BORD) : ink ? pk(INK) : (rnd() < 0.06 ? pk(ACC) : pk(FIELD)); const j = () => (rnd() - 0.5) * 1.6;
    x.fillRect(q * ts + 1.2 + j(), r * ts + 1.2 + j(), ts - 2.4, ts - 2.4); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
export function mosaicSignMesh(text, w, h) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: mosaicSignTex(text), side: THREE.FrontSide, toneMapped: false }));
  m.renderOrder = 3; m.raycast = () => {}; m.userData.decor = true; m.userData.mosaic824 = true; return m;
}
export function installSigns818(root, W, T) {
  const out = { placed: [] }, L = T.locSigns818 || [];
  for (const s of L) { const oc = (T.openCourts || []).find(o => o.id === s.court); if (!oc) continue;
    if (s.at === 'gap801') { const d = (oc.doors800 || [])[0]; if (!d) continue; const tx = -d.nz, tz = d.nx, hw = (d.width || 2.2) / 2 + 0.12, g = new THREE.Group(); g.name = 'locSign818-' + s.court;
      const post = new THREE.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.6, metalness: 0.4 });
      for (const k of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.5, 0.14), post); p.position.set(d.x + tx * hw * k, 1.75, d.z + tz * hw * k); g.add(p); }
      const bar = new THREE.Mesh(new THREE.BoxGeometry(hw * 2 + 0.14, 0.62, 0.08), new THREE.MeshStandardMaterial({ color: 0x3a2a18, roughness: 0.5, metalness: 0.3 })); bar.position.set(d.x, 3.2, d.z); bar.rotation.y = Math.atan2(d.nx, d.nz) ; g.add(bar);
      for (const k of [-1, 1]) { const m = goldSignMesh(s.label, hw * 2 - 0.2, (hw * 2 - 0.2) / 8); m.position.set(d.x + d.nx * 0.05 * k, 3.2, d.z + d.nz * 0.05 * k); m.rotation.y = Math.atan2(d.nx * k, d.nz * k); g.add(m); }
      g.traverse(o => { if (o.isMesh) o.raycast = () => {}; }); root.add(g); out.placed.push(s.court + ':gap:' + s.label); continue; }
    const at = oc.door && oc.door.at; if (!at) continue; const d = W.doors.find(q => Math.abs(q.x - at[0]) < 0.06 && Math.abs(q.z - at[1]) < 0.06); if (!d) { out.placed.push(s.court + ':nodoor'); continue; }
    let sg = Math.sign((oc.center[0] - d.x) * d.nx + (oc.center[1] - d.z) * d.nz) || 1; if (s.at === 'room') sg = -sg; // court face, or the gallery-room face of the same arch
    const m = (s.style === 'mosaic' ? mosaicSignMesh : goldSignMesh)(s.label, 3.6, 0.45); /* gold844 loc; mosaic only for annex844 */ m.position.set(d.x + d.nx * sg * 0.14, 3.95, d.z + d.nz * sg * 0.14); m.rotation.y = Math.atan2(d.nx * sg, d.nz * sg); m.name = 'locSign818-' + s.court + '-' + (s.at || 'court');
    root.add(m); out.placed.push(s.court + ':' + (s.at || 'court') + ':' + s.label); }
  return out;
}
export function installStarship818(root, T, low) {
  const oc = (T.openCourts || []).find(o => o.id === 'courtyard-start'); const R = oc && oc.roadster; if (!R) return { err: 'no start' };
  const S = { state: 'wait', returns: 0, t: 0 }, g = new THREE.Group(); g.name = 'starship818'; g.visible = false;
  const BX = 34, BZ = -205, K = 1; g.position.set(BX, 0, BZ); // far background beyond the START fence (direction court -> roadster)
  const steel = new THREE.MeshBasicMaterial({ color: 0xbfc4ca, fog: false }), dark = new THREE.MeshBasicMaterial({ color: 0x2b2f34, fog: false }), fl = new THREE.MeshBasicMaterial({ color: 0xffb04a, transparent: true, opacity: 0.9, fog: false, depthWrite: false });
  // tower: square lattice column (4 legs + cross ties) + two chopstick arms
  const TH = 72, tw = new THREE.Group(); g.add(tw); const leg = new THREE.BoxGeometry(0.9, TH, 0.9);
  for (const [a, b] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) { const l = new THREE.Mesh(leg, dark); l.position.set(a, TH / 2, b); tw.add(l); }
  for (let y = 4; y < TH; y += low ? 8 : 4) for (const r of [0, Math.PI / 2]) { const tie = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.4, 0.4), dark); tie.position.set(Math.sin(r) * 3, y, Math.cos(r) * 3); tie.rotation.y = r; tw.add(tie); const t2 = tie.clone(); t2.position.set(-Math.sin(r) * 3, y, -Math.cos(r) * 3); tw.add(t2); }
  const arms = new THREE.Group(); arms.position.set(0, 52, 0); tw.add(arms); const armL = [];
  for (const k of [-1, 1]) { const p = new THREE.Group(); p.position.set(3.5, 0, 3.2 * k); const a = new THREE.Mesh(new THREE.BoxGeometry(17, 1.4, 1.0), dark); a.position.x = 8.5; p.add(a); p.rotation.y = -k * 0.55; arms.add(p); armL.push({ p, k }); }
  // ship: stainless cylinder + nose cone + 4 flaps, engine glow
  const ship = new THREE.Group(); g.add(ship); const SR = 4.5, SH = 50;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(SR, SR, SH, 20, 1), steel); body.position.y = SH / 2; ship.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(SR, 10, 20), steel); nose.position.y = SH + 5; ship.add(nose);
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7, 4), dark); const r = i * Math.PI / 2 + Math.PI / 4; f.position.set(Math.cos(r) * SR, i < 2 ? SH - 2 : 5, Math.sin(r) * SR); f.rotation.y = -r; ship.add(f); }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(3.4, 14, 14, 1, true), fl); flame.rotation.x = Math.PI; flame.position.y = -7; ship.add(flame);
  const CX = 3.5 + 11, CZ = 0, Y_CATCH = 52 - SH * 0.78; // ship stands beside the tower, caught under its upper body
  ship.position.set(CX, 400, CZ); g.traverse(o => { if (o.isMesh) { o.raycast = () => {}; o.userData.decor = true; o.frustumCulled = false; } }); root.add(g);
  const fwd = new THREE.Vector3(), to = new THREE.Vector3(); let behind = false, hold = 0, last = performance.now();
  function anim(dt) { S.t += dt; const t = S.t, D = 14; // 0..D descent (ease-out), D..D+2.5 arms close, then hold caught
    const u = Math.min(1, t / D), y = Y_CATCH + (400 - Y_CATCH) * Math.pow(1 - u, 3); ship.position.y = y; ship.rotation.z = (1 - u) * 0.25;
    flame.visible = t < D + 0.6; flame.scale.y = 0.7 + 0.3 * Math.random() + (1 - u) * 0.5;
    const c = Math.min(1, Math.max(0, (t - D + 0.4) / 2.5)); for (const a of armL) a.p.rotation.y = -a.k * (0.55 - 0.38 * c);
    if (t > D + 3) { S.state = 'caught'; flame.visible = false; } }
  function tick() { const now = performance.now(), dt = Math.min(0.2, (now - last) / 1000); last = now; const cam = window.game && window.game.camera, rd = window.__roadster785;
    if (S.state === 'wait' && cam && rd && rd.state && rd.state().includes('gone')) { to.set(R.x - cam.position.x, 0, R.z - cam.position.z); const dist = to.length();
      if (dist < 45 && dist > 0.5) { to.divideScalar(dist); cam.getWorldDirection(fwd); fwd.y = 0; fwd.normalize(); const dot = fwd.dot(to);
        if (dot < 0.2) behind = true; if (behind && dot > 0.9) { if ((hold += dt) > 0.3) { behind = false; hold = 0; S.returns++; if (S.returns >= 2) { S.state = 'play'; S.t = 0; g.visible = true; } } } else hold = 0; } }
    else if (S.state === 'play') anim(dt);
    if (S.state !== 'caught') requestAnimationFrame(tick); }
  requestAnimationFrame(tick);
  S.trigger = () => { S.state = 'play'; S.t = 0; g.visible = true; }; S.at = [BX, BZ]; return S;
}
