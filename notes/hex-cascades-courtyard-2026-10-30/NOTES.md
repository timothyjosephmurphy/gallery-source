# hex-cascades-courtyard-2026-10-30 — START courtyard Cascades walk pack (day)
Original art for TJ Murphy / Vermillion Aurora (license: original, owned by TJ). Built 2026-10-30 (PT).
Scope: #352 horizon plates, courtyard trees (replace berlinCourt810 icosa clusters), steeples784 towers.
**Does NOT touch** nest-852 Bosphorus vista (`bosphorus-vista`) or container780 pines (`pine-01..04` / trees-199). Soft holds untouched. No play-tags / Gallery repo edits. Day Cascades only; night companions later.

## Files
| path | size | dims / tris | notes |
|---|---|---|---|
| masters/horizon-distant-range.png | 1375.7 KB | 2048×512 RGBA | L/R edge Δ 3.6 |
| masters/horizon-distant-range@2x.png | 3126.9 KB | 4096×1024 RGBA | L/R edge Δ 3.0 |
| masters/horizon-mid-valley.png | 908.6 KB | 2048×512 RGBA | L/R edge Δ 2.0 |
| masters/horizon-mid-valley@2x.png | 2781.7 KB | 4096×1024 RGBA | L/R edge Δ 1.6 |
| wire-ready/court-tree-01-lod0.glb | 16.1 KB | 702 tris | nodes: CourtTree01, trunk, crown |
| wire-ready/court-tree-01-lod1.glb | 5.9 KB | 94 tris | nodes: CourtTree01, trunk, crown |
| wire-ready/court-tree-02-lod0.glb | 19.6 KB | 898 tris | nodes: CourtTree02, trunk, crown |
| wire-ready/court-tree-02-lod1.glb | 6.4 KB | 115 tris | nodes: CourtTree02, trunk, crown |
| wire-ready/court-tree-03-lod0.glb | 12.6 KB | 506 tris | nodes: CourtTree03, trunk, crown |
| wire-ready/court-tree-03-lod1.glb | 5.4 KB | 73 tris | nodes: CourtTree03, trunk, crown |
| wire-ready/court-tree-04-lod0.glb | 58.0 KB | 3584 tris | nodes: CourtTree04, foliage |
| wire-ready/court-tree-04-lod1.glb | 4.6 KB | 128 tris | nodes: CourtTree04, foliage |
| wire-ready/court-tree-05-lod0.glb | 55.0 KB | 3158 tris | nodes: CourtTree05, trunk, crown |
| wire-ready/court-tree-05-lod1.glb | 8.2 KB | 210 tris | nodes: CourtTree05, trunk, crown |
| wire-ready/horizon-distant-range.webp | 85.3 KB | 2048×512 RGBA | L/R edge Δ 5.3 |
| wire-ready/horizon-mid-valley.webp | 96.1 KB | 2048×512 RGBA | L/R edge Δ 14.0 |
| wire-ready/steeple-tower-b-lod0.glb | 14.2 KB | 392 tris | nodes: SteepleTower, shaft, spire, cross |
| wire-ready/steeple-tower-b-lod1.glb | 8.5 KB | 144 tris | nodes: SteepleTower, shaft, spire, cross |
| wire-ready/steeple-tower-lod0.glb | 14.1 KB | 392 tris | nodes: SteepleTower, shaft, spire, cross |
| wire-ready/steeple-tower-lod1.glb | 8.3 KB | 144 tris | nodes: SteepleTower, shaft, spire, cross |
| phone/horizon-distant-range.phone.webp | 32.9 KB | 1024×256 RGBA | L/R edge Δ 7.1 |
| phone/horizon-mid-valley.phone.webp | 26.3 KB | 1024×256 RGBA | L/R edge Δ 14.0 |

preview/plates-tiled-x2.jpg — both plates tiled ×2 over dawn gradient (seam check).
src/ — plates.py (mid-valley), distant.py (distant-range), build.mjs (GLBs; gltf-transform NodeIO + EXT_meshopt_compression QUANTIZE, props2 COMPRESS pattern, no CLI meshopt).

## #352 plates (drop-in, same filenames)
- 2048×512 RGBA, sky alpha=0 above ridgelines; phone 1024×256; @2x 4096×1024 masters (Lanczos of master — fill is 1280px-source so @2x is nice-to-have only).
- Works with RepeatWrapping ×3, ClampToEdge V, alphaTest 0.02, BackSide unchanged.
- **distant-range**: integer-frequency seamless ridge mask (two tiers + one Rainier-ish snow peak per tile → 3 around the cylinder), filled with painterly watercolor texture sampled from gen-cascades-distant-a (wrap-crossfaded), violet/lavender haze, apricot rim on far tier, rose rim on near tier, snow streaks on peak.
- **mid-valley**: painted watercolor foothills (gen-cascades-mid-a) luminance-keyed off white paper, unpremultiplied, wrap-crossfaded 18% for L/R seam; peach dawn back hills → sage → green front with gold ridge outlines. Ridges sit from ~8% down.
- Seam: L/R edge mean Δ ≤ ~4 on masters (verified by ×2 tile). Webp edge Δ higher only in alpha=0 pixels.
- vs old: old were flat procedural sine-noise bands with uniform gradient fill; new have hand-painted watercolor texture, granulation, layered depth haze, real snow peak.
- Runway refs (runway-cascades-a/b.png) were truncated PNGs (only top ~1/3 decodable) — not used.

## Court trees — CDN `play/preview-251/court-trees/`
Root `CourtTree0N`; children `trunk` + `crown` (01,02,03,05) or single `foliage` (04 mound bush). Metres, y-up, origin at ground under trunk, vertex colours (COLOR_0) on one material `CourtTree0N_Mat` (white base; use vertexColors). Low-poly faceted style matching the courtyard.
- 01 fir 9 m · 02 narrow spruce 12 m · 03 broad fir 7 m · 04 mound bush cluster ~3 m tall ×6 m wide (mid-field clusters) · 05 mixed fir pair + bushes (8 m).
- Palette base #2f5a26/#3b6b30/#24492a → tips #6E9A5C. Suggested: instance 04/05 on berlinCourt810 slope in place of icosa (scale 0.6–1.2, random yaw), 01–03 near fence/steeples.

## Steeples — CDN `play/preview-251/steeples-784/`
Root `SteepleTower` > `shaft`, `spire`, `cross`. Origin ground under shaft centre, +Z forward (dormer on +Z), y-up, metres.
- steeple-tower: 3.2 m shaft ×15 m + 9 m 4-sided spire + gilt cross (top ≈ 25.6 m). Plinth, string courses, corner buttresses, slit windows, open belfry (corner piers + mullions + dark bell core), 4 corner pinnacles.
- steeple-tower-b: 2.8 m × 13 m + 8 m (second, slightly smaller twin for variety).
- Colours stone #c9bba4 / #b3a58e, roof #4f6b63, cross #d8b46a (vertex colours).

All GLBs well under budget (LOD0 ≤ 3.6k tris / ≤ 58 KB; LOD1 ≤ 210 tris / ≤ 9 KB). No billboards needed.
