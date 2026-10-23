// Egg 1 + 2: a Doom-style secret wall panel (slightly off-texture) slides open on click/tap with a secret-found chime;
// behind it a small room: a cake on a pedestal ('The cake is a lie') guarded by an original security robot
// (round white body, museum guard's cap, one red eye, red scan beam, foam darts, 'Report filed.' when tipped).
import { THREE, V, builder, MAT, plaque, clamp, rand, pick, ease, canvasTex } from '../kit.js';
// UVs of a replacement piece expressed in the original box's texture space, so the cut wall looks untouched
function remapUV(piece, orig) {
  const p = orig.geometry.parameters, w = p.width, h = p.height, d = p.depth, o = orig.position, g = piece.geometry, pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i) + piece.position.x - o.x, y = pos.getY(i) + piece.position.y - o.y, z = pos.getZ(i) + piece.position.z - o.z, nx = nor.getX(i), ny = nor.getY(i), nz = nor.getZ(i);
    let u, v; if (nx > 0.5) { u = (-z + d / 2) / d; v = (y + h / 2) / h; } else if (nx < -0.5) { u = (z + d / 2) / d; v = (y + h / 2) / h; }
    else if (ny > 0.5) { u = (x + w / 2) / w; v = 1 - (z + d / 2) / d; } else if (ny < -0.5) { u = (x + w / 2) / w; v = (z + d / 2) / d; }
    else if (nz > 0.5) { u = (x + w / 2) / w; v = (y + h / 2) / h; } else { u = (-x + w / 2) / w; v = (y + h / 2) / h; }
    uv.setXY(i, u, v); }
  uv.needsUpdate = true;
}
const LINES = ["Please don't touch the art.", 'Step away from the cake.', 'Visitor detected. Smiling politely.', 'Flash photography is forbidden. So is joy.', 'Please keep one metre from the exhibits. Two from the cake.',
  'Your behaviour has been logged.', 'No running. No soup. No exceptions.', 'I am authorised to use foam.', 'This dessert is under museum protection.'];
