// #869 Neural Dance live motion in the Kinoteka Annex (TJ t2680u, Nov 9 2026).
// Drives every annex dancer with the SAME pose engine as tjm.art/neural-dance/live
// (skeleton-dancer.js / skeleton-motion.js / song-energy.js from neural-dance@main),
// fed by a synthetic music program (the annex has no mic): per-band strikes, a
// neighbor pulse network (per-dancer activation from received energy), hush to
// stillness in silence. 3D extras for the true-3D rooms: hip/shoulder twist,
// depth steps, ±90° body turns with a damped spring, pelvis kept over the
// supporting foot, and free-flying pinpoint pulses homing on the target head.
import {
  skeletonPose, stepFrac, stepWeight, armSwing, armLiftAmount, smoothArmActivation, tallStandAt,
  armLiftPhraseIndex, armLiftFamilyFor, stompIntensity, armPulse, isJumpBeat, jumpLift, stanceKey, HEART_S
} from './nd/skeleton-dancer.js';
import { createPulseNetwork, createDancerEnergy, dancerIntake, ARM_LIFT_FULL } from './nd/song-energy.js';
import { pulseTravelTimes, pulseDriveHz, pulseFront, stringActivation, PULSE_AMP_FRAC } from './nd/vibrating-string.js';
import { dancerHueRgb } from './nd/dancer-hue.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const deg = d => d * Math.PI / 180;
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
export const TWIST = { hip: deg(20), shoulder: deg(25), turnMax: deg(90), depthStep: 0.2 };

// ---- synthetic set (48 s loop): intro, build, drop, break, peak, ~3.5 s silence ----
const SET = [[0, 0.32], [4, 0.45], [10, 0.7], [16, 1.0], [30, 0.5], [37, 1.0], [44.2, 0], [47.6, 0.25], [48, 0.32]];
export function musicAt(tSec) {
  const x = ((tSec % 48) + 48) % 48;
  for (let i = 0; i < SET.length - 1; i++) { const [a, ea] = SET[i], [b, eb] = SET[i + 1]; if (x >= a && x < b) { const silent = ea === 0; return { energy: silent ? 0 : ea + (eb && eb > ea && b - a > 3 ? (eb - ea) * (x - a) / (b - a) : 0), silent }; } }
  return { energy: 0.3, silent: false };
}
// per-band strike grid on the beat clock (band 0 kick, 1 bass, 2 snare, 3 hi-hat)
export const BAND = [{ every: 1, off: 0, min: 0.0 }, { every: 2, off: 0, min: 0.3 }, { every: 2, off: 1, min: 0.2 }, { every: 1, off: 0.5, min: 0.55 }];

