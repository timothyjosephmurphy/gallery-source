// Shared Neural Dance annex scene: Room 1 (capture) + Room 2 (energy) + the elevated observation balcony.
// Built into one THREE.Group in "annex local" coordinates (room floors y = 0, balcony floor y = 3.5,
// balcony along z = 5..8.3 with its windows on z = +5). Used by the standalone page (src/main.js, with
// its own lights) and by the in-scene gallery annex (src/inSceneAnnex.js, NO THREE.Light objects so the
// gallery's light count never changes and no gallery material recompiles).
// THREE is passed in, so the gallery build reuses window.game.THREE instead of bundling a second copy.
import { makeCamera, project, distortPixel, v3 } from './sim/camera.js';
import { makeDancer, dancerState, pinRGB, ROOM } from './sim/world.js';
import { SURFACES, surfaceAt } from './sim/stage.js';
import { solveSymmetricRig, RIG_DEFAULT, VFOV_DEG, ASPECT, TAN_H, TAN_V, basis, rayDir, clipToRoom, LENS } from './sim/rig.js';
import { PACKET_FRAMES } from './sim/code.js';
import { Beat } from './audio.js';
import { createDrive, joints3D } from './ndDrive.js';
import { createEnergy3D } from './energy3d.js';
import { placePose, paintShadowFigure, paintSilhouetteHalo, haloAuraScale } from './nd/skeleton-dancer.js';
import { Engine } from './sim/engine.js';
import { FIXTURES, newMoverState, selectTargets, panTilt, aimDir, slew, holdFade } from './sim/movers.js';

export const BALC = { y: 3.5, ceil: 6.5, x0: -12.2, x1: 12.2, z0: 5, z1: 8.3, sill: 4.35, glassTop: 6.15, eye: 5.15,
  windows: [{ x0: -10.5, x1: -2.5, plaque: ['WINDOW 1 · CAPTURE ROOM', '10 ft Sensors & Shadow Dancers'] }, { x0: -1.7, x1: 1.7, plaque: null }, { x0: 2.5, x1: 10.5, plaque: ['WINDOW 2 · NEURAL DANCE ROOM', 'Piped Energy Sprites'] }] };

export function createAnnex(THREE, opt = {}) {
const LIGHTS = opt.lights !== false;
const TXT = {}; const $$ = id => (opt.dom && opt.dom(id)) || (TXT[id] ||= { textContent: '' });
const R1X = -7, R2X = 7, HW = 5, HD = 5, WALL_H = 4;
// 870 (TJ 9:17 PM): walkable stairs from the balcony down into Room 1 and Room 2. One straight flight per room
// along the front wall (z = 3.85..5.0): balcony opening at x = ±(10.75..12.05) -> landing (y = 3.5) -> 20 risers
// of 0.175 m / 0.28 m treads down toward the centre, foot at x = ±5.15. Dancers wander z <= 3.7 so the flight never cuts the floor.
const STAIR = { open: [-12.05, -10.75], z0: 3.85, z1: 5.0, top: 10.75, foot: 5.15, n: 20 };
// Floor height (annex-local metres) for the sunken rooms + stairs; null = not walkable. xs: |x| mirrored per room.
function pitFloor(x, z) {
  const ax = Math.abs(x), S0 = STAIR;
  if (z > S0.z1 - 0.02) return z < 5.6 && ax > -S0.open[1] && ax < -S0.open[0] - 0.25 ? BALC.y : null; // through the balcony opening
  if (z < -HD + 0.3) return null;
  if (z >= S0.z0 + 0.12) { // on the flight / landing
    if (ax >= S0.top && ax < 2 * HW + 2 - 0.3) return BALC.y;
    if (ax >= S0.foot && ax < S0.top) return BALC.y * (ax - S0.foot) / (S0.top - S0.foot);
  }
  if (z > HD - 0.3) return null;
  if (ax > 2 * HW + 2 - 0.3) return null;
  if (z > S0.z0 - 0.3 && z < S0.z0 + 0.12 && ax > S0.foot - 0.05) return null; // beside the flight's open edge (balustrade)
  if (ax < 2.3) return Math.abs(z) < 1.0 ? 0 : null;        // archway between the rooms (divider walls at |x| = 2)
  return x < 0 ? surfaceAt(x - R1X, z) : 0;                  // 871: Room 1 stage / risers / speaker stacks
}
const PAINT = { w: 2.8, h: 1.4, cy: 2.05, z: -HD + 0.03 };
const SHUTTERS = [[1 / 500, '1/500 s'], [1 / 250, '1/250 s'], [1 / 125, '1/125 s'], [1 / 60, '1/60 s'], [1 / 30, '1/30 s'], [1 / 15, '1/15 s']];

const root = new THREE.Group(); root.name = 'neuralDanceAnnex'; const scene = root;
if (LIGHTS) scene.add(new THREE.HemisphereLight(0x5a4aa8, 0x0a0814, 0.42), new THREE.AmbientLight(0x241c36, 0.5));
const room1 = new THREE.Group(); room1.position.x = R1X; scene.add(room1);
const room2 = new THREE.Group(); room2.position.x = R2X; scene.add(room2);

const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.18, 'rgba(255,255,255,0.65)'); r.addColorStop(0.5, 'rgba(255,255,255,0.14)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
function makeLabel(text, color, w = 0.5, font = '600 30px system-ui', cw = 256) {
  const c = document.createElement('canvas'); c.width = cw; c.height = 64; const g = c.getContext('2d'); g.font = font; g.fillStyle = typeof color === 'string' ? color : '#' + new THREE.Color(color).getHexString(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, cw / 2, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(w, w * 64 / cw, 1); return s;
}
function signPlane(lines, w, h, color = '#e8dcff', bg = 'rgba(10,8,22,0.88)', border = '#8a72ff') {
  const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * h / w); const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = border; g.lineWidth = 6; g.strokeRect(6, 6, c.width - 12, c.height - 12);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach(([txt, size, col], i) => { g.font = `700 ${size}px system-ui,sans-serif`; g.fillStyle = col || color; g.fillText(txt, c.width / 2, c.height * (i + 0.5) / lines.length); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
}

// ---------- architecture ----------
function gridTex(line, base) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i <= 8; i++) { g.strokeStyle = line; g.lineWidth = 2; g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 512); g.moveTo(0, i * 64); g.lineTo(512, i * 64); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(HW, HD); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const wallMat1 = new THREE.MeshStandardMaterial({ color: 0x15121f, roughness: 0.9 });
const wallMat2 = new THREE.MeshStandardMaterial({ color: 0x0d0b18, roughness: 0.85 });
const trimMat = new THREE.MeshBasicMaterial({ color: 0xb8923a });
// wall along z (constant x) from z0..z1, with rectangular holes [{z0,z1,y0,y1}]
function wallZ(parent, mat, x, z0, z1, holes = [], h = WALL_H, t = 0.16) {
  const add = (za, zb, ya, yb) => { if (zb - za < 0.01 || yb - ya < 0.01) return; const m = new THREE.Mesh(new THREE.BoxGeometry(t, yb - ya, zb - za), mat); m.position.set(x, (ya + yb) / 2, (za + zb) / 2); parent.add(m); };
  let z = z0; for (const hl of [...holes].sort((a, b) => a.z0 - b.z0)) { add(z, hl.z0, 0, h); add(hl.z0, hl.z1, 0, hl.y0); add(hl.z0, hl.z1, hl.y1, h); z = hl.z1; } add(z, z1, 0, h);
}
function wallX(parent, mat, z, x0, x1, h = WALL_H, t = 0.16) { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, t), mat); m.position.set((x0 + x1) / 2, h / 2, z); parent.add(m); return m; }
const neon = (parent, pts, col, op = 0.6) => { const g = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p))); const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op })); parent.add(l); return l; };
const ARCH = { z0: -1.3, z1: 1.3, y0: 0, y1: 2.9 }, WIN = { z0: 1.9, z1: 4.1, y0: 0.95, y1: 2.45 }, DOOR = { z0: 1.75, z1: 3.25, y0: 0, y1: 2.6 };
function buildRoom(g, { floorLine, floorBase, mat, outerX, innerX, accent }) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * HW, 2 * HD), new THREE.MeshStandardMaterial({ map: gridTex(floorLine, floorBase), roughness: 0.32, metalness: 0.15 }));
  floor.rotation.x = -Math.PI / 2; g.add(floor);
  wallX(g, mat, -HD, -HW, HW);                         // back wall
  wallX(g, mat, HD, -HW, HW, BALC.y);                  // front wall up to the balcony floor (balcony windows above)
  wallZ(g, mat, outerX, -HD, HD, []);                  // outer wall (the Kinoteka doors are up on the balcony)
  wallZ(g, mat, innerX, -HD, HD, [ARCH, WIN]);         // divider wall: archway + observation window
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(WIN.z1 - WIN.z0, WIN.y1 - WIN.y0), new THREE.MeshStandardMaterial({ color: 0x0c1022, transparent: true, opacity: 0.42, roughness: 0.05, metalness: 0.6, side: THREE.DoubleSide, depthWrite: false }));
  glass.rotation.y = Math.PI / 2; glass.position.set(innerX, (WIN.y0 + WIN.y1) / 2, (WIN.z0 + WIN.z1) / 2); g.add(glass);
  neon(g, [[innerX, WIN.y0, WIN.z0], [innerX, WIN.y1, WIN.z0], [innerX, WIN.y1, WIN.z1], [innerX, WIN.y0, WIN.z1], [innerX, WIN.y0, WIN.z0]], 0x4fd8ff, 0.5);
  neon(g, [[innerX, 0, ARCH.z0], [innerX, ARCH.y1, ARCH.z0], [innerX, ARCH.y1, ARCH.z1], [innerX, 0, ARCH.z1]], accent, 0.9);
  neon(g, [[-HW, 3.7, HD], [-HW, 3.7, -HD + 0.09], [HW, 3.7, -HD + 0.09], [HW, 3.7, HD]], accent, 0.45);
  neon(g, [[-HW + 0.09, 0.02, HD], [-HW + 0.09, 0.02, -HD + 0.09], [HW - 0.09, 0.02, -HD + 0.09], [HW - 0.09, 0.02, HD]], 0xff3d8b, 0.5);
  return floor;
}
const floor1 = buildRoom(room1, { floorLine: 'rgba(140,110,255,0.24)', floorBase: '#0b0912', mat: wallMat1, outerX: -HW, innerX: HW, accent: 0x6a4cff });
const floor2 = buildRoom(room2, { floorLine: 'rgba(90,220,255,0.10)', floorBase: '#06050c', mat: wallMat2, outerX: HW, innerX: -HW, accent: 0x34e0c0 });
// 868 pit enclosure: inward-facing (FrontSide) dark planes seal x in [-12.3, 12.3], z in [-5.12, 5.08], y in [0, 6.55].
// Ceiling faces DOWN (opaque from the balcony, see-through from the standalone overview camera above).
{ const encMat = new THREE.MeshBasicMaterial({ color: 0x09080f, side: LIGHTS ? THREE.FrontSide : THREE.DoubleSide }), ribMat = new THREE.MeshBasicMaterial({ color: 0x15121f });
  const pl = (w, h, x, y, z, rx, ry, m = encMat) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.set(rx, ry, 0); p.name = 'annexEnclosure868'; scene.add(p); return p; };
  const H = BALC.ceil + 0.05, ZB = -5.15, ZF = 5.06, XS = 12.22;
  pl(2 * XS + 0.1, H, 0, H / 2, ZB, 0, 0);                         // back wall, faces +z
  pl(ZF - ZB, H, -XS, H / 2, (ZB + ZF) / 2, 0, Math.PI / 2);          // -x wall, faces +x
  pl(ZF - ZB, H, XS, H / 2, (ZB + ZF) / 2, 0, -Math.PI / 2);          // +x wall, faces -x
  pl(2 * XS + 0.1, ZF - ZB, 0, BALC.ceil - 0.01, (ZB + ZF) / 2, Math.PI / 2, 0); // ceiling, faces down
  for (let x = -10.8; x < 11; x += 2.4) pl(0.12, ZF - ZB, x, BALC.ceil - 0.03, (ZB + ZF) / 2, Math.PI / 2, 0, ribMat); // coffer ribs
  pl(4.1, ZF - ZB, 0, 0.001, (ZB + ZF) / 2, -Math.PI / 2, 0);      // central corridor floor, faces up
  pl(4.1, H, 0, H / 2, -5.05, 0, 0);                                 // central alcove back wall
}
// passage between the two divider walls (x = -2..2 in world)
const passMat = new THREE.MeshStandardMaterial({ color: 0x100e1a, roughness: 0.9 });
for (const z of [ARCH.z0 - 0.08, ARCH.z1 + 0.08]) wallX(scene, passMat, z, -2, 2, 2.9, 0.16);
{ const pf = new THREE.Mesh(new THREE.PlaneGeometry(4, ARCH.z1 - ARCH.z0), new THREE.MeshStandardMaterial({ color: 0x0b0a12, roughness: 0.6 })); pf.rotation.x = -Math.PI / 2; pf.position.y = 0.002; scene.add(pf);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(4, 0.12, ARCH.z1 - ARCH.z0 + 0.32), passMat); lintel.position.set(0, 2.96, 0); scene.add(lintel);
  neon(scene, [[-2, 0.02, ARCH.z0 + 0.05], [2, 0.02, ARCH.z0 + 0.05]], 0x6a4cff, 0.7); neon(scene, [[-2, 0.02, ARCH.z1 - 0.05], [2, 0.02, ARCH.z1 - 0.05]], 0x34e0c0, 0.7); }
