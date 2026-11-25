// #868 seamless Kinoteka Annex INSIDE the /play/ gallery scene (window.game.scene): no page reload.
// Two real doorways in the Kinoteka hall's west side wall (u = -6) open onto the observation balcony
// (floor = hall floor, 1.2 m); its windows look down 3.5 m into Room 1 (capture) and Room 2 (energy).
// Same simulation modules as /play/neural-dance/ (src/sim/*, src/annexScene.js); THREE = window.game.THREE.
// Zero THREE.Light objects are added (the gallery's light count never changes -> no shader recompiles),
// and outside the Kinoteka hall + annex the per-frame cost is one bounds test.
import { createAnnex, BALC } from './annexScene.js';
import { plantPatioGrass } from './gardenGrass.js';

export const KINO = { D: [24.819, 14.329], F: [0.866, 0.5], T: [0.4999643302543019, -0.866045996742302], rise: 1.2 };
// annex local (x, y, z) -> Kinoteka (u, v, y): u = z + U0, v = V0 - x, y_world = y + Y0
export const FRAME = { U0: -14.4, V0: 19.5, Y0: KINO.rise - BALC.y, doorW: 1.8, doorH: 2.7,
  doors: [{ v: 22.75, hall: 'ANNEX · ROOM 1 CAPTURE' }, { v: 13.55, hall: 'ANNEX · ROOM 2 ENERGY' }] };
export const kW = (u, v) => [KINO.D[0] + u * KINO.T[0] + v * KINO.F[0], KINO.D[1] + u * KINO.T[1] + v * KINO.F[1]];
export const kL = (x, z) => { const dx = x - KINO.D[0], dz = z - KINO.D[1]; return [dx * KINO.T[0] + dz * KINO.T[1], dx * KINO.F[0] + dz * KINO.F[1]]; };
export const inHall = (u, v) => Math.abs(u) < 6.2 && v > 7 && v < 25.2;
export const onBalcony = (u, v) => u < -5.9 && u > -9.6 && v > 7.2 && v < 31.8;
// 870: down the stairs, inside the sunken rooms (annex-local z < 5.6)
export const inPit = (u, v) => u <= -9.6 && u > -19.8 && v > 7.0 && v < 32.0;
export const toLocal = (u, v) => [FRAME.V0 - v, u - FRAME.U0]; // annex-local (x, z)
const VIEWS = { room1: [-12.6, 27.5, -19.0, 26.0, -0.12], stage: [-16.3, 27.0, -10.9, 26.0, -0.16], room2: [-12.4, 12.5, -19.4, 11.5, 0.02], stairs: [-6.9, 28.5, -10.0, 30.9, -0.3], flight: [-10.0, 30.8, -11.4, 24.5, -0.42], balcony: [-8.55, 19.5, -16, 19.5, -0.34], capture: [-8.6, 26.5, -16, 26.5, -0.46], energy: [-8.6, 12.5, -16, 12.5, -0.42], door: [-2.2, 22.75, -10, 22.75, -0.04] };
const DEEP = { 'neural-dance-room1': 'room1', 'neural-dance-stage': 'stage', 'neural-dance-room2': 'room2', 'neural-dance-stairs': 'stairs', 'neural-dance-flight': 'flight', 'neural-dance': 'balcony', 'kinoteka-annex': 'balcony', 'neural-dance-annex': 'balcony', 'neural-dance-capture': 'capture', 'neural-dance-energy': 'energy', 'kinoteka-annex-door': 'door' };
// #899: foot of the Kinoteka front steps (just before the rise at v=7), looking in along the hall axis.
const STEPS = { 'kinoteka-steps': 5.8, 'kinoteka': 5.8 };
function spawnSteps(g, d) {
  const D = KINO.D, f = KINO.F, x = D[0] + f[0] * d, z = D[1] + f[1] * d;
  const apply = () => { g.view(x, z, D[0] + f[0] * 18, D[1] + f[1] * 18); g.camera.updateMatrixWorld(); };
  apply();
  window.__kinoSteps899 = { at: [+x.toFixed(3), +z.toFixed(3)] };
  const onLock = () => { if (!document.pointerLockElement) return; document.removeEventListener('pointerlockchange', onLock); const p = g.camera.position; if (Math.hypot(p.x - x, p.z - z) > 1.5) apply(); };
  document.addEventListener('pointerlockchange', onLock);
}

