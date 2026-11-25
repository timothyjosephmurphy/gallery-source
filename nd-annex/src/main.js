import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VFOV_DEG } from './sim/rig.js';
import { annexEnabled, goBack } from './annex.js';
import { createAnnex, BALC } from './annexScene.js';

// ======================================================================================
// Standalone Neural Dance page (/play/neural-dance/): the same annex scene the gallery mounts in-scene
// (src/annexScene.js), here with its own renderer + lights. Visitors start on the elevated observation
// balcony (y = 3.5 m) looking down through the windows into Room 1 (capture) and Room 2 (energy).
// ======================================================================================
const ANNEX = annexEnabled(location);
const $ = id => document.getElementById(id);
const renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15; renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x040309); scene.fog = new THREE.Fog(0x040309, 22, 48);
const view = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 120);
const orbit = new OrbitControls(view, renderer.domElement); orbit.enableDamping = true; orbit.maxPolarAngle = Math.PI * 0.495;
// balcony cove light (standalone only; the gallery build adds no lights)
const annex = createAnnex(THREE, { lights: true, dom: $, sensA: $('sensA'), sensB: $('sensB'), endArches: true });
scene.add(annex.root);
{ const cove = new THREE.PointLight(0xffd9a0, 6, 9, 1.6); cove.position.set(-6, BALC.ceil - 0.4, 7.6); const cove2 = cove.clone(); cove2.position.x = 6; scene.add(cove, cove2); }
const { engine, S, beat, rig, phones, rigMarks, beam, doors, dancers, dancerMeshes, SHUTTERS, room1 } = annex;
const { R1X, R2X, HW, HD, PAINT_X } = annex.consts;
const ceiling = annex.balcony.getObjectByName('balconyCeiling');

// ---------- UI ----------
const toggle = (id, key, after) => $(id).addEventListener('click', () => { S[key] = !S[key]; $(id).classList.toggle('on', S[key]); after && after(); });
toggle('dancing', 'dancing', () => ($('dancing').textContent = S.dancing ? 'Dancing' : 'Quiet / still'));
toggle('sync', 'sync'); toggle('rays', 'rays'); toggle('inspector', 'inspector');
toggle('frustum', 'frustum', () => { phones.A.helper.visible = phones.B.helper.visible = S.frustum; rigMarks.inner.visible = rigMarks.touch.A.visible = rigMarks.touch.B.visible = S.frustum; });
toggle('beam', 'beam', () => (beam.visible = S.beam));
toggle('wave', 'wave'); toggle('beacons', 'beacons');
$('movers').onchange = e => (S.movers = e.target.value);
$('waveKind').onchange = e => (S.waveKind = e.target.value);
$('nd').oninput = e => { annex.setCount(+e.target.value); $('ndOut').textContent = e.target.value; };
$('bpm').oninput = e => { beat.bpm = +e.target.value; $('bpmOut').textContent = e.target.value; };
$('shutter').oninput = e => { S.exposure = SHUTTERS[+e.target.value][0]; $('shOut').textContent = SHUTTERS[+e.target.value][1]; };
$('skew').oninput = e => { S.skew = +e.target.value; $('skOut').textContent = e.target.value + ' ms'; };
$('audio').onclick = async () => { const on = await beat.toggleSynth(); $('audio').classList.toggle('on', on); };
$('mic').onclick = async () => { try { const on = await beat.toggleMic(); $('mic').classList.toggle('on', on); } catch (err) { $('mic').textContent = 'Mic blocked'; } };
$('rigHeight').oninput = e => { rig.heightFt = +e.target.value; annex.reRig(); };
$('rigSpacing').oninput = e => { rig.x0 = +e.target.value; annex.reRig(); };
$('rigSetback').oninput = e => { rig.z0 = -5 + +e.target.value; annex.reRig(); };
$('panelToggle').onclick = () => { const p = $('panel'); p.classList.toggle('collapsed'); $('panelToggle').setAttribute('aria-expanded', !p.classList.contains('collapsed')); };
if (innerWidth < 760) $('panel').classList.add('collapsed');