// room signs (on the back walls, high) + door signs
{ const s1 = signPlane([['CAPTURE ROOM', 92, '#cdbfff'], ['Dance Floor & Phone Sensors', 54, '#9effc4']], 4.6, 0.82); s1.position.set(0, 3.25, -HD + 0.1); room1.add(s1);
  const s2 = signPlane([['NEURAL DANCE ROOM', 88, '#bff7ee'], ['Piped Energy Sprites', 56, '#ffd98a']], 4.6, 0.82, '#e8dcff', 'rgba(6,10,18,0.9)', '#34e0c0'); s2.position.set(-2.2, 3.35, -HD + 0.1); s2.scale.setScalar(0.62); room2.add(s2);
  const a1 = makeLabel('ROOM 1 → ROOM 2', '#cdbfff', 1.6, '700 30px system-ui', 512); a1.position.set(-2.6, 3.2, 0); scene.add(a1);
  const a2 = makeLabel('ROOM 2 ← ROOM 1', '#bff7ee', 1.6, '700 30px system-ui', 512); a2.position.set(2.6, 3.2, 0); scene.add(a2); }
// Kinoteka doors (balcony end arches in the standalone page)
const doors = [];
function buildDoor(parent, x, y, z, label, side, facing) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = facing; parent.add(g);
  const c = document.createElement('canvas'); c.width = 256; c.height = 420; const xg = c.getContext('2d'); const gr = xg.createLinearGradient(0, 0, 0, 420); gr.addColorStop(0, '#e7dcc4'); gr.addColorStop(1, '#8e1b20'); xg.fillStyle = gr; xg.fillRect(0, 0, 256, 420); xg.fillStyle = 'rgba(20,10,10,.55)'; xg.fillRect(0, 300, 256, 120);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const p = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.6), new THREE.MeshBasicMaterial({ map: t })); p.position.set(0, 1.3, -0.06); g.add(p);
  for (const sx of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.7, 0.08), trimMat); b.position.set(sx * 0.8, 1.35, 0.03); g.add(b); }
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 0.08), trimMat); top.position.set(0, 2.68, 0.03); g.add(top);
  const lab = makeLabel(label, '#ffd98a', 2.0, '600 30px system-ui', 512); lab.position.set(0, 2.98, 0.1); g.add(lab);
  doors.push({ g, side, parent });
}

// ---------- Room 1: shadow avatars ----------
const shadowMat = (() => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, uniforms: { uBase: { value: new THREE.Color(LIGHTS ? 0x1c1a3a : 0x26224e) }, uRim: { value: new THREE.Color(LIGHTS ? 0x8a72ff : 0xa992ff) }, uOpacity: { value: LIGHTS ? 0.38 : 0.5 } },
  vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform vec3 uBase; uniform vec3 uRim; uniform float uOpacity; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2); vec3 c = mix(uBase, uRim, f); gl_FragColor = vec4(c, uOpacity + 0.45 * f); }',
}))();
const dancers = [], dancerMeshes = [];
// 869: bodies are ellipsoid volumes posed from the live Neural Dance skeleton (one InstancedMesh, one draw call)
const PARTS = ['head', 'neck', 'chest', 'pelvis', 'uaL', 'uaR', 'faL', 'faR', 'hdL', 'hdR', 'thL', 'thR', 'shL', 'shR', 'ftL', 'ftR'];
const MAXD = 25;
const bodyMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: true, uniforms: { uBase: { value: new THREE.Color(LIGHTS ? 0x1c1a3a : 0x221f40) }, uOpacity: { value: LIGHTS ? 0.55 : 0.78 } },
  vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vC; void main(){ mat3 im = mat3(instanceMatrix); vec4 mv = modelViewMatrix * instanceMatrix * vec4(position,1.0); vN = normalize(normalMatrix * (inverse(transpose(im)) * normal)); vV = normalize(-mv.xyz); vC = instanceColor; gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform vec3 uBase; uniform float uOpacity; varying vec3 vN; varying vec3 vV; varying vec3 vC; void main(){ vec3 n = normalize(vN); float f = pow(1.0 - abs(dot(n, normalize(vV))), 2.0); float key = 0.5 + 0.5 * dot(n, normalize(vec3(-0.5, 0.7, 0.5))); vec3 c = uBase * (0.55 + 0.6 * key) + vC * f; gl_FragColor = vec4(c, uOpacity + 0.3 * f); }',
});
const bodies = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), bodyMat, MAXD * PARTS.length);
bodies.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAXD * PARTS.length * 3), 3); bodies.count = 0; bodies.frustumCulled = false; bodies.renderOrder = 1; bodies.name = 'nd869-bodies'; room1.add(bodies);
function buildDancerMesh(dn) {
  const s = dn.height / 1.75;
  const root = new THREE.Group(); // kept for API compatibility (no meshes: bodies are instanced)
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); pin.renderOrder = 3;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); halo.scale.setScalar(0.26); pin.add(halo);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.006;
  const headGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })); headGlow.renderOrder = 4;
  room1.add(root, pin, pool, headGlow);
  return { root, pin, halo, pool, headGlow, s, J: {} };
}
function setCount(n) {
  while (dancers.length < n) { const d = makeDancer(dancers.length); dancers.push(d); dancerMeshes.push(buildDancerMesh(d)); }
  while (dancers.length > n) { dancers.pop(); const m = dancerMeshes.pop(); room1.remove(m.root, m.pin, m.pool, m.headGlow); m.root.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); }
}

// ---------- Room 1: iPhones on 10 ft mounts ----------
// TJ t2226u: mirrored phones on the back (-z) wall, equal inward yaw solved so each outside frustum face
// touches its outside wall (x = -5 / +5) and the inside edges cross on the centreline.
const rig = { heightFt: 10, x0: RIG_DEFAULT.x0, z0: RIG_DEFAULT.z0, solved: null };
function solveRig() { rig.solved = solveSymmetricRig({ height: rig.heightFt * 0.3048, x0: rig.x0, z0: rig.z0 }); return rig.solved; }
const phones = {};
function buildPhone(key, color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.075, 0.009), new THREE.MeshStandardMaterial({ color: 0x1c1c22, metalness: 0.7, roughness: 0.3 })); g.add(body);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.066), new THREE.MeshBasicMaterial({ color })); screen.position.z = -0.0047; screen.rotation.y = Math.PI; g.add(screen);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.004, 14), new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.9, roughness: 0.1 })); lens.rotation.x = Math.PI / 2; lens.position.set(-0.05, 0.02, 0.006); g.add(lens);
  const tally = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); tally.scale.setScalar(0.3); g.add(tally);
  const mount = new THREE.Group(); room1.add(mount);
  const label = makeLabel(key === 'A' ? 'iPhone A · 10 ft' : 'iPhone B · 10 ft', color, 0.9, '600 30px system-ui', 512); label.position.set(0, 0.2, 0); g.add(label); phones[key] = { label };
  const cam3 = new THREE.PerspectiveCamera(VFOV_DEG, ASPECT, 0.15, 14); // same VFOV_DEG as the sensor model
  // frustum drawn as the exact corner/edge rays of the sensor camera, clipped where they meet Room 1's walls/floor
  const helper = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false })); helper.frustumCulled = false;
  room1.add(g, cam3, helper);
  Object.assign(phones[key], { g, mount, cam3, helper, sim: null, color });
}
function placePhone(key) {
  const p = phones[key], R = rig.solved || solveRig(), cfg = R[key];
  p.sim = makeCamera({ ...cfg, ...LENS }); p.cfg = cfg;
  p.g.position.set(...cfg.pos); p.g.lookAt(...cfg.target);
  p.cam3.position.set(...cfg.pos); p.cam3.lookAt(...cfg.target); p.cam3.fov = VFOV_DEG; p.cam3.far = 14; p.cam3.updateProjectionMatrix(); p.cam3.updateWorldMatrix(true, false);
  { // frustum rays: 4 corners + the image border traced to where it lands on the walls/floor
    const B = basis(cfg.yaw, cfg.pitch), C = cfg.pos, v = [], end = (xn, yn) => { const D = rayDir(B, xn, yn), s = clipToRoom(C, D, 40); return [C[0] + D[0] * s, C[1] + D[1] * s, C[2] + D[2] * s]; };
    for (const [xn, yn] of [[TAN_H, TAN_V], [-TAN_H, TAN_V], [TAN_H, -TAN_V], [-TAN_H, -TAN_V]]) v.push(...C, ...end(xn, yn));
    const border = []; const N = 24;
    for (let i = 0; i < N; i++) border.push([-TAN_H + 2 * TAN_H * i / N, TAN_V]); for (let i = 0; i < N; i++) border.push([TAN_H, TAN_V - 2 * TAN_V * i / N]);
    for (let i = 0; i < N; i++) border.push([TAN_H - 2 * TAN_H * i / N, -TAN_V]); for (let i = 0; i < N; i++) border.push([-TAN_H, -TAN_V + 2 * TAN_V * i / N]);
    for (let i = 0; i < border.length; i++) v.push(...end(...border[i]), ...end(...border[(i + 1) % border.length]));
    // horizontal outer + inner edge rays (yn = 0), the lines TJ asked to touch the wall / cross each other
    v.push(...C, ...end(TAN_H, 0), ...C, ...end(-TAN_H, 0));
    p.helper.geometry.dispose(); p.helper.geometry = new THREE.BufferGeometry(); p.helper.geometry.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  }
  rigMarks.touch[key].position.set(...(key === 'A' ? R.touchA : R.touchB)); rigMarks.inner.position.set(...R.inner);
  // tripod mast to the floor + wall bracket arm
  p.mount.clear(); const lm = new THREE.MeshStandardMaterial({ color: 0x5a5a66, metalness: 0.7, roughness: 0.4 });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, cfg.pos[1] - 0.05, 8), lm); mast.position.set(cfg.pos[0], (cfg.pos[1] - 0.05) / 2, cfg.pos[2]); p.mount.add(mast);
  for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.4; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.75, 6), lm); leg.position.set(cfg.pos[0] + Math.cos(a) * 0.26, 0.33, cfg.pos[2] + Math.sin(a) * 0.26); leg.lookAt(cfg.pos[0], 0.95, cfg.pos[2]); leg.rotateX(Math.PI / 2); p.mount.add(leg); }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.008, 6, 20), new THREE.MeshBasicMaterial({ color: p.color })); ring.rotation.x = Math.PI / 2; ring.position.set(cfg.pos[0], cfg.pos[1] - 0.05, cfg.pos[2]); p.mount.add(ring);
  p.label.material.map.dispose(); const nl = makeLabel(`iPhone ${key} · ${rig.heightFt.toFixed(1)} ft`, p.color, 0.9, '600 30px system-ui', 512); p.g.remove(p.label); p.label = nl; nl.position.set(0, 0.2, 0); p.g.add(nl);
  if (engine) engine.reset();
  updateRigReadout();
}
let engine = null;
const rigMarks = (() => { const mk = (col, sz) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); m.scale.setScalar(sz); room1.add(m); return m; };
  const inner = mk(0xffffff, 0.5); const lab = makeLabel('inner edges cross', '#ffffff', 1.0, '600 28px system-ui', 512); lab.position.set(0, 0.32, 0); inner.add(lab); lab.scale.set(2, 0.25, 1);
  return { touch: { A: mk(0x4fd8ff, 0.55), B: mk(0xffb84f, 0.55) }, inner }; })();
