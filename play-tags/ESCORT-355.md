# #355 wall-map escort captions (temporary text, no VO)
Mon Oct 26 2026 PT. Source lines: gallery-handoff/map-escort-lines-355.md. Room ids: tag-gallery/data/layout.json.

- New: src/escortCaptions355.js (LINES by room id, GENERIC fallback, fixed bottom caption ~3.2 s, `window.__escortCaption` for tests).
- wallmap.js: imports it; `go()` calls `showEscortCaption(id)` once the escort actually starts.
- Fix in wallmap.js line 40: the #380 `//` comment was swallowing the start of the `go()` body (`const r … from/to` were commented out, so escort would throw). Changed to `/* … */`. Backup: /tmp/wallmap.pre355.js.
- Wired (13): checkout, room-01..07, room-09, room-10, room-11, room-12.
- GENERIC "Okay, I'll take you there.":
  - room-08 "El Salvador · Sunset": the script gives an El Salvador line, but room-09 is "Sunset" and the label mixes both. Possible Sunset/El Salvador merge; TJ's intent unclear, so not guessed.
  - friends-court (outer, label "Friends Court"): script has both a "Friends / Friends Court → Friends gallery" row and a "Garden court (outer) → Friends Court" row. Unclear which applies.
  - Cormorant Garden (outer): no script line.
- Not wired: "Paul Murphy" line, because no Paul Murphy room id is in layout.json.
- No VO/`play(lineId)` yet. Waiting on recorded clips.
- Build: vite → /tmp/ptbuild-355/dist (main-CAHC_IU6.js), DOORCHECK PASS. Not deployed (#304 deploy finished per gallery-courtyard/DEPLOY-304.md, but #355 did not ask for a deploy).
