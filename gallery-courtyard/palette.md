# tjm.art/play — Courtyard Exterior Palette & Sunburst Trim

| Name | Hex | Use |
|---|---|---|
| Dawn Plaster | `#F3E6D8` | Main wall field (primary facade); tesserae highlights in floor |
| Apricot Glow | `#F7A66E` | Alternate wall color; arch ray (odd); floor mid-ring |
| Rose Quartz | `#E9A9A6` | Alternate wall color; arch ray (even); floor ring |
| Terracotta Ember | `#C8644E` | Accent walls; arch outer band; floor outer ring |
| Sunrise Coral | `#F48A5C` | Strong entrance rays in floor; roofline cap/cornice; trim tick marks |
| Horizon Blue | `#9DB7CF` | Accent walls; floor outer edge (sky) |
| Dusk Slate | `#5E7289` | Door surrounds, shutters, arch outline/keystone base |
| Gilded Ochre | `#F7CC3A` | Arch sun core; door hardware & small accents; floor center |
| Grout Ash | `#B9AFA4` | Floor grout; stone sills & plinths |
| Sea Sage | `#8FAE9E` | Accent walls; planter/shutter alt |
| Complement Blue | `#5E9ADB` | Blue accent mid shade: ~12% of floor tesserae (mixed light/mid/deep) evenly scattered; dome-glass-blue base |
| Contrast Violet | `#9A78CF` | Violet accent mid shade: ~12% of floor tesserae (mixed light/mid/deep) evenly scattered |
| Blue Light | `#8DB8E8` | Blue accent light shade |
| Blue Deep | `#3A6FB8` | Blue accent deep shade |
| Violet Light | `#B9A0E0` | Violet accent light shade |
| Violet Deep | `#6E4FA8` | Violet accent deep shade |

## Placement spec
- **Walls:** alternate Dawn Plaster / Apricot Glow / Rose Quartz / Horizon Blue / Sea Sage / Sunrise Coral — one per hex building.
- **Trim & window frames:** Dawn Plaster on colored walls; Dusk Slate on Dawn Plaster wall.
- **Door surrounds:** Dusk Slate with a thin Gilded Ochre inner reveal.
- **Sunburst arches over entrances:** 21 alternating Apricot Glow / Rose Quartz rays with Dawn Plaster gaps, Sunrise Coral band, Dawn Plaster ring, Gilded Ochre sun core, Terracotta Ember ticks, Dusk Slate outer rim (see trim-motif.png).
- **Roofline:** Terracotta Ember cornice cap over a Dawn Plaster frieze.
- **Shutters:** Dusk Slate (Sea Sage alternate).
- **Accents:** Gilded Ochre hardware, lamps, house numbers.

## Dome glass (leaded panes, dome-glass-*.png)
- **dome-glass-orange:** pane tint `#F7A66E`, alpha 0.42 (±0.04 per pane, ~#F7A66E6B)
- **dome-glass-blue:** pane tint `#5E9ADB`, alpha 0.38 (±0.04 per pane, ~#5E9ADB61)
- **Lead came:** `#3A3432`, alpha 0.92 (~#3A3432EB), diamond quarries ~90 px

## Mosaic pieces
- Room signs: Grout Ash bed, Dusk Slate letters, Dawn Plaster field with light blue/violet/apricot flecks, Terracotta/Gilded Ochre border.
- Checkout ring: Apricot field, Dusk Slate CHECKOUT letters, Terracotta/Ochre rims.
- Sun medallion: Gilded Ochre core, Terracotta ring, 16 gold rays over Dawn Plaster with blue/violet flecks, Dusk Slate/Ochre rim.

## Sign & checkout placement
See signs.json. 12 curved mosaic signs, each an arc band spanning 24° at 0.80 × apothem (band 0.11 × apothem), two per entrance at the entrance angle ±15° (6° clear gap between neighbours). Two checkout portals with CHECKOUT rings at 0° and 180° (opposite sides, in the hex corners between entrances), center 0.97 × apothem from center, ring diameter 0.20 × apothem (shrunk from 0.31 so it clears the adjacent signs at 0.80 ± 0.06 × apothem and sits about 0.12 × apothem inside the wall faces).

## Floor
Center Gilded Ochre → Apricot Glow → Rose Quartz → Sunrise Coral → Horizon Blue at the hex edges, blended ~28% toward Dawn Plaster for pastel; 24 fine rays alternate with Dawn Plaster; six strong Terracotta Ember rays aim at the six entrances (flat-top hex, edge midpoints at 30°+60°k); Grout Ash grout; ~12% evenly scattered blue tesserae (random mix of #8DB8E8 / #5E9ADB / #3A6FB8, slight per-tile jitter) as an orange complement; ~12% evenly scattered violet (#B9A0E0 / #9A78CF / #6E4FA8 mix) against the sunny yellow; ~14 px irregular tesserae.
