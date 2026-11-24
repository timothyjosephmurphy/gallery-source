# #48x hang478Rim frame backings instanced DEPLOYED Mon Oct 26 2026 ~8:25 PM PT
Deployment c1d57b53-a432-436e-878c-ebfe37cd20e0 on preview-251 (replaces 9ab8feeb). Entry index-BBMilEIx.js.
- play-tags/src/tags.js only, right after installFrames (#301). gallery-core / frames.js NOT edited.
- Check: core uses ONE shared frameMat + unit geo for every p.frame (310). frames.js does not swap materials but re-sets p.frame.visible=true in place(); core scan flash (main.js:1164) swaps p.frame.material for 1.6 s.
- So: 1 InstancedMesh hang48xRim (310), raycast off, frustumCulled off. Sync runs in TAGS.update AFTER frames.update: rim on shared mat -> re-hidden, instance = matrixWorld (zero if any ancestor hidden/detached); rim on another material (scan flash) -> original shown, instance zeroed.
- Fail soft: console.warn('[48x inst]'), window.__m48x.err, instance hidden, originals visible. OK: window.__m48x = {draws:1, pieces:310}.
- Draw calls (_drawscout swiftshader 1280x800). Local: spawn 332 -> 309, dense 570 -> 531, median 216 -> 197. LIVE: spawn 364 -> 313, dense 578 -> 539, median 219 -> 200.
- tagsaudit local + LIVE desktop/phone PASS; builderErrs/softWarnings/pageErrors []. Logs /tmp/au/t48x-*.log. Probe tests/_v48x.mjs.
- Rollback: /tmp/tags.js.pre48x, /tmp/execute.pre48x.js (re-run to restore 9ab8feeb).
