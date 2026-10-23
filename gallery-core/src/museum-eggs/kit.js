// museum-eggs shared kit: merged low-poly builder, text textures, synth audio, captions/bubbles, look tests, click/tap
// routing, colliders and a coarse nav grid. Everything is procedural; no external assets.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export { THREE };
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const ease = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = a => a[(Math.random() * a.length) | 0];

// ---------- quality: 'hd' (default) = more segments, bevelled boxes, PBR materials; 'low' (ctx.lowPower) = lighter ----------
export const Q = { detail: 2, bevel: 2, low: false };
const segs = (n, cap = 48) => Math.max(n, Math.min(cap, Math.round(n * Q.detail)));
// ---------- merged, vertex-coloured builder: one draw call per material per prop ----------
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _c = new THREE.Color();
export function builder() {
  const parts = [];
  function add(geo, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone(); geo.dispose();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    _m.compose(V(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), V(sx, sy, sz)); g.applyMatrix4(_m);
    _c.set(color); const n = g.attributes.position.count, col = new Float32Array(n * 3); for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k);
    parts.push(g); return api; }
  const api = {
    add,
    // boxes thicker than 3 cm get a small rounded bevel (catches the light on edges); thin trims and wires stay plain boxes
    box: (w, h, d, c, x, y, z, rx, ry, rz) => { const m = Math.min(w, h, d); return add(m >= 0.03 && Q.bevel ? new RoundedBoxGeometry(w, h, d, Q.bevel, Math.min(0.02, m * 0.22)) : new THREE.BoxGeometry(w, h, d), c, x, y, z, rx, ry, rz); },
    rbox: (w, h, d, rad, c, x, y, z, rx, ry, rz) => add(new RoundedBoxGeometry(w, h, d, Math.max(2, Q.bevel + 1), Math.min(rad, Math.min(w, h, d) / 2 - 1e-4)), c, x, y, z, rx, ry, rz),
    cyl: (rt, rb, h, seg, c, x, y, z, rx, ry, rz) => add(new THREE.CylinderGeometry(rt, rb, h, segs(seg)), c, x, y, z, rx, ry, rz),
    sph: (r, ws, hs, c, x, y, z, sx = 1, sy = 1, sz = 1) => add(new THREE.SphereGeometry(r, segs(ws), segs(hs, 32)), c, x, y, z, 0, 0, 0, sx, sy, sz),
    cone: (r, h, seg, c, x, y, z, rx, ry, rz) => add(new THREE.ConeGeometry(r, h, segs(seg)), c, x, y, z, rx, ry, rz),
    tor: (r, t, rs, ts, c, x, y, z, rx, ry, rz, arc) => add(new THREE.TorusGeometry(r, t, segs(rs, 16), segs(ts), arc), c, x, y, z, rx, ry, rz),
    // lathe: profile [[r, y], ...] spun round Y (vases, cups, bottles, turned legs)
    lathe: (pts, seg, c, x, y, z, rx, ry, rz) => add(new THREE.LatheGeometry(pts.map(([r, yy]) => new THREE.Vector2(r, yy)), segs(seg)), c, x, y, z, rx, ry, rz),
    tube: (pts, r, seg, rs, c) => add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), segs(seg, 64), r, segs(rs, 12), false), c),
    get count() { return parts.length; },
    geometry() { const g = mergeGeometries(parts, false); parts.forEach(p => p.dispose()); parts.length = 0; g.computeBoundingSphere(); return g; },
    mesh(mat) { const m = new THREE.Mesh(api.geometry(), mat); m.castShadow = false; m.receiveShadow = false; return m; },
  };
  return api;
}
// shared materials (vertex colours), created once
// HD: physically based (picks up the gallery's environment/lights); low: the old Lambert set. setQuality() runs before any prop is built.
const std = o => new THREE.MeshStandardMaterial({ vertexColors: true, ...o });
export const MAT = {};
export function setQuality(low) { Q.low = !!low; Q.detail = low ? 1.25 : 2; Q.bevel = low ? 1 : 2;
  Object.assign(MAT, low ? {
    lam: new THREE.MeshLambertMaterial({ vertexColors: true }), flat: new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }),
    matte: new THREE.MeshLambertMaterial({ vertexColors: true }), satin: new THREE.MeshLambertMaterial({ vertexColors: true }), wood: new THREE.MeshLambertMaterial({ vertexColors: true }),
    shiny: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.35 }), steel: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.55, emissive: 0x2a2c30 }),
    gloss: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0.1 }), glow: new THREE.MeshBasicMaterial({ vertexColors: true }) } : {
    lam: std({ roughness: 0.62, metalness: 0.04 }), flat: std({ roughness: 0.5, metalness: 0.12 }), matte: std({ roughness: 0.85, metalness: 0 }),
    satin: std({ roughness: 0.45, metalness: 0.08 }), wood: std({ roughness: 0.55, metalness: 0.02 }),
    shiny: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.28, metalness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.15 }),
    steel: std({ roughness: 0.26, metalness: 0.75, emissive: 0x15161a }), gloss: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.22, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.1 }),
    glow: new THREE.MeshBasicMaterial({ vertexColors: true }) }); }
