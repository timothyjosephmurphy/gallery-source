# #251 tag gallery: hooks for the helper modules (Gallery, Oct 21 2026 1:10 PM PT)

The Gallery bot builds and deploys; helpers only write their own files:
- (A) `gallery-core/src/minimap.js`
- (B) `gallery-core/src/garden/*`: domed columned ceilings with clerestory windows, plus the Roman garden props (hedges, cypress, laurel, benches, fountains, basin)

Gallery id `tags`, source `/workspace/play-tags` (vite + gallery-core). Data: `/workspace/tag-gallery/data/layout.json` v4, also at `CATALOG.layout.tags`.
Units are metres on the x-z plane, with y up. The floor is y=0, the room walls are 4.2 m high, and doors are 1.6 m wide and 2.6 m high.

## Geometry conventions
- A hex room has `center [x,z]`, `radius` (side = circumradius) and `apothem`. Wall k (0..5) has outward normal angle 60k deg, so n=(cos,sin). The wall runs from vertex angle 60k-30 to 60k+30. Tangent t=(-sin,cos).
- Door centre = center + apothem*n + doorOffsets[k]*t.
- Hub: centre (0,0). Column ring r=9, core round wall r=4.6. Gates and checkout sit on the core wall's inner face, and its openings are at 60,120,180,240,300 deg.

## Runtime hooks: `window.game.tags` (ready when `game.tags.ready === true`)
| hook | shape |
|---|---|
| `rooms[]` | `{id, label, kind:'room'|'hub'|'court'|'outer', center:[x,z], radius, apothem, poly:[[x,z],...] (CCW), bounds:{minX,maxX,minZ,maxZ}, wallH}` |
| `doors[]` | `{x, z, nx, nz (unit normal through the door), width, height, room, to, kind:'room'|'inner'|'hub'|'gate'|'outer'}` |
| `paths[]` | `{x0,z0,x1,z1,width}`: walk lanes that must stay clear (ring paths are `{x,z,r0,r1}`) |
| `art[]` | `{x,y,z,ix,iz,w,h}` for every painting, mural and plaque (keep a 1.4 m clear zone in front) |
| `keepClear(x,z,r)` | true if a circle at (x,z) of radius r misses every door, path and art view zone. **Call it for every column, tree, bench or prop you place.** |
| `addCollider({x,z,r})` | registers a solid circle with walkable() and with the doorway check |
| `tier` | `'high'|'medium'|'low'` (phone = low: keep draw calls small, merge geometry, no extra shadow lights) |
| `scene`, `THREE` | the gallery's scene and three.js |

Player pose: `game.player()` returns `{x, z, y, yaw}`. Yaw is in radians, 0 = facing +z, and increases toward +x.

## Expected module APIs (comment on #251 if you change these)
- minimap.js: `createMinimap({ rooms, doors, getPlayer, parent = document.body }) -> { update(), setVisible(bool), dispose() }`. The gallery calls `update()` every frame. It must work at 390x844, and the word DMT must not appear.
- garden/index.js:
  - `buildDomes(tags) -> { group, colliders }`: one dome per `rooms[kind=='room']`, set above wallH.
  - `buildGarden(tags) -> { group, colliders }`: props for the `court` and `outer` rooms and the hub band.
  - Both are original procedural designs with no audio, or audio that obeys `game.holo.muted`.

## Checks the build runs (`npm run build` fails on any)
`tools/doorcheck.mjs`: no collider or wall may intrude on any door rectangle (width x 1.2 m each side) or any path lane, and no collider may stand in a painting's or plaque's 1.4 m view zone. Your colliders are included via the same `keepClear` rules, so please run it after your changes: `cd /workspace/play-tags && node tools/doorcheck.mjs`.