// receiver rack (stereo host) in Room 1 next to the divider wall
const RACK = [HW - 0.55, 0, -3.6];
{ const rack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.6, 0.6), new THREE.MeshStandardMaterial({ color: 0x14121e, metalness: 0.6, roughness: 0.4 })); rack.position.set(RACK[0], 0.8, RACK[2]); room1.add(rack);
  for (let i = 0; i < 5; i++) { const led = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.03), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x9effc4 : 0x4fd8ff })); led.position.set(RACK[0] - 0.301, 0.45 + i * 0.22, RACK[2]); led.rotation.y = -Math.PI / 2; room1.add(led); }
  const lab = makeLabel('Stereo host · receiver rack', '#9effc4', 1.5, '600 30px system-ui', 512); lab.position.set(RACK[0] - 0.2, 1.85, RACK[2]); room1.add(lab); }
const linkGeo = new THREE.BufferGeometry(); linkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
const links = new THREE.LineSegments(linkGeo, new THREE.LineDashedMaterial({ color: 0x4fd8ff, dashSize: 0.12, gapSize: 0.1, transparent: true, opacity: 0.45 })); links.frustumCulled = false; room1.add(links);

// ---------- data pipe (Room 1 rack -> passage -> Room 2 hub) ----------
const HUB = [-HW + 0.55, 0, -3.6]; // Room 2 local
const pipePts = [[R1X + RACK[0], 1.62, RACK[2]], [R1X + RACK[0], 3.45, RACK[2]], [R1X + RACK[0], 3.45, -0.6], [-1.2, 3.45, 0], [1.2, 3.45, 0], [R2X + HUB[0], 3.45, -0.6], [R2X + HUB[0], 3.45, HUB[2]], [R2X + HUB[0], 1.62, HUB[2]]].map(p => new THREE.Vector3(...p));
const pipeCurve = new THREE.CatmullRomCurve3(pipePts, false, 'catmullrom', 0.08);
scene.add(new THREE.Mesh(new THREE.TubeGeometry(pipeCurve, 240, 0.075, 12, false), new THREE.MeshStandardMaterial({ color: 0x1a2a3a, emissive: 0x1b4fa0, emissiveIntensity: 0.55, transparent: true, opacity: 0.55, roughness: 0.3, metalness: 0.4, depthWrite: false })));
scene.add(new THREE.Mesh(new THREE.TubeGeometry(pipeCurve, 240, 0.022, 8, false), new THREE.MeshBasicMaterial({ color: 0x7fe8ff })));
const pulses = Array.from({ length: 36 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x9ff3ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.visible = false; scene.add(s); return { s, u: 0, live: false, size: 0.3 }; });
{ const hub = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.6, 0.6), new THREE.MeshStandardMaterial({ color: 0x0f1a20, metalness: 0.6, roughness: 0.4, emissive: 0x0a3a40, emissiveIntensity: 0.5 })); hub.position.set(HUB[0], 0.8, HUB[2]); room2.add(hub);
  const lab = makeLabel('Pipe receiver · NeuralDanceFramePacket', '#bff7ee', 1.9, '600 28px system-ui', 640); lab.position.set(HUB[0] + 0.3, 1.85, HUB[2]); room2.add(lab); }
let pipeLen = pipeCurve.getLength();

// ---------- Room 2: painting with projected sprites ----------
const pc = document.createElement('canvas'); pc.width = 1480; pc.height = 740; const pg = pc.getContext('2d');
const paintTex = new THREE.CanvasTexture(pc); paintTex.colorSpace = THREE.SRGBColorSpace; paintTex.anisotropy = 8;
const img = new Image(); let imgReady = false; img.onload = () => { imgReady = true; }; img.src = opt.paintingSrc || (/^\/play\//.test(location.pathname) ? '/play/art/paradise-dystopia.jpg' : './paradise-dystopia.jpg');
const PAINT_X = 1.0;
const painting = new THREE.Mesh(new THREE.PlaneGeometry(PAINT.w, PAINT.h), new THREE.MeshStandardMaterial({ map: paintTex, roughness: 0.85, emissive: 0xffffff, emissiveMap: paintTex, emissiveIntensity: 0.22 }));
painting.position.set(PAINT_X, PAINT.cy, PAINT.z + 0.08); room2.add(painting);
{ const fr = new THREE.Mesh(new THREE.BoxGeometry(PAINT.w + 0.08, PAINT.h + 0.08, 0.04), new THREE.MeshStandardMaterial({ color: 0x18120c, roughness: 0.6 })); fr.position.set(PAINT_X, PAINT.cy, PAINT.z + 0.055); room2.add(fr);
  if (LIGHTS) { const sp = new THREE.SpotLight(0xfff1dd, 30, 9, 0.6, 0.5, 1.4); sp.position.set(PAINT_X, 3.9, -2.4); sp.target.position.set(PAINT_X, PAINT.cy, PAINT.z); room2.add(sp, sp.target); }
  const cap = makeLabel('Paradise Dystopia · live sprite projection', '#ffd98a', 1.7, '600 28px system-ui', 640); cap.position.set(PAINT_X, PAINT.cy - PAINT.h / 2 - 0.16, PAINT.z + 0.12); room2.add(cap); }
const projPos = new THREE.Vector3(PAINT_X, 3.75, 0.8);
{ const pj = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.3), new THREE.MeshStandardMaterial({ color: 0x222028, metalness: 0.6, roughness: 0.4 })); pj.position.copy(projPos); room2.add(pj); }
const beam = (() => {
  const x = PAINT.w / 2, y0 = PAINT.cy - PAINT.h / 2, y1 = PAINT.cy + PAINT.h / 2, z = PAINT.z + 0.1, P = projPos.toArray(); const c = [[PAINT_X - x, y0, z], [PAINT_X + x, y0, z], [PAINT_X + x, y1, z], [PAINT_X - x, y1, z]], v = [];
  for (let i = 0; i < 4; i++) v.push(...P, ...c[i], ...c[(i + 1) % 4]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x9a86ff, transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); room2.add(m); return m;
})();

