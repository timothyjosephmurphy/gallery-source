# #wallrec wall records + roomWall merge DEPLOYED Mon Oct 26 2026 ~8:40 PM PT
Deployment 5b368ab8-1d80-458b-9c6a-d57078ab8c3a on preview-251 (replaces c1d57b53). Entry index-CmkH5k8o.js.
- Prep: tags.js wall loop now builds records {pos:[x,y,z], ry, L, h, th, kind:'room'|'mural', room} -> window.__wallRecs (also root.userData.wallRecs). Same numbers the old per-wall meshes used (L incl. +0.02 for room walls).
- stickerWalls307 raycasts private unit-box proxies built from __wallRecs (not in scene, 0 draws); top = r.h as before. Fallback: traverse roomWall/muralWall meshes.
- tagsaudit (+ _tagsdbg) 'floating' check builds proxies from __wallRecs; fallback to roomWall/muralWall BoxGeometry traverse.
- Merge: walls baked to world space and merged per material (all NEUTRAL -> 1 mesh 'roomWallMerge', castShadow/receiveShadow) under tagsArchitecture (arch/doorway rule unchanged). overlays303 rules don't match roomWall*, so look unchanged. Colliders from W: 99 before/after.
- Fail soft: console.warn('[wallrec merge]'), window.__mWall.err, builds the old per-wall roomWall/muralWall meshes. OK: window.__mWall = {recs, draws, pieces}.
- Draw calls LIVE (_drawscout swiftshader 1280x800): spawn 313 -> 249, dense 539 -> 474, median 200 -> 187.
- tagsaudit local desktop/phone PASS; LIVE desktop/phone PASS; builderErrs/softWarnings/pageErrors []. Logs /tmp/au/twr-*.log
- Rollback: /tmp/tags.js.preWR, /tmp/sw307.preWR, /tmp/tagsaudit.preWR, /tmp/execute.preWR.js (re-run to restore c1d57b53).
- Next: merged wall is one always-drawn mesh (no frustum cull); if phone fill-rate matters, split per room. Then remaining hang478Part sets / anon478 (31).
