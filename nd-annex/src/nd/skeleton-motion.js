// Copyright (c) 2026 TJ Murphy / Vermillion Aurora Productions
// All rights reserved. No use, copying, modification, or distribution
// without a written license. Contact tj@tjm.art.
// License: neural-dance/LICENSE

// Remaining side-sim body motion ported into the live renderer
// (TJ 8:02 / 8:12 PM): spine flex, arm flex, leg waves, glute/thigh
// jiggle, heel-toe footwork, hip figure-eight, and per-dancer stomp
// intensity. Defaults match the side-sim sliders. All of it scales to
// zero in silence (hush=0) and leaves planted feet unmoved in x.

import {pulseWaveAt, pulseDriveHz, pulseTravelTimes} from './vibrating-string.js';
const HEART_S = 0.417; // root→crown heart chakra (matches skeleton-dancer)

export const SPINE_FLEX = 0.85;
export const SPINE_LAG = 4.0;
export const ARM_FLEX = 0.80;
export const LEG_COMPLEX = 0.70;
export const JIGGLE = 0.65;
export const HIP_EIGHT = 0.80;
export const SHOULDER_EIGHT = 0.70;
export const SAME_FOOT_THRESH = 0.60;
// Stomp: calm is a light tap; peak is the existing softer-stomp ceiling.
export const STOMP_CALM = 0.18;
export const STOMP_PEAK = 0.65; // === STOMP_SOFT / PULSE_SOFT ceiling

export const FOOT_LEN = 0.080;
export const FOOT_HEEL = 0.022;
export const FOOT_TOE = 0.058;
export const FOOT_ANK_H = 0.018;
export const ROCK_MAX = 22 * Math.PI / 180;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const deg = d => d * Math.PI / 180;
const smoothstep = t => { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); };

export function stompIntensity(activation, hush = 1) {
  const a = clamp(+activation || 0, 0, 1);
  const u = smoothstep(a);
  const s = STOMP_CALM + (STOMP_PEAK - STOMP_CALM) * u;
  return s * clamp(hush == null ? 1 : +hush, 0, 1);
}

export function sameFootThreshSec(periodSec, mul = SAME_FOOT_THRESH) {
  const T = Math.max(0.05, +periodSec || 0.5);
  const m = Number.isFinite(+mul) ? +mul : SAME_FOOT_THRESH;
  return Math.max(0.04, m * T);
}

export function stringPeriodSec(stepHz) {
  const hz = pulseDriveHz(Math.max(0.25, +stepHz || 1));
  return 1 / Math.max(0.25, hz);
}

function stepCritDamp(x, v, u, dt, omega) {
  const w = Math.max(1e-4, omega);
  const y0 = x - u;
  const A = y0;
  const B = v + w * y0;
  const e = Math.exp(-w * dt);
  const y = (A + B * dt) * e;
  const nv = (B - w * (A + B * dt)) * e;
  return {x: y + u, v: nv};
}

const SPINE_JOINTS = [
  {id: 'pelvis', s: 0.070},
  {id: 'lumbar', s: 0.208},
  {id: 'thoracic', s: 0.417},
  {id: 'neck', s: 0.781}
];

function waveOpts(amp, hz, times) {
  return {amp: Math.max(1e-6, +amp || 0), hz: Number.isFinite(+hz) ? +hz : 0.9, times: times || pulseTravelTimes()};
}

