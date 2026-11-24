# Draw-call scout after #488, Mon Oct 26 2026 ~10:35 PM PT (LIVE preview-251 4ed8521f, entry index-D2kR8CrF.js, desktop 1280x800 swiftshader)
Scripts: play-tags/tests/_drawscout.mjs + _census481.mjs. Raw: /tmp/au/scout488.json, /tmp/au/census488.json.
## Numbers
- Spawn: 207 calls, 218k tris, 136 textures, 115 geometries, 84 programs (same as 487; window cards are not in the spawn view).
- Median painting view: 186 calls (216k tris). Was 304 at 471e3a9a.
- Dense views (top 5): 333 / 287 / 280 / 226 / 200 calls (~234k tris). Densest is near (9.9, 7.5). Was 1122 / 1098 / 1034.
- Scene: 1827 meshes (was 2790), 16 InstancedMesh.
## Frustum-visible groups at the densest view
hang 82 (art, unique textures), ostrich Leg 30 + Knee/Neck/Head/Tail/Body/Foot ~33 (animated, HOLD), anon 29 (unique materials, skipped in #488 census), roomSign 9 (per-room textures), glabel 6, glassDome 6 (HOLD), horizon 4. Window*/fountainJet no longer show in the top groups.
## Census (scene-wide name|mat)
hang478Part 930 meshes / 312 mats, hang478Rim 310 / 1, hang478Art 310 / 310, anon478Plane 58 / 58, anon478Box 26 / 9, glassDome 13 / 2, rayGlow 12 / 12.
## Night chain summary
471e3a9a dense ~1122, median 304, spawn 589 -> #477 doorTrim -> #478-#487 fence/wall/cornice/jamb/fountain/etc merges -> #488 window cards -> now dense 333 (-70%), median 186 (-39%), spawn 207 (-65%).
What's left needs an atlas (hang art, roomSign, glabel, anon), touches animation (ostrich, rayGlow), or is on HOLD (glassDome). The merge lane is done. hang478Rim still shows 310 meshes in the census because #48x keeps the per-painting originals hidden and draws one hang48xRim InstancedMesh instead — not a new merge candidate. What's left needs atlas, animation work, HOLD, or TJ eyeball.
