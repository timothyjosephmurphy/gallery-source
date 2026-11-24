// Glitter Cannon + Leaf Blower: a drop-in tool pack for the TJM first-person galleries (tjm.art/play, Orsay, Bilbao, Uffizi, Guggenheim NY).
// Canonical copy: /workspace/museum-tools/src/glitterblower.js. Each gallery keeps a verbatim copy at src/glitterblower.js (same habit as soup.js / gravgun.js).
//  - GLITTER CANNON (hold click / SPRAY): sprays sparkly coloured flakes that flutter down, settle and stay on the floor. Right-click / BURST: one big pop.
//    Local only (never saved or sent anywhere). One capped InstancedMesh (3000 desktop, 1200 phone); when the cap is reached the oldest flakes are reused first.
//  - Machine elves notice settled glitter, come out from behind the nearest painting with little brooms and dustpans, sweep it up, then go home.
//  - LEAF BLOWER (hold click / BLOW): a cone of air that scatters settled glitter and bowls elves over (they tumble, slide, get up and go back to sweeping).
//  - Hooks: api.sweepAt(position, radius) lets any other prop (e.g. a guide drone) clean; api.pushables.add({...}) lets any prop be blown.
// The module never touches the gallery's own elves, splats, swarm, realm or slipgates; it pauses while ctx.isBusy() is true.
import * as THREE from 'three';
import { swapToolGLB } from './toolglb.js'; // #199 tool GLBs

export const GLITTER = { id: 'glitter', slot: 'Glitter Cannon', hudName: 'GLITTER CANNON', fireLabel: 'SPRAY', altLabel: 'BURST', help: 'hold click spray glitter, right-click burst' };
export const BLOWER = { id: 'blower', slot: 'Leaf Blower', hudName: 'LEAF BLOWER', fireLabel: 'BLOW', help: 'hold click blow' };

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const PALETTE = [0xffd23a, 0xff3fb4, 0x2fe6ff, 0x8cff3a, 0x9a5cff, 0xeef3ff, 0xff6a3d, 0x3d7bff, 0xffa8e8, 0x40ffc8];
const LEAF_COLS = [0xd9661c, 0xb8361a, 0xe8a227, 0x8c8f2a, 0xc7481f];

// ---------- view models (original low-poly props) ----------
function lambert(c, o = {}) { return new THREE.MeshLambertMaterial({ color: c, flatShading: true, ...o }); }
function rainbowTex() { const c = document.createElement('canvas'); c.width = 128; c.height = 4; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 128, 0);
  ['#ff3fb4', '#ffd23a', '#8cff3a', '#2fe6ff', '#9a5cff', '#ff3fb4'].forEach((s, i, a) => g.addColorStop(i / (a.length - 1), s)); x.fillStyle = g; x.fillRect(0, 0, 128, 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t; }
function sparkTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,240,255,.6)'); g.addColorStop(1, 'rgba(255,200,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(30, 2, 4, 60); x.fillRect(2, 30, 60, 4); return new THREE.CanvasTexture(c); }
export function buildGlitterCannon(g) { // teal party cannon: domed hopper of glitter on top, gold trim, fluted bell with a rainbow lip
  const body = new THREE.MeshPhongMaterial({ color: 0x17808a, shininess: 60, specular: 0x88ccd0 }), trim = new THREE.MeshPhongMaterial({ color: 0xd8a83a, specular: 0xfff0c0, shininess: 70, flatShading: true }), dark = lambert(0x1d2326);
  const add = (geo, m, x, y, z, rx = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.x = rx; g.add(o); return o; };
  add(new THREE.CylinderGeometry(0.072, 0.082, 0.3, 18), body, 0, 0, 0, Math.PI / 2);
  add(new THREE.SphereGeometry(0.082, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), body, 0, 0, 0.15, Math.PI / 2); // rounded back end
  add(new THREE.CircleGeometry(0.03, 12), new THREE.MeshBasicMaterial({ map: rainbowTex(), toneMapped: false }), 0, 0, 0.234); // rainbow badge on the back
  add(new THREE.TorusGeometry(0.084, 0.007, 5, 14), trim, 0, 0, 0.1); add(new THREE.TorusGeometry(0.08, 0.007, 5, 14), trim, 0, 0, -0.1);
  const bell = add(new THREE.CylinderGeometry(0.12, 0.07, 0.13, 12, 1, true), new THREE.MeshPhongMaterial({ color: 0x1c8a94, side: THREE.DoubleSide, shininess: 40, flatShading: true }), 0, 0, -0.23, Math.PI / 2);
  const lip = add(new THREE.TorusGeometry(0.12, 0.014, 6, 24), new THREE.MeshBasicMaterial({ map: rainbowTex(), color: new THREE.Color(1.6, 1.6, 1.6) }), 0, 0, -0.295);
  const dome = add(new THREE.SphereGeometry(0.07, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhongMaterial({ color: 0xcfefff, transparent: true, opacity: 0.35, shininess: 120, depthWrite: false }), 0, 0.07, 0.03);
  add(new THREE.CylinderGeometry(0.072, 0.072, 0.02, 12), trim, 0, 0.07, 0.03);
  const fill = new THREE.Group(); fill.position.set(0, 0.085, 0.03); g.add(fill); // glitter inside the hopper (tumbles while spraying)
  const fg = new THREE.OctahedronGeometry(0.012, 0); for (let k = 0; k < 22; k++) { const a = k * 2.4, r = 0.012 + (k % 5) * 0.009;
    const m = new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ color: PALETTE[k % PALETTE.length], toneMapped: false })); m.position.set(Math.cos(a) * r, (k % 4) * 0.008, Math.sin(a) * r); m.rotation.set(k, k * 2, 0); fill.add(m); }
  add(new THREE.BoxGeometry(0.05, 0.12, 0.06), dark, 0, -0.1, 0.09, -0.25); add(new THREE.BoxGeometry(0.018, 0.04, 0.03), trim, 0, -0.06, 0.04);
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTex(), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); flash.position.set(0, 0, -0.32); flash.scale.set(0.22, 0.22, 1); g.add(flash);
  g.userData.glitter = { fill, lip, flash, bell, dome };
  swapToolGLB(g, 'glitter', get => { const f = get('fill'), l = get('lip'); if (!f || !l) return false; const fl = get('flash'); if (fl) { fl.visible = false; flash.position.copy(fl.position); }
    g.userData.glitter = { fill: f, lip: l, flash, bell: get('bell') || bell, dome: get('dome') || dome, fillY: f.position.y }; }, [flash]); return g;
}
export function buildLeafBlower(g) { // hand blower: amber motor housing, black loop handle, long tube with a flattened nozzle
  const shell = new THREE.MeshPhongMaterial({ color: 0xf0a323, shininess: 50, flatShading: true }), black = lambert(0x222326), grey = lambert(0x6f747a), tube = new THREE.MeshPhongMaterial({ color: 0xe9e4d8, shininess: 30, flatShading: true });
  const add = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); g.add(o); return o; };
  add(new THREE.CylinderGeometry(0.1, 0.1, 0.11, 14), shell, 0, 0, 0.1, 0, 0, Math.PI / 2); // fan housing (side-on drum)
  add(new THREE.BoxGeometry(0.1, 0.1, 0.16), shell, 0, 0.0, 0.0);
  const grille = add(new THREE.CircleGeometry(0.075, 14), black, 0.057, 0, 0.1, 0, Math.PI / 2, 0);
  for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(0.004, 0.12 - k * 0.03, 0.006), grey, 0.06, 0, 0.1 + (k - 1) * 0.03);
  add(new THREE.TorusGeometry(0.06, 0.014, 6, 12, Math.PI), black, 0, 0.09, 0.06, 0, Math.PI / 2, 0); // loop handle
  add(new THREE.CylinderGeometry(0.035, 0.042, 0.32, 10), tube, 0, -0.01, -0.22, Math.PI / 2);
  add(new THREE.CylinderGeometry(0.044, 0.044, 0.03, 10), black, 0, -0.01, -0.07, Math.PI / 2);
  const noz = add(new THREE.CylinderGeometry(0.03, 0.035, 0.08, 10), tube, 0, -0.01, -0.41, Math.PI / 2); noz.scale.set(1.5, 1, 0.6);
  add(new THREE.BoxGeometry(0.03, 0.025, 0.012), new THREE.MeshBasicMaterial({ color: 0x47ff8a }), 0.03, 0.06, 0.02); // power LED
  g.userData.blower = { grille, noz, nozRest: 1.5 };
  swapToolGLB(g, 'blower', get => { const gr = get('grille'), n = get('noz'); if (!gr || !n) return false; g.userData.blower = { grille: gr, noz: n, nozRest: 1.0 }; }); return g;
}