setQuality(false);
export const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });

// ---------- canvas textures ----------
export function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.userData.canvas = c; return t; }
export function wrap(x, text, maxW) { const out = []; for (const para of String(text).split('\n')) { let line = ''; for (const w of para.split(' ')) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } out.push(line); } return out; }
// a flat plaque mesh (w x h metres) with wrapped text
export function plaque(text, w, h, o = {}) {
  const px = 512, ph = Math.round(px * h / w);
  const t = canvasTex(px, ph, (x, W, H) => {
    if (o.brass) { const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#d9b65a'); g.addColorStop(0.5, '#f3dc8e'); g.addColorStop(1, '#a8812e'); x.fillStyle = g; }
    else x.fillStyle = o.bg || '#ece5d3';
    x.fillRect(0, 0, W, H); x.strokeStyle = o.edge || (o.brass ? '#6d5218' : '#8a7a5c'); x.lineWidth = 6; x.strokeRect(4, 4, W - 8, H - 8);
    if (o.brass) { x.fillStyle = '#6d5218'; for (const [a, b] of [[16, 16], [W - 16, 16], [16, H - 16], [W - 16, H - 16]]) { x.beginPath(); x.arc(a, b, 5, 0, 7); x.fill(); } }
    const lines = Array.isArray(text) ? text : [text]; let fs = o.size || 40; x.textAlign = o.align || 'center'; x.textBaseline = 'middle';
    let rows; for (;;) { rows = []; lines.forEach((l, i) => { const f = (i === 0 && o.title ? 'bold ' : (o.italic && i > 0 ? 'italic ' : '')) + (i === 0 && o.title ? fs * 1.12 : fs) + 'px ' + (o.font || 'Georgia, serif'); x.font = f; wrap(x, l, W - 50).forEach(r => rows.push([r, f])); }); if (rows.length * fs * 1.25 < H - 30 || fs < 14) break; fs -= 2; }
    let y = H / 2 - (rows.length - 1) * fs * 1.25 / 2; x.fillStyle = o.ink || (o.brass ? '#3a2a08' : '#1d1712');
    for (const [r, f] of rows) { x.font = f; x.fillText(r, o.align === 'left' ? 28 : W / 2, y); y += fs * 1.25; } });
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); m.userData.tex = t; return m;
}

// ---------- audio: all synthesized, routed through one master gain that drops to 0 when muted ----------
export function makeAudio(ctx) {
  let ac = null, master = null;
  const get = () => { if (ctx.isMuted()) return null; try { ac = ac || (ctx.audioContext && ctx.audioContext()) || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); if (!master) { master = ac.createGain(); master.gain.value = ctx.volume || 0.3; master.connect(ac.destination); } return ac; } catch (e) { return null; } };
  const noiseBuf = (a, dur) => { const b = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; };
  const A = {
    get ctx() { return ac; },
    tick() { if (master && ac) master.gain.setTargetAtTime(ctx.isMuted() ? 0 : (ctx.volume || 0.3), ac.currentTime, 0.03); },
    tone(f, dur = 0.15, type = 'sine', vol = 0.2, at = 0, f2 = 0) { const a = get(); if (!a) return; const t = a.currentTime + at, o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05); },
    noise(dur = 0.2, f = 1000, vol = 0.2, at = 0, type = 'bandpass', q = 1, f2 = 0) { const a = get(); if (!a) return null; const t = a.currentTime + at, s = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain(); s.buffer = noiseBuf(a, dur); bp.type = type; bp.frequency.setValueAtTime(f, t); if (f2) bp.frequency.exponentialRampToValueAtTime(f2, t + dur); bp.Q.value = q;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(bp).connect(g).connect(master); s.start(t); return g; },
    chord(fs, dur, type, vol, step = 0) { fs.forEach((f, i) => A.tone(f, dur, type, vol, i * step)); },
    // long sound with an envelope you can stop (rumble, brrr)
    loop({ f = 50, type = 'sawtooth', vol = 0.1, lp = 300, am = 0, noise = 0, pan = false }) { const a = get(); if (!a) return { stop() {}, set() {} }; const g = a.createGain(), filt = a.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = lp; g.gain.value = 0.0001; const pn = pan && a.createStereoPanner ? a.createStereoPanner() : null; if (pn) filt.connect(g).connect(pn).connect(master); else filt.connect(g).connect(master);
      const srcs = []; if (f) { const o = a.createOscillator(); o.type = type; o.frequency.value = f; o.connect(filt); o.start(); srcs.push(o); if (am) { const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = am; lg.gain.value = 0.5; const vca = a.createGain(); vca.gain.value = 0.5; o.disconnect(); o.connect(vca).connect(filt); l.connect(lg).connect(vca.gain); l.start(); srcs.push(l); } }
      if (noise) { const s = a.createBufferSource(); s.buffer = noiseBuf(a, 2); s.loop = true; const ng = a.createGain(); ng.gain.value = noise; s.connect(ng).connect(filt); s.start(); srcs.push(s); }
      g.gain.setTargetAtTime(vol, a.currentTime, 0.08);
      return { pan: pn ? v => pn.pan.setTargetAtTime(v, a.currentTime, 0.05) : null, set(v) { g.gain.setTargetAtTime(Math.max(0.0001, v), a.currentTime, 0.1); }, stop(r = 0.3) { g.gain.setTargetAtTime(0.0001, a.currentTime, r / 3); srcs.forEach(s => { try { s.stop(a.currentTime + r + 0.1); } catch (e) {} }); } }; },
  };
  return A;
}

