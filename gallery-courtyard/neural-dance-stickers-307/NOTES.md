# Neural Dance pose stickers — studio-tracker #478 (for #307)
- 10 poses, all **procedural** (`make.py`, seed 307, deterministic). Mural JPEG extraction skipped: 882×196 strip too small/muddy for clean die-cuts; procedural silhouettes read better.
- Fill #2A2430, 1px-ish cream (#FAF0DE) edge highlight, white organic die-cut border following silhouette (8px desktop / 5px phone).
- Desktop long side 304px, phone 152px. PNG + lossless WebP with alpha.
- strip-sheet: poses 01–08, **transparent** gaps (12px) so SlotMouth can sit it on any surface; paper #F3E6D8 only used in preview.png.
- atlas.webp: 5×2, 320px cells; frame rects in stickers.json.
- Graphic vinyl silhouettes are intentional here (not painting treatment).
- Runtime: ~1 min (MaxFilter at 4× supersample).
