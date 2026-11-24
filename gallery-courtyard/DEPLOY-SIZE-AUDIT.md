# play-tags deploy size audit (read-only) — Oct 26 2026

## What actually counts
The binding limit is **not** dist size. `deploy/gen.py` inlines files into one `_worker.js` (`const F={...}`), and `splice.py` JSON-embeds it into `deploy/execute.js`, which goes through the **MCP ~4 MB payload cap**. Today: `_worker.js` 3,988,574 B and `execute.js` 4,051,994 B, so about **0 KB headroom**. Cloudflare's own Worker limit (3 MB gzip on free, 10 MB on paid) is looser than this.

What gets embedded:
| Bucket | Raw | In worker (base64 ≈ ×1.33) |
|---|---|---|
| Text (html/js/css/manifest), all of dist except art/pbr/plaques | 1.95 MB (main.js 894K, museum.config 691K, eggs-run 272K) | ~1.95 MB |
| courtyard/*-296* (medallion 117K, ring 88K, domes 156K, 12 signs) | 606 KB | ~0.81 MB |
| art/*-288*, *-317* (two book-art 317s = 357K) | 419 KB | ~0.56 MB |
| plaques (re-encoded /tmp/*.webp, not the 3.7 MB PNGs) | 340 KB | ~0.45 MB |
| horizon/*.webp | 134 KB | ~0.18 MB |

Proxied, not embedded: `/art/`, `/pbr/` → tjm.art/play, plus /tjm/, /mva/, /img/.
**Neither embedded nor proxied** (so they **404 on preview**): fence/, frames/, window-glows/, light-shafts/, testimap/, courtyard/sunburst-295-*. That's why fence-iron 404s: gen.py only picks up image files in the explicit loops.

Sizes: public/ 8.6 MB, dist/ 12 MB, /tmp/ptbuild-358g/dist 12.2 MB. The biggest public files are the plaque PNGs (1.56 MB, 1.10 MB, 627K, 527K; already shipped as webp), sunburst-295-2048 (496K), and pbr wall/floor diff+nor (452K/385K/331K, proxied).

## Next visual wave vs budget
| Pack | Raw (desktop+phone) | Base64 |
|---|---|---|
| fence | 618 KB | 0.82 MB |
| window-glows | 599 KB | 0.80 MB |
| light-shafts (gobos?) | 261 KB | 0.35 MB |
| testimap | 81 KB | 0.11 MB |
| frames | 76 KB | 0.10 MB |
| night, gobos, group labels | not in public/ yet | ? |
Total ≈ **1.64 MB raw / ~2.2 MB embedded**. **It does not fit** with the current method. Even phone-only variants alone would overflow, because the budget is already at zero.

## Ranked plan
1. **Proxy all image packs instead of embedding them** (biggest win, low risk). Upload fence/, frames/, window-glows/, light-shafts/, testimap/, courtyard/, horizon/ and the 317 art to tjm.art/play/ (or img.tjm.art / R2), then add those prefixes to `PROXY`. This frees ~2.0 MB now and removes the 2.2 MB the next wave would add, and it also fixes the fence 404. Risk: needs one upload step plus a check that the origin serves the right content-type/CORS (the proxy already sets CORS).
2. **Proxy the plaques too** (frees ~0.45 MB, low risk).
3. **Code-split or lazy-load `museum.config` (691K) and `eggs-run` (272K)**, or serve the hashed /assets/*.js from the origin (frees up to ~0.96 MB, medium risk because it touches the build/router).
4. **Use phone variants only on the preview** if proxying is not possible (frees roughly 50–70% per pack, medium risk: desktop looks worse).
5. Housekeeping (no effect on the cap): dist289/dist295/dist1022 and /tmp/ptbuild-* are stale; the 3.7 MB plaque PNGs in public/ could become webp-only.

After step 1 the worker drops to about 2 MB (text only), which leaves ~2 MB of headroom for code growth.

## WIRE-STATUS — cut #1 (Oct 26 2026, 2:45 PM PT)
- Uploaded 81 objects to R2 `tjm-images` under `play/preview-251/`: fence (8), frames (12), light-shafts (8), window-glows (12 + glows.json), testimap (3), horizon day (4) + night (6), group-labels (28 + labels354.json). Live at https://img.tjm.art/play/preview-251/... (200, image/webp, ACAO *).
- Loaders now use `/img/play/preview-251/<pack>/`: horizon352.js (horizon + fence + night), frames.js, shafts357.js, glows358.js, testimap.js, groupLabels354.js. Phone/desktop selection unchanged.
- gen.py: horizon embed loop disabled (now proxied); PROXY regex now also allows `.json`. Backup: deploy/gen.py.bak-pre251img.
- Not deployed. Before preview: rebuild dist, run gen.py, confirm _worker.js size drop, smoke-test /img/play/preview-251/fence/fence-iron_albedo.webp through the worker. Dev server (vite) has no /img proxy — add one or accept missing packs locally.
- Not covered: courtyard/sunburst-295-* and courtyard/*-296, art 317, plaques (cuts #1 tail / #2).

## Measured after cut #1 (Oct 26 2026, horizon embed off, packs on R2)
- `npm run build` OK (1 warning: Vite chunk size limit). Then gen.py + splice.py.
- deploy/_worker.js: 3,838,495 B (headroom 161,505 vs 4,000,000; 355,809 vs 4,194,304)
- deploy/execute.js: 3,904,465 B (headroom 95,535 vs 4,000,000; 289,839 vs 4,194,304)
- gen.py: horizon loop disabled (`[] if True`), PROXY regex includes `json`. Not deployed.

## Cut #2 (Oct 26 2026, ~2:50 PM PT, not deployed)
- Moved to R2 tjm-images: 16 courtyard/*-296.webp → play/preview-251/courtyard-296/; 4 art/*-317.webp → play/preview-251/art-317/ (20 objects, all OK; sample GETs 200 with matching sizes).
- src/courtyard296.js BASE → `img/play/preview-251/courtyard-296/`. gen.py: -296 embed loop off; -317 dropped from art embed; worker rewrites `/art/*-317.webp` → `/img/play/preview-251/art-317/` (hang-overrides.json untouched). Local worker test: both paths 200 with correct bytes.
- sunburst-295-* was never embedded: courtyardstyle.js already loads it from R2 preview-295 (200), so nothing to move.
- Still embedded on purpose: art lisa-climbing-tahoma-cropped-288 (#288, approved:false, 33 KB) and plaques (4, ~340 KB webp; left alone pending egg/teaser check).
- Sizes: _worker.js 3,838,495 → 2,515,433 B (−1,323,062); execute.js 3,904,465 → 2,581,381 B (−1,323,084; headroom ~1.42 MB vs 4,000,000).
- Backups: deploy/gen.py.bak-pre-cut2, /tmp/courtyard296.js.bak.