// ---------- HUD overlays: toast, captions, world-anchored speech bubbles, static ----------
export function makeOverlay(ctx) {
  const css = document.createElement('style'); css.textContent = `
  #eggToast{position:fixed;left:50%;top:22%;transform:translateX(-50%);z-index:40;font:900 22px Impact,'Arial Black',sans-serif;letter-spacing:1px;color:#ffe48a;text-shadow:0 2px 0 #000,0 0 12px #000;pointer-events:none;opacity:0;transition:opacity .25s;text-align:center;max-width:90vw}
  #eggCap{position:fixed;left:50%;bottom:16%;transform:translateX(-50%);z-index:40;max-width:min(760px,86vw);background:rgba(10,8,6,.78);color:#f3ead8;font:500 17px/1.35 Georgia,serif;padding:8px 14px;border-radius:6px;pointer-events:none;display:none;text-align:center}
  .eggBub{position:fixed;z-index:39;transform:translate(-50%,-100%);background:#fff;color:#111;font:600 14px/1.25 system-ui,sans-serif;padding:6px 10px;border-radius:12px;border:2px solid #222;max-width:220px;text-align:center;pointer-events:none;display:none;white-space:normal}
  .eggBub:after{content:'';position:absolute;left:50%;bottom:-9px;margin-left:-7px;border:7px solid transparent;border-top-color:#222;border-bottom:0}
  .eggBub.red{background:#2a0606;color:#ff6a5a;border-color:#ff3a2a;font-family:'Courier New',monospace}
  #eggStatic{position:fixed;inset:0;z-index:38;pointer-events:none;opacity:0;mix-blend-mode:screen;image-rendering:pixelated;width:100vw;height:100vh}
  @media (max-width:900px){#eggCap{font-size:14px;bottom:30%}.eggBub{font-size:12px;max-width:170px}#eggToast{font-size:18px}}`;
  document.head.appendChild(css);
  const el = (tag, id) => { const e = document.createElement(tag); if (id) e.id = id; document.body.appendChild(e); return e; };
  const toast = el('div', 'eggToast'), cap = el('div', 'eggCap'), stat = el('canvas', 'eggStatic'); stat.width = 160; stat.height = 90;
  let toastT = 0, capT = 0, statT = 0, statL = 0; const bubbles = [];
  const O = {
    toast(s, d = 2.5) { toast.textContent = s; toast.style.opacity = 1; toastT = d; },
    caption(s, d = 4) { cap.textContent = s; cap.style.display = s ? 'block' : 'none'; capT = d; },
    bubble(obj, text, d = 3, o = {}) { let b = bubbles.find(q => q.obj === obj); if (!b) { b = { obj, el: el('div'), t: 0, off: o.off || 0.5 }; b.el.className = 'eggBub'; bubbles.push(b); }
      b.el.textContent = text; b.el.classList.toggle('red', !!o.red); b.t = d; b.off = o.off || b.off; return b; },
    staticBurst(d = 0.8) { statT = d; },
    // a held static level 0..1 (1 = the whole screen is snow); visual only, so it shows even when muted
    staticLevel(v) { statL = clamp(v, 0, 1); },
    get staticOn() { return statT > 0 || statL > 0.02; }, get staticValue() { return Math.max(statL, statT > 0 ? 0.3 : 0); },
    update(_dt, camera, hidden) { const W = innerWidth, H = innerHeight, now = performance.now(), dt = Math.min(0.5, (now - (O._last || now)) / 1000); O._last = now; // UI text runs on wall-clock time
      if ((toastT -= dt) <= 0) toast.style.opacity = 0; if (capT > 0 && (capT -= dt) <= 0) cap.style.display = 'none';
      for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.t -= dt; if (b.t <= 0) { b.el.remove(); bubbles.splice(i, 1); continue; }
        const p = b.obj.getWorldPosition(V()); p.y += b.off; const d = p.distanceTo(camera.position); p.project(camera);
        const ok = !hidden && p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1 && d < 14 && b.obj.visible !== false;
        b.el.style.display = ok ? 'block' : 'none'; if (ok) { b.el.style.left = ((p.x + 1) / 2 * W) + 'px'; b.el.style.top = ((1 - p.y) / 2 * H) + 'px'; } }
      if (statT > 0) statT -= dt;
      const lv = Math.max(statL, statT > 0 ? (0.22 + Math.random() * 0.18) * Math.min(1, statT * 3) : 0);
      if (lv > 0.01) { const x = stat.getContext('2d'), img = x.createImageData(160, 90), D = img.data; // snow, with rolling bands and torn rows as it builds
        const band = (now / 9) % 90; for (let j = 0; j < 90; j++) { const tear = lv > 0.35 && Math.random() < lv * 0.08, off = tear ? Math.floor(Math.random() * 40) : 0, bb = Math.abs(j - band) < 6 ? 60 : 0;
          for (let i = 0; i < 160; i++) { const k = (j * 160 + ((i + off) % 160)) * 4, v = Math.min(255, Math.random() * 255 * (tear ? 1.3 : 1) + bb); D[k] = D[k + 1] = D[k + 2] = v; D[k + 3] = 255; } }
        x.putImageData(img, 0, 0); stat.style.mixBlendMode = lv > 0.85 ? 'normal' : 'screen'; stat.style.opacity = Math.min(1, lv * (0.92 + Math.random() * 0.16)); } else stat.style.opacity = 0;
      if (hidden) { toast.style.opacity = 0; cap.style.display = 'none'; } },
  };
  return O;
}

