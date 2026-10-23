// TJ's art books on stone lecterns, Myst-style: closed cover up close, E / click / tap to read, page-turns, Esc to close.
import * as THREE from 'three';
const TILT = 0.44, PH = 0.40; // lectern slope (rad), page height (m)
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const basic = (o) => { const m = new THREE.MeshBasicMaterial(o); m.toneMapped = false; m.fog = false; return m; };

export function makeBooks({ scene, camera, controls, defs, base = '', low = false, stone, pillars, isMuted, onReading }) {
  const loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
  const tex = new Map(); // url -> {t, state}
  function getTex(url, cb) { let e = tex.get(url); if (e) { if (e.t && e.ok) cb && cb(e.t); else if (cb) e.cbs.push(cb); return e; }
    e = { t: null, ok: false, cbs: cb ? [cb] : [], used: performance.now() }; tex.set(url, e);
    e.t = loader.load(url, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; e.ok = true; e.cbs.forEach(f => f(t)); e.cbs = []; }, undefined, () => { tex.delete(url); });
    return e; }
  const pageUrl = (b, n, s) => `${base}books/${b.d.id}/${String(n).padStart(3, '0')}-${s}.webp`;
  const glow = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 2, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,225,170,.9)'); r.addColorStop(.5, 'rgba(255,190,120,.35)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false };
  const paper = 0xf3ecdc, leather = 0x4a2416;
  const B = defs.map(d => {
    const W = PH * d.aspect, g = new THREE.Group(); g.position.set(d.x, 0, d.z); g.rotation.y = d.yaw; scene.add(g);
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.82, 0.34), stone); col.position.y = 0.47; g.add(col);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.62), stone); foot.position.y = 0.06; g.add(foot);
    const desk = new THREE.Group(); desk.position.set(0, 1.06, 0); desk.rotation.x = TILT; g.add(desk);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(2 * W + 0.14, 0.05, PH + 0.12), stone); slab.position.y = -0.025; desk.add(slab);
    const book = new THREE.Group(); book.rotation.x = -Math.PI / 2; book.position.y = 0.002; desk.add(book);
    const plane = (w, h, mat, x, z, ry = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, 0, z); m.rotation.y = ry; return m; };
    const block = new THREE.Mesh(new THREE.BoxGeometry(W, PH, 0.03), basic({ color: 0xe8e0cc })); block.position.set(W / 2, 0, 0.015); book.add(block);
    const blockL = block.clone(); blockL.position.x = -W / 2; blockL.visible = false; book.add(blockL);
    const back = plane(W + 0.01, PH + 0.01, basic({ color: leather, side: THREE.DoubleSide }), W / 2, -0.002); book.add(back);
    const pageL = plane(W, PH, basic({ color: paper }), -W / 2, 0.031); pageL.visible = false; book.add(pageL);
    const pageR = plane(W, PH, basic({ color: paper }), W / 2, 0.031); book.add(pageR);
    const coverPivot = new THREE.Group(); coverPivot.position.z = 0.0335; book.add(coverPivot);
    const coverMat = basic({ color: 0xffffff }); getTex(base + d.cover, t => { coverMat.map = t; coverMat.needsUpdate = true; });
    const cover = plane(W + 0.008, PH + 0.008, coverMat, W / 2, 0.001); coverPivot.add(cover);
    const coverIn = plane(W + 0.008, PH + 0.008, basic({ color: 0x5a2c1a }), W / 2, -0.001, Math.PI); coverPivot.add(coverIn);
    const turn = new THREE.Group(); turn.position.z = 0.033; turn.visible = false; book.add(turn);
    const tF = plane(W, PH, basic({ color: paper }), W / 2, 0.0005), tB = plane(W, PH, basic({ color: paper }), W / 2, -0.0005, Math.PI); turn.add(tF, tB);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1.3, 40), new THREE.MeshBasicMaterial({ map: glow, ...add, opacity: 0.55 })); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.015; g.add(pool);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.9, 2.6, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd7a0, ...add, opacity: 0.05, side: THREE.DoubleSide })); cone.position.y = 1.4; g.add(cone);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(2 * W + 0.5, PH + 0.4), new THREE.MeshBasicMaterial({ map: glow, ...add, opacity: 0.35 })); halo.rotation.x = -Math.PI / 2; halo.position.y = 0.003; desk.add(halo);
    if (!low) { const s = new THREE.SpotLight(0xffd6a0, 6, 5, 0.5, 0.7, 1.5); s.position.set(0, 3.4, 0.6); s.target = desk; g.add(s); }
    pillars && pillars.push([d.x, d.z]);
    const npg = d.pages, spreads = Math.floor(npg / 2) + 1;
    return { d, W, g, desk, book, block, blockL, pageL, pageR, coverPivot, turn, tF, tB, hit: [col, slab, cover, block], npg, spreads, spread: 0 };
  });
  const allHits = B.flatMap(b => b.hit.map(m => (m.userData.book = b, m)));
  // ---- page textures: lo (128) everywhere nearby, md (512) for ±2 spreads, hi (1024) only for the open spread ----
  const leftOf = (b, s) => s === 0 ? 0 : 2 * s, rightOf = (b, s) => 2 * s + 1; // 0 / >npg = blank paper
  function setPage(mesh, b, n, sharp) {
    const m = mesh.material; if (!n || n > b.npg) { m.map = null; m.color.set(paper); m.needsUpdate = true; mesh.userData.n = 0; return; }
    mesh.userData.n = n; m.color.set(0xffffff);
    const best = () => { for (const s of sharp ? ['hi', 'md', 'lo'] : ['md', 'lo']) { const e = tex.get(pageUrl(b, n, s)); if (e && e.ok) return e.t; } return null; };
    const apply = () => { if (mesh.userData.n !== n) return; const t = best(); if (t && m.map !== t) { m.map = t; m.needsUpdate = true; } else if (!t && !m.map) { m.color.set(paper); } };
    if (m.map && !(m.map.userData && m.map.userData.n === n)) { m.map = null; m.needsUpdate = true; }
    getTex(pageUrl(b, n, 'lo'), t => { t.userData.n = n; apply(); });
    getTex(pageUrl(b, n, 'md'), t => { t.userData.n = n; apply(); });
    if (sharp) getTex(pageUrl(b, n, 'hi'), t => { t.userData.n = n; apply(); });
    apply();
  }
  function prefetch(b, s) {
    for (let k = s - 2; k <= s + 3; k++) { if (k < 0 || k >= b.spreads) continue; for (const n of [leftOf(b, k), rightOf(b, k)]) if (n && n <= b.npg) { getTex(pageUrl(b, n, 'lo')); if (Math.abs(k - s) <= 2) getTex(pageUrl(b, n, 'md')); } }
    // evict far md/hi textures of this book
    for (const [u, e] of tex) { const m = u.match(/books\/([^/]+)\/(\d+)-(hi|md)\.webp$/); if (!m || m[1] !== b.d.id || !e.ok) continue; const n = +m[2], k = Math.floor(n / 2);
      if ((m[3] === 'hi' && k !== s) || (m[3] === 'md' && Math.abs(k - s) > 3)) { e.t.dispose(); tex.delete(u); } }
  }
  function showSpread(b, s) { b.spread = s; setPage(b.pageL, b, leftOf(b, s), true); setPage(b.pageR, b, rightOf(b, s), true); b.pageL.visible = s > 0 || reading === b; prefetch(b, s); ui.update(); }
  // ---- paper sound ----
  let actx = null; function paperSound() { if (isMuted && isMuted()) return; try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume();
    const n = actx.sampleRate * 0.45, buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) { const t = i / n; d[i] = (Math.random() * 2 - 1) * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.6)), 2) * (0.6 + 0.4 * Math.sin(t * 40)); }
    const src = actx.createBufferSource(); src.buffer = buf; const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 0.7; const g = actx.createGain(); g.gain.value = 0.16;
    src.connect(f).connect(g).connect(actx.destination); src.start(); } catch (e) {} }
  // ---- UI overlay ----
  const ui = (() => { const el = document.createElement('div'); el.id = 'bookui'; el.hidden = true;
    el.innerHTML = '<div class="bk-top"><b class="bk-title"></b><a class="bk-link" target="_blank" rel="noopener">View on tjm.art ↗</a><button type="button" class="bk-close" aria-label="Close book">✕ Close</button></div><div class="bk-bot"><button type="button" class="bk-prev" aria-label="Previous pages">‹</button><span class="bk-pg"></span><button type="button" class="bk-next" aria-label="Next pages">›</button></div>';
    document.body.appendChild(el); const q = s => el.querySelector(s);
    ['mousedown', 'pointerdown', 'touchstart', 'touchend', 'click', 'mouseup'].forEach(ev => el.querySelectorAll('button,a').forEach(x => x.addEventListener(ev, e => e.stopPropagation(), { passive: ev !== 'click' })));
    q('.bk-close').addEventListener('click', () => close(true)); q('.bk-prev').addEventListener('click', () => flip(-1)); q('.bk-next').addEventListener('click', () => flip(1));
    return { el, update() { const b = reading || opening; if (!b) return; q('.bk-title').textContent = b.d.title; q('.bk-link').href = b.d.url; const L = leftOf(b, b.spread), R = rightOf(b, b.spread);
      q('.bk-pg').textContent = b.spread === 0 ? `p. 1 / ${b.npg}` : R <= b.npg ? `pp. ${L}–${R} / ${b.npg}` : `p. ${L} / ${b.npg}`; q('.bk-prev').disabled = b.spread === 0; q('.bk-next').disabled = b.spread >= b.spreads - 1; } }; })();
  // ---- open / close / flip ----
  let reading = null, opening = null, anim = null, saved = null, flipQ = 0;
  const hint = document.createElement('div'); hint.id = 'bookhint'; hint.hidden = true; document.body.appendChild(hint);
  function readPose(b) { b.desk.updateMatrixWorld(true); const c = new THREE.Vector3(0, 0.03, 0).applyMatrix4(b.desk.matrixWorld);
    const n = new THREE.Vector3(0, 1, 0).transformDirection(b.desk.matrixWorld), up = new THREE.Vector3(0, 0, -1).transformDirection(b.desk.matrixWorld);
    const tn = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), fit = Math.max(PH * 1.3 / 2 / tn, (b.W * 2 * 1.18) / 2 / (tn * camera.aspect));
    const pos = c.clone().addScaledVector(n, fit); const m = new THREE.Matrix4().lookAt(pos, c, up); return { pos, quat: new THREE.Quaternion().setFromRotationMatrix(m) }; }
  function open(b) { if (reading || opening || anim) return; opening = b; window.__reading = true; onReading && onReading(true);
    saved = { pos: camera.position.clone(), quat: camera.quaternion.clone(), locked: controls.isLocked }; if (controls.isLocked) controls.unlock();
    b.spread = 0; showSpread(b, 0); b.pageL.visible = false; ui.el.hidden = false; ui.update(); hint.hidden = true;
    const to = readPose(b); anim = { t: 0, dur: 1.1, kind: 'open', b, from: { pos: camera.position.clone(), quat: camera.quaternion.clone() }, to }; }
  let pendingClose = null;
  function close(relock) { if (anim && (anim.kind === 'flip' || anim.kind === 'open')) { pendingClose = { relock }; flipQ = 0; return; } const b = reading; if (!b || anim) return; pendingClose = null; flipQ = 0; anim = { t: 0, dur: 0.9, kind: 'close', b, from: { pos: camera.position.clone(), quat: camera.quaternion.clone() }, to: saved, relock }; }
  function flip(dir) { const b = reading; if (!b) return; if (anim) { if (anim.kind === 'flip') flipQ = Math.max(-3, Math.min(3, flipQ + dir)); return; }
    const s = b.spread + dir; if (s < 0 || s >= b.spreads) return; paperSound();
    b.turn.visible = true;
    if (dir > 0) { setPage(b.tF, b, rightOf(b, b.spread), true); setPage(b.tB, b, leftOf(b, s), true); setPage(b.pageR, b, rightOf(b, s), true); b.turn.rotation.y = 0; }
    else { setPage(b.tF, b, rightOf(b, s), true); setPage(b.tB, b, leftOf(b, b.spread), true); setPage(b.pageL, b, leftOf(b, s), true); b.turn.rotation.y = -Math.PI; if (s === 0) b.pageL.visible = false; }
    if (dir > 0 && b.spread === 0) { b.pageL.visible = false; }
    anim = { t: 0, dur: low ? 0.5 : 0.65, kind: 'flip', b, dir, s }; }
  let lastT = performance.now();
  function update() { const nowT = performance.now(), dt = Math.min(0.5, (nowT - lastT) / 1000); lastT = nowT;
    if (anim) { anim.t += dt; const k = Math.min(1, anim.t / anim.dur), e = ease(k), a = anim, b = a.b;
      if (a.kind === 'open' || a.kind === 'close') { camera.position.lerpVectors(a.from.pos, a.to.pos, e); camera.quaternion.slerpQuaternions(a.from.quat, a.to.quat, e);
        const c = a.kind === 'open' ? THREE.MathUtils.clamp((k - 0.35) / 0.65, 0, 1) : THREE.MathUtils.clamp(1 - k / 0.6, 0, 1); b.coverPivot.rotation.y = -Math.PI * ease(c); b.coverPivot.position.z = 0.0335 - 0.0375 * THREE.MathUtils.clamp((ease(c) - 0.5) * 2, 0, 1);
        b.blockL.visible = c > 0.5; b.pageL.visible = c > 0.92 && b.spread > 0; if (a.kind === 'open' && c > 0.92) b.pageL.visible = true; }
      else if (a.kind === 'flip') { const th = a.dir > 0 ? -Math.PI * e : -Math.PI * (1 - e); b.turn.rotation.y = th; b.turn.position.z = 0.033 + Math.sin(Math.PI * e) * 0.02; }
      if (k >= 1) { anim = null;
        if (pendingClose && a.kind !== 'close') { const pc = pendingClose; pendingClose = null; if (a.kind === 'open') { reading = b; opening = null; } else { b.turn.visible = false; showSpread(b, a.s); } b.pageL.visible = true; close(pc.relock); return; }
        if (a.kind === 'open') { reading = b; opening = null; b.pageL.visible = true; setPage(b.pageL, b, 0, true); ui.update(); }
        else if (a.kind === 'close') { reading = null; ui.el.hidden = true; b.coverPivot.rotation.y = 0; b.coverPivot.position.z = 0.0335; b.blockL.visible = false; b.pageL.visible = false; b.spread = 0; setPage(b.pageR, b, 1, false);
          window.__reading = false; onReading && onReading(false); if (a.relock !== false) { try { controls.lock(); } catch (x) {} } }
        else { b.turn.visible = false; showSpread(b, a.s); b.pageL.visible = true; if (flipQ) { const q = Math.sign(flipQ); flipQ -= q; flip(q); } } } }
    if (!reading && !anim) { const b = nearest(); hint.hidden = !b; if (b) hint.textContent = (matchMedia('(pointer:coarse)').matches ? 'Tap' : 'E / click') + ' to read “' + b.d.title + '”'; }
  }
  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
  function nearest() { let best = null, bd = 2.6; for (const b of B) { const dx = b.d.x - camera.position.x, dz = b.d.z - camera.position.z, d = Math.hypot(dx, dz); if (d > bd) continue;
      const f = new THREE.Vector3(); camera.getWorldDirection(f); if ((f.x * dx + f.z * dz) / (d || 1) > 0.55) { best = b; bd = d; } } return best; }
  function tryOpen(ndc) { if (reading || anim) return false; camera.updateMatrixWorld(); ray.setFromCamera(ndc || v2.set(0, 0), camera); ray.far = 3.2;
    const h = ray.intersectObjects(allHits, false)[0]; if (h) { open(h.object.userData.book); return true; } if (!ndc) { const b = nearest(); if (b) { open(b); return true; } } return false; }
  // input while reading
  addEventListener('keydown', e => { if (!reading) return; if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'PageDown' || e.code === 'Space') { flip(1); e.preventDefault(); }
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'PageUp') { flip(-1); e.preventDefault(); } else if (e.code === 'Escape') close(false); }, true);
  let ts = null;
  addEventListener('pointerdown', e => { if (!reading || e.target.closest && e.target.closest('#bookui,#soundbtn,#homebtn,#hud')) return; ts = { x: e.clientX, y: e.clientY, t: performance.now() }; }, true);
  addEventListener('pointerup', e => { if (!reading || !ts) return; const dx = e.clientX - ts.x, dy = e.clientY - ts.y; const s = ts; ts = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { flip(dx < 0 ? 1 : -1); return; } if (Math.hypot(dx, dy) < 12 && performance.now() - s.t < 500) flip(e.clientX > innerWidth / 2 ? 1 : -1); }, true);
  return { B, update, tryOpen, open, close, flip, get reading() { return !!reading || !!anim; },
    get state() { const b = reading || opening; return { reading: !!reading, anim: anim && anim.kind, book: b && b.d.id, spread: b && b.spread, left: b && b.pageL.userData.n, right: b && b.pageR.userData.n, leftTex: b && b.pageL.material.map && b.pageL.material.map.image && b.pageL.material.map.image.width, rightTex: b && b.pageR.material.map && b.pageR.material.map.image && b.pageR.material.map.image.width, cached: tex.size, hint: hint.hidden ? null : hint.textContent }; } };
}
