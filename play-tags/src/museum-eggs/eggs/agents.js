// play-tags local override of gallery-core museum-eggs/eggs/agents.js (#359 cart follow smoothing, #360 ostrich beak pickup). Only this preview build uses it.
// Moving eggs: 7 (banana + hungry elf), 8 (guide drone after the new white Roadster), 17 (purple ostrich)
import { THREE, V, builder, MAT, Q, plaque, canvasTex, rand, pick, ease, clamp, makePuffs } from '../kit.js';
// ---------- banana geometry (tapered curved tube) ----------
function bananaParts(b, color = 0xf2d23a, ox = 0, oy = 0, oz = 0, s = 1) { // HD 2026-10-18: five ridged faces, taper, stem with a ridged neck, dark tip nub, sugar spots
  const curve = new THREE.CatmullRomCurve3([V(-0.1, -0.025, 0), V(-0.05, 0.008, 0), V(0, 0.018, 0), V(0.05, 0.008, 0), V(0.1, -0.03, 0)].map(p => p.multiplyScalar(s)));
  const T = Q.low ? 16 : 36, Rs = Q.low ? 10 : 20, g = new THREE.TubeGeometry(curve, T, 0.022 * s, Rs, false), pa = g.attributes.position;
  for (let i = 0; i <= T; i++) { const c = curve.getPointAt(i / T), k = 0.28 + 0.72 * Math.pow(Math.sin(Math.PI * i / T), 0.55);
    for (let j = 0; j <= Rs; j++) { const q = i * (Rs + 1) + j, a = j / Rs * Math.PI * 2, ridge = 1 - 0.07 * Math.pow(Math.abs(Math.cos(a * 2.5)), 0.6) + 0.03; pa.setXYZ(q, c.x + (pa.getX(q) - c.x) * k * ridge, c.y + (pa.getY(q) - c.y) * k * ridge, c.z + (pa.getZ(q) - c.z) * k * ridge); } }
  g.computeVertexNormals(); b.add(g, color, ox, oy, oz);
  b.cyl(0.0055 * s, 0.0095 * s, 0.03 * s, 7, 0x6a5a22, ox - 0.112 * s, oy - 0.018 * s, oz, 0, 0, -0.9); b.cyl(0.0062 * s, 0.0062 * s, 0.004 * s, 7, 0x3a2c12, ox - 0.123 * s, oy - 0.008 * s, oz, 0, 0, -0.9);
  b.sph(0.0075 * s, 8, 6, 0x2a1a0a, ox + 0.101 * s, oy - 0.031 * s, oz, 1.2, 0.9, 0.9);
  if (!Q.low) for (const [u, ang] of [[0.3, 0.6], [0.42, 2.1], [0.55, 1.2], [0.63, 3.9], [0.72, 0.2], [0.48, 5.2]]) { const c = curve.getPointAt(u), r = 0.0215 * s * (0.28 + 0.72 * Math.pow(Math.sin(Math.PI * u), 0.55)); b.sph(0.0028 * s, 5, 4, 0x6a4a1c, ox + c.x, oy + c.y + Math.cos(ang) * r, oz + c.z + Math.sin(ang) * r, 1.4, 1, 1); }
  return b; }
const bananaGeo = () => bananaParts(builder()).geometry();
const peelGeo = () => { const b = builder(); for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; b.box(0.11, 0.004, 0.03, 0xe8c832, Math.cos(a) * 0.05, 0.002, Math.sin(a) * 0.05, 0, -a, 0); } b.sph(0.018, 6, 4, 0x6a5a20, 0, 0.006, 0, 1, 0.5, 1); return b.geometry(); };

