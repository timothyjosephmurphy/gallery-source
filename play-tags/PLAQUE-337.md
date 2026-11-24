
## Oct 26 2026 — plaque-sharp follow-up
- `tierPlaqueTex` now saves the original image URL (or Image) on `texture.userData.fullSrc`, and carries it over to the downsampled CanvasTexture on low/phone.
- `plaqueEnlarge337.show()` uses `map.userData.fullSrc` first and falls back to `map.image`. The 3D mesh still uses the tier texture.
- Only the plaques loader (tags.js:142) calls tierPlaqueTex. Group-label, wall-title and eagle plates are not downsampled, so they were left alone.
- Build: /tmp/ptbuild-plaque-sharp/dist. Not deployed.

- Mon Oct 26 2026 ~3:10 PM PT: deleted `play-tags/src/plaqueReader337.js` (dead draft; rg found no imports). No behavior change, no deploy.
