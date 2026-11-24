# studio-tracker #471 — Honey Badger + Cub Visual-lane refresh (2026-10-26)

New master (read-only): print-masters-incoming/honeybadger-and-cub-2026-10-26/honeybadger-and-cub-with-genesis-block.jpg, 4683×7338, Display P3 ICC. Converted P3→sRGB (embedded sRGB ICC), Lanczos, JPEG q90. Aspect 0.70 → 0.64: long-edge targets held, short edge follows. All originals backed up as `*.bak-2026-10-26`.

## Changed
- bitcoin-art-sales/bmag/honey-badger-and-cub-with-genesis-block-2000px-srgb.jpg — 1400×2000 → 1276×2000 (561 KB)
- creative/artbook/prompts/2026-10-26/honeybadger-and-cub-2026.jpg — 1680×2400 → 1680×2632
- creative/presskit/images/07_honeybadger-and-cub-with-genesis-block_2026.jpg — 1060×1600 → 1021×1600
- creative/cassandra/runway-take-M/style-refs/07_honeybadger-and-cub-with-genesis-block_2026.jpg — byte-identical copy of the presskit file
- creative/cassandra/runway-take-M/style-refs/honeybadger-and-cub-2026-24cec820be-1600.webp — 1600×2286 → 1600×2507 (made fresh from the master; Website cache not used)
- moo-cards/backs/07_…_2026.jpg, backs-no-qr/07_…_2026.jpg, stickers-metallic/honeybadger-and-cub.jpg — 1125×675, 300 dpi. Painting rotated 90° and cover-cropped to match the old layout. The old backs and backs-no-qr files were identical (no QR on card 07), so all three new files are identical. The README lists these as TJ's own Moo pack, with no other owner named. Note: print-package zip and upload-50/ were NOT rebuilt.

## Skipped / blocked
- White border: white-border-report-317.md row 271 lists the piece as clean (0/0/0/0). A quick check of the new master's edges (mean luma 118–167) shows no white border. No crop files made.
- Portfolio PDFs (TJ_Murphy_Portfolio_2026.pdf + -small.pdf, pp 13 & 18) and Art Book p52: BLOCKED. portfolio/work has no PDF build script. sheet.py only makes contact sheets. portfolio.html/book.html exist, but the render and stitch pipeline isn't written down. PDFs left as they were so nothing ends up half-built. Next step: re-render the HTML → PDF with the page images swapped, then run Ghostscript /ebook for -small (see NOTES-43-small.md).
- masters.json / usage_portfolio.json: not changed. Wait for Website to publish the new print-master hash.

## Website coordination
No writes to site/, R2, print-masters/prints.json, Gallery play-*/museum/vm-540, or the wt-honeybadger-swap cache. Website owns the swap-image --master step.

Time: 0h 10m

## Finish slice (2026-10-26, ~17:40 PDT)
- masters.json: honeybadger-and-cub-with-genesis-block → static/print-masters/b5e3cc51f4c79a45a79438011150c1548c5ff821ed6948251d1792c5d6f27257.jpg, [4683, 7338]. Only this entry changed, same list-of-lists format. Backup: masters.json.bak-2026-10-26.
- Portfolio PDFs: swapped one image in place with pikepdf (venv /workspace/pdfvenv). Backups: *.pdf.bak-2026-10-26.
  - TJ_Murphy_Portfolio_2026.pdf p13: image /X45 (only used here) 1778×2540 → 1621×2540. Converted P3→sRGB, JPEG q90, DeviceRGB. Kept the height of the image box. Narrowed its cm width (1334.375 → 1216.54) and re-centred it, so the 0.64 aspect isn't stretched.
  - p18 is the text index (title, 100 × 70 cm, 2026). It has no image, so nothing to change.
  - TJ_Murphy_Art_Book.pdf p52: image /X158 1820×2600 → 1659×2600, same method (cm 1365.625 → 1244.46 wide, centred).
  - Checked by rendering both pages and running pdfinfo on all PDFs.
  - -small.pdf rebuilt with gs /ebook at 150 dpi: 19 pp, 2.34 MB (it was 1.44 MB in #43, probably because of slightly different gs flags; fine for screen use).
- PR 737 still OPEN at 17:41 PDT. The hash is staged here until it merges.
Time: 0h 05m (this slice). Lane total ~0h 15m.
