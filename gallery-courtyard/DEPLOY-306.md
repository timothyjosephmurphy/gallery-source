# DEPLOY #306 sticker bot to preview-251 (Mon Oct 26 2026, ~3:26 PM PT)

Result: **PASS → deployed (1 deploy)**

- Source: /workspace/play-tags incl. src/stickerBot306.js (wired in tags.js) + public/sticker306/ (sticker-bot.glb v3, 4 legs; 3 stand-in sticker webps)
- Build: `npm run build` OK; dist/assets/main-r9U7qNs7.js; dist/sticker306/ has glb + 3 webps
- tagsaudit (vite preview :4317/play/): desktop PASS, phone PASS. n=310, no size/overlap/plaqueY/blocked/unreachable/floating/doorway issues, dmt 0, mute silent, no page errors
- gen.py change: gen.py only embedded .html/.js/.css, so /sticker306/*.glb|webp would have 404'd. Added a dist/sticker306 embed loop (binary, base64). Backup: deploy/gen.py.bak-pre306
- gen.py → _worker.js 2,956,401 B (DMT False); splice.py → execute.js 3,023,135 B (under 4 MB MCP cap)
- Cloudflare execute, account 3c1fddf0…, project tjm-tag-gallery-preview, branch preview-251, env preview
- Deployment id c2d14ea6-2550-400d-85be-c55c24e940cd
- URL: https://c2d14ea6.tjm-tag-gallery-preview.pages.dev/play/ (200)
- Branch alias: https://preview-251.tjm-tag-gallery-preview.pages.dev/play/ (200)
- /play/sticker306/: sticker-bot.glb 200 model/gltf-binary 288,756 B (byte-identical to dist); el-zonte-at-dawn / honeybadger-and-cub / warszawska-syrenka .webp all 200 image/webp
- Open: leg count 4 vs spec 3; GLB not draco/meshopt-compressed yet. No Selected Galleries changes.
