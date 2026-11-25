// Copyright (c) 2026 TJ Murphy / Vermillion Aurora Productions
// All rights reserved. No use, copying, modification, or distribution
// without a written license. Contact tj@tjm.art.
// License: neural-dance/LICENSE

// Articulated shadow dancers ported from the side simulation (TJ t2563u,
// 6:21 PM; t2620u arm lift / 3D shade / softer stomp; t2621u heel-pulse
// sync and natural weight transfer): hip–knee–ankle and shoulder–elbow–wrist
// with two-bone IK, human arm proportions (upper 0.19, forearm 0.16, hand
// 0.11 of height), elbows bent and held slightly out, varied per dancer
// and band. Weight shifts foot to foot on the beat-locked ease-in, with a
// short double-support after each plant. Arms rise with string activation.
// A pulse that passes the heart chakra branches into both shoulders and
// runs down the arms, giving the elbows and hands a small decaying lift.
// Arm-lift direction varies per dancer and phrase (TJ 7:51 PM): left, right,
// both-to-one-side, both-up, or split/opposition — not always to the right.
// Remaining side-sim motion (TJ 8:02 / 8:12 PM): spine flex, arm flex, leg
// waves, jiggle, heel-toe, hip figure-eight, and per-dancer stomp intensity.

import {
  SPINE_FLEX, SPINE_LAG, ARM_FLEX, LEG_COMPLEX, JIGGLE, HIP_EIGHT, SHOULDER_EIGHT, SAME_FOOT_THRESH,
  STOMP_CALM, STOMP_PEAK, stompIntensity, spineFlexState, armWaveFlex, legWaveState,
  jiggleState, hipFigureEight, shoulderFigureEight, footworkState, posedFoot, footLayout, classifyBeats,
  sameFootThreshSec, ornamentsFor, stringPeriodSec, FOOT_HEEL,
  HIP_TWIST, SHOULDER_TWIST, MAX_BODY_TURN_DEG, TURN_FREQ, STANCE_SH_MIN, STANCE_SH_CALM,
  VOLUME_LOD_PX, yawExtent, rotateFacing, bodyTravelState, smoothPoseJoints, stepSpring
} from './skeleton-motion.js';
export {
  SPINE_FLEX, SPINE_LAG, ARM_FLEX, LEG_COMPLEX, JIGGLE, HIP_EIGHT, SHOULDER_EIGHT, SAME_FOOT_THRESH,
  STOMP_CALM, STOMP_PEAK, stompIntensity, spineFlexState, armWaveFlex, legWaveState,
  jiggleState, hipFigureEight, shoulderFigureEight, footworkState, posedFoot, footLayout, classifyBeats,
  sameFootThreshSec, ornamentsFor, HIP_TWIST, SHOULDER_TWIST, MAX_BODY_TURN_DEG, TURN_FREQ,
  STANCE_SH_MIN, STANCE_SH_CALM, VOLUME_LOD_PX, yawExtent, rotateFacing, bodyTravelState,
  smoothPoseJoints, stepSpring
};

export const UPPER_ARM = 0.19;
export const FOREARM = 0.16;
export const HAND_LEN = 0.11;
export const THIGH = 0.255;
export const SHIN = 0.25;
export const HEART_S = 0.417; // heart chakra on the root→crown string
export const ARM_PULSE_SPAN = 0.34; // strike-progress units heart → fingertips
export const ARM_LIFT = 0.022; // height units at the hand, decays
export const STOMP_SOFT = 0.65; // ~35% softer foot-strike jolt (TJ 6:53 PM)
export const PULSE_SOFT = 0.65; // ~35% softer heel-strike pulse flash
export const STEP_EASE_K = 5.2; // side-sim ease-in; sharp stop on the beat
export const DOUBLE_SUPPORT = 0.10; // both feet down after plant, then swing lifts
export const SWING_LIFT = 0.115; // peak free-foot lift in height units
// Occasional high-activation "standing tall" (TJ 7:25 / 8:40 PM): legs
// straight, spine extended, arms high, stance at the 0.85-shoulder-width
// minimum (never feet together except brief heel-to-toe taps). Held 1–2 beats.
export const TALL_STANCE_W = 0.034; // unused; kept so old imports do not throw
export const TALL_HIP_Y = 0.458;
export const TALL_CROWN_Y = 0.000;
export const TALL_NECK_Y = 0.092;
export const TALL_ACT_ENTER = 0.90; // string activation must be high to enter
export const TALL_ACT_HOLD = 0.70; // drop out if energy falls out of the high band
// Stance width (TJ 8:40 PM): narrowest is 0.85–1.0 × shoulder width (stanceW
// and shW are half-widths, so the ratio is stanceW/shW). Wide stays 1.65 hip
// half-widths. Standing tall uses the same 0.85 minimum, never feet together.
export const STANCE_HIP_CALM = 0.15; // deprecated; calm is STANCE_SH_CALM × shW
export const STANCE_HIP_WIDE = 1.65;
export const STANCE_W_CALM = 0.15 * 0.09;
export const STANCE_W_WIDE = 1.65 * 0.09;
export const TALL_CHANCE = 0.40;
export const TALL_BLEND_S = 0.16; // seconds to glide in or out
export const SKELETON_SHADOW = 'rgba(6, 8, 14, 0.86)';
export const SKELETON_RIM = 'rgba(170, 195, 245, 0.13)';
export const KEY_LIGHT = {x: -0.62 / Math.hypot(-0.62, -0.48), y: -0.48 / Math.hypot(-0.62, -0.48)};
export const SHADE_HI = 'rgba(200, 218, 245, 0.13)';
export const SHADE_CORE = 'rgba(0, 0, 0, 0.28)';
// Soft silhouette-shaped halo (TJ 7:31 PM): dilated outline, no round dots.
// Width is a fraction of figure height at the default bloom aura (22).
export const HALO_WIDTH_FRAC = 0.042;
export const HALO_ALPHA = 0.11;
// Activation that reaches the Aura-width slider max. 0 → no halo.
export const HALO_ACT_FULL = 1;
export function haloAuraScale(activation) {
  const a = Math.max(0, +activation || 0);
  if (!(a > 0)) return 0;
  return a >= HALO_ACT_FULL ? 1 : a / HALO_ACT_FULL;
}


// Side-sim chakra positions (s from root 0 to crown 1).
export const CHAKRAS_7 = [
  {id: 'root', s: 0.000},
  {id: 'sacral', s: 0.135},
  {id: 'solar', s: 0.281},
  {id: 'heart', s: HEART_S},
  {id: 'throat', s: 0.781},
  {id: 'thirdEye', s: 0.917},
  {id: 'crown', s: 1.000}
];