// ---------- Room 2: energy balls (one per tracked ID, from packets only) ----------
const TRAIL = 16, MAXB = 25, NLIGHTS = 6;
const hueOf = id => new THREE.Color().setHSL((id * 0.618) % 1, 0.9, 0.6);
const balls = new Map();
function makeBall(id) {
  const col = hueOf(id);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); glow.scale.setScalar(0.7);
  const glow2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.35 })); glow2.scale.setScalar(1.6);
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3)); tg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
  const trail = new THREE.Line(tg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  const dots = Array.from({ length: 5 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); room2.add(s); return s; });
  const pool = new THREE.Mesh(new THREE.CircleGeometry(0.6, 24), new THREE.MeshBasicMaterial({ map: glowTex, color: col, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.008;
  const tag = makeLabel('#' + String(id).padStart(2, '0'), '#ffffff', 0.32, '600 34px ui-monospace,monospace', 128); tag.material.opacity = 0.7;
  trail.frustumCulled = false; core.add(glow, glow2); room2.add(core, trail, pool, tag);
  const b = { id, core, glow, glow2, trail, dots, pool, tag, col, hist: [], pos: null, conf: 0, energy: 0, seen: 0 };
  balls.set(id, b); return b;
}
// in-scene mode adds no THREE.Light at all (no light-count change -> no gallery shader recompiles); stand-ins keep the code path
const fakeLight = () => ({ intensity: 0, angle: 0, position: new THREE.Vector3(), color: new THREE.Color(), target: { position: new THREE.Vector3(), updateMatrixWorld() { } } });
const ballLights = Array.from({ length: NLIGHTS }, () => { if (!LIGHTS) return fakeLight(); const l = new THREE.PointLight(0xffffff, 0, 3.2, 1.6); room2.add(l); return l; });
let latestPacket = null, packetCount = 0;
function onPacket(p) { latestPacket = p; packetCount++; if (packetCount % 4 === 0) launchPulse(p); }
function launchPulse(p) { const q = pulses.find(x => !x.live); if (!q) return; q.live = true; q.u = 0; q.size = 0.16 + Math.min(0.35, p.byteLen / 6000); q.s.visible = true; q.s.material.color.set(p.lockedCount >= 10 ? 0x9effc4 : 0xffd98a); }
function updateBalls(dt, t) {
  const p = latestPacket, seen = new Set(), b0 = beat.at(t);
  if (p) for (const s of p.sprites) {
    seen.add(s.id); const b = balls.get(s.id) || makeBall(s.id);
    const target = new THREE.Vector3(s.pos[0], Math.max(0.25, s.pos[1]), s.pos[2]);
    if (!b.pos) b.pos = target.clone(); else b.pos.lerp(target, Math.min(1, dt * 18));
    b.conf = s.confidence; b.energy = s.energy; b.dZ = s.dZ; b.speed = Math.hypot(s.vel[0], s.vel[2]); b.seen = t; b.coast = s.coastS;
  }
  const lit = [];
  for (const [id, b] of balls) {
    if (!seen.has(id)) { b.conf = Math.max(0, b.conf - dt * 2.5); if (b.conf <= 0 && t - b.seen > 1) { for (const o of [b.core, b.trail, b.pool, b.tag, ...b.dots]) room2.remove(o); balls.delete(id); continue; } }
    const waveC = S.wave ? waveColorRGB(b.pos.x, b.pos.z, t) : null;
    const col = waveC ? new THREE.Color(...waveC) : b.col;
    const pulse = 0.75 + 0.25 * Math.cos(b0.phase * Math.PI * 2), en = Math.min(1.6, (b.energy || 0.3) + 0.25 * b0.energy * (S.dancing ? 1 : 0.2));
    const fl = E3.flashOf(id); // 870: head flash when a pulse lands (same as live)
    const lvl = b.conf, sz = (0.45 + 0.55 * en + 1.4 * (b.dZ || 0)) * pulse * (1 + 0.9 * fl);
    b.core.position.copy(b.pos); b.core.scale.setScalar(0.7 + 0.6 * en * pulse); b.core.material.color.setRGB(1, 1, 1).lerp(col, 0.25); b.core.material.opacity = lvl; b.core.material.transparent = true;
    b.glow.material.color.copy(col); b.glow.scale.setScalar(sz); b.glow.material.opacity = lvl;
    b.glow2.material.color.copy(col); b.glow2.scale.setScalar(sz * 2.1); b.glow2.material.opacity = 0.3 * lvl;
    b.tag.position.set(b.pos.x, b.pos.y + 0.45, b.pos.z); b.tag.material.opacity = 0.65 * lvl;
    b.pool.position.set(b.pos.x, 0.008, b.pos.z); b.pool.scale.setScalar(0.6 + 0.5 * en); b.pool.material.color.copy(col); b.pool.material.opacity = 0.45 * lvl * pulse;
    // trail: last TRAIL positions, fading
    b.hist.unshift(b.pos.clone()); if (b.hist.length > TRAIL) b.hist.length = TRAIL;
    const pa = b.trail.geometry.attributes.position.array, ca = b.trail.geometry.attributes.color.array;
    for (let i = 0; i < TRAIL; i++) { const h = b.hist[Math.min(i, b.hist.length - 1)]; pa.set([h.x, h.y, h.z], i * 3); const f = lvl * (1 - i / TRAIL); ca.set([col.r * f, col.g * f, col.b * f], i * 3); }
    b.trail.geometry.attributes.position.needsUpdate = true; b.trail.geometry.attributes.color.needsUpdate = true;
    b.dots.forEach((d, k) => { const h = b.hist[Math.min(b.hist.length - 1, 2 + k * 3)]; d.position.copy(h); d.scale.setScalar(0.22 * (1 - k / 6) * (0.6 + en * 0.5)); d.material.color.copy(col); d.material.opacity = 0.55 * lvl * (1 - k / 5); });
    lit.push(b);
  }
  lit.sort((a, b) => (b.energy * b.conf) - (a.energy * a.conf));
  ballLights.forEach((l, i) => { const b = lit[i]; if (!b) { l.intensity = 0; return; } l.position.copy(b.pos); l.color.copy(S.wave ? new THREE.Color(...waveColorRGB(b.pos.x, b.pos.z, t)) : b.col); l.intensity = 2.2 * b.conf * (0.6 + b.energy); });
}

// ---------- Room 2: ceiling truss + 4 moving heads (aimed at energy balls) ----------
const trussMat = new THREE.MeshStandardMaterial({ color: 0x3a3a44, metalness: 0.8, roughness: 0.35 });
// 870 (TJ 9:21 PM): the same moving-head rig in BOTH rooms. Each rig is driven ONLY by the stereo
// capture pipeline (engine.hostMap(): camera -> blob detection -> triangulation -> IDs -> telemetry),
// with its real latency, ID swaps and dropouts (hold 0.6 s, then fade). Never by ground-truth poses.
function coneGeo() { const g = new THREE.ConeGeometry(1, 1, 28, 1, true); g.translate(0, -0.5, 0); g.rotateX(-Math.PI / 2); return g; }
const beamMat = () => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const poolMat = () => new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
function makeRig(room, { realLights, pins, gain = 1 }) {
  for (const [x0, z0, x1, z1] of [[-3.4, -2.5, 3.4, -2.5], [-3.4, 2.5, 3.4, 2.5], [-3, -2.9, -3, 2.9], [3, -2.9, 3, 2.9]]) {
    const len = Math.hypot(x1 - x0, z1 - z0), bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, len), trussMat);
    bar.position.set((x0 + x1) / 2, 3.98, (z0 + z1) / 2); bar.rotation.y = Math.atan2(x1 - x0, z1 - z0); room.add(bar);
  }
  const movers = FIXTURES.map(F => {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.3), trussMat); base.position.set(F[0], F[1] + 0.1, F[2]);
    const yoke = new THREE.Group(); yoke.position.set(F[0], F[1], F[2]);
    const arms = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.06), trussMat); arms.position.y = 0.02; yoke.add(arms);
    const head = new THREE.Group(); yoke.add(head);
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.3, 18), new THREE.MeshStandardMaterial({ color: 0x1a1a22, metalness: 0.7, roughness: 0.3 })); can.rotation.x = Math.PI / 2; head.add(can);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.085, 20), new THREE.MeshBasicMaterial({ color: 0x111111 })); lens.position.z = 0.152; head.add(lens);
    const cone = new THREE.Mesh(coneGeo(), beamMat()); cone.position.set(...F);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 28), poolMat()); pool.rotation.x = -Math.PI / 2;
    const light = realLights ? new THREE.SpotLight(0xffffff, 0, 12, 0.12, 0.45, 1.2) : fakeLight(); light.position.set(...F); if (realLights) room.add(light, light.target);
    room.add(base, yoke, cone, pool);
    return { F, yoke, head, lens, cone, pool, light, pt: { pan: Math.atan2(-F[0], -F[2]), tilt: 0.9 }, aim: [0, 0, 0], level: 0, color: new THREE.Color(1, 1, 1) };
  });
  const pinSpots = Array.from({ length: pins }, () => { const c = new THREE.Mesh(coneGeo(), beamMat()), p = new THREE.Mesh(new THREE.CircleGeometry(1, 24), poolMat()); p.rotation.x = -Math.PI / 2; room.add(c, p); return { c, p }; });
  return { room, movers, pinSpots, gain, state: newMoverState() };
}
const rig2 = makeRig(room2, { realLights: LIGHTS, pins: 25 });
const rig1 = makeRig(room1, { realLights: false, pins: 25, gain: 1.8 }); // Room 1: cheap fake cones + floor pools only (no light count change)
const _v3 = new THREE.Vector3();
function updateRig(R, t, dt, host, b, pulse) {
  const { room, movers, pinSpots, state, gain } = R, off = S.movers === 'off';
  const asg = selectTargets(state, host, t, S.movers, S.movers === 'chase' ? b.index : 0);
  movers.forEach((m, i) => {
    const id = asg[i], h = id !== null ? host.get(id) : null, lvl = off ? 0 : holdFade(h, t) * (h ? 0.55 + 0.45 * Math.min(1, E3.energyAt(...h.P) / 1.5) : 1); // 871: E(p,t) point-sampled at the tracked head
    if (h) { m.aim = h.P.slice(); m.color.lerp(hueOf(id), 0.15); }
    const goal = h ? panTilt(m.F, m.aim) : { pan: Math.atan2(-m.F[0], -m.F[2]), tilt: 1.2 };
    m.pt = slew(m.pt, goal, dt); m.level += (lvl - m.level) * Math.min(1, dt * 6);
    m.yoke.rotation.y = m.pt.pan; m.head.rotation.x = m.pt.tilt;
    const d = aimDir(m.pt); const tf = (0.02 - m.F[1]) / d[1]; const end = [m.F[0] + d[0] * tf, 0.02, m.F[2] + d[2] * tf];
    const en = h ? Math.min(1, Math.hypot(h.vel[0], h.vel[1]) * 0.3 + h.dZ * 3) : 0;
    const L = tf, r = Math.tan(0.1 + 0.03 * en) * L * (0.9 + 0.15 * pulse), on = m.level * (off ? 0 : 1);
    m.cone.scale.set(r, r, L); m.cone.lookAt(room.localToWorld(_v3.set(...end))); m.cone.material.color.copy(m.color); m.cone.material.opacity = Math.min(0.3, 0.1 * gain * on * pulse);
    m.pool.position.set(end[0], 0.012, end[2]); m.pool.scale.setScalar(r * 1.3); m.pool.material.color.copy(m.color); m.pool.material.opacity = Math.min(0.9, 0.55 * gain * on * pulse);
    m.light.color.copy(m.color); m.light.intensity = 55 * on * pulse; m.light.angle = 0.1 + 0.03 * en; m.light.target.position.set(...end); m.light.target.updateMatrixWorld();
    m.lens.material.color.setRGB(m.color.r * on, m.color.g * on, m.color.b * on);
  });
  const extra = S.movers === 'all' ? [...host.entries()].filter(([id]) => !asg.includes(id)) : [];
  pinSpots.forEach((ps, i) => {
    const e = extra[i]; if (!e) { ps.c.visible = ps.p.visible = false; return; }
    const [id, h] = e, lvl = holdFade(h, t); ps.c.visible = ps.p.visible = lvl > 0.01; const col = hueOf(id), r = 0.32 + 0.4 * Math.max(0, h.dZ);
    ps.c.position.set(h.P[0], 3.95, h.P[2]); ps.c.scale.set(r, r, 3.93); ps.c.lookAt(room.localToWorld(_v3.set(h.P[0], 0, h.P[2]))); ps.c.material.color.copy(col); ps.c.material.opacity = 0.07 * lvl * pulse;
    ps.p.position.set(h.P[0], 0.012, h.P[2]); ps.p.scale.setScalar(r * 1.3); ps.p.material.color.copy(col); ps.p.material.opacity = 0.45 * lvl * pulse;
  });
}
function updateMovers(t, dt) {
  const b = beat.at(t), pulse = 0.75 + 0.25 * Math.cos(b.phase * Math.PI * 2), host = engine.hostMap(); // capture pipeline only
  updateRig(rig2, t, dt, host, b, pulse); updateRig(rig1, t, dt, host, b, pulse);
}
const movers = rig2.movers, moverState = rig2.state;

// ---------- state ----------
const beat = new Beat();
const S = { dancing: true, exposure: 1 / 500, skew: 0, sync: true, rays: false, frustum: true, beam: true, wave: false, waveKind: 'radial', beacons: true, movers: 'top', inspector: true, walk: false };
const hsl = (h, s, l) => { const c = new THREE.Color().setHSL(h, s, l); return [c.r, c.g, c.b]; };
function waveColorRGB(X, Y, t) {
  const b = beat.at(t), bp = b.index + b.phase;
  if (S.waveKind === 'radial') { const d = Math.hypot(X, Y); return hsl((((bp - d / 1.6) % 1) + 1) % 1 * 0.85, 1, 0.5); }
  if (S.waveKind === 'sweep') { const x = (X + HW) / (2 * HW); return hsl(((bp * 0.25 - x) % 1 + 1) % 1, 1, 0.5); }
  const a = Math.atan2(Y, X) / (2 * Math.PI), d = Math.hypot(X, Y); return hsl(((a + d * 0.18 - bp * 0.25) % 1 + 1) % 1, 1, 0.5);
}
// Phase 2 downlink: the host schedules pin colours by decoded ID from its own triangulated (X^,Y^).
function waveAt(dn, t) {
  if (!S.wave || !engine) return null; const h = engine.hostMap().get(dn.id); if (!h || t - h.t > 1.5) return null;
  if (S.beacons) { const pk = Math.floor(((t + dn.clockPhase) * 60 + dn.clockOff) / PACKET_FRAMES); if (pk % 2 === 0) return null; }
  return waveColorRGB(h.X, h.Y, t);
}

// ---------- boot sim ----------
solveRig(); buildPhone('A', 0x4fd8ff); buildPhone('B', 0xffb84f);
setCount(opt.count || 14);
engine = new Engine({ dancers, camA: null, camB: null, beatAt: x => beat.at(x), t0: beat.now() });
engine.waveAt = waveAt; engine.pipe.subscribe(onPacket);
placePhone('A'); placePhone('B');
function syncEngine() { if (engine.camA !== phones.A.sim || engine.camB !== phones.B.sim) { engine.camA = phones.A.sim; engine.camB = phones.B.sim; engine.reset(); } Object.assign(engine, { exposure: S.exposure, skew: S.skew, sync: S.sync, dancing: S.dancing }); }
function updateRigReadout() {
  const R = rig.solved; if (!R) return; const h = R.params.height, dg = x => (x * 180 / Math.PI).toFixed(1);
  $$('rigH').textContent = `Height: ${(h / 0.3048).toFixed(1)} ft (${h.toFixed(2)} m) · Symmetric yaw: ±${dg(R.psi)}° (${(2 * R.psi * 180 / Math.PI).toFixed(0)}° convergence)`;
  $$('rigS').textContent = `Outer edge tangent to ±5 m wall at z ${R.touchA[2].toFixed(1)} m · inner edges cross at x 0, z ${R.inner[2].toFixed(1)} m`;
  $$('rigP').textContent = `iPhone A (${R.A.pos.map(x => x.toFixed(2)).join(', ')}) · B (${R.B.pos.map(x => x.toFixed(2)).join(', ')}) · tilt ${dg(R.pitch)}° · ${VFOV_DEG}° vfov / ${(2 * Math.atan(TAN_H) * 180 / Math.PI).toFixed(1)}° hfov`;
  $$('xOut').textContent = rig.x0.toFixed(2) + ' m'; $$('zOut').textContent = (5 + rig.z0).toFixed(2) + ' m'; $$('hOut').textContent = rig.heightFt.toFixed(1) + ' ft';
}

// ---------- stereo rays (Room 1) ----------
const MAXN = 25;
const rayGeo = new THREE.BufferGeometry(); rayGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXN * 4 * 3), 3)); rayGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAXN * 4 * 3), 3));
const rays = new THREE.LineSegments(rayGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); rays.frustumCulled = false; room1.add(rays);
const markers = []; for (let i = 0; i < MAXN; i++) { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })); m.visible = false; room1.add(m); markers.push(m); }