// ---------- views ----------
const w1 = (x, y, z) => [x + R1X, y, z], w2 = (x, y, z) => [x + R2X, y, z];
const VIEWS = {
  panorama: [[0, 5.35, 7.45], [0, 1.2, -1.5], 62],
  overview: [[0, 15.5, 17.5], [0, 0.6, -0.6], 50],
  room1: [w1(0.5, 5.2, 4.2), w1(0, 1.0, -0.6), 55],
  room2: [w2(-0.6, 4.6, 4.2), w2(0, 1.2, -1.2), 55],
  painting: [w2(PAINT_X, 2.05, -1.8), w2(PAINT_X, 2.05, -HD), 55],
};
const W = { yaw: 0, pitch: 0 };
function setView(v) { keys.clear();
  S.walk = false; $('walk').classList.remove('on'); orbit.enabled = true; ceiling.visible = v !== 'overview';
  if (v === 'a' || v === 'b') { const p = phones[v.toUpperCase()], P = p.cfg.pos, T = p.cfg.target; view.position.set(P[0] + R1X, P[1], P[2]); orbit.target.set(P[0] + R1X + (T[0] - P[0]) * 4, P[1] + (T[1] - P[1]) * 4, P[2] + (T[2] - P[2]) * 4); view.fov = VFOV_DEG; }
  else { const [p, t, f] = VIEWS[v]; view.position.set(...p); orbit.target.set(...t); view.fov = f; }
  view.updateProjectionMatrix(); orbit.update();
  document.querySelectorAll('#views button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
}
document.querySelectorAll('#views button').forEach(b => b.onclick = () => (b.dataset.v === 'walk' ? startWalk() : setView(b.dataset.v)));
// first-person balcony walk: WASD/arrows move, drag / Q,E / IJKL look (no pointer lock needed)
const WALK = { x0: -11.7, x1: 11.7, z0: 5.38, z1: BALC.z1 - 0.38, eye: BALC.eye };
function startWalk(spawn) {
  S.walk = true; orbit.enabled = false; ceiling.visible = true; $('walk').classList.add('on');
  document.querySelectorAll('#views button').forEach(b => b.classList.toggle('on', b.dataset.v === 'walk'));
  const sp = spawn || { x: view.position.x > 0 ? 7.0 : -4.8, z: 6.4, yaw: view.position.x > 0 ? 0.35 : -0.2 };
  view.position.set(sp.x, WALK.eye, sp.z); W.yaw = sp.yaw; W.pitch = -24 * Math.PI / 180; view.fov = 68; view.updateProjectionMatrix(); applyLook();
}
// yaw 0 looks toward -z (through the windows); positive yaw turns left (west)
function applyLook() { W.pitch = Math.max(-1.35, Math.min(1.2, W.pitch)); view.rotation.set(W.pitch, W.yaw, 0, 'YXZ'); }
$('walk').onclick = () => (S.walk ? setView('panorama') : startWalk());

// drag dancers on Room 1's floor; drag elsewhere to look while walking
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); let drag = null, look = null;
const setNdc = e => { ndc.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); ray.setFromCamera(ndc, view); };
renderer.domElement.addEventListener('pointerdown', e => {
  setNdc(e); const hits = ray.intersectObjects(dancerMeshes.map(m => m.root), true);
  if (hits.length) { drag = hits[0].object.userData.dancer; drag.dragged = true; orbit.enabled = false; renderer.domElement.setPointerCapture(e.pointerId); return; }
  const dh = ray.intersectObjects(doors.map(d => d.g), true); if (dh.length && ANNEX) { const d = doors.find(d => d.g === dh[0].object.parent || d.g === dh[0].object.parent?.parent); if (d && dh[0].distance < 6) return leave(d.side); }
  if (S.walk) { look = { x: e.clientX, y: e.clientY }; renderer.domElement.setPointerCapture(e.pointerId); }
});
renderer.domElement.addEventListener('pointermove', e => {
  if (look) { W.yaw -= (e.clientX - look.x) * 0.005; W.pitch -= (e.clientY - look.y) * 0.005; look = { x: e.clientX, y: e.clientY }; applyLook(); return; }
  if (!drag) return; setNdc(e); const p = new THREE.Vector3(); if (ray.ray.intersectPlane(floorPlane, p)) drag.pos = [Math.max(-HW + 0.4, Math.min(HW - 0.4, p.x - R1X)), Math.max(-HD + 0.6, Math.min(HD - 0.4, p.z))];
});
const endDrag = () => {
  look = null; if (!drag) return;
  drag.home = drag.pos.slice(); drag.velXZ = [0, 0]; drag.target = null; drag.pause = 1.5; drag.stepT = engine.simT;
  drag.dragged = false; drag = null; orbit.enabled = !S.walk;
};
renderer.domElement.addEventListener('pointerup', endDrag); renderer.domElement.addEventListener('pointercancel', endDrag);
const keys = new Set();
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return; const k = e.key.toLowerCase();
  if ('wasd'.includes(k) && k.length === 1 && !S.walk) startWalk(); keys.add(k);
  if (k === 'n') document.body.classList.toggle('hudoff');
  const vk = { 1: 'walk', 2: 'panorama', 3: 'overview', 4: 'room1', 5: 'room2', 6: 'painting' }[k]; if (vk) vk === 'walk' ? startWalk() : setView(vk);
});
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear()); document.addEventListener('visibilitychange', () => { if (document.hidden) keys.clear(); });
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); view.aspect = innerWidth / innerHeight; view.updateProjectionMatrix(); });

