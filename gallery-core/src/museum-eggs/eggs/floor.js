// Floor eggs: 11 (Satoshi's desk), 12 (Bitcoin Pizza Day case), 15 (spinning 'Don't trust, verify' coin + block height),
// 16 (money printer that goes brrr and spits paper that turns to ash)
import { THREE, V, builder, MAT, Q, plaque, canvasTex, rand, pick } from '../kit.js';
const put = (E, s, r, name) => { const g = new THREE.Group(); g.name = name; g.position.set(s.x, 0, s.z); g.rotation.y = s.yaw; E.scene.add(g); E.world.reserveFloor(s, r, name); return g; };
const look = (g, dist = 2.6, h = 1.5, ty = 0.9) => { const f = V(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y)); return { from: g.position.clone().addScaledVector(f, dist).setY(h), to: g.position.clone().setY(ty) }; };

// ---- display helpers: a museum plinth with a lit top, and a floor-standing gallery spotlight aimed at the piece ----
// The light is faked (additive beam + a warm pool on the plinth + a lit lens), so no real light is added to every material.
function glowTex() { return canvasTex(128, 128, x => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,236,200,1)'); g.addColorStop(0.45, 'rgba(255,226,180,.45)'); g.addColorStop(1, 'rgba(255,220,170,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }); }
let _glow = null, _beam = null;
function beamTex() { return canvasTex(64, 256, (x, W, H) => { const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,236,205,0.9)'); g.addColorStop(1, 'rgba(255,230,190,0.05)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  const s = x.createLinearGradient(0, 0, W, 0); s.addColorStop(0, 'rgba(0,0,0,1)'); s.addColorStop(0.5, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,0,0,1)'); x.globalCompositeOperation = 'destination-out'; x.fillStyle = s; x.fillRect(0, 0, W, H); }); }
export function showcase(E, g, { w = 1.2, d = 0.9, h = 0.2, target = 0.6, side = 1, spot = true } = {}) {
  const b = builder(); b.box(w + 0.03, 0.05, d + 0.03, 0x232325, 0, 0.025, 0); b.rbox(w, h - 0.05, d, 0.02, 0xe8e4da, 0, 0.05 + (h - 0.05) / 2, 0); b.box(w + 0.006, 0.012, d + 0.006, 0xb89242, 0, h - 0.012, 0);
  const top = new THREE.Group(); top.position.y = h; g.add(top);
  if (spot) { const sx = side * (w / 2 + 0.32), sz = -d / 2 + 0.08, H = 2.25; // stand at the back corner (window side), out of the visitor's line of sight
    b.cyl(0.16, 0.18, 0.025, 20, 0x1c1c1e, sx, 0.0125, sz); b.cyl(0.014, 0.014, H, 10, 0x2a2a2c, sx, H / 2, sz); b.sph(0.022, 10, 8, 0x2a2a2c, sx, H, sz);
    const aim = V(0, h + target, 0), can = new THREE.Group(); can.position.set(sx, H + 0.02, sz); g.add(can); g.updateMatrixWorld(true); can.lookAt(g.localToWorld(aim.clone()));
    const cb = builder(); cb.cyl(0.06, 0.075, 0.2, 20, 0x161618, 0, 0, 0.06, Math.PI / 2); cb.tor(0.072, 0.008, 8, 24, 0x2a2a2c, 0, 0, 0.16); cb.box(0.012, 0.09, 0.012, 0x2a2a2c, 0, -0.06, 0); can.add(cb.mesh(MAT.satin));
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.064, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.1, 1.7), toneMapped: false })); lens.position.z = 0.161; can.add(lens); g.add(can);
    const from = V(sx, H + 0.02, sz), L = from.distanceTo(aim), R = Math.max(w, d) * 0.42;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, R, L, 24, 1, true), new THREE.MeshBasicMaterial({ map: _beam || (_beam = beamTex()), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    beam.position.copy(from).lerp(aim, 0.5); beam.quaternion.setFromUnitVectors(V(0, -1, 0), aim.clone().sub(from).normalize()); beam.renderOrder = 6; g.add(beam);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.05, d * 1.05), new THREE.MeshBasicMaterial({ map: _glow || (_glow = glowTex()), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = h + 0.003; pool.renderOrder = 5; g.add(pool);
    g.userData.fixAim = () => { g.updateMatrixWorld(true); can.lookAt(g.localToWorld(aim.clone())); }; }
  g.add(b.mesh(MAT.satin)); return top;
}
// a lit alcove along a wall: tinted back panel, two side fins and a header with a downlight strip, a fake light cone and a warm wash
// (no real light). Built in the artifact's local frame: the wall is at z = -s.zb, the room is +z.
export function niche(E, g, s, { w = 1.2, d = 0.9, tint = 0x2b3440, label = null } = {}) {
  const H = s.H || 2.4, zb = s.zb || d / 2 + 0.05, D = zb + d / 2 + 0.25, W = w + 0.2, b = builder();
  b.box(W, H, 0.02, tint, 0, H / 2, -zb + 0.012); // back panel
  for (const sd of [-1, 1]) { b.rbox(0.08, H, D, 0.02, 0xe9e5dc, sd * (W / 2 + 0.04), H / 2, -zb + D / 2); b.box(0.012, H - 0.1, 0.012, 0xb89242, sd * (W / 2 + 0.004), H / 2, -zb + D - 0.02); }
  b.rbox(W + 0.16, 0.16, D, 0.02, 0xe9e5dc, 0, H - 0.08, -zb + D / 2); b.box(W + 0.18, 0.02, D + 0.01, 0xb89242, 0, H - 0.17, -zb + D / 2);
  b.box(W + 0.24, 0.07, D + 0.08, 0x222224, 0, 0.035, -zb + D / 2 - 0.04); // kick plinth for the alcove
  const m = b.mesh(MAT.matte); g.add(m);
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.86, 0.05), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.15, 1.75), toneMapped: false })); strip.rotation.x = Math.PI / 2; strip.position.set(0, H - 0.175, -zb + D * 0.55); g.add(strip);
  const add = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false };
  const wash = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.1, H * 0.95), new THREE.MeshBasicMaterial({ map: _glow || (_glow = glowTex()), opacity: 0.45, ...add })); wash.position.set(0, H * 0.62, -zb + 0.03); wash.renderOrder = 5; g.add(wash);
  const L = H - 0.35, beam = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.36, Math.max(w, d) * 0.62, L, 24, 1, true), new THREE.MeshBasicMaterial({ map: _beam || (_beam = beamTex()), opacity: 0.12, side: THREE.DoubleSide, ...add }));
  beam.scale.z = D / W * 1.2; beam.position.set(0, 0.2 + L / 2, -zb + D * 0.5); beam.renderOrder = 6; g.add(beam);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.2, D * 1.4), new THREE.MeshBasicMaterial({ map: _glow, opacity: 0.4, ...add })); pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.075, -zb + D * 0.55); pool.renderOrder = 5; g.add(pool);
  if (label) { const pl = plaque(label, 0.36, 0.1, { brass: true, size: 30 }); pl.position.set(W / 2 + 0.081, 1.35, -zb + D * 0.62); pl.rotation.y = Math.PI / 2; g.add(pl); }
  return { H, zb, D };
}
// where an artifact is shown. ctx.display 'window' (tjm.art/play): in front of a window, on a lit plinth with a floor spotlight; else
// 'niche': its own lit alcove along a wall. Fallbacks: the other kind, then a lit plinth against a wall, then (if allowOpen) open floor.
// Every option keeps doors, paths, gates and painting viewing spots clear (same rules the audit checks).
function displaySpot(E, r, seed, { w = 1.2, d = 0.9, front = 0, allowOpen = true, minStart = 6, prefer = null, winR = r } = {}) { const W = E.world, mode = prefer || E.ctx.display || 'niche';
  const apart = (x, z) => !W.reserved.some(q => q.name && /^egg-/.test(q.name) && Math.hypot(q.x - x, q.z - z) < 6);
  const win = () => { const s = W.findWindowSpot(E.ctx.openings, { r, seed, minStart, test: apart }); if (s) s.where = 'window'; return s; };
  const nic = () => { const s = W.findNicheSpot && W.findNicheSpot({ w, d, r, seed, minStart, front, spread: 6, test: apart }); if (s) s.where = 'niche'; return s; };
  const win2 = () => { if (!prefer) return null; const s = W.findWindowSpot(E.ctx.openings, { r: winR, seed, minStart }); if (s) { s.where = 'window'; s.r = r; } return s; }; // preferred: any free window, even near another egg; winR: clearance when the back is to the window
  let s = mode === 'window' ? win() || win2() || nic() : nic() || win(); if (s) return s;
  s = W.findFloorSpot({ r, place: 'wall', seed, spread: 8, minStart }) || (allowOpen ? W.findFloorSpot({ r, place: 'open', seed, spread: 8, minStart }) : null); if (s) s.where = s.where || 'plinth'; return s; }
