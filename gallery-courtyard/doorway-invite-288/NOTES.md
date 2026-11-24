# #288 inviting doorway textures (preview only, approved: false)
With the colonnade gone, every opening should read as a lit invitation rather than a grey hole. Colours come from palette.md. These are original procedural textures and no game assets were copied. No text is baked in.

| asset | px (desktop / phone) | blend | world | placement |
|---|---|---|---|---|
| threshold-glow | 1024×512 / 512×256 | **additive**, depthWrite off | 3.0 × 1.5 m | Floor decal. Put the top edge (v=1) on the door line so the glow spills into the room. |
| arch-reveal | 1024×64 / 512×32 | normal, opaque, RepeatWrapping U (64 px period) | 4.0 × 0.25 m | Strip along the inner jambs and arch. The gilt edge faces the opening. |
| header-banner | 1024×192 / 512×96 | normal, opaque | 2.4 × 0.45 m | Above the lintel. The empty `labelRect` takes a group-labels-354 plaque or a room sign, or can stay blank. |

Files: `<id>.png` (master), `<id>.desktop.webp`, `<id>.phone.webp`.

## Day/night
Glow intensity is 0.45 by day, 0.8 at dusk and 1.0 at night. Ramp it with the window-glows-358 / horizon night curve. Also add a warm interior fill (about Gilded Ochre or Apricot) so the room beyond never reads as a dead grey.

`doorway.json` has the blend, UV notes, sizes and intensities. `preview.png` is a doorway mock.

Regenerate with `python3 make.py` (Pillow only, seed 288).
