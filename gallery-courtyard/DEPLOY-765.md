# #765 Buy Scanner on the courtyard cormorant mural. DEPLOYED Tue Oct 27 2026 ~12:08 PM PT
Deployment f18b22c7-48c7-4372-9c74-8d674743184e on preview-251 (replaces a1750363). Entry index-Dm6pypi0.js. Also ships the pending #746 rejoin-interrupt fix.
- play-tags/src/tags.js: outer-court mural 'cormorant-presiding-over-sunset-on-puget-sound' (SCAN_MURALS) is registered into game.paintings as a
  painting-like object on its EXISTING mural mesh + frame (no second copy): status 'nfs', noGrab, freestanding, plaque = its brass plate
  (brass plates now unit planes scaled to size, same look). Pushed from tags update() once game.paintings exists.
- gallery-core/src/shopscan.js (gated by p.freestanding, absent in museums): onWall() passes; obstacles() ignores works on the far face of the wall.
- gallery-core/src/gravgun.js: grabTargets skip p.noGrab (absent in museums) so the mural can't be grabbed.
- Verify: tests/_scan765.mjs (in game.paintings, status nfs, red beam, print copy shows, entry print-...-medium-frame-black, click/tap label -> cart
  "Medium print, Black frame") PASS local + LIVE desktop+phone. tagsaudit PASS local + LIVE desktop+phone (one local desktop run failed on proxy 500s, rerun PASS).
  _cart746 PASS LIVE desktop+phone. shopaudit.local phone PASS; desktop 3 hover/click FAILs are pre-existing (same 3 on LIVE a1750363 before this deploy).
- Rollback: cp /tmp/tags.js.pre765 /workspace/play-tags/src/tags.js; cp /tmp/shopscan.js.pre765 /workspace/gallery-core/src/shopscan.js; cp /tmp/gravgun.js.pre765 /workspace/gallery-core/src/gravgun.js;
  rebuild/gen/splice/execute; or re-run /tmp/execute.js.pre765 (restores a1750363). /tmp/execute.js.765 = this deploy. Worker 3.06 MB / execute 3.14 MB.
