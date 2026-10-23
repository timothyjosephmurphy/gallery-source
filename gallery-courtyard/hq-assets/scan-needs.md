# Painting scan needs (#303 item 4)

Read-only audit of every painting in the tag gallery catalog (`play-tags/src/catalog.json`, 275 works) against its on-wall size. Nothing was edited or uploaded.

## Method

- **Display size:** `w` x `h` in metres from the catalog (these already include the 1.5x `artScale`).
- **Pixels on the wall:** `play-tags/tools/realdims.json` (`px` = small base image; `hiPx` = hi-res image the gallery swaps in when the visitor is within ~9 m, `gallery-core/src/main.js` hi-res queue). Current px = `hiPx` when the work has a hi-res URL, otherwise the base `px`. Hi-res sizes are taken from realdims.json as recorded, not re-measured from the live CDN.
- **Screen pixels:** camera vertical FOV 70° (gallery-core main.js), 1080p desktop, typical viewing distance 2.0 m -> 385.6 screen px per metre of wall. Texels per screen pixel = min(current px / screen px) over both axes.
- **Flag:** under 2.0 texels per screen pixel. **Wanted px** = 2 x screen px at 2 m per axis, rounded up to 64, capped at 4096 on the long edge.
- **Priority:** P1 < 0.75 texels/px (visibly soft/upscaled), P2 0.75 to 1.25, P3 1.25 to 2.0. Works with status `available` (for sale) are bumped P3 to P2.

## Result

- 275 paintings checked, **46 flagged** (P1: 0, P2: 11, P3: 35). The other 229 meet 2 texels per screen pixel at 2 m.
- Closer look: at a 1.0 m inspection distance (needs 2x the pixels) **104** works would be under 2 texels per screen pixel, so the list grows if TJ wants close-up sharpness; the CSV is for the 2 m case.
- Paintings that have only the small base image until the hi-res arrives show a 256 px-class image for a moment; that is a loading-order issue, not a scan need.
- No work is badly under-resolved (no P1). The weakest are wide watercolors shown larger than their file allows.
- **Source files:** 41 of the flagged works have no larger local file (only the R2/media URL); for those the fix is a new scan or photo from the original, and a larger source may not exist. Local candidates for `older-work-*` live in `split-paintings/<set>__*.png` (~2000+ px); mapping `original-N` to the exact file needs a human check. See `source_file`/`note` in the CSV.

## Flagged list (also in `scan-needs.csv`: slug, current px, wanted px, source file, priority + extras)

