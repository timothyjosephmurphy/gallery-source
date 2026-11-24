# #300 Doorways scout (Oct 26 2026, 3:15 PM PT). Scouting only. No edits, no deploy.

## Verdict: the geometry is already wired and on the preview. Polish is optional.
- `play-tags/src/tags-world.js:5-6` sets DOOR_W 2.2 m, DOOR_SPRING 2.4 m and DOOR_H 3.5 m. The arches are round and centred on each wall segment. The 4.2 m wall leaves 0.7 m above the apex.
- `tags.js:76` adds the tympanum and arch ring outside the opening, so the walkway does not get narrower.
- Signs: `tags.js:218` lifts the nave signs to DOOR_H+0.39, about 3.89 m. That clears the apex and sits under the wall top. The #296 mosaic signs are set in the floor, so they are not affected.
- The #295/#296 trim is fitted to the arch. `courtyardstyle.js:38-40` builds the slate/gilt rings with RingGeometry semicircles at the spring line and jambs at the spring height. `trim-motif.webp` is loaded.
- The preview went out on preview-251 (94d73423), per the #300 comment.

## Missing or unwired Visual assets
- `doorway-invite-288/` contains arch-reveal, threshold-glow and header-banner (desktop and phone webp). No code in `src` references them, so they are not wired. arch-reveal is a 4.0 m strip with U-repeat. One arch run is about 8.3 m (2×2.4 jambs + π×1.1), so it tiles about 2×. It fits; no new art is needed.
- No asset is missing for #300 itself.

## Rehang risk: low to medium
- Wider doors take wall length away from the paintings beside them. The checkpoint says the displaced paintings were re-hung (true size, in the 48 in band). This should be re-checked against #294-296/#299 if any of those changed the layout after that.
- `catalog.json` still has `layout.hall.doorHeight: 2.6`. The code uses DOOR_H, so this is a stale-config risk if any consumer reads the JSON.
- Phones: only the known #304 overlap (#tswap/#tmove) was flagged.

## Recommended overnight next step
1. When no splice or deploy is running, run the collision/walk and phone checks against the preview again, and run a hang-overlap audit for paintings within 0.3 m of the jambs.
2. Optionally wire `arch-reveal` and `threshold-glow` (#288) onto the arch ring.
3. Sync `catalog doorHeight` to 3.5.
4. Then hand off for TJ's preview review. Do not deploy to live.

## Update Oct 26 2026, 3:40 PM PT: catalog doorHeight synced
- `play-tags/src/catalog.json` `layout.hall.doorHeight` 2.6 → 3.5. It is metadata only: no current src/tools code reads it (only the old `main.js.orig` did). Geometry and collision use `DOOR_H` in `tags-world.js:6`. No build, no deploy.
- Not changed: `catalog.base.json`, `tools/catalog.py:67` (would write 2.6 again on regen), and `gallery-source-staging/play-tags`. Backup is at /tmp/catalog.json.bak300.

## Update Oct 26 2026, 3:45 PM PT: regen sources synced
- `layout.hall.doorHeight` 2.6 → 3.5 in `play-tags/src/catalog.base.json`, `play-tags/tools/catalog.py:67`, and the staging `catalog.base.json` (it matched the main copy exactly). Staging `tools/catalog.py` was left alone because it differs from the main copy at line 68.
- Note: `tools/catalog.py:74` deletes `src/catalog.base.json` and then runs apply-overrides. Line 67 is the value that counts on regen.
- No build, no deploy. Backups are in /tmp/*.bak300.

## Update Oct 26 2026, ~3:35 PM PT: staging catalog.py
- `gallery-source-staging/play-tags/tools/catalog.py:67` doorHeight 2.6 → 3.5 (was left at 2.6 earlier because line 68 differs from main). Backup `/tmp/catalog.py.staging.bak300`.
