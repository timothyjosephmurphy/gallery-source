# PERF-INVENT-2 — play-tags (Mon Oct 26 2026, ~3:45 PM PT)

Result: A done (undeployed, nothing to deploy). B already throttled, so no code change. **No deploy.** LIVE is still 4628c2f2 (meshopt).

## A — Reproducible plaque webps (PERF-PASS item 5) — DONE
- deploy/gen.py plaque loop (`for f in os.listdir('dist/plaques')`) read `/tmp/<name>.webp` for 4 plaques.
- Copied `/tmp/{cormorant-label,eagle,friends-club,friends-club-teaser}-plaque.webp` into `play-tags/public/plaques-webp/` (344 KB: 55,174 + 96,040 + 123,766 + 65,148 B).
- gen.py now reads `public/plaques-webp/<name>.webp` and falls back to `/tmp` only if that file is missing. Not shipped twice: gen.py skips any dist dir that contains '/plaques', and that covers plaques-webp.
- `npm run build` OK. gen.py → `deploy/_worker.js` 2,907,820 B, **byte-identical** (cmp) to the pre-edit worker that is LIVE as 4628c2f2. The plaques are still packed. The worker is about 2.9 MB, under the 4 MB cap.
- Backups: /tmp/gen.py.preinvent2, /tmp/_worker.js.preinvent2

## B — Neural Dance CanvasTexture throttle (PERF-PASS suspect #3) — ALREADY THROTTLED, NO CODE
- src/tags.js drawDance (l.175–180) has these gates:
  - Distance gate: on below 22 m, off above 30 m. The iframe is removed when off.
  - Skips when `document.hidden`.
  - Copies the canvas and sets `needsUpdate` only when `acc >= 1/30 s` on desktop or `1/15 s` on phone (LOW).
- So the upload is already capped at about 30 Hz on desktop and 15 Hz on phone, not every frame. Suspect #3 is cleared.

## Deploy
None. The worker output is identical to LIVE, so a redeploy would change nothing, and tagsaudit was not needed. The gen.py change takes effect on the next real deploy.
