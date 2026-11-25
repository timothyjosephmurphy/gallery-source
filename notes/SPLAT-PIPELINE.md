# Splat room pipeline (TJ's scans → a room in tjm.art/play)

Distilled from the living room (studio-tracker #174 v2–v6, #211). Live reference: https://tjm.art/play/home/.
Work copy: `/workspace/play-splat` (gallery on gallery-core, MUSEUM id `splat`). Scan tools: `/workspace/splat-spike/work`.
Every step: comment a checkpoint on the tracker issue; end with a `Time:` comment. Follow `/workspace/token-tools/README.md`.

## 0. Rules (never break)
- The banned word (the one `oneapp/build.py` greps for) never appears. No prices on plaques or panels. Silent when muted.
- Original designs only (models, textures, sounds). Never `pkill` by pattern: kill your own PIDs.
- Layouts Worker is GET-only: no layout PUT/DELETE. Placements stay local.
- Private until TJ says publish: noindex preview, no links from /play or any gate.
- Delete temp files when done (`clean.npy`, stage dirs, `kv*.js`, `/tmp` screenshots). The disk runs near full.

## 1. Ingest and room frame
- [ ] Copy the PLY to `/workspace/splat-spike/<name>.ply` and adapt `work/load.py` (`FLOOR`, `CEIL`, `C0` = a point inside the room).
- [ ] Fit wall planes (`W`: id, normal, d) and name the walls. Room frame: u = distance from wall C, v = distance from wall A, h = height above the floor.
- [ ] Render wall-plane images (`wallimg.py`, `elev.py`, `wallmap.py`) and identify things on them (a "window" may be a cabinet, a "bookcase" may be plants). Ask TJ when unsure.

## 2. Cleanup (no specks, no haze)
- [ ] `clean.py`: drop the ceiling, all low-opacity haze, and every splat that is not floor, wall surface or a painting spot.
- [ ] Remove splats inside furniture footprints (the furniture is modelled) and inside openings (the frames are modelled).
- [ ] Look from the start point and from every corner. Stray specks or floating blobs = fail.
- [ ] `tools/build_scan.py` writes `base<N>-sh{3,1}.spz`, `spot<N>-*.spz` and `patch<N>-*.png` (bump N each version = cache-busting).

## 3. Scale from a standard door
- [ ] Measure the front door opening in scan units (`openings.py` `O`). SCALE = 2.032 / door_height_scan (80 in standard US door). Confirm with TJ which door is the standard one.
- [ ] Scale once, in code (`splat.config.js` SCALE; furniture.js, gugg.js and the audit scale everything). Never pre-scale the JSON.
- [ ] Report: scale factor, door width and height, ceiling height. Audit: front door 2.032 m ± 2 cm.

## 4. Model the room
- [ ] Shell: walls with holes for the openings, floor, ceiling joists. Furniture from `furn.py` → `furniture.json`: position, footprint, height, colours, `back` side. Use the builders in `src/furniture.js` (sofa, shelf, desk, plant, lamp, glasscab and so on). Match sizes TJ asks for (for example, both sofas the same).
- [ ] Openings (`furniture.json.openings`, kind): `window` (frame, mullions, glass, sky backdrop), `door` (closed slab), `opening` (cased doorway that reads as a passage, with a small modelled room beyond), `frontdoor` (open slab + hallway), `cabinet` (recessed, with depth from the scan). Snap opening ends onto their wall planes.
- [ ] Audit: every window modelled (list them by wall), doors/opening/cabinet present, furniture is solid.

## 5. Paintings
- [ ] Spots in `spots.json`: scanned spots (`scan-*`, modes scan / removed / replaced) and free spots (`wall-*`). Place them with the plane solve: a point on wall X at distance d from wall Y.
- [ ] Hang TJ's for-sale works at caption size, where the image aspect matches the caption within 1%. When the caption's W/H disagrees with the image, hang in the image's orientation and flag it to TJ. Never stretch.
- [ ] Cover every blank wall stretch that fits. Keep clear of windows, doors and the cabinet (frame casing + 4 cm), and keep everything that stands in front lower than the frame bottom.
- [ ] Plaques beside the frame at 1.45 m, clear of the picture light and of other frames. Paintings TJ has put on hold stay down.

## 6. Collision and walk test
- [ ] `groundOK` = inside the fitted walls (0.3 m margin), not in a furniture footprint, or in the hallway.
- [ ] Stuck check: the spawn point is not inside furniture, the camera can walk from the start to every painting's viewing spot and into the hallway, and you can't escape through any wall (the audit's `escaped === 0`). Check phone and desktop.

## 7. Eggs
- [ ] `museum.config.js`: `eggs: ['drone', 'guide']` (the guide needs its drone; everything else off). Spawns go on the floor, inside the room.

## 8. Portal back to the dungeon
- [ ] Front door opens onto a short modelled hallway (about 1.83 m, solid walls). The slipgate fills the end wall from floor to ceiling, in warm, low-saturation colours, with the TO THE DUNGEON sign.
- [ ] From the start point you see only a faint hint of it (the audit's ray hits a wall first). Walking in goes to `/play/?via=<id>` through the shell (no reload) and arrives in front of the dungeon gate for this room.
- [ ] In the dungeon (`gallery-core/src/museum-gates/gates.js` `DUNGEONS`), turn one dormant arch into this room's gate (`url`, `frame`, label) and add an entrance thumbnail in `entrances.js`.

## 9. Audits (local, then live)
- [ ] `play-splat/tests/splataudit.mjs URL desktop|phone` and a mixed-modes run (`scan-a1:scan,...`): every check passes. It prints SIZE lines, which go in the report.
- [ ] `museum-eggs/tests/eggaudit.mjs` desktop and phone; `gallery-core/tests/phoneui.mjs`; `cart.mjs`.
- [ ] Once a dungeon gate exists: `HOME_LEG=1 gallery-core/tests/gates-oneapp.mjs ORIGIN desktop|phone` (gate walk, no reloads, memory), plus `play-*/tests/audit.mjs` for the four museums.
- [ ] Screenshots to `/workspace/splat-spike/v<N>-*.png` (`tools/shot.mjs URL out [phone] [x,z,yaw]`, `tools/gateshot.mjs`).

## 10. Deploy
- Preview (private): `splat-spike/deploy/gen.py` + `gen_kv.py`, then Cloudflare execute with `$file:` (kv*.js, then deploy.js). Use versioned asset names.
- Public: add the gallery to `gallery-core/oneapp/build.py` `G` and to the `shell.js` IDS/RX. Give `index.html` its own title, description, canonical and share card, with no noindex. Build to /tmp, copy into a **fresh sparse worktree** of vermillionaurora (`static/play/`, keep `share-start-*.jpg`), open a PR, wait for CI, merge, and verify live.
- Retire the preview: a 301 worker (`oneapp/redirects/redirect-<id>.js`) on the Pages project. Don't delete the project.
- Clean up: kill your server PIDs, remove the worktree and temp files. Report the URL, gate, PR, audits and screenshots.
