# #337 plaque readability: click-to-enlarge (preview build, not deployed)

## UX
- Aim the crosshair at a plate (under pointer lock) or tap/click it directly, within 6 m. Click to open.
- An HTML/CSS HUD (`#pe337`) shows that plate's own texture at up to 90vw x 76vh on a dark 0.82 backdrop, in a `#15100b` brass-framed card with a Gilded Ochre inner line (matches plaque-overlay-337). Contrast is boosted slightly. Caption ink is `#EDE3CF`. Fades in over 150 ms, with no fade when reduced motion is set.
- Covers names matching `/plaque|label|brass|wtitle|glabel/`: brass room plaques, #354 group labels, wall title plates, and the eagle brass plate.
- Ways to close: a click or tap, Esc (or leaving pointer lock), looking away (more than 35 degrees off the plate), or walking away (more than 1.5 m).
- The game is not frozen and pointer lock stays on, so looking away works. `window.__reading` blocks other click handlers while the HUD is open.
- Silent and read-only. No texture or copy changes, and no Writer text is invented.
- Debug: `window.__plaque337 = {open, n, closed}`.

## Files
- NEW `play-tags/src/plaqueEnlarge337.js`: a self-contained module.
- `play-tags/src/tags.js`: only 2 lines added (the import and the install call next to installCourtyard294). Everything else is left to the perf worker.
- `play-tags/src/plaqueReader337.js` was an earlier draft that nothing imports. I left it untouched; it can be deleted later.

## Build
`npx vite build --outDir /tmp/ptbuild-337/dist` built OK in about 3 s. The only warning is the existing chunk-size one. The prebuild steps (testimonials/doorcheck) were skipped.

## Caveats
- On the low tier, the plaque textures are half resolution because of the perf-pass tierPlaqueTex, so the enlarged view on phones is softer. A full-resolution URL would need tags.js to set `userData.src`, which is a follow-up.
- Not checked in a browser yet.

- Mon Oct 26 2026 ~3:10 PM PT: deleted `play-tags/src/plaqueReader337.js` (dead draft; rg found no imports). No behavior change, no deploy.
