// 871: Room 1 stage variation (traction on platforms, floor dancers keep out of footprints) + the #823 3D energy
// world fed ONLY from the capture packets (pulses fire, home and land on the captured head; silence settles).
import assert from 'node:assert/strict';
import { makeDancer } from '../src/sim/world.js';
import { SURFACES, inFootprint } from '../src/sim/stage.js';
import { defaultCams } from '../src/sim/rig.js';
import { makeCamera } from '../src/sim/camera.js';
import { Engine } from '../src/sim/engine.js';
import { createDrive, joints3D, musicAt } from '../src/ndDrive.js';
import { createEnergy3D } from '../src/energy3d.js';
const dancers = Array.from({ length: 14 }, (_, i) => makeDancer(i)); const cams = defaultCams();
const beatAt = t => { const x = t * 124 / 60; return { phase: x - Math.floor(x), index: Math.floor(x), energy: 1 }; };
const eng = new Engine({ dancers, camA: makeCamera(cams.A), camB: makeCamera(cams.B), beatAt, t0: 0, rand: (() => { let s = 11; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })() });
const drive = createDrive(dancers, { emit: false }), E3 = createEnergy3D();
const perched = dancers.filter(d => d.perch); assert.ok(perched.length >= 5, 'some dancers on platforms');
let offEdge = 0, inFp = 0, footErr = 0, locked = [], perchSeen = 0, perchY = [], firedSilent = 0, maxActSilent = 0, landErr = 0, lands = 0;
for (let f = 0; f < 60 * 50; f++) { eng.advance(1 / 60); const t = eng.simT, b = beatAt(t); drive.step(1 / 60, t, { bpm: 124, index: b.index, phase: b.phase });
  for (const dn of dancers) { const ds = drive.state(dn.id), J = joints3D(ds, dn.height); if (!J) continue; const h = dn.face, c = Math.cos(h), s = Math.sin(h);
    const hx = J.head[0] * c + J.head[2] * s, hz = -J.head[0] * s + J.head[2] * c; dn.headOff = [hx, J.head[1], hz]; dn.pinYaw = ds.facing;
    if (dn.perch) { const r = dn.perch; if (dn.pos[0] < r.x0 - 1e-6 || dn.pos[0] > r.x1 + 1e-6 || dn.pos[1] < r.z0 - 1e-6 || dn.pos[1] > r.z1 + 1e-6) offEdge++;
      if (!ds.jump) { const fy = Math.min(J.ankleL[1], J.ankleR[1]); if (fy < -0.03) footErr++; } }
    else if (f > 600 && inFootprint(dn.pos[0], dn.pos[1], 0.15)) inFp++; }
  const pk = eng.packet; E3.sync(pk, t); const fired0 = E3.fired; E3.step(1 / 60, t, { bpm: 124, index: b.index, phase: b.phase });
  const x = t % 48; if (x > 45.4 && x < 47.4) { firedSilent += E3.fired - fired0; for (const d of E3.world.dancers) maxActSilent = Math.max(maxActSilent, d.a); }
  for (const q of E3.world.pulses) if (q.arrived && !q._chk) { q._chk = 1; const d = E3.world.dancers[q.b]; lands++; landErr = Math.max(landErr, Math.hypot(q.pos.x - d.head.x, q.pos.y - d.head.y, q.pos.z - d.head.z)); }
  if (pk && f > 120 && f % 30 === 0) { locked.push(pk.lockedCount); for (const s of pk.sprites) { const dn = dancers.find(d => d.id === s.id); if (dn && dn.perch) { perchSeen++; perchY.push(s.pos[1] - dn.perch.y); } } } }
const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
console.log(`perched ${perched.length} (${perched.map(d => d.perch.id).join(',')}); off-edge ${offEdge}; floor-in-footprint ${inFp}; sunk feet ${footErr}; locked median ${med(locked)}/14; perched pin height above surface median ${med(perchY).toFixed(2)} m (${perchSeen} obs); 3D energy fired/landed ${E3.fired}/${E3.landed}, land err max ${(landErr / 100).toFixed(3)} m; fired in silence ${firedSilent}; max a in silence ${maxActSilent.toFixed(3)}`);
assert.equal(offEdge, 0, 'perched dancers never leave the platform top'); assert.equal(inFp, 0, 'floor dancers keep out of platform footprints'); assert.equal(footErr, 0, 'feet never sink below the surface');
assert.ok(med(locked) >= 8, 'stereo still locks >= 8/14'); assert.ok(perchSeen > 50 && med(perchY) > 1.2 && med(perchY) < 1.9, 'perched pins triangulate at surface + head height');
assert.ok(E3.fired > 50 && E3.landed > 20, '#823 pulses fire and land from capture-fed dancers'); assert.ok(landErr <= 4.01, 'pulses stop at the (captured) head');
assert.equal(firedSilent, 0, 'nothing fires in silence'); assert.ok(maxActSilent < 0.05, 'silence settles activation to ~0');
console.log('ok - nd871 stage traction + #823 3D energy from capture');
