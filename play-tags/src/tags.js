// #251 tag gallery ("rooms by tag"): Roman-garden pavilion, hex rooms, peristyle courtyards, outer mural courts.
// Original procedural architecture (no copied assets). Geometry comes from tags-world.js (also used by tools/doorcheck.mjs),
// so what is drawn is exactly what the doorway / path check verified.
import { MUSEUM } from './museum.config.js'; // #284 plainCourts
import * as THREE from 'three';
import { installWallMap } from './wallmap.js'; // #291
window.__shopSoftGlow = true; // #301: preview-only soft Buy Scanner halo (gallery-core shopscan opt-in)
window.__noOstrichEgg = true; // #289: the walking ostrich egg is gone (the guide bot is the ostrich now)
window.__gbMenu = true; // #308: preview-only guide-bot hover/tap menu
import { installTestiMap } from './testimap.js'; // #293
import { installFrames } from './frames.js'; // #301
import { installCourtyard294 } from './courtyard294.js'; // #294
import { installCourtyardStyle } from './courtyardstyle.js'; // #295
import { installRide } from './ride.js';
import { buildFountainPortal, installCourtyard296 } from './courtyard296.js';
import { makeWorld, segDist, PILLAR_W, PILLAR_D, WALL_H, WT, CORE_R, RING_R, DOOR_H, DOOR_SPRING } from './tags-world.js';
import { createMinimap } from './minimap.js';
import { buildDomes, buildGarden, createFountainSound } from './garden/index.js'; // gallery-core/src/garden ('garden ready' on #251, 1:25 PM)
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });
export const PAL = { travertine: 0xe3d5bb, stone: 0xcbb89a, terracotta: 0xb8673f, marble: 0xf1ece2, gravel: 0xcdbfa3, path: 0xd9ccb2, box: 0x3f5a2c, water: 0x6f9fae, bronze: 0x8a6a3a };
// #276: geometry detail tier picked from the device: high on desktop GPUs, medium on weak / software GPUs, low on phones
// (render quality still follows the core tier and its fps step-down). ?detail=low|medium|high forces it.
function detailTier(LOW) { const f = new URLSearchParams(location.search).get('detail'); if (['low', 'medium', 'high'].includes(f)) return f; if (LOW) return 'low';
  let gpu = ''; try { const g = document.createElement('canvas').getContext('webgl'), e = g.getExtension('WEBGL_debug_renderer_info'); gpu = String(g.getParameter(e ? e.UNMASKED_RENDERER_WEBGL : g.RENDERER)); } catch (e) {}
  const coarse = matchMedia('(pointer: coarse)').matches, weak = /swiftshader|llvmpipe|software|mali|adreno|powervr|apple gpu|intel.*(hd|uhd) graphics( [2-6]\d\d)?\b/i.test(gpu) || (navigator.hardwareConcurrency || 8) < 4;
  window.__tagsGpu = gpu; return coarse ? 'low' : weak ? 'medium' : 'high'; }