// ---------- sensor monitors ----------
const mkCanvas = () => { const c = document.createElement('canvas'); c.width = 640; c.height = 360; return c; };
const sensCanvas = { A: opt.sensA || mkCanvas(), B: opt.sensB || mkCanvas() };
const sens = { A: sensCanvas.A.getContext('2d'), B: sensCanvas.B.getContext('2d') };
const roomLines = [
  [[-HW, 0, -HD], [HW, 0, -HD]], [[HW, 0, -HD], [HW, 0, HD]], [[HW, 0, HD], [-HW, 0, HD]], [[-HW, 0, HD], [-HW, 0, -HD]],
  [[-HW, 0, -HD], [-HW, WALL_H, -HD]], [[HW, 0, -HD], [HW, WALL_H, -HD]], [[-HW, WALL_H, -HD], [HW, WALL_H, -HD]], [[HW, 0, ARCH.z0], [HW, ARCH.y1, ARCH.z0]], [[HW, ARCH.y1, ARCH.z0], [HW, ARCH.y1, ARCH.z1]], [[HW, ARCH.y1, ARCH.z1], [HW, 0, ARCH.z1]],
];
for (let x = -4; x <= 4; x += 2) roomLines.push([[x, 0, -HD], [x, 0, HD]]); for (let z = -4; z <= 4; z += 2) roomLines.push([[-HW, 0, z], [HW, 0, z]]);
const dn2css = b => { const m = Math.max(1, b.r, b.g, b.b); return `rgb(${(b.r / m * 255) | 0},${(b.g / m * 255) | 0},${(b.b / m * 255) | 0})`; };
const chroma = { A: [], B: [] };
function drawSensor(key) {
  const g = sens[key], cam = phones[key].sim, W = g.canvas.width, H = g.canvas.height, k = W / cam.W, trk = engine.host.trk[key];
  g.fillStyle = '#020203'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(120,110,150,0.17)'; g.lineWidth = 1;
  for (const [a, b] of roomLines) { // faint room silhouette through the barrel-distorted lens
    g.beginPath(); let pen = false;
    for (let i = 0; i <= 24; i++) { const P = [a[0] + (b[0] - a[0]) * i / 24, a[1] + (b[1] - a[1]) * i / 24, a[2] + (b[2] - a[2]) * i / 24]; const p = project(cam, P); if (!p) { pen = false; continue; } const [u, v] = distortPixel(cam, p.u, p.v); if (pen) g.lineTo(u * k, v * k); else g.moveTo(u * k, v * k); pen = true; }
    g.stroke();
  }
  const pkt = engine.lastPackets[key]; if (!pkt) return; const P = JSON.parse(pkt);
  g.globalCompositeOperation = 'lighter';
  for (const b of P.blobs) { // blur ellipse from the blob's second moments, colour from DN
    const x = b.u * k, y = b.v * k, rr = Math.max(2.2, b.major * k * 1.6);
    const rg = g.createRadialGradient(x, y, 0, x, y, rr * 2.2); rg.addColorStop(0, '#fff'); rg.addColorStop(0.3, dn2css(b)); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.beginPath(); g.ellipse(x, y, rr * 2.2, Math.max(2, b.minor * k * 1.6) * 2.2, 0, 0, Math.PI * 2); g.fill();
  }
  g.globalCompositeOperation = 'source-over'; g.font = '600 11px ui-monospace,monospace';
  let locked = 0;
  for (const tr of trk.tracks) {
    if (tr.miss) continue; const [du, dv] = distortPixel(cam, tr.u, tr.v); const x = du * k, y = dv * k, lk = tr.dec.id >= 0; if (lk) locked++;
    g.strokeStyle = lk ? 'rgba(120,255,170,0.9)' : 'rgba(255,220,120,0.6)'; g.lineWidth = 1; g.strokeRect(x - 9, y - 9, 18, 18);
    g.fillStyle = lk ? '#9effc4' : '#ffd98a'; g.fillText(lk ? `#${String(tr.dec.id).padStart(2, '0')}` : 'scan', x + 11, y - 6);
    if (tr.rgb) { const c = tr.rgb; g.fillStyle = `rgb(${c[0] * 255 | 0},${c[1] * 255 | 0},${c[2] * 255 | 0})`; g.fillRect(x - 9, y + 11, 18, 3); }
  }
  // chroma trace of the oldest locked track (what the decoder reads)
  const tr0 = [...trk.tracks].filter(t => t.dec.id >= 0 && !t.miss).sort((a, b) => a.key - b.key)[0];
  const ch = chroma[key]; ch.push(tr0 && tr0.rgb ? tr0.rgb : null); if (ch.length > 90) ch.shift();
  g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, H - 22, W, 22);
  ch.forEach((c, i) => { if (!c) return; g.fillStyle = `rgb(${c[0] * 255 | 0},${c[1] * 255 | 0},${c[2] * 255 | 0})`; g.fillRect(i * (W / 90), H - 16, W / 90 + 0.5, 10); });
  g.fillStyle = '#ccc'; g.fillText(tr0 ? `chroma trace #${String(tr0.dec.id).padStart(2, '0')}` : 'chroma trace', 6, H - 26);
  $$('cap' + key).textContent = `${locked} locked / ${P.blobs.length} blobs · ${pkt.length} B/frame · ${SHUTTERS.find(s => s[0] === S.exposure)[1]}${key === 'B' && S.skew ? ` · skew ${S.skew} ms` : ''}`;
}

