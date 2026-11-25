// Neural Dance 3D energy core.
// Standalone, pure JS, no DOM. Generalizes the live 2D pulse network
// (per-dancer activation, free-flying gravity-homing pulses that stop
// at the target head, silence settle, cascade cap) to (x, y, z).
// 2D live behavior is the z = 0 special case: when every dancer and
// aim point has z = 0, distances, travel times, heard-field, and
// pulse kinematics match the 2D runtime.

import { vec3, copy, dist, clamp } from './vec3.js';
import {
  linkRadiusFor,
  clampLinkRadius,
  LINK_R_MIN,
  WANDER_R,
  neighborsOf,
} from './neighbors.js';
import {
  createWave,
  evalWaves,
  pruneWaves,
  sampleVolume,
  SHELL,
  SURGE,
  PLANE,
} from './waves.js';
import { createRippleField, crowdScale } from './ripple-floor.js';

export const MAX_DANCERS = 48;
export const MAX_PULSES = 48;
export const MAX_TRAIL = 10;
export const MAX_GEN = 2;
export const CONTACT_R = 4;
export const CAPTURE_R = 28;
export const SOFT_R = 12;
export const V_MAX = 280;
export const MAX_LIFETIME = 2.2;
export const MAX_WAVES = 48;

export const BANDS = [
  { name: 'kick', lo: 40, hi: 120 },
  { name: 'bass', lo: 120, hi: 300 },
  { name: 'snare', lo: 300, hi: 2500 },
  { name: 'hat', lo: 5000, hi: 14000 },
];

const RATES = [1, 0.5, 1.5, 2];

function capFor(sens) {
  let cap = sens > 1 ? 2 * sens : 2;
  if (cap > 8) cap = 8;
  return cap;
}

function travelTime(distance) {
  let travel = 0.3 + distance / 170;
  if (travel < 0.25) travel = 0.25;
  return travel;
}

function lifetimeOf(travel) {
  let duration = travel * 1.6;
  if (duration < 0.8) duration = 0.8;
  if (duration > MAX_LIFETIME) duration = MAX_LIFETIME;
  return duration;
}

