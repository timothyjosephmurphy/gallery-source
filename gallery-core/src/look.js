// "Unreal-look" renderer: PBR stone/rusted-metal, physically based lights, AgX tone mapping, GTAO, bloom, haze,
// wet floor, quality tiers. Paintings (and plaques/signs) are kept out of every colour shift: on High they are
// re-rendered into their own target and composited back un-tone-mapped; on Low they simply skip tone mapping.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { LOOK as LOOK0 } from './museum.config.js'; // per-museum look hooks (#24); TJM Gallery uses the defaults below
const LOOK = LOOK0 || {};

const qs = new URLSearchParams(location.search);
const coarse = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 820;
const saved = (() => { try { return localStorage.getItem('tjmPlayQ'); } catch (e) { return null; } })();
const TIERS = ['low', 'medium', 'high'];
// phones/tablets: Low; desktop: Medium. High is opt-in only (?q=high or the HQ toggle).
export const TIER = TIERS.includes(qs.get('q')) ? qs.get('q') : TIERS.includes(saved) ? saved : coarse ? 'low' : 'medium';
export const HIGH = TIER === 'high', MEDIUM = TIER === 'medium', LOW = TIER === 'low';
export const EXEMPT = 1; // layer for true-colour objects
export const nextTier = t => TIERS[(TIERS.indexOf(t) + 1) % 3];
export function setTier(t) { try { localStorage.setItem('tjmPlayQ', t); } catch (e) {} const u = new URL(location.href); u.searchParams.delete('q'); location.replace(u); }

export function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25));
  r.setSize(innerWidth, innerHeight, false);
  r.toneMapping = THREE.AgXToneMapping; r.toneMappingExposure = LOOK.exposure ?? 1.8; r.outputColorSpace = THREE.SRGBColorSpace;
  r.shadowMap.enabled = !LOW; r.shadowMap.type = HIGH ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  return r;
}

// ---- PBR materials (Poly Haven CC0, WebP). One Source per map; per-mesh repeats are cheap clones. ----
const tl = new THREE.TextureLoader();
const src = {};
function base(name, map, srgb) {
  const k = name + map; if (src[k]) return src[k];
  const file = map === 'diff' && LOW && name !== 'metal' ? `${name}_diff_1k` : `${name}_${map}`;
  const t = tl.load(import.meta.env.BASE_URL + 'pbr/' + file + '.webp');
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8;
  return src[k] = t;
}
const rep = (t, rx, ry) => { const c = t.clone(); c.repeat.set(rx, ry); return c; };
function pbr(name, rx, ry, opts = {}) {
  rx = Math.max(0.5, Math.round(rx * 4) / 4); ry = Math.max(0.5, Math.round(ry * 4) / 4);
  const key = [name, rx, ry, opts.wet ? 1 : 0, opts.tint || ''].join('|'); if (cache.has(key)) return cache.get(key);
  const arm = rep(base(name, 'arm'), rx, ry);
  const P = { map: rep(base(name, 'diff', true), rx, ry), normalMap: rep(base(name, 'nor'), rx, ry), aoMap: arm, roughnessMap: arm, metalnessMap: arm, aoMapIntensity: 0.9 };
  let m;
  if (opts.wet && HIGH) m = new THREE.MeshPhysicalMaterial({ ...P, roughness: 0.55, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.12, envMapIntensity: 1.0, normalScale: new THREE.Vector2(0.8, 0.8) });
  else if (opts.wet) m = new THREE.MeshStandardMaterial({ ...P, roughness: 0.5, metalness: 0, envMapIntensity: 1.1 });
  else if (name === 'metal') m = new THREE.MeshStandardMaterial({ ...P, roughness: 1, metalness: 1, envMapIntensity: 0.6 });
  else m = new THREE.MeshStandardMaterial({ ...P, roughness: 1, metalness: 0, envMapIntensity: 0.5, normalScale: new THREE.Vector2(0.7, 0.7) });
  if (opts.tint) m.color.set(opts.tint);
  if (opts.wet) { m.userData.wet = 1; if (!HIGH && ENV.tex) { m.envMap = ENV.tex; m.envMapIntensity = 1.4; } }
  cache.set(key, m); return m;
}
// a museum can bring its own procedural materials (LOOK.materials(LOW) -> { stone, metal, floor, ceiling, cache })
const OM = LOOK.materials ? LOOK.materials(LOW) : null;
const cache = OM ? OM.cache : new Map();
export const PBR = OM ? { stone: OM.stone, metal: OM.metal, floor: OM.floor, ceiling: OM.ceiling } : {
  stone: (rx, ry) => pbr('wall', rx, ry, { tint: 0xb8ada0 }), // ~2 m per tile, slightly muted so the walls stay calm
  metal: (rx, ry) => pbr('metal', rx, ry),
  floor: (rx, ry) => pbr('floor', rx, ry, { wet: true, tint: 0x6e665e }),
  ceiling: (rx, ry) => pbr('metal', rx, ry, { tint: 0x6a5850 }), // dark sooty iron overhead
};