// ---------- synthesized sounds (all silent when the gallery is muted) ----------
function makeAudio(isMuted, volume = 0.3) { // volume: master level (TJ: keep it quiet like the gravity gun); optional, backward compatible
  let ac = null, noiseBuf = null, hum = null, master = null; const out = a => { if (!master) { master = a.createGain(); master.gain.value = volume; master.connect(a.destination); } return master; }; const stats = { played: 0, suppressed: 0 };
  const ok = () => { if (isMuted()) { stats.suppressed++; return null; } try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) { return null; }
    if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } stats.played++; return ac; };
  const noise = (a, dur, type, f0, f1, vol, q = 1) => { const t = a.currentTime, s = a.createBufferSource(), f = a.createBiquadFilter(), gn = a.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0008, t + dur); s.connect(f).connect(gn).connect(out(a)); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02); };
  const tone = (a, f0, f1, dur, vol, type = 'sine', delay = 0) => { const t = a.currentTime + delay, o = a.createOscillator(), gn = a.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(vol, t + 0.008); gn.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(gn).connect(out(a)); o.start(t); o.stop(t + dur + 0.02); };
  return { stats,
    sprinkle() { const a = ok(); if (!a) return; noise(a, 0.12, 'highpass', 6000, 4000, 0.07, 0.7); if (Math.random() < 0.45) { const f = 2200 + Math.random() * 3800; tone(a, f, f * 1.01, 0.18, 0.035); } },
    burst() { const a = ok(); if (!a) return; noise(a, 0.18, 'lowpass', 900, 120, 0.4, 0.8); noise(a, 0.5, 'highpass', 7000, 3000, 0.08, 0.6);
      [0, 4, 7, 12, 16].forEach((s, i) => tone(a, 1318 * Math.pow(2, s / 12), 1318 * Math.pow(2, s / 12), 0.28, 0.04, 'triangle', i * 0.045)); },
    swish(vol) { if (vol < 0.02) return; const a = ok(); if (!a) return; noise(a, 0.16, 'bandpass', 3200, 1800, 0.12 * vol, 1.4); },
    whee() { const a = ok(); if (!a) return; tone(a, 620, 1500, 0.32, 0.06, 'sine'); tone(a, 930, 2100, 0.28, 0.025, 'triangle', 0.02); },
    blower(on, dt) { // continuous motor + air while held; released at once on mute
      if (on && isMuted()) on = false;
      if (on && !hum) { const a = ok(); if (!a) return; const t = a.currentTime, o = a.createOscillator(), o2 = a.createOscillator(), lp = a.createBiquadFilter(), s = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(60, t); o.frequency.linearRampToValueAtTime(118, t + 0.35); o2.type = 'square'; o2.frequency.setValueAtTime(121, t); o2.frequency.linearRampToValueAtTime(239, t + 0.35);
        lp.type = 'lowpass'; lp.frequency.value = 520; const og = a.createGain(); og.gain.value = 0.5; o.connect(lp); o2.connect(og).connect(lp);
        s.buffer = noiseBuf; s.loop = true; bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 0.6; s.connect(bp);
        lp.connect(g); bp.connect(g); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12, t + 0.25); g.connect(out(a)); o.start(t); o2.start(t); s.start(t);
        hum = { a, g, nodes: [o, o2, s] }; }
      if (!on && hum) { const { a, g, nodes } = hum, t = a.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0.0001, t + (isMuted() ? 0.02 : 0.25)); nodes.forEach(n => n.stop(t + 0.3)); hum = null; } },
    get humming() { return !!hum; } };
}