function mulberry32(seed) {
  let a = seed >>> 0 || 0xc0ffee;
  return function rnd() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createWorld(opts = {}) {
  const dancers = [];
  const pulses = [];
  const waves = [];
  let nextId = 1;
  let simTime = 0;
  let bpm = opts.bpm != null ? +opts.bpm : 120;
  let gravityPull = opts.gravity != null ? clamp(+opts.gravity, 0, 6) : 1;
  let wanderRate = opts.wander != null ? clamp(+opts.wander, 0, 0.8) : 0;
  let fireThreshold = opts.fireThreshold != null ? clamp(+opts.fireThreshold, 0.2, 3) : 1.4;
  let peakHold = opts.peakHold != null ? clamp(+opts.peakHold, 0.05, 12) : 2.8;
  let linkR = opts.linkRadius != null ? clampLinkRadius(opts.linkRadius) : LINK_R_MIN;
  let autoLink = opts.autoLink !== false;
  let clockOn = opts.clockOn !== false;
  let lowPower = !!opts.lowPower;
  const bandSens = [1, 1, 1, 1];
  if (Array.isArray(opts.bandSens)) {
    for (let i = 0; i < 4; i++) if (opts.bandSens[i] != null) bandSens[i] = Math.max(0, +opts.bandSens[i] || 0);
  }
  let rnd = mulberry32(opts.seed || 0xc0ffee);
  let pendingHits = 0;
  let wasListening = 0;

  const ripplePlane = opts.ripplePlane === 'xy' ? 'xy' : 'xz';
  const bounds = Object.assign(
    { min: vec3(-40, 0, -40), max: vec3(440, 200, 360) },
    opts.bounds || {}
  );
  const ripple = createRippleField({
    plane: ripplePlane,
    width: opts.rippleWidth,
    height: opts.rippleHeight,
    bounds: {
      minX: bounds.min.x,
      maxX: bounds.max.x,
      minU: ripplePlane === 'xy' ? bounds.min.y : bounds.min.z,
      maxU: ripplePlane === 'xy' ? bounds.max.y : bounds.max.z,
    },
  });

  const emitWaves = opts.emitWaves !== false;

  function pulseCap() {
    return lowPower ? 24 : MAX_PULSES;
  }

  function aims() {
    return dancers.map((d) => d.head);
  }

  function positions() {
    return dancers.map((d) => d.pos);
  }

  function refreshLinkRadius() {
    if (!autoLink) return linkR;
    linkR = linkRadiusFor(positions());
    return linkR;
  }

  function findIndex(id) {
    for (let i = 0; i < dancers.length; i++) if (dancers[i].id === id) return i;
    return -1;
  }

  function addDancer({ id, x, y, z = 0, k = 0, head } = {}) {
    if (dancers.length >= MAX_DANCERS) return null;
    const d = {
      id: id == null ? nextId++ : id,
      pos: vec3(x, y, z),
      head: vec3(head?.x ?? x, head?.y ?? (y + 28), head?.z ?? z),
      k: Math.max(0, Math.min(3, k | 0)),
      phase: rnd(),
      a: 0,
      recv: 0,
      rest: 0,
      peak: 0,
      ref: 0,
    };
    if (d.id >= nextId) nextId = d.id + 1;
    dancers.push(d);
    refreshLinkRadius();
    return d;
  }

  function removeDancer(id) {
    const idx = findIndex(id);
    if (idx < 0) return false;
    for (let i = pulses.length - 1; i >= 0; i--) {
      if (pulses[i].a === idx || pulses[i].b === idx) pulses.splice(i, 1);
    }
    for (const p of pulses) {
      if (p.a > idx) p.a--;
      if (p.b > idx) p.b--;
    }
    dancers.splice(idx, 1);
    refreshLinkRadius();
    return true;
  }

  function setPose(id, pose = {}) {
    const d = dancers[findIndex(id)];
    if (!d) return false;
    if (pose.x != null) d.pos.x = +pose.x;
    if (pose.y != null) d.pos.y = +pose.y;
    if (pose.z != null) d.pos.z = +pose.z;
    if (pose.head) {
      d.head.x = +pose.head.x;
      d.head.y = +pose.head.y;
      d.head.z = +pose.head.z;
    } else if (pose.x != null || pose.y != null || pose.z != null) {
      // Keep the head offset if only the hip/body moved.
      if (pose.x != null && pose.headX == null) {
        /* leave head unless explicitly moved; caller can pass head */
      }
    }
    if (pose.headX != null) d.head.x = +pose.headX;
    if (pose.headY != null) d.head.y = +pose.headY;
    if (pose.headZ != null) d.head.z = +pose.headZ;
    return true;
  }

  function setHeads(heads) {
    const n = Math.min(dancers.length, heads.length);
    for (let i = 0; i < n; i++) copy(dancers[i].head, heads[i]);
  }

  function heardField(i) {
    const a = dancers[i].pos;
    let heard = 0;
    for (let j = 0; j < dancers.length; j++) {
      if (j === i) continue;
      const d = dist(a, dancers[j].pos);
      if (d >= linkR) continue;
      heard += dancers[j].a * (0.2 + 0.25 * (1 - d / linkR));
    }
    if (heard > 2) heard = 2;
    return heard;
  }

  function receivedOf(i) {
    const heard = heardField(i);
    const recv = dancers[i].recv;
    return recv > heard ? recv : heard;
  }

  function enqueueState() {
    return {
      queue: [],
      cursor: 0,
      emitted: new Uint8Array(MAX_DANCERS),
      fireGen: new Int16Array(MAX_DANCERS),
      received: new Float32Array(MAX_DANCERS),
    };
  }
  let fire = enqueueState();

  function enqueue(index, gen) {
    if (fire.emitted[index]) return;
    fire.emitted[index] = 1;
    fire.fireGen[index] = gen || 0;
    if (fire.queue.length < MAX_DANCERS) fire.queue.push(index);
  }

  function arm(index, sens) {
    const d = dancers[index];
    if (d.rest > 0 || !(sens > 0)) return;
    const boost = 0.25 * sens;
    let next = d.a + boost;
    const floorV = 0.95 * sens;
    if (next < floorV) next = floorV;
    const cap = capFor(sens);
    if (next > cap) next = cap;
    d.a = next;
    enqueue(index, 0);
  }

  function spawnPulse(ai, bi, distance) {
    if (pulses.length >= pulseCap()) return null;
    const aHead = dancers[ai].head;
    const bHead = dancers[bi].head;
    const dx = bHead.x - aHead.x;
    const dy = bHead.y - aHead.y;
    const dz = bHead.z - aHead.z;
    let L = Math.hypot(dx, dy, dz);
    if (!(L > 0)) L = distance > 1 ? distance : 1;
    if (!(distance > 0)) distance = L;
    const travel = travelTime(distance);
    const p = {
      a: ai,
      b: bi,
      k: dancers[ai].k,
      age: 0,
      duration: lifetimeOf(travel),
      pos: vec3(aHead.x, aHead.y, aHead.z),
      vel: vec3((dx / L) * (distance / travel), (dy / L) * (distance / travel), (dz / L) * (distance / travel)),
      cruise: distance / travel,
      trail: [],
      wandered: 0,
      hit: new Uint8Array(MAX_DANCERS),
      gen: fire.fireGen[ai] || 0,
      arrived: 0,
    };
    p.hit[ai] = 1;
    pulses.push(p);
    return p;
  }

  function homeToward(p, dt) {
    if (!p || p.arrived || !(dt > 0)) return;
    const t = dancers[p.b] ? dancers[p.b].head : p.pos;
    const dx = t.x - p.pos.x;
    const dy = t.y - p.pos.y;
    const dz = t.z - p.pos.z;
    const r = Math.hypot(dx, dy, dz);
    if (r <= CONTACT_R) {
      copy(p.pos, t);
      p.vel.x = p.vel.y = p.vel.z = 0;
      return;
    }
    const ux = dx / r, uy = dy / r, uz = dz / r;
    const pull = (gravityPull > 0 ? gravityPull : 0) * 220;
    const denom = r > SOFT_R ? r : SOFT_R;
    const acc = pull / denom;
    p.vel.x += ux * acc * dt;
    p.vel.y += uy * acc * dt;
    p.vel.z += uz * acc * dt;
    let capture = 0;
    if (r < CAPTURE_R) capture = 1 - r / CAPTURE_R;
    const steerRate = 1.6 + 10 * capture;
    let s = 1 - Math.exp(-steerRate * dt);
    if (s < 0) s = 0;
    if (s > 1) s = 1;
    let sp = Math.hypot(p.vel.x, p.vel.y, p.vel.z);
    const cruise = p.cruise > 8 ? p.cruise : 8;
    if (sp < 0.1) sp = cruise;
    p.vel.x = p.vel.x * (1 - s) + ux * sp * s;
    p.vel.y = p.vel.y * (1 - s) + uy * sp * s;
    p.vel.z = p.vel.z * (1 - s) + uz * sp * s;
    if (sp < cruise) {
      const boost = (cruise - sp) * (1.2 + 2 * capture) * dt;
      p.vel.x += ux * boost;
      p.vel.y += uy * boost;
      p.vel.z += uz * boost;
    }
    const damp = Math.exp(-0.4 * dt * (1 + 3 * capture));
    p.vel.x *= damp;
    p.vel.y *= damp;
    p.vel.z *= damp;
    sp = Math.hypot(p.vel.x, p.vel.y, p.vel.z);
    if (sp > V_MAX) {
      p.vel.x = (p.vel.x / sp) * V_MAX;
      p.vel.y = (p.vel.y / sp) * V_MAX;
      p.vel.z = (p.vel.z / sp) * V_MAX;
    }
    const nx = p.pos.x + p.vel.x * dt;
    const ny = p.pos.y + p.vel.y * dt;
    const nz = p.pos.z + p.vel.z * dt;
    const dx2 = t.x - nx, dy2 = t.y - ny, dz2 = t.z - nz;
    if (dx * dx2 + dy * dy2 + dz * dz2 < 0 && r < CAPTURE_R * 1.4) {
      copy(p.pos, t);
      p.vel.x = p.vel.y = p.vel.z = 0;
      return;
    }
    p.pos.x = nx;
    p.pos.y = ny;
    p.pos.z = nz;
  }

  function maybeWander(p, dt) {
    if (!(wanderRate > 0) || p.wandered || p.arrived || !(dt > 0)) return;
    if (rnd() > wanderRate * dt) return;
    const cand = [];
    for (let i = 0; i < dancers.length; i++) {
      if (i === p.a || i === p.b) continue;
      if (dist(dancers[i].head, p.pos) < WANDER_R) cand.push(i);
    }
    if (!cand.length) return;
    let pick = Math.floor(rnd() * cand.length);
    if (pick < 0 || pick >= cand.length) pick = 0;
    p.wandered = 1;
    p.b = cand[pick];
    const t = dancers[p.b].head;
    const L = dist(t, p.pos);
    if (L > 1) {
      const travel = travelTime(L);
      p.cruise = L / travel;
      const remain = p.duration - p.age;
      const need = travel * 1.2;
      if (need > remain) {
        p.duration = p.age + need;
        if (p.duration > MAX_LIFETIME) p.duration = MAX_LIFETIME;
      }
    }
  }

  function impactDancer(p, i) {
    if (i < 0 || i >= dancers.length) return;
    if (p.hit[i]) return;
    p.hit[i] = 1;
    if (dancers[i].rest > 0) return;
    const src = p.a;
    let sens = 1;
    if (src >= 0 && src < dancers.length) {
      const k = dancers[src].k;
      if (k >= 0 && k <= 3) sens = bandSens[k];
    }
    if (!(sens > 0)) return;
    const add = 0.48 * sens;
    const cap = capFor(sens);
    let next = dancers[i].a + add;
    if (next > cap) next = cap;
    dancers[i].a = next;
    if (i !== src) {
      let rec = dancers[i].recv + add;
      if (rec > cap) rec = cap;
      dancers[i].recv = rec;
    }
    if (p.gen + 1 < MAX_GEN && dancers[i].a >= fireThreshold && simTime >= dancers[i].ref) {
      dancers[i].ref = simTime + 0.2;
      enqueue(i, p.gen + 1);
    }
  }

  function arriveAt(p, idx) {
    if (!p || p.arrived || idx < 0 || idx >= dancers.length) return;
    p.arrived = 1;
    p.b = idx;
    p.age = p.duration;
    copy(p.pos, dancers[idx].head);
    p.vel.x = p.vel.y = p.vel.z = 0;
    p.wandered = 0;
    impactDancer(p, idx);
    if (emitWaves) {
      ripple.impulseAt(dancers[idx].pos, 0.35 * crowdScale(dancers.length));
    }
  }

  function closeTo(x, y, z, i) {
    if (i < 0 || i >= dancers.length) return false;
    const t = dancers[i].head;
    const dx = t.x - x, dy = t.y - y, dz = t.z - z;
    return dx * dx + dy * dy + dz * dz <= CONTACT_R * CONTACT_R;
  }

  function collidePulse(p) {
    if (p.arrived) return;
    const { x, y, z } = p.pos;
    if (closeTo(x, y, z, p.b)) {
      arriveAt(p, p.b);
      return;
    }
    for (let i = 0; i < dancers.length; i++) {
      if (i === p.a || p.hit[i]) continue;
      if (closeTo(x, y, z, i)) {
        arriveAt(p, i);
        return;
      }
    }
  }

  function spawnBandWaves(index, k) {
    if (!emitWaves) return;
    const d = dancers[index];
    const origin = vec3(d.head.x, d.head.y, d.head.z);
    const amp = 0.7 + 0.4 * Math.min(1, d.a);
    if (k === 0) {
      waves.push(createWave({ kind: SHELL, origin, amplitude: amp, speed: 110, width: 10, decay: 0.55, born: simTime, band: 0, life: 2.8 }));
    } else if (k === 1) {
      const floorOrigin = vec3(d.pos.x, bounds.min.y, d.pos.z);
      waves.push(createWave({ kind: SURGE, origin: floorOrigin, amplitude: amp * 1.1, speed: 70, width: 14, decay: 0.45, born: simTime, band: 1, life: 3.2 }));
    } else if (k === 2) {
      const nrm = { x: 1, y: 0.15, z: 0.35 };
      waves.push(createWave({ kind: PLANE, origin, amplitude: amp * 0.8, speed: 140, width: 8, decay: 0.8, normal: nrm, born: simTime, band: 2, life: 2.2 }));
    } else {
      waves.push(createWave({ kind: SHELL, origin, amplitude: amp * 0.55, speed: 160, width: 6, decay: 1.1, born: simTime, band: 3, life: 1.6 }));
    }
    ripple.impulseAt(d.pos, (0.42 * amp) * crowdScale(dancers.length));
  }

  function drain() {
    const capPulses = pulseCap();
    while (fire.cursor < fire.queue.length) {
      const ai = fire.queue[fire.cursor++];
      if (ai < 0 || ai >= dancers.length) continue;
      const k = dancers[ai].k;
      const g = fire.fireGen[ai];
      if (g >= MAX_GEN) continue;
      spawnBandWaves(ai, k);
      let trails = 0;
      const neigh = neighborsOf(positions(), ai, linkR);
      for (const { j: bi, d: distance } of neigh) {
        if (dancers[bi].rest > 0) continue;
        const sens = k >= 0 && k <= 3 ? bandSens[k] : 1;
        let used = fire.received[bi];
        let amount = 0.65 - used;
        let falloff = 0.2 + 0.25 * (1 - distance / linkR);
        if (falloff < amount) amount = falloff;
        amount *= sens > 0 ? sens : 0;
        if (amount > 0) {
          fire.received[bi] = used + amount;
          const cap = capFor(sens);
          let next = dancers[bi].a + amount;
          if (next > cap) next = cap;
          dancers[bi].a = next;
          let rec = dancers[bi].recv + amount;
          if (rec > cap) rec = cap;
          dancers[bi].recv = rec;
          if (g + 1 < MAX_GEN && dancers[bi].a >= fireThreshold && simTime >= dancers[bi].ref) {
            dancers[bi].ref = simTime + 0.2;
            enqueue(bi, g + 1);
          }
        }
        if (trails < 2 && pulses.length < capPulses) {
          spawnPulse(ai, bi, distance);
          trails++;
        }
      }
    }
  }

  function appendTrail(p) {
    if (p.trail.length >= MAX_TRAIL) p.trail.shift();
    p.trail.push(vec3(p.pos.x, p.pos.y, p.pos.z));
  }

  function collapseTrail(p) {
    if (p.trail.length <= 1) return true;
    p.trail.shift();
    if (p.trail.length) copy(p.trail[p.trail.length - 1], p.pos);
    return p.trail.length <= 0;
  }

  function stepPulses(dt) {
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      if (!p.arrived) {
        p.age += dt;
        if (p.duration > 0 && p.age >= p.duration) {
          pulses.splice(i, 1);
          continue;
        }
        maybeWander(p, dt);
        homeToward(p, dt);
      }
      if (!p.arrived) collidePulse(p);
      if (p.arrived) {
        if (dancers[p.b]) {
          copy(p.pos, dancers[p.b].head);
          p.vel.x = p.vel.y = p.vel.z = 0;
        }
        if (collapseTrail(p)) pulses.splice(i, 1);
        continue;
      }
      appendTrail(p);
    }
  }

  function resetFire() {
    fire = enqueueState();
  }

  function update(dt, flags = {}) {
    if (!(dt > 0)) dt = 0;
    if (dt > 0.067) dt = 0.067;
    const listening = flags.listening ? 1 : 0;
    const gateOpen = flags.gateOpen !== false;
    simTime += dt;
    resetFire();

    if (listening && !wasListening) {
      pulses.length = 0;
      for (const d of dancers) {
        d.a = 0;
        d.recv = 0;
        d.peak = 0;
      }
    }
    wasListening = listening;

    for (const d of dancers) {
      d.a -= dt * 1.5;
      if (d.a < 0) d.a = 0;
      d.recv -= dt * 1.5;
      if (d.recv < 0) d.recv = 0;
      if (clockOn && !listening) d.phase += dt * bpm * (1 / 60) * RATES[d.k];
      d.rest -= dt;
      if (d.rest < 0) d.rest = 0;
      if (d.phase >= 1) {
        d.phase -= 1;
        if (d.phase >= 1) d.phase -= 1;
        if (clockOn && !listening) arm(dancers.indexOf(d), bandSens[d.k]);
      }
    }

    if (pendingHits) {
      if (!listening || gateOpen) {
        for (let k = 0; k < 4; k++) {
          if (!(pendingHits & (1 << k))) continue;
          for (let i = 0; i < dancers.length; i++) if (dancers[i].k === k) arm(i, bandSens[k]);
        }
      }
      pendingHits = 0;
    }

    drain();

    for (const d of dancers) {
      if (d.a > 1.75) d.peak += dt;
      else {
        d.peak -= dt * 0.6;
        if (d.peak < 0) d.peak = 0;
      }
      if (d.peak > peakHold) {
        d.rest = 1.6;
        d.peak = 0;
        d.a = 0.4;
        if (d.recv > 0.4) d.recv = 0.4;
      }
    }

    stepPulses(dt);
    drain();
    pruneWaves(waves, simTime);
    capWaves();
    ripple.step();
    return snapshot();
  }

  function settle(dt) {
    if (!(dt > 0)) return snapshot();
    if (dt > 0.067) dt = 0.067;
    pendingHits = 0;
    for (const d of dancers) {
      d.a = d.a * (1 - dt * 3) - dt * 3;
      if (d.a < 0) d.a = 0;
      d.peak = 0;
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      pulses[i].age += dt * 1.5;
      if (pulses[i].age >= pulses[i].duration) pulses.splice(i, 1);
    }
    pruneWaves(waves, simTime + dt);
    capWaves();
    simTime += dt;
    ripple.step();
    return snapshot();
  }

  function hit(band) {
    if (band < 0 || band > 3) return;
    pendingHits |= 1 << band;
  }

  function evaluateField(p) {
    let e = evalWaves(waves, p, simTime);
    e += ripple.sample(p) * 0.65;
    // Graph-coupled term: each dancer's activation heard at p.
    for (let i = 0; i < dancers.length; i++) {
      const d = dist(p, dancers[i].pos);
      if (d >= linkR) continue;
      e += dancers[i].a * (0.2 + 0.25 * (1 - d / linkR));
    }
    return e;
  }

  function capWaves() {
    const cap = 48;
    if (waves.length <= cap) return;
    waves.sort((a, b) => a.born - b.born);
    waves.splice(0, waves.length - cap);
  }

  /** Fast volume: analytic waves only (the 60 fps path). */
  function sampleWavesVolume(nx = 32, ny = 16, nz = 32) {
    return sampleVolume(waves, simTime, bounds, nx, ny, nz);
  }

  function sampleFieldVolume(nx = 32, ny = 16, nz = 32) {
    // Full E, including graph + ripple. Prefer sampleWavesVolume at 60 fps.
    const out = new Float32Array(nx * ny * nz);
    const min = bounds.min;
    const max = bounds.max;
    const dx = (max.x - min.x) / Math.max(1, nx - 1);
    const dy = (max.y - min.y) / Math.max(1, ny - 1);
    const dz = (max.z - min.z) / Math.max(1, nz - 1);
    const p = vec3();
    let i = 0;
    for (let iz = 0; iz < nz; iz++) {
      p.z = min.z + iz * dz;
      for (let iy = 0; iy < ny; iy++) {
        p.y = min.y + iy * dy;
        for (let ix = 0; ix < nx; ix++) {
          p.x = min.x + ix * dx;
          out[i++] = evaluateField(p);
        }
      }
    }
    return out;
  }

  function snapshot() {
    return {
      time: simTime,
      linkRadius: linkR,
      dancers: dancers.map((d, i) => ({
        id: d.id,
        index: i,
        x: d.pos.x,
        y: d.pos.y,
        z: d.pos.z,
        head: { x: d.head.x, y: d.head.y, z: d.head.z },
        k: d.k,
        a: d.a,
        recv: d.recv,
        received: receivedOf(i),
        rest: d.rest,
        phase: d.phase,
      })),
      pulses: pulses.map((p) => ({
        a: p.a,
        b: p.b,
        k: p.k,
        age: p.age,
        duration: p.duration,
        x: p.pos.x,
        y: p.pos.y,
        z: p.pos.z,
        vx: p.vel.x,
        vy: p.vel.y,
        vz: p.vel.z,
        trail: p.trail.map((t) => ({ x: t.x, y: t.y, z: t.z })),
        arrived: p.arrived,
        gen: p.gen,
      })),
      waveCount: waves.length,
    };
  }

  function clear() {
    pulses.length = 0;
    waves.length = 0;
    pendingHits = 0;
    for (const d of dancers) {
      d.a = 0;
      d.recv = 0;
      d.peak = 0;
      d.rest = 0;
    }
    ripple.clear();
  }

  return {
    addDancer,
    removeDancer,
    setPose,
    setHeads,
    hit,
    update,
    settle,
    clear,
    evaluateField,
    sampleFieldVolume,
    sampleWavesVolume,
    snapshot,
    refreshLinkRadius,
    setGravity(v) {
      gravityPull = clamp(+v, 0, 6);
    },
    setWander(v) {
      wanderRate = clamp(+v, 0, 0.8);
    },
    setLinkRadius(v) {
      autoLink = false;
      linkR = clampLinkRadius(v);
    },
    setBpm(v) {
      bpm = v > 0 ? v : 0;
    },
    setClock(on) {
      clockOn = !!on;
    },
    setSeed(s) {
      rnd = mulberry32(s);
    },
    setBandSens(band, v) {
      if (band >= 0 && band <= 3) bandSens[band] = Math.max(0, +v || 0);
    },
    get time() {
      return simTime;
    },
    get linkRadius() {
      return linkR;
    },
    get gravity() {
      return gravityPull;
    },
    get dancers() {
      return dancers;
    },
    get pulses() {
      return pulses;
    },
    get waves() {
      return waves;
    },
    get ripple() {
      return ripple;
    },
    get bounds() {
      return bounds;
    },
    neighborsOf(i, kMax) {
      return neighborsOf(positions(), i, linkR, kMax);
    },
  };
}

export {
  linkRadiusFor,
  createWave,
  evalWaves,
  sampleVolume,
  SHELL,
  SURGE,
  PLANE,
  createRippleField,
  crowdScale,
  travelTime,
  lifetimeOf,
};
