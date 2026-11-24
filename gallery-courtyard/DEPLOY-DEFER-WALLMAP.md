# DEPLOY: defer wallmap.js (#291), Oct 26 2026 (PT)

- Source: /workspace/play-tags/src/tags.js. Static `import { installWallMap }` removed. The finish() install now runs as `afterPlayable(() => import('./wallmap.js').then(...))` with the same args and lazy world/drone getters. Errors on install or import set `window.__wallMap = { err }`. The `wallMap = null` declaration is kept, and update() still null-guards it. The module sets window.__wallMap itself when it is ready. Backup: /tmp/tags.js.pre-defer-wallmap.
- Build: main 866.81 kB → 859.70 kB (main-CxO9h2cw.js, 228.17 gz), a drop of 7.11 kB. New chunk wallmap-CXbxeSiK.js 7.43 kB (3.60 gz).
- Smoke (tests/_smokewallmap.mjs, local desktop + phone): __wallMap err null, rooms 14, go is a function, n=310. The only console noise is local 404s for assets missing from local dist.
- tagsaudit local: desktop PASS, phone PASS. wallmapaudit (?tour=0): PASS with 14 rooms, 15 escorts, tap goes to room-01, no fails.
- gen.py → _worker.js 2,803,739 B; splice → execute.js 2,870,714 B. Cloudflare execute, account 3c1fddf0…, tjm-tag-gallery-preview, branch preview-251.
- Deployment 61358e16-7ab4-4108-957c-fb44ae4a3ede replaces 8ca52137. main and the wallmap chunk return 200 on both URLs.
- URLs: https://61358e16.tjm-tag-gallery-preview.pages.dev · https://preview-251.tjm-tag-gallery-preview.pages.dev
- Rollback: restore /tmp/tags.js.pre-defer-wallmap, rebuild, gen, splice, execute.