function rand(seed, n) {
  const x = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453;
  return x - Math.floor(x);
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const deg = d => d * Math.PI / 180;

// band: 0 kick / 1 bass (warm, heavier), 2 snare (mid), 3 hat (high, lighter).
function bandKind(band) {
  const b = ((band | 0) % 4 + 4) % 4;
  return b <= 1 ? 'bass' : b === 2 ? 'mid' : 'high';
}

const builds = new Map();
export function buildFor(id, band) {
  const key = (id | 0) * 4 + (((band | 0) % 4 + 4) % 4);
  const hit = builds.get(key);
  if (hit) return hit;
  const s = (id | 0) * 1.37 + 3.1;
  const kind = bandKind(band);
  const slender = kind === 'high' ? 0.86 : kind === 'bass' ? 1.1 : 1.0;
  const abdBase = kind === 'bass' ? 26 : kind === 'high' ? 18 : 22;
  const elbBase = kind === 'bass' ? 60 : kind === 'high' ? 40 : 50;
  const b = {
    kind,
    headR: (0.048 + rand(s, 6) * 0.01) * (kind === 'bass' ? 1.06 : 0.97),
    shW: 0.125 * (kind === 'bass' ? 1.05 : kind === 'high' ? 0.95 : 1.0) * (0.97 + rand(s, 3) * 0.06),
    hipW: (0.08 + rand(s, 2) * 0.02) * slender,
    stanceW: (0.125 + rand(s, 7) * 0.02) * (kind === 'bass' ? 1.12 : 0.95),
    lean0: (rand(s, 1) - 0.5) * 0.04,
    abductL: deg(clamp(abdBase + (rand(s, 10) - 0.5) * 8, 15, 30)),
    abductR: deg(clamp(abdBase + (rand(s, 11) - 0.5) * 8, 15, 30)),
    elbowL: deg(clamp(elbBase + (rand(s, 12) - 0.5) * 14, 30, 70)),
    elbowR: deg(clamp(elbBase + (rand(s, 13) - 0.5) * 14, 30, 70)),
    swingAmp: (kind === 'high' ? 0.12 : kind === 'bass' ? 0.07 : 0.10) * (0.88 + rand(s, 14) * 0.28),
    limb: (kind === 'bass' ? 0.062 : kind === 'high' ? 0.046 : 0.054) * (0.95 + rand(s, 15) * 0.1),
    zeta: clamp((kind === 'bass' ? 0.84 : kind === 'high' ? 0.72 : 0.78) + (rand(s, 17) - 0.5) * 0.06, 0.68, 0.9)
  };
  b.handAmp = b.swingAmp * (1.10 + rand(s, 21) * 0.25);
  const tw = (kind === 'bass' ? 1.08 : kind === 'high' ? 0.90 : 1.0) * (0.96 + rand(s, 22) * 0.08);
  b.armW = {sh: 0.026 * tw, el: 0.018 * tw, wr: 0.013 * tw, hand: 0.011 * tw};
  b.legW = {hip: 0.034 * tw, knee: 0.022 * tw, ank: 0.016 * tw, foot: 0.015 * tw};
  b.chestW = 0.108 * slender * (0.97 + rand(s, 23) * 0.06);
  b.waistW = 0.068 * slender * (0.95 + rand(s, 24) * 0.08);
  b.neckW = 0.038 * slender;
  b.deltoid = 0.018 * tw;
  b.headRx = b.headR * 0.80;
  builds.set(key, b);
  return b;
}

// Two-bone IK: joint between A and C, bowed toward outSign (−1 left, +1 right).
export function ikJoint(A, C, lenAB, lenBC, outSign) {
  const dx = C.x - A.x;
  const dy = C.y - A.y;
  const d = Math.hypot(dx, dy) || 1e-6;
  const span = Math.max(Math.abs(lenAB - lenBC) + 0.004, Math.min(lenAB + lenBC - 0.004, d));
  const ux = dx / d;
  const uy = dy / d;
  const a = (lenAB * lenAB - lenBC * lenBC + span * span) / (2 * span);
  const h = Math.sqrt(Math.max(0, lenAB * lenAB - a * a));
  let px = -uy;
  let py = ux;
  if (px * outSign < 0) { px = -px; py = -py; }
  return {x: A.x + ux * a + px * h, y: A.y + uy * a + py * h};
}

// Damped arm counter-swing, one small state per dancer (stepped per frame).
const springs = new Map();
export function armSwing(id, weight, now, zeta = 0.8, hz = 1.2) {
  let st = springs.get(id | 0);
  if (!st) { st = {x1: 0, v1: 0, x2: 0, v2: 0, t: +now || 0}; springs.set(id | 0, st); }
  let dt = Math.max(0, Math.min(0.1, ((+now || 0) - st.t) / 1000));
  st.t = +now || 0;
  const w1 = 2 * Math.PI * hz * 1.08;
  const w2 = 2 * Math.PI * hz;
  const z2 = Math.min(0.95, zeta + 0.05);
  const w = Number.isFinite(+weight) ? +weight : 0;
  while (dt > 0) {
    const h = Math.min(dt, 1 / 90);
    st.v1 += (-2 * zeta * w1 * st.v1 - w1 * w1 * (st.x1 + 0.5 * w)) * h;
    st.x1 += st.v1 * h;
    st.v2 += (-2 * z2 * w2 * st.v2 - w2 * w2 * (st.x2 - 0.8 * st.x1)) * h;
    st.x2 += st.v2 * h;
    dt -= h;
  }
  if (!Number.isFinite(st.x1) || !Number.isFinite(st.x2)) { st.x1 = st.v1 = st.x2 = st.v2 = 0; }
  if (springs.size > 256) springs.clear();
  return {shoulder: st.x1, hand: st.x2};
}

// Pulse on the arms after it passes the heart: u 0 at the heart … 1 at the
// fingertips, lift is a small decaying bump (never a jerk).
export function armPulse(stringS, strikeU, heartU) {
  if (!(heartU >= 0) || !(strikeU >= heartU)) return {u: -1, lift: 0};
  const p = (strikeU - heartU) / ARM_PULSE_SPAN;
  if (p > 2.5) return {u: -1, lift: 0};
  const u = Math.min(1, p);
  const lift = ARM_LIFT * Math.sin(Math.PI * Math.min(1, p * 0.8)) * Math.exp(-1.4 * p);
  return {u: p <= 1 ? u : -1, lift: Math.max(0, lift)};
}


const smoothstep = t => { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); };
const mix = (a, c, t) => a + (c - a) * t;

// Side-sim ease-in: slow on the planted foot, then a fast transfer that
// arrives exactly at frac === 1 with a sharp stop (TJ 6:21 / 6:57 PM).
export function stepEase(frac) {
  const f = clamp(+frac || 0, 0, 1);
  if (f <= 0) return 0;
  if (f >= 1) return 1;
  return (Math.exp(STEP_EASE_K * f) - 1) / (Math.exp(STEP_EASE_K) - 1);
}

// Weight −1 left … +1 right. At frac=0 the landing foot (`side`) carries
// all the weight; at frac=1 it has arrived on the next foot.
export function stepWeight(side, frac) {
  const u = stepEase(frac);
  const s = side < 0 ? -1 : 1;
  return s * (1 - u) + (-s) * u;
}

// Free-foot lift in height units. Both feet stay down for DOUBLE_SUPPORT
// after the plant (hips settle over the stance foot), then the swing foot
// lifts, travels, and comes down to meet the next beat. At frac>=1 (waiting
// on a late beat) a sliver of lift remains so the visible plant happens on
// the strike, not early.
export const CONTACT_HOVER = 0.012; // height units; swing foot stays this far off the floor until the strike
export function swingLift(frac) {
  const f = +frac || 0;
  if (!(f > 0)) return 0;
  if (f <= DOUBLE_SUPPORT) return 0;
  const t = Math.min(1, (Math.min(f, 0.9999) - DOUBLE_SUPPORT) / (1 - DOUBLE_SUPPORT));
  const u = stepEase(t);
  const rise = SWING_LIFT * u * (1 - Math.pow(u, 5));
  // Never fully plant before the next strike (frac=0). As the foot comes
  // down it eases to a small hover so the visible contact is the beat.
  const hover = CONTACT_HOVER * u;
  if (f >= 1) return CONTACT_HOVER;
  return Math.max(hover, rise);
}

export function landGive(frac, airborne = false, activation = null) {
  if (airborne) return 0;
  // Default (no activation) keeps the softer-stomp ceiling so existing
  // tests and callers stay put. When activation is provided, the jolt
  // scales from a light tap to that same ceiling (TJ 8:12 PM).
  const peak = activation != null && Number.isFinite(+activation)
    ? stompIntensity(activation)
    : STOMP_SOFT;
  return Math.exp(-7 * clamp(+frac || 0, 0, 1)) * peak;
}

// Map string-oscillation activation → 0..1 arm lift (side-sim curve).
// ≤0.12 low (arms down); 0.72 mid (hands at the face); 1.10 high (overhead).
export function armLiftAmount(activation, sense = 1) {
  const a = Math.max(0, +activation || 0) * (Number.isFinite(+sense) ? +sense : 1);
  if (a <= 0.12) return 0;
  if (a < 0.72) {
    const u = clamp((a - 0.12) / 0.60, 0, 1);
    return 0.5 * smoothstep(u);
  }
  const u = clamp((a - 0.72) / 0.38, 0, 1);
  return 0.5 + 0.5 * smoothstep(u);
}

export function stanceWidthFor(activation, build, tallU = 0) {
  const sh = build && Number.isFinite(+build.shW) && +build.shW > 0 ? +build.shW : 0.125;
  const hip = build && Number.isFinite(+build.hipW) && +build.hipW > 0 ? +build.hipW : 0.09;
  const minW = STANCE_SH_MIN * sh;
  const calm = STANCE_SH_CALM * sh;
  const wide = STANCE_HIP_WIDE * hip;
  const act = clamp(+activation || 0, 0, 1);
  const w = mix(calm, wide, smoothstep(act));
  // Standing tall uses the same minimum width, never feet together.
  return Math.max(minW, mix(w, minW, clamp(+tallU || 0, 0, 1)));
}

export function stanceInHipWidths(stanceW, build) {
  const hip = build && Number.isFinite(+build.hipW) && +build.hipW > 0 ? +build.hipW : 0.09;
  return (+stanceW || 0) / hip;
}

export function stanceInShoulderWidths(stanceW, build) {
  const sh = build && Number.isFinite(+build.shW) && +build.shW > 0 ? +build.shW : 0.125;
  return (+stanceW || 0) / sh;
}

// Smoothed RMS activation per dancer: fast-ish attack, slower decay so arms glide.
const acts = new Map();
export function smoothArmActivation(id, instant, now, attack = 0.50, decay = 0.90) {
  let st = acts.get(id | 0);
  if (!st) { st = {y: 0, t: +now || 0}; acts.set(id | 0, st); }
  const dt = Math.max(0, Math.min(0.1, ((+now || 0) - st.t) / 1000));
  st.t = +now || 0;
  const x = Math.max(0, +instant || 0);
  const tau = x > st.y ? attack : decay;
  const a = dt > 0 ? 1 - Math.exp(-dt / Math.max(1e-4, tau)) : 0;
  st.y += a * (x - st.y);
  if (!Number.isFinite(st.y)) st.y = 0;
  if (acts.size > 256) acts.clear();
  return st.y;
}