// stage an artifact: plinth (+ niche or floor spotlight) and the group its body goes in
function stage(E, s, g, o) { if (s.where === 'niche') { niche(E, g, s, o); const top = showcase(E, g, { ...o, spot: false }); return top; } return showcase(E, g, o); }

// ---- 11. Satoshi's desk, on a lit plinth in front of a window: laptop showing the white paper, cold coffee, the Times sticky note ----
export function eggSatoshi(E) {
  const SR = Math.hypot(1.62 / 2 + 0.2, 1.12 / 2 + 0.25), s = displaySpot(E, SR, E.seed + 111, { w: 1.62, d: 1.12 }); if (!s) return null;
  const g = put(E, s, SR, 'egg-satoshi'); const top = stage(E, s, g, { w: 1.62, d: 1.12, h: 0.2, target: 0.85, side: 1, tint: 0x3a3026 });
  const wood = 0x6e4a2c, dark = 0x4a301c, b = builder();
  // desk: bevelled top with a thin lip, turned legs, a drawer pedestal with brass pulls
  b.rbox(1.24, 0.045, 0.64, 0.012, wood, 0, 0.752, -0.05); b.box(1.2, 0.06, 0.6, dark, 0, 0.7, -0.05);
  for (const [x, z] of [[-0.56, -0.31], [-0.56, 0.21]]) b.lathe([[0.001, 0], [0.026, 0], [0.024, 0.08], [0.018, 0.2], [0.022, 0.42], [0.016, 0.6], [0.026, 0.66], [0.026, 0.7], [0.001, 0.7]], 12, dark, x, 0, z);
  b.rbox(0.4, 0.66, 0.58, 0.012, 0x5e3e24, 0.4, 0.36, -0.05); for (const y of [0.2, 0.42, 0.6]) { b.box(0.37, 0.18, 0.008, 0x6a4628, 0.4, y, 0.245); b.cyl(0.012, 0.012, 0.02, 10, 0xc9a24a, 0.4, y, 0.255, Math.PI / 2); }
  // chair: seat, back, gas column, five-star base on casters
  b.rbox(0.46, 0.06, 0.44, 0.02, 0x2a2a2e, -0.12, 0.47, 0.5); b.rbox(0.44, 0.42, 0.05, 0.02, 0x2a2a2e, -0.12, 0.74, 0.72, -0.12); b.cyl(0.024, 0.024, 0.36, 10, 0x77777a, -0.12, 0.27, 0.5);
  for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; b.box(0.26, 0.025, 0.04, 0x333336, -0.12 + Math.cos(a) * 0.13, 0.07, 0.5 + Math.sin(a) * 0.13, 0, -a, 0); b.sph(0.022, 8, 6, 0x111111, -0.12 + Math.cos(a) * 0.25, 0.025, 0.5 + Math.sin(a) * 0.25); }
  // laptop (big enough to read): base, keyboard well, keys, trackpad, hinge
  const lx = -0.12, lz = -0.06; b.rbox(0.5, 0.024, 0.34, 0.01, 0x8a8a8e, lx, 0.786, lz); b.box(0.44, 0.004, 0.17, 0x2c2c30, lx, 0.799, lz - 0.05);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 13; c++) b.box(0.026, 0.004, 0.024, 0x1c1c1f, lx - 0.2 + c * 0.0333, 0.802, lz - 0.12 + r * 0.032);
  b.box(0.14, 0.002, 0.08, 0x77777b, lx, 0.799, lz + 0.11); b.cyl(0.008, 0.008, 0.46, 10, 0x6a6a6e, lx, 0.8, lz - 0.17, 0, 0, Math.PI / 2);
  // coffee: lathed mug with handle and saucer, a dark cold surface; a pen and a short stack of printouts
  b.lathe([[0.001, 0], [0.085, 0], [0.09, 0.01], [0.085, 0.016], [0.001, 0.016]], 24, 0xf4f2ec, 0.27, 0.775, 0.08);
  b.lathe([[0.001, 0], [0.04, 0], [0.046, 0.01], [0.05, 0.1], [0.044, 0.1], [0.04, 0.012], [0.001, 0.012]], 24, 0xf6f4ee, 0.27, 0.791, 0.08); b.cyl(0.043, 0.043, 0.003, 24, 0x2a1608, 0.27, 0.874, 0.08);
  b.tor(0.028, 0.008, 8, 16, 0xf6f4ee, 0.322, 0.84, 0.08, 0, 0, 0, Math.PI * 1.1); b.cyl(0.004, 0.004, 0.15, 8, 0x1a2a6a, 0.36, 0.78, -0.1, 0, 0.4, Math.PI / 2);
  for (let k = 0; k < 5; k++) b.box(0.21, 0.004, 0.297, 0xf1eee4 - k * 0x010101, 0.4 + k * 0.003, 0.776 + k * 0.005, -0.15, 0, 0.18 + k * 0.03, 0);
  // banker's lamp: brass base and stem, green glass shade
  b.cyl(0.07, 0.08, 0.02, 20, 0xb8913e, -0.5, 0.785, -0.24); b.cyl(0.008, 0.008, 0.26, 10, 0xb8913e, -0.5, 0.92, -0.24); b.cyl(0.03, 0.09, 0.07, 20, 0x1f6a3a, -0.5, 1.05, -0.2, -0.3);
  top.add(b.mesh(MAT.wood));
  const shade = new THREE.Mesh(new THREE.CircleGeometry(0.085, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.4, 0.9), toneMapped: false })); shade.position.set(-0.5, 1.018, -0.19); shade.rotation.x = Math.PI / 2 - 0.3; top.add(shade);
  // laptop lid + screen: the white paper's title page, large and legible
  const lid = new THREE.Group(); lid.position.set(lx, 0.8, lz - 0.17); lid.rotation.x = -0.24; top.add(lid);
  { const lb = builder(); lb.rbox(0.5, 0.33, 0.014, 0.01, 0x8a8a8e, 0, 0.165, -0.008); lb.box(0.47, 0.3, 0.002, 0x0c0c0e, 0, 0.168, 0.0); lid.add(lb.mesh(MAT.satin)); }
  const scr = canvasTex(1024, 640, (x, W, H) => { x.fillStyle = '#16161a'; x.fillRect(0, 0, W, H); x.fillStyle = '#fbfbf8'; x.fillRect(150, 10, W - 300, H - 10); x.fillStyle = '#111'; x.textAlign = 'center';
    x.font = 'bold 40px "Times New Roman",Times,serif'; x.fillText('Bitcoin: A Peer-to-Peer', W / 2, 92); x.fillText('Electronic Cash System', W / 2, 140);
    x.font = '28px "Times New Roman",Times,serif'; x.fillText('Satoshi Nakamoto', W / 2, 200); x.font = '24px "Times New Roman",Times,serif'; x.fillText('satoshin@gmx.com', W / 2, 234); x.fillText('www.bitcoin.org', W / 2, 266);
    x.font = 'bold 24px "Times New Roman",Times,serif'; x.textAlign = 'left'; x.fillText('Abstract.', 200, 318); x.font = '21px "Times New Roman",Times,serif';
    x.fillText('A purely peer-to-peer version of electronic cash would allow', 302, 318); x.fillStyle = '#8c8c8c'; for (let i = 1; i < 8; i++) x.fillRect(200, 312 + i * 26, i === 7 ? 360 : W - 400, 7);
    x.fillStyle = '#111'; x.font = 'bold 24px "Times New Roman",Times,serif'; x.fillText('1. Introduction', 200, 548); x.fillStyle = '#8c8c8c'; for (let i = 0; i < 3; i++) x.fillRect(200, 566 + i * 24, W - 400, 7); });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.288), new THREE.MeshBasicMaterial({ map: scr, toneMapped: false, color: 0xe2e2e2 })); screen.position.set(0, 0.168, 0.0015); lid.add(screen);
  // the sticky note on the bezel corner: "Chancellor on brink of second bailout" in handwriting
  const note = canvasTex(256, 256, (x, W, H) => { x.fillStyle = '#ffe45c'; x.fillRect(0, 0, W, H); x.fillStyle = 'rgba(0,0,0,.07)'; x.fillRect(0, 0, W, 30); x.fillStyle = '#1a2a8a'; x.font = 'bold 33px "Segoe Print","Comic Sans MS","Bradley Hand",cursive'; x.textAlign = 'center';
    ['Chancellor', 'on brink of', 'second', 'bailout'].forEach((l, i) => x.fillText(l, W / 2 + (i % 2 ? 5 : -4), 74 + i * 50, W - 16)); });
  const sn = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), new THREE.MeshLambertMaterial({ map: note, side: THREE.DoubleSide })); sn.position.set(0.215, 0.31, 0.006); sn.rotation.z = -0.1; lid.add(sn);
  if (g.userData.fixAim) g.userData.fixAim();
  const lab = plaque(['Satoshi\'s desk, 2008', 'Reconstruction. The note is a newspaper headline of 3 Jan 2009.'], 0.42, 0.1, { title: true, size: 34 }); lab.position.set(0, 0.13, 0.562); g.add(lab);
  return { name: 'satoshi', group: g, anchor: g.position, where: s.where, view: () => { const f = V(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y)), sd = V(f.z, 0, -f.x); return { from: g.position.clone().addScaledVector(f, 1.35).addScaledVector(sd, 0.35).setY(1.62), to: g.localToWorld(V(-0.12, 1.06, -0.15)) }; } };
}

