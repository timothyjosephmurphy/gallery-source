// #HELIX876 (TJ Nov 19 2026): crash/shadow fix for TJ's 2008 helix sculpture in H8 (inner 64-rung ambigram helix only, no outer shell).
// 875 flipped renderer.shadowMap.enabled on in H8 and flagged every scene material for recompile (bumpMats) - a shader-compile storm on
// phones on top of the painting textures. 876 never touches shadowMap.enabled and never recompiles scene materials: see the lighting
// notes below. Official 3D Warehouse model (Oct 11 2008), public glTF, true size (inner helix ~0.46 m across, 3.34 m tall) on a 1.7 m
// stone dais. Turns once every 30 s (2 RPM) only while you are in or near H8. Deep link: ?room=h8 (also room-08 / goto / #room=).
(function () {
  'use strict';
  if (window.__helix876) return;
  const ROOM = { id: 'room-08', x: -12.375, z: -7.145, r: 8.25, yaw: -Math.PI / 6 };
  const URL = '/play/assets/helix875-r875.glb';
  const S = { loaded: false, loading: false, room: ROOM.id, scaleM: { w: 1.7, h: 3.339, d: 1.7, helix: 0.46 }, errs: 0, draw: 0, colliders: 0 };
  window.__helix876 = window.__helix875 = S; S.daisR = 0.85; S.version = 876;
  // the real spotlight (desktop) joins the scene at boot, not on entering H8, so the lights hash is fixed before the gallery settles
  const early = setInterval(() => { const g = window.game; if (g && g.renderer && g.scene && g.THREE) { clearInterval(early); try { earlySpot(g); } catch (e) { S.errs++; S.err = String(e); } } }, 100);

  function near(cam) {
    if (!cam) return false;
    const dx = cam.position.x - ROOM.x, dz = cam.position.z - ROOM.z, d = Math.hypot(dx, dz);
    if (d < ROOM.r + 4) return true;
    const ra = window.game && game.tags && game.tags.world && game.tags.world.roomAt && game.tags.world.roomAt(cam.position.x, cam.position.z);
    return !!(ra && ra.id === ROOM.id);
  }

  const poll = setInterval(() => {
    const g = window.game; if (!g || !g.THREE || !g.scene || !g.camera) return;
    if (S.loaded || S.loading) { clearInterval(poll); return; }
    if (!near(g.camera) && !S.force) return;
    S.loading = true; clearInterval(poll);
    load(g).catch(e => { S.errs++; S.loading = false; S.err = String(e); console.warn('[876]', e); });
  }, 400);

  async function load(game) {
    const T = game.THREE;
    const buf = await fetch(URL).then(r => { if (!r.ok) throw new Error('glb ' + r.status); return r.arrayBuffer(); });
    const scene = await parseGLB(T, buf);
    // drop the large outer helical shell (kept in the glb, not added to the room)
    const toss = []; scene.traverse(o => { if (o.name === 'helix875-outer') toss.push(o); });
    toss.forEach(o => { if (o.parent) o.parent.remove(o); o.traverse(m => { if (m.geometry) m.geometry.dispose(); const ms = m.material ? [].concat(m.material) : []; ms.forEach(mm => { if (mm.map) mm.map.dispose(); mm.dispose(); }); }); });
    S.outerDisposed = toss.length;
    // centre the inner helix on the origin, then shrink the flagstone to a 1.7 m dais under it
    const box = new T.Box3(); scene.traverse(o => { if (o.isMesh && (o.name === 'helix875-inner' || o.name === 'helix875-rungs')) box.expandByObject(o); });
    const c = box.getCenter(new T.Vector3());
    scene.traverse(o => { if (!o.isMesh) return; const pos = o.geometry.attributes.position; for (let i = 0; i < pos.count; i++) { pos.setX(i, pos.getX(i) - c.x); pos.setZ(i, pos.getZ(i) - c.z); } pos.needsUpdate = true; o.geometry.computeBoundingBox(); o.geometry.computeBoundingSphere(); });
    const pod = scene.getObjectByName('helix875-podium'), POD_R = 0.85;
    if (pod) { const pos = pod.geometry.attributes.position, uv = pod.geometry.attributes.uv; let maxR = 0; for (let i = 0; i < pos.count; i++) maxR = Math.max(maxR, Math.hypot(pos.getX(i), pos.getZ(i))); const k = POD_R / (maxR || 1);
      for (let i = 0; i < pos.count; i++) { pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); }
      if (uv) { for (let i = 0; i < uv.count; i++) { uv.setX(i, 0.5 + (uv.getX(i) - 0.5) * k); uv.setY(i, 0.5 + (uv.getY(i) - 0.5) * k); } uv.needsUpdate = true; }
      pos.needsUpdate = true; pod.geometry.computeBoundingBox(); pod.geometry.computeBoundingSphere(); }
    const G = new T.Group(); G.name = 'helix875'; G.position.set(ROOM.x, 0, ROOM.z); G.rotation.y = ROOM.yaw;
    G.add(scene); scene.position.set(0, 0, 0);
    G.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = false; o.receiveShadow = true; o.frustumCulled = true;
      o.userData.noRay = true; o.userData.decor = true; o.userData.noGrab = true;
      const n = (o.material && o.material.name) || '';
      if (/Stone/i.test(n) || /podium/i.test(o.name)) { o.castShadow = false; o.renderOrder = -1; }
    });
    game.scene.add(G);
    S.root = G; S.loaded = true; S.loading = false; S.draw = 0;
    G.traverse(o => { if (o.isMesh) S.draw++; });
    collide(game, G);
    // spin group: only the inner rail and rungs; podium stays on the scene root
    const spin = new game.THREE.Group(); spin.name = 'helix875-spin';
    const inn = scene.getObjectByName('helix875-inner'), rg = scene.getObjectByName('helix875-rungs');
    scene.add(spin); if (inn) spin.add(inn); if (rg) spin.add(rg);
    S.spotOn = null; S.spin = spin; S.period = 30; S.angle0 = 0; S.spinOn = false; S.lastT = 0;
    light(game, G, inn, rg, pod);
    S.ready = true;
    setH8Fx(near(game.camera));
    if (!S.watch) { S.watch = setInterval(() => { const g = window.game; setH8Fx(!!(g && g.camera && (near(g.camera) || S.forceSpin))); }, 400); }
  }

  // ---- 876 lighting. Never touches renderer.shadowMap.enabled and never flags scene materials for recompile.
  // Shadows on (desktop / medium+): one real SpotLight lives in the scene from boot (added as soon as window.game exists, intensity 0
  // outside H8), so entering / leaving H8 never changes the lights hash -> zero shader recompiles. Its shadow map refreshes at ~15 Hz while
  // the helix turns in H8 (2 RPM = 12 deg/s, so 15 Hz is visually continuous) and not at all elsewhere.
  // Shadows off (iPhone / low tier, or main's auto-quality switches shadows off mid-session): the helix + rungs alone are drawn from the
  // light's point of view into a small mask texture at ~15 Hz and projected onto the H8 floor and the dais top, together with a soft warm
  // light-pool decal shaped by the same spot cone, so phones get the same overhead-spotlight look with no lights added.
  const LP = { nx: -Math.sqrt(3) / 2, nz: -0.5, off: 3.0, hy: 4.0, angle: 0.52, penumbra: 0.12 };
  function spotPose() { const lx = ROOM.x - LP.nx * LP.off, lz = ROOM.z - LP.nz * LP.off; return { lx, lz, tx: ROOM.x + LP.nx * 0.3, tz: ROOM.z + LP.nz * 0.3 }; }
  function earlySpot(game) {
    if (S.light || !game || !game.renderer || !game.THREE || !game.scene) return;
    const T = game.THREE, r = game.renderer;
    S.lightRes = (game.tier === 'low' || (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches)) ? 1024 : 2048;
    if (!r.shadowMap.enabled) { S.mode = 'proj'; return; } // phones / low tier: no light at all (projected mask + light pool instead)
    const P = spotPose(), res = S.lightRes;
    const L = new T.SpotLight(0xfff6e8, 0, 12, LP.angle, LP.penumbra, 2);
    L.name = 'helix876-spot'; L.position.set(P.lx, LP.hy, P.lz); L.target.position.set(P.tx, 0.15, P.tz);
    L.castShadow = true; L.shadow.mapSize.set(res, res); L.shadow.bias = -0.0004; L.shadow.normalBias = 0.025; L.shadow.radius = res >= 2048 ? 2 : 1;
    L.shadow.camera.near = 1.6; L.shadow.camera.far = 7.5; L.shadow.autoUpdate = false; L.shadow.needsUpdate = false;
    game.scene.add(L); game.scene.add(L.target); L.updateMatrixWorld(); L.target.updateMatrixWorld();
    S.light = L; S.mode = 'real'; S.spotAddedAt = Math.round(performance.now());
  }
  function light(game, G, inn, rg, pod) {
    const T = game.THREE;
    if (inn) { inn.castShadow = true; inn.receiveShadow = true; if (inn.material) inn.material.shadowSide = T.DoubleSide; }
    if (rg) { rg.castShadow = true; rg.receiveShadow = true; if (rg.material) rg.material.shadowSide = T.DoubleSide; }
    if (pod) { pod.castShadow = false; pod.receiveShadow = true; }
    earlySpot(game);
    // ShadowMaterial disc just above the room floor so letter cutouts read clearly under the courtyard sun (real-shadow mode only)
    const disc = new T.Mesh(new T.CircleGeometry(4.6, 48), new T.ShadowMaterial({ opacity: 0.5, depthWrite: false }));
    disc.name = 'helix876-shadowFloor'; disc.rotation.x = -Math.PI / 2; disc.position.set(0, 0.01, 0);
    disc.receiveShadow = true; disc.castShadow = false; disc.renderOrder = 1; disc.userData.noRay = disc.userData.decor = disc.userData.noGrab = true;
    disc.material.polygonOffset = true; disc.material.polygonOffsetFactor = -1; disc.material.polygonOffsetUnits = -1; disc.visible = false;
    G.add(disc); S.shadowFloor = disc;
    let podTop = 0.15; if (pod) { G.updateMatrixWorld(true); podTop = new T.Box3().setFromObject(pod).max.y - G.position.y; }
    S.podTop = podTop;
    projSetup(game, G, [inn, rg].filter(Boolean), podTop);
  }
  function projSetup(game, G, casters, podTop) {
    const T = game.THREE, res = 1024, P0 = spotPose();
    const rt = new T.WebGLRenderTarget(res, res, { depthBuffer: true, generateMipmaps: false });
    const cam = new T.PerspectiveCamera(2 * LP.angle * 180 / Math.PI, 1, 1.6, 9);
    cam.position.set(P0.lx, LP.hy, P0.lz); cam.lookAt(P0.tx, 0.15, P0.tz); cam.updateMatrixWorld();
    const white = new T.MeshBasicMaterial({ color: 0xffffff, side: T.DoubleSide });
    const U = { tMask: { value: rt.texture }, uVP: { value: new T.Matrix4() }, uOp: { value: 0.55 }, uPool: { value: 0.0 }, uPx: { value: 1 / res }, uPen: { value: LP.penumbra } };
    U.uVP.value.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    const VS = 'uniform mat4 uVP; varying vec4 vP; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vP = uVP*w; gl_Position = projectionMatrix*viewMatrix*w; }';
    const FS_COMMON = 'uniform sampler2D tMask; uniform float uOp; uniform float uPool; uniform float uPx; uniform float uPen; varying vec4 vP;' +
      'float msk(vec2 c){ float m = texture2D(tMask,c).r*0.4; m += (texture2D(tMask,c+vec2(uPx,0.0)).r + texture2D(tMask,c-vec2(uPx,0.0)).r + texture2D(tMask,c+vec2(0.0,uPx)).r + texture2D(tMask,c-vec2(0.0,uPx)).r)*0.15; return m; }';
    // shadow: black, alpha = mask * opacity, faded at the cone edge
    const FS_SH = FS_COMMON + 'void main(){ if(vP.w<=0.0) discard; vec3 c = vP.xyz/vP.w*0.5+0.5; if(c.x<0.0||c.x>1.0||c.y<0.0||c.y>1.0) discard; float r = length(c.xy-0.5)*2.0; float a = msk(c.xy)*smoothstep(1.0,1.0-uPen*2.5,r); if(a<0.01) discard; gl_FragColor = vec4(0.0,0.0,0.0,a*uOp); }';
    // light pool: warm additive glow inside the spot cone, darkened where the helix blocks it
    const FS_POOL = FS_COMMON + 'void main(){ if(vP.w<=0.0) discard; vec3 c = vP.xyz/vP.w*0.5+0.5; float r = length(c.xy-0.5)*2.0; if(r>1.0) discard; float g = smoothstep(1.0,0.55,r)*(0.55+0.45*(1.0-r)); float s = (c.x<0.0||c.x>1.0||c.y<0.0||c.y>1.0)?0.0:msk(c.xy); g *= 1.0-0.9*s; gl_FragColor = vec4(vec3(1.0,0.86,0.66)*g*uPool, 1.0); }';
    const mSh = new T.ShaderMaterial({ uniforms: U, vertexShader: VS, fragmentShader: FS_SH, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    const mPool = new T.ShaderMaterial({ uniforms: U, vertexShader: VS, fragmentShader: FS_POOL, transparent: true, depthWrite: false, blending: T.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    const mk = (geo, y, m, ro, name) => { const d = new T.Mesh(geo, m); d.rotation.x = -Math.PI / 2; d.position.set(0, y, 0); d.renderOrder = ro; d.visible = false; d.name = name; d.frustumCulled = false;
      d.userData.noRay = d.userData.decor = d.userData.noGrab = true; G.add(d); return d; };
    // floor disc (outside the dais) and a dais-top disc; ring geometry so the floor layer never overlaps the dais (no z-fight on either)
    const floorGeo = new T.RingGeometry(0.86, 4.6, 64, 1), daisGeo = new T.CircleGeometry(0.85, 48);
    const ds = [mk(floorGeo, 0.006, mPool, 2, 'helix876-poolFloor'), mk(floorGeo, 0.007, mSh, 3, 'helix876-maskFloor'),
      mk(daisGeo, podTop + 0.004, mPool, 2, 'helix876-poolDais'), mk(daisGeo, podTop + 0.005, mSh, 3, 'helix876-maskDais')];
    S.proj = { rt, cam, discs: ds, U, white, casters, n: 0, last: 0, on: false };
  }
  function projUpdate(now, force) {
    const P = S.proj, g = window.game; if (!P || !P.on || !g) return;
    if (!force && now - P.last < 66) return; P.last = now; P.n++;   // ~15 Hz is plenty at 2 RPM (12 deg/s)
    const r = g.renderer, spin = S.spin; if (!spin) return;
    const prevRT = r.getRenderTarget(), cc = r.getClearColor(new g.THREE.Color()), ca = r.getClearAlpha(), au = r.shadowMap.autoUpdate, mats = P.casters.map(o => o.material);
    P.casters.forEach(o => { o.material = P.white; });
    r.shadowMap.autoUpdate = false; spin.updateMatrixWorld(true);
    r.setRenderTarget(P.rt); r.setClearColor(0x000000, 1); r.clear(); r.render(spin, P.cam);
    r.setRenderTarget(prevRT); r.setClearColor(cc, ca); r.shadowMap.autoUpdate = au;
    P.casters.forEach((o, i) => { o.material = mats[i]; });
  }
  function applyMode() {
    const g = window.game, r = g && g.renderer, L = S.light, on = !!S.spotOn;
    const real = !!(r && r.shadowMap.enabled && L && L.parent);   // al() may disable shadows mid-session: fall back, never re-enable
    S.mode = real ? 'real' : 'proj';
    if (L) { L.intensity = on && real ? 90 : 0; if (on && real && L.castShadow) L.shadow.needsUpdate = true; }
    if (S.shadowFloor) S.shadowFloor.visible = on && real;
    if (S.proj) { const p = on && !real; S.proj.on = p; S.proj.discs.forEach(d => { d.visible = p; }); S.proj.U.uPool.value = p ? 0.32 : 0; if (p) projUpdate(performance.now(), true); }
  }
  function setSpot(on) { on = !!on; const g = window.game, real = !!(g && g.renderer && g.renderer.shadowMap.enabled);
    if (S.spotOn === on && S.lastReal === real) return; S.spotOn = on; S.lastReal = real; applyMode(); }
  function setH8Fx(on) { setSpin(on); setSpot(on); }

  function collide(game, G) {
    const tg = game.tags; if (!tg || !tg.addCollider) return;
    const T = game.THREE, v = new T.Vector3();
    // inner helix is ~0.46 m across, now centred on the group; light circle so you cannot walk through it
    v.set(0, 0, 0); G.localToWorld(v);
    tg.addCollider({ x: v.x, z: v.z, r: 0.55, kind: 'helix875-base' }); S.colliders++; S.base = { x: v.x, z: v.z, r: 0.55 };
  }

  // Minimal GLB 2.0 loader: triangles, POSITION/NORMAL/TEXCOORD_0, u16/u32 indices, JPEG/PNG/WebP in buffer views, metallic-roughness, node TRS/matrix. No extensions.
  async function parseGLB(T, buf) {
    const dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('not glb');
    let off = 12, json, bin;
    while (off + 8 <= buf.byteLength) {
      const len = dv.getUint32(off, true), typ = dv.getUint32(off + 4, true);
      const slice = buf.slice(off + 8, off + 8 + len);
      if (typ === 0x4E4F534A) json = JSON.parse(new TextDecoder().decode(slice));
      else if (typ === 0x004E4942) bin = slice;
      off += 8 + ((len + 3) & ~3);
    }
    const acc = json.accessors, views = json.bufferViews, nodes = json.nodes, meshes = json.meshes;
    const imgBmp = [];
    function viewBytes(i, o, n) {
      const v = views[i], a = (v.byteOffset || 0) + (o || 0);
      return new Uint8Array(bin, a, n != null ? n : v.byteLength - (o || 0));
    }
    const images = [];
    for (const im of (json.images || [])) {
      const bytes = viewBytes(im.bufferView), blob = new Blob([bytes], { type: im.mimeType || 'image/jpeg' });
      const bmp = await createImageBitmap(blob);
      const tex = new T.Texture(bmp); tex.colorSpace = T.SRGBColorSpace; tex.flipY = false; tex.needsUpdate = true; tex.wrapS = tex.wrapT = T.RepeatWrapping;
      images.push(tex);
    }
    const textures = (json.textures || []).map(t => images[t.source]);
    const mats = (json.materials || []).map(m => {
      const p = m.pbrMetallicRoughness || {};
      const mat = new T.MeshStandardMaterial({
        name: m.name || '', color: 0xffffff, metalness: p.metallicFactor != null ? p.metallicFactor : 1, roughness: p.roughnessFactor != null ? p.roughnessFactor : 1,
        side: m.doubleSided ? T.DoubleSide : T.FrontSide, transparent: m.alphaMode === 'BLEND', depthWrite: m.alphaMode !== 'BLEND'
      });
      if (p.baseColorFactor) mat.color.fromArray(p.baseColorFactor);
      if (p.baseColorTexture) { mat.map = textures[p.baseColorTexture.index]; }
      if (/Aluminum/i.test(m.name||'') || /Color_001/i.test(m.name||'')) { mat.map = null; mat.color.setRGB(0.82, 0.84, 0.87); mat.emissive.setRGB(0.08, 0.08, 0.09); }
      return mat;
    });
    const COMP = { 5120: [Int8Array, 1], 5121: [Uint8Array, 1], 5122: [Int16Array, 2], 5123: [Uint16Array, 2], 5125: [Uint32Array, 4], 5126: [Float32Array, 4] };
    const NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
    function readAcc(i) {
      const a = acc[i], v = views[a.bufferView], n = NCOMP[a.type], [C, bpe] = COMP[a.componentType];
      const stride = v.byteStride || n * bpe, start = (v.byteOffset || 0) + (a.byteOffset || 0);
      if (stride === n * bpe) return new C(bin, start, a.count * n);
      const out = new C(a.count * n);
      for (let k = 0; k < a.count; k++) out.set(new C(bin, start + k * stride, n), k * n);
      return out;
    }
    function makeMesh(mi, nameHint) {
      const grp = new T.Group();
      meshes[mi].primitives.forEach((pr, pi) => {
        const g = new T.BufferGeometry();
        const P = readAcc(pr.attributes.POSITION);
        g.setAttribute('position', new T.BufferAttribute(P, 3));
        if (pr.attributes.NORMAL != null) g.setAttribute('normal', new T.BufferAttribute(readAcc(pr.attributes.NORMAL), 3));
        else g.computeVertexNormals();
        if (pr.attributes.TEXCOORD_0 != null) g.setAttribute('uv', new T.BufferAttribute(readAcc(pr.attributes.TEXCOORD_0), 2));
        if (pr.indices != null) {
          const I = readAcc(pr.indices);
          g.setIndex(new T.BufferAttribute(I, 1));
        }
        if (!g.getAttribute('normal')) g.computeVertexNormals();
        else { /* rebake can leave bad normals on the large outer shell; recompute so it reads as metal, not black */ g.computeVertexNormals(); }
        let mat = pr.material != null ? mats[pr.material] : new T.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.55, roughness: 0.4, side: T.DoubleSide });
        if (mat.map && !g.getAttribute('uv')) { mat = mat.clone(); mat.map = null; }
        if (game.scene && game.scene.environment) { mat.envMap = game.scene.environment; mat.envMapIntensity = 1.6; }
        const mesh = new T.Mesh(g, mat);
        const mn = (mat.name || '');
        if (/Stone/i.test(mn)) mesh.name = 'helix875-podium';
        else if (/Color_001/i.test(mn)) mesh.name = 'helix875-rungs';
        else if (/Aluminum/i.test(mn)) {
          const box = new T.Box3().setFromBufferAttribute(g.getAttribute('position'));
          const sz = box.getSize(new T.Vector3());
          mesh.name = (sz.x < 1 && sz.z < 1) ? 'helix875-inner' : 'helix875-outer';
        } else mesh.name = nameHint || ('helix875-mesh-' + mi + '-' + pi);
        grp.add(mesh);
      });
      return grp.children.length === 1 ? grp.children[0] : grp;
    }
    function nodeObj(i) {
      const n = nodes[i], o = n.mesh != null ? makeMesh(n.mesh, n.name) : new T.Group();
      if (n.name && !o.name) o.name = n.name;
      if (n.matrix) { const M = new T.Matrix4(); M.fromArray(n.matrix); M.decompose(o.position, o.quaternion, o.scale); }
      else {
        if (n.translation) o.position.fromArray(n.translation);
        if (n.rotation) o.quaternion.fromArray(n.rotation);
        if (n.scale) o.scale.fromArray(n.scale);
      }
      (n.children || []).forEach(c => o.add(nodeObj(c)));
      return o;
    }
    const root = new T.Group(); root.name = 'helix875-model';
    const sc = json.scenes[json.scene || 0];
    (sc.nodes || []).forEach(i => root.add(nodeObj(i)));
    return root;
  }

  const PERIOD = 30, OMEGA = Math.PI * 2 / PERIOD;
  function frame(now) {
    if (!S.spinOn) { S.loopOn = false; S.lastT = 0; return; }
    const dt = S.lastT ? Math.min(0.05, (now - S.lastT) / 1000) : 0;
    S.lastT = now;
    if (dt && S.spin && !S.qaPause) {
      S.spin.rotation.y += OMEGA * dt;
      if (S.spotOn) {
        if (S.mode === 'real' && S.light && S.light.castShadow && now - (S.shT || 0) > 66) { S.shT = now; S.light.shadow.needsUpdate = true; S.shN = (S.shN || 0) + 1; }
        else if (S.mode === 'proj') projUpdate(now);
      }
    }
    requestAnimationFrame(frame);
  }
  function setSpin(on) {
    on = !!on;
    if (on && !S.spinOn) { S.spinOn = true; S.loopOn = true; S.lastT = 0; requestAnimationFrame(frame); }
    else if (!on) { S.spinOn = false; S.loopOn = false; }
  }

  function wantH8() {
    try {
      const q = new URLSearchParams(location.search);
      let v = (q.get('room') || q.get('goto') || '').toLowerCase().trim();
      if (!v && location.hash) {
        const h = location.hash.replace(/^#/, '');
        const qh = new URLSearchParams(h.includes('=') && !h.includes('?') ? h : h.replace(/^[?]*/, ''));
        v = (qh.get('room') || qh.get('goto') || (h.match(/^(h8|room-08|el-salvador)$/i) ? h : '')).toLowerCase().trim();
      }
      return /^(h8|room-08|el-salvador|helix)$/.test(v);
    } catch (e) { return false; }
  }
  function gotoH8() {
    const g = window.game; if (!g || !g.camera) return false;
    const nx = -Math.sqrt(3) / 2, nz = -0.5, x = ROOM.x + nx * 3.4, z = ROOM.z + nz * 3.4;
    const y = ((window.__floorH800 && window.__floorH800(x, z)) || 0) + 1.6;
    g.camera.position.set(x, y, z);
    g.camera.lookAt(ROOM.x, y, ROOM.z);
    g.camera.updateMatrixWorld();
    try { g.hideStart && g.hideStart(); } catch (e) {}
    S.force = true; S.deepLink = true;
    return true;
  }
  if (wantH8()) {
    const t = setInterval(() => { if (window.game && window.game.camera && gotoH8()) clearInterval(t); }, 200);
    setTimeout(() => clearInterval(t), 20000);
  }

  S.sit = null;
  S.loadNow = () => { S.force = true; };
  S.tick = (dt) => { if (S.spin && dt) S.spin.rotation.y += OMEGA * dt; return S.spin ? S.spin.rotation.y : 0; };
  S.setSpin = setSpin;
  Object.defineProperty(S, 'qaPause', { get() { return !!S._qaPause; }, set(b) { S._qaPause = !!b; } });
})();
