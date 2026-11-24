// #303 (Visual): macro-variation multiply overlays (plaster / ashlar / flagstone) + fountain water-surface. Assets on R2 at play/preview-251/hq-overlays-303/.
// macroUV = baseUV / 3.5 (world-space planar UV, base tile = 1 m), multiply at ~0.2. Phone .webp on low-end. Installed from courtyardstyle.js so tags.js is untouched.
import * as THREE from 'three';
const BASE = import.meta.env.BASE_URL + 'img/play/preview-251/hq-overlays-303/';
const MACRO = { plaster: 0.18, ashlar: 0.2, flagstone: 0.22 }, DIV = 3.5, TILE = 1.0;
// #303/#477 base maps (Visual hq-basemaps-303): world-planar 1 m tile under the macro. Mesh tints (TJ's #295 sunrise palette) are kept; the base albedo is
// divided by its own mean linear colour so it adds stone/plaster detail without darkening the palette. Normal = world-plane perturb; flagstone also gets _r.
const BBASE = import.meta.env.BASE_URL + 'img/play/preview-251/hq-basemaps-303/';
const BMAP = { plaster: { f: 'wall-plaster', mean: [0.891, 0.776, 0.665], rough: 0.9, ns: 0.5 }, ashlar: { f: 'wall-ashlar', mean: [0.717, 0.558, 0.398], rough: 0.85, ns: 0.7 }, flagstone: { f: 'floor-flagstone', mean: [0.438, 0.397, 0.359], rough: 1.0, ns: 0.6, r: true } };
const PICK = [ // mesh name -> macro kind
  [/^skin-/, 'plaster'], [/^(lintel|jamb|cornice|coreWall|entablature|nichePlinth|outerPlin|outerCornerCap)/, 'ashlar'], [/^(walkRay|sunburstFloor|marbleCore)$/, 'flagstone']];