// ---- 12. Bitcoin Pizza Day: two pizzas in a glass case, 'Price: 10,000 BTC (2010)' ----
export function eggPizza(E) {
  const PR = Math.hypot(0.5 + 0.2, 0.36 + 0.25), s = displaySpot(E, PR, E.seed + 121, { w: 1.0, d: 0.72 }); if (!s) return null;
  const g = put(E, s, PR, 'egg-pizza'); const top0 = stage(E, s, g, { w: 1.0, d: 0.72, h: 0.06, target: 1.0, side: 1, tint: 0x3b2a22 });
  const b = builder(); // pedestal: stepped base, bevelled body with a recessed front panel, a dark top slab
  b.rbox(0.88, 0.06, 0.66, 0.015, 0xd8d3c8, 0, 0.03, 0); b.rbox(0.8, 0.84, 0.6, 0.025, 0xf1eee8, 0, 0.48, 0); b.rbox(0.66, 0.66, 0.012, 0.006, 0xe6e2da, 0, 0.47, 0.302); b.rbox(0.86, 0.04, 0.66, 0.012, 0x2a2a2a, 0, 0.92, 0);
  b.box(0.82, 0.006, 0.006, 0xb89242, 0, 0.9, 0.33);
  // steel frame of the case: rounded posts and rails
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.cyl(0.008, 0.008, 0.36, 12, 0xb8bcc2, x * 0.39, 1.12, z * 0.29); for (const z of [-0.29, 0.29]) b.cyl(0.008, 0.008, 0.78, 12, 0xb8bcc2, 0, 1.3, z, 0, 0, Math.PI / 2); for (const x of [-0.39, 0.39]) b.cyl(0.008, 0.008, 0.58, 12, 0xb8bcc2, x, 1.3, 0, Math.PI / 2);
  top0.add(b.mesh(MAT.satin));
  const pz = builder(); // two pizzas on wooden boards: lathed crust, sauce, cheese with melted blobs, domed pepperoni, olives, basil
  for (const px of [-0.19, 0.19]) { pz.cyl(0.18, 0.18, 0.014, 28, 0x9a6a3a, px, 0.947, 0); pz.lathe([[0, 0], [0.15, 0], [0.168, 0.008], [0.172, 0.02], [0.162, 0.03], [0.148, 0.022], [0, 0.02]], 32, 0xc98a4a, px, 0.954, 0);
    pz.cyl(0.148, 0.148, 0.005, 32, 0xb8321c, px, 0.976, 0); pz.cyl(0.14, 0.14, 0.005, 32, 0xf0c860, px, 0.979, 0); for (let k = 0; k < 8; k++) pz.sph(0.025, 10, 6, 0xf6d878, px + Math.cos(k * 0.8) * (0.04 + k % 3 * 0.03), 0.98, Math.sin(k * 0.8) * (0.04 + k % 3 * 0.03), 0, 0, 0);
    for (let k = 0; k < 9; k++) { const a = k * 2.4, r = 0.035 + (k % 3) * 0.035; pz.cyl(0.021, 0.022, 0.006, 16, 0xa0201a, px + Math.cos(a) * r, 0.984, Math.sin(a) * r); pz.sph(0.018, 10, 4, 0xb42a1e, px + Math.cos(a) * r, 0.986, Math.sin(a) * r); }
    for (let k = 0; k < 4; k++) pz.tor(0.008, 0.003, 6, 12, 0x1a1a14, px + rand(-0.09, 0.09), 0.985, rand(-0.09, 0.09), Math.PI / 2);
    for (let k = 0; k < 5; k++) pz.sph(0.016, 8, 4, 0x2f7a2a, px + rand(-0.1, 0.1), 0.985, rand(-0.1, 0.1));
    // #139 more detail, merged into the same mesh (no extra draw calls) and built from fixed low-poly bits (no detail scaling), ~2.5k
    // triangles a pizza: blistered, charred rim; eight slice cuts; browned cheese; cheese pulls; cupped pepperoni rims; mushroom slices and
    // green pepper rings; herb flecks; board grain and a handle
    const hd = !Q.low, nb = hd ? 16 : 8, S = (r, c, x, y, z, sx = 1, sy = 1, sz = 1) => pz.add(new THREE.SphereGeometry(r, 6, 4), c, x, y, z, 0, 0, 0, sx, sy, sz),
      T = (r, t, c, x, y, z, rx = 0, ry = 0, rz = 0, arc = 6.2832) => pz.add(new THREE.TorusGeometry(r, t, 3, 10, arc), c, x, y, z, rx, ry, rz), B = (w, h, d, c, x, y, z, ry = 0) => pz.add(new THREE.BoxGeometry(w, h, d), c, x, y, z, 0, ry, 0);
    for (let k = 0; k < nb; k++) { const a = k / nb * 6.283 + (px > 0 ? 0.2 : 0), r = 0.161 + (k % 3) * 0.003; S(0.011 + (k % 4) * 0.003, k % 3 ? 0xd89a52 : 0xe0a860, px + Math.cos(a) * r, 0.977 + (k % 2) * 0.003, Math.sin(a) * r, 1, 0.7, 1); // rim blisters
      if (k % 2) S(0.007, 0x3a2414, px + Math.cos(a + 0.2) * 0.166, 0.982, Math.sin(a + 0.2) * 0.166, 1.4, 0.35, 1); } // char spots
    for (let k = 0; k < 8; k++) B(0.296, 0.0015, 0.0025, 0x7a2a14, px, 0.9825, 0, k / 8 * 6.283 + 0.2); // slice cuts
    if (hd) for (let k = 0; k < 10; k++) { const a = k * 2.11 + px * 9, r = 0.03 + (k % 4) * 0.028; S(0.012, 0xd49a3c, px + Math.cos(a) * r, 0.9815, Math.sin(a) * r, 1.2, 0.3, 1); } // browned cheese
    for (let k = 0; k < (hd ? 3 : 1); k++) { const a = 0.6 + k * 2.1, x0 = px + Math.cos(a) * 0.14, z0 = Math.sin(a) * 0.14; pz.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(x0, 0.982, z0), V(x0 + Math.cos(a) * 0.02, 0.99, z0 + Math.sin(a) * 0.02), V(x0 + Math.cos(a) * 0.04, 0.979, z0 + Math.sin(a) * 0.04)]), 6, 0.0025, 3, false), 0xf3d47a); } // cheese pulls over the rim
    for (let k = 0; k < 9; k++) { const a = k * 2.4, r = 0.035 + (k % 3) * 0.035; T(0.019, 0.0028, 0x7a1812, px + Math.cos(a) * r, 0.9875, Math.sin(a) * r, Math.PI / 2); } // cupped, darker pepperoni rims
    for (let k = 0; k < (hd ? 4 : 2); k++) { const a = k * 1.7 + 0.9 + px * 4, r = 0.06 + (k % 2) * 0.05, x = px + Math.cos(a) * r, z = Math.sin(a) * r; // mushroom slices
      S(0.016, 0xd9cbb0, x, 0.9855, z, 1, 0.25, 0.75); B(0.008, 0.003, 0.014, 0xcdbd9e, x, 0.9855, z + 0.012); T(0.0155, 0.0014, 0x8a7458, x, 0.9875, z, Math.PI / 2, 0, 0, Math.PI); }
    for (let k = 0; k < (hd ? 4 : 2); k++) T(0.014, 0.0028, 0x3f8a2e, px + rand(-0.1, 0.1), 0.987, rand(-0.1, 0.1), Math.PI / 2 + rand(-0.2, 0.2), 0, rand(0, 6), 5.2); // green pepper rings
    if (hd) for (let k = 0; k < 18; k++) B(0.004, 0.0012, 0.0025, k % 2 ? 0x2e5a22 : 0x4a6a2a, px + rand(-0.12, 0.12), 0.9885, rand(-0.12, 0.12), rand(0, 3)); // oregano flecks
    for (let k = 0; k < 5; k++) B(0.34, 0.0012, 0.004, 0x7c5430, px, 0.9545, -0.12 + k * 0.06); // board grain
    B(0.07, 0.014, 0.05, 0x9a6a3a, px, 0.947, -0.2); pz.add(new THREE.CylinderGeometry(0.008, 0.008, 0.016, 8), 0x2a1a10, px, 0.947, -0.215); } // board handle + hang hole
  top0.add(pz.mesh(MAT.matte));
  // glass: a clear physical pane box (cheap Lambert on the low tier)
  const gb = builder(); gb.rbox(0.77, 0.355, 0.57, 0.01, 0xffffff, 0, 1.12, 0); const glass = gb.mesh(Q.low ? new THREE.MeshLambertMaterial({ vertexColors: true, color: 0xd8eef4, transparent: true, opacity: 0.16, depthWrite: false }) : new THREE.MeshPhysicalMaterial({ vertexColors: true, color: 0xe8f6fa, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0, clearcoat: 1, depthWrite: false })); glass.renderOrder = 4; top0.add(glass);
  const lab = plaque(['Price: 10,000 BTC (2010)', 'Two pizzas, 22 May 2010. Bitcoin Pizza Day.'], 0.36, 0.11, { title: true, size: 40 }); lab.position.set(0, 0.74, 0.31); top0.add(lab);
  return { name: 'pizza', where: s.where, group: g, anchor: g.position, view: () => look(g, 1.8, 1.55, 0.95) };
}

