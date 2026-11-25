// Fixed-timestep 60 Hz engine: Room 1 dancers -> two simulated phones (optics + CMOS) ->
// JSON PhoneFramePackets -> StereoHostNode -> JSON NeuralDanceFramePacket -> Room 2.
// Simulated time only advances in exact 1/60 s ticks (at most MAX_STEPS per display frame),
// independent of the display refresh rate; a slow display slows the sim instead of dropping frames.
import { dancerState, stepDancers } from './world.js';
import { captureSensorFrame } from './sensor.js';
import { makePhonePacket, StereoHostNode, EnergyRoomPipe } from './pipe.js';
export const STEP = 1 / 60, MAX_STEPS = 6;

export class Engine {
  constructor({ dancers, camA, camB, beatAt, t0 = 0, rand }) {
    Object.assign(this, { dancers, camA, camB, beatAt, rand });
    this.simT = t0; this.acc = 0; this.skew = 0; this.sync = true; this.exposure = 1 / 500; this.dancing = true; this.waveAt = null;
    this.pipe = new EnergyRoomPipe(); this.seq = 0; this.reset(); this.onTick = null;
  }
  reset() {
    this.host = this.camA ? new StereoHostNode({ A: this.camA, B: this.camB }, { interp: this.sync }) : null;
    this.lastFrames = {}; this.lastPackets = {}; this.lastRec = []; this.err = { mean: 0, max: 0, miss: 0, n: 0, rejected: 0 }; this.packet = null;
  }
  get trkA() { return this.host.trk.A; } get trkB() { return this.host.trk.B; }
  advance(dtReal) {
    this.acc += Math.min(dtReal, 0.25); let k = 0;
    while (this.acc >= STEP - 1e-9 && k < MAX_STEPS) { this.simT += STEP; this.tick(this.simT); this.acc -= STEP; k++; }
    if (k === MAX_STEPS && this.acc > STEP) this.acc = 0;
    return k;
  }
  tick(t) {
    if (!this.host) this.reset();
    if (this.walk !== false) stepDancers(this.dancers, STEP, t, this.dancing, [this.camA, this.camB]);
    this.host.interp = this.sync;
    const sub = Math.max(4, Math.min(22, Math.ceil(this.exposure * 60 * 5) + 3));
    const opts = { exposure: this.exposure, beatAt: this.beatAt, dancing: this.dancing, waveAt: this.waveAt, subSamples: sub, rand: this.rand };
    const fA = captureSensorFrame(this.camA, this.dancers, t, opts);
    const tB = t - this.skew / 1000, fB = captureSensorFrame(this.camB, this.dancers, tB, opts);
    const seq = this.seq++;
    // phones only send serialized packets; B stamps with its own clock unless synced
    const wA = JSON.stringify(makePhonePacket('A', seq, t * 1000, this.exposure, fA.blobs));
    const wB = JSON.stringify(makePhonePacket('B', seq, (this.sync ? tB : t) * 1000, this.exposure, fB.blobs));
    this.lastFrames = { A: fA, B: fB }; this.lastPackets = { A: wA, B: wB };
    this.host.ingest(JSON.parse(wA)); this.host.ingest(JSON.parse(wB));
    const pkt = this.host.process(t); const wire = JSON.stringify(pkt);
    this.lastRec = this.host.lastRec; this.wire = wire; this.pipe.publish(wire); this.packet = this.pipe.last;
    // ground truth used ONLY for the error readout (raw stereo points vs true pin)
    let se = 0, mx = 0, sm = 0; const rec = this.lastRec;
    for (const r of rec) { const dn = this.dancers.find(d => d.id === r.id); if (!dn) continue; const g = dancerState(dn, r.t, this.beatAt(r.t), this.dancing).pin; const e = Math.hypot(r.P[0] - g[0], r.P[1] - g[1], r.P[2] - g[2]) * 100; se += e; mx = Math.max(mx, e); sm += r.miss * 100; }
    const n = rec.length; this.err = { mean: n ? se / n : 0, max: mx, miss: n ? sm / n : 0, n, rejected: rec.rejected, glints: this.host.rejectedGlints };
    this.onTick && this.onTick(t);
  }
  activeSprites() { return this.packet ? this.packet.sprites.length : 0; }
  // host map view for movers / waves (from the packet only)
  hostMap() { const p = this.packet; if (this._hm && this._hmSeq === (p && p.seq)) return this._hm; const m = new Map(); this._hm = m; this._hmSeq = p && p.seq; if (!p) return m; const T = p.hostTsMs / 1000; for (const s of p.sprites) m.set(s.id, { P: s.pos, X: s.pos[0], Y: s.pos[2], vel: [s.vel[0], s.vel[2]], dZ: s.dZ, t: T - s.coastS, conf: s.confidence, energy: s.energy }); return m; }
}
