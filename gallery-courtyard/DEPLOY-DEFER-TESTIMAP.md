# DEPLOY — defer testimap (#409) — Oct 26 2026 (PT)

- Source: /workspace/play-tags. tags.js: `afterPlayable(() => import('./testimap.js')…)`, no static testimap import (backup src/tags.js.pre-defer-testimap).
- Build OK: `testimap-TAaoBy1G.js` own chunk 73.24 kB (25.30 gz); main 877.57 kB; entry index-C6z0L4Qt.js.
- tagsaudit (local vite preview): desktop PASS, phone PASS — n=310, pageErrors [], all lists empty.
- Post-playable check: window.__testiMap present (wall/source/count/shown…), no testimap errors.
- gen.py incl. PERF-INVENT-2 plaque webps from public/plaques-webp/ → splice → Cloudflare execute.
- Deployment: 342b1d3c-c4d1-4db1-95e6-7e2c0dc46985 (project tjm-tag-gallery-preview, branch preview-251, env preview). Previous LIVE: 4628c2f2.
- URLs: https://342b1d3c.tjm-tag-gallery-preview.pages.dev · https://preview-251.tjm-tag-gallery-preview.pages.dev (serves index-C6z0L4Qt.js; testimap chunk 200).
- Not done: stickerBot306 deferral (held for Visual 3-leg overnight). Rollback: restore tags.js.pre-defer-testimap, rebuild, redeploy.
