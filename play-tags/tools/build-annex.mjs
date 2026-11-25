// Bundle the in-gallery Kinoteka Neural Dance annex (nd-annex/src/inSceneAnnex.js)
// as a sidecar IIFE, the same way court876 / kino874 / helix876 are loaded from index.html.
import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = path.join(root, '../nd-annex/src/inSceneAnnex.js');
const outfile = path.join(root, 'public/assets/annex871-r899.js');
await esbuild.build({ entryPoints: [entry], bundle: true, format: 'iife', minify: true, legalComments: 'none', outfile });
console.log('annex sidecar', path.relative(root, outfile));
