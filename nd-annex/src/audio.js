// Synthesised four-on-the-floor beat (Web Audio) + optional live mic energy.
export class Beat {
  constructor() { this.bpm = 124; this.ctx = null; this.playing = false; this.mic = null; this.t0 = performance.now() / 1000; this.micEnergy = 0; this.nextNote = 0; this.step = 0; }
  now() { return this.ctx && this.playing ? this.ctx.currentTime - this.ctxT0 : performance.now() / 1000 - this.t0; }
  ensure() { if (!this.ctx) { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ctx.destination); } return this.ctx; }
  async toggleSynth() {
    const ctx = this.ensure(); await ctx.resume();
    if (this.playing) { this.playing = false; clearInterval(this.timer); this.t0 = performance.now() / 1000 - (ctx.currentTime - this.ctxT0); return false; }
    // keep beat phase continuous
    this.ctxT0 = ctx.currentTime - (performance.now() / 1000 - this.t0);
    this.playing = true; const spb = () => 60 / this.bpm;
    const songT = this.now(); this.step = Math.ceil(songT / (spb() / 4)); this.nextNote = this.ctxT0 + this.step * spb() / 4;
    this.timer = setInterval(() => {
      while (this.nextNote < ctx.currentTime + 0.12) { this.note(this.step, this.nextNote); this.step++; this.nextNote += spb() / 4; }
    }, 25);
    return true;
  }
  note(step, at) {
    const ctx = this.ctx, s = step % 16;
    if (s % 4 === 0) { // kick
      const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, at); o.frequency.exponentialRampToValueAtTime(42, at + 0.12);
      g.gain.setValueAtTime(0.9, at); g.gain.exponentialRampToValueAtTime(0.001, at + 0.32); o.connect(g).connect(this.master); o.start(at); o.stop(at + 0.34);
    }
    if (s % 4 === 2) this.noise(at, 0.06, 7000, 0.25); // off-beat hat
    if (s === 4 || s === 12) this.noise(at, 0.16, 1800, 0.35); // clap
    if (s % 2 === 0) { // bass
      const notes = [41.2, 41.2, 49, 36.7]; const f = notes[Math.floor(step / 16) % 4] * (s % 8 === 6 ? 2 : 1);
      const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 420;
      g.gain.setValueAtTime(0.0, at); g.gain.linearRampToValueAtTime(0.18, at + 0.01); g.gain.exponentialRampToValueAtTime(0.001, at + 0.2);
      o.connect(lp).connect(g).connect(this.master); o.start(at); o.stop(at + 0.22);
    }
  }
  noise(at, dur, freq, vol) {
    const ctx = this.ctx; const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate); const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
    g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.001, at + dur); src.connect(f).connect(g).connect(this.master); src.start(at);
  }
  async toggleMic() {
    if (this.mic) { this.mic.stream.getTracks().forEach(t => t.stop()); this.mic = null; this.micEnergy = 0; return false; }
    const ctx = this.ensure(); await ctx.resume();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } });
    const src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser(); an.fftSize = 1024; src.connect(an);
    this.mic = { stream, an, buf: new Uint8Array(an.frequencyBinCount), avg: 0.05 }; return true;
  }
  // beat state at song time t
  at(t) {
    const x = t * this.bpm / 60; let energy = 1;
    if (this.mic) energy = 0.25 + 1.6 * this.micEnergy;
    return { phase: x - Math.floor(x), index: Math.floor(x), energy: Math.min(1.6, energy) };
  }
  poll() {
    if (!this.mic) return; const m = this.mic; m.an.getByteFrequencyData(m.buf);
    let low = 0; for (let i = 1; i < 24; i++) low += m.buf[i]; low /= 23 * 255;
    m.avg = m.avg * 0.995 + low * 0.005; this.micEnergy = Math.max(0, Math.min(1, (low - m.avg * 0.6) * 2.5));
  }
}
