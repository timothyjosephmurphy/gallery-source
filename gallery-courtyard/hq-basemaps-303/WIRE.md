# Wiring #303 base maps (for Gallery)
Upload `textures/*` to `/img/play/preview-251/hq-basemaps-303/` (Gallery does the upload). Mapping is in `wire.json`.
- `<kind>.webp` → `map` (sRGB); `_n` → `normalMap`; `_r` → `roughnessMap` (flagstone only, plain roughness, set `roughness:1`, drop aoMap/metalnessMap, metalness 0). Plaster/ashlar have no `_r`: use a constant roughness (~0.9 / 0.85).
- Mesh `color` white or a light tint. The old tints (0xB8ADA0 / 0x6E665E) make it muddy (see hq-assets/report.md integration notes).
- Use the same world-planar UV as overlays303 (1 m base tile). The macro multiply (÷3.5, 0.18/0.2/0.22) stays as it is and now sits on these maps, not a flat colour.
- Low/phone tier: load `.phone.webp` siblings.
