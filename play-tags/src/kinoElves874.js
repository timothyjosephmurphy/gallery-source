// #KINO874 (TJ Nov 18 2026): sit in a Kinoteka seat (E, or the SIT button), and 3-5 of the gallery's elves walk in from the hall
// entrance, sit in nearby free seats facing the screen with popcorn and munch now and then; on stand (E / move keys / STAND) they get up
// and walk out, shrinking away at the entrance. Lazy-loaded the first time the player enters the hall (index.html loader).
// Reuses game.makeElf / game.animateElf (shared elf geometry + materials). Pooled: 5 elves + 5 buckets built once, shared geometry and
// materials, no lights, no colliders (nothing blocks the aisle or the exit). The rAF loop runs only while sitting or while elves are
// on stage; otherwise the only cost is a 4 Hz seat-proximity check while the player is inside the hall. Original code and models.
(function () {
  'use strict';
  const game = window.game; if (!game || window.__kino874) return;
  const T = game.THREE, I = game.scene.getObjectByName('kino800-hall'); if (!I) return;
  const seatIM = I.children.find(o => o.isInstancedMesh && o.count % 24 === 0 && o.count >= 48); if (!seatIM) return;
  const m4 = new T.Matrix4(), pv = new T.Vector3(), sv = new T.Vector3(), qq = new T.Quaternion();
  // seats from the live instance matrices (cushion = even index, back = odd): local (u, y, v); faces +v (screen at v 24.86)
  const seats = []; for (let i = 0; i < seatIM.count; i += 2) { seatIM.getMatrixAt(i, m4); m4.decompose(pv, qq, sv); seats.push({ u: pv.x, y: pv.y + sv.y / 2, v: pv.z - 0.05, row: 0, taken: false }); }
  const vs = [...new Set(seats.map(s => +s.v.toFixed(2)))].sort((a, b) => a - b); seats.forEach(s => { s.row = vs.indexOf(+s.v.toFixed(2)); });
  const fy = seats[0].y - 0.51, ENTRY = { u: 0, v: 11.45 }, GAP = 0.49, SC = 1.0, STAND_Y = 0.38 * SC, SIT_Y = 0.27 * SC;
  // ---- popcorn bucket: striped tapered cup + lumpy cream top (shared geometry/materials, ~60 tris)
  const cvs = document.createElement('canvas'); cvs.width = 32; cvs.height = 4; const cx = cvs.getContext('2d'); for (let i = 0; i < 8; i++) { cx.fillStyle = i % 2 ? '#f4efe6' : '#c8262c'; cx.fillRect(i * 4, 0, 4, 4); }
  const stripe = new T.CanvasTexture(cvs); stripe.colorSpace = T.SRGBColorSpace; stripe.magFilter = T.NearestFilter;
  const cupG = new T.CylinderGeometry(0.055, 0.04, 0.09, 8, 1, true), cupM = new T.MeshStandardMaterial({ map: stripe, roughness: 0.8, side: T.DoubleSide });
  const cornG = new T.IcosahedronGeometry(0.058, 0); cornG.scale(1, 0.55, 1); cornG.translate(0, 0.05, 0); const cornM = new T.MeshStandardMaterial({ color: 0xf3dc8c, roughness: 0.9, flatShading: true });
  const bitG = new T.IcosahedronGeometry(0.014, 0);
  const box = new T.Box3();
  // ---- elf pool
  const tgt = new T.Object3D(), elves = [];
  function makeOne(k) { const e = game.makeElf(0.137 + k * 0.211); e.scale.setScalar(SC); e.name = 'kino874-elf'; e.userData.elf874 = true; e.userData.noRay = true; e.visible = false;
    const b = new T.Group(); b.add(new T.Mesh(cupG, cupM), new T.Mesh(cornG, cornM)); b.name = 'kino874-popcorn'; const bit = new T.Mesh(bitG, cornM); bit.visible = false; b.add(bit);
    const rig = e.userData.rig; b.position.set(0.13, -0.07, 0.15); rig.body.add(b);
    e.traverse(o => { o.userData.noRay = true; o.userData.decor = true; o.castShadow = false; }); I.add(e);
    return { e, rig, b, bit, seat: null, path: [], pi: 0, mode: 'off', t: 0, munch: 0, next: 2 + k, delay: 0, grow: 0, k }; }
  // ---- state
  const S = { sitting: false, seat: null, from: null, active: 0, sits: 0, stands: 0, maxElves: 0, loopOn: false, errs: 0 };
  let near = null, btn = null, lastT = 0, qaPause = false;
  const L2W = (u, y, v, out) => { out.set(u, y, v); return I.localToWorld(out); };
  const W2L = (p, out) => { out.copy(p); return I.worldToLocal(out); };
  const camL = new T.Vector3(), wp = new T.Vector3();
  function nearestSeat() { W2L(game.camera.position, camL); if (camL.z < 11.3 || camL.z > 24.5 || Math.abs(camL.x) > 6.2) return null; let best = null, bd = 1.6;
    for (const s of seats) { const d = Math.hypot(s.u - camL.x, s.v - camL.z); if (d < bd && !s.taken) { bd = d; best = s; } } return best; }
  // ---- sit / stand
  function sit(seat) { seat = seat || near || nearestSeat(); if (!seat || S.sitting) return false; const cam = game.camera;
    S.from = cam.position.clone(); S.fromQ = cam.quaternion.clone(); S.sitting = true; S.seat = seat; seat.taken = true; S.sits++; game.freeze = true;
    L2W(seat.u, seat.y + 0.62, seat.v + 0.02, cam.position); L2W(0, fy + 3.45, 24.86, wp); cam.lookAt(wp);
    callElves(seat); ui(); loop(); try { window.game.say && window.game.say('E OR MOVE TO STAND', 2); } catch (e) { } return true; }
  function stand() { if (!S.sitting) return false; const cam = game.camera; S.sitting = false; S.stands++; if (S.seat) S.seat.taken = false; S.seat = null;
    if (S.from) cam.position.copy(S.from); game.freeze = false; for (const E of elves) if (E.mode !== 'off') leave(E); ui(); loop(); return true; }
  // pick 3-5 free seats nearest the player's seat (same row first), elves enter one after another
  function callElves(ps) { if (!elves.length) for (let k = 0; k < 5; k++) elves.push(makeOne(k));
    const n = 3 + ((S.sits * 7) % 3), cand = seats.filter(s => s !== ps && !s.taken).map(s => ({ s, d: Math.hypot(s.u - ps.u, (s.v - ps.v) * 1.6) })).sort((a, b) => a.d - b.d).slice(0, n);
    let k = 0; for (const E of elves) { if (k < cand.length) { const s = cand[k].s; if (E.seat && E.seat !== s) E.seat.taken = false; E.seat = s; s.taken = true; route(E, k * 0.7); k++; } else if (E.mode !== 'off') leave(E); } }
  // walking route in hall-local (u, v): entrance -> centre aisle -> the gap in front of the row -> in front of the seat -> seat
  function route(E, delay) { const s = E.seat, gv = s.v + GAP; E.path = [];
    if (E.mode === 'off') { E.e.position.set(ENTRY.u, fy + STAND_Y, ENTRY.v); E.grow = 0; E.e.scale.setScalar(0.001); E.e.visible = true; }
    else { const x = E.e.position.x, z = E.e.position.z; if (Math.abs(x) > 0.3) { const g2 = nearGap(z + (E.mode === 'sit' ? GAP : 0)); E.path.push([x, g2], [0, g2]); } }
    E.path.push([0, gv], [s.u, gv], [s.u, s.v]); E.pi = 0; E.mode = 'walk'; E.delay = delay; E.t = 0; }
  const nearGap = v => { let b = v, bd = 9; for (const rv of vs) { const g2 = rv + GAP; if (Math.abs(g2 - v) < bd) { bd = Math.abs(g2 - v); b = g2; } } return Math.abs(b - v) < 0.6 ? b : v; };
  function leave(E) { if (E.mode === 'off') return; const x = E.e.position.x, z = E.e.position.z; E.path = [];
    if (Math.abs(x) > 0.3) { const g2 = E.mode === 'sit' && E.seat ? E.seat.v + GAP : nearGap(z); E.path.push([x, g2], [0, g2]); }
    E.path.push([0, ENTRY.v]); E.lastSeat = E.mode === 'sit' ? E.seat : null; E.pi = 0; E.mode = 'out'; E.delay = (E.k % 5) * 0.35; if (E.seat) { E.seat.taken = false; E.seat = null; } }
  // ---- per-frame (only while sitting or elves on stage)
  function tick(dt) { let on = 0; const t = performance.now() / 1000;
    for (const E of elves) { if (E.mode === 'off') continue; on++; E.t += dt; const e = E.e, rig = E.rig;
      if (E.delay > 0) { E.delay -= dt; face(E, E.path[E.pi]); pose(E, 'idle', t, dt); continue; }
      if (E.grow < 1 && E.mode === 'walk') { E.grow = Math.min(1, E.grow + dt * 3); e.scale.setScalar(SC * E.grow); }
      if (E.mode === 'walk' || E.mode === 'out') { const p = E.path[E.pi]; if (!p) { if (E.mode === 'walk') { E.mode = 'sit'; E.next = 2 + Math.random() * 4; } else { E.mode = 'shrink'; } continue; }
        const dx = p[0] - e.position.x, dz = p[1] - e.position.z, d = Math.hypot(dx, dz), sp = 1.25 * dt, last = E.pi === E.path.length - 1 && E.mode === 'walk';
        if (d <= sp) { e.position.x = p[0]; e.position.z = p[1]; E.pi++; } else { e.position.x += dx / d * sp; e.position.z += dz / d * sp; }
        // the last step backs into the seat: keep facing the screen, ease down into it
        if (last && E.seat) { const k = 1 - Math.min(1, Math.abs(e.position.z - E.seat.v) / GAP); e.position.y = fy + STAND_Y + (E.seat.y + SIT_Y - fy - STAND_Y) * k; faceScreen(E); pose(E, 'walk', t, dt); }
        else if (E.mode === 'out' && E.pi === 0 && E.lastSeat) { const ls = E.lastSeat, k = Math.min(1, Math.abs(e.position.z - ls.v) / GAP); e.position.y = ls.y + SIT_Y + (fy + STAND_Y - ls.y - SIT_Y) * k; faceScreen(E); pose(E, 'walk', t, dt); }
        else { e.position.y = fy + STAND_Y; face(E, p); pose(E, 'walk', t, dt); }
        continue; }
      if (E.mode === 'sit') { const s = E.seat; e.position.set(s.u, s.y + SIT_Y, s.v); faceScreen(E); pose(E, 'idle', t, dt); sitPose(E, dt); continue; }
      if (E.mode === 'shrink') { E.grow = Math.max(0, E.grow - dt * 3); e.scale.setScalar(Math.max(0.001, SC * E.grow)); pose(E, 'walk', t, dt); if (E.grow <= 0) { E.mode = 'off'; e.visible = false; } } }
    S.active = on; S.maxElves = Math.max(S.maxElves, on); return on; }
  function face(E, p) { if (!p) return; L2W(p[0], E.e.position.y, p[1], tgt.position); }
  function faceScreen(E) { L2W(E.e.position.x, E.e.position.y, 30, tgt.position); }
  function pose(E, mode, t, dt) { try { game.animateElf(E.e, mode, t, tgt, dt); } catch (e) { S.errs++; } }
  function sitPose(E, dt) { const r = E.rig; r.body.position.y = -0.12; r.body.scale.set(1, 1, 1); r.body.position.x = 0; r.legL.rotation.set(-1.45, 0, -0.08); r.legR.rotation.set(-1.45, 0, 0.08);
    r.armR.rotation.set(-1.0, 0, -0.35); E.next -= dt; if (E.next <= 0 && E.munch <= 0) { E.munch = 0.8; E.next = 3 + Math.random() * 5; }
    if (E.munch > 0) { E.munch -= dt; const k = Math.sin(Math.PI * Math.max(0, E.munch) / 0.8); r.armL.rotation.set(-0.6 - 2.0 * k, 0, 0.5 - 0.3 * k); E.bit.visible = k > 0.2; E.bit.position.set(-0.13 + 0.1 * k, 0.05 + 0.12 * k, 0); }
    else { r.armL.rotation.set(-0.7, 0, 0.4); E.bit.visible = false; } }
  function frame(now) { const dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 0); lastT = now; if (!qaPause && dt) tick(dt);
    if (S.sitting || S.active) requestAnimationFrame(frame); else { S.loopOn = false; lastT = 0; } }
  function loop() { if (S.loopOn) return; S.loopOn = true; lastT = 0; S.active = 1; requestAnimationFrame(frame); }
  // ---- UI: SIT / STAND pill (touch + mouse), E key, move keys stand up
  function ui() { if (!btn) { btn = document.createElement('button'); btn.id = 'kino874-sit'; btn.type = 'button';
      btn.style.cssText = 'position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:30;padding:8px 16px;border-radius:18px;border:1px solid rgba(255,230,180,.6);background:rgba(40,12,14,.78);color:#fbe7c0;font:600 13px/1 system-ui,sans-serif;letter-spacing:.04em;display:none;cursor:pointer';
      const go = ev => { ev.preventDefault(); ev.stopPropagation(); S.sitting ? stand() : sit(); }; btn.addEventListener('click', go); btn.addEventListener('touchstart', go, { passive: false }); document.body.appendChild(btn); }
    const show = S.sitting || !!near; btn.style.display = show ? 'block' : 'none'; btn.textContent = S.sitting ? 'STAND (E)' : 'SIT (E)'; }
  addEventListener('keydown', ev => { if (ev.repeat) return; if (ev.code === 'KeyE' && (S.sitting || near)) { ev.stopImmediatePropagation(); S.sitting ? stand() : sit(); return; }
    if (S.sitting && /^(KeyW|KeyA|KeyS|KeyD|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Space)$/.test(ev.code)) stand(); }, true);
  // 4 Hz proximity check, only while the player is inside the hall
  setInterval(() => { const k = window.__kino800; const inside = !!(k && k.inside); const n2 = inside && !S.sitting ? nearestSeat() : null;
    if (n2 !== near || (btn && (btn.style.display === 'none') === (S.sitting || !!n2))) { near = n2; ui(); }
    if (S.sitting && !inside) stand(); }, 250);
  window.__kino874 = { S, seats, elves, sit, stand, tick: dt => tick(dt), set qaPause(b) { qaPause = !!b; }, get near() { return near; }, fy, vs };
})();
