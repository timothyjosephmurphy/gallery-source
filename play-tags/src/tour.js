// #267 guided tour (tag gallery only; gallery-core loads this when MUSEUM.tour is set). ~1 s after the visitor arrives the guide bot
// flies in and projects TJ's welcome hologram (#279; Skip), then offers a tour with a controls overlay. Tour (or a tap on the bot) and
// the bot tows the visitor room to room: walk clips between rooms, stop clips at the paintings, captions always, silent when muted,
// countdown ring from the manifest, Exit / Esc any time. Media on img.tjm.art/play/tour/maeve-walk-2/ (#784) (same host as the room holograms).
import * as THREE from 'three';
import { HOLO_VS, HOLO_FS, holoGlow } from './holo.js';
import MAN from './tour-manifest.json';
import CATALOG from './catalog.json';
const BASE_V = 'https://img.tjm.art/play/tour/860/', BASE = 'https://img.tjm.art/play/tour/maeve-walk-5-stops/', V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const Q = new URLSearchParams(location.search), RATE = Math.min(16, Math.max(1, +Q.get('tourrate') || 1));
const CLIPS = MAN.clips.slice().sort((a, b) => (a.seq ?? a.order) - (b.seq ?? b.order)), OFFER = CLIPS.find(c => c.type === 'offer'), WELC = CLIPS.find(c => c.type === 'welcome'), TOUR = CLIPS.filter(c => c.type !== 'offer' && c.type !== 'welcome' && !c.skip814);
const IS_COARSE = typeof matchMedia !== 'undefined' && (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);
const TOTAL = TOUR.reduce((s, c) => s + c.duration_s, 0); // ring length: the manifest durations of the tour clips
const WELCOME_END_S = 15.45, WELCOME_END_MS = 15600;
const WELCOME = [[0.6, "Hello, I'm TJ. Welcome to my gallery."], [3.5, "You can get a tour from the guide bot here,"],
  [5.95, "or you can explore like it's a video game."], [8.8, "There's some 200 paintings here and some exhibitions from around the world."],
  [13.95, "Thank you for visiting."], [15.3, ""]];
