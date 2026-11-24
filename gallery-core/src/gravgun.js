// Shared "gravity gun" for the TJM galleries (tjm.art/play, Orsay, Bilbao, Uffizi, ...), after Half-Life 2's tool.
import { swapToolGLB } from './toolglb.js';
// Canonical copy: /workspace/museum-shared/gravgun.js; each project keeps a verbatim copy at src/gravgun.js.
//  - primary (click / GRAB): pull the aimed painting in, it floats in front of you; click again (HANG) hangs it, true size,
//    on the open wall you face. Placement is checked with the same rules as tests/audit.mjs: solid wall behind the whole
//    frame (15 samples) and no overlap with another frame. A green/red ghost previews it.
//  - secondary (right-click / LAUNCH): fling the held (or aimed) painting; it lands, slides and leans on a wall or lies on
//    the floor, and can be grabbed again. Launched paintings are local only, never saved.
//  - TJ-only save: ?key=... shows SAVE LAYOUT / RESET TO DEFAULT; every visitor loads the saved hung layout on start.
import * as THREE from 'three';
export const GRAV = { name: 'GRAVITY GUN', slot: 'Gravity Gun', api: 'https://tjm-play-layouts.timothyjosephmurphy.workers.dev' };
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export function buildGravGun(g) { // orange glowing emitter on a dark body with prongs
  const dark = new THREE.MeshLambertMaterial({ color: 0x3a3c40, flatShading: true }), mid = new THREE.MeshLambertMaterial({ color: 0x8a8e94, flatShading: true });
  const glow = new THREE.MeshBasicMaterial({ color: 0xff8a1e }), core = new THREE.MeshBasicMaterial({ color: 0xffd27a });
  const add = (geo, m, x, y, z, rx = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); g.add(o); return o; };
  add(new THREE.BoxGeometry(0.16, 0.14, 0.36), dark, 0, 0, 0.02);
  add(new THREE.CylinderGeometry(0.075, 0.09, 0.14, 8), mid, 0, 0, -0.2, Math.PI / 2);
  for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + Math.PI / 2; const pr = add(new THREE.BoxGeometry(0.025, 0.025, 0.2), mid, Math.cos(a) * 0.075, Math.sin(a) * 0.075, -0.33); pr.rotation.set(Math.sin(a) * 0.35, -Math.cos(a) * 0.35, 0); }
  const em = add(new THREE.SphereGeometry(0.045, 10, 8), core, 0, 0, -0.29); const ring = add(new THREE.TorusGeometry(0.06, 0.012, 6, 16), glow, 0, 0, -0.27);
  add(new THREE.BoxGeometry(0.17, 0.02, 0.2), glow, 0, 0.08, 0.04); add(new THREE.BoxGeometry(0.06, 0.14, 0.07), dark, 0, -0.12, 0.12);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: 0xff9a3a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.set(0.3, 0.3, 1); halo.position.set(0, 0, -0.3); g.add(halo);
  g.userData.grav = { em, ring, halo, glow };
  swapToolGLB(g, 'gravgun', get => { const e = get('em'), r = get('ring'); if (!e || !r) return false; const h = get('halo'); if (h) halo.position.copy(h.position);
    g.userData.grav = { em: e, ring: r, halo, glow: (get('glow') && get('glow').material) || glow }; }, [halo]); return g;
}
function haloTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,220,150,1)'); gr.addColorStop(0.4, 'rgba(255,140,40,.5)'); gr.addColorStop(1, 'rgba(255,100,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
export function gravPose(g, t, holding, kick) { const u = g.userData.grav; if (!u) return; const p = 1 + 0.12 * Math.sin(t * 9) + (holding ? 0.25 : 0) + kick * 0.8;
  u.halo.scale.set(0.26 * p, 0.26 * p, 1); u.ring.rotation.z = t * (holding ? 9 : 3); u.em.scale.setScalar(0.9 + 0.2 * Math.sin(t * 23)); g.rotation.x += kick * 0.35; g.position.z += kick * 0.06; }

export function createGravGun(o) {
  const VOL = o.volume != null ? o.volume : (GRAV.volume != null ? GRAV.volume : 1); // optional master volume (backward compatible)
  const { scene, camera, paintings, say, isMuted, walkable, roomAt, gallery } = o; let walls = null, held = null, kick = 0, ghost = null, preview = null;
  const flying = [], ray = new THREE.Raycaster(), own = () => { const s = new Set(); paintings.forEach(q => q.group.traverse(c => s.add(c))); return s; };
  const wallMeshes = () => { if (walls) return walls; const s = own(); walls = []; scene.traverse(m => { if (m.isMesh && !s.has(m) && m.geometry && (m.geometry.type === 'BoxGeometry' || (o.wallTest && o.wallTest(m))) && !(m.material && m.material.transparent) && m.visible !== false) walls.push(m); }); return walls; };
  const grabTargets = () => paintings.filter(p => !p.noGrab && (p.state === 'wall' && p.group.visible) || p.state === 'floor' || p.state === 'trolley').flatMap(p => [p.mesh, p.frame]);
  const aimPainting = (far = 12) => { camera.updateMatrixWorld(); ray.setFromCamera(new THREE.Vector2(0, 0), camera); ray.far = far; const h = ray.intersectObjects(grabTargets(), false)[0]; const hp = h && h.object.userData.p ? h.object.userData.p : (h ? paintings.find(p => p.mesh === h.object || p.frame === h.object) : null);
    /* #831: forgiving grab off the guide bot's cart - nearest stowed painting within 0.45 m of the aim ray (<=5 m) wins over a miss / a farther hit */
    if (!hp || hp.state !== 'trolley') { let best = null, bd = 0.45, bt = 0; const c = new THREE.Vector3(), q = new THREE.Vector3(); for (const p of paintings) { if (p.state !== 'trolley' || p.noGrab) continue; p.mesh.getWorldPosition(c); const t = c.clone().sub(ray.ray.origin).dot(ray.ray.direction); if (t < 0.2 || t > Math.min(5, far)) continue; ray.ray.at(t, q); const d = q.distanceTo(c); if (d < bd) { bd = d; best = p; bt = t; } } if (best && (!h || bt <= h.distance + 0.3)) { ray.far = Infinity; return best; } }
    ray.far = Infinity; return hp; };
  // ---------- placement (same rules as tests/audit.mjs) ----------
  const fits = (p, pos, n, w, h) => { const t = V(n.z, 0, -n.x), W = wallMeshes(); ray.far = 0.6;
    for (const u of [-0.48, -0.25, 0, 0.25, 0.48]) for (const v of [-0.45, 0, 0.45]) { const s = pos.clone().addScaledVector(t, u * w).add(V(0, v * h, 0)).addScaledVector(n, 0.25); ray.set(s, n.clone().negate()); if (!ray.intersectObjects(W, false).length) { ray.far = Infinity; return false; } }
    ray.far = Infinity;
    for (const q of paintings) { if (q === p || q.state !== 'wall') continue; const d = q.data, qn = V(d.ix, 0, d.iz); if (qn.dot(n) < 0.99) continue;
      const dx = d.x - pos.x, dz = d.z - pos.z, perp = Math.abs(dx * n.x + dz * n.z), al = Math.abs(dx * t.x + dz * t.z); if (perp > 0.4) continue;
      if (al < (q.w + w) / 2 + 0.05 && Math.abs(d.y - pos.y) < (q.h + h) / 2 + 0.02) return false; }
    return true; };
  const placement = p => { camera.updateMatrixWorld(); ray.setFromCamera(new THREE.Vector2(0, 0), camera); ray.far = 9; const hit = ray.intersectObjects(wallMeshes(), false)[0]; ray.far = Infinity; if (!hit || !hit.face) return null;
    const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld); if (Math.abs(n.y) > 0.3) return null; n.y = 0; n.normalize();
    if (n.dot(camera.getWorldDirection(V())) > 0) return null;
    const w = p.w, h = p.h, yMin = h / 2 + 0.05; let yMax = hit.point.y; /* #830: free wall height, only floor/ceiling clearance */
    try { const box = new THREE.Box3().setFromObject(hit.object); if (Number.isFinite(box.max.y)) yMax = box.max.y - h / 2 - 0.05; } catch (e) {}
    if (!(yMax > yMin)) yMax = yMin + 0.01;
    const y = Math.max(yMin, Math.min(hit.point.y, yMax)), pos = V(hit.point.x, y, hit.point.z).addScaledVector(n, 0.035);
    return { pos, n, ok: fits(p, pos, n, w, h) }; };
  const ghostFor = p => { if (ghost) { scene.remove(ghost); ghost.traverse(c => c.geometry && c.geometry.dispose()); }
    ghost = new THREE.Group(); const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), new THREE.MeshBasicMaterial({ color: 0x30ff60, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }));
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(p.w, p.h)), new THREE.LineBasicMaterial({ color: 0x30ff60 })); ghost.add(m, e); ghost.userData = { m, e }; ghost.visible = false; ghost.renderOrder = 9; scene.add(ghost); };
  // ---------- actions ----------
  const remember = p => { if (!p.home) p.home = { x: p.data.x, y: p.data.y, z: p.data.z, ix: p.data.ix, iz: p.data.iz, room: p.data.room, wall: p.data.wall }; };
  // #830: held painting see-through so the ghost shows; originals stored once on p._gravMat, restored on every exit path
  const seeThrough = p => { if (p._gravMat) return; const L = []; p.group.traverse(c => { if (!c.isMesh || !c.material) return; const orig = c.material, mk = m => { const k = m.clone(); k.transparent = true; k.opacity = Math.min(m.opacity, 0.34); k.depthWrite = false; return k; };
    L.push({ c, orig }); c.material = Array.isArray(orig) ? orig.map(mk) : mk(orig); }); p._gravMat = L; }; // clones, so shared frame materials on other paintings stay solid
  const solid = p => { if (!p || !p._gravMat) return; for (const x of p._gravMat) { const cur = x.c.material; x.c.material = x.orig; for (const m of (Array.isArray(cur) ? cur : [cur])) if (m !== x.orig) m.dispose(); } p._gravMat = null; };
  function grab(p) { remember(p); if (p.group.parent && p.group.parent !== scene) scene.attach(p.group); /* off the #213 trolley */ const i = flying.findIndex(f => f.p === p); if (i >= 0) flying.splice(i, 1); p.state = 'held'; p.group.visible = true; held = { p, t: 0, from: p.group.position.clone() }; ghostFor(p); seeThrough(p); kick = 1; zap(0.5); say('GRABBED · CLICK TO HANG · RIGHT-CLICK TO LAUNCH', 2.5); }
  function hang() { const p = held.p, pl = placement(p); if (!pl || !pl.ok) { say(pl ? 'NO ROOM THERE: OVERLAP OR DOORWAY' : 'AIM AT A WALL', 1.6); buzz(); return false; }
    if (lockHook()?.at?.(pl.pos, pl.n)) { say('WALL LOCKED', 1.4); buzz(); return false; }
    const d = p.data; Object.assign(d, { x: pl.pos.x, y: pl.pos.y, z: pl.pos.z, ix: +pl.n.x.toFixed(4), iz: +pl.n.z.toFixed(4) }); const r = roomAt ? roomAt(d.x, d.z) : null; d.room = p.room = r && r.id ? r.id : d.room; d.wall = Math.abs(d.ix) > Math.abs(d.iz) ? (d.ix > 0 ? 'W' : 'E') : (d.iz > 0 ? 'S' : 'N');
    p.group.position.set(d.x, d.y, d.z); p.group.rotation.set(0, Math.atan2(d.ix, d.iz), 0); p.state = 'wall'; p.moved = true; solid(p); held = null; if (ghost) ghost.visible = false; kick = 1; zap(0.9); say('HUNG', 1.2); return true; }
  function drop() { if (!held) return null; const p = held.p; solid(p); held = null; if (ghost) ghost.visible = false; return p; } // let go without hanging (the #212 picker swaps what is held)
  function launch(p) { if (!p) { p = aimPainting(9); if (!p) return; remember(p); p.state = 'held'; }
    const dir = camera.getWorldDirection(V()); const pos = held && held.p === p ? p.group.position.clone() : p.group.position.clone();
    flying.push({ p, pos, v: dir.multiplyScalar(13).add(V(0, 2.2, 0)), spin: V((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6), phase: 'air' });
    p.state = 'flying'; p.moved = false; solid(p); held = null; if (ghost) ghost.visible = false; kick = 1.4; zap(1.2); say('LAUNCHED', 1); }
  // #213: a gallery can take the held painting somewhere other than a wall (the guide bot's trolley): dropHook(p) returns true if it did
  let dropHook = null;
  function place() { if (!held) return false; const p = held.p; if (dropHook && dropHook(p)) { solid(p); held = null; if (ghost) ghost.visible = false; kick = 1; zap(0.6); say('ON THE TROLLEY', 1.2); return true; } return hang(); }
  function primary() { if (held) return place(); const p = aimPainting(12); if (!p) { say('AIM AT A PAINTING', 1.2); return false; } if (p.state === 'wall' && lockHook()?.painting?.(p)) { say('WALL LOCKED', 1.4); buzz(); return false; } grab(p); return true; }
  function lockHook() { return o.wallLocks || (gallery === 'tags' ? window.__wallLocks : null); } // #856 optional; museums have none
  function secondary() { if (held) launch(held.p); else launch(null); }
  // ---------- per frame ----------
  function update(dt, active) { const t = performance.now() / 1000; kick = Math.max(0, kick - dt * 4); hum(active, !!held);
    if (held) { const p = held.p; held.t = Math.min(1, held.t + dt * 3.5); const dir = camera.getWorldDirection(V()), tgt = camera.position.clone().addScaledVector(dir, 1.3 + Math.max(p.w, p.h) * 0.55); tgt.y -= 0.1 + Math.sin(t * 2) * 0.03;
      p.group.position.lerpVectors(held.from, tgt, held.t * held.t * (3 - 2 * held.t)); if (held.t >= 1) held.from.copy(tgt); p.group.rotation.set(0, Math.atan2(-dir.x, -dir.z) + Math.sin(t * 1.3) * 0.05, Math.sin(t * 1.7) * 0.03);
      const pl = active ? placement(p) : null; if (ghost) { ghost.visible = !!pl; if (pl) { ghost.position.copy(pl.pos).addScaledVector(pl.n, 0.01); ghost.rotation.set(0, Math.atan2(pl.n.x, pl.n.z), 0); const c = pl.ok && !lockHook()?.at?.(pl.pos, pl.n) ? 0x30ff60 : 0xff3030; ghost.userData.m.material.color.setHex(c); ghost.userData.e.material.color.setHex(c); } }
      preview = pl; if (!active) { /* switched tool: drop it where it floats */ launchSoft(p); } }
    for (let i = flying.length - 1; i >= 0; i--) { const f = flying[i], p = f.p, g = p.group, hh = p.h / 2;
      if (f.phase === 'air') { f.v.y -= 9.8 * dt; const nx = f.pos.x + f.v.x * dt, nz = f.pos.z + f.v.z * dt;
        if (!walkable(nx, nz)) { const n = wallNormal(f.pos, f.v); f.wall = n; f.v.set(0, Math.min(0, f.v.y), 0); f.phase = 'slide'; }
        else { f.pos.x = nx; f.pos.z = nz; } f.pos.y += f.v.y * dt; g.rotation.x += f.spin.x * dt; g.rotation.y += f.spin.y * dt; g.rotation.z += f.spin.z * dt;
        if (f.pos.y < 0.05 + 0.02) { f.pos.y = 0.05; f.phase = 'floor'; f.v.y = 0; } }
      else if (f.phase === 'slide') { f.v.y -= 9.8 * dt; f.pos.y = Math.max(hh * Math.cos(0.2), f.pos.y + f.v.y * dt); const n = f.wall || V(0, 0, 1);
        g.rotation.set(-0.2, Math.atan2(n.x, n.z), 0, 'YXZ'); const back = hh * Math.sin(0.2) + 0.06, base = f.pos.clone(); base.addScaledVector(n, 0); g.position.set(base.x + n.x * back, f.pos.y, base.z + n.z * back);
        if (f.pos.y <= hh * Math.cos(0.2) + 1e-3) { f.phase = 'rest'; } }
      if (f.phase === 'floor') { const sp = Math.hypot(f.v.x, f.v.z); const k = Math.max(0, sp - 6 * dt) / (sp || 1); f.v.x *= k; f.v.z *= k; const nx = f.pos.x + f.v.x * dt, nz = f.pos.z + f.v.z * dt; if (walkable(nx, nz)) { f.pos.x = nx; f.pos.z = nz; } else { f.v.set(0, 0, 0); }
        g.rotation.set(-Math.PI / 2, g.rotation.y, 0, 'YXZ'); if (sp < 0.05) f.phase = 'rest'; }
      if (f.phase !== 'slide') g.position.copy(f.pos);
      if (f.phase === 'rest') { p.state = 'floor'; flying.splice(i, 1); } }
  }
  function launchSoft(p) { solid(p); flying.push({ p, pos: p.group.position.clone(), v: V(0, 0, 0), spin: V(), phase: 'air' }); p.state = 'flying'; held = null; if (ghost) ghost.visible = false; }
  function wallNormal(pos, v) { const d = V(v.x, 0, v.z); if (d.lengthSq() < 1e-6) return V(0, 0, 1); d.normalize(); ray.set(V(pos.x, Math.max(0.5, pos.y), pos.z), d); ray.far = 3; const h = ray.intersectObjects(wallMeshes(), false)[0]; ray.far = Infinity;
    if (h && h.face) { const n = h.face.normal.clone().transformDirection(h.object.matrixWorld); n.y = 0; if (n.lengthSq() > 0.01) return n.normalize(); } return d.negate(); }
  // ---------- sound: hum + crackle (WebAudio, silent when muted) ----------
  let ac = null, humG = null, last = 0;
  function ctx() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; } catch (e) { return null; } }
  function hum(on, holding) { const m = isMuted && isMuted(); if (!on || m) { if (humG) humG.gain.setTargetAtTime(0, ac.currentTime, 0.05); return; } const a = ctx(); if (!a) return;
    if (!humG) { humG = a.createGain(); humG.gain.value = 0; humG.connect(a.destination); for (const [f, ty, g] of [[58, 'sine', 0.05], [117, 'sine', 0.018], [176, 'sine', 0.006]] /* soft hum (TJ: toned down) */) { const os = a.createOscillator(), og = a.createGain(), lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; os.type = ty; os.frequency.value = f; og.gain.value = g; os.connect(lp).connect(og).connect(humG); os.start(); } }
    humG.gain.setTargetAtTime((holding ? 0.3 : 0.14) * VOL, a.currentTime, 0.08); const now = a.currentTime; if (now - last > (holding ? 0.35 : 1.4) && Math.random() < (holding ? 0.3 : 0.08)) { last = now; noise(0.03 + Math.random() * 0.03, 1800 + Math.random() * 1200, (holding ? 0.022 : 0.01) * VOL); } }
  function noise(dur, f, vol) { const a = ctx(); if (!a || (isMuted && isMuted())) return; const b = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < 0.3 ? 1 : 0.2);
    const s = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 0.9; g.gain.value = vol; s.buffer = b; s.connect(bp).connect(g).connect(a.destination); s.start(); }
  function zap(k) { noise(0.08 * k + 0.04, 1200, 0.05 * k * VOL); const a = ctx(); if (!a || (isMuted && isMuted())) return; const os = a.createOscillator(), g = a.createGain(), t = a.currentTime; os.type = 'sine'; os.frequency.setValueAtTime(220, t); os.frequency.exponentialRampToValueAtTime(70, t + 0.25); g.gain.setValueAtTime(0.025 * k * VOL, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); os.connect(g).connect(a.destination); os.start(t); os.stop(t + 0.32); }
  function buzz() { noise(0.14, 380, 0.04 * VOL); }
  // ---------- layout: serialize / apply / TJ-only save ----------
  const serialize = () => { const moves = {}; paintings.forEach(p => { if (p.moved && p.state === 'wall') { const d = p.data; moves[d.id] = { x: +d.x.toFixed(3), y: +d.y.toFixed(3), z: +d.z.toFixed(3), ix: d.ix, iz: d.iz, room: d.room, wall: d.wall }; } }); return { v: 1, gallery, moves }; };
  function apply(layout) { let n = 0; const mv = (layout && layout.moves) || {}; for (const id in mv) { const p = paintings.find(q => q.data.id === id), m = mv[id]; if (!p || p.state !== 'wall' || ![m.x, m.y, m.z, m.ix, m.iz].every(Number.isFinite)) continue; remember(p);
      Object.assign(p.data, { x: m.x, y: m.y, z: m.z, ix: m.ix, iz: m.iz, room: m.room || p.data.room, wall: m.wall || p.data.wall }); p.room = p.data.room; p.group.position.set(m.x, m.y, m.z); p.group.rotation.set(0, Math.atan2(m.ix, m.iz), 0); p.moved = true; n++; }
    if (gallery === "tags" && layout && layout.saved === "2026-10-30T23:53:36.616Z" && paintings.length > 305 && paintings[305].data.id === "book-art-616ff8378f27047b4a91") {
      for (const e of "237:0:-13 238:0:46 239:-9:0 240:6:70 243:-7:-16 244:2:-18 245:18:5 246:13:34 248:-10:1 249:-4:2 250:5:1 251:-10:-7 252:15:-29 253:5:-46 254:-4:2 255:-11:6 256:-6:-32 257:7:9 261:-19:3 263:10:17 264:-11:-8 265:3:5 266:12:-24 270:-6:-3 274:0:-4 241:0:40 242:11:7 247:-12:-7 258:11:-3 259:-7:0 260:7:0 262:0:-61 267:0:45 268:-12:3 269:0:5 271:0:8 272:0:-11 273:0:-25 2:0:-17 150:-2:51 152:5:0 168:0:-9 169:0:-16 170:0:-9 1:-13:0 280:0:15 281:0:-30 7:-548:-143 172:0:-76 288:0:-195 66:12:0 68:-22:0 69:10:40 89:1:53 92:-5:0 153:-44:4 154:0:6 155:62:-19 156:0:8 157:0:-24 159:23:-26 160:0:6 161:0:12 162:8:-30 163:20:-7 164:-1:-6 165:-7:-6 166:-23:-10 167:-9:-3 120:0:-237 200:-33:-279 205:0:-285 31:0:-15 35:0:16 192:0:-5 193:3:5 196:0:4 197:-3:-5 22:0:47 34:0:-23 194:8:0 195:-11:0 198:0:16 199:3:0 290:0:-41 23:-420:-133 27:-68:-156 30:-212:-145 33:0:-139 50:-526:-154 297:0:-113 25:-9:-1 26:9:-1 37:0:-12 38:0:-12 59:0:24 122:7:-24 123:-6:-33 124:-18:2 125:-4:23 126:4:27 127:18:5 36:-209:0 135:-72:0 136:660:0 137:226:0 41:0:-4 82:0:34 142:0:-12 275:0:12 278:0:5 302:0:-11 303:0:-11 304:0:-11 216:-26:0 217:-67:0 218:-92:0 10:5:9 20:0:13 32:21:5 52:0:-13 53:-22:27 130:-6:-28 131:0:-13 46:5:-3 47:-3:4 48:3:-12 49:-5:12 44:0:-6 45:0:3 54:0:-7 111:-12:6 118:12:0 128:0:4 8:-77:8 9:0:-7 51:0:-30 56:0:20 57:12:0 61:51:-14 63:0:22 64:0:-10 71:20:-21 101:-59:141 102:-29:123 103:14:-4 104:59:162 105:0:83 107:-2:71 108:-31:10 109:-34:127 188:-28:-14 189:-44:8 190:59:11 191:0:-23 229:0:79 230:-10:144 231:16:-23 232:0:77 233:2:21 234:43:4 283:19:-14 285:-31:-30 287:31:84 292:-42:21 176:0:-31 177:0:-31 178:-42:-31 179:31:-31 180:14:5 181:13:5 182:60:5 183:36:5 184:62:0 185:-14:0 186:-19:0 187:-65:0 55:24:45 58:-24:-35 65:9:-7 70:12:-57 72:-13:-85 138:0:-21 140:0:3 141:51:10 145:-12:-13 146:-36:-13 147:-15:13 148:-30:56 291:0:10 75:0:25 76:0:46 77:0:15 79:14:0 80:0:64 81:0:-29 83:0:-26 133:0:-60 134:-15:-39 298:0:-120 299:59:-125 300:0:-140 3:-23:1 5:24:-6 84:-4:6 85:-16:0 86:19:28 87:0:-29 78:0:-197 94:0:-207 296:-102:-250 93:-4:0 293:0:5 294:5:0 295:0:-6 13:0:-19 14:0:-36 29:0:52 129:0:-36 222:0:5 223:0:5 224:0:5 228:0:-56 282:0:82 95:0:-250 96:79:-250 99:0:-250 100:3:-250 62:0:-250 106:313:-250 171:0:-250 28:56:-261 73:0:-206 74:0:-260 119:5:0 210:-4:0 60:0:29 91:0:21 110:0:11 113:0:-10 114:0:-2 115:0:48 116:0:46 276:0:-2 289:0:-37 16:0:-83 17:0:-51 18:0:-84 19:0:-80 112:0:-49 117:0:-76 277:0:-61 143:0:23 144:0:28 173:0:22 174:0:52 175:0:62 206:0:-46 207:0:-46 208:0:-46 212:0:-46 0:0:18 4:0:14 11:9:0 12:-8:0 15:0:12 236:0:10 284:0:-56".split(" ")) {
        const [i, u, v] = e.split(":").map(Number), p = paintings[i], d = p.data;
        remember(p); d.x += d.iz * u / 1e3; d.z -= d.ix * u / 1e3; d.y += v / 1e3; p.group.position.set(d.x, d.y, d.z); p.moved = true;
      }
    }
    if (gallery === "tags" && layout && layout.saved === "2026-10-30T23:53:36.616Z") {
      for (const e of "6:painting-studio-figure:24.189:1.748:-7.085:0:1:room-10:4 8:archived-painting-416:24.264:1.206:-7.085:0:1:room-10:4 9:archived-painting-412:23.894:1.206:-7.085:0:1:room-10:4 56:archived-painting-369:24.667:0.81:-7.085:0:1:room-10:4 57:archived-painting-371:26.4:1.537:-7.085:0:1:room-10:4 101:book-art-c04c7e48687fe35e65f5:24.885:2.357:-7.085:0:1:room-10:4 102:book-art-43a3f16ac35df7262254:26.4:2.357:-7.085:0:1:room-10:4 104:book-art-b38b9ae1893908d604da:25.736:2.357:-7.085:0:1:room-10:4 108:book-art-504e3fafdacd7c9bbcd0:25.736:0.945:-7.085:0:1:room-10:4 188:older-work-fernandez-moran-pysh-original-1:25.736:1.537:-7.085:0:1:room-10:4 189:older-work-fernandez-moran-pysh-original-2:25.254:1.537:-7.085:0:1:room-10:4 190:older-work-fernandez-moran-pysh-original-3:24.885:1.537:-7.085:0:1:room-10:4 231:book-art-4d53927ad111f0259402:26.4:0.945:-7.085:0:1:room-10:4 234:book-art-deb92de6e72f7b3ce951:25.254:0.945:-7.085:0:1:room-10:4 285:painting-portrait-with-cheese:23.328:2.357:-7.085:0:1:room-10:4 286:book-art-1fb8762b7bf8fce0d0f9:24.263:2.357:-7.085:0:1:room-10:4 287:book-art-a26ad79970ed645ce1a9:23.328:1.537:-7.085:0:1:room-10:4 51:archived-painting-375:11.922:0.945:-0.06:0:-1:room-07:N 61:archived-painting-364:13.184:1.537:-0.06:0:-1:room-07:N 63:book-art-5a462e9705ba39d756a2:12.708:1.537:-0.06:0:-1:room-07:N 64:book-art-d95085ce3029e490bb31:11.797:1.537:-0.06:0:-1:room-07:N 71:archived-painting-354:11.012:0.81:-0.06:0:-1:room-07:N 103:book-art-b57fc2205e7bce68d524:13.785:0.945:-0.06:0:-1:room-07:N 105:painting-chef-in-white:11.781:2.357:-0.06:0:-1:room-07:N 107:painting-portrait-in-gold:12.475:2.357:-0.06:0:-1:room-07:N 109:book-art-4a0bb9cdd6c404c4e77c:13.785:2.357:-0.06:0:-1:room-07:N 191:older-work-rochard-martinez-original-2:12.275:1.537:-0.06:0:-1:room-07:N 229:book-art-044d157c01c7bb07eeab:10.988:2.357:-0.06:0:-1:room-07:N 230:book-art-4afb5cab4bdbe1ff6845:13.184:2.357:-0.06:0:-1:room-07:N 232:book-art-6ef848d3ccb6b48184ab:11.016:1.537:-0.06:0:-1:room-07:N 233:book-art-0ee2717bc04e65d0507e:12.475:0.945:-0.06:0:-1:room-07:N 283:archived-painting-367:13.785:1.537:-0.06:0:-1:room-07:N 292:archived-painting-362:13.184:0.945:-0.06:0:-1:room-07:N".split(" ")) {
        const [i, id, x, y, z, a, b, r, w] = e.split(":"), p = paintings[+i];
        if (!p || p.data.id !== id || p.state !== "wall") continue;
        const d = p.data; remember(p);
        Object.assign(d, { x: +x, y: +y, z: +z, ix: +a, iz: +b, room: r, wall: w });
        p.room = r; p.group.position.set(d.x, d.y, d.z); p.group.rotation.set(0, Math.atan2(d.ix, d.iz), 0); p.moved = true;
      }
    }
    return n;
  }
  const key = new URLSearchParams(location.search).get('key');
  // TJ-only save/reset with obvious feedback: the button itself reports, above every overlay (clicking it releases pointer lock,
  // so a say() toast would sit behind the CLICK TO ENTER screen), plus a persistent 'Last saved' line read from the Worker.
  const fmtT = iso => { const d = iso ? new Date(iso) : new Date(); return isNaN(d) ? '' : d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
  const fmtD = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); };
  let statusEl = null, lastSaved = null;
  const setStatus = () => { if (statusEl) statusEl.textContent = lastSaved && lastSaved.saved ? `Last saved: ${fmtD(lastSaved.saved)}, ${lastSaved.n} move${lastSaved.n === 1 ? '' : 's'}` : 'Last saved: never (default hanging)'; };
  const flash = (id, text, bg, ms = 4000) => { const b = document.getElementById(id); if (!b) return; clearTimeout(b._t); b.textContent = text; if (bg) b.style.background = bg;
    if (ms) b._t = setTimeout(() => { b.textContent = b.dataset.label; b.style.background = b.dataset.bg; }, ms); };
  async function load() { try { const r = await fetch(`${GRAV.api}/layout/${gallery}`, { cache: 'no-store' }); if (!r.ok) return 0; const j = await r.json(); applied = apply(j);
      lastSaved = j.saved ? { saved: j.saved, n: Object.keys(j.moves || {}).length } : null; setStatus(); return applied; } catch (e) { return 0; } finally { loaded = true; } }
  let loaded = false, applied = 0;
  async function save() { if (!key) return { ok: false }; flash('saveLayout', 'Saving…', null, 0); const body = JSON.stringify(serialize()), n = Object.keys(JSON.parse(body).moves).length; let r = null;
    try { r = await fetch(`${GRAV.api}/layout/${gallery}`, { method: 'PUT', headers: { 'content-type': 'application/json', 'x-key': key }, body }); } catch (e) {}
    const ok = !!(r && r.ok); if (ok) { lastSaved = { saved: new Date().toISOString(), n }; setStatus(); }
    flash('saveLayout', ok ? `✓ Saved (${n} painting${n === 1 ? '' : 's'} moved) at ${fmtT()}` : `Save failed${r ? ' (' + r.status + ')' : ''}`, ok ? '#1f8f4a' : '#b3261e');
    say(ok ? 'LAYOUT SAVED (' + n + ' MOVED)' : 'SAVE FAILED', 3); return { ok, status: r ? r.status : 0 }; }
  async function reset() { if (!key) return { ok: false }; flash('resetLayout', 'Resetting…', null, 0); let r = null;
    try { r = await fetch(`${GRAV.api}/layout/${gallery}`, { method: 'DELETE', headers: { 'x-key': key } }); } catch (e) {}
    const ok = !!(r && r.ok); if (ok) { lastSaved = null; setStatus(); }
    flash('resetLayout', ok ? `✓ Reset to default at ${fmtT()} · reloading…` : `Reset failed${r ? ' (' + r.status + ')' : ''}`, ok ? '#1f8f4a' : '#b3261e');
    say(ok ? 'RESET TO DEFAULT · RELOADING' : 'RESET FAILED', 3); if (ok && !o.noReload) setTimeout(() => location.reload(), 2200); return { ok, status: r ? r.status : 0 }; }
  if (key) { const bar = document.createElement('div'); bar.id = 'tjlayout'; bar.style.cssText = 'position:fixed;top:58px;right:10px;z-index:2147483000;display:flex;flex-direction:column;align-items:flex-end;gap:6px;font:700 13px system-ui,sans-serif;pointer-events:auto';
    const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px'; bar.appendChild(row);
    for (const [id, label, fn, bg] of [['saveLayout', 'SAVE LAYOUT', save, '#1f8f4a'], ['resetLayout', 'RESET TO DEFAULT', () => confirm('Reset this gallery to the default hanging?') && reset(), '#a3352a']]) { const b = document.createElement('button'); b.id = id; b.type = 'button'; b.textContent = label; b.dataset.label = label; b.dataset.bg = bg; b.style.cssText = `background:${bg};color:#fff;border:0;border-radius:8px;padding:9px 12px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.5)`;
      ['mousedown', 'touchstart', 'pointerdown', 'click'].forEach(ev => b.addEventListener(ev, e => { e.stopPropagation(); if (ev === 'click' || ev === 'touchstart') { e.preventDefault(); fn(); } }, { passive: false })); row.appendChild(b); }
    statusEl = document.createElement('div'); statusEl.id = 'layoutStatus'; statusEl.style.cssText = 'background:rgba(0,0,0,.72);color:#f2e4c4;border-radius:6px;padding:4px 8px;font:600 12px system-ui,sans-serif'; setStatus(); bar.appendChild(statusEl);
    document.body.appendChild(bar); }
  return { primary, secondary, update, grab, hang, place, drop, launch, get dropHook() { return dropHook; }, set dropHook(f) { dropHook = f; }, save, reset, load, apply, serialize, aimPainting, placement, fits,
    get held() { return held ? held.p : null; }, get preview() { return preview; }, get flying() { return flying.length; }, get loaded() { return loaded; }, get applied() { return applied; }, get hasKey() { return !!key; }, get lastSaved() { return lastSaved; }, get kick() { return kick; } };
}