// Arm-lift pose families (TJ 7:51 PM). Height still follows activation;
// the family only chooses which way the arms travel. `both-up` is the
// original symmetric mid/high lift. Each phrase (4 beats) picks a new
// family from a per-dancer seed, never repeating the previous one.
export const ARM_LIFT_FAMILIES = Object.freeze([
  'right-up', 'left-up', 'both-left', 'both-right', 'both-up', 'split'
]);
export const ARM_PHRASE_BEATS = 4;
export const DEFAULT_ARM_FAMILY = 'both-up';

export function armLiftPhraseIndex(beatOrMotion) {
  const beat = beatOrMotion && typeof beatOrMotion === 'object'
    ? +beatOrMotion.beat || 0
    : +beatOrMotion || 0;
  return Math.max(0, Math.floor(Math.max(0, beat) / ARM_PHRASE_BEATS));
}

function hash2(a, b) {
  let h = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b) + (b | 0);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return (h ^ (h >>> 16)) >>> 0;
}

export function armLiftFamilyAt(id, phrase, prev = null) {
  const list = prev ? ARM_LIFT_FAMILIES.filter(f => f !== prev) : ARM_LIFT_FAMILIES;
  return list[hash2(id | 0, phrase | 0) % list.length];
}

const famMemo = new Map();
export function resetArmLiftFamilies() { famMemo.clear(); }

export function armLiftFamilyFor(id, phrase) {
  const p = Math.max(0, phrase | 0);
  const key = id | 0;
  const st = famMemo.get(key);
  if (st && st.phrase === p) return st.family;
  let start = 0, prev = null;
  if (st && st.phrase < p) { start = st.phrase + 1; prev = st.family; }
  let fam = prev;
  for (let i = start; i <= p; i++) fam = armLiftFamilyAt(key, i, fam);
  famMemo.set(key, {phrase: p, family: fam});
  if (famMemo.size > 256) famMemo.clear();
  return fam;
}

export function armLiftFamilySide(family) {
  if (family === 'left-up' || family === 'both-left') return 'left';
  if (family === 'right-up' || family === 'both-right') return 'right';
  if (family === 'split') return 'split';
  return 'symmetric';
}

// Split opposition: which arm is high flips with a second hash so the
// family can appear on either side without being a distinct slot.
function splitLeftHigh(id, phrase) {
  return (hash2((id | 0) ^ 0x5bd1e995, phrase | 0) & 1) === 0;
}

export function armLiftFamilySpec(family, id = 0, phrase = 0) {
  switch (family) {
    case 'right-up': return {raiseL: 0.08, raiseR: 1, leanL: 0.10, leanR: 0.22};
    case 'left-up': return {raiseL: 1, raiseR: 0.08, leanL: -0.22, leanR: -0.10};
    case 'both-left': return {raiseL: 1, raiseR: 0.92, leanL: -0.85, leanR: -0.95};
    case 'both-right': return {raiseL: 0.92, raiseR: 1, leanL: 0.95, leanR: 0.85};
    case 'split':
      return splitLeftHigh(id, phrase)
        ? {raiseL: 1, raiseR: 0.55, leanL: -0.75, leanR: 0.90}
        : {raiseL: 0.55, raiseR: 1, leanL: -0.90, leanR: 0.75};
    default: return {raiseL: 1, raiseR: 1, leanL: 0, leanR: 0};
  }
}

function armRaiseAngles(side, raiseAmt, b) {
  const flexT = smoothstep(clamp(raiseAmt / 0.5, 0, 1));
  const elevT = smoothstep(clamp((raiseAmt - 0.48) / 0.52, 0, 1));
  const uLow = side < 0 ? -b.abductL : b.abductR;
  const fLow = side < 0 ? uLow + b.elbowL : uLow - b.elbowR;
  const uMid = side < 0 ? -deg(7) : deg(7);
  const fMid = side < 0 ? Math.PI - deg(20) : Math.PI + deg(20);
  const uHigh = side < 0 ? Math.PI + deg(16) : Math.PI - deg(16);
  const fHigh = side < 0 ? Math.PI + deg(6) : Math.PI - deg(6);
  return {
    flexT, elevT,
    u: mix(mix(uLow, uMid, flexT), uHigh, elevT),
    f: mix(mix(fLow, fMid, flexT), fHigh, elevT)
  };
}

// Phase within a step: 0 at the strike / heel plant. If the estimated
// period elapses before the next strike, hold just shy of 1 so the swing
// foot doesn't fully plant early (the next strike is the visible contact).
export function stepFrac(now, motion) {
  if (!motion || !Number.isFinite(+motion.strikeAt) || +motion.strikeAt < 0) return 0;
  const period = Math.max(1, +motion.period || 1);
  const f = ((+now || 0) - +motion.strikeAt) / period;
  if (f <= 0) return 0;
  if (f >= 1) return 0.999;
  return f;
}

// Unit pose: y 0 at the crown, 1 at the floor; x in height units around 0.
// weight −1 left … +1 right (planted side), ease 0..1 within the step.

function yawPoint(p, ox, yaw) {
  if (!p) return p;
  const r = rotateFacing((+p.x || 0) - ox, +p.z || 0, yaw);
  p.x = r.x + ox;
  p.z = r.z;
  return p;
}

function applyBodyYaw(pts, {originX, facing, hipYaw, shYaw, stepZ, liftL, liftR}) {
  const yHip = (facing || 0) + (hipYaw || 0);
  const ySh = (facing || 0) + (shYaw || 0);
  for (const k of ['groin', 'hipL', 'hipR', 'heart']) yawPoint(pts[k], originX, yHip);
  for (const k of ['neck', 'crown', 'head', 'shL', 'shR', 'elL', 'elR', 'wristL', 'wristR', 'handL', 'handR']) {
    yawPoint(pts[k], originX, ySh);
  }
  // Only the lifted foot travels in xz (planted contacts never slide).
  if (liftL > 0.001) {
    for (const k of ['footL', 'heelL', 'ankleL']) {
      yawPoint(pts[k], originX, yHip);
      if (pts[k]) pts[k].z = (pts[k].z || 0) + (stepZ || 0);
    }
  } else {
    for (const k of ['footL', 'heelL', 'ankleL']) if (pts[k]) pts[k].z = 0;
  }
  if (liftR > 0.001) {
    for (const k of ['footR', 'heelR', 'ankleR']) {
      yawPoint(pts[k], originX, yHip);
      if (pts[k]) pts[k].z = (pts[k].z || 0) + (stepZ || 0);
    }
  } else {
    for (const k of ['footR', 'heelR', 'ankleR']) if (pts[k]) pts[k].z = 0;
  }
}

