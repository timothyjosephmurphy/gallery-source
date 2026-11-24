# #301 frame moulding variants (extends ../frames-301, which is untouched)
These use the same strip UV convention as #301. U runs along the moulding and tiles seamlessly, about one repeat per 0.6 m (keep U in world mm). V runs across the profile from 0 (back/wall) to 1 (canvas lip). Bands are: back 0–.10, outer_bevel .10–.34, face .34–.72, step_cove .72–.88, liner_lip .88–1.0. The height profile is the same as frame-black, so the same geometry and instancing work.

## Maps
Each variant has `<id>.webp` (2048×256 albedo), `<id>_n` (normal, OpenGL +Y), `<id>_r` (roughness) and `<id>_ao`. Each comes with a `.phone.webp` (1024×128) and a `.png` master.
- **frame-walnut**: warm oiled walnut with warped long grain and pores. Metalness 0, envMap 0.5.
- **frame-white**: gallery white satin float with faint brush and warm/cool watercolor drift. Metalness 0.
- **frame-dark-ornate**: near-black with a carved vine/leaf scroll in the face band and a bead row in the cove. The relief mostly lives in the normal map, with slight warm wear on high points. Metalness 0, envMap 0.7. The motif period is 1/16 U.
- **frame-liner-silver**: 2048×64 pewter lip. Map it to v .88–1.0 with metalness .6 and rough .4, the same as the gold liner.

Contact shadow: reuse `../frames-301/frame-contact-shadow.*`.

## When to use which
| content | frame | liner |
|---|---|---|
| portraits (Father Paul, Reiki, Attendees) | walnut | gold |
| landscapes (default) | black (#301) | gold |
| small watercolors | white | silver |
| festival / Burning Man, Temples (optional) | dark-ornate | silver or gold |

`frames-variants.json` mirrors frames.json and adds the variant and liner entries. `preview.png` shows walnut, white, ornate and the existing black frame on Dawn Plaster.

Regenerate with `python3 make.py` (numpy + Pillow, the same stack as frames-301; seed 3012).
