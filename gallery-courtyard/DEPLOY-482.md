# #482 roomFloor static merge DEPLOYED Mon Oct 26 2026 ~9:20 PM PT
Deployment 446da9e6-da6e-4df8-a36f-ffe610cab8f2 on preview-251 (replaces 1da5404f). Entry index-1FqBIFqh.js (alias verified; gen.py + splice.py both run).
- Safety: 'roomFloor' is never looked up by name (rg src); colliders come from W (tagsaudit colliders 99 before/after); walk/floor height from W.roomAt, not meshes.
- Change (play-tags/src/tags.js, before "pavilion core"): 13 roomFloor ShapeGeometry slabs (shared floorMat) world-baked + mergeGeometries -> 1 mesh named roomFloor (userData.merge482), receive/castShadow copied, originals removed+disposed. Fail soft: console.warn('[482 merge]'), __m482.err, originals stay. OK: __m482 = {pieces:13, draws:1, done:true} (LIVE probe tests/_p482.mjs).
- Draw calls (_drawscout swiftshader, LIVE): 1da5404f dense 367/430, median 190, spawn 255/227, meshes 1953/1880 -> 446da9e6 dense max 424, median 187, spawn 224, meshes 1868 (-12 meshes; dense number is noisy across runs).
- tagsaudit local + LIVE desktop/phone PASS; builderErrs/softWarnings/pageErrors []. Logs /tmp/au/t482L-*.log, /tmp/au/t482-*.log.
- Rollback: /tmp/tags.js.pre-482, /tmp/execute.pre482.js (re-run via Cloudflare execute -> restores 1da5404f bundle).
- Next: doorGlow/doorLight/rayGlow/walkRay share mats (12-14 per-mesh clones, walkRay has per-mesh map repeat -> needs uv bake), plaque atlas scout.
