// Egg 4: the slender figure: a very tall, thin, faceless figure (pale white head, black suit, white shirt, black tie, unnaturally long arms) stands far off
// every few minutes. As soon as he is anywhere in your field of view, screen static and a distorted hum creep in, stronger the closer he
// is and the more centred. Walk up close and look straight at him (or keep staring) and the screen fuzzes briefly, then he bursts
// into glitter confetti and is gone. The player's position never changes (#146). Never in the realm, never chasing, never close (no jumpscare). Audio is silent when muted; static still shows.
// Original procedural model, nothing copied.
import { THREE, V, builder, MAT, Q, rand, clamp, ease, makePuffs } from '../kit.js';
export function eggSlender(E) {
  const { scene, S, A, O, world, camera } = E;
  const fig = new THREE.Group(); fig.name = 'egg-slender'; fig.visible = false; scene.add(fig);
  const HD = !Q.low, sg = n => HD ? n : Math.max(6, Math.round(n * 0.5));
  const suitM = new THREE.MeshStandardMaterial({ color: 0x0a0a0d, roughness: 0.62, metalness: 0.05 }), shirtM = new THREE.MeshStandardMaterial({ color: 0xf1f1ee, roughness: 0.8 }),
    tieM = new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.35, metalness: 0.1 }), skinM = new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.55, emissive: 0x161616 }), shoeM = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.25, metalness: 0.2 });
  const mesh = (geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); fig.add(o); return o; };
  const lathe = (pts, n) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), sg(n));
  // legs: long, thin trousers tapering to the ankle, glossy narrow shoes
  for (const s of [-1, 1]) { const leg = mesh(lathe([[0.03, 0], [0.042, 0.05], [0.05, 0.5], [0.06, 1.0], [0.072, 1.4], [0.07, 1.48], [0, 1.5]], 14), suitM, s * 0.07, 0.04, 0); leg.scale.z = 0.9;
    const sh = mesh(new THREE.SphereGeometry(0.06, sg(14), sg(8)), shoeM, s * 0.07, 0.03, 0.06); sh.scale.set(0.75, 0.45, 1.9); }
  // torso: a narrow-waisted jacket (lathe, flattened), shoulders, lapels, white shirt V, black tie with a knot
  const torso = mesh(lathe([[0.15, 0], [0.135, 0.12], [0.12, 0.3], [0.15, 0.62], [0.19, 0.8], [0.2, 0.86], [0.1, 0.92], [0.06, 0.94], [0, 0.94]], 24), suitM, 0, 1.46, 0); torso.scale.z = 0.55;
  const v = new THREE.Shape(); v.moveTo(-0.075, 0.36); v.lineTo(0.075, 0.36); v.lineTo(0.0, 0.0); v.closePath(); const shirt = mesh(new THREE.ShapeGeometry(v), shirtM, 0, 1.98, 0.108); shirt.rotation.x = -0.12;
  const tie = new THREE.Shape(); tie.moveTo(-0.012, 0.33); tie.lineTo(0.012, 0.33); tie.lineTo(0.026, 0.04); tie.lineTo(0, 0); tie.lineTo(-0.026, 0.04); tie.closePath();
  const tg = new THREE.ExtrudeGeometry(tie, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1, curveSegments: 2 }); const tm = mesh(tg, tieM, 0, 1.98, 0.112); tm.rotation.x = -0.12;
  const knot = mesh(new THREE.SphereGeometry(0.018, sg(10), sg(8)), tieM, 0, 2.31, 0.106); knot.scale.set(1.2, 1, 0.6);
  for (const s of [-1, 1]) { const lp = new THREE.Shape(); lp.moveTo(0, 0.38); lp.lineTo(s * 0.03, 0.38); lp.lineTo(s * 0.1, 0.12); lp.lineTo(s * 0.04, 0.0); lp.closePath(); const lg = mesh(new THREE.ExtrudeGeometry(lp, { depth: 0.008, bevelEnabled: false }), suitM, s * 0.075, 1.96, 0.1); lg.rotation.x = -0.12;
    const sh = mesh(new THREE.SphereGeometry(0.075, sg(14), sg(10)), suitM, s * 0.2, 2.28, 0); sh.scale.set(1.0, 0.7, 0.85); }
  for (let k = 0; k < 3; k++) mesh(new THREE.SphereGeometry(0.008, 8, 6), tieM, 0.005, 1.66 + k * 0.08, 0.087);
  // #139 more detail, merged into three meshes (one per material) so it costs 3 draw calls, and only while he is visible:
  // jacket: hem edge, back vent, flap pockets, a breast pocket welt, sleeve seams; shirt: collar points and cuffs edge; shoes: soles,
  // heels and toe caps; trousers: front creases. The head stays featureless (just a hint of ears and a jaw line under the skin).
  if (HD) { const sb = builder(), wb = builder(), kb = builder();
    sb.tor(0.15, 0.004, 4, 28, 0, 0, 1.462, 0, Math.PI / 2, 0, 0); sb.box(0.004, 0.22, 0.004, 0, 0, 1.57, -0.083); // hem edge, back vent
    for (const s2 of [-1, 1]) { sb.box(0.085, 0.022, 0.006, 0, s2 * 0.085, 1.66, 0.078, -0.12, s2 * 0.35, 0); sb.box(0.002, 0.002, 0.002, 0, s2 * 0.085, 1.64, 0.08); // flap pockets
      sb.box(0.006, 0.004, 0.06, 0, s2 * 0.105, 1.48 + 0.01, 0.0, 0, 0, 0); for (let k = 0; k < 3; k++) sb.cyl(0.009 - k * 0.0008, 0.009 - k * 0.0008, 0.004, 10, 0, s2 * 0.072, 1.53 + k * 0.02, 0.07, Math.PI / 2); } // trouser crease top, cuff buttons
    sb.box(0.06, 0.012, 0.006, 0, -0.1, 2.12, 0.085, -0.12, -0.3, 0); // breast pocket welt
    for (const s2 of [-1, 1]) for (let k = 0; k < 8; k++) sb.box(0.003, 0.17, 0.003, 0, s2 * 0.07, 0.12 + k * 0.17, 0.05 - k * 0.0005); // trouser creases
    fig.add(sb.mesh(suitM));
    wb.box(0.025, 0.012, 0.004, 0, -0.06, 2.17, 0.09, -0.12, -0.3, 0); // pocket square
    for (const s2 of [-1, 1]) { const c = new THREE.Shape(); c.moveTo(0, 0); c.lineTo(s2 * 0.045, -0.012); c.lineTo(s2 * 0.02, -0.06); c.closePath(); wb.add(new THREE.ExtrudeGeometry(c, { depth: 0.004, bevelEnabled: false }), 0, 0, 2.355, 0.098, -0.12, 0, 0); } // collar points
    fig.add(wb.mesh(shirtM));
    for (const s2 of [-1, 1]) { kb.rbox(0.072, 0.012, 0.23, 0.005, 0, s2 * 0.07, 0.006, 0.06); kb.rbox(0.06, 0.03, 0.05, 0.006, 0, s2 * 0.07, 0.02, -0.035); kb.sph(0.034, 10, 6, 0, s2 * 0.07, 0.034, 0.15, 1, 0.5, 1.1); // sole, heel, toe cap
      kb.sph(0.022, 10, 8, 0, s2 * 0.098, 2.62, -0.005, 0.35, 1, 0.75); } // a hint of ears
    fig.add(kb.mesh(shoeM)); }
  // arms: unnaturally long, hanging past the knees, slightly bent; long pale hands with thin fingers
  const arms = [];
  for (const s of [-1, 1]) { const sh = new THREE.Group(); sh.position.set(s * 0.215, 2.27, 0); sh.rotation.z = s * 0.06; fig.add(sh);
    const up = new THREE.Mesh(lathe([[0.042, 0], [0.048, 0.4], [0.05, 0.62], [0, 0.66]], 12), suitM); up.rotation.x = Math.PI; sh.add(up);
    const el = new THREE.Group(); el.position.y = -0.64; el.rotation.x = -0.08; sh.add(el);
    const fo = new THREE.Mesh(lathe([[0.036, 0], [0.042, 0.5], [0.046, 0.62], [0, 0.64]], 12), suitM); fo.rotation.x = Math.PI; el.add(fo);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.025, sg(12)), shirtM); cuff.position.y = -0.63; el.add(cuff);
    const hand = new THREE.Group(); hand.position.y = -0.65; el.add(hand); const palm = new THREE.Mesh(new THREE.SphereGeometry(0.03, sg(10), sg(8)), skinM); palm.scale.set(0.55, 1.6, 0.9); palm.position.y = -0.04; hand.add(palm);
    for (let f = 0; f < 4; f++) { const fg = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.0045, 0.17, 6), skinM); fg.position.set(s * 0.004, -0.15, -0.018 + f * 0.012); fg.rotation.x = (f - 1.5) * 0.06; hand.add(fg); }
    const th = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.005, 0.08, 6), skinM); th.position.set(-s * 0.01, -0.08, 0.025); th.rotation.x = 0.4; hand.add(th); arms.push({ sh, el, s }); }
  // neck and a smooth, featureless pale head (a little long, slightly narrow at the jaw)
  mesh(new THREE.CylinderGeometry(0.038, 0.045, 0.16, sg(14)), skinM, 0, 2.43, 0); const collar = mesh(new THREE.TorusGeometry(0.045, 0.012, 6, sg(16)), shirtM, 0, 2.37, 0); collar.rotation.x = Math.PI / 2;
  const head = mesh(lathe([[0, 0], [0.05, 0.02], [0.085, 0.09], [0.1, 0.18], [0.098, 0.26], [0.075, 0.33], [0.035, 0.365], [0, 0.37]], 24), skinM, 0, 2.47, 0); head.scale.z = 1.08;
  fig.traverse(o => { if (o.isMesh) o.userData.egg = true; });
  const st = { on: false, t: 0, next: rand(90, 150), expo: 0, level: 0, phase: 'idle', pt: 0, returns: 0 }; let hum = null, hiss = null;
  let startQ = camera.quaternion.clone(); const startP = world.start ? world.start.clone() : camera.position.clone();
  const spots = () => { const out = []; world.doors.forEach(d => out.push({ p: V((d.minX + d.maxX) / 2, 0, (d.minZ + d.maxZ) / 2), w: 2 })); for (let k = 0; k < 60; k++) { const p = world.randomFree(0.5); if (p) out.push({ p, w: 1 }); } return out; };
  function appear(force) { if (E.isRealm() || st.phase !== 'idle') return false; const cp = camera.position; let best = null;
    for (const c of spots()) { const d = Math.hypot(c.p.x - cp.x, c.p.z - cp.z); if (d < 15 || d > 38) continue; const hd = c.p.clone().setY(2.6), ang = S.angleTo(hd);
      if (!force && ang < 45) continue; if (ang > 115) continue; if (!S.los(hd) || !S.los(c.p.clone().setY(0.8))) continue; const score = c.w * 10 - Math.abs(d - 24) * 0.3 + Math.random() * 3; if (!best || score > best.score) best = { ...c, score }; }
    if (!best) return false; fig.position.copy(best.p); fig.visible = true; st.on = true; st.t = 0; st.expo = 0; st.phase = 'watch'; return true; }
  function sound(l) { // a distorted hum and hiss that follow the static level (all through the master gain: silent when muted)
    if (l > 0.02 && !hum) { hum = A.loop({ f: 46, type: 'sawtooth', vol: 0.0001, lp: 420, am: 7, noise: 0 }); hiss = A.loop({ f: 0, vol: 0.0001, lp: 5200, noise: 0.6 }); }
    if (hum) { hum.set(0.11 * l * l + 0.012 * l); hiss.set(0.09 * l * l); if (l <= 0.02) { hum.stop(0.6); hiss.stop(0.6); hum = hiss = null; } } }
  function leave(soft) { st.on = false; fig.visible = false; st.phase = soft ? 'idle' : st.phase; st.next = rand(140, 260); }
  // #241: a spectacular burst: flash, shockwave ring, big multicolour sparkle, after-crackle, and real glitter that rains down and
  // lingers on the floor (the shared glitter flakes, so the guide bot sweeps it). One capped points pool, all fading; sound via master (silent when muted).
  const GL = [0xff4fd8, 0x4fe3ff, 0xffe14f, 0x8cff6a, 0xffffff, 0xb07cff, 0xff9a3c, 0x7affea, 0xffd6f5], conf = makePuffs(scene, Q.low ? 420 : 900, { additive: true, alpha: 0.95 });
  let fx = null;
  function burst() { // the player is never moved
    const O = fig.position.clone(), L = Q.low;
    for (let i = 0; i < 3; i++) conf.emit(V(O.x, 1.5, O.z), V(0, 0, 0), 0.35 + i * 0.08, 2.6 + i * 1.2, 0xffffff, 1.5, 0, 0); // flash
    const R = L ? 40 : 72; for (let i = 0; i < R; i++) { const a = i / R * 6.2832; conf.emit(V(O.x + Math.cos(a) * 0.3, 0.08, O.z + Math.sin(a) * 0.3), V(Math.cos(a) * 8, 0, Math.sin(a) * 8), 0.9, 0.16, i % 2 ? 0x4fe3ff : 0xffffff, 1.8, 1.6, 0); } // shockwave ring
    const n = L ? 220 : 480; for (let i = 0; i < n; i++) conf.emit(V(O.x + rand(-0.25, 0.25), rand(0.1, 2.7), O.z + rand(-0.15, 0.15)), V(rand(-1, 1), rand(-0.2, 1.4), rand(-1, 1)).normalize().multiplyScalar(rand(2, 7.5)), rand(2.4, 4.4), rand(0.04, 0.09), GL[i % GL.length], 0, 1, 1.3);
    const G = E.ctx && E.ctx.tools && E.ctx.tools.glitter; if (G && G.emit) { const m = L ? 200 : 480; for (let i = 0; i < m; i++) { const a = Math.random() * 6.2832, s = rand(0.6, 4.2); G.emit(O.x + rand(-0.2, 0.2), rand(0.4, 2.6), O.z + rand(-0.2, 0.2), Math.cos(a) * s, rand(1, 4.5), Math.sin(a) * s); } }
    fx = { t: 0, n: L ? 5 : 9, O };
    A.tone(62, 0.35, 'sine', 0.2); A.noise(0.22, 1400, 0.16, 0, 'lowpass', 0.8, 500); [1568, 2093, 2637, 3136, 3951].forEach((f, i) => A.tone(f, 0.18, 'triangle', 0.035, 0.04 + i * 0.05));
    fig.visible = false; st.on = false; st.returns++; E.found('slender'); }
  function fxUpdate(dt) { if (!fx) return; fx.t += dt; if (fx.n <= 0) { fx = null; return; } if (fx.t < 0.25) return; fx.t = 0; fx.n--; // after-crackle: small sparkle pops around the spot
    const c = V(fx.O.x + rand(-1.6, 1.6), rand(0.6, 2.6), fx.O.z + rand(-1.6, 1.6)); for (let i = 0; i < (Q.low ? 14 : 28); i++) conf.emit(c, V(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(rand(1, 3)), rand(0.5, 1.1), rand(0.03, 0.06), GL[(Math.random() * GL.length) | 0], 0, 1.5, 0.8);
    A.tone(rand(2200, 4200), 0.08, 'sine', 0.025); }
  function update(dt, tm) {
    conf.update(dt); fxUpdate(dt);
    if (E.isRealm()) { if (st.phase !== 'idle') { fig.visible = false; st.on = false; st.phase = 'idle'; st.level = 0; O.staticLevel(0); sound(0); } return; }
    if (st.phase === 'idle') { if ((st.next -= dt) <= 0) { if (!appear()) st.next = 8; } return; }
    const cp = camera.position;
    if (st.phase === 'watch') { st.t += dt; fig.rotation.y = Math.atan2(cp.x - fig.position.x, cp.z - fig.position.z);
      for (const a of arms) { a.sh.rotation.x = Math.sin(tm * 0.7 + a.s) * 0.03; a.el.rotation.x = -0.08 + Math.sin(tm * 1.3 + a.s * 2) * 0.02; } head.rotation.z = Math.sin(tm * 0.4) * 0.04;
      const hd = fig.position.clone().setY(2.55), body = fig.position.clone().setY(1.4), d = Math.hypot(cp.x - fig.position.x, cp.z - fig.position.z);
      const seen = (S.inView(hd, 0) && S.los(hd)) || (S.inView(body, 0) && S.los(body)); // anywhere in the field of view counts
      const centred = clamp(1 - S.angleTo(body) / 50, 0, 1), near = clamp((40 - d) / 28, 0, 1);
      if (seen) st.expo = Math.min(1, st.expo + dt * 0.7 * (0.1 + 0.28 * centred + 0.22 * near + 0.18 * centred * near)); else st.expo = Math.max(0, st.expo - dt * 0.3);
      const inst = seen ? 0.08 + 0.3 * centred * (0.4 + near) + 0.15 * near : 0; st.level += (Math.max(inst, st.expo * 0.8) - st.level) * Math.min(1, dt * 5);
      if (st.expo >= 1 || (d < 12 && seen && centred > 0.55)) { st.phase = 'take'; st.pt = 0; }
      else if (d < 6) { st.phase = 'fade'; st.pt = 0; fig.visible = false; } // you walked up to him: he simply isn't there any more
      else if (st.t > 40 && !seen) { st.phase = 'fade'; st.pt = 0; fig.visible = false; } }
    else if (st.phase === 'take') { st.pt += dt; st.level = Math.min(0.75, st.level + dt * 2); if (st.pt > 0.6) { burst(); st.phase = 'fade'; st.pt = 0; } } // brief static, then confetti
    else if (st.phase === 'fade') { st.pt += dt; st.level = Math.max(0, st.level - dt / 0.8); if (st.level <= 0) { st.phase = 'idle'; st.next = rand(140, 260); } }
    O.staticLevel(st.level); sound(st.level); }
  return { name: 'slender', group: fig, anchor: null, update, appear: () => appear(true), get visible() { return fig.visible && st.on; }, fig, st, setStart(p, q) { startP.copy(p); if (q) startQ = q.clone(); },
    view: () => ({ from: camera.position.clone(), to: fig.position.clone().setY(1.6) }) };
}