export function spineFlexState({tSec, strikes, activation = 0, amp = 0, hz = 0.9, times, periodSec, hush = 1, amount = SPINE_FLEX, lagMul = SPINE_LAG} = {}) {
  const zero = {
    energy: +activation || 0,
    env: 0,
    angles: {pelvis: 0, lumbar: 0, thoracic: 0, neck: 0, head: 0},
    phi: {pelvis: 0, lumbar: 0, thoracic: 0, neck: 0, head: 0}
  };
  const h = clamp(+hush || 0, 0, 1);
  if (!(amount > 0.001) || h <= 0 || !(+tSec >= 0)) return zero;
  const T = Math.max(0.25, +periodSec || stringPeriodSec(1));
  const energy = Math.max(0, +activation || 0);
  const r = 1.05 + 0.12 * ((+lagMul || SPINE_LAG) - 2);
  const omegaShape = (2 * Math.PI / T) / r;
  const lagFeel = clamp(0.55 + 0.45 * (4 / Math.max(2, +lagMul || SPINE_LAG)), 0.55, 1);
  const env = clamp(0.28 + 0.72 * lagFeel * clamp(energy / 0.85, 0, 1.15), 0, 1.2) * h;
  const opts = waveOpts(amp, hz, times);
  const dt = 1 / 20;
  const look = Math.min(0.72, Math.max(0.48, 0.55 * T * r));
  const t0 = tSec - look;
  const states = SPINE_JOINTS.map(() => ({x: 0, v: 0}));
  let inited = false;
  const list = Array.isArray(strikes) ? strikes : [];
  for (let t = t0; t <= tSec + 1e-9; t += dt) {
    const inst = SPINE_JOINTS.map(j => {
      const ds = 0.10;
      const d0 = pulseWaveAt(j.s, t, list, opts);
      const dm = pulseWaveAt(Math.max(0, j.s - ds), t, list, opts);
      const dp = pulseWaveAt(Math.min(1, j.s + ds), t, list, opts);
      const ref = Math.max(8, opts.amp);
      const disp = d0 / ref;
      const curv = ((dm - 2 * d0 + dp) / (ds * ds)) * (0.10 * 0.10) / ref;
      return 0.32 * disp + 0.68 * curv;
    });
    if (!inited) {
      for (let i = 0; i < states.length; i++) { states[i].x = inst[i]; states[i].v = 0; }
      inited = true;
    } else {
      for (let i = 0; i < states.length; i++) {
        states[i] = stepCritDamp(states[i].x, states[i].v, inst[i], dt, omegaShape);
      }
    }
  }
  const Om = 2 * Math.PI / T;
  const w = omegaShape;
  const gainH = (w * w) / Math.hypot(w * w - Om * Om, 2 * w * Om);
  const gainComp = clamp(1 / Math.max(0.22, gainH), 1, 3.2);
  const maxSeg = deg(13);
  const scale = amount * env * gainComp * 2.05;
  const angOf = x => clamp(x * scale * maxSeg, -maxSeg, maxSeg);
  const pelvis = angOf(states[0].x);
  const lumbar = angOf(states[1].x);
  const thoracic = angOf(states[2].x);
  const neckA = angOf(states[3].x);
  const phiP = pelvis;
  const phiL = pelvis + lumbar;
  const phiT = pelvis + lumbar + thoracic;
  const phiN = phiT + neckA;
  const head = clamp(-0.72 * phiN, -deg(10), deg(10));
  return {
    energy,
    env,
    angles: {pelvis, lumbar, thoracic, neck: neckA, head},
    phi: {pelvis: phiP, lumbar: phiL, thoracic: phiT, neck: phiN, head: phiN + head}
  };
}

export function armPulseEvents(strikes, tSec, times) {
  const ts = times || pulseTravelTimes();
  const tArm = Math.max(0.04, ts.full - (ts.leg + ts.str * HEART_S));
  const heartArrive = ts.leg + ts.str * HEART_S;
  const out = [];
  for (const s of strikes || []) {
    const age = tSec - s.t0 - heartArrive;
    if (age < -0.08 || age > 1.6) continue;
    out.push({age, tArm, side: s.side < 0 ? -1 : 1, energy: Math.max(0, +s.energy || 0)});
  }
  return out;
}

export function armWaveFlex({tSec, strikes, times, hush = 1, amount = ARM_FLEX} = {}) {
  const out = {elL: 0, elR: 0, wrL: 0, wrR: 0};
  const g = (+amount || 0) * clamp(+hush || 0, 0, 1);
  if (!(g > 0.001)) return out;
  const evs = armPulseEvents(strikes, tSec, times);
  const omegaEl = 2 * Math.PI * 3.1;
  const omegaWr = 2 * Math.PI * 3.8;
  const z = 0.78;
  const resp = (age, arrive, omega) => {
    const a = age - arrive;
    if (a < -0.06) return 0;
    const attack = a < 0 ? 0.5 * (1 + Math.cos(Math.PI * a / 0.06)) : 1;
    const wd = omega * Math.sqrt(Math.max(1e-6, 1 - z * z));
    const ring = a >= 0 ? Math.exp(-z * omega * a) * Math.cos(wd * a) : 1;
    return attack * ring;
  };
  for (const e of evs) {
    const fundEl = resp(e.age, e.tArm * 0.38, omegaEl);
    const fundWr = resp(e.age, e.tArm * 0.88, omegaWr);
    const h2El = 0.35 * resp(e.age, e.tArm * 0.38, omegaEl * 1.85);
    const h2Wr = 0.40 * resp(e.age, e.tArm * 0.88, omegaWr * 1.85);
    const el = (fundEl + h2El) * g * (0.7 + 0.3 * (e.energy || 1));
    const wr = (fundWr + h2Wr) * g * (0.7 + 0.3 * (e.energy || 1));
    const biasL = e.side < 0 ? 1.08 : 0.92;
    const biasR = e.side > 0 ? 1.08 : 0.92;
    out.elL += el * biasL;
    out.elR += el * biasR;
    out.wrL += wr * biasL;
    out.wrR += wr * biasR;
  }
  const cap = 1.25;
  out.elL = clamp(out.elL, -cap, cap);
  out.elR = clamp(out.elR, -cap, cap);
  out.wrL = clamp(out.wrL, -cap, cap);
  out.wrR = clamp(out.wrR, -cap, cap);
  return out;
}

