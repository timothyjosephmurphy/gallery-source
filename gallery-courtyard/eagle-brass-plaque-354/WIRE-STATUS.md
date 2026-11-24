# WIRE-STATUS — eagle brass plaque (#354), Oct 26 2026, ~2:55 PM PT
- R2 (tjm-images): play/preview-251/eagle-brass/eagle-brass-plaque.desktop.webp (5548 B), .phone.webp (1618 B). curl https://img.tjm.art/... → 200 image/webp, default image cache-control. PNG master not uploaded.
- Code: new /workspace/play-tags/src/eagleBrass354.js; tags.js imports it + calls installEagleBrass354 next to installGroupLabels354.
- Loads /img/play/preview-251/eagle-brass/ (desktop or phone on LOW), draws blank brass to canvas, overlays locked caption "Sunrise on Rainier with Eagle — TJ Murphy" (title italic line, name line). ?eaglebrass=0 disables; debug window.__eaglebrass354.
- Placement: 0.40×0.16 m, centre y 1.11 m, offset along wall to painting's +t side (fw/2 + 4 cm + 0.20 m ≈ 1.03 m from painting centre), 1.2 cm off wall. That is the same side as the existing square eagle art plaque (eagle-plaque.png, y 1.45, bottom ≈1.225 m) — brass sits under it (top 1.19 m, ~3.5 cm gap), beside painting lower area (painting spans 1.057–1.543 m). Other side is crowded by ridge strips. Clear of lamp bar above painting.
- Build: vite → /tmp/ptbuild-eagle/dist, 0 errors (chunk-size warning only).
- NOT done: no Pages deploy, no GH comment. Untouched: #19 size/price/loupe, hang-overrides, eggs, tour/wallmap, BOOK_DEFS, #335.
- Remaining: visual check on preview (desktop + 390×844) after next approved deploy; gen.py must keep /img/ proxy (it does); tune Y_C/GAP if the gap under the eagle art plaque looks tight.