// =============== 8. guide drone (white low wedge, full-width front light bar, cold-gas puffs, sweeper arm) ===============
export function eggDrone(E) {
  const { scene, world, camera, S, A, O } = E;
  const root = new THREE.Group(); root.name = 'egg-drone'; scene.add(root); const rig = new THREE.Group(); root.add(rig);
  // ---- HD body: a low, smooth wedge (bevelled side-profile extrusion), tinted glass canopy, black underbody with side intakes,
  // four ducted fans (rounded ducts, five-blade rotors, motor hubs), mirrors, full-width front light bar and red tail bar ----
  const fans = [], DUCTS = [[-0.085, 0.1], [0.085, 0.1], [-0.085, -0.13], [0.085, -0.13]];
  { const b = builder(), prof = new THREE.Shape(); // side profile in (z, y): nose at +z
    prof.moveTo(0.33, -0.035); prof.bezierCurveTo(0.345, 0.0, 0.33, 0.02, 0.29, 0.026); prof.bezierCurveTo(0.2, 0.04, 0.12, 0.052, 0.06, 0.06); prof.bezierCurveTo(0.0, 0.075, -0.12, 0.085, -0.2, 0.07);
    prof.bezierCurveTo(-0.27, 0.062, -0.31, 0.05, -0.322, 0.03); prof.lineTo(-0.325, -0.035); prof.bezierCurveTo(-0.3, -0.05, 0.3, -0.05, 0.33, -0.035);
    const eg = new THREE.ExtrudeGeometry(prof, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.018, bevelSegments: Q.low ? 2 : 4, curveSegments: Q.low ? 10 : 20 });
    eg.translate(0, 0, -0.15); eg.rotateY(-Math.PI / 2); // extrusion axis -> x (width), profile z stays z
    b.add(eg, 0xf6f6f3); b.rbox(0.36, 0.03, 0.6, 0.012, 0x121315, 0, -0.06, -0.005);
    for (const sd of [-1, 1]) { b.rbox(0.01, 0.026, 0.12, 0.004, 0x0d0d0f, sd * 0.188, -0.008, -0.06); b.box(0.012, 0.008, 0.012, 0x111111, sd * 0.19, 0.04, 0.12); b.rbox(0.03, 0.018, 0.012, 0.005, 0xf0f0ee, sd * 0.205, 0.045, 0.12); } // intakes, mirrors
    for (const [x, z] of DUCTS) { b.cyl(0.026, 0.02, 0.03, 16, 0x2a2c30, x, -0.08, z); b.tor(0.04, 0.008, 10, 32, 0xc8ccd2, x, -0.066, z, Math.PI / 2, 0, 0); b.cyl(0.012, 0.012, 0.02, 12, 0x6a6e74, x, -0.066, z); }
    for (const x of [-0.12, -0.04, 0.04, 0.12]) b.cyl(0.018, 0.022, 0.035, 14, 0x3a3c40, x, -0.01, -0.335, Math.PI / 2);
    // #139 more detail (same merged mesh): panel seams over the roof and flanks, a nose sensor pod with two lenses, side vents, a stubby
    // antenna with a ball tip, rear diffuser fins, tow hook, and small screw heads round the canopy
    if (!Q.low) { const SM = 0x9a9ea4;
      for (const z of [0.2, -0.24]) b.box(0.3, 0.0025, 0.003, SM, 0, z > 0 ? 0.046 : 0.083, z); // roof seams ahead of / behind the canopy
      for (const sd of [-1, 1]) { b.box(0.003, 0.0025, 0.5, SM, sd * 0.12, 0.07, -0.02); b.box(0.003, 0.05, 0.003, SM, sd * 0.19, 0.0, 0.25); b.box(0.003, 0.05, 0.003, SM, sd * 0.19, 0.0, -0.27); // flank seams
        for (let k = 0; k < 4; k++) b.box(0.004, 0.004, 0.05, 0x1a1b1e, sd * 0.191, 0.02 - k * 0.009, 0.2); } // side vent slats
      b.rbox(0.07, 0.022, 0.03, 0.008, 0x1a1b1e, 0, -0.03, 0.34); for (const sd of [-1, 1]) { b.cyl(0.008, 0.008, 0.012, 14, 0x0a0a0c, sd * 0.017, -0.03, 0.356, Math.PI / 2); b.tor(0.009, 0.0018, 5, 14, 0xb8bcc2, sd * 0.017, -0.03, 0.362); } // nose sensor pod
      b.cyl(0.004, 0.006, 0.07, 8, 0x2a2c30, 0.08, 0.11, -0.2); b.sph(0.009, 10, 8, 0xf0f0ee, 0.08, 0.148, -0.2); // antenna
      for (const x of [-0.15, -0.08, 0.08, 0.15]) b.box(0.004, 0.026, 0.06, 0x1a1b1e, x, -0.04, -0.31); b.rbox(0.03, 0.01, 0.02, 0.004, 0x6a6e74, 0, -0.05, -0.345); // diffuser fins, tow hook
      for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; b.cyl(0.004, 0.004, 0.003, 8, 0xb8bcc2, Math.sin(a) * 0.13, 0.06 + Math.cos(a) * 0.01, -0.055 + Math.cos(a) * 0.19); } }
    rig.add(b.mesh(MAT.gloss));
    const cb = builder(); cb.sph(0.125, 20, 12, 0x2c2a26, 0, 0.055, -0.055, 1, 0.42, 1.55); const can = cb.mesh(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.08, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, color: 0xc9a86a })); rig.add(can);
    for (const [x, z] of DUCTS) { const f = new THREE.Group(); f.position.set(x, -0.066, z); const fb = builder(); for (let k = 0; k < 5; k++) fb.box(0.03, 0.003, 0.011, 0xb8bec6, Math.cos(k * 1.2566) * 0.02, 0, Math.sin(k * 1.2566) * 0.02, 0.35, -k * 1.2566, 0); f.add(fb.mesh(MAT.steel)); rig.add(f); fans.push(f); } }
  { const b = builder(); b.rbox(0.34, 0.012, 0.01, 0.004, 0xffffff, 0, -0.012, 0.352); b.rbox(0.32, 0.01, 0.01, 0.004, 0xff2a20, 0, 0.03, -0.35); for (const sd of [-1, 1]) b.rbox(0.05, 0.016, 0.01, 0.005, 0xffd8a0, sd * 0.13, 0.004, 0.348); if (!Q.low) for (const sd of [-1, 1]) { b.rbox(0.006, 0.01, 0.03, 0.002, 0xffa020, sd * 0.2, 0.0, 0.28); b.sph(0.005, 8, 6, 0x40ff80, sd * 0.06, 0.088, -0.2); } /* #139 amber side markers, green status LEDs */
    rig.add(b.mesh(new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(2.2, 2.2, 2.2), toneMapped: false }))); }
  // ---- wheels: it drives on the floor by default (low Roadster-style stance); front pair steers. Ride height RIDE puts tyres on the floor ----
  const RIDE = 0.105, WR = 0.05, wheels = [];
  for (const [x, z] of [[-0.172, 0.22], [0.172, 0.22], [-0.172, -0.215], [0.172, -0.215]]) { const steer = new THREE.Group(); steer.position.set(x, -0.055, z); rig.add(steer); const w = new THREE.Group(); steer.add(w);
    const b = builder(); b.tor(0.038, 0.013, 10, 28, 0x141416, 0, 0, 0, 0, Math.PI / 2, 0); b.cyl(0.03, 0.03, 0.028, 24, 0x9aa0a8, 0, 0, 0, 0, 0, Math.PI / 2); b.cyl(0.012, 0.012, 0.032, 12, 0x2a2c30, 0, 0, 0, 0, 0, Math.PI / 2);
    for (let k = 0; k < 5; k++) { const a = k * 1.2566; b.box(0.006, 0.022, 0.006, 0xd8dce2, Math.sign(x) * 0.012, Math.cos(a) * 0.017, Math.sin(a) * 0.017, a, 0, 0); }
    if (!Q.low) for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; b.box(0.022, 0.006, 0.008, 0x0c0c0e, 0, Math.cos(a) * 0.0505, Math.sin(a) * 0.0505, a, 0, 0); } // #139 tyre tread blocks
    w.add(b.mesh(MAT.satin)); wheels.push({ steer, w, front: z > 0 }); }
  { const b = builder(); for (const sd of [-1, 1]) for (const z of [0.22, -0.215]) b.tor(0.058, 0.007, 6, 20, 0x1c1d20, sd * 0.168, -0.05, z, 0, Math.PI / 2, 0, Math.PI); rig.add(b.mesh(MAT.gloss)); } // wheel-arch lips
  // ---- gullwing doors over two side bays; each bay hides a folded robot arm ----
  const doors = [], ARMX = 0.135;
  for (const sd of [-1, 1]) { const bay = builder(); bay.rbox(0.07, 0.006, 0.26, 0.003, 0x0b0c0e, sd * 0.142, 0.052, 0.02); rig.add(bay.mesh(MAT.matte));
    const h = new THREE.Group(); h.position.set(sd * 0.112, 0.07, 0.02); rig.add(h); const db = builder(); db.rbox(0.072, 0.01, 0.27, 0.0045, 0xf4f4f1, sd * 0.038, -0.004, 0, 0, 0, -sd * 0.42); db.box(0.05, 0.003, 0.004, 0x1a1b1e, sd * 0.04, -0.002, 0.13, 0, 0, -sd * 0.42);
    db.rbox(0.06, 0.004, 0.24, 0.002, 0x2a2c30, sd * 0.036, -0.011, 0, 0, 0, -sd * 0.42); h.add(db.mesh(MAT.gloss)); doors.push({ h, sd, k: 0 }); }
  // ---- two articulated arms (turret yaw, shoulder pitch, elbow, wrist; a two-finger gripper with a small disc brush under the palm).
  // Analytic 2-link IK in the rig frame; targets are eased, so motion is smooth. Hidden when folded away with the doors shut ----
  const L1 = 0.34, L2 = 0.32, arms = [];
  for (const sd of [-1, 1]) { const A0 = new THREE.Group(); A0.position.set(sd * ARMX, 0.035, 0.03); rig.add(A0); const yawG = new THREE.Group(); A0.add(yawG); const pit = new THREE.Group(); yawG.add(pit); const elb = new THREE.Group(); elb.position.z = L1; pit.add(elb); const wr = new THREE.Group(); wr.position.z = L2; elb.add(wr);
    const tb = builder(); tb.cyl(0.022, 0.026, 0.018, 20, 0xb8bec6, 0, 0, 0); yawG.add(tb.mesh(MAT.steel));
    const ub = builder(); ub.cyl(0.018, 0.018, 0.05, 18, 0x9aa0a8, 0, 0, 0, 0, 0, Math.PI / 2); ub.rbox(0.032, 0.026, L1 - 0.02, 0.01, 0xf2f2ef, 0, 0, L1 / 2); ub.box(0.034, 0.006, L1 * 0.6, 0x2a2c30, 0, 0.012, L1 / 2); ub.cyl(0.006, 0.006, L1 * 0.55, 8, 0xc8ccd2, 0, -0.018, L1 * 0.42, Math.PI / 2); pit.add(ub.mesh(MAT.gloss));
    const fb = builder(); fb.cyl(0.016, 0.016, 0.046, 18, 0x9aa0a8, 0, 0, 0, 0, 0, Math.PI / 2); fb.rbox(0.026, 0.022, L2 - 0.02, 0.009, 0xf2f2ef, 0, 0, L2 / 2); fb.box(0.028, 0.005, L2 * 0.5, 0x2a2c30, 0, 0.011, L2 / 2); elb.add(fb.mesh(MAT.gloss));
    const wb = builder(); wb.cyl(0.013, 0.013, 0.03, 14, 0x9aa0a8, 0, 0, 0.012, Math.PI / 2); wb.rbox(0.04, 0.018, 0.03, 0.006, 0x2a2c30, 0, 0, 0.04); wr.add(wb.mesh(MAT.satin));
    const fing = []; for (const f of [-1, 1]) { const g2 = new THREE.Group(); g2.position.set(f * 0.012, 0, 0.055); const gb = builder(); gb.rbox(0.007, 0.016, 0.045, 0.003, 0x3a3c40, 0, 0, 0.02); gb.box(0.004, 0.014, 0.012, 0x0f0f10, -f * 0.004, 0, 0.036); g2.add(gb.mesh(MAT.satin)); wr.add(g2); fing.push({ g: g2, f }); }
    const brush = new THREE.Group(); brush.position.set(0, -0.022, 0.035); wr.add(brush); { const c = builder(); c.cyl(0.03, 0.03, 0.01, 20, 0x3a3c40, 0, 0, 0); for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; c.cyl(0.0035, 0.002, 0.016, 5, 0xd8b048, Math.cos(a) * 0.024, -0.012, Math.sin(a) * 0.024); } brush.add(c.mesh(MAT.matte)); }
    const stow = V(sd * ARMX, 0.025, -0.05), arm = { sd, A0, yawG, pit, elb, wr, fing, brush, tgt: stow.clone(), cur: stow.clone(), stow, pitch: 0, curPitch: 0, open: 0, spin: 0 }; arms.push(arm); }
  function solveArm(a, dt) { a.cur.lerp(a.tgt, Math.min(1, dt * 7)); a.curPitch += (a.pitch - a.curPitch) * Math.min(1, dt * 7);
    const d = V().subVectors(a.cur, a.A0.position), yaw = Math.atan2(d.x, d.z), h = Math.hypot(d.x, d.z), v = d.y, D2 = clamp(Math.hypot(h, v), 0.06, L1 + L2 - 0.002);
    const gam = Math.acos(clamp((L1 * L1 + L2 * L2 - D2 * D2) / (2 * L1 * L2), -1, 1)), al = Math.acos(clamp((L1 * L1 + D2 * D2 - L2 * L2) / (2 * L1 * D2), -1, 1)), elev = Math.atan2(v, h) + al, bend = Math.PI - gam;
    a.yawG.rotation.y = yaw; a.pit.rotation.x = -elev; a.elb.rotation.x = bend; a.wr.rotation.x = -(a.curPitch - (elev - bend));
    for (const f of a.fing) f.g.position.x = f.f * (0.012 + a.open * 0.018); a.brush.rotation.y += dt * a.spin; }
  const held = new THREE.Mesh(bananaGeo(), MAT.lam); held.scale.setScalar(0.85); held.position.set(0, 0, 0.07); held.rotation.set(0, Math.PI / 2, 0); held.visible = false; arms[0].wr.add(held); // left gripper holds the banana
  const tapeRoll = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.009, 8, 20), new THREE.MeshStandardMaterial({ color: 0x9a9fa6, roughness: 0.45, metalness: 0.4 })); tapeRoll.position.set(0, 0, 0.07); tapeRoll.visible = false; arms[1].wr.add(tapeRoll); // right one tapes
  const toRig = w => rig.worldToLocal(w.clone()); // world point -> rig frame (arm targets)
  const ARM = { want: 0 }; // 0 = folded, doors shut; 1 = doors open, arms out
  const nozzles = DUCTS.map(([x, z]) => V(x, -0.09, z));
  const start = world.randomFree(0.8, (x, z) => Math.hypot(x - E.cam.x, z - E.cam.z) > 6) || V(E.cam.x + 3, 0, E.cam.z); root.position.set(start.x, 1.5, start.z);
  // #214: the guide bot flies by default, everywhere it appears (the drone is its body); ctx.droneFly === false keeps the old wheels-first driving.
  // While it pushes the cart it keeps hovering at handle height (HANDLE_ALT) with its arms on the handle.
  const FLY = E.ctx.droneFly !== false, HANDLE_ALT = 0.86, LOW_ALT = 1.35;
  const D = { mode: 'idle', t: 2, path: null, seg: 0, alt: 1.5, speed: 1.4, flip: -1, flipT: rand(20, 45), puffT: 0, vel: V(), queue: [], lead: null, task: null, cart: null, beepT: 0, armK: 0, roll: 0 };
  const col = { x: root.position.x, z: root.position.z, r: 0.35, name: 'drone', off: true, pass: true }; world.colliders.push(col);
  /* #796 (TJ): spurious beeps. No beeps or auto-leads while the click-to-enter overlay is up; auto-leads need you near, still, and looking at the bot; walking/looking away cancels quietly */
  const overlayUp = () => { const s = document.getElementById('start'); return !!(s && s.offsetParent !== null); };
  const lookingAtBot = () => { const f = V(); E.camera && E.camera.getWorldDirection ? E.camera.getWorldDirection(f) : f.set(0, 0, -1); f.y = 0; const d = V(root.position.x - E.cam.x, 0, root.position.z - E.cam.z); return d.lengthSq() < 1e-4 || f.normalize().dot(d.normalize()) > 0.5; };
  const autoOk = () => !overlayUp() && !D.leadOff && lookingAtBot();
  const beep = (k = 0) => { if (overlayUp()) return; const f = [1320, 1760, 990][k % 3]; A.tone(f, 0.07, 'square', 0.05); A.tone(f * 1.26, 0.07, 'square', 0.04, 0.09); };
  // navigation: A* over the gallery's walkable grid (world.path), through doorways and halls. In the air the drone uses the
  // hover grid (low plinths and benches don't block it); on the floor (sweeping, cart) it uses the floor grid.
  // It drives: the floor grid first; only if the floor has no way through (and fly is allowed) it takes an air path, lifting on its thrusters
  const goTo = (p, R = 0.45, fly = true, keep) => { const fr = V(root.position.x, 0, root.position.z); let path = world.path(fr, p, Math.min(R, 0.35)); D.air = false; if (!path && fly) { path = world.path(fr, p, R, { fly: true }); D.air = !!path; } D.path = path; D.seg = 1; D.navBest = 1e9; D.navT = 0; D.navFail = false;
    if (!keep) { D.goalP = p.clone ? p.clone() : V(p.x, 0, p.z); D.goalR = R; D.goalFly = fly; D.replans = 0; } return !!path; };
  const replan = () => { if (!D.goalP) return false; D.replans = (D.replans || 0) + 1; if (D.replans > 3) { D.navFail = true; D.path = null; return false; } return goTo(D.goalP, D.goalR, D.goalFly, true); };
  const segDist = (a, b, x, z) => { const ux = b.x - a.x, uz = b.z - a.z, L2 = ux * ux + uz * uz || 1e-6, t = clamp(((x - a.x) * ux + (z - a.z) * uz) / L2, 0, 1); return Math.hypot(a.x + ux * t - x, a.z + uz * t - z); };
  function follow(dt, speed) { if (D.navFail) return true; if (!D.path || D.seg >= D.path.length) return true; const tg = D.path[D.seg], dx = tg.x - root.position.x, dz = tg.z - root.position.z, d = Math.hypot(dx, dz), st = speed * dt;
    // stuck / off-route detection: no progress toward the next waypoint for 1.5 s, or pushed >1.2 m off the leg -> re-plan
    if (d < D.navBest - 0.05) { D.navBest = d; D.navT = 0; } else D.navT += dt;
    if (D.navT > 1.5 || segDist(D.path[D.seg - 1] || tg, tg, root.position.x, root.position.z) > 1.2) { if (!replan()) return !!D.navFail || !D.path; return false; }
    if (d < Math.max(0.05, st)) { root.position.x = tg.x; root.position.z = tg.z; D.seg++; D.navBest = 1e9; D.navT = 0; } else { root.position.x += dx / d * st; root.position.z += dz / d * st; face(Math.atan2(dx, dz), dt); } return D.seg >= D.path.length; }
  // orientation while wall-riding: top = out of the wall (n), nose along the wall at angle th from straight up
  const wallBasis = (n, th) => { const t = V(n.z, 0, -n.x), f = V(0, Math.cos(th), 0).addScaledVector(t, Math.sin(th)), y = n.clone(), x = V().crossVectors(y, f); return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, f)); };
  const face = (yaw, dt, k = 3) => { if (D.wallQ) return; let dy = yaw - root.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); root.rotation.y += dy * Math.min(1, dt * k); };
  // ---- companion: stay 2.5-5 m from the visitor, in their peripheral view, drifting rather than parking behind; never closer than
  // 1.8 m; when they stop to look at a painting, keep out of the sight line (to the side, or a little in front and off-axis) ----
  const PL = { last: V(), v: V(), still: 0, look: null, lookT: 0, side: rand() < 0.5 ? -1 : 1, sideT: rand(12, 20) }, MIN = 1.95; // rule is 1.8 m; 15 cm margin for a visitor walking into it
  const camYaw = () => { const f = V(); camera.getWorldDirection(f); return Math.atan2(f.x, f.z); };
  const lineClear = (a, b, fly) => { const F = fly ? world.freeHi : world.free, CL = fly ? world.clrHi : world.clr, n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.3); for (let k = 1; k < n; k++) { const c = world.cell(a.x + (b.x - a.x) * k / n, a.z + (b.z - a.z) * k / n); if (c < 0 || !F[c] || CL[c] < 0.3) return false; } return true; };
  const seesFrom = (a, b) => { const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.3); for (let k = 1; k < n; k++) if (!world.walkable(a.x + (b.x - a.x) * k / n, a.z + (b.z - a.z) * k / n)) return false; return true; };
  function watchPlayer(dt) { const c = E.cam; if (dt > 0) PL.v.set((c.x - PL.last.x) / dt, 0, (c.z - PL.last.z) / dt); if (PL.v.length() > 30) PL.v.set(0, 0, 0); PL.last.copy(c);
    PL.still = PL.v.length() < 0.35 ? PL.still + dt : 0; if ((PL.sideT -= dt) <= 0) { PL.sideT = rand(14, 26); PL.side *= -1; }
    // which painting (if any) the visitor is standing and looking at
    if ((PL.lookT -= dt) <= 0) { PL.lookT = 0.4; PL.look = null; if (PL.still > 0.8) { const f = V(); camera.getWorldDirection(f); let best = 0.96;
      for (const p of E.ctx.paintings || []) { const d = p.data; if (!d || (p.state && p.state !== 'wall')) continue; const dx = d.x - c.x, dy = d.y - c.y, dz = d.z - c.z, L = Math.hypot(dx, dy, dz); if (L > 8 || L < 0.6) continue; const k = (dx * f.x + dy * f.y + dz * f.z) / L; if (k > best && (dx * d.ix + dz * d.iz) < 0) { best = k; PL.look = p; } } } } }
  // score candidate spots around the visitor; floor = cart (floor grid) vs hover
  function companionSpot(floor) { const c = V(E.cam.x, 0, E.cam.z), yaw = camYaw(), here = V(root.position.x, 0, root.position.z), lp = PL.look; let best = null, bs = -1e9;
    const moving = PL.v.length() > 0.6, vy = moving ? Math.atan2(PL.v.x, PL.v.z) : yaw;
    const want = lp ? 62 : (floor ? 78 : 52) + Math.sin(D.t * 0.21) * 14; // degrees off the view axis: peripheral, drifting
    for (let k = 0; k < 28; k++) { const sd = k % 2 ? -PL.side : PL.side, oi = k >> 1, off = ((oi + 1) >> 1) * 9 * (oi % 2 ? 1 : -1), ang = clamp(want + off, 25, 140) * Math.PI / 180, R = (floor ? 2.6 : 3.0) + ((k * 7) % 5) * 0.45;
      const a = vy + sd * ang, x = c.x + Math.sin(a) * R, z = c.z + Math.cos(a) * R, cell = world.cell(x, z); if (cell < 0) continue;
      const F = floor ? world.free : world.freeHi, CL = floor ? world.clr : world.clrHi; if (!F[cell] || CL[cell] < (floor ? floorClr() : 0.35)) continue;
      if (!seesFrom(c, V(x, 0, z))) continue; // stay in the same space as the visitor (no wall between)
      let sc = -Math.abs(Math.abs(ang * 180 / Math.PI) - want) * 0.04 - V(x, 0, z).distanceTo(here) * 0.35 + (sd === PL.side ? 0.6 : 0);
      if (lp) { const d = lp.data, px = d.x + d.ix * 0.05, pz = d.z + d.iz * 0.05, ux = px - c.x, uz = pz - c.z, L = Math.hypot(ux, uz) || 1, ox = x - c.x, oz = z - c.z, along = (ox * ux + oz * uz) / L, lat = Math.abs(ox * uz - oz * ux) / L;
        const half = (lp.w || d.w) / 2 + 0.7; if (along > 0 && along < L + 0.3 && lat < half * Math.min(1, along / L) + 0.55) continue; // inside the sight cone to the painting
        if (along > L - 0.3) continue; sc += along > 0 ? 0.4 : -0.2; } // slightly in front (off-axis) is nice; behind the visitor less so
      if (sc > bs) { bs = sc; best = V(x, 0, z); } }
    return best; }
  // fly (or roll) toward a moving spot: direct when the line is clear, along a path when a wall is in the way; keep >= MIN from the visitor
  function approach(tg, dt, maxSp, floor) { const pos = root.position; if (!tg) return 0; const d = Math.hypot(tg.x - pos.x, tg.z - pos.z);
    if (d > 0.15) { if (lineClear(pos, tg, !floor)) { D.path = null; const sp = Math.min(maxSp, 0.6 + d * 1.1), st = Math.min(d, sp * dt); pos.x += (tg.x - pos.x) / d * st; pos.z += (tg.z - pos.z) / d * st; if (d > 0.6) face(Math.atan2(tg.x - pos.x, tg.z - pos.z), dt, 2); }
      else { if (!D.path || (D.repath = (D.repath || 0) - dt) <= 0) { D.repath = 0.7; goTo(tg, 0.35, !floor); } follow(dt, Math.min(maxSp, 3)); } }
    const c = E.cam, dx = pos.x - c.x, dz = pos.z - c.z, dd = Math.hypot(dx, dz); if (dd < MIN && dd > 1e-3) { const nx = c.x + dx / dd * MIN, nz = c.z + dz / dd * MIN; if (world.walkable(nx, nz)) { pos.x += (nx - pos.x) * Math.min(1, dt * 6); pos.z += (nz - pos.z) * Math.min(1, dt * 6); } }
    return d; }
  function choose() { if (D.queue.length) { D.task = D.queue.shift(); D.mode = D.task.kind; D.t = 0; D.phase = 0; return; }
    if (D.haul && !E.isRealm()) return startHaul(); // #213: back to the trolley after a guided walk or a purchase run
    const near = E.cam.distanceTo(root.position) < 6, r = Math.random();
    if (E.cam.distanceTo(root.position) < 26 && !E.isRealm()) { if (near && r < 0.06 && !D.leadCool && PL.still > 20 && autoOk()) return startLead();
      // #158: by default it wanders the room near you (a few metres off) instead of trailing close; escort is the fallback
      if (!PL.look) { const cx = E.cam.x, cz = E.cam.z, tgt = world.randomFree(0.6, (x, z) => { const d = Math.hypot(x - cx, z - cz); return d > 2.5 && d < 6.5; });
        if (tgt && goTo(tgt, 0.45, false)) { D.mode = 'wander'; D.t = 0; return; } }
      D.mode = 'escort'; D.t = 0; D.spotT = 0; return; }
    if (near && r < 0.3 && !D.leadCool && autoOk()) return startLead();
    if (!E.isRealm() && r < 0.85 && goTo(V(E.cam.x, 0, E.cam.z), 0.35)) { D.mode = 'rejoin'; D.t = 0; D.comeRe = 2; return; } // companion: drive back to you (on its wheels), then escort
    const sweep = r < 0.6; const tgt = world.randomFree(0.6, (x, z) => { const d = Math.hypot(x - root.position.x, z - root.position.z); return d > (sweep ? 2.5 : 5) && d < (sweep ? 7 : 18); });
    if (tgt && goTo(tgt, 0.45, !sweep)) { D.mode = sweep ? 'sweep' : 'wander'; D.t = 0; } else { D.mode = 'idle'; D.t = rand(1.5, 3); } }
  function cancelLead() { if (D.mode === 'lead') { D.mode = 'idle'; D.t = 0; D.wait = 3; } D.lead = null; D.path = null; D.awayT = 0; D.leadOff = 1; clearTimeout(D.leadOffT); D.leadOffT = setTimeout(() => { D.leadOff = 0; }, 300000); }
  function startLead(toGate) { const ps = (E.ctx.paintings || []).filter(p => (p.state === 'wall' || !p.state) && p.data); const cp = E.cam; let goal = null, label = '';
    if ((toGate || Math.random() < 0.3) && E.ctx.gate) { const g = E.ctx.gate; goal = g.pos.clone().addScaledVector(g.n, 2.2); label = 'The slipgate! Mind the elves.'; }
    else { const cand = ps.filter(p => { const d = Math.hypot(p.data.x - cp.x, p.data.z - cp.z); return d > 7 && d < 30; }); const p = pick(cand.length ? cand : ps); if (p) { goal = V(p.data.x + p.data.ix * 1.7, 0, p.data.z + p.data.iz * 1.7); label = 'My favourite: ' + p.data.title; } }
    if (!goal || !goTo(goal)) { D.mode = 'idle'; D.t = 2; return false; } D.mode = 'lead'; D.t = 0; D.lead = { label, goal }; D.leadCool = 1; setTimeout(() => D.leadCool = 0, 180000); D.beeps = 0; D.awayT = 0; beep(0); beep(1); O.bubble(rig, 'Beep! Follow me!', 2.5, { off: 0.35 }); E.found('drone'); return true; }
  // ---- cart (after a purchase) ----
  // an art trolley: low flat bed on four castors, a padded back panel on one long side for paintings to lean on, a push handle at the
  // back end (the drone pushes it along its length). Local +z = forward, +x = the panel side.
  function makeCart() { const c = new THREE.Group(); c.name = 'egg-cart'; const b = builder(), st = 0x9aa0a8, dk = 0x2a2c30;
    b.rbox(0.5, 0.035, 0.9, 0.012, 0x6b4e33, 0, 0.18, 0); b.rbox(0.52, 0.02, 0.92, 0.008, dk, 0, 0.155, 0); b.rbox(0.48, 0.008, 0.86, 0.004, 0x3a4a5a, 0, 0.2, 0); // bed, frame, carpet
    b.rbox(0.03, 0.36, 0.86, 0.01, 0x3a4a5a, 0.22, 0.38, 0); for (const z of [-0.43, 0, 0.43]) b.cyl(0.011, 0.011, 0.4, 10, st, 0.235, 0.37, z); b.cyl(0.011, 0.011, 0.88, 10, st, 0.235, 0.57, 0, Math.PI / 2);
    for (const x of [-0.2, 0.2]) b.cyl(0.012, 0.012, 0.62, 10, st, x, 0.48, -0.47, 0.22); b.cyl(0.014, 0.014, 0.42, 12, 0x1a1a1a, 0, 0.78, -0.54, 0, 0, Math.PI / 2); // handle
    for (const x of [-0.2, 0.2]) for (const z of [-0.38, 0.38]) { b.cyl(0.012, 0.012, 0.06, 8, st, x, 0.115, z); b.cyl(0.042, 0.042, 0.024, 16, 0x1a1a1a, x, 0.042, z, 0, 0, Math.PI / 2); b.cyl(0.018, 0.018, 0.028, 10, st, x, 0.042, z, 0, 0, Math.PI / 2); }
    c.add(b.mesh(MAT.satin)); scene.add(c); c.userData.items = []; return c; }
  function makeCartAt(at) { D.cart = makeCart(); D.cart.position.set(at.x, 0, at.z); D.cart.rotation.y = at.yaw ?? Math.atan2(E.cam.x - at.x, E.cam.z - at.z); if (!D.cartCol || !world.colliders.includes(D.cartCol)) { D.cartCol = { x: 0, z: 0, r: 0.42, name: 'cart', pass: true }; world.colliders.push(D.cartCol); } Object.assign(D.cartCol, { x: at.x, z: at.z, off: false }); D.cartParked = true; }
  // a framed mini copy of a painting (both faces); full: start at the painting's size so it can peel off the wall and shrink
  function makeMini(p) { const asp = (p.data.w || 1) / (p.data.h || 1), mw = asp >= 1 ? 0.24 : 0.24 * asp, mh = asp >= 1 ? 0.24 / asp : 0.24; const mini = new THREE.Group();
    const fb = builder(); fb.rbox(mw + 0.03, mh + 0.03, 0.016, 0.004, 0x3a2e22, 0, 0, 0); mini.add(fb.mesh(MAT.wood));
    const map = p.baseTex || (p.mesh && p.mesh.material && p.mesh.material.map) || null, pic = new THREE.Mesh(new THREE.PlaneGeometry(mw, mh), new THREE.MeshBasicMaterial({ map, color: map ? 0xffffff : 0x5e5040, toneMapped: false }));
    pic.position.z = 0.0085; mini.add(pic); const pic2 = new THREE.Mesh(new THREE.PlaneGeometry(mw + 0.03, mh + 0.03), new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.9 })); pic2.rotation.y = Math.PI; pic2.position.z = -0.0085; mini.add(pic2); /* #156: white back */ mini.userData.mw = mw; return mini; }
  function makeCopy(p) { const d = p.data, saved = []; p.group.traverse(o => { saved.push([o, o.userData]); o.userData = {}; }); let c; try { c = p.group.clone(true); } finally { for (const [o, u] of saved) o.userData = u; } c.visible = true; c.traverse(o => { o.visible = true; o.userData = { egg: true }; });
    { const kids = p.group.children, keep = new Set([kids.indexOf(p.frame), kids.indexOf(p.mesh)]); // #155: no plaque, lamp bar or light wash rides along
      if (keep.has(-1)) keep.clear(); if (keep.size) [...c.children].forEach((o, i) => { if (!keep.has(i)) c.remove(o); });
      const fr = keep.size ? c.children[0] : null; if (fr) { const back = new THREE.Mesh(fr.geometry, new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.9 })); // #156: plain white back
        back.scale.copy(fr.scale); back.position.set(0, 0, fr.position.z - 0.001); back.rotation.y = Math.PI; back.userData = { egg: true }; c.add(back); } } c.scale.set(1, 1, 1); c.position.set(d.x, d.y, d.z); c.rotation.set(0, Math.atan2(d.ix, d.iz), 0); c.name = 'egg-carried-painting'; scene.add(c); return c; }
  function stowInCart(copy, pw, ph) { const it = D.cart.userData.items; capMinis(it); const k = it.length; copy.userData.fixed = true; D.cart.attach(copy); it.push(copy); return k; }
  function cartPose(k, ph) { const lp = V(0.13 - k * 0.035, 0.205 + ph / 2 + 0.03, 0), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.12, -Math.PI / 2, 0, 'YXZ')); return { p: D.cart.localToWorld(lp), q: D.cart.quaternion.clone().multiply(q) }; }
  function addToCart(p) { if (!D.cart) makeCartAt(V(root.position.x, 0, root.position.z)); const it = D.cart.userData.items; capMinis(it);
    const mini = makeMini(p); mini.userData.drop = 0; mini.userData.slot = it.length; D.cart.add(mini); it.push(mini); D.cartParked = false; }
  // at most 4 purchase minis ride along; the player's own true-size paintings (#213) are never dropped for them
  function capMinis(it) { const minis = it.filter(m => !m.userData.painting); if (minis.length >= 4) { const o = minis[0]; D.cart.remove(o); it.splice(it.indexOf(o), 1); } }
  // ---- #213 trolley: while the visitor carries the gravity gun the drone pushes the cart after them. They set paintings on it
  // (true size, leaning on the padded back panel, stacked front to back), wheel them to another wall, and grab them off again.
  // Local only: nothing is saved. gallery side: drone.haul(on) each frame, gun.dropHook -> drone.stow(p), drone.aimsAtTrolley(ray).
  const TROLLEY_MAX = 6, LEAN = 0.12;
  // #360: the ostrich skin (play-tags/src/ostrichbot.js) and its Beak node; fallback = in front of the head
  // #359 (TJ Oct 26): the trolley follows with a critically damped glide and a speed cap, so a jump in the bot's position or yaw
  // (re-plan, knock, doorway fallback) never teleports or jitters it; yaw turns the short way at a capped rate.
  function cartGlide(ct, yaw, dt) { const c = D.cart, d = Math.hypot(ct.x - c.position.x, ct.z - c.position.z); if (d > 1e-4) { const st = Math.min(d, Math.max(d * Math.min(1, dt * 8), 0) , 4.5 * dt); c.position.x += (ct.x - c.position.x) / d * st; c.position.z += (ct.z - c.position.z) / d * st; } c.position.y = 0;
    let dy = yaw - c.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); c.rotation.y += Math.sign(dy) * Math.min(Math.abs(dy), Math.max(Math.abs(dy) * Math.min(1, dt * 6), 0), 3.0 * dt); c.rotation.x = 0; c.rotation.z = 0;
    D.cartCol.x = c.position.x; D.cartCol.z = c.position.z; D.cartCol.off = false; }
  const obApi = () => (window.__ostrichBot && window.__ostrichBot.api) || null;
  function beakAt() { const ob = obApi(), b = ob && ob.ready && ob.nodes && ob.nodes.Beak; if (b && ob.g && ob.g.visible !== false) { b.updateWorldMatrix(true, false); return b.getWorldPosition(V()); } const y = root.rotation.y; return V(root.position.x + Math.sin(y) * 0.35, root.position.y + 1.0, root.position.z + Math.cos(y) * 0.35); }
  const trolleyItems = () => D.cart ? D.cart.userData.items.filter(m => m.userData.painting) : [];
  function enterCart() { D.mode = 'cart'; D.cartT = 1e9; D.path = null; D.spot = null; D.cartGo = true; D.spotT = 0; D.t = 0; D.pushing = false; }
  function behindCart() { const cy = D.cart.rotation.y, b = D.cart.position.clone().addScaledVector(V(Math.sin(cy), 0, Math.cos(cy)), -0.81); b.y = 0; return b; }
  function snapBehind() { const b = behindCart(); root.position.x = b.x; root.position.z = b.z; root.rotation.y = D.cart.rotation.y; enterCart(); }
  function startHaul() { const pos = root.position; D.flip = -1; rig.rotation.z = 0;
    if (!D.cart) { // the trolley appears on open floor near the bot (it may be hovering over furniture), facing the visitor; the bot then takes the handle
      const at = floorNear(pos) || floorNear(E.cam); if (!at) return; const yaw = Math.atan2(E.cam.x - at.x, E.cam.z - at.z);
      makeCartAt(Object.assign(at, { yaw })); D.cartParked = false; beep(1); O.bubble(rig, 'Trolley! Set paintings on it.', 2.6, { off: 0.35 }); }
    const b = behindCart(); if (V(pos.x, 0, pos.z).distanceTo(b) < 0.35 || !goTo(b, 0.3, false)) { snapBehind(); return; } D.mode = 'haulTo'; D.t = 0; }
  // floor clearance the trolley needs: 0.4 m, or less in a small room (the splat studio's widest open floor is ~0.25 m clear)
  let fClr = null; const floorClr = () => { if (fClr == null) { let m = 0; for (let k = 0; k < world.free.length; k++) if (world.free[k] && world.clr[k] > m) m = world.clr[k]; fClr = Math.min(0.4, m * 0.8); } return fClr; };
  // nearest open floor with room for the trolley and the bot behind it (rings out from p)
  function floorNear(p) { const ok = (x, z) => { const k = world.cell(x, z); return k >= 0 && world.free[k] && world.clr[k] >= floorClr(); };
    for (let r = 0; r <= 6; r += r < 2 ? 0.25 : 0.5) for (let a = 0; a < 24; a++) { const x = p.x + Math.sin(a / 24 * 6.283) * r, z = p.z + Math.cos(a / 24 * 6.283) * r; if (!ok(x, z)) continue;
      const yaw = Math.atan2(E.cam.x - x, E.cam.z - z), bx = x - Math.sin(yaw) * 0.81, bz = z - Math.cos(yaw) * 0.81; if (ok(bx, bz)) return V(x, 0, z); } return null; }
  function haul(on) { on = !!on && !E.isRealm(); if (on === !!D.haul) return; D.haul = on;
    if (on) { if (D.mode === 'fetch' || D.queue.some(q => q.kind === 'fetch') || D.mode === 'cart') { if (D.mode === 'cart') D.cartT = 1e9; return; } startHaul(); return; } // a purchase run in progress: joins in after (choose / cart)
    if (D.mode === 'cart' || D.mode === 'haulTo') { D.pushing = false; D.mode = 'idle'; D.t = 0; D.wait = 3; D.path = null; D.cartGo = false;
      if (D.cart && !D.cart.userData.items.length) { scene.remove(D.cart); D.cartCol.off = true; D.cart = null; } else if (D.cart) D.cartParked = true; } }
  // set a held painting on the trolley at true size; returns false (so the gun hangs it as usual) if there is no trolley or it is full
  function stow(p) { if (!D.cart || !p || !p.group) return false; const it = D.cart.userData.items, k = trolleyItems().length;
    if (k >= TROLLEY_MAX) { O.bubble(rig, 'The trolley is full!', 1.8, { off: 0.35 }); return false; }
    const h = p.mesh ? p.mesh.scale.y + 0.03 : (p.h || p.data.h), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-LEAN, -Math.PI / 2, 0, 'YXZ'));
    const up = V(0, 1, 0).applyQuaternion(q), at = V(0.2 - 0.035 - k * 0.045, 0.205, 0).addScaledVector(up, h / 2); // bottom edge on the bed, top on the panel (or the one behind)
    p.group.removeFromParent(); p.group.position.copy(at); p.group.quaternion.copy(q); p.group.visible = true; D.cart.add(p.group);
    for (const c of p.group.children) if (c !== p.frame && c !== p.mesh && c.visible) { c.visible = false; c.userData.trolleyHid = true; } // plaque, lamp bar and light wash stay off while it rides
    p.state = 'trolley'; p.group.userData.painting = p; p.group.userData.fixed = true; it.push(p.group); beep(0); return true; }
  function trolleyTick() { if (!D.cart) return; const it = D.cart.userData.items; for (let i = it.length - 1; i >= 0; i--) { const g = it[i], p = g.userData.painting; if (!p || p.state === 'trolley') continue;
      it.splice(i, 1); delete g.userData.painting; delete g.userData.fixed; for (const c of g.children) if (c.userData.trolleyHid) { c.visible = true; delete c.userData.trolleyHid; } if (g.parent === D.cart) scene.attach(g); } }
  const ray = new THREE.Raycaster();
  function aimsAtTrolley(origin, dir, range = 5) { if (!D.cart) return false; ray.set(origin, dir); ray.far = range; return ray.intersectObject(D.cart, true).length > 0; }
  // purchase: fly to the painting's wall, peel off a mini copy, bring it to the cart (parked near the visitor), then push the cart
  // purchase: the drone fetches the trolley (first time) and lifts the painting off the wall onto it. done() (optional, from the gallery's
  // buy flow hand-off) is called the moment the painting leaves the wall, so the gallery can mark the empty spot / IN CART
  function deliverPurchase(pIn, done) { const ps = E.ctx.paintings || []; const p = pIn && pIn.data ? pIn : ps.find(q => q.data && pIn && (q.data.slug === (pIn.slug || pIn) || q.data.id === (pIn.id || pIn))); if (!p) return false;
    if (D.queue.some(q => q.kind === 'fetch' && q.p === p) || (D.task && D.task.p === p)) return true;
    D.queue = D.queue.filter(q => q.kind !== 'clean'); D.queue.push({ kind: 'fetch', p, done }); D.wait = 0.01; /* #746: start the run straight after the current step */ if (['idle', 'wander', 'sweep', 'escort', 'cart', 'lead', 'rejoin'].includes(D.mode)) { D.mode = 'idle'; D.t = 0; D.wait = 0.01; /* #746: was 0, which idle reads as the default 2 s pause */ D.lead = null; } return true; }
  function bringBanana(task) { D.queue.push({ kind: 'banana', ...task }); if (D.mode === 'idle' || D.mode === 'wander' || D.mode === 'sweep') { D.mode = 'idle'; D.t = 0; } }
  function push(imp) { if (D.mode === 'fetch' || D.wallQ) { rig.rotation.z += clamp(imp.x * 0.05, -0.15, 0.15); A.tone(700, 0.08, 'square', 0.03); return; } // busy with a painting: just a wobble
    D.vel.add(V(imp.x, imp.y * 0.6, imp.z).multiplyScalar(0.9)); D.prev = D.mode === 'knock' ? D.prev : D.mode; D.mode = 'knock'; D.t = 0; D.spin = rand(-8, 8); A.tone(700, 0.15, 'square', 0.05, 0, 1400); O.bubble(rig, pick(['Hey!', 'Rude.', 'Stabilising…', 'Bzzt!']), 1.5, { off: 0.35 }); }
  E.pushables.push({ name: 'drone', obj: root, r: 0.4, push });
  // ---- cold-gas thrusters: own capped particle pools (soft white plumes + a small bright core at each nozzle), bursts on
  // hard acceleration, turns and flips, and a quiet hiss that follows the jets (synthesized; silent when muted) ----
  const LOW = !!E.ctx.lowPower, jets = makePuffs(scene, LOW ? 70 : 140, { alpha: 0.5 }), core = makePuffs(scene, LOW ? 12 : 24, { additive: true, alpha: 0.9 });
  const TH = { acc: 0, nz: 0, last: null, lastV: V(), lastYaw: 0, cool: 0, thr: 0, hiss: null, hissT: 0, wasFlip: false }, qW = new THREE.Quaternion(), tmpV = V();
  function jet(k = 0, dir = null) { const n = nozzles[TH.nz++ % 4], p = rig.localToWorld(n.clone()), down = dir || V(0, -1, 0).applyQuaternion(rig.getWorldQuaternion(qW));
    const v = down.clone().multiplyScalar(rand(1.7, 2.5) * (1 + k * 0.7)).add(V(rand(-0.16, 0.16), rand(-0.1, 0.1), rand(-0.16, 0.16))).addScaledVector(TH.lastV, 0.25);
    jets.emit(p.addScaledVector(down, 0.03), v, rand(0.9, 1.35) * (1 + k * 0.35), rand(0.08, 0.11) * (1 + k * 0.45), 0xf3f5f7, 4, 2.3, 0.25); }
  function burst(k, side) { const n = LOW ? 7 : 14; for (let i = 0; i < n; i++) jet(1, side && i % 2 ? side.clone().add(V(rand(-0.25, 0.25), rand(-0.4, -0.1), rand(-0.25, 0.25))).normalize() : null); TH.thr = 1;
    const dd = E.cam.distanceTo(root.position); if (dd < 12) A.noise(0.45, 3200, 0.011 * k * (1 - dd / 12), 0, 'highpass', 0.6, 3500); }
  // set both arm goals (rig-frame points), gripper pitch, finger opening, brush spin; also asks for the doors to open
  function armsTo(l, r, o = {}) { ARM.want = 1; const [a, b] = arms; if (l) a.tgt.copy(l); if (r) b.tgt.copy(r); a.pitch = o.pl ?? o.pitch ?? 0; b.pitch = o.pr ?? o.pitch ?? 0; a.open = o.ol ?? o.open ?? 0; b.open = o.or ?? o.open ?? 0; a.spin = b.spin = o.spin || 0; }
  const gripW = a => a.wr.localToWorld(V(0, 0, 0.075)); // world point between the fingers
  // thruster gas scatters settled glitter under and around the drone (outward from below the ducts; capped work per frame)
  const GL = { i: 0 };
  function gust(dt, pos) { const T = E.ctx.tools, gl = T && T.glitter; if (!gl || !gl.positions || !gl.states || !gl.mesh) return; const h = pos.y; if (h > 1.7) return;
    const R = 0.5 + (1.7 - h) * 0.55, R2 = R * R, P = gl.positions, St = gl.states, M = gl.mesh.instanceMatrix, A16 = M.array, N = Math.min(gl.cap || St.length, St.length), per = LOW ? 700 : 1600, k0 = GL.i; let lo = 1e9, hi = -1;
    for (let c = 0; c < Math.min(per, N); c++) { const i = (k0 + c) % N; if (St[i] !== 2) continue; const dx = P[i * 3] - pos.x, dz = P[i * 3 + 2] - pos.z, d2 = dx * dx + dz * dz; if (d2 > R2) continue; const d = Math.sqrt(d2) || 0.01, f = (1 - d / R) * (2.2 - h) * 1.6 * dt * (N / Math.min(per, N));
      let nx = P[i * 3] + dx / d * f + (Math.random() - 0.5) * f * 0.6, nz = P[i * 3 + 2] + dz / d * f + (Math.random() - 0.5) * f * 0.6; if (!world.walkable(nx, nz)) continue; P[i * 3] = nx; P[i * 3 + 2] = nz; A16[i * 16 + 12] = nx; A16[i * 16 + 14] = nz; if (i < lo) lo = i; if (i > hi) hi = i; }
    GL.i = (k0 + Math.min(per, N)) % N; if (hi >= 0) { if (M.addUpdateRange) M.addUpdateRange(lo * 16, (hi - lo + 1) * 16); M.needsUpdate = true; D.gusted = (D.gusted || 0) + 1; } }
  // wall-riding suction whir: original synthesized (filtered noise + a low motor tone), positional (stereo pan) and only within ~9 m,
  // fading with distance; quiet; the master gain is 0 when muted
  const WH = { s: null };
  function wallWhir(dt) { const on = !!D.wallQ && root.visible && !E.isRealm(), d = camera.position.distanceTo(root.position);
    if (on && d < 9.5 && !WH.s) WH.s = A.loop({ f: 118, type: 'triangle', vol: 0.0001, lp: 1900, am: 31, noise: 0.5, pan: true });
    if (WH.s) { const k = on ? Math.pow(clamp(1 - d / 9, 0, 1), 2) : 0; WH.s.set(0.05 * k); if (WH.s.pan) { const r = V(1, 0, 0).applyQuaternion(camera.quaternion), v = V().subVectors(root.position, camera.position).normalize(); WH.s.pan(clamp(r.dot(v), -1, 1) * 0.8); }
      if (!on || d > 10) { WH.s.stop(0.4); WH.s = null; } } }
  function thrusters(dt, pos, airborne) { const on = !!airborne && pos.y > RIDE + 0.06 && root.visible && !E.isRealm(); if (on) gust(dt, pos); TH.cool -= dt; TH.thr = Math.max(0, TH.thr - dt * 1.6);
    if (dt > 0 && TH.last) { const v = tmpV.subVectors(pos, TH.last).divideScalar(dt), acc = v.distanceTo(TH.lastV) / dt; let yr = root.rotation.y - TH.lastYaw; yr = Math.abs(Math.atan2(Math.sin(yr), Math.cos(yr))) / dt;
      if (on && TH.cool <= 0 && acc < 60) { if (acc > 2.4) { burst(1, TH.lastV.clone().sub(v).setY(0).normalize()); TH.cool = 0.35; } else if (yr > 2.2) { burst(0.7); TH.cool = 0.45; } }
      TH.lastV.copy(v); } else TH.lastV.set(0, 0, 0);
    TH.last = (TH.last || V()).copy(pos); TH.lastYaw = root.rotation.y;
    if (on && D.flip >= 0 && !TH.wasFlip) burst(1.2); TH.wasFlip = D.flip >= 0;
    if (on) { const rate = (LOW ? 34 : 64) * (1 + TH.thr * 1.5 + (D.flip >= 0 ? 1.5 : 0)); TH.acc += dt * rate; let n = 0; while (TH.acc >= 1 && n++ < 8) { jet(TH.thr * 0.5); TH.acc -= 1; } TH.acc = Math.min(TH.acc, 2);
      for (const nz of nozzles) if (Math.random() < dt * (LOW ? 14 : 24)) { const down = V(0, -1, 0).applyQuaternion(rig.getWorldQuaternion(qW)); core.emit(rig.localToWorld(nz.clone()).addScaledVector(down, 0.03), down.multiplyScalar(0.9), 0.14, 0.075 + TH.thr * 0.04, 0xe8f6ff, 0.8, 3); } }
    jets.update(dt); core.update(dt);
    // soft steady hiss near the drone, swelling with each burst; the shared master gain is 0 when muted
    const dd = E.cam.distanceTo(root.position), want = on && dd < 10 && !E.ctx.isMuted();
    if (want && !TH.hiss) TH.hiss = A.loop({ f: 0, noise: 1, lp: 3800, vol: 0.0001 }); if (TH.hiss && (TH.hissT -= dt) <= 0) { TH.hissT = 0.15; if (!want) { TH.hiss.stop(0.4); TH.hiss = null; } else TH.hiss.set(0.0022 * (1 - dd / 10) * (1 + TH.thr * 2.5)); } }
  // ---- per frame ----
  // #244: the bot and a parked cart drift aside when the visitor comes close or walks into them (never block a path)
  function slideAside(o, dt, R, sp) { const c = E.cam, dx = o.x - c.x, dz = o.z - c.z, d = Math.hypot(dx, dz); if (d >= R) return false;
    let ax = d > 1e-3 ? dx / d : -Math.sin(camYaw()), az = d > 1e-3 ? dz / d : -Math.cos(camYaw()); const v = PL.v, vl = Math.hypot(v.x, v.z);
    if (vl > 0.3) { const ux = v.x / vl, uz = v.z / vl, s = ax * -uz + az * ux >= 0 ? 1 : -1; ax = ax * 0.4 + -uz * s * 0.8; az = az * 0.4 + ux * s * 0.8; const n = Math.hypot(ax, az) || 1; ax /= n; az /= n; } // step off the visitor's line, to the side it is already on
    const k = (R - d) / R, step = Math.min(R - d, (sp + vl) * k * dt + 0.6 * dt);
    for (const [bx, bz] of [[ax, az], [az, -ax], [-az, ax], [-ax, -az]]) { const nx = o.x + bx * step, nz = o.z + bz * step; if (world.walkable(nx, nz)) { o.x = nx; o.z = nz; return true; } } return false; }
  function giveWay(dt, pos) { if (!(dt > 0) || D.mode === 'tow') return; const c = E.cam;
    const toward = o => { const dx = o.x - c.x, dz = o.z - c.z, d = Math.hypot(dx, dz) || 1; return Math.max(0, (PL.v.x * dx + PL.v.z * dz) / d); }; /* reach grows when the visitor walks at it */
    if (pos.y < c.y + 0.3 && D.mode !== 'fetch') slideAside(pos, dt, Math.min(1.5, 0.8 + toward(pos) * 0.35), 2.2);
    if (D.cart && !(D.mode === 'cart' || D.pushing) && slideAside(D.cart.position, dt, Math.min(1.5, 0.85 + toward(D.cart.position) * 0.35), 2.0)) { D.cartCol.x = D.cart.position.x; D.cartCol.z = D.cart.position.z; } }
  function update(dt, tm) { dt *= 1.3; /* #157: guide bot works a bit faster (fetch, drive, arms) */ D.t += dt; const pos = root.position; watchPlayer(dt); D.hover = false; if (D.air && (!D.path || D.seg >= D.path.length)) D.air = false; for (const f of fans) f.rotation.y += dt * (D.mode === 'cart' && !FLY ? 4 : 38);
    switch (D.mode) {
      case 'escort': { D.alt = PL.look ? 1.25 : 1.45 + Math.sin(D.t * 0.7) * 0.08; const far = E.cam.distanceTo(V(pos.x, E.cam.y, pos.z));
        if (D.queue.length || far > 30 || E.isRealm()) { D.mode = 'idle'; D.t = 0; D.wait = 0.2; break; }
        if (!PL.look && D.t > 6 && far < 9) { D.mode = 'idle'; D.t = 0; D.wait = 0.3; break; } // #158: back to wandering near you unless you're looking at a work
        if ((D.spotT -= dt) <= 0 || !D.spot) { D.spotT = PL.look ? 1.2 : 0.6; const sp = companionSpot(true); if (sp) D.spot = sp; else if (!D.spot) D.spot = V(E.cam.x, 0, E.cam.z); }
        const d = approach(D.spot, dt, clamp(PL.v.length() + 1.8, 1.4, 6), true);
        if (d < 0.5) { let fy = Math.atan2(E.cam.x - pos.x, E.cam.z - pos.z); if (PL.look) fy = Math.atan2(PL.look.data.x - pos.x, PL.look.data.z - pos.z); face(fy, dt, 1.2); }
        if (D.t > 150 && PL.still > 20 && !D.leadCool && autoOk() && Math.random() < dt * 0.01) startLead(); break; }
      case 'fetch': { const k = D.task, p = k.p, d0 = p.data, n = V(d0.ix, 0, d0.iz).normalize(), t = V(n.z, 0, -n.x), W0 = V(d0.x, 0, d0.z).addScaledVector(n, -0.01), up = V(0, 1, 0);
        const pw = p.w || d0.w || 0.8, ph = p.h || d0.h || 0.8, wall = (u, h) => W0.clone().addScaledVector(t, u).add(V(0, h, 0)).addScaledVector(n, RIDE), P = (() => { const s1 = W0.clone().addScaledVector(n, 0.62).addScaledVector(t, Math.min(1.2, pw / 2 + 0.45)); return world.walkable(s1.x, s1.z) ? s1 : W0.clone().addScaledVector(n, 0.62); })(), H = P.clone().addScaledVector(t, -0.81); /* #360: the trolley parks beside the painting so the ostrich can step up to it */
        const yawT = Math.atan2(t.x, t.z), yawW = Math.atan2(-n.x, -n.z), hb = Math.max(0.42, d0.y - ph / 2 - 0.04 - 0.37), gx = Math.min(pw / 2 - 0.04, 0.4), giveUp = () => { D.phase = 99; };
        D.alt = 1.2; k.T = (k.T || 0) + dt; if (k.T > 120 && D.phase < 9) giveUp();
        const onWall = (u, h, th) => { D.wall = { u, h, th }; D.wallQ = wallBasis(n, th); root.quaternion.copy(D.wallQ); root.position.copy(wall(u, h)); };
        const wallDrive = (u1, h1, sp = 0.5) => { const w = D.wall, du = u1 - w.u, dh = h1 - w.h, L = Math.hypot(du, dh); D.wallSp = Math.min(L / dt, sp); if (L < 0.01) { onWall(u1, h1, w.th + (0 - w.th) * Math.min(1, dt * 5)); return Math.abs(w.th) < 0.03; }
          const th = Math.atan2(du, dh), st = Math.min(L, sp * dt); let dth = th - w.th; dth = Math.atan2(Math.sin(dth), Math.cos(dth)); onWall(w.u + du / L * st, w.h + dh / L * st, w.th + dth * Math.min(1, dt * 6)); return false; };
        const grips = () => [k.copy.localToWorld(V(-gx, -ph / 2 - 0.02, 0.02)), k.copy.localToWorld(V(gx, -ph / 2 - 0.02, 0.02))];
        const hold = (o = 0) => { const [gl, gr] = grips(); armsTo(toRig(gl), toRig(gr), { pitch: 0, open: o }); };
        const hang = () => { if (k.copy) k.copy.position.copy(beakAt()).add(k.bOff); }; // #360: the painting hangs from the beak
        switch (D.phase) {
          case 0: if (!D.cart) { // dart off out of view (nearest doorway he can't see), come back pushing a trolley
              /* #746 (TJ): no more darting off to a hidden doorway for the trolley (up to ~30 s+). The ostrich pops in with the trolley at once:
                 beside the painting if it is far away, else right where it stands. */
              { const okC = (x, z) => { const kk = world.cell(x, z); return kk >= 0 && world.free[kk] && world.clr[kk] >= floorClr(); }; let put = null;
                if (Math.hypot(pos.x - H.x, pos.z - H.z) > 4) for (const [a, b2] of [[1.1, 0], [1.5, 0], [1.1, 0.6], [1.1, -0.6], [1.9, 0], [0.8, 0]]) { const C = H.clone().addScaledVector(n, a).addScaledVector(t, b2), Bk = C.clone().addScaledVector(n, 0.81); if (okC(C.x, C.z) && okC(Bk.x, Bk.z)) { put = { C, Bk }; break; } }
                if (put) { pos.x = put.Bk.x; pos.z = put.Bk.z; root.rotation.y = Math.atan2(-n.x, -n.z); D.path = null; burst(1); makeCartAt(Object.assign(V(put.C.x, 0, put.C.z), { yaw: root.rotation.y })); }
                else { const f = V(Math.sin(root.rotation.y), 0, Math.cos(root.rotation.y)); makeCartAt(Object.assign(V(pos.x, 0, pos.z).addScaledVector(f, 0.81), { yaw: root.rotation.y })); }
                D.cartParked = false; D.pushing = true; D.phase = 3; D.t = 0; beep(1); O.bubble(rig, 'Trolley! I will get it for you.', 2.0, { off: 0.35 }); }
            }
            else { const cy = D.cart.rotation.y, behind = D.cart.position.clone().addScaledVector(V(Math.sin(cy), 0, Math.cos(cy)), -0.81); behind.y = 0; if (goTo(behind, 0.35, false) || pos.distanceTo(behind.clone().setY(pos.y)) < 0.5) { D.phase = 2; D.t = 0; } else giveUp(); } break;
          case 1: if (follow(dt, 3.6) || D.t > 30) { const f = V(Math.sin(root.rotation.y), 0, Math.cos(root.rotation.y)); makeCartAt(Object.assign(V(pos.x, 0, pos.z).addScaledVector(f, 0.81), { yaw: root.rotation.y })); D.pushing = true; D.phase = 3; D.t = 0; } break;
          case 2: { const ok = follow(dt, 2.4); const cy = D.cart.rotation.y; face(cy, dt, 4); if (ok || D.t > 25) { D.pushing = true; D.phase = 3; D.t = 0; } break; }
          case 3: if (goTo(H.clone().addScaledVector(n, 0.45), 0.45, false) || goTo(H, 0.45, false)) { D.phase = 4; D.t = 0; } else { D.phase = 5; D.t = 0; } break;
          case 4: if (follow(dt, 2.6) || D.t > 20) { D.phase = 5; D.t = 0; } break;
          case 5: { pos.x += (H.x - pos.x) * Math.min(1, dt * 3); pos.z += (H.z - pos.z) * Math.min(1, dt * 3); face(yawT, dt, 5); if (D.t > 1.0) { D.pushing = false; D.cartPark = { p: P.clone(), y: yawT }; D.phase = 6; D.t = 0; } break; } // #359: glide into the park spot (no snap)
          // #360 (TJ Oct 26): no wall-walking. The ostrich steps up to the painting, flutters up so its BEAK reaches the top of the frame,
          // bites it, backs off with the painting hanging from its beak, turns to the trolley and drops it in.
          case 6: { const B = W0.clone().addScaledVector(n, 0.55); face(yawW, dt, 5); const dx = B.x - pos.x, dz = B.z - pos.z, dl = Math.hypot(dx, dz), st = Math.min(dl, 1.2 * dt); if (dl > 1e-3) { pos.x += dx / dl * st; pos.z += dz / dl * st; }
            if ((dl < 0.05 && D.t > 0.6) || D.t > 4) { k.top = d0.y + ph / 2; k.lift = 0; D.phase = 7; D.t = 0; const ob = obApi(); ob && ob.force && ob.force('Hover'); } break; }
          case 7: { face(yawW, dt, 6); const bk = beakAt(); k.lift = clamp((k.top + 0.01) - (bk.y - pos.y) - RIDE, 0, 2.6); D.hover = true; D.alt = k.alt = RIDE + k.lift; // flutter up to the frame top
            const gap = V(bk.x - W0.x, 0, bk.z - W0.z).dot(n); if (gap > 0.03 && V(pos.x - W0.x, 0, pos.z - W0.z).dot(n) > 0.18) { const st = Math.min(gap - 0.03, 0.5 * dt); pos.x -= n.x * st; pos.z -= n.z * st; }
            if ((Math.abs(pos.y - D.alt) < 0.06 && gap < 0.06) || D.t > 4) { D.phase = 9; D.t = 0; } break; }
          case 9: { face(yawW, dt, 6); D.hover = true; D.alt = k.alt; if (!k.copy) { k.copy = makeCopy(p); k.cw = k.copy.position.clone(); k.qc = k.copy.quaternion.clone(); A.tone(900, 0.06, 'square', 0.03); } // the bite
            if (D.t > 0.5) { if (k.done && !k.doneCalled) { k.doneCalled = true; try { k.done(); } catch (e) {} } else if (p.group && !k.done) p.group.visible = false; A.noise(0.3, 2200, 0.05, 0, 'bandpass', 1.5, 900); k.bOff = k.copy.position.clone().sub(beakAt()); D.phase = 10; D.t = 0; } break; }
          case 10: { face(yawW, dt, 6); D.hover = true; D.alt = k.alt; const u = ease(clamp(D.t / 0.6, 0, 1)); k.bOff.lerp(V(0, -ph / 2 - 0.01, 0).addScaledVector(n, 0.02), Math.min(1, dt * 6)); hang(); // lift off the hook
            if (D.t > 0.3) { const st = 0.6 * dt; pos.x += n.x * st; pos.z += n.z * st; } if (u >= 1 && D.t > 1.0) { D.phase = 11; D.t = 0; } break; }
          case 11: { const tgY = Math.atan2(D.cart.position.x - pos.x, D.cart.position.z - pos.z); face(tgY, dt, 4); D.hover = true; k.alt = Math.max(RIDE, (k.alt || RIDE) - dt * 0.8); D.alt = k.alt; hang(); // turn to the trolley and come down
            const cpos = D.cart.position, dd = Math.hypot(cpos.x - pos.x, cpos.z - pos.z); if (dd > 0.7) { const st = Math.min(dd - 0.7, 1.0 * dt); pos.x += (cpos.x - pos.x) / dd * st; pos.z += (cpos.z - pos.z) / dd * st; }
            if ((dd < 0.75 && k.alt <= RIDE + 0.05) || D.t > 4) { k.c2 = k.copy.position.clone(); k.q2 = k.copy.quaternion.clone(); k.slot = Math.min(3, D.cart.userData.items.length); D.phase = 12; D.t = 0; } break; }
          case 12: { const fp = cartPose(k.slot, ph), m = V(fp.p.x, Math.max(k.c2.y, fp.p.y + 0.15), fp.p.z), u = clamp(D.t / 1.2, 0, 1); // drop: over the bed, then down onto it, leaning back on the panel
            if (u < 0.5) k.copy.position.lerpVectors(k.c2, m, ease(u * 2)); else { k.copy.position.lerpVectors(m, fp.p, ease((u - 0.5) * 2)); k.copy.quaternion.copy(k.q2).slerp(fp.q, ease((u - 0.5) * 2)); }
            if (u >= 1) { stowInCart(k.copy, pw, ph); k.copy = null; A.tone(300, 0.08, 'sine', 0.03); const ob = obApi(); ob && ob.force && ob.force(null); D.phase = 16; D.t = 0; } break; }
          case 16: { const tg = behindCart(); face(D.cart.rotation.y, dt, 4); const dx = tg.x - pos.x, dz = tg.z - pos.z, dl = Math.hypot(dx, dz), st = Math.min(dl, 1.2 * dt); if (dl > 1e-3) { pos.x += dx / dl * st; pos.z += dz / dl * st; } if ((dl < 0.08 && D.t > 0.6) || D.t > 3) D.phase = 98; break; }
          case 99: { { const ob = obApi(); ob && ob.force && ob.force(null); } D.cartPark = null; if (k.done && !k.doneCalled) { k.doneCalled = true; try { k.done(); } catch (e) {} } if (k.copy) { scene.remove(k.copy); k.copy = null; } if (!D.cart) makeCartAt(V(pos.x, 0, pos.z)); const c = makeCopy(p), fp = cartPose(Math.min(3, D.cart.userData.items.length), ph); c.position.copy(fp.p); c.quaternion.copy(fp.q); stowInCart(c, pw, ph);
            D.wallQ = null; D.wall = null; root.rotation.set(0, root.rotation.y, 0); if (pos.y < RIDE) pos.y = RIDE; D.phase = 98; break; }
          case 98: { D.pushing = false; D.mode = 'cart'; D.cartT = 180; D.path = null; D.task = null; D.spot = null; D.cartGo = false; beep(2); setTimeout(() => beep(0), 250); O.bubble(rig, 'On the trolley! I will keep it close by.', 3, { off: 0.35 }); E.found('cart'); break; } }
        break; }
      case 'tow': D.alt = 1.45; break; // #236: 'Take me to checkout' run (eggs/checkoutrun.js steers it; it flies ahead pulling the visitor)
      case 'haulTo': { if (!D.cart) { D.mode = 'idle'; break; } if (follow(dt, 2.6) || D.t > 15) snapBehind(); break; } // #213: back to the trolley's handle
      case 'idle': if (FLY && D.alt < 1 && !D.cart) D.alt = LOW_ALT; if (D.t > (D.wait || 2)) { D.wait = 0; choose(); } break;
      case 'rejoin': { if (E.isRealm() || D.queue.length) { D.mode = 'idle'; D.t = 0; break; }
        if ((D.comeRe -= dt) <= 0) { D.comeRe = 2; if (D.goalP && Math.hypot(D.goalP.x - E.cam.x, D.goalP.z - E.cam.z) > 4) goTo(V(E.cam.x, 0, E.cam.z), 0.35); }
        const dd = E.cam.distanceTo(V(pos.x, E.cam.y, pos.z)); if (dd < 12) { D.mode = 'escort'; D.t = 0; D.spotT = 0; break; }
        if (follow(dt, 6) && dd > 12) D.comeRe = 0; /* #380: snappier rejoin (was 3.6) */ if (D.t > 120) { D.mode = 'idle'; D.t = 0; } break; }
      case 'wander': D.alt = 1.45; if (follow(dt, 1.4)) { D.mode = 'idle'; D.t = 0; D.wait = rand(1, 4); } break;
      case 'sweep': { if (FLY) D.alt = 0.34; /* #214: skims the floor, brushes down */ const sw = Math.sin(D.t * 3.2) * 0.12; armsTo(V(-0.2 + sw, -0.072, 0.46), V(0.2 + sw, -0.072, 0.46), { spin: 22 }); if (follow(dt, 0.6)) { D.mode = 'idle'; D.t = 0; D.wait = rand(1, 3); } if (doors[0].k > 0.85) { for (const a of arms) { const b = a.brush.getWorldPosition(V()); for (const f of E.sweepHooks) try { f(b.x, b.z, 0.22); } catch (e) {} } }
        if (false) { for (const f of E.sweepHooks) try { f(pos.x, pos.z, 0.3); } catch (e) {} if (Math.random() < dt * 6) E.puffs.emit(V(pos.x, 0.03, pos.z).add(V(rand(-0.1, 0.1), 0, rand(-0.1, 0.1))), V(rand(-0.3, 0.3), 0.15, rand(-0.3, 0.3)), 0.6, 0.05, 0xb8b0a0, 1.5); } break; }
      case 'lead': { D.alt = 1.35; const L = D.lead, d = E.cam.distanceTo(V(pos.x, E.cam.y, pos.z)); D.lostT = d > 12 ? (D.lostT || 0) + dt : 0;
        if (L.guided && D.lostT > 8) { D.lostT = 0; D.guide = { label: L.label, goal: L.goal, onArrive: L.onArrive }; if (goTo(V(E.cam.x, 0, E.cam.z), 0.35)) { D.mode = 'come'; D.t = 0; O.bubble(rig, 'Wait for me!', 1.8, { off: 0.35 }); break; } }
        if (D.navFail) { O.bubble(rig, 'Hmm, I lost the way. Ask me again?', 2.5, { off: 0.35 }); D.mode = 'idle'; D.t = 0; D.lead = null; D.navFail = false; break; }
        if (!L.guided) { D.awayT = (d > 6.5 || !lookingAtBot()) ? (D.awayT || 0) + dt : 0; if (D.awayT > 5 || overlayUp()) { cancelLead(); break; } } /* #796: you walked or looked away: stop leading quietly, no re-engage for 5 min */
        if (d > 6.5) { face(Math.atan2(E.cam.x - pos.x, E.cam.z - pos.z), dt); if ((D.beepT -= dt) <= 0 && (D.beeps || 0) < (L.guided ? 6 : 1)) { D.beepT = L.guided ? 9 : 30; D.beeps = (D.beeps || 0) + 1; beep(1); O.bubble(rig, L.guided ? 'This way! I will wait.' : 'This way!', 1.8, { off: 0.35 }); } }
        else if (follow(dt, L.guided ? (d < 3.5 ? 2.6 : 1.6) : 1.3)) { if (L.onArrive) { D.flip = 0; L.onArrive(); } else O.bubble(rig, L.label, 4, { off: 0.35 }); beep(0); setTimeout(() => beep(2), 200); D.mode = 'idle'; D.t = 0; D.wait = L.guided ? 9 : 5; D.lead = null; }
        if (D.t > (L.guided ? 300 : 75)) { D.mode = 'idle'; D.t = 0; D.lead = null; } break; }
      case 'come': { D.alt = 1.45; const g = D.guide; if (!g) { D.mode = 'idle'; break; } if ((D.comeRe = (D.comeRe || 0) - dt) <= 0) { D.comeRe = 1.5; if (Math.hypot(D.goalP.x - E.cam.x, D.goalP.z - E.cam.z) > 3) goTo(V(E.cam.x, 0, E.cam.z), 0.35); } if (follow(dt, 6.5) /* #380: was 4.2 */ || E.cam.distanceTo(V(pos.x, E.cam.y, pos.z)) < 3) { if (!goTo(g.goal)) { D.mode = 'idle'; D.t = 0; O.bubble(rig, 'Hmm, no way through.', 2, { off: 0.35 }); break; } D.mode = 'lead'; D.t = 0; D.lead = { label: g.label, goal: g.goal, guided: true, onArrive: g.onArrive }; D.guide = null; } if (D.t > 40) { D.mode = 'idle'; D.guide = null; } break; }
      case 'banana': { const k = D.task; D.alt = 1.4;
        if (D.phase === 0) { if (!goTo(k.pos.clone().addScaledVector(k.n, 1.1).setY(0), 0.4)) { D.phase = 9; } else D.phase = 1; }
        else if (D.phase === 1) { if (follow(dt, 1.6)) { D.phase = 2; D.t = 0; } }
        else if (D.phase >= 2 && D.phase <= 3) { D.hover = true; face(Math.atan2(-k.n.x, -k.n.z), dt, 5); D.alt = k.pos.y - 0.16; const tg = k.pos.clone().addScaledVector(k.n, 0.5); pos.x += (tg.x - pos.x) * Math.min(1, dt * 2); pos.z += (tg.z - pos.z) * Math.min(1, dt * 2);
          held.visible = D.phase === 2 || D.t < 0.8; tapeRoll.visible = true; const bw = k.pos.clone().addScaledVector(k.n, 0.035), tL = toRig(bw.clone().add(V(0, -0.0, 0)).addScaledVector(k.n, 0.03)), tt = V(k.n.z, 0, -k.n.x);
          if (D.phase === 2) { armsTo(tL, toRig(bw.clone().addScaledVector(tt, 0.16).addScaledVector(k.n, 0.08)), { pl: 0.1, pr: 0.2, ol: 0.15, or: 0.25 }); if (D.t > 2.6 && Math.abs(pos.y - D.alt) < 0.06) { D.phase = 3; D.t = 0; A.noise(0.35, 2600, 0.12, 0, 'highpass', 0.7); A.noise(0.25, 2000, 0.1, 0.4, 'highpass', 0.7); } }
          else { const sweepU = clamp(D.t / 1.4, 0, 1), along = bw.clone().addScaledVector(tt, 0.13 - sweepU * 0.26).add(V(0, 0.02 * Math.sin(sweepU * Math.PI), 0)).addScaledVector(k.n, 0.025); // tape stroke across the banana
            armsTo(tL, toRig(along), { pl: 0.1, pr: 0.15, ol: 0.15, or: 0.05 }); if (D.t > 0.8 && !k.placed) { k.placed = true; held.visible = false; k.onPlace && k.onPlace(); }
            if (D.t > 1.6) { beep(0); O.bubble(rig, 'Fresh banana. Art restored.', 2.5, { off: 0.35 }); D.phase = 4; D.t = 0; } } }
        else if (D.phase === 4) { tapeRoll.visible = D.t < 0.8; D.hover = D.t < 1.2; const tg = k.pos.clone().addScaledVector(k.n, 1.1); pos.x += (tg.x - pos.x) * Math.min(1, dt * 1.5); pos.z += (tg.z - pos.z) * Math.min(1, dt * 1.5); if (D.t > 1.8) { D.phase = 9; if (k.peel) { D.queue.unshift({ kind: 'clean', at: k.peel }); } } }
        if (D.phase === 9) { held.visible = false; tapeRoll.visible = false; D.mode = 'idle'; D.t = 0; D.wait = 0.5; } break; }
      case 'clean': { const k = D.task; if (D.phase === 0) { D.phase = goTo(V(k.at.x, 0, k.at.z), 0.35, false) ? 1 : 9; } else if (D.phase === 1) { if (follow(dt, 0.8)) { D.phase = 2; D.t = 0; } } else if (D.phase === 2) { const sw = Math.sin(D.t * 4) * 0.14; armsTo(V(-0.2 + sw, -0.072, 0.44), V(0.2 - sw, -0.072, 0.44), { spin: 24 }); if (doors[0].k > 0.85) for (const a of arms) { const b = a.brush.getWorldPosition(V()); for (const f of E.sweepHooks) try { f(b.x, b.z, 0.25); } catch (e) {} } if (D.t > 2.4) D.phase = 9; }
        if (D.phase === 9) { D.mode = 'idle'; D.t = 0; } break; }
      case 'cart': { D.alt = FLY ? HANDLE_ALT : 0.115; const cp = E.cam; if (D.haul) D.cartT = 1e9; D.cartT -= dt;
        // 2026-10-18 (#136): wait nearby with the cart instead of trailing right behind. Park; move only once the visitor has
        // wandered off (> 8 m or out of sight) and settled (or is far, > 14 m), then roll to a new spot beside them and park again.
        const dP = Math.hypot(cp.x - pos.x, cp.z - pos.z); if ((D.seeT = (D.seeT || 0) - dt) <= 0) { D.seeT = 0.3; D.sees = seesFrom(V(cp.x, 0, cp.z), V(pos.x, 0, pos.z)); }
        D.awayT = (dP > (D.haul ? 4.5 : 8) || !D.sees) ? (D.awayT || 0) + dt : 0;
        if (!D.spot) D.spot = V(pos.x, 0, pos.z);
        if (D.cartGo) { if ((D.spotT = (D.spotT || 0) - dt) <= 0) { D.spotT = 1.2; const sp = companionSpot(true); if (sp) D.spot = sp; } }
        else if (D.awayT > 1.2 && (PL.still > 0.6 || dP > (D.haul ? 7 : 14))) { D.cartGo = true; D.spotT = 1.2; const sp = companionSpot(true); if (sp) D.spot = sp; }
        { const kc = world.cell(pos.x, pos.z); if (kc < 0 || !world.free[kc]) { // off the floor grid (e.g. ended a wall lift over a plinth or ramp edge): roll straight to the nearest free cell first
          if (!D.unstick || (D.unstickT = (D.unstickT || 0) - dt) <= 0) { D.unstickT = 1; D.unstick = null; for (let rr = 0.25; rr <= 15 && !D.unstick; rr += rr < 4 ? 0.25 : 0.5) for (let a = 0; a < 32; a++) { const x = pos.x + Math.sin(a / 32 * 6.283) * rr, z = pos.z + Math.cos(a / 32 * 6.283) * rr, k2 = world.cell(x, z); if (k2 >= 0 && world.free[k2] && world.clr[k2] >= floorClr()) { D.unstick = V(x, 0, z); break; } } }
          if (D.unstick) { const ux = D.unstick.x - pos.x, uz = D.unstick.z - pos.z, ul = Math.hypot(ux, uz) || 1, st = Math.min(ul, 1.6 * dt); pos.x += ux / ul * st; pos.z += uz / ul * st; face(Math.atan2(ux, uz), dt, 3); D.path = null; } break; } D.unstick = null; }
        const d = approach(D.spot, dt, D.cartGo ? clamp(Math.max(PL.v.length() + 1.2, dP * 0.3), 0.8, 5) : 0.8, true); if (D.cartGo && d < 0.3 && dP < 6) D.cartGo = false; D.roll += dt * clamp(d * 1.3, 0, 3.4) / 0.045; if (d < 0.4) face(Math.atan2(cp.x - pos.x, cp.z - pos.z), dt, 1.2);
        if (D.queue.length && D.queue[0].kind === 'fetch') { D.mode = 'idle'; D.t = 0; D.wait = 0; break; }
        if (D.cartT <= 0 && dP < 6 && trolleyItems().length) D.cartT = 60; /* paintings on it: keep it */ if (D.cartT <= 0 && dP < 6) { O.bubble(rig, 'Your picks are in the cart. See you at checkout!', 3, { off: 0.35 }); scene.remove(D.cart); D.cartCol.off = true; D.cart = null; D.mode = 'idle'; D.t = 0; } break; }
      case 'knock': { pos.addScaledVector(D.vel, dt); D.vel.multiplyScalar(Math.max(0, 1 - 2.2 * dt)); D.vel.y -= 2 * dt; if (!world.walkable(pos.x, pos.z)) { pos.x -= D.vel.x * dt * 2; pos.z -= D.vel.z * dt * 2; D.vel.x *= -0.5; D.vel.z *= -0.5; A.tone(200, 0.08, 'square', 0.04); }
        root.rotation.y += D.spin * dt; D.spin *= 1 - dt * 2; if (D.t > 1.6) { const pv = D.prev; D.t = 0; if (pv === 'cart' && D.cart) { D.mode = 'cart'; D.path = null; D.spot = null; D.cartGo = false; } else if (['lead', 'come', 'wander', 'sweep', 'banana', 'clean'].includes(pv) && D.goalP && goTo(D.goalP, D.goalR, D.goalFly, true)) { D.mode = pv; if (pv === 'lead') D.t = 1; } else { D.mode = 'idle'; D.path = null; } } break; }
    }
    // altitude: on its wheels unless hovering for a job (D.hover), crossing an obstacle on an air path (D.air), hopping for a flip, or knocked
    const pushing = !!D.cart && (D.mode === 'cart' || D.pushing); if (FLY && pushing) { D.alt = HANDLE_ALT; armsTo(V(-0.15, -0.075, 0.27), V(0.15, -0.075, 0.27), { pitch: 0.2 }); } // hands on the trolley handle
    if (FLY && !pushing && D.alt < 0.3) D.alt = LOW_ALT; // a floor-level mode (sweep, rejoin) hovers instead
    const airborne = !D.wallQ && (FLY || D.hover || D.air || D.hopT > 0 || D.mode === 'knock'); D.hopT = Math.max(0, (D.hopT || 0) - dt);
    if (!D.wallQ) { if (D.mode !== 'knock') { const want = airborne ? (D.hopT > 0 ? 1.1 : D.alt) + Math.sin(tm * 2.1) * 0.04 : RIDE; pos.y += (want - pos.y) * Math.min(1, dt * (airborne ? 2.5 : 5)); if (!airborne && pos.y < RIDE + 0.02) pos.y = RIDE; } else pos.y = clamp(pos.y, RIDE, 2.8); }
    if (D.flip < 0 && !D.flipPending && ['wander', 'idle', 'lead', 'escort'].includes(D.mode) && !D.wallQ && (D.flipT -= dt) <= 0) { D.flipPending = true; D.hopT = 2.2; D.flipT = rand(30, 70); }
    if (D.flipPending && pos.y > 0.85) { D.flipPending = false; D.flip = 0; A.noise(0.6, 900, 0.12, 0, 'bandpass', 0.6, 3000); }
    if (D.flip >= 0) { D.flip += dt / 0.9; rig.rotation.z = Math.PI * 2 * ease(D.flip); if (D.flip >= 1) { D.flip = -1; rig.rotation.z = 0; } }
    rig.rotation.x = airborne && D.mode !== 'knock' ? -0.06 : 0;
    // wheels: roll with ground speed, front pair steers with the turn rate
    { const fw = V(Math.sin(root.rotation.y), 0, Math.cos(root.rotation.y)), mv = D.lastP ? V(pos.x - D.lastP.x, 0, pos.z - D.lastP.z) : V(), sp = D.wallQ ? (D.wallSp || 0) * dt : mv.dot(fw);
      let yr = root.rotation.y - (D.lastYaw ?? root.rotation.y); yr = Math.atan2(Math.sin(yr), Math.cos(yr)) / Math.max(dt, 1e-3);
      if (!airborne) for (const w of wheels) { w.w.rotation.x += sp / WR; if (w.front) w.steer.rotation.y += (clamp(yr * 0.35, -0.5, 0.5) - w.steer.rotation.y) * Math.min(1, dt * 8); }
      D.lastP = (D.lastP || V()).copy(pos); D.lastYaw = root.rotation.y; }
    // doors open first, then the arms come out; arms fold back first, then the doors shut
    { const stowed = arms.every(a => a.cur.distanceTo(a.stow) < 0.04), dk = ARM.want ? 1 : stowed ? 0 : 1;
      for (const d of doors) { d.k += (dk - d.k) * Math.min(1, dt * 5); d.h.rotation.z = d.sd * 1.25 * ease(d.k); } const out = doors[0].k > 0.85;
      for (const a of arms) { if (!(ARM.want && out)) { a.tgt.copy(a.stow); a.pitch = 0; a.open = 0; a.spin = 0; } solveArm(a, dt); a.A0.visible = doors[0].k > 0.03 || !stowed; }
      if (D.doorsWas !== (dk > 0)) { D.doorsWas = dk > 0; A.noise(0.18, 1800, 0.03, 0, 'bandpass', 2, 600); A.tone(dk > 0 ? 520 : 400, 0.12, 'sine', 0.025, 0.02, dk > 0 ? 700 : 300); } }
    ARM.want = 0;
    wallWhir(dt); trolleyTick();
    thrusters(dt, pos, airborne);
    if (D.cart) { D.cart.visible = true; if (!D.cart.userData.nc) { D.cart.userData.nc = true; D.cart.traverse(o => { o.frustumCulled = false; }); } /* #359: never culled or hidden */
      if (D.mode === 'cart' || D.pushing) { D.cartPark = null; const ry = D.wallQ ? D.cart.rotation.y : root.rotation.y, f = V(Math.sin(ry), 0, Math.cos(ry)); let ct = V(pos.x, 0, pos.z).addScaledVector(f, 0.81);
        /* #746 (TJ): the trolley is rigidly on the ostrich's hands while it pushes (same offset, same yaw) so the two never drift apart or swing.
           Only a big jump (re-plan / knock) still glides it back in, and a wall in front just stops it at the last free spot. */
        const free = world.walkable(ct.x, ct.z); if (!free) ct = D.cartLastOk ? D.cartLastOk.clone() : D.cart.position.clone(); else D.cartLastOk = ct.clone();
        if (free && Math.hypot(ct.x - D.cart.position.x, ct.z - D.cart.position.z) < 0.5) { D.cart.position.set(ct.x, 0, ct.z); D.cart.rotation.set(0, ry, 0); D.cartCol.x = ct.x; D.cartCol.z = ct.z; D.cartCol.off = false; } else cartGlide(ct, ry, dt); }
      else if (D.cartPark) { cartGlide(D.cartPark.p, D.cartPark.y, dt); if (D.cart.position.distanceTo(D.cartPark.p) < 0.01) D.cartPark = null; }
      D.cart.userData.items.forEach((m, i) => { if (m.userData.fixed) return; m.userData.drop = Math.min(1, m.userData.drop + dt * 1.6); const k = ease(m.userData.drop); m.position.set(-0.05 + i * 0.035, 0.3 + (1 - k) * 0.7, -0.08 + i * 0.05); m.rotation.set(-0.35 + (1 - k) * 2, 0.1 * i, 0); }); }
    giveWay(dt, pos);
    col.x = pos.x; col.z = pos.z; col.off = pos.y > 0.9 || !!(world.inPaintZone && world.inPaintZone(pos.x, pos.z, 0.15)) || !!(world.nearViewSpot && world.nearViewSpot(pos.x, pos.z, 0.9)); } // in a painting's view zone or by its viewing spot the drone yields by push only, never as a hard block
  const debug = { get mode() { return D.mode; }, get phase() { return D.phase; }, get cart() { return !!D.cart; }, get items() { return D.cart ? D.cart.userData.items.length : 0; }, get wall() { return !!D.wallQ; }, get cartPos() { return D.cart ? D.cart.position.clone() : null; }, get cartGo() { return !!D.cartGo; }, get doors() { return doors[0].k; }, get air() { return D.air; }, get gusted() { return D.gusted || 0; }, D };
  return { name: 'drone', debug, group: root, get anchor() { return root.position; }, cull: 60, update, deliverPurchase, bringBanana, push, lead: () => startLead(), cancelLead, leadToGate: () => startLead(true), sweep: () => { const t = world.randomFree(0.6, (x, z) => Math.hypot(x - root.position.x, z - root.position.z) < 5); if (t && goTo(t, 0.45, false)) { D.mode = 'sweep'; D.t = 0; } },
    // talk-to-guide: come to the visitor (fast) if far away, then lead along a walkable path; onArrive fires at the goal
    guideTo: g => { if (D.mode === 'knock') D.mode = 'idle'; const here = V(root.position.x, 0, root.position.z), cp = V(E.cam.x, 0, E.cam.z); if (!world.path(cp, g.goal, 0.35)) return false;
      D.queue = D.queue.filter(q => q.kind !== 'clean'); D.flip = -1; rig.rotation.z = 0;
      if (here.distanceTo(cp) > 7) { const f = V(); camera.getWorldDirection(f); f.y = 0; f.normalize(); let tg = cp.clone().addScaledVector(f, 2); if (!world.walkable(tg.x, tg.z)) tg = cp; if (!goTo(tg, 0.35)) { root.position.set(cp.x + f.x * 2, 1.45, cp.z + f.z * 2); } D.guide = g; D.mode = 'come'; D.t = 0; return true; }
      if (!goTo(g.goal)) return false; D.mode = 'lead'; D.t = 0; D.lead = { label: g.label, goal: g.goal, guided: true, onArrive: g.onArrive }; E.found('drone'); return true; },
    attend: () => { if (['idle', 'wander', 'sweep', 'escort', 'rejoin'].includes(D.mode)) { D.mode = 'idle'; D.t = 0; D.wait = 8; face(Math.atan2(E.cam.x - root.position.x, E.cam.z - root.position.z), 1, 1); } },
    sweepTo: p => { if (!['idle', 'wander', 'sweep'].includes(D.mode) || D.queue.length) return false; if (goTo(V(p.x, 0, p.z), 0.4, false)) { D.mode = 'sweep'; D.t = 0; return true; } return false; },
    flip: () => { D.flip = 0; }, get mode() { return D.mode; }, get goal() { return D.goalP; }, get replans() { return D.replans || 0; }, get jets() { return jets.live + core.live; }, get hover() { return !!D.hover; }, /* #746 ostrich rides up with the drone while it hovers */ jetCap: jets.max + core.max, get cart() { return D.cart; }, root, rig,
    tow: on => { if (on) { if (D.mode !== 'tow') D.towPrev = D.mode; D.mode = 'tow'; D.path = null; D.air = false; D.flip = -1; rig.rotation.z = 0; D.pushing = false; } else if (D.mode === 'tow') { D.mode = 'idle'; D.t = 0; D.wait = 1.5; } },
    haul, stow, aimsAtTrolley, get hauling() { return !!D.haul; }, get trolley() { return trolleyItems().map(g => g.userData.painting); }, trolleyMax: TROLLEY_MAX, fly: FLY,
    view: () => { const p = root.position, f = V(Math.sin(root.rotation.y), 0, Math.cos(root.rotation.y)); let from = V(p.x + f.x * 1.3 + f.z * 1.1, Math.max(1.0, p.y + 0.25), p.z + f.z * 1.3 - f.x * 1.1); if (!world.walkable(from.x, from.z)) from = V(p.x + f.x * 1.3 - f.z * 1.1, from.y, p.z + f.z * 1.3 + f.x * 1.1); return { from, to: p.clone() }; } };
}

