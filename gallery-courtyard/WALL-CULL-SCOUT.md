# Wall per-room cull scout (NO SHIP) - Tue Oct 27 2026 ~12:25 AM PT
LIVE stays 4ed8521f (index-D2kR8CrF.js). Source reverted. Patch kept at /tmp/tags.js.wallcull-scout.
- Change tried: in tags.js #wallrec, group the merge by room+material (key room|matIndex) instead of material only. __mWall {recs:120, draws:14, pieces:120}, 14 roomWallMerge meshes, no err. First try crashed on r.mat.uuid (some recs have undefined mat) and fell back soft, which confirms fail-soft works. Fixed by keying on material identity.
- _drawscout desktop 1280x800 swiftshader. BEFORE is LIVE 4ed8521f, AFTER is local:
  - spawn 223 -> 222. median 186 -> 186. dense top5 [333,287,280,263,226] -> [332,286,279,262,224].
  - Densest view: 8 of 14 roomWallMerge draw (7 of them far) and 6 are culled. Before, there was 1 always-on draw.
- Verdict: no meaningful win (+/-1 call, within noise). Walls are 12-tri boxes, so culling saves no tris, and off-screen boxes cost no fill. Per-room splitting turns 1 draw into 8 in dense views. Not worth applying to cornice/jamb/roomFloor either.
