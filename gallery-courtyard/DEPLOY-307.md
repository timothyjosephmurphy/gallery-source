# DEPLOY #307 stickers-on-walls + #306 updates to preview-251 (Mon Oct 26 2026, ~3:35 PM PT)

Result: **PASS → deployed (1 deploy)**

- Source: /workspace/play-tags: src/stickerWalls307.js (new), stickerBot306.js hook, quantized public/sticker306/sticker-bot.glb (152,800 B, was 288,756 B), 3 sticker306 webps.
- Pre-build: moved public/sticker306/sticker-bot.glb.bak to /tmp/sticker-bot.glb.pre-quant.bak so gen.py wouldn't pack it (it would have added ~385 KB as image/webp).
- Build: `npm run build` OK (doorcheck PASS); dist/assets/main--A9FxLw9.js (contains stickerWalls307)
- tagsaudit (vite preview :4317/play/): desktop PASS, phone PASS. n=310, no size/overlap/plaqueY/blocked/unreachable/floating/doorway/hud issues, forbid 0, mute silent
- gen.py → _worker.js 2,778,201 B (forbid False), packs /sticker306/ ×4; splice.py → execute.js 2,844,999 B
- Cloudflare execute, account 3c1fddf0…, project tjm-tag-gallery-preview, branch preview-251, env preview
- Deployment id 7d48b326-77d4-4585-b8cc-747d1a5661bc
- URL: https://7d48b326.tjm-tag-gallery-preview.pages.dev/play/ (200)
- Branch alias: https://preview-251.tjm-tag-gallery-preview.pages.dev/play/ (200)
- Live /play/sticker306/ (both hosts): sticker-bot.glb 200 model/gltf-binary **152,800 B**; el-zonte-at-dawn.webp 200 7,436 B; honeybadger-and-cub.webp 200 6,942 B; warszawska-syrenka.webp 200 9,420 B
