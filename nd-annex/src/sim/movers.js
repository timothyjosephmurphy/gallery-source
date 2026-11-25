// Moving-head target selection + pan/tilt aiming. Inputs are ONLY the host's
// triangulated tracks: Map id -> { P:[x,y,z], vel:[vx,vz], dZ, t }. No ground truth.
export const FIXTURES = [[-3, 3.85, -2.5], [3, 3.85, -2.5], [-3, 3.85, 2.5], [3, 3.85, 2.5]];
export const HOLD_S = 0.6, FADE_S = 0.6; // hold last (X^,Y^,Z^) then fade when stereo lock is lost

export function moverScore(h) { return Math.hypot(h.vel[0], h.vel[1]) + 4 * Math.max(0, h.dZ); }

// state: { assign: [id|null x4], score: Map id->smoothed score, lastBeat }
export function newMoverState() { return { assign: [null, null, null, null], score: new Map(), lastBeat: -1, chase: 0 }; }

export function selectTargets(state, host, t, mode, beatIndex, hyst = 1.35) {
  const live = [...host.entries()].filter(([, h]) => t - h.t < HOLD_S);
  for (const [id, h] of live) state.score.set(id, (state.score.get(id) ?? moverScore(h)) * 0.9 + moverScore(h) * 0.1);
  for (const id of [...state.score.keys()]) if (!host.has(id) || t - host.get(id).t > HOLD_S + FADE_S) state.score.delete(id);
  const ids = live.map(([id]) => id).sort((a, b) => a - b);
  if (mode === 'off') { state.assign = [null, null, null, null]; return state.assign; }
  if (mode === 'top') {
    const ranked = ids.slice().sort((a, b) => state.score.get(b) - state.score.get(a));
    const top = new Set(ranked.slice(0, 4));
    // keep current targets unless a challenger beats them by the hysteresis factor
    const a = state.assign.map(id => (id !== null && host.has(id) && t - host.get(id).t < HOLD_S + FADE_S ? id : null));
    for (let i = 0; i < 4; i++) {
      const cur = a[i]; if (cur !== null && (top.has(cur) || t - host.get(cur).t >= HOLD_S)) continue; // held through brief dropouts
      const challenger = ranked.find(id => !a.includes(id));
      if (challenger === undefined) continue;
      if (cur === null || state.score.get(challenger) > hyst * (state.score.get(cur) ?? 0)) a[i] = challenger;
    }
    state.assign = a; return a;
  }
  if (mode === 'chase') {
    if (beatIndex !== state.lastBeat) { state.lastBeat = beatIndex; state.chase++; }
    state.assign = [0, 1, 2, 3].map(i => (ids.length ? ids[(state.chase + i * Math.max(1, Math.floor(ids.length / 4))) % ids.length] : null));
    return state.assign;
  }
  // 'all': first four on the real fixtures, the rest go to overhead pin-spots
  state.assign = [0, 1, 2, 3].map(i => ids[i] ?? null); return state.assign;
}

// Beam intensity for a target given its last host update (hold then fade).
export function holdFade(h, t) { if (!h) return 0; const age = t - h.t; return age < HOLD_S ? 1 : Math.max(0, 1 - (age - HOLD_S) / FADE_S); }

// Pan (about vertical) and tilt (down from horizontal) to hit target from fixture.
export function panTilt(F, P) {
  const dx = P[0] - F[0], dy = P[1] - F[1], dz = P[2] - F[2];
  return { pan: Math.atan2(dx, dz), tilt: Math.atan2(-dy, Math.hypot(dx, dz)), dist: Math.hypot(dx, dy, dz) };
}
export function aimDir({ pan, tilt }) { return [Math.sin(pan) * Math.cos(tilt), -Math.sin(tilt), Math.cos(pan) * Math.cos(tilt)]; }
// Slew-rate limited pan/tilt (real moving heads ~ 3-4 rad/s).
export function slew(cur, goal, dt, rate = 3.5) {
  const step = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + Math.max(-rate * dt, Math.min(rate * dt, d)); };
  return { pan: step(cur.pan, goal.pan), tilt: step(cur.tilt, goal.tilt) };
}
