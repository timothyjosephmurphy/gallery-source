# #739 guided tour rings the hex rooms, no courtyard/pavilion cuts. DEPLOYED Tue Oct 27 2026 ~11:02 AM PT
Deployment d6238fba-9fad-42be-9d18-d3c4726c9223 on preview-251 (replaces d3da0b48). Entry index-QmClDLFw.js.
- New route (one sweep around the ring from the spawn side, ends at the mural next to where it started):
  spawn court (intro plays walking out) -> El Salvador (room-08) -> Kayak sunsets (room-03) -> Rainier (room-12) -> Family: Portraits + Grandpa (room-05)
  -> Bitcoiners (room-07/10) -> Friends (room-11) -> Friends Club mural (outer court by room-04). Old route zig-zagged across the pavilion/courtyards.
- src/tour-manifest.json: clips get `seq` (play order); `order` stays as the STOPS key. Old walks 03/05/07 removed (their lines named the old order).
  4 new walk lines, same Kylie voice (eleven_v3, speed 1.15, atempo 1.25, 64k mono): 739-w1 "Come with me. We'll start somewhere much warmer.",
  739-w2 (ElSal tail + "Next, more sunsets, closer to home."), 739-w3 "Now, the mountain, where it all began.", 739-w4 (balcony tail + "Now, from places to family.").
  Shipped in the preview at /play/tour739/ (public/tour739, gen.py embeds dist/tour739 as audio/mpeg). Raw masters: /workspace/gallery-tour/narration-739/.
  Walks 09/11/13 and all stop clips unchanged.
- src/tour.js: sort by seq; local clips load from tour739/; ringPath(): if a leg's shortest path enters the pavilion (r<9) or any courtyard (r<4.6),
  it is rebuilt through the ring room centres between the stops (shorter arc). Opening leg starts in the spawn courtyard and just walks out. #738 HUD watcher untouched.
- Smoke tests/_ring739.mjs (local desktop+phone, LIVE desktop): all 8 stops visited, 0 camera samples inside pavilion/courtyards after the opening leg, 0 errors.
  tests/_path739.mjs per-leg check (Grandpa->Bitcoiners direct path crossed the middle, now ringed). tagsaudit desktop+phone PASS local + LIVE. _hud738 probe PASS LIVE.
  Logs /tmp/au739-*.log, /tmp/ring739-*.log
- Worker 3.05 MB / execute 3.12 MB.
- Rollback: cp /tmp/tour.js.pre739 src/tour.js; cp /tmp/tour-manifest.json.pre739 src/tour-manifest.json; cp /tmp/gen.py.pre739 deploy/gen.py; rebuild/gen/splice/execute;
  or re-run /tmp/execute.js.pre739 (restores d3da0b48 bundle). /tmp/execute.js.739 = this deploy.
