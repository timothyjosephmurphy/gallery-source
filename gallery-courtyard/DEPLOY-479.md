# #479 hang478Part light pools + lamp bars instanced DEPLOYED Mon Oct 26 2026 ~8:05 PM PT
Deployment 9ab8feeb-a219-4a6b-be8a-5d2f747228d3 on preview-251 (replaces 74d6cb37). Entry index-3lRe4SPL.js.
- play-tags/src/tags.js finish() only, right after name478. gallery-core NOT edited (museums unaffected).
- Each painting group had a light pool (unit plane, shared poolMat, additive) and a lamp bar (unit plane, shared lampMat) = 620 hang478Part meshes / 310 paintings. Grouped by geometry+material uuid (sets >= 8) -> 2 InstancedMesh: hang479Pool (310), hang479Bar (310), frustumCulled off, raycast disabled.
- Originals stay in their groups, set visible=false (raycast/lift/transform paths unchanged; three raycast ignores .visible). Each frame (TAGS.update) instance i copies source matrixWorld, or zero scale if the source's original visibility was off (#284 salon stack bars) or any ancestor is hidden (core distance cull of p.group) or detached.
- Fail soft: console.warn('[479 inst]'), window.__m479.err, instances hidden, originals restored. OK state: window.__m479 = {draws:2, pieces:620}.
- Draw calls (_drawscout swiftshader 1280x800). Local: spawn 460 -> 332, dense 646 -> 570, median 247 -> 216. LIVE: spawn 436 -> 364, dense 654 -> 578, median 249 -> 219.
- tagsaudit local desktop+phone PASS, LIVE desktop+phone PASS; builderErrs/softWarnings/pageErrors []. Logs /tmp/au/t479-*.log. Probe tests/_v479.mjs.
- Known nuance: pools now sort as one transparent object (additive, depthWrite off) -> order vs other transparent wall decals may differ; not eyeballed (no retune).
- Rollback: /tmp/tags.js.pre479, /tmp/execute.pre479.js (re-run to restore 74d6cb37).
