# Defer-modules scout (Oct 26 2026). LIVE 4628c2f2 not changed.

Static feature imports in play-tags/src/tags.js (three, core, world and catalog left out):

| module | size | used at | boot-critical? | verdict |
|---|---|---|---|---|
| frames.js | - | finish() | yes (frames) | KEEP |
| plaqueTex.js | - | plaques | yes | KEEP |
| tags-world.js / museum.config | - | layout | yes | KEEP |
| groupLabels354 / wallTitles354 / eagleBrass354 | small | pre-finish build | part of the hang (labels/plates, plaqueY audit) | KEEP |
| courtyard294 / courtyardstyle / courtyard296 | - | finish() | geometry + colliders, fountain portal | KEEP |
| phone304.js | 7 KB | finish() | gates phone movement | KEEP |
| minimap (gallery-core) | - | finish() | uses hooks.doors, HUD audit | KEEP |
| muralLod402.js | 1.7 KB | mural texture load | already afterPlayable on low tier; tiny | KEEP (no gain) |
| wallmap.js | 9 KB | finish() | not for paint; ties to eggs world/drone | later candidate |
| **testimap.js** | 9 KB + testimonials.json 3 KB + **world-land.json 65 KB** | finish(); `update()` null-guarded | **no**: reads W.walls only, adds no colliders | **DEFER (done, undeployed)** |
| ride.js | 13 KB + ostrichbot | finish() | no, but touches the player/controls | candidate #2 (needs ride QA) |
| stickerBot306 + stickerWalls307 | 9 + 4 KB + GLTFLoader/meshopt | finish() | no; 307 reads `window.__stickerBot306` at install | candidate, **move both together**, in order |
| plaqueEnlarge337.js | 5 KB | finish() | no (click UI) | DONE Oct 26 (8ca52137) |
| duckbot / overlays303 | - | not statically imported by tags.js | n/a | n/a |

## Shipped (undeployed)
testimap now loads through `afterPlayable(() => import('./testimap.js'))`, the same pattern the #272 murals use. Desktop runs it at once, still async. Phone/low waits for fps>0 or 8 s, then +300 ms.
`npm run build` OK: **main 950 → 877.6 KB** (−73 KB raw), new chunk testimap-*.js 73 KB (25 KB gz).
Backup: src/tags.js.pre-defer-testimap. Revert: copy it back.
tagsaudit not run, nothing deployed. Before a deploy: run tagsaudit desktop+phone, check that `window.__testiMap` is absent (no err) and that the testimonial wall pins and click work after load.

## Next
1. stickerBot306 + 307 as one deferred pair (biggest dep: GLTFLoader + meshopt, if it isn't shared with ostrichbot already in main).
2. ~~plaqueEnlarge337~~ done. Next: ride.js (needs ride QA first because it touches player/controls).

## Shipped
- Oct 26: sticker pair 306→307 deferred as one afterPlayable chain. Deployment b76bfecd. Main dropped from 877.98 to 869.83 kB (GLTFLoader is shared, so it stays in main). See DEPLOY-DEFER-STICKER.md. Next: plaqueEnlarge337, then ride.
- Oct 26: plaqueEnlarge337 deferred to afterPlayable. Deployment 8ca52137. Main dropped from 869.83 to 866.81 kB, and the new chunk is 3.45 kB. See DEPLOY-DEFER-PLAQUE337.md. Next: ride (needs QA).

## Oct 26 2026: wallmap.js deferred (DEPLOY-DEFER-WALLMAP.md, live 61358e16). ride.js stays parked: it needs ride QA before it can be deferred.
