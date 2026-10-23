// #267 guided tour (tag gallery only; gallery-core loads this when MUSEUM.tour is set). ~1 s after the visitor arrives the guide bot
// flies in and projects TJ's welcome hologram (#279; Skip), then offers a tour with a controls overlay. Tour (or a tap on the bot) and
// the bot tows the visitor room to room: walk clips between rooms, stop clips at the paintings, captions always, silent when muted,
// countdown ring from the manifest, Exit / Esc any time. Media on img.tjm.art/play/tour/267/ (same host as the room holograms).
import * as THREE from 'three';
import { HOLO_VS, HOLO_FS, holoGlow } from './holo.js';
import MAN from './tour-manifest.json';
import CATALOG from './catalog.json';
const BASE_V = 'https://img.tjm.art/play/tour/297/' /* #297: cropped welcome; v1 stays at /267/ */, BASE = 'https://img.tjm.art/play/tour/286/', /* #286: clips at 1.25x (atempo, pitch kept) + new lines */ V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const Q = new URLSearchParams(location.search), RATE = Math.min(16, Math.max(1, +Q.get('tourrate') || 1));
const CLIPS = MAN.clips.slice().sort((a, b) => a.order - b.order), OFFER = CLIPS.find(c => c.type === 'offer'), TOUR = CLIPS.filter(c => c.type !== 'offer');
const IS_COARSE = typeof matchMedia !== 'undefined' && (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);
const TOTAL = TOUR.reduce((s, c) => s + c.duration_s, 0); // ring length: the manifest durations of the tour clips
const WELCOME = [[0.35, "Hello, I'm TJ. Welcome to my 3D gallery."], [4.97, 'The idea here is that you can get a sense of what these paintings look like on the wall,'],
  [10.3, "and you can purchase them by using the scanner tool that you're holding,"], [12.23, 'and the guide bot will put them into your cart.'],
  [14.34, "When you're ready to check out, you can look at the guide bot"], [16.63, "and tap 'take me to checkout,' and it'll bring you there."],
  [19.97, "There's lots of fun Easter eggs all around"], [22.56, 'and some fun different tools you can play with.'],
  [25.48, 'Some surprises that should make exploring fun. Please enjoy yourself.'], [32.88, 'Thank you for visiting.'], [35.5, '']];
// stops by clip order: the paintings to frame, and which one the bot spotlights when (fraction of the clip)
const STOPS = { // #286: each stop glides close to 3-4 of the paintings it talks about, in time with the narration (fraction of the clip)
  2: { spots: [[0.02, 'Meditation at Denny Blaine'], [0.3, 'Self Portrait, Meditation at Denny Blaine'], [0.52, 'Sunrise on Tahoma from Denny Blaine with Eagle catching fish'], [0.78, 'Myself at Denny Blaine']] },
  4: { spots: [[0.0, 'Sunrise on Tahoma from Denny Blaine with meditation self-portrait']] },
  6: { spots: [[0.0, 'Sunset from Atami, El Salvador #2'], [0.12, 'Sunset from Atami, El Salvador #1'], [0.22, 'Sunset from Atami, El Salvador #3'], [0.32, 'Sunset in El Zonte, El Salvador']] },
  8: { spots: [[0.0, 'Father Paul'], [0.75, 'Mother Ruth']] },
  8.5: { spots: [[0.0, 'Grandpa Howard'], [0.45, 'Myself, my mother Ruth, my grandpa Howard'], [0.75, 'Me, Chelsea, Grandpa']] },
  10: { spots: [[0.0, 'Max Keiser & Michael Saylor'], [0.3, 'Symbiosis #1'], [0.55, 'Max Keiser & Stacey Herbert'], [0.76, 'Ser at Pacific Bitcoin Festival']] },
  12: { spots: [[0.0, 'Colin and Craig']] },
  12.5: { spots: [[0.0, 'Sunset in the Strait of Juan de Fuca, Sucia Island'], [0.35, 'Sunset in the Strait of Juan de Fuca, Patos Island 1'], [0.6, 'Sunset in the Strait of Juan de Fuca, Patos Island 2']] },
  14: { mural: 'friends-club-mural' } };
