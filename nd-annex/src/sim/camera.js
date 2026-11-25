// Pure pinhole-camera + stereo math (no three.js) so it runs in Node tests.
// World: x right, y up (height Z in the issue), z toward viewer. Floor is y=0.
export const v3 = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: a => Math.hypot(a[0], a[1], a[2]),
  norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};

// iPhone 0.5x ultra-wide (13 mm equiv) in 16:9 landscape, 1920x1080, vfov ~ 70 deg.
export function makeCamera({ pos, target, vfov = 46 /* = rig VFOV_DEG, iPhone 1x wide */, W = 1920, H = 1080, k1 = 0, k2 = 0 }) {
  const f = (H / 2) / Math.tan((vfov * Math.PI / 180) / 2);
  const fwd = v3.norm(v3.sub(target, pos));
  const right = v3.norm(v3.cross(fwd, [0, 1, 0]));
  const up = v3.cross(right, fwd);
  return { C: pos.slice(), fwd, right, up, f, W, H, cx: W / 2, cy: H / 2, vfov, k1, k2 };
}
export function project(cam, P) {
  const d = v3.sub(P, cam.C);
  const zc = v3.dot(d, cam.fwd);
  if (zc <= 0.05) return null;
  const u = cam.cx + cam.f * v3.dot(d, cam.right) / zc;
  const v = cam.cy - cam.f * v3.dot(d, cam.up) / zc;
  return { u, v, depth: zc, inView: u >= 0 && u < cam.W && v >= 0 && v < cam.H };
}
export function backProject(cam, u, v) {
  const x = (u - cam.cx) / cam.f, y = -(v - cam.cy) / cam.f;
  return v3.norm(v3.add(v3.add(cam.fwd, v3.mul(cam.right, x)), v3.mul(cam.up, y)));
}
// Least-squares closest approach of r_A(s)=C_A+s dA and r_B(t)=C_B+t dB.
// Minimise |C_A + s dA - C_B - t dB|^2 -> 2x2 normal equations.
export function triangulate(CA, dA, CB, dB) {
  const w = v3.sub(CA, CB);
  const a = v3.dot(dA, dA), b = v3.dot(dA, dB), c = v3.dot(dB, dB);
  const d = v3.dot(dA, w), e = v3.dot(dB, w);
  const den = a * c - b * b;
  if (Math.abs(den) < 1e-9) return null;
  const s = (b * e - c * d) / den, t = (a * e - b * d) / den;
  const PA = v3.add(CA, v3.mul(dA, s)), PB = v3.add(CB, v3.mul(dB, t));
  return { P: v3.mul(v3.add(PA, PB), 0.5), miss: v3.len(v3.sub(PA, PB)), s, t, PA, PB };
}
// Ray vs sphere occlusion test between camera and point (exclusive of endpoints).
export function segHitsSphere(C, P, S, r) {
  const d = v3.sub(P, C), L = v3.len(d), u = v3.mul(d, 1 / L);
  const m = v3.sub(S, C), tc = v3.dot(m, u);
  if (tc < 0 || tc > L - 0.04) return false;
  const d2 = v3.dot(m, m) - tc * tc;
  return d2 < r * r;
}

// ---- Brown-Conrady radial lens model (normalised image coords x=(u-cx)/f, y=(v-cy)/f) ----
// distorted = undistorted * (1 + k1 r^2 + k2 r^4). Barrel distortion: k1 < 0.
export function distortPixel(cam, u, v) {
  const x = (u - cam.cx) / cam.f, y = (v - cam.cy) / cam.f, r2 = x * x + y * y, s = 1 + cam.k1 * r2 + cam.k2 * r2 * r2;
  return [cam.cx + cam.f * x * s, cam.cy + cam.f * y * s];
}
// Receiver side: invert the radial model with Newton-Raphson on the radius (exact to ~1e-9 px).
export function undistortPixel(cam, ud, vd) {
  if (!cam.k1 && !cam.k2) return [ud, vd];
  const xd = (ud - cam.cx) / cam.f, yd = (vd - cam.cy) / cam.f, rd = Math.hypot(xd, yd);
  if (rd < 1e-12) return [ud, vd];
  let r = rd;
  for (let i = 0; i < 12; i++) { const r2 = r * r, g = r * (1 + cam.k1 * r2 + cam.k2 * r2 * r2) - rd, dg = 1 + 3 * cam.k1 * r2 + 5 * cam.k2 * r2 * r2; const dr = g / dg; r -= dr; if (Math.abs(dr) < 1e-14) break; }
  const k = r / rd; return [cam.cx + cam.f * xd * k, cam.cy + cam.f * yd * k];
}
// Project a world point to DISTORTED sensor pixels (what the phone actually sees).
export function projectDistorted(cam, P) { const p = project(cam, P); if (!p) return null; const [u, v] = distortPixel(cam, p.u, p.v); return { u, v, depth: p.depth, inView: u >= 0 && u < cam.W && v >= 0 && v < cam.H }; }
// Distance from point S to segment AB
export function segSegDist(P0, P1, Q0, Q1) {
  // closest distance between segments P0P1 and Q0Q1 (3D)
  const d1 = v3.sub(P1, P0), d2 = v3.sub(Q1, Q0), r = v3.sub(P0, Q0), a = v3.dot(d1, d1), e = v3.dot(d2, d2), f = v3.dot(d2, r);
  let s, t; const c = v3.dot(d1, r), b = v3.dot(d1, d2), den = a * e - b * b;
  s = den > 1e-12 ? Math.max(0, Math.min(1, (b * f - c * e) / den)) : 0;
  t = (b * s + f) / e; if (t < 0) { t = 0; s = Math.max(0, Math.min(1, -c / a)); } else if (t > 1) { t = 1; s = Math.max(0, Math.min(1, (b - c) / a)); }
  return v3.len(v3.sub(v3.add(P0, v3.mul(d1, s)), v3.add(Q0, v3.mul(d2, t))));
}
// Line of sight camera->pin blocked by a body capsule (segment A-B, radius r)?
export function segHitsCapsule(C, P, A, B, r) {
  const d = v3.sub(P, C), L = v3.len(d), Pe = v3.add(C, v3.mul(d, (L - 0.05) / L)); // stop just short of the pin
  return segSegDist(C, Pe, A, B) < r;
}
