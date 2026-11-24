# DEPLOY frames-301 wave2 (#301) — preview-251 (Mon Oct 26 2026, PT)

Result: **PASS → deployed (1 deploy)**

- Pre-check: latest LIVE 48909dcf (3-leg sticker), no gen.py/wrangler in flight → proceeded.
- R2: 26/26 webp from frames-301-wave2/ → `play/preview-251/frames-variants/` (failed none, PNG masters not uploaded). img.tjm.art spot-check: frame-oak.webp 200 (81,380 B), frame-liner-copper.phone.webp 200 (492 B).
- src/frames.js (backup /tmp/frames.js.pre-wave2): VAR + oak (copper liner, metal .65 / rough .42), maple (silver liner), charcoal (frame-float-charcoal, no liner); tex() routes silver/copper liners to FV; classify order walnut → white → ornate → maple (hummingbird | watercolor) → oak (bass coast|forest triptych|sunrise) → charcoal (room-07/10, bitcoiner|nakamoto|honeybadger, max side ≥1.2 m) → black.
- Variant counts (frameBars-* instances, desktop = phone): black 156, charcoal 62, white 32, ornate 23, walnut 20, oak 9, maple 8 (= 310).
  - NOTE: `window.__frames` gets overwritten by the render loop's frame counter (`window.__frames=(window.__frames||0)+1` in main), so `__frames.variants` is not readable at runtime. That bug was already there; counts were read from scene meshes. Fix idea for later: rename the counter.
- Build OK (entry index-CUD-ylP_.js). tagsaudit desktop PASS, phone PASS (n=310, all lists empty, dmt 0, mute silent).
- gen.py → _worker.js 2,802,366 B; splice → execute.js 2,869,253 B.
- Cloudflare execute, account 3c1fddf0…, project tjm-tag-gallery-preview, branch preview-251, env preview.
- Deployment id 1e2ce12b-5632-4268-b454-356b615683ec (replaces 48909dcf)
- URLs: https://1e2ce12b.tjm-tag-gallery-preview.pages.dev/play/ · https://preview-251.tjm-tag-gallery-preview.pages.dev/play/ (200, serves index-CUD-ylP_.js; frames-variants maple/copper 200 via /img)
- Rollback: cp /tmp/frames.js.pre-wave2 play-tags/src/frames.js, rebuild, redeploy.
- Not wired: white-border-crops-317-wave2 (next invent).
