// iPhone rig in Room 1 (capture room) local coordinates: floor centred at the origin, y up, x in [-5,5].
// TJ (t2226u): both phones point into the room at an EQUAL inward angle; each phone's outside frustum
// edge touches its outside wall (x = -5 for A, x = +5 for B) and their inside edges cross each other.
import { v3 } from './camera.js';
export const HEIGHT_10FT = 10 * 0.3048;           // 3.048 m
export const VFOV_DEG = 46, ASPECT = 16 / 9;       // iPhone 1x wide, 16:9 landscape (hfov ~ 74.0 deg)
export const ROOM_HALF_X = 5;
export const LENS = { k1: -0.06, k2: 0.012 };
export const RIG_DEFAULT = { height: HEIGHT_10FT, x0: 3.2, z0: -4.6, zTouch: 3.5, aimY: 0.9 };
const D2R = Math.PI / 180;
export const TAN_V = Math.tan(VFOV_DEG * D2R / 2), TAN_H = ASPECT * TAN_V;
export const HFOV_DEG = 2 * Math.atan(TAN_H) / D2R;

// camera basis exactly as makeCamera builds it (right = cross(fwd, up_world), up = cross(right, fwd))
export function basis(yaw, pitch) {
  const fwd = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
  const right = v3.norm(v3.cross(fwd, [0, 1, 0])), up = v3.cross(right, fwd);
  return { fwd, right, up };
}
// unnormalised ray through normalised image coords (xn, yn); fwd component is exactly 1 => depth = s
export function rayDir(B, xn, yn) { return [B.fwd[0] + xn * B.right[0] + yn * B.up[0], B.fwd[1] + xn * B.right[1] + yn * B.up[1], B.fwd[2] + xn * B.right[2] + yn * B.up[2]]; }

// Solve camera A at (-x0, h, z0) (B is its mirror). Unknown: the equal inward yaw psi. Pitch puts the
// optical axis at height aimY where it crosses the centreline x = 0. The outside frustum face
// (xn = +TAN_H, every yn) is traced inside the room's height band (0 <= y <= 4) up to z = zTouch; psi is
// solved by bisection so that its most outward point lands exactly on the outside wall x = -5.
export function solveSymmetricRig(o = {}) {
  const { height, x0, z0, zTouch, aimY } = { ...RIG_DEFAULT, ...o };
  const pitchFor = psi => Math.atan2(aimY - height, x0 / Math.sin(psi));
  const C = [-x0, height, z0], N = 64;
  const outer = psi => {
    const B = basis(psi, pitchFor(psi)); let best = null;
    for (let i = 0; i <= N; i++) {
      const yn = -TAN_V + 2 * TAN_V * i / N, D = rayDir(B, TAN_H, yn);
      let sm = Infinity; if (D[2] > 1e-9) sm = (zTouch - C[2]) / D[2]; if (D[1] < -1e-9) sm = Math.min(sm, -C[1] / D[1]); else if (D[1] > 1e-9) sm = Math.min(sm, (4 - C[1]) / D[1]);
      if (!isFinite(sm)) continue; const P = v3.add(C, v3.mul(D, sm)); if (!best || P[0] < best.P[0]) best = { P, s: sm, yn, D };
    }
    return { B, best };
  };
  let lo = 0.5 * D2R, hi = Math.atan(TAN_H) + 20 * D2R;
  for (let i = 0; i < 90; i++) { const m = (lo + hi) / 2; if (outer(m).best.P[0] < -ROOM_HALF_X) lo = m; else hi = m; }
  const psi = (lo + hi) / 2, pitch = pitchFor(psi), { B, best } = outer(psi), far = best.s;
  const touchA = best.P;
  const Din = rayDir(B, -TAN_H, 0), sIn = x0 / Din[0], innerX = v3.add(C, v3.mul(Din, sIn));
  const mk = sgn => { const yaw = sgn * psi, pos = [-sgn * x0, height, z0], b = basis(yaw, pitch); return { pos, target: v3.add(pos, b.fwd), yaw, pitch, far, vfov: VFOV_DEG }; };
  return { A: mk(1), B: mk(-1), psi, pitch, far, touchA, touchYn: best.yn, touchB: [-touchA[0], touchA[1], touchA[2]], inner: [0, innerX[1], innerX[2]], innerS: sIn, params: { height, x0, z0, zTouch, aimY } };
}
// segment of a ray from the camera to where it first leaves Room 1's box (|x|<=5, 0<=y<=4, |z|<=5) or hits far
export function clipToRoom(C, D, sMax, h = 4) {
  let s = sMax;
  const lim = (c, d, a, b) => { if (d > 1e-12) s = Math.min(s, (b - c) / d); else if (d < -1e-12) s = Math.min(s, (a - c) / d); };
  lim(C[0], D[0], -ROOM_HALF_X, ROOM_HALF_X); lim(C[1], D[1], 0, h); lim(C[2], D[2], -5, 5);
  return Math.max(0, s);
}
export function defaultCams() { const r = solveSymmetricRig(); return { A: r.A, B: r.B }; }
export function defaultCamsWithLens() { const c = defaultCams(); return { A: { ...c.A, ...LENS }, B: { ...c.B, ...LENS } }; }
// legacy helpers kept for tests / readouts
export function separationDeg(pa, pb, centre = [0, 0]) { const a = Math.atan2(pa[0] - centre[0], pa[2] - centre[1]), b = Math.atan2(pb[0] - centre[0], pb[2] - centre[1]); let d = Math.abs(a - b) * 180 / Math.PI; return d > 180 ? 360 - d : d; }
// Is floor point (x,z) inside both phones' horizontal stereo wedge (with margin, radians)?
export function inStereoWedge(rig, x, z, margin = 4 * D2R) {
  const half = Math.atan(TAN_H) - margin;
  for (const c of [rig.A, rig.B]) { const az = Math.atan2(x - c.pos[0], z - c.pos[2]); let d = az - c.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) > half) return false; }
  return true;
}