// ---------- spatial helpers ----------
const _ray = new THREE.Raycaster(), _f = new THREE.Frustum(), _pm = new THREE.Matrix4();
export function makeSpatial(ctx) {
  const scene = ctx.scene, camera = ctx.camera;
  let walls = null; const extraWalls = [];
  const S = {
    // solid wall boxes (same rule as the frame audit / gravity gun), plus our secret-room walls
    walls() { if (!walls) { walls = []; scene.traverse(m => { if (m.isMesh && m.geometry && m.geometry.type === 'BoxGeometry' && !(m.material && m.material.transparent) && m.visible !== false && !m.userData.egg) walls.push(m); }); } return walls.concat(extraWalls); },
    addWall(m) { extraWalls.push(m); }, resetWalls() { walls = null; },
    // clear line of sight from the eye to p (walls only)
    los(p, from = camera.position) { const d = V().subVectors(p, from), L = d.length(); if (L < 0.01) return true; _ray.set(from, d.normalize()); _ray.far = L - 0.2; const h = _ray.intersectObjects(S.walls(), false).length === 0; _ray.far = Infinity; return h; },
    inView(p, margin = 1) { camera.updateMatrixWorld(); _pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); _f.setFromProjectionMatrix(_pm); return _f.containsPoint(p) && (margin <= 0 || S.screen(p).every(v => Math.abs(v) < margin)); },
    screen(p) { const q = p.clone().project(camera); return [q.x, q.y]; },
    angleTo(p) { const f = camera.getWorldDirection(V()), d = V().subVectors(p, camera.position).normalize(); return Math.acos(clamp(f.dot(d), -1, 1)) * 180 / Math.PI; },
    seen(p, maxDeg = 40, maxDist = 40) { return camera.position.distanceTo(p) < maxDist && S.angleTo(p) < maxDeg && S.inView(p, 1.05) && S.los(p); },
    flatDist(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); },
  };
  return S;
}

