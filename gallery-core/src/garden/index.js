// #251 garden: public API. buildDomes(tags) and buildGarden(tags) each return { group, colliders } (+ extras).
// colliders are footprint circles {x,z,r,kind,id,yMin,yMax} already registered via tags.addCollider, for the doorway check.
export { buildDomes } from './domes.js';
export { buildGarden, createFountainSound } from './garden.js';
export { tagsFromLayout, makeKeepClear } from './adapter.js';
