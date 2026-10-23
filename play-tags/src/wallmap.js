// #291 (TJ): a wall map in the courtyard. A freestanding board beside the checkout platform, facing the centre, showing every room
// top-down with its name, oriented "forward is up" for someone standing in front of it, with a pulsing you-are-here dot.
// Tap or click a room on the map and the duck guide escorts you there: a smooth glide along the world's own walk paths (never
// through walls), then control is handed straight back. Data-driven from the world (rooms, doors); no layout writes.
import * as THREE from 'three';
import SLOTS from './outer-slots.json'; // #295: the map hangs flat on a courtyard-facing outer wall (tools/outerslots.mjs)
export function installWallMap({ game, W, root, world, drone, low }) {
  const SL = SLOTS.slots.map, A = 95 * Math.PI / 180, R = 5.6, f = SL ? [-SL.n[0], -SL.n[1]] : [Math.cos(A), Math.sin(A)], n = [-f[0], -f[1]], rt = [-f[1], f[0]], BW = SL ? SL.w : 2.4, BH = SL ? SL.h : 1.6, BY = SL ? 1.75 : 1.45;
  const pos = SL ? new THREE.Vector3(SL.mid[0] + SL.t[0] * SL.s + SL.n[0] * 0.07, 0, SL.mid[1] + SL.t[1] * SL.s + SL.n[1] * 0.07) : new THREE.Vector3(f[0] * R, 0, f[1] * R), rooms = W.rooms.filter(r => r.kind === 'room' || r.kind === 'outer' || r.kind === 'hub');
  const uv = (x, z) => [x * rt[0] + z * rt[1], x * f[0] + z * f[1]]; let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  for (const r of rooms) for (const p of r.poly) { const [u, v] = uv(p[0], p[1]); u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  const CW = low ? 768 : 1200, CH = Math.round(CW * BH / BW), pad = 40, sc = Math.min((CW - 2 * pad) / (u1 - u0), (CH - 2 * pad - 50) / (v1 - v0));
  const ox = (CW - sc * (u1 - u0)) / 2, oy = 50 + (CH - 50 - sc * (v1 - v0)) / 2;
  const toC = (x, z) => { const [u, v] = uv(x, z); return [ox + (u - u0) * sc, oy + (v1 - v) * sc]; }, fromC = (cx, cy) => { const u = (cx - ox) / sc + u0, v = v1 - (cy - oy) / sc; return [u * rt[0] + v * f[0], u * rt[1] + v * f[1]]; };
  const c = document.createElement('canvas'); c.width = CW; c.height = CH; const x = c.getContext('2d'), tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const inPoly = (px, pz, poly) => { let o = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > pz) !== (zj > pz) && px < (xj - xi) * (pz - zi) / (zj - zi) + xi) o = !o; } return o; };
  let hover = null;
  function draw(t = 0) { x.fillStyle = '#f3ead8'; x.fillRect(0, 0, CW, CH); x.strokeStyle = '#7a5a34'; x.lineWidth = 8; x.strokeRect(4, 4, CW - 8, CH - 8);
    x.fillStyle = '#3b2a1c'; x.font = 'bold 34px Georgia, serif'; x.textAlign = 'center'; x.fillText('Gallery map: tap a room and the guide will take you', CW / 2, 40);
    for (const r of rooms) { x.beginPath(); r.poly.forEach((p, i) => { const [a, b] = toC(p[0], p[1]); i ? x.lineTo(a, b) : x.moveTo(a, b); }); x.closePath();
      x.fillStyle = r.kind === 'hub' ? '#d9ccb4' : r.kind === 'outer' ? '#a9c49a' : r === hover ? '#f0b866' : '#e6d3b0'; x.fill(); x.lineWidth = 2.5; x.strokeStyle = '#6b4f2e'; x.stroke(); }
    x.font = (low ? 15 : 19) + 'px Georgia, serif'; x.fillStyle = '#2a1d12';
    for (const r of rooms) { if (r.kind === 'hub') continue; const [a, b] = toC(r.center[0], r.center[1]), words = String(r.label || r.id).split(/\s+/), lines = []; let ln = '';
      for (const w of words) { if ((ln + ' ' + w).trim().length > 14) { lines.push(ln.trim()); ln = w; } else ln += ' ' + w; } lines.push(ln.trim()); lines.slice(0, 3).forEach((l, i) => x.fillText(l, a, b + (i - (Math.min(3, lines.length) - 1) / 2) * 21)); }
    { const [hx, hy] = toC(0, 0), rr = (low ? 16 : 24); x.beginPath(); x.arc(hx, hy, rr, 0, 7); x.fillStyle = '#e8b64a'; x.fill(); x.lineWidth = 4; x.strokeStyle = '#8a5a1e'; x.stroke(); x.beginPath(); x.arc(hx, hy, rr * 0.45, 0, 7); x.fillStyle = '#fff1c0'; x.fill();
      x.fillStyle = '#5a3410'; x.font = 'bold ' + (low ? 16 : 21) + 'px Georgia, serif'; x.textAlign = 'center'; x.fillText('Checkout', hx, hy + rr + (low ? 16 : 22)); } // #323: the checkout fountain, tap it and the guide walks you there
    const cp = game.camera.position, [ya, yb] = toC(cp.x, cp.z); x.beginPath(); x.arc(ya, yb, 9 + 3 * Math.sin(t * 4), 0, 7); x.fillStyle = '#d2302c'; x.fill(); x.fillStyle = '#d2302c'; x.font = 'bold 18px sans-serif'; x.fillText('you are here', ya, yb - 16);
    tex.needsUpdate = true; }
  const g = new THREE.Group(); g.name = 'wallMap'; g.position.copy(pos); g.rotation.y = Math.atan2(n[0], n[1]); root.add(g);
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a3e26, roughness: 0.7 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.14, BH + 0.14, SL ? 0.04 : 0.08), wood); back.position.set(0, BY, SL ? -0.03 : -0.05); g.add(back);
  if (!SL) for (const sd of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, BY + BH / 2, 0.1), wood); post.position.set(sd * (BW / 2 - 0.1), (BY + BH / 2) / 2, -0.1); g.add(post); }
  const face = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); face.position.set(0, BY, 0); face.name = 'wallMapFace'; g.add(face); draw();
  const S = window.__wallMap = { pos: [pos.x, pos.z], rooms: rooms.filter(r => r.kind !== 'hub').map(r => r.id), escorts: [], active: null, go, roomAt: (cx, cy) => pick(...fromC(cx, cy)) };
  S.screenOf = id => { const r = id === 'checkout' ? CHKR : rooms.find(q => q.id === id); if (!r) return null; const [cx, cy] = toC(r.center[0], r.center[1]); const lp = new THREE.Vector3((cx / CW - 0.5) * BW, (0.5 - cy / CH) * BH, 0);
    const wp = face.localToWorld(lp).project(game.camera); return [(wp.x + 1) / 2 * innerWidth, (1 - wp.y) / 2 * innerHeight]; };
  S.stand = [pos.x + n[0] * 2.4, pos.z + n[1] * 2.4];
  function pick(px, pz) { if (Math.hypot(px, pz) < 2.6) return CHKR; return rooms.find(r => r.kind !== 'hub' && inPoly(px, pz, r.poly)); }
  const CHKR = { id: 'checkout', kind: 'checkout', center: [0, 0] };
  function go(id, speed = 3.2) { const r = id === 'checkout' ? CHKR : rooms.find(q => q.id === id), Wd = world(); if (!r || !Wd || S.active) return false; const cp = game.camera.position, from = new THREE.Vector3(cp.x, 0, cp.z), to = new THREE.Vector3(r.center[0], 0, r.center[1]);
    if (id === 'checkout') { const d = Math.hypot(from.x, from.z) || 1; to.set(from.x / d * 2.7, 0, from.z / d * 2.7); } // stops at the edge of the fountain: stepping in is the visitor's choice (it opens checkout)
    const path = Wd.path(from, to, 0.35) || Wd.path(from, to, 0.25); if (!path) { S.escorts.push({ id, ok: false, err: 'nopath' }); return false; }
    const pts = [from, ...path.map(q => new THREE.Vector3(q.x, 0, q.z)), to]; let L = 0; const acc = [0]; for (let i = 1; i < pts.length; i++) { L += pts[i].distanceTo(pts[i - 1]); acc.push(L); }
    game.freeze = true; window.__reading = true; const D = drone(); if (D && D.tow) D.tow(true); S.active = { id, pts, acc, L, s: 0, speed, frames: 0, t0: performance.now() }; return true; }
  const at = (r, s) => { let i = 1; while (i < r.acc.length - 1 && r.acc[i] < s) i++; const a = r.pts[i - 1], b = r.pts[i], seg = (r.acc[i] - r.acc[i - 1]) || 1e-6, u = Math.min(1, Math.max(0, (s - r.acc[i - 1]) / seg)); return new THREE.Vector3(a.x + (b.x - a.x) * u, 0, a.z + (b.z - a.z) * u); };
  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2(); let down = null;
  addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; }, true);
  addEventListener('pointerup', e => { if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 12 || game.freeze || window.__reading || S.active) return;
    if (document.pointerLockElement) v2.set(0, 0); else v2.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(v2, game.camera); ray.far = 8;
    const h = ray.intersectObject(face, false)[0]; if (!h) return; const r = pick(...fromC(h.uv.x * CW, (1 - h.uv.y) * CH)); if (r) { S.tapped = r.id; go(r.id); } }, true);
  let tt = 0, acc = 0;
  return { update(dt) { tt += dt; const cp = game.camera.position; const near = Math.hypot(cp.x - pos.x, cp.z - pos.z) < 14; if (near && (acc += dt) > (low ? 0.25 : 0.1)) { acc = 0; draw(tt); }
    const r = S.active; if (!r) return; r.frames++; r.s = Math.min(r.L, r.s + r.speed * Math.min(1, (r.s + 0.4) / 1.2) * dt); const me = at(r, r.s), ah = at(r, Math.min(r.L, r.s + 1.6));
    cp.x = me.x; cp.z = me.z; const D = drone(); if (D) { const dp = D.root.position; dp.x += (ah.x - dp.x) * Math.min(1, dt * 8); dp.z += (ah.z - dp.z) * Math.min(1, dt * 8); D.root.rotation.y = Math.atan2(ah.x - me.x, ah.z - me.z) || D.root.rotation.y; }
    if (r.L - r.s > 0.25) { const lk = new THREE.Vector3(ah.x, cp.y - 0.05, ah.z); if (lk.distanceTo(cp) > 0.3) game.camera.quaternion.slerp(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(cp, lk, new THREE.Vector3(0, 1, 0))), Math.min(1, dt * 4)); }
    if (r.s >= r.L) { S.escorts.push({ id: r.id, ok: true, frames: r.frames, secs: +((performance.now() - r.t0) / 1000).toFixed(1), end: [+cp.x.toFixed(2), +cp.z.toFixed(2)] }); S.active = null; game.freeze = false; window.__reading = false; if (D && D.tow) D.tow(false); } } };
}
