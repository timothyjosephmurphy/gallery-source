# DEPLOY white-border crops #317 wave2 — preview-251 (Mon Oct 26 2026, PT)

Result: **PASS → deployed (1 deploy)**

- Pre-check: latest LIVE 1e2ce12b (frames-wave2), nothing in flight.
- R2: 7/7 desktop webp → `tjm-images` `play/preview-251/art-317/<id>-317.webp` (0 retries; no png, no phone). Also copied to play-tags/public/art/<id>-317.webp. img.tjm.art spot-check 200 (archived-painting-2, book-art-596837…, yakes-2).
- src/hang-overrides.json (backup /tmp/hang-overrides.json.pre317w2): 7 asset entries, img → art/<id>-317.webp, hi → null, note `#317-wave2: …`. Long side kept, short side from crop aspect (override w×h, before → after):
  - book-art-596837cb5ff533c620dd 0.1863×0.3217 → 0.1934×0.3217 (crop aspect is wider than the old #1022 aspect, so w was recomputed instead of stretching; ×1.5 preview scale gives 0.2901×0.4825)
  - older-work-portraits-319-329-original-4 0.2157×0.2731 → 0.2385×0.2731
  - archived-painting-73 (new entry; base default-12in 0.1904×0.305) → 0.2125×0.305 (catalog 0.3187×0.4575 after ×1.5)
  - archived-painting-2 1.524×0.3887 → 1.524×0.3435. NOTE: it is in `exclude`, so it is not hung. The override is staged only.
  - book-art-74a736000a32427842b1 (new entry; catalog 0.889×0.7918) → 0.889×0.7827
  - older-work-ridge-strips-unindexed-original-6 0.3048×0.101 → 0.3048×0.0964
  - older-work-yakes-todd-dickerson-original-2 0.1904×0.2731 → 0.1831×0.2731
- tools/rd317.py (backup /tmp/rd317.py.pre317w2): entries noted `#317-wave2` now read real px from public/<img> instead of the old bordered real317 w480 sizes. realdims now matches the crops.
- apply-overrides.py OK (310 paintings, 57 hung). Build OK (index-C69A3LmR.js). tagsaudit desktop PASS, phone PASS (n=310, all lists empty, dmt 0, mute silent).
- gen.py → _worker.js 2,801,961 B; splice → execute.js 2,868,828 B. Cloudflare execute, account 3c1fddf0…, tjm-tag-gallery-preview, branch preview-251.
- Deployment id 48a0fdf4-049e-4743-b768-63d4cc09b2ee (replaces 1e2ce12b)
- URLs: https://48a0fdf4.tjm-tag-gallery-preview.pages.dev/play/ · https://preview-251.tjm-tag-gallery-preview.pages.dev/play/ (200, index-C69A3LmR.js; all 7 /play/art/<id>-317.webp 200 via rewrite)
- Skipped per NOTES: Catherine a61c71/7bce6e/9209f1 (no mat), lake-hillside-color-wheel-3 (wash in paper), Laura Maui 4bf5a0 (sky, not border).
- Not done: window.__frames rename (left for later).
- Rollback: restore the /tmp/*.pre317w2 files (hang-overrides, rd317, catalog.json, realdims.json), rebuild, redeploy.