for (const k in STOPS) if (STOPS[k].spots && !STOPS[k].titles) STOPS[k].titles = STOPS[k].spots.map(x => x[1]);
// caption cues for a clip: its transcript's sentences, timed by length
function cues(text, dur) { const ss = text.replace(/\n+/g, ' ').match(/[^.!?]+[.!?]+["”]?\s*|[^.!?]+$/g).map(s => s.trim()).filter(Boolean), n = ss.reduce((a, s) => a + s.length + 8, 0); let t = 0;
  return ss.map(s => { const c = [t, s]; t += (s.length + 8) / n * dur; return c; }); }

const BOT_HOVER = 0.3, HOLO_LIFT = 1.0, BOT_TOP = 0.42, LOW_T = IS_COARSE; // bot sits below; the hologram floats from 1.0 m
import { skinOstrich } from './ostrichbot.js'; // #289: the guide bot is the purple ostrich (falls back to the duck if the model can't load)
export function installTour(game) {
  if (window.__tour) return window.__tour;
  const { camera, scene, paintings } = game, EGGS = () => window.eggs, drone = () => EGGS() && EGGS().drone, world = () => EGGS() && EGGS().world;
  const narrow = () => camera.aspect < 1.1;
  const touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const css = document.createElement('style'); css.textContent = `
#tourCap{position:fixed;left:50%;bottom:calc(14% + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:46;max-width:min(760px,90vw);padding:8px 14px;border-radius:10px;background:#000c;color:#fff;font:500 17px/1.35 system-ui,sans-serif;text-align:center;display:none;pointer-events:none}
#tourSkip,#tourExit{position:fixed;z-index:47;padding:9px 16px;border-radius:999px;border:1px solid #fff8;background:#000b;color:#fff;font:700 14px system-ui,sans-serif;cursor:pointer;display:none}
#tourSkip{right:calc(12px + env(safe-area-inset-right));top:calc(100px + env(safe-area-inset-top))}
#tourRing{position:fixed;right:calc(12px + env(safe-area-inset-right));top:calc(100px + env(safe-area-inset-top));z-index:47;display:none;flex-direction:row-reverse;align-items:center;gap:8px}
#tourRing svg{width:58px;height:58px;filter:drop-shadow(0 2px 6px #0008)}#tourRing b{position:absolute;left:0;width:58px;top:19px;text-align:center;color:#fff;font:700 13px system-ui,sans-serif}
#tourExit{position:static;display:block}
#tourOffer{position:fixed;left:50%;bottom:calc(10px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:47;width:min(560px,94vw);padding:12px 14px;border-radius:14px;background:#0d1620ee;border:1px solid #8fd3ff66;color:#eaf6ff;font:14px system-ui,sans-serif;display:none;box-shadow:0 8px 30px #0008}
#tourOffer h3{margin:0 0 6px;font-size:13px;letter-spacing:.06em;opacity:.8}#tourOffer ul{margin:0 0 10px;padding-left:18px;columns:2;column-gap:18px;font-size:13px;line-height:1.5}
#tourOffer .b{display:flex;gap:10px}#tourOffer button{flex:1;padding:11px;border-radius:10px;border:1px solid #fff6;font:700 15px system-ui,sans-serif;cursor:pointer;color:#fff;background:#26475f}#tourOffer button.go{background:#2f7d4f;border-color:#bdf5cf}
#tourCtl{position:fixed;inset:0;z-index:45;pointer-events:none;display:none;font:600 14px system-ui,sans-serif;color:#eaf6ff}
#tourCtl .pad{position:absolute;width:132px;height:132px;border-radius:50%;border:2px dashed #8fd3ffaa;background:#0d162066}
#tourCtl .th{position:absolute;width:54px;height:54px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#ffe1c8,#d9a27f);box-shadow:0 3px 10px #0009;opacity:.92}
#tourCtl .lbl{position:absolute;padding:6px 10px;border-radius:9px;background:#000b;text-align:center;line-height:1.3}
#tourCtl .mv{left:calc(26px + env(safe-area-inset-left));bottom:calc(150px + env(safe-area-inset-bottom))}#tourCtl .mv .th{left:39px;top:39px;animation:tcStick 2.4s ease-in-out infinite}
#tourCtl .lk{right:calc(30px + env(safe-area-inset-right));bottom:calc(170px + env(safe-area-inset-bottom));width:150px;height:90px}#tourCtl .lk .th{left:48px;top:18px;animation:tcDrag 2s ease-in-out infinite}
#tourCtl .lk:before{content:'';position:absolute;left:8px;right:8px;top:44px;border-top:2px dashed #8fd3ffaa}
@keyframes tcStick{0%,100%{transform:translate(0,0)}20%{transform:translate(0,-34px)}45%{transform:translate(30px,0)}70%{transform:translate(0,30px)}85%{transform:translate(-30px,0)}}
@keyframes tcDrag{0%,100%{transform:translateX(-44px)}50%{transform:translateX(44px)}}
#tourCtl .keys{position:absolute;left:50%;top:18%;transform:translateX(-50%);display:grid;grid-template-columns:auto auto;gap:10px 18px;align-items:center;padding:14px 18px;border-radius:14px;background:#0d1620e6;border:1px solid #8fd3ff66;box-shadow:0 8px 30px #0008}
#tourCtl kbd{display:inline-block;min-width:26px;padding:3px 7px;margin:0 2px;border-radius:6px;border:1px solid #cfe6f7;border-bottom-width:3px;background:#1d2b38;color:#fff;font:700 13px ui-monospace,monospace;text-align:center}
#tourCtl .keys h4{grid-column:1/3;margin:0;font-size:12px;letter-spacing:.08em;opacity:.8}
@media (max-width:520px){#tourOffer ul{columns:1}#tourCap{font-size:15px;bottom:calc(150px + env(safe-area-inset-bottom))}}`;
  document.head.appendChild(css);
  const el = (tag, id, html) => { const e = document.createElement(tag); e.id = id; if (html) e.innerHTML = html; document.body.appendChild(e);
    ['mousedown', 'pointerdown', 'touchstart', 'click', 'touchend', 'mouseup', 'pointerup'].forEach(n => e.addEventListener(n, ev => ev.stopPropagation(), { passive: true })); return e; };
  const cap = el('div', 'tourCap'), skip = el('button', 'tourSkip', 'Skip'), ring = el('div', 'tourRing', '<div style="position:relative"><svg viewBox="0 0 58 58"><circle cx="29" cy="29" r="25" fill="#000a" stroke="#ffffff33" stroke-width="5"/><circle id="tourArc" cx="29" cy="29" r="25" fill="none" stroke="#8fe3ff" stroke-width="5" stroke-linecap="round" transform="rotate(-90 29 29)" stroke-dasharray="157.08" stroke-dashoffset="0"/></svg><b id="tourLeft">5:10</b></div><button id="tourExit" type="button">Exit tour</button>');
  const offer = el('div', 'tourOffer', `<h3>${touch ? 'TOUCH CONTROLS' : 'CONTROLS'}</h3><ul>${(touch ? ['Left thumb: move', 'Drag right side: look around', 'Tap a painting: details', 'Tap the guide bot: tour or checkout', 'Scanner: buy a painting', 'Sound button: mute']
    : ['W A S D / arrows: move', 'Mouse: look around', 'Click: scan a painting to buy', 'E: open, T: ask the guide', 'M: mute, Esc: pause', 'Look at the guide bot: checkout']).map(s => `<li>${s}</li>`).join('')}</ul><div class="b"><button class="go" id="tourGo" type="button">Tour</button><button id="tourWalk" type="button">Walk around</button></div>`);
  const K = a => a.map(k => `<kbd>${k}</kbd>`).join('');
  const ctl = el('div', 'tourCtl', touch ? `<div class="pad mv"><div class="th"></div></div><div class="lbl" style="left:calc(14px + env(safe-area-inset-left));bottom:calc(292px + env(safe-area-inset-bottom))">Left thumb: hold and slide<br>to walk (push to the edge to run)</div>
<div class="lk"><div class="th"></div></div><div class="lbl" style="right:calc(14px + env(safe-area-inset-right));bottom:calc(272px + env(safe-area-inset-bottom))">Right thumb: drag<br>to look around</div>`
    : `<div class="keys"><h4>WALK AROUND ANY TIME</h4><div>${K(['W', 'A', 'S', 'D'])} or ${K(['↑', '↓'])}</div><div>move</div><div>Mouse</div><div>look around</div><div>${K(['Shift'])}</div><div>run</div>
<div>${K(['E'])} / click</div><div>open, read, scan</div><div>${K(['1', '2', '3'])}</div><div>switch tools</div><div>${K(['T'])}</div><div>ask the guide</div><div>${K(['C'])}</div><div>cart</div><div>${K(['M'])}</div><div>mute</div><div>${K(['Esc'])}</div><div>pause / exit tour</div></div>`);
  skip.type = 'button'; const arc = ring.querySelector('#tourArc'), left = ring.querySelector('#tourLeft');
  const muted = () => !!(game.holo && game.holo.muted);
  // mute takes effect at once (not on the next frame): the tour's media plus the egg and fountain audio, even if frames stall
  if (game.holo && game.holo.setMuted && !game.holo.__tourWrap) { const sm = game.holo.setMuted; game.holo.__tourWrap = 1;
    game.holo.setMuted = (m, g) => { const r = sm.call(game.holo, m, g); try { audio.muted = video.muted = !!game.holo.muted; } catch (e) {} try { window.eggs && window.eggs.E && window.eggs.E.A.tick(); } catch (e) {} try { game.tags && game.tags.sound && game.tags.sound.update(null); } catch (e) {} return r; }; }
  const audio = new Audio(); audio.preload = 'auto'; audio.crossOrigin = 'anonymous'; audio.setAttribute('playsinline', '');
  const S = { pulls: [], glides: [], phase: 'wait', clip: null, clipT: 0, clipWall: 0, audioOK: false, done: 0, steps: [], i: -1, tow: null, turn: null, spotsDone: 0, log: [], visited: [], errors: [], skipped: false };
  // ---- iOS: unlock the audio element (and the welcome video) inside the first real gesture
  const video = document.createElement('video'); Object.assign(video, { crossOrigin: 'anonymous', playsInline: true, preload: 'auto', src: BASE_V + 'holo_welcome_v1-cropped.mp4' }); video.setAttribute('playsinline', ''); video.setAttribute('webkit-playsinline', '');
  let primed = false; const prime = () => { if (primed) return; primed = true; for (const m of [audio, video]) { try { const was = m.muted; m.muted = true; const p = m.play(); if (p) p.then(() => { if (S.phase === 'wait') m.pause(); m.muted = was; }).catch(() => { m.muted = was; }); } catch (e) {} } };
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(n => addEventListener(n, prime, { capture: true, passive: true }));
  // ---- captions
  let cueList = [], cueBase = 0; const setCues = (list) => { cueList = list; cap.style.display = 'none'; };
  function showCue(t) { let s = ''; for (const [at, line] of cueList) if (t >= at) s = line; if (cap.textContent !== s) cap.textContent = s; cap.style.display = s ? 'block' : 'none'; }
  // ---- clips: the audio element drives timing; if the browser won't play it, a wall clock stands in (the tour never stalls)
  function playClip(c) { S.clip = c; S.clipT = 0; S.clipWall = performance.now(); S.audioOK = false; S.log.push(c.file); setCues(cues(c.transcript, c.duration_s));
    audio.src = BASE + c.file; audio.muted = muted(); audio.playbackRate = RATE; const p = audio.play(); if (p) p.then(() => { S.audioOK = true; }).catch(() => { S.audioOK = false; }); }
  function clipTime() { if (!S.clip) return 0; const wall = (performance.now() - S.clipWall) / 1000 * RATE; return S.audioOK && !audio.error ? Math.max(audio.currentTime, audio.ended ? S.clip.duration_s : 0) : wall; }
  const clipDone = () => S.clip && (audio.ended || clipTime() >= S.clip.duration_s - 0.05);
  function stopClip() { try { audio.pause(); } catch (e) {} S.clip = null; cap.style.display = 'none'; }
  // ---- the welcome hologram (same shader as the room holograms)
  let holo = null;
  function makeHolo(at) { const H = 1.5, W = H * 360 / 640, LIFT = HOLO_LIFT, root = new THREE.Group(); root.position.copy(at); scene.add(root); // #286: projected up out of the guide bot
    const still = new THREE.TextureLoader().load(BASE_V + 'still_welcome_v1-cropped.jpg'), vtex = new THREE.VideoTexture(video); vtex.colorSpace = still.colorSpace = THREE.SRGBColorSpace;
    const uni = { map: { value: still }, t: { value: 0 }, flick: { value: 0 } };
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.ShaderMaterial({ uniforms: uni, vertexShader: HOLO_VS, fragmentShader: HOLO_FS, transparent: true, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide }));
    plane.position.y = LIFT + 0.08 + H / 2; plane.renderOrder = 5; root.add(plane);
    const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false };
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.8, 48), new THREE.MeshBasicMaterial({ map: holoGlow(), ...add })); disc.rotation.x = -Math.PI / 2; disc.position.y = LIFT + 0.02; disc.scale.setScalar(0.6); root.add(disc);
    // the projection cone: from the bot's lens up to the hologram's base, additive, brighter at the lens, softly fading up
    const BOT = BOT_TOP, coneH = LIFT - BOT, cg = new THREE.CylinderGeometry(W * 0.62, 0.05, coneH, LOW_T ? 20 : 40, 1, true); cg.translate(0, BOT + coneH / 2, 0);
    const beam = new THREE.Mesh(cg, new THREE.ShaderMaterial({ uniforms: { t: { value: 0 }, k: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false,
      vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform float t; uniform float k; varying vec2 vU; void main(){ float up = vU.y; float a = (1.0 - up) * 0.55 + 0.12; a *= 0.75 + 0.25 * sin(vU.x * 62.83 + t * 3.0) * sin(up * 9.0 - t * 4.0); gl_FragColor = vec4(vec3(0.45, 0.85, 1.0) * a * k, 1.0); }' }));
    beam.name = 'holoBeam'; beam.renderOrder = 4; root.add(beam);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshBasicMaterial({ color: 0x9fe8ff, ...add })); lens.position.y = BOT; lens.name = 'holoLens'; root.add(lens);
    const rg = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.56, 64), new THREE.MeshBasicMaterial({ color: 0x66ddff, ...add, opacity: .8 })); rg.rotation.x = -Math.PI / 2; rg.position.y = LIFT + 0.025; rg.scale.setScalar(0.75); root.add(rg);
    video.addEventListener('playing', () => { uni.map.value = vtex; });
    return { root, plane, rg, uni, beam, fade: 0, out: false }; }
  function dropHolo() { if (!holo) return; scene.remove(holo.root); holo.root.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); holo = null; try { video.pause(); } catch (e) {} }
  // ---- views: stand on open floor in front of the paintings and frame them
  const byTitle = t => paintings.find(p => p.data && p.data.title === t && p.state === 'wall');
  function viewFor(order) { const st = STOPS[order]; if (!st) return null; let c, n, ds;
    if (st.mural) { const a = CATALOG.layout.tags.outerCourts.flatMap(o => o.art || []).find(x => x.id === st.mural); if (!a) return null;
      c = V(a.x, a.y, a.z); n = V(a.wallFacing[0], 0, a.wallFacing[1]).normalize(); ds = [9.5, 8.5, 10.5, 7.5, 11.5, 6.5, 5.5]; st.offs = [3.2, -3.2, 2.6, -2.6, 0]; /* clear of the fountain on the mural's axis */ }
    else { const ps = st.titles.map(byTitle).filter(Boolean); if (!ps.length) return null; c = V(); n = V(); ps.forEach(p => { c.add(p.group.position); n.add(V(p.data.ix, 0, p.data.iz)); }); c.divideScalar(ps.length); n.normalize();
      const t = V(n.z, 0, -n.x); let lo = 0, hi = 0; ps.forEach(p => { const s = V().subVectors(p.group.position, c).dot(t), w = (p.w || p.data.w) / 2; lo = Math.min(lo, s - w); hi = Math.max(hi, s + w); });
      const span = hi - lo, d0 = Math.min(4.2, Math.max(2.0, span * 0.85 + 1.2)); ds = [d0, d0 - 0.4, d0 + 0.5, d0 - 0.8, d0 + 1, 1.7]; st.ps = ps; }
    const W = world(); const t = V(n.z, 0, -n.x);
    for (const d of ds) for (const o of (st.offs || [0, 0.5, -0.5, 1, -1])) { const s = V(c.x + n.x * d + t.x * o, 0, c.z + n.z * d + t.z * o); if (W.walkable(s.x, s.z) && (!W.clearAt || W.clearAt(s.x, s.z) >= 0.25)) return { order, stand: s, look: V(c.x, Math.min(c.y, 2.2), c.z), n, t, st }; }
    return { order, stand: V(c.x + n.x * ds[0], 0, c.z + n.z * ds[0]), look: V(c.x, Math.min(c.y, 2.2), c.z), n, t, st, forced: true }; }
  // ---- towing (like the checkout run): a walkable path, the bot flies ahead, the camera follows and looks ahead
  function towTo(view, dur) { const W = world(), from = V(camera.position.x, 0, camera.position.z);
    const path = W.path(from, view.stand, 0.35) || W.path(from, view.stand, 0.25); const pts = [from, ...(path || []).map(q => V(q.x, 0, q.z)), view.stand];
    if (!path) S.errors.push('nopath ' + view.order);
    let L = 0; const acc = [0]; for (let i = 1; i < pts.length; i++) { L += pts[i].distanceTo(pts[i - 1]); acc.push(L); }
    const speed = Math.min(4.5, Math.max(1.6, dur ? L / Math.max(1, dur - 0.5) : 3.2)) * RATE; S.tow = { pts, acc, L, s: 0, speed, view, wall: performance.now(), ok: !!path }; }
  const at = (r, s) => { let i = 1; while (i < r.acc.length - 1 && r.acc[i] < s) i++; const a = r.pts[i - 1], b = r.pts[i], seg = (r.acc[i] - r.acc[i - 1]) || 1e-6, u = Math.min(1, Math.max(0, (s - r.acc[i - 1]) / seg)); return V(a.x + (b.x - a.x) * u, 0, a.z + (b.z - a.z) * u); };
  const qLook = (from, to) => { const m = new THREE.Matrix4().lookAt(from, to, V(0, 1, 0)); return new THREE.Quaternion().setFromRotationMatrix(m); };
  function stepTow(dt) { const r = S.tow; if (!r) return true; r.frames = (r.frames || 0) + 1; r.s = Math.min(r.L, r.s + r.speed * Math.min(1, (r.s + 0.4) / 1.2) * dt); const me = at(r, r.s), ahead = at(r, Math.min(r.L, r.s + 1.6)), c = camera.position;
    c.x = me.x; c.z = me.z; const D = drone(); if (D) { const dp = D.root.position; dp.x += (ahead.x - dp.x) * Math.min(1, dt * 8); dp.z += (ahead.z - dp.z) * Math.min(1, dt * 8); D.root.rotation.y = Math.atan2(ahead.x - me.x, ahead.z - me.z) || D.root.rotation.y; }
    if (r.L - r.s > 0.25) { const lk = V(ahead.x, c.y - 0.05, ahead.z); if (lk.distanceTo(c) > 0.3) camera.quaternion.slerp(qLook(c, lk), Math.min(1, dt * 4)); }
    if (r.s >= r.L - 1e-3) { S.tow = null; S.visited.push(r.view.order); S.glides.push({ to: r.view.order, L: +r.L.toFixed(1), frames: r.frames }); return true; } return false; }
  function frame(view, dt) { const c = camera.position, q = qLook(c, view.look); camera.quaternion.slerp(q, Math.min(1, dt * 3 * RATE)); const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ'); e.z = 0; camera.quaternion.setFromEuler(e);
    const D = drone(); if (D) { const h = V(view.stand.x - view.n.x * 1.5 + view.t.x * 1.5, 0, view.stand.z - view.n.z * 1.5 + view.t.z * 1.5), dp = D.root.position; dp.x += (h.x - dp.x) * Math.min(1, dt * 3 * RATE); dp.z += (h.z - dp.z) * Math.min(1, dt * 3 * RATE); D.root.rotation.y = Math.atan2(c.x - dp.x, c.z - dp.z); } }
  // phone portrait: too narrow for a whole wall, so the camera follows the painting being talked about
  const lookAt = p => { const q = p.group.getWorldPosition(V()); return V(q.x, Math.min(q.y, 2.2), q.z); };
  // ---- #286 focus: glide close to one painting at a time (zoom), aimed at its centre, then hand control back
  function focusSpot(p) { const W = world(), q = p.group.getWorldPosition(V()), n = V(p.data.ix, 0, p.data.iz).normalize(), w = (p.w || p.data.w), h = (p.h || p.data.h);
    const fov = camera.fov * Math.PI / 180, fr = camera.aspect < 1 ? 0.88 : 0.62, need = Math.max(h / 0.62, w / (fr * Math.max(0.45, camera.aspect))) / 2 / Math.tan(fov / 2); /* phones: a wide painting may fill the narrow screen's width */
    let st = null; for (const d of [need, need + 0.3, need + 0.6, need + 1, need + 1.5, 2.6, 3.2]) { const dd = Math.max(0.9, d), c = V(q.x + n.x * dd, 0, q.z + n.z * dd); if (W.walkable(c.x, c.z)) { st = c; break; } }
    if (!st) st = S.view.stand.clone(); return { p, stand: st, look: V(q.x, q.y, q.z) }; }
  function stepFocus(dt) { const f = S.focus; if (!f) return; const c = camera.position;
    if (S.ftow) { const r = S.ftow; r.s = Math.min(r.L, r.s + r.speed * Math.max(dt, S.rawDt || 0)); const me = at(r, r.s); c.x = me.x; c.z = me.z; if (r.s >= r.L - 1e-3) { S.ftow = null; S.settledAt = performance.now(); } }
    const q = qLook(c, f.look); camera.quaternion.slerp(q, Math.min(1, dt * 3.2 * RATE)); { // measured every frame, not polled: how close and on screen each focused painting got once the glide settled
      if (!S.ftow) { const o = S.cur && S.cur.to, m = (S.focusSeen = S.focusSeen || {})[o] = S.focusSeen[o] || {}, a = f.look.clone().project(camera), d = Math.hypot(f.look.x - c.x, f.look.z - c.z), on = Math.abs(a.x) < 0.9 && Math.abs(a.y) < 0.9 && a.z < 1;
        const k = m[f.p.data.title] = m[f.p.data.title] || { d: 99, on: false }; k.d = Math.min(k.d, +d.toFixed(2)); k.on = k.on || on; } } const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ'); e.z = 0; camera.quaternion.setFromEuler(e);
    const D = drone(); if (D) { const t = V(-f.p.data.iz, 0, f.p.data.ix), h = V(f.stand.x + t.x * 0.9, 0, f.stand.z + t.z * 0.9), dp = D.root.position; dp.x += (h.x - dp.x) * Math.min(1, dt * 3); dp.z += (h.z - dp.z) * Math.min(1, dt * 3); D.root.rotation.y = Math.atan2(c.x - dp.x, c.z - dp.z); } }
  function goFocus(p, left) { const f = focusSpot(p), W = world(), from = V(camera.position.x, 0, camera.position.z); const path = W.path(from, f.stand, 0.3) || [f.stand];
    const pts = [from, ...path.map(q => V(q.x, 0, q.z)), f.stand]; let L = 0; const acc = [0]; for (let i = 1; i < pts.length; i++) { L += pts[i].distanceTo(pts[i - 1]); acc.push(L); }
    S.ftow = { pts, acc, L, s: 0, speed: Math.min(6, Math.max(1.2, L / Math.max(0.8, Math.min(2.2, left * 0.4)))) * RATE }; S.focus = f; }
  // ---- UI state
  const freeze = on => { game.freeze = on; window.__reading = on; window.__tourOn = on; };
  const tick = () => { const gone = TOTAL - (S.done + (S.clip && S.clip.type !== 'offer' ? Math.min(S.clip.duration_s, clipTime()) : 0)), k = Math.max(0, gone) / TOTAL;
    arc.setAttribute('stroke-dashoffset', String(157.08 * (1 - k))); const s = Math.max(0, Math.ceil(gone)); left.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function begin() { if (S.phase !== 'wait') return; S.phase = 'welcome'; S.t0 = performance.now(); freeze(true); try { sessionStorage.setItem('tjmTourSeen', '1'); } catch (e) {}
    if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {}
    const f = V(); camera.getWorldDirection(f); f.y = 0; f.normalize(); const W = world(); let d = narrow() ? 3.8 : 2.8, p; for (; d > 1.2; d -= 0.3) { p = V(camera.position.x + f.x * d, 0, camera.position.z + f.z * d); if (W.walkable(p.x, p.z)) break; }
    holo = makeHolo(p); const D = drone(); if (D) { D.tow(true); const s = V(f.z, 0, -f.x); const so = narrow() ? 0.5 : 0.85; D.root.position.set(p.x, 3.2, p.z); D.root.rotation.y = Math.atan2(camera.position.x - p.x, camera.position.z - p.z); void s; void so; } // #286: the bot drops in under the hologram and projects it
    setCues(WELCOME); video.muted = muted(); video.currentTime = 0; video.playbackRate = RATE; const pr = video.play(); if (pr) pr.catch(() => { video.muted = true; video.play().catch(() => { S.videoFail = true; }); });
    skip.style.display = 'block'; }
  function toOffer(skipped) { if (S.phase !== 'welcome') return; S.skipped = !!skipped; S.phase = 'offer'; skip.style.display = 'none'; if (holo) holo.out = true; try { video.pause(); } catch (e) {}
    offer.style.display = 'block'; S.gapFrom = performance.now(); // #286: a 1.0 s breath between TJ's welcome and the bot's first line
    setTimeout(() => { if (S.phase === 'offer' && !S.clip) { S.gap = +((performance.now() - S.gapFrom) / 1000).toFixed(2); playClip(OFFER); } }, 1000 / RATE); }
  function walkAround() { if (S.phase !== 'offer') return; stopClip(); offer.style.display = 'none'; S.phase = 'free'; release(); if (!touch) try { document.body.requestPointerLock(); } catch (e) {} }
  function startTour() { if (S.phase !== 'offer' && S.phase !== 'free') return; stopClip(); offer.style.display = 'none'; S.phase = 'tour'; freeze(true); dropHolo();
    if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {}
    const D = drone(); if (D) D.tow(true); S.steps = []; S.done = 0; S.visited = []; S.log = S.log.filter(f => f === OFFER.file);
    for (let i = 0; i < TOUR.length; i++) { const c = TOUR[i]; if (c.type === 'controls') { S.steps.push({ kind: 'intro', clip: c, to: null }); continue; } if (c.type === 'stop' && /intro/.test(c.file) && (!TOUR[i - 1] || TOUR[i - 1].type !== 'walk')) { const w = TOUR[i + 1] && TOUR[i + 1].type === 'walk' ? TOUR[i + 1] : null; S.steps.push({ kind: 'walk', clip: c, queue: w ? [w] : [], to: (TOUR.slice(i + 1).find(x => x.type === 'stop') || {}).order, narrated: true }); if (w) i++; continue; } // #305: the preamble plays while the bot leads the first walk (existing audio, no new lines)
      if (c.type === 'stop') { if (!TOUR[i - 1] || TOUR[i - 1].type !== 'walk') S.steps.push({ kind: 'walk', clip: null, to: c.order }); S.steps.push({ kind: 'stop', clip: c, to: c.order }); }
      else S.steps.push({ kind: 'walk', clip: c, to: (TOUR.slice(i + 1).find(x => x.type === 'stop') || {}).order }); }
    S.i = -1; ring.style.display = 'flex'; next(); }
  function next() { if (S.cur && S.cur.clip) S.done += S.cur.clip.duration_s; S.i++; const st = S.steps[S.i]; S.cur = st; S.spotsDone = 0; S.hold = 0; S.focus = null; S.ftow = null; ctl.style.display = 'none';
    if (!st) return finish(false);
    // #286: the controls line: free to walk while it plays, with the controls overlay up
    if (st.kind === 'intro') { S.view = null; freeze(false); const D = drone(); if (D) D.tow(false); ctl.style.display = 'block'; S.ctlShown = (S.ctlShown || 0) + 1; playClip(st.clip); return; }
    S.view = viewFor(st.to); if (!S.view) { S.errors.push('noview ' + st.to); return next(); }
    if (st.kind === 'walk') { // #286: grab the player wherever they wandered and glide them along a walkable path (never a teleport)
      freeze(true); if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {} { const D = drone(); if (D) D.tow(true); }
      const off = Math.hypot(camera.position.x - S.view.stand.x, camera.position.z - S.view.stand.z); if (S.freeSince) { S.pulls.push({ to: st.to, from: +off.toFixed(1) }); S.freeSince = 0; }
      towTo(S.view, st.clip ? (st.clip.duration_s + (st.queue || []).reduce((t, q) => t + q.duration_s, 0)) / RATE : 0); if (st.clip) playClip(st.clip); else stopClip(); }
    else { if (S.tow) S.tow = null; freeze(true); S.focusLog = S.focusLog || {}; S.focusLog[st.to] = []; playClip(st.clip); } }
  function release() { ctl.style.display = 'none'; freeze(false); const D = drone(); if (D) D.tow(false); ring.style.display = 'none'; skip.style.display = 'none'; cap.style.display = 'none'; dropHolo(); }
  function finish(exited) { stopClip(); S.tow = null; S.phase = exited ? 'exited' : 'ended'; S.endedAt = performance.now(); release();
    const c = camera.position, W = world(); if (W && !W.walkable(c.x, c.z) && S.view) { c.x = S.view.stand.x; c.z = S.view.stand.z; }
    if (EGGS() && EGGS().E && EGGS().E.O) EGGS().E.O.caption(exited ? 'Tour stopped. Enjoy exploring.' : 'Enjoy exploring. Tap the guide bot any time.', 3);
    if (!touch && !window.__test) { const s = document.getElementById('start'); if (s) s.style.display = 'flex'; } }
  skip.addEventListener('click', e => { e.preventDefault(); toOffer(true); });
  offer.querySelector('#tourGo').addEventListener('click', e => { e.preventDefault(); startTour(); });
  offer.querySelector('#tourWalk').addEventListener('click', e => { e.preventDefault(); walkAround(); });
  ring.querySelector('#tourExit').addEventListener('click', e => { e.preventDefault(); if (S.phase === 'tour') finish(true); });
  addEventListener('keydown', e => { if (e.code !== 'Escape') return; if (S.phase === 'tour') { e.stopPropagation(); finish(true); } else if (S.phase === 'welcome') { e.stopPropagation(); toOffer(true); } }, true);
  // tapping (or clicking) the bot during the offer starts the tour
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const onBot = (x, y) => { const D = drone(); if (!D) return false; { const v = D.root.position.clone(); v.y += 0.05; v.project(camera); if (v.z < 1 && Math.hypot((v.x + 1) / 2 * innerWidth - x, (1 - v.y) / 2 * innerHeight - y) < 56) return true; } /* #289: the duck is small, so a tap near it counts */ ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); ray.far = 20; return ray.intersectObject(D.root, true).length > 0; };
  addEventListener('pointerup', e => { if (S.phase === 'offer' && onBot(e.clientX, e.clientY)) { e.stopPropagation(); S.viaBot = true; startTour(); } }, true);
  // ---- per frame
  let last = performance.now();
  function update() { requestAnimationFrame(update); const now = performance.now(), rawDt = Math.min(0.5, (now - last) / 1000), dt = Math.min(0.1, rawDt); S.rawDt = rawDt; /* focus glides keep pace with the narration even on a slow device */ last = now; { const Dk = drone(); if (Dk) { const k = skinOstrich(Dk, LOW_T); if (k) k.update(dt); } } if (window.__paused && S.phase !== 'tour') return;
    if (S.phase === 'wait') { const s = document.getElementById('start'), ready = EGGS() && drone() && world(); const hidden = !s || s.style.display === 'none' || getComputedStyle(s).display === 'none';
      if (ready && hidden && !window.__paused) { S.arr = S.arr || now; if (now - S.arr > 1000) begin(); } else S.arr = 0; return; }
    audio.muted = muted(); video.muted = muted() || video.muted && S.videoFail;
    if (holo) { holo.uni.t.value = now / 1000; holo.fade = Math.max(0, Math.min(1, holo.fade + (holo.out ? -dt * 2 : dt * 1.5))); holo.uni.flick.value = holo.fade * (0.93 + 0.05 * Math.sin(now / 37) + (Math.random() < 0.01 ? -0.25 : 0));
      const dx = holo.root.position.x - camera.position.x, dz = holo.root.position.z - camera.position.z; holo.plane.rotation.y = Math.atan2(-dx, -dz); holo.rg.rotation.z += dt * 0.4; if (holo.out && holo.fade <= 0) dropHolo();
      if (holo && holo.beam) { holo.beam.material.uniforms.t.value = now / 1000; holo.beam.material.uniforms.k.value = holo.fade; }
      const D = drone(); if (D && S.phase === 'welcome') { const dp = D.root.position, hp = holo.root.position; dp.x = hp.x; dp.z = hp.z; dp.y += (BOT_HOVER - dp.y) * Math.min(1, dt * 2); } }
    if (S.phase === 'welcome') { showCue(video.currentTime || 0); if (video.ended || (S.videoFail && now - S.t0 > 35700 / RATE) || video.currentTime >= 35.6) toOffer(false); return; }
    if (S.phase === 'offer') { showCue(clipTime()); if (clipDone()) { cap.style.display = 'none'; } return; }
    if (S.phase !== 'tour') return;
    const st = S.cur; if (!st) return; tick();
    if (S.clip) showCue(clipTime()); else cap.style.display = 'none';
    if (st.kind === 'intro') { if (clipDone()) { S.hold += dt; if (S.hold > 0.4 / RATE) next(); } return; }
    if (st.kind === 'walk') { if (st.queue && st.queue.length && clipDone()) { const q = st.queue.shift(); S.done += st.clip.duration_s; st.clip = q; playClip(q); } const arrived = stepTow(dt); if (arrived) frame(S.view, dt); if (arrived && (!st.clip || clipDone())) { S.hold += dt; if (S.hold > 0.5 / RATE) next(); } return; }
    const sp = (S.view.st && S.view.st.spots) || [], f = clipTime() / st.clip.duration_s;
    while (S.spotsDone < sp.length && f >= sp[S.spotsDone][0]) { const p = byTitle(sp[S.spotsDone][1]); const G = EGGS() && EGGS().eggs && EGGS().eggs.guide; if (p && G) G.spotlight(p);
      if (p) { goFocus(p, (st.clip.duration_s - clipTime()) / RATE); S.focusLog[st.to].push(p.data.title); } S.spotsDone++; }
    // control comes back once the last painting has had its moment (about a fifth of the clip, at least 2.5 s)
    const lastAt = sp.length ? sp[sp.length - 1][0] : 0, freeAt = Math.min(0.9, lastAt + Math.max(0.12, 2.5 / st.clip.duration_s));
    if (game.freeze && S.spotsDone >= sp.length && ((f >= freeAt && !S.ftow && performance.now() - (S.settledAt || 0) > 1500) || clipDone()) && !S.view.st.mural) { (S.freed = S.freed || {})[st.to] = +(f.toFixed(2)); freeze(false); S.focus = null; S.ftow = null; S.freeSince = performance.now(); const D = drone(); if (D) D.tow(false); }
    if (S.focus) stepFocus(dt); else if (game.freeze) frame(S.view, dt);
    if (clipDone()) { S.hold += dt; if (S.hold > 0.7 / RATE) next(); } }
  requestAnimationFrame(update);
  const forced = Q.get('tour') === '1' || Q.has('tourrate'); let seen = false; try { seen = sessionStorage.getItem('tjmTourSeen') === '1'; } catch (e) {}
  if (Q.get('tour') === '0' || (!forced && (seen || window.__test))) S.phase = 'off';
  const api = window.__tour = { S, TOTAL, RATE, get phase() { return S.phase; }, begin: () => { if (S.phase === 'off') S.phase = 'wait'; begin(); }, skip: () => toOffer(true), start: startTour, walk: walkAround, exit: () => S.phase === 'tour' && finish(true),
    view: o => viewFor(o), get state() { return { phase: S.phase, step: S.i, steps: S.steps.length, clip: S.clip && S.clip.file, t: +clipTime().toFixed(2), audioOK: S.audioOK, visited: S.visited.slice(), log: S.log.slice(), errors: S.errors.slice(), ring: left.textContent, caption: cap.style.display !== 'none' ? cap.textContent : '', muted: muted(), audioMuted: audio.muted, videoMuted: video.muted, frozen: !!game.freeze, focus: S.focus ? S.focus.p.data.title : null, focusLog: JSON.parse(JSON.stringify(S.focusLog || {})), focusSeen: JSON.parse(JSON.stringify(S.focusSeen || {})), freed: { ...(S.freed || {}) }, pulls: S.pulls.slice(), glides: S.glides.slice(), ctl: ctl.style.display !== 'none', ctlShown: S.ctlShown || 0, gap: S.gap, kind: S.cur && S.cur.kind }; } };
  return api;
}