export const ENV = {};
export function setupEnvironment(renderer, scene) {
  const pm = new THREE.PMREMGenerator(renderer);
  // dark warm dungeon environment for reflections: near-black stone with a few torch/lava glows (no white studio light)
  const env = new THREE.Scene(); env.add(new THREE.Mesh(new THREE.BoxGeometry(30, 10, 30), new THREE.MeshBasicMaterial({ color: LOOK.envColor ?? 0x1a130e, side: THREE.BackSide })));
  const glow = (c, k, x, y, z, s) => { const m = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k) })); m.position.set(x, y, z); env.add(m); };
  (LOOK.envGlows || [[0xff8a30, 6, -8, 2, 6, 0.6], [0xff8a30, 6, 9, 2, -5, 0.6], [0xff8a30, 6, 3, 2.5, 12, 0.5], [0xff5a10, 3, -12, -1, -10, 2.5], [0xffe2b0, 2, 0, 3, -13, 1.2]]).forEach(a => glow(...a));
  const envTex = pm.fromScene(env, 0.02).texture; pm.dispose();
  if (HIGH) { scene.environment = envTex; scene.environmentIntensity = LOOK.envIntensity ?? 1.6; }
  else cache.forEach(m => { if (m.userData.wet) { m.envMap = envTex; m.envMapIntensity = 1.4; m.needsUpdate = true; } }); // Low: reflections only on the wet floor
  ENV.tex = envTex;
  { const F = LOOK.fog || [0x1a140e, 0.014, 0.016]; scene.fog = new THREE.FogExp2(F[0], HIGH ? F[2] : F[1]); }
}

// mark an object as true-colour: no tone mapping, no fog, no bloom, composited over the graded image on High
export function exempt(mesh) {
  mesh.traverse(o => { if (!o.material) return; o.layers.set(EXEMPT); const ms = Array.isArray(o.material) ? o.material : [o.material];
    ms.forEach(m => { m.toneMapped = false; m.fog = false; }); });
}
export function exemptMaterial(m) { m.toneMapped = false; m.fog = false; return m; }

const FinalShader = {
  uniforms: { tDiffuse: { value: null }, tPaint: { value: null }, toneMappingExposure: { value: 1 }, uVig: { value: 0.22 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `varying vec2 vUv; uniform sampler2D tDiffuse, tPaint; uniform float uVig;
    #include <tonemapping_pars_fragment>
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      vec2 d = vUv - .5; c *= 1. - uVig * dot(d, d) * 2.;            // gentle vignette (graded image only)
      vec3 g = AgXToneMapping(c);
      vec4 p = texture2D(tPaint, vUv);                                // paintings: linear, untouched
      gl_FragColor = sRGBTransferOETF(vec4(mix(g, p.rgb, p.a), 1.)); }`,
};

// Pipeline levels: 'high' = composer (half-res GTAO, half-res bloom, true-colour painting overlay);
// 'direct' = straight to screen with in-material tone mapping (Medium/Low; paintings skip tone mapping).
export function makePipeline(renderer, scene, camera) {
  camera.layers.enable(EXEMPT);
  const size = () => [innerWidth, innerHeight];
  const direct = { level: 'direct', render() { renderer.setRenderTarget(null); renderer.clear(); renderer.render(scene, camera); }, setSize() { renderer.setSize(innerWidth, innerHeight, false); } };
  if (!HIGH) return direct;
  const pr = renderer.getPixelRatio(); let [w, h] = size();
  const rt = new THREE.WebGLRenderTarget(w * pr, h * pr, { type: THREE.HalfFloatType, samples: 2 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, w * pr / 2, h * pr / 2); // half-res AO
  const gSet = gtao.setSize.bind(gtao); gtao.setSize = (a, b) => gSet(Math.round(a / 2), Math.round(b / 2));
  gtao.output = GTAOPass.OUTPUT.Default; gtao.blendIntensity = 0.75;
  gtao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.4, thickness: 1.2, scale: 1, samples: 8 });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, rings: 2, samples: 8 });
  composer.addPass(gtao);
  const bloom = new UnrealBloomPass(new THREE.Vector2(w / 2, h / 2), 0.32, 0.5, 1.0); // only HDR > 1 blooms (lava, flames, gates); half res
  const bSet = bloom.setSize.bind(bloom); bloom.setSize = (a, b) => bSet(Math.round(a / 2), Math.round(b / 2));
  composer.addPass(bloom);
  const fin = new ShaderPass(FinalShader); fin.material.toneMapped = false; composer.addPass(fin); // tone mapping done in-shader
  // painting target: world depth first (paintings excluded), then the paintings themselves
  const paintRT = new THREE.WebGLRenderTarget(w * pr, h * pr, { type: THREE.HalfFloatType, samples: 2 });
  fin.uniforms.tPaint.value = paintRT.texture;
  const depthMat = new THREE.MeshBasicMaterial({ colorWrite: false, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2, side: THREE.DoubleSide });
  const clear = new THREE.Color();
  function paintPass() {
    const bg = scene.background, fog = scene.fog, ac = renderer.autoClear, ov = scene.overrideMaterial, mask = camera.layers.mask, sm = renderer.shadowMap.autoUpdate;
    renderer.getClearColor(clear); const ca = renderer.getClearAlpha();
    scene.background = null; scene.fog = null; renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(paintRT); renderer.setClearColor(0x000000, 0); renderer.clear();
    renderer.autoClear = false;
    camera.layers.set(0); scene.overrideMaterial = depthMat; renderer.render(scene, camera);
    camera.layers.set(EXEMPT); scene.overrideMaterial = null; renderer.render(scene, camera);
    camera.layers.mask = mask; scene.background = bg; scene.fog = fog; renderer.autoClear = ac; scene.overrideMaterial = ov;
    renderer.shadowMap.autoUpdate = sm; renderer.setClearColor(clear, ca); renderer.setRenderTarget(null);
  }
  const high = {
    level: 'high', composer, gtao, bloom,
    render() { paintPass(); composer.render(); },
    setSize() { [w, h] = size(); renderer.setSize(w, h, false); composer.setSize(w, h); paintRT.setSize(w * pr, h * pr); },
  };
  // adaptive step-down: swap to the direct path at runtime (the composer targets are released)
  const P = { level: 'high', render: () => cur.render(), setSize: () => cur.setSize(),
    stepDown() { if (cur === high) { rt.dispose(); paintRT.dispose(); composer.dispose && composer.dispose(); cur = direct; P.level = 'direct'; direct.setSize(); return true; } return false; } };
  let cur = high; return P;
}

