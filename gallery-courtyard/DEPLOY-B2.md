# B2a hang on the #774 honeycomb. DEPLOYED Tue Oct 27 2026 ~1:06 PM PT
Deployment d701a4a8-2826-4f53-8cb1-db77ab46610c on preview-251 (replaces 5b9a3c55 / index-B7-nERAZ.js). Entry index-hyGyZTSi.js.
Hex only. Museums, Quake and the layouts Worker were not touched.
Pipeline: apply-overrides.py, then tools/honeycomb774.py, then node tools/outerslots.mjs, then tools/honeycomb774.py art, then **tools/b2hang.py** (new, idempotent), then npm run build.
(The older tools/b2a.py uses pre-honeycomb repack wall frames. Do not run it.)

## Landed
- #767: Sunrise in Puerto Vallarta (book-art-87cf2a732259b313f5ab) removed from the hang and added to `excluded`.
- #318: Forest Triptych hangs as one horizontal row on room-02 w5: 302 | 303 | 304 left to right, all at y 1.45, 4 cm gaps, real size (0.171 x 0.762 m, display crops with no white card from #317). One plaque after the set.
- #742: Honey Badger | Coined in Watercolor (middle) | Syrenka as one row on room-10 w2 (Bitcoiners). Room-07 had no 3.5 m free stretch.
- #760: the four Austin portraits that were by the old courtyard doorway now hang in the Friends Court (Tianna and child, Izzy and Sienna, Sienna and Michael, Jasmine). They are in one row on the outside face of room-11 w3, room=friends-court.
- #766: the Cormorant QR brass plate is off the mural wall and hangs alone on the outside of room-10 w4 (lawn side).
- #763: doorway signs show the first label segment only (the gallery name), with no prices. The room-09 label lost "$75 Watercolors".
- #757: the room-02 floor mosaic sign uses the Bitcoiners tile instead of Brekkie Bitcoin B (courtyard296.js).
- #769: verified the floating title shows the current room name at 17 px desktop / 12 px phone (shipped earlier).
- #773: verified `?hangIndex=1` installs the labels. The hang-index sheet is rebuilt (267 indexed paintings in 12 rooms; the Friends Court four are not in a hex room).

## Deferred
- Same-deploy candidates: #741 hummingbird orphans and #353/#354 regroup + group labels. Both need a per-wall regroup on the new walls.
- B2b: #740 + #356, #744, #745, #280.
- The local undeployed regroup data (hang-overrides #1022 etc.) is still in old-geometry coordinates.

## Verify
doorcheck PASS. tagsaudit PASS on local desktop+phone and on LIVE desktop+phone. Probe: the triptych x/z run in order on one y, and the trio is in order on one y.

## Rollback
Re-run /tmp/execute.js.774b through the Cloudflare connector to restore 5b9a3c55.
Source: cp /tmp/preB2/{catalog.json,tags.js,courtyard296.js} back into src/.
/tmp/execute.js.B2a = this deploy.