export function installOverlays303({ root, low }) {
  const S = window.__o303 = { low: !!low, macro: {}, base: {}, mats: { plaster: 0, ashlar: 0, flagstone: 0 }, water: null, errs: [] };
  const L = new THREE.TextureLoader(); L.setCrossOrigin('anonymous');
  const ld = (f, srgb, cb) => L.load(BASE + f, t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = low ? 2 : 8; cb(t); }, undefined, () => S.errs.push(f));
  const uni = {}; for (const k in MACRO) { uni[k] = { value: null }; ld(`macro-${k}${low ? '.phone' : ''}.webp`, true, t => { uni[k].value = t; S.macro[k] = t.image.width; }); }
  const bu = {}; for (const k in BMAP) { const b = BMAP[k], p = low ? '.phone' : ''; bu[k] = { map: { value: null }, nrm: { value: null }, rgh: { value: null } };
    L.load(BBASE + b.f + p + '.webp', t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = low ? 2 : 8; bu[k].map.value = t; S.base[k] = t.image.width; }, undefined, () => S.errs.push(b.f));
    L.load(BBASE + b.f + '_n' + p + '.webp', t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = low ? 2 : 8; bu[k].nrm.value = t; }, undefined, () => S.errs.push(b.f + '_n'));
    if (b.r) L.load(BBASE + b.f + '_r' + p + '.webp', t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; bu[k].rgh.value = t; }, undefined, () => S.errs.push(b.f + '_r')); }
  const done = new WeakSet();
  const patch = (m, k) => { if (done.has(m) || !m.isMeshStandardMaterial) return; done.add(m); S.mats[k]++; const B = BMAP[k]; m.roughness = B.rough; m.metalness = 0;
    const prev = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { prev && prev.call(m, sh, r);
      sh.uniforms.macroMap = uni[k]; sh.uniforms.macroStr = { value: MACRO[k] }; sh.uniforms.bMap = bu[k].map; sh.uniforms.bNrm = bu[k].nrm; sh.uniforms.bRgh = bu[k].rgh; sh.uniforms.bOn = { get value() { return bu[k].map.value ? 1 : 0; } }; sh.uniforms.nOn = { get value() { return bu[k].nrm.value ? 1 : 0; } }; sh.uniforms.rOn = { get value() { return bu[k].rgh.value ? 1 : 0; } };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMacW; varying vec3 vMacN;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n{ vec4 mw = modelMatrix * vec4(transformed,1.0);\n#ifdef USE_INSTANCING\n mw = modelMatrix * instanceMatrix * vec4(transformed,1.0);\n#endif\n vMacW = mw.xyz; vMacN = normalize(mat3(modelMatrix) * objectNormal); }');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D macroMap; uniform float macroStr; varying vec3 vMacW; varying vec3 vMacN; uniform sampler2D bMap, bNrm, bRgh; uniform float bOn, nOn, rOn;\nvec2 b303uv() { vec3 an = abs(vMacN); return (an.y > 0.6 ? vMacW.xz : (an.x > an.z ? vMacW.zy : vMacW.xy)) / ' + TILE.toFixed(2) + '; }')
        .replace('#include <map_fragment>', `#include <map_fragment>
{ vec3 an = abs(vMacN); vec2 bu = an.y > 0.6 ? vMacW.xz : (an.x > an.z ? vMacW.zy : vMacW.xy); bu /= ${TILE.toFixed(2)};
  if (bOn > 0.5) diffuseColor.rgb *= clamp(texture2D(bMap, bu).rgb / vec3(${B.mean.map(v => v.toFixed(3)).join(',')}), 0.0, 1.6);
  vec3 mc = texture2D(macroMap, bu / ${DIV.toFixed(2)}).rgb; diffuseColor.rgb *= mix(vec3(1.0), mc, macroStr); }`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nif (rOn > 0.5) roughnessFactor *= texture2D(bRgh, b303uv()).g;')
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
if (nOn > 0.5) { vec3 tn = texture2D(bNrm, b303uv()).xyz * 2.0 - 1.0; tn.xy *= ${B.ns.toFixed(2)}; vec3 an = abs(vMacN), wn = normalize(vMacN), T, Bt;
  if (an.y > 0.6) { T = vec3(1.0, 0.0, 0.0); Bt = vec3(0.0, 0.0, 1.0); } else if (an.x > an.z) { T = vec3(0.0, 0.0, 1.0); Bt = vec3(0.0, 1.0, 0.0); } else { T = vec3(1.0, 0.0, 0.0); Bt = vec3(0.0, 1.0, 0.0); }
  vec3 pw = normalize(T * tn.x + Bt * tn.y + wn * max(tn.z, 0.2)); vec3 pv = normalize((viewMatrix * vec4(pw, 0.0)).xyz); normal = normalize(normal + (pv - normalize((viewMatrix * vec4(wn, 0.0)).xyz))); }`); };
    m.customProgramCacheKey = () => 'o303b-' + k; m.needsUpdate = true; };
  const kindOf = n => { for (const [re, k] of PICK) if (re.test(n || '')) return k; return null; };
  const sweep = () => { root.traverse(o => { const k = o.isMesh && kindOf(o.name); if (!k) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => patch(m, k)); }); };
  // fountain water-surface: MeshStandard layer just under courtyard296's glow shader (kept for the checkout glow/ripple)
  const water = () => { if (S.water) return true; const fw = root.getObjectByName('fountainWater'); if (!fw) return false;
    const p = low ? '.phone' : '', mat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 1, depthWrite: false, roughness: 1, metalness: 0, normalScale: new THREE.Vector2(0.35, 0.35) });
    const mesh = new THREE.Mesh(fw.geometry, mat); mesh.name = 'fountainWaterHQ303'; mesh.rotation.copy(fw.rotation); mesh.position.copy(fw.position); mesh.position.y -= 0.004; mesh.renderOrder = fw.renderOrder - 0.5; fw.parent.add(mesh);
    const rep = t => { t.repeat.set(1.5 / 4, 1.5 / 4); t.offset.set(0.5, 0.5); return t; }; // CircleGeometry UV spans the 4 m basin; 1.5 repeats across it
    ld(`water-surface${p}.webp`, true, t => { mat.map = rep(t); mat.needsUpdate = true; });
    ld(`water-surface_n${p}.webp`, false, t => { mat.normalMap = rep(t); mat.needsUpdate = true; });
    ld(`water-surface_r${p}.webp`, false, t => { mat.roughnessMap = rep(t); mat.needsUpdate = true; });
    const t0 = performance.now(); mesh.onBeforeRender = () => { const s = (performance.now() - t0) / 1000 * 0.01; if (mat.normalMap) mat.normalMap.offset.set(0.5 + s, 0.5 + s * 0.7); };
    S.water = { mesh: mesh.name, phone: !!low }; return true; };
  // courtyard294/296 and later modules build after us: re-sweep for ~4 s, then stop
  let n = 0; const tick = () => { sweep(); const w = water(); if (++n < 240 && !(w && n > 60)) requestAnimationFrame(tick); };
  sweep(); requestAnimationFrame(tick); return S;
}
