# Wiring the exhibition pins (Gallery)
**Wait until Writer sets `exhibitions-349.json` `approved: true`.** Until then, do not wire.
- Upload to `/img/play/preview-251/testimap/` (as exhibitions-pins-sheet*.webp) or to the sibling folder `/img/play/preview-251/exhibitions-pins/`.
- Same layout as the testimap pins: 3×128 px cells, default/hover/selected (offsets 0, 1/3, 2/3). Phone uses `pins-sheet-64`.
- Anchor: tip at x 0.5, y 0.97 from the top, so sprite.center = (0.5, 0.03). Sizes 0.14/0.16/0.18 m (0.16 minimum on phone), same as collector pins.
- Legend: `legend.webp` (512×160) goes in the map UI next to the collector key.
