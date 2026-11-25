// Always-lit 3-colour transition code (studio-tracker #818 / #821).
// Colours: 0=R 1=G 2=B. The pin is ON in exactly one colour every 60 Hz frame.
// Packet = SYNC hold (6 frames, one colour) + 8 payload symbols (3 frames each).
// Each symbol boundary is a colour transition c[k] = (c[k-1] + 1 + bit) mod 3,
// so +1 mod 3 encodes bit 0 and +2 mod 3 encodes bit 1 (never a repeat colour).
// Payload bits: 6-bit ID (MSB first) + 2 check bits (even parity over
// even-index and odd-index ID bits). Payload runs are always exactly 3 frames,
// so a 6-frame run cannot occur inside the payload: no false sync possible.
export const FPS = 60;
export const SYNC_FRAMES = 6;
export const SYM_FRAMES = 3;
export const ID_BITS = 6;
export const PAYLOAD_BITS = 8;
export const PACKET_FRAMES = SYNC_FRAMES + PAYLOAD_BITS * SYM_FRAMES; // 30 frames = 0.5 s

export function payloadBits(id) {
  const b = [];
  for (let i = ID_BITS - 1; i >= 0; i--) b.push((id >> i) & 1);
  let pe = 0, po = 0;
  b.forEach((x, i) => { if (i % 2) po ^= x; else pe ^= x; });
  b.push(pe, po);
  return b;
}

// Symbol colours for one packet given the colour the previous packet ended on.
// The transition into SYNC is always +1 (carries no data).
export function packetSymbols(id, prevColor) {
  const sync = (prevColor + 1) % 3;
  const syms = [sync];
  let c = sync;
  for (const bit of payloadBits(id)) { c = (c + 1 + bit) % 3; syms.push(c); }
  return syms;
}

// Frame-accurate colour sequence for a pin, cached per id.
const cache = new Map();
function cycle(id) {
  // Find a steady-state cycle: packets repeat once the end colour repeats.
  if (cache.has(id)) return cache.get(id);
  let prev = 2; const frames = [];
  for (let p = 0; p < 3; p++) {
    const s = packetSymbols(id, prev);
    for (let f = 0; f < SYNC_FRAMES; f++) frames.push(s[0]);
    for (let k = 1; k < s.length; k++) for (let f = 0; f < SYM_FRAMES; f++) frames.push(s[k]);
    prev = s[s.length - 1];
    if (prev === 2) break;
  }
  cache.set(id, frames);
  return frames;
}
export function colorAtFrame(id, frame) {
  const c = cycle(id); return c[((frame % c.length) + c.length) % c.length];
}
export function cycleLength(id) { return cycle(id).length; }

// Stateful sliding-window decoder fed one colour observation per camera frame.
// obs: 0/1/2, or -1 for unknown (mixed / smeared / low confidence).
export class TransitionDecoder {
  constructor() { this.reset(); }
  reset() { this.runs = []; this.cur = null; this.len = 0; this.id = -1; this.lockedAt = -1; this.frames = 0; this.rejects = 0; this.lastGood = -1; this.pend = 0; this.searchFrom = 0; this.lockFrames = -1; }
  push(obs) {
    this.frames++;
    // A single smeared frame on a colour boundary (exposure straddling the pin's
    // frame edge) is folded into the next run instead of breaking the code.
    if (obs === -1 && this.pend === 0 && this.cur !== -1) { this.pend = 1; return this.id; }
    if (this.pend) { this.pend = 0; if (obs !== -1) { if (obs === this.cur) { this.len += 2; return this.id; } this.pushRun(obs, 2); return this.id; } this.pushRun(-1, 2); return this.id; }
    if (obs === this.cur) { this.len++; return this.id; }
    this.pushRun(obs, 1);
    return this.id;
  }
  pushRun(obs, len) {
    if (obs === this.cur) { this.len += len; return; }
    if (this.cur !== null) this.runs.push([this.cur, this.len]);
    if (this.runs.length > 24) this.runs.shift();
    this.cur = obs; this.len = len;
    this.tryDecode();
  }
  // Payload transitions are identical in every repetition of the packet, so the
  // decoder may read the tail of the previous packet before the sync run and the
  // head after it (cyclic read). Needs ~one packet span (~30 frames) from any phase.
  tryDecode() {
    const r = this.runs, n = r.length;
    const ok = k => k >= 1 && r[k][0] >= 0 && r[k][1] >= SYM_FRAMES - 1 && r[k][1] <= SYM_FRAMES + 1;
    for (let s = n - 2; s >= 1 && s >= n - 1 - PAYLOAD_BITS; s--) {
      const [sc, sl] = r[s];
      if (sc < 0 || sl < SYNC_FRAMES - 1 || sl > SYNC_FRAMES + 2) continue;
      const m = n - 1 - s; // completed payload runs after sync -> bits b1..bm
      const bits = new Array(PAYLOAD_BITS); let bad = false;
      for (let k = 1; k <= PAYLOAD_BITS && !bad; k++) {
        let i0, i1;
        if (k <= m) { i1 = s + k; i0 = i1 - 1; }
        else { i1 = s - 1 - (PAYLOAD_BITS - k); i0 = i1 - 1; if (k === PAYLOAD_BITS) {} }
        // previous-packet tail: run before sync is p8 at s-1; p1 at s-8 whose predecessor is the old sync
        if (i0 < 0 || !ok(i1) || !(k <= m ? (i0 === s || ok(i0)) : (k === 1 ? true : ok(i0)))) { bad = true; break; }
        const d = (r[i1][0] - r[i0][0] + 3) % 3;
        if (d === 0 || r[i0][0] < 0) { bad = true; break; }
        bits[k - 1] = d - 1;
      }
      if (bad) continue;
      // the transition p8 -> sync must be the fixed +1
      if ((sc - r[s - 1][0] + 3) % 3 !== 1 && m < PAYLOAD_BITS) continue;
      const id = bits.slice(0, ID_BITS).reduce((a, b) => a * 2 + b, 0);
      const chk = payloadBits(id);
      if (chk[6] !== bits[6] || chk[7] !== bits[7]) { this.rejects++; continue; }
      if (this.id !== id) { if (this.id < 0) this.lockFrames = this.frames - this.searchFrom; this.id = id; this.lockedAt = this.frames; }
      this.lastGood = this.frames;
      return;
    }
  }
}

// Colour classification of an integrated (exposure-averaged) RGB blob.
export function classify(rgb, thresh = 0.68) {
  const s = rgb[0] + rgb[1] + rgb[2];
  if (s <= 1e-6) return -1;
  let m = 0; for (let i = 1; i < 3; i++) if (rgb[i] > rgb[m]) m = i;
  return rgb[m] / s >= thresh ? m : -1;
}
export const RGB = [[1, 0.06, 0.08], [0.08, 1, 0.18], [0.1, 0.22, 1]];
