# Hex landscape source art — 2026-10-30

New high-fidelity masters for Gallery wire (not soft upscales of existing bands). Soft holds / plaques untouched.

## Drop-in horizon plates (match `#352` / `horizon352.js`)

Same names as `public/horizon/`:

| File | Size | Notes |
|------|------|-------|
| `wire-ready/horizon-distant-range.webp` | 2048×512 RGBA | Primary distant Bosphorus ridgeline (lavender/rose, gold crest lines) |
| `wire-ready/horizon-distant-range.png` | 2048×512 | Same, lossless |
| `wire-ready/horizon-distant-range@2x.png` | 4096×1024 | Master for future |
| `phone/horizon-distant-range.phone.webp` | 1024×256 | Phone |
| `wire-ready/horizon-mid-valley.webp` | 2048×512 RGBA | Mid band: sage hills + blue water |
| `wire-ready/horizon-mid-valley.png` / `@2x.png` / phone | same pattern | |
| `*-alt.*` | same sizes | Alternate takes (B) if A doesn’t fit lighting |

Cylinder uses `repeat.set(3,1)` — plates are continuous ridgelines; spot-check seams after deploy.

## Optional painted full vista

- `wire-ready/bosphorus-vista-full-painted.webp` (2048×512) + `@2x.png` (4096×1024)  
  Watercolor Bosphorus-style sky+mountains+water (TJ landscape palette refs). Use if you want a filled band instead of alpha silhouette plates.

## LANDSCAPES nicer trees (replace `container780` conical pines)

Alpha billboards (PNG + webp):

| Asset | Approx size | Use |
|-------|-------------|-----|
| `wire-ready/tree-spruce-solo.png` | ~1200×2048 | Single spruce billboard |
| `wire-ready/tree-fir-solo.png` | ~1200×2048 | Single fir billboard |
| `wire-ready/trees-cluster-trio.png` | ~2674×2048 | Dense 3-tree cluster |
| `wire-ready/trees-evergreen-treeline.png` | ~1991×1024 | Wide treeline strip behind container |
| `phone/*.phone.webp` | half-res | Low path |

Wire suggestion: `MeshBasicMaterial` / `MeshStandardMaterial` with `map` + `alphaTest` ~0.4–0.5, `DoubleSide`, instanced planes facing camera or fixed along the container back line. Keep decor-only (no colliders), same as current pines.

## Paths

Root: `/workspace/visual/hex-landscape-2026-10-30/`  
Also mirrored note under `/workspace/notes/HEX-LANDSCAPE-2026-10-30.md`.

## Provenance

- Horizon plates: new 4:1 2K gens → black-sky → alpha → resize (not upscales of live bands).
- Painted vista: generated with TJ watercolor landscape stills as style refs.
- Trees: new hi-fi renders + rembg alpha cutouts.