export function skeletonPose({id = 0, band = 0, weight = 0, ease = 0, side = -1, swing = null, lift = 0, armLift = 0, jump = 0, tall = 0, armFamily = DEFAULT_ARM_FAMILY, phrase = 0, activation = null, now = null, periodMs = 0, strikes = null, pulseAmp = 0, pulseHz = 0.9, times = null, hush = 1, still = false, beat = 0, stepHz = 0, hipEight = null, shoulderEight = null, hipTwist = null, shoulderTwist = null, maxBodyTurn = null, turnFreq = null, dynamics = true} = {}) {
  const b = buildFor(id, band);
  const w = clamp(+weight || 0, -1, 1);
  const frac = +ease || 0; // may be 0.999 while waiting on a late beat (not clamped to 1)
  const tallT = clamp(+tall || 0, 0, 1);
  const tallU = smoothstep(tallT);
  const hushU = clamp(hush == null ? 1 : +hush, 0, 1);
  const clocked = now != null && Number.isFinite(+now);
  const live = clocked && hushU > 0 && !still;
  const tSec = clocked ? (+now / 1000) : 0;
  const periodSec = Math.max(0.05, (+periodMs || 0) > 0 ? +periodMs / 1000 : (stepHz > 0 ? 1 / +stepHz : 0.5));
  const hz = stepHz > 0 ? +stepHz : 1 / periodSec;
  const hipEightAmt = hipEight != null && Number.isFinite(+hipEight) ? +hipEight : HIP_EIGHT;
  const shEightAmt = shoulderEight != null && Number.isFinite(+shoulderEight) ? +shoulderEight : SHOULDER_EIGHT;
  const fig8phase = (id | 0) * 0.37;
  const fig8 = live ? hipFigureEight({tSec, stepHz: hz, phase: fig8phase, hush: hushU, still: false, amount: hipEightAmt}) : {x: 0, y: 0};
  const stomp = activation != null && Number.isFinite(+activation) ? stompIntensity(activation, hushU) : STOMP_SOFT;
  // Standing tall: less side-to-side lean, feet close, hips rise, no stomp dip.
  const wLean = w * (1 - 0.7 * tallU);
  let hipCx = b.lean0 + wLean * 0.10 + fig8.x;
  let leanTilt = 0;
  const shCx0 = b.lean0 + wLean * 0.062;
  const headX0 = b.lean0 + wLean * 0.04;
  const give = landGive(frac, jump > 0, activation) * (1 - tallU);
  const hipY0 = mix(0.487 + 0.018 * give, TALL_HIP_Y, tallU) + fig8.y;
  const groinY0 = hipY0 + 0.02 * (1 - 0.35 * tallU);
  const floorY = 0.99;
  const stanceW = activation != null && Number.isFinite(+activation)
    ? stanceWidthFor(activation, b, tallU)
    : Math.max(STANCE_SH_MIN * b.shW, mix(b.stanceW, STANCE_SH_MIN * b.shW, tallU));
  // Planted stance foot stays down. The free foot lifts only after a short
  // double-support, then plants on the next beat. Rare jumps lift both.
  // While standing tall the stride shrinks (legs stay nearly straight).
  const free = swingLift(frac) * (1 - 0.85 * tallU) * hushU;
  const leftLanding = side < 0;
  let liftL = 0, liftR = 0;
  if (leftLanding) liftR = free;
  else liftL = free;
  const midL = -stanceW + b.lean0 * 0.2;
  const midR = stanceW + b.lean0 * 0.2;
  let toeL, toeR, ankleL, ankleR, heelL, heelR, contactL = 'flat', contactR = 'flat';
  const fw = live ? footworkState({tSec, periodSec, side, ease: frac, freeLift: free, jump, strikes, id, beat, hush: hushU, still: false}) : null;
  if (fw) {
    liftL = fw.liftL; liftR = fw.liftR;
    contactL = fw.contactL; contactR = fw.contactR;
    const posedL = posedFoot(footLayout(-1, midL), fw.contactL, fw.rockL, fw.liftL);
    const posedR = posedFoot(footLayout(1, midR), fw.contactR, fw.rockR, fw.liftR);
    toeL = posedL.toe; toeR = posedR.toe;
    heelL = posedL.heel; heelR = posedR.heel;
    ankleL = posedL.ankle; ankleR = posedR.ankle;
  } else {
    // Rare jumps: placePoseOnFloor lifts the whole figure. While airborne the
    // stance pin still holds relative foot placement; both feet leave the floor
    // together because the anchor itself rises.
    toeL = {x: midL, y: floorY - liftL};
    toeR = {x: midR, y: floorY - liftR};
    ankleL = {x: toeL.x + 0.002, y: toeL.y - 0.016};
    ankleR = {x: toeR.x - 0.002, y: toeR.y - 0.016};
    heelL = {x: toeL.x + (side < 0 ? FOOT_HEEL : -FOOT_HEEL), y: toeL.y};
    heelR = {x: toeR.x - FOOT_HEEL, y: toeR.y};
  }
  // Body weight stays over the support (TJ 8:28 PM): planted foot in single
  // support, between the feet in double support; shift toward the incoming
  // foot before the stance lifts; hips/torso counter-lean to balance.
  const plantX = side < 0 ? midL : midR;
  const freeX = side < 0 ? midR : midL;
  const liftFree = side < 0 ? liftR : liftL;
  const doubleSup = still || !(liftFree > 0.012);
  let comX;
  if (doubleSup) {
    comX = (midL + midR) * 0.5;
    if (!still && frac >= 0.78) comX = mix(comX, freeX, smoothstep((frac - 0.78) / 0.22) * 0.7);
  } else {
    comX = plantX;
    if (frac >= 0.78) comX = mix(plantX, freeX, smoothstep((frac - 0.78) / 0.22));
  }
  hipCx = comX + b.lean0 * 0.2 + wLean * 0.03 + fig8.x;
  leanTilt = clamp((plantX - comX) * 1.8 + wLean * 0.04, -0.08, 0.08);
  // Jointed spine (chakra-wave driven, lag 4×, amount 0.85). Off unless live.
  const sp = live ? spineFlexState({tSec, strikes, activation: +activation || 0, amp: pulseAmp, hz: pulseHz, times, periodSec: stringPeriodSec(hz), hush: hushU, amount: SPINE_FLEX, lagMul: SPINE_LAG}) : null;
  const along = (from, phi, len) => ({x: from.x + Math.sin(phi) * len, y: from.y - Math.cos(phi) * len});
  const pelvis = {x: hipCx, y: hipY0};
  let hipY = hipY0, groinY = groinY0, neck, crown, head, shL, shR, shCx = shCx0, headX = headX0;
  const raise = clamp(Math.max(+armLift || 0, tallU), 0, 1);
  const family = ARM_LIFT_FAMILIES.includes(armFamily) ? armFamily : DEFAULT_ARM_FAMILY;
  const famSpec = armLiftFamilySpec(family, id, phrase);
  const flexT = smoothstep(clamp(raise / 0.5, 0, 1));
  const elevT = smoothstep(clamp((raise - 0.48) / 0.52, 0, 1));
  const shrug = 0.052 * elevT;
  const neckY = mix(0.125 - shrug * 0.25, TALL_NECK_Y, tallU);
  const shY = mix(0.155 - shrug * 0.75, TALL_NECK_Y + 0.028, tallU);
  if (sp && hushU > 0) {
    const phiP = sp.phi.pelvis, phiL = sp.phi.lumbar, phiT = sp.phi.thoracic;
    const phiN = sp.phi.neck, phiH = sp.phi.head;
    const yLumbar = (groinY0 - 0.045 + neckY + 0.32 * 0.68) * 0.5;
    const yThoracic = neckY + 0.32 * 0.45;
    const yCrown = mix(0.012, TALL_CROWN_Y, tallU);
    const yHead = yCrown + b.headR;
    const lumbar = along(pelvis, phiP, hipY0 - yLumbar);
    const thoracic = along(lumbar, phiL, yLumbar - yThoracic);
    neck = along(thoracic, phiT, yThoracic - neckY);
    crown = along(neck, phiN, neckY - yCrown);
    head = along(neck, phiH, neckY - yHead);
    const shDown = shY - neckY;
    const shMid = {x: neck.x - Math.sin(phiT) * shDown, y: neck.y + Math.cos(phiT) * shDown};
    shL = {x: shMid.x - b.shW * Math.cos(phiT), y: shMid.y - b.shW * Math.sin(phiT)};
    shR = {x: shMid.x + b.shW * Math.cos(phiT), y: shMid.y + b.shW * Math.sin(phiT)};
    shCx = shMid.x;
    headX = head.x;
  } else {
    neck = {x: shCx0, y: neckY};
    crown = {x: headX0, y: mix(0.012, TALL_CROWN_Y, tallU)};
    head = {x: headX0, y: crown.y + b.headR};
    shL = {x: shCx0 - b.shW, y: shY};
    shR = {x: shCx0 + b.shW, y: shY};
  }
  const sh8 = live ? shoulderFigureEight({tSec, stepHz: hz, phase: fig8phase, hush: hushU, still: false, amount: shEightAmt, activation: +activation || 0}) : {x: 0, y: 0, tilt: 0, twist: 0};
  if (sh8.x || sh8.y || sh8.tilt || sh8.twist) {
    const midX = (shL.x + shR.x) * 0.5 + sh8.x;
    const midY = (shL.y + shR.y) * 0.5 + sh8.y;
    const hx = (shR.x - shL.x) * 0.5, hy = (shR.y - shL.y) * 0.5;
    const c = Math.cos(sh8.tilt), s = Math.sin(sh8.tilt);
    const rx = hx * c - hy * s, ry = hx * s + hy * c;
    shL = {x: midX - rx - sh8.twist, y: midY - ry};
    shR = {x: midX + rx + sh8.twist, y: midY + ry};
    if (neck) neck = {x: neck.x + sh8.x * 0.45, y: neck.y + sh8.y * 0.45};
    if (head) head = {x: head.x + sh8.x * 0.18, y: head.y + sh8.y * 0.18};
    if (crown) crown = {x: crown.x + sh8.x * 0.18, y: crown.y + sh8.y * 0.18};
  }
  if (leanTilt) {
    const tlt = leanTilt;
    if (neck) neck = {x: neck.x - tlt * 0.85, y: neck.y, z: neck.z || 0};
    if (head) head = {x: head.x - tlt, y: head.y, z: head.z || 0};
    if (crown) crown = {x: crown.x - tlt, y: crown.y, z: crown.z || 0};
    if (shL) shL = {x: shL.x - tlt * 0.7, y: shL.y, z: shL.z || 0};
    if (shR) shR = {x: shR.x - tlt * 0.7, y: shR.y, z: shR.z || 0};
    shCx -= tlt * 0.7;
    headX -= tlt;
  }
  const lw = live ? legWaveState({tSec, strikes, times, hush: hushU, amount: LEG_COMPLEX}) : {knee: {L: 0, R: 0}, hip: {L: 0, R: 0}};
  const phiP0 = sp ? sp.phi.pelvis : 0;
  const hipPerpX = Math.cos(phiP0), hipPerpY = Math.sin(phiP0);
  let hipL = {
    x: pelvis.x - b.hipW * (1 - 0.15 * tallU) * hipPerpX - lw.hip.L,
    y: pelvis.y - b.hipW * (1 - 0.15 * tallU) * hipPerpY + (w < 0 ? 0.008 * give : 0)
  };
  let hipR = {
    x: pelvis.x + b.hipW * (1 - 0.15 * tallU) * hipPerpX + lw.hip.R,
    y: pelvis.y + b.hipW * (1 - 0.15 * tallU) * hipPerpY + (w > 0 ? 0.008 * give : 0)
  };
  let kneeL = ikJoint(hipL, ankleL, THIGH, SHIN, -1);
  let kneeR = ikJoint(hipR, ankleR, THIGH, SHIN, 1);
  const nudgeKnee = (knee, hip, ankle, outwardSign, amt) => {
    if (!amt) return knee;
    const dx = ankle.x - hip.x, dy = ankle.y - hip.y;
    const d = Math.hypot(dx, dy) || 1e-6;
    let px = -dy / d, py = dx / d;
    if (px * outwardSign < 0) { px = -px; py = -py; }
    return {x: knee.x + px * amt, y: knee.y + py * amt};
  };
  kneeL = nudgeKnee(kneeL, hipL, ankleL, -1, lw.knee.L);
  kneeR = nudgeKnee(kneeR, hipR, ankleR, 1, lw.knee.R);
  const sw = swing || {shoulder: -0.5 * w, hand: -0.4 * w};
  const hp = sw.hand - sw.shoulder;
  const up = clamp(+lift || 0, 0, 0.05);
  const handAmp = b.handAmp || b.swingAmp * 1.15;
  const flexWave = live ? armWaveFlex({tSec, strikes, times, hush: hushU, amount: ARM_FLEX}) : {elL: 0, elR: 0, wrL: 0, wrR: 0};
  let aUpperL, aUpperR, aForeL, aForeR;
  let flexL = 0, flexR = 0;
  if (raise <= 0) {
    // Rest / low: original athletic arms-down, plus the heart-branch pulse.
    aUpperL = -b.abductL + b.swingAmp * sw.shoulder - up * 2.2;
    aUpperR = b.abductR + b.swingAmp * sw.shoulder + up * 2.2;
    aForeL = aUpperL + b.elbowL + b.swingAmp * 1.15 * hp + up * 3.0;
    aForeR = aUpperR - b.elbowR + b.swingAmp * 1.15 * hp - up * 3.0;
  } else {
    // Per-family lift (TJ 7:51 PM). each arm uses the original mid/high
    // curves, then a lean (positive = stage right) and a per-arm raise so
    // one arm can stay down or both can travel to the same side.
    const swingKeep = 1 - 0.88 * Math.max(flexT, elevT);
    const left = armRaiseAngles(-1, raise * famSpec.raiseL, b);
    const right = armRaiseAngles(1, raise * famSpec.raiseR, b);
    flexL = left.flexT; flexR = right.flexT;
    const leanL = famSpec.leanL * deg(58) * Math.max(left.flexT, left.elevT);
    const leanR = famSpec.leanR * deg(58) * Math.max(right.flexT, right.elevT);
    aUpperL = left.u - leanL + b.swingAmp * sw.shoulder * swingKeep;
    aUpperR = right.u - leanR + b.swingAmp * sw.shoulder * swingKeep;
    aForeL = left.f - leanL + handAmp * hp * swingKeep;
    aForeR = right.f - leanR + handAmp * hp * swingKeep;
  }
  // Arm-wave flex (amount 0.8): damped elbow/wrist response on the same pulse clock.
  aForeL += flexWave.elL * deg(16);
  aForeR -= flexWave.elR * deg(16);
  const wrBendL = flexWave.wrL * deg(18);
  const wrBendR = flexWave.wrR * deg(18);
  let elL = {x: shL.x + Math.sin(aUpperL) * UPPER_ARM, y: shL.y + Math.cos(aUpperL) * UPPER_ARM};
  let elR = {x: shR.x + Math.sin(aUpperR) * UPPER_ARM, y: shR.y + Math.cos(aUpperR) * UPPER_ARM};
  let wristL = {x: elL.x + Math.sin(aForeL) * FOREARM, y: elL.y + Math.cos(aForeL) * FOREARM};
  let wristR = {x: elR.x + Math.sin(aForeR) * FOREARM, y: elR.y + Math.cos(aForeR) * FOREARM};
  let handL = {x: wristL.x + Math.sin(aForeL + wrBendL) * HAND_LEN, y: wristL.y + Math.cos(aForeL + wrBendL) * HAND_LEN};
  let handR = {x: wristR.x + Math.sin(aForeR - wrBendR) * HAND_LEN, y: wristR.y + Math.cos(aForeR - wrBendR) * HAND_LEN};
  // Heart-branch pulse: a small decaying lift/sway at elbows and hands.
  // When arms are already rising from activation, apply it as a position nudge
  // so the athletic mid/high carry stays intact.
  if (raise > 0 && up > 0) {
    const n = up / 0.05;
    const upEl = 0.016 * n, outEl = 0.012 * n;
    elL = {x: elL.x - outEl, y: elL.y - upEl};
    elR = {x: elR.x + outEl, y: elR.y - upEl};
    const upH = 0.018 * n, sway = 0.016 * n;
    wristL = {x: wristL.x - sway, y: wristL.y - upH};
    wristR = {x: wristR.x + sway, y: wristR.y - upH};
    handL = {x: handL.x - sway * 1.15, y: handL.y - upH * 1.1};
    handR = {x: handR.x + sway * 1.15, y: handR.y - upH * 1.1};
  }
  // Hands stay above the elbows once that arm's flexion is on (mid and high).
  const minClear = 0.02;
  if (flexL > 0.55 || (family === DEFAULT_ARM_FAMILY && flexT > 0.55)) {
    if (handL.y > elL.y - minClear) {
      const dy = (elL.y - minClear) - handL.y;
      wristL = {x: wristL.x, y: wristL.y + dy * 0.75};
      handL = {x: handL.x, y: handL.y + dy};
    }
  }
  if (flexR > 0.55 || (family === DEFAULT_ARM_FAMILY && flexT > 0.55)) {
    if (handR.y > elR.y - minClear) {
      const dy = (elR.y - minClear) - handR.y;
      wristR = {x: wristR.x, y: wristR.y + dy * 0.75};
      handR = {x: handR.x, y: handR.y + dy};
    }
  }
  let groin = {x: hipCx, y: groinY};
  let heart = {x: shCx * 0.45 + hipCx * 0.55, y: neck.y + 0.175};
  const jig = live ? jiggleState({tSec, strikes, side, frac, periodSec, hush: hushU, amount: JIGGLE, still: false}) : {gluteL: 0, gluteR: 0, thighL: 0, thighR: 0};
  const hipTwistAmt = hipTwist != null && Number.isFinite(+hipTwist) ? +hipTwist : HIP_TWIST;
  const shTwistAmt = shoulderTwist != null && Number.isFinite(+shoulderTwist) ? +shoulderTwist : SHOULDER_TWIST;
  const turnDeg = maxBodyTurn != null && Number.isFinite(+maxBodyTurn) ? +maxBodyTurn : MAX_BODY_TURN_DEG;
  const turnF = turnFreq != null && Number.isFinite(+turnFreq) ? +turnFreq : TURN_FREQ;
  let travel = {facing: 0, hipYaw: 0, shYaw: 0, shRel: 0, stepZ: 0};
  const pts = {head, neck, shL, shR, elL, elR, wristL, wristR, handL, handR, groin, crown, heart,
    hipL, hipR, kneeL, kneeR, ankleL, ankleR, footL: toeL, footR: toeR, heelL, heelR};
  if (clocked) {
    travel = bodyTravelState({
      id, tSec, side, still, activation: +activation || 0, hush: hushU, stepHz: hz,
      hipTwist: hipTwistAmt, shoulderTwist: shTwistAmt, maxTurnDeg: turnDeg, turnFreq: turnF,
      phase: fig8phase
    });
    applyBodyYaw(pts, {
      originX: side < 0 ? midL : midR,
      facing: travel.facing, hipYaw: travel.hipYaw, shYaw: travel.shYaw,
      stepZ: travel.stepZ, liftL, liftR
    });
    head = pts.head; neck = pts.neck; shL = pts.shL; shR = pts.shR;
    elL = pts.elL; elR = pts.elR; wristL = pts.wristL; wristR = pts.wristR;
    handL = pts.handL; handR = pts.handR; groin = pts.groin; crown = pts.crown; heart = pts.heart;
    hipL = pts.hipL; hipR = pts.hipR; kneeL = pts.kneeL; kneeR = pts.kneeR;
    ankleL = pts.ankleL; ankleR = pts.ankleR; toeL = pts.footL; toeR = pts.footR;
    heelL = pts.heelL; heelR = pts.heelR;
    kneeL = ikJoint(hipL, ankleL, THIGH, SHIN, -1);
    kneeR = ikJoint(hipR, ankleR, THIGH, SHIN, 1);
  }
  const unit = {b, head, neck, shL, shR, elL, elR, wristL, wristR, handL, handR, groin, crown, heart,
    hipL, hipR, kneeL, kneeR, ankleL, ankleR, footL: toeL, footR: toeR, heelL, heelR,
    liftL, liftR, give, raise, flexT, elevT, tall: tallU, stanceW, stanceSh: stanceW / (b.shW || 0.125),
    armFamily: family, contactL, contactR, jiggle: jig, stomp, spine: sp,
    twist: {facing: travel.facing, hipYaw: travel.hipYaw, shYaw: travel.shYaw, shRel: travel.shRel}};
  if (clocked && dynamics !== false) {
    smoothPoseJoints(id, unit, {tSec, still, hush: hushU, side, liftL, liftR, contactL, contactR, enabled: true});
    unit.kneeL = ikJoint(unit.hipL, unit.ankleL, THIGH, SHIN, -1);
    unit.kneeR = ikJoint(unit.hipR, unit.ankleR, THIGH, SHIN, 1);
  }
  return unit;
}


