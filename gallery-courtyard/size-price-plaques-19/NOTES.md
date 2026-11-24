# #19 size/price plaque chrome (preview only, approved: false)
These are empty brass card plaques for the Loupe and size/price feature. Gallery owns the interaction and Writer or runtime supplies the copy. **No text is baked into any texture.** The style matches `plaque-overlay-337/` and `story-plaques/`: a brushed brass frame, a Gilded Ochre `#F7CC3A` inner line, a dark `#15100b` face, a deco fan and diamond crest under the title band, a thin divider between the size and price lines, three tiny diamonds at the bottom, and four screw bosses.

## Files
| file | px | notes |
|---|---|---|
| plaque-desktop.png/.webp | 512×640 (4:5) | world ≈ 0.20 × 0.25 m |
| plaque-phone.png/.webp | 256×320 | same layout at ½ scale |
| plaque-nfs-desktop / plaque-nfs-phone | same sizes | empty pill outline in the statusChip area plus a small terracotta dot. "Not for sale" is drawn at runtime. |
| corner-ornament-128/256 | copied from #337 | optional reuse |
| plaques.json | | rects in px (top-left origin) and UV (v-up), as in #337 overlay.json. Also ink colours and suggested font px. |
| preview.png | | both desktop variants next to a stand-in artwork on a Dawn Plaster wall |

## Rects (fractions of W×H, top-left origin)
titleBand 0.12–0.88 × 0.13–0.30 (optional) · sizeLine × 0.40–0.54 · priceLine × 0.58–0.72 · statusChip 0.28–0.72 × 0.79–0.88.

## Placement
Hang the plaque beside the artwork's lower right edge, centered at about 1.35 m. It is a compact tall card, so it stays clear of the picture lights. Do not stretch it; keep the 4:5 ratio. If there is no title, leave titleBand empty because the crest rule still reads well. Alpha is 0 only at the rounded outer corners.

## Regenerate
`python3 make.py` (Pillow only, seed 19, deterministic).
