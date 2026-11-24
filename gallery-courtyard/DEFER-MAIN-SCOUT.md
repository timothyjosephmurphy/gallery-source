# DEFER-MAIN-SCOUT: what is still in `main` (Tue Oct 27 2026 ~12:40 AM PT)
LIVE 56a62895 (index-C6VDMZMR.js) was not changed. Doc only, nothing shipped.
Method: `vite build --sourcemap --outDir /tmp/dmscout` from /workspace/play-tags (same build as #489: main 771.23 kB / 204.8 gz, vendor-three 808.6 kB). Minified bytes were attributed to source files through the sourcemap (/tmp/smsz.py).
NOTE: /workspace/gallery-source-staging/play-tags is a STALE handoff copy with no vendor-three. Don't build from it.

## main 771 KB broken down (minified bytes)
| source | bytes | boot-critical? | verdict |
|---|---|---|---|
| play-tags catalog.json (455.6 KB src, inlined as a JS object literal; the sourcemap credits it to move.js's span, ~410 KB) | ~410 K | YES, the hang/layout needs it | KEEP for now. **Biggest lever:** emit it as `JSON.parse('...')` or a fetched .json for a phone parse win (V8 parses JSON about 1.5-2x faster than an object literal). It's imported by the shared gallery-core/src/main.js, so changing it touches the core and needs its own scout/approval. |
| gallery-core main.js | 60.7 K | yes | KEEP |
| gallery-core gravgun.js | 55.2 K | used at boot by the core weapon slots | KEEP (shared core; museum dungeons frozen) |
| tags.js | 38.3 K | yes | KEEP |
| gallery-core glitterblower.js | 30.5 K | - | OFF-LIMITS (no glitter) |
| courtyard296.js | 14.8 K | geometry/portal | KEEP |
| gallery-core shopscan / books / chaos / soup / holo / look | 11.7 / 10.8 / 8.3 / 6.6 / 5.5 / 7.3 K | wired in the core init | KEEP (core change; frozen lane) |
| garden (garden/domes/util) | 16.7 K | yes | KEEP |
| tags-world.js | 8.8 K | layout | KEEP |
| ride.js (+ostrichbot 3.8 + duckbot 2.2 + ostrichBump470 2.6) | 8.6 K (17.2 K chain) | no | **PARK** (ride QA; ostrich #470 parked; tour.js shares ostrichbot) |
| elves-hd (museum-eggs) | 8.6 K | core | KEEP |
| horizon352 | 6.6 K | #352 | HOLD, do not touch |
| nostr-wall.js | 5.2 K | paints the fallback board synchronously in courtyard294 | KEEP. Below the ~8-10 KB bar, and deferring it would leave the board blank at boot |
| overlays303 | 5.2 K | #303 | HOLD |
| glows358 | 4.7 K | #358 | HOLD |
| phone304 | 4.4 K | gates phone movement | KEEP |
| labels/titles/eagle354, shafts357, muralLod402, plaqueTex | <2.1 K each | hang/tiny | KEEP (no gain) |
| neuralDance | 0 | not in main (only in stickerBot306, already deferred) | n/a |

## Verdict: NOTHING SAFE TO SHIP
The only play-tags-local optional module that isn't on hold is nostr-wall (5 KB), which is below the bar and visible at boot. Everything at or above 8 KB is boot-critical, shared gallery-core (frozen), on hold (#303/#352/#358), off-limits (glitter), or parked (ride chain). The play-tags defer lane is finished after testimap/sticker/plaque337/wallmap.

## Next levers (need scout/approval)
1. catalog.json as a JSON.parse string or a fetch: ~410 KB of main, a phone parse win, touches the gallery-core import. Biggest remaining win.
2. ride chain defer (17 KB) after ride QA.
3. Core-side lazy loading of gravgun/shopscan/books/chaos (~86 KB) would need a core change across museums. Frozen.
