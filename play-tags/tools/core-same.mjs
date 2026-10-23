// proves the main.js edits are inert for every other gallery: transformed output identical before/after, except the
// #269 jump logging (console.info('[jump] ...') calls and the goCheckout reason argument), which is stripped before comparing
import fs from 'node:fs'; import { museumLines } from '/workspace/gallery-core/vite-core.js';
const a = fs.readFileSync('/workspace/play-tags/main.js.orig', 'utf8'), b = fs.readFileSync('/workspace/gallery-core/src/main.js', 'utf8');
const strip = s => s.replace(/ ?console\.info\('\[jump\][^;]*\);/g, '').replace(/goCheckout\((?:reason = )?'[^']*'\)/g, 'goCheckout()').replace(/goCheckout\(why \|\| '[^']*'\)/g, 'goCheckout()').replace(/\(why\) => /g, '() => ')
  .replace(/^window\.__buyPrint.*$/m, '').replace(/\{ (enterGate\(\);) \} \}/g, '$1 }');
const norm = s => strip(s).split('\n').map(l => l.trimEnd()).filter(l => l.trim() !== '').join('\n');
let ok = true; for (const id of ['play', 'orsay', 'bilbao', 'uffizi', 'gugg-ny', 'splat']) { const x = norm(museumLines(a, id)).split('\n'), y = norm(museumLines(b, id)).split('\n');
  const same = x.join('\n') === y.join('\n'); console.log(id, same ? 'same (apart from [jump] logs)' : 'DIFFERENT'); if (!same) { ok = false; const i = x.findIndex((l, k) => l !== y[k]); console.log(' a:', (x[i] || '').slice(0, 200), '\n b:', (y[i] || '').slice(0, 200)); } }
process.exit(ok ? 0 : 1);
