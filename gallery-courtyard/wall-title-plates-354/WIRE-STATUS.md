# Wall title plates 354: wire status (Oct 26 2026). Built but not deployed.
- Module: `play-tags/src/wallTitles354.js` (new). `tags.js` adds 2 lines after the groupLabels354 import and call. `frames.js` was not touched. Turn off with `?wtitles=0`. Status is in `window.__wtitles354`.
- Placement: each plate is 2.0×0.5 m, centred over the hang members' span, with its bottom edge 0.2 m above the top frame and clamped under the 4.2 m wall top. The small glabel354 label for that group is hidden so the two don't overlap.
  - bounty-of-satoshi (3/3 members): x 23.29, z 4.97, centre y 2.69 (grid top 2.24)
  - ukraine (3/3): x -8.15, z -24.67, centre y 2.23 (grid top 1.78)
  - reiki: **skipped**. There is no Reiki hang, room or work in the catalog or hang-overrides. To place it, add `members[]` or `door:"room-XX"` to the reiki entry in walltitles354.json.
- R2: tjm-images `play/preview-251/wall-titles-354/`: 6 webps + walltitles354.json. All returned 200 via img.tjm.art. A copy of the config is also in `public/wall-titles-354/`.
- Build: `/tmp/ptbuild-walltitles/dist` built with vite: 0 errors (only the chunk-size warning).
