# #358 night horizon — wire status (Oct 26 2026, not deployed)

## Files touched (play-tags)
- `public/horizon/night/` (new): horizon-distant-range.night{.webp,.phone.webp}, horizon-mid-valley.night{.webp,.phone.webp}, sky-night{.webp,.phone.webp} (~88 KB total; no PNGs, no baked).
- `src/horizon352.js`: added `clockSunElev()` + `buildNight()` — night twin meshes reuse the day cylinder geometry/order; night sky hemisphere (r=69, renderOrder -999, above dawnSky).
  Rule per night.json: t = clamp((2 − elev)/8); >+2° dawn, −6..+2° crossfade, <−6° full night. Night textures load lazily only when t > 0. Phone uses *.phone.webp.
  Elevation source: `?sunElev=<deg>` or `window.__c296.sunElev`, else local-clock curve (0° at 06:00/18:00). No pre-existing day/night cycle was found in play-tags, so this clock is the new driver.
- `src/courtyard296.js`: import + call `buildNight` after `buildHorizon`; `S.update` calls `S.night.update(cam)`.

## Build
- `npx vite build --outDir /tmp/ptbuild-358/dist` OK (0 errors; usual chunk-size warning). doorcheck PASS. play-tags/dist NOT touched.

## Remaining deploy steps
1. Visual QA: `npm run dev`, open /play/?sunElev=10, ?sunElev=-2, ?sunElev=-10 (desktop + phone width).
2. `npm run build` in play-tags (rebuilds play-tags/dist), or copy /tmp/ptbuild-358/dist.
3. Usual deploy flow (deploy/gen.py → execute / CF) — check worker bundle stays under ~4 MB.
4. Then comment on studio-tracker #358.
