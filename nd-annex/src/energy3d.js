// 871 (TJ 9:37 PM): the #823 3D energy & wave algorithm (src/nd3d/, from /workspace/nd-3d-energy) driving the
// pulses, head flashes and light energy in BOTH annex rooms. Its dancers are ONLY the capture pipeline's tracks
// (camera -> blobs -> triangulation -> decoded IDs -> telemetry packet): position, head height, ID, with the
// pipe's latency, dropouts and ID swaps. Nothing here reads ground-truth poses.
// Units: the module's native units are live-mural units; 1 m = 100 units (link radius 0.82..1.7 m,
// contact 4 cm, capture 28 cm, V_MAX 2.8 m/s).
import { createWorld } from './nd3d/energy-core.js';
import { vec3 } from './nd3d/vec3.js';
import { musicAt, BAND } from './ndDrive.js';

export const U = 100;
export const bandOfId = id => ((id * 7) % 4 + 4) % 4; // same band rule as the pose drive (live: sticker type)

export function createEnergy3D({ seed = 871, holdS = 1.2 } = {}) {
  const W = createWorld({ clockOn: false, autoLink: true, gravity: 1.15, wander: 0.08, emitWaves: true, seed,
    bounds: { min: vec3(-520, 0, -520), max: vec3(520, 420, 520) } });
  const seen = new Map(), flash = new Map(), act = new Map(); let lastHalf = -1, silent = false, fired = 0, landed = 0;
  const headOf = s => ({ x: s.pos[0] * U, y: Math.max(0.25, s.pos[1]) * U, z: s.pos[2] * U });
  // packet: { sprites: [{ id, pos:[x,y,z] (room-local m, triangulated head pin), confidence, ... }] }
  function sync(packet, t) {
    if (packet) for (const s of packet.sprites) { const h = headOf(s), hip = { x: h.x, y: Math.max(0, h.y - 0.75 * U), z: h.z };
      if (!seen.has(s.id)) W.addDancer({ id: s.id, x: hip.x, y: hip.y, z: hip.z, k: bandOfId(s.id), head: h });
      else W.setPose(s.id, { x: hip.x, y: hip.y, z: hip.z, head: h });
      seen.set(s.id, t); }
    for (const [id, ts] of seen) if (t - ts > holdS) { W.removeDancer(id); seen.delete(id); flash.delete(id); act.delete(id); } // dropout: hold, then gone
  }
  // beat: { bpm, index, phase } on the annex's synthetic music clock (the annex has no mic)
  function step(dt, t, beat) {
    const m = musicAt(t); silent = m.silent;
    const half = Math.floor((beat.index + beat.phase) * 2);
    if (half !== lastHalf && lastHalf >= 0 && !silent) for (let k = 0; k < 4; k++) {
      const B = BAND[k], pos = half / 2 - B.off; if (pos < 0 || Math.abs(pos - Math.round(pos)) > 1e-6 || Math.round(pos) % B.every) continue;
      if (m.energy >= B.min) W.hit(k);
    }
    lastHalf = half;
    const before = W.pulses.length;
    if (silent) W.settle(dt); else W.update(dt, { listening: true, gateOpen: true });
    const D = W.dancers;
    for (const p of W.pulses) { if (!p._n) { p._n = 1; fired++; } if (p.arrived && !p._f) { p._f = 1; landed++; const d = D[p.b]; if (d) flash.set(d.id, Math.min(1.5, (flash.get(d.id) || 0) + 0.8)); } }
    for (const [id, f] of flash) flash.set(id, Math.max(0, f - dt * 2.2));
    for (const d of D) act.set(d.id, d.a);
    return before;
  }
  const _p = vec3();
  return {
    world: W, sync, step,
    get silent() { return silent; }, get fired() { return fired; }, get landed() { return landed; },
    flashOf: id => flash.get(id) || 0,
    actOf: id => (act.has(id) ? act.get(id) : null),
    // E(p,t) point-sampled (room-local metres) — for moving heads / glows; O(waves + N)
    energyAt(x, y, z) { _p.x = x * U; _p.y = y * U; _p.z = z * U; return W.evaluateField(_p); },
    // pulses in room-local metres for rendering: { p:[x,y,z], trail:[[x,y,z]...], src id, dst id, prog }
    pulses() { const D = W.dancers, out = [];
      for (const q of W.pulses) { const A = D[q.a], B = D[q.b]; if (!A || !B) continue;
        const L0 = Math.hypot(B.head.x - A.head.x, B.head.y - A.head.y, B.head.z - A.head.z) || 1, r = Math.hypot(B.head.x - q.pos.x, B.head.y - q.pos.y, B.head.z - q.pos.z);
        out.push({ p: [q.pos.x / U, q.pos.y / U, q.pos.z / U], trail: q.trail.map(v => [v.x / U, v.y / U, v.z / U]), src: A.id, dst: B.id, prog: Math.max(0, Math.min(1, 1 - r / L0)), lift: (q.pos.y - (A.head.y + (B.head.y - A.head.y) * Math.max(0, Math.min(1, 1 - r / L0)))) / U, arrived: !!q.arrived }); }
      return out; },
  };
}
