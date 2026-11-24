# #743 Gravity Gun hang: wall not recognized while carrying. DEPLOYED Tue Oct 27 2026 ~11:12 AM PT
Deployment d156030b-a069-42c6-8531-1118633020a3 on preview-251 (replaces d6238fba). Entry index-CkuefX-B.js.
- Root cause: gravgun wallMeshes() only accepts BoxGeometry meshes. The hex gallery merges its room walls into 'roomWallMerge'
  BufferGeometry (#wallrec), so the hang raycast found no walls -> placement() null -> "AIM AT A WALL" every time.
- Fix: gallery-core/src/gravgun.js accepts optional o.wallTest(mesh) (absent = old behaviour, museums unchanged);
  gallery-core/src/main.js passes wallTest: m => m.name === 'roomWallMerge' ONLY on the gallery:'tags' createGravGun line.
  Overlap/doorway rejection ("NO ROOM THERE: OVERLAP OR DOORWAY") unchanged; hang is true size as before.
- Probe tests/_hang743.mjs (grab, aim beside another painting on its wall, hang): local + LIVE desktop+phone 3/4 hung, 4th correctly rejected (overlap), 0 errors.
- tagsaudit desktop+phone PASS local + LIVE (/tmp/au743-*.log). _hud738 PASS LIVE. Worker 3.05 MB / execute 3.12 MB.
- Rollback: cp /tmp/gravgun.js.pre743 ../gallery-core/src/gravgun.js; cp /tmp/main.js.pre743 ../gallery-core/src/main.js; rebuild/gen/splice/execute;
  or re-run /tmp/execute.js.pre743 (restores d6238fba). /tmp/execute.js.743 = this deploy.