// Unit pose → stage px: center x, top y (crown), height.
export function placePose(unit, cx, top, height) {
  const out = {b: unit.b, height};
  for (const k of Object.keys(unit)) {
    if (k === 'b') continue;
    const p = unit[k];
    if (!p || typeof p !== 'object' || !Number.isFinite(+p.x) || !Number.isFinite(+p.y)) {
      out[k] = p;
      continue;
    }
    const q = {x: cx + p.x * height, y: top + p.y * height};
    if (Number.isFinite(+p.z)) q.z = p.z * height;
    out[k] = q;
  }
  return out;
}

// Arm path (heart → shoulder → elbow → wrist → fingertips), stage px.
export function armPath(pose, side) {
  return side < 0
    ? [pose.heart, pose.shL, pose.elL, pose.wristL, pose.handL]
    : [pose.heart, pose.shR, pose.elR, pose.wristR, pose.handR];
}

export function pointAlong(pts, u) {
  if (!pts || pts.length < 2) return null;
  let total = 0;
  const seg = [];
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); seg.push(l); total += l; }
  let d = clamp(+u || 0, 0, 1) * total;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) {
      const t = seg[i] > 0 ? clamp(d / seg[i], 0, 1) : 0;
      return {x: pts[i].x + (pts[i + 1].x - pts[i].x) * t, y: pts[i].y + (pts[i + 1].y - pts[i].y) * t};
    }
    d -= seg[i];
  }
  return pts[pts.length - 1];
}


