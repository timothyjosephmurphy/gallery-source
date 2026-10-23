// #314 (TJ): 'Ask for guidance' is a ride. The guide ostrich grows to rider size and carries the visitor once round the ring of hexagon galleries,
// room to room with no backtracking, pausing at a couple of paintings in each (head-point clip, caption = title). Then it brings the rider back to the
// centre courtyard and shows, in text and captions only (nothing is voiced): the checkout portals, the Buy Scanner, the other HUD tools, and that the
// guide can be asked for help at any time. A 'Get off' button is on screen the whole ride and is offered again at the end. Desktop and phone.
import * as THREE from 'three';
import CATALOG from './catalog.json';
import { skinOstrich } from './ostrichbot.js';
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), SPEED = 2.3, HOLD = 3.4, STOPS_PER_ROOM = 2;
export function installRide({ game, W, low }) {
  const camera = game.camera, eggs = () => window.eggs, drone = () => eggs() && eggs().drone, world = () => eggs() && eggs().world;
  const rooms = CATALOG.layout.tags.rooms.filter(r => !r.annex), byId = Object.fromEntries(rooms.map(r => [r.id, r]));
  const S = { phase: 'idle', rides: 0, log: [], errors: [], stops: 0, finale: 0, rooms: [] };
  const css = document.createElement('style'); css.textContent = `
#rideCap{position:fixed;left:50%;bottom:calc(15% + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:46;max-width:min(780px,92vw);padding:9px 16px;border-radius:10px;background:#000d;color:#fff;font:500 17px/1.35 system-ui,sans-serif;text-align:center;display:none;pointer-events:none}
#rideOff{position:fixed;right:calc(14px + env(safe-area-inset-right));top:calc(100px + env(safe-area-inset-top));z-index:48;min-width:112px;min-height:46px;padding:10px 20px;border-radius:999px;border:2px solid #f3d36a;background:#1c2a1ef0;color:#fff7d8;font:800 16px system-ui,sans-serif;cursor:pointer;display:none;box-shadow:0 4px 18px #0009;pointer-events:auto}
#rideOff.big{animation:ridePulse 1.1s ease-in-out infinite}
@keyframes ridePulse{50%{transform:scale(1.08);box-shadow:0 0 0 8px #f3d36a55}}
.rideHi{outline:3px solid #f3d36a!important;outline-offset:2px;animation:rideGlow 1s ease-in-out infinite}@keyframes rideGlow{50%{outline-color:#fff}}`; document.head.appendChild(css);
  const mk = (tag, id, html) => { const e = document.createElement(tag); e.id = id; if (html) e.textContent = html; document.body.appendChild(e); ['mousedown', 'pointerdown', 'touchstart', 'mouseup', 'pointerup'].forEach(n => e.addEventListener(n, ev => ev.stopPropagation(), { passive: true })); return e; };
  const cap = mk('div', 'rideCap'), off = mk('button', 'rideOff', 'Get off'); off.type = 'button';
  const say = t => { cap.textContent = t; cap.style.display = t ? 'block' : 'none'; if (t) S.log.push(t); };
  const at = (r, s) => { let i = 1; while (i < r.acc.length - 1 && r.acc[i] < s) i++; const a = r.pts[i - 1], b = r.pts[i], seg = (r.acc[i] - r.acc[i - 1]) || 1e-6, u = Math.min(1, Math.max(0, (s - r.acc[i - 1]) / seg)); return V(a.x + (b.x - a.x) * u, 0, a.z + (b.z - a.z) * u); };
  const qLook = (from, to) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(from, to, V(0, 1, 0)));
  // ---- the route: the ring of rooms by their neighbours (each room hands on to the next), 2 big paintings per room, then the courtyard by the checkout portals
  function ringOrder() { const o = [rooms[0].id], seen = new Set(o); for (;;) { const cur = byId[o[o.length - 1]], nx = Object.values(cur.neighbours || {}).find(n => byId[n] && !seen.has(n)); if (!nx) break; o.push(nx); seen.add(nx); } return o; }
  function pickPaintings(rid) { const ps = CATALOG.paintings.filter(p => p.room === rid && !p.paulMurphy && p.fw && p.fh).sort((a, b) => b.fw * b.fh - a.fw * a.fh), out = [];
    for (const p of ps) { if (out.length >= STOPS_PER_ROOM) break; if (out.some(q => q.wall === p.wall)) continue; out.push(p); } return out; }
  const standFor = p => { const w = world(), res = []; for (const d of [2.4, 3.0, 3.6, 4.2]) { const x = p.x + p.ix * Math.max(d, p.fw * 0.9 + 0.9), z = p.z + p.iz * Math.max(d, p.fw * 0.9 + 0.9); if (W.walkable(x, z)) res.push(V(x, 0, z)); } return res; };
  function courtyardSpot() { const g = (game.tags && game.tags.doors || []).find(d => d.kind === 'checkout'); const c = g ? V(g.x, 0, g.z) : V(0, 0, 8); const dir = V(-c.x, 0, -c.z).normalize(); for (const d of [3.2, 4, 2.4, 5]) { const q = c.clone().addScaledVector(dir, d); if (W.walkable(q.x, q.z)) return { stand: q, gate: c }; } return { stand: V(0, 0, 6), gate: c }; }
  function pathPts(from, to) { const w = world(); const path = w.path(from, to, 0.35) || w.path(from, to, 0.25); if (!path) return null; return [from, ...path.map(q => V(q.x, 0, q.z)), to]; }
  function build(start) { const legs = []; let cur = start.clone(); S.rooms = [];
    for (const rid of ringOrder()) { const picks = pickPaintings(rid); let got = 0;
      for (const p of picks) { let leg = null, stand = null; for (const st of standFor(p)) { const pts = pathPts(cur, st); if (pts) { leg = pts; stand = st; break; } } if (!leg) { S.errors.push('nopath ' + p.id); continue; }
        legs.push({ kind: 'paint', pts: leg, p, room: rid, stand }); cur = stand; got++; }
      S.rooms.push({ rid, got }); }
    const fin = courtyardSpot(), fp = pathPts(cur, fin.stand); legs.push({ kind: 'finale', pts: fp || [cur, fin.stand], fin, room: 'courtyard' }); return legs; }
  // ---- ride state
  const R = { legs: [], i: -1, r: null, hold: 0, saved: null, yaw: 0, look: null, ptMode: null };
  function startLeg() { R.i++; const leg = R.legs[R.i]; if (!leg) return finish(); let L = 0; const acc = [0]; for (let i = 1; i < leg.pts.length; i++) { L += leg.pts[i].distanceTo(leg.pts[i - 1]); acc.push(L); } R.r = { pts: leg.pts, acc, L, s: 0, leg }; S.room = leg.room && leg.room !== 'courtyard' ? leg.room : null; S.phase = 'ride'; R.look = null;
    const ob = skinOstrich(drone(), low); ob && ob.force && ob.force('Walk'); ob && ob.still && ob.still(false); }
  function arrive(leg) { if (leg.kind === 'paint') { S.stops++; S.phase = 'hold'; R.hold = HOLD; const p = leg.p, D = drone(), ob = D && D.__duck; R.look = V(p.x, p.y, p.z); say(p.title);
      const h = V(Math.sin(R.yaw), 0, Math.cos(R.yaw)), to = V(p.x - D.root.position.x, 0, p.z - D.root.position.z), side = h.x * to.z - h.z * to.x; ob && ob.force && ob.force('Walk'); ob && ob.still && ob.still(true); ob && ob.point && ob.point(side > 0 ? -1 : 1); }
    else { S.phase = 'finale'; S.finale = 0; R.hold = 0.6; R.look = null; const ob = drone() && drone().__duck; ob && ob.force && ob.force('Walk'); ob && ob.still && ob.still(true); } }
  const hud = () => [...document.querySelectorAll('div,button,span')].filter(e => /Buy\s*Scanner/i.test(e.textContent) && e.children.length < 6).sort((a, b) => a.textContent.length - b.textContent.length)[0];
  const unhi = () => document.querySelectorAll('.rideHi').forEach(e => e.classList.remove('rideHi'));
  const FIN = [
    { t: "That's the whole circuit, and we're back in the centre courtyard.", look: 'none' },
    { t: "1 · This is the checkout fountain: walk into it with your cart and I'll take you to checkout.", look: 'gate' },
    { t: "2 · This is the Buy Scanner (the checkout gun, key 1). Aim it at a painting and click or tap to buy the painting or its prints.", look: 'none', hi: () => { const h = hud(); return h && (h.closest('#hud,.hud') || h); } },
    { t: '3 · There are other fun tools in the HUD bar to play with. Try them (keys 2, 3, 4 and on).', look: 'none', hi: () => { const h = hud(); return h && (h.parentElement || h); } },
    { t: 'You can ask the guide bot for help at any time: click or tap me for the menu, or press T to ask a question.', look: 'none' },
    { t: 'Ready to hop off? Press Get off.', look: 'none', last: true }];
  function stepFinale(dt) { R.hold -= dt; if (R.hold > 0) return; const f = FIN[S.finale]; if (!f) return; unhi(); const leg = R.legs[R.i];
    say(f.t); R.look = f.look === 'gate' ? V(leg.fin.gate.x, 1.4, leg.fin.gate.z) : null; const h = f.hi && f.hi(); if (h) h.classList.add('rideHi'); if (f.last) { off.classList.add('big'); R.hold = 1e9; } else R.hold = f.look === 'gate' ? 5.2 : 4.6; S.finale++; }
  function mount() { const D = drone(); if (!D) return false; const ob = skinOstrich(D, low); if (!ob || !ob.ready) return false; S.ride = true;
    R.saved = { y: camera.position.y, mode: D.mode, pos: D.root.position.clone(), rot: D.root.rotation.y, holo: window.__tourHoloHide };
    try { document.exitPointerLock(); } catch (e) {} window.__reading = true; window.__rideOn = true; game.freeze = true; D.tow(true); ob.rider(true); ob.still(true); ob.force('Walk'); ob.snap && ob.snap('Walk');
    const from = V(camera.position.x, 0, camera.position.z); D.root.position.set(from.x, 0, from.z); R.yaw = Math.atan2(Math.sin(camera.rotation.y) * -1, -Math.cos(camera.rotation.y)); const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ'); R.yaw = e.y + Math.PI; D.root.rotation.y = R.yaw;
    R.legs = build(from); R.i = -1; off.style.display = 'block'; off.classList.remove('big'); say('Hop on! We ride once round the galleries.'); R.hold = 1.6; S.phase = 'mount'; return true; }
  function dismount(reason) { if (!S.ride) return; S.ride = false; const D = drone(), ob = D && D.__duck; unhi(); say(''); off.style.display = 'none'; off.classList.remove('big');
    const c = camera.position, h = V(Math.sin(R.yaw), 0, Math.cos(R.yaw)); camera.position.y = R.saved ? R.saved.y : 1.6; // stand on the floor where the ostrich is; bot hovers just ahead
    if (D) { ob && ob.rider(false); ob && ob.force && ob.force(null); ob && ob.still && ob.still(false); D.root.position.set(c.x + h.x * 1.4, 1.35, c.z + h.z * 1.4); D.tow(false); }
    const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ'); e.z = 0; e.x = 0; camera.quaternion.setFromEuler(e);
    game.freeze = false; window.__reading = false; window.__rideOn = false; S.phase = 'idle'; S.ended = reason; S.room = null; R.r = null; }
  function finish() { S.phase = 'done'; }
  off.addEventListener('click', e => { e.preventDefault(); dismount('get-off'); }); off.addEventListener('touchend', e => { e.preventDefault(); dismount('get-off'); });
  addEventListener('keydown', e => { if (e.code === 'Escape' && S.ride) dismount('esc'); }, true);
  const EYE = 0.65; let last = performance.now(); const seatPos = V();
  function update() { requestAnimationFrame(update); const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000) * (window.__rideRate || 1); last = now; if (!S.ride) return; const D = drone(), ob = D && D.__duck; if (!D || !ob) return;
    const c = camera.position;
    if (S.phase === 'mount') { R.hold -= dt; if (R.hold <= 0) startLeg(); }
    else if (S.phase === 'ride' && R.r) { const r = R.r; r.s = Math.min(r.L, r.s + SPEED * Math.min(1, (r.s + 0.5) / 1.2) * Math.min(1, (r.L - r.s + 0.6) / 1.2 + 0.25) * dt); const me = at(r, r.s), ahead = at(r, Math.min(r.L, r.s + 1.2));
      const dx = ahead.x - me.x, dz = ahead.z - me.z; if (Math.hypot(dx, dz) > 0.05) { const y = Math.atan2(dx, dz); let d = y - R.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); R.yaw += d * Math.min(1, dt * 5); }
      D.root.position.set(me.x, 0, me.z); D.root.rotation.y = R.yaw; ob.walkSpeed && ob.walkSpeed(SPEED); if (r.s >= r.L - 1e-3) arrive(r.leg); }
    else if (S.phase === 'hold') { R.hold -= dt; ob.walkSpeed && ob.walkSpeed(0); if (R.hold <= 0) { say(''); startLeg(); } }
    else if (S.phase === 'finale') { ob.walkSpeed && ob.walkSpeed(0); stepFinale(dt); }
    // camera at the saddle (RiderSeat): position follows the animated bird, gaze eases toward the painting / gate or along the path
    D.root.position.y = 0; D.root.updateMatrixWorld(true); const seat = ob.seat && ob.seat(); if (seat) { seat.getWorldPosition(seatPos); c.copy(seatPos); c.y += EYE; } else c.y = 2.0; // the drone's own tow height is ignored; the rider's eyes sit EYE above the saddle
    const fwd = V(c.x + Math.sin(R.yaw) * 3, c.y - 0.12, c.z + Math.cos(R.yaw) * 3), tgt = R.look || fwd; camera.quaternion.slerp(qLook(c, tgt), Math.min(1, dt * (R.look ? 3.2 : 4.5)));
    const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ'); e.z = 0; camera.quaternion.setFromEuler(e); }
  requestAnimationFrame(update);
  const api = { get ready() { return !!(drone() && drone().__duck && drone().__duck.ready); }, get active() { return !!S.ride; }, start: () => S.ride ? true : mount(), getOff: () => dismount('api'), state: S, legs: () => R.legs, route: () => ringOrder() };
  window.__ride = api; return api;
}