// ---------- click / tap routing for egg props ----------
export function makeClicks(ctx) {
  const items = []; const camera = ctx.camera, ray = new THREE.Raycaster(); ray.camera = camera;
  const hit = ndc => { camera.updateMatrixWorld(); ray.setFromCamera(ndc, camera); ray.far = 4.5; const objs = items.filter(i => i.enabled !== false && i.obj.visible !== false).map(i => i.obj); const h = ray.intersectObjects(objs, true)[0]; ray.far = Infinity; if (!h) return null;
    let o = h.object; while (o && !items.find(i => i.obj === o)) o = o.parent; const it = items.find(i => i.obj === o); return it && h.distance <= (it.reach || 3.5) ? it : null; };
  const run = (ndc, how) => { if (ctx.isBusy()) return false; const it = hit(ndc); if (!it) return false; it.fn(how); return true; };
  // desktop: pointer-locked click at the crosshair (swallowed so the soup thermos doesn't also fire)
  addEventListener('mousedown', e => { if (e.button !== 0 || !document.pointerLockElement) return; if (run(new THREE.Vector2(0, 0), 'click')) { e.stopPropagation(); e.preventDefault(); } }, true);
  addEventListener('keydown', e => { if (e.code !== 'KeyE' || e.repeat) return; if (run(new THREE.Vector2(0, 0), 'key')) e.stopPropagation(); }, true);
  // touch: a short tap (no drag) on the prop
  const cv = ctx.canvas || document.querySelector('canvas'); let ts = null;
  cv.addEventListener('touchstart', e => { const t = e.changedTouches[0]; ts = { x: t.clientX, y: t.clientY, t: performance.now() }; }, { passive: true });
  cv.addEventListener('touchend', e => { const t = e.changedTouches[0]; if (!ts || Math.hypot(t.clientX - ts.x, t.clientY - ts.y) > 12 || performance.now() - ts.t > 350) return;
    const r = cv.getBoundingClientRect(); run(new THREE.Vector2((t.clientX - r.left) / r.width * 2 - 1, -((t.clientY - r.top) / r.height) * 2 + 1), 'tap'); }, { passive: true });
  return { add(obj, fn, o = {}) { const it = { obj, fn, ...o }; items.push(it); return it; }, items, run, hit };
}

// ---------- capped particle pool (puffs, dust, ash, confetti): one Points object, no per-particle meshes ----------
export function makePuffs(scene, max, o = {}) {
  const pos = new Float32Array(max * 3), col = new Float32Array(max * 3), size = new Float32Array(max); const P = [];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('size', new THREE.BufferAttribute(size, 1));
  const tex = canvasTex(64, 64, (x) => { const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); });
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: { map: { value: tex }, scale: { value: innerHeight / 2 } },
    vertexShader: 'attribute float size; attribute vec3 color; varying vec3 vC; varying float vA; uniform float scale; void main(){ vC = color; vA = clamp(size, 0., 1.); vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = abs(size) * scale / max(.1, -mv.z); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform sampler2D map; varying vec3 vC; varying float vA; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC, t.a * ' + (o.alpha || 0.85).toFixed(2) + '); if (gl_FragColor.a < .01) discard; }' });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.userData.egg = 1; scene.add(pts);
  for (let i = 0; i < max; i++) { P.push({ life: 0 }); size[i] = 0; }
  return {
    emit(p, v, life, sz, c = 0xffffff, grow = 1, drag = 1.5, grav = 0) { const k = P.findIndex(q => q.life <= 0); if (k < 0) return; const q = P[k]; Object.assign(q, { p: p.clone(), v: v.clone(), life, max: life, sz, grow, drag, grav, c: new THREE.Color(c) }); },
    update(dt) { mat.uniforms.scale.value = innerHeight / 2; let any = 0;
      for (let i = 0; i < max; i++) { const q = P[i]; if (q.life <= 0) { size[i] = 0; continue; } any = 1; q.life -= dt; q.v.multiplyScalar(Math.max(0, 1 - q.drag * dt)); q.v.y -= q.grav * dt; q.p.addScaledVector(q.v, dt);
        const k = 1 - q.life / q.max; pos[i * 3] = q.p.x; pos[i * 3 + 1] = q.p.y; pos[i * 3 + 2] = q.p.z; size[i] = q.life > 0 ? q.sz * (1 + k * q.grow) * Math.min(1, q.life / q.max * 3) : 0;
        col[i * 3] = q.c.r; col[i * 3 + 1] = q.c.g; col[i * 3 + 2] = q.c.b; }
      g.attributes.position.needsUpdate = g.attributes.size.needsUpdate = g.attributes.color.needsUpdate = true; pts.visible = !!any; },
    get live() { return P.filter(q => q.life > 0).length; }, max, pts,
  };
}