// smooth, mipmapped molten lava (replaces the 32×8 pixel-art strip)
export function lavaTexture(rx = 8, ry = 1) {
  const W = 512, H = 128, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), img = x.createImageData(W, H);
  const hot = [255, 214, 90], mid = [255, 110, 20], dark = [70, 12, 4];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const u = i / W * Math.PI * 2, v = j / H * Math.PI * 2;
    let n = Math.sin(u * 2 + Math.sin(v) * 1.8) + Math.sin(u * 5 - v + Math.cos(u * 3) * 1.2) * 0.5 + Math.sin(v * 2 + u) * 0.4 + Math.sin(u * 11 + Math.sin(u * 4 + v * 2) * 2) * 0.18;
    n = (n + 1.9) / 3.8; const t = Math.max(0, Math.min(1, n));
    const a = t < 0.5 ? dark : mid, b2 = t < 0.5 ? mid : hot, k = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5, s = k * k * (3 - 2 * k);
    const o = (j * W + i) * 4; for (let q = 0; q < 3; q++) img.data[o + q] = a[q] + (b2[q] - a[q]) * s; img.data[o + 3] = 255; }
  x.putImageData(img, 0, 0); x.filter = 'blur(3px)'; x.drawImage(c, 0, 0); x.filter = 'none';
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t;
}

// cheap "bloom" for Medium: additive soft halos on flames, slipgates and the lava (no extra render passes)
let haloTex = null;
export function haloTexture() {
  if (haloTex) return haloTex; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); haloTex = new THREE.CanvasTexture(c); return haloTex; }
export function haloMaterial(color, opacity) {
  return new THREE.SpriteMaterial({ map: haloTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
}
let stripTex = null;
export function glowStripMaterial(color, opacity) { // vertical fade for a wash of light rising off the lava channel
  if (!stripTex) { const c = document.createElement('canvas'); c.width = 4; c.height = 64; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 64, 0, 0);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 4, 64); stripTex = new THREE.CanvasTexture(c); }
  return new THREE.MeshBasicMaterial({ map: stripTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
}

// adaptive quality: frame time over ~20 ms for ~2.5 s in a row steps quality down one notch (never up automatically)
export function makeAdaptive(steps, onStep) {
  let slow = 0, last = 0, warm = 0, i = 0;
  return function tick(now, active) {
    if (!last) { last = now; return; } const dt = now - last; last = now;
    if (!active || dt > 500) { slow = 0; return; }           // paused, hidden tab or loading hitch: ignore
    if ((warm += dt) < 3000) return;                          // let textures/shaders settle first
    slow = dt > 20 ? slow + dt : Math.max(0, slow - dt * 2);
    if (slow > 2500 && i < steps.length) { slow = 0; warm = 0; const s = steps[i++]; s(); onStep && onStep(i, steps.length); }
  };
}
