// #HELIX875: TJ's 2008 helix sculpture — inner 64-rung ambigram helix only (the large outer helical shell was removed at TJ's request).
// Official 3D Warehouse model (Oct 11 2008), public glTF, scale figure and outer shell removed. True size: inner helix ~0.46 m across, 3.34 m tall.
// The original 7.37 m flagstone circle was the setting for the outer shell and looked empty without it, so the podium is a 1.7 m stone dais centred under the helix.
// Lazy-loaded in or near room-08 (H8). The inner helix turns once every 30 s (2 RPM, frame-rate independent) only while the player is in or near H8; the dais and collider stay still.
// A downward-angled spotlight in H8 casts ambigram-rung shadows onto the dais and floor; the light and its shadow-map updates run only in or near H8.
// Deep link: ?room=h8 or ?room=room-08 (also #room=). Original 2008 model.
(function () {
  'use strict';
  if (window.__helix875) return;
  const ROOM = { id: 'room-08', x: -12.375, z: -7.145, r: 8.25, yaw: -Math.PI / 6 };
  const URL = '/play/assets/helix875-r875.glb';
  const S = { loaded: false, loading: false, room: ROOM.id, scaleM: { w: 1.7, h: 3.339, d: 1.7, helix: 0.46 }, errs: 0, draw: 0, colliders: 0 };
  window.__helix875 = S;

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
    load(g).catch(e => { S.errs++; S.loading = false; S.err = String(e); console.warn('[875]', e); });
  }, 400);

  async function load(game) {
    const T = game.THREE;
    const buf = await fetch(URL).then(r => { if (!r.ok) throw new Error('glb ' + r.status); return r.arrayBuffer(); });
    const scene = await parseGLB(T, buf);
    // drop the large outer helical shell (kept in the glb, not added to the room)
    const toss = []; scene.traverse(o => { if (o.name === 'helix875-outer') toss.push(o); });
    toss.forEach(o => { if (o.parent) o.parent.remove(o); });
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
    S.spin = spin; S.period = 30; S.angle0 = 0; S.spinOn = false; S.lastT = 0;
    light(game, G, inn, rg, pod);
    S.ready = true;
    setH8Fx(near(game.camera));
    if (!S.watch) { S.watch = setInterval(() => { const g = window.game; setH8Fx(!!(g && g.camera && (near(g.camera) || S.forceSpin))); }, 400); }
  }

  function light(game, G, inn, rg, pod) {
    const T = game.THREE;
    if (inn) { inn.castShadow = true; inn.receiveShadow = true; if (inn.material) inn.material.shadowSide = T.DoubleSide; }
    if (rg) { rg.castShadow = true; rg.receiveShadow = true; if (rg.material) rg.material.shadowSide = T.DoubleSide; }
    if (pod) { pod.castShadow = false; pod.receiveShadow = true; }

    // far side of H8 (opposite the courtyard door) so shadows stretch out across the entrance floor
    const nx = -Math.sqrt(3) / 2, nz = -0.5, off = 3.0, hy = 4.0;
    const lx = ROOM.x - nx * off, lz = ROOM.z - nz * off;
    const res = (game.tier === 'low' || (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches)) ? 1024 : 2048;
    const L = new T.SpotLight(0xfff6e8, 90, 12, 0.52, 0.12, 2);
    L.name = 'helix875-spot';
    L.position.set(lx, hy, lz);
    L.target.position.set(ROOM.x + nx * 0.3, 0.15, ROOM.z + nz * 0.3);
    L.castShadow = true;
    L.shadow.mapSize.set(res, res);
    L.shadow.bias = -0.0004;
    L.shadow.normalBias = 0.025;
    L.shadow.radius = res >= 2048 ? 2 : 1;
    L.shadow.camera.near = 1.6;
    L.shadow.camera.far = 7.5;
    L.shadow.autoUpdate = false;
    L.shadow.needsUpdate = true;
    game.scene.add(L); game.scene.add(L.target);
    S.light = L; S.lightRes = res;

    // ShadowMaterial disc just above the room floor so letter cutouts read clearly even under the courtyard sun
    const disc = new T.Mesh(new T.CircleGeometry(4.6, 48), new T.ShadowMaterial({ opacity: 0.5, depthWrite: false }));
    disc.name = 'helix875-shadowFloor';
    disc.rotation.x = -Math.PI / 2; disc.position.set(0, 0.01, 0);
    disc.receiveShadow = true; disc.castShadow = false;
    disc.renderOrder = 1; disc.userData.noRay = true; disc.userData.decor = true; disc.userData.noGrab = true;
    disc.material.polygonOffset = true; disc.material.polygonOffsetFactor = -1; disc.material.polygonOffsetUnits = -1;
    G.add(disc); S.shadowFloor = disc;
  }

  function bumpMats(scene) {
    if (!scene) return;
    scene.traverse(o => { const ms = o.material; if (!ms) return; (Array.isArray(ms) ? ms : [ms]).forEach(m => { m.needsUpdate = true; }); });
  }
  function setSpot(on) {
    const g = window.game, r = g && g.renderer, L = S.light;
    on = !!on;
    if (on) {
      if (r && !r.shadowMap.enabled) { S.restoredShadow = true; r.shadowMap.enabled = true; bumpMats(g.scene); }
      if (L) { L.visible = true; L.castShadow = true; L.shadow.needsUpdate = true; }
    } else {
      if (L) { L.castShadow = false; L.visible = false; }
      if (S.restoredShadow && r) { r.shadowMap.enabled = false; S.restoredShadow = false; bumpMats(g && g.scene); }
    }
    S.spotOn = on;
  }
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
        const mat = pr.material != null ? mats[pr.material] : new T.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.55, roughness: 0.4, side: T.DoubleSide });
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
      if (S.light && S.light.castShadow) S.light.shadow.needsUpdate = true;
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