function mapPosePoint(pose, map, k) {
  const jig = pose.jiggle || {};
  const jH = pose.height > 0 ? pose.height : 1;
  let dx = 0, dy = 0;
  if (k === 'hipL') { dx = -(jig.gluteL || 0) * jH - (jig.thighL || 0) * jH * 0.55; dy = (jig.gluteL || 0) * jH * 0.22; }
  else if (k === 'hipR') { dx = (jig.gluteR || 0) * jH + (jig.thighR || 0) * jH * 0.55; dy = (jig.gluteR || 0) * jH * 0.22; }
  else if (k === 'groin') dy = ((jig.gluteL || 0) + (jig.gluteR || 0)) * 0.35 * jH;
  return map(pose[k].x + dx, pose[k].y + dy);
}

// Dark articulated figure. xy maps stage px → screen px; scale = screen/stage.
// Stub canvases in tests may lack arc(); fall back to a 12-gon.
function circle(ctx, x, y, r) {
  if (typeof ctx.arc === 'function') { ctx.arc(x, y, r, 0, Math.PI * 2); return; }
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    if (i === 0) ctx.moveTo(x + r, y); else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
}

export function paintShadowFigure(ctx, pose, xy, options = {}) {
  if (!ctx || !pose || typeof ctx.beginPath !== 'function') return false;
  const map = typeof xy === 'function' ? xy : (x, y) => ({x, y});
  const P = k => mapPosePoint(pose, map, k);
  const scale = Number.isFinite(+options.scale) && +options.scale > 0 ? +options.scale : 1;
  const lw = Math.max(1.6, pose.b.limb * pose.height * scale);
  const alpha = Number.isFinite(+options.alpha) ? clamp(+options.alpha, 0, 1) : 1;
  const twist = pose.twist || {};
  const facing = +twist.facing || 0;
  const yawSh = facing + (+twist.shYaw || 0);
  const yawHip = facing + (+twist.hipYaw || 0);
  const hPx = (pose.height || 80) * scale;
  const shHalf = (pose.b.shW || 0.125) * hPx;
  const hipHalf = (pose.b.hipW || 0.09) * hPx;
  const shExt = yawExtent(shHalf, 0.65 * shHalf, yawSh);
  const hipExt = yawExtent(hipHalf, 0.70 * hipHalf, yawHip);
  const lod = options.lod === 'full' ? 'full' : 'cheap';
  // Volume silhouette: projected ellipsoid half-width so a 90° profile keeps
  // chest/pelvis depth instead of collapsing to a line (TJ 8:40 PM).
  const torso = () => {
    const shL = P('shL'), shR = P('shR'), neck = P('neck'), hipR = P('hipR'), hipL = P('hipL'), groin = P('groin');
    const midShX = (shL.x + shR.x) * 0.5;
    const midHipX = (hipL.x + hipR.x) * 0.5;
    const sL = {x: midShX - shExt, y: shL.y}, sR = {x: midShX + shExt, y: shR.y};
    const hL = {x: midHipX - hipExt, y: hipL.y}, hR = {x: midHipX + hipExt, y: hipR.y};
    const quad = (a, c, b, t) => ({x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y});
    const yoke = {x: neck.x, y: neck.y + lw * 1.2};
    const seat = {x: groin.x, y: groin.y + lw};
    ctx.beginPath();
    if (lod === 'full') {
      const chestY = sL.y * 0.55 + neck.y * 0.45;
      const waistY = sL.y * 0.35 + hL.y * 0.65;
      const chestExt = yawExtent(shHalf * 0.96, 0.70 * shHalf, yawSh);
      const waistExt = yawExtent(mix(shHalf, hipHalf, 0.65), 0.58 * hipHalf, yawHip);
      const cL = {x: midShX - chestExt, y: chestY}, cR = {x: midShX + chestExt, y: chestY};
      const wL = {x: midHipX - waistExt, y: waistY}, wR = {x: midHipX + waistExt, y: waistY};
      ctx.moveTo(sL.x, sL.y);
      ctx.lineTo(cR.x, cR.y);
      for (let i = 1; i <= 4; i++) { const p = quad(sL, yoke, sR, i / 4); ctx.lineTo(p.x, p.y); }
      ctx.lineTo(cR.x, cR.y);
      ctx.lineTo(wR.x, wR.y);
      ctx.lineTo(hR.x, hR.y);
      for (let i = 1; i <= 4; i++) { const p = quad(hR, seat, hL, i / 4); ctx.lineTo(p.x, p.y); }
      ctx.lineTo(wL.x, wL.y);
      ctx.lineTo(cL.x, cL.y);
    } else {
      ctx.moveTo(sL.x, sL.y);
      for (let i = 1; i <= 5; i++) { const p = quad(sL, yoke, sR, i / 5); ctx.lineTo(p.x, p.y); }
      ctx.lineTo(hR.x, hR.y);
      for (let i = 1; i <= 5; i++) { const p = quad(hR, seat, hL, i / 5); ctx.lineTo(p.x, p.y); }
    }
    ctx.closePath();
  };

  const limbs = (widthMul) => {
    const thick = (base) => Math.max(1.1, yawExtent(base, base * 0.55, facing));
    const seg = (keys, w) => {
      ctx.lineWidth = thick(w);
      ctx.beginPath();
      const a = P(keys[0]);
      ctx.moveTo(a.x, a.y);
      for (let i = 1; i < keys.length; i++) { const p = P(keys[i]); ctx.lineTo(p.x, p.y); }
      ctx.stroke();
    };
    const leftFirst = facing <= 0; // positive yaw: left side toward camera
    const armL = () => seg(['shL', 'elL', 'wristL', 'handL'], lw * 0.66 * widthMul);
    const armR = () => seg(['shR', 'elR', 'wristR', 'handR'], lw * 0.66 * widthMul);
    const legL = () => seg(['hipL', 'kneeL', 'ankleL', 'footL'], lw * widthMul);
    const legR = () => seg(['hipR', 'kneeR', 'ankleR', 'footR'], lw * widthMul);
    if (leftFirst) { armR(); legR(); armL(); legL(); }
    else { armL(); legL(); armR(); legR(); }
    seg(['neck', 'head'], lw * 0.7 * widthMul);
  };
  const head = P('head');
  const headR = Math.max(2, pose.b.headR * pose.height * scale);
  const headRx = Math.max(2, yawExtent(headR * 0.86, headR * 0.95, facing));
  const fillHead = (rx, ry) => {
    ctx.beginPath();
    if (typeof ctx.ellipse === 'function') ctx.ellipse(head.x, head.y, rx, ry, 0, 0, Math.PI * 2);
    else circle(ctx, head.x, head.y, Math.max(rx, ry));
  };
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Faint rim first (reads on a dark floor), then the dark body over it.
  ctx.strokeStyle = options.rim || SKELETON_RIM;
  ctx.fillStyle = options.rim || SKELETON_RIM;
  ctx.lineWidth = 2;
  torso(); ctx.stroke();
  fillHead(headRx + 1.5, headR + 1.5); ctx.fill();
  ctx.strokeStyle = options.rim || SKELETON_RIM;
  limbs(1 + 2.4 / Math.max(2, lw));
  ctx.strokeStyle = options.shadow || SKELETON_SHADOW;
  ctx.fillStyle = options.shadow || SKELETON_SHADOW;
  torso(); ctx.fill();
  limbs(1);
  fillHead(headRx, headR); ctx.fill();
  // Subtle 3D contour (side-sim key light). Skip for ripple masks and stub
  // canvases without gradients, and never use a second buffer.
  if (options.shade !== false && typeof ctx.createLinearGradient === 'function' && typeof ctx.clip === 'function') {
    const midX = (P('shL').x + P('shR').x) * 0.5;
    const midY = (P('neck').y + P('groin').y) * 0.5;
    const ext = Math.max(headR * 4, Math.abs(P('shR').x - P('shL').x) * 0.7, lw * 8);
    const grad = ctx.createLinearGradient(
      midX + KEY_LIGHT.x * ext, midY + KEY_LIGHT.y * ext,
      midX - KEY_LIGHT.x * ext, midY - KEY_LIGHT.y * ext
    );
    grad.addColorStop(0.00, SHADE_HI);
    grad.addColorStop(0.22, 'rgba(150, 172, 205, 0.05)');
    grad.addColorStop(0.48, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.64, SHADE_CORE);
    grad.addColorStop(1.00, 'rgba(0, 0, 0, 0.10)');
    ctx.save();
    torso();
    ctx.beginPath();
    // Rebuild a clip that covers torso + head + thick limbs.
    const tclip = () => {
      torso();
      const hx = head.x, hy = head.y;
      if (typeof ctx.ellipse === 'function') ctx.ellipse(hx, hy, headRx, headR, 0, 0, Math.PI * 2);
      else circle(ctx, hx, hy, headR);
    };
    ctx.beginPath();
    tclip();
    // Limb capsules as additional clip subpaths (wide stroke → fill via clip after lining).
    const clipLimb = (keys) => {
      ctx.moveTo(P(keys[0]).x, P(keys[0]).y);
      for (let i = 1; i < keys.length; i++) ctx.lineTo(P(keys[i]).x, P(keys[i]).y);
    };
    clipLimb(['shL', 'elL', 'wristL', 'handL']);
    clipLimb(['shR', 'elR', 'wristR', 'handR']);
    clipLimb(['hipL', 'kneeL', 'ankleL', 'footL']);
    clipLimb(['hipR', 'kneeR', 'ankleR', 'footR']);
    ctx.lineWidth = lw * 1.35;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.clip();
    ctx.fillStyle = grad;
    const boxPad = ext * 1.4;
    ctx.fillRect(midX - boxPad, midY - boxPad, boxPad * 2, boxPad * 2);
    ctx.restore();
    // Faint lit-edge rim along each limb (additive, very cheap).
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(205, 222, 245, 0.13)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1.0, lw * 0.28);
    const rim = (keys) => {
      const a = P(keys[0]), b = P(keys[keys.length - 1]);
      const tx = b.x - a.x, ty = b.y - a.y;
      const len = Math.hypot(tx, ty) || 1e-6;
      let nx = -ty / len, ny = tx / len;
      if (nx * KEY_LIGHT.x + ny * KEY_LIGHT.y < 0) { nx = -nx; ny = -ny; }
      const off = Math.max(0.7, lw * 0.45);
      ctx.beginPath();
      ctx.moveTo(a.x + nx * off, a.y + ny * off);
      for (let i = 1; i < keys.length; i++) {
        const q = P(keys[i]);
        ctx.lineTo(q.x + nx * off, q.y + ny * off);
      }
      ctx.stroke();
    };
    rim(['shL', 'elL', 'wristL', 'handL']);
    rim(['shR', 'elR', 'wristR', 'handR']);
    rim(['hipL', 'kneeL', 'ankleL', 'footL']);
    rim(['hipR', 'kneeR', 'ankleR', 'footR']);
    ctx.restore();
  }
  ctx.restore();
  return true;
}

