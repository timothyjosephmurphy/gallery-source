# #303 wire status (Oct 26 2026)
- New: play-tags/src/overlays303.js. Edit: courtyardstyle.js (import + 1 guarded call at end of installCourtyardStyle). tags.js / wallTitles354.js untouched. Backup: /tmp/courtyardstyle.js.pre303.
- Macro: onBeforeCompile multiply on MeshStandard mats, world-planar UV (1 m base tile) / 3.5. plaster 0.18 → skin-* ; ashlar 0.2 → lintel/jamb/cornice/coreWall/entablature/nichePlinth/outer plinth+caps ; flagstone 0.22 → walkRay/sunburstFloor/marbleCore. Re-sweeps ~4 s (rAF) to catch later modules.
- Water: MeshStandard layer 'fountainWaterHQ303' cloned under courtyard296 fountainWater (glow shader kept), map/n/r, normalScale .35, repeat 1.5, slow normal scroll.
- low → .phone.webp. Loads from /img/play/preview-251/hq-overlays-303/. Debug: window.__o303.
- Build: /tmp/ptbuild-303/dist (vite build OK). NOT deployed. Not browser-verified.
- Caveat: play-tags has no hq-assets base maps wired (no wall-plaster/ashlar/flagstone textures), so overlays sit on flat-colour mats; mesh→kind mapping is my judgement.
