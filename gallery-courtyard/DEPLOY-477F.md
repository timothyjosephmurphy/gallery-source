# #477F fence panel merge DEPLOYED Mon Oct 26 2026 ~7:50 PM PT
Deployment d01fc449-84d8-4ecc-ab7e-bc4d531cfaaa on preview-251 (replaces d1e5978b). Entry index-Dligs-EG.js.
- Found by DRAWCALL-LOD-SCOUT.md item 2: horizon352 buildFence made one plane per fence segment, each with its own cloned MeshStandardMaterial and textures (repeat L/TILE). About 97 far draws at dense views.
- Change: each panel's L/TILE repeat is baked into the UVs (same as the AO strip), the world transform is baked into the geometry, and all panels are merged into ONE mesh 'fence352-panels' with ONE shared material (same params, shared maps at repeat 1). Look unchanged. Posts (InstancedMesh) and AO strip untouched. Colliders come from W.fences (tags-world.js), not meshes, so walk limits are unchanged (colliders 99).
- Shadows: the 3 PointLights keep shadow.autoUpdate=false. The fence is still built synchronously before the first shadow render, castShadow=!low and alphaTest 0.5 as before (the depth pass uses the shared material's alphaTest). _shadowscout lights au:false, unchanged.
- Fail soft: if the merge throws or returns null, it logs console.warn('[477F fence merge]'), sets window.__f477.err and builds the old per-segment planes. On success window.__f477 = {draws:1, segs}.
- Measured locally, same view (v12.9): 707 -> 665 calls with shadow pass, 759 -> 728 without. View v-6.3: 323 -> 297. Fence no longer appears in the frustum breakdown.
- Checks: tagsaudit local and LIVE, desktop PASS and phone PASS. builderErrs, softWarnings and pageErrors all [] (/tmp/au/t477f-*.log).
- Rollback: /tmp/horizon352.js.pre477f, /tmp/execute.pre477f.js (re-run it to restore d1e5978b).
- Next (scout item 3, MED): roomWall/cornice/jamb merge per material, after naming the 228 unnamed meshes. Touches colliders, the arch checks and the 352 AO path.
