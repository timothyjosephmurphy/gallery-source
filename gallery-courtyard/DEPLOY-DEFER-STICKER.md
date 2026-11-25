# DEPLOY: defer stickerBot306 + stickerWalls307 (#306/#307), Oct 26 2026 (PT)

- Source: /workspace/play-tags/src/tags.js. Static imports for 306 and 307 removed. One `afterPlayable` imports stickerBot306 and installs it, then imports stickerWalls307 and installs it. Each step warns on failure and sets `window.__stickerBot306` / `__stickerWalls307 = { err }`. Backup: /tmp/tags.js.pre-defer-sticker.
- Build: main 877.98 kB → 869.83 kB (main-BH7WnGEu.js, 232.38 gz), saving about 8 kB. New chunks: stickerBot306-CSnJqDJg.js 5.80 kB (2.87 gz) and stickerWalls307-lVyPOdci.js 2.82 kB (1.59 gz). GLTFLoader/meshopt stays in main because other main code uses it too, so the saving is small.
- Smoke (local vite preview with tests/_smokesticker.mjs, plus live phone): __stickerBot306 {state 'ready', legsFound 3}. __stickerWalls307 has keys state/held/onWall/picked/rejected/caps and no err. n=310.
- tagsaudit local: desktop PASS, phone PASS, pageErrors [].
- gen.py → _worker.js 2,802,828 B; splice → execute.js 2,869,745 B. Cloudflare execute, tjm-tag-gallery-preview, branch preview-251.
- Deployment b76bfecd-c316-4e03-a659-229551469ca7 replaces f12ac0ce. Both sticker chunks return 200.
- URLs: https://b76bfecd.tjm-tag-gallery-preview.pages.dev · https://preview-251.tjm-tag-gallery-preview.pages.dev
- Rollback: restore /tmp/tags.js.pre-defer-sticker, rebuild, gen, splice, execute.
