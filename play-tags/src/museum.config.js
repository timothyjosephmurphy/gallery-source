// Per-museum config for gallery-core (#24). #251 tag gallery: rooms by tag in a Roman garden. PREVIEW ONLY (not linked, noindex).
import { bilbaoMaterials as materials } from './bilbao.js';
export const MUSEUM = { id: 'tags', eggsAfterFirstFrame: true /* #272 */, tour: true /* #267 guided tour (src/tour.js) */, plainCourts: true /* #284 */, salon: true /* #284 salon stacks */, artScale: 1.5 /* #292 TJ-approved: preview shows art at 1.5x (live galleries 1.0) */, gates: false /* museum gates are built on the pavilion core wall (src/tags.js) */ };
export const LOOK = { materials, exposure: 1.05, envColor: 0xd8c4a4, envIntensity: 0.9, fog: [0xe6e0d2, 0.006, 0.006],
  envGlows: [[0xfff2dc, 3, 0, 5, 0, 4], [0xffe8c8, 2, -14, 4, 8, 2], [0xffe8c8, 2, 14, 4, -8, 2]] };