export function buildTags(scene, { CATALOG, LOW, MEDIUM }) {
  const T = CATALOG.layout.tags, W = makeWorld(T, CATALOG.paintings), tier = detailTier(LOW);
  const root = new THREE.Group(); root.name = 'tagsArchitecture'; scene.add(root); // walls live in a group: the gate module never carves them
  const geoBox = new THREE.BoxGeometry(1, 1, 1);
  const mk = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1, ry = 0, parent = root) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.y = ry; m.receiveShadow = true; parent.add(m); return m; };
  { const sun = new THREE.DirectionalLight(0xfff0d8, LOW ? 1.6 : 1.3); sun.position.set(30, 50, 20); root.add(sun); root.add(new THREE.HemisphereLight(0xdfe9f2, 0xb59a74, 0.9)); } // Roman afternoon (no shadows: phone budget)
  // ---- ground: gravel everywhere, stone floors in rooms, marble in the pavilion, stone flag lanes on every walk path
  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), std(MUSEUM.plainCourts ? new THREE.Color('#5f8f45') : PAL.gravel, { roughness: 1 })); // #284: plain green courtyards ground.rotation.x = -Math.PI / 2; ground.position.set(-8, MUSEUM.plainCourts ? 0.002 : -0.002, 8); ground.receiveShadow = true; root.add(ground); ground.name = 'gravel';
  const floorMat = std(PAL.stone, { roughness: 0.7 }), marble = std(PAL.marble, { roughness: 0.35 });
  for (const r of W.rooms.filter(r => r.kind === 'room')) { const s = new THREE.Shape(r.poly.map(([x, z]) => new THREE.Vector2(x, -z))); const m = new THREE.Mesh(new THREE.ShapeGeometry(s), floorMat); m.rotation.x = -Math.PI / 2; m.position.y = 0.004; m.receiveShadow = true; root.add(m); }
  { const m = new THREE.Mesh(new THREE.CircleGeometry(RING_R + 0.6, 48), marble); m.rotation.x = -Math.PI / 2; m.position.y = 0.006; m.name = 'marbleCore'; root.add(m); }
  const pathMat = std(PAL.path, { roughness: 0.9 });
  if (!MUSEUM.plainCourts) for (const p of W.paths) { const L = Math.hypot(p.x1 - p.x0, p.z1 - p.z0); if (L < 0.05) continue; const m = new THREE.Mesh(new THREE.PlaneGeometry(p.width, L), pathMat); m.rotation.set(-Math.PI / 2, 0, Math.atan2(p.x1 - p.x0, p.z1 - p.z0)); m.position.set((p.x0 + p.x1) / 2, 0.008, (p.z0 + p.z1) / 2); root.add(m); }
  if (!MUSEUM.plainCourts) for (const g of W.rings) { const m = new THREE.Mesh(new THREE.RingGeometry(g.r0, g.r1, 40), pathMat); m.rotation.x = -Math.PI / 2; m.position.set(g.x, 0.009, g.z); root.add(m); }
  // ---- room walls: warm plaster inside (each room's palette colour), terracotta cornice
  const NEUTRAL = '#ece6da', wallMats = new Map(), cornice = std(PAL.terracotta);
  for (const w of W.walls) { const L = Math.hypot(w.x1 - w.x0, w.z1 - w.z0), ry = -Math.atan2(w.z1 - w.z0, w.x1 - w.x0), cx = (w.x0 + w.x1) / 2 - w.nx * 0, cz = (w.z0 + w.z1) / 2;
    const room = T.rooms.find(r => r.id === w.room), col = NEUTRAL; // #296: gallery walls stay neutral (the colour lives in the trim and the courtyard) if (!wallMats.has(col)) wallMats.set(col, std(new THREE.Color(col)));
    const off = 0, th = w.free ? WT : 0.05; // room walls: 5 cm slab centred on the layout line (neighbouring rooms share it; art hangs 3 cm off it on both sides)
    const m = mk(geoBox, wallMats.get(col), cx + w.nx * off, w.h / 2, cz + w.nz * off, L + (w.free ? 0 : 0.02), w.h, th, ry); m.castShadow = true; m.name = w.free ? 'muralWall' : 'roomWall';
    mk(geoBox, cornice, cx + w.nx * off, w.h + 0.09, cz + w.nz * off, L + 0.06, 0.18, th + 0.12, ry).name = 'cornice'; }
  // door frames: travertine jambs and lintel on every room door (inside the wall line, never in the opening)
  const trav = std(PAL.travertine, { roughness: 0.6 });
  // ---- #277 (TJ): smooth the OUTSIDE joins where hexagons meet, courtyard side only (room interiors untouched):
  // a continuous travertine plinth along the outer wall foot (covers the sawtooth floor seam between gravel and room floors)
  // and a rounded engaged column cap at every outer hex corner (no jagged wall ends). Kept out of doors and paths.
  { const isCourt = (x, z) => { const r = W.roomAt(x, z); return !!r && (r.kind === 'court' || r.kind === 'outer'); }, plinth = [], caps = new Map(), H = 0.32, D = 0.26;
    const clear = (x, z, r) => !W.inDoorZone(x, z, r) && !W.inPath(x, z, r);
    for (const w of W.walls) { if (w.free) continue; const L = Math.hypot(w.x1 - w.x0, w.z1 - w.z0); if (L < 0.3) continue; const tx = (w.x1 - w.x0) / L, tz = (w.z1 - w.z0) / L;
      for (const sd of [1, -1]) { const nx = w.nx * sd, nz = w.nz * sd, mx = (w.x0 + w.x1) / 2 + nx * 0.7, mz = (w.z0 + w.z1) / 2 + nz * 0.7; if (!isCourt(mx, mz)) continue;
        // plinth in short runs so a door or path end only drops the piece it touches
        const n = Math.max(1, Math.round(L / 0.5)); for (let i = 0; i < n; i++) { const u0 = L * i / n, u1 = L * (i + 1) / n, cx = w.x0 + tx * (u0 + u1) / 2 + nx * (0.025 + D / 2), cz = w.z0 + tz * (u0 + u1) / 2 + nz * (0.025 + D / 2);
          if (clear(cx, cz, D / 2)) plinth.push({ x: cx, z: cz, L: u1 - u0 + 0.004, ry: -Math.atan2(tz, tx) }); }
        const rm = W.rooms.find(r => r.id === w.room); for (const [vx, vz] of [[w.x0, w.z0], [w.x1, w.z1]]) { const k = vx.toFixed(2) + ',' + vz.toFixed(2); if (caps.has(k) || !rm) continue;
          const ox = vx - rm.center[0], oz = vz - rm.center[1], oL = Math.hypot(ox, oz), px = vx + ox / oL * 0.17, pz = vz + oz / oL * 0.17; // sits fully OUTSIDE the room (interiors untouched)
          if (oL > rm.radius * 0.97 && isCourt(px + ox / oL * 0.3, pz + oz / oL * 0.3) && clear(px, pz, 0.17)) caps.set(k, [px, pz]); } } }
    const geo = new THREE.BoxGeometry(1, 1, 1), im = new THREE.InstancedMesh(geo, trav, Math.max(1, plinth.length)), mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    plinth.forEach((p, i) => im.setMatrixAt(i, mtx.compose(new THREE.Vector3(p.x, H / 2, p.z), q.setFromEuler(e.set(0, p.ry, 0)), new THREE.Vector3(p.L, H, D)))); im.count = plinth.length; im.name = 'outerPlinth'; im.receiveShadow = true; root.add(im);
    const seg = tier === 'high' ? 32 : tier === 'medium' ? 16 : 10, cg = new THREE.CylinderGeometry(0.15, 0.17, WALL_H + 0.18, seg), ci = new THREE.InstancedMesh(cg, trav, Math.max(1, caps.size)); let i = 0;
    for (const [x, z] of caps.values()) ci.setMatrixAt(i++, mtx.compose(new THREE.Vector3(x, (WALL_H + 0.18) / 2, z), q.identity(), new THREE.Vector3(1, 1, 1))); ci.count = caps.size; ci.name = 'outerCornerCaps'; ci.castShadow = true; root.add(ci);
    window.__tagsOuterSmoothing = { plinthPieces: plinth.length, cornerCaps: caps.size }; }
  // #300 (TJ): wide round-arched doorways. Per door: straight travertine jambs up to the springing line, a semicircular travertine arch ring over the opening,
  // and a plaster tympanum (rectangle minus the arch) that closes the wall above it. Everything stays outside the opening (never narrows the walk-through).
  const archShape = (w, sp, top, ro) => { const s = new THREE.Shape(); if (ro == null) { s.moveTo(-w / 2, sp); s.absarc(0, sp, w / 2, Math.PI, 0, true); s.lineTo(w / 2, top); s.lineTo(-w / 2, top); s.closePath(); }
    else { s.moveTo(ro, sp); s.absarc(0, sp, ro, 0, Math.PI, false); s.lineTo(-w / 2, sp); s.absarc(0, sp, w / 2, Math.PI, 0, true); s.closePath(); } return s; };
  const segN = tier === 'high' ? 40 : tier === 'medium' ? 28 : 18; const archCache = new Map();
  for (const d of W.doors.filter(d => d.kind !== 'gate' && d.kind !== 'hub')) { const tx = -d.nz, tz = d.nx, ry = -Math.atan2(tz, tx), sp = d.spring ?? DOOR_SPRING, g = new THREE.Group(); g.position.set(d.x, 0, d.z); g.rotation.y = ry; g.name = 'doorArch'; root.add(g);
    const k = d.width.toFixed(2); if (!archCache.has(k)) { const ex = (sh, depth) => { const e = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: segN }); e.translate(0, 0, -depth / 2); return e; };
      archCache.set(k, { tym: ex(archShape(d.width, sp, WALL_H), 0.05), ring: ex(archShape(d.width, sp, 0, d.width / 2 + 0.2), 0.14) }); }
    const A = archCache.get(k), rm = T.rooms.find(q => q.id === d.room), tm = wallMats.get(NEUTRAL) || wallMats.values().next().value || trav;
    const tym = new THREE.Mesh(A.tym, tm); tym.receiveShadow = true; tym.name = 'overdoor'; g.add(tym);
    const ring = new THREE.Mesh(A.ring, trav); ring.receiveShadow = true; ring.name = 'lintel'; g.add(ring);
    for (const sd of [-1, 1]) { const j = new THREE.Mesh(geoBox, trav); j.scale.set(0.2, sp, 0.14); j.position.set(sd * (d.width / 2 + 0.1), sp / 2, 0); j.name = 'jamb'; j.receiveShadow = true; g.add(j); } }
  // ---- #288: inviting entrances: splayed travertine returns outside each room door, a warm glow over and in front of it,
  // and simple stone walkways from the checkout platform to every courtyard door (data-driven rays; #295 will restyle them)
  { const glow = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), rg = g.createRadialGradient(64, 64, 0, 64, 64, 64); rg.addColorStop(0, 'rgba(255,190,110,1)'); rg.addColorStop(0.5, 'rgba(255,150,70,0.45)'); rg.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = rg; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })(), addM = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false };
    for (const f of W.flares) { const L = Math.hypot(f.x1 - f.x0, f.z1 - f.z0), m = mk(geoBox, trav, (f.x0 + f.x1) / 2, DOOR_H / 2 + 0.06, (f.z0 + f.z1) / 2, 0.14, DOOR_H + 0.12, L, Math.atan2(f.x1 - f.x0, f.z1 - f.z0)); m.name = 'doorFlare'; }
    for (const d of W.doors.filter(d => d.kind === 'inner' || d.kind === 'outer')) { const r = T.rooms.find(q => q.id === d.room); let ox = d.x - r.center[0], oz = d.z - r.center[1]; const q = Math.hypot(ox, oz) || 1; ox /= q; oz /= q;
      const pool = new THREE.Mesh(new THREE.CircleGeometry(1.9, 32), new THREE.MeshBasicMaterial({ map: glow, color: 0xffffff, opacity: 0.55, ...addM })); pool.rotation.x = -Math.PI / 2; pool.position.set(d.x + ox * 1.0, 0.02, d.z + oz * 1.0); pool.name = 'doorGlow'; root.add(pool);
      const sp = d.spring ?? DOOR_SPRING, strip = new THREE.Mesh(new THREE.TorusGeometry(d.width / 2 - 0.04, 0.022, 6, segN, Math.PI), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.8, 1.2), toneMapped: false })); strip.position.set(d.x + ox * 0.09, sp, d.z + oz * 0.09); strip.rotation.y = Math.atan2(ox, oz); root.add(strip); strip.name = 'doorLight'; }
    const pc = document.createElement('canvas'); pc.width = 64; pc.height = 256; const px = pc.getContext('2d'); for (let i = 0; i < 1400; i++) { const v = 150 + Math.random() * 70 | 0; px.fillStyle = `rgb(${v},${v - 8},${v - 22})`; px.fillRect(Math.random() * 64, Math.random() * 256, 2, 2); }
    const ag = px.createLinearGradient(0, 0, 64, 0); ag.addColorStop(0, 'rgba(0,0,0,1)'); ag.addColorStop(0.18, 'rgba(0,0,0,0)'); ag.addColorStop(0.82, 'rgba(0,0,0,0)'); ag.addColorStop(1, 'rgba(0,0,0,1)'); px.globalCompositeOperation = 'destination-out'; px.fillStyle = ag; px.fillRect(0, 0, 64, 256);
    const pt = new THREE.CanvasTexture(pc); pt.colorSpace = THREE.SRGBColorSpace; pt.wrapT = THREE.RepeatWrapping; const base = new THREE.MeshStandardMaterial({ color: 0xd9ccb4, roughness: 0.95, transparent: true, depthWrite: false });
    for (const r of W.rays) { const dx = r.x1 - r.x0, dz = r.z1 - r.z0, L = Math.hypot(dx, dz), s0 = 2.4, Lw = L - s0; if (Lw <= 0.2) continue; const t = pt.clone(); t.needsUpdate = true; t.repeat.set(1, Lw / 2);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(r.width, Lw), base.clone()); m.material.map = t; m.rotation.x = -Math.PI / 2; m.rotation.z = Math.atan2(dx, dz) + Math.PI; m.position.set(r.x0 + dx / L * (s0 + Lw / 2), 0.012, r.z0 + dz / L * (s0 + Lw / 2)); m.name = 'walkRay'; m.receiveShadow = true; root.add(m); } }
  // ---- pavilion core: round travertine wall with the gates and checkout on its inner face
  const coreMat = std(PAL.travertine, { roughness: 0.65 });
  for (const a of W.arcs) { const n = Math.max(2, Math.ceil((a.a1 - a.a0) * a.r / 0.6)); for (let i = 0; i < n; i++) { const t0 = a.a0 + (a.a1 - a.a0) * i / n, t1 = a.a0 + (a.a1 - a.a0) * (i + 1) / n, tm = (t0 + t1) / 2, ch = 2 * a.r * Math.sin((t1 - t0) / 2) + 0.03;
    mk(geoBox, coreMat, a.r * Math.cos(tm), a.h / 2, a.r * Math.sin(tm), WT, a.h, ch, -tm).name = 'coreWall'; } }
  // #278: the one central pillar (travertine, terracotta cornice); the core hangs the checkout portal on its +x face
  // #290 (TJ): the pillar and flat portal are gone; #296 (TJ): the glowing bubble is gone too. A walk-in fountain over Visual's sun medallion sits at the very
  // centre and IS the checkout portal: walking into it (bounded trigger in the core, r < BUBBLE.trig) or tapping its water checks out. No floating text.
  const BUBBLE = { r: 0.8, y: 1.45, trig: 1.2, block: 0.7 }, FOUNTAIN = buildFountainPortal({ root, low: LOW, BUBBLE });
  // ---- columns (Tuscan order, original proportions): base, tapered shaft, capital; instanced, so the phone budget holds
  const cols = W.columns, seg = LOW ? 10 : 16, H = { pavilion: 4.2, peristyle: 3.0, colonnade: 3.2 };
  const parts = [[new THREE.CylinderGeometry(1.18, 1.3, 0.18, seg), 0.09, PAL.travertine], [new THREE.CylinderGeometry(0.86, 1, 1, seg), 0.5, PAL.marble], [new THREE.BoxGeometry(2.6, 0.16, 2.6), 1, PAL.travertine]];
  if (cols.length) for (const [geo, y, c] of parts) { const im = new THREE.InstancedMesh(geo, std(c, { roughness: 0.5 }), cols.length), M = new THREE.Matrix4(); cols.forEach((q, i) => { const h = H[q.kind] || 3, r = q.r;
      if (y === 0.5) M.compose(new THREE.Vector3(q.x, 0.18 + (h - 0.34) / 2, q.z), new THREE.Quaternion(), new THREE.Vector3(r, h - 0.34, r));
      else if (y === 1) M.compose(new THREE.Vector3(q.x, h - 0.08, q.z), new THREE.Quaternion(), new THREE.Vector3(r, 1, r)); else M.compose(new THREE.Vector3(q.x, y, q.z), new THREE.Quaternion(), new THREE.Vector3(r, 1, r));
      im.setMatrixAt(i, M); }); im.name = 'columns'; im.castShadow = !LOW; root.add(im); }
  // entablature rings over each peristyle and the pavilion ring (overhead only: 0.5 m deep beams above head height)
  const ent = std(PAL.travertine, { side: THREE.DoubleSide });
  const ring = (x, z, r, y) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.42, 48, 1, true), ent); m.position.set(x, y, z); m.name = 'entablature'; root.add(m); const t = new THREE.Mesh(new THREE.RingGeometry(r - 0.28, r + 0.28, 48), std(PAL.terracotta, { side: THREE.DoubleSide })); t.rotation.x = -Math.PI / 2; t.position.set(x, y + 0.21, z); root.add(t); };
  void ring; // #288 (TJ): the entablature rings/bands went with the columns
  // ---- fountains + boxwood beds (stand-ins until gallery-core/src/garden lands)
  const stub = new THREE.Group(); stub.name = 'gardenStub'; root.add(stub); const water = std(PAL.water, { roughness: 0.1, metalness: 0.2 }), boxw = std(PAL.box, { roughness: 1 }), jets = [];
  for (const c of MUSEUM.plainCourts ? [] : W.colliders) {
    if (c.kind === 'fountain') { mk(new THREE.CylinderGeometry(c.r, c.r + 0.06, 0.45, 32), std(PAL.marble), c.x, 0.225, c.z, 1, 1, 1, 0, stub);
      const w = mk(new THREE.CircleGeometry(c.r - 0.08, 32), water, c.x, 0.4, c.z, 1, 1, 1, 0, stub); w.rotation.x = -Math.PI / 2;
      mk(new THREE.CylinderGeometry(0.12, 0.18, 0.9, 12), std(PAL.travertine), c.x, 0.85, c.z, 1, 1, 1, 0, stub); mk(new THREE.CylinderGeometry(0.45, 0.12, 0.16, 20), std(PAL.marble), c.x, 1.3, c.z, 1, 1, 1, 0, stub);
      const j = mk(new THREE.ConeGeometry(0.06, 0.6, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xdff3f6, transparent: true, opacity: 0.55 }), c.x, 1.65, c.z, 1, 1, 1, 0, stub); j.name = 'jet'; jets.push(j); }
    if (c.kind === 'bed') mk(new THREE.CylinderGeometry(c.r, c.r, 0.5, 14), boxw, c.x, 0.25, c.z, 1, 1, 1, 0, stub); }
  // ---- outer courts: murals at full size on their freestanding courtyard walls, brass plates at 1.45 m, the Neural Dance wall
  const loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
  const proxied = u => u.replace('https://img.tjm.art/', import.meta.env.BASE_URL + 'img/').replace('https://tjm.art/', import.meta.env.BASE_URL + 'tjm/');
  // #272: on the low tier the big mural textures wait until the first playable frame (plaques still load at once)
  const afterPlayable = f => { if (!LOW) return f(); const t0 = performance.now(); (function w() { const g = window.game; if (g && (g.fps > 0 || window.__auditNoRender || performance.now() - t0 > 8000)) setTimeout(f, 300); else setTimeout(w, 100); })(); };
  const murals = [], report = { murals: [] }; let dance = null;
  for (const a of W.art.filter(a => a.src && a.kind !== 'painting' && a.kind !== 'plaque')) {
    const s = a.src, g = new THREE.Group(); g.position.set(a.x, a.y, a.z); g.rotation.y = Math.atan2(a.ix, a.iz); root.add(g); g.name = s.id;
    if (s.kind === 'mural') { const fr = mk(geoBox, std(0x3b2a1c), 0, 0, -0.01, a.w + 0.08, a.h + 0.08, 0.03, 0, g); fr.name = 'muralFrame';
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x6a5a48 })); m.scale.set(a.w, a.h, 1); m.position.z = 0.01; g.add(m); m.name = 'mural';
      const rec = { id: s.id, listed: [a.w, a.h] }; report.murals.push(rec); murals.push({ g, m, a });
      afterPlayable(() => loader.load(proxied(s.tex), t => { t.colorSpace = THREE.SRGBColorSpace; const ia = t.image.width / t.image.height, la = a.w / a.h; rec.image = [t.image.width, t.image.height];
        if (Math.abs(ia / la - 1) > 0.03) { rec.mismatch = true; if (ia > la) m.scale.set(a.w, a.w / ia, 1); else m.scale.set(a.h * ia, a.h, 1); } // fit, never stretch
        m.material.map = t; m.material.color.set(0xffffff); m.material.needsUpdate = true; })); }
    else if (s.kind === 'brass-plaque') { const m = new THREE.Mesh(new THREE.PlaneGeometry(a.w, a.h), new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.05 })); m.position.z = 0.012; g.add(m); m.name = 'brassPlaque';
      loader.load(import.meta.env.BASE_URL + 'plaques/' + s.img.split('/').pop(), t => { t.colorSpace = THREE.SRGBColorSpace; m.material.map = t; m.material.needsUpdate = true; }); }
    else if (s.kind === 'projection') { // #269 (TJ): the REAL Neural Dance simulation from tjm.art/neural-dance/, run live in a
      // hidden same-origin iframe (page fetched through the /tjm/ proxy, header/cart scripts stripped, fullscreen layout) and
      // copied onto this wall each frame. Loaded only when near, torn down when away; its audio is never started (silent);
      // the iframe is inert, pointer-events none, never focused. Phones copy at a lower rate and resolution.
      const c = document.createElement('canvas'); c.width = LOW ? 512 : 1024; c.height = Math.round(c.width * a.h / a.w); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const x = c.getContext('2d'); x.fillStyle = '#05060a'; x.fillRect(0, 0, c.width, c.height);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(a.w, a.h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); m.position.z = 0.015; g.add(m); m.name = 'neuralDance';
      mk(geoBox, std(0x1d1814), 0, 0, -0.005, a.w + 0.16, a.h + 0.16, 0.02, 0, g);
      dance = { c, x, tex, acc: 0, pos: new THREE.Vector3(a.x, 1.6, a.z), frame: null, loading: false, live: false }; } }
  const ND_URL = 'tjm/neural-dance/', ND_NEAR = 22, ND_FAR = 30;
  async function danceOn() { if (dance.frame || dance.loading) return; dance.loading = true;
    try { let html = await (await fetch(ND_URL)).text();
      html = html.replace(/<script[^>]*src="\/(payments|site-header)[^"]*"[^>]*><\/script>/g, '').replace(/<body([^>]*)>/, '<body$1 class="full">');
      const f = document.createElement('iframe'); f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1; f.inert = true; f.title = 'Neural Dance';
      f.style.cssText = 'position:fixed;left:0;top:0;width:' + (LOW ? 640 : 1100) + 'px;height:' + (LOW ? 360 : 620) + 'px;opacity:0;pointer-events:none;z-index:-1;border:0';
      f.srcdoc = html; document.body.appendChild(f); dance.frame = f; f.addEventListener('load', () => { dance.live = true; });
      window.__neuralDance = { state: 'live', src: '/neural-dance/' }; } catch (e) { window.__neuralDance = { state: 'error', err: String(e) }; console.warn('[neural-dance] load failed', e); }
    dance.loading = false; }
  function danceOff() { if (!dance.frame) return; dance.frame.remove(); dance.frame = null; dance.live = false; window.__neuralDance = { state: 'paused (away)' }; }
  function drawDance(dt, cam) { if (!dance || !cam) return; const d = cam.position.distanceTo(dance.pos);
    if (d < ND_NEAR) danceOn(); else if (d > ND_FAR) danceOff();
    if (!dance.live || document.hidden) return; dance.acc += dt; if (dance.acc < (LOW ? 1 / 15 : 1 / 30)) return; dance.acc = 0;
    try { const src = dance.frame.contentDocument && dance.frame.contentDocument.getElementById('canvas'); if (!src || !src.width) return;
      const { c, x } = dance, k = Math.min(c.width / src.width, c.height / src.height), w = src.width * k, h = src.height * k; // fitted, never stretched
      x.fillStyle = '#05060a'; x.fillRect(0, 0, c.width, c.height); x.drawImage(src, (c.width - w) / 2, (c.height - h) / 2, w, h); dance.tex.needsUpdate = true; } catch (e) {} }
  // ---- #269 (TJ): no museum gates in the pavilion. Each former gate spot is a statue niche (arched travertine surround,
  // dark recess, plinth and an original abstract marble figure) so the core wall is never blank. Only the checkout gate leads out.
  function buildGates() { const out = [], recess = std(0x3a2f27, { roughness: 0.95 }), marble = std(0xeee6d8, { roughness: 0.35 });
    const gS = new THREE.SphereGeometry(1, 20, 14), gC = new THREE.CylinderGeometry(1, 1, 1, 20);
    for (const g of W.niches) { const grp = new THREE.Group(); grp.position.set(g.x + g.nx * 0.04, 0, g.z + g.nz * 0.04); grp.rotation.y = Math.atan2(g.nx, g.nz); root.add(grp); grp.name = 'niche:' + g.id;
      mk(geoBox, recess, 0, 1.45, -0.02, 1.4, 2.6, 0.02, 0, grp).name = 'nicheBack';
      for (const sx of [-1, 1]) mk(geoBox, trav, sx * 0.82, 1.45, 0.06, 0.24, 2.9, 0.16, 0, grp); mk(geoBox, trav, 0, 2.96, 0.06, 1.88, 0.26, 0.18, 0, grp);
      mk(gC, trav, 0, 0.45, 0.1, 0.28, 0.9, 0.28, 0, grp).name = 'nichePlinth';
      mk(gC, marble, 0, 1.25, 0.1, 0.13, 0.7, 0.13, 0, grp); mk(gS, marble, 0, 1.75, 0.1, 0.17, 0.22, 0.17, 0, grp); mk(gS, marble, 0, 1.6, 0.1, 0.26, 0.08, 0.26, 0, grp);
      out.push({ ...g, active: false, niche: true }); }
    return out; }
  let gatesBuilt = [];
  function checkGates() {} // #269: no museum gates here; the core's checkout gate (CHK) is the only way out
  // ---- core contract: PIT (slipgate drop zone), NAVE (apex, lifts, clock), signs over doors
  const PIT = { minX: -3, maxX: 3, minZ: -3, maxZ: 3 }, NAVE = { apex: 12, lifts: [], clock: null };
  const NAVE_SIGNS = W.doors.filter(d => d.kind === 'inner').map(d => { const r = T.rooms.find(q => q.id === d.room); return { title: r.label.split(' · ').slice(0, 2).join(' · '), x: d.x + d.nx * (WT + 0.03), z: d.z + d.nz * (WT + 0.03), yaw: Math.atan2(d.nx, d.nz) }; });
  for (const d of W.doors.filter(d => d.kind === 'inner')) { const r = T.rooms.find(q => q.id === d.room); NAVE_SIGNS.push({ title: r.label.split(' · ').slice(0, 2).join(' · '), x: d.x - d.nx * 0.03, z: d.z - d.nz * 0.03, yaw: Math.atan2(-d.nx, -d.nz) }); }
  const CHKG = W.gates.find(g => g.id === 'checkout');
  void CHKG; const CHK = { pos: new THREE.Vector3(0, 0, 0), n: new THREE.Vector3(1, 0, 0), w: 1.5, h: 2.6, bubble: BUBBLE, light: { intensity: 0 } }; // #290: the bubble at the centre
  const GATE = { pos: new THREE.Vector3(0, -400, 400), n: new THREE.Vector3(0, 0, -1), w: 1.5, h: 2.6 }; // hyperspace realm slipgate: parked out of reach (the museum gates are on the core wall)
  const ROOMS_UI = W.rooms.filter(r => r.kind === 'room').map(r => ({ id: r.id, title: r.label, ...r.bounds }));
  const roomObj = new Map(W.rooms.map(r => [r.id, { id: r.id === 'hub' ? 'central' : r.id, title: r.label, ...r.bounds }])); // the core calls the hologram's room 'central'
  const roomAt = (x, z) => roomObj.get(W.roomAt(x, z).id);
  // ---- hooks for the helper modules (HOOKS.md)
  // #275 sightline rule: viewing wedges from the court/room centre, the main paths and standing spots to every artwork
  let sightSegs = null;
  function buildSight() { sightSegs = []; const P = [...W.paths, ...(W.rings || [])];
    for (const a of W.art) { if (a.kind === 'plaque') continue; const L = Math.hypot(a.ix, a.iz) || 1, ix = a.ix / L, iz = a.iz / L, tx = iz, tz = -ix, rm = W.roomAt(a.x + ix, a.z + iz); if (!rm) continue;
      const V = []; if (rm.center && rm.kind !== 'hub') V.push(rm.center);
      for (const d of [2, 3.5, 5]) V.push([a.x + ix * d, a.z + iz * d]);
      for (const p of P) { if (p.x0 == null) continue; const n = Math.max(1, Math.round(Math.hypot(p.x1 - p.x0, p.z1 - p.z0) / 2)); for (let i = 0; i <= n; i++) { const x = p.x0 + (p.x1 - p.x0) * i / n, z = p.z0 + (p.z1 - p.z0) * i / n; const v = (x - a.x) * ix + (z - a.z) * iz;
          if (v > 1 && v < 16 && W.roomAt(x, z)?.id === rm.id) V.push([x, z]); } }
      for (const [vx, vz] of V) { if (!W.walkable(vx, vz) && !(rm.center && vx === rm.center[0])) continue; for (const f of [-0.5, -0.25, 0, 0.25, 0.5]) sightSegs.push([vx, vz, a.x + tx * a.w * f, a.z + tz * a.w * f]); } } }
  const blocksSight = (x, z, r) => { if (!sightSegs) buildSight(); for (const q of sightSegs) if (segDist(x, z, q[0], q[1], q[2], q[3]) < r + 0.05) return true; return false; };
  const colliders = []; const hooks = { ready: false, rooms: W.rooms, doors: W.doors.map(d => d.kind === 'gate' && d.to === 'checkout' ? { ...d, kind: 'checkout', id: 'checkout', width: 1.5 /* the core checkout arch */ } : { ...d, id: d.to }), paths: [...W.paths, ...W.rings], art: W.art,
    keepClear: W.keepClear, blocksSight, addCollider: c => { colliders.push(c); W.colliders.push(c); }, tier, detail: tier, scene, THREE, world: W, report };
  window.__tagsTris = () => { let n = 0; scene.traverse(o => { if (!o.isMesh || !o.visible) return; const g = o.geometry, c = g.index ? g.index.count / 3 : g.attributes.position.count / 3; n += c * (o.isInstancedMesh ? o.count : 1); }); return Math.round(n); };
  let c296 = null, mm = null, garden = null, wallMap = null, testiMap = null, frames = null;
  async function finish(game) { hooks.ready = true; game.tags = hooks;
    { const SY = DOOR_H + 0.39; let n = 0; scene.traverse(o => { if (o.isMesh && NAVE_SIGNS.some(q => Math.abs(q.x - o.position.x) < 1e-4 && Math.abs(q.z - o.position.z) < 1e-4 && Math.abs(o.position.y - 3.02) < 0.02)) { o.position.y = SY; n++; } }); window.__signFit300 = { moved: n, y: SY }; } // #300: the core hangs room signs at 3.02 m (old 2.6 m door + 0.42); lift them to sit just over the arch crown
    try { wallMap = installWallMap({ game, W, root, world: () => window.eggs && window.eggs.world, drone: () => window.eggs && window.eggs.drone, low: LOW }); } catch (e) { console.warn('[wallmap]', e); window.__wallMap = { err: String(e) }; }
    try { frames = installFrames(game, LOW); } catch (e) { console.warn('[frames]', e); window.__frames = { err: String(e) }; }
    try { testiMap = installTestiMap({ game, W, root, low: LOW }); } catch (e) { console.warn('[testimap]', e); window.__testiMap = { err: String(e) }; }
    try { installRide({ game, W, low: LOW }); } catch (e) { console.warn('[ride]', e); window.__ride = { err: String(e) }; } // #314: 'Ask for guidance' = a ride round the galleries
    try { installCourtyardStyle({ game, W, root, low: LOW }); } catch (e) { console.warn('[c295]', e); window.__c295 = { err: String(e) }; }
    try { installCourtyard294({ game, W, root, low: LOW }); } catch (e) { console.warn('[c294]', e); window.__c294 = { err: String(e) }; }
    { // #290: tapping or clicking the bubble checks out too (same path as walking into it)
      const ray = new THREE.Raycaster(), v = new THREE.Vector2(); let down = null;
      addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; }, true);
      addEventListener('pointerup', e => { if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 12 || game.freeze || window.__reading) return;
        if (document.pointerLockElement) v.set(0, 0); else v.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
        ray.setFromCamera(v, game.camera); ray.far = 7; if (ray.intersectObject(BUBBLE.mesh, false).length && window.__goCheckout) { window.__goCheckout('tapped the checkout bubble'); return; }
        // #288 (TJ): tap / click the Neural Dance wall to add a node where you tapped (only while the live sim is loaded nearby, so LOD holds)
        if (dance && dance.live && dance.frame) { ray.far = 14; const ndm = root.getObjectByName('neuralDance'), h = ndm && ray.intersectObject(ndm, false)[0];
          if (h && h.uv) { try { const d = dance.frame.contentDocument, cv = d.querySelector('canvas'), r = cv.getBoundingClientRect(), PE = dance.frame.contentWindow.PointerEvent; cv.setPointerCapture = cv.releasePointerCapture = () => {};
            const o = { clientX: r.left + h.uv.x * r.width, clientY: r.top + (1 - h.uv.y) * r.height, bubbles: true, pointerId: 1, isPrimary: true, button: 0 };
            cv.dispatchEvent(new PE('pointerdown', o)); cv.dispatchEvent(new PE('pointerup', o)); window.__neuralDance.taps = (window.__neuralDance.taps || 0) + 1; } catch (err) { console.warn('[neural-dance] tap', err); } } } }, true); }
    mm = createMinimap({ rooms: W.rooms, doors: hooks.doors, checkout: { x: 0, z: 0, width: 3.2 }, getPlayer: () => game.player(), key: 'n' }); // #323: the checkout fountain is marked on the minimap
    if (MUSEUM.plainCourts) { const g = new THREE.Mesh(new THREE.CircleGeometry(60, 48), new THREE.MeshStandardMaterial({ color: 0x5f8f45, roughness: 1, metalness: 0 })); g.rotation.x = -Math.PI / 2; g.position.set(-8, 0.002, 8); g.name = 'lawn284'; scene.add(g); } // #284: plain green courts (under the room floors and the pavilion marble)
    stub.parent && stub.parent.remove(stub); // garden module replaces the stand-in fountains and beds
    const domes = buildDomes(hooks), gd = MUSEUM.plainCourts ? { group: null, fountains: [] } : buildGarden(hooks); /* #284: plain green courts: no trees, beds, ivy, fountains */ for (const m of [domes, gd]) if (m.group && !m.group.parent) scene.add(m.group); garden = { domes, garden: gd }; hooks.garden = garden;
    try { c296 = installCourtyard296({ game, W, root, low: LOW, T }); } catch (e) { console.warn('[c296]', e); window.__c296 = Object.assign(window.__c296 || {}, { err: String(e) }); }
    hooks.allColliders = () => W.colliders.map(c => ({ x: c.x, z: c.z, r: c.r, kind: c.kind }));
    const sound = gd.sound || createFountainSound(MUSEUM.plainCourts ? T.courtyards.map(c => ({ x: c.center[0], z: c.center[1], r: 1 })) /* soft courtyard ambience, so mute still has something to silence */ : gd.fountains || [], () => !!(game.holo && game.holo.muted)); hooks.sound = sound;
    const go = () => { try { sound.start(); } catch (e) {} removeEventListener('pointerdown', go); removeEventListener('touchstart', go); }; // only from a user tap
    addEventListener('pointerdown', go); addEventListener('touchstart', go, { passive: true }); compileFirst(game); }
  // museum-eggs places props from rectangular-room doors; on hex rooms, move any egg that landed in a doorway or on a walk lane
  const moved = new WeakSet(); report.eggsMoved = [];
  // #269: eggs (e.g. the money printer) keep clear of doors, paths, walls and a deep (3 m) viewing zone in front of every work
  const viewDeep = (x, z, r) => W.art.some(a => { const tx = a.iz, tz = -a.ix, u = (x - a.x) * tx + (z - a.z) * tz, v = (x - a.x) * a.ix + (z - a.z) * a.iz; return Math.abs(u) < (a.w || 1) / 2 + 0.4 + r && v > -0.05 && v < 3 + r; });
  const nearWall = (x, z, r) => W.walls.some(w => segDist(x, z, w.x0, w.z0, w.x1, w.z1) < r + 0.25);
  const eggClear = (x, z, r) => W.keepClear(x, z, r) && !viewDeep(x, z, r) && !nearWall(x, z, r) && !(MUSEUM.salon && blocksSight(x, z, r)); // #284: smaller rooms: keep egg props off the sightlines from the room centre too
  // #280: the Bitcoin artefacts (Satoshi's desk, the Pizza Day case, the Don't-trust-verify coin, the money printer) live in and beside the Bitcoin room
  const BTC = ['egg-satoshi', 'egg-pizza', 'egg-coin', 'egg-printer'], BTC_ROOMS = ['room-02', 'room-10', 'room-07'], btcDone = new Set();
  function homeBitcoin() { const placed = []; for (const name of BTC) { const o = scene.getObjectByName(name); if (!o || btcDone.has(name)) continue; const bb = new THREE.Box3().setFromObject(o); if (bb.isEmpty()) continue;
      const c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3()), r = Math.max(sz.x, sz.z) / 2; let best = null;
      for (const id of (name === 'egg-pizza' ? ['room-07'] /* TJ: the big-corner Bitcoin room, never the lawn */ : BTC_ROOMS)) { const rm = W.rooms.find(q => q.id === id); if (!rm || best) continue; const cur = W.roomAt(c.x, c.z); if (cur && cur.id === id && eggClear(c.x, c.z, r)) { best = [c.x, c.z]; break; }
        for (let k = (name === 'egg-pizza' ? -3 : 0); k < 14 && !best; k++) for (let a = 0; a < 24; a++) { const rr = rm.radius * Math.max(0, 0.15 + 0.05 * k), x = rm.center[0] + Math.cos(a / 24 * 6.283) * rr, z = rm.center[1] + Math.sin(a / 24 * 6.283) * rr;
          if (W.roomAt(x, z)?.id === id && W.walkable(x, z) && (name === 'egg-pizza' ? (W.keepClear(x, z, r + 0.15) && !viewDeep(x, z, r + 0.15) && !nearWall(x, z, r)) /* #288: inside the big Bitcoin room, out of every work's viewing zone */ : eggClear(x, z, r + 0.15)) && !placed.some(([px, pz, pr]) => Math.hypot(px - x, pz - z) < pr + r + 0.9)) { best = [x, z]; break; } } }
      if (!best) continue; btcDone.add(name); placed.push([best[0], best[1], r]); const dx = best[0] - c.x, dz = best[1] - c.z; if (Math.hypot(dx, dz) < 0.01) continue; o.position.x += dx; o.position.z += dz; (report.bitcoinHomed = report.bitcoinHomed || []).push([name, W.roomAt(best[0], best[1])?.id]);
      const EW = window.eggs && window.eggs.world; if (EW && EW.colliders) for (const q of [...EW.colliders]) if (!q.off && Math.hypot(q.x - c.x, q.z - c.z) < r + 0.6) { q.off = true; EW.addCollider({ ...q, off: false, x: q.x + dx, z: q.z + dz }); } } }
  window.__tagsBitcoin = () => BTC.map(n => { const o = scene.getObjectByName(n); if (!o) return [n, null]; const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()); return [n, W.roomAt(c.x, c.z)?.id || null, +c.x.toFixed(1), +c.z.toFixed(1)]; });
  function clearEggs() { homeBitcoin(); report.eggPasses = (report.eggPasses || 0) + 1; const extra = []; if (window.eggs) for (const k in window.eggs) { const g = window.eggs[k] && window.eggs[k].group; if (g && g.parent && k !== 'secret' && !/^egg-/.test(g.name || '') && !window.eggs[k].moving) extra.push(g); }
    for (const o of [...scene.children, ...extra]) { if (!(extra.includes(o) || /^egg-/.test(o.name || '')) || moved.has(o) || /^egg-(banana|drone|ostrich|elf)/.test(o.name || '')) continue; /* #282: wall-mounted and moving eggs keep their own anchors */ const bb = new THREE.Box3().setFromObject(o); if (bb.isEmpty() || bb.min.y > 2.4) continue;
      const c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3()), r = Math.max(sz.x, sz.z) / 2;
      if (!eggClear(c.x, c.z, r)) { let best = null; for (let k = 1; k < 80 && !best; k++) for (let a = 0; a < 12; a++) { const x = c.x + Math.cos(a / 12 * 6.283) * k * 0.25, z = c.z + Math.sin(a / 12 * 6.283) * k * 0.25;
          if (eggClear(x, z, r + 0.1) && W.walkable(x, z) && (k > 40 || W.roomAt(x, z)?.id === W.roomAt(c.x, c.z)?.id)) { best = [x, z]; break; } }
        if (best) { const dx = best[0] - c.x, dz = best[1] - c.z; o.position.x += dx; o.position.z += dz; report.eggsMoved.push(o.name);
          const EW = window.eggs && window.eggs.world; if (EW && EW.colliders) for (const q of [...EW.colliders]) if (!q.off && Math.hypot(q.x - c.x, q.z - c.z) < r + 0.6) { q.off = true; EW.addCollider({ ...q, off: false, x: q.x + dx, z: q.z + dz }); } } /* its collider moves with it */ else moved.add(o); } } }
  const fitted = new WeakMap();
  function fitAll() { const g = window.game; if (!g || !g.paintings) return; for (const q of g.paintings) { const t = q.mesh.material.map, im = t && t.image; if (!im || !im.width || fitted.get(q) === t) continue; fitted.set(q, t);
      const d = q.data, ia = im.width / im.height, la = d.iw / d.ih; let w = d.iw, h = d.ih; if (ia > la) h = d.iw / ia; else w = d.ih * ia; q.mesh.scale.set(w, h, 1);
      if (Math.abs(ia / (d.w / d.h) - 1) > 0.035) (report.fitLate = report.fitLate || []).includes(d.id) || report.fitLate.push(d.id); } }
  let fitT = 0;
  function update(dt, cam, opts = {}) { if (wallMap) wallMap.update(dt); if (testiMap) testiMap.update(dt); if (frames) frames.update(dt); { const tt = performance.now() / 1000; const cp = window.game && game.camera ? game.camera.position : null; FOUNTAIN.update(tt, cp); if (c296) c296.update(dt, cp); } if ((fitT -= dt) < 0) { fitT = 0.5; fitAll(); if (window.eggs) clearEggs(); } drawDance(dt, cam); for (const j of jets) j.scale.y = 0.85 + 0.15 * Math.sin(performance.now() / 180 + j.position.x); if (mm) mm.update(); if (garden && garden.garden.update && window.game && game.player) garden.garden.update(dt, game.player()); checkGates(cam, opts); }
  window.__tagsEggClear = eggClear;
  // #272: compile every shader in parallel (KHR_parallel_shader_compile) before the first scene frame; the core skips the scene
  // render while holding (the start screen and its progress bar stay live). Capped at 8 s so a slow driver can never hang it.
  // #272 second pass: without that extension (most phones, the low tier) compileAsync is one long blocking compile of every
  // program. There we do not hold: the first frame compiles only what is in view, and the rest is prewarmed a few materials
  // per idle slice (visibility-masked renderer.compile), so no single task carries the whole shader set.
  function prewarm(game) { const r = game.renderer, cam = game.camera; if (!r || !cam || !r.compile) return; const seen = new Set(), reps = [];
    scene.traverse(o => { if (!o.isMesh && !o.isPoints && !o.isLine) return; for (const m of [].concat(o.material || [])) { const k = m.uuid + (o.isInstancedMesh ? 'i' : '') + (o.isSkinnedMesh ? 's' : ''); if (!seen.has(k)) { seen.add(k); reps.push(o); } } });
    const all = []; scene.traverse(o => all.push(o)); let i = 0; const t0 = performance.now(); window.__tagsPrewarm = { total: reps.length, done: 0 };
    const step = () => { if (i >= reps.length) { window.__tagsPrewarm.ms = Math.round(performance.now() - t0); return; } const batch = reps.slice(i, i + 3); i += 3;
      const vis = all.map(o => [o, o.visible]); for (const o of all) o.visible = false; for (const o of batch) for (let q = o; q; q = q.parent) q.visible = true;
      try { r.compile(scene, cam); } catch (e) {} for (const [o, v] of vis) o.visible = v; window.__tagsPrewarm.done = Math.min(i, reps.length);
      (window.requestIdleCallback || (cb => setTimeout(cb, 16)))(step, { timeout: 120 }); };
    afterPlayable(() => setTimeout(step, 1500)); } // only after the first playable frame
  let hold = false; function compileFirst(game) { const r = game.renderer, cam = game.camera; if (!r || !cam || !r.compileAsync) return;
    const par = r.extensions && r.extensions.has && r.extensions.has('KHR_parallel_shader_compile'); if (!par && LOW) { prewarm(game); return; } hold = true; const t0 = performance.now();
    const done = () => { if (!hold) return; hold = false; window.__tagsCompileMs = Math.round(performance.now() - t0); }; r.compileAsync(scene, cam).then(done, done); setTimeout(done, 8000); }
  return { holding: () => hold || !!window.__auditNoRender, compileFirst, W, PIT, NAVE, NAVE_SIGNS, CHK, GATE, ROOMS_UI, roomAt, walkable: W.walkable, buildGates: () => { gatesBuilt = buildGates(); hooks.niches = gatesBuilt; hooks.gates = []; }, finish, update, hooks, tier };
}
