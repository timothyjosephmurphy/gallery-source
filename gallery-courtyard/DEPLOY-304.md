# DEPLOY #304 + #402 to preview-251 (Mon Oct 26 2026, ~3:15 PM PT)

Result: **PASS → deployed (1 deploy)**

- Source: /workspace/play-tags, including src/phone304.js (#304 tap-to-move + floating stick) and src/muralLod402.js (#402 mural LOD, wired in tags.js)
- Build: `npm run build` OK; dist/assets/main-BDxKG3Dv.js
- tagsaudit (vite preview :4317/play/): desktop PASS, phone PASS. n=310, no size/overlap/plaqueY/blocked/unreachable/floating/doorway issues, forbid 0, mute silent, no page errors
- gen.py → _worker.js 2,532,361 B (forbid False); splice.py → execute.js 2,598,815 B
- Cloudflare execute, project tjm-tag-gallery-preview, branch preview-251, env preview
- Deployment id 6e6193dd-10ad-42d3-a467-61e58cb24f9e
- URL: https://6e6193dd.tjm-tag-gallery-preview.pages.dev/play/ (200)
- Branch alias: https://preview-251.tjm-tag-gallery-preview.pages.dev/play/ (200)
