// Phone-side optical + CMOS simulation. Emits exactly what an on-phone blob extractor would:
// per-frame lists of {u, v, r, g, b, lum, area, major, minor, peak} in DISTORTED sensor pixels.
// Pure ESM, no three.js. Units: metres, seconds, 12-bit DN.
import { project, distortPixel, segHitsCapsule, v3 } from './camera.js';
import { dancerState, pinRGB } from './world.js';

export const CMOS = {
  fullWell: 4095,            // 12-bit DN clamp (highlight saturation)
  ledPower: 32000,           // DN at 1 m on-axis for a 1/500 s exposure, ISO locked
  bayer: 0.04,               // RGB colour-filter crosstalk (each channel bleeds 4% into its neighbours)
  jitterMin: 0.18, jitterMax: 0.35, // centroid jitter RMS (px), scaled by 1/sqrt(SNR)
  readNoise: 6,              // DN RMS
  minPeak: 90,              // detection threshold (DN)
  glintRate: 0.15,           // false specular glints per frame (white, tiny) -> host rejects
};

function gauss(r) { return Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r()); }

// Body capsules (torso + head) for occlusion, in world coords.
export function bodyCapsules(st, dn) {
  const b = st.base, up = dn.height;
  return [
    { A: [b[0], b[1] + 0.95, b[2]], B: [b[0], b[1] + up - 0.42, b[2]], r: 0.14 },          // torso
    { A: [st.head[0], st.head[1] - 0.04, st.head[2]], B: [st.head[0], st.head[1] + 0.06, st.head[2]], r: 0.11 }, // head
  ];
}

export function captureSensorFrame(cam, dancers, t, opts) {
  const { exposure, beatAt, dancing, waveAt, subSamples = 8, rand = Math.random, cmos = CMOS } = opts;
  const states = dancers.map(d => dancerState(d, t, beatAt(t), dancing));
  const caps = states.map((s, i) => bodyCapsules(s, dancers[i]));
  const blobs = [], truth = [];
  const expScale = exposure / (1 / 500);
  for (let i = 0; i < dancers.length; i++) {
    const dn = dancers[i]; let su = 0, sv = 0, w = 0, n = 0; const rgb = [0, 0, 0]; const pts = [];
    for (let k = 0; k < subSamples; k++) {
      const ts = t - exposure * (k + 0.5) / subSamples;
      const st = dancerState(dn, ts, beatAt(ts), dancing);
      const p = project(cam, st.pin); if (!p) continue;
      const [ud, vd] = distortPixel(cam, p.u, p.v); if (ud < 0 || ud >= cam.W || vd < 0 || vd >= cam.H) continue;
      // LED emission lobe: cos(theta) between the clip's outward normal (forward, tilted 25 deg up) and the camera
      const toCam = v3.sub(cam.C, st.pin), d = v3.len(toCam), dir = v3.mul(toCam, 1 / d);
      const nrm = v3.norm([st.fwd[0], 0.47, st.fwd[2]]), cosT = v3.dot(dir, nrm);
      // dome diffuser wraps ~110 deg off-axis; the wearer's own torso capsule does the real self-occlusion
      const emit = (cosT + 0.8) / 1.8; if (emit <= 0.04) continue; // collar-halo diffuser: lit all round, dimmer behind
      // occlusion by every body (including the wearer's own torso/head when turned away)
      let occ = false;
      for (let j = 0; j < dancers.length && !occ; j++) for (const c of caps[j]) if (segHitsCapsule(cam.C, st.pin, c.A, c.B, c.r)) { occ = true; break; }
      if (occ) continue;
      const irr = emit / (d * d); const c = pinRGB(dn, ts, waveAt && waveAt(dn, ts));
      su += ud * irr; sv += vd * irr; w += irr; n++; rgb[0] += c[0] * irr; rgb[1] += c[1] * irr; rgb[2] += c[2] * irr; pts.push([ud, vd]);
    }
    if (n < subSamples * 0.5 || w <= 0) continue;
    const mu = su / w, mv = sv / w; let irrMean = w / n;
    // blur ellipse from the sub-sample spread
    let cuu = 0, cvv = 0, cuv = 0; for (const [a, b] of pts) { cuu += (a - mu) ** 2; cvv += (b - mv) ** 2; cuv += (a - mu) * (b - mv); }
    cuu /= n; cvv /= n; cuv /= n; const tr = cuu + cvv, det = cuu * cvv - cuv * cuv, l1 = tr / 2 + Math.sqrt(Math.max(0, tr * tr / 4 - det)), l2 = Math.max(0, tr - l1);
    const major = 2.2 + 2 * Math.sqrt(l1), minor = 2.2 + 2 * Math.sqrt(l2), area = Math.PI * major * minor / 4;
    // signal: irradiance * exposure, spread over the streak area
    let ch = rgb.map(x => x / w * irrMean * cmos.ledPower * expScale * (6 / area));
    // Bayer crosstalk
    const bl = cmos.bayer; ch = [ch[0] * (1 - 2 * bl) + (ch[1] + ch[2]) * bl, ch[1] * (1 - 2 * bl) + (ch[0] + ch[2]) * bl, ch[2] * (1 - 2 * bl) + (ch[0] + ch[1]) * bl];
    // photon shot noise + read noise, then 12-bit saturation clamp
    ch = ch.map(x => Math.max(0, Math.min(cmos.fullWell, x + gauss(rand) * Math.sqrt(Math.max(1, x)) + gauss(rand) * cmos.readNoise)));
    const peak = Math.max(...ch); if (peak < cmos.minPeak) continue;
    const snr = peak / Math.sqrt(peak + cmos.readNoise ** 2);
    const sig = Math.max(cmos.jitterMin, Math.min(cmos.jitterMax, cmos.jitterMax * Math.sqrt(20 / snr)));
    const q = x => Math.round(x * 16) / 16; // 1/16 px sub-pixel centroid quantisation
    blobs.push({ u: q(mu + gauss(rand) * sig), v: q(mv + gauss(rand) * sig), r: Math.round(ch[0]), g: Math.round(ch[1]), b: Math.round(ch[2]), lum: Math.round(0.3 * ch[0] + 0.59 * ch[1] + 0.11 * ch[2]), area: Math.round(area * 10) / 10, major: Math.round(major * 10) / 10, minor: Math.round(minor * 10) / 10, peak: Math.round(peak) });
    truth.push(dn.id);
  }
  // specular glints off shiny surfaces: tiny, white, short-lived
  if (rand() < cmos.glintRate) { const g = 140 + rand() * 300; blobs.push({ u: Math.round(rand() * cam.W * 16) / 16, v: Math.round((0.55 + 0.45 * rand()) * cam.H * 16) / 16, r: Math.round(g), g: Math.round(g), b: Math.round(g * 0.95), lum: Math.round(g), area: 1.2, major: 1.2, minor: 1.2, peak: Math.round(g) }); }
  // shuffle: downstream must not rely on order (truth is discarded before the packet leaves the phone)
  for (let i = blobs.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [blobs[i], blobs[j]] = [blobs[j], blobs[i]]; }
  return { blobs, states, truth };
}
