# DEPLOY: defer plaqueEnlarge337 (#337), Oct 26 2026 (PT)

- Source: /workspace/play-tags/src/tags.js. Static import removed. The finish() install now runs as `afterPlayable(() => import('./plaqueEnlarge337.js').then(...))` with the same args `{ game, root }`. Errors on install or import set `window.__plaque337 = { err }`. A successful install sets `window.__plaque337Installed = true`, because the module only sets __plaque337 when a plaque opens. Backup: /tmp/tags.js.pre-defer-plaque337.
- Build: main 869.83 kB → 866.81 kB (main-DylarUg-.js, 231.25 gz), a drop of 3.02 kB. New chunk plaqueEnlarge337-D3USKiYK.js 3.45 kB (1.79 gz).
- Smoke (tests/_smokeplaque.mjs, local desktop + phone, plus live phone): __plaque337Installed true, __plaque337 null (no err), n=310. Console noise: local 404s for assets not in local dist, and on live a CORS error on the tjm-play-layouts fetch. Neither comes from the plaque module.
- tagsaudit local: desktop PASS, phone PASS.
- gen.py → _worker.js 2,803,338 B; splice → execute.js 2,870,278 B. Cloudflare execute, account 3c1fddf0…, tjm-tag-gallery-preview, branch preview-251.
- Deployment 8ca52137-984d-4059-9326-be4f78b12353 replaces b76bfecd. Both the plaque chunk and main return 200 on both URLs.
- URLs: https://8ca52137.tjm-tag-gallery-preview.pages.dev · https://preview-251.tjm-tag-gallery-preview.pages.dev
- Rollback: restore /tmp/tags.js.pre-defer-plaque337, rebuild, gen, splice, execute.
