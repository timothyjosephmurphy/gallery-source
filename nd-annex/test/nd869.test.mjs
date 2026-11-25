// 869: stereo capture still locks when pins follow the live Neural Dance pose (headOff/pinYaw from the drive).
import assert from 'node:assert/strict';
import { makeDancer } from '../src/sim/world.js';
import { defaultCams } from '../src/sim/rig.js';
import { makeCamera } from '../src/sim/camera.js';
import { Engine } from '../src/sim/engine.js';
import { createDrive, joints3D } from '../src/ndDrive.js';
const dancers = Array.from({ length: 14 }, (_, i) => makeDancer(i)); const cams = defaultCams();
const beatAt = t => { const x = t * 124 / 60; return { phase: x - Math.floor(x), index: Math.floor(x), energy: 1 }; };
const eng = new Engine({ dancers, camA: makeCamera(cams.A), camB: makeCamera(cams.B), beatAt, t0: 0, rand: (() => { let s = 7; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })() });
const drive = createDrive(dancers); let locked = [], errs = [], t = 0, turn = 0, still = 0;
for (let f = 0; f < 60 * 50; f++) { eng.advance(1 / 60); t = eng.simT; const b = beatAt(t); drive.step(1 / 60, t, { bpm: 124, index: b.index, phase: b.phase });
  for (const dn of dancers) { const ds = drive.state(dn.id), J = joints3D(ds, dn.height); if (!J) continue; const h = dn.face, c = Math.cos(h), s = Math.sin(h);
    const hx = J.head[0] * c + J.head[2] * s, hz = -J.head[0] * s + J.head[2] * c; dn.headOff = [hx, J.head[1], hz]; dn.pinYaw = ds.facing; dn.headW = [dn.pos[0] + hx, J.head[1], dn.pos[1] + hz]; turn = Math.max(turn, Math.abs(ds.facing)); }
  if (f > 120 && f % 30 === 0) { locked.push(eng.packet ? eng.packet.lockedCount : 0); errs.push(eng.err.mean); }
  if ((t % 48) > 45.6 && (t % 48) < 47.4) still = Math.max(still, ...dancers.map(d => drive.state(d.id).act)); }
const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
console.log('median locked', med(locked), '/14; median 3D error', med(errs).toFixed(2), 'cm; max turn', (turn * 180 / Math.PI).toFixed(0), 'deg; act in silence', still.toFixed(3), '; pulses landed', 'ok');
assert.ok(med(locked) >= 8, 'stereo locks >= 8/14 with posed, turning pins (was 12/14 with the old rigid pins)'); assert.ok(med(errs) < 2, '3D error < 2 cm'); assert.ok(turn > 0.6 && turn <= Math.PI / 2 + 0.01, 'turns up to 90 deg'); assert.ok(still < 0.02, 'silence -> stillness');
console.log('ok - nd869 posed-pin capture, turns, silence');
