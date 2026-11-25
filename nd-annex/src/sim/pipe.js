// Wire protocol + host node for Room 1 (capture) -> Room 2 (energy sprites).
// Phone -> host:  PhoneFramePacket        (JSON, one per camera frame, 60 Hz)
// Host -> rooms:  NeuralDanceFramePacket  (JSON, one per host tick, 60 Hz)
// StereoHostNode sees ONLY PhoneFramePackets; EnergyRoom consumers see ONLY NeuralDanceFramePackets.
import { CamTracker, stereo } from './world.js';
import { undistortPixel, backProject, v3 } from './camera.js';

export const WIRE_VERSION = 1;
export function makePhonePacket(camId, seq, captureTsMs, exposureS, blobs) {
  return { v: WIRE_VERSION, camId, seq, captureTsMs: Math.round(captureTsMs * 1000) / 1000, exposureS, blobs: blobs.map(b => ({ u: b.u, v: b.v, r: b.r, g: b.g, b: b.b, lum: b.lum, area: b.area, major: b.major, minor: b.minor })) };
}
export function validatePhonePacket(p) {
  return p && p.v === WIRE_VERSION && (p.camId === 'A' || p.camId === 'B') && Number.isFinite(p.seq) && Number.isFinite(p.captureTsMs) && Array.isArray(p.blobs) && p.blobs.every(b => Number.isFinite(b.u) && Number.isFinite(b.v) && Number.isFinite(b.r));
}
// glint rejection: tiny + achromatic (white) specular hits are not LED pins
export function isGlint(b) { const mx = Math.max(b.r, b.g, b.b), mn = Math.min(b.r, b.g, b.b); return b.area < 1.6 && mn / Math.max(1, mx) > 0.6; }

