// Shared "gravity gun" for the TJM galleries (tjm.art/play, Orsay, Bilbao, Uffizi, ...), after Half-Life 2's tool.
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
  g.userData.grav = { em, ring, halo, glow }; return g;
}
function haloTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,220,150,1)'); gr.addColorStop(0.4, 'rgba(255,140,40,.5)'); gr.addColorStop(1, 'rgba(255,100,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
export function gravPose(g, t, holding, kick) { const u = g.userData.grav; if (!u) return; const p = 1 + 0.12 * Math.sin(t * 9) + (holding ? 0.25 : 0) + kick * 0.8;
  u.halo.scale.set(0.26 * p, 0.26 * p, 1); u.ring.rotation.z = t * (holding ? 9 : 3); u.em.scale.setScalar(0.9 + 0.2 * Math.sin(t * 23)); g.rotation.x += kick * 0.35; g.position.z += kick * 0.06; }

export function createGravGun(o) {
  const VOL = o.volume != null ? o.volume : (GRAV.volume != null ? GRAV.volume : 1); // optional master volume (backward compatible)
  const { scene, camera, paintings, say, isMuted, walkable, roomAt, gallery } = o; let walls = null, held = null, kick = 0, ghost = null, preview = null;
  const flying = [], ray = new THREE.Raycaster(), own = () => { const s = new Set(); paintings.forEach(q => q.group.traverse(c => s.add(c))); return s; };
  const wallMeshes = () => { if (walls) return walls; const s = own(); walls = []; scene.traverse(m => { if (m.isMesh && !s.has(m) && m.geometry && m.geometry.type === 'BoxGeometry' && !(m.material && m.material.transparent) && m.visible !== false) walls.push(m); }); return walls; };
  const grabTargets = () => paintings.filter(p => (p.state === 'wall' && p.group.visible) || p.state === 'floor' || p.state === 'trolley').flatMap(p => [p.mesh, p.frame]);
  const aimPainting = (far = 12) => { camera.updateMatrixWorld(); ray.setFromCamera(new THREE.Vector2(0, 0), camera); ray.far = far; const h = ray.intersectObjects(grabTargets(), false)[0]; ray.far = Infinity; return h && h.object.userData.p ? h.object.userData.p : (h ? paintings.find(p => p.mesh === h.object || p.frame === h.object) : null); };
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
    const w = p.w, h = p.h, y = Math.max(h / 2 + 0.35, Math.min(hit.point.y, 1.7 + Math.max(0, h / 2 - 0.9))), pos = V(hit.point.x, y, hit.point.z).addScaledVector(n, 0.035);
    return { pos, n, ok: fits(p, pos, n, w, h) }; };
  const ghostFor = p => { if (ghost) { scene.remove(ghost); ghost.traverse(c => c.geometry && c.geometry.dispose()); }
    ghost = new THREE.Group(); const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), new THREE.MeshBasicMaterial({ color: 0x30ff60, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }));
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(p.w, p.h)), new THREE.LineBasicMaterial({ color: 0x30ff60 })); ghost.add(m, e); ghost.userData = { m, e }; ghost.visible = false; ghost.renderOrder = 9; scene.add(ghost); };
  // ---------- actions ----------
  const remember = p => { if (!p.home) p.home = { x: p.data.x, y: p.data.y, z: p.data.z, ix: p.data.ix, iz: p.data.iz, room: p.data.room, wall: p.data.wall }; };
  function grab(p) { remember(p); if (p.group.parent && p.group.parent !== scene) scene.attach(p.group); /* off the #213 trolley */ const i = flying.findIndex(f => f.p === p); if (i >= 0) flying.splice(i, 1); p.state = 'held'; p.group.visible = true; held = { p, t: 0, from: p.group.position.clone() }; ghostFor(p); kick = 1; zap(0.5); say('GRABBED · CLICK TO HANG · RIGHT-CLICK TO LAUNCH', 2.5); }
  function hang() { const p = held.p, pl = placement(p); if (!pl || !pl.ok) { say(pl ? 'NO ROOM THERE: OVERLAP OR DOORWAY' : 'AIM AT A WALL', 1.6); buzz(); return false; }
    const d = p.data; Object.assign(d, { x: pl.pos.x, y: pl.pos.y, z: pl.pos.z, ix: +pl.n.x.toFixed(4), iz: +pl.n.z.toFixed(4) }); const r = roomAt ? roomAt(d.x, d.z) : null; d.room = p.room = r && r.id ? r.id : d.room; d.wall = Math.abs(d.ix) > Math.abs(d.iz) ? (d.ix > 0 ? 'W' : 'E') : (d.iz > 0 ? 'S' : 'N');
    p.group.position.set(d.x, d.y, d.z); p.group.rotation.set(0, Math.atan2(d.ix, d.iz), 0); p.state = 'wall'; p.moved = true; held = null; if (ghost) ghost.visible = false; kick = 1; zap(0.9); say('HUNG', 1.2); return true; }
  function drop() { if (!held) return null; const p = held.p; held = null; if (ghost) ghost.visible = false; return p; } // let go without hanging (the #212 picker swaps what is held)
  function launch(p) { if (!p) { p = aimPainting(9); if (!p) return; remember(p); p.state = 'held'; }
    const dir = camera.getWorldDirection(V()); const pos = held && held.p === p ? p.group.position.clone() : p.group.position.clone();
    flying.push({ p, pos, v: dir.multiplyScalar(13).add(V(0, 2.2, 0)), spin: V((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6), phase: 'air' });
    p.state = 'flying'; p.moved = false; held = null; if (ghost) ghost.visible = false; kick = 1.4; zap(1.2); say('LAUNCHED', 1); }
  // #213: a gallery can take the held painting somewhere other than a wall (the guide bot's trolley): dropHook(p) returns true if it did
  let dropHook = null;
  function place() { if (!held) return false; const p = held.p; if (dropHook && dropHook(p)) { held = null; if (ghost) ghost.visible = false; kick = 1; zap(0.6); say('ON THE TROLLEY', 1.2); return true; } return hang(); }
  function primary() { if (held) return place(); const p = aimPainting(12); if (!p) { say('AIM AT A PAINTING', 1.2); return false; } grab(p); return true; }
  function secondary() { if (held) launch(held.p); else launch(null); }
  // ---------- per frame ----------
  function update(dt, active) { const t = performance.now() / 1000; kick = Math.max(0, kick - dt * 4); hum(active, !!held);
    if (held) { const p = held.p; held.t = Math.min(1, held.t + dt * 3.5); const dir = camera.getWorldDirection(V()), tgt = camera.position.clone().addScaledVector(dir, 1.3 + Math.max(p.w, p.h) * 0.55); tgt.y -= 0.1 + Math.sin(t * 2) * 0.03;
      p.group.position.lerpVectors(held.from, tgt, held.t * held.t * (3 - 2 * held.t)); if (held.t >= 1) held.from.copy(tgt); p.group.rotation.set(0, Math.atan2(-dir.x, -dir.z) + Math.sin(t * 1.3) * 0.05, Math.sin(t * 1.7) * 0.03);
      const pl = active ? placement(p) : null; if (ghost) { ghost.visible = !!pl; if (pl) { ghost.position.copy(pl.pos).addScaledVector(pl.n, 0.01); ghost.rotation.set(0, Math.atan2(pl.n.x, pl.n.z), 0); const c = pl.ok ? 0x30ff60 : 0xff3030; ghost.userData.m.material.color.setHex(c); ghost.userData.e.material.color.setHex(c); } }
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
  function launchSoft(p) { flying.push({ p, pos: p.group.position.clone(), v: V(0, 0, 0), spin: V(), phase: 'air' }); p.state = 'flying'; held = null; if (ghost) ghost.visible = false; }
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
      Object.assign(p.data, { x: m.x, y: m.y, z: m.z, ix: m.ix, iz: m.iz, room: m.room || p.data.room, wall: m.wall || p.data.wall }); p.room = p.data.room; p.group.position.set(m.x, m.y, m.z); p.group.rotation.set(0, Math.atan2(m.ix, m.iz), 0); p.moved = true; n++; } return n; }
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
