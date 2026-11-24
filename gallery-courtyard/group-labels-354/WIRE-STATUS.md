# #354 group wall labels — wire status (Oct 26 2026, NOT deployed)

## Files (in /workspace/play-tags)
- NEW `src/groupLabels354.js` — installs plaques (1.6 × 0.4 m, MeshStandard), `window.__glabels354` = {placed, skipped, err}; `?glabels=0` disables.
- NEW `public/group-labels/` — 28 webp (desktop + phone; PNGs skipped) + `labels354.json` (members per label, generated from src/hang-overrides.json).
- EDIT `src/tags.js` — 2 lines: import + `installGroupLabels354({ root, CATALOG, W, low: LOW })` (backup /tmp/tags.js.pre354l).
- Untouched: hang-overrides.json, eggs, agents.js, ostrichbot, BOOK_DEFS, #335 plaques, tour/wallmap, night/gobos/glows, play-tags/dist.

## Build
`npx vite build --outDir /tmp/ptbuild-354l/dist` ✓ (2.4 s). Adds ~1.1 MB of webp (~280 KB phone set; a client loads one set) + ~3 KB JS.

## Placement (labels.json has no positions; computed at runtime from catalog layout of each hang's members)
Centred over the hang, 6 cm above the top frame, capped below 4.2 m wall top; 5 mm proud of the art plane.
| label | wall | label centre y |
|---|---|---|
| Bitcoiners | room-07/4 (#353 4x4) | 3.14 |
| Temples | room-04/4 left 2x2 | 2.82 |
| Bass Coast Sunrises | room-04/4 right 2x2 | 2.70 (2.5 m apart from Temples, no overlap) |
| Renoirs & Ridges | room-12/4 Rainier + ridge strips | 3.25 |
| Father Paul | room-05/0 | 2.09 |
| Bounty of Satoshi | room-02/1 | 2.50 |
| Ukraine | room-11/5 | 2.04 |
| Small Watercolors | room-09/3 ($75 grid) | 2.60 |
| Attendees | room-10/3 | 2.49 |
| Forest Triptych | room-02/5 stack | 3.22 |
| Hummingbirds | room-09/1 stack | 2.25 |
| Festival · Burning Man | room-04 inner door header (inside face) | 3.75 |
| Landscapes by Size | room-01 ("Landscapes…") inner door header | 3.75 |

## Gaps
- **Reiki: not placed** — no Reiki hang, room, tag or titled work in hang-overrides/catalog. Needs a target wall from TJ/Visual.
- Festival · Burning Man and Landscapes by Size have no matching #354 hang → door headers (best guess); confirm.
- Forest Triptych (0.23 m wide) and Hummingbirds (0.36 m) stacks are much narrower than the 1.6 m plaque; may want a smaller scale.
- Not visually checked in a browser (no screenshot pass). Door-header side (inside vs nave) assumed inside; nave signs already sit at DOOR_H+0.39 outside.

## Remaining to deploy
1. Visual check in `vite preview` (desktop + phone/low), fix Reiki target.
2. Build to play-tags/dist and run the usual deploy (not done here). No GH comment posted.