// ---------- painting sprites (packets only) ----------
const paintSprites = new Map(), ptr2 = new Map();
function drawPainting(t) {
  if (!imgReady) return;
  pg.globalCompositeOperation = 'source-over'; pg.drawImage(img, 0, 0, pc.width, pc.height);
  pg.fillStyle = 'rgba(8,4,20,0.2)'; pg.fillRect(0, 0, pc.width, pc.height);
  const b = beat.at(t), p = latestPacket; pg.globalCompositeOperation = 'lighter'; if (!p) { paintTex.needsUpdate = true; return; }
  // 869: live Neural Dance figures (same skeleton pose as Room 1: dark shadow body + silhouette halo by activation, head glow, pinpoint pulses)
  const heads = new Map();
  for (const s of p.sprites) {
    const fade = s.confidence, id = s.id; let sp = paintSprites.get(id); if (!sp) { sp = { x: pc.width / 2, y: pc.height * 0.7, z: 0 }; paintSprites.set(id, sp); }
    const depth = (s.pos[2] + HD) / (2 * HD), tx = (s.pos[0] + HW) / (2 * HW) * pc.width, ty = pc.height * (0.55 + 0.4 * depth);
    sp.x += (tx - sp.x) * 0.35; sp.y += (ty - sp.y) * 0.35; sp.z += (s.dZ - sp.z) * 0.5;
    const scale = 0.55 + 0.6 * depth, hh = 128 * scale, ds = drive2 && capById.has(id) ? drive2.state(id) : null;
    if (!ds || !ds.unit) continue;
    const unit = ds.unit, floorY = unit[ds.key].y, posed = placePose(unit, sp.x + ds.ofsX * hh, sp.y - floorY * hh - (ds.jump || 0) * hh, hh);
    const hue = ds.hue || [0.85, 0.9, 1], mixW = c => Math.round(255 * (0.4 * c + 0.6)), css = `rgb(${mixW(hue[0])},${mixW(hue[1])},${mixW(hue[2])})`;
    pg.globalCompositeOperation = 'source-over'; pg.globalAlpha = fade;
    paintShadowFigure(pg, posed, null, { scale: 1, alpha: 0.9 });
    pg.globalCompositeOperation = 'lighter';
    paintSilhouetteHalo(pg, posed, null, { scale: 1, color: css, dim: 1, width: 1.6 * haloAuraScale(ds.act), alpha: 1 });
    const fl = E3.flashOf(id), hd = posed.head, gr = (0.09 + 0.1 * ds.act + 0.14 * fl) * hh, g = pg.createRadialGradient(hd.x, hd.y, 0, hd.x, hd.y, gr);
    g.addColorStop(0, `rgba(${mixW(hue[0])},${mixW(hue[1])},${mixW(hue[2])},${Math.min(0.9, 0.2 + 0.45 * ds.act + 0.5 * fl)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    pg.fillStyle = g; pg.beginPath(); pg.arc(hd.x, hd.y, gr, 0, Math.PI * 2); pg.fill();
    if (fl > 0.05) { pg.strokeStyle = `rgba(255,252,240,${Math.min(1, fl * 0.8) * fade})`; pg.lineWidth = 2.5; pg.beginPath(); pg.arc(hd.x, hd.y, (0.12 + 0.35 * (1.5 - Math.min(1.5, fl))) * hh, 0, Math.PI * 2); pg.stroke(); }
    pg.globalAlpha = 1; pg.font = `${Math.round(16 * scale)}px ui-monospace,monospace`; pg.fillStyle = `rgba(255,255,255,${0.55 * fade})`; pg.fillText('#' + String(id).padStart(2, '0'), hd.x + hh * 0.1, hd.y - hh * 0.1);
    heads.set(id, { x: hd.x, y: hd.y, k: hh });
  }
  // 870 (TJ 9:22 PM): free-flying pinpoint pulses homing head to head between the projected figures (Room 2's own
  // capture-driven network). Bright core + glow + trail so they read from the balcony and from the floor.
  { pg.globalCompositeOperation = 'lighter';
    const usedTr = new Set();
    for (const q of EP) { const A = heads.get(q.src), B = heads.get(q.dst); if (!A || !B) continue; // #823 free-flying 3D pulse, projected head->head
      const u = q.prog, k = (A.k + B.k) / 2, x = A.x + (B.x - A.x) * u, y = A.y + (B.y - A.y) * u - Math.max(-0.4, Math.min(1.2, q.lift)) * k / 1.7 - Math.sin(Math.PI * u) * 0.12 * k;
      const pk = q.src + '>' + q.dst; usedTr.add(pk); q.tr2 = ptr2.get(pk) || []; q.tr2.push([x, y]); if (q.tr2.length > 10) q.tr2.shift(); ptr2.set(pk, q.tr2);
      for (let k = 1; k < q.tr2.length; k++) { const f = k / q.tr2.length; pg.strokeStyle = `rgba(255,240,200,${0.6 * f})`; pg.lineWidth = 1 + 3.5 * f; pg.beginPath(); pg.moveTo(...q.tr2[k - 1]); pg.lineTo(...q.tr2[k]); pg.stroke(); }
      const g2 = pg.createRadialGradient(x, y, 0, x, y, 16); g2.addColorStop(0, 'rgba(255,255,250,1)'); g2.addColorStop(0.25, 'rgba(255,236,190,0.75)'); g2.addColorStop(1, 'rgba(0,0,0,0)');
      pg.fillStyle = g2; pg.beginPath(); pg.arc(x, y, 16, 0, Math.PI * 2); pg.fill();
      pg.fillStyle = '#fff'; pg.beginPath(); pg.arc(x, y, 3.6, 0, Math.PI * 2); pg.fill(); }
    for (const k of ptr2.keys()) if (!usedTr.has(k)) ptr2.delete(k); }
  pg.globalCompositeOperation = 'source-over';
  pg.font = '600 15px ui-monospace,monospace'; pg.fillStyle = 'rgba(0,0,0,0.55)'; pg.fillRect(10, pc.height - 34, 470, 24);
  pg.fillStyle = '#9effc4'; pg.fillText(`source: camera capture · ${p.sprites.length} tracked IDs · pkt #${p.seq}`, 18, pc.height - 16);
  pg.globalCompositeOperation = 'source-over';
  paintTex.needsUpdate = true;
}

// ---------- Room 1 animation (869: live Neural Dance pose drive, true 3D) ----------
const tmp = new THREE.Color();
const _m = new THREE.Matrix4(), _X = new THREE.Vector3(), _Y = new THREE.Vector3(), _Z = new THREE.Vector3(), _P = new THREE.Vector3(), _A = new THREE.Vector3(), _B = new THREE.Vector3(), _UP = new THREE.Vector3(0, 1, 0);
let drive = null;
// 870 (TJ 9:19 PM): Room 2 consumes ONLY the capture pipeline output. Its figures are a second, independent
// live-style drive whose dancers are the captured tracks (triangulated position + head height, decoded ID) —
// exactly what the projector side sees in the real show. Nothing in Room 2 reads Room 1's ground-truth poses.
const capNodes = [], capById = new Map(); let drive2 = null;
// 871: ONE #823 3D energy world fed only by capture tracks; its pulses/flashes/E render in Room 1 (as the projected
// light would) and in Room 2 (sprites + painting). Both pose drives stop emitting their own pulses.
const E3 = createEnergy3D(); let EP = [];
function syncCapture(t) {
  const p = latestPacket; if (!drive2) drive2 = createDrive(capNodes, { emit: false, actOf: E3.actOf });
  const seen = new Set();
  if (p) for (const s of p.sprites) { seen.add(s.id); let n = capById.get(s.id); if (!n) { n = { id: s.id, style: 0, pos: [s.pos[0], s.pos[2]], headW: [s.pos[0], s.pos[1], s.pos[2]], seen: t }; capById.set(s.id, n); }
    n.pos[0] = s.pos[0]; n.pos[1] = s.pos[2]; n.headW = [s.pos[0], Math.max(0.25, s.pos[1]), s.pos[2]]; n.seen = t; n.conf = s.confidence; }
  for (const [id, n] of capById) if (!seen.has(id) && t - n.seen > 1.2) capById.delete(id); // dropout: hold ~1.2 s, then gone
  capNodes.length = 0; for (const n of capById.values()) capNodes.push(n);
}
function ell(i, A, B, rx, rz, side, overlap = 0.35) { // ellipsoid spanning A->B (room1-local Vector3s)
  _Y.subVectors(B, A); const L = _Y.length() || 1e-4; _Y.multiplyScalar(1 / L);
  if (side) _X.copy(side); else _X.crossVectors(_UP, _Y); _X.addScaledVector(_Y, -_X.dot(_Y)); if (_X.lengthSq() < 1e-6) _X.set(1, 0, 0).addScaledVector(_Y, -_Y.x); _X.normalize(); _Z.crossVectors(_X, _Y);
  _P.addVectors(A, B).multiplyScalar(0.5); const hy = L / 2 + rx * overlap;
  _m.makeBasis(_X.multiplyScalar(rx), _Y.multiplyScalar(hy), _Z.multiplyScalar(rz)).setPosition(_P); bodies.setMatrixAt(i, _m);
}
function animate(t) {
  const b = beat.at(t);
  if (!drive) drive = createDrive(dancers, { emit: false });
  const dtd = t - (animate.t == null ? t - 1 / 60 : animate.t); if (dtd > 0) { drive.step(Math.min(0.1, dtd), t, { bpm: beat.bpm, index: b.index, phase: b.phase }); syncCapture(t); E3.sync(latestPacket, t); E3.step(Math.min(0.067, dtd), t, { bpm: beat.bpm, index: b.index, phase: b.phase }); EP = E3.pulses(); drive2.step(Math.min(0.1, dtd), t, { bpm: beat.bpm, index: b.index, phase: b.phase }); } animate.t = t;
  let bi = 0; const W = {}, V = k => W[k];
  dancers.forEach((dn, i) => {
    const m = dancerMeshes[i], st = dancerState(dn, t, b, S.dancing), ds = drive.state(dn.id);
    const H = dn.height, J = joints3D(ds, H, m.J), h = st.heading, ch = Math.cos(h), sh = Math.sin(h), P0 = st.base[0], P1 = st.base[2];
    const sy = dn.surfY || 0; m.root.position.set(P0, sy, P1); m.root.rotation.y = h;
    if (J) {
      for (const k in J) { const q = J[k]; (W[k] ||= new THREE.Vector3()).set(P0 + q[0] * ch + q[2] * sh, q[1] + sy, P1 - q[0] * sh + q[2] * ch); }
      dn.headOff = [W.head.x - P0, W.head.y - sy, W.head.z - P1]; dn.pinYaw = ds.facing || 0; dn.liftY = ds.jump * H; dn.headW = [W.head.x, W.head.y, W.head.z];
      const r = H / 1.7, base = bi;
      const shSide = _A.subVectors(V('shL'), V('shR')).clone(), hipSide = _B.subVectors(V('hipL'), V('hipR')).clone();
      const shW = shSide.length() / 2, hipW = hipSide.length() / 2;
      const waist = new THREE.Vector3().lerpVectors(V('heart'), V('groin'), 0.55), neckLow = new THREE.Vector3().lerpVectors(V('neck'), V('heart'), 0.12);
      // head + neck
      _P.copy(V('head')); _m.makeBasis(_X.copy(shSide).normalize().multiplyScalar(0.092 * r), _Y.set(0, 0.118 * r, 0), _Z.crossVectors(shSide, _UP).normalize().multiplyScalar(-0.1 * r)).setPosition(_P); bodies.setMatrixAt(bi++, _m);
      ell(bi++, V('neck'), new THREE.Vector3().lerpVectors(V('neck'), V('head'), 0.6), 0.042 * r, 0.042 * r);
      // chest ~2/3 as deep as wide; pelvis carries the hip twist
      ell(bi++, waist, neckLow, Math.max(0.1 * r, shW * 0.82), Math.max(0.07 * r, shW * 0.54), shSide, 0.12); // 870: slimmer chest
      ell(bi++, new THREE.Vector3().lerpVectors(V('groin'), waist, -0.12), waist, Math.max(0.09 * r, hipW + 0.03 * r), Math.max(0.07 * r, (hipW + 0.03 * r) * 0.62), hipSide, 0.3); // 870: slimmer pelvis
      for (const sd of ['L', 'R']) { ell(bi++, V('sh' + sd), V('el' + sd), 0.046 * r, 0.046 * r); ell(bi++, V('el' + sd), V('wrist' + sd), 0.037 * r, 0.037 * r); ell(bi++, V('wrist' + sd), V('hand' + sd), 0.03 * r, 0.02 * r, null, 0.1); }
      for (const sd of ['L', 'R']) { ell(bi++, V('hip' + sd), V('knee' + sd), 0.07 * r, 0.07 * r); ell(bi++, V('knee' + sd), V('ankle' + sd), 0.052 * r, 0.052 * r); }
      for (const sd of ['L', 'R']) { // feet point forward in 3D; heel-toe rocking from the live heel/toe heights
        const an = V('ankle' + sd), hy = Math.min(an.y - sy, ds.unit && ds.unit['heel' + sd] ? (ds.unit[ds.key].y - ds.unit['heel' + sd].y) * H + ds.jump * H : 0), ty = ds.unit && ds.unit['foot' + sd] ? (ds.unit[ds.key].y - ds.unit['foot' + sd].y) * H + ds.jump * H : 0;
        const fy = h + (ds.facing || 0) + (sd === 'L' ? 0.12 : -0.12), fx = Math.sin(fy), fz = Math.cos(fy);
        _A.set(an.x - fx * 0.05 * r, Math.max(0.03, hy + 0.03) + sy, an.z - fz * 0.05 * r); _B.set(an.x + fx * 0.17 * r, Math.max(0.025, ty + 0.025) + sy, an.z + fz * 0.17 * r); ell(bi++, _A.clone(), _B.clone(), 0.04 * r, 0.03 * r, null, 0.2); }
      // rim/aura colour: dancer hue mixed toward white, width/brightness with activation (+ pulse impact flash)
      const fl1 = E3.flashOf(dn.id), hue = ds.hue || [0.8, 0.85, 1], a = Math.min(1.4, 0.18 + 0.82 * ds.act + 0.35 * fl1);
      tmp.setRGB((0.4 * hue[0] + 0.6) * a, (0.4 * hue[1] + 0.6) * a, (0.4 * hue[2] + 0.6) * a);
      for (let k = base; k < bi; k++) bodies.setColorAt(k, tmp);
      // head glow (pulses land here)
      m.headGlow.position.copy(V('head')); m.headGlow.scale.setScalar(0.28 + 0.45 * ds.act + 0.55 * fl1); m.headGlow.material.color.copy(tmp); m.headGlow.material.opacity = Math.min(1, 0.15 + 0.5 * ds.act + 0.6 * fl1) * (drive.hush > 0 ? 1 : 0.4);
    }
    m.pin.position.set(...st.pin);
    const c = pinRGB(dn, t, waveAt(dn, t)); tmp.setRGB(c[0], c[1], c[2]); m.pin.material.color.copy(tmp); m.halo.material.color.copy(tmp); m.pool.material.color.copy(tmp);
    m.pool.position.set(st.base[0], (dn.surfY || 0) + 0.006, st.base[2]);
  });
  bodies.count = bi; bodies.instanceMatrix.needsUpdate = true; if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
  updateNdPulses();
  const pos = rayGeo.attributes.position.array, col = rayGeo.attributes.color.array; let n = 0;
  markers.forEach(m => (m.visible = false));
  if (S.rays) engine.lastRec.slice(0, MAXN).forEach((r, i) => {
    const P = r.P, ca = phones.A.sim.C, cb = phones.B.sim.C, cA = new THREE.Color(phones.A.color), cB = new THREE.Color(phones.B.color);
    pos.set([...ca, ...P, ...cb, ...P], n * 12); col.set([cA.r, cA.g, cA.b, cA.r, cA.g, cA.b, cB.r, cB.g, cB.b, cB.r, cB.g, cB.b], n * 12); n++;
    markers[i].visible = true; markers[i].position.set(...P); markers[i].rotation.y = t * 2; markers[i].material.color.setHSL((r.id * 0.618) % 1, 0.9, 0.65);
  });
  rayGeo.setDrawRange(0, n * 4); rayGeo.attributes.position.needsUpdate = true; rayGeo.attributes.color.needsUpdate = true;
  // phone -> rack wireless links
  const la = linkGeo.attributes.position.array, rk = [RACK[0], 1.5, RACK[2]]; la.set([...phones.A.cfg.pos, ...rk, ...phones.B.cfg.pos, ...rk]); linkGeo.attributes.position.needsUpdate = true; links.computeLineDistances();
}
const NDP = 48, NDT = 11; // 871: #823 trails hold up to 10 world-space points
function makePulseLayer(room, size) {
  const pts = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(NDP * 3), 3)), new THREE.PointsMaterial({ map: glowTex, color: 0xfff6e8, size, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.frustumCulled = false; pts.renderOrder = 5; room.add(pts);
  const trail = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(NDP * (NDT - 1) * 6), 3)).setAttribute('color', new THREE.BufferAttribute(new Float32Array(NDP * (NDT - 1) * 6), 3)), new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  trail.frustumCulled = false; trail.renderOrder = 5; room.add(trail); return { pts, trail };
}
const ndL1 = makePulseLayer(room1, 0.07), ndL2 = makePulseLayer(room2, 0.16); // Room 2: capture-driven pulses between the energy sprites, larger to read from the floor
const ndPts = ndL1.pts, ndTrail = ndL1.trail;
function drawPulseLayer(L, list, gain) {
  const P = L.pts.geometry.attributes.position.array, T = L.trail.geometry.attributes.position.array, C = L.trail.geometry.attributes.color.array; let n = 0, s = 0;
  for (const q of list) { if (n >= NDP) break; P.set(q.p, n * 3); n++;
    for (let k = Math.max(0, q.trail.length - NDT); k < q.trail.length - 1; k++) { const f0 = k / (q.trail.length - 1) * gain, f1 = (k + 1) / (q.trail.length - 1) * gain; T.set(q.trail[k], s * 6); T.set(q.trail[k + 1], s * 6 + 3); C.set([f0, f0 * 0.95, f0 * 0.85, f1, f1 * 0.95, f1 * 0.85], s * 6); s++; } }
  L.pts.geometry.setDrawRange(0, n); L.pts.geometry.attributes.position.needsUpdate = true;
  L.trail.geometry.setDrawRange(0, s * 2); L.trail.geometry.attributes.position.needsUpdate = true; L.trail.geometry.attributes.color.needsUpdate = true;
}
function updateNdPulses() { drawPulseLayer(ndL1, EP, 0.55); drawPulseLayer(ndL2, EP, 0.9); }
function updatePulses(dt) {
  for (const q of pulses) { if (!q.live) continue; q.u += dt * 5.5 / pipeLen; if (q.u >= 1) { q.live = false; q.s.visible = false; continue; } q.s.position.copy(pipeCurve.getPointAt(q.u)); q.s.scale.setScalar(q.size); }
}

