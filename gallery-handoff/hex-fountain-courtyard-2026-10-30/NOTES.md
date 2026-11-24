# Fountain Courtyard art pack — courtyard-fountain-sw (2026-10-30)
Original art for TJ / Vermillion Aurora. Soft holds untouched. Does NOT touch Cascades #352 plates, Bosphorus vista #852, container780 pines, or play-tags/Gallery repo. Separate from hex-cascades-courtyard pack.

## Fountain (replaces procedural fountain811 geometry)
| file | tris | KB |
|---|---|---|
| wire-ready/fountain-ottoman-lod0.glb | 3,544 | 60 |
| wire-ready/fountain-ottoman-lod1.glb | 1,432 | 35 |
EXT_meshopt_compression (required, QUANTIZE) — load with MeshoptDecoder. Built in build/fountain.mjs (gltf-transform; no Blender).
- Metres, y-up, origin = ground centre. **Basin outer r = 1.35** (collider contract unchanged), plinth r 1.47, finial tip y 2.71.
- Hooks: `FountainOttoman` > `basin`(>`basinBand`), `waterBasin`, `column`(>`columnBand`), `bowlMid`, `waterMid`, `bowlTop`, `waterTop`, `finial`, `spouts`(>`spout0..7`).
- Materials: Marble #e9e4d8, MarbleShade #cfc6b4, Copper #b0703c (metal), Verdigris #4f9a86, **Water** #2f7f9a BLEND α0.62 double-sided (animate opacity / UV), **IznikBand** (white factor; texture NOT embedded).
- Gallery: set `IznikBand.map = iznik-band.webp` (sRGB, wrapS=Repeat). basinBand UV wraps once around the 8 facets; columnBand repeats 2×. Octagonal basin is flat-faceted; bowls/column smooth (48 seg LOD0 / 16 LOD1).

## Iznik band
wire-ready/iznik-band.png/.webp 2048×256 (seamless horizontally: source strip + mirror), phone/iznik-band.phone.webp 1024×128. Master in masters/.

## Mosaic floor
wire-ready/mosaic-floor_albedo.png/.webp 1024² seamless (offset-blend of refs/mosaic-floor-gen-a.jpg), + mosaic-floor_roughness.webp, mosaic-floor_normal.webp (derived, OpenGL +Y). phone/mosaic-floor_albedo.phone.webp 512².
Suggested repeat: **1 tile = 1.25 m** (range 1.0–1.5). Use sRGB for albedo only.

## CDN hints
play/preview-251/fountain-811/ (GLBs + iznik-band) · play/preview-251/mosaic-floor/
## Refs
refs/: walk shot, fountain-courtyard-prove.png, generated mosaic + iznik sources.
