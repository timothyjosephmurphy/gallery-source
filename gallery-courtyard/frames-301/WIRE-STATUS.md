# #301 frame moulding maps: wiring status (Oct 26 2026, prep only, NOT deployed)

## Files touched (play-tags)
- `src/frames.js`: the existing #301 InstancedMesh frame is now wired to Visual's maps. Backup is at `src/frames.js.pre301wire`.
  - Profile strip UVs: V is the arc length across the profile (0 = wall/back, 1 = canvas lip). U runs along the side and is scaled in the shader by a per-instance `aLen` attribute, about 1 repeat per 0.6 m (world units, so nothing stretches).
  - MeshStandard: albedo `frame-black`, roughness `_r`, AO `_ao`, normal `_n` (normal is desktop only). metalness 0, envMapIntensity 0.6.
  - Phone (LOW) loads `*.phone.webp`.
  - Gold liner: the shader path is present but switched off (`LINER = false`), so frames stay all-black. To turn it on, set it to true. The lip is v > .88, metal .6, rough .45.
  - Contact shadow: the procedural canvas ring is still the fallback. Once `frame-contact-shadow` loads, it replaces it (used as map, RGBA alpha).
  - Geometry, plaques and painting sizes are unchanged.
- `public/frames/`: copied the 12 `frame-*.webp` files (desktop + phone), about 104 KB. The PNGs, preview.png and make.py were not copied.

## Not touched
hang-overrides, eggs, agents.js, ostrichbot.js, BOOK_DEFS, fence, layout. No gen.py, no execute, no deploy.

## Verify
- `npx vite build --outDir /tmp/ptbuild/dist` passed with 0 errors (only the existing chunk-size warning). The build went to /tmp, so play-tags/dist was not changed. Total output is about 12 MB with no single file over 4 MB.
- Not yet checked visually in a browser. Look at UV orientation, liner band position and AO on the hidden end caps.

## Remaining deploy steps (after #281, then #288c release the slot)
1. Run `npm run dev` and check the frames on desktop and on phone (`window.__frames`).
2. Decide whether to use the liner (`LINER`).
3. Run `npm run build` (doorcheck + testimonials), then the normal gen.py / deploy flow. Check that the worker bundle stays under the CF limits.
