# BMAG image refresh — studio-tracker #476 (Oct 26, 2026)
Method: Pillow 13 + ImageCms, Display P3 → sRGB (perceptual), Lanczos to long side 2000, JPEG q90, sRGB ICC embedded. No crop/stretch.

| Work | Master | Master dims / profile | Output | Before | After | sha256 |
|---|---|---|---|---|---|---|
| Hope | /workspace/fwdiag/m/hope-the-vermillion-aurora.jpg | 6740×3370 / none (treated sRGB) | bmag/hope-the-vermillion-aurora-2000px-srgb.jpg | 2000×1000, 592,800 B (Oct 23) | 2000×1000, 417,438 B | 172b7f81aae8defddfd9ce36a38c3d73697a4157056c273ebce457cabc176fc0 |
| Honeybadger | /workspace/print-masters-incoming/honeybadger-and-cub-2026-10-26/honeybadger-and-cub-with-genesis-block.jpg | 4683×7338 / Display P3 | bmag/honey-badger-and-cub-with-genesis-block-2000px-srgb.jpg | 1276×2000, 560,937 B (#471) | unchanged | e99ef7139d17caa576cfdbeeb4ff3c35c5cf19515909283374f3da4ac93b6c9e |
| Syrenka | /workspace/fwdiag/m/warszawska-syrenka.jpg | 4984×7120 / Display P3 | bmag/warszawska-syrenka-2000px-srgb.jpg | 1400×2000, 1,239,732 B (Oct 23) | 1400×2000, 886,877 B | 81da6127d4cebb6c933b766bfa82b2a2ab927e8865c2a5412f4f0e2478bb7c30 |

Backups: hope/warszawska `*.bak-2026-10-26-bmag-refresh`; application.md.bak-2026-10-26-bmag-refresh.
Skipped: Honeybadger rewrite — #471 output is pixel-identical to a fresh render from the current master (no backup made).
application.md: only Honeybadger row master path/dims and 2000px dims (was stale 4816×6880 / 1400×2000) + one pointer line. Submission status, bids, cover note untouched.
Not done (out of scope): form submit, BMAG email, site/R2, Gallery, portfolio PDF. #410 untouched.