// stops by clip order: the paintings to frame, and which one the bot spotlights when (fraction of the clip)
const STOPS = {"3": {"titles": ["Self Portrait, Meditation at Denny Blaine", "Sunrise on Rainier from Denny Blaine", "Sunrise on Rainier with Eagle", "Sunrise on Tahoma with motorcycles"], "si": [0, 1, 2, 3]}, "5": {"titles": ["El Zonte at Dawn", "Sunrise in El Zonte (Large)", "El Zonte Before Dawn"], "si": [0, 1, 2]}, "7": {"titles": ["El Salvador: Past - Chase Toole Collab", "El Salvador: Present - Chase Toole Collab", "El Salvador: Future - Chase Toole Collab"], "si": [0, 1, 2]}, "9": {"titles": ["Devo & Katie @ Bass Coast", "The Temple, Daytime", "Burning Man Temple 2022: Flame", "The Temple, the Lighting #2", "Burning Man Temple 2022: Pink", "Mayan Warrior"], "si": [0, 1, 2, 4, 5]}, "11": {"titles": ["Neil at Bass Coast", "Devo at Bass Coast", "Jennica at Bass Coast", "Michael at Bass Coast"], "si": [0, 1, 2, 3]}, "13": {"titles": ["Sunrise at Bass Coast 2023 #1", "Sunrise at Bass Coast 2023 #4", "Sunrise at Bass Coast 2023 #3", "Sunrise at Bass Coast 2023 #2"], "si": [0, 1, 2, 3]}, "15": {"titles": ["El Salvador", "Sunset in El Tunco, El Salvador", "Untitled — El Salvador, page 38", "Sunset from Atami, El Salvador #2", "Sunset from Atami, El Salvador #1", "Sunset from Atami, El Salvador #3", "Sunset in Atami, El Salvador", "Sunrise from Punta El Zonte Hostel"], "si": [0, 2, 5, 7]}, "17": {"titles": ["Sunset at Kihei on Maui", "Myself in Skandasana on Playa de los Muertos at Dawn in Puerto Vallarta", "Sunset in El Zonte, El Salvador"], "si": [0, 1, 2]}, "19": {"titles": ["Sunset in the Strait of Juan de Fuca, Patos Island 1", "Sunset in Greece, Photo Credit: Chelsea Murphy", "Sunset in the Strait of Juan de Fuca, Sucia Island", "Sunset in the Strait of Juan de Fuca, Patos Island 2"], "si": [0, 1, 2, 3]}, "20": {"titles": ["Strawberry Point Backpacking Trip #10", "Strawberry Point Backpacking Trip #15", "Strawberry Point Backpacking Trip #1", "Strawberry Point Backpacking Trip #7", "Strawberry Point Backpacking Trip #11", "Strawberry Point Backpacking Trip #6", "Strawberry Point Backpacking Trip #12", "Strawberry Point Backpacking Trip #2", "Strawberry Point Backpacking Trip #4", "Strawberry Point Backpacking Trip #13", "Strawberry Point Backpacking Trip #3", "Strawberry Point Backpacking Trip #14", "Strawberry Point Backpacking Trip #5", "Strawberry Point Backpacking Trip #8", "Strawberry Point Backpacking Trip #9"], "si": [0, 4, 7, 10, 14]}, "22": {"titles": ["Dawn on Mt. Vesper from Denny Blaine", "Lisa Climbing Tahoma at Sunrise from Denny Blaine", "Sunrise on Tahoma from Denny Blaine with meditation self-portrait"], "si": [0, 1, 2]}, "24": {"titles": ["Sergey winning at poker", "MJ", "John", "Brothers", "Girl Tuning Guitar", "Kristine", "Sergey"], "si": [0, 2, 4, 6]}, "26": {"titles": ["Julia's baby shower", "Mikyla, Mandy, and Guin", "Mathew \"Fu\" Furst, owner of Grandma's House in Denver"], "si": [0, 1, 2]}, "28": {"titles": ["The Mother of Kiev", "Vision of Ukraine at Peace", "Girl Wearing Flower Crown", "TJ Two Pitchers 188", "TJ Blue Pitcher 187"], "si": [0, 1, 2, 3, 4]}, "30": {"titles": ["Daniel — portrait 2", "Rice paddies in Vietnam, Photo Credit: Daniel Goldsmith", "Daniel — portrait 1"], "si": [0, 1, 2]}, "32": {"titles": ["TJ Forest 302", "TJ Forest 304", "TJ Forest 303", "Inside album cover for Yes: Close to the Edge", "Untitled — Assorted Adventures, page 59", "TJ Figures on a Shore 179", "TJ Crab on Beach 180", "TJ Wading Figure 181"], "si": [0, 2, 4, 5, 7]}, "34": {"titles": ["The Bounty of Satoshi: Wonder", "Revelation", "The Bounty of Satoshi: Achievement"], "si": [0, 1, 2]}, "36": {"titles": ["Peter St. Onge @profstonge", "Scarlette Melon @Scarlette_melon", "Josie, The Redheaded Libertarian", "Max Keiser & Michael Saylor", "Viv @btcviv", "Max Keiser & Stacey Herbert", "Ser at Pacific Bitcoin Festival", "Dorian Nakamoto", "Kushboo Kullar @DrKhushboo_K", "TJ Morgen Rochard 358", "Painting #375", "Cory Klippsten @coryklippsten", "Jimmy Song @jimmysong", "Walker @WalkerAmerica", "Painting #354", "Carla @carlabitcoin"], "si": [0, 5, 10, 15]}, "38": {"titles": ["Untitled — Bitcoiners, page 50", "TJ Andreas Antonopoulos 327", "TJ Portrait with Glasses 319", "TJ Aixa Martinez 347", "Benny and Kermit, P, Culhane, Bob — portrait 2", "TJ F.A. Hayek 336", "Ben & Kermit & Swan", "TJ Elizabeth Stark 335", "TJ Bernard Parah 329", "Benny and Kermit, P, Culhane, Bob — portrait 1", "TJ Noor El Bawab 333", "TJ José 328", "Painting #368", "Painting #373", "TJ Rodrigo Gomez 334"], "si": [0, 5, 9, 14]}, "40": {"mural": "berlin-el-salvador-mural", "md": [3.6, 4.0, 3.2, 4.5, 5.2, 3.0, 6.0], "mo": [0, 0.8, -0.8, 1.5, -1.5]}, "42": {"titles": ["Symbiosis #1", "Hope, the Vermillion Aurora", "Bounty of Satoshi: Achievement"], "si": [0, 1, 2]}, "44": {"titles": ["Maya Parbhoe @MayaPar25", "Alejandra Guajardo @MissBitcoin_sv", "Osisipho Filane @FilaneSisipho", "Valerie B Love @djvalerieblove"], "si": [0, 1, 2, 3]}, "46": {"titles": ["Honeybadger and Cub with Genesis Block"], "si": [0]}, "47": {"titles": ["Coined in Watercolor Film Poster", "Warszawska Syrenka"], "si": [0, 1]}, "49": {"at": [12.375, 7.145, -0.866, -0.5, 3]}, "50": {"book": 1}, "51": {"book": 1}, "53": {"kino": "kinoteka", "inside": 1}};
for (const k in STOPS) { const o = STOPS[k]; if (o.si) o.spots = o.si.map((idx, n) => [+(0.04 + n * 0.72 / Math.max(1, o.si.length - 1)).toFixed(2), o.titles[idx]]); }
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
#tourCap{position:fixed;left:50%;bottom:calc(14% + var(--sa-bottom, env(safe-area-inset-bottom)));transform:translateX(-50%);z-index:46;max-width:min(760px,90vw);padding:8px 14px;border-radius:10px;background:#000c;color:#fff;font:500 17px/1.35 system-ui,sans-serif;text-align:center;display:none;pointer-events:none}
#tourSkip,#tourExit{position:fixed;z-index:47;padding:9px 16px;border-radius:999px;border:1px solid #fff8;background:#000b;color:#fff;font:700 14px system-ui,sans-serif;cursor:pointer;display:none}
#tourSkip{right:calc(12px + var(--sa-right, env(safe-area-inset-right)));top:calc(100px + var(--sa-top, env(safe-area-inset-top)))}
#tourRing{position:fixed;right:calc(12px + var(--sa-right, env(safe-area-inset-right)));top:calc(100px + var(--sa-top, env(safe-area-inset-top)));z-index:47;display:none;flex-direction:row-reverse;align-items:center;gap:8px}
#tourRing svg{width:58px;height:58px;filter:drop-shadow(0 2px 6px #0008)}#tourRing b{position:absolute;left:0;width:58px;top:19px;text-align:center;color:#fff;font:700 13px system-ui,sans-serif}
#tourExit{position:static;display:block}
#tourOffer{position:fixed;left:50%;bottom:calc(10px + var(--sa-bottom, env(safe-area-inset-bottom)));transform:translateX(-50%);z-index:47;width:min(560px,94vw);padding:12px 14px;border-radius:14px;background:#0d1620ee;border:1px solid #8fd3ff66;color:#eaf6ff;font:14px system-ui,sans-serif;display:none;box-shadow:0 8px 30px #0008}
#tourOffer h3{margin:0 0 6px;font-size:13px;letter-spacing:.06em;opacity:.8}#tourOffer ul{margin:0 0 10px;padding-left:18px;columns:2;column-gap:18px;font-size:13px;line-height:1.5}
#tourOffer .b{display:flex;gap:10px}#tourOffer button{flex:1;padding:11px;border-radius:10px;border:1px solid #fff6;font:700 15px system-ui,sans-serif;cursor:pointer;color:#fff;background:#26475f}#tourOffer button.go{background:#2f7d4f;border-color:#bdf5cf}
#tourCtl{position:fixed;inset:0;z-index:45;pointer-events:none;display:none;font:600 14px system-ui,sans-serif;color:#eaf6ff}
#tourCtl .pad{position:absolute;width:132px;height:132px;border-radius:50%;border:2px dashed #8fd3ffaa;background:#0d162066}
#tourCtl .th{position:absolute;width:54px;height:54px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#ffe1c8,#d9a27f);box-shadow:0 3px 10px #0009;opacity:.92}
#tourCtl .lbl{position:absolute;padding:6px 10px;border-radius:9px;background:#000b;text-align:center;line-height:1.3}
#tourCtl .mv{left:calc(26px + var(--sa-left, env(safe-area-inset-left)));bottom:calc(150px + var(--sa-bottom, env(safe-area-inset-bottom)))}#tourCtl .mv .th{left:39px;top:39px;animation:tcStick 2.4s ease-in-out infinite}
#tourCtl .lk{right:calc(30px + var(--sa-right, env(safe-area-inset-right)));bottom:calc(170px + var(--sa-bottom, env(safe-area-inset-bottom)));width:150px;height:90px}#tourCtl .lk .th{left:48px;top:18px;animation:tcDrag 2s ease-in-out infinite}
#tourCtl .lk:before{content:'';position:absolute;left:8px;right:8px;top:44px;border-top:2px dashed #8fd3ffaa}
@keyframes tcStick{0%,100%{transform:translate(0,0)}20%{transform:translate(0,-34px)}45%{transform:translate(30px,0)}70%{transform:translate(0,30px)}85%{transform:translate(-30px,0)}}
@keyframes tcDrag{0%,100%{transform:translateX(-44px)}50%{transform:translateX(44px)}}
#tourCtl .keys{position:absolute;left:50%;top:18%;transform:translateX(-50%);display:grid;grid-template-columns:auto auto;gap:10px 18px;align-items:center;padding:14px 18px;border-radius:14px;background:#0d1620e6;border:1px solid #8fd3ff66;box-shadow:0 8px 30px #0008}
#tourCtl kbd{display:inline-block;min-width:26px;padding:3px 7px;margin:0 2px;border-radius:6px;border:1px solid #cfe6f7;border-bottom-width:3px;background:#1d2b38;color:#fff;font:700 13px ui-monospace,monospace;text-align:center}
#tourCtl{transition:opacity .8s}#tourCtl.fade{opacity:0}#tourCtl .mouse{display:inline-block;width:16px;height:24px;border:2px solid #cfe6f7;border-radius:9px;position:relative;vertical-align:middle;animation:tcMouse 2s ease-in-out infinite}#tourCtl .mouse:after{content:'';position:absolute;left:5px;top:4px;width:2px;height:6px;background:#8fe3ff;border-radius:1px}
@keyframes tcMouse{0%,100%{transform:translateX(-8px)}50%{transform:translateX(8px)}}
#tourCtl .keys h4{grid-column:1/3;margin:0;font-size:12px;letter-spacing:.08em;opacity:.8}
@media (max-width:520px){#tourOffer ul{columns:1}#tourCap{font-size:15px;bottom:calc(150px + var(--sa-bottom, env(safe-area-inset-bottom)))}}`;
  document.head.appendChild(css);
  const el = (tag, id, html) => { const e = document.createElement(tag); e.id = id; if (html) e.innerHTML = html; document.body.appendChild(e);
    ['mousedown', 'pointerdown', 'touchstart', 'click', 'touchend', 'mouseup', 'pointerup'].forEach(n => e.addEventListener(n, ev => ev.stopPropagation(), { passive: true })); return e; };
  const cap = el('div', 'tourCap'), skip = el('button', 'tourSkip', 'Skip'), ring = el('div', 'tourRing', '<div style="position:relative"><svg viewBox="0 0 58 58"><circle cx="29" cy="29" r="25" fill="#000a" stroke="#ffffff33" stroke-width="5"/><circle id="tourArc" cx="29" cy="29" r="25" fill="none" stroke="#8fe3ff" stroke-width="5" stroke-linecap="round" transform="rotate(-90 29 29)" stroke-dasharray="157.08" stroke-dashoffset="0"/></svg><b id="tourLeft">5:10</b></div><button id="tourExit" type="button">Exit tour</button>');
  const offer = el('div', 'tourOffer', `<h3>${touch ? 'TOUCH CONTROLS' : 'CONTROLS'}</h3><ul>${(touch ? ['Tap to walk, drag to look', 'Lower-left: hold and slide for a stick', 'Tap a painting: details', 'Tap the guide bot: tour or checkout', 'Scanner: buy a painting', 'Sound button: mute']
    : ['W A S D / arrows: move', 'Mouse: look around', 'Click: scan a painting to buy', 'E: open, T: ask the guide', 'M: mute, Esc: pause', 'Look at the guide bot: checkout']).map(s => `<li>${s}</li>`).join('')}</ul><div class="b"><button class="go" id="tourGo" type="button">Tour</button><button id="tourWalk" type="button">Walk around</button></div>`);
  const K = a => a.map(k => `<kbd>${k}</kbd>`).join('');
  const ctl = el('div', 'tourCtl', touch ? `<!-- #304: fixed move pad removed; phone304 tap/stick are off during tour, keep look-drag only -->
<div class="lk"><div class="th"></div></div><div class="lbl" style="right:calc(14px + var(--sa-right, env(safe-area-inset-right)));bottom:calc(272px + var(--sa-bottom, env(safe-area-inset-bottom)))">Right thumb: drag<br>to look around</div>`
    : `<div class="keys"><h4>WALK AROUND ANY TIME</h4><div>${K(['W', 'A', 'S', 'D'])} or ${K(['↑', '←', '↓', '→'])}</div><div>move</div><div><span class="mouse"></span> Mouse</div><div>look around</div><div>${K(['Shift'])}</div><div>run</div>
<div>${K(['E'])} / click</div><div>open, read, scan</div><div>${K(['1', '2', '3'])}</div><div>switch tools</div><div>${K(['T'])}</div><div>ask the guide</div><div>${K(['C'])}</div><div>cart</div><div>${K(['M'])}</div><div>mute</div><div>${K(['Esc'])}</div><div>pause / exit tour</div></div>`);
  let ctlT = 0, ctlIn = 0, ctlEnd = 0; const ctlShow = () => { clearTimeout(ctlT); ctl.classList.remove('fade'); ctl.style.display = 'block'; ctlIn = 0; ctlEnd = 0; };
  const ctlGone = () => { clearTimeout(ctlT); ctl.classList.add('fade'); ctlT = setTimeout(() => { ctl.style.display = 'none'; ctl.classList.remove('fade'); }, 800); };
  // #286: the overlay fades when its clip ends, unless the visitor hasn't touched anything yet (then it waits for their first input, up to 8 s)
  const ctlHide = (now) => { if (ctl.style.display === 'none') return; if (now || ctlIn) return ctlGone(); ctlEnd = 1; clearTimeout(ctlT); ctlT = setTimeout(ctlGone, 8000); };
  ['keydown', 'pointerdown', 'touchstart', 'mousemove', 'wheel'].forEach(n => addEventListener(n, () => { ctlIn = 1; if (ctlEnd) ctlGone(); }, { capture: true, passive: true }));
  skip.type = 'button'; const arc = ring.querySelector('#tourArc'), left = ring.querySelector('#tourLeft');
  const muted = () => !!(game.holo && game.holo.muted);
  // mute takes effect at once (not on the next frame): the tour's media plus the egg and fountain audio, even if frames stall
  if (game.holo && game.holo.setMuted && !game.holo.__tourWrap) { const sm = game.holo.setMuted; game.holo.__tourWrap = 1;
    game.holo.setMuted = (m, g) => { const r = sm.call(game.holo, m, g); try { audio.muted = video.muted = !!game.holo.muted; } catch (e) {} try { window.eggs && window.eggs.E && window.eggs.E.A.tick(); } catch (e) {} try { game.tags && game.tags.sound && game.tags.sound.update(null); } catch (e) {} return r; }; }
  const audio = new Audio(); audio.preload = 'auto'; audio.crossOrigin = 'anonymous'; audio.setAttribute('playsinline', '');
  const S = { pulls: [], glides: [], phase: 'wait', clip: null, clipT: 0, clipWall: 0, audioOK: false, done: 0, steps: [], i: -1, tow: null, turn: null, spotsDone: 0, log: [], visited: [], errors: [], skipped: false };
  // ---- iOS: unlock the audio element (and the welcome video) inside the first real gesture
  const video = document.createElement('video'); Object.assign(video, { crossOrigin: 'anonymous', playsInline: true, preload: 'auto', src: BASE_V + 'holo_welcome_860.mp4' }); video.setAttribute('playsinline', ''); video.setAttribute('webkit-playsinline', '');
  // #380: spatial audio. The welcome video + tour mp3s are routed through THREE.PositionalAudio on the guide bot (drone root), so they
  // come from the guide. The HTML elements stay as the clock/decoder only (MediaElementSource takes over their output, so no double audio).
  // Fallback: if WebAudio fails, the plain HTML playback stays. NOTE: #799 welcome is the TJ-approved IMG_1853 cut at /299/; a newer welcome recording
  // can swap BASE_V (/299/ live as of #799).
  const SP = { ok: false, listener: null, pa: [], parent: null };
  function spatialInit() { if (SP.ok || SP.failed) return; try { let L = camera.children.find(o => o.isAudioListener); if (!L) { try { if (window.__sharedAC) THREE.AudioContext.setContext(window.__sharedAC); else window.__sharedAC = THREE.AudioContext.getContext(); } catch (e) {} /* #809: one context with the room/guitar holos */ L = new THREE.AudioListener(); camera.add(L); } SP.listener = L;
      for (const m of [audio, video]) { const pa = new THREE.PositionalAudio(L); pa.setMediaElementSource(m); pa.setRefDistance(1.6); pa.setRolloffFactor(1.1); pa.setDistanceModel('inverse'); SP.pa.push(pa); }
      if (L.context.state === 'suspended') L.context.resume().catch(() => {}); SP.ok = true; } catch (e) { SP.failed = true; S.errors && S.errors.push('spatial:' + e.message); } }
  function spatialTick() { if (!SP.ok) return; const D = drone(), par = (D && D.root) || (holo && holo.root) || null; if (par && SP.parent !== par) { for (const pa of SP.pa) par.add(pa); SP.parent = par; }
    const cx = SP.listener.context; if (cx.state !== 'running' && cx.state !== 'closed' && !document.hidden) cx.resume().catch(() => {}); /* #809: iOS 'interrupted' too */
    if (S.clip && !audio.paused && !audio.ended && audio.muted !== muted()) audio.muted = muted(); }
  addEventListener('pointerdown', spatialInit, { capture: true, passive: true }); addEventListener('keydown', spatialInit, { capture: true, passive: true });
  let primed = false; const prime = () => { if (primed) return; primed = true; const g0 = SP.pa[1]; try { if (g0) g0.setVolume(0); } catch (e) {} for (const m of [audio, video]) { try { const was = m.muted; m.muted = !(m === video && g0); /* #816: iOS unlock needs an unmuted play in the gesture; routed through a zero gain so nothing is heard */ const p = m.play(); if (p) p.then(() => { if (S.phase === 'wait') m.pause(); m.muted = was; if (m === video) try { g0 && g0.setVolume(1); } catch (e) {} }).catch(() => { m.muted = was; try { g0 && g0.setVolume(1); } catch (e) {} }); } catch (e) {} } };
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(n => addEventListener(n, prime, { capture: true, passive: true }));
  // ---- captions
  let cueList = [], cueBase = 0; const setCues = (list) => { cueList = list; cap.style.display = 'none'; };
  function showCue(t) { let s = ''; for (const [at, line] of cueList) if (t >= at) s = line; if (cap.textContent !== s) cap.textContent = s; cap.style.display = s ? 'block' : 'none'; }
  // ---- clips: the audio element drives timing; if the browser won't play it, a wall clock stands in (the tour never stalls)
  function act861(c) {
    if (!c || !c.act) return;
    const k = c.act, ms = x => x * 1000 / RATE, L = (x, f) => setTimeout(() => { if (S.phase === 'tour') try { f(); } catch (err) { S.errors.push('act ' + k + ' ' + err.message); } }, ms(x));
    (S.acts = S.acts || []).push(k);
    if (k === 'bookA') {
      S.book = 1;
      L(1.2, () => { const B = game.books, b = B && (B.B.find(x => /Reflections/i.test(x.d.title)) || B.B[0]); if (b && !B.reading) B.open(b); S.bookId = b && b.d.id; });
    } else if (k === 'bookB') {
      S.book = 1; [0.6, 3, 5.4].forEach(x => L(x, () => game.books.flip(1)));
    } else if (k === 'bookC') {
      S.book = 1; L(1.6, () => game.books.close(false)); L(3, () => { S.book = 0; freeze(true); });
    }
  }
  function playClip(c) { act861(c); S.clip = c; S.clipT = 0; S.clipWall = performance.now(); S.audioOK = false; if (c.file) S.log.push(c.file); setCues(cues(c.transcript, c.duration_s));
    if (/look around|controls/i.test(c.transcript || '')) ctlShow(); audio.onerror = () => { S.audioOK = false; S.errors.push('audio ' + c.file); }; /* wall clock carries on */
    if (!c.file) { try { audio.pause(); audio.removeAttribute('src'); } catch (e) {} return; } /* #814 silent pause stop: wall clock only */ audio.src = BASE + c.file; audio.muted = muted(); audio.playbackRate = RATE; const p = audio.play(); if (p) p.then(() => { S.audioOK = true; }).catch(() => { S.audioOK = false; }); }
  setInterval(() => { window.__tourVO = !!(S.clip && !audio.paused && !audio.ended); }, 150); /* #809: room holos duck under the guide's line */
  function clipTime() { if (!S.clip) return 0; if (!S.clip.file) return (performance.now() - S.clipWall) / 1000 * RATE; const wall = (performance.now() - S.clipWall) / 1000 * RATE; return S.audioOK && !audio.error ? Math.max(audio.currentTime, audio.ended ? S.clip.duration_s : 0) : wall; }
  const clipDone = () => S.clip && ((S.clip.file && audio.ended) || clipTime() >= S.clip.duration_s - 0.05);
  function stopClip() { try { audio.pause(); } catch (e) {} S.clip = null; cap.style.display = 'none'; }
  // ---- the welcome hologram (same shader as the room holograms)
  let holo = null;
  function makeHolo(at) { const H = 1.5, W = H * 360 / 640, LIFT = HOLO_LIFT, root = new THREE.Group(); root.position.copy(at); scene.add(root); // #286: projected up out of the guide bot
    const still = new THREE.TextureLoader().load(BASE_V + 'still_welcome_860.jpg'), vtex = new THREE.VideoTexture(video); vtex.colorSpace = still.colorSpace = THREE.SRGBColorSpace;
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
  const LT0 = CATALOG.layout.tags, byTitle = t => paintings.find(p => p.data && p.data.title === t && p.state === 'wall');
  function viewFor(order) { const st = STOPS[order] && STOPS[order].book ? STOPS[49] : STOPS[order]; if (!st) return null; let c, n, ds;
    if (st.here) { const f = V(); camera.getWorldDirection(f); f.y = 0; f.normalize(); const s = V(camera.position.x, 0, camera.position.z); return { order, stand: s, look: V(s.x + f.x * 4, 1.6, s.z + f.z * 4), n: f.clone().negate(), t: V(-f.z, 0, f.x), st }; }
    if (st.maps) { const b = st.beat || 0, want = st.maps[b] && st.maps[b][1], wm = window.__wallMap, tm = window.__testiMap; /* #786 maps stop; fail soft when a map is not installed yet */
      let pick = want === 'testi' ? (tm && tm.stand && tm.face ? 'testi' : (wm && wm.stand ? 'wall' : null)) : (wm && wm.stand && wm.pos ? 'wall' : (tm && tm.stand && tm.face ? 'testi' : null));
      if (pick) { const s = pick === 'wall' ? V(wm.stand[0], 0, wm.stand[1]) : V(tm.stand[0], 0, tm.stand[1]), lk = pick === 'wall' ? V(wm.pos[0], 1.6, wm.pos[1]) : V(tm.face[0], 1.7, tm.face[1]), n = V(s.x - lk.x, 0, s.z - lk.z).normalize(); st.shown = pick; return { order, stand: s, look: lk, n, t: V(n.z, 0, -n.x), st, map: pick }; }
      const f = V(); camera.getWorldDirection(f); f.y = 0; f.normalize(); const s = V(camera.position.x, 0, camera.position.z); st.shown = null; return { order, stand: s, look: V(s.x + f.x * 4, 1.6, s.z + f.z * 4), n: f.clone().negate(), t: V(-f.z, 0, f.x), st, map: null }; }
    if (st.kino && st.inside) { const k = (LT0.openCourts || []).find(o => o.id === st.kino), K = k && k.kino800; if (K) { const W = world(), D = K.D, F = K.f, U = K.t, P = (u, v) => V(D[0] + F[0] * v + U[0] * u, 0, D[1] + F[1] * v + U[1] * u), fy = K.rise || 0; /* #786: stand inside the hall (centre aisle, past the kiosk), facing the screen with the kiosk on the right */
      const look = P(-1.2, 22); look.y = fy + 2.2; const n = V(-F[0], 0, -F[1]), t = V(n.z, 0, -n.x);
      for (const v of [13.2, 12.6, 14, 16]) for (const u of [0, 0.3, -0.3]) { const s = P(u, v); if (W.walkable(s.x, s.z) && (!W.clearAt || W.clearAt(s.x, s.z) >= 0.25)) return { order, stand: s, look, n, t, st, kinoIn: 1, kinoDoor: { out: P(0, -3.2), line: [P(0, -1), P(0, 1), P(0, 4), P(0, 7), P(0, 9.6), P(0, 11.05)] } }; } } }
    if (st.kino) { const k = (LT0.openCourts || []).find(o => o.id === st.kino), dr = k && k.doors800 && k.doors800[0]; if (!dr) return null; const W = world(), n = V(dr.nx, 0, dr.nz).normalize(), t = V(n.z, 0, -n.x), look = V(dr.x + n.x * 6, 2.0, dr.z + n.z * 6);
      for (const d of [3.2, 4, 2.6, 5, 2]) for (const o of [0, 0.6, -0.6]) { const s = V(dr.x - n.x * d + t.x * o, 0, dr.z - n.z * d + t.z * o); if (W.walkable(s.x, s.z)) return { order, stand: s, look, n: n.clone().negate(), t, st }; }
      return { order, stand: V(dr.x - n.x * 3.2, 0, dr.z - n.z * 3.2), look, n: n.clone().negate(), t, st, forced: true }; }
    if (st.at) { c = V(st.at[0], 1.3, st.at[1]); n = V(st.at[2], 0, st.at[3]).normalize(); ds = [st.at[4], st.at[4] - 0.5, st.at[4] + 0.6, st.at[4] - 1, st.at[4] + 1.2]; } /* #819 centre stops */
    else if (st.mural) { const a = CATALOG.layout.tags.outerCourts.flatMap(o => o.art || []).find(x => x.id === st.mural); const m = scene.getObjectByName(st.mural); if (!a && !m) return null;
      c = m ? m.getWorldPosition(V()) : V(a.x, a.y, a.z); const wf = (a && a.wallFacing) || [-0.866, 0.5]; n = V(wf[0], 0, wf[1]).normalize(); ds = st.md || [9.5, 8.5, 10.5, 7.5, 11.5, 6.5, 5.5]; st.offs = st.mo || [3.2, -3.2, 2.6, -2.6, 0]; }
    else { const ps = st.titles.map(byTitle).filter(Boolean); if (!ps.length) return null; c = V(); n = V(); ps.forEach(p => { c.add(p.group.position); n.add(V(p.data.ix, 0, p.data.iz)); }); c.divideScalar(ps.length); n.normalize();
      const t = V(n.z, 0, -n.x); let lo = 0, hi = 0; ps.forEach(p => { const s = V().subVectors(p.group.position, c).dot(t), w = (p.w || p.data.w) / 2; lo = Math.min(lo, s - w); hi = Math.max(hi, s + w); });
      const span = hi - lo, d0 = Math.min(5.2, Math.max(3.8, span * 0.85 + 1.2)); ds = [d0, d0 - 0.4, d0 + 0.5, d0 - 0.8, d0 + 1, 3.8]; st.ps = ps; }
    const W = world(); const t = V(n.z, 0, -n.x);
    for (const d of ds) for (const o of (st.offs || [0, 0.5, -0.5, 1, -1])) { const s = V(c.x + n.x * d + t.x * o, 0, c.z + n.z * d + t.z * o); if (W.walkable(s.x, s.z) && (!W.clearAt || W.clearAt(s.x, s.z) >= 0.25)) return { order, stand: s, look: V(c.x, Math.min(c.y, 2.2), c.z), n, t, st }; }
    return { order, stand: V(c.x + n.x * ds[0], 0, c.z + n.z * ds[0]), look: V(c.x, Math.min(c.y, 2.2), c.z), n, t, st, forced: true }; }
  // ---- towing (like the checkout run): a walkable path, the bot flies ahead, the camera follows and looks ahead
  // #739 (TJ): the tour rings the hex rooms; a leg never cuts through the pavilion or a courtyard. If the shortest path does, it is
  // rebuilt through the room centres between the two stops along the ring (the shorter arc), each sub-leg a normal walkable path.
  const LT = CATALOG.layout.tags, MID = [{ x: 0, z: 0, r: (LT.hub && LT.hub.radius) || 9 }].concat((LT.courtyards || []).map(c => ({ x: c.center[0], z: c.center[1], r: c.radius || 4.6 })));
  const inMid = (x, z) => MID.some(m => Math.hypot(x - m.x, z - m.z) < m.r - 0.2);
  const RING = (LT.rooms || []).filter(r => r.center && !r.annex).map(r => ({ id: r.id, x: r.center[0], z: r.center[1], a: Math.atan2(r.center[1], r.center[0]) })).sort((p, q) => p.a - q.a);
  const midHits = pts => { let n = 0; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], k = Math.max(1, Math.ceil(a.distanceTo(b) / 0.4)); for (let j = 0; j <= k; j++) { const u = j / k; if (inMid(a.x + (b.x - a.x) * u, a.z + (b.z - a.z) * u)) n++; } } return n; };
  function ringPath(from, to) { const W = world(), P = (a, b) => W.path(a, b, 0.35) || W.path(a, b, 0.25), direct = P(from, to);
    const dpts = direct && [from, ...direct.map(q => V(q.x, 0, q.z)), to]; if (dpts && (inMid(from.x, from.z) || !midHits(dpts))) return direct; /* the opening leg starts in the spawn courtyard: it just walks out */
    const a0 = Math.atan2(from.z, from.x), a1 = Math.atan2(to.z, to.x); let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; if (d < -Math.PI + 0.35) d += 2 * Math.PI; /* #783: near-ties take the CCW arc */
    const rel = r => { let x = r.a - a0; while (x > Math.PI) x -= 2 * Math.PI; while (x < -Math.PI) x += 2 * Math.PI; return x; };
    const via = RING.filter(r => { const x = rel(r); return d > 0 ? x > 0.05 && x < d - 0.05 : x < -0.05 && x > d + 0.05; }).sort((p, q) => d > 0 ? rel(p) - rel(q) : rel(q) - rel(p))
      .map(r => { const rn = Math.hypot(r.x, r.z) || 1; for (const o of [3.0, 2.4, 1.8, 1.2]) /* #786 farther out along the wall first */ { const x = r.x + r.x / rn * o, z = r.z + r.z / rn * o; if (W.walkable(x, z) && (!W.clearAt || W.clearAt(x, z) >= 0.5)) return V(x, 0, z); } /* #783: wall-side pass (outer half of the room), no zigzag through the middle */ for (const rr of [0, 0.6, 1.2, 1.8, 2.4]) for (let t = 0; t < 6.28; t += 0.8) { const x = r.x + Math.cos(t) * rr, z = r.z + Math.sin(t) * rr; if (W.walkable(x, z)) return V(x, 0, z); } return null; }).filter(Boolean);
    let out = [], cur = from; for (const w of via.concat([to])) { const seg = P(cur, w); if (!seg) return direct; out = out.concat(seg.map(q => V(q.x, 0, q.z))); cur = w; }
    const rpts = [from, ...out, to]; if (!dpts || midHits(rpts) < midHits(dpts)) { S.ringed = (S.ringed || 0) + 1; return out; } return direct; }
  function towTo(view, dur) { const W = world(), from = V(camera.position.x, 0, camera.position.z);
    const kd = view.kinoDoor, path = ringPath(from, kd ? kd.out : view.stand); const pts = [from, ...(path || []).map(q => V(q.x, 0, q.z)), ...(kd ? [kd.out, ...kd.line] : []), view.stand]; /* #786: world path to the foot of the Kinoteka steps, then straight up the centre aisle through the doors (all walkable) */
    if (!path) S.errors.push('nopath ' + view.order);
    let L = 0; const acc = [0]; for (let i = 1; i < pts.length; i++) { L += pts[i].distanceTo(pts[i - 1]); acc.push(L); }
    const speed = Math.min(4.5, Math.max(1.6, dur ? L / Math.max(1, dur - 0.5) : 3.2)) * RATE; S.tow = { pts, acc, L, s: 0, speed, view, wall: performance.now(), ok: !!path }; }
  const at = (r, s) => { let i = 1; while (i < r.acc.length - 1 && r.acc[i] < s) i++; const a = r.pts[i - 1], b = r.pts[i], seg = (r.acc[i] - r.acc[i - 1]) || 1e-6, u = Math.min(1, Math.max(0, (s - r.acc[i - 1]) / seg)); return V(a.x + (b.x - a.x) * u, 0, a.z + (b.z - a.z) * u); };
  const qLook = (from, to) => { const m = new THREE.Matrix4().lookAt(from, to, V(0, 1, 0)); return new THREE.Quaternion().setFromRotationMatrix(m); };
  const KINO = ((LT0.openCourts || []).find(o => o.kino800) || {}).kino800; function kinoEye(c, dt) { if (!KINO) return; const v = (c.x - KINO.D[0]) * KINO.f[0] + (c.z - KINO.D[1]) * KINO.f[1], st = KINO.stairs || [7, 9.6], fl = Math.min(1, Math.max(0, (v - st[0]) / (st[1] - st[0]))) * (KINO.rise || 0); c.y += (fl + 1.6 - c.y) * Math.min(1, dt * 6); } /* #786: eye climbs the Kinoteka steps during the frozen tow (was 1.6 inside, then a pop) */
  function stepTow(dt) { const r = S.tow; if (!r) return true; r.frames = (r.frames || 0) + 1; r.s = Math.min(r.L, r.s + r.speed * Math.min(1, (r.s + 0.4) / 1.2) * dt); const me = at(r, r.s), ahead = at(r, Math.min(r.L, r.s + 1.6)), c = camera.position;
    c.x = me.x; c.z = me.z; if (r.view && r.view.kinoIn) kinoEye(c, dt); const D = drone(); if (D) { const dp = D.root.position; dp.x += (ahead.x - dp.x) * Math.min(1, dt * 8); dp.z += (ahead.z - dp.z) * Math.min(1, dt * 8); D.root.rotation.y = Math.atan2(ahead.x - me.x, ahead.z - me.z) || D.root.rotation.y; }
    if (r.L - r.s > 0.25) { const st = r.view && r.view.st, art = st && !st.here && !st.kino && r.view.look; let lk = V(ahead.x, c.y - 0.05, ahead.z);
      if (art) { /* #783: strafe - keep facing the destination art while the path carries us; mild look-ahead only on legs without a wall target */ const rem = r.L - r.s, w = Math.min(1, Math.max(0.88, 1 - (rem - 5) / 10)) /* #786: firmer strafe - look locked on the art (floor 0.88, full within 5 m) */, da = V(ahead.x - me.x, 0, ahead.z - me.z), dl = V(r.view.look.x - me.x, 0, r.view.look.z - me.z); if (da.lengthSq() > 1e-6) da.normalize(); if (dl.lengthSq() > 1e-6) dl.normalize(); const dir = da.multiplyScalar(1 - w).add(dl.multiplyScalar(w)); if (dir.lengthSq() < 0.04) dir.copy(dl); dir.normalize(); lk = V(c.x + dir.x * 4, c.y - 0.05, c.z + dir.z * 4); }
      if (lk.distanceTo(c) > 0.3) camera.quaternion.slerp(qLook(c, lk), Math.min(1, dt * (art ? 2.1 : 4))); const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ'); e.z = 0; camera.quaternion.setFromEuler(e); }
    if (r.s >= r.L - 1e-3) { S.tow = null; S.visited.push(r.view.order); S.glides.push({ to: r.view.order, L: +r.L.toFixed(1), frames: r.frames }); return true; } return false; }
  function frame(view, dt) { const c = camera.position; if (view.kinoIn) kinoEye(c, dt); const q = qLook(c, view.look); camera.quaternion.slerp(q, Math.min(1, dt * 3 * RATE)); const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ'); e.z = 0; camera.quaternion.setFromEuler(e);
    const D = drone(); if (D) { const h = V(view.stand.x - view.n.x * 1.5 + view.t.x * 1.5, 0, view.stand.z - view.n.z * 1.5 + view.t.z * 1.5), dp = D.root.position; dp.x += (h.x - dp.x) * Math.min(1, dt * 3 * RATE); dp.z += (h.z - dp.z) * Math.min(1, dt * 3 * RATE); D.root.rotation.y = Math.atan2(c.x - dp.x, c.z - dp.z); } }
  // phone portrait: too narrow for a whole wall, so the camera follows the painting being talked about
  const lookAt = p => { const q = p.group.getWorldPosition(V()); return V(q.x, Math.min(q.y, 2.2), q.z); };
  // ---- #286 focus: glide close to one painting at a time (zoom), aimed at its centre, then hand control back
  function focusSpot(p) { const W = world(), q = p.group.getWorldPosition(V()), n = V(p.data.ix, 0, p.data.iz).normalize(), w = (p.w || p.data.w), h = (p.h || p.data.h);
    const fov = camera.fov * Math.PI / 180, fr = camera.aspect < 1 ? 0.88 : 0.62, need = Math.max(3.8, Math.max(h / 0.62, w / (fr * Math.max(0.45, camera.aspect))) / 2 / Math.tan(fov / 2));
    let st = null; for (const d of [need, need + 0.3, need + 0.6, need + 1, need + 1.5, 4.2, 4.8]) { const dd = Math.max(3.8, d), c = V(q.x + n.x * dd, 0, q.z + n.z * dd); if (W.walkable(c.x, c.z)) { st = c; break; } }
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
  function begin() { if (S.phase !== 'wait') return; S.phase = 'welcome'; S.t0 = performance.now(); spatialInit(); freeze(false); window.__tourOn = true; try { sessionStorage.setItem('tjmTourSeen', '1'); } catch (e) {} // #348: look (and walk) stay free while the welcome hologram plays; pointer lock is kept, Skip = Esc or click
    const f = V(); camera.getWorldDirection(f); f.y = 0; f.normalize(); const W = world(); let d = narrow() ? 3.8 : 2.8, p; for (; d > 1.2; d -= 0.3) { p = V(camera.position.x + f.x * d, 0, camera.position.z + f.z * d); if (W.walkable(p.x, p.z)) break; }
    holo = makeHolo(p); const D = drone(); if (D) { D.tow(true); const s = V(f.z, 0, -f.x); const so = narrow() ? 0.5 : 0.85; D.root.position.set(p.x, 3.2, p.z); D.root.rotation.y = Math.atan2(camera.position.x - p.x, camera.position.z - p.z); void s; void so; } // #286: the bot drops in under the hologram and projects it
    setCues(WELCOME); video.muted = muted(); video.currentTime = 0; video.playbackRate = RATE; try { SP.pa[1] && SP.pa[1].setVolume(1); } catch (e) {} S.vMute = false; S.vLog = []; const pr = video.play(); if (pr) pr.catch(() => { S.vMute = true; S.vLog.push('mutedplay'); video.muted = true; video.play().catch(() => { S.videoFail = true; }); }); /* #816 */
    skip.style.display = 'block'; }
  function toOffer(skipped) { if (S.phase !== 'welcome') return; S.skipped = !!skipped; S.phase = 'offer'; skip.style.display = 'none'; freeze(true); if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {}
    if (holo) { holo.out = true; const h = holo, t0 = performance.now(), f0 = h.fade; const f = () => { if (holo !== h) return; const k = Math.max(0, 1 - (performance.now() - t0) / 300) * f0; h.fade = k; h.uni.flick.value = k; if (h.beam) h.beam.material.uniforms.k.value = k; if (k <= 0) dropHolo(); else requestAnimationFrame(f); }; requestAnimationFrame(f); setTimeout(() => { if (holo === h) dropHolo(); }, 420); }
    try { video.pause(); } catch (e) {}
    offer.style.display = 'block'; S.gapFrom = performance.now();
    setTimeout(() => { if (S.phase === 'offer' && !S.clip) { S.gap = +((performance.now() - S.gapFrom) / 1000).toFixed(2); if (OFFER) playClip(OFFER); } }, 1000 / RATE); }
  function walkAround() { if (S.phase !== 'offer') return; stopClip(); offer.style.display = 'none'; S.phase = 'free'; release(); if (!touch) try { document.body.requestPointerLock(); } catch (e) {} }
  function startTour() { if (S.phase !== 'offer' && S.phase !== 'free') return; stopClip(); setCues([]); offer.style.display = 'none'; S.phase = 'tour'; freeze(true); dropHolo();
    if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {}
    const D = drone(); if (D) D.tow(true); S.steps = []; S.done = 0; S.visited = []; S.log = S.log.filter(f => f === (OFFER && OFFER.file) || (WELC && f === WELC.file));
    for (let i = 0; i < TOUR.length; i++) { const c = TOUR[i]; if (c.type === 'controls') { S.steps.push({ kind: 'walk', clip: c, to: (TOUR.slice(i + 1).find(x => x.type === 'stop') || {}).order, lead814: true }); continue; } if (c.type === 'stop' && /intro/.test(c.file) && (!TOUR[i - 1] || TOUR[i - 1].type !== 'walk')) { const w = TOUR[i + 1] && TOUR[i + 1].type === 'walk' ? TOUR[i + 1] : null; S.steps.push({ kind: 'walk', clip: c, queue: w ? [w] : [], to: (TOUR.slice(i + 1).find(x => x.type === 'stop') || {}).order, narrated: true }); if (w) i++; continue; }
      if (c.type === 'stop') { const pv = S.steps[S.steps.length - 1]; if (!c.same && (!TOUR[i - 1] || TOUR[i - 1].type !== 'walk') && !(pv && pv.kind === 'walk' && pv.to === c.order)) S.steps.push({ kind: 'walk', clip: null, to: c.order }); S.steps.push({ kind: 'stop', clip: c, to: c.order }); }
      else { const q = []; while (TOUR[i + 1] && TOUR[i + 1].type === 'walk') q.push(TOUR[++i]); S.steps.push({ kind: 'walk', clip: c, queue: q, to: (TOUR.slice(i + 1).find(x => x.type === 'stop') || {}).order }); } }
    S.i = -1; ring.style.display = 'flex'; next(); }
  // #809 far-blank: pin base textures of the current + next stop's paintings so the #804 phone LRU (cap 40) never evicts what the tour is gliding to
  const pinSet = new Set(); function tourPin(i) { for (const p of pinSet) p.tourPin = 0; pinSet.clear(); if (S.phase !== 'tour') return; const os = []; for (let j = Math.max(0, i); j < S.steps.length && os.length < 2; j++) { const o = S.steps[j].to; if (o != null && !os.includes(o)) os.push(o); }
    for (const o of os) { const st = STOPS[o]; for (const t of (st && st.titles) || []) { const p = byTitle(t); if (p) { p.tourPin = 1; pinSet.add(p); } } } window.__tourPins = pinSet.size; }
  function next() { tourPin(S.i + 1); if (S.cur && S.cur.clip) S.done += S.cur.clip.duration_s; S.i++; const st = S.steps[S.i]; S.cur = st; S.spotsDone = 0; S.hold = 0; S.focus = null; S.ftow = null; ctlHide();
    if (!st) return finish(false);
    // #286: the controls line: free to walk while it plays, with the controls overlay up
    if (st.kind === 'intro') { S.view = null; freeze(false); const D = drone(); if (D) D.tow(false); ctlShow(); S.ctlShown = (S.ctlShown || 0) + 1; playClip(st.clip); return; }
    if (STOPS[st.to] && STOPS[st.to].maps) { STOPS[st.to].beat = 0; S.mapBeat = st.kind === 'stop' ? 0 : -1; } S.view = viewFor(st.to); if (!S.view) { S.errors.push('noview ' + st.to); return next(); }
    if (st.kind === 'walk') { // #286: grab the player wherever they wandered and glide them along a walkable path (never a teleport)
      freeze(true); if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {} { const D = drone(); if (D) D.tow(true); }
      const off = Math.hypot(camera.position.x - S.view.stand.x, camera.position.z - S.view.stand.z); if (S.freeSince) { S.pulls.push({ to: st.to, from: +off.toFixed(1) }); S.freeSince = 0; }
      towTo(S.view, st.clip ? (st.clip.duration_s + (st.queue || []).reduce((t, q) => t + q.duration_s, 0)) / RATE : 0); if (st.clip) playClip(st.clip); else stopClip(); }
    else { if (S.tow) S.tow = null; freeze(true); S.focusLog = S.focusLog || {}; S.focusLog[st.to] = []; playClip(st.clip); } }
  function release() { try { if (S.book) { S.book = 0; window.game.books.reading && window.game.books.close(false); } } catch (e) {} for (const p of pinSet) p.tourPin = 0; pinSet.clear(); window.__tourPins = 0; ctlHide(true); freeze(false); const D = drone(); if (D) D.tow(false); ring.style.display = 'none'; skip.style.display = 'none'; cap.style.display = 'none'; dropHolo(); }
  function finish(exited) { stopClip(); S.tow = null; S.phase = exited ? 'exited' : 'ended'; S.endedAt = performance.now(); release();
    const c = camera.position, W = world(); if (W && !W.walkable(c.x, c.z) && S.view) { c.x = S.view.stand.x; c.z = S.view.stand.z; }
    if (EGGS() && EGGS().E && EGGS().E.O) EGGS().E.O.caption(exited ? 'Tour stopped. Enjoy exploring.' : 'Enjoy exploring. Tap the guide bot any time.', 3);
    /* #783: no CLICK TO ENTER after the tour; the gates hint / body click re-acquires look */ }
  // #816 (TJ: welcome cut off after the first sentence): the welcome only ends at the clip end or Skip. If the browser pauses the video
  // mid-welcome (iOS unmute without a gesture, another media session, a stall), retry it, and the next tap resumes it with sound;
  // if it cannot play, captions run on the wall clock to the end instead of freezing.
  function welcomeGuard(now) { if (S.skipped) return; const t = video.currentTime || 0;
    if (video.paused && !video.ended && !S.videoFail) { S.vPausedAt = S.vPausedAt || now; if (now - (S.vRetry || 0) > 700) { S.vRetry = now; S.vLog.push('retry@' + t.toFixed(1)); const q = video.play(); if (q) q.catch(() => { if (!S.vMute) { S.vMute = true; video.muted = true; video.play().catch(() => {}); } }); }
      if (now - S.vPausedAt > 2500) { S.videoFail = true; S.wallFrom = now - t * 1000 / RATE; S.vLog.push('wallclock@' + t.toFixed(1)); } } else S.vPausedAt = 0; }
  const welcomeTap = () => { if (S.phase !== 'welcome') return; if (S.vMute && !muted()) { S.vMute = false; video.muted = false; S.vLog.push('unmute-tap'); } if (video.paused && !video.ended) { if (S.videoFail && S.wallFrom) { try { video.currentTime = Math.min(WELCOME_END_S, (performance.now() - S.wallFrom) / 1000 * RATE); } catch (e) {} } video.play().then(() => { S.videoFail = false; S.wallFrom = 0; }).catch(() => {}); } };
  ['pointerup', 'touchend', 'keydown'].forEach(n => addEventListener(n, welcomeTap, { capture: true, passive: true }));
  document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && S.phase === 'welcome' && !touch) toOffer(true); }); // #348: Esc that only drops the lock = skip, never a PAUSED screen mid-welcome
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
      if (ready) { const D = drone(), f = V(); camera.getWorldDirection(f); f.y = 0; f.normalize(); const d = narrow() ? 3.8 : 2.8, p = V(camera.position.x + f.x * d, 0, camera.position.z + f.z * d); if (D.tow) D.tow(true); D.root.position.set(p.x, BOT_HOVER, p.z); D.root.rotation.y = Math.atan2(camera.position.x - p.x, camera.position.z - p.z); }
      if (ready && hidden && !window.__paused) { S.arr = S.arr || now; if (now - S.arr > 150) begin(); } else S.arr = 0; return; }
    audio.muted = muted(); video.muted = muted() || S.vMute || video.muted && S.videoFail; spatialTick(); if (S.phase === 'welcome') welcomeGuard(now);
    if (holo) { holo.uni.t.value = now / 1000; holo.fade = Math.max(0, Math.min(1, holo.fade + (holo.out ? -dt * 2 : dt * 1.5))); holo.uni.flick.value = holo.fade * (0.93 + 0.05 * Math.sin(now / 37) + (Math.random() < 0.01 ? -0.25 : 0));
      const dx = holo.root.position.x - camera.position.x, dz = holo.root.position.z - camera.position.z; holo.plane.rotation.y = Math.atan2(-dx, -dz); holo.rg.rotation.z += dt * 0.4; if (holo.out && holo.fade <= 0) dropHolo();
      if (holo && holo.beam) { holo.beam.material.uniforms.t.value = now / 1000; holo.beam.material.uniforms.k.value = holo.fade; }
      const D = drone(); if (D && S.phase === 'welcome') { const dp = D.root.position, hp = holo.root.position; dp.x = hp.x; dp.z = hp.z; dp.y += (BOT_HOVER - dp.y) * Math.min(1, dt * 7); /* #380: snappier drop-in under the hologram */ } }
    if (S.phase === 'welcome') { const wt = S.videoFail && S.wallFrom ? (now - S.wallFrom) / 1000 * RATE : video.currentTime || 0; showCue(wt); if (video.ended || (S.videoFail && (S.wallFrom ? wt >= WELCOME_END_S : now - S.t0 > WELCOME_END_MS / RATE)) || video.currentTime >= WELCOME_END_S) /* #799, #816 wall clock if the video stalls */ toOffer(false); return; }
    if (S.phase === 'offer') { showCue(clipTime()); if (clipDone()) { if (S.clip === WELC && WELC) { S.hold = (S.hold || 0) + dt; if (S.hold > 0.35) { S.hold = 0; if (OFFER) playClip(OFFER); else stopClip(); } } else cap.style.display = 'none'; } return; }
    if (S.phase !== 'tour') return;
    const st = S.cur; if (!st) return; tick();
    if (S.clip) showCue(clipTime()); else cap.style.display = 'none';
    if (st.kind === 'intro') { if (clipDone()) { S.hold += dt; if (S.hold > 0.4 / RATE) next(); } return; }
    if (st.kind === 'walk') { if (st.queue && st.queue.length && clipDone()) { const q = st.queue.shift(); S.done += st.clip.duration_s; st.clip = q; playClip(q); } const arrived = stepTow(dt); if (arrived) frame(S.view, dt); if (arrived && (!st.clip || clipDone())) { S.hold += dt; if (S.hold > 0.5 / RATE) next(); } return; }
    if (S.book) { if (clipDone()) { S.hold += dt; if (S.hold > 0.7 / RATE) next(); } return; }
    const sp = (S.view.st && S.view.st.spots) || [], f = clipTime() / st.clip.duration_s;
    if (S.view.st && S.view.st.maps) { const ms = S.view.st.maps; let b = 0; for (let j = 0; j < ms.length; j++) if (f >= ms[j][0]) b = j; /* #786: hex map first, then the world map */
      if ((S.mapBeat ?? -1) !== b || (!S.view.map && ms[b] && (window.__wallMap || window.__testiMap) && !S.tow)) { S.mapBeat = b; S.view.st.beat = b; const v = viewFor(st.to); if (v && (v.map !== S.view.map || !S.tow)) { S.view = v; (S.mapLog = S.mapLog || []).push(v.map + '@' + f.toFixed(2)); if (Math.hypot(camera.position.x - v.stand.x, camera.position.z - v.stand.z) > 0.3) towTo(v, Math.max(1.5, (ms[b + 1] ? ms[b + 1][0] - f : 1 - f) * st.clip.duration_s * 0.6) / RATE); } }
      if (S.tow) { if (stepTow(dt)) frame(S.view, dt); } else frame(S.view, dt); if (clipDone()) { S.hold += dt; if (S.hold > 0.7 / RATE) { S.mapBeat = -1; next(); } } return; }
    while (S.spotsDone < sp.length && f >= sp[S.spotsDone][0]) { const p = byTitle(sp[S.spotsDone][1]); const G = EGGS() && EGGS().eggs && EGGS().eggs.guide; if (p && G) G.spotlight(p);
      if (p) { goFocus(p, (st.clip.duration_s - clipTime()) / RATE); S.focusLog[st.to].push(p.data.title); } S.spotsDone++; }
    // control comes back once the last painting has had its moment (about a fifth of the clip, at least 2.5 s)
    const lastAt = sp.length ? sp[sp.length - 1][0] : 0, freeAt = Math.min(0.9, lastAt + Math.max(0.12, 2.5 / st.clip.duration_s));
    if (game.freeze && S.spotsDone >= sp.length && ((f >= freeAt && !S.ftow && performance.now() - (S.settledAt || 0) > 1500) || clipDone()) && !S.view.st.mural) { (S.freed = S.freed || {})[st.to] = +(f.toFixed(2)); freeze(false); S.focus = null; S.ftow = null; S.freeSince = performance.now(); const D = drone(); if (D) D.tow(false); }
    if (S.focus) stepFocus(dt); else if (game.freeze) frame(S.view, dt);
    if (clipDone()) { S.hold += dt; if (S.hold > 0.7 / RATE) next(); } }
  requestAnimationFrame(update);
  const forced = Q.get('tour') === '1' || Q.has('tourrate'); let seen = false; try { seen = sessionStorage.getItem('tjmTourSeen') === '1'; } catch (e) {}
  if (Q.get('tour') === '0' || Q.has('room') || Q.has('goto') || (!forced && (seen || window.__test))) S.phase = 'off';
  const api = window.__tour = { S, TOTAL, RATE, get phase() { return S.phase; }, begin: () => { if (S.phase === 'off') S.phase = 'wait'; begin(); }, skip: () => toOffer(true), start: startTour, walk: walkAround, exit: () => S.phase === 'tour' && finish(true),
    view: o => viewFor(o), route: (f, t) => ringPath(V(f.x, 0, f.z), V(t.x, 0, t.z)), inMid: (x, z) => inMid(x, z), get state() { return { phase: S.phase, step: S.i, steps: S.steps.length, clip: S.clip && S.clip.file, t: +clipTime().toFixed(2), audioOK: S.audioOK, visited: S.visited.slice(), log: S.log.slice(), errors: S.errors.slice(), ring: left.textContent, caption: cap.style.display !== 'none' ? cap.textContent : '', muted: muted(), audioMuted: audio.muted, videoMuted: video.muted, frozen: !!game.freeze, focus: S.focus ? S.focus.p.data.title : null, focusLog: JSON.parse(JSON.stringify(S.focusLog || {})), focusSeen: JSON.parse(JSON.stringify(S.focusSeen || {})), freed: { ...(S.freed || {}) }, pulls: S.pulls.slice(), glides: S.glides.slice(), ctl: ctl.style.display !== 'none', ctlShown: S.ctlShown || 0, gap: S.gap, kind: S.cur && S.cur.kind, mapLog: (S.mapLog || []).slice() }; } };
  return api;
}

// #738 (TJ): during the guided tour hide the bottom tool strip, SCAN/touch buttons and minimap (FP scanner+laser skipped in core render); restored when __tourOn clears
{ const st = document.createElement('style'); st.id = 'tourhud738'; st.textContent = 'body.tour738 #hud,body.tour738 #touch,body.tour738 #tfire,body.tour738 #tswap,body.tour738 #tlaunch,body.tour738 .mm-wrap,body.tour738 .mm-btn,body.tour738 #cross{display:none!important}'; document.head.appendChild(st);
  let was = null; const loop = () => { const r = document.getElementById('tourRing'), on = !!window.__tourOn || !!(r && r.style.display === 'flex'); window.__tourHud = on; if (on !== was) { was = on; document.body.classList.toggle('tour738', on); } requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
