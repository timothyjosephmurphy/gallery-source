# apply-overrides drift scout (agent-proposed, Oct 26 2026 ~6 PM PT)

Method: copied play-tags/src + tools to /tmp/drift (public symlinked), ran `python3 tools/apply-overrides.py` there, diffed against committed play-tags/src/catalog.json. LIVE catalog untouched.

## Result: drift is small and has one cause
- Same 310 paintings, no adds/drops, no exclusion change.
- Only 8 works move, all on room-06 wall 4: honeybadger-and-cub-with-genesis-block, archived-painting-193/233/368/369/371/373, book-art-c347459aa3f77f7213ae. Shift 3 to 6 cm along the wall (x +0.03..0.06, z -0.02..-0.04). Their plaqueAt follows. `s` unchanged.
- Fields changed: x, z, plaqueAt (7), trueW (1). Top-level `repack` and `spread` reports differ only in that wall's free space.

## Root cause
Committed honeybadger trueW = 0.6381847914963206 (4683/7338, the new master aspect, hand-patched during DEPLOY-HONEYBADGER-MASTER). The pipeline source (catalog.base.json, w=0.6382) is rounded, and repack.py:102 sets trueW from w. Regen packs the wall with 0.6382 instead, so the repack of room-06/4 shifts every frame after it by a few cm. The committed catalog is the hand-patched one; the pipeline cannot reproduce it.

## Which steps mutate hang
In order: split (#299, s nudge +0.01k), re-hangs from hang-overrides (x/z/s), #300 doorway displace, rows.displace/stash/place (#323), spread.place + place_relaxed (#309), spread.plan, repack.run (re-centres every wall from true widths: the sensitive step), paulroom.build/place, #295 cormorant outer wall, #354 eagle plaque, #323 friends court teaser. Max-field passes (lines 60 and 100) only write max/maxW/maxH and never touch geometry.

## Other drift risks (not triggered tonight)
- LIVE fetch of tjm.art/checkout/cart/catalog: product adds/removals feed paulroom and splits; a shop change can move the Paul annex.
- /workspace/gallery-core/src/splits.json and gallery-hires-338/hires-338.json are outside the repo.
- Needs public/art present (PIL opens webps); without it the script crashes after base.json exists.

## Safe to regen only max fields?
Yes. Patch max/maxW/maxH straight into committed catalog.json from hires-338.json (as #338 did). Do not run the full script to refresh max.

## Fix options (not shipped)
1. Put trueW=4683/7338 for honeybadger in catalog.base.json (or a trueW override in hang-overrides.json) so regen reproduces committed geometry; then full rerun should be zero-diff.
2. Or accept 0.6382 and the 3-6 cm shift on room-06/4 (needs tagsaudit desktop+phone before any deploy).
Add a `--check` mode that runs to a temp file and prints the diff, so drift is caught before any ship.

## #474 slice 1 (Oct 26 2026 ~6:10 PM PT)
- Corrected root cause: committed room-06/4 geometry was packed with the OLD honeybadger width (w 0.7002, fw 0.7602; committed layout.tags still shows w 1.0503 = 0.7002x1.5). The master-aspect hand-patch updated trueW/w but not positions. Proof: scratch rerun with base w=0.7002 gives 0 x/z/s/plaqueAt diffs vs committed; with exact 4683/7338 the same 8 works move 3-6 cm (free space 0.38 -> 0.47 m).
- So no true-size base can reproduce committed geometry. The rerun shift IS the true-size correction.
- Shipped to source only: play-tags/src/catalog.base.json honeybadger w=iw=4683/7338 (backup /tmp/catalog.base.json.bak474). LIVE catalog.json untouched, no deploy.
- Added play-tags/tools/drift-check.py: scratch rerun + geometry diff, never writes repo; exit 1 on drift (now 23 fields, room-06/4 only).
- Next: to land true-size, run full apply-overrides, tagsaudit desktop+phone, deploy as its own slice.
