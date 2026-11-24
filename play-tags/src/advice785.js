// #825 (tracker #785): advice escort. Ask the guide about the art ("tell me about the paintings", "walk me through") and the bot tows you
// along the walls in locked hang order, stopping in front of each painting while you look at it: caption + Maeve VO (if the pack is live).
// Starts from the stop nearest you and keeps going. Esc / STOP ends it. Rides/tours ("show me around", "take me on a ride") still go to __ride.
import * as THREE from 'three';
import CAPS from './advice-captions-785.json';
const BASE = 'https://img.tjm.art/play/tour/advice-maeve-1/';
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export function installAdvice785({ game, W }) {
  if (window.__advice) return window.__advice;
  const camera = game.camera, WW = () => (window.eggs && window.eggs.world) || W, drone = () => window.eggs && window.eggs.drone;
  const S = { on: false, i: -1, list: [], tow: null, dwell: 0, stops: 0, audio: null, man: null, base: null, errors: [] };
  const css = document.createElement('style'); css.textContent = `#advCap{position:fixed;left:50%;bottom:calc(14% + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:46;max-width:min(760px,90vw);padding:8px 14px;border-radius:10px;background:#000c;color:#fff;font:500 16px/1.35 system-ui,sans-serif;text-align:center;display:none;pointer-events:none}#advCap b{display:block;color:#f3d36a;font-size:14px;margin-bottom:2px}
#advBar{position:fixed;right:calc(12px + env(safe-area-inset-right));top:calc(100px + env(safe-area-inset-top));z-index:47;display:none;gap:8px}#advBar button{padding:9px 16px;border-radius:999px;border:1px solid #fff8;background:#000b;color:#fff;font:700 14px system-ui,sans-serif;cursor:pointer}`;
  document.head.appendChild(css);
  const cap = document.createElement('div'); cap.id = 'advCap'; document.body.appendChild(cap);
  const bar = document.createElement('div'); bar.id = 'advBar'; bar.innerHTML = '<button id="advNext" type="button">Next ›</button><button id="advStop" type="button">STOP (Esc)</button>'; document.body.appendChild(bar);
  const act = f => e => { e.preventDefault(); e.stopPropagation(); f(); };
  for (const t of ['click', 'touchend']) { bar.querySelector('#advNext').addEventListener(t, act(() => next())); bar.querySelector('#advStop').addEventListener(t, act(() => stop())); }
  ['mousedown', 'touchstart', 'pointerdown'].forEach(n => bar.addEventListener(n, e => e.stopPropagation()));
  addEventListener('keydown', e => { if (e.code === 'Escape' && S.on) { e.preventDefault(); stop(); } }, true);
  // audio pack (fail soft): manifest {clips:[{id,file|url,duration_s}]} or {id: file}
  const tryMan = names => names.length ? fetch(BASE + names[0], { cache: 'no-cache' }).then(r => r.ok ? r.json() : tryMan(names.slice(1))).catch(() => tryMan(names.slice(1))) : Promise.resolve(null); /* #826 */
  tryMan(['advice-manifest.json', 'walk-manifest.json', 'manifest.json']).then(m => { if (!m) return; const map = {}, dur = S.dur = {}; const L = Array.isArray(m) ? m : m.clips || m.stops || null;
    if (L) for (const c of L) { const f = c.url || c.file || c.audio; for (const k of [c.id, c.paintingId]) if (k && f) { map[k] = /^https?:/.test(f) ? f : BASE + f; if (c.duration_s > 0) dur[k] = +c.duration_s; } } else for (const k in m) if (typeof m[k] === 'string') map[k] = /^https?:/.test(m[k]) ? m[k] : BASE + m[k];
    S.man = map; S.base = BASE; S.audioReady = Object.keys(map).length >= 200; }).catch(() => {});
  const muted = () => !!(game.holo && game.holo.muted);
  const byId = id => game.paintings.find(p => p.data && p.data.id === id && p.state === 'wall');
  function standFor(p) { const q = p.group.getWorldPosition(V()), n = V(p.data.ix, 0, p.data.iz).normalize(), sz = Math.max(p.data.fw || p.data.w || 1, p.data.fh || p.data.h || 1);
    for (const d of [Math.max(1.8, sz * 1.3), 2.4, 3.0, 3.6, 1.4]) { const x = q.x + n.x * d, z = q.z + n.z * d; if (W.walkable(x, z)) return V(x, 0, z); } return null; }
  function build() { S.list = CAPS.map(c => ({ c, p: byId(c.p) })).filter(s => s.p); }
  function goTo(i) { if (i >= S.list.length) return stop('That was the whole gallery. Thank you!'); S.i = i; const s = S.list[i], st = standFor(s.p); if (!st) return goTo(i + 1);
    const from = V(camera.position.x, 0, camera.position.z), path = WW().path(from, st, 0.35) || WW().path(from, st, 0.25); if (!path && from.distanceTo(st) > 1.5) { S.errors.push('nopath ' + s.c.id); return goTo(i + 1); }
    const pts = [from, ...(path || []).map(q => V(q.x, 0, q.z)), st]; let L = 0; const acc = [0]; for (let k = 1; k < pts.length; k++) { L += pts[k].distanceTo(pts[k - 1]); acc.push(L); }
    const q = s.p.group.getWorldPosition(V()); S.tow = { pts, acc, L, s: 0, look: V(q.x, Math.min(q.y, 2.2), q.z), wall: performance.now() }; S.dwell = 0; cap.style.display = 'none'; }
  function speak(s) { S.stops++; cap.innerHTML = '<b></b><span></span>'; cap.firstChild.textContent = s.c.t; cap.lastChild.textContent = s.c.s; cap.style.display = 'block';
    let d = Math.max(5, s.c.s.split(/\s+/).length / 2.5 + 1.5); const url = S.man && (S.man[s.c.id] || S.man[s.c.p]); const dd = S.dur && (S.dur[s.c.id] || S.dur[s.c.p]); if (url && dd && !muted()) d = Math.max(d, dd + 1);
    if (url && !muted()) { try { const a = S.audio = new Audio(url); a.play().catch(() => {}); a.onended = () => { if (S.audio === a && S.dwell > 0) S.dwell = Math.min(S.dwell, 1.2); }; a.onloadedmetadata = () => { if (isFinite(a.duration)) S.dwell = Math.max(S.dwell, a.duration + 1); }; } catch (e) {} }
    S.dwell = d; }
  function halt() { if (S.audio) { try { S.audio.pause(); } catch (e) {} S.audio = null; } }
  function next() { if (!S.on) return; halt(); goTo(S.i + 1); }
  function start(fromNearest = true) { if (S.on) return true; if (!WW() || !WW().path) return false; build(); if (!S.list.length) return false; let i0 = 0;
    if (fromNearest) { let bd = 1e9; const c = camera.position; S.list.forEach((s, k) => { const q = s.p.group.position, d = Math.hypot(q.x - c.x, q.z - c.z); if (d < bd) { bd = d; i0 = k; } }); }
    S.on = true; S.runs = (S.runs || 0) + 1; bar.style.display = 'flex'; try { document.exitPointerLock && document.pointerLockElement && document.exitPointerLock(); } catch (e) {} const D = drone(); D && D.tow && D.tow(true); goTo(i0); return true; }
  function stop(msg) { if (!S.on) return; S.on = false; S.tow = null; halt(); bar.style.display = 'none'; const D = drone(); D && D.tow && D.tow(false);
    cap.textContent = msg || 'Okay, stopping here.'; cap.style.display = 'block'; setTimeout(() => { if (!S.on) cap.style.display = 'none'; }, 1800); }
  const at = (r, s) => { let i = 1; while (i < r.acc.length - 1 && r.acc[i] < s) i++; const a = r.pts[i - 1], b = r.pts[i], seg = (r.acc[i] - r.acc[i - 1]) || 1e-6, u = Math.min(1, Math.max(0, (s - r.acc[i - 1]) / seg)); return V(a.x + (b.x - a.x) * u, 0, a.z + (b.z - a.z) * u); };
  function update() { requestAnimationFrame(update); if (!S.on) return; const now = performance.now(), c = camera.position;
    if (S.tow) { const r = S.tow, dt = Math.min(0.2, (now - r.wall) / 1000); r.wall = now; r.s = Math.min(r.L, r.s + 2.8 * dt); const me = at(r, r.s); c.x = me.x; c.z = me.z;
      // strafe: keep looking at the painting we're walking to
      const m = new THREE.Matrix4().lookAt(c, r.look, V(0, 1, 0)), q = new THREE.Quaternion().setFromRotationMatrix(m); camera.quaternion.slerp(q, Math.min(1, dt * 4)); const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ'); e.z = 0; camera.quaternion.setFromEuler(e);
      const D = drone(); if (D) { const dp = D.root.position, n = V(-(r.look.z - c.z), 0, r.look.x - c.x).normalize(), h = V(c.x + n.x * 0.9, 0, c.z + n.z * 0.9); dp.x += (h.x - dp.x) * Math.min(1, dt * 3); dp.z += (h.z - dp.z) * Math.min(1, dt * 3); }
      if (r.s >= r.L - 1e-3) { S.tow = null; S.lookT = now; speak(S.list[S.i]); } return; }
    S._w = S._w || now; const dt = Math.min(0.2, (now - S._w) / 1000); S._w = now; const s = S.list[S.i]; if (s) { const q = s.p.group.getWorldPosition(V()), m = new THREE.Matrix4().lookAt(c, V(q.x, Math.min(q.y, 2.2), q.z), V(0, 1, 0)); camera.quaternion.slerp(new THREE.Quaternion().setFromRotationMatrix(m), Math.min(1, dt * 3)); }
    S.dwell -= dt; if (S.dwell <= 0 && (!S.audio || S.audio.ended || S.audio.paused)) next(); }
  requestAnimationFrame(update);
  // advice routing on the guide prompt: say what you want
  const RIDE = /\b(ride|tour|show me around|look around|take me around)\b/i, ART = /\b(paintings?|art ?works?|the art|walk me through|tell me about|explain|guid(e|ance)|advice|describe|stories|story)\b/i;
  const wrap = () => { const g = window.eggs && window.eggs.eggs && window.eggs.eggs.guide; if (!g || g.__adv825) return !!g; const orig = g.ask.bind(g);
    g.ask = text => { const t = String(text || ''); if (RIDE.test(t) && window.__ride && window.__ride.ready && !window.__ride.active) { g.close && g.close(); window.__ride.start(); return { text: t, outcome: 'ride' }; }
      if (ART.test(t) && !/\bcheckout\b/i.test(t)) { g.close && g.close(); start(); return { text: t, outcome: 'advice' }; } return orig(t); };
    g.__adv825 = true; return true; };
  const iv = setInterval(() => { if (wrap()) clearInterval(iv); }, 500);
  return (window.__advice = { start, stop, next, state: S, get active() { return S.on; } });
}
