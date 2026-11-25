# DEPLOY meshopt sticker-bot glb — preview-251 (Mon Oct 26 2026, ~3:42 PM PT)

Result: **PASS → deployed (1 deploy)**

- Source: /workspace/play-tags (not a git repo). src/stickerBot306.js imports MeshoptDecoder, loads sticker306/sticker-bot-meshopt.glb (97,132 B vs 152,800 quantized; original sticker-bot.glb untouched). Doc: MESHOPT-STICKER.md
- Build: `npm run build` OK
- Smoke (vite preview :4317/play/, headless Chrome swiftshader): window.__stickerBot306.state = "ready", no err, no page/meshopt console errors; glb 200 97,132 B
- tagsaudit: desktop PASS, phone PASS — n=310, all lists empty, doorsUnreachable none, forbid 0, mute silent, pageErrors none, colliders 99
- gen.py → deploy/_worker.js 2,907,820 B (packs all 5 sticker306 files incl. sticker-bot-meshopt.glb + sticker-bot.glb); splice.py → execute.js 2,974,624 B
- Cloudflare execute, project tjm-tag-gallery-preview, branch preview-251
- Deployment id 4628c2f2-9be1-495d-8e3c-e6ad820b142f (replaces 843208d6 egg-17)
- URL: https://4628c2f2.tjm-tag-gallery-preview.pages.dev/play/ (200)
- Branch alias: https://preview-251.tjm-tag-gallery-preview.pages.dev/play/ (200; serves index-M4VCFQeP.js; meshopt glb 200 97,132 B)
- Rollback: /tmp/stickerBot306.js.bak (pre-meshopt js)