// ---- 15. spinning gold coin, 'Don't trust, verify'; click shows the current block height (mempool.space) ----
export function eggCoin(E) {
  const CR = Math.hypot(0.32 + 0.2, 0.32 + 0.25), s = displaySpot(E, CR, E.seed + 151, { w: 0.64, d: 0.64 }); if (!s) return null;
  const g = put(E, s, CR, 'egg-coin'); const top0 = stage(E, s, g, { w: 0.64, d: 0.64, h: 0.05, target: 1.25, side: 1, tint: 0x2a2a38 });
  const b = builder(); // fluted column on a stepped base, with a moulded capital and a brass cradle
  b.rbox(0.48, 0.06, 0.48, 0.015, 0xd8d2c6, 0, 0.08, 0); b.lathe([[0, 0], [0.2, 0], [0.2, 0.03], [0.17, 0.05], [0.16, 0.1], [0.15, 0.9], [0.165, 0.93], [0.2, 0.96], [0.2, 0.99], [0, 0.99]], 40, 0xeae6de, 0, 0.11, 0);
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; b.cyl(0.008, 0.008, 0.76, 8, 0xd2ccbf, Math.sin(a) * 0.152, 0.6, Math.cos(a) * 0.152); }
  b.rbox(0.46, 0.05, 0.46, 0.012, 0xd8d2c6, 0, 1.125, 0); b.lathe([[0, 0], [0.035, 0], [0.05, 0.03], [0.03, 0.06], [0.045, 0.1], [0, 0.1]], 24, 0x8a6a2a, 0, 1.15, 0); top0.add(b.mesh(MAT.satin));
  const face = canvasTex(256, 256, (x, W) => { const gr = x.createRadialGradient(110, 100, 10, 128, 128, 128); gr.addColorStop(0, '#fff0a0'); gr.addColorStop(0.6, '#e0b040'); gr.addColorStop(1, '#9a6a12'); x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
    x.strokeStyle = '#7a520a'; x.lineWidth = 6; x.beginPath(); x.arc(128, 128, 118, 0, 7); x.stroke(); x.beginPath(); x.arc(128, 128, 84, 0, 7); x.stroke();
    x.fillStyle = '#6a4608'; x.font = 'bold 22px Georgia'; const txt = "DON'T TRUST · VERIFY · "; for (let i = 0; i < txt.length; i++) { const a = -Math.PI / 2 + i / txt.length * Math.PI * 2; x.save(); x.translate(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100); x.rotate(a + Math.PI / 2); x.fillText(txt[i], -6, 8); x.restore(); }
    x.lineWidth = 7; x.strokeStyle = '#6a4608'; for (const [cx, cy] of [[92, 112], [128, 140], [164, 112]]) x.strokeRect(cx - 18, cy - 18, 36, 36); x.beginPath(); x.moveTo(110, 120); x.lineTo(118, 132); x.moveTo(146, 132); x.lineTo(154, 120); x.stroke(); });
  const gold = new THREE.MeshStandardMaterial({ color: 0xffd36a, metalness: 0.75, roughness: 0.28, emissive: 0x4a3200 }), fm = new THREE.MeshStandardMaterial({ map: face, metalness: 0.6, roughness: 0.3, emissive: 0x3a2800, emissiveMap: face });
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 32), [gold, fm, fm]); coin.rotation.x = Math.PI / 2; const spin = new THREE.Group(); spin.position.y = 1.32; spin.add(coin); top0.add(spin);
  const draw = (x, W, H, h) => { const gr = x.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#d9b65a'); gr.addColorStop(0.5, '#f3dc8e'); gr.addColorStop(1, '#a8812e'); x.fillStyle = gr; x.fillRect(0, 0, W, H); x.strokeStyle = '#6d5218'; x.lineWidth = 6; x.strokeRect(4, 4, W - 8, H - 8);
    x.fillStyle = '#3a2a08'; x.textAlign = 'center'; x.font = 'bold 50px Georgia'; x.fillText("Don't trust, verify", W / 2, 70); x.font = 'italic 30px Georgia'; x.fillText(h ? `Block height ${h.toLocaleString('en-US')} · mempool.space` : 'Touch the coin to check the chain', W / 2, 128); };
  const pt = canvasTex(512, 160, (x, W, H) => draw(x, W, H, 0)); const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.1), new THREE.MeshBasicMaterial({ map: pt, toneMapped: false })); pl.position.set(0, 0.85, 0.181); top0.add(pl);
  let last = 0, height = 0, busy = false;
  async function check() { E.found('coin'); E.A.tone(1320, 0.08, 'sine', 0.06); E.A.tone(1760, 0.12, 'sine', 0.05, 0.08); if (busy) return; if (height && performance.now() - last < 60000) { E.O.toast('BLOCK HEIGHT ' + height.toLocaleString('en-US'), 3); return; }
    busy = true; try { const ac = new AbortController(), to = setTimeout(() => ac.abort(), 6000); const r = await fetch('https://mempool.space/api/blocks/tip/height', { signal: ac.signal, cache: 'no-store' }); clearTimeout(to);
      if (r.ok) { const h = parseInt(await r.text(), 10); if (h > 0) { height = h; last = performance.now(); const c = pt.userData.canvas; draw(c.getContext('2d'), c.width, c.height, h); pt.needsUpdate = true; E.O.toast('BLOCK HEIGHT ' + h.toLocaleString('en-US'), 3.5); } } } catch (e) { /* fail quietly */ } busy = false; }
  E.clicks.add(spin, check, { reach: 3.2 }); E.clicks.add(pl, check, { reach: 3.2 });
  return { name: 'coin', where: s.where, group: g, anchor: g.position, check, get height() { return height; }, update(dt, tm) { spin.rotation.y = tm * 2.2; spin.position.y = 1.32 + Math.sin(tm * 1.7) * 0.015; }, view: () => look(g, 1.4, 1.45, 1.1) };
}

