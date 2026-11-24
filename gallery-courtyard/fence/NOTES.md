# Courtyard edge fence textures — #352 (preview-only)
Original procedural (Pillow/numpy, seed 352); regenerate `python3 make.py`. No scraped/game assets.

**Style: thin dark wrought-iron pickets.** ~88% of each bay is transparent, so the horizon plates (../horizon/) stay readable; dark iron #2B2F38 gives a crisp silhouette against rose/apricot sky and sage ridges, and holds in PNW gray light. Post-and-rail rejected: horizontal boards would cut across the ridgelines.

## Gallery wiring
- One plane per bay, 2 m × 1 m; repeat.x = bay length / 2 m, wrapT clamp. `alphaTest:0.5, side:DoubleSide`, no depthWrite issues (cutout, not blend).
- Albedo + roughness (~0.6, metalness ~0.6) + normal (OpenGL). Phone: `*.phone.webp`.
- Posts: Gallery mesh, every 2 m at tile seams, color #2B2F38.
- Optional: `fence-ground-ao-strip.webp` as multiply decal (2 m × 0.5 m) under the fence line.
- Order: sky → distant range → mid valley → fence (opaque cutout, normal queue). Top rims carry Apricot Glow #F7A66E to echo the ridge rim light; sun-ring cores Gilded Ochre.
preview.png: fence tiled 2× over mid-valley plate + roughness / normal / AO strip / raw albedo.