let leaving = false, walkT = 0;
function leave(side) { if (leaving || !ANNEX) return; leaving = true; goBack(side); }
function walkStep(dt) {
  if (!S.walk) return; walkT += dt;
  const ly = (keys.has('q') || keys.has('j') || keys.has('arrowleft') ? 1 : 0) - (keys.has('e') || keys.has('l') || keys.has('arrowright') ? 1 : 0);
  const lp = (keys.has('i') ? 1 : 0) - (keys.has('k') ? 1 : 0);
  if (ly || lp) { W.yaw += ly * 1.8 * dt; W.pitch += lp * 1.2 * dt; applyLook(); }
  const f = new THREE.Vector3(-Math.sin(W.yaw), 0, -Math.cos(W.yaw)), rgt = new THREE.Vector3(Math.cos(W.yaw), 0, -Math.sin(W.yaw));
  const mv = new THREE.Vector3(); if (keys.has('w') || keys.has('arrowup')) mv.add(f); if (keys.has('s') || keys.has('arrowdown')) mv.sub(f); if (keys.has('d')) mv.add(rgt); if (keys.has('a')) mv.sub(rgt);
  if (mv.lengthSq()) {
    mv.normalize().multiplyScalar(2.4 * dt); const p = view.position;
    const nx = p.x + mv.x, nz = Math.max(WALK.z0, Math.min(WALK.z1, p.z + mv.z));
    // the Kinoteka arches at the balcony ends (x = -12.15 / +12.15, z = 6.5): walk in -> back to the gallery
    if (ANNEX && walkT > 1.2 && Math.abs(nz - 6.5) < 0.85 && (nx < WALK.x0 + 0.02 || nx > WALK.x1 - 0.02) && Math.abs(nx) > 11.3) return leave(nx < 0 ? -1 : 1);
    p.x = Math.max(WALK.x0, Math.min(WALK.x1, nx)); p.z = nz;
  }
  view.position.y = WALK.eye;
}

// ---------- boot ----------
const from = new URLSearchParams(location.search).get('from');
if (ANNEX || from) {
  if (from === 'right') startWalk({ x: 7.0, z: 6.35, yaw: 0.35 }); else startWalk({ x: -4.8, z: 6.45, yaw: -0.2 });
} else setView('panorama');
if (ANNEX) {
  document.body.classList.add('annex');
  const back = document.createElement('div'); back.className = 'row';
  back.innerHTML = '<button id="backL">Back to the Kinoteka (west arch)</button><button id="backR">Back to the Kinoteka (east arch)</button>';
  $('panelBody').prepend(back); $('backL').onclick = () => leave(-1); $('backR').onclick = () => leave(1);
}
window.neuralDance = { engine, S, setView, startWalk, scene, view, get packet() { return annex.packet; } };
let lastT = performance.now();
function loop() {
  requestAnimationFrame(loop);
  const now = performance.now(), dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  annex.tick(dt);
  walkStep(dt); if (!S.walk) orbit.update(); renderer.render(scene, view);
}
loop();
