# Testimonials world map — art only (studio-tracker #293)
Preview-only art for the courtyard TestiMap face (`/workspace/model-polish/props2/testimonials-map-lod0/1.glb`, face 5.6 x 2.8 m, `TestiFace_Unlit`). Nothing in props2 was modified.

- **Data:** pin positions still come from the tjm.art/testimonials JSON / build step. Gallery owns the mesh, wiring, and lat/lon to UV conversion (formula in `map.json`). The pins in `preview.png` are fake demo points.
- **Map:** original procedural equirectangular map. The coarse continent outlines were traced by hand and noise-warped, with no tiles or third-party map data. Washes use palette.md colours: Horizon Blue ocean fading to Dawn Plaster at the coasts, one bright colour per continent, and a Dusk Slate coastline and graticule.
- **Textures:** albedo `map-albedo-2048` (desktop) and `-1024` (phone), webp + png. Optional `map-normal-*` / `map-roughness-*` add slight continent relief. Use them only if the face moves to a lit (Standard) material, at normalScale ~0.35.
- **Pins:** `pins-sheet.png` is 384x128 RGBA in 3 cells: default terracotta, hover coral (+10%), selected ochre with sparkle (+18%). `pins-sheet-64.png` is the phone-size version. The tip sits at the cell bottom-centre. Suggested sprite size: 0.14 m (0.16 m minimum on phone).
- **Regenerate:** `python3 make.py` (seeded with 293, so output is deterministic).
- **Known simplifications:** small islands are stylized, the Mediterranean and Caspian are omitted, and Antarctica is a band.
