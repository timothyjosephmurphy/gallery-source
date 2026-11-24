# #488 glTF window-card merge DEPLOYED Mon Oct 26 2026 ~10:30 PM PT
Deployment 4ed8521f-ed33-46c7-929e-1ef0e3e99ff1 on preview-251 (replaces 958e63e2). Entry index-D2kR8CrF.js (alias verified; gen.py + splice.py both run).
- Census (LIVE 958e63e2, tests/_c488*.mjs, /tmp/au/c488*.json): anon = 7 visible anon478Box (4 are e8e0cc book boxes with userData.book, each its own material; 3 singles) + ~70 anon478Plane/Circle/Cylinder each on a UNIQUE material -> no safe shared set >=3. Skipped.
- Window cards (#358, src/glows358.js): 16 clones of 3 glTF protos; clone(true) shares geometry+material per shape. Frame (alpha map) + Glass (op 0.35, 5 mm behind frame, depthWrite false) = 32 draws.
- Change: after the slots loop, group card meshes by name|material uuid, bake matrixWorld, mergeGeometries -> 6 meshes added to scene (userData.merge488), originals hidden (not disposed; GlowAttach/glow placement unaffected). Glass gets renderOrder -1 so it still draws before its frame. Phone frame-map swap still hits the shared material. Fail soft: window.__m488.err + console.warn('[488 merge]').
- Probe tests/_p488.mjs: local + LIVE __m488 {err:null, from:32, to:6}; no warns/errors. -26 draws when all cards are in view.
- tagsaudit local + LIVE desktop/phone PASS; builderErrs/softWarnings/pageErrors []; colliders 99. Logs /tmp/au/t488*.
- Rollback: cp /tmp/glows358.js.pre488 play-tags/src/glows358.js, rebuild, gen, splice, execute; or re-run /tmp/execute.js.pre488 (restores the 958e63e2 bundle). /tmp/execute.js.488 = this deploy.
