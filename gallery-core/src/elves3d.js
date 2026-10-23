// harness shim (integration option B in CHANGES-2026-10-18.md): the gallery keeps importing './elves3d.js'; this file forwards to the
// shared HD elves and picks the tier (phones / coarse pointers -> 'low').
import { setElfQuality } from './museum-eggs/elves-hd.js';
setElfQuality(typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches ? 'low' : 'hd');
export * from './museum-eggs/elves-hd.js';
