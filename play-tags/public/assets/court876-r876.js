// #876 (TJ Nov 19 2026): the ball no longer hides in the concrete. The courtyard's outer plinth (the ~0.28 m concrete base course along
// both side walls, measured from the scene: plinth face runs (+-7.92, 0.07) -> (+-3.89, 7.07) in court-local u,v) and the door jambs are now
// solid vertical walls for the ball (signed-distance push-out + reflection, so it can never tunnel behind or sit inside them).
// #891 873 (TJ Nov 18 2026): soccer goal fixed (moved off the sidewalk in front of the curb, net rebuilt, full frame collision,
// goal-line score) and the Leaf Blower pushes the ball (cone ~28 deg, 6 m, falls off with distance and angle).
// #891 (TJ Nov 17 2026): the soccer ball on the Bitcoin Courtyard court (#810, berlinCourt810.js) is playable.
// Gravity Gun: click the ball to pick it up, click again to toss it, right-click / LAUNCH to throw hard (or punt it off the floor).
// Lightweight hand-rolled physics in the court group's local frame (metres; u along the wall, y up, v into the court):
// gravity, sphere vs floor / AABBs (sidewalk, curb, blocks, hoop post/arm/backboard, goal frame) / facade plane / courtyard edges,
// sphere vs torus for the rim, net drag, and a score when the ball centre passes down through the rim. Score: net swish,
// 48-point additive burst, synthesized sound (skipped when muted). No lights, no engine, no per-frame allocations; sleeps at rest.
// Standalone bundle: needs only window.game (THREE, scene, camera, grav, weapon). Original code.
(function () {
  'use strict';
  const POLY = [[16.5, -14.289], [20.625, -7.144], [28.875, -7.144], [20.625, -21.434]], DOOR = [18.562, -10.716];
  const R = 0.11, G = -9.81, F = 0.09, FLOOR = 0.012, GRAV = 2, SUB = 1 / 120, GU = 5.7, GZ = 1.71, GT = 0.03; // goal origin (court-local), tube radius
  let T, game, g, ball, home, H, rimC, net, netY0, boxes = [], edges = [], walls = [], fx, fxPos, fxVel, ac = null, noiseBuf = null;
  let asleep = true, grounded = false, held = false, armed = true, armedGoal = true, segs = null, tools = null; const S = new Float64Array(5); S[3] = -1; // [still, lastT, swish, burstT, lastSound] (typed slots: no boxed doubles per frame)
  const st = { wallHits: 0, goals: 0, postHits: 0, netHits: 0, blows: 0, score: 0, rimHits: 0, boardHits: 0, bounces: 0, grabs: 0, throws: 0, kicks: 0, steps: 0, wakes: 0 };
  let v, p0, tmp, tmp2, cam, camPrev, camVel, dir, q, ax, wp;
  function boot() {
    game = window.game; if (!game || !game.THREE || !game.scene || !game.camera) return false;
    ball = game.scene.getObjectByName('court810-ball'); if (!ball || !ball.parent) return false;
    T = game.THREE; g = ball.parent; H = g.getObjectByName('court810-hoop'); if (!H) return false; ball.matrixAutoUpdate = true;
    v = new T.Vector3(); p0 = new T.Vector3(); tmp = new T.Vector3(); tmp2 = new T.Vector3(); cam = new T.Vector3(); camPrev = new T.Vector3(); camVel = new T.Vector3();
    dir = new T.Vector3(); q = new T.Quaternion(); ax = new T.Vector3(); wp = new T.Vector3(); home = ball.position.clone();
    g.updateMatrixWorld(true);
    // hoop parts straight from the scene: box meshes -> AABBs (post, base, arm, backboard), torus -> rim, line net
    H.children.forEach(m => { const ge = m.geometry; if (!ge) return; const t = ge.type;
      if (t === 'BoxGeometry' && m.isMesh) boxes.push({ c: [H.position.x + m.position.x, H.position.y + m.position.y, H.position.z + m.position.z], h: [m.scale.x / 2, m.scale.y / 2, m.scale.z / 2], e: 0.55, board: m.name === 'court810-backboard' });
      else if (t === 'TorusGeometry') rimC = [H.position.x + m.position.x, H.position.y + m.position.y, H.position.z + m.position.z, ge.parameters.radius, ge.parameters.tube];
      else if (m.isLineSegments) { net = m; netY0 = m.scale.y; m.matrixAutoUpdate = true; } });
    if (!rimC) return false;
    // static court pieces (values mirror berlinCourt810.js / court810 config)
    boxes.push({ c: [0, 0.05, F + 0.525], h: [7.4, 0.05, 0.525], e: 0.6 }, { c: [0, 0.07, F + 1.11], h: [7.4, 0.07, 0.06], e: 0.6 }, { c: [0, 0.36, 0.395], h: [3.64, 0.26, 0.275], e: 0.5 });
    fixGoal();
    // 876: plinth faces + door jambs (court-local u,v; inward normal toward the court centre (0, 3.6)). Values from a 0.5 deg radial scan of the
    // built scene (outerPlinth / jamb / doorTrim hits at y 0.15 and 0.5).
    [[-7.92, 0.07, -3.89, 7.07], [7.92, 0.07, 3.89, 7.07], [-3.89, 7.07, -3.86, 7.42], [3.89, 7.07, 3.86, 7.42]].forEach(([ax, az, bx, bz]) => {
      const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz); let nx = -dz / L, nz = dx / L; if ((0 - ax) * nx + (3.6 - az) * nz < 0) { nx = -nx; nz = -nz; }
      walls.push({ ax, az, dx: dx / L, dz: dz / L, L, nx, nz }); });
    // courtyard edges -> local half-planes (inward normal); the room-07 doorway edge is a soft stop
    const L = POLY.map(([x, z]) => { tmp.set(x, 0, z); g.worldToLocal(tmp); return [tmp.x, tmp.z]; });
    let cx = 0, cz = 0; L.forEach(p => { cx += p[0] / L.length; cz += p[1] / L.length; });
    tmp.set(DOOR[0], 0, DOOR[1]); g.worldToLocal(tmp); const dl = [tmp.x, tmp.z];
    for (let i = 0; i < L.length; i++) { const a = L[i], b = L[(i + 1) % L.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); let nx = -dz / l, nz = dx / l;
      if ((cx - a[0]) * nx + (cz - a[1]) * nz < 0) { nx = -nx; nz = -nz; }
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2; edges.push({ ax: a[0], az: a[1], nx, nz, door: Math.hypot(mx - dl[0], mz - dl[1]) < 0.3 }); }
    // score burst: 48 additive points, hidden until a score
    const N = 48, pos = new Float32Array(N * 3); fxPos = pos; fxVel = new Float32Array(N * 3);
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    fx = new T.Points(geo, new T.PointsMaterial({ color: 0xffb347, size: 0.07, transparent: true, opacity: 1, depthWrite: false, blending: T.AdditiveBlending }));
    fx.visible = false; fx.frustumCulled = false; fx.name = 'court872-burst'; fx.userData.noRay = true; fx.userData.decor = true; g.add(fx);
    camPrev.copy(game.camera.position); g.worldToLocal(camPrev);
    window.__court872 = window.__court873 = window.__court876 = { walls: () => walls.map(W => [W.ax, W.az, +(W.ax + W.dx * W.L).toFixed(3), +(W.az + W.dz * W.L).toFixed(3)]), st, get asleep() { return asleep; }, get held() { return held; }, get pos() { return ball.position.toArray().map(n => +n.toFixed(3)); }, get vel() { return v.toArray().map(n => +n.toFixed(3)); },
      goal: [GU, FLOOR, GZ], get armedGoal() { return armedGoal; }, rim: rimC.slice(), home: home.toArray(), grab, toss: () => release(7.5), launch: () => release(13), drop: () => release(0), reset, tick: dt => tick(dt), set qaPause(b) { qaPause = !!b; }, set: (x, y, z, vx, vy, vz) => { held = false; ball.position.set(x, y, z); v.set(vx || 0, vy || 0, vz || 0); wake(); }, step };
    return true;
  }
  // ---- soccer goal (873). 810 put it on the 10 cm sidewalk behind the 14 cm curb with its base at y=0 (posts and net bottom buried
  // 10 cm), so a rolling ball could never reach the mouth; its single net plane was tilted the wrong way (from the goal line on the
  // ground up to 1.2 m at the back, 0.6 m above the back frame, cutting across the mouth); no side/back net; only the front posts and
  // crossbar collided; no score. Fix: stand it on the court just in front of the curb, rebuild the net (roof, back, sides) inside the
  // frame, add the back bars, collide every tube (sphere vs segment) and the net (soft), score on the goal line, block the player.
  function fixGoal() { const Gg = g.getObjectByName('court810-goal'); if (!Gg) return;
    Gg.position.set(GU, FLOOR, GZ); Gg.updateMatrix(); let tube = null, netMat = null;
    Gg.children.forEach(m => { const t = m.geometry && m.geometry.type; if (t === 'PlaneGeometry') { m.visible = false; netMat = m.material; } else if (t === 'CylinderGeometry' && !tube) tube = m; });
    if (tube) for (const y of [0.6, GT]) { const b = new T.Mesh(tube.geometry, tube.material); b.scale.set(1, 1.8, 1); b.rotation.z = Math.PI / 2; b.position.set(0, y, -0.4); b.name = 'court873-goal-bar'; b.userData.decor = true; Gg.add(b); }
    if (netMat) { const P = [], U = [], q4 = (a, b, c, d) => { for (const k of [a, b, c, a, c, d]) { P.push(k[0], k[1], k[2]); U.push(k[3] / 1.8, k[4] / 1.44); } };
      q4([-0.9, 1.2, 0.4, 0, 1], [0.9, 1.2, 0.4, 1.8, 1], [0.9, 0.6, -0.4, 1.8, 0], [-0.9, 0.6, -0.4, 0, 0]); // roof along the struts
      q4([-0.9, 0.6, -0.4, 0, 0.6], [0.9, 0.6, -0.4, 1.8, 0.6], [0.9, 0, -0.4, 1.8, 0], [-0.9, 0, -0.4, 0, 0]); // back
      for (const x of [-0.9, 0.9]) q4([x, 0, 0.4, 0.8, 0], [x, 1.2, 0.4, 0.8, 1.2], [x, 0.6, -0.4, 0, 0.6], [x, 0, -0.4, 0, 0]); // sides
      const ge = new T.BufferGeometry(); ge.setAttribute('position', new T.Float32BufferAttribute(P, 3)); ge.setAttribute('uv', new T.Float32BufferAttribute(U, 2));
      const nm = new T.Mesh(ge, netMat); nm.name = 'court873-goal-net'; nm.userData.decor = true; nm.userData.noRay = true; Gg.add(nm); }
    // tubes (goal-local -> court-local): front posts, crossbar, back posts, struts, back top + ground bars
    const L = [[-0.9, 0, 0.4, -0.9, 1.2, 0.4], [0.9, 0, 0.4, 0.9, 1.2, 0.4], [-0.9, 1.2, 0.4, 0.9, 1.2, 0.4], [-0.9, 0, -0.4, -0.9, 0.6, -0.4], [0.9, 0, -0.4, 0.9, 0.6, -0.4],
      [-0.9, 1.2, 0.4, -0.9, 0.6, -0.4], [0.9, 1.2, 0.4, 0.9, 0.6, -0.4], [-0.9, 0.6, -0.4, 0.9, 0.6, -0.4], [-0.9, GT, -0.4, 0.9, GT, -0.4]];
    segs = new Float64Array(L.length * 7); L.forEach((s2, i) => { const o = i * 7; segs[o] = s2[0] + GU; segs[o + 1] = s2[1] + FLOOR; segs[o + 2] = s2[2] + GZ; segs[o + 3] = s2[3] - s2[0]; segs[o + 4] = s2[4] - s2[1]; segs[o + 5] = s2[5] - s2[2]; segs[o + 6] = segs[o + 3] ** 2 + segs[o + 4] ** 2 + segs[o + 5] ** 2; });
    // player: block the goal footprint (circle colliders) so you cannot walk through the frame and net
    try { const tg = game.tags; if (tg && tg.addCollider) for (const du of [-0.5, 0, 0.5]) { tmp.set(GU + du, 0, GZ); g.localToWorld(tmp); tg.addCollider({ x: tmp.x, z: tmp.z, r: 0.42, kind: 'goal873' }); } } catch (e) { } }
  function goalCollide(p) { if (!segs) return; const lx = p.x - GU, ly = p.y - FLOOR, lz = p.z - GZ; if (lx < -1.1 || lx > 1.1 || lz < -0.65 || lz > 0.65 || ly > 1.45) return;
    for (let o = 0; o < segs.length; o += 7) { const ax = segs[o], ay = segs[o + 1], az = segs[o + 2], dx = segs[o + 3], dy = segs[o + 4], dz = segs[o + 5];
      let t = ((p.x - ax) * dx + (p.y - ay) * dy + (p.z - az) * dz) / segs[o + 6]; t = t < 0 ? 0 : t > 1 ? 1 : t;
      let nx = p.x - (ax + dx * t), ny = p.y - (ay + dy * t), nz = p.z - (az + dz * t); const d = Math.sqrt(nx * nx + ny * ny + nz * nz), m = R + GT;
      if (d < m && d > 1e-6) { nx /= d; ny /= d; nz /= d; p.x += nx * (m - d); p.y += ny * (m - d); p.z += nz * (m - d); if (v.x * nx + v.y * ny + v.z * nz < -0.3) st.postHits++; hit(nx, ny, nz, 0.55, 1); } }
    // nets: soft, double-sided; the side the ball was on last step (p0) wins, so a fast ball cannot tunnel through
    const ox = p0.x - GU, oy = p0.y - FLOOR, oz = p0.z - GZ, x2 = p.x - GU, y2 = p.y - FLOOR, z2 = p.z - GZ;
    // roof plane through (y=1.2,z=.4) and (y=.6,z=-.4): normal (0,.8,-.6)
    netPlane(0, 0.8, -0.6, (oy - 1.2) * 0.8 - (oz - 0.4) * 0.6, (y2 - 1.2) * 0.8 - (z2 - 0.4) * 0.6, Math.abs(x2) < 0.9 && z2 > -0.4 && z2 < 0.4);
    netPlane(0, 0, 1, oz + 0.4, p.z - GZ + 0.4, Math.abs(p.x - GU) < 0.9 && p.y - FLOOR < 0.6); // back
    const lz2 = p.z - GZ, ly2 = p.y - FLOOR, sd = lz2 > -0.4 && lz2 < 0.4 && ly2 < 0.9 + 0.75 * lz2; netPlane(1, 0, 0, ox + 0.9, p.x - GU + 0.9, sd); netPlane(1, 0, 0, ox - 0.9, p.x - GU - 0.9, sd); }
  function netPlane(nx, ny, nz, d0, d, inside) { if (!inside) return; const side = d0 >= 0 ? 1 : -1; if (d * side >= R) return; const p = ball.position, k = side * R - d;
    p.x += nx * k; p.y += ny * k; p.z += nz * k; const vn = v.x * nx + v.y * ny + v.z * nz; if (vn * side < 0) { v.x -= 1.05 * vn * nx; v.y -= 1.05 * vn * ny; v.z -= 1.05 * vn * nz; v.multiplyScalar(0.55); /* the net soaks up the shot */ if (Math.abs(vn) > 0.8) { st.netHits++; S[2] = 0.6; } } }
  function wake() { if (asleep) st.wakes++; asleep = false; S[0] = 0; }
  function reset() { held = false; armedGoal = true; ball.position.copy(home); v.set(0, 0, 0); asleep = true; }
  // --- audio (synthesized, lazily created on first interaction, skipped when muted)
  function audio() { if (game.holo && game.holo.muted) return null; try { if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); const n = ac.sampleRate * 0.4 | 0; noiseBuf = ac.createBuffer(1, n, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; } if (ac.state === 'suspended') ac.resume(); return ac; } catch (e) { return null; } }
  function tone(f, type, dur, vol, at) { const a = audio(); if (!a) return; const t0 = a.currentTime + (at || 0), o = a.createOscillator(), gn = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); if (type === 'sine') o.frequency.exponentialRampToValueAtTime(f * 0.6, t0 + dur);
    gn.gain.setValueAtTime(vol, t0); gn.gain.exponentialRampToValueAtTime(0.0008, t0 + dur); o.connect(gn).connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.02); }
  function noise(dur, vol, hp) { const a = audio(); if (!a) return; const s = a.createBufferSource(), f = a.createBiquadFilter(), gn = a.createGain(), t0 = a.currentTime; s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
    gn.gain.setValueAtTime(0.0008, t0); gn.gain.linearRampToValueAtTime(vol, t0 + dur * 0.3); gn.gain.exponentialRampToValueAtTime(0.0008, t0 + dur); s.connect(f).connect(gn).connect(a.destination); s.start(t0); s.stop(t0 + dur + 0.02); }
  function thump(sp, kind) { const now = performance.now(); if (now - S[4] < 60 || sp < 1.2) return; S[4] = now; const vol = Math.min(0.35, sp * 0.04);
    if (kind === 1) tone(820, 'triangle', 0.18, vol, 0); else if (kind === 2) tone(210, 'square', 0.07, vol * 0.5, 0); else tone(150, 'sine', 0.1, vol, 0); }
  // --- collisions (all in court-local coords)
  function hit(nx, ny, nz, e, kind) { const vn = v.x * nx + v.y * ny + v.z * nz; if (vn >= 0) return; const sp = -vn;
    v.x -= (1 + e) * vn * nx; v.y -= (1 + e) * vn * ny; v.z -= (1 + e) * vn * nz;
    const k = ny > 0.7 ? 0.985 : 0.9; v.x *= k; v.z *= k; if (ny > 0.7) grounded = true; if (sp > 0.6) { st.bounces++; thump(sp, kind); } }
  function collide() { const p = ball.position;
    if (p.y < FLOOR + R) { p.y = FLOOR + R; hit(0, 1, 0, 0.62, 0); }
    if (p.z < F + R) { p.z = F + R; hit(0, 0, 1, 0.5, 0); }
    for (let i = 0; i < edges.length; i++) { const E = edges[i], d = (p.x - E.ax) * E.nx + (p.z - E.az) * E.nz; if (d < R) { p.x += (R - d) * E.nx; p.z += (R - d) * E.nz; hit(E.nx, 0, E.nz, E.door ? 0.15 : 0.5, 0); } }
    for (let i = 0; i < walls.length; i++) { const W = walls[i], rx = p.x - W.ax, rz = p.z - W.az, t = rx * W.dx + rz * W.dz; if (t < -R || t > W.L + R) continue;
      const d = rx * W.nx + rz * W.nz; if (d < R && d > -0.6) { p.x += (R - d) * W.nx; p.z += (R - d) * W.nz; st.wallHits++; hit(W.nx, 0, W.nz, 0.5, 0); } }
    for (let i = 0; i < boxes.length; i++) { const B = boxes[i], c = B.c, h = B.h;
      const qx = Math.max(c[0] - h[0], Math.min(p.x, c[0] + h[0])), qy = Math.max(c[1] - h[1], Math.min(p.y, c[1] + h[1])), qz = Math.max(c[2] - h[2], Math.min(p.z, c[2] + h[2]));
      let dx = p.x - qx, dy = p.y - qy, dz = p.z - qz, d2 = dx * dx + dy * dy + dz * dz; if (d2 >= R * R) continue;
      let d = Math.sqrt(d2);
      if (d < 1e-6) { // centre inside: push out along the shallowest axis
        const ox = h[0] - Math.abs(p.x - c[0]), oy = h[1] - Math.abs(p.y - c[1]), oz = h[2] - Math.abs(p.z - c[2]);
        dx = dy = dz = 0; if (ox <= oy && ox <= oz) dx = Math.sign(p.x - c[0]) || 1; else if (oy <= oz) dy = Math.sign(p.y - c[1]) || 1; else dz = Math.sign(p.z - c[2]) || 1;
        p.x = dx ? c[0] + dx * (h[0] + R) : p.x; p.y = dy ? c[1] + dy * (h[1] + R) : p.y; p.z = dz ? c[2] + dz * (h[2] + R) : p.z; d = 1; }
      else { dx /= d; dy /= d; dz /= d; p.x = qx + dx * R; p.y = qy + dy * R; p.z = qz + dz * R; }
      if (B.board && v.x * dx + v.y * dy + v.z * dz < -0.5) st.boardHits++;
      hit(dx, dy, dz, B.e, B.board ? 2 : 0); }
    // rim: sphere vs torus (closest point on the ring circle)
    const rx = p.x - rimC[0], rz = p.z - rimC[2], ry = p.y - rimC[1]; if (Math.abs(ry) < R + rimC[4] + 0.01) { const hh = Math.hypot(rx, rz);
      if (hh > rimC[3] - R - rimC[4] - 0.01 && hh < rimC[3] + R + rimC[4] + 0.01) { const ux = hh > 1e-6 ? rx / hh : 1, uz = hh > 1e-6 ? rz / hh : 0;
        let dx = rx - ux * rimC[3], dz = rz - uz * rimC[3], dy = ry; const d = Math.hypot(dx, dy, dz), m = R + rimC[4];
        if (d < m && d > 1e-6) { dx /= d; dy /= d; dz /= d; p.x += dx * (m - d); p.y += dy * (m - d); p.z += dz * (m - d); if (v.x * dx + v.y * dy + v.z * dz < -0.3) st.rimHits++; hit(dx, dy, dz, 0.6, 1); } } }
    goalCollide(p); }
  function score(goal) { if (goal) st.goals++; else st.score++; S[2] = goal ? 0 : 1; S[3] = 0; fx.visible = true; const P = fxPos, V = fxVel, bx = goal ? GU : rimC[0], by = goal ? FLOOR + 0.6 : rimC[1] - 0.1, bz = goal ? GZ : rimC[2];
    for (let i = 0; i < P.length; i += 3) { P[i] = bx; P[i + 1] = by; P[i + 2] = bz; const a = Math.random() * 6.283, s = 0.6 + Math.random() * 1.6; V[i] = Math.cos(a) * s; V[i + 1] = 0.8 + Math.random() * 2.2; V[i + 2] = Math.sin(a) * s; }
    fx.geometry.attributes.position.needsUpdate = true; fx.material.opacity = 1;
    noise(0.35, 0.18, 2500); tone(660, 'sine', 0.25, 0.12, 0.05); tone(990, 'sine', 0.35, 0.1, 0.16);
    try { if (game.say) game.say((goal ? 'GOAL ' + st.goals : 'SCORE ' + st.score), 1.6); else { const m = document.getElementById('msg'), n = goal ? st.goals : st.score, w = goal ? 'GOAL' : 'SCORE', txt = n === 1 ? w : w + ' x' + n; if (m) { m.textContent = txt; setTimeout(() => { if (m.textContent === txt) m.textContent = ''; }, 1600); } } } catch (e) { } }
  function step(dt) { const p = ball.position; st.steps++; p0.copy(p); grounded = false;
    v.y += G * dt; p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
    // net: drag inside the net cylinder under the rim
    const nx = p.x - rimC[0], nz = p.z - rimC[2]; if (p.y < rimC[1] && p.y > rimC[1] - 0.45 && nx * nx + nz * nz < rimC[3] * rimC[3]) { const k = Math.max(0, 1 - 4 * dt); v.x *= k; v.z *= k; if (v.y < -2.5) v.y *= Math.max(0, 1 - 2 * dt); }
    collide();
    // score: centre crosses the rim plane downward inside the ring (re-armed once the ball is back above the rim or away)
    if (armed && p0.y > rimC[1] && p.y <= rimC[1] && v.y < 0 && (p.x - rimC[0]) ** 2 + (p.z - rimC[2]) ** 2 < rimC[3] * rimC[3]) { armed = false; score(); }
    if (!armed && (p.y > rimC[1] + 0.3 || p.y < rimC[1] - 1.2)) armed = true;
    // goal: the whole ball crosses the goal line (front plane) between the posts and under the bar
    if (segs) { const gz = p.z - GZ; if (armedGoal && gz < 0.4 - R && p0.z - GZ >= 0.4 - R && Math.abs(p.x - GU) < 0.9 - GT && p.y - FLOOR < 1.2 - GT) { armedGoal = false; score(true); }
      else if (!armedGoal && gz > 0.4 + R + 0.3) armedGoal = true; }
    // rolling look
    const vh = Math.hypot(v.x, v.z); if (vh > 0.02 && p.y < FLOOR + R + 0.12) { ax.set(v.z / vh, 0, -v.x / vh); q.setFromAxisAngle(ax, vh * dt / R); ball.quaternion.premultiply(q); }
    if (grounded && vh < 0.06 && Math.abs(v.y) < 0.3) { v.x *= 0.9; v.z *= 0.9; S[0] += dt; if (S[0] > 0.4) { v.set(0, 0, 0); asleep = true; } } else if (grounded && vh < 0.6) { v.x *= 1 - 0.8 * dt; v.z *= 1 - 0.8 * dt; S[0] = 0; } else S[0] = 0;
    if (!(p.y > -5 && p.y < 60) || p.x !== p.x) reset(); }
  // --- gravity gun hooks
  function camLocal() { cam.copy(game.camera.position); g.worldToLocal(cam); game.camera.getWorldDirection(dir); tmp2.copy(game.camera.position).add(dir); g.worldToLocal(tmp2); dir.copy(tmp2).sub(cam).normalize(); }
  function inReach() { // camera inside the courtyard (or just through the doorway)
    for (let i = 0; i < edges.length; i++) { const E = edges[i], d = (cam.x - E.ax) * E.nx + (cam.z - E.az) * E.nz; if (d < (E.door ? -2.5 : -0.2)) return false; } return true; }
  function aimed(range) { camLocal(); if (!inReach()) return false; tmp.copy(ball.position).sub(cam); const t = tmp.dot(dir); if (t < 0 || t > range) return false; return tmp.lengthSq() - t * t < 0.38 * 0.38; }
  function grab() { held = true; wake(); v.set(0, 0, 0); st.grabs++; tone(420, 'sine', 0.12, 0.08, 0); return true; }
  // toss (click) aimed roughly at the hoop gets a shooter's arc: the player's aim error still decides make / rim / miss
  // (heading error -> lateral offset, pitch vs. the ideal line 1 m over the rim -> long/short). Outside the cone it is a plain throw.
  function shotArc() { const p = ball.position, dx = rimC[0] - p.x, dz = rimC[2] - p.z, D = Math.hypot(dx, dz), hy = rimC[1] - p.y; if (D < 0.6 || D > 9 || hy < -0.5) return false;
    const hd = Math.hypot(dir.x, dir.z); if (hd < 1e-3) return false; const ux = dx / D, uz = dz / D, ax0 = dir.x / hd, az0 = dir.z / hd, ad = ax0 * ux + az0 * uz, px = ax0 - ad * ux, pz = az0 - ad * uz; if (ad < 0.985) return false; // within ~10 deg
    const pitch = Math.atan2(dir.y, hd), ideal = Math.atan2(rimC[1] + 1 - cam.y, Math.hypot(rimC[0] - cam.x, rimC[2] - cam.z)), pe = pitch - ideal; if (Math.abs(pe) > 0.26) return false;
    const lon = Math.max(-0.5, Math.min(0.5, pe * 57.3 * 0.03 * Math.max(1, D / 3)));
    const tx = dx + ux * lon + px * D * 0.5, tz = dz + uz * lon + pz * D * 0.5, Dt = Math.hypot(tx, tz), th = 0.87 + Math.max(0, Math.min(0.25, pe)), T = Math.sqrt(2 * (hy + Dt * Math.tan(th)) / -G);
    v.set(tx / T, 0, tz / T); v.y = hy / T - 0.5 * G * T; return true; }
  function release(speed) { if (!held) return false; held = false; camLocal(); if (!(speed > 0 && speed < 10 && shotArc())) { v.copy(camVel).multiplyScalar(0.6).addScaledVector(dir, speed); if (speed > 0) v.y += speed * 0.08; } wake(); st.throws++; if (speed > 0) noise(0.12, 0.06, 1200); return true; }
  function hook(gr) { if (!gr || gr.__ball872) return; gr.__ball872 = true; const p1 = gr.primary, p2 = gr.secondary;
    gr.primary = function () { if (held) return release(7.5); if (!gr.held && aimed(14)) return grab(); return p1.apply(this, arguments); };
    gr.secondary = function () { if (held) return release(13); if (!gr.held && aimed(14)) { camLocal(); v.copy(dir).multiplyScalar(10); v.y += 1.5; wake(); st.kicks++; thump(6, 0); return true; } return p2.apply(this, arguments); }; }
  // ---- Leaf Blower (873): while blowing, a cone (28 deg half-angle, 6 m) pushes the ball; force falls off with distance and angle.
  // Off-path cost: one getter read per frame (tools.holding) when the blower is not running.
  const BCOS = Math.cos(28 * Math.PI / 180), BR = 6, BA = 22; // m/s^2 at the nozzle on-axis
  function blower(dt) { if (!tools) { tools = game.tools; if (!tools) return; } if (!tools.holding || !tools.slots || game.weapon !== tools.slots.blower) return;
    const p = ball.position; tmp.copy(p).sub(cam); const d = tmp.length(); if (d > BR || d < 0.05) return; const c = tmp.dot(dir) / d; if (c < BCOS) return;
    const fa = (1 - d / BR) * (c - BCOS) / (1 - BCOS), a = BA * fa * (0.35 + 0.65 * fa) * dt; if (a <= 0) return;
    v.x += tmp.x / d * a; v.y += Math.max(0, tmp.y / d) * a * 0.3; v.z += tmp.z / d * a; if (asleep) { st.blows++; } wake(); }
  let qaPause = false;
  function frame(t) { requestAnimationFrame(frame); const dt = Math.min(0.05, S[1] ? (t - S[1]) / 1000 : 0); S[1] = t; if (dt && !qaPause) tick(dt); }
  function tick(dt) {
    if (game.grav && !game.grav.__ball872) hook(game.grav);
    const p = ball.position; camLocal(); camVel.copy(cam).sub(camPrev).divideScalar(dt); camPrev.copy(cam);
    if (held) { if (game.weapon !== GRAV || !inReach()) { release(0); } else { tmp.copy(cam).addScaledVector(dir, 1.2); const k = 1 - Math.exp(-18 * dt); p.lerp(tmp, k); collide(); v.set(0, 0, 0); asleep = false; } }
    else { blower(dt); // walk-into-ball dribble (cheap distance check; only near the court)
      const dx = p.x - cam.x, dz = p.z - cam.z, d2 = dx * dx + dz * dz; if (d2 < 0.5 * 0.5 && p.y < FLOOR + R + 0.2) { const d = Math.sqrt(d2) || 1, cv = Math.hypot(camVel.x, camVel.z); if (cv > 0.3) { const s = Math.max(1.5, cv * 1.3); v.x = dx / d * s; v.z = dz / d * s; v.y = 0.6; wake(); st.kicks++; } }
      if (!asleep) { const n = Math.min(6, Math.ceil(dt / SUB)), h = dt / n; for (let i = 0; i < n && !asleep; i++) step(h); } }
    if (S[3] >= 0) { S[3] += dt; const P = fxPos, V = fxVel; for (let i = 0; i < P.length; i += 3) { V[i + 1] -= 4 * dt; P[i] += V[i] * dt; P[i + 1] += V[i + 1] * dt; P[i + 2] += V[i + 2] * dt; }
      fx.geometry.attributes.position.needsUpdate = true; fx.material.opacity = Math.max(0, 1 - S[3] / 1.1); if (S[3] > 1.1) { S[3] = -1; fx.visible = false; } }
    if (S[2] > 0 && net) { S[2] = Math.max(0, S[2] - dt * 2.5); net.scale.y = netY0 * (1 + 0.35 * Math.sin(S[2] * Math.PI)); } }
  let tries = 0; (function wait() { if (boot()) { requestAnimationFrame(frame); return; } if (++tries < 240) setTimeout(wait, 500); })();
})();
