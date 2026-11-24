// #352 (preview): the courtyard edge. A low bronze-and-travertine fence along every outer arc of the walkable ground (W.fences, which W.walkable also
// treats as a wall, so nobody walks off into the void), and Visual's two alpha horizon plates hung as open cylinder bands: distant range just inside the
// dawn sky, mid valley at ~0.7x that radius, beyond the outer murals; the sky shows through above the ridgelines. Also (#296 dial-back) the clerestory light
// shafts: one shared dawn-sun angle, soft faded edges, lower presence, so they read as daylight, not glass panels.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const BASE = (import.meta.env.BASE_URL || '/') + 'img/play/preview-251/horizon/' /* #834 was root-absolute: 404 under tjm.art/play */, loader = new THREE.TextureLoader();
export const SUN = new THREE.Vector3(0.92, 0.14, 0.3).normalize(); // same direction as the dawnSky sun disc in courtyard296.js

export function buildFence({ W, scene, low }) {
  // #352 wire-up: Visual's wrought-iron cutout pack (public/fence/, 2 m x 1 m tile, alphaTest 0.5) on one plane per segment; solid #2B2F38 posts every 2 m.
  const segs = (W.fences || []).filter(s => !s.wood && !s.iron811 /* #811 drawn by fountainIstanbul811 */) /* #786 wood patio fence drawn by west786 */, H = 1.0, TILE = 2, n = segs.length; if (!n) return 0;
  const phone = low || Math.min(innerWidth, innerHeight) < 600, FB = (import.meta.env.BASE_URL || '/') + 'img/play/preview-251/fence/' /* #834 */, sfx = phone ? '.phone.webp' : '.webp', iron = 0x2b2f38;
  const tex = (name, srgb) => { const t = loader.load(FB + name + sfx); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = low ? 2 : 8; return t; };
  const maps = { map: tex('fence-iron_albedo', true), roughnessMap: tex('fence-iron_roughness'), normalMap: tex('fence-iron_normal') };
  const group = new THREE.Group(); group.name = 'fence352';
  const postGeo = new THREE.BoxGeometry(0.06, H, 0.06), postMat = new THREE.MeshStandardMaterial({ color: iron, roughness: 0.6, metalness: 0.6 }), pts = [];
  // #477F: bake L/TILE repeat into UVs and world transform into geometry, share ONE material, merge all panels into ONE mesh (~97 draws -> 1). Fallback: per-segment planes.
  const fenceMat = () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.6, alphaTest: 0.5, side: THREE.DoubleSide });
  const panelGeo = (s, L, a) => { const g = new THREE.PlaneGeometry(L, H), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * L / TILE);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3((s.x0 + s.x1) / 2, H / 2, (s.z0 + s.z1) / 2), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a), new THREE.Vector3(1, 1, 1))); return g; };
  const live = segs.map(s => ({ s, L: Math.hypot(s.x1 - s.x0, s.z1 - s.z0), a: Math.atan2(s.z1 - s.z0, s.x1 - s.x0) }));
  let merged = false;
  try { const geos = live.filter(o => o.L > 0.01).map(o => panelGeo(o.s, o.L, o.a)), mg = geos.length && mergeGeometries(geos); geos.forEach(g => g.dispose());
    if (mg) { const mat = fenceMat(); Object.assign(mat, maps); const pl = new THREE.Mesh(mg, mat); pl.name = 'fence352-panels'; pl.castShadow = !low; group.add(pl); merged = true; window.__f477 = { draws: 1, segs: geos.length }; }
    else throw new Error('merge returned null'); } catch (e) { console.warn('[477F fence merge]', e); window.__f477 = { err: String(e) }; }
  live.forEach(({ s, L, a }) => { const rep = Math.max(1, Math.round(L / TILE));
    if (!merged) { const mat = fenceMat(); for (const k in maps) { mat[k] = maps[k].clone(); mat[k].repeat.set(L / TILE, 1); }
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(L, H), mat); pl.position.set((s.x0 + s.x1) / 2, H / 2, (s.z0 + s.z1) / 2); pl.rotation.y = -a; pl.castShadow = !low; group.add(pl); }
    for (let i = 0; i < rep; i++) { const f = i / rep; pts.push([s.x0 + (s.x1 - s.x0) * f, s.z0 + (s.z1 - s.z0) * f]); } });
  const posts = new THREE.InstancedMesh(postGeo, postMat, pts.length), m = new THREE.Matrix4();
  pts.forEach(([x, z], i) => { m.makeTranslation(x, H / 2, z); posts.setMatrixAt(i, m); }); posts.name = 'fence352-posts'; posts.castShadow = !low; group.add(posts);
  // #352 slice: Visual's ground AO strip (2 m x 0.5 m multiply decal) under every fence run, merged into ONE mesh (one draw call), so the fence sits on the lawn.
  try { const ao = loader.load(FB + 'fence-ground-ao-strip' + sfx); ao.wrapS = THREE.RepeatWrapping; ao.wrapT = THREE.ClampToEdgeWrapping;
    const geos = []; segs.forEach(s => { const L = Math.hypot(s.x1 - s.x0, s.z1 - s.z0); if (!(L > 0.01)) return; const g = new THREE.PlaneGeometry(L, 0.5), uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * L / TILE);
      g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-Math.PI / 2, -Math.atan2(s.z1 - s.z0, s.x1 - s.x0), 0, 'YXZ'))); g.translate((s.x0 + s.x1) / 2, 0.006, (s.z0 + s.z1) / 2); geos.push(g); });
    const mg = geos.length && mergeGeometries(geos); geos.forEach(g => g.dispose());
    if (mg) { const d = new THREE.Mesh(mg, new THREE.MeshBasicMaterial({ map: ao, transparent: true, premultipliedAlpha: true, blending: THREE.MultiplyBlending, depthWrite: false, fog: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }));
      d.renderOrder = 1; d.name = 'fence352-ao'; group.add(d); } } catch (e) { console.warn('[352 ao]', e); window.__h352ao = { err: String(e) }; }
  scene.add(group); return n;
}

