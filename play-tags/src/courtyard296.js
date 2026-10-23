// #296 (TJ, preview): the courtyard sunrise pass. Visual's mosaic pieces (sun medallion, CHECKOUT ring, leaded dome glass, room signs; /workspace/gallery-courtyard,
// resized, shipped under /courtyard/*-296.webp) plus original geometry and light: a dawn sky, coloured glass domes that tint the light, sunburst rays on the floor that
// glow toward the room the guide / wall map is taking you to, thin orange and blue trim at the doorways, and a walk-in fountain over the sun medallion that IS the
// checkout portal (replaces the #290 bubble). No text floats anywhere; everything is silent (no new sound).
import * as THREE from 'three';
const BASE = import.meta.env.BASE_URL + 'courtyard/', ORANGE = '#F7A66E', BLUE = '#5E9ADB', TAU = Math.PI * 2;
const loader = new THREE.TextureLoader();
const tex = (f, cb, low, wrap) => loader.load(BASE + f, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = low ? 2 : 8; if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping; cb(t); }, undefined, () => { (window.__c296 = window.__c296 || {}).texErr = ((window.__c296 || {}).texErr || []).concat(f); });
const radial = (stops, n = 128) => { const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'), rg = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); stops.forEach(([o, col]) => rg.addColorStop(o, col)); g.fillStyle = rg; g.fillRect(0, 0, n, n); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const ADD = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false };

// ---- the walk-in fountain portal. BUBBLE keeps its bounded trigger (r < trig walks you out to checkout) and its tap target, but is no longer a bubble.
export function buildFountainPortal({ root, low, BUBBLE }) {
  const g = new THREE.Group(); g.name = 'checkoutFountain'; root.add(g); const seg = low ? 48 : 96, RM = 2.0;
  const medMat = new THREE.MeshBasicMaterial({ color: 0xf7cc3a, transparent: true, depthWrite: false, toneMapped: false });
  const med = new THREE.Mesh(new THREE.CircleGeometry(RM, seg), medMat); med.rotation.x = -Math.PI / 2; med.position.y = 0.03; med.renderOrder = 3; med.name = 'sunMedallion'; g.add(med);
  tex('sun-medallion-296.webp', t => { medMat.map = t; medMat.color.set(0xffffff); medMat.needsUpdate = true; }, low);
  const ringMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }), RO = 3.6;
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(RO * 2, RO * 2), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.017; ring.renderOrder = 4; ring.name = 'checkoutRing'; g.add(ring);
  tex('checkout-ring-296.webp', t => { ringMat.map = t; ringMat.opacity = 1; ringMat.needsUpdate = true; }, low);
  // shallow water over the medallion: soft ripples out from the middle and a little sparkle, see-through so the sun shows
  const wu = { t: { value: 0 }, glow: { value: 0 } };
  const water = new THREE.Mesh(new THREE.CircleGeometry(RM, seg), new THREE.ShaderMaterial({ uniforms: wu, transparent: true, depthWrite: false, toneMapped: false, fog: false,
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float t; uniform float glow; varying vec2 vP;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){ float r = length(vP); float rip = 0.5 + 0.5 * sin(r * 13.0 - t * 2.2) * smoothstep(2.0, 0.3, r); vec2 q = floor(vP * 9.0 + t * 0.6); float sp = step(0.965, h(q + floor(t * 3.0))) * 0.6;
        vec3 c = mix(vec3(0.55, 0.78, 0.95), vec3(1.0, 0.88, 0.55), 0.25 + 0.5 * glow); gl_FragColor = vec4(c + sp, 0.2 + 0.1 * rip + 0.12 * glow + sp * 0.3); }` }));
  water.rotation.x = -Math.PI / 2; water.position.y = 0.075; water.renderOrder = 5; water.name = 'fountainWater'; g.add(water);
  // low travertine curb with four entrances (nothing solid: you simply walk in)
  const stone = new THREE.MeshStandardMaterial({ color: 0xe6dac4, roughness: 0.6 }), prof = [[2.06, 0], [2.06, 0.13], [2.3, 0.13], [2.3, 0.03], [2.34, 0]].map(([r, y]) => new THREE.Vector2(r, y)), gap = 0.62, arc = TAU / 4 - gap;
  for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(new THREE.LatheGeometry(prof, low ? 14 : 28, k * TAU / 4 + gap / 2, arc), stone); m.material.side = THREE.DoubleSide; m.name = 'fountainCurb'; m.receiveShadow = true; g.add(m); }
  // water jets: ten low arcs falling toward the middle and one slim central column (additive, no light cost)
  const jetM = new THREE.MeshBasicMaterial({ color: 0xcfeaff, opacity: 0.5, ...ADD }), jets = [];
  for (let k = 0; k < 10; k++) { const a = k / 10 * TAU + 0.15, c = Math.cos(a), s = Math.sin(a), curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(c * 1.6, 0.08, s * 1.6), new THREE.Vector3(c * 1.05, 1.25, s * 1.05), new THREE.Vector3(c * 0.5, 0.08, s * 0.5));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, low ? 10 : 18, 0.022, 5, false), jetM); m.name = 'fountainJet'; g.add(m); jets.push(m); }
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.07, 1.7, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xe6f6ff, opacity: 0.4, ...ADD })); col.position.y = 0.9; col.name = 'fountainColumn'; g.add(col);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(RM * 1.1, 32), new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(255,214,120,0.95)'], [0.55, 'rgba(255,170,90,0.35)'], [1, 'rgba(255,150,70,0)']]), opacity: 0.3, ...ADD })); halo.rotation.x = -Math.PI / 2; halo.position.y = 0.09; halo.renderOrder = 6; halo.name = 'fountainSun'; g.add(halo);
  // #323 (TJ: "I don't see the portals for checkout"): a tall sun beam over the fountain, readable from the entrance, every ray path and the doorways, plus a pulsing gold glow on the floor under the ring
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 1.1, 11, low ? 14 : 28, 1, true), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, side: THREE.DoubleSide, uniforms: { t: { value: 0 }, k: { value: 1 } },
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float t; uniform float k; varying vec2 vU; void main(){ float h = vU.y; float f = (1.0 - h) * smoothstep(0.0, 0.06, h); float s = 0.8 + 0.2 * sin(vU.x * 31.4 + t * 1.3 + h * 6.0); gl_FragColor = vec4(vec3(1.0, 0.8, 0.45) * f * s * 0.3 * k, 1.0); }' }));
  beam.position.y = 5.5; beam.renderOrder = 8; beam.name = 'fountainBeam'; beam.frustumCulled = false; g.add(beam);
  const pad = new THREE.Mesh(new THREE.CircleGeometry(RO * 1.3, 48), new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(255,200,110,0)'], [0.55, 'rgba(255,190,100,0.0)'], [0.76, 'rgba(255,200,110,0.55)'], [1, 'rgba(255,170,90,0)']]), opacity: 0.4, ...ADD })); pad.rotation.x = -Math.PI / 2; pad.position.y = 0.05; pad.renderOrder = 6; pad.name = 'portalGlow'; g.add(pad);
  BUBBLE.mesh = water; BUBBLE.uni = wu; BUBBLE.label = new THREE.Object3D(); BUBBLE.circle = { material: { opacity: 0 } }; BUBBLE.light = null; // nothing floats, nothing is spoken
  const S = { group: g, update(t, cam) { wu.t.value = t; const d = cam ? Math.hypot(cam.x, cam.z) : 99, near = Math.max(0, Math.min(1, (4.2 - d) / 2.4)); wu.glow.value += (near - wu.glow.value) * 0.1; halo.material.opacity = 0.28 + 0.1 * Math.sin(t * 1.6) + 0.3 * wu.glow.value;
    jetM.opacity = 0.42 + 0.12 * Math.sin(t * 3.1) + 0.2 * wu.glow.value; beam.material.uniforms.t.value = t; pad.material.opacity = 0.34 + 0.16 * Math.sin(t * 1.9); col.scale.y = 0.85 + 0.15 * Math.sin(t * 2.3); col.position.y = 0.05 + 0.85 * col.scale.y; } };
  window.__fountain = { r: RM, ring: RO, trig: BUBBLE.trig };
  return S;
}

// ---- the rest of the sunrise (needs the scene, the domes and the room list)
export function installCourtyard296({ game, W, root, low, T }) {
  const scene = root.parent || game.scene, S = window.__c296 = Object.assign(window.__c296 || {}, { sky: false, glassRooms: 0, pools: 0, rays: 0, trims: 0, signs: 0, target: null });
  const rooms = W.rooms.filter(r => r.kind === 'room'), tint = i => (i % 2 ? BLUE : ORANGE);
  // 1. dawn sky: horizon apricot, rose, lavender haze, horizon blue, pale zenith, a low gilded sun to the east (palette: Apricot Glow, Rose Quartz, Horizon Blue, Gilded Ochre)
  { const sky = new THREE.Mesh(new THREE.SphereGeometry(70, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, toneMapped: false,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `varying vec3 vD;
        vec3 ramp(float y){ vec3 a = vec3(0.973,0.847,0.741), b = vec3(0.969,0.651,0.431), c = vec3(0.914,0.663,0.651), d = vec3(0.725,0.698,0.839), e = vec3(0.616,0.718,0.812), f = vec3(0.78,0.85,0.93);
          if (y < 0.0) return a; if (y < 0.06) return mix(a, b, y / 0.06); if (y < 0.2) return mix(b, c, (y - 0.06) / 0.14); if (y < 0.4) return mix(c, d, (y - 0.2) / 0.2); if (y < 0.65) return mix(d, e, (y - 0.4) / 0.25); return mix(e, f, clamp((y - 0.65) / 0.35, 0.0, 1.0)); }
        void main(){ vec3 n = normalize(vD); vec3 sd = normalize(vec3(0.92, 0.14, 0.3)); float s = max(dot(n, sd), 0.0); vec3 c = ramp(n.y);
          c += vec3(1.0, 0.8, 0.45) * (pow(s, 6.0) * 0.28 + pow(s, 60.0) * 0.55) + vec3(1.0, 0.95, 0.7) * smoothstep(0.9985, 0.9995, s); gl_FragColor = vec4(c, 1.0); }` }));
    sky.name = 'dawnSky'; sky.renderOrder = -1000; sky.frustumCulled = false; scene.add(sky); S.sky = true; S.skyMesh = sky; }
  // 2. coloured glass domes: leaded orange / blue glass cap over each stone dome, the clerestory panes and their light shafts take the same tint, and the light lands on the floor
  const dg = scene.getObjectByName('domes-glass'), dd = scene.getObjectByName('domes-daylight'), roomOf = (x, z) => { let b = -1, bd = 1e9; rooms.forEach((r, i) => { const d = Math.hypot(x - r.center[0], z - r.center[1]); if (d < bd) { bd = d; b = i; } }); return b; };
  const recolor = (mesh, cols) => { if (!mesh || !mesh.geometry.attributes.color) return; const P = mesh.geometry.attributes.position, C = mesh.geometry.attributes.color; for (let i = 0; i < P.count; i++) { const k = roomOf(P.getX(i), P.getZ(i)); if (k < 0) continue; const c = cols[k % 2]; C.setXYZ(i, c[0], c[1], c[2]); } C.needsUpdate = true; };
  recolor(dg, [[1.0, 0.76, 0.52], [0.58, 0.76, 1.0]]); if (dd) { recolor(dd, [[1.0, 0.55, 0.22], [0.3, 0.56, 1.0]]); dd.material.opacity = 0.2; }
  const capMats = [0, 1].map(i => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  const glassTex = [null, null], poolMats = [0, 1].map(() => null);
  const fade = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32); rg.addColorStop(0, '#fff'); rg.addColorStop(0.6, '#bbb'); rg.addColorStop(1, '#000'); g.fillStyle = rg; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const mkPool = i => new THREE.MeshBasicMaterial({ color: new THREE.Color(tint(i)), alphaMap: fade, opacity: 0.26, ...ADD });
  const pools = [mkPool(0), mkPool(1)];
  ['orange', 'blue'].forEach((n, i) => tex(`dome-glass-${n}-296.webp`, t => { t.repeat.set(6, 3); glassTex[i] = t; capMats[i].map = t; capMats[i].opacity = 0.55; capMats[i].needsUpdate = true; const pm = new THREE.MeshBasicMaterial({ map: t.clone(), alphaMap: fade, opacity: 0.5, ...ADD }); pm.map.repeat.set(3, 3); pm.map.needsUpdate = true; poolMats[i] = pm;
    for (const o of S.floorPatterns || []) if (o.k === i) { o.mesh.material = pm; } }, low, true));
  S.floorPatterns = [];
  rooms.forEach((r, i) => { const k = i % 2, H = r.wallH || 4.2, rd = r.apothem * 0.74, top = H + 1.7, cx = r.center[0], cz = r.center[1];
    const cap = new THREE.Mesh(new THREE.SphereGeometry(rd + 0.17, low ? 24 : 48, low ? 8 : 14, 0, TAU, 0.16, Math.PI / 2 - 0.16), capMats[k]); cap.scale.y = 0.82; cap.position.set(cx, top, cz); cap.name = 'glassDome'; cap.renderOrder = 3; scene.add(cap); S.glassRooms++;
    const pool = new THREE.Mesh(new THREE.CircleGeometry(r.apothem * 0.92, 40), pools[k]); pool.rotation.x = -Math.PI / 2; pool.position.set(cx, 0.034, cz); pool.renderOrder = 3; pool.name = 'domeLight'; scene.add(pool); S.pools++;
    const pat = new THREE.Mesh(new THREE.CircleGeometry(r.apothem * 0.7, 40), poolMats[k] || new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); pat.rotation.x = -Math.PI / 2; pat.position.set(cx + 0.35, 0.038, cz - 0.25); pat.renderOrder = 4; pat.name = 'domeLeadLight'; scene.add(pat); S.floorPatterns.push({ k, mesh: pat }); });
  // dawn light through the glass also lands outside, in front of each courtyard door
  for (const d of W.doors.filter(d => d.kind === 'inner')) { const r = W.rooms.find(q => q.id === d.room); if (!r) continue; const i = rooms.indexOf(r); let ox = d.x - r.center[0], oz = d.z - r.center[1]; const q = Math.hypot(ox, oz) || 1; ox /= q; oz /= q;
    const m = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), pools[i % 2]); m.rotation.x = -Math.PI / 2; m.position.set(d.x + ox * 2.8, 0.02, d.z + oz * 2.8); m.renderOrder = 3; m.name = 'doorLightPool'; scene.add(m); S.pools++; }
  // 3. sunburst rays: a soft sunrise glow that runs along the floor ray toward the room the guide, the ride or the wall map is heading for
  const rayU = { t: { value: 0 } }, rays = new Map();
  for (const r of W.rays) { const dx = r.x1 - r.x0, dz = r.z1 - r.z0, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, tx = -uz, tz = ux, s0 = 3.7, s1 = L - 0.25, w = 1.9; if (s1 - s0 < 0.5) continue;
    const A = [r.x0 + ux * s0, r.z0 + uz * s0], B = [r.x0 + ux * s1, r.z0 + uz * s1], g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([A[0] - tx * w / 2, 0.019, A[1] - tz * w / 2, A[0] + tx * w / 2, 0.019, A[1] + tz * w / 2, B[0] - tx * w / 2, 0.019, B[1] - tz * w / 2, B[0] + tx * w / 2, 0.019, B[1] + tz * w / 2], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 1, 1], 2)); g.setIndex([0, 2, 1, 1, 2, 3]);
    const u = { t: rayU.t, k: { value: 0 }, len: { value: s1 - s0 } };
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float t; uniform float k; uniform float len; varying vec2 vU;
        void main(){ float across = 1.0 - abs(vU.x * 2.0 - 1.0); float soft = smoothstep(0.0, 1.0, across); soft *= soft; float pulse = 0.55 + 0.45 * sin(vU.y * len * 1.6 - t * 3.2); float ends = smoothstep(0.0, 0.08, vU.y) * smoothstep(1.0, 0.82, vU.y);
          vec3 c = mix(vec3(1.0, 0.62, 0.3), vec3(1.0, 0.86, 0.5), across); gl_FragColor = vec4(c * soft * ends * (0.5 + 0.7 * pulse), 1.0) * k * 0.85; }` }));
    m.renderOrder = 7; m.name = 'rayGlow'; m.visible = false; scene.add(m); rays.set(r.room, { m, u }); S.rays++; }
  S.point = (id, secs = 6) => { S.manual = id; S.manualUntil = performance.now() + secs * 1000; }; window.__rayGlow = S;
  // 4. thin orange / blue trim round every doorway, on the gallery side (both sides where a door joins two galleries); the walls themselves stay neutral
  { const tm = [new THREE.MeshBasicMaterial({ color: new THREE.Color(ORANGE), toneMapped: false, side: THREE.DoubleSide }), new THREE.MeshBasicMaterial({ color: new THREE.Color(BLUE), toneMapped: false, side: THREE.DoubleSide })], seg = low ? 20 : 40;
    for (const d of W.doors.filter(d => d.kind === 'inner' || d.kind === 'outer' || d.kind === 'room')) { const sp = d.spring ?? 2.4, w2 = d.width / 2, g = new THREE.Group(); g.position.set(d.x, 0, d.z); g.rotation.y = -Math.atan2(d.nx, -d.nz); g.name = 'doorTrim'; // local +z = into the owning room
      for (const sd of d.kind === 'room' ? [1, -1] : [1]) for (const [ri, ro, mi] of [[w2 + 0.045, w2 + 0.085, 0], [w2 + 0.115, w2 + 0.155, 1]]) { const ring = new THREE.Mesh(new THREE.RingGeometry(ri, ro, seg, 1, 0, Math.PI), tm[mi]); ring.position.set(0, sp, sd * 0.078); g.add(ring);
        for (const s2 of [-1, 1]) { const bar = new THREE.Mesh(new THREE.PlaneGeometry(ro - ri, sp), tm[mi]); bar.position.set(s2 * (ri + ro) / 2, sp / 2, sd * 0.078); g.add(bar); } }
      scene.add(g); S.trims++; } }
  // 5. mosaic room signs set in the floor at the end of each room's ray (Visual's signs, tile lettering, no floating text)
  { const files = { 'room-01': 'landscapes', 'room-02': 'brekkie-bitcoin-b', 'room-03': 'mexico', 'room-04': 'festival', 'room-05': 'family', 'room-06': 'catherine-dance-series', 'room-07': 'bitcoiners', 'room-08': 'el-salvador', 'room-09': 'sunset', 'room-10': 'bitcoiners', 'room-11': 'portrait', 'room-12': 'seattle' };
    const order = W.rays.map(r => ({ r, a: Math.atan2(r.z1, r.x1) })).sort((p, q) => p.a - q.a), tiers = [6.4, 8.6, 10.8];
    order.forEach(({ r, a }, i) => { const f = files[r.room]; if (!f) return; const n = r.room.slice(-2), rad = Math.min(tiers[i % 3], Math.hypot(r.x1, r.z1) - 2.4), Wd = 0.416 * rad, Hd = Wd * 262 / 1024;
      const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(Wd, Hd), mat), ux = Math.cos(a), uz = Math.sin(a); m.position.set(ux * rad, 0.021, uz * rad);
      // lies flat; letter tops (local +y) point outward along the ray, so the name reads from the centre looking out
      m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(-uz, 0, ux), new THREE.Vector3(ux, 0, uz), new THREE.Vector3(0, 1, 0))); m.renderOrder = 5; m.name = 'roomSign-' + r.room; scene.add(m); S.signs++;
      tex(`sign-room-${n}-${f}-296.webp`, t => { mat.map = t; mat.opacity = 1; mat.needsUpdate = true; }, low); }); }
  S.update = (dt, cam) => { const now = performance.now(); rayU.t.value = now / 1000;
    const wm = window.__wallMap, rd = window.__ride; let id = (wm && wm.active && wm.active.id) || (rd && rd.state && rd.state.ride && rd.state.room) || (S.manual && now < S.manualUntil ? S.manual : null) || null; S.target = id;
    for (const [rid, o] of rays) { const want = rid === id ? 1 : 0, k = o.u.k.value + (want - o.u.k.value) * Math.min(1, dt * 4); o.u.k.value = k; o.m.visible = k > 0.01; }
    if (S.skyMesh && cam) S.skyMesh.position.copy(cam); };
  return S;
}
