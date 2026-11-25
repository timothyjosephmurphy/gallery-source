# #778 Revised nest: R=8.25 + START entry room (TJ-approved Oct 27 2026 ~2:27 PM PT)
**LIVE**: https://preview-251.tjm-tag-gallery-preview.pages.dev/play/ is deployment **1f6d137a-b4a4-4a3f-9fd1-d2c7a01b3f0e** (created 2:52 PM PT), entry **index-eZYLnHYl.js**. Both were confirmed by curl and by the Pages deployments API, which shows the preview-251 alias on this deployment.
It replaces f38faa50 / index-DwPGvnP1.js (#777, R=8.75, no START). Scope: hex/tag only. Museums, Quake, Chase media and the layouts Worker were not touched.

## Geometry (plan-nest.json, the source of truth; all values were asserted in tools/nest778.py)
- There are 14 hexes, all R=8.25 (apothem 7.145): P, the 12 rooms and START. The plan is rotated +30°, so the hexes are flat-top. The engine gained `layout.tags.wallRot=30`, so wall k's normal is at 60k+30° (tags-world.js hexPoly and walls).
- Inner rooms sit on 30/90/…/330° at 14.289 m. Outer rooms are in the pockets on 0/60/…/300° at 24.75 m.
  - START is at (0,-28.579). H11 Portrait is at (0,-14.289).
  - The footprint is 66×64.3 m and the nave is (-36..36, -38.72..31.58).
- Doors: **19 full-width arches** (DOORW 7.75 m), plus the checkout gate.
  - 6 pavilion↔inner
  - 12 inner↔outer
  - 1 H11↔START entry (room-11 k4 ↔ start k1)
  - The 6 inner–inner walls are solid hang walls, and there are 0 outer–outer doors. START–H4 and START–H6 are solid shared walls.
- doorcheck: 14 nodes, 20 doors (19 plus the gate), 0 dead ends, 0 bridges, 0 problems. START is flagged `entry:true` and exempt from the dead-end and bridge rules, like the annex rule, because it is a one-door portal room by design.
- Spawn: `layout.start` is (0,-30.579) with yaw 0. That is inside START, looking north (+z) through the H11 doorway (verified in the browser: camera at 0,-30.58).

## START wall programs (inside face)
- k2 NW (150°, shared with H4): Gallery map (wallmap via outer-slots `map`). Verified at (-6.09,-25.15).
- k0 NE (30°, shared with H6): World/testimonials map. In testimap.js, `TESTI_WALL={room:'start',k:0,inside:true}`. Verified at (6.10,-25.06). Nothing is on H6's outer wall.
- k4 S (270°): the small Friends Club mural (`friends-club-mural-teaser`, 6.096×1.372 m true size) and its plate, unparked. **The Garden Comrade mural is not on the wall: there is no such asset in the catalog or on disk. It is waiting for the hang step.** No placeholder was made.
- k3 SW (210°): **6 Portrait book-art works overflow here** (see below). k5 SE is empty.

## Hang (no rehang polish)
- Built from the LIVE #777 catalog (/tmp/pre778/catalog.json). It is the same nest and the same hang that the plan's wall-need table came from.
  - Each room was rotated rigidly +30° about its centre and translated to its plan centre.
  - Works were pushed out by the apothem change (0.433 m), so they stay on the wall plane.
- Shorter walls: 20 walls whose rows no longer fit were re-spaced, keeping their order, at true size with a minimum gap of 0.06 m. On one El Salvador wall, one book-art moved to another solid wall in the same room (H8 k3→k5). The full log is in hex-plan-honeycomb-nest/door-shifts-778.json and `layout.tags.nest.respaced`.
- **Blocker for TJ / hang step:** the START door takes H11's south wall. That leaves H11 two solid walls of about 7.45 m usable each. Its 19 works plus plaques need 14.6 m, so they cannot fit in one true-size row.
  - The 6 works from that wall moved as one row, in order, onto START-SW (k3, not a program wall): book-art-64cfd389…, a627c7b7…, 029f45a5…, 7123da04…, 37fe572d…, 6bcf1841….
  - Each is marked `movedBy` "#778 … awaits hang step".
- Boards: timeline+Nostr stays on room-06 k3 and Cormorant + QR plate stays on room-01 k3, both inside face. The eagle plate rides with its host.
- The pavilion hologram dais is at (-4,0), on the 180° bisector between the H3 and H8 doors. Its old spot was inside the H3 doorway after the rotation.
- stickerBot306 now rejects spots inside a door zone.
- tags-world.js door key no longer doubles a door on a -0.0/0.0 coordinate.

## Parked (layout.tags.parked777)
- The Paul annex room-13 is still parked.
- The Friends outer court is not built. Neural Dance, the big FC mural and its plate, and the Austin four are still parked.

## Verify
- tagsaudit PASS on local desktop and phone: 268 works, 0 size, 0 overlap, 0 blocked, 0 unreachable, 0 floating, 0 doorway, forbid 0, mute silent, 0 builder or page errors. module-colliders.json was regenerated.

## Pipeline
1. `cp /tmp/pre778/catalog.json src/catalog.json; cp /tmp/pre778/testimap.js src/testimap.js`
2. `python3 tools/nest778.py && python3 tools/nest778.py art`
3. `npm run build`, then tagsaudit desktop and phone
4. `python3 deploy/gen.py && python3 deploy/splice.py`, then the Cloudflare `execute` connector (account 3c1fddf0…). The deploy file is saved as /tmp/execute.js.778.

Code touched: src/tags-world.js (wallRot, door key), tools/doorcheck.mjs (entry exemption), src/testimap.js, src/stickerBot306.js, src/outer-slots.json and src/catalog.json (both generated), tools/nest778.py (new).

## Rollback
- Re-run /tmp/execute.js.777 (f38faa50 / index-DwPGvnP1.js) through the `execute` connector.
- The pre-778 src snapshot is in /tmp/pre778/: catalog, outer-slots, tags-world, testimap, doorcheck and module-colliders. stickerBot306 is the #777 version plus one line.