export function createDrive(dancers, { linkR = 1.7, emit = true, actOf = null } = {}) {
  // 871: emit=false -> pulses come from the #823 3D energy world instead; actOf(id) -> external activation (capture-fed)
  const net = createPulseNetwork({ linkR: linkR * 100 });
  const dEnergy = createDancerEnergy();
  const times = pulseTravelTimes();
  const S = new Map(); // id -> state
  const pulses = []; // free-flying pinpoints {src,dst,p:[x,y,z],v:[..],age,trail:[[x,y,z]...],prog0}
  let hush = 1, lastBeatX = -1, lastHalf = -1, fired = 0, landed = 0;
  const st = id => { let s = S.get(id); if (!s) { s = { strikes: [], strikeAt: -1, beat: 0, period: 500, anchor: null, side: -1, zL: 0, zR: 0, zFrom: 0, zTo: 0, turn: 0, turnV: 0, turnGoal: 0, phraseSeen: -1, flash: 0, act: 0, unit: null, lastFire: -9 }; S.set(id, s); } return s; };
  const bandOf = dn => ((dn.id * 7) % 4 + 4) % 4; // 870: band from the ID alone (live: from the sticker), so a captured ID maps to the same band/hue in both rooms

  function emitFrom(dn, nowS) {
    const s = st(dn.id); if (!emit || nowS - s.lastFire < 0.2 || !dn.headW) return; s.lastFire = nowS;
    const near = dancers.filter(o => o !== dn && o.headW).map(o => [Math.hypot(o.pos[0] - dn.pos[0], o.pos[1] - dn.pos[1]), o]).filter(a => a[0] < linkR).sort((a, b) => a[0] - b[0]).slice(0, 2);
    for (const [, o] of near) {
      if (pulses.length > 40) break;
      const p = dn.headW.slice(); p[1] += 0.12; const d = [o.headW[0] - p[0], o.headW[1] - p[1], o.headW[2] - p[2]], L = Math.hypot(...d) || 1;
      fired++; pulses.push({ src: dn.id, dst: o, p, v: [d[0] / L * 1.1, 1.5, d[2] / L * 1.1], age: 0, trail: [p.slice()], L0: L });
    }
  }

  function step(dt, tSec, beatInfo) {
    const now = tSec * 1000, m = musicAt(tSec);
    // hush: ~0.6 s close, ~0.3 s open (live: adaptive silence gate -> settle to stillness)
    hush += ((m.silent ? 0 : 1) - hush) * Math.min(1, dt * (m.silent ? 4.5 : 8));
    if (hush < 0.01) hush = 0;
    const bpmMs = 60000 / beatInfo.bpm, bx = beatInfo.index + beatInfo.phase;
    net.setDancers(dancers.map(d => ({ id: d.id, x: d.pos[0] * 100, y: d.pos[1] * 100, type: bandOf(d) })));
    net.tick(dt, now);
    // band hits on the half-beat grid
    const half = Math.floor(bx * 2);
    if (half !== lastHalf) {
      if (lastHalf >= 0 && !m.silent) for (let k = 0; k < 4; k++) {
        const B = BAND[k], pos = half / 2 - B.off; if (pos < 0 || Math.abs(pos - Math.round(pos)) > 1e-6 || Math.round(pos) % B.every) continue;
        if (m.energy < B.min) continue;
        net.hit(k, now);
        for (const dn of dancers) if (bandOf(dn) === k) {
          const s = st(dn.id); s.strikeAt = now; s.period = bpmMs * B.every; s.beat++;
          const env = clamp(m.energy * (0.75 + 0.25 * Math.sin(dn.id)), 0, 1), jump = isJumpBeat(dn.id, s.beat) && env >= 0.4 && hush > 0.9;
          s.strikes.push({ t0: tSec, side: s.beat % 2 ? 1 : -1, energy: env, beat: s.beat, jump }); if (s.strikes.length > 8) s.strikes.shift();
          if (net.activity(dn.id) >= 1.4) emitFrom(dn, tSec);
        }
      }
      lastHalf = half;
    }
    for (const dn of dancers) {
      const s = st(dn.id), band = bandOf(dn); s.band = band;
      while (s.strikes.length && tSec - s.strikes[0].t0 > 2.2 * times.full + 1) s.strikes.shift();
      const moving = hush > 0.02 && s.strikeAt >= 0;
      const motion = { strikeAt: s.strikeAt, period: s.period, beat: s.beat, tier: moving ? 'move' : 'rest' };
      const rawEase = moving ? stepFrac(now, motion) : 0, side = moving ? (s.beat % 2 ? 1 : -1) : -1;
      const ease = rawEase * hush, planted = (moving ? stepWeight(side, rawEase) : 0) * hush;
      const front = pulseFront(s.strikes, tSec, times), pulseAge = front ? front.age : Infinity, travelS = front && front.phase === 'string' ? front.s : -1;
      const latest = s.strikes[s.strikes.length - 1];
      const jumpUp = latest && latest.jump && latest.beat === s.beat ? jumpLift(rawEase) * hush : 0;
      const pulseAmp = PULSE_AMP_FRAC * 160 * hush, pulseHz = pulseDriveHz(1000 / Math.max(250, s.period));
      // AGC + string activation at 10 Hz per dancer (the rolling 25 s percentile window is the hot path)
      s.eAcc = (s.eAcc || 0) + dt; if (s.eAcc >= 0.1 || s.selfE == null) { s.eAcc = 0;
        const instant = stringActivation(tSec, s.strikes, { amp: pulseAmp, hz: pulseHz, times });
        const raw = dancerIntake({ received: net.received(dn.id), local: m.energy * 0.6 * hush, stringAct: instant });
        s.selfE = dEnergy.process(dn.id, now, raw, { open: hush > 0.05 }).energy; }
      let act = smoothArmActivation(dn.id, s.selfE, now) * hush;
      if (actOf) { const ext = actOf(dn.id); if (ext != null) { s.extA = (s.extA || 0) + (Math.min(1.5, ext * 0.75) - (s.extA || 0)) * Math.min(1, dt * 6); act = s.extA * hush; } }
      s.act = act;
      const tall = tallStandAt(dn.id, { activation: act, beat: s.beat, now, airborne: jumpUp > 0, periodMs: s.period }) * hush;
      const phrase = armLiftPhraseIndex(motion), armFamily = armLiftFamilyFor(dn.id, phrase);
      const hz = 1000 / Math.max(250, s.period), sw0 = armSwing(dn.id, planted, now, 0.8, Math.min(2, hz));
      const swing = { shoulder: sw0.shoulder * hush, hand: sw0.hand * hush };
      const arm = Number.isFinite(pulseAge) && pulseAge < 3 ? armPulse(travelS, pulseAge / times.full, (times.leg + times.str * HEART_S) / times.full) : { u: -1, lift: 0 };
      const unit = skeletonPose({ id: dn.id, band, weight: planted, ease, side, swing, lift: arm.lift * hush, armLift: armLiftAmount(act * ARM_LIFT_FULL), jump: jumpUp, tall, armFamily, phrase, activation: act, now, periodMs: s.period, strikes: s.strikes, pulseAmp, pulseHz, times, hush, still: !moving, beat: s.beat, stepHz: hz });
      s.unit = unit; s.stomp = stompIntensity(act, hush); s.jump = jumpUp; s.planted = planted; s.ease = rawEase;
      // sticky planted toe (live placePoseOnFloor anchor): body shifts over the support foot
      const key = stanceKey(side, unit), toe = unit[key];
      if (!s.anchor || s.side !== side) { s.anchor = { x: toe.x }; s.side = side; }
      s.ofsX = s.anchor.x - toe.x; s.key = key;
      // Build B (neural-dance 8cf81e5): skeletonPose already carries facing turns (±90°), hip/shoulder twist,
      // depth steps (z), balance over the support foot and spring dynamics; the 3D room uses its facing as real yaw.
      const tw = unit.twist || {}; s.facing = +tw.facing || 0; dn.turnYaw = 0; s.turn = s.facing;
      s.flash = Math.max(0, s.flash - dt * 2.2);
      { const c = dancerHueRgb(dn.id, band); s.hue = [c.r, c.g, c.b]; }
    }
    // free-flying pulses: launched up and toward the target, then pulled by a homing "gravity" to its head
    for (let i = pulses.length - 1; i >= 0; i--) {
      const q = pulses[i], T = q.dst.headW; q.age += dt; if (!T || q.age > 3.5) { pulses.splice(i, 1); continue; }
      const d = [T[0] - q.p[0], T[1] - q.p[1], T[2] - q.p[2]], L = Math.hypot(...d) || 1e-6;
      if (L < 0.09) { const s = st(q.dst.id); s.flash = Math.min(1.5, s.flash + 0.8); landed++; pulses.splice(i, 1); continue; }
      const g = 9 + 6 * q.age; for (let k = 0; k < 3; k++) q.v[k] += (d[k] / L * g - q.v[k] * 1.6) * dt;
      const sp = Math.hypot(...q.v); if (sp > 4.5) for (let k = 0; k < 3; k++) q.v[k] *= 4.5 / sp;
      const stepL = sp * dt; if (stepL >= L) { q.p = T.slice(); } else for (let k = 0; k < 3; k++) q.p[k] += q.v[k] * dt;
      q.trail.push(q.p.slice()); if (q.trail.length > 7) q.trail.shift();
      q.prog = clamp(1 - L / q.L0, 0, 1);
    }
    return { hush, music: m };
  }
  return { step, state: st, pulses, get hush() { return hush; }, get fired() { return fired; }, get landed() { return landed; }, net };
}

// Unit pose -> body-local 3D joints (meters; +x screen-right, +y up, +z forward). Build B poses carry z (depth, facing).
const KEYS = ['head', 'neck', 'shL', 'shR', 'elL', 'elR', 'wristL', 'wristR', 'handL', 'handR', 'groin', 'crown', 'heart', 'hipL', 'hipR', 'kneeL', 'kneeR', 'ankleL', 'ankleR', 'footL', 'footR', 'heelL', 'heelR'];
export function joints3D(s, H, out = {}) {
  const u = s.unit; if (!u) return null; const floorY = u[s.key].y;
  for (const k of KEYS) { const p = u[k]; if (!p) continue; (out[k] ||= [0, 0, 0]);
    out[k][0] = (p.x + s.ofsX) * H; out[k][1] = (floorY - p.y) * H + (s.jump || 0) * H; out[k][2] = (+p.z || 0) * H; }
  return out;
}
export const wrap = wrapA;
