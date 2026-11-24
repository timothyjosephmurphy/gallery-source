# #481 door-arch static merge DEPLOYED Mon Oct 26 2026 ~9:05 PM PT
Deployment 1da5404f-bacc-4d33-8756-f5588394dfe5 on preview-251 (replaces 95f22ebf). Entry index-B_O1EUeI.js (alias verified).
(An earlier 6c5a93ab deploy shipped the OLD bundle: gen.py only writes deploy/_worker.js; run `python3 deploy/splice.py` before execute.js.)
- Census (tests/_census481.mjs, LIVE 95f22ebf), shared-mat static sets >=3: overdoor 28 (1 mat), lintel 28 (1 mat), doorFlare 23 (1 mat). Rest: hang478Part/Art per-texture plaques/art (atlas only), anon478Plane 58 unique mats, doorGlow/doorLight/walkRay/rayGlow per-mesh mats (12-14 each, next candidate: share mats first), roomFloor 13 (1 mat, next candidate).
- Change (play-tags/src/tags.js only, before "pavilion core"): per name+material, world-bake (pos/normal/uv) + mergeGeometries -> one mesh each under tagsArchitecture, receive/castShadow kept, originals removed. overlays303 is world-space so shading identical. Fail soft: console.warn('[481 merge <name>]'), window.__m481.<name>Err, originals stay. OK: __m481 = {overdoor:{28,1}, lintel:{28,1}, doorFlare:{23,1}} (79 meshes -> 3 draws).
- Draw calls (_drawscout swiftshader 1280x800): 95f22ebf dense 472 / median 188 / spawn 272 / meshes 2029 -> 1da5404f dense 367 & 430 (2 runs; local 422) / median 190 / spawn 255 & 227 / meshes 1953 & 1880.
- tagsaudit local + LIVE desktop/phone PASS; builderErrs/softWarnings/pageErrors []. Logs /tmp/au/t481*-*.log.
- Rollback: /tmp/tags.js.pre-481, /tmp/execute.pre481.js (re-run via Cloudflare execute to restore 95f22ebf).