// #858: soft azimuth fade instead of #857's hard geometry cut. Full 360 cylinder; per-vertex alpha (shared geometry -> day + night meshes) = smoothstep on angular distance from the vista811 arc centre: 0 across the middle of the Bosphorus sector, ramping to 1 over ~14 deg past each edge. No vertical cliff.
function gapGeo857(scene, R, Hh, seg, S) {
  const TAU = Math.PI * 2, D = Math.PI / 180; let gap = null;
  scene.traverse(o => { if (gap || o.name !== 'vista811' || !o.geometry || !o.geometry.parameters) return; const p = o.geometry.parameters; o.updateWorldMatrix(true, false); const c = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
    const hit = t => { const dx = Math.sin(t), dz = Math.cos(t), b = c.x * dx + c.z * dz, s = -b + Math.sqrt(Math.max(0, b * b - (c.x * c.x + c.z * c.z - R * R))); return Math.atan2(c.x + s * dx, c.z + s * dz); };
    const a = hit(p.thetaStart), e = hit(p.thetaStart + p.thetaLength), len = ((e - a) % TAU + TAU) % TAU; if (len > 0.05 && len < TAU - 0.3) gap = { mid: a + len / 2, half: len / 2 }; });
  const g = new THREE.CylinderGeometry(R, R, Hh, seg * 2, 1, true); if (!gap) return g;
  const P = g.attributes.position, col = new Float32Array(P.count * 4), lo = Math.max(2 * D, gap.half - 10 * D), hi = gap.half + 4 * D;
  for (let i = 0; i < P.count; i++) { const az = Math.atan2(P.getX(i), P.getZ(i)); let d = Math.abs(((az - gap.mid) % TAU + TAU * 1.5) % TAU - Math.PI); const t = Math.min(1, Math.max(0, (d - lo) / (hi - lo))); col.set([1, 1, 1, t * t * (3 - 2 * t)], i * 4); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 4)); (S.gap857 = S.gap857 || []).push({ R: +R.toFixed(1), midDeg: +(gap.mid / D).toFixed(1), halfDeg: +(gap.half / D).toFixed(1), fade858: [+(lo / D).toFixed(1), +(hi / D).toFixed(1)] }); return g; }
export function buildHorizon({ scene, low, S }) {
  const phone = low || Math.min(innerWidth, innerHeight) < 600, R0 = 64; S.horizon = [];
  for (const [name, mult, order, rep] of [['horizon-distant-range', 1.0, 0, 3], ['horizon-mid-valley', 0.84, 1, 3]] /* #774: 0.84 (was 0.7) so the valley band clears the Paul annex at x 49 */) {
    const R = R0 * mult, Hh = 2 * Math.PI * R / rep / 4, mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, alphaTest: 0.004, vertexColors: true, side: THREE.BackSide, fog: false, toneMapped: false, opacity: 0 });
    const g = gapGeo857(scene, R, Hh, low ? 64 : 128, S), mesh = new THREE.Mesh(g, mat);
    mesh.position.set(0, Hh / 2 - (order ? 1.2 : 0.6), 0); mesh.renderOrder = -900 + order; mesh.frustumCulled = false; mesh.name = 'horizon352-' + name; scene.add(mesh);
    loader.load(BASE + name + (phone ? '.phone.webp' : '.webp'), t => { t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(rep, 1); t.anisotropy = low ? 2 : 8;
      mat.map = t; mat.opacity = 1; mat.needsUpdate = true; S.horizon.push(name); }, undefined, () => { S.horizonErr = (S.horizonErr || []).concat(name); });
  } }

