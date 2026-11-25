// Analytic 3D energy field E(x, y, z, t).
// Superposition of spherical shells, vertical floor-to-ceiling surges,
// and directional planes. No dense voxel grid is required to evaluate
// the field; an optional low-res 32×16×32 volume can be sampled for
// volumetric rendering.

import { vec3, dist, dot, clamp } from './vec3.js';

export const SHELL = 0;
export const SURGE = 1;
export const PLANE = 2;

function envelope(s, width) {
  const w = width > 1e-6 ? width : 1;
  const u = s / w;
  if (u < -3 || u > 3) return 0;
  return Math.exp(-0.5 * u * u);
}

/**
 * Create a wave source.
 * kind: SHELL | SURGE | PLANE
 * origin: Vec3
 * amplitude, speed, width, decay (1/s)
 * normal: for PLANE (unit vector); for SURGE, motion is along +Y
 * born: sim time at spawn
 */
export function createWave({
  kind = SHELL,
  origin,
  amplitude = 1,
  speed = 80,
  width = 12,
  decay = 0.7,
  normal,
  born = 0,
  band = 0,
  life = 4,
} = {}) {
  const n = normal ? { ...normal } : { x: 0, y: 1, z: 0 };
  const L = Math.hypot(n.x, n.y, n.z) || 1;
  return {
    kind,
    origin: vec3(origin?.x, origin?.y, origin?.z),
    amplitude: +amplitude || 0,
    speed: Math.max(1, +speed || 80),
    width: Math.max(0.5, +width || 12),
    decay: Math.max(0, +decay || 0),
    normal: { x: n.x / L, y: n.y / L, z: n.z / L },
    born: +born || 0,
    band: band | 0,
    life: Math.max(0.2, +life || 4),
  };
}

/** Field contribution of one source at point p, time t. */
export function evalWave(wave, p, t) {
  const age = t - wave.born;
  if (age < 0 || age > wave.life) return 0;
  const fade = Math.exp(-wave.decay * age);
  const amp = wave.amplitude * fade;
  if (!(amp > 1e-8)) return 0;

  if (wave.kind === SHELL) {
    const r = dist(p, wave.origin);
    const front = wave.speed * age;
    // Geometric 1/r spreading, softened near the origin.
    const spread = 1 / (1 + r / 80);
    return amp * envelope(r - front, wave.width) * spread;
  }

  if (wave.kind === SURGE) {
    // Vertical floor-to-ceiling bass surge: a rising horizontal sheet
    // centered on origin.xz, with radial falloff in the floor plane.
    const dy = p.y - wave.origin.y;
    const front = wave.speed * age;
    const radial = Math.hypot(p.x - wave.origin.x, p.z - wave.origin.z);
    const radialFall = 1 / (1 + radial / 90);
    return amp * envelope(dy - front, wave.width) * radialFall;
  }

  // Directional plane wave: a slab traveling along `normal`.
  const rel = { x: p.x - wave.origin.x, y: p.y - wave.origin.y, z: p.z - wave.origin.z };
  const s = dot(rel, wave.normal);
  const front = wave.speed * age;
  return amp * envelope(s - front, wave.width);
}

export function evalWaves(waves, p, t) {
  let e = 0;
  for (let i = 0; i < waves.length; i++) e += evalWave(waves[i], p, t);
  return e;
}

export function pruneWaves(waves, t) {
  let w = 0;
  for (let i = 0; i < waves.length; i++) {
    if (t - waves[i].born <= waves[i].life) waves[w++] = waves[i];
  }
  waves.length = w;
  return waves;
}

/**
 * Sample the analytic field into a dense volume for volumetric rendering.
 * Default 32 × 16 × 32 as suggested in #823. Returns a Float32Array of size
 * nx*ny*nz, x-fastest, then y, then z.
 */
export function sampleVolume(waves, t, bounds, nx = 32, ny = 16, nz = 32) {
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
        out[i++] = evalWaves(waves, p, t);
      }
    }
  }
  return out;
}

export function volumeIndex(ix, iy, iz, nx, ny) {
  return ix + nx * (iy + ny * iz);
}

export { clamp };
