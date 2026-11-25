// 3D vector helpers. Pure JS, no DOM. Internal prototype.

export function vec3(x = 0, y = 0, z = 0) {
  return { x: +x || 0, y: +y || 0, z: +z || 0 };
}

export function set(out, x, y, z) {
  out.x = +x || 0;
  out.y = +y || 0;
  out.z = +z || 0;
  return out;
}

export function copy(out, a) {
  out.x = a.x;
  out.y = a.y;
  out.z = a.z;
  return out;
}

export function add(out, a, b) {
  out.x = a.x + b.x;
  out.y = a.y + b.y;
  out.z = a.z + b.z;
  return out;
}

export function sub(out, a, b) {
  out.x = a.x - b.x;
  out.y = a.y - b.y;
  out.z = a.z - b.z;
  return out;
}

export function scale(out, a, s) {
  out.x = a.x * s;
  out.y = a.y * s;
  out.z = a.z * s;
  return out;
}

export function length(a) {
  return Math.hypot(a.x, a.y, a.z);
}

export function lengthSq(a) {
  return a.x * a.x + a.y * a.y + a.z * a.z;
}

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function distSq(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

/** 2D distance in the xy plane — equals dist() when z = 0 for both points. */
export function distXY(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function normalize(out, a) {
  const L = length(a);
  if (!(L > 0)) {
    out.x = 0;
    out.y = 0;
    out.z = 0;
    return out;
  }
  out.x = a.x / L;
  out.y = a.y / L;
  out.z = a.z / L;
  return out;
}

export function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function lerp(out, a, b, t) {
  out.x = a.x + (b.x - a.x) * t;
  out.y = a.y + (b.y - a.y) * t;
  out.z = a.z + (b.z - a.z) * t;
  return out;
}

export function clamp(v, lo, hi) {
  if (!(v > lo)) return lo;
  if (v > hi) return hi;
  return v;
}

/**
 * Project a 3D point onto the live mural / wall (the z = 0 plane).
 * depth is the signed z, so later live code can scale glow / parallax by it.
 */
export function projectToWall(p) {
  return { x: p.x, y: p.y, depth: p.z };
}

/**
 * Project a 3D point onto the dance-floor plane (y = 0).
 * height is the signed y, used by floor ripples and vertical surges.
 */
export function projectToFloor(p) {
  return { x: p.x, z: p.z, height: p.y };
}
