// Guggenheim Bilbao-inspired interior, all procedural (no photos or museum assets): the ~50 m atrium with twisting white
// surfaces, the glass curtain wall, the titanium-and-glass "flower" skylight, glass elevators, the stair tower, curved catwalks
// and bridges on levels 2 and 3, the long column-free Gallery 104 ("Fish") with abstract weathered-steel curved walls that
// suggest Serra's The Matter of Time, and the Nervión river with La Salve bridge seen through the glass.
import * as THREE from 'three';

const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7654321);
function canvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
function speckle(x, w, h, n, a, dark = '110,105,95') { for (let i = 0; i < n; i++) { x.fillStyle = rnd() > 0.5 ? `rgba(255,255,255,${a * rnd()})` : `rgba(${dark},${a * rnd()})`; x.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); } }
function tex(c, srgb = true) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

const plasterC = () => canvas(256, 256, (x, w, h) => { x.fillStyle = '#efede8'; x.fillRect(0, 0, w, h); speckle(x, w, h, 2500, 0.05); });
const trimC = () => canvas(256, 256, (x, w, h) => { x.fillStyle = '#dcd8d0'; x.fillRect(0, 0, w, h); speckle(x, w, h, 2500, 0.07); });
// pale grey-beige limestone floor, 2×2 slabs per 2.5 m tile
const floorC = () => canvas(512, 512, (x, w, h) => { x.fillStyle = '#c4beb2'; x.fillRect(0, 0, w, h); speckle(x, w, h, 9000, 0.08);
  for (let i = 0; i < 4; i++) { x.fillStyle = `rgba(${150 + rnd() * 40},${145 + rnd() * 35},${130 + rnd() * 30},.18)`; x.fillRect((i % 2) * w / 2, (i >> 1) * h / 2, w / 2, h / 2); }
  x.fillStyle = 'rgba(95,88,78,.4)'; x.fillRect(0, 0, w, 2); x.fillRect(0, h / 2, w, 2); x.fillRect(0, 0, 2, h); x.fillRect(w / 2, 0, 2, h); });
const ceilC = () => canvas(256, 256, (x, w, h) => { x.fillStyle = '#f4f2ee'; x.fillRect(0, 0, w, h); const g = x.createLinearGradient(0, 20, 0, h - 20); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#f3f1ec'); x.fillStyle = g; x.fillRect(24, 24, w - 48, h - 48); });
// titanium cladding: overlapping thin panels with a soft sheen ("fish scales")
const titaniumC = () => canvas(256, 256, (x, w, h) => { x.fillStyle = '#b9bcc0'; x.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) { const ox = c * 64 + (r % 2) * 32, oy = r * 32, g = x.createLinearGradient(ox, oy, ox + 64, oy + 32); g.addColorStop(0, '#d6d8db'); g.addColorStop(0.5, '#a9adb2'); g.addColorStop(1, '#c8cacd'); x.fillStyle = g; x.fillRect(ox % w, oy, 62, 30); }
  speckle(x, w, h, 1500, 0.08); });
// glazing with mullions; transparent panes
const glassC = (cols = 4, rows = 4) => canvas(256, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(200,225,235,.18)'; x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(150,155,160,1)'; for (let k = 0; k <= cols; k++) x.fillRect(k * w / cols - 3, 0, 6, h); for (let k = 0; k <= rows; k++) x.fillRect(0, k * h / rows - 3, w, 6); });
// weathered steel: rust ochres and dark mill scale
const corC = () => canvas(256, 256, (x, w, h) => { x.fillStyle = '#7a3f1e'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { x.fillStyle = ['rgba(150,75,30,.35)', 'rgba(60,30,18,.35)', 'rgba(180,105,50,.25)', 'rgba(95,50,28,.4)'][i % 4]; x.beginPath(); x.ellipse(rnd() * w, rnd() * h, 4 + rnd() * 26, 2 + rnd() * 8, rnd() * 3, 0, Math.PI * 2); x.fill(); }
  for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(55,28,16,.3)'; x.fillRect(rnd() * w, 0, 1 + rnd() * 2, h); } });

export function bilbaoMaterials(LOW) {
  const T = { stone: tex(plasterC()), trim: tex(trimC()), floor: tex(floorC()), ceil: tex(ceilC()) }, cache = new Map();
  const mk = (n, rx, ry, make) => { rx = Math.max(0.5, Math.round(rx * 4) / 4); ry = Math.max(0.5, Math.round(ry * 4) / 4); const k = n + rx + '|' + ry; if (cache.has(k)) return cache.get(k); const t = T[n].clone(); t.repeat.set(rx, ry); t.needsUpdate = true; const m = make(t); cache.set(k, m); return m; };
  return { cache,
    stone: (rx, ry) => mk('stone', rx, ry, t => new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 })), // white plaster walls
    metal: (rx, ry) => mk('trim', rx, ry, t => new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 })),
    floor: (rx, ry) => mk('floor', rx, ry, t => { const m = new THREE.MeshStandardMaterial({ map: t, roughness: LOW ? 0.6 : 0.35, envMapIntensity: 0.5 }); m.userData.wet = 1; return m; }),
    ceiling: (rx, ry) => mk('ceil', Math.max(1, rx / 1.5), Math.max(1, ry / 1.5), t => new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.45, roughness: 1 })) };
}

