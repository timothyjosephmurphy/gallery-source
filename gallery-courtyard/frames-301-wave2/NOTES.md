# #301 frame variants, wave 2 (oak, maple, float-charcoal, copper liner)
These use the same strip UV as `../frames-301` and `../frames-301-variants`. U runs along the moulding and tiles seamlessly, about one repeat per 0.6 m. V runs across the profile from 0 (back/wall) to 1 (canvas lip). Bands are: back 0–.10, outer_bevel .10–.34, face .34–.72, step_cove .72–.88, liner_lip .88–1.0. Each variant has `<id>.webp` (2048×256), `_n` (OpenGL +Y), `_r` and `_ao`, each with a `.phone.webp` (1024×128) and a `.png` master.

- **frame-oak**: light golden oak with open pores and rays. Metalness 0. Use for warm landscapes, Bass Coast Sunrises and Forest Triptych.
- **frame-maple**: pale hard maple with a subtle curl figure. Metalness 0. Use for light watercolors and Hummingbirds.
- **frame-float-charcoal**: thin modern float, near-matte (roughness about .72). It has a flatter profile and a baked shadow-gap reveal at v .70–.76. Use for contemporary work, Bitcoiners and large canvases.
- **frame-liner-copper**: 2048×64 strip with faint patina. Map it to v .88–1.0 with metalness .65 and rough .42.

Contact shadow: reuse `../frames-301/frame-contact-shadow.*`. The schema is in `frames-wave2.json`, and `preview.png` shows all three frames with the copper liner.

Regenerate with `python3 make.py` (numpy + Pillow, seed 3013; it shares helpers with the variants generator).

## WIRE STATUS
LIVE on preview-251, deployment 1e2ce12b (Oct 26 2026). See ../DEPLOY-FRAMES-301-WAVE2.md.
