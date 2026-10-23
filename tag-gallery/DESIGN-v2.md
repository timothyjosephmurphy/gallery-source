# Tag gallery v2: design note (issue #251, proposal only, tags not yet approved by TJ)

Layout: one 19-cell honeycomb with the Central Pavilion in the middle, 6 gallery rooms around it, and an outer ring alternating 6 rooms and 6 open-air courtyards. All cells are the same size (room hex side 9.5 m). A 2 m hallway runs along every cell edge. Along courtyard edges the hallway becomes a colonnade: columns every 2.4 m with open bays you can step through. Ceilings are 6 m in rooms and 4.5 m in hallways, with bright daylight from the courtyards.

## Central Pavilion
Checkout (facing the start), slipgates to the Dungeon, Orsay, Bilbao, Uffizi and Guggenheim NY, and an inactive concert-hall placeholder. It has 6 doors, one into each surrounding room. The start point is in the pavilion. Walking distance to the pavilion (centre to centre, through doorways): mean 27.7 m, max 36.9 m.

## Courtyards
Each has a central fountain (r 1.6 m), a 2 m ring path around it, six 2 m paths out to the colonnades, and planting beds in the six corners (kept off the paths). They are walkable shortcuts between colonnades. Hallway windows (sill 0.9 m) look into the courtyards; room walls have no windows, so every room wall carries paintings.

- court-1: borders room-06, room-12, room-03
- court-2: borders room-01, room-12, room-07
- court-3: borders room-11, room-09, room-03
- court-4: borders room-01, room-08, room-02
- court-5: borders room-10, room-05, room-11
- court-6: borders room-02, room-04, room-10

## Rooms: proposed wall colour, palette, centerpiece (suggestions only)

| Room | Main tags | Paintings | Wall colour | Palette (dominant painting colours) | Centerpiece suggestion |
|---|---|---|---|---|---|
| room-01 | Mexico | 10 | `#e3d4c4` | `#e4ccb4` `#b45424` `#e49c54` `#ccb49c` `#e4cc9c` | papel picado canopy hologram (zone r 2.0 m, 5.03 m clear path) |
| room-02 | Burning Man · Festival · Burning Man Temple 2022 | 13 | `#e9d4be` | `#fccc9c` `#9c543c` `#e4b484` `#e4cc9c` `#ccb484` | slowly turning wooden temple model (no fire) (zone r 2.0 m, 5.03 m clear path) |
| room-03 | Family · Political portraits | 18 | `#e1cfc7` | `#b4846c` `#cc9c84` `#6c543c` `#e4ccb4` `#b49c84` | hologram family photo album that turns its pages (zone r 2.0 m, 5.03 m clear path) |
| room-04 | Catherine dance series · Bass Coast · Festival | 15 | `#e6cdc1` | `#e4b49c` `#e4b484` `#cc9c54` `#9c6c54` `#543c24` | river-stone dancefloor with sunrise light ring (zone r 2.0 m, 5.03 m clear path) |
| room-05 | Brekkie Bitcoin B · Portrait · Bitcoiners | 19 | `#c3cee4` | `#243c6c` `#84b4cc` `#ccb49c` `#6c9ccc` `#cccc84` | oversized orange calcite B sculpture (zone r 2.0 m, 5.03 m clear path) |
| room-06 | Pacific Northwest | 21 | `#e7d4c1` | `#cc843c` `#fce4b4` `#e4b49c` `#e49c54` `#e4cc84` | mossy cedar stump with ferns and mist (zone r 2.0 m, 5.03 m clear path) |
| room-07 | El Salvador | 23 | `#bedbe9` | `#0c3c54` `#e4cc9c` `#24546c` `#e4ccb4` `#e4cc84` | volcano miniature with a Bitcoin Beach surf hologram (zone r 2.0 m, 5.03 m clear path) |
| room-08 | Sunset | 23 | `#e8debf` | `#e4cc84` `#0c84b4` `#e4cc6c` `#fce4b4` `#fcb40c` | sunset sky dome over a low reflecting pool (zone r 2.0 m, 5.03 m clear path) |
| room-09 | Bitcoiners · Animals | 23 | `#e3d4c4` | `#e4ccb4` `#e4cc6c` `#243c6c` `#ccb46c` `#b49c84` | bitcoin-orange animal topiary (zone r 2.0 m, 5.03 m clear path) |
| room-10 | Portrait | 23 | `#becfe9` | `#0c3c84` `#6c240c` `#9c6c3c` `#cc9c84` `#9c5424` | easel and stool, the painter-at-work hologram (zone r 2.0 m, 5.03 m clear path) |
| room-11 | Bitcoiners | 23 | `#e9c5be` | `#e46c54` `#cc9c6c` `#6cb4e4` `#ccb49c` `#6c3c24` | Bounty of Satoshi treasure chest hologram (zone r 2.0 m, 5.03 m clear path) |
| room-12 | Denny Blaine · Tahoma / Rainier · Seattle | 23 | `#e9ccbe` | `#fc9c6c` `#cc543c` `#e49c84` `#cccc6c` `#6c3c3c` | Mount Rainier relief model at dawn light (zone r 2.0 m, 5.03 m clear path) |

Wall colour = a light tint (lightness 0.83) of the most saturated frequent colour across the room's paintings. Palettes come from a median-cut of each image (`tools/palette.py`) after dropping near-white paper and near-black.

## Checks
- No blank wall segments: every room-wall segment between doorways has at least one painting (102 segments, 0 blank).
- Loops: every room has 2 or more doorways and there are no bridges. Independent loops: 6 through doorways, 18 counting courtyard routes.
- Sets: El Salvador Past/Present/Future and Sunset from Atami #1-#3 each hang in one row, in order. The Burning Man Temple 2022 four hang as a 2x2 grid. Everything is at true size with no overlaps.
