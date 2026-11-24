// #357: Visual's soft light-shaft gobos (public/light-shafts/) on the #296/#352 clerestory shaft cards ('domes-daylight-352').
// Swaps only that mesh's material: same geometry/UVs (v=0 at window aperture). Additive, depthWrite off, opacity 0.08-0.22 (default 0.14) per shafts.json.
// Tint: apricot-dawn below ~20deg sun, crossfade to daylight-cool above. Fades out near/below horizon, so #358 night stays dark.
// ?gobo=slits picks the slit cards (default wedge); ?shaftOp=<0.08..0.22> overrides opacity. Phone/low loads the -phone maps.
import * as THREE from 'three';
import { clockSunElev } from './horizon352.js';
const BASE = (import.meta.env.BASE_URL || '/') + 'img/play/preview-251/light-shafts/', OP = [0.08, 0.22], OP_DEF = 0.14, D2R = Math.PI / 180;
export function installShafts357({ scene, low, S }) {
  const m = scene.getObjectByName('domes-daylight-352'); if (!m) return null;
  const q = new URLSearchParams(location.search), kind = q.get('gobo') === 'slits' ? 'slits' : 'wedge';
  const op = Math.min(OP[1], Math.max(OP[0], isFinite(+q.get('shaftOp')) && q.get('shaftOp') !== null ? +q.get('shaftOp') : OP_DEF));
  const dev = (low || Math.min(innerWidth, innerHeight) < 600) ? 'phone' : 'desktop', L = new THREE.TextureLoader();
  const u = { warm: { value: null }, cool: { value: null }, op: { value: 0 }, mixC: { value: 0 } };
  const load = (k, tint) => L.load(`${BASE}shaft-${k}-${tint}-${dev}.webp`, t => { t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; mat.needsUpdate = true; });
  u.warm.value = load(kind, 'apricot-dawn'); u.cool.value = load(kind, 'daylight-cool');
  const mat = new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: true, fog: false, vertexColors: true,
    vertexShader: 'varying vec2 vU; varying vec3 vC; void main(){ vU = uv; vC = color; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D warm; uniform sampler2D cool; uniform float op; uniform float mixC; varying vec2 vU; varying vec3 vC;
      void main(){ vec2 st = vec2(vU.x, 1.0 - vU.y); vec4 a = texture2D(warm, st), b = texture2D(cool, st); vec4 g = mix(a, b, mixC);
        vec3 glass = mix(vec3(1.0), vC, 0.35); gl_FragColor = vec4(g.rgb * g.a * glass * op, 1.0); }` });
  const old = m.material; m.material = mat; old.dispose(); m.name = 'domes-gobo-357';
  const G = S.gobo357 = { kind, dev, opacity: op, update() { const e = isFinite(S.elev) ? S.elev : (isFinite(S.sunElev) ? S.sunElev : clockSunElev()), r = e * D2R;
    const f = THREE.MathUtils.smoothstep(r, 0.05, 0.35) * (1 - THREE.MathUtils.smoothstep(r, 1.0, 1.35));
    u.op.value = op * f; u.mixC.value = THREE.MathUtils.smoothstep(e, 14, 26); m.visible = u.op.value > 0.002; } };
  G.update(); return G;
}
