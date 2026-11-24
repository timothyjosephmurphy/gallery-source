# #470 ostrich bump pack: DEPLOYED (Mon Oct 26 2026, ~5:02 PM PT)
Deployment **00d93b35-23b7-4f8b-899b-395d2a20444d** on tjm-tag-gallery-preview, branch preview-251 (replaces 86c3189d). Entry index-BLXwnA3W.js / main-ByM6OL54.js.
URL: https://00d93b35.tjm-tag-gallery-preview.pages.dev/play/ · alias https://preview-251.tjm-tag-gallery-preview.pages.dev/play/

## Blocker found + workaround
The ostrich GLBs have **no UVs** (POSITION,NORMAL only, lod0 and lod1). The GLB was not remeshed. Instead, src/ostrichBump470.js adds UVs at runtime to the loaded geometry:
- feathers: a dominant-normal-axis box projection, scaled to model height (~0.88), then repeat 4×4
- legs/neck: a cylindrical strip around the longest bbox axis (U around, V along), repeat [1,3]
- uv is also copied to uv1/uv2 for aoMap (three 0.170 reads the aoMap on uv by default)
Box projection seams can show where the dominant axis flips. For seamless results, a UV-unwrapped GLB from Visual (ostrich-robot/build.py) would fix this.

## Mapping (actual names → playTags)
Multi-material nodes load as Groups of Body_1.. meshes, so matching uses the node or parent name. Only Shell_* materials are textured; Brass, LED_Cyan, Dark, Apricot trim and Leather stay as modelled. Each Shell material is cloned per kind, keeping its existing purple base color, with metalness 0 and roughness 1 × map.
- ostrich-feather → Body, Wing_L, Wing_R, Tail: feather n/r/ao, normalScale 0.8 (phone 0.6), aoMapIntensity 0.8
- ostrich-leg → Leg_L, Leg_R; ostrich-neck → Neck: skin n/r, normalScale 0.5
- ostrich-beak → Beak (Apricot): roughness 0.4, untextured
- Not mapped: Head, Knee, Ankle, Foot, Saddle, Eyes, ProjectorLens

Counts: desktop has 6 cloned mats, 15 map assignments and 5 textures (46/46 map slots loaded). Phone has 4 mats, 11 assignments and 5 .phone.webp textures (39/39 loaded). Walk, size and minY logic are unchanged (#321/#322).

## Assets
The 10 webps are on R2 tjm-images at play/preview-251/ostrich-bump-470/, served through the /img/ proxy, and byte-verified from img.tjm.art. They are too big to embed: the 4 MB MCP cap applies, and gen.py embeds only html/js/css. A reference copy is in play-tags/public/ostrich-bump/ (not served).

## Checks
- Smoke (local + live): __ostrichBot.ready true, bump '470', no page errors
- tagsaudit desktop PASS, phone PASS (/tmp/ta470-*.log)
- gen.py → _worker.js 2,805,319 B; splice → execute.js 2,872,412 B

## Rollback
Restore /tmp/ostrichbot.js.pre470 to src/ostrichbot.js, then rebuild, gen, splice and execute.
