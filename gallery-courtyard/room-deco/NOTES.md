# Room Art Deco trim (#335 follow-up, TJ Oct 26)

These textures carry the per-room motif mix from the story plates (`../story-plaques/`, same room-to-motif map) onto each room's architecture. There are four textures per room:
* **cornice-frieze**: 2048x256, tiles in X.
* **door-surround**: 512x1024, tiles in Y.
* **dado-rail**: 2048x128, tiles in X.
* **keystone-medallion**: 512x512, an alpha disc.

Each texture comes as `.webp` (desktop) and `.phone.webp` (half size), each with a `_n` normal map, like `hq-assets/signs`. That makes 192 files totalling 6.2 MB. The largest single file is 153 KB, the room-03 desktop door albedo.
How it was made: `make_room_deco.py` reuses the motif functions of `../story-plaques/make_room_plates.py` (exec'd, so that folder is untouched) and draws them as gilded relief (Gilded Ochre #F7CC3A lines, inlaid coral / blue-deep fields, a soft cast shadow and a normal map). `contact.py` builds `preview.png`, with one row per room: cornice (left half), dado, door surround (one tile, then two stacked to check the Y seam), keystone, and an X-seam check of the cornice end|start. Nothing was uploaded and no Gallery repo was edited.

## Motif map and files (KB: desktop albedo / normal; phone versions are about a third of that)
| room | title | motifs | frieze band | cornice-frieze | door-surround | dado-rail | keystone |
|---|---|---|---|---|---|---|---|
| room-01 | Landscapes | SUNBURST + CLOUDS | terracotta | 75.7 / 52.2 | 66.7 / 37.3 | 36.4 / 15.5 | 42.4 / 25.5 |
| room-02 | Brekkie Bitcoin B | CHEVRON + FAN | slate | 85.0 / 52.9 | 68.9 / 37.3 | 51.3 / 27.4 | 43.2 / 25.5 |
| room-03 | Mexico | PALM LEAF + SCALLOP + SUNBURST | terracotta | 78.8 / 55.1 | 153.1 / 131.0 | 38.2 / 17.2 | 42.4 / 25.5 |
| room-04 | Festival | FAN + PEACOCK + WAVES | slate | 89.0 / 57.3 | 78.1 / 49.1 | 41.8 / 22.7 | 44.7 / 27.5 |
| room-05 | Family | VOLUTE + SCALLOP | terracotta | 85.3 / 60.6 | 118.7 / 90.2 | 38.7 / 17.2 | 43.6 / 26.1 |
| room-06 | Catherine dance series | FEATHER + PEACOCK + FAN | slate | 73.9 / 43.6 | 77.7 / 45.7 | 35.6 / 13.1 | 44.5 / 27.5 |
| room-07 | Bitcoiners | AIRCRAFT FIN + CHEVRON | slate | 70.8 / 44.0 | 57.4 / 29.3 | 31.2 / 9.6 | 38.8 / 22.5 |
| room-08 | El Salvador | WAVES + PALM LEAF + SUNBURST | sage | 87.9 / 49.8 | 104.2 / 81.3 | 41.7 / 20.6 | 42.5 / 25.5 |
| room-09 | Sunset | SUNBURST + WAVES + CLOUDS | violetdeep | 72.4 / 50.1 | 76.1 / 45.8 | 40.7 / 22.1 | 42.5 / 25.5 |
| room-10 | Bitcoiners | FOUNTAIN + CHEVRON | slate | 58.8 / 34.9 | 57.3 / 30.8 | 31.2 / 9.6 | 35.9 / 21.0 |
| room-11 | Portrait | FEATHER + VOLUTE | slate | 69.0 / 36.5 | 76.1 / 45.6 | 35.8 / 13.1 | 41.5 / 24.5 |
| room-12 | Seattle | CLOUDS + WAVES + CHEVRON | slate | 64.8 / 39.0 | 56.7 / 27.5 | 52.2 / 25.9 | 37.3 / 22.1 |

Filenames follow `room-NN-<texture>.webp`, `room-NN-<texture>_n.webp`, `room-NN-<texture>.phone.webp` and `room-NN-<texture>_n.phone.webp`, with <texture> = cornice-frieze | door-surround | dado-rail | keystone-medallion and NN = 01-12.
How the motifs are combined: the cornice uses the room's main motif (sunburst, fan, peacock, shell, fountain, chevron peak, feather fan or clouds) every 0.36 m, alternating with its secondary motif. Under that runs a continuous course (waves, scallops, chevron zigzag or ziggurat dentils). The door surround has a centre column of the main motif with side columns of the secondary motif. The dado is the light version: Dawn Plaster with small ochre and apricot motifs.
Frieze bands: terracotta (01, 03, 05), dusk slate (02, 04, 06, 07, 10, 11, 12), sea sage (08, El Salvador) and violet deep (09, Sunset). I varied them so the rooms that share a sunburst don't look the same.

## Mapping (suggested repeat; all of this is in `room-deco.json` -> `textures`)
| texture | metres per tile (u x v) | wrap | skin these meshes |
|---|---|---|---|
| cornice-frieze | 1.44 x 0.18 | RepeatWrapping in U (tileable X), Clamp V | tags.js 'cornice' (box 0.18 m tall on every room wall top): front/back faces, repeat.x = wallLength / 1.44 |
| dado-rail | 1.28 x 0.08 | Repeat U, Clamp V | NEW thin rail (0.08 m strip, plane or 1-2 cm box) inside each room at 1.45-1.8 m (picture rail) or ~0.9 m (dado) / base; no existing mesh |
| door-surround | 0.2 x 0.4 | Clamp U (across the band), Repeat V (along the jamb / ring) | tags.js 'lintel' arch ring (0.2 m wide band, 0.14 deep) and door jambs; courtyardstyle.js 'doorSurrounds' (jamb planes 0.04 m wide: use the centre column only, u 0.29-0.71); courtyard296.js 'doorTrim' |
| keystone-medallion | 0.3 x 0.3 | Clamp, alpha disc (alphaTest 0.5) | NEW keystone at the apex of each 'doorArch' / over 'sunburstArches' fanlight, or cornice corner blocks; suggested 0.24-0.32 m |

Loading: `TextureLoader`, `colorSpace = SRGBColorSpace`, `wrapS = RepeatWrapping` (and `wrapT` for the door), `MeshStandardMaterial({ map, normalMap, roughness: 0.75, metalness: 0 })`. Use `.phone.webp` on the phone tier.

## Caveats for Gallery
* `cornice` today reuses one shared `geoBox` scaled per wall, so the UVs run 0..1 per face. For the frieze to repeat every 1.44 m, each wall needs either its own `map.repeat.x = L / 1.44` (a cloned texture or material per length bucket) or world-space UVs written into a per-wall geometry. The 0.18 m height maps to the full V, so use the front/back faces only (top and ends would show stretched frieze).
* `doorSurrounds` (courtyardstyle.js) jamb planes are only 0.04 m wide. Map only the centre column there (u 0.29-0.71); the full 512-px band suits the 0.2 m `lintel` arch ring. The ring is an ExtrudeGeometry of an arch, so its UVs need remapping: u = radial across the band, v = arc length / 0.4 m.
* There is no new fanlight for `sunburstArches`; its `trim-motif.webp` is unchanged. The keystone medallion is meant to sit at the arch apex. A per-room fanlight would be a separate job.
* The dado / picture rail and the keystones need new meshes (thin strips, discs). Nothing in play-tags builds them today.
* `room-deco.json` was enriched by hand after the build: tile specs, sizes and phone paths. Re-running `make_room_deco.py` rewrites the textures and a bare `room-deco.files.json`, not `room-deco.json`.
* The colours are kept saturated for grey Seattle light, but they have not been checked in the live gallery lighting.
