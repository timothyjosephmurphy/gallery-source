# #355 Wall-map escort + AU Kylie lines — scout (Gallery, Oct 26 2026)
Scout only; no src edits (#304 deploy may be mid-splice). Nothing deployed.

## Exists
- `play-tags/src/wallmap.js` `go(id)` (L40): map tap (L50) → duck guide escorts along walk paths (#380 run pace); logs `S.escorts`. **No audio call.**
- `play-tags/src/tour.js`: Kylie tour audio from `img.tjm.art/play/tour/286k/` (Paula `/286/` fallback), single `Audio()` routed via THREE.PositionalAudio on the guide bot, iOS unlock on first gesture. Reusable for escort clips.
- Copy: `gallery-handoff/map-escort-lines-355.md` (also on #355) — 15 lines, "Okay, I'll take you to the {X} gallery."
- Kylie assets: `music/guide-bot-voice-28/australian-kylie/` = 17 tour clips only (00–14). `ride.js` is text-only.

## Missing
- **All 15 escort VO clips** (none rendered; no "take you to" clip anywhere besides 00-controls).
- Mapping room id (wallmap `rooms[].id` / `checkout`) → line id; table uses approx map labels.
- Escort playback hook (e.g. expose tour's spatial `play(file)`; call in `go()` before glide; mute-respecting; skip if tour clip playing).
- Upload path, e.g. `img.tjm.art/play/tour/355k/`.

## Overnight wire — verdict
- Needs **Writer**: no — copy done (only confirm 2 label merges, e.g. Sunset vs El Salvador).
- Needs **Music**: yes — render 15 AU Kylie clips (#286 voice pack). #28 README notes Runway/TTS spend needed TJ approval → **TJ only if new credit spend required**.
- Gallery wiring can go overnight **after #304 splice lands** + clips exist; text-caption fallback possible without VO.

## Wired (Oct 26 2026, ~3:25 PM PT) — text captions, deployed 8253ac07 / preview-251
`src/escortCaptions355.js` → `showEscortCaption(id)` called from `wallmap.js go()` (go() live; #380 note is a closed block comment).
- Captioned: checkout, room-01 Tahoma & Rainier, room-02 Brekkie Bitcoin, room-03 Mexico & PNW, room-04 Festival, room-05 Family, room-06 Catherine dance, room-07 Bitcoiners, room-09 Sunset, room-10 Bitcoiners, room-11 Portrait, room-12 Seattle.
- Skipped → generic "Okay, I'll take you there.": room-08 El Salvador · Sunset (Sunset/El Salvador merge unclear); friends-court (script has both "Friends gallery" and "Friends Court").
- Ambiguous: room-07 and room-10 both read "Bitcoiners gallery".
- No audio yet (15 Kylie VO clips still missing).
