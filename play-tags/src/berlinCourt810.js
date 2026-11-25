// #810 (TJ Oct 28 2026; refs notes/berlin-es-court-refs-2026-10-28/01..07): Bitcoin Courtyard remodelled after the real
// Berlin, El Salvador court: weathered concrete court with yellow lines, white hoop + chain-ish net, one-storey white building with a
// corrugated roof, yellow lattice gate, barred windows, pipe + meter box, a row of big white concrete blocks with the orange
// "Berlin / El Salvador" sign resting on them (rectified photo, plane flush with the wall -> fixes the #790 skew), soccer goal + ball,
// tile sidewalk + curb, and a tree-covered mountain rising behind. Original procedural geometry; canvas textures. Decor only (no colliders).
// Data: openCourts[].walls[].court810 = { hoopU, goalU, gateU, ... } (local u = metres along the wall from its centre, v = into the court).
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
const CT854 = 'https://img.tjm.art/play/preview-251/court-trees/';
const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(810);
function cv(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function grime(x, w, h, n, col, a) { for (let i = 0; i < n; i++) { x.globalAlpha = a * rnd(); x.fillStyle = col; const px = rnd() * w, py = rnd() * h, r = 2 + rnd() * 18; x.beginPath(); x.ellipse(px, py, r, r * (0.4 + rnd()), rnd() * 3, 0, 7); x.fill(); } x.globalAlpha = 1; }
export function installBerlinCourt810(root, W, T, low) {
  const out = { courts: 0, parts: [] }, box = new THREE.BoxGeometry(1, 1, 1);
  const M = (o) => new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...o });
  for (const oc of T.openCourts || []) for (const cw of oc.walls || []) { const C = cw.court810; if (!C) continue;
    const w = W.walls.find(q => q.id === cw.id); if (!w) continue;
    const L = Math.hypot(w.x1 - w.x0, w.z1 - w.z0), cx = (w.x0 + w.x1) / 2, cz = (w.z0 + w.z1) / 2, tx = (w.x1 - w.x0) / L, tz = (w.z1 - w.z0) / L;
    const g = new THREE.Group(); g.name = 'berlinCourt810-' + oc.id; g.position.set(cx, 0, cz); g.rotation.y = Math.atan2(w.nx, w.nz); root.add(g);
    // local x must run along +t (wall x0 -> x1); with rotation atan2(nx,nz) local +x = (nz,-nx)
    const sx = Math.sign(tx * w.nz + tz * -w.nx) || 1; g.scale.x = sx; // mirror-safe (keeps u = +t)
    const add = (geo, mat, x, y, z, a = 1, b = 1, c = 1, p) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(a, b, c); (p || g).add(m); return m; };
    const loc = ([px, pz]) => { const dx = px - cx, dz = pz - cz; return [dx * tx + dz * tz, dx * w.nx + dz * w.nz]; };
    const HB = C.buildingH || 4.25, F = 0.09; // facade front just proud of the 0.16 m wall slab
    // ---- 1. concrete court floor (the court polygon) with yellow painted lines
    { const P = oc.poly.map(loc), xs = P.map(p => p[0]), vs = P.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), v0 = Math.min(...vs), v1 = Math.max(...vs), S = 64; // px per m
      const tex = cv(Math.min(1024, Math.ceil((x1 - x0) * S)), Math.min(512, Math.ceil((v1 - v0) * S)), (x, cw2, ch) => { const kx = cw2 / (x1 - x0), kv = ch / (v1 - v0), U = u => (u - x0) * kx, V = v => (v - v0) * kv;
        x.fillStyle = '#86888a'; x.fillRect(0, 0, cw2, ch); grime(x, cw2, ch, 900, '#5d5f60', 0.18); grime(x, cw2, ch, 500, '#a7a8a6', 0.15);
        x.strokeStyle = 'rgba(60,60,60,0.35)'; x.lineWidth = 1; for (let i = 0; i < 26; i++) { x.beginPath(); let px = rnd() * cw2, py = rnd() * ch; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (rnd() - 0.5) * 40; py += (rnd() - 0.5) * 40; x.lineTo(px, py); } x.stroke(); } // cracks
        x.strokeStyle = 'rgba(70,70,70,0.4)'; for (let u = Math.ceil(x0 / 3) * 3; u < x1; u += 3) { x.beginPath(); x.moveTo(U(u), 0); x.lineTo(U(u), ch); x.stroke(); } // slab joints
        x.strokeStyle = '#d9a92a'; x.lineWidth = 0.07 * kx; const ln = (a, b, c, d) => { x.beginPath(); x.moveTo(U(a), V(b)); x.lineTo(U(c), V(d)); x.stroke(); };
        const sv = C.sideline ?? 1.15; ln(x0, sv, x1, sv); // baseline along the sidewalk (photo 05)
        ln(0, sv, 0, v1); x.beginPath(); x.arc(U(0), V(sv + 3.4), 1.8 * kx, 0, 7); x.stroke(); x.beginPath(); x.arc(U(0), V(sv + 3.4), 0.3 * kx, 0, 7); x.stroke(); // centre line + circle (photo 01)
        const hu = C.hoopU ?? -4.6; x.strokeRect(U(hu - 1.8), V(sv), 3.6 * kx, 3.6 * kv); x.beginPath(); x.arc(U(hu), V(sv + 3.6), 1.8 * kx, 0, Math.PI); x.stroke(); // key under the hoop
        x.beginPath(); x.arc(U(hu), V(sv + 0.9), 4.2 * kx, 0.05, Math.PI - 0.05); x.stroke(); });
      const sh = new THREE.Shape(P.map(([u, v]) => new THREE.Vector2(u, -v))), geo = new THREE.ShapeGeometry(sh), uv = geo.attributes.uv, pos = geo.attributes.position;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - x0) / (x1 - x0), 1 - (-pos.getY(i) - v0) / (v1 - v0));
      const fl = new THREE.Mesh(geo, M({ map: tex, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2 })); fl.rotation.x = -Math.PI / 2; fl.position.y = 0.012; fl.receiveShadow = true; fl.name = 'court810-floor'; g.add(fl); out.parts.push('floor'); }
    // ---- 2. white one-storey building (front face covers the wall slab), weathered paint, pilasters
    const facTex = cv(2048, 512, (x, cw2, ch) => { x.fillStyle = '#ecebe6'; x.fillRect(0, 0, cw2, ch); grime(x, cw2, ch, 700, '#c9c6bd', 0.25);
      for (let i = 0; i < 90; i++) { const px = rnd() * cw2, len = 30 + rnd() * 160, gr = x.createLinearGradient(0, 30, 0, 30 + len); gr.addColorStop(0, 'rgba(120,115,100,0.28)'); gr.addColorStop(1, 'rgba(120,115,100,0)'); x.fillStyle = gr; x.fillRect(px, 30, 2 + rnd() * 5, len); } // rain streaks under the eave
      const gb = x.createLinearGradient(0, ch * 0.82, 0, ch); gb.addColorStop(0, 'rgba(140,128,105,0)'); gb.addColorStop(1, 'rgba(140,128,105,0.55)'); x.fillStyle = gb; x.fillRect(0, ch * 0.82, cw2, ch * 0.18); });
    const white = M({ map: facTex }), plain = M({ color: 0xe6e4dd }), back = -(C.depth || 6.5);
    add(box, white, 0, HB / 2, (F + back) / 2, L + 0.2, HB, F - back).name = 'court810-building';
    for (let k = -3; k <= 3; k++) if (k) add(box, plain, k * L / 7, HB / 2, F + 0.06, 0.32, HB, 0.12); // pilasters (photos 01/05)
    // corrugated metal roof, low pitch, overhanging the facade, dark rusty iron
    { const roofTex = cv(512, 64, (x, cw2, ch) => { for (let i = 0; i < cw2; i++) { const s = 0.5 + 0.5 * Math.sin(i / cw2 * Math.PI * 2 * 64); x.fillStyle = `rgb(${70 + s * 40 | 0},${70 + s * 36 | 0},${68 + s * 30 | 0})`; x.fillRect(i, 0, 1, ch); } grime(x, cw2, ch, 120, '#7a4a2a', 0.35); });
      const rm = M({ map: roofTex, roughness: 0.6, metalness: 0.4, side: THREE.DoubleSide }), D = F - back + 0.8, pitch = 0.11;
      const r = add(new THREE.PlaneGeometry(L + 0.6, D), rm, 0, HB + 0.1 + Math.sin(pitch) * D / 2, (F + 0.8 + back) / 2); r.rotation.x = -Math.PI / 2 - pitch; r.name = 'court810-roof';
      add(box, M({ color: 0x3e3d3a, roughness: 0.6, metalness: 0.4 }), 0, HB + 0.08, F + 0.8, L + 0.6, 0.14, 0.05); // fascia
      for (let k = 0; k < 14; k++) add(box, M({ color: 0x4a4744 }), -L / 2 + 0.6 + k * (L - 1.2) / 13, HB - 0.05, F + 0.4, 0.08, 0.12, 0.8); } // rafter tails
    // yellow lattice gate (photos 01/05), barred window, small cross window, meter box + pipe
    const gu = C.gateU ?? -6.9;
    { const gt = cv(256, 384, (x, a, b) => { x.fillStyle = '#b9a24f'; x.fillRect(0, 0, a, b); x.strokeStyle = '#7d6a2c'; x.lineWidth = 3; for (let i = -b; i < a + b; i += 22) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + b, b); x.stroke(); x.beginPath(); x.moveTo(i, 0); x.lineTo(i - b, b); x.stroke(); } x.lineWidth = 10; x.strokeStyle = '#6a5a26'; x.strokeRect(5, 5, a - 10, b - 10); x.fillStyle = '#4b3e1a'; x.fillRect(a * 0.55, b * 0.5, 10, 26); });
      add(new THREE.PlaneGeometry(1.5, 2.3), M({ map: gt, roughness: 0.7, metalness: 0.3 }), gu, 1.15, F + 0.012).name = 'court810-gate'; add(box, M({ color: 0x2d2a26 }), gu, 2.33, F + 0.03, 1.6, 0.06, 0.06); }
    const barred = (u, y, ww, hh) => { const t = cv(256, Math.round(256 * hh / ww), (x, a, b) => { x.fillStyle = '#16181a'; x.fillRect(0, 0, a, b); x.strokeStyle = '#d8d8d4'; x.lineWidth = 4; for (let i = 0; i <= 6; i++) { x.beginPath(); x.moveTo(i * a / 6, 0); x.lineTo(i * a / 6, b); x.stroke(); } x.beginPath(); x.moveTo(0, b / 2); x.lineTo(a, b / 2); x.stroke(); x.lineWidth = 3; for (let i = 0; i < 6; i += 2) { x.beginPath(); x.moveTo(i * a / 6, 0); x.lineTo((i + 2) * a / 6, b); x.stroke(); x.beginPath(); x.moveTo((i + 2) * a / 6, 0); x.lineTo(i * a / 6, b); x.stroke(); } x.strokeStyle = '#efefea'; x.lineWidth = 8; x.strokeRect(0, 0, a, b); });
      add(new THREE.PlaneGeometry(ww, hh), new THREE.MeshBasicMaterial({ map: t }), u, y, F + 0.012); add(box, plain, u, y - hh / 2 - 0.04, F + 0.05, ww + 0.12, 0.06, 0.1); };
    barred(C.windowU ?? -2.6, 2.45, 2.1, 0.75);
    { const t = cv(64, 64, (x, a) => { x.fillStyle = '#3a4146'; x.fillRect(0, 0, a, a); x.strokeStyle = '#e8e8e4'; x.lineWidth = 5; x.strokeRect(3, 3, a - 6, a - 6); x.beginPath(); x.moveTo(a / 2, 0); x.lineTo(a / 2, a); x.moveTo(0, a / 2); x.lineTo(a, a / 2); x.stroke(); x.beginPath(); x.arc(a / 2, a / 2, a * 0.22, 0, 7); x.stroke(); });
      add(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: t }), C.smallWinU ?? 0.4, 2.75, F + 0.012); }
    { const pu = C.pipeU ?? 3.9, pm = M({ color: 0x9b9b96, roughness: 0.5, metalness: 0.5 }), pg = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
      add(pg, pm, pu, 2.1, F + 0.08, 1, 3.4, 1); const top = add(pg, pm, pu + 1.2, 3.8, F + 0.08, 1, 2.4, 1); top.rotation.z = Math.PI / 2;
      add(box, M({ color: 0x3b3e40, roughness: 0.6, metalness: 0.3 }), pu - 0.45, 2.3, F + 0.1, 0.45, 0.5, 0.18); add(box, M({ color: 0x9fa3a5, metalness: 0.4 }), pu - 0.45, 2.3, F + 0.195, 0.36, 0.4, 0.01); }
    // ---- 3. tile sidewalk + white painted curb (photos 02/03)
    { const sw = C.sidewalk ?? 1.05, su = C.sidewalkHalf ?? 7.4, st = cv(512, 64, (x, a, b) => { x.fillStyle = '#8f8576'; x.fillRect(0, 0, a, b); for (let i = 0; i < a; i += 8) for (let j = 0; j < b; j += 8) { const v = 120 + rnd() * 40 | 0; x.fillStyle = `rgb(${v},${v - 8},${v - 20})`; x.fillRect(i + 1, j + 1, 6, 6); } grime(x, a, b, 60, '#6b4a3a', 0.3); });
      st.wrapS = THREE.RepeatWrapping; st.repeat.set(2, 1); add(box, M({ map: st }), 0, 0.05, F + sw / 2, su * 2, 0.1, sw);
      add(box, M({ color: 0xe9e8e2 }), 0, 0.07, F + sw + 0.06, su * 2, 0.14, 0.12).name = 'court810-curb'; }
    // ---- 4. row of large white concrete blocks, the sign resting on top (photos 02/03/06)
    const BH = C.blockH ?? 0.52, BD = 0.55, bw = 0.86, nb = C.blocks ?? 8, b0 = -(nb * (bw + 0.05)) / 2 + bw / 2 + (C.blocksU ?? 0);
    { const bt = cv(128, 96, (x, a, b) => { x.fillStyle = '#e3e1da'; x.fillRect(0, 0, a, b); grime(x, a, b, 60, '#b5b0a3', 0.35); x.strokeStyle = 'rgba(90,90,90,0.4)'; x.beginPath(); x.moveTo(a * rnd(), 0); x.lineTo(a * rnd(), b); x.stroke(); }), bm = M({ map: bt });
      for (let i = 0; i < nb; i++) { const h = BH * (0.94 + rnd() * 0.08), b = add(box, bm, b0 + i * (bw + 0.05), 0.1 + h / 2, F + 0.03 + BD / 2, bw * (0.96 + rnd() * 0.06), h, BD); b.rotation.y = (rnd() - 0.5) * 0.06; } out.parts.push('blocks:' + nb); }
    // ---- 5. basketball hoop: square white concrete post, arm, weathered backboard, orange rim, white net (photos 01/05/07)
    { const hu = C.hoopU ?? -4.6, hv = C.hoopV ?? 1.25, post = M({ color: 0xdedcd5 }), H = new THREE.Group(); H.position.set(hu, 0, hv); H.name = 'court810-hoop'; g.add(H);
      add(box, post, 0, 1.7, 0, 0.26, 3.4, 0.26, H); add(box, post, 0, 0.12, 0, 0.5, 0.24, 0.5, H); add(box, M({ color: 0x2a2a2a, metalness: 0.5 }), 0, 3.25, 0.35, 0.08, 0.08, 0.7, H);
      const bb = cv(256, 150, (x, a, b) => { x.fillStyle = '#e9e7df'; x.fillRect(0, 0, a, b); grime(x, a, b, 90, '#a9a493', 0.3); x.strokeStyle = '#1d1d1d'; x.lineWidth = 7; x.strokeRect(3, 3, a - 6, b - 6); x.lineWidth = 5; x.strokeRect(a * 0.34, b * 0.32, a * 0.32, b * 0.42); });
      add(box, M({ map: bb }), 0, 3.5, 0.72, 1.8, 1.05, 0.04, H).name = 'court810-backboard';
      const rim = add(new THREE.TorusGeometry(0.23, 0.012, 6, 24), M({ color: 0xc8501e, metalness: 0.5, roughness: 0.4 }), 0, 3.05, 0.97, 1, 1, 1, H); rim.rotation.x = Math.PI / 2;
      const net = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.CylinderGeometry(0.23, 0.15, 0.42, 12, 3, true)), new THREE.LineBasicMaterial({ color: 0xf2f2ee, transparent: true, opacity: 0.85 })); net.position.set(0, 2.83, 0.97); H.add(net); out.parts.push('hoop'); }
    // ---- 6. small soccer goal beside the blocks (photo 06), and a soccer ball on the court
    { const gu2 = C.goalU ?? 5.7, gm = M({ color: 0x8e8f8b, metalness: 0.6, roughness: 0.4 }), tg = new THREE.CylinderGeometry(0.03, 0.03, 1, 8), GW = 1.8, GH = 1.2, GD = 0.8, G = new THREE.Group(); G.position.set(gu2, 0, F + 0.15 + GD / 2); G.name = 'court810-goal'; g.add(G);
      for (const s of [-1, 1]) { add(tg, gm, s * GW / 2, GH / 2, GD / 2, 1, GH, 1, G); add(tg, gm, s * GW / 2, 0.3, -GD / 2, 1, 0.6, 1, G); const sd = add(tg, gm, s * GW / 2, GH - 0.3, 0, 1, Math.hypot(GD, 0.6), 1, G); sd.rotation.x = Math.atan2(GD, 0.6); }
      const cb = add(tg, gm, 0, GH, GD / 2, 1, GW, 1, G); cb.rotation.z = Math.PI / 2;
      const nt = cv(64, 64, (x, a) => { x.strokeStyle = 'rgba(235,235,230,0.8)'; x.lineWidth = 2; for (let i = 0; i <= a; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, a); x.moveTo(0, i); x.lineTo(a, i); x.stroke(); } }); nt.wrapS = nt.wrapT = THREE.RepeatWrapping; nt.repeat.set(6, 4);
      add(new THREE.PlaneGeometry(GW, Math.hypot(GH, GD)), new THREE.MeshBasicMaterial({ map: nt, transparent: true, side: THREE.DoubleSide, depthWrite: false }), 0, GH / 2, 0, 1, 1, 1, G).rotation.x = -Math.atan2(GD, GH); out.parts.push('goal'); }
    { const bt = cv(256, 128, (x, a, b) => { x.fillStyle = '#f4f4f0'; x.fillRect(0, 0, a, b); x.fillStyle = '#151515'; for (let i = 0; i < 12; i++) { const px = (i % 6) * a / 6 + (i < 6 ? 10 : 31), py = i < 6 ? b * 0.3 : b * 0.72; x.beginPath(); for (let k = 0; k < 5; k++) { const an = k / 5 * 7 - 1.57; x.lineTo(px + Math.cos(an) * 11, py + Math.sin(an) * 13); } x.fill(); } });
      const ball = add(new THREE.SphereGeometry(0.11, 20, 14), M({ map: bt, roughness: 0.5 }), C.ballU ?? 2.1, 0.11 + 0.012, C.ballV ?? 1.9); ball.rotation.set(0.4, 1.1, 0.2); ball.name = 'court810-ball'; }
    // ---- 7. tree-covered mountain rising steeply behind the building (photos 01/04)
    { const MW = 150, MD = 70, nx = low ? 48 : 110, nz = low ? 22 : 50, geo = new THREE.PlaneGeometry(MW, MD, nx, nz); geo.rotateX(-Math.PI / 2); const p = geo.attributes.position, col = [], c = new THREE.Color();
      const n2 = (a, b) => Math.sin(a * 0.11 + 1.3) * Math.cos(b * 0.13) + 0.5 * Math.sin(a * 0.27 + b * 0.19) + 0.25 * Math.sin(a * 0.71 - b * 0.53) + 0.12 * Math.sin(a * 1.9 + b * 1.7);
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), zz = p.getZ(i), d = (MD / 2 - zz) / MD; // 0 at the front edge -> 1 at the back
        const ridge = 58 - 14 * Math.cos(x / MW * Math.PI * 1.6 + 0.6), y = Math.max(0, ridge * Math.pow(Math.min(1, d * 1.5), 0.75) + 4 * n2(x, zz) * Math.min(1, d * 3) - 1.5); p.setY(i, y);
        const k = 0.5 + 0.25 * n2(x * 3.1, zz * 2.7) + 0.25 * rnd(); c.setRGB(0.12 + 0.12 * k, 0.26 + 0.2 * k, 0.1 + 0.08 * k); if (y > ridge * 0.9 && rnd() < 0.15) c.multiplyScalar(0.8); col.push(c.r, c.g, c.b); }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
      const mt = add(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }), C.mountainU ?? 0, 0, back - (C.mountainBack ?? 5) - MD / 2); mt.name = 'court810-mountain'; mt.userData.noRay = true;
      if (!low) { const tg = new THREE.IcosahedronGeometry(1, 0), tm = new THREE.MeshStandardMaterial({ color: 0x2f5a26, roughness: 1, flatShading: true }), N = 160, im = new THREE.InstancedMesh(tg, tm, N), o = new THREE.Object3D(); // tree crowns on the lower slope
        for (let i = 0; i < N; i++) { const x = (rnd() - 0.5) * 60, z = -(rnd() * 14); o.position.set(x, 1.5 + rnd() * 2 + Math.max(0, -z) * 0.6, back - (C.mountainBack ?? 5) + 2 + z); const s = 1.4 + rnd() * 1.8; o.scale.set(s, s * (0.8 + rnd() * 0.4), s); o.updateMatrix(); im.setMatrixAt(i, o.matrix); } g.add(im);
        { /* #854 Cascades court-tree GLBs: 04/05 on the slope in place of the icosa crowns, 01-03 near fence/steeples; icosa stays until load, kept on failure */
          const lod = (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) ? 1 : 0, ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder); ld.setCrossOrigin('anonymous');
          let s4 = 8.54; const r4 = () => (s4 = (s4 * 9301 + 49297) % 233280) / 233280, mb = back - (C.mountainBack ?? 5), spots = [];
          for (let i = 0; i < 70; i++) { const x = (r4() - 0.5) * 60, z = -(r4() * 14); spots.push({ k: 3 + (r4() < 0.5 ? 0 : 1), p: [x, Math.max(0, -z) * 0.6 + 0.4, mb + 2 + z], yaw: r4() * 6.283, sc: 0.6 + r4() * 0.6 }); }
          for (let i = 0; i < 9; i++) { const x = (r4() - 0.5) * L * 0.9; spots.push({ k: i % 3, p: [x, 0, back - 1.2 - r4() * 2.5], yaw: r4() * 6.283, sc: 0.8 + r4() * 0.3 }); }
          const st = (window.__courtTrees854 = window.__courtTrees854 || {}); st.lod = lod;
          Promise.all([1, 2, 3, 4, 5].map(n => ld.loadAsync(CT854 + 'court-tree-0' + n + '-lod' + lod + '.glb'))).then(gs => { const tg = new THREE.Group(); tg.name = 'court810-trees854'; let cnt = 0;
            gs.forEach((gl, k) => { const use = spots.filter(q => q.k === k); if (!use.length) return; gl.scene.updateMatrixWorld(true);
              gl.scene.traverse(o2 => { if (!o2.isMesh) return; if (o2.material) o2.material.vertexColors = true; const ii = new THREE.InstancedMesh(o2.geometry, o2.material, use.length); ii.name = 'CourtTree0' + (k + 1) + '-' + o2.name; const Mi = new THREE.Matrix4(), Qi = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
                use.forEach((q, j) => { Qi.setFromAxisAngle(Y, q.yaw); Mi.compose(new THREE.Vector3(...q.p), Qi, new THREE.Vector3(q.sc, q.sc, q.sc)).multiply(o2.matrixWorld); ii.setMatrixAt(j, Mi); });
                ii.instanceMatrix.needsUpdate = true; ii.computeBoundingSphere(); ii.castShadow = false; ii.userData.decor = true; ii.userData.decor810 = true; ii.userData.noRay = true; tg.add(ii); cnt++; }); });
            g.add(tg); g.remove(im); im.dispose(); st.ok = true; st.meshes = cnt; st.trees = spots.length; }).catch(e => { console.warn('[854] court-tree GLBs failed, keeping procedural', e); st.ok = false; }); } } out.parts.push('mountain'); }
    // ---- 8. optional red-roof seating shelter (aerial photo 04), off the court, beside the building at the far end
    if (C.shelter) { const s = C.shelter, sg = new THREE.Group(); sg.position.set(s.u, 0, s.v); g.add(sg); const rm = M({ color: 0x9a3b2b }), wm = M({ color: 0xe8e6df });
      add(box, wm, 0, 0.5, 0, s.len, 1.0, 0.25, sg); for (let i = 0; i <= 4; i++) add(box, wm, -s.len / 2 + i * s.len / 4, 1.55, -0.6, 0.12, 3.1, 0.12, sg); const r = add(box, rm, 0, 3.15, -0.3, s.len + 0.4, 0.06, 2.0, sg); r.rotation.x = 0.12; out.parts.push('shelter'); }
    // ---- 9. the sign: rides the catalog mural (Buy Scanner / audits keep seeing it); frame off, plywood edge + thickness behind
    { const id = C.sign || 'berlin-el-salvador-mural', fix = () => { const sg = root.getObjectByName(id); if (!sg) return false; const fr = sg.getObjectByName('muralFrame'); if (fr) fr.visible = false; const m = sg.getObjectByName('mural'); if (!m) return false;
        if (!sg.getObjectByName('sign810')) { const e = new THREE.Mesh(box, M({ color: 0xc8622a })); e.name = 'sign810'; e.scale.set(m.scale.x, m.scale.y, 0.025); e.position.z = -0.006; sg.add(e); }
        out.sign = { pos: sg.position.toArray().map(v => +v.toFixed(3)), ry: +sg.rotation.y.toFixed(4), wallRy: +g.rotation.y.toFixed(4), size: [+m.scale.x.toFixed(3), +m.scale.y.toFixed(3)], bottom: +(sg.position.y - m.scale.y / 2).toFixed(3), blockTop: +(0.1 + BH).toFixed(3) }; return true; };
      if (!fix()) { let n = 0; const iv = setInterval(() => { if (fix() || ++n > 80) clearInterval(iv); }, 250); } }
    g.traverse(m => { if (m.isMesh) { m.castShadow = false; m.userData.decor = true; m.userData.decor810 = true; } });
    out.courts++; }
  return out;
}
