# Hex campus landscape skins — 2026-10-30 (rebuilt to Gallery lock)

Does NOT replace #352 Cascades plates. Soft holds / plaques untouched. No play-tags / Gallery repo edits.

## Bosphorus vista (fountainIstanbul811 partial open cylinder)
| file | px | notes |
|---|---|---|
| masters/bosphorus-vista.png | 4096×2048 RGBA | master |
| wire-ready/bosphorus-vista.webp | 4096×2048 RGBA | q82, ~581 KB |
| phone/bosphorus-vista.phone.webp | 2048×1024 RGBA | q82 |
Single composite (sky + far shore/mosques + Bosphorus bridge + water + ferries) — no separate layers in v1.
Source: Runway watercolor `refs/runway-bosphorus-b.png` (2752×1536), Lanczos to 4096 wide, centre-cropped to 2:1. Not an upscale of live procedural bands.
Seams: partial arc — alpha smoothstep fade over outer 12% of width each side (L/R fade to 0); top 4% soft alpha into dome; bottom fully opaque water (tuck below waterline, no crop line). Map u 0→1 across arc.

## Trees (GLB, primary) — three.js r-local + GLTFExporter, meshopt (EXT_meshopt_compression QUANTIZE, NodeIO pattern from props2 common.py)
| file | tris | KB |
|---|---|---|
| pine-01-lod0 / lod1 | 2308 / 234 | 198 / 23 | fir 9 m
| pine-02-lod0 / lod1 | 2812 / 276 | 241 / 26 | spruce 12 m
| pine-03-lod0 / lod1 | 1804 / 192 | 156 / 19 | fir 7 m
| pine-04-lod0 / lod1 | 3064 / 276 | 262 / 26 | narrow 14 m
All validate with `gltf-transform validate` (0 errors). Static, no animation.
Hooks: root node `Pine01`…`Pine04`; children meshes `trunk`, `crown`. Materials `pine_trunk`, `pine_foliage` (MeshStandard, vertex colors #3F6A34/#4D7A3C/#6E9A4A, brown trunk, roughness 0.9–1; foliage double-sided). Readable without IBL.
Axes: metres, y up, origin at trunk base (y=0). Radially symmetric so forward is irrelevant (nominal +Z). Instancing: random Y rotation + scale 0.8–1.25; use InstancedMesh per node (trunk+crown) per LOD; swap LOD1 ~>40 m. Place outside walkable poly behind container780.

## Tree billboards (fallback/supplement)
| file | px |
|---|---|
| wire-ready/tree-billboard-01..03.webp | 1024×2048 RGBA, base at bottom edge, soft alpha |
| phone/tree-billboard-01..03.phone.webp | 512×1024 |
Sources: rembg alphas fir-solo-a, spruce-solo-a, cluster-trio-a (masters/ PNGs kept).

## Housekeeping
Old horizon-*/bosphorus-vista-full-painted*/tree(s)-* ship files moved to `_quarantine/`; old horizon masters in `masters/_superseded/`.

## License
Original art for TJ / Vermillion Aurora Productions hex gallery; generated/procedural for this project, not third-party stock.

## CDN hint
R2 `play/preview-251/bosphorus-vista/` and `play/preview-251/trees-199/` → `https://img.tjm.art/play/preview-251/...`