// ---------- glitter flakes: one InstancedMesh with a glint shader ----------
function glitterMaterial() {
  return new THREE.ShaderMaterial({ side: THREE.DoubleSide, toneMapped: false, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `attribute float aSeed; uniform float uTime; varying vec3 vCol; varying float vGlint, vSheen;
      void main(){
        mat4 m = modelMatrix * instanceMatrix; vec4 c = m * vec4(0., 0., 0., 1.);
        float dist = distance(c.xyz, cameraPosition), grow = 1. + max(0., dist - 2.5) * 0.16;   // far flakes never shrink below ~a pixel
        vec4 wp = m * vec4(position * grow, 1.);
        vec3 n = normalize(mat3(m) * vec3(0., 1., 0.) + 1e-6), v = normalize(cameraPosition - wp.xyz);
        vec3 L = normalize(vec3(sin(uTime * .9 + aSeed * 31.) * 1.6, .9, cos(uTime * .7 + aSeed * 17.) * 1.6));
        float spec = pow(abs(dot(n, normalize(L + v))), 220.);                               // tight: only a few flakes flash at once
        float tw = step(.965, fract(aSeed * 91.7 + uTime * (.35 + aSeed * .8)));           // random twinkle, independent of the light
        vGlint = spec * 1.8 + tw * 1.3; vSheen = .55 + .45 * abs(dot(n, v));
        #ifdef USE_INSTANCING_COLOR
        vCol = instanceColor;
        #else
        vCol = vec3(1.);
        #endif
        gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `varying vec3 vCol; varying float vGlint, vSheen;
      void main(){ vec3 base = max(mix(vec3(dot(vCol, vec3(.2126, .7152, .0722))), vCol, 1.35), 0.);  // true colour (not tone mapped), like the paintings
        vec3 col = base * (.7 * vSheen + .2) + mix(base, vec3(1.), .45) * vGlint;
        gl_FragColor = vec4(col, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
}
function flakeGeometry(size) { const g = new THREE.BufferGeometry(), s = size / 2; // flat hexagon in XZ (normal +Y)
  const p = [0, 0, 0]; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; p.push(Math.cos(a) * s, 0, Math.sin(a) * s * 0.8); }
  const idx = []; for (let k = 0; k < 6; k++) idx.push(0, 1 + k, 1 + (k + 1) % 6);
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(idx); return g; }

// ---------- elf props: little broom + dustpan, shared geometry ----------
let BROOM = null;
function broomParts() { if (BROOM) return BROOM;
  BROOM = { handle: new THREE.CylinderGeometry(0.011, 0.011, 0.34, 5), head: new THREE.CylinderGeometry(0.025, 0.075, 0.1, 7), band: new THREE.CylinderGeometry(0.028, 0.028, 0.018, 7),
    pan: new THREE.BoxGeometry(0.14, 0.01, 0.1), lip: new THREE.BoxGeometry(0.14, 0.045, 0.01),
    wood: lambert(0x9a6a3a), straw: lambert(0xe6c45a), red: lambert(0xd83a6a), panM: lambert(0x3aa0d8) };
  BROOM.handle.translate(0, -0.17, 0); BROOM.head.translate(0, -0.38, 0); BROOM.band.translate(0, -0.335, 0); BROOM.head.scale(1, 1, 0.45); return BROOM; }
function equipElf(s) { const B = broomParts(), r = s.userData.rig, br = new THREE.Group(); br.position.set(0.16, 0.06, 0.07);
  br.add(new THREE.Mesh(B.handle, B.wood), new THREE.Mesh(B.head, B.straw), new THREE.Mesh(B.band, B.red)); r.body.add(br);
  const pan = new THREE.Group(); pan.position.set(-0.13, -0.2, 0.17); pan.add(new THREE.Mesh(B.pan, B.panM)); const l = new THREE.Mesh(B.lip, B.panM); l.position.set(0, 0.016, -0.04); pan.add(l); r.body.add(pan);
  s.userData.broom = br; s.userData.pan = pan; return s; }

// =====================================================================================================
export function installGlitterBlower(ctx) {
  const { scene, camera } = ctx; if (!scene || !camera) throw new Error('installGlitterBlower: scene and camera are required');
  const walkable = ctx.walkable || (() => true), floorH = ctx.floorH || (() => 0), say = ctx.say || (() => {}), isMuted = ctx.isMuted || (() => false);
  const isBusy = ctx.isBusy || (() => false), isLocked = ctx.isLocked || (() => true), pillars = ctx.pillars || [], paintings = ctx.paintings || [];
  const phone = ctx.phone != null ? !!ctx.phone : (matchMedia('(pointer: coarse)').matches || !!ctx.low);
  const CAP = ctx.cap || (phone ? 1200 : 3000), RATE = phone ? 210 : 420, MAX_ELVES = ctx.maxElves || (phone ? 2 : 4), CEIL = ctx.ceiling || 4;
  const audio = makeAudio(isMuted, ctx.volume != null ? ctx.volume : 0.3);
  // ---- slots: appended after whatever tools the gallery already has (soup/paint, buy wand, gravity gun, ...) ----
  const vm = ctx.vm || [], first = ctx.firstSlot != null ? ctx.firstSlot : vm.length;
  const slots = { glitter: first, blower: first + 1 };
  const vmG = buildGlitterCannon(new THREE.Group()), vmB = buildLeafBlower(new THREE.Group());
  [vmG, vmB].forEach((g, k) => { g.scale.setScalar(0.6); g.rotation.y = 0.1; g.visible = false; vm[first + k] = g; if (ctx.vmScene) ctx.vmScene.add(g); });
  const owns = w => w === slots.glitter || w === slots.blower;
  const getWeapon = ctx.getWeapon || (() => -1);
  // ---- glitter buffers ----
  const flake = new THREE.InstancedMesh(flakeGeometry(phone ? 0.034 : 0.028), glitterMaterial(), CAP);
  flake.instanceMatrix.setUsage(THREE.DynamicDrawUsage); flake.frustumCulled = false; flake.castShadow = flake.receiveShadow = false; flake.name = 'glitter'; flake.renderOrder = 1;
  flake.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAP * 3).fill(1), 3); flake.instanceColor.setUsage(THREE.DynamicDrawUsage);
  const seedAttr = new THREE.InstancedBufferAttribute(new Float32Array(CAP), 1); for (let i = 0; i < CAP; i++) seedAttr.array[i] = Math.random(); flake.geometry.setAttribute('aSeed', seedAttr);
  const M = flake.instanceMatrix.array; M.fill(0); scene.add(flake);
  if (ctx.exempt) ctx.exempt(flake); // gallery's true-colour layer (High tier composites it over the graded image, like the paintings)
  const P = new Float32Array(CAP * 3), Vl = new Float32Array(CAP * 3), S = new Uint8Array(CAP), Rr = new Float32Array(CAP * 4), Tm = new Float32Array(CAP), Sc = new Float32Array(CAP);
  // S: 0 free · 1 in the air · 2 settled · 3 being swept (slides into a dustpan and shrinks)
  let head = 0, nAir = 0, nSettled = 0, nSwept = 0, dmin = CAP, dmax = -1, cmin = CAP, cmax = -1, emitAcc = 0, now = 0;
  const _c = new THREE.Color();
  const writeM = (i, rx, ry, s) => { const o = i * 16, cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    M[o] = cy * s; M[o + 1] = 0; M[o + 2] = -sy * s; M[o + 3] = 0; M[o + 4] = sy * sx * s; M[o + 5] = cx * s; M[o + 6] = cy * sx * s; M[o + 7] = 0;
    M[o + 8] = sy * cx * s; M[o + 9] = -sx * s; M[o + 10] = cy * cx * s; M[o + 11] = 0; M[o + 12] = P[i * 3]; M[o + 13] = P[i * 3 + 1]; M[o + 14] = P[i * 3 + 2]; M[o + 15] = 1;
    if (i < dmin) dmin = i; if (i > dmax) dmax = i; };
  const hide = i => { const o = i * 16; for (let k = 0; k < 16; k++) M[o + k] = 0; if (i < dmin) dmin = i; if (i > dmax) dmax = i; };
  function emit(x, y, z, vx, vy, vz) { const i = head; head = (head + 1) % CAP; // ring buffer: the slot reused is always the oldest flake
    if (S[i] === 1) nAir--; else if (S[i] === 2) nSettled--; else if (S[i] === 3) nSwept--;
    S[i] = 1; nAir++; P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z; Vl[i * 3] = vx; Vl[i * 3 + 1] = vy; Vl[i * 3 + 2] = vz;
    Rr[i * 4] = Math.random() * 6.28; Rr[i * 4 + 1] = Math.random() * 6.28; Rr[i * 4 + 2] = (Math.random() - 0.5) * 30; Rr[i * 4 + 3] = (Math.random() - 0.5) * 22; Tm[i] = 0; Sc[i] = 0.75 + Math.random() * 0.6;
    _c.setHex(PALETTE[(Math.random() * PALETTE.length) | 0]); if (Math.random() < 0.15) _c.offsetHSL(0, 0, 0.12); flake.instanceColor.setXYZ(i, _c.r, _c.g, _c.b); if (i < cmin) cmin = i; if (i > cmax) cmax = i;
    seedAttr.array[i] = Math.random(); return i; }
  const settle = i => { S[i] = 2; nAir--; nSettled++; Tm[i] = now; P[i * 3 + 1] = floorH(P[i * 3], P[i * 3 + 2]) + 0.011 + Math.random() * 0.005; // above floor bands / runners (they sit up to ~6 mm proud)
    writeM(i, (Math.random() - 0.5) * 0.5, Rr[i * 4], Sc[i]); };
  const _f = V(), _r = V(), _u = V(), _m = V();
  function muzzle(dist = 0.55) { camera.updateMatrixWorld(); camera.getWorldDirection(_f); _r.set(1, 0, 0).applyQuaternion(camera.quaternion); _u.set(0, 1, 0).applyQuaternion(camera.quaternion);
    return _m.copy(camera.position).addScaledVector(_f, dist).addScaledVector(_r, 0.16).addScaledVector(_u, -0.13); }
  function spray(n, spread, s0, s1, up = 0.6) { const m = muzzle(0.5);
    for (let k = 0; k < n; k++) { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * spread, sp = s0 + Math.random() * (s1 - s0);
      const dx = _f.x + (_r.x * Math.cos(a) + _u.x * Math.sin(a)) * r, dy = _f.y + (_r.y * Math.cos(a) + _u.y * Math.sin(a)) * r, dz = _f.z + (_r.z * Math.cos(a) + _u.z * Math.sin(a)) * r;
      emit(m.x + (Math.random() - 0.5) * 0.04, m.y + (Math.random() - 0.5) * 0.04, m.z + (Math.random() - 0.5) * 0.04, dx * sp, dy * sp + up, dz * sp); } }
  function sweepAt(pos, radius = 0.6, sink) { // public: turn floor glitter (and low-flying flakes) within radius into swept flakes
    if (!pos) return 0; const r2 = radius * radius, sx = sink ? sink.x : pos.x, sz = sink ? sink.z : pos.z; let n = 0;
    for (let i = 0; i < CAP; i++) { const st = S[i]; if (st !== 2 && !(st === 1 && P[i * 3 + 1] < floorH(P[i * 3], P[i * 3 + 2]) + 0.35)) continue;
      const dx = P[i * 3] - pos.x, dz = P[i * 3 + 2] - pos.z; if (dx * dx + dz * dz > r2) continue;
      if (st === 1) nAir--; else nSettled--; S[i] = 3; nSwept++; Tm[i] = 0.25 + Math.random() * 0.3; Vl[i * 3] = sx + (Math.random() - 0.5) * 0.05; Vl[i * 3 + 2] = sz + (Math.random() - 0.5) * 0.05; Vl[i * 3 + 1] = Tm[i]; n++; }
    stats.swept += n; return n; }
  function clearGlitter() { for (let i = 0; i < CAP; i++) { S[i] = 0; hide(i); } nAir = nSettled = nSwept = 0; }
  const stats = { sprayed: 0, swept: 0, blownFlakes: 0, elvesSpawned: 0, tumbles: 0, getups: 0 };
  // ---- leaf blower air (soft puffs) + a few autumn leaves for character ----
  const NW = phone ? 36 : 72, wP = new Float32Array(NW * 3), wV = new Float32Array(NW * 3), wL = new Float32Array(NW); let wHead = 0;
  const wGeo = new THREE.BufferGeometry(); wGeo.setAttribute('position', new THREE.BufferAttribute(wP, 3).setUsage(THREE.DynamicDrawUsage)); wGeo.setAttribute('aLife', new THREE.BufferAttribute(wL, 1).setUsage(THREE.DynamicDrawUsage));
  const wMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uScale: { value: 400 } },
    vertexShader: 'attribute float aLife; uniform float uScale; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vA = aLife; gl_PointSize = aLife > 0. ? uScale * (0.2 - aLife * 0.14) / max(0.3, -mv.z) : 0.; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying float vA; void main(){ vec2 q = gl_PointCoord - .5; float d = dot(q, q) * 4.; if (d > 1.) discard; gl_FragColor = vec4(vec3(.75, .88, 1.) * (1. - d) * (1. - d) * vA * .2, 1.); }' });
  const wisps = new THREE.Points(wGeo, wMat); wisps.frustumCulled = false; wisps.name = 'blowerAir'; scene.add(wisps);
  const NL = phone ? 10 : 22, leafShape = new THREE.Shape(); leafShape.moveTo(0, -0.05); leafShape.quadraticCurveTo(0.035, -0.01, 0, 0.05); leafShape.quadraticCurveTo(-0.035, -0.01, 0, -0.05);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 3); leafGeo.rotateX(-Math.PI / 2);
  const leaves = new THREE.InstancedMesh(leafGeo, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), NL); leaves.frustumCulled = false; leaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage); leaves.name = 'blowerLeaves';
  const lf = Array.from({ length: NL }, (_, k) => { leaves.setColorAt(k, _c.setHex(LEAF_COLS[k % LEAF_COLS.length])); return { p: V(), v: V(), life: 0, rx: 0, ry: 0, sx: 0, sy: 0 }; }); let lHead = 0;
  const _o = new THREE.Object3D(); lf.forEach((l, k) => { _o.scale.setScalar(0); _o.updateMatrix(); leaves.setMatrixAt(k, _o.matrix); }); scene.add(leaves);
  // ---- pushables registry: anything that should be blown (elves now; robot, drone, ostrich later) ----
  const pushList = [];
  const pushables = {
    // entry: { object?: Object3D, position?: Vector3, getPosition?: () => Vector3, radius = 0.35, mass = 1, onPush?: (impulse: Vector3, info) => void, name? }
    // Without onPush the module slides entry.object (or entry.position) along the floor itself, respecting walkable() and pillars.
    add(e) { if (!e || pushList.includes(e)) return () => {}; e.radius = e.radius || 0.35; e.mass = e.mass || 1; e._v = e._v || V(); pushList.push(e); return () => pushables.remove(e); },
    remove(e) { const i = pushList.indexOf(e); if (i >= 0) pushList.splice(i, 1); }, get list() { return pushList.slice(); } };
  const posOf = e => e.getPosition ? e.getPosition() : e.position || (e.object && e.object.position);
  // ---- sweeper elves ----
  const elves = []; let noticeT = 0, spawnCool = 0, noticed = false, firstUse = { g: 0, b: 0 };
  function homeFor(target) { let best = null, bd = 1e9; const tp = V(target.x, 0, target.z);
    for (const p of paintings) { if (p.state !== 'wall' || !p.group || !p.data) continue; const g = p.group.position, d = Math.hypot(g.x - tp.x, g.z - tp.z); if (d > 14 || d > bd) continue;
      const n = V(p.data.ix, 0, p.data.iz), t = V(n.z, 0, -n.x), side = Math.random() < 0.5 ? -1 : 1;
      for (const off of [0.75, 1.05]) { const fl = V(g.x, 0, g.z).addScaledVector(t, side * (p.w / 2 + 0.18)).addScaledVector(n, off); if (!walkable(fl.x, fl.z)) continue;
        const wall = V(g.x, Math.max(0.7, g.y - p.h / 2 + 0.12), g.z).addScaledVector(t, side * (p.w / 2 + 0.16)).addScaledVector(n, 0.22); best = { floor: fl, wall, p }; bd = d; break; } }
    if (!best) { for (let k = 0; k < 12 && !best; k++) { const a = Math.random() * 6.28, fl = V(tp.x + Math.cos(a) * 2.5, 0, tp.z + Math.sin(a) * 2.5); if (walkable(fl.x, fl.z)) best = { floor: fl, wall: V(fl.x, floorH(fl.x, fl.z) + 0.9, fl.z), p: null }; } }
    return best; }
  function nearestSettled(x, z, skip) { let bi = -1, bd = 1e18;
    for (let i = 0; i < CAP; i++) { if (S[i] !== 2) continue; const dx = P[i * 3] - x, dz = P[i * 3 + 2] - z, d = dx * dx + dz * dz; if (d >= bd) continue;
      if (skip && skip(P[i * 3], P[i * 3 + 2])) continue; bd = d; bi = i; } return bi; }
  const claimed = (me) => (x, z) => elves.some(o => o !== me && o.tgt && (o.state === 'walk' || o.state === 'sweep') && (o.tgt.x - x) ** 2 + (o.tgt.z - z) ** 2 < 0.8);
  function spawnElf() { const ci = nearestSettled(camera.position.x, camera.position.z, null); if (ci < 0 || !ctx.makeElf) return null;
    const home = homeFor({ x: P[ci * 3], z: P[ci * 3 + 2] }); if (!home) return null;
    const s = equipElf(ctx.makeElf(Math.random())); s.name = 'sweeperElf'; s.scale.setScalar(0.05); s.position.copy(home.wall); scene.add(s);
    const e = { s, home, state: 'emerge', t: 0, st: 0, pos: home.floor.clone(), v: V(), vy: 0, hop: 0, yaw: 0, roll: 0, axis: V(1, 0, 0), quiet: 0, stuck: 0, tgt: null, strokes: 0, ph: Math.random() * 6, lastWhee: -9 };
    e.push = { name: 'elf', radius: 0.3, mass: 1, getPosition: () => _ep.set(e.pos.x, floorH(e.pos.x, e.pos.z) + 0.3 + e.hop, e.pos.z),
      onPush(imp) { if (e.state === 'emerge' || e.state === 'home' || e.state === 'gone') return; e.v.x += imp.x; e.v.z += imp.z; e.vy = Math.max(e.vy, Math.min(3.2, e.vy + imp.y));
        if (e.state !== 'tumble' && Math.hypot(e.v.x, e.v.z) > 0.9) { e.state = 'tumble'; e.st = 0; e.quiet = 0; stats.tumbles++; if (now - e.lastWhee > 1.2) { e.lastWhee = now; audio.whee(); } } } };
    pushables.add(e.push); elves.push(e); stats.elvesSpawned++;
    if (!noticed) { noticed = true; say('THE ELVES HAVE NOTICED THE GLITTER', 2.5); } return e; }
  const _ep = V(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler(), UP = V(0, 1, 0);
  function stepElf(e, dt) { e.t += dt; e.st += dt; const s = e.s, t = e.t + e.ph; let mode = 'idle', face = null, upright = true;
    const moveTo = (tx, tz, speed) => { const dx = tx - e.pos.x, dz = tz - e.pos.z, d = Math.hypot(dx, dz); if (d < 1e-4) return 0; const k = Math.min(d, speed * dt) / d;
      let nx = e.pos.x + dx * k, nz = e.pos.z + dz * k; const ok = walkable(nx, nz); if (!ok) { if (walkable(nx, e.pos.z)) nz = e.pos.z; else if (walkable(e.pos.x, nz)) nx = e.pos.x; else { nx = e.pos.x; nz = e.pos.z; } }
      const moved = Math.hypot(nx - e.pos.x, nz - e.pos.z); e.stuck = moved < speed * dt * 0.3 ? e.stuck + dt : 0; e.pos.x = nx; e.pos.z = nz; face = Math.atan2(dx, dz); return d; };
    const pick = () => { const i = nearestSettled(e.pos.x, e.pos.z, claimed(e)); const j = i < 0 ? nearestSettled(e.pos.x, e.pos.z, null) : i; if (j < 0) { e.tgt = null; return false; } e.tgt = V(P[j * 3], 0, P[j * 3 + 2]); return true; };
    if (e.state === 'emerge') { const k = Math.min(1, e.st / 1.3); mode = k < 0.45 ? 'peek' : 'walk';
      if (k < 0.45) { s.position.copy(e.home.wall); s.scale.setScalar(Math.max(0.05, Math.min(1, e.st / 0.45))); }
      else { const u = (k - 0.45) / 0.55, fy = floorH(e.home.floor.x, e.home.floor.z) + 0.35; s.position.lerpVectors(e.home.wall, _ep.set(e.home.floor.x, fy, e.home.floor.z), u); s.position.y += Math.sin(u * Math.PI) * 0.35; s.scale.setScalar(1); }
      if (k >= 1) { e.pos.copy(e.home.floor); e.state = pick() ? 'walk' : 'retreat'; e.st = 0; } }
    else if (e.state === 'walk') { mode = 'walk'; if (!e.tgt || e.st > 0.6) { e.st = 0; if (!pick()) { e.state = 'retreat'; e.st = 0; } }
      if (e.tgt) { const d = moveTo(e.tgt.x, e.tgt.z, 1.7); if (d < 0.28) { e.state = 'sweep'; e.st = 0; e.strokes = 0; }
        if (e.stuck > 1.2) { e.pos.set(e.tgt.x + (Math.random() - 0.5) * 0.5, 0, e.tgt.z + (Math.random() - 0.5) * 0.5); if (!walkable(e.pos.x, e.pos.z)) e.pos.set(e.tgt.x, 0, e.tgt.z); e.stuck = 0; e.glitch = 0.3; } } }
    else if (e.state === 'sweep') { mode = 'scrub'; face = e.yaw; const stroke = 0.55;
      if (e.st > stroke) { e.st = 0; e.strokes++; const fx = Math.sin(e.yaw), fz = Math.cos(e.yaw), c = _ep.set(e.pos.x + fx * 0.22, 0, e.pos.z + fz * 0.22), sink = V(e.pos.x + fx * 0.12 - fz * 0.1, 0, e.pos.z + fz * 0.12 + fx * 0.1);
        const n = sweepAt(c, 0.5, sink); const dd = camera.position.distanceTo(s.position); if (n > 0 && e.strokes % 2 === 1) audio.swish(1 / (1 + dd * dd * 0.12));
        if (n === 0) { if (pick()) { e.state = 'walk'; e.st = 0; } else { e.state = 'retreat'; e.st = 0; } }
        else if (e.strokes > 2) { const before = e.tgt; if (pick() && before && e.tgt.distanceTo(before) > 0.35) { e.state = 'walk'; e.st = 0; } } }
      e.pos.x += Math.sin(e.yaw) * dt * 0.05; e.pos.z += Math.cos(e.yaw) * dt * 0.05; }
    else if (e.state === 'tumble') { mode = 'carry'; upright = false; const sp = Math.hypot(e.v.x, e.v.z);
      const fr = Math.exp(-(e.hop > 0.01 ? 0.6 : 2.6) * dt); e.v.x *= fr; e.v.z *= fr; e.vy -= 9.8 * dt; e.hop = Math.max(0, e.hop + e.vy * dt); if (e.hop === 0 && e.vy < 0) e.vy = sp > 1.2 ? -e.vy * 0.3 : 0;
      let nx = e.pos.x + e.v.x * dt, nz = e.pos.z + e.v.z * dt; if (!walkable(nx, e.pos.z)) { e.v.x *= -0.45; nx = e.pos.x; } if (!walkable(e.pos.x, nz)) { e.v.z *= -0.45; nz = e.pos.z; } e.pos.x = nx; e.pos.z = nz;
      if (sp > 0.05) e.axis.set(e.v.z, 0, -e.v.x).normalize(); e.roll += sp * dt * 5.5;
      e.quiet = sp < 0.35 && e.hop < 0.01 ? e.quiet + dt : 0; if (e.quiet > 0.45) { e.state = 'getup'; e.st = 0; stats.getups++; e.from = s.quaternion.clone(); } }
    else if (e.state === 'getup') { mode = 'idle'; upright = false; const k = Math.min(1, e.st / 0.7); if (k >= 1) { e.roll = 0; e.state = pick() ? 'walk' : 'retreat'; e.st = 0; } e.getK = k; }
    else if (e.state === 'retreat') { mode = 'retreat'; const d = moveTo(e.home.floor.x, e.home.floor.z, 1.9); if (nSettled > 0 && e.st > 0.4 && pick()) { e.state = 'walk'; e.st = 0; }
      else if (d < 0.15 || e.stuck > 1.5) { e.state = 'home'; e.st = 0; e.hp = s.position.clone(); } }
    else if (e.state === 'home') { mode = 'walk'; const k = Math.min(1, e.st / 0.7); s.position.lerpVectors(e.hp, e.home.wall, k); s.position.y += Math.sin(k * Math.PI) * 0.25; s.scale.setScalar(Math.max(0.05, 1 - k));
      if (k >= 1) e.state = 'gone'; }
    if (e.state === 'walk' || e.state === 'sweep' || e.state === 'retreat' || e.state === 'tumble' || e.state === 'getup') { // keep clear of pillars
      for (const [px, pz] of pillars) { const dx = e.pos.x - px, dz = e.pos.z - pz, d = Math.hypot(dx, dz); if (d < 0.6 && d > 0) { e.pos.x = px + dx / d * 0.6; e.pos.z = pz + dz / d * 0.6; } }
      const bounce = mode === 'scrub' ? Math.abs(Math.sin(t * 11)) * 0.03 : mode === 'walk' || mode === 'retreat' ? Math.abs(Math.sin(t * 8)) * 0.12 : 0;
      s.position.set(e.pos.x, floorH(e.pos.x, e.pos.z) + 0.35 + e.hop + bounce, e.pos.z); s.scale.setScalar(e.glitch > 0 ? 0.6 + Math.random() * 0.5 : 1); }
    if (e.glitch > 0) e.glitch -= dt;
    if (ctx.animateElf) ctx.animateElf(s, mode, e.t, camera, dt);
    // orientation after animateElf (which faces the camera): face the work / tumble about the push axis / roll back upright
    if (face != null) { let dy = face - e.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); e.yaw += dy * Math.min(1, dt * 10); }
    if (e.state === 'tumble') { _q.setFromAxisAngle(e.axis, e.roll); _q2.setFromAxisAngle(UP, e.yaw); s.quaternion.copy(_q).multiply(_q2); }
    else if (e.state === 'getup') { _q2.setFromAxisAngle(UP, e.yaw); s.quaternion.slerpQuaternions(e.from, _q2, e.getK * e.getK * (3 - 2 * e.getK)); s.position.y -= (1 - e.getK) * 0.18; }
    else if (e.state !== 'emerge' && e.state !== 'home') s.rotation.set(0, e.yaw + (mode === 'scrub' ? Math.sin(t * 7) * 0.35 : 0), 0);
    // broom: swings low while sweeping, carried upright otherwise; dustpan only shows while sweeping
    const br = s.userData.broom, pan = s.userData.pan;
    if (mode === 'scrub') { br.rotation.set(-0.85, Math.sin(t * 11.4) * 0.7, 0.25); pan.visible = true; } else { br.rotation.set(2.75 + Math.sin(t * 6) * 0.08, 0, e.state === 'tumble' ? Math.sin(t * 15) * 1.2 : -0.25); pan.visible = e.state === 'tumble'; } // shouldered while walking
  }
  function updateElves(dt) {
    if (nSettled > 0) noticeT += dt; else noticeT = 0; spawnCool -= dt;
    const active = elves.filter(e => e.state !== 'home' && e.state !== 'gone').length;
    if (noticeT > 1.6 && spawnCool <= 0 && active < MAX_ELVES && (active === 0 || nSettled / active > 160)) { spawnCool = 0.9; spawnElf(); }
    for (let k = elves.length - 1; k >= 0; k--) { const e = elves[k]; stepElf(e, dt); if (e.state === 'gone') { scene.remove(e.s); pushables.remove(e.push); elves.splice(k, 1); } }
    if (nSettled === 0 && !elves.length) noticed = false; }
  // ---- per-frame glitter physics ----
  function updateFlakes(dt) {
    const g = 7.5, drag = Math.exp(-2.1 * dt); nAir = 0; nSettled = 0; nSwept = 0;
    for (let i = 0; i < CAP; i++) { const st = S[i]; if (st === 0) continue; if (st === 2) { nSettled++; continue; }
      const o = i * 3;
      if (st === 1) { Tm[i] += dt; let vx = Vl[o] * drag, vy = Vl[o + 1] * drag - g * dt, vz = Vl[o + 2] * drag; const fl = Math.sin(now * 9 + i) * 0.35 * dt; vx += fl; vz -= fl;
        if (vy < -1.6) vy = -1.6 + (vy + 1.6) * 0.5; // flutter: flakes fall slowly
        let x = P[o] + vx * dt, z = P[o + 2] + vz * dt; if (!walkable(x, z)) { if (walkable(P[o], z)) { x = P[o]; vx *= -0.3; } else if (walkable(x, P[o + 2])) { z = P[o + 2]; vz *= -0.3; } else { x = P[o]; z = P[o + 2]; vx *= -0.3; vz *= -0.3; } }
        let y = P[o + 1] + vy * dt; if (y > CEIL - 0.05) { y = CEIL - 0.05; vy = -Math.abs(vy) * 0.3; }
        P[o] = x; P[o + 1] = y; P[o + 2] = z; Vl[o] = vx; Vl[o + 1] = vy; Vl[o + 2] = vz;
        if (y <= floorH(x, z) + 0.012 || Tm[i] > 9) { nAir++; settle(i); continue; }
        nAir++; writeM(i, Rr[i * 4 + 1] + Rr[i * 4 + 2] * Tm[i], Rr[i * 4] + Rr[i * 4 + 3] * Tm[i], Sc[i]); }
      else if (st === 3) { Tm[i] -= dt; const k = Math.min(1, dt * 7); P[o] += (Vl[o] - P[o]) * k; P[o + 2] += (Vl[o + 2] - P[o + 2]) * k; P[o + 1] = floorH(P[o], P[o + 2]) + 0.013;
        if (Tm[i] <= 0) { S[i] = 0; hide(i); continue; } nSwept++; writeM(i, 0, Rr[i * 4] + now * 3, Sc[i] * Math.max(0.05, Tm[i] / Math.max(0.05, Vl[o + 1]))); } }
  }
  // ---- the leaf blower's cone ----
  const R = 5.2, TAN = Math.tan(0.44);
  function blow(dt) { const m = muzzle(0.62), fx = _f.x, fy = _f.y, fz = _f.z, hl = Math.hypot(fx, fz) || 1, hx = fx / hl, hz = fz / hl;
    for (let i = 0; i < CAP; i++) { const st = S[i]; if (st !== 1 && st !== 2) continue; const o = i * 3, dx = P[o] - m.x, dy = P[o + 1] - m.y, dz = P[o + 2] - m.z, al = dx * fx + dy * fy + dz * fz;
      if (al < 0 || al > R) continue; const lx = dx - fx * al, ly = dy - fy * al, lz = dz - fz * al, lat = Math.sqrt(lx * lx + ly * ly + lz * lz); if (lat > 0.3 + al * TAN) continue;
      const f = 1 - al / R, rl = Math.hypot(lx, lz) || 1, spread = 0.9 * Math.random();
      if (st === 2) { S[i] = 1; nSettled--; nAir++; Tm[i] = 0; stats.blownFlakes++; Vl[o] = (hx + lx / rl * spread) * (3 + 7 * f) * (0.6 + Math.random() * 0.6); Vl[o + 2] = (hz + lz / rl * spread) * (3 + 7 * f) * (0.6 + Math.random() * 0.6); Vl[o + 1] = 1 + Math.random() * 2.8 * f; P[o + 1] += 0.01; }
      else { Vl[o] += hx * 16 * f * dt; Vl[o + 2] += hz * 16 * f * dt; Vl[o + 1] += 2 * f * dt; } }
    for (const e of pushList) { const p = posOf(e); if (!p) continue; const dx = p.x - m.x, dy = p.y - m.y, dz = p.z - m.z, al = dx * fx + dy * fy + dz * fz; if (al < 0 || al > R) continue;
      const lx = dx - fx * al, ly = dy - fy * al, lz = dz - fz * al, lat = Math.sqrt(lx * lx + ly * ly + lz * lz); if (lat > e.radius + 0.3 + al * TAN) continue;
      const f = (1 - al / R) / e.mass, rl = Math.hypot(lx, lz) || 1, imp = _ep.set((hx + lx / rl * 0.35) * 22 * f * dt, 7 * f * dt, (hz + lz / rl * 0.35) * 22 * f * dt);
      if (e.onPush) e.onPush(imp, { from: m, dir: _f, strength: f, dt }); else e._v.add(imp); }
    // air puffs
    for (let k = 0; k < (phone ? 2 : 3); k++) { const j = wHead; wHead = (wHead + 1) % NW; const a = Math.random() * 6.28, r = Math.random() * 0.2;
      wP[j * 3] = m.x; wP[j * 3 + 1] = m.y; wP[j * 3 + 2] = m.z; const sp = 7 + Math.random() * 4; wV[j * 3] = (fx + (_r.x * Math.cos(a) + _u.x * Math.sin(a)) * r) * sp; wV[j * 3 + 1] = (fy + (_r.y * Math.cos(a) + _u.y * Math.sin(a)) * r) * sp; wV[j * 3 + 2] = (fz + (_r.z * Math.cos(a) + _u.z * Math.sin(a)) * r) * sp; wL[j] = 1; }
    if (Math.random() < dt * (phone ? 3 : 5)) { const l = lf[lHead]; lHead = (lHead + 1) % NL; l.p.copy(m); l.v.set(fx * 6 + (Math.random() - 0.5) * 2, fy * 6 + 1.5, fz * 6 + (Math.random() - 0.5) * 2); l.life = 3.5; l.rx = Math.random() * 6; l.ry = Math.random() * 6; l.sx = (Math.random() - 0.5) * 14; l.sy = (Math.random() - 0.5) * 9; }
  }
  function updateAir(dt) { let any = false;
    for (let j = 0; j < NW; j++) { if (wL[j] <= 0) continue; any = true; wL[j] = Math.max(0, wL[j] - dt * 2.4); const d = Math.exp(-1.5 * dt); wV[j * 3] *= d; wV[j * 3 + 1] *= d; wV[j * 3 + 2] *= d; wP[j * 3] += wV[j * 3] * dt; wP[j * 3 + 1] += wV[j * 3 + 1] * dt; wP[j * 3 + 2] += wV[j * 3 + 2] * dt; }
    if (any || wisps.userData.any) { wGeo.attributes.position.needsUpdate = true; wGeo.attributes.aLife.needsUpdate = true; } wisps.userData.any = any;
    let la = false; lf.forEach((l, k) => { if (l.life <= 0) return; la = true; l.life -= dt; const fy = floorH(l.p.x, l.p.z) + 0.004;
      if (l.p.y > fy) { l.v.y -= 4 * dt; l.v.multiplyScalar(Math.exp(-1.6 * dt)); if (l.v.y < -1.1) l.v.y = -1.1; const nx = l.p.x + l.v.x * dt, nz = l.p.z + l.v.z * dt; if (walkable(nx, nz)) { l.p.x = nx; l.p.z = nz; } else { l.v.x *= -0.3; l.v.z *= -0.3; } l.p.y = Math.max(fy, l.p.y + l.v.y * dt); l.rx += l.sx * dt; l.ry += l.sy * dt; }
      else l.rx *= 0.9; _o.position.copy(l.p); _o.rotation.set(l.p.y > fy ? l.rx : 0.05, l.ry, 0); _o.scale.setScalar(Math.min(1, l.life / 0.6)); _o.updateMatrix(); leaves.setMatrixAt(k, _o.matrix); });
    if (la || leaves.userData.any) leaves.instanceMatrix.needsUpdate = true; leaves.userData.any = la; }
  function updateDefaultPushables(dt) { for (const e of pushList) { if (e.onPush) continue; const p = e.object ? e.object.position : e.position; if (!p || e._v.lengthSq() < 1e-6) continue;
    const fr = Math.exp(-3 * dt); e._v.x *= fr; e._v.z *= fr; const nx = p.x + e._v.x * dt, nz = p.z + e._v.z * dt; if (walkable(nx, p.z)) p.x = nx; else e._v.x *= -0.4; if (walkable(p.x, nz)) p.z = nz; else e._v.z *= -0.4; e._v.y = 0; } }
  // ---- input: hold to fire ----
  let down = false, burstT = 0, kick = 0, sprayT = 0, blowing = 0;
  function press(w) { if (isBusy()) return; down = true; if (w === slots.glitter && !firstUse.g) { firstUse.g = 1; say('GLITTER CANNON · HOLD TO SPRAY · RIGHT-CLICK BURST', 2.5); } if (w === slots.blower && !firstUse.b) { firstUse.b = 1; say('LEAF BLOWER · HOLD TO BLOW', 2); } }
  function release() { down = false; }
  function secondary(w) { if (w == null) w = getWeapon(); if (w !== slots.glitter || isBusy() || burstT > 0) return; burstT = 0.6; kick = 1; spray(phone ? 120 : 260, 0.55, 2.5, 7.5, 1.6); stats.sprayed += phone ? 120 : 260; audio.burst(); }
  addEventListener('mouseup', e => { if (e.button === 0) release(); });
  addEventListener('blur', release);
  addEventListener('mousedown', e => { if (e.button === 2 && isLocked() && getWeapon() === slots.glitter && !window.__reading) secondary(slots.glitter); });
  addEventListener('keydown', e => { const m = /^Digit(\d)$/.exec(e.code); if (!m || !ctx.setWeapon) return; const w = +m[1] - 1; if (owns(w)) ctx.setWeapon(w); });
  // ---- DOM: HUD slots, phone buttons, help text (self-contained, no gallery CSS edits needed) ----
  if (typeof document !== 'undefined') {
    const st = document.createElement('style'); st.textContent = '#tburst{display:none}@media (pointer:coarse){#tburst{display:block;position:fixed;bottom:calc(120px + env(safe-area-inset-bottom));right:calc(16px + env(safe-area-inset-right));width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#ff3fb4cc,#ffd23acc,#2fe6ffcc);color:#fff;font:bold 11px monospace;border:3px solid #fff;text-shadow:0 1px 2px #000}#tburst[hidden]{display:none}}#tfire.gb-hold{box-shadow:0 0 0 4px #fff8,0 0 18px #ff9cf0}';
    document.head.appendChild(st);
    const hud = document.getElementById('hud'), lastW = hud ? [...hud.querySelectorAll('.wpn')].pop() : null;
    [[GLITTER, slots.glitter], [BLOWER, slots.blower]].forEach(([T, w]) => { if (!hud || hud.querySelector(`.wpn[data-w="${w}"]`)) return;
      const b = document.createElement('button'); b.className = 'wpn'; b.type = 'button'; b.dataset.w = w; b.dataset.tool = T.id; b.innerHTML = `<b>${w + 1}</b> ${T.slot}`;
      const pick = e => { e.preventDefault(); e.stopPropagation(); ctx.setWeapon && ctx.setWeapon(w); }; b.addEventListener('touchstart', pick, { passive: false }); b.addEventListener('mousedown', e => e.stopPropagation()); b.addEventListener('click', pick);
      const after = hud.querySelector(`.wpn[data-w="${w - 1}"]`) || lastW; if (after) after.after(b); else hud.prepend(b); });
    const tfire = document.getElementById('tfire'); if (tfire) { ['touchend', 'touchcancel'].forEach(ev => tfire.addEventListener(ev, release)); }
    const touch = document.getElementById('touch'); if (touch && !document.getElementById('tburst')) { const b = document.createElement('button'); b.id = 'tburst'; b.type = 'button'; b.hidden = true; b.textContent = GLITTER.altLabel;
      b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); secondary(slots.glitter); }, { passive: false }); touch.appendChild(b); }
    const help = document.querySelector('#start p:last-of-type'); if (help && !/Glitter/.test(help.innerHTML)) help.insertAdjacentHTML('beforeend', `<br>${slots.glitter + 1} Glitter Cannon: hold to spray, right-click burst · ${slots.blower + 1} Leaf Blower: hold to blow`);
  }
  let shownW = -1;
  if (typeof MutationObserver !== 'undefined' && document.getElementById('hud')) new MutationObserver(() => syncButtons(getWeapon())).observe(document.getElementById('hud'), { subtree: true, attributes: true, attributeFilter: ['class'] }); // follow setWeapon() at once
  function syncButtons(w) { if (w === shownW) return; shownW = w; const tb = document.getElementById('tburst'), tl = document.getElementById('tlaunch'); if (tb) tb.hidden = w !== slots.glitter; if (owns(w) && tl) tl.hidden = true; }
  // ---- main per-frame update: call every frame with the current weapon index ----
  function update(dt, w) { if (w == null) w = getWeapon(); now += dt; flake.material.uniforms.uTime.value = now; syncButtons(w);
    const busy = isBusy(); if (busy || !owns(w)) down = false;
    const tf = typeof document !== 'undefined' && document.getElementById('tfire'); if (tf) tf.classList.toggle('gb-hold', down && owns(w));
    if (!busy) {
      if (down && w === slots.glitter) { emitAcc += RATE * dt; const n = emitAcc | 0; emitAcc -= n; if (n) { spray(n, 0.13, 5.5, 9.5, 0.5); stats.sprayed += n; } kick = Math.min(1, kick + dt * 6); sprayT -= dt; if (sprayT <= 0) { sprayT = 0.075; audio.sprinkle(); } }
      blowing = down && w === slots.blower ? Math.min(1, blowing + dt * 4) : Math.max(0, blowing - dt * 5); if (down && w === slots.blower) blow(dt);
      updateFlakes(dt); updateElves(dt); updateDefaultPushables(dt);
    }
    audio.blower(!busy && down && w === slots.blower, dt); updateAir(dt);
    burstT = Math.max(0, burstT - dt); kick = Math.max(0, kick - dt * 3);
    // partial GPU uploads; ranges accumulate until three uploads them (it clears them), so several updates per rendered frame are safe
    if (dmax >= dmin) { mark(flake.instanceMatrix, dmin * 16, (dmax - dmin + 1) * 16); dmin = CAP; dmax = -1; }
    if (cmax >= cmin) { mark(flake.instanceColor, cmin * 3, (cmax - cmin + 1) * 3); mark(seedAttr, cmin, cmax - cmin + 1); cmin = CAP; cmax = -1; }
    if (ctx.renderer) { const h = ctx.renderer.getDrawingBufferSize(_ds).y; wMat.uniforms.uScale.value = h * 0.5 * camera.projectionMatrix.elements[5]; }
    else wMat.uniforms.uScale.value = innerHeight * Math.min(2, devicePixelRatio || 1) * 0.5 * camera.projectionMatrix.elements[5];
  }
  const _ds = new THREE.Vector2();
  function mark(attr, start, count) { if (attr.updateRanges.length > 6) { attr.clearUpdateRanges(); attr.addUpdateRange(0, attr.array.length); } else attr.addUpdateRange(start, count); attr.needsUpdate = true; }
  // ---- view-model pose: call from the gallery's drawWeapon() after its own positioning ----
  function pose(g, w) { const t = now;
    if (w === slots.glitter) { const u = vmG.userData.glitter, sp = down ? 1 : 0; g.rotation.x = -0.05 + kick * 0.12; g.rotation.z = 0; g.position.y += 0.03; g.position.z += kick * 0.035;
      if (sp) { g.position.x += (Math.random() - 0.5) * 0.004; g.position.y += (Math.random() - 0.5) * 0.004; } u.fill.rotation.y += (0.4 + sp * 9) * 0.016; u.fill.position.y = (u.fillY || 0.085) + sp * Math.abs(Math.sin(t * 30)) * 0.01;
      u.flash.material.opacity = Math.max(sp * (0.55 + 0.45 * Math.random()), burstT > 0.35 ? 1 : 0); const fs = 0.18 + sp * 0.08 + (burstT > 0.35 ? 0.25 : 0); u.flash.scale.set(fs, fs, 1); u.lip.rotation.z = t * 2; if (u.lip.material && u.lip.material.map) u.lip.material.map.offset.x = (t * 0.4) % 1; }
    if (w === slots.blower) { const u = vmB.userData.blower, b = blowing; g.rotation.x = -0.12; g.rotation.z = 0.04; g.position.y += 0.02;
      if (b > 0) { g.position.x += (Math.random() - 0.5) * 0.006 * b; g.position.y += (Math.random() - 0.5) * 0.006 * b; g.rotation.z += Math.sin(t * 60) * 0.01 * b; } u.grille.rotation.z += b * 0.9; u.noz.scale.x = (u.nozRest || 1.5) + Math.sin(t * 45) * 0.06 * b; } }
  return {
    GLITTER, BLOWER, slots, names: [GLITTER.hudName, BLOWER.hudName], fireLabels: [GLITTER.fireLabel, BLOWER.fireLabel], owns,
    down: press, up: release, secondary, update, pose, sweepAt, pushables, viewmodels: [vmG, vmB],
    get holding() { return down; }, get kick() { return kick; },
    glitter: { mesh: flake, cap: CAP, emit, /* #241 */ get air() { return nAir; }, get settled() { return nSettled; }, get swept() { return nSwept; }, get head() { return head; }, clear: clearGlitter, spray: n => { spray(n, 0.13, 5.5, 9.5, 0.5); stats.sprayed += n; }, positions: P, states: S },
    elves, stats, audio: audio.stats, get humming() { return audio.humming; }, phone,
  };
}