// ---- 16. money printer: brrr, bills fly out, land and burn to ash ----
export function eggPrinter(E) {
  // bigger now (x1.4), at the back of a deep plinth so the pile of bills it keeps printing builds up on the plinth in front of it,
  // in front of a window in every gallery that has one (#137, TJ Oct 18); no usable window: its own lit niche, else a plinth by a wall.
  // Never out in the middle of a room. s.where tells which ('window' | 'niche' | 'plinth').
  const PW = 1.5, PD = 1.62, R = Math.hypot(PW / 2 + 0.2, PD / 2 + 0.25), s = displaySpot(E, R, E.seed + 161, { w: PW, d: PD, allowOpen: false, prefer: 'window', winR: 1.34 }); if (!s) return null;
  const g = put(E, s, R, 'egg-printer'); const top = stage(E, s, g, { w: PW, d: PD, h: 0.2, target: 0.9, side: -1, tint: 0x24352a, label: ['Money printer', 'It never stops. Mind the pile.'] });
  const body = new THREE.Group(); body.scale.setScalar(1.4); body.position.z = -PD / 2 + 0.5; top.add(body); const BZ = body.position.z;
  const b = builder(), green = 0x55685a, dk = 0x36433a, trim = 0x9aa69c;
  // cabinet: bevelled body on a plinth, a raised feed unit with an input tray of blank sheets, panel seams and screw heads
  b.rbox(0.84, 0.06, 0.68, 0.015, 0x2c342e, 0, 0.03, -0.04); b.rbox(0.8, 0.84, 0.62, 0.03, green, 0, 0.48, -0.04);
  b.rbox(0.62, 0.2, 0.42, 0.025, 0x4a5a4e, 0, 0.98, -0.1); b.rbox(0.52, 0.024, 0.32, 0.008, 0xd0d6c8, 0, 1.085, -0.12, -0.12); for (let k = 0; k < 6; k++) b.box(0.48, 0.003, 0.29, 0xeef2e6, 0, 1.1 + k * 0.004, -0.12, -0.12);
  for (const x of [-0.39, 0.39]) b.box(0.006, 0.8, 0.006, dk, x * 0.98, 0.48, 0.27); b.box(0.78, 0.006, 0.006, dk, 0, 0.88, 0.272); b.box(0.78, 0.006, 0.006, dk, 0, 0.1, 0.272);
  for (const [x, y] of [[-0.36, 0.86], [0.36, 0.86], [-0.36, 0.12], [0.36, 0.12]]) b.cyl(0.011, 0.011, 0.008, 12, 0xb8bcb4, x, y, 0.274, Math.PI / 2);
  // side vent louvres and a crank handle
  for (const sd of [-1, 1]) for (let k = 0; k < 7; k++) b.box(0.006, 0.02, 0.34, dk, sd * 0.403, 0.32 + k * 0.05, -0.04, 0, 0, sd * 0.4);
  b.cyl(0.05, 0.05, 0.03, 20, 0x8a8f86, 0.42, 0.62, -0.04, 0, 0, Math.PI / 2); b.box(0.02, 0.12, 0.02, 0x8a8f86, 0.44, 0.57, -0.04); b.cyl(0.016, 0.016, 0.07, 12, 0x6a3a1e, 0.47, 0.51, -0.04, 0, 0, Math.PI / 2);
  // output: exit slot, two rubber rollers, a chute that guides bills out, a small stack already printed
  b.rbox(0.62, 0.07, 0.04, 0.012, 0x161616, 0, 0.56, 0.275); for (const y of [0.535, 0.585]) b.cyl(0.022, 0.022, 0.58, 16, 0x262626, 0, y, 0.292, 0, 0, Math.PI / 2);
  b.rbox(0.58, 0.016, 0.28, 0.006, trim, 0, 0.42, 0.38, 0.28); b.box(0.016, 0.05, 0.28, trim, -0.29, 0.44, 0.38, 0.28); b.box(0.016, 0.05, 0.28, trim, 0.29, 0.44, 0.38, 0.28);
  for (let k = 0; k < 8; k++) b.box(0.15, 0.002, 0.075, 0xc8dcb6, rand(-0.12, 0.12), 0.437 + k * 0.003, 0.4 + rand(-0.02, 0.02), 0.28, rand(-0.3, 0.3), 0);
  // control panel: three chrome dials with pointer and ticks, a toggle, a counter window
  b.rbox(0.7, 0.22, 0.016, 0.006, 0x2a352c, 0, 0.78, 0.272);
  for (let k = 0; k < 3; k++) { const x = -0.22 + k * 0.14; b.cyl(0.04, 0.042, 0.022, 24, 0xd8d8d0, x, 0.78, 0.29, Math.PI / 2); b.cyl(0.03, 0.03, 0.012, 20, 0xa8a8a2, x, 0.78, 0.302, Math.PI / 2); b.box(0.006, 0.03, 0.006, 0x111111, x, 0.792, 0.31, 0, 0, 0.5 - k * 0.7);
    for (let t = 0; t < 7; t++) { const a = -2.2 + t * 0.73; b.box(0.003, 0.01, 0.003, 0xe8e8e0, x + Math.sin(a) * 0.052, 0.78 + Math.cos(a) * 0.052, 0.281, 0, 0, -a); } }
  b.box(0.02, 0.04, 0.02, 0xc8c8c0, 0.14, 0.8, 0.29, 0.5); b.rbox(0.12, 0.045, 0.012, 0.004, 0x111111, 0.27, 0.74, 0.282);
  // cable to the floor
  b.tube([V(-0.3, 0.2, -0.36), V(-0.36, 0.08, -0.42), V(-0.5, 0.012, -0.4), V(-0.62, 0.012, -0.3)], 0.012, 12, 6, 0x1a1a1a);
  body.add(b.mesh(MAT.satin));
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 1.8, 0.3) })); led.position.set(0.24, 0.8, 0.285); body.add(led);
  const plate = plaque(['MONETARY EASE MK II', 'Press nothing. It runs itself.'], 0.3, 0.07, { bg: '#1a1a1a', ink: '#d8e8c8', size: 42, title: true, edge: '#666' }); plate.position.set(0, 0.64, 0.282); body.add(plate);
  // bills: an original dollar-style note (no issuer, no portrait, no real design copied): light green-cream paper, green border with a
  // fine guilloche, an oval rosette, $ and 100 in the corners, ONE HUNDRED, a seal and serials
  const billTex = canvasTex(256, 110, (x, W, H) => { x.fillStyle = '#e4ecd6'; x.fillRect(0, 0, W, H); const gr = x.createRadialGradient(W / 2, H / 2, 5, W / 2, H / 2, W * 0.6); gr.addColorStop(0, 'rgba(255,255,240,0.6)'); gr.addColorStop(1, 'rgba(150,180,140,0.25)'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#4f7d55'; x.lineWidth = 5; x.strokeRect(5, 5, W - 10, H - 10); x.lineWidth = 1; x.strokeStyle = 'rgba(79,125,85,0.7)'; x.beginPath(); for (let t = 0; t <= W - 24; t += 2) { const y0 = 13 + Math.sin(t * 0.35) * 2.5; x.lineTo(12 + t, y0); } x.stroke(); x.beginPath(); for (let t = 0; t <= W - 24; t += 2) x.lineTo(12 + t, H - 13 + Math.sin(t * 0.35) * 2.5); x.stroke();
    x.save(); x.translate(W / 2, H / 2); x.strokeStyle = 'rgba(60,110,70,0.85)'; for (let k = 0; k < 18; k++) { x.rotate(Math.PI / 9); x.beginPath(); x.ellipse(0, 0, 30, 11, 0, 0, 7); x.stroke(); } x.fillStyle = '#e8efdc'; x.beginPath(); x.ellipse(0, 0, 21, 21, 0, 0, 7); x.fill(); x.fillStyle = '#3f6d46'; x.font = 'bold 30px Georgia'; x.textAlign = 'center'; x.fillText('$', 0, 11); x.restore();
    x.fillStyle = '#3f6d46'; x.font = 'bold 22px Georgia'; x.textAlign = 'left'; x.fillText('100', 13, 34); x.fillText('100', 13, H - 18); x.textAlign = 'right'; x.fillText('100', W - 13, 34); x.fillText('100', W - 13, H - 18);
    x.textAlign = 'center'; x.font = 'bold 11px Georgia'; x.fillText('ONE  HUNDRED', W * 0.28, H - 18); x.fillText('ONE  HUNDRED', W * 0.72, H - 18);
    x.fillStyle = '#5d8a3e'; x.font = '10px monospace'; x.fillText('A 0' + Math.floor(rand(1e6, 9e6)) + ' B', W * 0.27, 26); x.fillText('A 0' + Math.floor(rand(1e6, 9e6)) + ' B', W * 0.73, 26);
    x.strokeStyle = '#5d8a3e'; x.lineWidth = 2; x.beginPath(); x.arc(W * 0.8, H / 2, 13, 0, 7); x.stroke(); for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; x.beginPath(); x.moveTo(W * 0.8 + Math.cos(a) * 9, H / 2 + Math.sin(a) * 9); x.lineTo(W * 0.8 + Math.cos(a) * 13, H / 2 + Math.sin(a) * 13); x.stroke(); }
    x.fillStyle = 'rgba(80,110,80,0.10)'; for (let k = 0; k < 300; k++) x.fillRect(rand(0, W), rand(0, H), 1, 1); }); // a little handling wear, still light
  const BW = 0.25, BH = 0.106, billGeo = new THREE.PlaneGeometry(BW, BH), billMat = new THREE.MeshLambertMaterial({ map: billTex, side: THREE.DoubleSide });
  const LOW = !!(E.ctx.lowPower || E.ctx.quality === 'low'), NF = LOW ? 6 : 10, NP = LOW ? 60 : 140; // flying bills / pile cap (oldest recycled)
  const bills = Array.from({ length: NF }, () => { const m = new THREE.Mesh(billGeo, billMat); m.visible = false; E.scene.add(m); return { m, a: V(), b: V(), t: 0, T: 1, spin: V(), life: 0 }; });
  const pile = new THREE.InstancedMesh(billGeo, billMat, NP); pile.count = 0; pile.frustumCulled = false; top.add(pile); let pn = 0; const pm = new THREE.Matrix4(), pq = new THREE.Quaternion(), pe = new THREE.Euler(), ps = V(1, 1, 1);
  const heap = []; // local spots in the pile area in front of the printer, on the plinth top
  function land(k) { const lp = top.worldToLocal(k.m.position.clone()); const r2 = Math.hypot(lp.x / 0.62, (lp.z - 0.59) / 0.19), y = 0.004 + Math.min(0.16, pn * 0.0014) * Math.max(0, 1 - r2 * r2) + rand(0, 0.004);
    pe.set(-Math.PI / 2 + rand(-0.15, 0.15), 0, rand(0, 6.3)); pq.setFromEuler(pe); pm.compose(V(lp.x, y, lp.z), pq, ps); pile.setMatrixAt(pn % NP, pm); pn++; pile.count = Math.min(NP, pn); pile.instanceMatrix.needsUpdate = true; }
  const st = { burst: 0, shoot: 0, on: 0 }; let snd = null;
  function spit() { const k = bills.find(q => q.life <= 0); if (!k) return; k.a.copy(top.localToWorld(V(rand(-0.25, 0.25), 0.79, BZ + 0.5))); // from the exit slot
    k.b.copy(top.localToWorld(V(rand(-0.6, 0.6), 0.02, rand(0.42, 0.76)))); k.T = rand(0.9, 1.5); k.t = 0; k.life = k.T; k.spin.set(rand(-7, 7), rand(-5, 5), rand(-7, 7)); k.m.position.copy(k.a); k.m.visible = true; }
  function brrr() { st.burst = 3.2; E.found('printer'); E.O.bubble(body, 'brrrrrrrrr', 3, { off: 0.9 }); }
  return { name: 'printer', where: s.where, group: g, anchor: g.position, brrr, bills, pile, get piled() { return pile.count; }, get running() { return st.on > 0; },
    update(dt, tm) { const dist = E.cam.distanceTo(g.position), near = (dist < 16 || st.burst > 0) && !E.isRealm(); // an explicit brrr runs even from afar
      st.on = near ? 1 : 0; if (st.burst > 0) st.burst -= dt;
      if (near) { body.position.set(rand(-0.004, 0.004), rand(0, 0.006), BZ + rand(-0.004, 0.004)); led.material.color.setRGB(1.8, 0.2 + Math.random(), 0.1); if ((st.shoot -= dt) <= 0) { st.shoot = st.burst > 0 ? 0.12 : 0.4; spit(); } }
      else body.position.set(0, 0, BZ);
      // quiet continuous hum + rattle while you are near (the master gain is 0 when muted)
      if (dist < 9 && near && !snd) snd = E.A.loop({ f: 72, type: 'sawtooth', vol: 0.03, lp: 800, am: 26, noise: 0.2 }); else if ((dist > 10 || !near) && snd) { snd.stop(0.5); snd = null; }
      for (const k of bills) { if (k.life <= 0) continue; k.t += dt; const u = Math.min(1, k.t / k.T), p = k.m.position; p.lerpVectors(k.a, k.b, u); p.y += Math.sin(u * Math.PI) * 0.55 * (1 - u * 0.3) + Math.sin(k.t * 9) * 0.02 * (1 - u);
        k.m.rotation.x += k.spin.x * dt * (1 - u); k.m.rotation.y += k.spin.y * dt * (1 - u); k.m.rotation.z += k.spin.z * dt * (1 - u); if (u >= 1) { land(k); k.life = 0; k.m.visible = false; } } },
    where: s.where, view: () => look(g, 3.6, 1.75, 0.8) };
}
