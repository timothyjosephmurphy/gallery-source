// Egg 3: a cardboard box that sits in a corner and scoots to another spot when you aren't looking.
// Catch it moving and a red '!' pops up with an alert sting (synthesized), then it bolts to its new spot.
import { THREE, V, builder, MAT, canvasTex, rand, pick, ease } from '../kit.js';
export function eggBox(E) {
  const { world, scene, S, A } = E;
  // candidate homes: corners first, then wall spots; reserved softly so other props keep off them
  const homes = [];
  for (let k = 0; k < 10 && homes.length < 7; k++) { const s = world.findFloorSpot({ r: 0.55, place: k < 5 ? 'corner' : 'wall', seed: E.seed * 31 + k * 7 + 1, spread: 5, test: (x, z) => !homes.some(h => Math.hypot(h.x - x, h.z - z) < 3) }); if (!s) continue; homes.push(s); world.reserveFloor(s, 0.55, 'box-home', false); }
  // 2026-10-18 (#138): the first home sits flush against a real wall (back ~3 cm off it, long side parallel), snug into the corner when it
  // is one. flushOf finds the nearest tall wall (floor-to-ceiling box mesh, not a bench, plinth, rail or pit edge) right behind the walkable
  // edge, squares up to its face normal; the walkable spot stays the path anchor and the collider sits where the box meets the floor.
  let budget = 600; const ws = world.wallMeshes(), ray = new THREE.Raycaster(), tallC = new Map(), tall = m => { if (!tallC.has(m)) { const bb = new THREE.Box3().setFromObject(m), sx = bb.max.x - bb.min.x, sz = bb.max.z - bb.min.z, hy = bb.max.y - bb.min.y; tallC.set(m, (hy > 1.8 && (Math.max(sx, sz) >= 1.0 || Math.min(sx, sz) <= 0.4)) || (hy >= 0.7 && bb.min.y < 0.1 && Math.max(sx, sz) >= 1.5 && Math.min(sx, sz) <= 0.6)); } return tallC.get(m); }; // full walls (not pillars), or the solid wall under a window (not benches, plinths, daises)
  const hitAt = (o, dir, far) => { ray.set(o, dir); ray.far = far; for (const it of ray.intersectObjects(ws, false)) if (tall(it.object)) return it; return null; }, wallAt = (o, dir, far) => { const it = hitAt(o, dir, far); return it ? it.distance : null; };
  let wbs = null; const nearWall = (x, z) => { if (!wbs) wbs = ws.filter(tall).map(m => new THREE.Box3().setFromObject(m)); return wbs.some(bb => Math.hypot(Math.max(bb.min.x - x, 0, x - bb.max.x), Math.max(bb.min.z - z, 0, z - bb.max.z)) < 1.5); }; // cheap pre-check before raycasting
  function flushOf(h, nob) { if (!nearWall(h.x, h.z)) return null; if (!nob && budget-- <= 0) return null; const o = V(h.x, 0.5, h.z); let best = null;
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, dir = V(Math.sin(a), 0, Math.cos(a)), it = hitAt(o, dir, 1.6); if (it && (!best || it.distance < best.it.distance)) best = { it, dir }; }
    if (!best || !best.it.face) return null; const n = best.it.face.normal.clone().transformDirection(best.it.object.matrixWorld); n.y = 0; if (n.lengthSq() < 0.5) return null; n.normalize(); const back = n.dot(best.dir) < 0 ? n.clone().negate() : n.clone();
    const d = wallAt(o, back, 1.8); if (d === null || d <= 0.36) return null;
    let b0 = 0; while (b0 < d && world.walkable(h.x + back.x * b0, h.z + back.z * b0)) b0 += 0.05; if (d > b0 + 0.6) return null; // the wall really is the floor's edge here (not a pit or rail with a wall beyond)
    const out = back.clone().negate(), t = V(out.z, 0, -out.x), HD = 0.33 + 0.03, HW = 0.43 + 0.03; let x = h.x + back.x * (d - HD), z = h.z + back.z * (d - HD);
    for (const sg of [1, -1]) { const dl = wallAt(V(x, 0.5, z), t.clone().multiplyScalar(sg), 1.5); if (dl !== null && dl < 1.2) { const sh = dl - HW; x += t.x * sg * sh; z += t.z * sg * sh; break; } } // snug into the corner (or off a side wall)
    let cx = x, cz = z; for (let k = 0; k < 40 && !world.walkable(cx, cz); k++) { cx += out.x * 0.02; cz += out.z * 0.02; }
    return { px: h.x, pz: h.z, x, z, cx, cz, yaw: Math.atan2(out.x, out.z), flush: true }; }
  // first home: never in the starting room, away from the other critters' starting rooms (world.spawnOk), and flush against a wall
  { const ok = h => world.spawnOk(h.x, h.z, world.spawns); let i = homes.findIndex(h => ok(h) && flushOf(h));
    // none of the scoot homes is by a real wall (walls are mostly paintings; the rest can be benches, daises, pits): search wall cells directly,
    // corners first, with a budget on the raycast test
    // last resort (tjm.art/play: every free wall outside the start room is a painting's viewing zone): a free wall in the start room, >= 5 m out
    for (const [place, strict] of [['corner', 1], ['wall', 1]]) { if (i >= 0) break; const s = world.findFloorSpot({ r: 0.55, place, seed: E.seed * 31 + 97, minStart: 3, test: (x, z) => world.spawnOk(x, z, world.spawns) && !homes.some(h => Math.hypot(h.x - x, h.z - z) < 3) && !!flushOf({ x, z }) }); if (s && flushOf(s, 1)) { world.reserveFloor(s, 0.55, 'box-home', false); homes.unshift(s); i = 0; } }
    if (i < 0) i = homes.findIndex(h => Math.hypot(h.x - world.start.x, h.z - world.start.z) >= 5 && flushOf(h));
    for (const [place, strict] of [['corner', 0], ['wall', 0]]) { if (i >= 0) break; const s = world.findFloorSpot({ r: 0.55, place, seed: E.seed * 31 + 97, minStart: strict ? 3 : 5, test: (x, z) => (!strict || world.spawnOk(x, z, world.spawns)) && !homes.some(h => Math.hypot(h.x - x, h.z - z) < 3) && !!flushOf({ x, z }) }); if (s && flushOf(s, 1)) { world.reserveFloor(s, 0.55, 'box-home', false); homes.unshift(s); i = 0; } }
    if (i < 0) i = homes.findIndex(ok); // no flush wall spot anywhere: old rule
    if (i < 0) { const s = world.findFloorSpot({ r: 0.55, place: 'wall', seed: E.seed * 31 + 97, test: (x, z) => world.spawnOk(x, z, world.spawns) && !homes.some(h => Math.hypot(h.x - x, h.z - z) < 3) }); if (s) { world.reserveFloor(s, 0.55, 'box-home', false); homes.unshift(s); i = 0; } }
    if (i > 0) homes.unshift(homes.splice(i, 1)[0]); if (homes[0]) { const f = flushOf(homes[0], 1); if (f) Object.assign(homes[0], f); world.spawns.push({ name: 'box', x: homes[0].x, z: homes[0].z, room: world.roomOf(homes[0].x, homes[0].z) }); } }
  if (homes.length < 2) return null;
  const grp = new THREE.Group(); grp.name = 'egg-box'; scene.add(grp);
  const box = new THREE.Group(); grp.add(box);
  { // HD 2026-10-18: rounded slightly bulging carton, top flap seam, brown tape running over the edges, cut hand holes with board edge,
    // corrugated-edge texture, an original blank shipping label with a barcode. No real brands.
    const c = 0xb3895a, d = 0x8c6a42, tp = 0xc9a46a, b = builder();
    b.rbox(0.86, 0.6, 0.66, 0.018, c, 0, 0.3, 0);
    for (const s of [-1, 1]) { b.rbox(0.86, 0.012, 0.33, 0.005, 0xb88f5f, 0, 0.6, s * 0.165); b.box(0.84, 0.004, 0.006, d, 0, 0.607, s * 0.0); } // two top flaps + seam
    b.box(0.86, 0.003, 0.11, tp, 0, 0.6085, 0); for (const s of [-1, 1]) b.box(0.003, 0.14, 0.11, tp, s * 0.4315, 0.535, 0); // tape over the top and down both ends
    for (const s of [-1, 1]) for (const zz of [0.331, -0.331]) { b.rbox(0.2, 0.06, 0.006, 0.02, 0x2a1d10, s * 0.3, 0.48, zz); b.rbox(0.21, 0.07, 0.003, 0.025, 0xd8c09a, s * 0.3, 0.48, zz + Math.sign(zz) * 0.0005); } // hand holes, cut edge
    for (const x of [-0.43, 0.43]) for (const z of [-0.33, 0.33]) b.box(0.006, 0.6, 0.006, d, x, 0.3, z); // crushed vertical edges
    box.add(b.mesh(MAT.matte || MAT.flat));
    // body skin: soft corrugation stripes + scuffs on the long faces
    const skin = canvasTex(256, 192, (x, w, h) => { x.fillStyle = '#b3895a'; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 6) { x.fillStyle = 'rgba(90,60,30,.06)'; x.fillRect(i, 0, 3, h); }
      for (let k = 0; k < 14; k++) { x.fillStyle = `rgba(${k % 2 ? '70,48,24' : '220,190,140'},.12)`; x.beginPath(); x.ellipse(Math.random() * w, Math.random() * h, 6 + Math.random() * 20, 2 + Math.random() * 5, Math.random() * 3, 0, 6.283); x.fill(); } });
    const label = canvasTex(256, 160, (x, w, h) => { x.fillStyle = '#f4f0e6'; x.fillRect(0, 0, w, h); x.strokeStyle = '#222'; x.lineWidth = 3; x.strokeRect(6, 6, w - 12, h - 12); x.fillStyle = '#222'; x.font = 'bold 22px Arial'; x.fillText('FRAGILE', 18, 36); x.font = '16px Arial'; x.fillText('HANDLE WITH CARE', 18, 58);
      x.fillRect(18, 70, w - 36, 2); for (let i = 0, X = 22; X < w - 26; i++) { const bw = 1 + ((i * 7919) % 4); x.fillRect(X, 84, bw, 46); X += bw + 1 + ((i * 104729) % 3); } x.font = '12px monospace'; x.fillText('0 26 1018 2 GALLERY', 30, 146); });
    for (const zz of [0.3305, -0.3305]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.38), new THREE.MeshLambertMaterial({ map: skin, transparent: true, opacity: 0.55, depthWrite: false })); p.position.set(0, 0.22, zz + Math.sign(zz) * 0.002); if (zz < 0) p.rotation.y = Math.PI; box.add(p); }
    const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.125), new THREE.MeshLambertMaterial({ map: label })); lb.position.set(-0.22, 0.25, 0.3345); lb.rotation.z = 0.04; box.add(lb);
    const t = canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#b3895a'; x.fillRect(0, 0, w, h); x.strokeStyle = x.fillStyle = '#4a3420'; x.lineWidth = 7; for (const ax of [60, 196]) { x.beginPath(); x.moveTo(ax, 100); x.lineTo(ax, 40); x.stroke(); x.beginPath(); x.moveTo(ax - 22, 58); x.lineTo(ax, 26); x.lineTo(ax + 22, 58); x.fill(); }
      x.font = 'bold 24px Arial'; x.textAlign = 'center'; x.fillText('THIS SIDE UP', 128, 82); });
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshLambertMaterial({ map: t })); p.position.set(s * 0.4335, 0.26, 0); p.rotation.y = s * Math.PI / 2; box.add(p); } }
  const bang = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(128, 128, (x) => { x.font = '900 120px Impact, Arial Black'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 12; x.strokeStyle = '#fff'; x.strokeText('!', 64, 70); x.fillStyle = '#e8141c'; x.fillText('!', 64, 70); }), depthTest: false, transparent: true }));
  bang.scale.set(0.55, 0.55, 1); bang.position.y = 1.15; bang.visible = false; bang.renderOrder = 20; box.add(bang);
  let cur = 0; const place = s => { box.position.set(s.x, 0, s.z); box.rotation.y = s.yaw + (s.flush ? 0 : rand(-0.25, 0.25)); }; place(homes[0]);
  const col = { x: homes[0].cx ?? homes[0].x, z: homes[0].cz ?? homes[0].z, r: 0.55, name: 'box' }; world.colliders.push(col);
  const st = { mode: 'sit', t: rand(20, 40), path: null, seg: 0, speed: 0.9, alarm: 0, caught: false };
  function sting() { A.tone(659, 0.09, 'square', 0.12); A.tone(988, 0.22, 'square', 0.12, 0.09); A.noise(0.25, 1800, 0.15, 0, 'bandpass', 0.8); A.tone(98, 0.4, 'sawtooth', 0.1, 0, 60); }
  function startMove(force) { const fh = cur >= 0 && homes[cur].flush && Math.hypot(box.position.x - homes[cur].x, box.position.z - homes[cur].z) < 0.05 ? homes[cur] : null, here = fh ? V(fh.px, 0, fh.pz) : V(box.position.x, 0, box.position.z); /* leaving the flush spot: plan from its walkable anchor */ const opts = homes.map((h, i) => ({ h, i, d: Math.hypot(h.x - here.x, h.z - here.z) })).filter(o => o.i !== cur && o.d > 2.5); { const near = opts.filter(o => o.d < 16); if (near.length) opts.splice(0, opts.length, ...near); else opts.sort((a, b2) => a.d - b2.d).splice(3); } // first home sits in its own room: allow a longer first hop
    for (const o of opts.sort(() => Math.random() - 0.5)) { const p = world.path(here, V(o.h.px ?? o.h.x, 0, o.h.pz ?? o.h.z), 0.45); if (p && p.length > 1) { st.path = p; st.seg = 1; st.to = o; st.mode = 'move'; st.speed = 0.9; st.caught = false; return true; } }
    if (force && opts.length) { cur = opts[0].i; place(opts[0].h); } st.t = rand(10, 20); return false; }
  let lastHit = 0;
  function push(imp) { st.vx = (st.vx || 0) + imp.x / 1.6; st.vz = (st.vz || 0) + imp.z / 1.6; if (st.mode !== 'shoved') { st.prev = st.mode; st.mode = 'shoved'; } const n = performance.now(); if (n - lastHit > 700) { lastHit = n; A.noise(0.18, 600, 0.05, 0, 'lowpass', 0.7); } }
  E.pushables.push({ name: 'box', obj: box, r: 0.5, mass: 1.6, push });
  function update(dt, tm) { const bp = box.position.clone().setY(0.35);
    if (st.mode === 'shoved') { const nx = box.position.x + st.vx * dt, nz = box.position.z + st.vz * dt; const h0 = homes[0], offGrid = h0.flush && !world.walkable(box.position.x, box.position.z), toward = offGrid && Math.hypot(nx - h0.px, nz - h0.pz) < Math.hypot(box.position.x - h0.px, box.position.z - h0.pz); if ((world.walkable(nx, nz) && world.clearAt(nx, nz) >= 0.35) || toward) { /* blown off the wall: it may slide out from the flush spot */ box.position.x = nx; box.position.z = nz; } else { st.vx *= -0.3; st.vz *= -0.3; }
      box.rotation.y += (st.vx - st.vz) * dt * 0.6; const f = Math.max(0, 1 - 3.5 * dt); st.vx *= f; st.vz *= f; col.x = box.position.x; col.z = box.position.z; box.position.y = 0;
      if (Math.hypot(st.vx, st.vz) < 0.05) { st.vx = st.vz = 0; st.mode = 'sit'; st.t = rand(4, 8); cur = -1; } return; }
    if (st.alarm > 0) { st.alarm -= dt; const k = 1 - st.alarm / 2.2; bang.visible = st.alarm > 0; bang.scale.setScalar(0.55 * (k < 0.1 ? k / 0.1 * 1.3 : 1)); }
    if (st.mode === 'sit') { if ((st.t -= dt) <= 0 && !S.inView(bp, 1.15) && E.cam.distanceTo(bp) > 4) startMove(); return; }
    if (st.mode === 'freeze') { if ((st.t -= dt) <= 0) { st.mode = 'move'; st.speed = 2.6; } return; }
    // moving: hop-scoot along the path; if you see it, freeze + '!'
    if (!st.caught && S.seen(bp, 48, 30)) { st.caught = true; st.mode = 'freeze'; st.t = 1.6; st.alarm = 2.2; sting(); E.found('box'); return; }
    const tgt = st.path[st.seg], d = Math.hypot(tgt.x - box.position.x, tgt.z - box.position.z), step = st.speed * dt * (0.4 + 1.2 * Math.abs(Math.sin(tm * 9)));
    if (d < step) { box.position.x = tgt.x; box.position.z = tgt.z; if (++st.seg >= st.path.length) { cur = st.to.i; st.mode = 'sit'; st.t = rand(25, 50); box.position.y = 0; let dy = homes[cur].yaw - box.rotation.y; box.rotation.y += Math.atan2(Math.sin(dy), Math.cos(dy)); } }
    else { box.position.x += (tgt.x - box.position.x) / d * step; box.position.z += (tgt.z - box.position.z) / d * step; const want = Math.atan2(tgt.x - box.position.x, tgt.z - box.position.z); let dy = want - box.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); box.rotation.y += dy * Math.min(1, dt * 3); }
    box.position.y = Math.abs(Math.sin(tm * 9)) * 0.03; col.x = box.position.x; col.z = box.position.z; }
  return { name: 'box', group: grp, get anchor() { return box.position; }, cull: 40, update, box, homes, scoot: () => startMove(true), get mode() { return st.mode; }, get caught() { return st.caught; },
    view: () => { const h = box.position, b = V(Math.sin(box.rotation.y), 0, Math.cos(box.rotation.y)); return { from: V(h.x + b.x * 3, 1.6, h.z + b.z * 3), to: V(h.x, 0.5, h.z) }; } };
}