| Priority | Slug | Display m | Current px | Wanted px | Texels/screen px | Status | Source |
|---|---|---|---|---|---|---|---|
| P2 | painting-insect-garden | 1.96x1.01 | 578x298 | 1536x832 | 0.76 | available | https://tjm.art/gallery-images/insect-garden.jpg |
| P2 | painting-twin-dragons | 1.96x1.01 | 578x298 | 1536x832 | 0.76 | available | https://tjm.art/gallery-images/twin-dragons.jpg |
| P2 | rice-paddies-in-vietnam | 1.66x0.91 | 558x308 | 1280x768 | 0.87 | nfs | https://tjm.art/gallery-images/two-soldiers.jpg |
| P2 | painting-portrait-with-hat | 2.74x0.77 | 960x268 | 2176x640 | 0.91 | nfs | https://img.tjm.art/gallery-wall/06b6660bc24b59597f923ebfa869fe3bcbacae363f1b8cab9a6486a3c |
| P2 | painting-emergence | 1.22x1.01 | 434x360 | 960x832 | 0.92 | available | https://tjm.art/gallery-images/emergence.jpg |
| P2 | sunrise-on-rainier-from-denny-blaine | 2.74x1.05 | 1000x383 | 2176x832 | 0.95 | nfs | mva/images/book-galleries/v1/9ae261289a3bce952c6f.webp |
| P2 | painting-studio-figure | 0.91x0.68 | 480x358 | 768x576 | 1.36 | available | https://tjm.art/gallery-images/studio-figure.jpg |
| P2 | archived-painting-15 | 1.70x0.81 | 960x456 | 1344x640 | 1.47 | available | vm-540/static/display/archived-painting-15-1600.webp |
| P2 | hope-the-vermillion-aurora | 1.68x0.84 | 960x480 | 1344x704 | 1.49 | available | vm-540/static/display/hope-the-vermillion-aurora-856a57b627-1600.webp |
| P2 | painting-portrait-with-cheese | 0.91x0.51 | 558x310 | 768x448 | 1.58 | available | https://tjm.art/gallery-images/portrait-with-cheese.jpg |
| P2 | painting-chef-in-white | 0.51x0.91 | 360x648 | 448x768 | 1.84 | available | https://tjm.art/gallery-images/chef-in-white.jpg |
| P3 | sunset-in-el-zonte-el-salvador | 0.60x1.22 | 290x592 | 512x960 | 1.26 | nfs | https://img.tjm.art/wall-paintings/sunset-in-el-zonte-el-salvador-66c1e1ab57-290.webp |
| P3 | painting-lightburst | 0.59x1.22 | 288x600 | 512x960 | 1.28 | nfs | https://img.tjm.art/wall-paintings/painting-lightburst-c33406e958-288.webp |
| P3 | joaquim-in-zihuatanejo | 0.72x0.91 | 360x456 | 576x768 | 1.29 | sold | https://tjm.art/gallery-images/sunset-reflection.jpg |
| P3 | lisa-climbing-tahoma-at-sunrise-from-denny-blaine | 1.73x0.73 | 868x364 | 1344x576 | 1.3 | nfs | art/lisa-climbing-tahoma-cropped-288.webp |
| P3 | book-art-54ff45104a57a68d4beb | 0.90x0.91 | 460x467 | 704x768 | 1.32 | nfs | mva/images/book-galleries/v1/54ff45104a57a68d4beb.webp |
| P3 | book-art-b01b8695b2528cb850a3 | 1.71x0.84 | 900x442 | 1344x704 | 1.36 | nfs | mva/images/book-galleries/v1/b01b8695b2528cb850a3.webp |
| P3 | book-art-596837cb5ff533c620dd | 0.28x0.48 | 148x256 | 256x384 | 1.37 | nfs | img/play/preview-302/catherine-cream/596837cb5ff533c620dd.webp |
| P3 | book-art-a61c71e5de8cc1b71500 | 0.31x0.48 | 162x256 | 256x384 | 1.38 | nfs | img/play/preview-302/catherine-cream/a61c71e5de8cc1b71500.webp |
| P3 | book-art-7bce6e3509027d1f7a0b | 0.23x0.48 | 120x256 | 192x384 | 1.38 | nfs | img/play/preview-302/catherine-cream/7bce6e3509027d1f7a0b.webp |
| P3 | book-art-9209f1fd7d47f373597f | 0.20x0.48 | 109x256 | 192x384 | 1.38 | nfs | img/play/preview-302/catherine-cream/9209f1fd7d47f373597f.webp |
| P3 | book-art-94e2edf9a24c90950489 | 1.71x0.84 | 960x469 | 1344x704 | 1.45 | nfs | https://img.tjm.art/wall-paintings/book-art-94e2edf9a24c90950489-bfc815d54d-960.webp |
| P3 | archived-painting-20 | 1.71x0.85 | 960x475 | 1344x704 | 1.45 | nfs | vm-540/static/display/archived-painting-20-1600.webp |
| P3 | burning-man-temple-2022-pink | 1.71x0.87 | 960x488 | 1344x704 | 1.45 | nfs | vm-540/static/display/burning-man-temple-2022-pink-8c7eff3601-1600.webp |
| P3 | burning-man-temple-2022-flame | 1.71x0.86 | 960x481 | 1344x704 | 1.45 | nfs | vm-540/static/display/burning-man-temple-2022-flame-e2b7539ffd-1600.webp |
| P3 | book-art-deb3358c321671dae1fc | 0.93x1.71 | 542x1000 | 768x1344 | 1.51 | nfs | https://media.vermillionaurora.com/images/book-galleries/v1/deb3358c321671dae1fc.webp |
| P3 | sunrise-on-tahoma-from-denny-blaine | 1.71x0.43 | 1000x250 | 1344x384 | 1.51 | nfs | mva/images/book-galleries/v1/e6068e265bfdc379526c.webp |
| P3 | grandpa-howard | 0.51x0.91 | 308x556 | 448x768 | 1.58 | nfs | https://img.tjm.art/wall-paintings/grandpa-howard-c0035dc5a5-308.webp |
| P3 | daniel-portrait-1 | 0.49x0.91 | 304x570 | 384x768 | 1.62 | nfs | https://img.tjm.art/wall-paintings/daniel-portrait-1-52e78c730f-304.webp |
| P3 | book-art-6ef848d3ccb6b48184ab | 0.73x0.91 | 459x578 | 576x768 | 1.64 | nfs | mva/images/book-galleries/v1/6ef848d3ccb6b48184ab.webp |
| P3 | book-art-a26ad79970ed645ce1a9 | 0.55x0.91 | 355x586 | 448x768 | 1.66 | nfs | mva/images/book-galleries/v1/a26ad79970ed645ce1a9.webp |
| P3 | book-art-4350a257e5a6a5e75a31 | 0.91x0.83 | 595x541 | 768x704 | 1.69 | nfs | mva/images/book-galleries/v1/4350a257e5a6a5e75a31.webp |
| P3 | book-art-f367882aaeb0e32471eb | 0.91x0.91 | 602x608 | 704x768 | 1.72 | nfs | mva/images/book-galleries/v1/f367882aaeb0e32471eb.webp |
| P3 | book-art-044d157c01c7bb07eeab | 0.71x0.91 | 485x621 | 576x768 | 1.76 | nfs | mva/images/book-galleries/v1/044d157c01c7bb07eeab.webp |
| P3 | book-art-04f4a52773ffd19b4f67 | 0.55x0.91 | 375x628 | 448x768 | 1.78 | nfs | mva/images/book-galleries/v1/04f4a52773ffd19b4f67.webp |
| P3 | lake-in-the-north-cascades | 0.51x0.91 | 357x635 | 448x768 | 1.8 | nfs | mva/images/book-galleries/v1/7a3ad7bacdb71faac1b8.webp |
| P3 | book-art-e4bbfe556c3c847d9c90 | 0.88x0.91 | 613x635 | 704x768 | 1.8 | nfs | mva/images/book-galleries/v1/e4bbfe556c3c847d9c90-color.webp |
| P3 | book-art-b38b9ae1893908d604da | 0.51x0.57 | 360x400 | 448x448 | 1.81 | nfs | mva/images/book-galleries/v1/b38b9ae1893908d604da.webp |
| P3 | book-art-92fdb3112257f4fb66e8 | 0.91x0.51 | 651x365 | 768x448 | 1.85 | nfs | mva/images/book-galleries/v1/92fdb3112257f4fb66e8.webp |
| P3 | book-art-0e4564564eee5d70c105 | 0.49x0.57 | 360x418 | 384x448 | 1.9 | nfs | mva/images/book-galleries/v1/0e4564564eee5d70c105.webp |
| P3 | book-art-28bec44600b36ed0766f | 1.08x1.33 | 812x1000 | 896x1088 | 1.94 | nfs | https://media.vermillionaurora.com/images/book-galleries/v1/28bec44600b36ed0766f.webp |
| P3 | book-art-0735a5fb0eb1c613b658 | 0.74x0.91 | 560x690 | 576x768 | 1.96 | nfs | mva/images/book-galleries/v1/0735a5fb0eb1c613b658.webp |
| P3 | book-art-5a462e9705ba39d756a2 | 0.48x0.91 | 366x693 | 384x768 | 1.97 | nfs | mva/images/book-galleries/v1/5a462e9705ba39d756a2.webp |
| P3 | book-art-d6e03f6907615dac3797 | 0.79x0.91 | 603x694 | 640x768 | 1.97 | nfs | mva/images/book-galleries/v1/d6e03f6907615dac3797.webp |
| P3 | book-art-64a80ece808ac08d4877 | 0.57x0.61 | 436x465 | 448x512 | 1.98 | nfs | mva/images/book-galleries/v1/64a80ece808ac08d4877.webp |
| P3 | book-art-614d5b68dbe5052e302a | 0.91x0.84 | 701x641 | 768x704 | 1.99 | nfs | mva/images/book-galleries/v1/614d5b68dbe5052e302a.webp |

## Notes

- For the 10 flagged works whose source URL is a `tjm.art/gallery-images/*.jpg`, `tag-gallery/data/imgdims.json` records the same small size as the gallery shows (e.g. 578x298), so the website image itself is small: these need a **new scan or photo**, not just a re-export.
- `rice-paddies-in-vietnam` points at `.../two-soldiers.jpg` as its hi-res URL: the slug and file name disagree. Worth a human check that the right image is wired (not changed here).
- Wanted px assume a 1080p desktop at 2 m. Phones on the low tier cap textures well below this, so the wanted sizes apply to the desktop tier; the phone tier can keep a 1024 px cap.
- Re-run: the audit script is `scan_audit.py` in this folder (writes /tmp/scan_all.json and the CSV); inputs are catalog.json and realdims.json, both read-only.
