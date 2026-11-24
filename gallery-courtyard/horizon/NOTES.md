# Horizon backdrop plates — Gallery #352
Procedural painterly plates (Pillow, seed 352), built locally; no Runway credits spent. Regenerate with `python3 make.py`.

| Layer | Desktop | Phone | Master | Opaque variant |
|---|---|---|---|---|
| Distant range (Cascades + Rainier-style peak at x≈62%) | horizon-distant-range.webp 2048×512 RGBA | .phone.webp 1024×256 | .png | _baked.webp (rose→apricot sky baked in) |
| Mid valley / foothills (3 sage→lawn-green ridges) | horizon-mid-valley.webp 2048×512 RGBA | .phone.webp 1024×256 | .png | _baked.webp |

## Alpha vs opaque
Primary = **transparent alpha silhouettes**: the existing dawn sky (hq-assets/sky) shows through above the ridgelines. Use `transparent:true, depthWrite:false`, alphaTest ~0.02 if sorting artifacts. `_baked` versions exist only as fallback if the sky dome isn't behind them.

## Tileability / UVs
Every ridge is a sum of integer-frequency sines → **seamless horizontally**. wrapS = RepeatWrapping, wrapT = ClampToEdge. Best hung as an open cylinder band (or curved billboard) around the courtyard: repeat.x = 2–3 around 360° is fine.

## Hanging (back → front)
1. Sky dome (existing).
2. Distant range: radius largest, just inside sky; ridge base at horizon line; render order 0; no fog (haze is baked).
3. Mid valley: ~0.7× that radius, beyond the outer mural; its bottom edge (lawn green #4F7A45-ish) should tuck behind / meet the lawn so no seam shows. Render order 1.

## Dawn color notes
Distant: Violet Light #B9A0E0 → Horizon Blue #9DB7CF with 45% Dawn Plaster haze (atmospheric perspective); nearer tier Contrast Violet / Dusk Slate. Peak cap tinted pale rose #F7D9CC. Mid: Sea Sage #8FAE9E → greens. All ridgelines carry a thin Apricot Glow #F7A66E rim (dawn backlight) to match sunset sky warmth.

preview.png = both layers over a Dawn Plaster→Apricot/Rose sample, tiled 2× to show the seam.

## Night companions — studio-tracker #358
In `night/` (`night/make-night.py`, seed 358, regrades the dawn alpha so silhouettes, seams, and UVs are identical). Swap the URLs listed in `night/night.json`. Sun elevation < −6° → night; −6°…+2° → crossfade dawn↔night (t=(2−elev)/8); > +2° → dawn. The optional `sky-night.*` (2048×1024, indigo→faint apricot at the horizon, sparse stars) goes on the dome. `night/preview.png` shows dawn on top and night below.
