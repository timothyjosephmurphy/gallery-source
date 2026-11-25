// CPU height-field wave on a floor (xz) or wall (xy) plane.
// Same damped 2D wave equation the live GPU ripple uses:
//   next = (2 * h - prev + c2 * laplacian) * damp
// then a tanh soft clamp. Pure JS, no DOM / WebGL.

import { clamp } from './vec3.js';

export const RIPPLE_W = 96;
export const RIPPLE_H = 64;
export const RIPPLE_DAMP = 0.96;
export const RIPPLE_C2 = 0.20;
export const RIPPLE_SOFT_LIMIT = 1.15;
export const RIPPLE_CROWD_REF = 3;

export function crowdScale(n) {
  const k = Math.max(1, +n || 0);
  if (k <= RIPPLE_CROWD_REF) return 1;
  return Math.sqrt(RIPPLE_CROWD_REF / k);
}

export function softLimit(v, limit = RIPPLE_SOFT_LIMIT) {
  const x = +v;
  if (!Number.isFinite(x) || x === 0) return 0;
  return Math.tanh(x / limit) * limit;
}

/**
 * @param {object} [opts]
 * @param {number} [opts.width]
 * @param {number} [opts.height]
 * @param {'xz'|'xy'} [opts.plane] xz = dance floor (y is height), xy = live wall (z is depth)
 * @param {object} [opts.bounds] { minX, maxX, minU, maxU } where U is z (xz) or y (xy)
 */
export function createRippleField(opts = {}) {
  const width = Math.max(8, opts.width || RIPPLE_W);
  const height = Math.max(8, opts.height || RIPPLE_H);
  const plane = opts.plane === 'xy' ? 'xy' : 'xz';
  const damp = opts.damp != null ? +opts.damp : RIPPLE_DAMP;
  const c2 = opts.c2 != null ? +opts.c2 : RIPPLE_C2;
  const bounds = Object.assign(
    { minX: 0, maxX: 400, minU: 0, maxU: 300 },
    opts.bounds || {}
  );

  const n = width * height;
  let prev = new Float32Array(n);
  let curr = new Float32Array(n);
  let next = new Float32Array(n);

  function idx(x, y) {
    return y * width + x;
  }

  function worldToCell(p) {
    const u = plane === 'xy' ? p.y : p.z;
    const nx = (p.x - bounds.minX) / Math.max(1e-6, bounds.maxX - bounds.minX);
    const nu = (u - bounds.minU) / Math.max(1e-6, bounds.maxU - bounds.minU);
    const cx = clamp(Math.round(nx * (width - 1)), 1, width - 2);
    const cy = clamp(Math.round((1 - nu) * (height - 1)), 1, height - 2);
    return { cx, cy };
  }

  function impulseAt(p, amount) {
    const { cx, cy } = worldToCell(p);
    const amp = Math.max(0, +amount || 0);
    const rad = 2;
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        const px = cx + dx;
        const py = cy + dy;
        if (px < 0 || py < 0 || px >= width || py >= height) continue;
        const wgt = Math.exp(-(dx * dx + dy * dy) / 2.2) * amp;
        curr[idx(px, py)] += wgt;
      }
    }
  }

  function step() {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = idx(x, y);
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
          next[i] = 0;
          continue;
        }
        const lap =
          curr[i - 1] + curr[i + 1] + curr[i - width] + curr[i + width] - 4 * curr[i];
        next[i] = softLimit((2 * curr[i] - prev[i] + c2 * lap) * damp);
      }
    }
    const tmp = prev;
    prev = curr;
    curr = next;
    next = tmp;
  }

  function sample(p) {
    const u = plane === 'xy' ? p.y : p.z;
    const nx = (p.x - bounds.minX) / Math.max(1e-6, bounds.maxX - bounds.minX);
    const nu = (u - bounds.minU) / Math.max(1e-6, bounds.maxU - bounds.minU);
    const fx = clamp(nx * (width - 1), 0, width - 1);
    const fy = clamp((1 - nu) * (height - 1), 0, height - 1);
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const x1 = Math.min(width - 1, x0 + 1);
    const y1 = Math.min(height - 1, y0 + 1);
    const tx = fx - x0;
    const ty = fy - y0;
    const a = curr[idx(x0, y0)];
    const b = curr[idx(x1, y0)];
    const c = curr[idx(x0, y1)];
    const d = curr[idx(x1, y1)];
    return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
  }

  function clear() {
    prev.fill(0);
    curr.fill(0);
    next.fill(0);
  }

  return {
    width,
    height,
    plane,
    get heights() {
      return curr;
    },
    impulseAt,
    step,
    sample,
    clear,
    crowdScale,
  };
}