export class StereoHostNode {
  // cams: receiver-side calibration {A, B} (intrinsics, extrinsics, k1/k2) from the party-setup wave calibration
  constructor(cams, { interp = true, alpha = 0.55, beta = 0.22, coastS = 0.5, maxMiss = 0.08, crosstalk = 0.04 } = {}) {
    this.crosstalk = crosstalk; this.cams = cams; this.interp = interp; this.alpha = alpha; this.beta = beta; this.coastS = coastS; this.maxMiss = maxMiss;
    this.trk = { A: new CamTracker(), B: new CamTracker() }; this.pending = {}; this.tracks = new Map(); this.seq = 0; this.lastRec = []; this.rejectedGlints = 0; this.rx = { A: null, B: null };
  }
  ingest(pkt) {
    if (!validatePhonePacket(pkt)) throw new Error('bad PhoneFramePacket ' + JSON.stringify(pkt).slice(0, 300));
    const cam = this.cams[pkt.camId], blobs = [];
    for (const b of pkt.blobs) {
      if (isGlint(b)) { this.rejectedGlints++; continue; }
      const [u, v] = undistortPixel(cam, b.u, b.v);
      // colour-correction matrix: invert the sensor's 4% Bayer crosstalk (calibrated once per phone model)
      const k = this.crosstalk, sum = b.r + b.g + b.b, cc = [b.r, b.g, b.b].map(x => Math.max(0, (x - k * sum) / (1 - 3 * k))); const s = cc[0] + cc[1] + cc[2] || 1;
      blobs.push({ u, v, ud: b.u, vd: b.v, rgb: [cc[0] / s, cc[1] / s, cc[2] / s], major: b.major, minor: b.minor, streak: null });
    }
    const tk = this.trk[pkt.camId]; tk.update(blobs, pkt.captureTsMs / 1000); this.rx[pkt.camId] = pkt;
  }
  // Run stereo + filtering at host time t (s); returns a NeuralDanceFramePacket.
  process(t) {
    const rec = stereo(this.cams.A, this.cams.B, this.trk.A, this.trk.B, { interp: this.interp, maxMiss: this.maxMiss });
    const acc = []; acc.rejected = rec.rejected; acc.gated = 0;
    for (const r of rec) {
      let s = this.tracks.get(r.id);
      if (!s) { s = { pos: r.P.slice(), vel: [0, 0, 0], t: r.t, meas: r.t, first: r.t, baseZ: r.P[1], miss: r.miss, rej: 0, stereoT: r.t }; this.tracks.set(r.id, s); acc.push(r); continue; }
      const dt = Math.max(1e-3, r.t - s.t); const pred = s.pos.map((p, k) => p + s.vel[k] * dt);
      const res = r.P.map((p, k) => p - pred[k]);
      // 3D innovation gate: a body cannot teleport. A fresh track whose point jumps > 25 cm from the filter's
      // prediction is a 2D blob swap in one phone; hold the measurement out until the colour verifier fixes it.
      const gate = 0.12 + 1.5 * Math.max(0, r.t - s.meas - 1 / 60);
      if (Math.hypot(res[0], res[2]) > Math.min(0.25, gate) && r.t - s.meas < 0.3 && s.rej < 30) { s.rej++; acc.gated++; continue; }
      if (Math.hypot(...res) > 0.25) { s.pos = r.P.slice(); s.vel = [0, 0, 0]; s.t = r.t; s.meas = r.t; s.rej = 0; s.miss = r.miss; acc.push(r); continue; }
      s.rej = 0; acc.push(r);
      s.pos = pred.map((p, k) => p + this.alpha * res[k]); s.vel = s.vel.map((v, k) => v + this.beta * res[k] / dt);
      s.t = r.t; s.meas = r.t; s.stereoT = r.t; s.miss = r.miss; s.baseZ = s.pos[1] < s.baseZ ? s.pos[1] : s.baseZ + 0.04 / 60;
    }
    // Monocular bridge: when ONE phone is briefly grazed (<= 6 frames since the last two-phone fix), the other
    // phone's schedule-verified track still pins the dancer to a ray; depth comes from the filter's prediction
    // (closest point on that ray). Acquisition and re-verification always need both phones.
    const inRec = new Set(acc.map(r => r.id)); acc.mono = 0;
    for (const [id, s] of this.tracks) {
      if (inRec.has(id) || s.stereoT == null || t - s.stereoT > 0.1 || Math.abs(s.vel[1]) > 0.35) continue;
      for (const key of ['A', 'B']) {
        const tr = this.trk[key].tracks.find(x => x.dec.id === id && !x.miss && x.vid === id && !x.inherited && x.age >= 40 && x.vbad && x.vbad.length >= 8 && !x.vbad.some(b => b)); if (!tr) continue;
        const tm = tr.hist[tr.hist.length - 1][0], cam = this.cams[key], d = backProject(cam, tr.u, tr.v);
        const pred = s.pos.map((p, k) => p + s.vel[k] * (tm - s.t)); const P = v3.add(cam.C, v3.mul(d, v3.dot(v3.sub(pred, cam.C), d)));
        const dt = Math.max(1e-3, tm - s.t), res = P.map((p, k) => p - pred[k]); if (Math.hypot(...res) > 0.03) continue;
        s.pos = pred.map((p, k) => p + this.alpha * res[k]); s.vel = s.vel.map((v, k) => v + this.beta * 0.5 * res[k] / dt); s.t = tm; s.meas = tm;
        acc.push({ id, P, miss: 0, t: tm, mono: key }); acc.mono++; break;
      }
    }
    this.lastRec = acc;
    const sprites = [];
    for (const [id, s] of this.tracks) {
      const age = t - s.meas;
      if (age > this.coastS) { if (age > 3) this.tracks.delete(id); continue; }
      const pos = s.pos.map((p, k) => p + s.vel[k] * Math.max(0, t - s.t)); // coast on the alpha-beta velocity
      const sp = Math.hypot(s.vel[0], s.vel[2]), dZ = Math.max(0, pos[1] - s.baseZ);
      const r3 = x => Math.round(x * 1000) / 1000;
      sprites.push({ id, pos: pos.map(r3), vel: s.vel.map(r3), dZ: r3(dZ), energy: r3(Math.min(1.5, 0.25 + 0.5 * sp + 3 * dZ)), confidence: r3(Math.max(0, 1 - age / this.coastS)), lockAgeS: r3(t - s.first), missCm: Math.round(s.miss * 1000) / 10, coastS: r3(age) });
    }
    sprites.sort((a, b) => a.id - b.id);
    const pkt = { v: WIRE_VERSION, hostTsMs: Math.round(t * 1e6) / 1000, seq: this.seq++, byteLen: 0, lockedCount: acc.length, sprites };
    pkt.byteLen = JSON.stringify(pkt).length; pkt.byteLen = JSON.stringify(pkt).length;
    return pkt;
  }
}
// Room 2 side: subscribes to NeuralDanceFramePackets only.
export class EnergyRoomPipe {
  constructor() { this.subs = []; this.last = null; this.bytes = 0; this.win = []; }
  subscribe(fn) { this.subs.push(fn); }
  publish(json) { // json string on the wire
    const pkt = JSON.parse(json); this.last = pkt; this.win.push([pkt.hostTsMs, json.length]); while (this.win.length > 60) this.win.shift();
    for (const f of this.subs) f(pkt);
  }
  kbps() { if (this.win.length < 2) return 0; const dt = (this.win[this.win.length - 1][0] - this.win[0][0]) / 1000; const b = this.win.slice(1).reduce((a, x) => a + x[1], 0); return dt > 0 ? b * 8 / dt / 1000 : 0; }
}
