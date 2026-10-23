# Tag gallery v3: design note (issue #251, proposal only, tags not yet approved by TJ)

Layout: a 19-cell honeycomb (cell radius 9.9 m). The Central Pavilion is in the middle, ringed by 6 walkable open-air courtyards, with an outer ring of the 12 gallery rooms. Each room hex is sized to its paintings, from side 5.75 m (Mexico, Burning Man) to 8.75 m (Denny Blaine / Tahoma / Seattle). It sits centred in its cell with a planted terrace in the leftover band, so the plan still reads as one honeycomb of mixed-size hexes. Courtyards are full cells, all the same size.

## Pavilion and colonnades
- The pavilion holds the checkout (facing the start), slipgates to the Dungeon, Orsay, Bilbao, Uffizi and Guggenheim NY, and an inactive concert-hall placeholder. The start point is in the pavilion.
- Each of the 6 pavilion doors opens onto a straight open colonnade across a courtyard to the corner room beyond it.
- Open colonnades (columns on both sides, 2 m wide, 4.5 m high) also ring the pavilion, run between neighbouring courtyards (views into courtyards on both sides), and run along every courtyard edge to the edge rooms.
- Each room has 3 doors: two to its ring neighbours (the outer loop of 12 rooms) and one onto a courtyard colonnade toward the pavilion.
- Walk to the pavilion, room centre to pavilion centre: mean 34.3 m, max 34.3 m (every room is the same distance when courtyard paths are used). Colonnades only: mean 35.6 m, max 37.0 m.

## Courtyards (walkable)
Each courtyard is split by its crossing colonnade. There is a fountain on each side with a ring path around it, paths out to every colonnade edge so you can step out between the columns and cross, and planting beds in the corners away from the paths. Courtyard paths add extra routes between colonnades.

- court-1: borders hub, room-02, room-04, room-03, court-2, court-6
- court-2: borders hub, room-04, room-10, room-05, court-3, court-1
- court-3: borders hub, room-05, room-11, room-09, court-2, court-4
- court-4: borders hub, room-09, room-07, room-08, court-3, court-5
- court-5: borders hub, room-08, room-01, room-06, court-6, court-4
- court-6: borders hub, room-03, room-06, room-12, court-1, court-5

## Rooms: wall colour, palette, centerpiece (suggestions only)

| Room | Main tags | Paintings | Hex side | Wall colour | Palette | Centerpiece suggestion |
|---|---|---|---|---|---|---|
| room-01 | Mexico | 10 | 5.75 m | `#e3d4c4` | `#e4ccb4` `#b45424` `#e49c54` `#ccb49c` `#e4cc9c` | papel picado canopy hologram (zone r 1.58 m) |
| room-02 | Burning Man · Festival · Burning Man Temple 2022 | 13 | 5.75 m | `#e9d4be` | `#fccc9c` `#9c543c` `#e4b484` `#e4cc9c` `#ccb484` | slowly turning wooden temple model (no fire) (zone r 1.58 m) |
| room-03 | Family · Political portraits | 18 | 6.25 m | `#e1cfc7` | `#b4846c` `#cc9c84` `#6c543c` `#e4ccb4` `#b49c84` | hologram family photo album that turns its pages (zone r 2.0 m) |
| room-04 | Catherine dance series · Bass Coast · Festival | 15 | 6.25 m | `#e6cdc1` | `#e4b49c` `#e4b484` `#cc9c54` `#9c6c54` `#543c24` | river-stone dancefloor with sunrise light ring (zone r 2.0 m) |
| room-05 | Brekkie Bitcoin B · Portrait · Bitcoiners | 19 | 6.25 m | `#c3cee4` | `#243c6c` `#84b4cc` `#ccb49c` `#6c9ccc` `#cccc84` | oversized orange calcite B sculpture (zone r 2.0 m) |
| room-06 | Pacific Northwest | 21 | 7.0 m | `#e7d4c1` | `#cc843c` `#fce4b4` `#e4b49c` `#e49c54` `#e4cc84` | mossy cedar stump with ferns and mist (zone r 2.0 m) |
| room-07 | El Salvador | 23 | 7.75 m | `#bedbe9` | `#0c3c54` `#e4cc9c` `#24546c` `#e4ccb4` `#e4cc84` | volcano miniature with a Bitcoin Beach surf hologram (zone r 2.0 m) |
| room-08 | Sunset | 23 | 7.0 m | `#e8debf` | `#e4cc84` `#0c84b4` `#e4cc6c` `#fce4b4` `#fcb40c` | sunset sky dome over a low reflecting pool (zone r 2.0 m) |
| room-09 | Bitcoiners · Animals | 23 | 7.5 m | `#e3d4c4` | `#e4ccb4` `#e4cc6c` `#243c6c` `#ccb46c` `#b49c84` | bitcoin-orange animal topiary (zone r 2.0 m) |
| room-10 | Portrait | 23 | 7.25 m | `#becfe9` | `#0c3c84` `#6c240c` `#9c6c3c` `#cc9c84` `#9c5424` | easel and stool, the painter-at-work hologram (zone r 2.0 m) |
| room-11 | Bitcoiners | 23 | 7.75 m | `#e9c5be` | `#e46c54` `#cc9c6c` `#6cb4e4` `#ccb49c` `#6c3c24` | Bounty of Satoshi treasure chest hologram (zone r 2.0 m) |
| room-12 | Denny Blaine · Tahoma / Rainier · Seattle | 23 | 8.75 m | `#e9ccbe` | `#fc9c6c` `#cc543c` `#e49c84` `#cccc6c` `#6c3c3c` | Mount Rainier relief model at dawn light (zone r 2.0 m) |

The wall colour is a light tint of the most saturated frequent colour across the room's paintings (median-cut per image in `tools/palette.py`, with paper white and near-black dropped).

## Checks
- Blank room-wall segments: 0 of 108. Overlaps: 0. Everything is at true size.
- Loops: 30 independent loops through doors and colonnades, 54 counting courtyard paths. No dead ends and no bridges. Every room has 3 doors and the pavilion has 6.
- Sets: El Salvador Past/Present/Future and Sunset from Atami #1-#3 each hang in one row, in order. The Burning Man Temple 2022 four hang as a 2x2 grid.
- Windows are only in the colonnades. Room walls carry paintings.
