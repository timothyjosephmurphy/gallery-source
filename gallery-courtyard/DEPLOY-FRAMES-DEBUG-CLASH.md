# DEPLOY window.__frames name clash fix — preview-251 (Mon Oct 26 2026, PT)

Result: **PASS → deployed (1 deploy)**

- Pre-check: latest LIVE 48a0fdf4 (borders-wave2), nothing in flight.
- Backups: /tmp/frames.js.preclash, /tmp/tags.js.preclash.
- src/frames.js:66 debug object `window.__frames = {count,low,draws,variants}` → `window.__frameBars`.
- src/tags.js:222 catch `window.__frames = { err }` → `window.__frameBars = { err }`.
- gallery-core counter `window.__frames = (window.__frames||0)+1` and index.html watchdog untouched.
- Build OK (index-BYbK3KOX.js). Smoke (tests/_smokeclash.mjs, local + live): typeof __frames 'number', value 4 (>0); __frameBars = {count 310, low false, draws 8, variants {black 156, charcoal 62, oak 9, ornate 23, walnut 20, maple 8, white 32}}.
- tagsaudit desktop PASS, phone PASS (n=310, all lists empty, dmt 0, mute silent).
- gen.py → _worker.js 2,801,967 B; splice → execute.js 2,868,834 B. Cloudflare execute, account 3c1fddf0…, tjm-tag-gallery-preview, branch preview-251.
- Deployment id f12ac0ce-13c7-45ea-80d9-9a7821c674c4 (replaces 48a0fdf4)
- URLs: https://f12ac0ce.tjm-tag-gallery-preview.pages.dev/play/ · https://preview-251.tjm-tag-gallery-preview.pages.dev/play/ (both serve index-BYbK3KOX.js)
- Note: live smoke logs a CORS error fetching tjm-play-layouts…workers.dev/layout/tags from the preview origin; not touched by this change.
- Rollback: restore /tmp/*.preclash, rebuild, redeploy.
