// Movement add-on for the TJM galleries: sprint, stride-timed synthesized footsteps by floor material, and elf-chase tuning.
// Canonical copy: /workspace/museum-move/src/move.js; each gallery keeps a verbatim copy at <project>/src/move.js.
// Wired in by /workspace/museum-move/integrate.py (see INTEGRATION.md). Depends only on three.
//  - Sprint: hold Shift (desktop); on phones push the move stick all the way to its top edge (#232: no RUN button on touch). ~1.8x walk speed, a few degrees
//    of extra field of view and a stronger head-bob while running.
//  - Footsteps: WebAudio, timed to the stride (cadence rises with speed), timbre by floor material (stone, wood, marble, concrete,
//    glass, metal, carpet). Each gallery tags its floors with move.setFloorMaterial(fn(x, z, floorY) -> name); default 'stone'.
//    Quiet (master volume 0.3), silent when muted, none while standing still or being carried, softer in the realm.
//  - Elf chase: elves start a little slower than a sprint and speed up slowly, so a good run lasts ~20-40 s; walking gets you
//    caught fast. They follow your trail round corners (no teleport-catch while in sight); an off-screen catch-up only when you
//    have been far ahead for a long time. The leaf blower knocks chasing elves back: they tumble, get up, and are immune to it
//    for a few seconds before it works again. The catch itself (carry, or the 3rd-summoning drag + throw) is the gallery's own.
import * as THREE from 'three';
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const MOVE_DEFAULTS = {
  sprint: 1.8, fovKick: 7, bobWalk: 0.035, bobRun: 0.07, volume: 0.3,
  chase: { base: 8.6, ramp: 0.17, cap: 13.5, farBonusFrom: 20, farBonus: 0.1, farBonusMax: 2, catchupAfter: 12, catchupDist: 22, catchupBehind: 15, catchupEvery: 4, forceCatchAt: 120, packSpread: 25,
    knockMin: 1.2, tumbleMin: 0.9, recover: 0.6, immunity: 4, friction: 2.2 },
  // caught (carry, or the 3rd-summoning drag): the blower still works and can knock some holders off; they tumble, get up and run back.
  // At most `budget` (fraction of the pack, min 2) knock-offs per catch, so the elves always get you in the end. Progress of the carry /
  // drag runs at factor = 1 - slow * (share of holders off), never below 0 (a pause when many are off), back to 1 as they regroup.
  hold: { budget: 0.4, slow: 2.2, knockMin: 1.0, tumble: 0.9, back: 7, dragDur: [3, 5.2], dragPace: 4 } };
export const FLOOR_SOUNDS = ['stone', 'wood', 'marble', 'concrete', 'glass', 'metal', 'carpet'];

