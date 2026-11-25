// 3D neighbor graph and adaptive link radius.
// 2D live rule, with Euclidean distance in (x, y, z). When every dancer
// has z = 0 this is identical to the live 2D (x, y) rule.

import { dist, clamp } from './vec3.js';

export const LINK_R_MIN = 82;
export const LINK_R_MAX = 170;
export const LINK_R_SCALE = 1.3;
export const WANDER_R = 190;

export function nearestNeighbourDistances(points) {
  const out = [];
  const n = Array.isArray(points) ? points.length : 0;
  for (let i = 0; i < n; i++) {
    let best = Infinity;
    const a = points[i];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const d = dist(a, points[j]);
      if (d < best) best = d;
    }
    if (Number.isFinite(best)) out.push(best);
  }
  return out;
}

export function linkRadiusFor(points) {
  const nn = nearestNeighbourDistances(points).sort((a, b) => a - b);
  if (!nn.length) return LINK_R_MIN;
  const p75 = nn[Math.min(nn.length - 1, Math.floor(nn.length * 0.75))];
  const r = p75 * LINK_R_SCALE;
  if (!(r > LINK_R_MIN)) return LINK_R_MIN;
  return Math.min(LINK_R_MAX, Math.round(r * 10) / 10);
}

/**
 * Neighbors of dancer i within link radius, nearest first.
 * kMax caps the degree (optional; live drains all in-radius, then at most
 * two pulse trails). Returns indices, not including i.
 */
export function neighborsOf(points, i, radius, kMax = Infinity) {
  const a = points[i];
  const hits = [];
  const n = points.length;
  const r = +radius;
  for (let j = 0; j < n; j++) {
    if (j === i) continue;
    const d = dist(a, points[j]);
    if (d < r) hits.push({ j, d });
  }
  hits.sort((p, q) => p.d - q.d);
  const cap = Number.isFinite(kMax) ? kMax : hits.length;
  const out = [];
  for (let k = 0; k < hits.length && k < cap; k++) out.push(hits[k]);
  return out;
}

export function clampLinkRadius(v) {
  return clamp(+v || 0, 40, 240);
}
