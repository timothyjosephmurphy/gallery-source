# #337 plaque overlay panel (preview-only, approved: false)

This is the screen-space/world overlay panel shown when a story plaque is aimed at and clicked. Gallery owns the interaction and layout, and Writer owns the copy. **No text is baked into any texture.** The body is an empty dark translucent field, and runtime text goes into the rects listed in `overlay.json`.

The style matches `story-plaques/` (brass room plates and the dark `#15100b` face): brushed brass frame, a Gilded Ochre (`#F7CC3A`) inner gilt line, a darker title band, a brass rule with a deco fan + diamond crest, deco quarter-fan corner ornaments with screw bosses (bottom corners baked in), and a brass ring-X close mark (top-right).

## Files
| file | px | notes |
|---|---|---|
| overlay-desktop.webp / .png | 1600x1000 (1.6, same aspect as plaques) | world 1.20 x 0.75 m if billboarded in 3D |
| overlay-phone.webp / .png | 900x1200 portrait | world 0.60 x 0.80 m, or a DOM/CSS full-width panel |
| corner-ornament-256 / 128 .webp/.png | RGBA, drawn as the top-left corner | flip X/Y for the other corners |
| overlay.json | | rects (UV v-up + px top-left), close hit-circle, alpha, ink colours, suggested font px |
| preview.png | | both panels with title (blue) and body (green) rects plus lorem stand-in text (preview only) |
| make.py | | `python3 make.py` regenerates everything (numpy+PIL, deterministic) |

## Usage hints
- Use `MeshBasicMaterial({map, transparent:true, depthTest:false, toneMapped:false})` with a high renderOrder, or use the PNG/WebP as a CSS background-image (9-slice is not needed at the fixed aspect).
- Body alpha is 0.86 over `#15100b`. Body ink `#EDE3CF` and title ink `#F7DC8C` both exceed 12:1 contrast. Over bright scenes, add a 0.35 black backdrop.
- Close hit: use `close_hit_px/uv` (radius already padded 1.4x for touch). Esc and click-outside are Gallery's call.
