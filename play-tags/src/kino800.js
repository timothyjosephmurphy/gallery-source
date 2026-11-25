// #800 (TJ Oct 27 2026): Kinoteka, reached through the Paul Murphy market. Plaza, steps up (1.2 m) to a four-column portico and the
// KINOTEKA door, the Palace of Culture and Science massing + tower behind; inside a socrealist screening hall with theatre seating and a
// screen that auto-plays "Coined in Watercolor" (TJ's film, 15 x 48 s mp4 chunks on img.tjm.art, chained on two <video> elements).
// Original procedural geometry; stone texture cropped from TJ's ref photos (public/kino800/ashlar.webp). Data: openCourts[kinoteka].kino800.
import * as THREE from 'three';
import { goldSignMesh } from './signs818.js'; // #818
import { installKiosk813 } from './kinoKiosk813.js'; // #813 BFF'26 film kiosk
export function installKino800(root, T, low) {
  const oc = (T.openCourts || []).find(o => o.kino800); if (!oc) return { skipped: 1 };
  const K = oc.kino800, D = K.D, F = K.f, U = K.t, S = { inside: false, playing: false, chunk: 0, err: null, enters: 0 };
  const uv = (x, z) => { const dx = x - D[0], dz = z - D[1]; return [dx * U[0] + dz * U[1], dx * F[0] + dz * F[1]]; };
  // floor: ramp up the steps, raised landing + hall (read by gallery-core floorH via window.__floorH800)
  // Annex balcony (u -5.9..-9.6) is at hall height, matching the live 899 kino800 hook so /play/?room=neural-dance stands on the balcony.
  window.__floorH800 = (x, z) => { const [u, v] = uv(x, z);
    if (u < -5.9 && u > -9.6 && v > 7.2 && v < 31.8) return K.rise;
    if (v < 7 || v > 25.2 || Math.abs(u) > 6.2) return null;
    if (v < 9.6) return Math.abs(u) <= 3.6 ? K.rise * (v - 7) / 2.6 : null; if (v < 11 && Math.abs(u) > 3.6) return null; return K.rise; };
  const G = new THREE.Group(); G.name = 'kino800'; G.position.set(D[0], 0, D[1]); G.rotation.y = Math.atan2(F[0], F[1]); root.add(G); // local x = u, z = v
  const TL = new THREE.TextureLoader(), ash = TL.load(K.film.base + 'ashlar.webp'); ash.colorSpace = THREE.SRGBColorSpace; ash.wrapS = ash.wrapT = THREE.MirroredRepeatWrapping;
  const box = new THREE.BoxGeometry(1, 1, 1), mats = new Map();
  const stone = (rx, ry, tint = 0xffffff) => { const k = rx.toFixed(1) + ':' + ry.toFixed(1) + ':' + tint; if (!mats.has(k)) { const t = ash.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); mats.set(k, new THREE.MeshStandardMaterial({ map: t, color: tint, roughness: 0.9 })); } return mats.get(k); };
  const add = (mat, sx, sy, sz, x, y, z, g = G) => { const m = new THREE.Mesh(box, mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); g.add(m); return m; };
  const sbox = (sx, sy, sz, x, y, z, tint) => add(stone(Math.max(1, Math.round(Math.max(sx, sz) / 1.6)), Math.max(1, Math.round(sy / 1.6)), tint), sx, sy, sz, x, y, z);
  const M = (c, r = 0.8, m = 0, e) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...(e ? { emissive: e, emissiveIntensity: 1 } : {}) });
  const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  // ---- plaza paving
  const pave = cv(256, 256, (x, w, h) => { x.fillStyle = '#a49c90'; x.fillRect(0, 0, w, h); x.strokeStyle = '#7d766c'; x.lineWidth = 2; for (let i = 0; i <= 256; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); } });
  pave.wrapS = pave.wrapT = THREE.RepeatWrapping; pave.repeat.set(9 / 2.4, 7 / 2.4);
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(9, 7.1), new THREE.MeshStandardMaterial({ map: pave, roughness: 0.95 })); pl.rotation.x = -Math.PI / 2; pl.position.set(0, 0.012, 3.55); G.add(pl);
  for (const s of [-1, 1]) { sbox(0.3, 1.1, 7, s * 4.6, 0.55, 3.5); } // low plaza parapets on the collision lines
  // ---- steps + landing + cheeks with lamp posts (ref: kinoteka-entrance)
  const N = 8, rise = K.rise / N, run = 2.6 / N, stepM = stone(4, 1, 0xd8d2c6);
  for (let i = 0; i < N; i++) add(stepM, 7.2, rise * (i + 1), run + 0.02, 0, rise * (i + 1) / 2, 7 + run * (i + 0.5));
  add(stepM, 7.2, K.rise, 1.45, 0, K.rise / 2, 10.3);
  const lampM = M(0x1d1d1d, 0.5, 0.6), globe = M(0xf6f1e6, 0.4, 0, 0xfff0d0);
  for (const s of [-1, 1]) { sbox(0.5, K.rise + 0.35, 4.1, s * 3.75, (K.rise + 0.35) / 2, 9.0);
    const lx = s * 3.75, lz = 7.4; add(lampM, 0.12, 2.6, 0.12, lx, 1.55 + 1.3 - 0.2, lz); for (const o of [-0.28, 0, 0.28]) { const gl = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), globe); gl.position.set(lx + o, 3.95 + (o ? 0 : 0.25), lz); G.add(gl); } add(lampM, 0.62, 0.04, 0.05, lx, 3.8, lz); }
  // ---- portico: 4 columns, entablature with KINOTEKA, pediment block (ref: kinoteka-entrance / kinoteka-detail)
  const colM = M(0xe9e4da, 0.75), CH = 6.2, y0 = K.rise;
  for (const c of K.cols) { const [u, v] = uv(c.at[0], c.at[1]); const col = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.3, CH, low ? 12 : 20), colM); col.position.set(u, y0 + CH / 2, v); G.add(col);
    add(colM, 0.75, 0.25, 0.75, u, y0 + 0.12, v); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.28, 0.5, low ? 8 : 16), colM); cap.position.set(u, y0 + CH - 0.15, v); G.add(cap); add(colM, 0.92, 0.12, 0.92, u, y0 + CH + 0.1, v); }
  const ent = cv(1024, 128, (x, w, h) => { x.fillStyle = '#3a2a18'; x.fillRect(0, 0, w, h); x.fillStyle = '#c9a24a'; x.fillRect(0, 6, w, 4); x.fillRect(0, h - 10, w, 4); /* #818 dark band, gold lettering is an overlay */ });
  const entM = [stone(4, 1, 0xe2dccf), stone(4, 1, 0xe2dccf), stone(4, 1, 0xe2dccf), stone(4, 1, 0xe2dccf), stone(4, 1, 0xe2dccf), new THREE.MeshStandardMaterial({ map: ent, roughness: 0.9 })];
  const E = new THREE.Mesh(box, entM); E.scale.set(7.6, 1.15, 1.7); E.position.set(0, y0 + CH + 0.75, 10.2); E.rotation.y = Math.PI; G.add(E); for (const sd of [-1, 1]) { const q = goldSignMesh('KINOTEKA', 6.6, 0.82); q.position.set(0, y0 + CH + 0.75, 10.2 + sd * 0.87); q.rotation.y = sd < 0 ? Math.PI : 0; q.name = 'kinoLintel818'; G.add(q); } /* #818 gold entrance-sign lettering on both lintel faces */ { const bt = TL.load(import.meta.env.BASE_URL + 'kino800/bff-banner-842.webp'); bt.colorSpace = THREE.SRGBColorSpace; const bw = 4.0, bh = 2.25, by = y0 + CH + 0.75 - 0.575 - 0.06 - bh / 2, bz = 10.2 - 0.87 - 0.04; const bn = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.MeshBasicMaterial({ map: bt, toneMapped: false })); bn.position.set(0, by, bz); bn.rotation.y = Math.PI; bn.name = 'bffBanner842'; bn.userData.decor800 = true; G.add(bn); const rod = add(M(0xc9a34a, 0.35, 0.8), bw + 0.2, 0.05, 0.05, 0, by + bh / 2 + 0.03, bz); rod.name = 'bffBanner842rod'; } /* #842 official BFF banner (presskit bff27-poster-horizontal) under the KINOTEKA lintel, plaza face, above the door */ // text face (+z local of box) turned toward the plaza
  sbox(8.0, 0.3, 1.9, 0, y0 + CH + 1.45, 10.2, 0xd8d2c6); // cornice
  for (const r of [0]) for (const s of [-1.6, 0, 1.6]) add(M(0x2b3a40, 0.3, 0.4), 1.0, 1.3, 0.05, s, y0 + CH + 3.0 + r * 0, 10.98); // windows above the portico
  // ---- PKiN body: tier 1 holds the hall; front face cut for the door
  const winT = (cols, rows) => { const t = cv(256, 256, (x, w, h) => { x.drawImage(ash.image || document.createElement('canvas'), 0, 0, w, h); }); return t; };
  const facade = cv(256, 256, (x, w, h) => { x.fillStyle = '#cbbfa8'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i < 256; i += 16) x.fillRect(0, i, 256, 1); x.fillStyle = '#c7bda9'; x.fillRect(0, 0, 40, 256); x.fillRect(216, 0, 40, 256); x.fillStyle = '#2a3236'; for (const yy of [40, 168]) { x.fillRect(72, yy, 44, 70); x.fillRect(140, yy, 44, 70); } });
  facade.wrapS = facade.wrapT = THREE.RepeatWrapping; void winT;
  const fm = (rx, ry) => { const t = facade.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.92 }); };
  const tier = (hw, v0, v1, ya, yb, fr = 2.6) => { const m = fm(Math.round(2 * hw / fr), Math.round((yb - ya) / 3.4)), ms = fm(Math.round((v1 - v0) / fr), Math.round((yb - ya) / 3.4)), top = stone(4, 4, 0xbdb3a2);
    const b = new THREE.Mesh(box, [ms, ms, top, top, m, m]); b.scale.set(2 * hw, yb - ya, v1 - v0); b.position.set(0, (ya + yb) / 2, (v0 + v1) / 2); G.add(b); sbox(2 * hw + 0.6, 0.45, v1 - v0 + 0.6, 0, yb - 0.1, (v0 + v1) / 2, 0xd0c7b6); return b; };
  const H1 = 15;
  { const m = fm(4, 4); const front = (w, h, x, y) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m.clone()); p.material.map = facade.clone(); p.material.map.needsUpdate = true; p.material.map.repeat.set(Math.max(1, Math.round(w / 2.6)), Math.max(1, Math.round(h / 3.4))); p.position.set(x, y, 11); p.rotation.y = Math.PI; G.add(p); };
    front(11.9, H1, -7.05, H1 / 2); front(11.9, H1, 7.05, H1 / 2); front(2.2, H1 - 4.6, 0, 4.6 + (H1 - 4.6) / 2); front(2.2, 1.2, 0, 0.6);
    const ms = fm(7, 4), side = (s) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(19, H1), ms); p.position.set(s * 13, H1 / 2, 20.5); p.rotation.y = s * Math.PI / 2; G.add(p); }; side(-1); side(1);
    const bk = new THREE.Mesh(new THREE.PlaneGeometry(26, H1), fm(10, 4)); bk.position.set(0, H1 / 2, 30); G.add(bk); sbox(26.6, 0.5, 19.6, 0, H1 - 0.1, 20.5, 0xd0c7b6);
    /* #801 (TJ): interior bronze door frame + leaves removed; open doorway */ }
  tier(9, 13, 28, H1, 27); tier(6, 15, 26, 27, 50); tier(4.6, 16.2, 24.8, 50, 58); tier(3.4, 17.4, 23.6, 58, 64);
  // clock faces + lantern + spire
  const clk = cv(128, 128, (x) => { x.fillStyle = '#efe9da'; x.beginPath(); x.arc(64, 64, 60, 0, 7); x.fill(); x.strokeStyle = '#333'; x.lineWidth = 4; x.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; x.fillStyle = '#333'; x.fillRect(64 + Math.cos(a) * 50 - 3, 64 + Math.sin(a) * 50 - 3, 6, 6); } x.lineWidth = 5; x.beginPath(); x.moveTo(64, 64); x.lineTo(64, 24); x.moveTo(64, 64); x.lineTo(92, 70); x.stroke(); });
  const cm = new THREE.MeshBasicMaterial({ map: clk, transparent: true, toneMapped: false });
  for (const [x, z, r] of [[0, 17.35, Math.PI], [0, 23.65, 0], [-3.45, 20.5, -Math.PI / 2], [3.45, 20.5, Math.PI / 2]]) { const c = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), cm); c.position.set(x, 61.6, z); c.rotation.y = r; G.add(c); }
  const lan = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 5, 12), stone(6, 2, 0xc9bfac)); lan.position.set(0, 66.5, 20.5); G.add(lan);
  const sp = new THREE.Mesh(new THREE.ConeGeometry(1.5, 22, 12), M(0x9a8a6a, 0.45, 0.55)); sp.position.set(0, 80, 20.5); G.add(sp);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8), M(0xc9a34a, 0.3, 0.9)); ball.position.set(0, 71.8, 20.5); G.add(ball);
  if (!low) { const pin = (x, y, z, h) => { sbox(0.8, h * 0.5, 0.8, x, y + h * 0.25, z, 0xd5ccba); const c = new THREE.Mesh(new THREE.ConeGeometry(0.4, h * 0.5, 6), stone(1, 1, 0xd5ccba)); c.position.set(x, y + h * 0.75, z); G.add(c); };
    for (const [hw, v0, v1, y, h] of [[13, 11, 30, H1, 2.6], [9, 13, 28, 27, 3.2], [6, 15, 26, 50, 3], [4.6, 16.2, 24.8, 58, 2.4]]) for (const sx of [-1, 1]) for (const vz of [v0, v1]) pin(sx * (hw - 0.3), y, vz + (vz === v0 ? 0.3 : -0.3), h);
    for (const sx of [-1, 1]) sbox(1.6, 3.2, 1.0, sx * 4.2, H1 + 1.6, 11.6, 0xd5ccba); } // attic urns flanking the front (ref: kinoteka-detail)
  // ---- hall interior (u +-6, v 11..25, floor 1.2, ceiling 8.7)
  const I = new THREE.Group(); I.name = 'kino800-hall'; G.add(I); const fy = K.rise, CY = fy + 7.5;
  const carpet = M(0x5a1418, 0.95), wood = M(0x5b3a22, 0.6), cream = M(0xe7dcc4, 0.85), gold = M(0xb8923a, 0.35, 0.8), velvet = M(0x8e1b20, 0.9);
  add(carpet, 12, 0.02, 14, 0, fy + 0.01, 18, I);
  const coff = cv(256, 256, (x) => { x.fillStyle = '#d9cdb1'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#b9a984'; x.fillRect(24, 24, 208, 208); x.fillStyle = '#e4d9bf'; x.fillRect(44, 44, 168, 168); x.strokeStyle = '#b8923a'; x.lineWidth = 4; x.strokeRect(60, 60, 136, 136); });
  coff.wrapS = coff.wrapT = THREE.RepeatWrapping; coff.repeat.set(6, 7); const ceil = new THREE.Mesh(new THREE.PlaneGeometry(12, 14), new THREE.MeshStandardMaterial({ map: coff, roughness: 0.9 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, CY, 18); I.add(ceil);
  const wall = (w, x, z, ry) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, 7.5), cream); p.position.set(x, fy + 3.75, z); p.rotation.y = ry; I.add(p); const wp = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.5), wood); wp.position.set(x, fy + 0.75, z); wp.position.x += Math.sin(ry) * 0.02; wp.position.z += Math.cos(ry) * 0.02; wp.rotation.y = ry; I.add(wp); };
  wall(14, -5.98, 18, Math.PI / 2); wall(14, 5.98, 18, -Math.PI / 2); wall(12, 0, 24.98, Math.PI); wall(4.9, -3.55, 11.05, 0); wall(4.9, 3.55, 11.05, 0); { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.0), cream); p.position.set(0, fy + 5.5, 11.05); I.add(p); }
  for (const s of [-1, 1]) for (let v = 12.4; v < 24.5; v += 2.3) { add(cream, 0.35, 7.3, 0.5, s * 5.82, fy + 3.65, v, I); add(gold, 0.45, 0.25, 0.6, s * 5.8, fy + 7.1, v, I); add(wood, 0.4, 1.6, 0.55, s * 5.82, fy + 0.8, v, I); }
  for (const s of [-1, 1]) add(gold, 0.1, 0.18, 14, s * 5.9, CY - 0.2, 18, I); add(gold, 12, 0.18, 0.1, 0, CY - 0.2, 24.9, I);
  // sconces + 2 chandeliers (emissive) and one warm light
  const glow = M(0xfff1d6, 0.4, 0, 0xffe2b0);
  for (const s of [-1, 1]) for (let v = 13.55; v < 24; v += 4.6) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), glow); b.position.set(s * 5.6, fy + 3.2, v); I.add(b); add(gold, 0.1, 0.4, 0.1, s * 5.75, fy + 3.0, v, I); }
  for (const v of [14.5, 19.5]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.05, 6, 24), gold); ring.rotation.x = Math.PI / 2; ring.position.set(0, CY - 1.4, v); I.add(ring); add(gold, 0.04, 1.2, 0.04, 0, CY - 0.7, v, I); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283, b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), glow); b.position.set(Math.cos(a) * 0.8, CY - 1.3, v + Math.sin(a) * 0.8); I.add(b); } }
  const pt = new THREE.PointLight(0xffe0b8, 18, 18, 1.6); pt.position.set(0, CY - 1.8, 16); I.add(pt);
  // #801 (TJ): house lights go down while the film plays (smooth fade), come back up when it stops. Visual only.
  const dimMats = [carpet, wood, cream, gold, velvet, ceil.material].map(m => [m, m.color.clone()]), dimK = { k: 1 };
  const setDim = k => { pt.intensity = 18 * k; glow.emissiveIntensity = 0.08 + 0.92 * k; const c = 0.22 + 0.78 * k; for (const [m, b] of dimMats) m.color.copy(b).multiplyScalar(c); };
  // proscenium + curtains + screen
  add(gold, 10.4, 0.5, 0.3, 0, fy + 6.6, 24.75, I); for (const s of [-1, 1]) add(gold, 0.5, 6.2, 0.3, s * 5.0, fy + 3.3, 24.75, I);
  add(M(0x101010, 0.9), 9.6, 5.6, 0.05, 0, fy + 3.45, 24.9, I); add(wood, 10.4, 0.8, 1.2, 0, fy + 0.4, 24.3, I);
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 6.0, 8), velvet); c.position.set(s * (4.75 - k * 0.2), fy + 3.4, 24.6); I.add(c); }
  const poster = TL.load(K.film.base + K.film.poster); poster.colorSpace = THREE.SRGBColorSpace;
  const scrM = new THREE.MeshBasicMaterial({ map: poster, toneMapped: false }); const SW = 8.8, SH = SW * 9 / 16;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), scrM); scr.position.set(0, fy + 3.45, 24.86); scr.rotation.y = Math.PI; scr.name = 'kino800-screen'; I.add(scr);
  // theatre seating: 8 rows x 13 red velvet seats, facing the screen (rows sit on the catalog row colliders)
  const NS = 12 /* #801 6+6 with a centre aisle; #806 aisle 1.7 m */, rows = oc.walls.filter(w => /row\d+l?$/.test(w.id) && !/r$/.test(w.id)).length, seat = new THREE.InstancedMesh(box, velvet, NS * rows * 2), arm = new THREE.InstancedMesh(box, wood, (NS + 2) * rows); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(); let si = 0, ai = 0;
  for (let r = 0; r < rows; r++) { const v = 14.2 + 0.95 * r; for (let i = 0; i < NS; i++) { const u = (i < 6 ? -1 : 1) * (1.15 + (i % 6) * 0.55); seat.setMatrixAt(si++, m4.compose(ps.set(u, fy + 0.45, v + 0.05), q, sc.set(0.48, 0.12, 0.45))); seat.setMatrixAt(si++, m4.compose(ps.set(u, fy + 0.78, v - 0.2), q, sc.set(0.48, 0.62, 0.1))); }
    for (let i = 0; i < 14; i++) arm.setMatrixAt(ai++, m4.compose(ps.set((i < 7 ? -1 : 1) * (0.875 + (i % 7) * 0.55), fy + 0.4, v - 0.02), q, sc.set(0.05, 0.6, 0.5))); }
  I.add(seat, arm);
  G.traverse(o => { if (o.isMesh) o.userData.decor800 = true; });
  // ---- film: auto-play on enter, pause on leave, gallery mute silences it
  // #813: films are picked at the BFF'26 kiosk; resume is per film id (S.res[id] = {chunk,t} | {t}); default Coined (chunked mp4s).
  const F0 = K.film, vids = [0, 1].map(() => { const v = document.createElement('video'); v.crossOrigin = 'anonymous'; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto'; return v; });
  S.res = {}; S.film = 'coined';
  let cur = 0, tex = null, forcedMute = false; const src = i => F0.base + 'c' + String(i).padStart(2, '0') + '.mp4';
  const muted = () => { const g = window.game; return !!(g && g.holo && g.holo.muted); };
  const show = v => { if (!tex) { tex = new THREE.VideoTexture(v); tex.colorSpace = THREE.SRGBColorSpace; } else tex.image = v; tex.needsUpdate = true; scrM.map = tex; scrM.needsUpdate = true; };
  const tryPlay = v => { v.muted = muted() || forcedMute; const p = v.play(); if (p && p.catch) p.catch(() => { forcedMute = true; v.muted = true; v.play().catch(e => { S.err = String(e); }); }); };
  const prep = (v, i) => { if (v.dataset.i !== String(i)) { v.dataset.i = String(i); v.src = src(i); v.load(); } };
  vids.forEach(v => v.addEventListener('ended', () => { if (v !== vids[cur] || S.film !== 'coined') return; S.chunk = (S.chunk + 1) % F0.chunks; cur ^= 1; const n = vids[cur]; prep(n, S.chunk); show(n); if (S.inside) tryPlay(n); }));
  const relChunks = () => { const v0 = vids[cur]; if (v0.dataset.i) S.res.coined = { chunk: S.chunk, t: v0.currentTime || 0 }; S.resume = S.res.coined; /* #808 */ vids.forEach(v => { try { v.pause(); v.removeAttribute('src'); delete v.dataset.i; v.load(); } catch (e) {} }); scrM.map = poster; scrM.needsUpdate = true; if (tex) { tex.dispose(); tex = null; } };
  const startChunks = () => { const cv0 = vids[cur], R = S.res.coined; if (R) { S.chunk = R.chunk; prep(cv0, R.chunk); const go = () => { try { cv0.currentTime = R.t; } catch (e) {} show(cv0); if (S.inside && S.film === 'coined') tryPlay(cv0); }; if (cv0.readyState >= 1) go(); else cv0.addEventListener('loadedmetadata', go, { once: true }); } else { prep(cv0, S.chunk); show(cv0); tryPlay(cv0); } };
  const kiosk = installKiosk813(G, I, { fy, S, scr, muted, add, M, cv, low });
  const startFilm = () => { if (S.film === 'coined') startChunks(); else kiosk.startYT(S.film); };
  const stopFilm = () => { if (S.film === 'coined') relChunks(); else kiosk.stopYT(); };
  S.pick = id => { const f = kiosk.byId(id); if (!f) return false; if (f.mode === 'gated') { kiosk.card(f); return 'gated'; } kiosk.card(null); if (id === S.film) { if (S.inside && !S.playing) startFilm(); return 'same'; } if (S.inside) stopFilm(); S.film = id; if (S.inside) startFilm(); try { window.game.say && window.game.say(f.title.toUpperCase(), 3); } catch (e) {} return 'play'; };
  const release = () => { stopFilm(); S.released = (S.released || 0) + 1; };
  const unlock = () => { if (forcedMute) { forcedMute = false; const v = vids[cur]; v.muted = muted(); } }; addEventListener('pointerdown', unlock, true); addEventListener('keydown', unlock, true); addEventListener('touchstart', unlock, true);
  const tick = () => { requestAnimationFrame(tick); const _now = performance.now(); dimK.dt = dimK.t ? Math.min(0.5, (_now - dimK.t) / 1000) : 0; dimK.t = _now; const cam = window.game && window.game.camera; if (!cam) return; const [u, v] = uv(cam.position.x, cam.position.z), inn = v > 11.3 && v < 25 && Math.abs(u) < 6.2;
    kiosk.near(v > 9.4 && v < 25 && Math.abs(u) < 6.2);
    const cv0 = vids[cur]; if (inn && !S.inside) { S.inside = true; S.enters++; startFilm(); try { if (S.enters === 1 && window.game.say) window.game.say(F0.title.toUpperCase(), 4); } catch (e) {} }
    else if (!inn && S.inside) { S.inside = false; release(); } // #808/#813: pause + save per-film resume; #804: leaving frees decoders (phone); re-prepared on enter
    if (S.film === 'coined') { if (S.inside) { cv0.muted = muted() || forcedMute; const n = vids[cur ^ 1]; if (cv0.duration && cv0.currentTime > cv0.duration - 10) prep(n, (S.chunk + 1) % F0.chunks); }
      S.playing = !cv0.paused && !cv0.ended; S.t = +(S.chunk * F0.chunk_s + (cv0.currentTime || 0)).toFixed(1); S.muted = cv0.muted; }
    else { kiosk.tickYT(cam); S.playing = kiosk.ytPlaying(); S.t = +(S.res[S.film] ? S.res[S.film].t : 0).toFixed(1); S.muted = muted(); }
    const tgt = S.inside && S.playing ? 0 : 1; if (Math.abs(dimK.k - tgt) > 0.002) { dimK.k += (tgt - dimK.k) * (1 - Math.exp(-dimK.dt / 0.7)); setDim(dimK.k); } else if (dimK.k !== tgt) { dimK.k = tgt; setDim(tgt); } S.lights = +dimK.k.toFixed(2); };
  requestAnimationFrame(tick);
  S.video = () => vids[cur]; S.kiosk = kiosk; S.meshes = 0; G.traverse(o => { if (o.isMesh) S.meshes++; });
  return S;
}