function install(g) {
  const THREE = g.THREE, scene = g.scene, cam = g.camera;
  const sensA = document.createElement('canvas'), sensB = document.createElement('canvas'); sensA.width = sensB.width = 640; sensA.height = sensB.height = 360;
  const A = createAnnex(THREE, { lights: false, monitors: true, sensA, sensB, count: 14, paintingSrc: '/play/art/paradise-dystopia.jpg',
    backDoors: FRAME.doors.map(d => ({ x: FRAME.V0 - d.v, w: FRAME.doorW, h: FRAME.doorH, label: 'KINOTEKA HALL' })) });
  const root = A.root, o = kW(FRAME.U0, FRAME.V0);
  root.position.set(o[0], FRAME.Y0, o[1]); root.rotation.y = Math.atan2(KINO.T[0], KINO.T[1]); root.visible = false; root.name = 'annex868';
  scene.add(root);
  const st = window.__annex868 = { built: true, annex: A, root, active: false, onBalcony: false, hall: null, ground: [], frames: 0 };
  // --- 870 stairs: walkable + floor height for the sunken rooms (gallery hooks: __walkExtra / __floorH800)
  { const Y0 = FRAME.Y0, prevF = window.__floorH800;
    const localH = (wx, wz) => { const [u, v] = kL(wx, wz), [x, z] = toLocal(u, v); if (z > 5.6 || z < -5.3 || Math.abs(x) > 12.3) return null; const h = A.pitFloor(x, z); return h == null ? null : { h: h + Y0, z }; };
    window.__floorH800 = (wx, wz) => { const q = localH(wx, wz); if (q && q.z < 5.0) return q.h; return prevF ? prevF(wx, wz) : null; };
    (window.__walkExtra = window.__walkExtra || []).push((wx, wz) => { const q = localH(wx, wz); if (!q) return false;
      const cur = cam.position.y - 1.6; return Math.abs(q.h - cur) < 0.5; }); // height continuity: no stepping off the flight's side
    st.stairs = { pitFloor: A.pitFloor, Y0 }; }
  // --- open the two doorways in the hall's west wall (plaster plane + wainscot), same materials
  // 868: the Kinoteka shell's back facade plane (26 m wide at v = 30) crosses the annex pit for u < -6: keep only u >= -6
  { const kg = scene.getObjectByName('kino800'); if (kg) for (const m of [...kg.children]) { const p = m.geometry && m.geometry.parameters;
    if (!m.isMesh || !p || p.width !== 26 || Math.abs(m.position.z - 30) > 0.01) continue; m.visible = false;
    const q = new THREE.Mesh(new THREE.PlaneGeometry(19, p.height), m.material); q.position.set(3.5, m.position.y, 30); q.rotation.copy(m.rotation); q.name = 'kino800-back868'; kg.add(q); st.backClip = true; } }
  const hall = scene.getObjectByName('kino800-hall'); const rise = KINO.rise;
  if (hall) {
    const segs = (v0, v1) => { const out = []; let v = v0; for (const d of [...FRAME.doors].sort((a, b) => a.v - b.v)) { out.push([v, d.v - FRAME.doorW / 2]); v = d.v + FRAME.doorW / 2; } out.push([v, v1]); return out; };
    const hidden = [];
    for (const m of [...hall.children]) {
      const p = m.geometry && m.geometry.parameters; if (!m.isMesh || !p || p.width !== 14 || Math.abs(m.position.x + 5.97) > 0.03) continue;
      const H = p.height, y0 = m.position.y - H / 2; m.visible = false; hidden.push(m.uuid);
      const add = (va, vb, ya, yb) => { if (vb - va < 0.01 || yb - ya < 0.01) return; const q = new THREE.Mesh(new THREE.PlaneGeometry(vb - va, yb - ya), m.material); q.position.set(m.position.x, (ya + yb) / 2, (va + vb) / 2); q.rotation.copy(m.rotation); q.name = 'annex868-hallwall'; hall.add(q); };
      for (const [va, vb] of segs(11, 25)) add(va, vb, y0, y0 + H);
      for (const d of FRAME.doors) add(d.v - FRAME.doorW / 2, d.v + FRAME.doorW / 2, Math.max(y0, rise + FRAME.doorH), y0 + H);
    }
    const brass = new THREE.MeshBasicMaterial({ color: 0xc9a24a }), dark = new THREE.MeshBasicMaterial({ color: 0x2a2230 });
    for (const d of FRAME.doors) {
      for (const s of [-1, 1]) { const j = new THREE.Mesh(new THREE.BoxGeometry(0.2, FRAME.doorH, 0.08), brass); j.position.set(-6.04, rise + FRAME.doorH / 2, d.v + s * (FRAME.doorW / 2 + 0.04)); hall.add(j); }
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, FRAME.doorW + 0.16), brass); top.position.set(-6.04, rise + FRAME.doorH + 0.04, d.v); hall.add(top);
      const th = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, FRAME.doorW), dark); th.position.set(-6.04, rise + 0.01, d.v); hall.add(th);
      const c = document.createElement('canvas'); c.width = 512; c.height = 72; const x = c.getContext('2d'); x.fillStyle = '#1a1206'; x.fillRect(0, 0, 512, 72); x.strokeStyle = '#e8c050'; x.lineWidth = 4; x.strokeRect(2, 2, 508, 68); x.fillStyle = '#ffd860'; x.font = '700 30px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(d.hall, 256, 38);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.225), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); sign.position.set(-5.95, rise + FRAME.doorH + 0.26, d.v); sign.rotation.y = Math.PI / 2; sign.userData.decor800 = true; hall.add(sign);
    }
    st.hall = { hidden };
  }
  // --- any large exterior ground slab near y = 0 that would lid the sunken rooms: discard fragments over the pit
  const pitU = [-20.0, -6.02], pitV = [7.0, 32.0], bb = new THREE.Box3();
  scene.traverse(m => {
    if (!m.isMesh || !m.geometry || m === root) return; for (let p = m; p; p = p.parent) if (p === root || p.name === 'kino800') return;
    bb.setFromObject(m); const sx = bb.max.x - bb.min.x, sz = bb.max.z - bb.min.z; if (bb.min.y >= 1.5 || bb.max.y <= -1.5 || bb.max.y - bb.min.y >= 3.0 || sx < 20 || sz < 20) return;
    const cs = [kW(pitU[0], pitV[0]), kW(pitU[1], pitV[0]), kW(pitU[0], pitV[1]), kW(pitU[1], pitV[1])];
    if (!cs.some(([x, z]) => x > bb.min.x && x < bb.max.x && z > bb.min.z && z < bb.max.z)) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mt of mats) { const prev = mt.onBeforeCompile; mt.onBeforeCompile = (sh, r) => { prev && prev.call(mt, sh, r);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vAnnexW;').replace('#include <project_vertex>', '#include <project_vertex>\nvAnnexW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vAnnexW;`).replace('void main() {', `void main() {\n{ vec2 d = vAnnexW.xz - vec2(${KINO.D[0]}, ${KINO.D[1]}); float u = dot(d, vec2(${KINO.T[0]}, ${KINO.T[1]})), v = dot(d, vec2(${KINO.F[0]}, ${KINO.F[1]})); if (u > ${pitU[0].toFixed(3)} && u < ${pitU[1].toFixed(3)} && v > ${pitV[0].toFixed(3)} && v < ${pitV[1].toFixed(3)}) discard; }`); };
      mt.customProgramCacheKey = (k => () => (k ? k.call(mt) : '') + '|annex868pit')(mt.customProgramCacheKey); mt.needsUpdate = true; }
    st.ground.push(m.name || m.uuid);
  });
  // --- 868c: exterior meshes (kino800 shell beyond the hall, courtyard trees...) that physically enter the annex volume
  //     are hidden only while the visitor is indoors (hall v > 11.2 or balcony), restored the instant they step out.
  st.intruders = []; st.instancedIntruders = []; { const hallG = scene.getObjectByName('kino800-hall'), b = new THREE.Box3();
    scene.traverse(m => { if (!(m.isMesh || m.isPoints || m.isSprite || m.isLine)) return;
      for (let p = m; p; p = p.parent) if (p === root || p === hallG || p === cam) return;
      b.setFromObject(m); if (b.isEmpty()) return; const sx = b.max.x - b.min.x, sz = b.max.z - b.min.z; if (m.isInstancedMesh) { const M = new THREE.Matrix4(), P = new THREE.Vector3(); for (let i = 0; i < m.count; i++) { m.getMatrixAt(i, M); P.setFromMatrixPosition(M).applyMatrix4(m.matrixWorld); const [iu, iv] = kL(P.x, P.z); if (iu > -20.5 && iu < -5.8 && iv > 6.5 && iv < 32.5 && P.y > -3 && P.y < 9) st.instancedIntruders.push({ m, i, orig: M.clone() }); } return; }
      if (sx > 220 || sz > 220 || (m.material && m.material.depthWrite === false && sx > 150)) return;
      if (b.max.y < -3.0 || b.min.y > 9.0) return; let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
      for (const x of [b.min.x, b.max.x]) for (const z of [b.min.z, b.max.z]) { const [u, v] = kL(x, z); u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
      if (u1 > -20.2 && u0 < -6.05 && v1 > 6.8 && v0 < 32.2) st.intruders.push({ m, vis: m.visible }); }); }
  st.intrudersCount = st.intruders.length + st.instancedIntruders.length; st.intrudersHidden = false;
  st.intruderNames = st.intruders.map(o => (o.m.type + ':' + (o.m.name || (o.m.parent && o.m.parent.name) || o.m.uuid.slice(0, 8)))).concat(st.instancedIntruders.map(o => 'Instanced:' + (o.m.name || o.m.uuid.slice(0, 8)) + '#' + o.i));
  const zeroM = new THREE.Matrix4().makeScale(0, 0, 0);
  const setIntruders = hide => { if (hide === st.intrudersHidden) return; st.intrudersHidden = hide; for (const o of st.intruders) { if (hide) { o.vis = o.m.visible; o.m.visible = false; } else o.m.visible = o.vis; }
    for (const o of st.instancedIntruders) { o.m.setMatrixAt(o.i, hide ? zeroM : o.orig); o.m.instanceMatrix.needsUpdate = true; } };
  // --- HUD pill + [L] lab panel (only on the balcony)
  const css = document.createElement('style'); css.textContent = `#annexPill{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:30;font:600 12px ui-monospace,monospace;color:#9effc4;background:rgba(6,8,16,.82);border:1px solid #34e0c0;border-radius:14px;padding:5px 12px;pointer-events:none;display:none;white-space:nowrap;max-width:96vw;overflow:hidden;text-overflow:ellipsis}#annexLab{position:fixed;right:12px;top:48px;z-index:31;width:280px;font:12px system-ui;color:#e8dcff;background:rgba(10,8,22,.92);border:1px solid #8a72ff;border-radius:10px;padding:10px;display:none}#annexLab label{display:block;margin:6px 0}#annexLab input,#annexLab select{width:100%}#annexLab button{margin:3px 3px 0 0}`; document.head.appendChild(css);
  const pill = document.createElement('div'); pill.id = 'annexPill'; document.body.appendChild(pill);
  const lab = document.createElement('div'); lab.id = 'annexLab'; lab.innerHTML = `<b>Neural Dance lab</b> <small>[L] close</small>
<label>3D Dancer Spotlights [M] <select id="alMovers"><option value="top">Follow Top Movers</option><option value="chase">Beat Chase</option><option value="all">All-Dancer Beams</option><option value="off">Off</option></select></label>
<button id="alWave">Crowd Light Wave [C]: off</button><button id="alRays">Stereo rays: off</button>
<label>Shutter <span id="alShO">1/500 s</span><input id="alSh" type="range" min="0" max="5" value="0"></label>
<label>Phone height <span id="alHO">10.0 ft</span><input id="alH" type="range" min="7" max="13" step="0.5" value="10"></label>
<label>Lateral spacing <span id="alXO">3.20 m</span><input id="alX" type="range" min="2.4" max="4.2" step="0.05" value="3.2"></label>
<label>Wall setback <span id="alZO">0.40 m</span><input id="alZ" type="range" min="0.2" max="1.2" step="0.05" value="0.4"></label>`;
  document.body.appendChild(lab); ['click', 'mousedown', 'pointerdown', 'touchstart', 'keydown'].forEach(ev => lab.addEventListener(ev, e => e.stopPropagation()));
  const $ = id => document.getElementById(id), S = A.S, MODES = ['top', 'chase', 'all', 'off'];
  const syncLab = () => { $('alMovers').value = S.movers; $('alWave').textContent = 'Crowd Light Wave [C]: ' + (S.wave ? 'on' : 'off'); $('alRays').textContent = 'Stereo rays: ' + (S.rays ? 'on' : 'off'); };
  $('alMovers').onchange = e => { S.movers = e.target.value; syncLab(); };
  $('alWave').onclick = () => { S.wave = !S.wave; syncLab(); }; $('alRays').onclick = () => { S.rays = !S.rays; syncLab(); };
  $('alSh').oninput = e => { const s = A.SHUTTERS[+e.target.value]; S.exposure = s[0]; $('alShO').textContent = s[1]; };
  $('alH').oninput = e => { A.rig.heightFt = +e.target.value; $('alHO').textContent = A.rig.heightFt.toFixed(1) + ' ft'; A.reRig(); };
  $('alX').oninput = e => { A.rig.x0 = +e.target.value; $('alXO').textContent = A.rig.x0.toFixed(2) + ' m'; A.reRig(); };
  $('alZ').oninput = e => { A.rig.z0 = -5 + +e.target.value; $('alZO').textContent = (+e.target.value).toFixed(2) + ' m'; A.reRig(); };
  addEventListener('keydown', e => {
    if (!st.onBalcony || /INPUT|SELECT|TEXTAREA/.test((e.target && e.target.tagName) || '')) return;
    if (e.code === 'KeyL') { const open = lab.style.display !== 'block'; lab.style.display = open ? 'block' : 'none'; if (open && document.exitPointerLock) document.exitPointerLock(); }
    else if (e.code === 'KeyM') S.movers = MODES[(MODES.indexOf(S.movers) + 1) % MODES.length];
    else if (e.code === 'KeyC') S.wave = !S.wave;
    else return;
    e.stopImmediatePropagation(); e.preventDefault(); syncLab();
  }, true);
  // --- per-frame: bounds gate, then the 60 Hz sim
  let last = performance.now();
  const fr868 = new THREE.Frustum(), m868 = new THREE.Matrix4(), b868a = new THREE.Box3(), b868b = new THREE.Box3();
  (function loop() {
    requestAnimationFrame(loop);
    const now = performance.now(), dt = Math.min(1 / 30, (now - last) / 1000); last = now;
    const [u, v] = kL(cam.position.x, cam.position.z), hallIn = inHall(u, v), pit = inPit(u, v), balc = onBalcony(u, v) || pit, act = hallIn || balc;
    setIntruders((Math.abs(u) < 6.1 && v > 11.2 && v < 25.2) || balc);
    { const [lx, lz] = toLocal(u, v); A.setPlayer(pit && lx < -2 ? [lx - A.consts.R1X, lz] : null); st.inPit = pit; }
    if (act !== st.active) { st.active = root.visible = act; if (!act) { lab.style.display = 'none'; } }
    if (balc !== st.onBalcony) { st.onBalcony = balc; pill.style.display = balc ? 'block' : 'none'; if (!balc) lab.style.display = 'none'; }
    if (!act) return;
    if (document.hidden || (window.__museumPause && window.__museumPause.open)) return;
    // 868 gate: texture uploads only when the rooms are actually on screen
    cam.updateMatrixWorld(); fr868.setFromProjectionMatrix(m868.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const see1 = fr868.intersectsBox(b868a.setFromObject(A.room1)), see2 = fr868.intersectsBox(b868b.setFromObject(A.room2));
    st.frames++; A.tick(dt, { sensorsHz: see1 ? (balc ? 20 : 4) : 0, paint: see2 });
    if (balc && st.frames % 12 === 0) pill.textContent = A.TXT.pill ? A.TXT.pill.textContent + ' · [L] lab · [M] spots (both rooms) · [C] wave' : '';
  })();
  try { st.patioGrass = !!plantPatioGrass(THREE, scene); } catch (e) { console.warn('[870 grass]', e); }
  // 868d: pre-warm ~0.8 s of simulation so the stereo pipe is already locked and Room 2 is live on frame 1
  try { for (let i = 0; i < 48; i++) A.tick(1 / 60, { sensorsHz: 2, paint: true }); } catch (e) { console.warn('[868 prewarm]', e); }
  return st;
}

// spawn on the balcony facing the windows, looking down into both rooms
export function spawnBalcony(g, tilt, view = 'balcony') {
  const V = VIEWS[view] || VIEWS.balcony; if (tilt == null) tilt = V[4];
  const [x, z] = kW(V[0], V[1]), [lx, lz] = kW(V[2], V[3]);
  g.view(x, z, lx, lz); g.camera.rotateX(tilt); g.camera.updateMatrixWorld();
}

function guards() {
  // pointer lock: swallow the SecurityError of a click inside the browser's post-Esc cooldown, retry once
  const P = Element.prototype, rpl = P.requestPointerLock;
  if (rpl && !rpl.__annex868) {
    let retrying = false;
    const w = function (...a) { const el = this; let r; try { r = rpl.apply(el, a); } catch (e) { r = null; }
      if (r && typeof r.catch === 'function') return r.catch(() => { if (retrying) return; retrying = true; setTimeout(() => { retrying = false; try { const q = rpl.apply(el, a); q && q.catch && q.catch(() => { }); } catch (e) { } }, 350); });
      return r; };
    w.__annex868 = true; P.requestPointerLock = w;
  }
}

(function boot() {
  if (typeof window === 'undefined' || window.__annex868boot) return; window.__annex868boot = true;
  guards();
  // #goto: our entry + blur after any pick so W/S/arrows never re-change the select
  document.addEventListener('change', e => { const s = e.target; if (!s || s.id !== 'goto') return;
    if (s.value === '__annex868') { e.stopImmediatePropagation(); e.preventDefault(); s.value = ''; if (window.game) spawnBalcony(window.game); }
    setTimeout(() => s.blur(), 0); }, true);
  const menu = () => { const s = document.getElementById('goto'); if (!s || s.querySelector('option[value="__annex868"]')) return;
    const og = document.createElement('optgroup'); og.label = 'Kinoteka Annex'; const o = document.createElement('option'); o.value = '__annex868'; o.textContent = 'Neural Dance Annex (balcony)'; og.appendChild(o); s.appendChild(og); };
  const q = new URLSearchParams(location.search);
  // Query-string room/goto wins when present; otherwise /play/kinoteka[/] is the kinoteka-steps alias.
  const key = (q.get('room') || q.get('goto') || (/^\/play\/kinoteka\/?$/i.test(location.pathname) ? 'kinoteka-steps' : '')).toLowerCase();
  const deep = DEEP[key] || null, steps = STEPS[key] || 0;
  let tries = 0; const iv = setInterval(() => { menu(); const g = window.game;
    if (g && g.scene && g.THREE && g.camera && !window.__annex868) { try { install(g); if (steps) spawnSteps(g, steps); if (deep) { spawnBalcony(g, null, deep); const re = () => { if (!document.pointerLockElement) return; document.removeEventListener('pointerlockchange', re); const [bu, bv] = kL(g.camera.position.x, g.camera.position.z); if (deep === 'door' ? !inHall(bu, bv) : !(onBalcony(bu, bv) || inPit(bu, bv))) spawnBalcony(g, null, deep); }; document.addEventListener('pointerlockchange', re); } } catch (e) { console.warn('[868 annex]', e); window.__annex868 = { err: String(e && e.stack || e) }; } }
    if (window.__annex868 && (++tries > 50)) clearInterval(iv); }, 200);
})();
