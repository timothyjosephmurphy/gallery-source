# Lazy-load scout: museum.config / eggs-run (play-tags, LIVE preview-251 4628c2f2)
Date: 2026-10-26 · Doc only, nothing built or deployed.

## Recommendation: DON'T (museum.config) / ALREADY DONE (eggs-run)
The PERF-PASS estimate of "~0.96 MB freed" is based on a misreading of the chunk names.

## 1. How the code gets bundled and packed
- `src/museum.config.js` is only 772 B. The 691 KB `assets/museum.config-*.js` chunk is mostly **three.js r170**: it opens with the Three.js license header and exports `p,q,a3,...` used by main, tour, eggs-run and BufferGeometryUtils. Vite named the chunk shared by every entry after the smallest module in it.
- `eggs-run` (272 KB) is **already a lazy chunk**. `eggs-install` (724 B) checks `MUSEUM.eggs`, then calls `import("./eggs-run-*.js")` inside `requestIdleCallback` (1500 ms timeout) after waiting up to 8 s for the scene. It is not on the first-paint path.
- `deploy/gen.py` walks `dist/` and inlines **every** asset into `_worker.js` / `execute.js` as an asset map. Lazy loading therefore never makes the worker payload smaller. It only changes what the browser fetches and parses, and when.
- main (950 KB) already dynamically imports museum.config for `MUSEUM.tour` → tour chunk.

## 2. What needs MUSEUM before first paint
tags.js:4 and tags-world.js:1 import MUSEUM statically (#284 plainCourts) for layout and hang. Even if MUSEUM were deferred, three.js (the same chunk) is required to render the first frame. Splitting the 772 B config out saves nothing.

## 3. Risks if forced
- hang and layout (plainCourts, hang-overrides) need MUSEUM at boot. Deferring it would risk an empty or mis-laid court on LIVE.
- tagsaudit / doorcheck expect a synchronous layout.
- eggs spawn timing is already tuned (#242 idle + 8 s cap). Moving it to afterPlayable would gain almost nothing.

## Next steps (real wins, for later)
1. Clarity only, no payload change: add `manualChunks` so three.js gets its own `vendor-three` chunk and config/size reports stop being misleading.
2. Check whether main (950 KB) pulls in large optional modules (stickerBot, nostr-wall, testimap, muralLod, ride, duckbot) that could move to `afterPlayable` dynamic imports. This is the real lever for phone parse time and needs its own scout plus tagsaudit/doorcheck.
3. Look at three.js tree-shaking / addons imported via `import * as THREE`.