export function legWaveState({tSec, strikes, times, hush = 1, amount = LEG_COMPLEX} = {}) {
  const knee = {L: 0, R: 0};
  const hip = {L: 0, R: 0};
  const g = (+amount || 0) * clamp(+hush || 0, 0, 1);
  if (!(g > 0.001)) return {knee, hip};
  const leg = (times || pulseTravelTimes()).leg;
  const k = 2.15;
  for (const s of strikes || []) {
    const age = tSec - s.t0;
    if (age > leg + 0.35 || age < -0.02) continue;
    const uu = clamp(age / Math.max(0.08, leg), 0, 1.2);
    const env = Math.exp(-Math.max(0, age) * 2.1) * (uu <= 1 ? 1 : Math.max(0, 1 - (uu - 1) / 0.2));
    const ph = 2 * Math.PI * (k * uu - 1.15 * age / Math.max(0.08, leg));
    const wave = Math.sin(ph) + 0.45 * Math.sin(2 * ph + 0.4) + 0.22 * Math.sin(3 * ph + 0.8);
    const atKnee = env * wave * (0.45 + 0.55 * Math.sin(Math.PI * clamp(uu / 0.62, 0, 1)));
    const atHip = env * wave * (0.35 + 0.65 * Math.sin(Math.PI * clamp((uu - 0.35) / 0.65, 0, 1)));
    const key = s.side < 0 ? 'L' : 'R';
    knee[key] += atKnee;
    hip[key] += atHip;
  }
  const capK = 0.016 * g;
  const capH = 0.010 * g;
  knee.L = clamp(knee.L * 0.012 * g, -capK, capK);
  knee.R = clamp(knee.R * 0.012 * g, -capK, capK);
  hip.L = clamp(hip.L * 0.008 * g, -capH, capH);
  hip.R = clamp(hip.R * 0.008 * g, -capH, capH);
  return {knee, hip};
}

export function jiggleState({tSec, strikes, side = -1, frac = 0, periodSec = 0.5, hush = 1, amount = JIGGLE, still = false} = {}) {
  const z = {gluteL: 0, gluteR: 0, thighL: 0, thighR: 0};
  const g = (+amount || 0) * clamp(+hush || 0, 0, 1);
  if (!(g > 0.001) || still) return z;
  const omegaG = 2 * Math.PI * 4.6;
  const omegaT = 2 * Math.PI * 5.4;
  const zeta = 0.62;
  const impulse = (age, omega) => {
    if (age < 0 || age > 1.15) return 0;
    const wd = omega * Math.sqrt(Math.max(1e-6, 1 - zeta * zeta));
    return Math.exp(-zeta * omega * age) * Math.sin(wd * age);
  };
  for (const s of strikes || []) {
    const age = tSec - s.t0;
    const land = impulse(age, omegaG);
    const thighPlant = impulse(age, omegaT);
    const thighFree = impulse(age - 0.06, omegaT * 0.92);
    if (s.side < 0) {
      z.gluteL += land;
      z.thighL += thighPlant * 0.75;
      z.thighR += thighFree * 0.55;
      z.gluteR += land * 0.22;
    } else {
      z.gluteR += land;
      z.thighR += thighPlant * 0.75;
      z.thighL += thighFree * 0.55;
      z.gluteL += land * 0.22;
    }
  }
  const tStep = Math.max(0.2, +periodSec || 0.5);
  const ageXfer = (clamp(+frac || 0, 0, 1) - 0.72) * tStep;
  const xfer = impulse(ageXfer, omegaG * 0.9) * 0.55;
  if (side > 0) { z.gluteL += xfer; z.thighL += xfer * 0.4; }
  else { z.gluteR += xfer; z.thighR += xfer * 0.4; }
  const capG = 0.014 * g;
  const capT = 0.011 * g;
  z.gluteL = clamp(z.gluteL * 0.026 * g, -capG * 0.4, capG);
  z.gluteR = clamp(z.gluteR * 0.026 * g, -capG * 0.4, capG);
  z.thighL = clamp(z.thighL * 0.022 * g, -capT * 0.4, capT);
  z.thighR = clamp(z.thighR * 0.022 * g, -capT * 0.4, capT);
  return z;
}

export function hipFigureEight({tSec, stepHz, phase = 0, hush = 1, still = false, amount = HIP_EIGHT} = {}) {
  const g = (+amount || 0) * Math.max(0, Math.min(1, +hush || 0));
  if (!(g > 0.001) || still || !(+tSec >= 0)) return {x: 0, y: 0};
  const hz = Math.max(0.2, +stepHz || 1);
  const th8 = 2 * Math.PI * (tSec * hz * 0.5 + (+phase || 0) * 0.5);
  return {x: 0.014 * g * Math.sin(th8), y: 0.009 * g * Math.sin(th8) * Math.cos(th8)};
}