export function installMove(ctx) {
  const O = { ...MOVE_DEFAULTS, ...(ctx.options || {}), chase: { ...MOVE_DEFAULTS.chase, ...((ctx.options || {}).chase || {}) }, hold: { ...MOVE_DEFAULTS.hold, ...((ctx.options || {}).hold || {}) } };
  const camera = ctx.camera, touchMove = ctx.touchMove || { x: 0, y: 0 }, isMuted = ctx.isMuted || (() => false);
  const walkable = ctx.walkable || (() => true), floorY = ctx.floorY || (() => 0), animateElf = ctx.animateElf || (() => {});
  const isCarried = ctx.isCarried || (() => false), inRealm = ctx.inRealm || (() => false), isBusy = ctx.isBusy || (() => false);
  const coarse = matchMedia('(pointer: coarse)').matches;
  let floorMat = typeof ctx.floorMaterial === 'function' ? ctx.floorMaterial : (typeof ctx.floorMaterial === 'string' ? () => ctx.floorMaterial : () => 'stone');
  // ---------- input: Shift, phone stick fully out, RUN toggle ----------
  let shift = false, toggle = false, running = false, runAmt = 0, fovAdded = 0, phase = 0, lastStepPhase = 0, speed = 0, foot = 0;
  const last = camera.position.clone(); const stats = { steps: 0, byMat: {}, suppressed: 0, maxSpeed: 0, runFrames: 0 };
  addEventListener('keydown', e => { if (e.key === 'Shift') shift = true; });
  addEventListener('keyup', e => { if (e.key === 'Shift') shift = false; });
  addEventListener('blur', () => { shift = false; });
  let btn = null, cell = null;
  if (false && coarse) { btn = document.createElement('button'); btn.id = 'trun'; btn.type = 'button'; btn.textContent = 'RUN';
    btn.style.cssText = 'position:fixed;left:18px;bottom:168px;z-index:30;width:52px;height:30px;border-radius:15px;border:1px solid rgba(255,190,90,.55);background:rgba(20,16,10,.55);color:#e9c98f;font:700 11px monospace;letter-spacing:1px;touch-action:manipulation';
    const flip = e => { e.preventDefault(); e.stopPropagation(); toggle = !toggle; paint(); }; btn.addEventListener('touchstart', flip, { passive: false }); btn.addEventListener('click', flip);
    const tm = document.getElementById('tmove'); if (tm && tm.parentNode) tm.parentNode.appendChild(btn); else document.body.appendChild(btn); }
  const hud = document.getElementById('hud'); if (hud) { cell = document.createElement('span'); cell.className = 'cell'; cell.id = 'runcell'; cell.textContent = coarse ? 'stick to top: run' : 'Shift to run'; cell.style.cssText = 'white-space:nowrap'; hud.appendChild(cell); }
  function paint() { if (btn) { btn.style.background = toggle ? 'rgba(216,144,44,.55)' : 'rgba(20,16,10,.55)'; btn.style.color = toggle ? '#fff3d6' : '#e9c98f'; } if (cell) cell.style.color = running ? '#ffcf6a' : ''; }
  const stickOut = () => { const up = -(touchMove.y || 0); return up >= 0.95 && Math.abs(touchMove.x || 0) <= up * 0.7; }; // #232: run only at the stick's top edge
  function speedMul(fx, fz) { const moving = Math.abs(fx || 0) + Math.abs(fz || 0) > 0.1; const r = moving && (shift || toggle || stickOut()) && !isBusy(); if (r !== running) { running = r; paint(); } return running ? O.sprint : 1; }
  // ---------- footsteps ----------
  let ac = null, master = null;
  function audio() { try { if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = O.volume; master.connect(ac.destination); } if (ac.state === 'suspended') ac.resume(); return ac; } catch (e) { return null; } }
  let nbuf = null; const noiseBuf = a => { if (nbuf) return nbuf; nbuf = a.createBuffer(1, Math.ceil(a.sampleRate * 0.3), a.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return nbuf; };
  const P = { // [noise filter type, freq, Q, noise decay s, noise gain, tones [[hz, type, decay, gain]...]]
    stone: ['bandpass', 950, 0.9, 0.07, 0.55, [[95, 'sine', 0.06, 0.5]]],
    wood: ['bandpass', 520, 1.8, 0.09, 0.4, [[150, 'triangle', 0.08, 0.55], [310, 'sine', 0.05, 0.15]]],
    marble: ['highpass', 2600, 0.7, 0.035, 0.45, [[2300, 'sine', 0.045, 0.07], [110, 'sine', 0.04, 0.3]]],
    concrete: ['bandpass', 1500, 0.6, 0.095, 0.6, [[80, 'sine', 0.07, 0.45]]],
    glass: ['highpass', 3000, 0.8, 0.03, 0.3, [[1850, 'sine', 0.14, 0.08], [2760, 'sine', 0.11, 0.05], [120, 'sine', 0.04, 0.25]]],
    metal: ['bandpass', 1200, 1.2, 0.06, 0.35, [[420, 'square', 0.16, 0.05], [985, 'triangle', 0.13, 0.06], [100, 'sine', 0.05, 0.3]]],
    carpet: ['lowpass', 420, 0.7, 0.08, 0.5, [[70, 'sine', 0.05, 0.25]]] };
  function step(mat, loud) { if (isMuted()) { stats.suppressed++; return; } const a = audio(); if (!a) return; const p = P[mat] || P.stone, t = a.currentTime + 0.005, pv = 0.92 + Math.random() * 0.16;
    const pan = a.createStereoPanner ? a.createStereoPanner() : null; foot = 1 - foot; if (pan) { pan.pan.value = foot ? 0.12 : -0.12; pan.connect(master); } const out = pan || master;
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = noiseBuf(a); s.playbackRate.value = pv; f.type = p[0]; f.frequency.value = p[1] * pv; f.Q.value = p[2];
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(p[4] * loud, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + p[3]); s.connect(f).connect(g).connect(out); s.start(t, Math.random() * 0.1); s.stop(t + p[3] + 0.02);
    for (const [hz, ty, dec, gn] of p[5]) { const o = a.createOscillator(), og = a.createGain(); o.type = ty; o.frequency.setValueAtTime(hz * pv, t); o.frequency.exponentialRampToValueAtTime(hz * pv * 0.82, t + dec);
      og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(gn * loud, t + 0.005); og.gain.exponentialRampToValueAtTime(0.0001, t + dec); o.connect(og).connect(out); o.start(t); o.stop(t + dec + 0.02); }
    stats.steps++; stats.byMat[mat] = (stats.byMat[mat] || 0) + 1; }
  // ---------- per frame: speed from real displacement, stride phase, bob, fov ----------
  function update(dt) { clock += Math.min(0.05, Math.max(0, dt || 0)); if (!(dt > 0)) return; const c = camera.position, dx = c.x - last.x, dz = c.z - last.z; last.copy(c);
    let sp = Math.hypot(dx, dz) / dt; if (sp > 25) sp = 0; /* teleport / goTo */ speed += (sp - speed) * Math.min(1, dt * 12); if (speed > stats.maxSpeed) stats.maxSpeed = speed;
    const carried = isCarried(), realm = inRealm(); runAmt += ((running && !carried && !realm ? 1 : 0) - runAmt) * Math.min(1, dt * 6); if (running) stats.runFrames++;
    const want = O.fovKick * runAmt * Math.min(1, speed / 8); if (Math.abs(want - fovAdded) > 0.01) { camera.fov += want - fovAdded; fovAdded = want; camera.updateProjectionMatrix(); }
    if (carried || speed < 0.6) { phase = Math.round(phase); lastStepPhase = phase; return; }
    const cadence = 1.6 + Math.min(14, speed) * 0.12; phase += dt * cadence; // steps per second
    if (Math.floor(phase) > Math.floor(lastStepPhase)) { let m = 'stone'; try { m = floorMat(c.x, c.z, floorY()) || 'stone'; } catch (e) {} step(m, (realm ? 0.35 : 1) * (running ? 1.3 : 1) * Math.min(1, 0.45 + speed / 10)); }
    lastStepPhase = phase; }
  const bob = () => (isCarried() || speed < 0.3 ? 0 : Math.abs(Math.sin(phase * Math.PI)) * (O.bobWalk + (O.bobRun - O.bobWalk) * runAmt) * Math.min(1, speed / 5));
  // ---------- elf chase ----------
  const C = O.chase, trail = []; let trailBase = 0; const lastT = V(1e9, 0, 1e9);
  const recordTrail = () => { const c = camera.position; if (Math.hypot(c.x - lastT.x, c.z - lastT.z) < 0.6) return; lastT.copy(c); trail.push(V(c.x, 0, c.z)); if (trail.length > 300) { trail.shift(); trailBase++; } };
  const tAt = i => trail[i - trailBase]; const tEnd = () => trailBase + trail.length - 1;
  const _pv = V(); const inView = p => { _pv.set(p.x, floorY() + 0.6, p.z); if (_pv.distanceTo(camera.position) > 45) return false; _pv.project(camera); return _pv.z < 1 && Math.abs(_pv.x) < 1.1 && Math.abs(_pv.y) < 1.1; };
  const clearLine = (a, b) => { const L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.ceil(L / 0.5); for (let s = 1; s < n; s++) { const u = s / n; if (!walkable(a.x + (b.x - a.x) * u, a.z + (b.z - a.z) * u)) return false; } return true; };
  const nearestTrail = p => { // nearest trail point the elf can actually walk straight to (not through a wall); newest wins ties
    const ix = trail.map((q, i) => [Math.hypot(q.x - p.x, q.z - p.z), i]).sort((m, n) => m[0] - n[0]); for (let k = 0; k < Math.min(10, ix.length); k++) if (clearLine(p, trail[ix[k][1]])) return ix[k][1] + trailBase; return ix.length ? ix[0][1] + trailBase : -1; };
  let clock = 0; const now = () => clock; // game time (dt clamped to 0.05 s), so immunity lasts the same on slow and fast devices
  function register(e, w) { if (e._mvReg) return; e._mvReg = true; e.spd = 0.95 + Math.random() * 0.1; e.kv = V(); e.farT = 0;
    const tl = ctx.tools && ctx.tools(); if (tl && tl.pushables) e._unpush = tl.pushables.add({ name: 'chase-elf', radius: 0.35, mass: 1, getPosition: () => V(e.cp.x, floorY() + 0.35, e.cp.z), onPush: imp => push(e, w, imp) }); }
  function push(e, w, imp) { if (!e.s.parent || !w.chase || (e.immune && now() < e.immune) || e.rec) return; e.kv.x += imp.x; e.kv.z += imp.z; e.kvy = Math.min(2.5, (e.kvy || 0) + imp.y);
    if (!e.tumble && Math.hypot(e.kv.x, e.kv.z) > C.knockMin) { e.tumble = { t: 0, spin: (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 4) }; e.ti = undefined; stats.knocks = (stats.knocks || 0) + 1; } }
  function stepElf(e, w, t, dt) { // returns the elf's distance to the player (the gallery catches at < 1 m)
    register(e, w); if (!w._mv) { w._mv = { curMin: 1e9, prevMin: 1e9, farT: 0, cool: 0 }; trail.length = 0; trailBase = 0; lastT.set(1e9, 0, 1e9); } if (e === w.elves[0]) recordTrail();
    const c = camera.position, fy = floorY(); let pd = Math.hypot(c.x - e.cp.x, c.z - e.cp.z);
    const M = w._mv; if (e === w.elves[0]) { M.prevMin = M.curMin; M.curMin = 1e9; M.farT = M.prevMin > C.catchupDist ? M.farT + dt : 0; M.cool = Math.max(0, M.cool - dt); }
    if (e.tumble || e.rec) { // blown back: slide + spin, then get up (and shrug off the blower for a while)
      if (e.tumble) { const tb = e.tumble; tb.t += dt; const nx = e.cp.x + e.kv.x * dt, nz = e.cp.z + e.kv.z * dt; if (walkable(nx, nz)) { e.cp.x = nx; e.cp.z = nz; } else { e.kv.multiplyScalar(-0.4); }
        const k = Math.exp(-C.friction * dt); e.kv.multiplyScalar(k); e.kvy = Math.max(0, (e.kvy || 0) - 6 * dt); e.hop = Math.max(0, (e.hop || 0) + e.kvy * dt - (e.kvy ? 0 : 2 * dt));
        animateElf(e.s, 'idle', t, camera, dt); e.s.position.set(e.cp.x, fy + 0.3 + (e.hop || 0), e.cp.z); e.s.rotation.z += tb.spin * dt; e.s.rotation.x = Math.sin(tb.t * 9) * 0.6;
        if (tb.t > C.tumbleMin && Math.hypot(e.kv.x, e.kv.z) < 0.8) { e.tumble = null; e.rec = { t: 0, z: e.s.rotation.z % (Math.PI * 2), x: e.s.rotation.x }; } }
      else { e.rec.t += dt; const u = Math.min(1, e.rec.t / C.recover); animateElf(e.s, 'idle', t, camera, dt); e.s.position.set(e.cp.x, fy + 0.35, e.cp.z); e.s.rotation.z = e.rec.z * (1 - u); e.s.rotation.x = e.rec.x * (1 - u);
        if (u >= 1) { e.rec = null; e.s.rotation.x = e.s.rotation.z = 0; e.immune = now() + C.immunity; e.kv.set(0, 0, 0); stats.recovered = (stats.recovered || 0) + 1; } }
      e.cp.y = e.s.position.y; return pd + 99; }
    // speed: a bit under a sprint at first, ramping slowly; a little extra only when far behind
    const sp = e.spd * Math.min(C.cap, C.base + C.ramp * Math.max(0, t - 1)) + Math.min(C.farBonusMax, Math.max(0, pd - C.farBonusFrom) * C.farBonus);
    // off-screen catch-up: only after a long time far ahead, and only where you can't see it happen
    // judged on the whole pack: only when even the nearest elf has been far behind for a long time, one straggler (out of sight) is moved up
    // to a point on your trail ~15 m back (also out of sight); at most one every few seconds
    if (pd < M.curMin) M.curMin = pd;
    if (M.farT > C.catchupAfter && M.cool <= 0 && pd > M.prevMin + 2 && !inView(e.cp)) { let i = tEnd(), acc = 0; while (i > trailBase && acc < C.catchupBehind) { acc += tAt(i).distanceTo(tAt(i - 1)); i--; } const q = tAt(i);
      if (q && !inView(q)) { e.cp.x = q.x + (Math.random() - 0.5) * 0.4; e.cp.z = q.z + (Math.random() - 0.5) * 0.4; e.ti = i; M.cool = C.catchupEvery; stats.catchups = (stats.catchups || 0) + 1; pd = Math.hypot(c.x - e.cp.x, c.z - e.cp.z); } }
    // keep the pack together: an elf following a much older stretch of your trail than the pack (a straggler you would otherwise lap and run into
    // from behind in a looped floor plan) is moved up, out of sight, to the back of the pack on your trail. Never nearer than the nearest elf.
    if (e.ti !== undefined && e.ti >= trailBase && !e.los && M.prevMin < 1e8) { const lag = (tEnd() - e.ti) * 0.6; if (lag > Math.min(M.prevMin, 60) + C.packSpread && !inView(e.cp)) {
      const j = Math.max(trailBase, tEnd() - Math.round((Math.min(M.prevMin, 40) + 3 + Math.random() * 6) / 0.6)), q = tAt(j);
      if (q && !inView(q)) { e.cp.x = q.x + (Math.random() - 0.5) * 0.4; e.cp.z = q.z + (Math.random() - 0.5) * 0.4; e.ti = j; stats.regroups = (stats.regroups || 0) + 1; pd = Math.hypot(c.x - e.cp.x, c.z - e.cp.z); } } }
    // steering: straight at you when the way is clear, otherwise along your trail (round corners, through doorways, up the ramp)
    e.losT = (e.losT || 0) - dt; if (e.losT <= 0) { e.losT = 0.2 + Math.random() * 0.1; e.los = pd < 1.6 || clearLine(e.cp, c); }
    // move with a distance budget, so following the trail point to point costs no speed
    let rem = sp * dt;
    for (let it = 0; it < 8 && rem > 1e-4; it++) { let tx, tz, trailMode = !e.los;
      if (!trailMode) { const side = pd > 3 ? 0.6 : 0, a = e.a || 0; tx = c.x + Math.cos(a) * side; tz = c.z + Math.sin(a) * side; e.ti = undefined; }
      else { if (e.ti === undefined || e.ti < trailBase) e.ti = nearestTrail(e.cp); const q = e.ti >= 0 ? tAt(e.ti) : null; if (!q) { tx = c.x; tz = c.z; trailMode = false; } else { tx = q.x; tz = q.z; } }
      const d = Math.hypot(tx - e.cp.x, tz - e.cp.z);
      if (trailMode && d <= rem) { e.cp.x = tx; e.cp.z = tz; rem -= d; if (e.ti < tEnd()) { e.ti++; continue; } break; }
      const k = d > 1e-6 ? Math.min(1, rem / d) : 0, nx = e.cp.x + (tx - e.cp.x) * k, nz = e.cp.z + (tz - e.cp.z) * k;
      if (trailMode || walkable(nx, nz) || pd < 1.6) { e.cp.x = nx; e.cp.z = nz; } else { e.los = false; e.losT = 0.3; }
      break; }
    e.cp.y = fy + 0.35 + Math.abs(Math.sin(t * 8 + (e.ph || 0))) * 0.2; e.s.position.copy(e.cp); e.s.scale.setScalar(1); animateElf(e.s, 'walk', t, camera, dt);
    return Math.hypot(c.x - e.cp.x, c.z - e.cp.z); }
  function end(w) { if (!w || !w.elves) return; w.elves.forEach(e => { if (e._unpush) { e._unpush(); e._unpush = null; } e._mvReg = false; e.tumble = e.rec = null; if (e.s) { e.s.rotation.x = e.s.rotation.z = 0; } }); w._mv = null; }
  // ---------- caught: blower knock-offs while carried / dragged ----------
  const HO = O.hold;
  function holdBegin(w, kind) { if (!w || !w.elves || w._hold) return; const n = w.elves.length, H = w._hold = { kind, active: false, used: 0, budget: Math.max(2, Math.round(n * HO.budget)), off: 0, unpush: [] };
    const tl = ctx.tools && ctx.tools();
    for (const e of w.elves) { e.hk = null; if (tl && tl.pushables) H.unpush.push(tl.pushables.add({ name: 'holding-elf', radius: 0.35, mass: 1, getPosition: () => e.s.getWorldPosition(V()), onPush: imp => holdPush(w, e, imp) })); } }
  function holdPush(w, e, imp) { const H = w._hold; if (!H || !H.active || e.hk || H.used >= H.budget) return; e.hacc = (e.hacc || V()).add(V(imp.x, 0, imp.z)); if (e.hacc.length() < HO.knockMin) return;
    H.used++; stats.holdKnocks = (stats.holdKnocks || 0) + 1; const v = e.hacc.clone().multiplyScalar(1.6); e.hacc.set(0, 0, 0);
    e.hk = { st: 'tumble', t: 0, p: e.s.position.clone(), v, y: Math.max(0.35, e.s.position.y), vy: 1.2, spin: (Math.random() < 0.5 ? -1 : 1) * (7 + Math.random() * 4) }; }
  function holdFactor(w, dt, active) { const H = w && w._hold; if (!H) return 1; H.active = !!active; const n = w.elves.length || 1; let off = 0; for (const e of w.elves) if (e.hk) off++; H.off = off;
    return Math.max(0, Math.min(1, 1 - HO.slow * off / n)); }
  // call after the gallery has put the elf at its formation slot (e.s.position); returns true when it handled the elf (tumbling / running back)
  function holdApply(w, e, t, dt) { const k = e.hk; if (!k) return false; const fy = floorY(), slot = e.s.position.clone();
    if (k.st === 'tumble') { k.t += dt; const nx = k.p.x + k.v.x * dt, nz = k.p.z + k.v.z * dt; if (walkable(nx, nz)) { k.p.x = nx; k.p.z = nz; } else k.v.multiplyScalar(-0.4); k.v.multiplyScalar(Math.exp(-2.4 * dt));
      k.vy -= 6 * dt; k.y = Math.max(fy + 0.3, k.y + k.vy * dt); e.s.position.set(k.p.x, k.y, k.p.z); e.s.rotation.z += k.spin * dt; e.s.rotation.x = Math.sin(k.t * 9) * 0.6; animateElf(e.s, 'idle', t, camera, dt);
      if (k.t > HO.tumble && k.v.length() < 0.9) { k.st = 'back'; k.t = 0; k.rz = e.s.rotation.z % (Math.PI * 2); k.rx = e.s.rotation.x; } return true; }
    k.t += dt; const u = Math.min(1, k.t / 0.35); e.s.rotation.z = k.rz * (1 - u); e.s.rotation.x = k.rx * (1 - u); // get up, run back to its place
    const d = Math.hypot(slot.x - k.p.x, slot.z - k.p.z), st = HO.back * dt * (u >= 1 ? 1 : 0.3); if (d <= st + 0.05) { e.hk = null; e.s.rotation.x = e.s.rotation.z = 0; stats.holdRegroups = (stats.holdRegroups || 0) + 1; return false; }
    k.p.x += (slot.x - k.p.x) / d * st; k.p.z += (slot.z - k.p.z) / d * st; k.y += (fy + 0.35 + Math.abs(Math.sin(t * 9)) * 0.15 - k.y) * Math.min(1, dt * 8); e.s.position.set(k.p.x, k.y, k.p.z); animateElf(e.s, 'walk', t, camera, dt); return true; }
  function holdEnd(w) { const H = w && w._hold; if (!H) return; H.unpush.forEach(f => { try { f && f(); } catch (e) {} }); for (const e of w.elves) { e.hk = null; if (e.s) e.s.rotation.x = e.s.rotation.z = 0; } w._hold = null; }
  const hold = { begin: holdBegin, factor: holdFactor, apply: holdApply, end: holdEnd, dragDur: len => Math.min(HO.dragDur[1], Math.max(HO.dragDur[0], len / HO.dragPace)), info: w => (w && w._hold ? { used: w._hold.used, budget: w._hold.budget, off: w._hold.off, kind: w._hold.kind } : null), opts: HO };
  const chase = { step: stepElf, end, forceCatch: t => t > C.forceCatchAt, speedAt: t => Math.min(C.cap, C.base + C.ramp * Math.max(0, t - 1)), get trailLength() { return trail.length; }, opts: C };
  return { speedMul, update, bob, chase, hold, step, get clock() { return clock; }, setFloorMaterial: fn => { floorMat = typeof fn === 'function' ? fn : () => fn; }, floorMaterial: (x, z, y) => floorMat(x, z, y),
    get running() { return running; }, get speed() { return speed; }, get fovAdded() { return fovAdded; }, get toggle() { return toggle; }, setToggle: v => { toggle = !!v; paint(); }, stats, options: O, button: btn };
}