// =============== 7. banana duct-taped to the wall; an elf eats it every few minutes; the drone brings a new one ===============
export function eggBanana(E, drone) {
  const { scene, world, camera, S, A, O } = E;
  const spot = world.findWallSpot({ w: 0.75, h: 0.45, y: 1.45, seed: E.seed + 71, spread: 8 }); if (!spot) return null;
  const g = new THREE.Group(); g.name = 'egg-banana'; g.position.copy(spot.pos); g.rotation.y = spot.yaw; scene.add(g); world.reserveWall(spot, 'banana');
  const ban = new THREE.Mesh(bananaGeo(), MAT.lam); ban.position.set(-0.08, 0, 0.03); ban.rotation.z = 0.35; g.add(ban);
  const peeled = new THREE.Group(); peeled.position.copy(ban.position); peeled.rotation.z = 0.35; peeled.visible = false; g.add(peeled);
  { const b = builder(); b.cyl(0.014, 0.017, 0.13, 6, 0xf4ecc8, 0, 0.03, 0, 0, 0, Math.PI / 2 - 0.2); for (let k = 0; k < 3; k++) b.box(0.012, 0.11, 0.004, 0xe8c832, -0.07, -0.04, (k - 1) * 0.012, 0, (k - 1) * 0.5, 0.3 + (k - 1) * 0.3); peeled.add(b.mesh(MAT.lam)); }
  const tapeGeo = (() => { const t = new THREE.PlaneGeometry(0.05, 0.19, 2, Q.low ? 6 : 14), p = t.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), x = p.getX(i); p.setZ(i, 0.02 * Math.exp(-(y * y) / 0.0012) + 0.0008 * Math.sin(y * 260 + x * 90)); } t.computeVertexNormals(); return t.toNonIndexed(); })(), // tape draped over the banana, slightly crinkled
    tapeMat = new THREE.MeshStandardMaterial({ color: 0x9a9fa6, roughness: 0.45, metalness: 0.4 }); const tapes = [];
  const addTape = a => { const t = new THREE.Mesh(tapeGeo, tapeMat); t.position.set(-0.08, 0.005, 0.056 + tapes.length * 0.0015); t.rotation.z = a; g.add(t); tapes.push(t); if (tapes.length > 3) g.remove(tapes.shift()); };
  addTape(-0.65);
  const lab = plaque(['Untitled (Potassium), 2026', 'Banana, duct tape. Replaced as needed.'], 0.2, 0.0625, { title: true, size: 40, align: 'left' }); lab.position.set(0.25, -0.05, 0.006); g.add(lab);
  const peelM = new THREE.Mesh(peelGeo(), MAT.lam); peelM.visible = false; scene.add(peelM);
  const front = spot.pos.clone().addScaledVector(spot.n, 0.45).setY(0);
  const st = { mode: 'wait', t: rand(150, 300), elf: null, path: null, seg: 0, have: true };
  E.sweepHooks.push((x, z, r) => { if (peelM.visible && Math.hypot(peelM.position.x - x, peelM.position.z - z) < r + 0.25) { peelM.visible = false; E.puffs.emit(peelM.position.clone(), V(0, 0.3, 0), 0.6, 0.12, 0xd8d0a0, 2); A.tone(1500, 0.05, 'sine', 0.04); } });
  const elves = E.ctx.elves || {};
  function startEat() { if (!st.have || st.mode !== 'wait') return false; const make = elves.make, anim = elves.animate;
    if (!make || !anim) { st.have = false; ban.visible = false; dropPeel(); replace(); return true; }
    const from = world.randomFree(0.35, (x, z) => { const d = Math.hypot(x - front.x, z - front.z); return d > 5 && d < 12 && !S.inView(V(x, 0.4, z), 1.05); }) || world.randomFree(0.35, (x, z) => Math.hypot(x - front.x, z - front.z) < 10);
    const path = from && world.path(from, front, 0.3); if (!path) { st.t = 30; return false; }
    const elf = make(Math.random()); elf.position.set(from.x, 0.3, from.z); scene.add(elf); if (elves.list) elves.list.push(elf); st.elf = elf; st.path = path; st.seg = 1; st.mode = 'walk'; st.t = 0; return true; }
  function dropPeel() { peelM.position.copy(spot.pos).addScaledVector(spot.n, 0.38).setY(0.004); peelM.rotation.y = rand(0, 6); peelM.visible = true; }
  function replace() { let done = false; if (drone) { setTimeout(() => { if (!done && !st.have) { done = true; ban.visible = true; peeled.visible = false; peeled.scale.setScalar(1); st.have = true; st.mode = 'wait'; st.t = rand(180, 360); } }, 120000); /* #282: if the drone never arrives the banana still comes back */ drone.bringBanana({ pos: spot.pos.clone(), n: spot.n.clone(), peel: peelM.visible ? peelM.position.clone() : null, onPlace: () => { if (done) return; done = true; ban.visible = true; peeled.visible = false; peeled.scale.setScalar(1); addTape(rand(0.55, 0.85) * (Math.random() < 0.5 ? -1 : 1)); st.have = true; st.mode = 'wait'; st.t = rand(180, 360); } });
    }
    else setTimeout(() => { ban.visible = true; st.have = true; st.mode = 'wait'; st.t = rand(180, 360); }, 20000); }
  function update(dt, tm) { const anim = elves.animate, elf = st.elf;
    if (st.mode === 'wait') { if ((st.t -= dt) <= 0 && E.cam.distanceTo(spot.pos) < 22) startEat(); return; }
    if (!elf) return; st.t += dt;
    if (st.mode === 'walk') { const tg = st.path[st.seg], dx = tg.x - elf.position.x, dz = tg.z - elf.position.z, d = Math.hypot(dx, dz), s = 1.5 * dt; if (d < s) { elf.position.x = tg.x; elf.position.z = tg.z; if (++st.seg >= st.path.length) { st.mode = 'hop'; st.t = 0; st.hop0 = elf.position.clone(); } } else { elf.position.x += dx / d * s; elf.position.z += dz / d * s; } anim(elf, 'walk', tm, camera, dt); }
    else if (st.mode === 'hop') { const k = Math.min(1, st.t / 0.5), tgt = spot.pos.clone().addScaledVector(spot.n, 0.2).addScaledVector(spot.t, -0.08); tgt.y = spot.pos.y - 0.12; elf.position.lerpVectors(st.hop0, tgt, ease(k)); elf.position.y += Math.sin(k * Math.PI) * 0.35; anim(elf, 'idle', tm, camera, dt); if (k >= 1) { st.mode = 'peel'; st.t = 0; A.tone(900, 0.06, 'triangle', 0.04); } }
    else if (st.mode === 'peel') { anim(elf, 'scrub', tm, camera, dt); if (st.t > 1.1 && ban.visible) { ban.visible = false; peeled.visible = true; A.noise(0.25, 3000, 0.06); } if (st.t > 2.2) { st.mode = 'eat'; st.t = 0; E.found('banana'); O.bubble(elf, '*munch*', 2, { off: 0.4 }); } }
    else if (st.mode === 'eat') { anim(elf, 'idle', tm, camera, dt); peeled.scale.setScalar(Math.max(0.2, 1 - st.t / 2.2)); if (Math.random() < dt * 5) A.noise(0.05, 1500, 0.06); if (st.t > 2.3) { peeled.visible = false; st.have = false; dropPeel(); st.mode = 'leave'; st.t = 0; const away = world.randomFree(0.35, (x, z) => { const d = Math.hypot(x - front.x, z - front.z); return d > 6 && d < 14; }); st.path = away && world.path(V(elf.position.x, 0, elf.position.z), away, 0.3); st.seg = 1; st.hop0 = elf.position.clone(); replace(); } }
    else if (st.mode === 'leave') { if (st.t < 0.5) { const k = st.t / 0.5; elf.position.lerpVectors(st.hop0, front.clone().setY(0.3), ease(k)); elf.position.y += Math.sin(k * Math.PI) * 0.25; anim(elf, 'idle', tm, camera, dt); return; }
      if (st.path && st.seg < st.path.length) { const tg = st.path[st.seg], dx = tg.x - elf.position.x, dz = tg.z - elf.position.z, d = Math.hypot(dx, dz), s = 1.7 * dt; elf.position.y = 0.3; if (d < s) st.seg++; else { elf.position.x += dx / d * s; elf.position.z += dz / d * s; } anim(elf, 'retreat', tm, camera, dt); }
      if ((!st.path || st.seg >= st.path.length || st.t > 14) && !S.inView(elf.position, 1.05) || st.t > 25) { scene.remove(elf); if (elves.list) { const i = elves.list.indexOf(elf); if (i >= 0) elves.list.splice(i, 1); } st.elf = null; st.mode = 'gone'; } } }
  return { name: 'banana', group: g, anchor: spot.pos, cull: 30, update, eatNow: () => { st.t = 0; return startEat(); }, get mode() { return st.mode; }, get hasBanana() { return st.have && ban.visible; }, get tapes() { return tapes.length; }, spot, peel: peelM,
    view: () => ({ from: spot.pos.clone().addScaledVector(spot.n, 1.05).addScaledVector(spot.t, 0.25).setY(1.5), to: spot.pos.clone().setY(1.3) }) };
}

