# #19 Loupe UI chrome (preview only, approved: false)
These sprites complete `size-price-plaques-19/`. Gallery owns the interaction and draws runtime text. The style is brushed brass with a Gilded Ochre `#F7CC3A` inner line, a `#15100b` face and soft Dusk Slate `#5E7289` / light-blue glass refraction. No text is baked in.

## Files (each as .png master + .webp, RGBA)
| id | px | use |
|---|---|---|
| lens-ring-desktop / -phone | 512² / 256² | Rim with a transparent glass center. Render the magnified art in a circle of `glass_radius_px` (198 / 99) centered on `center_px`, then draw the ring on top. |
| reticle-desktop / -phone | 512² / 256² | Low-opacity crosshair and degree ticks. Draw it centered over the ring (suggested opacity 0.8). It can be toggled off. |
| back-chip-desktop / -phone | 256×80 / 128×40 | Brass pill with a baked chevron. "Back" goes in `labelRect_px` in `#F7DC8C`. |
| cursor-loupe-128 / -64 | 128² / 64² | Magnifier cursor with the hotspot at the lens center (0.40, 0.40). A CSS line is in loupe.json. |

`loupe.json` uses the same conventions as #337 and the #19 plaques: px rects are top-left origin, and UV is v-up.

## Placement
Center the lens on the pointer or aim point. Put the back chip at the top-left of the loupe view, with a 16 px inset (8 px on phone). Use the phone set at ≤ 600 px viewport width.

## Regenerate
`python3 make.py` (Pillow only, seed 19, 4× supersampled). `preview.png` shows the set over a mock artwork on a dark wall.
