# frames-301 — moulding maps for Gallery (#301)
Geometry is Gallery's (shared instanced frame). These are just maps; regenerate via `python3 make.py`.
- Strip UV: U along moulding (tiling), V across profile: back 0–.10, outer bevel .10–.34, face .34–.72, step/cove .72–.88, liner lip .88–1.
- Material: MeshStandard, metalness 0, frame-black{,_n,_r,_ao}.webp; normal OpenGL +Y. Phone: `*.phone.webp`.
- Optional liner: frame-liner-gold.webp on lip band (metal .6, rough .45) — muted, use or keep all-black.
- Contact shadow: frame-contact-shadow.png (RGBA ring) on one instanced quad just behind frame, ~10% larger, no lights needed.
- Suggested depth 38 mm off wall, face 55 mm, liner 8 mm. Keep UV in world mm so scaling doesn't stretch.
Preview only; nothing deployed.