// =============== 17. purple ostrich (Nostr nod), wanders, pushable ===============
export function eggOstrich(E) {
  const { scene, world, camera, A, O } = E;
  const P = 0x8a3fd6, P2 = 0x6a2aa8, SK = 0xd8c2ea;
  const root = new THREE.Group(); root.name = 'egg-ostrich'; scene.add(root); const body = new THREE.Group(); body.position.y = 0.95; root.add(body);
  // HD original model (2026-10-18): smooth feathered body, fluff clumps, arcing plume tail, folded wings with white tips,
  // S-curved tube neck with a fluff collar, big-eyed head with lids and a flat beak, thick feathered thighs, scaled shins, two-toed feet.
  const hd = !Q.low, sg = (n) => Math.max(4, Math.round(n * (hd ? 0.55 : 0.5))), // kit segs() scales these back up by Q.detail
    FE = MAT.satin || MAT.flat, SKM = MAT.lam || MAT.flat, GL = MAT.gloss || MAT.flat;
  const W1 = 0xf4eefc, BK = 0xe8a050, BK2 = 0xb86e2c, CL = 0x2a2230;
  const LS = (b, r, c, x, y, z, sx = 1, sy = 1, sz = 1) => b.add(new THREE.SphereGeometry(r, 7, 5), c, x, y, z, 0, 0, 0, sx, sy, sz), LC = (b, r, h, c, x, y, z, rx = 0, ry = 0, rz = 0) => b.add(new THREE.ConeGeometry(r, h, 5), c, x, y, z, rx, ry, rz); // #139 detail bits: fixed low poly
  { const b = builder(); b.sph(0.3, sg(24), sg(18), P, 0, 0, 0, 1, 0.82, 1.3);
    for (let k = 0; k < (hd ? 14 : 7); k++) { const a = k * 2.399, u = (k + 0.5) / (hd ? 14 : 7), y = 0.08 + 0.14 * Math.sqrt(u), r = 0.2 * Math.sqrt(1 - u * 0.6);
      b.sph(0.11 - u * 0.03, sg(10), sg(8), k % 3 ? P : P2, Math.sin(a) * r * 0.9, y, -0.1 + Math.cos(a) * r * 1.2, 1, 0.55, 1.4); } // feather clumps on the back
    for (let k = 0; k < (hd ? 7 : 5); k++) { const s = (k - ((hd ? 7 : 5) - 1) / 2) / 3, c = k % 2 ? P2 : W1; // plume tail arcing up and back
      b.tube([V(s * 0.08, 0.1, -0.36), V(s * 0.16, 0.24, -0.5), V(s * 0.24, 0.36, -0.52 + Math.abs(s) * 0.05), V(s * 0.3, 0.38, -0.44)], 0.022 - Math.abs(s) * 0.004, sg(14), sg(7), c);
      b.sph(0.045, sg(10), sg(8), c, s * 0.3, 0.38, -0.44, 1, 0.7, 1.4); }
    for (const s of [-1, 1]) { b.sph(0.13, sg(14), sg(10), P2, s * 0.25, 0.05, -0.04, 0.38, 0.72, 1.45); // folded wing
      for (let k = 0; k < 4; k++) b.cone(0.035, 0.24, sg(8), W1, s * (0.29 + k * 0.006), -0.04 - k * 0.02, -0.18 - k * 0.07, -2.5 + k * 0.12, 0, s * 0.18); }
    b.sph(0.2, sg(14), sg(10), 0xa25ce0, 0, -0.08, 0.16, 1, 0.7, 0.9); // chest
    // #139 more detail: overlapping feather rows down the flanks and rump, soft chest ruff, white-edged wing coverts
    if (hd) { for (const s of [-1, 1]) for (let row = 0; row < 3; row++) for (let k = 0; k < 5; k++) { const z = 0.16 - k * 0.11 - row * 0.03, y = 0.1 - row * 0.09, x = s * (0.21 + row * 0.03 - Math.abs(k - 2) * 0.012);
        LS(b, 0.05, (row + k) % 2 ? P : P2, x, y, z, 0.35, 0.5, 1.25); }
      for (let k = 0; k < 7; k++) { const a = (k - 3) * 0.32; LS(b, 0.045, k % 2 ? 0xb06ae8 : 0xa25ce0, Math.sin(a) * 0.15, -0.16 - Math.abs(k - 3) * 0.012, 0.25 + Math.cos(a) * 0.04, 1, 0.55, 0.8); } // chest ruff
      for (const s of [-1, 1]) for (let k = 0; k < 5; k++) LS(b, 0.03, W1, s * 0.3, 0.1 - k * 0.012, 0.04 - k * 0.06, 0.3, 0.45, 1.1); } // covert tips
    body.add(b.mesh(FE)); }
  const neck = new THREE.Group(); neck.position.set(0, 0.12, 0.3); body.add(neck);
  { const b = builder(); b.tube([V(0, -0.02, -0.02), V(0, 0.18, 0.08), V(0, 0.4, 0.03), V(0, 0.6, 0.1)], 0.045, sg(20), sg(10), SK); // S-curve neck
    b.tor(0.075, 0.04, sg(10), sg(18), P, 0, 0.02, 0.0, Math.PI / 2 - 0.4, 0, 0); b.tor(0.06, 0.03, sg(8), sg(16), P2, 0, 0.07, 0.03, Math.PI / 2 - 0.3, 0, 0); // fluff collar
    b.sph(0.078, sg(18), sg(14), SK, 0, 0.645, 0.135, 1, 0.92, 1.18); // head
    for (let k = 0; k < 5; k++) b.sph(0.02, sg(8), sg(6), P, (k - 2) * 0.012, 0.72 - Math.abs(k - 2) * 0.006, 0.1 - k * 0.012, 1, 1.5, 1); // crest tuft
    neck.add(b.mesh(SKM)); }
  { const b = builder(); b.sph(0.045, sg(14), sg(8), BK, 0, 0.632, 0.215, 0.85, 0.36, 1.25); b.sph(0.04, sg(12), sg(6), BK2, 0, 0.617, 0.21, 0.8, 0.22, 1.18); // flat beak, upper + lower
    for (const s of [-1, 1]) { b.sph(0.024, sg(12), sg(10), 0xffffff, s * 0.055, 0.662, 0.165); b.sph(0.014, sg(10), sg(8), 0x231a2e, s * 0.072, 0.664, 0.172); b.sph(0.005, 6, 5, 0xffffff, s * 0.079, 0.669, 0.176); // eyes
      b.sph(0.027, sg(12), sg(6), SK, s * 0.054, 0.676, 0.163, 1, 0.45, 1); // heavy lids
      if (hd) { for (let k = 0; k < 5; k++) LC(b, 0.0025, 0.022, 0x231a2e, s * (0.062 + k * 0.004), 0.688, 0.15 + k * 0.009, -0.5, 0, -s * (0.5 + k * 0.08)); // long lashes (#139)
        LS(b, 0.0045, 0x5a3a1c, s * 0.012, 0.642, 0.24); LS(b, 0.009, 0x3a2a40, s * 0.077, 0.652, 0.11, 0.5, 1, 1); } } // nostrils, ear opening
    if (hd) { b.add(new THREE.TorusGeometry(0.044, 0.0018, 3, 12, Math.PI), 0x7a4420, 0, 0.625, 0.205, Math.PI / 2, 0, 0); // gape line along the beak
      for (let k = 0; k < 8; k++) LS(b, 0.012, SK, (k % 2 ? 1 : -1) * 0.03, 0.12 + k * 0.06, 0.06 + Math.sin(k * 0.9) * 0.03, 1, 1.4, 1); } // fuzz down the neck
    neck.add(b.mesh(GL)); }
  const legs = [-1, 1].map(s => { const hip = new THREE.Group(); hip.position.set(s * 0.12, 0.9, 0); root.add(hip);
    const b = builder(); b.sph(0.085, sg(14), sg(10), P2, 0, -0.06, 0, 1, 1.3, 1.05); b.cyl(0.055, 0.036, 0.36, sg(14), SK, 0, -0.25, 0); b.sph(0.036, sg(10), sg(8), SK, 0, -0.42, 0); if (hd) for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; LC(b, 0.022, 0.09, k % 2 ? P : P2, Math.sin(a) * 0.07, -0.15, Math.cos(a) * 0.07, Math.cos(a) * 0.35 + Math.PI, 0, -Math.sin(a) * 0.35); } hip.add(b.mesh(FE)); /* #139 feather fringe at the bottom of the thigh */
    const knee = new THREE.Group(); knee.position.y = -0.42; hip.add(knee);
    const c = builder(); c.cyl(0.026, 0.02, 0.44, sg(12), SK, 0, -0.22, 0); if (hd) for (let k = 0; k < 7; k++) c.tor(0.024 - k * 0.0006, 0.0035, 5, sg(12), 0xc8aede, 0, -0.08 - k * 0.048, 0.004, Math.PI / 2 + 0.25, 0, 0); // scaled shin
    c.sph(0.026, sg(10), sg(8), SK, 0, -0.45, 0); c.rbox(0.055, 0.026, 0.17, 0.012, SK, -s * 0.005, -0.465, 0.06); c.rbox(0.035, 0.02, 0.1, 0.009, SK, s * 0.04, -0.468, 0.04, 0, s * 0.35, 0); // two toes
    c.cone(0.014, 0.04, sg(8), CL, -s * 0.005, -0.468, 0.16, Math.PI / 2); if (hd) { for (let k = 0; k < 4; k++) c.add(new THREE.BoxGeometry(0.05, 0.006, 0.02), 0xc8aede, -s * 0.005, -0.451, 0.0 + k * 0.035); LS(c, 0.03, 0xcab4dc, 0, -0.02, 0.012, 1, 0.8, 1); } /* #139 toe scutes, knee joint */ c.cone(0.01, 0.028, sg(6), CL, s * 0.06, -0.47, 0.085, Math.PI / 2, 0, -s * 0.35);
    knee.add(c.mesh(SKM)); return { hip, knee }; });
  const okRest = (x, z) => !world.inPaintZone(x, z, 0.6) && !world.nearDoor(x, z, 1.5) && !(world.nearGate && world.nearGate(x, z, 0.5)); // never by a gate either
  let start = null; for (let n = 0; n < 6 && !start; n++) start = world.randomFree(0.7, (x, z) => okRest(x, z) && world.spawnOk(x, z, world.spawns, 12, 15 - n * 1.5)); // own room, away from the box and the start
  start = start || world.randomFree(0.7, (x, z) => Math.hypot(x - E.cam.x, z - E.cam.z) > 8 && okRest(x, z)) || V(E.cam.x - 3, 0, E.cam.z); root.position.copy(start);
  world.spawns.push({ name: 'ostrich', x: start.x, z: start.z, room: world.roomOf(start.x, start.z) });
  const col = { x: start.x, z: start.z, r: 0.42, name: 'ostrich', pass: true }; world.colliders.push(col);
  const O2 = { mode: 'idle', t: 1, path: null, seg: 0, ph: 0, v: V(), peck: 0, flap: 0 };
  const squawk = () => { A.tone(420, 0.22, 'square', 0.06, 0, 240); A.tone(380, 0.18, 'sawtooth', 0.05, 0.2, 200); A.noise(0.2, 1200, 0.05, 0.05); };
  function push(imp, quiet) { O2.v.add(V(imp.x, 0, imp.z).multiplyScalar(0.7)); O2.flap = 1.5; O2.mode = 'shoved'; O2.t = 0; if (quiet) return; squawk(); O.bubble(neck, pick(['SKRAWK!', 'Honk?!', 'Zap that elsewhere!']), 1.6, { off: 0.9 }); E.found('ostrich'); }
  E.pushables.push({ name: 'ostrich', obj: root, r: 0.45, push });
  function update(dt, tm) { O2.t += dt; const pos = root.position; let speed = 0;
    if (O2.mode === 'idle' && O2.t < 3 && !okRest(pos.x, pos.z)) O2.t = 6.1; /* never loiter in a viewing zone or doorway */
    if (O2.mode === 'idle') { O2.peck = Math.max(0, Math.sin(O2.t * 2.2)) * (O2.t % 6 < 3 ? 1 : 0); if (O2.t > rand(3, 6)) { const tgt = world.randomFree(0.6, (x, z) => { const d = Math.hypot(x - pos.x, z - pos.z); return d > 4 && d < 18 && okRest(x, z); }); const p = tgt && world.path(V(pos.x, 0, pos.z), tgt, 0.5); if (p) { O2.path = p; O2.seg = 1; O2.mode = 'walk'; O2.t = 0; } else O2.t = 0; } }
    else if (O2.mode === 'walk') { O2.peck = 0; const tg = O2.path[O2.seg], dx = tg.x - pos.x, dz = tg.z - pos.z, d = Math.hypot(dx, dz); speed = 1.0; const s = speed * dt; if (d < s) { pos.x = tg.x; pos.z = tg.z; if (++O2.seg >= O2.path.length) { O2.mode = 'idle'; O2.t = 0; } } else { pos.x += dx / d * s; pos.z += dz / d * s; let dy = Math.atan2(dx, dz) - root.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); root.rotation.y += dy * Math.min(1, dt * 4); } if (O2.t > 40) { O2.mode = 'idle'; O2.t = 0; } }
    else if (O2.mode === 'shoved') { const nx = pos.x + O2.v.x * dt, nz = pos.z + O2.v.z * dt; if (world.walkable(nx, nz) && world.clearAt(nx, nz) > 0.2) { pos.x = nx; pos.z = nz; } else O2.v.multiplyScalar(-0.4); speed = O2.v.length(); O2.v.multiplyScalar(Math.max(0, 1 - 2.5 * dt)); if (speed < 0.1 && O2.t > 0.8) { O2.mode = 'idle'; O2.t = 0; } }
    O2.ph += dt * (speed > 0.05 ? 6 + speed * 3 : 0); const sw = speed > 0.05 ? 1 : 0;
    legs.forEach((l, i) => { const p = O2.ph + i * Math.PI; l.hip.rotation.x = Math.sin(p) * 0.55 * sw; l.knee.rotation.x = Math.max(0, -Math.sin(p + 0.6)) * 0.9 * sw; });
    body.position.y = 0.95 + Math.abs(Math.sin(O2.ph)) * 0.04 * sw; neck.rotation.x = O2.peck * 1.1 + Math.sin(O2.ph * 2) * 0.08 * sw; O2.flap = Math.max(0, O2.flap - dt); body.rotation.z = Math.sin(tm * 25) * 0.06 * Math.min(1, O2.flap);
    col.x = pos.x; col.z = pos.z;
    const cp = E.cam, dd = Math.hypot(cp.x - pos.x, cp.z - pos.z); if (dd < 0.9 && O2.mode !== 'shoved') { const a = V(pos.x - cp.x, 0, pos.z - cp.z).normalize(); push(a.multiplyScalar(1.6), true); } }
  return { name: 'ostrich', group: root, get anchor() { return root.position; }, cull: 50, update, push, root,
    view: () => { const p = root.position, a0 = root.rotation.y + 0.4; // front three-quarter first; fall back round the bird to a walkable, clear spot
      for (let k = 0; k < 12; k++) { const a = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.52, x = p.x + Math.sin(a) * 2.6, z = p.z + Math.cos(a) * 2.6;
        if (world.walkable(x, z) && world.clearAt(x, z) > 0.35) return { from: V(x, 1.45, z), to: p.clone().setY(0.95) }; }
      const f = V(Math.sin(root.rotation.y), 0, Math.cos(root.rotation.y)); return { from: V(p.x + f.x * 2.8 + f.z * 1.2, 1.5, p.z + f.z * 2.8 - f.x * 1.2), to: p.clone().setY(1.0) }; } };
}
