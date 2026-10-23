// Egg 10: once per visit, while you look out a window or skylight, a stainless ship drops out of the sky far away,
// lights its engines, flips upright and is caught by the arms of a distant tower. ~25 s, small, with a faint rumble.
import { THREE, V, builder, ease, clamp, rand } from '../kit.js';
export function eggStarship(E) {
  const { scene, camera, S, A } = E; const ops = (E.ctx.openings || []).filter(o => o && o.c && o.n);
  if (!ops.length) return null;
  const KEY = 'tjmEggStarship';
  const lam = c => new THREE.MeshLambertMaterial({ vertexColors: true, fog: false, emissive: c || 0x000000 });
  const set = new THREE.Group(); set.name = 'egg-starship'; set.visible = false; scene.add(set);
  // tower (146 units tall) with two chopstick arms; ship (50 units) with flaps; plume
  const tower = new THREE.Group(); set.add(tower);
  { const b = builder(), dk = 0x34363a; for (const [x, z] of [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]]) b.box(1.1, 146, 1.1, dk, x, 73, z);
    for (let y = 6; y < 146; y += 12) { b.box(10, 0.8, 0.8, dk, 0, y, -4.5); b.box(10, 0.8, 0.8, dk, 0, y, 4.5); b.box(0.8, 0.8, 10, dk, -4.5, y, 0); b.box(0.8, 0.8, 10, dk, 4.5, y, 0); b.box(12.6, 0.6, 0.6, dk, 0, y + 6, 4.5, 0, 0, 0.75); b.box(0.6, 0.6, 12.6, dk, -4.5, y + 6, 0, 0.75); }
    b.box(14, 4, 14, 0x2a2b2e, 0, 2, 0); b.box(3, 6, 3, 0x5a5c60, 0, 149, 0); tower.add(b.mesh(lam(0x101114))); }
  const arms = [-1, 1].map(s => { const piv = new THREE.Group(); piv.position.set(s * 5, 112, 5); tower.add(piv); const b = builder(); b.box(2.2, 3.2, 34, 0x3c3e42, 0, 0, 17); b.box(2.2, 1.2, 6, 0x9a9ca0, -s * 1.2, 1.6, 30); piv.add(b.mesh(lam(0x101114))); return { piv, s }; });
  const ship = new THREE.Group(); set.add(ship);
  { const b = builder(), st = 0xd4d8dc, tile = 0x1d1d20; b.cyl(4.5, 4.5, 36, 14, st, 0, 18, 0); b.add(new THREE.CylinderGeometry(4.56, 4.56, 36, 14, 1, true, 0, Math.PI), tile, 0, 18, 0);
    b.add(new THREE.LatheGeometry([0, 0.3, 0.55, 0.75, 0.9, 1].map((k, i) => new THREE.Vector2(4.5 * Math.sqrt(1 - Math.pow(i / 5, 1.6)) + 0.01, k * 14)), 14), st, 0, 36, 0);
    for (const s of [-1, 1]) { b.box(0.6, 9, 6.5, st, s * 6.6, 4.8, 0, 0, 0, s * 0.05); b.box(0.5, 5.5, 3.5, st, s * 5.6, 41, 0, 0, 0, s * 0.18); }
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; b.cyl(1.0, 1.4, 2.2, 8, 0x2a2a2c, Math.cos(a) * 1.8, -0.9, Math.sin(a) * 1.8); }
    ship.add(b.mesh(lam(0x3a3e44))); }
  const plume = new THREE.Group(); ship.add(plume);
  const pm = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.7, 1.0), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const core = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.5, 2.2), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  { const c1 = new THREE.Mesh(new THREE.ConeGeometry(5, 60, 12, 1, true), pm); c1.rotation.x = Math.PI; c1.position.y = -31; plume.add(c1); const c2 = new THREE.Mesh(new THREE.ConeGeometry(2.6, 26, 10, 1, true), core); c2.rotation.x = Math.PI; c2.position.y = -14; plume.add(c2);
    const tc = document.createElement('canvas'); tc.width = tc.height = 64; const x = tc.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,210,1)'); gr.addColorStop(0.4, 'rgba(255,170,90,.5)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(tc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); halo.scale.set(40, 40, 1); halo.position.y = -4; plume.add(halo); }
  plume.visible = false;
  const blink = new THREE.Mesh(new THREE.SphereGeometry(1.4, 6, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.5, 0.1, 0.1), fog: false })); blink.position.y = 153; tower.add(blink);
  set.traverse(o => { o.frustumCulled = false; o.userData.egg = 1; });
  const st = { on: false, t: 0, done: false, warm: 45, rumble: null, op: null, k: 1, D: 470 };
  try { st.done = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
  const T = 26, CATCH = 0.82; // seconds; catch height as a fraction of the tower
  function lowestClear(c, dir) { const ray = new THREE.Raycaster(); ray.camera = camera; for (let e = 3; e <= 24; e += 1.5) { const d = dir.clone().multiplyScalar(Math.cos(e * Math.PI / 180)); d.y = Math.sin(e * Math.PI / 180); ray.set(c, d.normalize()); ray.far = 590; const objs = scene.children.filter(o => o !== set); if (!ray.intersectObjects(objs, true).some(h => h.object.visible !== false && !(h.object.material && h.object.material.transparent))) return e; } return 99; }
  function looking() { const cp = camera.position, f = camera.getWorldDirection(V()); for (const o of ops) { const d = Math.hypot(cp.x - o.c.x, cp.z - o.c.z); if (d > 8) continue; const fh = V(f.x, 0, f.z).normalize(); if (fh.dot(o.n) < 0.75) continue; if (!S.inView(o.c, 1.0)) continue; return o; } return null; }
  function launch(o, at) { const eye = at || camera.position.clone(); let dir = V(o.c.x - eye.x, 0, o.c.z - eye.z).normalize(); if (dir.dot(o.n) < 0.6) dir = o.n.clone().setY(0).normalize(); dir.applyAxisAngle(V(0, 1, 0), rand(-0.05, 0.05));
    const e0 = lowestClear(eye, dir); if (e0 > 20) return false; const eT = (e0 + 4.5) * Math.PI / 180; const H = (st.D * Math.tan(eT) - eye.y) / CATCH; st.k = clamp(H / 146, 0.25, 1.4);
    set.position.copy(eye).addScaledVector(dir, st.D).setY(0); set.scale.setScalar(st.k); set.lookAt(eye.x, 0, eye.z); st.side = V(dir.z, 0, -dir.x);
    if (st.rumble && st.rumble.stop) st.rumble.stop(0.2); st.rumble = null; st.on = true; st.t = 0; set.visible = true; st.op = o; arms.forEach(a => a.piv.rotation.y = a.s * 0.9); try { sessionStorage.setItem(KEY, '1'); } catch (e) {} st.done = true; E.found('starship'); return true; }
  function pose(t) { // ship position in tower-local units (set is scaled); y of the ship's base
    const catchY = 146 * CATCH - 34, top = 146 * 2.6;
    if (t < 9) { const k = t / 9, y = top + (catchY + 80 - top) * (k * (2 - k) * 0.6 + k * 0.4); ship.position.set(-60 * (1 - k) - 18, y, 22); ship.rotation.set(0, 0, Math.PI / 2 * 0.98); plume.visible = false; }
    else if (t < 12.5) { const k = (t - 9) / 3.5; ship.position.set(-18 * (1 - k * 0.6), catchY + 80 - k * 30, 22 - k * 6); ship.rotation.set(0, 0, Math.PI / 2 * (1 - ease(k))); plume.visible = true; }
    else if (t < 21) { const k = (t - 12.5) / 8.5, e = 1 - Math.pow(1 - k, 2.2); ship.position.set(-7.2 * (1 - e), catchY + 50 - 50 * e, 16 - 1 * e); ship.rotation.set(0, 0, 0); plume.visible = true; }
    else { ship.position.set(0, catchY - Math.max(0, Math.sin((t - 21) * 4) * 0.4 * Math.max(0, 1 - (t - 21) / 2)), 15); ship.rotation.set(0, 0, 0); plume.visible = t < 21.6; }
    const ac = t < 20 ? 0.9 : t < 22 ? 0.9 - (t - 20) / 2 * 0.87 : 0.03; arms.forEach(a => a.piv.rotation.y = a.s * ac); }
  function update(dt, tm) { blink.visible = Math.sin(tm * 3) > 0.6;
    if (!st.on) { if (st.done || E.isRealm()) return; if ((st.warm -= dt) > 0) return; const o = looking(); if (o && Math.random() < dt / 12) launch(o); return; }
    if (E.isRealm()) { set.visible = false; st.on = false; if (st.rumble && st.rumble.stop) st.rumble.stop(0.3); st.rumble = 'done'; return; }
    st.t += dt; pose(st.t);
    if (plume.visible) { const f = 0.85 + Math.random() * 0.3; plume.scale.set(1, f, 1); pm.opacity = 0.7 + Math.random() * 0.25; }
    if (st.t > 10.4 && !st.rumble && st.t < 21) st.rumble = A.loop({ f: 38, type: 'sawtooth', vol: 0.05, lp: 140, noise: 0.8 });
    if (st.rumble && st.rumble !== 'done' && st.t > 21.8) { st.rumble.stop(1.5); st.rumble = 'done'; }
    if (st.t > T + 25 && !S.inView(set.position.clone().setY(60 * st.k), 1)) { set.visible = false; st.on = false; } }
  return { name: 'starship', group: set, anchor: null, update, launch: (i = 0, fromView = true) => { st.done = false; st.warm = 0; const o = ops[i] || ops[0]; return launch(o, fromView ? o.c.clone().addScaledVector(o.n, -2.2).setY(1.6) : null); }, seek: t => { st.t = t; pose(t); }, get t() { return st.t; }, get active() { return st.on; }, openings: ops,
    view: () => { const o = st.op || ops[0]; return { from: o.c.clone().addScaledVector(o.n, -2.2).setY(1.6), to: set.position.clone().setY(set.position.y + 120 * st.k) }; } };
}
