# #777 Nestled honeycomb (TJ-approved Oct 27 2026 ~13:48 PT; door map approved ~13:52 PT; full-width arches add-on ~13:53 PT)
**LIVE**: https://preview-251.tjm-tag-gallery-preview.pages.dev/play/ — deployment **f38faa50-c2e8-45c3-8d9d-2b7a423fa129**, entry **index-DwPGvnP1.js** (confirmed by curl on the LIVE page).
It replaces 6b31d47a / index-CmsLV6zs.js (dodec #775). Scope: hex/tag only. Museums, Quake and the layouts Worker were not touched (no PUT/DELETE).

## Geometry (source: gallery-tj-feedback/hex-plan-honeycomb-nest/plan-nest.json)
- 13 pointy-top regular hexes, all R=8.75 m (apothem 7.578). That includes the pavilion P at the origin (774 used 9).
- Inner 6 sit at 15.155 m on the 0/60/…/300° rays: room-02 H2, room-01 H1, room-03 H3, room-08 H8, room-11 H11, room-07 H7.
- Outer 6 are NESTLED in the pockets at 3R = 26.25 m on the 30/90/…/330° rays: room-05 H5 (22.733, 13.125), room-12 H12 (0, 26.25), room-09 H9, room-04 H4, room-06 H6, room-10 H10.
  They are not on star rays, and none is at ~30.3 m. Each outer room shares walls with exactly two inner rooms.
- Footprint is 60.6 × 70 m. There are no courtyards, no lawn (`grounds` = null), and no outer courts (`outerCourts` holds only a virtual art carrier with no floor or walls).
- Doors match the plan exactly. There are 18 doors (plus the checkout gate):
  - 6 pavilion↔inner
  - 12 inner↔outer: H2–H5, H2–H10, H1–H5, H1–H12, H3–H12, H3–H9, H8–H9, H8–H4, H11–H4, H11–H6, H7–H6, H7–H10
  - 0 inner–inner: these 6 walls are solid HANG walls
  - 0 outer–outer, and no lawn doors
- **Every door is a full-width arch**: an 8.25 m opening on the 8.75 m wall, with 0.25 m stubs that carry the jambs. It is an elliptical arch, springing at 2.6 m with its crown at 3.7 m.
  Full-width doors have no splayed flares. tags-world.js (doorWidths/FULL_SPRING/FULL_APEX) and tags.js archShape (ellipse) were changed for this.
- doorcheck graph: 13 nodes (hub + 12), 0 dead ends, 0 bridges.

## Hang (rigid migrate + door clearance only)
- Each room was translated rigidly to its plan centre, so works keep their wall k and their offset.
- Works on the 18 opened door walls moved onto a solid wall of the SAME room (rotate and centre into the best-fitting gap, largest cluster first). Works already on solid walls did not move.
  The log is in hex-plan-honeycomb-nest/door-shifts-777.json.
- The plan has no lawn doors, so the exterior boards now hang on the INSIDE face of an emptied solid wall:
  - timeline + Nostr: room-06 w3
  - wall map: room-05 w5
  - testimonials map: room-09 w1 (testimap TESTI_WALL.inside)
  - Cormorant + QR plate: room-01 w3
  outer-slots.json is written by nest777.py. Do not run outerslots.mjs.
- The eagle plate moves with its host painting. The 4 art-book lecterns (gallery-core main.js, tags branch) are now at the centres of room-01/11/05/12.
- glows358 falls back to the exterior faces. In tags.js the outer corner caps sit only on true hex corners.

## Parked (in catalog `layout.tags.parked777`, nothing deleted)
- **No Friends outer court.** Parked: the Friends Club mural and its brass plate, Neural Dance, the half-size teaser and its plate, the Austin four (book-art in friends-court), and the court geometry. Festival H4 has no FC portal. TJ to follow up.
- Paul annex room-13 is parked with its 38 works. It is not in the nest plan, and no new annex was invented.
- Works shown: 268 (was 311 on the honeycomb base, minus 42 parked paintings and the FC mural/teaser).

## Pipeline
Base: /tmp/pre775/catalog.json (honeycomb B2a). Steps:
1. `cp /tmp/pre775/catalog.json src/catalog.json`
2. `python3 tools/nest777.py`
3. `python3 tools/nest777.py art`
4. `npm run build`, which runs doorcheck
5. tagsaudit, which regenerates tools/module-colliders.json
6. `python3 deploy/gen.py && python3 deploy/splice.py`, then the Cloudflare `execute` connector call
/tmp/execute.js.777 is this deploy.

## Verify
- doorcheck PASS: 0 problems, 19 doors, 13 nodes, 0 dead ends, 0 bridges.
- tagsaudit PASS on local desktop+phone and LIVE desktop+phone. Results: 268 works, 0 size, 0 overlap, 0 blocked, 0 unreachable, 0 floating, 0 doorway, forbid 0, mute silent, 0 builder or page errors.
- LIVE ping: 18 non-gate doors, all 8.25 m wide, 12 rooms, 0 outer courts or courts.
- As-built images: hex-plan-honeycomb-nest/as-built-777.png and as-built-777-arch.png.

## Rollback
- Re-run /tmp/execute.js.775 (dodec 6b31d47a / index-CmsLV6zs.js) or /tmp/execute.js.B2a (honeycomb d701a4a8) through the Cloudflare `execute` connector (account 3c1fddf0…).
- Source: /tmp/pre777/ holds the pre-777 src (catalog, outer-slots, tags-world, testimap, glows358, stickerBot306, tags.js, horizon352, gallery-core-main.js, doorcheck/outerslots, stale module-colliders).
