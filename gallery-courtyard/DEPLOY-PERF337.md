# DEPLOY perf + #337 — preview-251 (Mon Oct 26 2026, ~3:05 PM PT)

Result: **PASS → deployed (1 deploy)**

- Source: /workspace/play-tags (not a git repo; no commit hashes)
- Present in src: plaqueTex.js (tierPlaqueTex, tags.js:21), frames.js bounding-sphere frustum cull, plaqueEnlarge337.js installed (tags.js:23 import, tags.js:222 install), plus plaqueReader337.js
- Build: `npm run build` (testimonials + doorcheck + vite) OK; main-DjsVDFO3.js 934 kB, museum.config 691 kB, eggs-run 272 kB
- tagsaudit (vite preview of dist, :4317/play/): desktop PASS, phone PASS — n=310, no size/overlap/plaqueY/blocked/unreachable/floating/doorway, dmt 0, mute silent, no page errors
- gen.py → deploy/_worker.js 2,526,497 B; splice.py → deploy/execute.js 2,592,826 B
- Deployed via Cloudflare connector execute, account 3c1fddf0…, project tjm-tag-gallery-preview, branch preview-251
- Deployment id 3ebde7b4-7203-4d02-8d28-c23451913fdf
- URL: https://3ebde7b4.tjm-tag-gallery-preview.pages.dev/play/
- Branch alias: https://preview-251.tjm-tag-gallery-preview.pages.dev/play/ (200; serves index-DOghGeg8.js / main-DjsVDFO3.js)
- No layout PUT/DELETE.
