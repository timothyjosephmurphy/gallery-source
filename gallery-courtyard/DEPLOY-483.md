# #483 doorGlow / doorLight / walkRay share-material merge DEPLOYED Mon Oct 26 2026 ~9:15 PM PT
Deployment 45677f76-07c7-4d05-9e60-f69123a52580 on preview-251 (replaces 446da9e6). Entry index-D3r46bdU.js (alias verified; gen.py + splice.py both run).
- Census: doorGlow 14 (MeshBasic, shared glow map, additive, opacity .55, depthWrite false), doorLight 14 (MeshBasic color (2.2,1.8,1.2), toneMapped false), walkRay 12 (Standard clones, per-mesh map clone with repeat (1,Lw/2)), rayGlow 12 (ShaderMaterial, per-ray uniform k + per-ray visibility toggled by __rayGlow) .
- No name lookups for picking/collision (rg). Only mutators: courtyardstyle tints walkRay color (same value for all), overlays303 patches walkRay as 'flagstone' (world-space) -> shared mat safe. No night/#358 per-mesh writes to these.
- Change (play-tags/src/tags.js, after #482 block): per-name material key check (type/color/opacity/blend/map source/...), abort if any differ; world-bake + mergeGeometries -> 1 mesh per name (userData.merge483). walkRay: repeat/offset baked into UVs, merged mat = clone with map repeat (1,1) (wrapT Repeat kept). Fail soft: console.warn('[483 merge <name>]'), __m483.<name>Err, originals stay.
- rayGlow NOT merged: per-ray uniforms/visibility (highlighting one ray at a time) -> merging would change behavior.
- Result: __m483 = {doorGlow 14->1, doorLight 14->1, walkRay 12->1} => -37 draws (LIVE probe tests/_p483.mjs).
- tagsaudit local + LIVE desktop/phone PASS; builderErrs/softWarnings/pageErrors []; colliders 99. Logs /tmp/au/l483-*.log, /tmp/au/t483-*.log.
- Rollback: /tmp/tags.js.pre483, /tmp/execute.js.pre483 (re-run via Cloudflare execute -> restores 446da9e6 bundle).
- Next: plaque atlas scout (PLAQUE-ATLAS-SCOUT.md), rayGlow could become one mesh w/ per-vertex ray id + uniform array (behavior-preserving, MED), doorLightPool/domeLight in courtyard296 (pools[k] shared -> merge per k).
