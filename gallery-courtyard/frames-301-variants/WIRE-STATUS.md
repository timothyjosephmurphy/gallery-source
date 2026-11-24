# #301 frame variants: wiring status (Oct 26 2026, prep only, NOT deployed)

## R2 (tjm-images)
Uploaded 26 webps (desktop + phone, albedo/_n/_r/_ao for walnut, white, dark-ornate, plus liner-silver) to `play/preview-251/frames-variants/`. Script: /tmp/r2pdf/up-frames301v.mjs (3 retries). Spot check: https://img.tjm.art/play/preview-251/frames-variants/frame-walnut.webp and frame-liner-silver.phone.webp both returned 200 image/webp. PNG masters were not uploaded.

## play-tags `src/frames.js` (backup: `src/frames.js.pre301v`)
- Paths: `/img/play/preview-251/frames-variants/`. Black, the gold liner and the contact shadow still load from `/img/play/preview-251/frames/`.
- `classify(p)` works on `p.data`, with the first match winning:
  1. room-11, or a title/caption matching Father Paul / Reiki / Attendee → **walnut** + gold liner (env .5)
  2. medium contains "watercolor" but not "pastel", and the larger side is ≤ 0.4 m (trueW/trueH, else w/h) → **white** + silver liner (rough .4, env .6)
  3. `ORNATE` flag on (default true) and room-04, or a title matching burning man / temple / festival → **dark-ornate** + gold liner (env .7)
  4. Everything else → **black** (#301). This is unchanged, and it has a liner only if `LINER` is true (still false).
- There is one InstancedMesh per variant in use (`frameBars-<variant>`, each with its own geo clone and aLen), so there are up to 5 draws including the shadows. Geometry, UVs, placement, shadow and plaques are unchanged.
- Estimated split across catalog.json: black 235, white 32, ornate 23, walnut 20. `window.__frames.variants` shows the live counts.

## Verify
`npx vite build --outDir /tmp/ptbuild-301v/dist`: built OK (only the existing chunk-size warning). play-tags/dist was not changed.

## Not touched
hang-overrides (no PUT/DELETE), eggs, approved:false packs. No Pages deploy, no gen.py.

## Remaining
1. Visual check with `npm run dev`, on desktop and phone: walnut grain direction, ornate motif scale (1/16 U), silver lip band.
2. Confirm the class rules with TJ/Visual: is the watercolor 0.4 m cutoff right, and is ORNATE on or off? Should the ornate liner be silver or gold?
3. The Pages deploy belongs to the next wave.
