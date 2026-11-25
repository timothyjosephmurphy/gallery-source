# Tag gallery (studio-tracker #251): layout notes

Status (Oct 21, 2026, about 12:35 PM PT): v3 layout and diagram done (pavilion in the centre, a ring of 6 walkable courtyards with open colonnades, 12 rooms sized to their paintings; see DESIGN.md). v1 and v2 files are kept as *-v1 and *-v2 (and tools/*_v2.py). **TJ asked to approve the diagram before any 3D build.** There is no 3D scene and no deploy yet. The tags are a proposal (#250) and TJ has not approved them, so nothing here is public.

## Files
- `tools/extract.mjs <repo> [proposals...]` merges origin/main `catalog/painting-tags.json` with `/workspace/tags-proposal-250*.json`. It keeps TJ Murphy paintings only, shows each twin group once (twinGroups + resolveId), and writes `data/works.json`. Run it from the repo root (the catalog validation looks for image paths relative to the current directory).
- `tools/imgdims.py` picks a web-size texture per work and records its pixel size (`data/imgdims.json` cache).
- `tools/layout.py` does the similarity, clusters, hex placement (annealing), doors, wall order and packing, then writes `data/layout.json`.
- `tools/palette.py` (painting palettes, run after imgdims) and `tools/diagram.py` draws `diagram/tag-gallery-plan.{svg,pdf,png}` (PNG 8400 px wide).
- Rerun after a tag change: `cd /workspace/va-251 && node /workspace/tag-gallery/tools/extract.mjs && cd /workspace/tag-gallery && python3 tools/imgdims.py && python3 tools/layout.py && python3 tools/diagram.py`
- Worktree: `/workspace/va-251` (branch `feat/251-tag-gallery` from origin/main, unmodified, read only)

## layout.json contract (for the 3D build)
- `hub`: Entrance Hall at the origin, with `start`. `gates[]` holds the checkout plus the dungeon, orsay, bilbao, uffizi and gugg-ny gates (each with x, z, ix, iz and width 1.8), and the concert-hall gate with active=false as a placeholder.
- `rooms[]`: `center` and `radius` (hex side = circumradius, in m) and `apothem`. Walls are k=0..5, and wall k has outward normal angle 60k degrees in the x-z plane. Each room also has `doorWalls`, `neighbours`, `label`, `mainTags` and `combines`.
- `corridors[]`: from p0 to p1 with width 1.6. Doors are centred on their walls.
- `paintings[]`: x, y, z centre, inward normal ix/iz, w/h (true size in m), fw/fh (frame), and a `plaque` beside each painting at 1.45 m. Also `set`/`setPos` and, for the temple four, `grid` (row/col). `approxSize` flags estimated sizes, including a 12 in default when no size is known.
- `checks`: overlaps, exits (every node ≥2), bridges (0) and setsOneRowInOrder.

## Rules built in
True size. One row per wall, so no stacking. Triptychs and other sets of three hang on one wall in order. The Burning Man Temple 2022 four (Daytime, Blue / Pink, Flame) hang as a 2x2 grid. Every room has 2 or more exits and the graph has no bridges, so every route is on a loop. The hub joins 4 rooms.

## Next steps (after TJ approves)
Build the hex-room three.js scene on gallery-core (vite `galleryCore` plugin; reuse look.js makeRenderer, move.js). Bring in the gates and checkout from museum-gates. Add the minimap with the hub and gates marked. Run the hang audit: copy play-gallery/tests/hang243.mjs and drop its 308-specific checks. Deploy as a separate Pages preview project (e.g. `tjm-tag-gallery-preview`) using the deploy/gen.py pattern. Not production, no public links. No prices or emojis in copy. Business name: Vermillion Aurora Productions.

## v3 additions to layout.json
`cellRadius` (honeycomb cell radius). Room `radius` is the room's own hex side, centred in its cell; the band left over is a planted terrace. `halls[]` lists the open colonnades (p0→p1, width 2, views). `vestibules[]` are the short door passages. `courtyards[]` have fountains, fountainPaths, spokes, beds and crossingColonnadeWall. `windows[]` are colonnade view points. `loops` and `walk` hold the connectivity and walking-distance checks. Each room also has `wallColor`, `palette` and `centerpiece` (suggestion only).

## v4 status (Oct 21)
- The plan is in diagram/tag-gallery-plan-v4.{png,svg,pdf}. It's still diagram-only: no 3D build and no deploy until TJ approves.
- Brass plaques are enlarged by 3.0x (PLQ_SCALE in tools/layout.py) and centred at 1.45 m. The sizes and reasoning are in DESIGN.md.
