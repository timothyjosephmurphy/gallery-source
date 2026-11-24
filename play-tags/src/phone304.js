// #304 (preview): phone tap-to-move + floating stick. Both always active on touch.
//  - Quick tap on floor/doorway: glide there (glowing target ring), stopping short of walls.
//  - Quick tap on a painting farther than the open distance: glide to a viewing spot in front of it
//    (within OPEN_DIST the existing tap-to-open in gallery-core main.js keeps priority).
//  - Press-drag on the lower-left (#tmove zone): a floating stick knob appears under the thumb, gone on release.
//    Movement math is the existing relative-drag handler in main.js; this only draws it.
//  - Any stick/key input or a drag cancels a glide. UI elements stop propagation already, so they keep priority.
export function installPhone304(game, W) {
  const coarse = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const st = window.__phone304 = { taps: 0, glides: 0, stick: 0, on: coarse };
  if (!coarse || !game || !game.camera) return st;
  const THREE = game.THREE, cam = game.camera, canvas = game.renderer.domElement, V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const walk = (x, z) => (W && W.walkable ? W.walkable(x, z) : game.walkable(x, z));
  const OPEN_DIST = 2.2, SPEED = 3.2, WALL_GAP = 0.45;
  // floating stick (HTML overlay, same look family as the tour pad)
  const css = document.createElement('style'); css.textContent = `#fs304{position:fixed;z-index:31;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;border:2px solid rgba(255,220,160,.45);background:rgba(20,16,10,.25);pointer-events:none;display:none}
#fs304 i{position:absolute;left:50%;top:50%;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;background:rgba(255,220,160,.55)}`; document.head.appendChild(css);
  const fs = document.createElement('div'); fs.id = 'fs304'; fs.innerHTML = '<i></i>'; document.body.appendChild(fs); const knob = fs.firstChild;
  const tm = document.getElementById('tmove'); let sid = null, sx = 0, sy = 0;
  if (tm) {
    tm.addEventListener('touchstart', e => { const t = e.changedTouches[0]; sid = t.identifier; sx = t.clientX; sy = t.clientY; fs.style.left = sx + 'px'; fs.style.top = sy + 'px'; knob.style.transform = ''; fs.style.display = 'none'; cancel(); }, { passive: true });
    tm.addEventListener('touchmove', e => { for (const t of e.changedTouches) if (t.identifier === sid) { let dx = t.clientX - sx, dy = t.clientY - sy; if (Math.hypot(dx, dy) > 8 && fs.style.display === 'none') { fs.style.display = 'block'; st.stick++; } const m = Math.hypot(dx, dy), k = m > 60 ? 60 / m : 1; knob.style.transform = `translate(${dx * k}px,${dy * k}px)`; } }, { passive: true });
    const up = e => { for (const t of e.changedTouches) if (t.identifier === sid) { sid = null; fs.style.display = 'none'; } };
    tm.addEventListener('touchend', up, { passive: true }); tm.addEventListener('touchcancel', up, { passive: true }); }
  // target ring
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.4, 40), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.visible = false; ring.renderOrder = 5; game.scene.add(ring);
  let G = null; // { pts, i, look }
  function cancel() { if (G) { G = null; ring.visible = false; } }
  addEventListener('keydown', cancel, true);
  // walk a straight line toward the goal, stop short of the first wall
  function reach(from, to) { const d = Math.hypot(to.x - from.x, to.z - from.z); if (d < 0.3) return null; const ux = (to.x - from.x) / d, uz = (to.z - from.z) / d; let last = 0;
    for (let s = 0.15; s <= d; s += 0.15) { if (!walk(from.x + ux * s, from.z + uz * s)) break; last = s; }
    const end = Math.max(0, (last >= d - 0.01 ? d : last - WALL_GAP)); return end < 0.3 ? null : V(from.x + ux * end, 0, from.z + uz * end); }
  const ray = new THREE.Raycaster(); let t0 = null;
  canvas.addEventListener('touchstart', e => { const t = e.changedTouches[0]; t0 = { x: t.clientX, y: t.clientY, t: performance.now() }; }, { passive: true });
  canvas.addEventListener('touchmove', e => { const t = e.changedTouches[0]; if (t0 && Math.hypot(t.clientX - t0.x, t.clientY - t0.y) > 12) cancel(); }, { passive: true });
  canvas.addEventListener('touchend', e => { const t = e.changedTouches[0]; if (!t0) return; const q = t0; t0 = null;
    if (Math.hypot(t.clientX - q.x, t.clientY - q.y) > 12 || performance.now() - q.t > 350) return;
    if (game.freeze || window.__reading || window.__tourOn || game.chaosActive || game.falling || game.swarm || game.cartOpen) return;
    st.taps++; const r = canvas.getBoundingClientRect(); cam.updateMatrixWorld(); ray.setFromCamera(new THREE.Vector2((t.clientX - r.left) / r.width * 2 - 1, -((t.clientY - r.top) / r.height) * 2 + 1), cam);
    const c = cam.position, targets = []; for (const p of game.paintings) if (p.state === 'wall') { targets.push(p.mesh); if (p.frame) targets.push(p.frame); } for (const b of (game.boards || [])) targets.push(b);
    const h = ray.intersectObjects(targets, false)[0];
    if (h && h.distance <= OPEN_DIST) return; // main.js opens paintings/boards up close (existing tap keeps priority)
    if (h && h.object.userData.p) {
      const p = h.object.userData.p, n = V(p.data.ix, 0, p.data.iz), dd = Math.max(1.8, Math.min(4, p.h * 1.3 + 0.8)), gp = p.group.getWorldPosition(V());
      const stand = reach(V(c.x, 0, c.z), V(gp.x + n.x * dd, 0, gp.z + n.z * dd)); if (stand) go(stand, V(gp.x, Math.min(gp.y, c.y + 0.4), gp.z)); return; }
    if (ray.ray.direction.y > -0.02) return; // floor only (doorways are floor)
    const fy = c.y - 1.6, k = (fy - ray.ray.origin.y) / ray.ray.direction.y, hit = ray.ray.origin.clone().addScaledVector(ray.ray.direction, k);
    if (h && h.distance < k) return; // a painting/frame is in front of the floor point
    const stand = reach(V(c.x, 0, c.z), hit); if (stand) go(stand, null); }, { passive: true });
  function go(to, look) { G = { to, look, y: cam.position.y }; ring.position.set(to.x, G.y - 1.6 + 0.02, to.z); ring.visible = true; st.glides++; }
  const qLook = (from, to) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(from, to, V(0, 1, 0)));
  let last = performance.now();
  (function tick() { requestAnimationFrame(tick); const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; if (!G) return;
    if (sid !== null || game.freeze || window.__reading || window.__tourOn) return cancel();
    const c = cam.position, dx = G.to.x - c.x, dz = G.to.z - c.z, d = Math.hypot(dx, dz); ring.material.opacity = 0.55 + 0.3 * Math.sin(now / 160);
    if (d < 0.05) { if (G.look) { cam.quaternion.slerp(qLook(c, G.look), Math.min(1, dt * 4)); if (cam.quaternion.angleTo(qLook(c, G.look)) < 0.02) cancel(); } else cancel(); return; }
    const s = Math.min(d, SPEED * dt * Math.min(1, 0.4 + d)), nx = c.x + dx / d * s, nz = c.z + dz / d * s; if (!walk(nx, nz)) return cancel(); c.x = nx; c.z = nz;
    if (G.look) cam.quaternion.slerp(qLook(c, G.look), Math.min(1, dt * 2.5)); })();
  return st; }