// #296: replace the core's hard-edged shaft quads (each slanting from its own window) with soft shafts that all fall along the dawn-sun direction
export function dialShafts({ dd, scene, S }) {
  if (!dd) return 0; const P = dd.geometry.attributes.position, C = dd.geometry.attributes.color, L = new THREE.Vector3(-SUN.x, 0, -SUN.z).normalize();
  const pos = [], col = [], uv = [], idx = []; let n = 0;
  for (let i = 0; i + 5 < P.count; i += 6) { const a = new THREE.Vector3().fromBufferAttribute(P, i), b = new THREE.Vector3().fromBufferAttribute(P, i + 1), bot = new THREE.Vector3().fromBufferAttribute(P, i + 2);
    const inward = new THREE.Vector3(bot.x - b.x, 0, bot.z - b.z).normalize(); if (inward.dot(L) < 0.15) continue; // only windows the low sun actually shines through
    const drop = 2.6, run = 2.2, off = new THREE.Vector3(L.x * run, -drop, L.z * run), c = [C.getX(i), C.getY(i), C.getZ(i)], base = pos.length / 3;
    for (const v of [a, b, b.clone().add(off), a.clone().add(off)]) pos.push(v.x, v.y, v.z);
    uv.push(0, 0, 1, 0, 1, 1, 0, 1); for (let k = 0; k < 4; k++) col.push(...c); idx.push(base, base + 1, base + 2, base, base + 2, base + 3); n++; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false, vertexColors: true,
    vertexShader: 'varying vec2 vU; varying vec3 vC; void main(){ vU = uv; vC = color; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec2 vU; varying vec3 vC;
      void main(){ float across = smoothstep(0.0, 0.45, vU.x) * smoothstep(1.0, 0.55, vU.x); float along = smoothstep(0.0, 0.12, vU.y) * pow(1.0 - vU.y, 1.6);
        gl_FragColor = vec4(vC * across * across * along * 0.11, 1.0); }` }));
  m.name = 'domes-daylight-352'; m.renderOrder = 2; (dd.parent || scene).add(m); dd.visible = false; S.shafts = n; return n;
}

// #358: Visual's night companions (public/horizon/night/, same size/alpha/UV/order as the day plates; swap texture URLs only, per night.json).
// Night weight t = clamp((2 - elev) / 8): > +2° dawn, -6..+2° crossfade, < -6° full night. Night textures load lazily the first time t > 0.
// Sun elevation: ?sunElev=<deg> or S.sunElev override, else a simple local-clock curve (0° at 06:00/18:00, +50° noon, -50° midnight).
export function clockSunElev(d = new Date()) { const h = d.getHours() + d.getMinutes() / 60; return 50 * Math.sin((h - 6) / 24 * 2 * Math.PI); }
export function buildNight({ scene, low, S }) {
  const phone = low || Math.min(innerWidth, innerHeight) < 600, sfx = phone ? '.phone.webp' : '.webp', NB = BASE + 'night/', N = S.night = { t: -1, loaded: false, layers: [], sky: null };
  const q = new URLSearchParams(location.search).get('sunElev'); if (q !== null && isFinite(+q)) S.sunElev = +q;
  const skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false, depthTest: true /* #793: was false -> as a transparent it drew AFTER the walls and painted the whole upper half of every wall (above eye level) lilac at dusk/night */, fog: false, toneMapped: false, opacity: 0 });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(69, 32, 8, 0, Math.PI * 2, 0, Math.PI / 2), skyMat); // upper hemisphere; texture bottom edge = horizon
  sky.name = 'nightSky358'; sky.renderOrder = -999; sky.frustumCulled = false; sky.visible = false; scene.add(sky); N.sky = sky;
  for (const m of scene.children.filter(o => o.name && o.name.startsWith('horizon352-'))) {
    const nm = m.material.clone(); nm.opacity = 0; nm.map = null; const nmesh = new THREE.Mesh(m.geometry, nm);
    nmesh.position.copy(m.position); nmesh.renderOrder = m.renderOrder + 0.5; nmesh.frustumCulled = false; nmesh.visible = false; nmesh.name = m.name + '-night358'; scene.add(nmesh);
    N.layers.push({ day: m, night: nmesh, file: m.name.replace('horizon352-', '') + '.night' }); }
  const load = () => { N.loaded = true;
    loader.load(NB + 'sky-night' + sfx, t => { t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; skyMat.map = t; skyMat.needsUpdate = true; N.skyOk = true; }, undefined, () => { N.err = (N.err || []).concat('sky-night'); });
    for (const L of N.layers) loader.load(NB + L.file + sfx, t => { t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(3, 1); t.anisotropy = low ? 2 : 8;
      L.night.material.map = t; L.night.material.needsUpdate = true; L.ok = true; }, undefined, () => { N.err = (N.err || []).concat(L.file); }); };
  N.update = (cam) => { const elev = isFinite(S.sunElev) ? S.sunElev : clockSunElev(), t = Math.min(1, Math.max(0, (2 - elev) / 8)); S.elev = elev;
    if (t > 0 && !N.loaded) load(); if (cam) sky.position.copy(cam);
    if (Math.abs(t - N.t) < 1e-3) return; N.t = t;
    skyMat.opacity = N.skyOk ? t : 0; sky.visible = t > 0.001;
    for (const L of N.layers) { const dm = L.day.material, ready = L.ok && dm.map; L.night.material.opacity = ready ? t : 0; L.night.visible = !!ready && t > 0.001; if (dm.map) dm.opacity = ready ? 1 - t : 1; }
    if (!N.skyOk || N.layers.some(L => !L.ok)) N.t = -1; }; // re-apply once textures arrive
  return N;
}
