# #357 light-shaft gobos — wire status (Gallery, Oct 26 2026)
Status: WIRED, built locally, NOT deployed.

## Changes (play-tags)
- NEW src/shafts357.js — swaps the material on the #296/#352 shaft cards (`domes-daylight-352`, renamed `domes-gobo-357`) for a textured gobo shader. Same geometry/UVs; additive, depthWrite off, toneMapped on.
  - Opacity 0.14 default, clamped 0.08–0.22 (shafts.json); `?shaftOp=` override.
  - Wedge by default, `?gobo=slits` for slits. Phone/low loads `-phone` maps.
  - Tint goes apricot-dawn → daylight-cool across 14–26° sun elevation. Fade follows shafts.json: smoothstep(0.05,0.35,elevRad)·(1−smoothstep(1.0,1.35,elevRad)). Elevation comes from the #358 `S.elev`, so the shafts are off at night and night is not touched.
- src/courtyard296.js — 3 lines: import, a try/catch install after dialShafts, and `S.gobo357.update()` in S.update.
- public/light-shafts/ — the 8 shaft webps (desktop + phone, about 280 KB). At runtime only 2 load (about 140 KB desktop, about 55 KB phone).
- Not touched: horizon352.js (read only), the night code, and everything else on the do-not-touch list.

## Build
`vite build --outDir /tmp/ptbuild-357/dist`: 0 errors, 1 chunk-size warning (already there before). dist is 12M. play-tags/dist was not clobbered.

## Not done / notes
- The dust-mote sheet was not wired (it's optional and keeps the change lean). It could be a follow-up.
- No card billboarding: the existing window-aligned quads are kept.
- public/ is already about 7.8M. Check this against the ~4MB CF budget before deploy (this change adds 0.28M).
- The build ran vite directly, so tools/testimonials.mjs and tools/doorcheck.mjs were skipped. Run `npm run check` before deploy.

## Deploy steps remaining
1. Visual check on desktop and phone with ?sunElev=8 / 20 / 40 / -10 and ?gobo=slits.
2. `npm run build` (full), then deploy per play-tags/deploy. Post the tracker update on #357.
