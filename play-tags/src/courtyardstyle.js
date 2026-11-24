// #295 (TJ, preview): courtyard dressed as a sunrise. Visual's sunburst mosaic floor (strong terracotta rays aimed at this layout's real door rays),
// retinted walkways, and subtle pastel sunrise exteriors on every building (one palette colour per room), with Visual's sunburst arch over each
// entrance and a Dusk Slate lintel with a gilded reveal. Phone-light: one floor disc, building skins merged into one mesh per colour.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { installOverlays303 } from './overlays303.js'; // #303
const BASE = import.meta.env.BASE_URL + 'img/play/preview-295/'; // R2 tjm-images via the /img/ proxy
const PAL = ['#F3E6D8', '#F7A66E', '#E9A9A6', '#9DB7CF', '#F48A5C', '#8FAE9E'], CREAM = new THREE.Color('#F3E6D8');
export function installCourtyardStyle({ game, W, root, low }) {
  const S = window.__c295 = { floor: null, skins: 0, colours: {}, arches: 0, lintels: 0, rays: W.rays.length };
  const loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
  // ---- floor: sunburst mosaic disc under the room floors, soft edge into the lawn
  const R = 27, fadeC = document.createElement('canvas'); fadeC.width = fadeC.height = 128; { const g = fadeC.getContext('2d'), rg = g.createRadialGradient(64, 64, 64 * 0.74, 64, 64, 64); rg.addColorStop(0, '#fff'); rg.addColorStop(1, '#000'); g.fillStyle = '#000'; g.fillRect(0, 0, 128, 128); g.fillStyle = rg; g.fillRect(0, 0, 128, 128); }
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, transparent: true, depthWrite: false, alphaMap: new THREE.CanvasTexture(fadeC) });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(R, 96), mat); disc.rotation.x = -Math.PI / 2; disc.position.set(0, 0.003, 0); disc.name = 'sunburstFloor'; disc.renderOrder = -1; root.add(disc);
  loader.load(BASE + `sunburst-295-${low ? 1024 : 2048}.webp`, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = low ? 2 : 8; mat.map = t; mat.needsUpdate = true; S.floor = { px: t.image.width, radius: R, doorRays: W.rays.length }; }, undefined, () => { S.floor = { err: 'texture failed' }; });
  const marble = root.getObjectByName('marbleCore'); if (marble) marble.visible = false; // the sunburst replaces the plain marble centre
  // ---- walkways in sunrise coral so they read as the strong rays
  root.traverse(o => { if (o.name === 'walkRay' && o.material) { o.material.color.set('#e39a78'); S.rayTint = (S.rayTint || 0) + 1; } });
  // ---- exteriors
  const wallH = 4.2, byCol = new Map(), roomIdx = new Map(); W.rooms.filter(r => r.kind === 'room').forEach((r, i) => roomIdx.set(r.id, i));
  const pastel = hex => new THREE.Color(hex).lerp(CREAM, hex === '#F3E6D8' ? 0 : 0.34).getHex();
  const colOf = id => PAL[((roomIdx.get(id) || 0) * 5 + 1) % PAL.length]; // spreads the six colours round the ring
  const add = (hex, g) => { if (!byCol.has(hex)) byCol.set(hex, []); byCol.get(hex).push(g); };
  const place = (g, cx, cz, nx, nz, y) => { g.rotateY(Math.atan2(nx, nz)); g.translate(cx, y, cz); return g; };
  for (const q of W.walls) { if (q.free || !/^room-/.test(q.room)) continue; const r = W.rooms.find(x => x.id === q.room); if (!r) continue; const L = Math.hypot(q.x1 - q.x0, q.z1 - q.z0); if (L < 0.2) continue;
    const mx = (q.x0 + q.x1) / 2, mz = (q.z0 + q.z1) / 2; let nx = q.nx, nz = q.nz; if (nx * (mx - r.center[0]) + nz * (mz - r.center[1]) < 0) { nx = -nx; nz = -nz; }
    const o = W.roomAt && W.roomAt(mx + nx * 1.2, mz + nz * 1.2); if (o && o.kind === 'room') continue; // shared wall: inside the neighbour
    add(colOf(q.room), place(new THREE.PlaneGeometry(L, wallH), mx + nx * 0.03, mz + nz * 0.03, nx, nz, wallH / 2)); S.skins++; }
  const arches = [], lintels = [], gild = [];
  for (const d of W.doors.filter(d => d.kind === 'inner' || d.kind === 'outer')) { const r = W.rooms.find(q => q.id === d.room); if (!r) continue; let ox = d.x - r.center[0], oz = d.z - r.center[1]; const m = Math.hypot(ox, oz) || 1; ox /= m; oz /= m;
    // #300: round-arched doorways. Skin over the arch = rectangle minus the semicircle; slate ring + gilded reveal hug the opening; Visual's sunburst fanlight band rings the arch.
    const w2 = d.width / 2, sp = d.spring ?? 2.4, seg = low ? 20 : 40, ky782 = d.rise ? d.rise / w2 : 1; /* #782 elliptical on full-width doors */
    const spand = new THREE.Shape(); spand.moveTo(-w2, sp); spand.absellipse(0, sp, w2, w2 * ky782, Math.PI, 0, true); spand.lineTo(w2, wallH); spand.lineTo(-w2, wallH); spand.closePath();
    add(colOf(d.room), place(new THREE.ShapeGeometry(spand, seg), d.x + ox * 0.03, d.z + oz * 0.03, ox, oz, 0)); // skin above the arch
    const band = (ri, ro) => { const g = new THREE.RingGeometry(ri, ro, seg, 1, 0, Math.PI), P = g.attributes.position, U = g.attributes.uv; for (let i = 0; i < P.count; i++) U.setXY(i, P.getX(i) / ro * 0.5 + 0.5, P.getY(i) / ro); return g; }; // planar UV: the 2:1 half-disc motif
    const fan = band(w2 + 0.04, w2 + 0.55); fan.scale(1, ky782, 1); fan.translate(0, sp, 0); arches.push(place(fan, d.x + ox * 0.045, d.z + oz * 0.045, ox, oz, 0)); S.arches++;
    const slate = new THREE.RingGeometry(w2, w2 + 0.04, seg, 1, 0, Math.PI); slate.scale(1, ky782, 1); slate.translate(0, sp, 0); lintels.push(place(slate, d.x + ox * 0.06, d.z + oz * 0.06, ox, oz, 0)); S.lintels++;
    for (const sd of [-1, 1]) { const j = new THREE.PlaneGeometry(0.04, sp); j.translate(sd * (w2 + 0.02), sp / 2, 0); lintels.push(place(j, d.x + ox * 0.06, d.z + oz * 0.06, ox, oz, 0)); }
    const gl = new THREE.RingGeometry(w2 - 0.035, w2, seg, 1, 0, Math.PI); gl.scale(1, ky782, 1); gl.translate(0, sp, 0); gild.push(place(gl, d.x + ox * 0.075, d.z + oz * 0.075, ox, oz, 0)); }
  const skins = new THREE.Group(); skins.name = 'sunriseSkins';
  for (const [hex, gs] of byCol) { const m = new THREE.Mesh(mergeGeometries(gs), new THREE.MeshStandardMaterial({ color: pastel(hex), roughness: 0.92, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.name = 'skin-' + hex; skins.add(m); S.colours[hex] = gs.length; }
  if (lintels.length) { const m = new THREE.Mesh(mergeGeometries(lintels), new THREE.MeshStandardMaterial({ color: 0x5e7289, roughness: 0.8, side: THREE.DoubleSide })); m.name = 'doorSurrounds'; skins.add(m); }
  if (gild.length) { const m = new THREE.Mesh(mergeGeometries(gild), new THREE.MeshStandardMaterial({ color: 0xf7cc3a, roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide })); m.name = 'doorReveal'; skins.add(m); }
  if (arches.length) { const am = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, toneMapped: false }); const m = new THREE.Mesh(mergeGeometries(arches), am); m.name = 'sunburstArches'; skins.add(m);
    loader.load(BASE + 'trim-motif.webp', t => { t.colorSpace = THREE.SRGBColorSpace; am.map = t; am.needsUpdate = true; }, undefined, () => { S.archErr = true; }); }
  root.add(skins);
  try { S.o303 = installOverlays303({ root, low }); } catch (e) { console.warn('[o303]', e); window.__o303 = { err: String(e) }; }
  return S;
}