// ---------- HUD ----------
function telemetry() {
  const n = dancers.length, p = latestPacket, kb = engine.pipe.kbps(), e = engine.err;
  const locked = p ? p.lockedCount : 0;
  $$('pill').textContent = `source: camera capture · #823 3D energy · Room 1 → Room 2 Pipe: 60 Hz · ${locked}/${n} IDs locked · ~${kb.toFixed(0)} kbps · 3D error: mean ${e.mean.toFixed(1)} cm (max ${e.max.toFixed(1)} cm) · ${rig.heightFt.toFixed(0)} ft / ±${(rig.solved.psi * 180 / Math.PI).toFixed(0)}° rig`;
  const la = engine.trkA.locked().size, lb = engine.trkB.locked().size;
  let lines = `iPhone A ${la} locked · iPhone B ${lb} locked · glints rejected ${e.glints || 0}\n` +
    `ray miss (epipolar) ${e.miss.toFixed(1)} cm   outliers rejected ${e.rejected || 0}\n` +
    `energy sprites in Room 2: ${p ? p.sprites.length : 0} (coasting ${p ? p.sprites.filter(s => s.coastS > 0.02).length : 0})`;
  if (S.inspector && p) { const s0 = p.sprites[0]; lines += `\npkt #${p.seq} ${p.byteLen} B` + (s0 ? ` · {id:${s0.id}, pos:[${s0.pos.map(x => x.toFixed(2))}], dZ:${s0.dZ.toFixed(2)}, conf:${s0.confidence.toFixed(2)}, miss:${s0.missCm}cm}` : ''); }
  $$('tele').textContent = lines;
}
// ---------- observation balcony (y = 3.5, along z = 5..8.3) ----------
const balcony = new THREE.Group(); balcony.name = 'balcony'; root.add(balcony);
const B = BALC, BW = B.x1 - B.x0, BD = B.z1 - B.z0, BCX = (B.x0 + B.x1) / 2, BCZ = (B.z0 + B.z1) / 2;
const woodTex = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d');
  for (let i = 0; i < 16; i++) { const l = 22 + (i * 37) % 11; g.fillStyle = `hsl(28,42%,${l}%)`; g.fillRect(0, i * 32, 512, 32); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, i * 32, 512, 2); g.fillRect(((i * 173) % 512), i * 32, 2, 32); }
  for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(0,0,0,${0.03 + (k % 5) * 0.01})`; g.fillRect((k * 97) % 512, (k * 61) % 512, 40, 1); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(BW / 2.4, BD / 2.4); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
const bFloorMat = LIGHTS ? new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.55, metalness: 0.05 }) : new THREE.MeshBasicMaterial({ map: woodTex, color: 0xd8c8b4 });
const bWallMat = LIGHTS ? new THREE.MeshStandardMaterial({ color: 0x2a2230, roughness: 0.85 }) : new THREE.MeshBasicMaterial({ color: 0x2c2434 });
const bKneeMat = LIGHTS ? new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 0.7 }) : new THREE.MeshBasicMaterial({ color: 0x3a2a1e });
const mullMat = new THREE.MeshBasicMaterial({ color: 0x0b0a10 });
const brass = LIGHTS ? new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.85, roughness: 0.3 }) : new THREE.MeshBasicMaterial({ color: 0xc9a24a });
const box = (mat, w, h, d, x, y, z, parent = balcony) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
{ const f = new THREE.Mesh(new THREE.PlaneGeometry(BW, BD), bFloorMat); f.rotation.x = -Math.PI / 2; f.position.set(BCX, B.y + 0.002, BCZ); balcony.add(f);
  box(bWallMat, BW, 0.2, BD, BCX, B.y - 0.1, BCZ); // slab (its underside is the rooms' front soffit)
  const ceil = box(bWallMat, BW, 0.12, BD, BCX, B.ceil + 0.06, BCZ); ceil.name = 'balconyCeiling';
  for (let x = B.x0 + 1.2; x < B.x1; x += 2.4) box(trimMat, 0.05, 0.08, BD, x, B.ceil - 0.04, BCZ); // coffer ribs
  // knee wall + handrail along the windows
  // 870: openings at both stair heads (railing open there)
  const OPEN = [[STAIR.open[0], STAIR.open[1]], [-STAIR.open[1], -STAIR.open[0]]];
  const cut = (a, b) => { let segs = [[a, b]]; for (const [o0, o1] of OPEN) segs = segs.flatMap(([s0, s1]) => (o1 <= s0 || o0 >= s1) ? [[s0, s1]] : [[s0, o0], [o1, s1]].filter(([p, q]) => q - p > 0.01)); return segs; };
  for (const [a, b] of cut(B.x0, B.x1)) {
    box(bKneeMat, b - a, B.sill - B.y, 0.16, (a + b) / 2, (B.y + B.sill) / 2, B.z0);
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, b - a, 10), brass); rail.rotation.z = Math.PI / 2; rail.position.set((a + b) / 2, B.sill + 0.04, B.z0 + 0.14); balcony.add(rail);
  }
  for (let x = B.x0 + 0.6; x < B.x1; x += 1.5) if (!OPEN.some(([o0, o1]) => x > o0 - 0.05 && x < o1 + 0.05)) box(brass, 0.03, 0.12, 0.14, x, B.sill - 0.02, B.z0 + 0.08);
  for (const [o0, o1] of OPEN) { for (const x of [o0, o1]) box(brass, 0.08, B.glassTop - B.y, 0.22, x, (B.y + B.glassTop) / 2, B.z0); box(brass, o1 - o0 + 0.08, 0.08, 0.22, (o0 + o1) / 2, B.glassTop, B.z0);
    const sg = signPlane([[o0 < 0 ? 'STAIRS ↓ ROOM 1 · DANCERS' : 'STAIRS ↓ ROOM 2 · SPRITES', 54, '#ffd860']], 1.25, 0.16, '#ffd860', 'rgba(26,18,6,0.92)', '#e8c050'); sg.position.set((o0 + o1) / 2, B.glassTop + 0.16, B.z0 + 0.12); balcony.add(sg); }
  // header above the glass
  box(bWallMat, BW, B.ceil - B.glassTop, 0.16, BCX, (B.glassTop + B.ceil) / 2, B.z0);
  // solid piers between / beyond the windows
  const wins = B.windows; let x = B.x0;
  for (const w of [...wins, { x0: B.x1, x1: B.x1 }]) { for (const [a, b] of cut(x, w.x0)) box(bWallMat, b - a, B.glassTop - B.sill, 0.16, (a + b) / 2, (B.sill + B.glassTop) / 2, B.z0); x = w.x1; }
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xb8d0ff, transparent: true, opacity: 0.08, roughness: 0.08, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide });
  const glassBasic = new THREE.MeshBasicMaterial({ color: 0xb8d0ff, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide });
  for (const w of wins) {
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(w.x1 - w.x0, B.glassTop - B.sill), LIGHTS ? glassMat : glassBasic); gl.position.set((w.x0 + w.x1) / 2, (B.sill + B.glassTop) / 2, B.z0); gl.renderOrder = 5; balcony.add(gl);
    const n = Math.max(1, Math.round((w.x1 - w.x0) / 1.5)); for (let i = 0; i <= n; i++) box(mullMat, 0.05, B.glassTop - B.sill, 0.07, w.x0 + (w.x1 - w.x0) * i / n, (B.sill + B.glassTop) / 2, B.z0);
    box(mullMat, w.x1 - w.x0, 0.05, 0.07, (w.x0 + w.x1) / 2, B.sill + 0.02, B.z0); box(mullMat, w.x1 - w.x0, 0.05, 0.07, (w.x0 + w.x1) / 2, B.glassTop - 0.02, B.z0);
    neon(balcony, [[w.x0, B.sill + 0.05, B.z0 + 0.09], [w.x1, B.sill + 0.05, B.z0 + 0.09]], 0xffc860, 0.55);
    if (w.plaque) { const p = signPlane([[w.plaque[0], 74, '#ffd98a'], [w.plaque[1], 52, '#e8dcff']], 3.0, 0.42, '#e8dcff', 'rgba(26,18,6,0.92)', '#e8c050'); p.position.set((w.x0 + w.x1) / 2, (B.y + B.sill) / 2 + 0.05, B.z0 + 0.085); balcony.add(p); }
  }
  // back wall (with optional doorway holes) and end walls (with optional arches)
  const backHoles = (opt.backDoors || []).map(d => ({ x0: d.x - d.w / 2, x1: d.x + d.w / 2, h: d.h }));
  if (!opt.noBackWall) { let bx = B.x0; for (const hl of [...backHoles].sort((a, b) => a.x0 - b.x0)) { box(bWallMat, hl.x0 - bx, B.ceil - B.y, 0.16, (bx + hl.x0) / 2, (B.y + B.ceil) / 2, B.z1); box(bWallMat, hl.x1 - hl.x0, B.ceil - B.y - hl.h, 0.16, (hl.x0 + hl.x1) / 2, (B.y + hl.h + B.ceil) / 2, B.z1); bx = hl.x1; } box(bWallMat, B.x1 - bx, B.ceil - B.y, 0.16, (bx + B.x1) / 2, (B.y + B.ceil) / 2, B.z1); }
  for (const d of opt.backDoors || []) { for (const s of [-1, 1]) box(brass, 0.08, d.h, 0.22, d.x + s * d.w / 2, B.y + d.h / 2, B.z1); box(brass, d.w + 0.16, 0.08, 0.22, d.x, B.y + d.h, B.z1);
    const lab = signPlane([[d.label, 64, '#ffd860']], 1.9, 0.24, '#ffd860', 'rgba(26,18,6,0.92)', '#e8c050'); lab.rotation.y = Math.PI; lab.position.set(d.x, B.y + d.h + 0.25, B.z1 - 0.09); balcony.add(lab); }
  for (const sx of [-1, 1]) { const ex = sx < 0 ? B.x0 : B.x1, arch = opt.endArches; const zc = 6.5;
    if (arch) { box(bWallMat, 0.16, B.ceil - B.y, zc - 0.85 - B.z0, ex, (B.y + B.ceil) / 2, (B.z0 + zc - 0.85) / 2); box(bWallMat, 0.16, B.ceil - B.y, B.z1 - zc - 0.85, ex, (B.y + B.ceil) / 2, (zc + 0.85 + B.z1) / 2); box(bWallMat, 0.16, B.ceil - B.y - 2.75, 1.7, ex, (B.y + 2.75 + B.ceil) / 2, zc);
      buildDoor(balcony, ex - sx * 0.05, B.y, zc, sx < 0 ? 'to the Kinoteka (west arch)' : 'to the Kinoteka (east arch)', sx, sx < 0 ? Math.PI / 2 : -Math.PI / 2); }
    else box(bWallMat, 0.16, B.ceil - B.y, BD, ex, (B.y + B.ceil) / 2, BCZ); }
  // gold + neon trim, cove downlights along the back wall
  neon(balcony, [[B.x0, B.y + 0.02, B.z1 - 0.1], [B.x1, B.y + 0.02, B.z1 - 0.1]], 0xffc860, 0.7);
  neon(balcony, [[B.x0, B.ceil - 0.15, B.z1 - 0.1], [B.x1, B.ceil - 0.15, B.z1 - 0.1]], 0x8a72ff, 0.6);
  for (let x = B.x0 + 1.2; x < B.x1; x += 2.4) {
    const dl = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), new THREE.MeshBasicMaterial({ color: 0xfff0d0 })); dl.rotation.x = Math.PI / 2; dl.position.set(x, B.ceil - 0.005, B.z1 - 0.5); balcony.add(dl);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffd9a0, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })); pool.rotation.x = -Math.PI / 2; pool.position.set(x, B.y + 0.01, B.z1 - 0.7); balcony.add(pool);
    const wash = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.2), new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffd9a0, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false })); wash.rotation.y = Math.PI; wash.position.set(x, B.ceil - 1.0, B.z1 - 0.1); balcony.add(wash);
  }
}
// ---------- 871 Room 1 stage variation: speaker stacks, raised stage + step, tiered back risers ----------
{ const mk = (c, r = 0.7) => LIGHTS ? new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0.1 }) : new THREE.MeshBasicMaterial({ color: c });
  const M = { riser: mk(0x4a3a5e), stage: mk(0x3a2c48), step: mk(0x45365a), speaker: mk(0x18181e, 0.5), top: mk(0x6e5a86, 0.8), grille: mk(0x3a3a44, 0.4), cone: mk(0x0a0a0c, 0.3) };
  const stageG = new THREE.Group(); stageG.name = 'stage871'; room1.add(stageG);
  for (const S0 of SURFACES) { const w = S0.x1 - S0.x0, d = S0.z1 - S0.z0, cx = (S0.x0 + S0.x1) / 2, cz = (S0.z0 + S0.z1) / 2;
    if (S0.kind === 'speaker') {
      for (let k = 0; k < 2; k++) { const h = S0.y / 2, y0 = k * h; const cab = new THREE.Mesh(new THREE.BoxGeometry(w, h - 0.01, d), M.speaker); cab.position.set(cx, y0 + h / 2, cz); stageG.add(cab);
        for (const [face, rot, ox, oz] of [[1, 0, 0, d / 2 + 0.003], [-1, Math.PI, 0, -d / 2 - 0.003]]) { const ring = new THREE.Mesh(new THREE.CircleGeometry(h * 0.4, 28), M.grille), cone = new THREE.Mesh(new THREE.CircleGeometry(h * 0.22, 24), M.cone);
          ring.position.set(cx + ox, y0 + h / 2, cz + oz); ring.rotation.y = rot; cone.position.set(cx + ox, y0 + h / 2, cz + oz + 0.002 * face); cone.rotation.y = rot; stageG.add(ring, cone); } }
      neon(stageG, [[S0.x0, S0.y + 0.005, S0.z0], [S0.x1, S0.y + 0.005, S0.z0], [S0.x1, S0.y + 0.005, S0.z1], [S0.x0, S0.y + 0.005, S0.z1], [S0.x0, S0.y + 0.005, S0.z0]], 0xff3d8b, 0.7);
      continue; }
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, S0.y, d), M[S0.kind]); body.position.set(cx, S0.y / 2, cz); stageG.add(body);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.02, d - 0.02), M.top); top.rotation.x = -Math.PI / 2; top.position.set(cx, S0.y + 0.003, cz); stageG.add(top);
    const col = S0.kind === 'stage' ? 0xffc860 : 0x6a4cff; // gold stage nosing, accent-violet riser nosing (front edge toward the booth, -z)
    neon(stageG, [[S0.x0, S0.y + 0.006, S0.z0 + 0.01], [S0.x1, S0.y + 0.006, S0.z0 + 0.01]], col, 0.85);
    if (S0.kind === 'stage') neon(stageG, [[S0.x0, S0.y + 0.006, S0.z1 - 0.01], [S0.x1, S0.y + 0.006, S0.z1 - 0.01]], col, 0.85); }
}
// ---------- 870 stairs: balcony -> Room 1 (x < 0) and Room 2 (x > 0) ----------
const stairs = new THREE.Group(); stairs.name = 'annexStairs870'; root.add(stairs);
{ const S0 = STAIR, run = (S0.top - S0.foot) / S0.n, rise = BALC.y / S0.n, W = S0.z1 - S0.z0, zc = (S0.z0 + S0.z1) / 2;
  const treadMat = LIGHTS ? new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.55 }) : new THREE.MeshBasicMaterial({ map: woodTex, color: 0xd8c8b4 });
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), bKneeMat, 2 * S0.n + 2), tread = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), treadMat, 2 * S0.n + 2);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Pv = new THREE.Vector3(), Sv = new THREE.Vector3(); let i = 0;
  const put = (x, y0, y1, w, lift) => { M.compose(Pv.set(x, (y0 + y1) / 2, zc), Q, Sv.set(w, y1 - y0, W)); body.setMatrixAt(i, M); M.compose(Pv.set(x, y1 + 0.015, zc), Q, Sv.set(w + 0.03, 0.03, W + 0.02)); tread.setMatrixAt(i, M); i++; };
  for (const sx of [-1, 1]) {
    put(sx * (S0.top + 12.0) / 2, 0, BALC.y - 0.03, 12.0 - S0.top, 0); // landing block
    for (let k = 0; k < S0.n - 1; k++) { const xm = S0.top - run * (k + 0.5); put(sx * xm, 0, BALC.y - rise * (k + 1) - 0.03, run, 0); }
    // balustrade on the open (room) side: sloped brass handrail + posts, gold nosing neon
    const y0 = 0.95, a = new THREE.Vector3(sx * S0.top, BALC.y + y0, S0.z0 + 0.04), b = new THREE.Vector3(sx * S0.foot, y0, S0.z0 + 0.04);
    const hr = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, a.distanceTo(b), 10), brass); hr.position.addVectors(a, b).multiplyScalar(0.5); hr.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); stairs.add(hr);
    const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 12.0 - S0.top, 10), brass); hl.rotation.z = Math.PI / 2; hl.position.set(sx * (S0.top + 12.0) / 2, BALC.y + y0, S0.z0 + 0.04); stairs.add(hl);
    for (let k = 0; k <= 8; k++) { const f = k / 8, x = S0.top + (S0.foot - S0.top) * f, yb = BALC.y * (1 - f); box(brass, 0.035, y0, 0.035, sx * x, yb + y0 / 2, S0.z0 + 0.04, stairs); }
    box(brass, 0.035, y0, 0.035, sx * 11.95, BALC.y + y0 / 2, S0.z0 + 0.04, stairs);
    neon(stairs, [[sx * 11.95, BALC.y + 0.03, S0.z0 + 0.01], [sx * S0.top, BALC.y + 0.03, S0.z0 + 0.01], [sx * S0.foot, 0.03, S0.z0 + 0.01]], 0xffc860, 0.8);
  }
  body.count = tread.count = i; body.instanceMatrix.needsUpdate = tread.instanceMatrix.needsUpdate = true; stairs.add(body, tread);
}
// sensor monitors on the pier left of Window 1's centre (in-scene: live CanvasTextures)
const monitors = { A: null, B: null, header: null, tex: {} };
if (opt.monitors) {
  const mon = (key, x, y) => { const t = new THREE.CanvasTexture(sensCanvas[key]); t.colorSpace = THREE.SRGBColorSpace; monitors.tex[key] = t;
    const g = new THREE.Group(); g.position.set(x, y, B.z0 + 0.25); g.rotation.x = -0.18; balcony.add(g);
    box(mullMat, 1.36, 0.8, 0.05, 0, 0, -0.03, g); const s = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 0.72), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); g.add(s);
    const cap = makeLabel(`iPhone ${key} sensor`, key === 'A' ? '#4fd8ff' : '#ffb84f', 0.9, '600 30px system-ui', 512); cap.position.set(0, 0.47, 0.01); g.add(cap); return g; };
  // hung from the header just inside Window 1's east end, angled down toward a visitor on the balcony
  monitors.A = mon('A', -5.6, B.glassTop - 0.48); monitors.B = mon('B', -4.1, B.glassTop - 0.48);
  const hc = document.createElement('canvas'); hc.width = 2048; hc.height = 96; const ht = new THREE.CanvasTexture(hc); ht.colorSpace = THREE.SRGBColorSpace;
  const hm = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 0.3), new THREE.MeshBasicMaterial({ map: ht, transparent: true, toneMapped: false })); hm.position.set(-4.2, B.glassTop + 0.17, B.z0 + 0.09); balcony.add(hm);
  monitors.header = { c: hc, g: hc.getContext('2d'), t: ht };
}
function drawHeader() {
  const h = monitors.header; if (!h) return; const g = h.g; g.clearRect(0, 0, 2048, 96); g.fillStyle = 'rgba(6,8,16,0.9)'; g.fillRect(0, 0, 2048, 96); g.strokeStyle = '#34e0c0'; g.lineWidth = 3; g.strokeRect(2, 2, 2044, 92);
  g.fillStyle = '#9effc4'; g.font = '600 40px ui-monospace,monospace'; g.textBaseline = 'middle';
  const p = latestPacket, locked = p ? p.lockedCount : 0, e = engine.err;
  g.fillText(`Room 1 → Room 2 Pipe: 60 Hz · ${locked}/${dancers.length} IDs locked · ~${engine.pipe.kbps().toFixed(0)} kbps · 3D error: ${e.mean.toFixed(1)} cm · Symmetric ±${(rig.solved.psi * 180 / Math.PI).toFixed(0)}° wall-tangent rig`, 24, 50);
  h.t.needsUpdate = true;
}

// ---------- tick ----------
let paintAcc = 0, teleAcc = 0, sensAcc = 0;
function tick(dt, { sensorsHz = 60, paint = true } = {}) {
  beat.poll();
  syncEngine(); const k = engine.advance(dt); const t = engine.simT;
  sensAcc += dt; if (k && sensAcc >= 1 / sensorsHz - 1e-4) { sensAcc = 0; drawSensor('A'); drawSensor('B'); if (monitors.tex.A) { monitors.tex.A.needsUpdate = true; monitors.tex.B.needsUpdate = true; } }
  animate(t); updateBalls(dt, t); updateMovers(t, dt); updatePulses(dt);
  paintAcc += dt; if (paint && paintAcc > 1 / 30) { paintAcc = 0; drawPainting(t); }
  teleAcc += dt; if (teleAcc > 0.2) { teleAcc = 0; telemetry(); drawHeader(); }
}
const reRig = () => { solveRig(); placePhone('A'); placePhone('B'); };
// 868d: in /play/ (no own lights) every lit material becomes self-lit, so the gallery's outdoor sun can never tint the club
if (!LIGHTS) { const cache = new Map(); const conv = mt => { if (!mt || !(mt.isMeshStandardMaterial || mt.isMeshPhysicalMaterial || mt.isMeshLambertMaterial || mt.isMeshPhongMaterial)) return mt;
    if (!cache.has(mt)) { const b = new THREE.MeshBasicMaterial({ color: mt.color ? mt.color.clone() : 0xffffff, map: mt.map || null, transparent: mt.transparent, opacity: mt.opacity, side: mt.side, depthWrite: mt.depthWrite, depthTest: mt.depthTest, toneMapped: mt.toneMapped, vertexColors: mt.vertexColors });
      if (mt.emissive && (mt.emissive.r + mt.emissive.g + mt.emissive.b) > 0.05) b.color.copy(mt.emissive).multiplyScalar(Math.max(1, mt.emissiveIntensity || 1)).add(b.color.clone().multiplyScalar(0.3));
      cache.set(mt, b); }
    return cache.get(mt); };
  root.traverse(o => { if (o.material) o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material); }); }
return {
  root, room1, room2, balcony, engine, S, beat, rig, phones, rigMarks, beam, doors, dancers, dancerMeshes, SHUTTERS, TXT, sensCanvas,
  setCount, reRig, tick, telemetry, get packet() { return latestPacket; }, consts: { R1X, R2X, HW, HD, PAINT_X, BALC, STAIR }, pitFloor, capture: { get nodes() { return capNodes.length; }, get pulses() { return EP.length; }, get fired() { return E3.fired + '/' + E3.landed; }, get fired1() { return E3.world.dancers.length + ' in 3D world, linkR ' + (E3.world.linkRadius / 100).toFixed(2) + ' m, waves ' + E3.world.waves.length; }, get rig1Lit() { return rig1.movers.filter(m => m.level > 0.3).length; }, get rig2Lit() { return rig2.movers.filter(m => m.level > 0.3).length; } }, setPlayer(p) { dancers.player = p; },
};
}