// Shoulder roll / tilt / twist on a fairly big figure-eight, opposite the
// hips (contra-body). Scales with this dancer's own activation; almost none
// in silence or at rest.
export function shoulderFigureEight({tSec, stepHz, phase = 0, hush = 1, still = false, amount = SHOULDER_EIGHT, activation = 0} = {}) {
  const h = Math.max(0, Math.min(1, +hush || 0));
  const act = Math.max(0, Math.min(1, +activation || 0));
  const u = act * act * (3 - 2 * act);
  const g = (+amount || 0) * h * u;
  if (!(g > 0.001) || still || !(+tSec >= 0)) return {x: 0, y: 0, tilt: 0, twist: 0};
  const hz = Math.max(0.2, +stepHz || 1);
  // Same clock as the hip eight, +π so the shoulder loop runs against the hips.
  const th = 2 * Math.PI * (tSec * hz * 0.5 + (+phase || 0) * 0.5) + Math.PI;
  return {
    x: 0.038 * g * Math.sin(th),
    y: 0.024 * g * Math.sin(th) * Math.cos(th),
    tilt: 0.28 * g * Math.sin(th),
    twist: 0.020 * g * Math.sin(2 * th)
  };
}


function rand(seed, n) {
  const x = Math.sin((+seed || 0) * 12.9898 + n * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function ornamentsFor(id, gridIdx, periodSec) {
  const T = Math.max(0.05, +periodSec || 0.5);
  if (T < 0.30 && (gridIdx % 2 !== 0)) return [];
  const slot = ((gridIdx % 4) + 4) % 4;
  const busy = rand(id, 21 + gridIdx) > 0.18;
  if (!busy && slot === 1) return [];
  if (T < 0.30) return [{f: 0.30, contact: 'toe', kind: 'toeTap'}];
  if (slot === 0) return [
    {f: 0.24, contact: 'toe', kind: 'toeTap'},
    {f: 0.36, contact: 'heel', kind: 'heelDrop'}
  ];
  if (slot === 1) return [{f: 0.32, contact: 'toe', kind: 'toeTap'}];
  if (slot === 2) return [
    {f: 0.22, contact: 'toe', kind: 'rock'},
    {f: 0.36, contact: 'heel', kind: 'heelDrop'}
  ];
  return [{f: 0.28, contact: 'toe', kind: 'ballChange', other: true}];
}

// raw: [{t0, kind?, contact?, other?, plannedTransfer?}]. thresh in seconds.
export function classifyBeats(raw, thresh, opts = {}) {
  const gridTransfers = opts.gridTransfers !== false;
  const out = [];
  let planted = null;
  let lastT = null;
  for (const b of raw || []) {
    const ibi = lastT == null ? Infinity : b.t0 - lastT;
    const forceTransfer = gridTransfers && b.plannedTransfer;
    const transfer = forceTransfer || ibi >= thresh;
    let side, kind, contact;
    if (transfer) {
      if (planted == null) planted = (b.grid == null ? 0 : b.grid) % 2 === 0 ? -1 : 1;
      else planted = -planted;
      if (b.side === -1 || b.side === 1) planted = b.side;
      side = planted;
      kind = 'transfer';
      contact = b.contact || 'heel';
    } else {
      if (planted == null) planted = b.side === 1 ? 1 : -1;
      side = b.other ? -planted : planted;
      kind = (b.kind && b.kind !== 'transfer') ? b.kind : (b.contact === 'heel' ? 'heelDrop' : 'toeTap');
      contact = b.contact || 'toe';
    }
    out.push({
      t0: b.t0,
      grid: b.grid,
      kind,
      contact,
      side,
      planted,
      ibi,
      transfer,
      other: !!b.other && !transfer,
      strength: contact === 'heel' || kind === 'transfer' ? 1 : (kind === 'ballChange' ? 0.55 : 0.72)
    });
    lastT = b.t0;
  }
  return out;
}

export function posedFoot(layout, contact, rock, liftAll) {
  const floorY = 0.99;
  const ang = clamp(rock, 0, 1) * ROCK_MAX;
  const lift = Math.max(0, liftAll || 0);
  let heel, toe;
  if (lift > 0.001) {
    const midY = floorY - lift;
    const airAng = Math.min(ang + deg(8), deg(26));
    heel = {x: layout.heelX, y: midY - Math.sin(airAng) * FOOT_HEEL};
    toe = {x: layout.toeX, y: midY + Math.sin(airAng) * 0.12 * FOOT_TOE};
  } else if (contact === 'heel') {
    heel = {x: layout.heelX, y: floorY};
    toe = {x: layout.toeX, y: floorY - Math.sin(ang) * FOOT_LEN};
  } else if (contact === 'toe') {
    toe = {x: layout.toeX, y: floorY};
    heel = {x: layout.heelX, y: floorY - Math.sin(ang) * FOOT_LEN};
  } else {
    heel = {x: layout.heelX, y: floorY};
    toe = {x: layout.toeX, y: floorY};
  }
  const midX = (heel.x + toe.x) * 0.5;
  const midY = (heel.y + toe.y) * 0.5;
  const dx = toe.x - heel.x, dy = toe.y - heel.y;
  const d = Math.hypot(dx, dy) || 1;
  let nx = -dy / d, ny = dx / d;
  if (ny > 0) { nx = -nx; ny = -ny; }
  const ankle = {x: midX + nx * FOOT_ANK_H, y: midY + ny * FOOT_ANK_H};
  return {heel, toe, ankle, contact, rock, lift};
}

export function footLayout(side, midX) {
  const out = side < 0 ? -1 : 1;
  return {
    midX,
    heelX: midX - out * FOOT_HEEL,
    toeX: midX + out * FOOT_TOE,
    out
  };
}

export function footworkState({
  tSec, periodSec, side = -1, ease = 0, freeLift = 0, jump = 0,
  strikes, id = 0, beat = 0, hush = 1, still = false
} = {}) {
  const flat = {
    still: true,
    contactL: 'flat', contactR: 'flat',
    rockL: 0, rockR: 0,
    liftL: 0, liftR: 0,
    artKind: null, artEnv: 0, artSide: side,
    lastContact: 'flat',
    planted: side < 0 ? -1 : 1
  };
  const h = clamp(+hush || 0, 0, 1);
  if (h <= 0 || still) return flat;
  const T = Math.max(0.05, +periodSec || 0.5);
  const thresh = sameFootThreshSec(T);
  const planted = side < 0 ? -1 : 1;
  const raw = [];
  const list = Array.isArray(strikes) ? strikes : [];
  for (const s of list) {
    raw.push({
      t0: s.t0,
      grid: Number.isFinite(+s.beat) ? s.beat : beat,
      kind: s.kind || 'transfer',
      contact: s.contact || 'heel',
      other: !!s.other,
      plannedTransfer: s.transfer !== false && !s.ornament,
      side: s.side
    });
  }
  if (!raw.length) {
    raw.push({t0: tSec - clamp(+ease || 0, 0, 1) * T, grid: beat, kind: 'transfer', contact: 'heel', plannedTransfer: true, side: planted});
  }
  const lastGrid = raw.length ? (raw[raw.length - 1].grid | 0) : (beat | 0);
  const lastT0 = raw.length ? raw[raw.length - 1].t0 : tSec;
  for (const o of ornamentsFor(id, lastGrid, T)) {
    const t0 = lastT0 + o.f * T;
    if (t0 > tSec + 0.02) continue;
    raw.push({t0, grid: lastGrid, kind: o.kind, contact: o.contact, other: !!o.other, plannedTransfer: false});
  }
  raw.sort((a, b) => a.t0 - b.t0);
  const evs = classifyBeats(raw, thresh, {gridTransfers: true});
  const past = evs.filter(b => b.t0 <= tSec + 1e-6);
  const last = past.length ? past[past.length - 1] : null;
  let art = last && !last.transfer ? last : null;
  if (art && (tSec - art.t0) > 0.32) art = null;
  const artAge = art ? tSec - art.t0 : (last ? tSec - last.t0 : 1);
  const artEnv = art ? (artAge < 0.04 ? artAge / 0.04 : Math.exp(-Math.max(0, artAge - 0.04) / 0.10)) : 0;
  const lastContact = last ? last.contact : 'heel';
  const struckAgo = last ? tSec - last.t0 : (+ease || 0) * T;
  const artKind = art ? art.kind : (last && last.transfer ? 'transfer' : null);
  const artSide = art ? art.side : planted;

  const artic = (which, liftFree) => {
    if (jump > 0) return {contact: 'toe', rock: 0.35 * h, lift: liftFree};
    const isPlanted = which === planted;
    if (!isPlanted) {
      if (artKind === 'ballChange' && artSide === which) {
        return {contact: 'toe', rock: 0.50 * artEnv * h, lift: 0.006 * (1 - artEnv) * h};
      }
      return {contact: 'toe', rock: 0.22 * h, lift: liftFree};
    }
    if (artKind && artSide === which && artEnv > 0.02) {
      if (art && art.contact === 'toe') return {contact: 'toe', rock: 0.78 * artEnv * h, lift: 0};
      if (art && art.contact === 'heel') return {contact: 'heel', rock: 0.72 * artEnv * h, lift: 0};
    }
    if (lastContact === 'heel' && artKind === 'transfer' && struckAgo < 0.22) {
      const rec = Math.exp(-struckAgo / 0.11);
      return {contact: rec > 0.35 ? 'heel' : 'flat', rock: 0.55 * rec * h, lift: 0};
    }
    return {contact: 'flat', rock: 0, lift: 0};
  };
  const leftLanding = planted < 0;
  const aL = artic(-1, leftLanding ? 0 : freeLift);
  const aR = artic(1, leftLanding ? freeLift : 0);
  return {
    still: false,
    contactL: aL.contact, contactR: aR.contact,
    rockL: aL.rock, rockR: aR.rock,
    liftL: aL.lift, liftR: aR.lift,
    artKind, artEnv, artSide, lastContact,
    planted
  };
}

export const HIP_TWIST = 0.80;
export const SHOULDER_TWIST = 0.75;
export const MAX_BODY_TURN_DEG = 90;
export const TURN_FREQ = 0.70;
// Narrowest stance is 0.85–1.0 × shoulder width (full foot span / full shoulder
// span). stanceW and shW are half-widths, so the ratio is stanceW / shW.
export const STANCE_SH_MIN = 0.85;
export const STANCE_SH_CALM = 0.90;
export const VOLUME_LOD_PX = 100; // full volume only when on-screen height ≥ this

export function yawExtent(halfW, halfD, yaw) {
  const c = Math.cos(yaw || 0), s = Math.sin(yaw || 0);
  return Math.hypot(halfW * c, halfD * s);
}

export function rotateFacing(x, z, yaw) {
  const c = Math.cos(yaw || 0), s = Math.sin(yaw || 0);
  return {x: x * c + z * s, z: -x * s + z * c};
}

export function hash01(n) {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

// Analytic spring step. ζ=1 critical; ζ<1 underdamped (follow-through / overshoot).
// Optional constant accel (gravity) shifts the equilibrium by accel/ω².
export function stepSpring(x, v, u, dt, omega, zeta, accel = 0) {
  const w = Math.max(1e-4, omega);
  const z = Math.max(0.05, zeta);
  const dtC = Math.max(0, Math.min(0.05, dt));
  const uEff = u + (accel ? accel / (w * w) : 0);
  const y0 = x - uEff;
  if (dtC <= 1e-6) return {x, v};
  if (Math.abs(z - 1) < 1e-3) {
    const A = y0, B = v + w * y0, e = Math.exp(-w * dtC);
    const y = (A + B * dtC) * e;
    return {x: y + uEff, v: (B - w * (A + B * dtC)) * e};
  }
  if (z < 1) {
    const wd = w * Math.sqrt(Math.max(1e-8, 1 - z * z));
    const A = y0, B = (v + z * w * y0) / wd;
    const e = Math.exp(-z * w * dtC);
    const c = Math.cos(wd * dtC), s = Math.sin(wd * dtC);
    const y = e * (A * c + B * s);
    const nv = -z * w * y + e * (-A * wd * s + B * wd * c);
    return {x: y + uEff, v: nv};
  }
  const sd = w * Math.sqrt(z * z - 1);
  const r1 = -z * w + sd, r2 = -z * w - sd;
  const den = r1 - r2 || 1e-8;
  const C1 = (v - r2 * y0) / den, C2 = y0 - C1;
  const e1 = Math.exp(r1 * dtC), e2 = Math.exp(r2 * dtC);
  const y = C1 * e1 + C2 * e2;
  return {x: y + uEff, v: C1 * r1 * e1 + C2 * r2 * e2};
}

const travelMap = new Map();
export function resetTravel(id) {
  if (id == null) travelMap.clear();
  else travelMap.delete(id | 0);
}

// Incremental body facing + depth step. Persistent state, cheap per frame
// (no lookback). Turn size/frequency scale with activation; facing drifts home.
export function bodyTravelState({
  id = 0, tSec = 0, side = -1, still = false, activation = 0, hush = 1,
  stepHz = 2, hipTwist = HIP_TWIST, shoulderTwist = SHOULDER_TWIST,
  maxTurnDeg = MAX_BODY_TURN_DEG, turnFreq = TURN_FREQ, phase = 0
} = {}) {
  const key = id | 0;
  let st = travelMap.get(key);
  const t = +tSec || 0;
  if (!st || !Number.isFinite(st.t) || Math.abs(t - st.t) > 0.55) {
    st = {t, facing: 0, vf: 0, target: 0, plant: side < 0 ? -1 : 1, stepZ: 0, vz: 0};
  }
  const dt = Math.max(0, Math.min(0.05, t - st.t));
  st.t = t;
  const hushU = Math.max(0, Math.min(1, +hush || 0));
  const act = Math.max(0, Math.min(1, +activation || 0));
  if (still || hushU <= 0) {
    st.facing = 0; st.vf = 0; st.target = 0;
    st.hipYaw = 0; st.vHip = 0; st.shYaw = 0; st.vSh = 0;
    st.stepZ = 0; st.vz = 0;
    travelMap.set(key, st);
    return {facing: 0, hipYaw: 0, shYaw: 0, shRel: 0, stepZ: 0, env: 0};
  }
  const sm = act * act * (3 - 2 * act);
  const maxTurn = (Math.max(0, Math.min(90, +maxTurnDeg || 0)) * Math.PI) / 180;
  const freq = Math.max(0, +turnFreq || 0);
  const planted = side < 0 ? -1 : 1;
  if (planted !== st.plant && !still && hushU > 0 && maxTurn > 1e-4) {
    const seed = key * 13.1 + t * 2.37 + (phase || 0);
    const p = (0.05 + 0.40 * sm) * freq;
    if (hash01(seed) < p) {
      const sizeU = 0.16 + 0.84 * sm * sm;
      const mag = (0.20 + 0.80 * hash01(seed + 4.2)) * sizeU * maxTurn;
      const dir = hash01(seed + 8.7) < 0.5 ? -1 : 1;
      st.target = Math.max(-maxTurn, Math.min(maxTurn, st.target + dir * mag));
    }
    const stepF = (0.018 + 0.070 * sm) * (2 * hash01(seed + 2.1) - 1) * hushU;
    st.stepZ = stepF;
    st.plant = planted;
  }
  // Drift facing back to front; faster in silence / stillness.
  const tau = still || hushU < 0.05 ? 0.85 : 2.55;
  st.target *= Math.exp(-dt / tau);
  st.target = Math.max(-maxTurn, Math.min(maxTurn, st.target));
  // Heavy torso: slow critically-damped facing.
  const face = stepSpring(st.facing, st.vf, still ? 0 : st.target, dt, 6.2, 1.0);
  st.facing = face.x;
  st.vf = face.v;
  // Local contra-body twist (hips vs shoulders), activation-scaled.
  const env = still ? 0 : sm * hushU;
  const th8 = 2 * Math.PI * (t * Math.max(0.05, +stepHz || 2) * 0.5 + (phase || 0) * 0.5);
  const fig8 = Math.sin(th8);
  const hipLim = 20 * Math.PI / 180;
  const shRelLim = 25 * Math.PI / 180;
  const hipTarget = Math.max(-hipLim, Math.min(hipLim, ((-(planted) * 0.35 * (still ? 0 : 1) + fig8 * 0.46) * (hipTwist || 0) * env * hipLim)));
  const shTargetAbs = -hipTarget * (0.85 + 0.35 * (shoulderTwist || 0) * env) + fig8 * 0.18 * (shoulderTwist || 0) * env * shRelLim;
  if (st.hipYaw == null) { st.hipYaw = 0; st.vHip = 0; st.shYaw = 0; st.vSh = 0; }
  const hip = stepSpring(st.hipYaw, st.vHip, hipTarget, dt, 8.0, 1.0);
  st.hipYaw = Math.max(-hipLim, Math.min(hipLim, hip.x));
  st.vHip = hip.v;
  const shRelT = Math.max(-shRelLim, Math.min(shRelLim, shTargetAbs - st.hipYaw));
  const sh = stepSpring(st.shYaw, st.vSh, st.hipYaw + shRelT, dt, 9.5, 0.9);
  const shRel = Math.max(-shRelLim, Math.min(shRelLim, sh.x - st.hipYaw));
  st.shYaw = st.hipYaw + shRel;
  st.vSh = sh.v;
  travelMap.set(key, st);
  return {
    facing: st.facing * hushU,
    hipYaw: st.hipYaw * hushU,
    shYaw: st.shYaw * hushU,
    shRel: shRel * hushU,
    stepZ: (st.stepZ || 0) * hushU,
    env
  };
}

const dynMap = new Map();
export function resetBodyDynamics(id) {
  if (id == null) dynMap.clear();
  else dynMap.delete(id | 0);
}

const JOINT_DYN = {
  groin: {w: 7.0, z: 1.00}, pelvis: {w: 7.0, z: 1.00},
  hipL: {w: 7.4, z: 1.00}, hipR: {w: 7.4, z: 1.00},
  heart: {w: 8.5, z: 0.95}, neck: {w: 9.0, z: 0.92},
  shL: {w: 9.2, z: 0.90}, shR: {w: 9.2, z: 0.90},
  crown: {w: 10.5, z: 0.88}, head: {w: 11.0, z: 0.85},
  kneeL: {w: 13.0, z: 0.82}, kneeR: {w: 13.0, z: 0.82},
  elL: {w: 14.0, z: 0.80}, elR: {w: 14.0, z: 0.80},
  ankleL: {w: 14.0, z: 0.85}, ankleR: {w: 14.0, z: 0.85},
  wristL: {w: 16.0, z: 0.75}, wristR: {w: 16.0, z: 0.75},
  handL: {w: 16.5, z: 0.74}, handR: {w: 16.5, z: 0.74},
  footL: {w: 14.0, z: 0.85}, footR: {w: 14.0, z: 0.85},
  heelL: {w: 14.0, z: 0.85}, heelR: {w: 14.0, z: 0.85}
};
const DYN_KEYS = Object.keys(JOINT_DYN);
const G_UNIT = 1.6; // downward ( +y ) acceleration on lifted limbs, unit-pose / s²

// Critically/under-damped tracking of joint targets. Planted feet are pinned
// (no slide). dt is clamped so a hitch cannot explode the integrator.
export function smoothPoseJoints(id, unit, {
  tSec = 0, still = false, hush = 1, side = -1,
  liftL = 0, liftR = 0, contactL = 'flat', contactR = 'flat', enabled = true
} = {}) {
  if (!unit || enabled === false) return unit;
  const key = id | 0;
  const t = +tSec || 0;
  const frozen = still || !(+hush > 0);
  let st = dynMap.get(key);
  if (frozen) {
    st = {t, j: {}};
    for (const k of DYN_KEYS) {
      const p = unit[k];
      if (p && Number.isFinite(+p.x)) st.j[k] = {x: +p.x, y: +p.y, z: +p.z || 0, vx: 0, vy: 0, vz: 0};
    }
    dynMap.set(key, st);
    return unit;
  }
  if (!st || !Number.isFinite(st.t) || Math.abs(t - st.t) > 0.55) {
    st = {t, j: {}};
    for (const k of DYN_KEYS) {
      const p = unit[k];
      if (p && Number.isFinite(+p.x)) st.j[k] = {x: +p.x, y: +p.y, z: +p.z || 0, vx: 0, vy: 0, vz: 0};
    }
    dynMap.set(key, st);
    return unit;
  }
  const dt = Math.max(0, Math.min(0.05, t - st.t));
  // Same timestamp (tests, or a second call in one frame): leave the new
  // target in place so we do not freeze the previous pose over a new one.
  if (dt <= 1e-6) return unit;
  st.t = t;
  const plantL = (side < 0) && !(+liftL > 0.001);
  const plantR = (side >= 0) && !(+liftR > 0.001);
  const pin = {
    footL: plantL, heelL: plantL, ankleL: plantL && (contactL === 'flat' || contactL === 'heel' || contactL === 'toe'),
    footR: plantR, heelR: plantR, ankleR: plantR && (contactR === 'flat' || contactR === 'heel' || contactR === 'toe')
  };
  for (const k of DYN_KEYS) {
    const p = unit[k];
    if (!p || !Number.isFinite(+p.x)) continue;
    if (pin[k]) {
      st.j[k] = {x: +p.x, y: +p.y, z: +p.z || 0, vx: 0, vy: 0, vz: 0};
      continue;
    }
    const spec = JOINT_DYN[k];
    let rec = st.j[k];
    if (!rec) rec = st.j[k] = {x: +p.x, y: +p.y, z: +p.z || 0, vx: 0, vy: 0, vz: 0};
    let g = 0;
    if (k === 'handL' || k === 'wristL' || k === 'elL') g = G_UNIT * Math.max(0, 0.55 - Math.min(1, (unit.raise || 0)));
    else if (k === 'handR' || k === 'wristR' || k === 'elR') g = G_UNIT * Math.max(0, 0.55 - Math.min(1, (unit.raise || 0)));
    else if ((k === 'footL' || k === 'heelL' || k === 'ankleL') && +liftL > 0.001) g = G_UNIT;
    else if ((k === 'footR' || k === 'heelR' || k === 'ankleR') && +liftR > 0.001) g = G_UNIT;
    else if (k === 'groin' || k === 'hipL' || k === 'hipR') g = 0.35 * G_UNIT;
    const sx = stepSpring(rec.x, rec.vx, +p.x, dt, spec.w, spec.z, 0);
    const sy = stepSpring(rec.y, rec.vy, +p.y, dt, spec.w, spec.z, g);
    const sz = stepSpring(rec.z, rec.vz, +p.z || 0, dt, spec.w, spec.z, 0);
    rec.x = sx.x; rec.vx = sx.v;
    rec.y = sy.x; rec.vy = sy.v;
    rec.z = sz.x; rec.vz = sz.v;
    p.x = rec.x; p.y = rec.y; p.z = rec.z;
  }
  dynMap.set(key, st);
  return unit;
}

export function measureJerk(series) {
  // series: [{t, pts: {name: {x,y}} }] sampled at ~constant dt
  const names = series[0] && series[0].pts ? Object.keys(series[0].pts) : [];
  let maxAcc = 0, maxJerk = 0, maxVel = 0;
  const prevV = {}, prevA = {};
  for (let i = 1; i < series.length; i++) {
    const dt = Math.max(1e-4, series[i].t - series[i - 1].t);
    for (const n of names) {
      const a = series[i - 1].pts[n], b = series[i].pts[n];
      if (!a || !b) continue;
      const vx = (b.x - a.x) / dt, vy = (b.y - a.y) / dt;
      const v = Math.hypot(vx, vy);
      if (v > maxVel) maxVel = v;
      if (prevV[n]) {
        const ax = (vx - prevV[n].x) / dt, ay = (vy - prevV[n].y) / dt;
        const acc = Math.hypot(ax, ay);
        if (acc > maxAcc) maxAcc = acc;
        if (prevA[n]) {
          const jx = (ax - prevA[n].x) / dt, jy = (ay - prevA[n].y) / dt;
          const jerk = Math.hypot(jx, jy);
          if (jerk > maxJerk) maxJerk = jerk;
        }
        prevA[n] = {x: ax, y: ay};
      }
      prevV[n] = {x: vx, y: vy};
    }
  }
  return {maxVel, maxAcc, maxJerk, n: series.length};
}
