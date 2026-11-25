# Honeybadger and Cub master refresh: DEPLOYED (Mon Oct 26 2026, ~4:58 PM PT)
Source: print-masters-incoming/honeybadger-and-cub-2026-10-26/honeybadger-and-cub-with-genesis-block.jpg, 4683×7338, Display P3. Converted P3→sRGB with ImageCms, LANCZOS. sha256 642e4188…696f.
Aspect changed from 0.700 to 0.638 (the new master is taller and narrower).

## Assets
- gallery-hi R2 `gallery-hi/honeybadger-and-cub-with-genesis-block-2400.webp`: 1532×2400, 378,552 B, q84 m5. img.tjm.art 200 with the new size. Local copy in gallery-hires-338/out/. hires-338.json maxW 1532 / maxH 2400.
- gallery-wall R2 `gallery-wall/642e41887b71ddcd6bef61b4f178d5bf0150e7537af45283f5f030478b47696f-960.webp`: 960×1504, 182,920 B. This is a new key; the old 5661ac7a…-960 is untouched. The unbusted URL may serve an edge-cached 613×960 (82,246 B) from an earlier upload until the cache expires. The aspect is the same, so nothing stretches.
- play/art 163×256, 7,134 B: play-tags/public/art and vermillionaurora/static/play/art.
- sticker306/honeybadger-and-cub.webp 163×256, 5,728 B. The old file was 256×154 landscape; the new one is portrait at the master's aspect.

## Catalog (play-tags/src/catalog.json + catalog.base.json)
- painting: hi → the new gallery-wall 960 key; max → gallery-hi 2400 (maxW 1532); w/iw 0.9573 (catalog.json) or 0.6382 (base) at the same h; fw adjusted to match; trueW 0.6382
- plaque/tag entry tex: tjm.art/gallery-images/honeybadger-and-cub-2026.jpg → https://img.tjm.art/gallery-hi/honeybadger-and-cub-with-genesis-block-2400.webp
- tools/realdims.json: px 163×256, hiPx 960×1504 (doorcheck aspect gate)
- Backups: /tmp/hb/*.pre

## Deploy
- Build includes the #465 stickerBot306 beam-aim fix (main-DugwC-B0.js, stickerBot306-z857ribW.js)
- tagsaudit desktop PASS, phone PASS (/tmp/hb/ta-*.log). gen.py → _worker.js 2,802,491 B; splice → execute.js 2,869,478 B
- Cloudflare execute, tjm-tag-gallery-preview, branch preview-251. Deployment **86c3189d-8143-4229-90fa-30c58668ae52** replaces 61358e16.
- Verified live: main has the new hi key and the sticker chunk has aimFrom.
- Website note: preview proxies /play/art/ to tjm.art/play/art/, which still serves the old 179×256 (5,402 B). The low-res base thumb shows the old art until hi loads, until Website ships vermillionaurora/static/play/art/honeybadger-and-cub-with-genesis-block.webp (already regenerated).
- Rollback: restore /tmp/hb/catalog*.pre + realdims.json.pre, rebuild, gen, splice, execute.
