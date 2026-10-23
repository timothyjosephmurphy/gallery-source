// dumps the door-ray angles of the current layout for the #295 sunburst generator
import fs from 'node:fs'; import { makeWorld } from '../src/tags-world.js';
const C = JSON.parse(fs.readFileSync('src/catalog.json')); const W = makeWorld(C.layout.tags, C.paintings);
fs.writeFileSync('tools/rays295.json', JSON.stringify(W.rays.map(r => Math.atan2(r.z1, r.x1)))); console.log(W.rays.length, 'rays');
