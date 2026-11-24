// #306 (preview): sticker bot. Loads public/sticker306/sticker-bot.glb (v3 pod, THREE legs: Visual overnight
// rebuild, Leg_4 removed, meshopt+quantized 85,016 B; see gallery-courtyard/STICKER-306.md). Sits on a small plinth beside the
// Neural Dance wall, off every walkway (candidate spots are rejected if not walkable, within 1.4 m of a path/ring, or blocking
// sight to art). Click/tap the Button (or press E within 2.5 m): button dips, a strip of 3 real sticker-art
// decals (TJ's metallic stickers: el-zonte-at-dawn, honeybadger-and-cub, warszawska-syrenka; #465) feeds out of SlotMouth then drops to the floor; capped at 12 strips. Beam = simple additive cone from
// ProjectorLens toward Neural Dance (#465: aim = projection art, else the neuralDance mesh bbox center, re-resolved after the GLB loads; short forward stub only if neither exists). Sound: one soft
// WebAudio blip, never when game.holo.muted. Self-contained: own rAF, own listeners; no edits to the GLB.
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'; // meshopt (same as ostrichbot.js)
export function installStickerBot306({ game, W, root, low }) {
  const st = window.__stickerBot306 = { state: 'init', presses: 0, strips: 0, legs: 3, specLegs: 3 };
  if (!game || !game.camera || !root) { st.state = 'no-game'; return st; }
  const THREE = game.THREE, BASE = import.meta.env.BASE_URL + 'sticker306/', cam = game.camera, canvas = game.renderer.domElement;
  const ndArt = (W.art || []).find(a => a.src && a.src.kind === 'projection');
  const paths = [...(W.paths || []), ...(W.rings || [])].filter(p => p.x0 != null);
  const segD = (px, pz, p) => { const dx = p.x1 - p.x0, dz = p.z1 - p.z0, L = dx * dx + dz * dz || 1e-9; let t = ((px - p.x0) * dx + (pz - p.z0) * dz) / L; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - p.x0 - t * dx, pz - p.z0 - t * dz); };
  const ok = (x, z) => { const walk = W.walkable ? W.walkable(x, z) : true; if (!walk) return false; if (W.inDoorZone && W.inDoorZone(x, z, 0.7)) return false; /* #778 rotated nest: never in a doorway */ if (W.inView && W.inView(x, z, 0.7)) return false; /* #785: never in front of art */ for (const p of paths) if (segD(x, z, p) < 1.4) return false;
    if (game.tags && game.tags.blocksSight && game.tags.blocksSight(x, z, 0.6)) return false; for (const c of W.colliders || []) if (c.x != null && Math.hypot(c.x - x, c.z - z) < (c.r || 0.5) + 0.9) return false; return true; };
  // candidates: beside the Neural Dance wall (both sides, 2-4 m out), else first courtyard edge
  const cand = [];
  if (ndArt) { const L = Math.hypot(ndArt.ix, ndArt.iz) || 1, ix = ndArt.ix / L, iz = ndArt.iz / L, tx = iz, tz = -ix;
    for (const out of [2.2, 3, 4]) for (const s of [1, -1]) for (const side of [ndArt.w / 2 + 0.9, ndArt.w / 2 + 1.8]) cand.push([ndArt.x + ix * out + tx * side * s, ndArt.z + iz * out + tz * side * s]); }
  const ct = (W.courtyards || W.rooms || []).find(r => r.center); if (ct) for (const [dx, dz] of [[4, 4], [-4, 4], [4, -4], [-4, -4]]) cand.push([ct.center[0] + dx, ct.center[1] + dz]);
  for (const r of (W.rooms || []).filter(r => r.open && r.center)) for (const [dx, dz] of [[3, 0], [-3, 0], [4.5, 1.5], [-4.5, 1.5], [0, 2], [0, -2]]) cand.push([r.center[0] + dx, r.center[1] + dz]); // #785: open courts as fallback spots
  const spot = cand.find(([x, z]) => ok(x, z)); if (!spot) { st.state = 'no-spot'; st.tried = cand.length; return st; }
  const g = new THREE.Group(); g.name = 'stickerBot306'; g.position.set(spot[0], 0, spot[1]); root.add(g);
  // #465: resolve aim (1) projection art, (2) neuralDance mesh/group world bbox center, (3) stub
  const resolveTarget = () => { if (ndArt) { st.aimFrom = 'art'; return new THREE.Vector3(ndArt.x, ndArt.y || 1.6, ndArt.z); }
    const o = root.getObjectByName('neuralDance'); if (!o) return null; o.updateWorldMatrix(true, true);
    const bb = new THREE.Box3().setFromObject(o), c = new THREE.Vector3(); if (!bb.isEmpty()) bb.getCenter(c); else o.getWorldPosition(c);
    if (!bb.isEmpty() && c.y < 0.3) c.y = 1.6; st.aimFrom = 'mesh'; return c; };
  let target = resolveTarget();
  const faceTarget = () => { if (target) g.rotation.y = Math.atan2(target.x - spot[0], target.z - spot[1]) + Math.PI / 2; }; // lens sits on +x of the pod
  faceTarget(); st.pos = [+spot[0].toFixed(2), +spot[1].toFixed(2)]; st.aim = target ? 'neural-dance' : 'stub';
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.72, 0.7), new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.8 })); plinth.position.y = 0.36; g.add(plinth);
  if (game.tags && game.tags.addCollider) game.tags.addCollider({ kind: 'box306', x: spot[0], z: spot[1], r: 0.7 });
  const bot = new THREE.Group(); bot.position.y = 0.72; g.add(bot);
  const strips = [], texs = ['el-zonte-at-dawn', 'honeybadger-and-cub', 'warszawska-syrenka'].map(n => { const t = new THREE.TextureLoader().load(BASE + n + '.webp'); t.colorSpace = THREE.SRGBColorSpace; return t; });
  // #307 (Visual #478): Neural Dance vinyl pose stickers (10, alpha die-cut) from R2; the painting stand-ins above stay as the fallback if they fail to load
  const NB = import.meta.env.BASE_URL + 'img/play/preview-251/sticker306/neural/', neural = []; st.neural = { ok: 0, err: 0 };
  for (let i = 1; i <= 10; i++) { const n = 'pose-' + String(i).padStart(2, '0') + (low ? '.phone' : '') + '.webp';
    new THREE.TextureLoader().load(NB + n, t => { t.colorSpace = THREE.SRGBColorSpace; neural.push({ t, a: t.image.width / t.image.height }); st.neural.ok++; }, undefined, () => { st.neural.err++; }); }
  const pick = i => neural.length ? neural[(Math.random() * neural.length) | 0] : { t: texs[i], a: 1 };
  let button = null, mouth = null, lens = null, beam = null, press = 0, ac = null;
  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(BASE + 'sticker-bot-meshopt.glb', gl => { const m = gl.scene; bot.add(m); m.traverse(o => { if (o.isMesh) o.castShadow = !low; });
    button = m.getObjectByName('Button'); mouth = m.getObjectByName('SlotMouth') || m.getObjectByName('StickerSlot'); lens = m.getObjectByName('ProjectorLens') || m.getObjectByName('ProjectorGlass');
    if (!ndArt) { const t2 = resolveTarget(); if (t2) { target = t2; faceTarget(); g.updateWorldMatrix(true, true); st.aim = 'neural-dance'; } } // re-aim from mesh after load
    const oldBeam = m.getObjectByName('ProjectorBeam'); if (oldBeam) oldBeam.visible = false;
    st.legsFound = ['Leg_1', 'Leg_2', 'Leg_3'].filter(n => m.getObjectByName(n)).length;
    // beam: open cone from lens to the wall (length capped 12 m), additive, no depth write
    const from = new THREE.Vector3(); (lens || bot).getWorldPosition(from); const to = target ? target.clone() : from.clone().add(new THREE.Vector3(1, 0.15, 0).applyQuaternion(g.quaternion));
    const len = Math.min(12, from.distanceTo(to)); const geo = new THREE.ConeGeometry(target ? Math.min(1.2, len * 0.12) : 0.15, len, low ? 12 : 24, 1, true); geo.translate(0, -len / 2, 0); geo.rotateX(-Math.PI / 2);
    beam = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.copy(from); beam.lookAt(to); beam.rotateY(Math.PI); beam.name = 'beam306'; root.add(beam); // cone tip at lens, mouth at wall
    st.state = 'ready'; }, undefined, e => { st.state = 'load-error'; st.err = String(e); console.warn('[sticker306]', e); });
  function blip() { if (game.holo && game.holo.muted) { st.mutedSkips = (st.mutedSkips || 0) + 1; return; }
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), v = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(880, ac.currentTime); o.frequency.exponentialRampToValueAtTime(440, ac.currentTime + 0.25);
      v.gain.setValueAtTime(0.05, ac.currentTime); v.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.3); o.connect(v).connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.32); } catch (e) {} }
  function feed() { if (!button || press > 0) return; st.presses++; press = 0.35; blip();
    if (strips.length >= 12) { const old = strips.shift(); root.remove(old.s); }
    const s = new THREE.Group(); for (let i = 0; i < 3; i++) { const k = pick(i), hh = 0.075, ww = Math.min(0.08, hh * k.a); const p = new THREE.Mesh(new THREE.PlaneGeometry(ww, hh), new THREE.MeshBasicMaterial({ map: k.t, side: THREE.DoubleSide, transparent: k.a !== 1 || neural.length > 0, alphaTest: 0.4 })); p.position.x = (i - 1) * 0.085; s.add(p); }
    const back = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.09), new THREE.MeshBasicMaterial({ color: 0xf5f2ea, side: THREE.DoubleSide })); back.position.z = -0.001; s.add(back);
    const p0 = new THREE.Vector3(); (mouth || bot).getWorldPosition(p0); s.position.copy(p0); s.quaternion.copy(g.quaternion); s.rotateX(-Math.PI / 2); root.add(s);
    const out = new THREE.Vector3(0, 0, 1).applyQuaternion(g.quaternion); strips.push({ s, t: 0, out, vy: 0, p0 }); st.strips = strips.length; }
  // #307: let stickerWalls307 see landed strips and take one off the floor
  st.landed = () => strips.filter(q => q.done); st.take = q => { const i = strips.indexOf(q); if (i < 0) return false; strips.splice(i, 1); root.remove(q.s); st.strips = strips.length; return true; }; st.texs = texs; st.neuralTexs = neural; st.feed = () => feed(); // #307 test hook
  const ray = new THREE.Raycaster(), nv = new THREE.Vector2(); let down = null;
  canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; }, true);
  canvas.addEventListener('pointerup', e => { if (!button || !down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8) return; const r = canvas.getBoundingClientRect();
    nv.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(nv, cam); ray.far = 4;
    const h = ray.intersectObject(bot, true)[0]; if (!h) return; let o = h.object, hit = false; while (o) { if (o === button || /^Button/.test(o.name)) { hit = true; break; } o = o.parent; } if (hit || h.distance < 2.5) { feed(); e.stopPropagation(); } }, true);
  addEventListener('keydown', e => { if (e.key !== 'e' && e.key !== 'E') return; if (cam.getWorldPosition(new THREE.Vector3()).distanceTo(g.position) < 2.5) feed(); });
  let last = performance.now(); const bY = () => button && (button.userData.y0 ??= button.position.y);
  (function tick() { requestAnimationFrame(tick); const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (button) { const y0 = bY(); if (press > 0) press = Math.max(0, press - dt); button.position.y = y0 - (press > 0.2 ? 0.006 : 0); }
    if (beam) beam.material.opacity = 0.05 + Math.sin(now / 600) * 0.02 + (press > 0 ? 0.05 : 0);
    for (const q of strips) { if (q.done) continue; q.t += dt;
      if (q.t < 0.8) q.s.position.copy(q.p0).addScaledVector(q.out, q.t * 0.25); // feed out of slot
      else { q.vy -= 9.8 * dt; q.s.position.y = Math.max(0.005, q.s.position.y + q.vy * dt); q.s.position.addScaledVector(q.out, dt * 0.3); q.s.rotation.z += dt * 2;
        if (q.s.position.y <= 0.005) { q.s.rotation.set(-Math.PI / 2, 0, q.s.rotation.z); q.done = true; } } } })();
  st.state = 'loading'; return st;
}