// Subtle silhouette halo: 3 outline strokes, wider = dimmer, additive.
// Cheap (no blur, no offscreen) so 24 sims stay on the iPhone 13 budget.
export function paintSilhouetteHalo(ctx, pose, xy, options = {}) {
  if (!ctx || !pose || typeof ctx.beginPath !== 'function') return false;
  const dim = Number.isFinite(+options.dim) ? +options.dim : 1;
  if (!(dim > 0)) return false;
  const map = typeof xy === 'function' ? xy : (x, y) => ({x, y});
  const P = k => mapPosePoint(pose, map, k);
  const scale = Number.isFinite(+options.scale) && +options.scale > 0 ? +options.scale : 1;
  const h = Math.max(8, (pose.height || 80) * scale);
  const widthScale = Number.isFinite(+options.width) ? Math.max(0, +options.width) : 1;
  const baseW = h * HALO_WIDTH_FRAC * widthScale;
  const peak = Math.max(0, Math.min(0.22, HALO_ALPHA * dim * (Number.isFinite(+options.alpha) ? +options.alpha : 1)));
  // Silence / zero activation: no halo. Tiny widths are skipped so we don't
  // pay for three stroke rings that wouldn't read.
  if (!(baseW > 0.4) || peak < 0.006) return false;
  const color = options.color || 'rgb(220, 228, 240)';
  const torso = () => {
    const shL = P('shL'), shR = P('shR'), neck = P('neck'), hipR = P('hipR'), hipL = P('hipL'), groin = P('groin');
    const quad = (a, c, b, t) => ({x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y});
    const yoke = {x: neck.x, y: neck.y + h * 0.02};
    const seat = {x: groin.x, y: groin.y + h * 0.015};
    ctx.beginPath();
    ctx.moveTo(shL.x, shL.y);
    for (let i = 1; i <= 5; i++) { const p = quad(shL, yoke, shR, i / 5); ctx.lineTo(p.x, p.y); }
    ctx.lineTo(hipR.x, hipR.y);
    for (let i = 1; i <= 5; i++) { const p = quad(hipR, seat, hipL, i / 5); ctx.lineTo(p.x, p.y); }
    ctx.closePath();
  };
  const limb = (keys) => {
    ctx.beginPath();
    const a = P(keys[0]);
    ctx.moveTo(a.x, a.y);
    for (let i = 1; i < keys.length; i++) { const q = P(keys[i]); ctx.lineTo(q.x, q.y); }
  };
  const head = P('head');
  const headR = Math.max(2, pose.b.headR * pose.height * scale);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  const rings = [
    {w: baseW * 2.0, a: peak * 0.22},
    {w: baseW * 1.15, a: peak * 0.42},
    {w: baseW * 0.55, a: peak * 0.62}
  ];
  const strokeAll = () => {
    // TJ 8:02 PM: the glow emanates from the head — brightest there,
    // falling off down the body (torso, arms, then legs).
    const base = ctx.globalAlpha;
    ctx.globalAlpha = base * HALO_FALLOFF.torso; torso(); ctx.stroke();
    ctx.globalAlpha = base * HALO_FALLOFF.arms;
    limb(['shL', 'elL', 'wristL', 'handL']); ctx.stroke();
    limb(['shR', 'elR', 'wristR', 'handR']); ctx.stroke();
    ctx.globalAlpha = base * HALO_FALLOFF.legs;
    limb(['hipL', 'kneeL', 'ankleL', 'footL']); ctx.stroke();
    limb(['hipR', 'kneeR', 'ankleR', 'footR']); ctx.stroke();
    ctx.globalAlpha = Math.min(1, base * HALO_FALLOFF.head);
    ctx.beginPath(); circle(ctx, head.x, head.y, headR); ctx.stroke();
  };
  for (const ring of rings) {
    ctx.globalAlpha = ring.a;
    ctx.lineWidth = ring.w;
    strokeAll();
  }
  // Soft radial bloom centred on the head: the source the halo falls off from.
  if (typeof ctx.createRadialGradient === 'function') {
    const r = headR + baseW * 2.2;
    const g = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, r);
    if (g && typeof g.addColorStop === 'function') {
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = Math.min(0.3, peak * HALO_HEAD_BLOOM);
      ctx.fillStyle = g;
      ctx.beginPath(); circle(ctx, head.x, head.y, r); ctx.fill();
    }
  }
  ctx.restore();
  return true;
}
// Halo brightness by body part relative to the ring alpha (head = source).
export const HALO_FALLOFF = Object.freeze({head: 1.6, torso: 0.75, arms: 0.6, legs: 0.35});
export const HALO_HEAD_BLOOM = 1.2;

