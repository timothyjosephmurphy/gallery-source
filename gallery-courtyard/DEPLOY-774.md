# #774 Honeycomb hex layout (TJ-approved Oct 27 ~12:34 PT). DEPLOYED Tue Oct 27 2026 ~12:57 PM PT
Deployment 5b9a3c55-9184-4ce7-9fa3-f66b50935107 on preview-251 (replaces f18b22c7 / index-Dm6pypi0.js). Entry index-B7-nERAZ.js.
URL: https://preview-251.tjm-tag-gallery-preview.pages.dev/play/ . Hex only, museums and Quake untouched. No layouts-Worker PUT/DELETE.
There was an intermediate deployment bac0c040-720b-456d-abf7-bd05cbe5efe5 (index-caoLXmcG.js, ~12:54 PT). It failed the LIVE tagsaudit because the horizon352 mid-valley band
(R=44.8 m) cut through the moved Paul annex and blocked 3 plaques. 5b9a3c55 is the same build with that band moved out to R=53.8 m.

## Geometry, old → new
- Pavilion: r=9 at the origin, unchanged. It is now enclosed by 6 inner rooms. Each inner room has a door on its pavilion wall (offset 0).
- Rooms: radii were 5.5–8.0 m (room-01 5.5, 02 5.75, 03 7.5, 04 8.0, 05 5.5, 06 6.25, 07 6.5, 08 7.0, 09 6.5, 10 6.25, 11 6.0, 12 7.75). All 12 are now **8.75 m** (apothem 7.578 m).
- Inner ring (centres at 15.37 m, rays 0/60/…/300°): room-02, room-01, room-03, room-08, room-11, room-07 (plan H2, H1, H3, H8, H11, H7).
  Outer ring (30.53 m on the same rays): room-05, room-12, room-09, room-04, room-06, room-10 (H5, H12, H9, H4, H6, H10). Centres match plan-v2-honeycomb.json exactly.
- **Inner courtyards removed**: `courtyards` = [] (the 6 green court-1..6 hexes and their peristyle halls are gone). A walkable lawn (`grounds`, r=41 m) surrounds the honeycomb, and the fence sits on its edge.
- Doors (34): inner→pavilion ×6, inner ring ×6, inner→outer ×6, and one lawn door per outer room (room-04 w5 and room-06 w2 open into the Friends Court; room-05 w4,
  room-09 w0, room-10 w1, room-12 w5 open onto the lawn). doorcheck: 16 nodes, 0 dead ends, 0 bridges.
- Friends Court: kept, moved into the pocket between room-08, room-11, room-04 and room-06, at (-23.06, -13.31), r 9→8.75. The Friends Club mural is on a free wall across the open side.
  Neural Dance now stands against the outside of room-08 wall 4.
- Paul annex (room-13, r=6, one door): moved from room-02 w0 to the outside of room-05 w0, at (43.3, 0). Not one of the 12 equal rooms.
- Exterior boards (tools/outerslots.mjs PLAN): the old courtyard-facing walls are now shared walls, so the boards moved. timeline+nostr went from room-06 w1 to w0, map from room-09 w5 to w4,
  testimonials from room-12 w4 to w3 (testimap.js TESTI_WALL), Cormorant stayed on room-10 w3, and the Friends teaser went from room-04 w0 to w1.
- Hologram dais (gallery-core main.js, tags branch only): now read from `layout.tags.dais`. It moved from (-4.5, 2.6) to (-4.0, 2.4) so it is clear of the pavilion doors. Start (-10.3,-0.3) → (-5.2,-0.6), inside the pavilion.
- horizon352 mid-valley band: 0.7 → 0.84 × R0.
- Hang: every work keeps its room, wall and offset along the wall (rigid move, and walls only grew). Exceptions are needed for door gaps only (gallery-tj-feedback/hex-plan-774/door-shifts-774.json). On 12 walls the works
  slide along the wall to clear a new door. On 3 walls the full wall contents swapped with an empty wall in the same room, because the wall could not also hold a door: room-12 w4↔w0, room-08 w3↔w4 (triptych row), room-04 w0↔w1.
  No B2 hang polish is in this deploy.

## Base / not shipped
- The base is the LIVE f18b22c7 catalog, extracted from main-vlM0BosC.js. The local src/catalog.json held undeployed B2 hang work (#1022 Ukraine row, Forest Triptych, room-07 smalls).
  That work was NOT shipped and is saved in gallery-tj-feedback/hex-plan-774/catalog.local-undeployed-B2-pre774.json. hang-overrides.json is untouched.
- **Pipeline order now**: apply-overrides.py (old geometry), then `python3 tools/honeycomb774.py`, then `node tools/outerslots.mjs`, then `python3 tools/honeycomb774.py art`, then npm run build.
  apply-overrides/repack/wallframes are still in old-geometry coordinates. B2 must re-run honeycomb774 after apply-overrides, or port the hang into new coordinates.
- This build also ships src/hangIndex773.js (#773 labels, off unless ?hangIndex=1). It was already in src.

## Verify
doorcheck PASS. tagsaudit PASS on local desktop+phone and on LIVE desktop+phone (5b9a3c55): 311 works, 0 overlaps, 0 blocked, 0 unreachable, 0 doorway intrusions, forbid 0, mute silent.
LIVE world dump: 13 rooms (12 at r=8.75 + annex r=6), hub, 1 outer court, 0 'court' kind. Plan image: gallery-tj-feedback/hex-plan-774/as-built-774.png.
Hang index rebuilt: gallery-tj-feedback/hang-index/hex-hang-index.csv/.xlsx (272 paintings, 12 rooms).

## Rollback
Re-run /tmp/execute.js.765 (restores f18b22c7 / index-Dm6pypi0.js) through the Cloudflare connector `execute` (TJ account 3c1fddf0…).
Source: backups are in /tmp/pre774/ (catalog.json = local pre-774, catalog.live765.json, outer-slots.json, tags-world.js, tags.js, testimap.js, doorcheck.mjs, outerslots.mjs, horizon352.js, gallery-core-main.js, glows358.js is not backed up — revert its #774 line).
/tmp/execute.js.774b = this deploy.
