# Far anon planes scout, Tue Oct 27 2026 ~1:05 AM PT. NOT shipped.
Local dist, the same build as LIVE 56a62895 (index-C6VDMZMR.js). Probes: play-tags/tests/_anonfar.mjs, _anonfar2.mjs, _anonfar4.mjs (A/B with window.__mFarAnon.off toggled per view, 450 ms settle).
## What they are (all anon478*, unnamed core-built decoratives)
- **Door-header room-name planes**: anon478Plane at h=0.3 m, y=3.9, parent Scene, canvas maps 495-821x96, in front/back pairs. They make up 4-6 of the >25 m draws per view.
- **Book lecterns (books.js)**: a Group of 5 planes/boxes per book (cover webp + page/edge colours, userData.book), plus an additive glow plane, a floor Circle, and a Cylinder light cone (ffd7a0).
- The spotlight/glow group (ShaderMaterial plane + cylinder + ring + circle) on the dais.
## Trial gate (#490, reverted)
In tags.js, afterPlayable collected the top-level anon units (31). Every 0.25 s it turned off layer 0 when the unit's bounds were more than 25 m from the camera. This left .visible and owner toggles untouched, and clicks inside 25 m still worked. Fail soft.
## A/B (calls, gate off -> on)
| view | off | on | drop |
|---|---|---|---|
| densest (9.9,7.5) | 261 | 258 | 3 |
| (15.1,-14.3) | 201 | 188 | 13 |
| (2.3,12.8) | 183 | 183 | 0 |
| (28.5,-3.8) | 176 | 176 | 0 |
| median | 116 | 116 | 0 |
Verdict: the densest view drops only about 3 calls, and only one secondary view gets to -13. That misses the "clear dense drop ≥10-15" bar, and it would make wayfinding door labels pop. **DON'T.** src/tags.js was restored from /tmp/tags.js.pre490 and the rebuild matches LIVE (index-C6VDMZMR.js, main-CNHHyEK2.js).