// ribbon wall along a 2D path: [[x,z],...], height H, optional lean(t) -> [dx,dz] at the top
function ribbon(pts, y0, H, lean, mat, closed) {
  const P = closed ? [...pts, pts[0]] : pts, pos = [], uv = [], idx = []; let L = 0;
  P.forEach((p, i) => { if (i) L += Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]); const t = i / (P.length - 1), l = lean ? lean(t, p) : [0, 0];
    pos.push(p[0], y0, p[1], p[0] + l[0], y0 + H, p[1] + l[1]); uv.push(L / 3, 0, L / 3, H / 3); if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}
const curve = (pts, n) => new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], 0, p[1]))).getPoints(n).map(v => [v.x, v.z]);

export function buildBilbao(scene, o) {
  const { A, F, RH, MAT, box, LOW, pillars } = o, cx = (A.minX + A.maxX) / 2, cz = (A.minZ + A.maxZ) / 2, TOP = 46;
  const white = new THREE.MeshStandardMaterial({ map: tex(plasterC()), roughness: 0.9, side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: 0.3 });
  const ti = (() => { const t = tex(titaniumC()); t.repeat.set(10, 6); return new THREE.MeshStandardMaterial({ map: t, metalness: 0.55, roughness: 0.4, side: THREE.DoubleSide, emissive: 0x404448, emissiveIntensity: 0.35 }); })();
  const glassM = (rx, ry) => { const t = tex(glassC()); t.repeat.set(rx, ry); return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide }); };
  const out = { TOP, lifts: [] };
  // ---- atrium floor ----
  { const w = A.maxX - A.minX, d = A.maxZ - A.minZ; const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), MAT.floor(w / 2.5, d / 2.5)); fl.rotation.x = -Math.PI / 2; fl.position.set(cx, 0, cz); scene.add(fl); }
  // ---- the twisting shell: a squarish superellipse at the base that narrows, bulges and twists up to the flower ----
  const SA = 19.2, SB = 12.9, NT = LOW ? 64 : 96, NY = LOW ? 18 : 28;
  const sr = (th, a, b) => { const c = Math.abs(Math.cos(th)), s = Math.abs(Math.sin(th)); return 1 / Math.pow(Math.pow(c / a, 4) + Math.pow(s / b, 4), 0.25); };
  const P = (i, j) => { const th0 = i / NT * Math.PI * 2, t = j / NY, th = th0 + 0.55 * t * t, y = RH + (TOP - RH) * t;
    const shrink = 1 - 0.66 * Math.pow(t, 1.15), wob = 1 + (0.035 + 0.12 * t) * Math.sin(3 * th0 + 5 * t) + 0.05 * t * Math.sin(5 * th0 - 7 * t), r = sr(th0, SA, SB) * shrink * wob;
    return [cx + Math.cos(th) * r, y + 1.8 * t * Math.sin(2 * th0 + 3 * t), cz + Math.sin(th) * r]; };
  const GL0 = 0.15, GL1 = 1.55; // glass curtain on the river (north-east) side
  const shell = (i0, i1, j0, j1, mat) => { const pos = [], uv = [], idx = [], nw = i1 - i0 + 1;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { pos.push(...P(i, j)); uv.push((i - i0) / NT * 14, j / NY * 8); }
    for (let j = 0; j < j1 - j0; j++) for (let i = 0; i < nw - 1; i++) { const a = j * nw + i; idx.push(a, a + 1, a + nw, a + 1, a + nw + 1, a + nw); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); scene.add(m); return m; };
  const gi0 = Math.round(GL0 / (Math.PI * 2) * NT), gi1 = Math.round(GL1 / (Math.PI * 2) * NT), gj = Math.round(NY * 0.62);
  shell(gi1, NT + gi0, 0, NY, white); // plaster all round...
  shell(gi0, gi1, gj, NY, white);       // ...and above the curtain wall
  shell(gi0, gi1, 0, gj, glassM(8, 10)); // the big glazed curtain wall
  // titanium bands sweeping up the shell (the outside skin folding in)
  for (const k of [0.3, 0.55, 0.8]) { const j = Math.round(NY * k); const pts = []; for (let i = gi1; i <= NT + gi0; i++) pts.push(new THREE.Vector3(...P(i, j))); scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.35, 5), ti)); }
  // roof deck between the atrium rectangle and the shell foot, so nothing shows through
  { const sh = new THREE.Shape(); for (let i = 0; i <= NT; i++) { const p = P(i, 0); i ? sh.lineTo(p[0], -p[2]) : sh.moveTo(p[0], -p[2]); }
    const hole = new THREE.Path(); hole.moveTo(A.minX, -A.minZ); hole.lineTo(A.maxX, -A.minZ); hole.lineTo(A.maxX, -A.maxZ); hole.lineTo(A.minX, -A.maxZ); hole.lineTo(A.minX, -A.minZ); sh.holes.push(hole);
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), white); m.rotation.x = -Math.PI / 2; m.position.y = RH + 0.02; scene.add(m); }
  // ---- the "flower" skylight: titanium petals splaying around a glass crown ----
  { const top = P(0, NY)[1], R0 = 6.2, g = new THREE.Group(); g.position.set(cx, top - 1.5, cz); scene.add(g);
    const sky = new THREE.Mesh(new THREE.CircleGeometry(R0 + 1.5, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.25, 1.3, 1.35), side: THREE.DoubleSide })); sky.rotation.x = Math.PI / 2; sky.position.y = 7; g.add(sky);
    const pg = new THREE.SphereGeometry(1, 16, 10, 0, Math.PI, 0, Math.PI / 2);
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2 + 0.3, pet = new THREE.Mesh(pg, ti); pet.scale.set(2.6, 7.5 + (k % 3), 1.2); pet.position.set(Math.cos(a) * R0, 0, Math.sin(a) * R0); pet.rotation.set(0.35 * Math.sin(k), -a + Math.PI / 2, -0.5 - 0.15 * (k % 2)); g.add(pet); }
    const ribM = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.6, roughness: 0.4 });
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(Math.cos(a) * (R0 + 1), 0, Math.sin(a) * (R0 + 1)), new THREE.Vector3(Math.cos(a) * 3, 8, Math.sin(a) * 3), new THREE.Vector3(0, 7, 0)); g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 16, 0.12, 5), ribM)); }
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(R0 + 1.2, R0 + 1.2, 6, 24, 1, true), glassM(12, 2)); crown.position.y = 3.5; g.add(crown); }
  // ---- base walls of the atrium where no gallery wall reaches ----
  for (const s of o.baseWalls) box(s[2], RH, s[3], MAT.stone(Math.max(s[2], s[3]) / 2, RH / 2), s[0], RH / 2, s[1]);
  // ---- catwalks and bridges (levels 2 and 3) ----
  const deckM = new THREE.MeshStandardMaterial({ color: 0xf2f0ec, roughness: 0.8, side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: 0.32 }), railM = new THREE.MeshStandardMaterial({ color: 0x9ea3a8, metalness: 0.7, roughness: 0.35 });
  const balM = new THREE.MeshBasicMaterial({ color: 0xcfe3ea, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
  const walk = (pts2, y, w) => { const pts = curve(pts2, 40); const L = [], Rr = [];
    pts.forEach((p, i) => { const q = pts[Math.min(i + 1, pts.length - 1)], r = pts[Math.max(i - 1, 0)], dx = q[0] - r[0], dz = q[1] - r[1], l = Math.hypot(dx, dz) || 1; L.push([p[0] - dz / l * w / 2, p[1] + dx / l * w / 2]); Rr.push([p[0] + dz / l * w / 2, p[1] - dx / l * w / 2]); });
    const pos = [], idx = []; pts.forEach((_, i) => { pos.push(L[i][0], y, L[i][1], Rr[i][0], y, Rr[i][1]); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); scene.add(new THREE.Mesh(g, deckM));
    const fascia = ribbon(L, y - 0.45, 0.45, null, deckM); scene.add(fascia); scene.add(ribbon(Rr, y - 0.45, 0.45, null, deckM));
    for (const side of [L, Rr]) { scene.add(ribbon(side, y, 1.05, null, balM)); scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(side.map(p => new THREE.Vector3(p[0], y + 1.08, p[1]))), 40, 0.04, 4), railM)); } };
  const W0 = A.minX + 0.4, E0 = A.maxX - 0.4;
  walk([[W0, cz - 4], [cx - 6, cz - 1], [cx + 2, cz + 4.5], [E0, cz + 1]], 12, 2.2);   // level 2 bridge, curving across
  walk([[W0, cz + 5], [cx - 4, cz + 6.5], [cx + 5, cz - 3], [E0, cz - 5.5]], 20, 2.0);  // level 3 bridge, crossing the other way
  walk([[W0 + 1, A.minZ + 1.2], [cx - 5, A.minZ + 0.6], [cx + 6, A.minZ + 1.6], [E0 - 1, A.minZ + 0.9]], 12, 1.8); // level 2 balcony along the south galleries
  walk([[W0 + 1, A.maxZ - 1.0], [cx, A.maxZ - 0.4], [E0 - 1, A.maxZ - 1.2]], 20, 1.8);  // level 3 walkway along the north galleries
  // ---- glass elevators (rideable: step into a cab) ----
  const shaftM = glassM(2, 10); shaftM.opacity = 0.9;
  for (const [x, z] of o.liftSpots) {
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 22.5, 20, 1, true), shaftM); sh.position.set(x, 11.25, z); scene.add(sh);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; box(0.12, 22.5, 0.12, railM, x + Math.cos(a) * 1.15, 11.25, z + Math.sin(a) * 1.15); }
    const cab = new THREE.Group(); cab.position.set(x, 0, z); scene.add(cab);
    const fl = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.15, 20), ti); fl.position.y = -0.08; cab.add(fl);
    const roof = fl.clone(); roof.position.y = 2.5; cab.add(roof);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 2.5, 20, 1, true, 0.6, Math.PI * 2 - 1.2), new THREE.MeshBasicMaterial({ color: 0xd6eaf0, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false })); wall.position.y = 1.25; cab.add(wall);
    out.lifts.push({ x, z, cab });
  }
  // ---- the stair tower: limestone drum with a helical stair seen through its slots ----
  { const [x, z] = o.stairSpot, g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    const n = LOW ? 70 : 110, stepG = new THREE.BoxGeometry(1.5, 0.12, 0.45), im = new THREE.InstancedMesh(stepG, deckM, n), d = new THREE.Object3D();
    for (let k = 0; k < n; k++) { const a = k * 0.38; d.position.set(Math.cos(a) * 1.1, k * 0.2 + 0.2, Math.sin(a) * 1.1); d.rotation.set(0, -a, 0); d.updateMatrix(); im.setMatrixAt(k, d.matrix); } g.add(im);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, n * 0.2 + 2, 10), deckM); col.position.y = (n * 0.2 + 2) / 2; g.add(col);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, n * 0.2 + 3, 24, 1, true, 0.9, Math.PI * 2 - 1.8), white); drum.position.y = (n * 0.2 + 3) / 2; g.add(drum);
    pillars.push([x, z], [x + 0.9, z], [x - 0.9, z], [x, z + 0.9], [x, z - 0.9]); }
  // ---- Gallery 104, "the Fish": long column-free hall under the bridge ----
  { const w = F.maxX - F.minX, d = F.maxZ - F.minZ, fx = (F.minX + F.maxX) / 2, fz = (F.minZ + F.maxZ) / 2, H = 11;
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), MAT.floor(w / 2.5, d / 2.5)); fl.rotation.x = -Math.PI / 2; fl.position.set(fx, 0, fz); scene.add(fl);
    { const sw = 22.5, gx = F.minX + sw; box(sw, H, 0.3, MAT.stone(sw / 2, H / 2), F.minX + sw / 2, H / 2, F.minZ - 0.15); // south wall (paintings), then glazing past the sculptures
      const g2 = new THREE.Mesh(new THREE.PlaneGeometry(F.maxX - gx, H - 1), glassM((F.maxX - gx) / 3, 3)); g2.position.set((gx + F.maxX) / 2, (H - 1) / 2 + 1, F.minZ - 0.1); scene.add(g2);
      box(F.maxX - gx, 1, 0.3, MAT.stone(4, 0.5), (gx + F.maxX) / 2, 0.5, F.minZ - 0.15); }
    const gw = new THREE.Mesh(new THREE.PlaneGeometry(w, H - 1), glassM(w / 3, 3)); gw.position.set(fx, (H - 1) / 2 + 1, F.maxZ + 0.1); scene.add(gw); // glazed river wall
    box(w, 1, 0.3, MAT.stone(w / 2, 0.5), fx, 0.5, F.maxZ + 0.15);
    box(0.3, H, d, MAT.stone(d / 2, H / 2), F.maxX + 0.15, H / 2, fz);                        // east end (the tower)
    for (const [z0, z1] of o.fishWestWall) box(0.3, H, z1 - z0, MAT.stone((z1 - z0) / 2, H / 2), F.minX - 0.15, H / 2, (z0 + z1) / 2);
    box(0.3, H - RH, d, MAT.stone(d / 2, 2), F.minX - 0.15, RH + (H - RH) / 2, fz);
    // undulating white ceiling sweeping down the hall
    const cg = new THREE.PlaneGeometry(w, d, 60, 8); cg.rotateX(Math.PI / 2); const pa = cg.attributes.position;
    for (let k = 0; k < pa.count; k++) { const x = pa.getX(k), z = pa.getZ(k), v = 1 - Math.pow(2 * z / d, 2); pa.setY(k, H - 0.3 + v * (1.6 + 0.9 * Math.sin(x / 9))); }
    cg.computeVertexNormals(); const ce = new THREE.Mesh(cg, MAT.ceiling(w / 3, d / 3)); ce.position.set(fx, 0, fz); scene.add(ce); out.fishCeiling = ce;
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(w + 2, d + 2), ti); roof.rotation.x = -Math.PI / 2; roof.position.set(fx, H + 2.6, fz); scene.add(roof);
    // abstract weathered-steel curves (suggesting, not copying, Serra's The Matter of Time)
    const cor = (() => { const t = tex(corC()); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, metalness: 0.2, side: THREE.DoubleSide, emissive: 0x2a1408, emissiveIntensity: 0.4 }); })();
    const SH = 4.2, put = (pts, lean, closed) => { const m = ribbon(pts, 0, SH, lean, cor, closed); scene.add(m); for (let k = 0; k < pts.length; k += 2) pillars.push(pts[k]); };
    const ell = (x, z, a, b, rot, gap = 0) => { const p = []; for (let k = 0; k <= 36; k++) { const t = gap + k / 36 * (Math.PI * 2 - 2 * gap); p.push([x + Math.cos(t + rot) * a, z + Math.sin(t + rot) * b]); } return p; };
    let x0 = F.minX + 6.5;
    put(ell(x0, fz, 4.2, 2.8, 0, 0.18), (t, p) => [Math.cos(t * 6.28) * 0.7, Math.sin(t * 6.28) * 0.7]);                      // torqued ellipse
    x0 += 10; put(ell(x0, fz, 4.6, 3.2, 0.4, 0.15), (t) => [Math.cos(t * 6.28 + 1) * 0.8, Math.sin(t * 6.28 + 1) * 0.8]); put(ell(x0, fz, 2.6, 1.6, 1.4, 0.3), (t) => [-Math.cos(t * 6.28) * 0.5, -Math.sin(t * 6.28) * 0.5]); // double torqued ellipse
    x0 += 11; { const p = []; for (let k = 0; k <= 70; k++) { const t = k / 70 * Math.PI * 4.2 + 0.6, r = 1.4 + t * 0.32; p.push([x0 + Math.cos(t) * r, fz + Math.sin(t) * r * 0.85]); } put(p, (t) => [0, Math.sin(t * 9) * 0.5]); } // spiral
    x0 += 8; { const p = []; for (let k = 0; k <= 30; k++) { const t = k / 30; p.push([x0 - 1 + Math.sin(t * Math.PI * 2) * 1.6, fz - 6 + t * 12]); } put(p, (t) => [Math.sin(t * 6.28) * 0.45, 0]); } // snake (one sinuous wall, along the hall's width)
    x0 += 8; put(ell(x0, fz, 3.4, 3.4, 0, 0.25), (t) => [Math.cos(t * 12.56) * 0.6, Math.sin(t * 12.56) * 0.6]);              // torus/sphere
  }
  // ---- outside: the Nervión and La Salve bridge, seen through the glass ----
  { const water = new THREE.Mesh(new THREE.PlaneGeometry(600, 220), new THREE.MeshStandardMaterial({ color: 0x4f6a6e, roughness: 0.15, metalness: 0.2 })); water.rotation.x = -Math.PI / 2; water.position.set(40, -3, F.maxZ + 125); scene.add(water);
    const quay = new THREE.Mesh(new THREE.PlaneGeometry(600, 12), new THREE.MeshStandardMaterial({ color: 0xa8a297 })); quay.rotation.x = -Math.PI / 2; quay.position.set(40, -0.4, F.maxZ + 8); scene.add(quay);
    const hillM = new THREE.MeshStandardMaterial({ color: 0x5f7556, roughness: 1, flatShading: true });
    for (let k = 0; k < 9; k++) { const h = new THREE.Mesh(new THREE.ConeGeometry(40 + rnd() * 30, 30 + rnd() * 35, 7), hillM); h.position.set(-200 + k * 55, 10, F.maxZ + 240 + rnd() * 30); scene.add(h); }
    const bldM = new THREE.MeshStandardMaterial({ color: 0xcfc6b6, roughness: 0.9 });
    for (let k = 0; k < 18; k++) box(10 + rnd() * 10, 8 + rnd() * 18, 10, bldM, -150 + k * 22, 4, F.maxZ + 220);
    // La Salve: a long concrete deck crossing over the east end of Gallery 104, on tall piers, with the tower at the end of the Fish
    const conc = new THREE.MeshStandardMaterial({ color: 0xbdb8ae, roughness: 0.9 }), bx = F.minX + (F.maxX - F.minX) * 0.72;
    box(14, 1.6, 320, conc, bx, 17, F.minZ + 40); for (const z of [F.maxZ + 30, F.maxZ + 75, F.maxZ + 120, F.minZ - 30]) box(3.2, 20, 5, conc, bx, 7, z);
    box(14.4, 1.1, 320, new THREE.MeshStandardMaterial({ color: 0x8c8a86 }), bx, 18.2, F.minZ + 40);
    const tw = new THREE.Mesh(new THREE.CylinderGeometry(4, 5.5, 34, 8), ti); tw.position.set(F.maxX + 3, 17, (F.minZ + F.maxZ) / 2 + 3); scene.add(tw); }
  // daylight
  const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(cx + 10, 60, cz + 25); sun.target.position.set(cx, 0, cz); scene.add(sun, sun.target);
  return out;
}

// curvy ceiling for the irregular galleries: edges meet the wall tops, the middle billows up
export function waveCeiling(r, RH, mat) {
  const w = r.maxX - r.minX, d = r.maxZ - r.minZ, g = new THREE.PlaneGeometry(w, d, 24, 24); g.rotateX(Math.PI / 2); const pa = g.attributes.position;
  for (let k = 0; k < pa.count; k++) { const u = pa.getX(k) / w + 0.5, v = pa.getZ(k) / d + 0.5; pa.setY(k, RH + 2.4 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * (1 + 0.35 * Math.sin(5 * u + 3 * v))); }
  g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.position.set((r.minX + r.maxX) / 2, 0, (r.minZ + r.maxZ) / 2); return m;
}
