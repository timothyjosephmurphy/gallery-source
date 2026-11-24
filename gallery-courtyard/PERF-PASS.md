# play-tags performance pass: Oct 26 2026 (audit only, not deployed)

## Current budgets
- **Payload cap (binding):** execute.js under about 4,000,000 B (MCP). After cut #2: _worker.js 2,522,493 B, execute.js 2,588,695 B (measured now; audit said 2,515,433 / 2,581,381), so about **1.42 MB headroom**.
- **Still embedded (gen.py):**
  - Text: all of dist except art/pbr/plaques. About 1.95 MB (main.js now 931K, museum.config 691K, eggs-run 272K).
  - `dist/art/*-288*`: lisa-climbing-tahoma-cropped-288, about 33 KB (#288, approved:false, kept on purpose).
  - `/plaques/*`: re-encoded `/tmp/*.webp`, 340 KB raw, about 0.45 MB base64:
    - friends-club-plaque 123,766
    - eagle-plaque 96,040
    - friends-club-teaser-plaque 65,148
    - cormorant-label-plaque 55,174
- **PNGs in public/:** only the 4 plaque sources, about 3.8 MB in total (friends-club 1.56M, eagle 1.10M, cormorant 627K, teaser 527K). They are never shipped: gen.py swaps in the /tmp webp. Risk: the /tmp webps are not reproducible if /tmp gets wiped.
- **GPU budgets already in code:**
  - frames.js: frame bars are one InstancedMesh per variant, plus one shared-texture InstancedMesh for shadows. That is about 2 to 3 draw calls in total, with anisotropy 2 on low and 8 otherwise.
  - tags.js: plinths, caps and columns are instanced. Segment counts come from the detail tier (32/16/10 and 40/28/18).
  - Low tier defers murals until the first playable frame (#272), and `__tagsTris` reports the triangle count.

## Top 5 cost suspects
1. **Murals and brass plaques:** each is its own Mesh plus its own material plus a full-res texture. No atlas, no LOD, no mip/size cap by tier.
2. **frameBars / frameShadows:** `frustumCulled=false` means they are always drawn, at full vertex cost even when out of view. Draw calls are cheap, but the vertex and fill cost is not.
3. **Neural Dance live canvas:** CanvasTexture `needsUpdate` every frame while nearby, which costs a texture upload each frame. A distance gate exists. Check that the upload rate is also throttled.
4. **Text bundle:** main.js 894K and museum.config 691K. Parse and compile time on phones, plus payload.
5. **Transparent overlays** (shadows, glows, light-shafts, plaques with alphaTest): overdraw/fill rate on phones.

## Recommended next code changes (prioritized)
1. Plaques: add a tier-based texture size (phone webp at about half resolution), and set `generateMipmaps` plus anisotropy by tier in the tags.js brass-plaque loader.
2. Murals: set a distance LOD (a low-res proxy texture first, then swap to full when within N m). Reuse the existing `afterPlayable` hook.
3. frames.js: compute a bounding sphere per InstancedMesh (`computeBoundingSphere` after `dirty()`) and turn frustumCulled back on. Optionally split it by room.
4. Lazy-load museum.config and eggs-run (dynamic import). This is also audit plan step 3, and it frees up to about 0.96 MB of payload.
5. Move the /tmp plaque webps into the repo (e.g. `public/plaques-webp/`) so builds are reproducible, and stop gen.py reading from /tmp.

## Cut #3 candidates (R2 `play/preview-251/plaques/`)
| File | webp B | Egg status | Action |
|---|---|---|---|
| eagle-plaque | 96,040 | No source says it is non-egg ("pending egg/teaser check"). May relate to eagleBrass354 | Hold, needs confirmation |
| cormorant-label-plaque | 55,174 | Not marked either way | Hold, needs confirmation |
| friends-club-plaque | 123,766 | Flagged as possibly egg-related | SKIP |
| friends-club-teaser-plaque | 65,148 | Flagged as possibly egg-related | SKIP |

Moving eagle plus cormorant would free 151 KB raw (about 0.2 MB base64). How to do it once cleared:
- Upload the webps to R2.
- In the tags.js brass-plaque branch, use `img/play/preview-251/plaques/<name>.webp` for those names.
- Skip those names in the gen.py plaque loop.

**Cut #3 was NOT performed.** DEPLOY-SIZE-AUDIT leaves every plaque "pending egg/teaser check", and nothing clearly marks any plaque as non-egg. Headroom is 1.42 MB, so nothing is urgent.

## Implemented (Oct 26 2026, not deployed)
- **Plaque textures by tier:** new `src/plaqueTex.js` `tierPlaqueTex()`. On low/phone tier, plaque images wider than 512 px are downsampled through a canvas to half size (max 1024 px). Every tier gets mipmaps, and anisotropy is 2 on low and 4 otherwise. The only change in tags.js is the brass-plaque loader callback (plus the import). HUD / #337 lines are untouched, and no plaques were moved.
- **frames.js culling:** frameBars-* and frameShadows now use `frustumCulled = true`. `dirty()` recomputes the InstancedMesh bounding spheres (three 0.170) after every placement change.
- **Mural LOD:** deferred. It needs a proxy texture plus a swap state machine, which is not low-risk for this pass.
- Build: `/tmp/ptbuild-perf/dist` compiles. Pre-edit backups are in `/tmp/tags.js.preperf` and `/tmp/frames.js.preperf`.