// Small glowing beads running down both arms (additive, cheap).
export function paintArmPulses(ctx, pose, xy, u, options = {}) {
  if (!ctx || !pose || !(u >= 0) || typeof ctx.arc !== 'function') return false;
  const map = typeof xy === 'function' ? xy : (x, y) => ({x, y});
  const r = Math.max(1.5, (+options.radius || 2.4));
  const fade = 1 - 0.55 * u;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = options.color || 'hsl(120 90% 62%)';
  for (const side of [-1, 1]) {
    const at = pointAlong(armPath(pose, side), u);
    if (!at) continue;
    const q = map(at.x, at.y);
    ctx.globalAlpha = 0.18 * fade * (options.dim || 1);
    ctx.beginPath(); circle(ctx, q.x, q.y, r * 2.4); ctx.fill();
    ctx.globalAlpha = 0.55 * fade * (options.dim || 1);
    ctx.beginPath(); circle(ctx, q.x, q.y, r); ctx.fill();
  }
  ctx.restore();
  return true;
}

// Corner insets: larger stick figures of up to 4 dancers, dim (TJ t2563u).
export const INSET_MAX = 4;
export const INSET_ALPHA = 0.42;
export const INSET_W = 0.15;
export const INSET_H = 0.30;
export function insetRects(width, height, count = INSET_MAX) {
  const n = Math.max(0, Math.min(INSET_MAX, count | 0));
  // Larger, readable insets (TJ 6:48 PM); stage dancers keep out of corners.
  const w = Math.round(width * INSET_W);
  const h = Math.round(height * INSET_H);
  const m = Math.round(Math.min(width, height) * 0.02);
  const all = [
    {x: m, y: m, w, h},
    {x: width - m - w, y: m, w, h},
    {x: m, y: height - m - h, w, h},
    {x: width - m - w, y: height - m - h, w, h}
  ];
  return all.slice(0, n);
}

export function paintStickInset(ctx, unit, rect, options = {}) {
  if (!ctx || !unit || !rect || typeof ctx.beginPath !== 'function') return false;
  const height = rect.h * 0.86;
  const pose = placePose(unit, rect.x + rect.w / 2, rect.y + rect.h * 0.07, height);
  const alpha = Number.isFinite(+options.alpha) ? +options.alpha : INSET_ALPHA;
  const P = k => pose[k];
  const lw = Math.max(1.5, height * 0.018);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = options.color || 'rgba(190, 205, 240, 0.9)';
  ctx.lineWidth = lw;
  const line = keys => { ctx.beginPath(); ctx.moveTo(P(keys[0]).x, P(keys[0]).y); for (let i = 1; i < keys.length; i++) ctx.lineTo(P(keys[i]).x, P(keys[i]).y); ctx.stroke(); };
  line(['shL', 'elL', 'wristL', 'handL']);
  line(['shR', 'elR', 'wristR', 'handR']);
  line(['hipL', 'kneeL', 'ankleL', 'footL']);
  line(['hipR', 'kneeR', 'ankleR', 'footR']);
  line(['shL', 'shR']);
  line(['hipL', 'hipR']);
  line(['neck', 'groin']);
  ctx.beginPath(); circle(ctx, P('head').x, P('head').y, unit.b.headR * height); ctx.stroke();
  // Seven chakra nodes, groin → crown.
  const g = P('groin');
  const c = P('crown');
  const hueOf = options.hueAt || (s => 'hsl(' + (s * 275).toFixed(0) + ' 95% 62%)');
  for (const ch of CHAKRAS_7) {
    const x = g.x + (c.x - g.x) * ch.s;
    const y = g.y + (c.y - g.y) * ch.s;
    const boost = Number.isFinite(+options.travelS) && options.travelS >= 0 ? Math.max(0, 1 - Math.abs(ch.s - options.travelS) / 0.2) : 0;
    ctx.fillStyle = hueOf(ch.s);
    ctx.beginPath(); circle(ctx, x, y, lw * (1.3 + boost * 1.2)); ctx.fill();
  }
  ctx.restore();
  return true;
}

// ---- Weight transfer with a planted stance foot (TJ 6:57 PM) ----
// The weight-bearing foot stays exactly where it is on the floor for the
// whole transfer: the figure is placed so its stance toe sits on a fixed floor
// anchor (base height, before any throb), so throb / pelvis give never slide
// or lift it. Only the free foot rises and steps. Rare jumps lift both.
export const JUMP_RISE = 0.07; // of figure height at the top of a jump
export const JUMP_SPAN = 0.42; // fraction of the beat spent in the air
function hash01(n) {
  let h = (n | 0) ^ 0x9e3779b9;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
// About one beat in 16–32 per dancer (its own rate), randomized by beat.
export function jumpEvery(id) {
  return 16 + Math.floor(hash01((id | 0) * 7919 + 13) * 17);
}
export function isJumpBeat(id, beat) {
  return hash01((id | 0) * 104729 + (beat | 0) * 7907 + 1) < 1 / jumpEvery(id);
}

// How often this dancer may try a standing-tall pose (every 4–8 beats).
export function tallEvery(id) {
  return 4 + Math.floor(hash01((id | 0) * 9157 + 3) * 5);
}
export function tallHoldBeats(id, beat) {
  return 1 + (hash01((id | 0) * 3343 + (beat | 0) * 11) >= 0.5 ? 1 : 0);
}
// True on a candidate beat at high activation. Never at low activation.
export function shouldEnterTall({id = 0, beat = 0, activation = 0, airborne = false} = {}) {
  if (airborne) return false;
  if (!(+activation >= TALL_ACT_ENTER)) return false;
  const period = tallEvery(id);
  const phase = Math.floor(hash01((id | 0) * 19 + 1) * period);
  const k = (beat | 0) - phase;
  if (k < 0 || k % period !== 0) return false;
  return hash01((id | 0) * 104729 + (beat | 0) * 7907 + 21) < TALL_CHANCE;
}

// Per-dancer standing-tall envelope 0..1, smoothed. Occasional 1–2 beat holds
// at high energy; always 0 at low activation.
const talls = new Map();
export function resetTallStand(id) {
  if (id == null) talls.clear();
  else talls.delete(id | 0);
}
export function tallStandAt(id, {activation = 0, beat = 0, now = 0, airborne = false, periodMs = 500} = {}) {
  let st = talls.get(id | 0);
  if (!st) { st = {on: false, until: -1, lastBeat: -1, y: 0, t: +now || 0}; talls.set(id | 0, st); }
  const t = +now || 0;
  const act = Math.max(0, +activation || 0);
  const beatN = beat | 0;
  if (act < TALL_ACT_HOLD) {
    st.on = false;
  } else if (!st.on && !airborne && beatN !== st.lastBeat && shouldEnterTall({id, beat: beatN, activation: act, airborne})) {
    st.on = true;
    st.until = t + tallHoldBeats(id, beatN) * Math.max(180, +periodMs || 500);
  }
  if (st.on && (airborne || act < TALL_ACT_HOLD || (st.until >= 0 && t >= st.until))) st.on = false;
  st.lastBeat = beatN;
  const dt = Math.max(0, Math.min(0.1, (t - st.t) / 1000));
  st.t = t;
  const target = st.on ? 1 : 0;
  const a = dt > 0 ? 1 - Math.exp(-dt / TALL_BLEND_S) : 0;
  st.y += a * (target - st.y);
  if (!Number.isFinite(st.y)) st.y = 0;
  if (talls.size > 256) talls.clear();
  return clamp(st.y, 0, 1);
}
export function jumpLift(frac) {
  const f = clamp(+frac || 0, 0, 1);
  return f >= JUMP_SPAN ? 0 : JUMP_RISE * Math.sin(Math.PI * f / JUMP_SPAN);
}
export function stanceKey(side, unit) {
  if (unit) {
    const c = side < 0 ? unit.contactL : unit.contactR;
    if (c === 'heel') return side < 0 ? 'heelL' : 'heelR';
  }
  return side < 0 ? 'footL' : 'footR';
}
// Unit pose → stage px with the stance toe pinned at its floor anchor.
// baseH: steady figure height (no throb) that sets the floor and foot spot.
export function placePoseOnFloor(unit, {cx, cy, baseH, height, side = -1, jump = 0, anchorX} = {}) {
  const h = height > 0 ? height : baseH;
  const bh = baseH > 0 ? baseH : h;
  const key = stanceKey(side, unit);
  const toe = unit[key] || unit[side < 0 ? 'footL' : 'footR'];
  const floorY = cy - bh / 2 + 0.99 * bh;
  // Sticky anchorX keeps the planted toe still when stance width changes
  // (standing tall). Default is the usual cx + toe.x * baseH pin.
  const ax = Number.isFinite(+anchorX) ? +anchorX : cx + toe.x * bh;
  const anchor = {x: ax, y: floorY - Math.max(0, +jump || 0) * bh};
  const out = {b: unit.b, height: h, stance: key, floorY};
  for (const k of Object.keys(unit)) {
    if (k === 'b') continue;
    const p = unit[k];
    if (!p || typeof p !== 'object' || !Number.isFinite(+p.x) || !Number.isFinite(+p.y)) {
      out[k] = p;
      continue;
    }
    const q = {x: anchor.x + (p.x - toe.x) * h, y: anchor.y + (p.y - toe.y) * h};
    if (Number.isFinite(+p.z)) q.z = p.z * h;
    out[k] = q;
  }
  return out;
}
