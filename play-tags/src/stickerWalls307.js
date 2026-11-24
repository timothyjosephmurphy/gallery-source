// #307 (preview): stickers on walls. Works with stickerBot306: click/tap a landed floor strip (within 3 m) to pick it up
// (+3 stickers in hand, hand cap 9). Then click/tap a blank patch of room/mural wall (within 4 m) to stick one. Rejected on
// paintings/plaques/projections (art rect + 15 cm margin), below 0.4 m or within 0.25 m of the cornice. Wall cap 30 (oldest
// peels off). Nothing saved: reload resets. Pure decals, no colliders, so walkability is untouched. Real sticker-art textures shared from #306 (#465).
export function installStickerWalls307({ game, W, root }) {
  const st = window.__stickerWalls307 = { state: 'init', held: 0, onWall: 0, picked: 0, rejected: 0, HAND_CAP: 9, WALL_CAP: 30 };
  const bot = window.__stickerBot306;
  if (!game || !game.camera || !root || !bot || !bot.landed) { st.state = 'no-bot'; return st; }
  const THREE = game.THREE, cam = game.camera, canvas = game.renderer.domElement, ray = new THREE.Raycaster(), nv = new THREE.Vector2();
  const art = (W.art || []).filter(a => a.ix != null), placed = [], geo = new THREE.PlaneGeometry(0.075, 0.075); let down = null, n = 0;
  const hud = document.createElement('div'); hud.style.cssText = 'position:fixed;left:50%;bottom:64px;transform:translateX(-50%);padding:4px 10px;border-radius:12px;background:rgba(20,18,16,.7);color:#f5f2ea;font:13px system-ui;pointer-events:none;display:none;z-index:20';
  document.body.appendChild(hud); let hudT = 0;
  const say = t => { hud.textContent = t; hud.style.display = 'block'; clearTimeout(hudT); hudT = setTimeout(() => { hud.style.display = st.held ? 'block' : 'none'; hud.textContent = `Stickers in hand: ${st.held}`; }, 1600); };
  const onArt = (p, nrm) => art.some(a => { if (a.ix * nrm.x + a.iz * nrm.z < 0.7) return false; // same face only
    const tx = a.iz, tz = -a.ix, dx = p.x - a.x, dz = p.z - a.z; if (Math.abs(dx * a.ix + dz * a.iz) > 0.3) return false;
    return Math.abs(dx * tx + dz * tz) < (a.w || 1) / 2 + 0.15 && Math.abs(p.y - (a.y || 1.6)) < (a.h || 1) / 2 + 0.15; });
  // #wallrec: ray targets come from wall records (window.__wallRecs) as private unit-box proxies (not in the scene, 0 draws); fallback: per-wall meshes
  const walls = () => { const R = window.__wallRecs; if (R && R.length) { const g = new THREE.BoxGeometry(1, 1, 1), mat = new THREE.MeshBasicMaterial(); return R.map(r => { const m = new THREE.Mesh(g, mat); m.position.set(...r.pos); m.rotation.y = r.ry; m.scale.set(r.L, r.h, r.th); m.updateMatrixWorld(true); return m; }); }
    const out = []; root.traverse(o => { if (o.isMesh && (o.name === 'roomWall' || o.name === 'muralWall')) out.push(o); }); return out; };
  let wallList = null;
  function pick(e) { const r = canvas.getBoundingClientRect(); nv.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(nv, cam); }
  canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; }, true);
  canvas.addEventListener('pointerup', e => { if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8) return; pick(e);
    // 1) pick up a landed strip
    ray.far = 3; const L = bot.landed(); if (L.length) { const h = ray.intersectObjects(L.map(q => q.s), true)[0];
      if (h) { if (st.held + 3 > st.HAND_CAP) { say('Hands full (9). Stick some first.'); e.stopPropagation(); return; }
        const q = L.find(q => { let o = h.object; while (o) { if (o === q.s) return true; o = o.parent; } return false; });
        if (q && bot.take(q)) { st.held += 3; st.picked++; say(`Picked up a strip: ${st.held} in hand`); e.stopPropagation(); } return; } }
    if (!st.held) return;
    // 2) stick on a blank wall
    ray.far = 4; wallList = wallList || walls(); const h = ray.intersectObjects(wallList, false)[0]; if (!h || !h.face) return;
    const nrm = h.face.normal.clone().transformDirection(h.object.matrixWorld); if (Math.abs(nrm.y) > 0.3) return;
    if (nrm.dot(ray.ray.direction) > 0) nrm.negate();
    const top = (h.object.geometry.parameters?.height || 1) * h.object.scale.y; // geoBox is unit; scale.y = wall height
    if (h.point.y < 0.4 || h.point.y > top - 0.25 - 0.09 || onArt(h.point, nrm)) { st.rejected++; say('Blank wall only, not on the art'); e.stopPropagation(); return; }
    if (placed.length >= st.WALL_CAP) { const old = placed.shift(); root.remove(old); }
    // #307 wall decals: Neural Dance poses at Visual size_m 0.18 m tall (aspect kept, die-cut alpha); painting stand-ins if poses never loaded
    const NT = bot.neuralTexs || [], k = NT.length ? NT[n++ % NT.length] : null;
    const m = k ? new THREE.Mesh(new THREE.PlaneGeometry(0.18 * k.a, 0.18), new THREE.MeshBasicMaterial({ map: k.t, transparent: true, alphaTest: 0.4, polygonOffset: true, polygonOffsetFactor: -2 }))
      : new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: bot.texs[n++ % bot.texs.length], polygonOffset: true, polygonOffsetFactor: -2 }));
    if (k) st.neuralUsed = (st.neuralUsed || 0) + 1;
    m.position.copy(h.point).addScaledVector(nrm, 0.006); m.lookAt(h.point.clone().addScaledVector(nrm, 1)); m.rotateZ((Math.random() - 0.5) * 0.5); m.name = 'sticker307'; root.add(m); placed.push(m);
    st.held--; st.onWall = placed.length; say(`Stuck! ${st.held} left in hand`); e.stopPropagation(); }, true);
  st.state = 'ready'; return st;
}
