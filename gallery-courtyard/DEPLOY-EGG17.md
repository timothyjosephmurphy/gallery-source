# DEPLOY egg-17 ostrich pass:true — preview-251 (Mon Oct 26 2026, ~3:37 PM PT)

Result: **PASS → deployed (1 deploy)**

- Source: /workspace/play-tags (not a git repo)
- egg-17 purple ostrich collider `pass: true` (src/museum-eggs/eggs/agents.js:515); confirmed in built eggs-run
- Also included (parent request): src/catalog.json layout.hall.doorHeight = 3.5 (was already 3.5 in source; backup /tmp/catalog.pre-door35.json); confirmed in dist main-D3JuUlgY.js
- Build: `npm run build` (testimonials + doorcheck + vite) OK
- tagsaudit (vite preview :4317/play/): desktop PASS, phone PASS — n=310, no size/overlap/plaqueY/blocked/unreachable/floating/doorway, doorsUnreachable none, forbid 0, mute silent, no page errors, colliders 99
- gen.py → deploy/_worker.js 2,778,209 B; splice.py → deploy/execute.js 2,845,007 B
- Cloudflare execute, project tjm-tag-gallery-preview, branch preview-251
- Deployment id 843208d6-c8ff-4eee-8919-f60ed425a8ad
- URL: https://843208d6.tjm-tag-gallery-preview.pages.dev/play/ (200)
- Branch alias: https://preview-251.tjm-tag-gallery-preview.pages.dev/play/ (200; serves index-Cd68mLbH.js)
- No layout PUT/DELETE.
