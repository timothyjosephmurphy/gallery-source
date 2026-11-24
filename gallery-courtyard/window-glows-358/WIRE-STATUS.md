# #358 window glows — wire status (Oct 26 2026, not deployed)
Repo: /workspace/play-tags (not a git repo; note /workspace/gallery-source-staging/play-tags is an older copy without horizon352/shafts357 — untouched).

## Changed
- NEW src/glows358.js — installGlows358({scene, low, S, dd}); InstancedMesh per sprite, AdditiveBlending, depthWrite false, toneMapped false, DoubleSide.
- src/courtyard296.js — 3 lines: import; install after shafts357 (try/catch, S.err358g); `S.glow358.update()` in S.update.
- NEW public/window-glows/ — 6 desktop + 6 phone webp + glows.json (png refs stripped). 616 KB. PNG masters not shipped.

## Behaviour
- Night weight k = clamp((2 - elev)/6): 0 at +2°, full at -4° (per glows.json fadeInDeg; brief said -6 — glows.json wins, the [lo,hi] is read from json so retune there).
- Elev source: S.elev (set by buildNight) → S.sunElev / ?sunElev= → clockSunElev(). shafts357/horizon352 only imported from, not edited.
- Opacity = k · gain · intensity/1.4 (1.4 plain, 1.1 curtain → ~0.79). `?glowGain=1.3` tunes, `?glows=0` disables.
- Flicker amp 0.04 @ 0.3 Hz, random phase per sprite group (cheap; per-window phase would need a shader).
- litFraction 0.6, curtainShare 0.3, seeded (358) → stable.
- low/phone → *.phone.webp. Debug: window.__c296.glow358 {count, lit, k, elev, err}.

## Placement — INCOMPLETE
No dedicated facade window meshes exist in the courtyard. Glows are placed on the core's clerestory windows, derived from the 'domes-daylight' shaft quads (top edge a,b; outward = away from shaft foot), quad ≈ 1.79× window width, 2:3. Only single/mullion used; arched unused (no arched window geometry). Not visually verified in a browser — check alignment/offset (y drop = 0.75·w is a guess) at ?sunElev=-10.

## Build
`npx vite build --outDir /tmp/ptbuild-358g/dist` OK (2.7s). Total dist 13 MB (pre-existing; glows add ~0.6 MB, JS +~3 KB). play-tags/dist untouched. testimonials/doorcheck pre-steps not run.

## Remaining to deploy
1. Visual check night/dawn crossfade + alignment; tune glowGain/offset.
2. Run full `npm run build` (testimonials + doorcheck).
3. Deploy (CF) — not done; dist already 13 MB vs ~4 MB lean target, so size is a pre-existing concern.