export function eggSecret(E) {
  const { world, scene, camera, A, O, S } = E;
  const sw = world.findSecretWall({ w: 1.3, width: 3.4, depth: 3.4, height: 2.8, seed: E.seed + 3 });
  if (!sw) return null;
  const { m, pos, n, t, T, along } = sw; const P = m.geometry.parameters, c0 = m.position.clone(), L = along === 'x' ? P.width : P.depth, H = P.height, y0 = c0.y - H / 2;
  const OW = 1.3, OH = 2.35, RW = 3.4, RD = 3.4, RHt = 2.8, aC = along === 'x' ? pos.x : pos.z, a0 = (along === 'x' ? c0.x : c0.z) - L / 2, a1 = a0 + L;
  const sgnA = along === 'x' ? Math.sign(t.x) : Math.sign(t.z); // +t in axis terms
  const grp = new THREE.Group(); grp.name = 'egg-secret'; scene.add(grp);
  // hide the original wall (kept in the scene, but invisible and not hit by rays) and rebuild it around the opening
  m.visible = false; m.raycast = () => {}; m.userData.eggReplaced = 1;
  const pieces = [];
  const piece = (s0, s1, ya, yb, off = 0, th = T, mat = m.material) => { const len = s1 - s0; if (len < 0.005 || yb - ya < 0.005) return null; const g = new THREE.BoxGeometry(along === 'x' ? len : th, yb - ya, along === 'x' ? th : len);
    const me = new THREE.Mesh(g, mat), mid = (s0 + s1) / 2; me.position.set(along === 'x' ? mid : c0.x + n.x * off, y0 + (ya + yb) / 2, along === 'x' ? c0.z + n.z * off : mid); me.castShadow = me.receiveShadow = true; remapUV(me, m); scene.add(me); pieces.push(me); return me; };
  // pocket on the +axis side: the panel slides into the wall between a thin front skin and the back of the wall
  const lo = aC - OW / 2, hi = aC + OW / 2, pk = OW + 0.12, fs = 0.03, slot = 0.13;
  const offFront = T / 2 - fs / 2, offBack = (T / 2 - fs - slot - T / 2) / 2;
  const sideA = sgnA > 0 ? [hi, hi + pk] : [lo - pk, lo];
  piece(a0, Math.min(lo, sideA[0]), 0, H); piece(Math.max(hi, sideA[1]), a1, 0, H);
  piece(sideA[0], sideA[1], 0, OH + 0.02, offFront, fs); piece(sideA[0], sideA[1], 0, OH + 0.02, offBack, T - fs - slot);
  piece(Math.min(lo, sideA[0]), Math.max(hi, sideA[1]), OH + 0.02, H);
  // the panel: same stone, nudged texture and a touch darker, 4 cm recessed
  const pm = m.material.clone(); if (pm.map) { pm.map = pm.map.clone(); pm.map.offset.set(0.37, 0.19); pm.map.repeat.multiplyScalar(1.07); pm.map.needsUpdate = true; } if (pm.color) pm.color.multiplyScalar(0.86);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(along === 'x' ? OW : 0.1, OH, along === 'x' ? 0.1 : OW), pm); panel.name = 'egg-secret-panel';
  const pOff = T / 2 - fs - 0.065; panel.position.set(along === 'x' ? aC : c0.x + n.x * pOff, y0 + OH / 2, along === 'x' ? c0.z + n.z * pOff : aC);
  scene.add(panel); const panel0 = panel.position.clone();
  // ---- the room behind ----
  const back = pos.clone().addScaledVector(n, -T); // back face of the wall at the opening centre (y 0)
  const toW = (u, d, y = 0) => back.clone().addScaledVector(t, u).addScaledVector(n, -d).setY(y0 + y);
  const roomMat = new THREE.MeshLambertMaterial({ color: 0x8a8070 });
  const rbox = (w, h, d, at) => { const g = new THREE.BoxGeometry(Math.abs(t.x) > 0.5 ? w : d, h, Math.abs(t.x) > 0.5 ? d : w); const me = new THREE.Mesh(g, roomMat); me.position.copy(at); scene.add(me); pieces.push(me); return me; };
  rbox(0.2, RHt, RD + 0.2, toW(-RW / 2 - 0.1, RD / 2 + 0.1, RHt / 2)); rbox(0.2, RHt, RD + 0.2, toW(RW / 2 + 0.1, RD / 2 + 0.1, RHt / 2));
  rbox(RW + 0.4, RHt, 0.2, toW(0, RD + 0.1, RHt / 2)); rbox(RW + 0.4, 0.12, RD + 0.2, toW(0, RD / 2 + 0.1, RHt + 0.06));
  { const fl = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), new THREE.MeshLambertMaterial({ map: canvasTex(256, 256, (x) => { x.fillStyle = '#4a3423'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#553b27' : '#3f2c1d'; x.fillRect(0, i * 32, 256, 31); } }) }));
    fl.rotation.x = -Math.PI / 2; fl.position.copy(toW(0, RD / 2, 0.006)); fl.rotation.z = Math.abs(t.x) > 0.5 ? 0 : Math.PI / 2; scene.add(fl); pieces.push(fl); }
  { const b = builder(); b.box(0.1, 0.06, 0.1, 0xfff2c0, 0, 0, 0); const bulb = b.mesh(basic3(1.8)); bulb.position.copy(toW(0, RD / 2, RHt - 0.05)); grp.add(bulb); } // ceiling bulb (emissive only, no extra light)
  pieces.forEach(p => { p.userData.eggWall = 1; });
  // cake on a pedestal against the back wall + sign
  const yawIn = Math.atan2(n.x, n.z); // facing out of the room, toward the gallery
  const cake = new THREE.Group(); cake.position.copy(toW(0, RD - 0.55, 0)); cake.rotation.y = yawIn; grp.add(cake);
  { const b = builder(); b.cyl(0.24, 0.28, 0.08, 12, 0xe8e4dc, 0, 0.04, 0); b.cyl(0.18, 0.2, 0.9, 12, 0xf0ece4, 0, 0.53, 0); b.cyl(0.26, 0.24, 0.06, 12, 0xe8e4dc, 0, 1.01, 0);
    b.cyl(0.2, 0.2, 0.012, 16, 0xfafafa, 0, 1.05, 0); b.cyl(0.15, 0.15, 0.13, 16, 0x4a2414, 0, 1.12, 0); b.cyl(0.152, 0.152, 0.025, 16, 0xf5efe6, 0, 1.17, 0); b.tor(0.14, 0.014, 5, 16, 0xf5efe6, 0, 1.19, 0, Math.PI / 2);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; b.sph(0.017, 6, 5, 0xc0101c, Math.cos(a) * 0.11, 1.205, Math.sin(a) * 0.11); }
    b.cyl(0.006, 0.006, 0.07, 6, 0xf6f6f6, 0, 1.23, 0); cake.add(b.mesh(MAT.lam));
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.5, 0.6) })); fl.scale.set(1, 1.8, 1); fl.position.y = 1.285; cake.add(fl); cake.userData.flame = fl; }
  { const s = new THREE.Group(); s.position.copy(toW(0.75, RD - 0.9, 0)); s.rotation.y = yawIn - 0.35; grp.add(s); const b = builder(); b.cyl(0.012, 0.012, 0.95, 6, 0x2a2a2a, 0, 0.475, 0); b.cyl(0.12, 0.13, 0.025, 10, 0x2a2a2a, 0, 0.012, 0); b.box(0.46, 0.2, 0.02, 0x2a2a2a, 0, 1.02, -0.012, -0.25); s.add(b.mesh(MAT.lam));
    const pl = plaque(['The cake is a lie'], 0.42, 0.16, { bg: '#f4efe2', size: 54, font: 'Georgia, serif', italic: false }); pl.position.set(0, 1.02, 0.0); pl.rotation.x = -0.25; s.add(pl); }
  world.reserveFloor({ x: cake.position.x, z: cake.position.z }, 0.35, 'cake', false);
  // ---- the guard robot ----
  const bot = new THREE.Group(); bot.name = 'egg-guardbot'; grp.add(bot);
  const body = new THREE.Group(); bot.add(body);
  { const b = builder(); b.sph(0.24, 16, 12, 0xf7f7f5, 0, 0.42, 0, 1, 0.95, 1); b.tor(0.238, 0.014, 6, 24, 0xb8bcc2, 0, 0.36, 0, Math.PI / 2);
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; b.cyl(0.03, 0.045, 0.2, 6, 0x9aa0a8, Math.cos(a) * 0.12, 0.1, Math.sin(a) * 0.12, Math.cos(a) * 0.25 * 0, 0, 0); b.sph(0.05, 8, 6, 0x5a6068, Math.cos(a) * 0.13, 0.03, Math.sin(a) * 0.13, 1, 0.5, 1); }
    b.cyl(0.165, 0.18, 0.11, 14, 0x1d2a4a, 0, 0.67, 0); b.cyl(0.17, 0.17, 0.02, 14, 0x16203a, 0, 0.725, 0); b.cyl(0.19, 0.19, 0.014, 14, 0x11182c, 0, 0.62, 0.06); b.box(0.24, 0.012, 0.1, 0x11182c, 0, 0.617, 0.17, 0.12);
    b.box(0.05, 0.04, 0.01, 0xd8b048, 0, 0.67, 0.172); b.box(0.2, 0.015, 0.006, 0xd8b048, 0, 0.63, 0.178);
    b.cyl(0.085, 0.085, 0.02, 16, 0x101010, 0, 0.45, 0.225, Math.PI / 2); b.cyl(0.03, 0.03, 0.14, 8, 0x8a9098, 0.25, 0.36, 0.04, Math.PI / 2); // eye socket + dart barrel
    body.add(b.mesh(MAT.shiny)); }
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.15, 0.1) })); eye.position.set(0, 0.45, 0.232); body.add(eye);
  const beamPivot = new THREE.Group(); beamPivot.position.copy(eye.position); body.add(beamPivot);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.38, 3.2, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.rotation.x = -Math.PI / 2; beam.position.z = 1.6; beamPivot.add(beam); beam.visible = false;
  const home = toW(-0.7, RD - 1.35, 0); bot.position.copy(home); bot.rotation.y = yawIn;
  const R = { v: V(), vy: 0, tilt: 0, tiltAxis: V(1, 0, 0), tiltV: 0, quiet: false, alert: 0, lineT: 1.5, dartT: 2, sweep: 0, fallen: false, air: false };
  // inside the room, the doorway passage, or the gallery floor (if the robot gets launched out)
  const rel = (x, z) => { const dx = x - pos.x, dz = z - pos.z; return { u: dx * t.x + dz * t.z, d: -(dx * n.x + dz * n.z) }; };
  const inRoom = (x, z, m2 = 0.25) => { const r = rel(x, z); return Math.abs(r.u) < RW / 2 - m2 && r.d > T + m2 * 0.4 && r.d < T + RD - m2; };
  const inDoor = (x, z) => { const r = rel(x, z); return Math.abs(r.u) < OW / 2 - 0.25 && r.d > -0.7 && r.d < T + 0.35; };
  let open = 0, opening = false; // 0 closed .. 1 open
  const passable = (x, z) => open > 0.95 && (inRoom(x, z) || inDoor(x, z));
  if (E.ctx.addWalkable) E.ctx.addWalkable(passable);
  const walkOK = (x, z) => inRoom(x, z, 0.2) || (open > 0.95 && inDoor(x, z)) || E.walk(x, z);
  // ---- foam darts (pool of 6) ----
  const dartGeo = (() => { const b = builder(); b.cyl(0.011, 0.011, 0.075, 6, 0xff7a1a, 0, 0, 0, Math.PI / 2); b.cyl(0.016, 0.009, 0.014, 8, 0x2a6adf, 0, 0, 0.044, Math.PI / 2); return b.geometry(); })();
  const darts = Array.from({ length: 6 }, () => { const d = new THREE.Mesh(dartGeo, MAT.lam); d.visible = false; grp.add(d); return { m: d, v: V(), life: 0 }; });
  function fire() { const d = darts.find(q => q.life <= 0) || darts[0]; const from = body.localToWorld(V(0.25, 0.36, 0.14)); const to = camera.position.clone(); to.y -= 0.35;
    const dir = to.sub(from); const L = dir.length(); dir.normalize(); d.m.position.copy(from); d.v.copy(dir).multiplyScalar(6.5); d.v.y += L * 0.32; d.life = 5; d.m.visible = true; d.hit = false;
    A.tone(520, 0.06, 'square', 0.06); A.noise(0.09, 2400, 0.1); }
  function updateDarts(dt) { for (const d of darts) { if (d.life <= 0) continue; d.life -= dt; if (d.life <= 0) { d.m.visible = false; continue; }
      d.v.y -= 6 * dt; const p = d.m.position, nx = p.x + d.v.x * dt, nz = p.z + d.v.z * dt;
      if (!walkOK(nx, nz)) { const r0 = rel(p.x, p.z), r1 = rel(nx, nz); // bounce: flip the component that left the room
        if (Math.abs(r1.u) >= RW / 2 - 0.2 && Math.abs(r0.u) < RW / 2 - 0.2) d.v.addScaledVector(t, -2 * d.v.dot(t)); else d.v.addScaledVector(n, -2 * d.v.dot(n)); d.v.multiplyScalar(0.45); A.tone(900, 0.03, 'triangle', 0.03); }
      else { p.x = nx; p.z = nz; } p.y += d.v.y * dt; if (p.y < 0.02) { p.y = 0.02; d.v.y = Math.abs(d.v.y) * 0.35; d.v.x *= 0.7; d.v.z *= 0.7; if (Math.abs(d.v.y) < 0.2) { d.v.set(d.v.x * 0.9, 0, d.v.z * 0.9); } }
      if (!d.hit && p.distanceTo(V(camera.position.x, camera.position.y - 0.35, camera.position.z)) < 0.45) { d.hit = true; d.v.multiplyScalar(-0.3); d.v.y = 1.2; A.tone(1400, 0.05, 'sine', 0.08, 0, 600); O.toast('*boop*', 0.8); }
      if (d.v.lengthSq() > 0.01) d.m.lookAt(p.clone().add(d.v)); } }
  // ---- interaction ----
  function openPanel(how) { if (opening || open > 0) return; opening = true; E.found('secret'); A.noise(1.6, 180, 0.22, 0, 'lowpass', 0.7); A.tone(55, 1.5, 'sawtooth', 0.05, 0, 40);
    setTimeout(() => { A.chord([523.25, 659.25, 783.99, 1046.5], 0.5, 'triangle', 0.13, 0.11); A.tone(1568, 0.6, 'sine', 0.05, 0.45); O.toast('A SECRET IS REVEALED!', 3); E.found('secret'); }, 1200); }
  E.clicks.add(panel, openPanel, { reach: 3.2 });
  let inside = false; // fallback when the gallery has no addWalkable hook: tap the doorway to step in / out
  const doorTrig = new THREE.Mesh(new THREE.PlaneGeometry(OW, OH), new THREE.MeshBasicMaterial({ visible: false })); doorTrig.position.copy(pos).addScaledVector(n, 0.02).setY(y0 + OH / 2); doorTrig.rotation.y = yawIn; grp.add(doorTrig);
  if (!E.ctx.addWalkable) E.clicks.add(doorTrig, () => { if (open < 0.95) return; inside = !inside; const p = inside ? toW(0.4, T + 0.9, 0) : pos.clone().addScaledVector(n, 1.3); camera.position.set(p.x, camera.position.y, p.z); camera.lookAt(inside ? cake.position.x : p.x + n.x, camera.position.y, inside ? cake.position.z : p.z + n.z); }, { enabled: true, reach: 3 });
  function push(imp) { if (R.fallen && R.air === false && imp.length() < 0.5) return; R.v.x += imp.x / 3; R.v.z += imp.z / 3; R.vy += Math.max(0, imp.y) / 3 + (imp.length() > 4 ? 1.5 : 0); const h = V(imp.x, 0, imp.z); if (h.lengthSq() > 1e-4) { R.tiltAxis.set(h.z, 0, -h.x).normalize(); R.tiltV += h.length() * 0.9; } R.air = R.vy > 0.3 || R.air; A.tone(300, 0.12, 'square', 0.05, 0, 180); }
  E.pushables.push({ name: 'guardbot', obj: bot, r: 0.3, push });
  function knockOut() { if (R.quiet) return; R.quiet = true; beam.visible = false; eye.material.color.setRGB(0.12, 0.02, 0.02); O.bubble(body, 'Report filed.', 4, { red: true, off: 0.85 }); A.tone(440, 0.25, 'square', 0.06); A.tone(220, 0.5, 'square', 0.05, 0.25, 110); }
  // ---- per frame ----
  let tm = 0;
  function update(dt) { tm += dt;
    if (opening) { open = Math.min(1, open + dt / 1.6); const k = ease(open); panel.position.copy(panel0).addScaledVector(V(along === 'x' ? sgnA : 0, 0, along === 'z' ? sgnA : 0), k * (OW + 0.06)); if (open >= 1) opening = false; }
    cake.userData.flame.scale.set(1 + Math.sin(tm * 23) * 0.15, 1.8 + Math.sin(tm * 17) * 0.3, 1);
    updateDarts(dt);
    // physics when pushed / launched
    const sp = Math.hypot(R.v.x, R.v.z);
    if (sp > 0.01 || R.vy || R.air) { const p = bot.position, nx = p.x + R.v.x * dt, nz = p.z + R.v.z * dt; if (walkOK(nx, nz)) { p.x = nx; p.z = nz; } else { R.v.multiplyScalar(-0.4); R.tiltV += 1.2; }
      R.vy -= 9.8 * dt; p.y += R.vy * dt; if (p.y <= y0) { p.y = y0; if (R.vy < -2.5) R.tiltV += 2; R.vy = 0; R.air = false; } const f = R.air ? 0.2 : 4; R.v.multiplyScalar(Math.max(0, 1 - f * dt)); if (!R.air && sp < 0.02) R.v.set(0, 0, 0); }
    if (R.tiltV > 0 || R.tilt > 0) { R.tilt += R.tiltV * dt; R.tiltV -= dt * (R.fallen ? 6 : 3.5); if (!R.fallen && R.tilt > 0.9) { R.fallen = true; knockOut(); } if (R.fallen) { R.tilt = Math.min(R.tilt + dt * 2, Math.PI / 2 - 0.2); R.tiltV = Math.max(R.tiltV, 0); } else { R.tilt = Math.max(0, R.tilt - dt * (R.tiltV <= 0 ? 1.4 : 0)); if (R.tilt <= 0) R.tiltV = Math.max(0, R.tiltV); } body.quaternion.setFromAxisAngle(R.tiltAxis.clone().applyQuaternion(bot.quaternion.clone().invert()).normalize(), R.tilt); }
    if (R.quiet) return;
    // sight: the player within 8 m, in front, in clear view from the eye
    const ew = eye.getWorldPosition(V()), cp = camera.position, d = ew.distanceTo(cp);
    const fwd = V(Math.sin(bot.rotation.y), 0, Math.cos(bot.rotation.y)), to = V(cp.x - ew.x, 0, cp.z - ew.z).normalize();
    const sees = d < 8 && (fwd.dot(to) > 0.2 || R.alert > 0) && S.los(ew, cp) && (inRoom(cp.x, cp.z, 0) || inDoor(cp.x, cp.z) || open > 0.5);
    R.alert = sees ? 3 : Math.max(0, R.alert - dt);
    if (R.alert > 0) { const want = Math.atan2(cp.x - bot.position.x, cp.z - bot.position.z); let dy = want - bot.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); bot.rotation.y += dy * Math.min(1, dt * 2.5);
      beam.visible = true; R.sweep += dt; beamPivot.rotation.set(-0.12 + Math.sin(R.sweep * 1.3) * 0.12, Math.sin(R.sweep * 2.2) * 0.55, 0); beam.material.opacity = 0.14 + Math.sin(tm * 30) * 0.03;
      if ((R.lineT -= dt) <= 0) { R.lineT = rand(3.2, 4.5); O.bubble(body, pick(LINES), 3, { red: true, off: 0.85 }); A.tone(880, 0.05, 'square', 0.04); A.tone(660, 0.05, 'square', 0.04, 0.07); }
      if (sees && d < 7 && (R.dartT -= dt) <= 0) { R.dartT = rand(1.8, 3); fire(); } }
    else { beam.visible = false; R.lineT = Math.min(R.lineT, 0.6); let dy = yawIn - bot.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); bot.rotation.y += dy * Math.min(1, dt); }
    body.position.y = Math.sin(tm * 2) * 0.008; }
  return { name: 'secret', group: grp, anchor: toW(0, RD / 2, 1), cull: 22, update, push, open: () => openPanel('api'), get isOpen() { return open >= 1; }, get quiet() { return R.quiet; }, bot, panel, cake, darts,
    get dartsLive() { return darts.filter(d => d.life > 0).length; }, fire, inRoom, walkTest: passable, pieces, wall: m, room: { pos, n, t, T, RW, RD, OW, OH },
    view: () => ({ from: pos.clone().addScaledVector(n, 2.6).setY(1.6), to: toW(-0.3, RD - 1, 0.8) }), viewInside: () => ({ from: toW(0.9, T + 0.6, 1.6), to: toW(-0.5, RD - 1.2, 0.6) }) };
}
function basic3(k) { return new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(k, k, k) }); }
