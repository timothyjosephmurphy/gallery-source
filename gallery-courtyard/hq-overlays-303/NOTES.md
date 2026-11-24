# #303 macro-variation overlays + fountain water

Gaps addressed (hq-assets/report.md):
- L199 (Seamless tiling check): "plaster, ashlar and flagstone show a faint repeat at 3x3 (single-tile scale), so use larger repeat sizes or a macro-variation overlay." → macro-plaster / macro-ashlar / macro-flagstone.
- L184 (Not covered): "fountain water ... have no new art." → water-surface (+_n, _r).

Files: desktop .webp/.png (macro 2048², water 1024²) and `.phone.webp/.png` (macro 1024², water 512²). Existing hq-assets maps untouched.
- Macros: soft warm-gray cloud mottling, white = no change, darkest ≈ #C8BEB6..#D6C8BC. Multiply at 0.15–0.25 with macroUV = baseUV/3.5 (see overlays.json).
- Water: RGBA albedo (calm slate-sage teal, soft caustic lines, alpha 0.59–0.82), OpenGL normal, roughness 0.04–0.14. Not neon.
- All tileable (periodic noise, wrap-padded blur); wrap-edge pixel steps checked.

preview.png: top = base tiles 3x3+ only, bottom = with macro multiply 0.2. preview-water.png: water over stone colour.
Regenerate: `python3 make.py` (Pillow only, seed 3033, deterministic).
