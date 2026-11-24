# OVERNIGHT-NEXT — Gallery
Stamped ~10:22 PM PT, Mon Oct 26 2026

## LIVE
- **preview-251 `4ed8521f`** (Oct 26 ~10:30 PM PT): #488 window cards Frame/Glass 32→6 (−26). Entry index-D2kR8CrF.js. See DEPLOY-488.md. anon census: no shared-material sets ≥3 (all unique mats; book boxes carry userData.book) → anon is closed.
- **preview-251 `958e63e2`** (Oct 26 ~10:20 PM PT): #487 fountainJet 10→1 (−9 draws). Entry index-B51kQf-F.js. See DEPLOY-487.md. Next: remaining groups mostly unique-tex (hang art, roomSign) or held (glassDome, rayGlow, ostrich parts, glTF windows).
- **preview-251 `957dcefe`** (Oct 26 ~10:08 PM PT): #486 domeLeadLight 13→2 (−11). See DEPLOY-486.md.
- **preview-251 `7cf808a9`** (Oct 26 ~10:05 PM PT): #485 phone/low hang-plaque canvas 384x120 (~135→76 MB plaque tex on phone; desktop unchanged). See DEPLOY-485.md.
  Next: MED domeLeadLight (after textures load) / glassDome / rayGlow; #485 folded into patch-core.py (Oct 26 ~10:10 PM PT, no deploy).
- **preview-251 `b76722e8`** (Oct 26 ~9:50 PM PT): #484 domeLight+doorLightPool per-k merge (25→2 draws, −23). See DEPLOY-484.md.
  Plaque atlas scout HOLD (PLAQUE-ATLAS-SCOUT.md). Next: phone/low hang-plaque canvas 384×120; then MED domeLeadLight / glassDome / rayGlow.
- **preview-251 `45677f76`** (Oct 26 ~9:16 PM PT): #483 doorGlow/doorLight/walkRay → 1 draw each (−37); rayGlow skipped. See DEPLOY-483.md.
- **preview-251 `446da9e6`** (Oct 26 ~9:10 PM PT): #482 roomFloor 13→1. See DEPLOY-482.md.
- **preview-251 `1da5404f`** (Oct 26 ~9:01 PM PT): #481 overdoor/lintel/doorFlare → 3 draws. See DEPLOY-481.md.
- **preview-251 `95f22ebf`** (Oct 26 ~8:50 PM PT): #480 anon478Box shared-material sets (book lecterns 12, arch 3) merged -> 2 draws (LIVE dense 474 -> 409, median flat). See DEPLOY-480.md.
Next lean: roomFloor 13 (1 mat) merge; doorGlow/doorLight/rayGlow/walkRay share-material then merge; plaque atlas scout (no ship).
  Census: remaining hang478Part = per-painting plaques (unique textures, ~310) -> only an atlas would batch them (bigger job, touches plaqueTex); anon478 rest are unique-material book/sign planes. Next lean: per-room wall split if phone fill-rate shows; plaque atlas scout (no ship).
- **preview-251 `5b368ab8`** (Oct 26 ~8:40 PM PT): wall records (window.__wallRecs) for stickerWalls307 + tagsaudit, roomWalls merged per material -> 1 draw (LIVE spawn 313 -> 249, dense 539 -> 474, median 200 -> 187). See DEPLOY-WALLREC.md.
  Next: consider per-room wall split for culling; remaining hang478Part sets < 8; anon478 (31).
- **preview-251 `c1d57b53`** (Oct 26 ~8:25 PM PT): #48x hang478Rim frame backings -> 1 InstancedMesh (LIVE spawn 364 -> 313, median 219 -> 200). See DEPLOY-48X.md. Prior 9ab8feeb #479 pools/bars (DEPLOY-479.md).
  Next: wall-record prep (pos/ry/L/h/th) for stickerWalls307 + tagsaudit, THEN roomWall merge. Other candidates: hang478Art is per-texture (not instanceable); check remaining hang478Part sets < 8.
- **preview-251 `74d6cb37`** (Oct 26 ~7:55 PM PT): #478 named the unnamed meshes and merged cornices and jambs into 1 draw each (dense 730 -> 646 local). See DEPLOY-478.md. roomWall merge deferred: hang hooks and tagsaudit depend on per-wall meshes.
- **preview-251 `d01fc449`** (Oct 26 ~7:50 PM PT): #477F fence panel merge (~97 draws -> 1), see DEPLOY-477F.md. Prior d1e5978b #477 door-trim merge, DEPLOY-477.md. Next: scout item 3 (walls/cornice/jamb, MED, name the unnamed meshes first).
- **preview-251 `d1fe2e66`** (Oct 26 ~6:52 PM PT): #402 muralLod402 warn-once, see DEPLOY-402W.md. Prior f3ea9dd9: #475 builderErrs gaps, DEPLOY-475B.md. Prior d80c5c83 #307W. Prior: **`779aefe6`** (Oct 26 ~6:30 PM PT): #352 fence ground-AO, see DEPLOY-352AO.md. Prior: **`c8c400de`** (Oct 26 ~6:05 PM PT): #474 true-size rehang of room-06/4, see DEPLOY-474.md. Prior: 41cd44cc #338 Paul. Prior: f5e870c2 (Oct 26 ~5:24 PM PT): #473 group-label fit, see DEPLOY-GLFIT-473.md. Prior: **00d93b35** (Oct 26 ~5:02 PM PT): #470 ostrich bump maps (runtime UVs; GLB has none). See DEPLOY-470.md. Prior: 86c3189d Honeybadger master + #465.
- Alias: https://preview-251.tjm-tag-gallery-preview.pages.dev/play/

## In flight
- #465 shipped in 86c3189d

## Queued / invent
- After #465: next useful preview invent (lean) if Ultra still on
- light-probes-340 + Music packs/gobos parked until concert hall #10/#180

## Holds
- #349 Writer draft approved:false · #393 glitter · #394 Reiki · #335/#288 · #355 VO
- #340 gobos: Music locked 03-#1 leaf → album #2 (18 looks); concert-hall gate
- Selected Galleries / museum-parity: CANCELLED
- #391 hex: no deploy without TJ OK

Rules: no deploy without audit, no pinging TJ, SM batches only, cap retries at 3, one deploy at a time.

## Visual #470 ostrich bump (~waiting handoff)
Pack: gallery-courtyard/ostrich-bump-470/ — feather n/r/ao 2048+phone1024, skin strips, materials.json. Wire after #465. No remesh/deploy from Visual.

- Oct 26 ~4:55 PM PT: #465 code + audit done, UNDEPLOYED (honeybadger refresh has the next slot). LIVE still 61358e16. See DEPLOY-465.md.
- Oct 26 ~4:58 PM PT: honeybadger master + #465 DEPLOYED as 86c3189d (tagsaudit desktop+phone PASS). See DEPLOY-HONEYBADGER-MASTER.md.
- Oct 26 ~5:02 PM PT: #470 ostrich bump DEPLOYED as 00d93b35 (tagsaudit desktop+phone PASS). GLB has no UVs → runtime box/cyl UVs; ask Visual for UV-unwrapped GLB if seams bother. See DEPLOY-470.md.

## Next invent (scouted ~5:05 PM PT Oct 26)
**Pick: #392/#403 museum-tools offline polish (Buy Scanner + cart checkout proto)**, in /workspace/museum-tools only, not wired to play, nothing to deploy.
Why: the defer list is used up. testimap, sticker pair, plaque337 and wallmap are shipped, the remaining static imports are boot-critical, and ride.js is held for QA. Ostrich UV is doc-only and small. Phone cull/tier has no clear win without device QA. #392/#403 is unblocked by every hold, carries zero LIVE risk, and is agent-proposed.
Steps: 1) read BUY-SCANNER-392.md + CART-PROTO.md; 2) in museum-tools: cart persistence (localStorage), qty/remove, totals + empty state, scanner → cart add; 3) local `npm run build`/smoke only; 4) note in CART-PROTO.md; comment #403 (and #392). No play-tags change, no deploy.
Runner-up: ostrich UV follow-up doc (#470) asking Visual for a UV-unwrapped GLB.
Note: gallery-source-staging/play-tags is an OLD snapshot (static wallmap/testimap imports). Don't scout defers from it.

- Oct 26 ~5:23 PM PT: #403 cart polish done offline. #473 group-label fit (narrow stacks scaled to 0.55, hidden until the texture loads) DEPLOYED as f5e870c2. tagsaudit desktop and phone PASS. See DEPLOY-GLFIT-473.md.
- Oct 26 ~5:30 PM PT: #391 hex perf measured OFFLINE (HEX-PERF-391.md). 4 plaque PNGs (3.81 MB) → webp 0.36 MB staged in hex-perf-391-webp/. Not swapped and not deployed (needs TJ OK). LIVE still f5e870c2.
## Next backlog
- #391 plaque PNG→webp swap, ready once TJ OKs (~3.45 MB saved).
- Reiki label still has no target wall (#394 hold).
- Festival and Landscapes door-header labels are best guesses and need a Visual or TJ confirm.
- Phone HUD clutter scout needs device QA first.
- Ostrich UV-unwrapped GLB ask for Visual (#470).
- #391 WebP sharpness: all 4 PASS (see HEX-PERF-391.md). Ready for TJ decision; no swap.

- Oct 26 5:28 PM PT: Re-scout #351. Already shipped (start -10.3,-0.3,yaw 0.05, deploy 5f7e036a, sticky across catalog.py/apply-overrides.py/catalog.json). Left open for TJ's phone check. No deploy tonight; LIVE still f5e870c2.

- Oct 26 ~5:35 PM PT: #369 follow-up Walk cap 9 to 15 DEPLOYED as bece9ece (tagsaudit desktop+phone PASS). LIVE now bece9ece. See DEPLOY-369CAP.md.

- Oct 26 ~5:55 PM PT: #338 Paul annex hi-res DEPLOYED as 41cd44cc (tagsaudit desktop+phone PASS). 37 Paul Murphy paintings now get their 2400 px masters (the max pass ran before paulroom.build). LIVE now 41cd44cc. See DEPLOY-338-PAUL.md.
- Backlog: apply-overrides.py full rerun drifts x/z/s vs the committed catalog.json. Scout it before any rerun. #352 not touched.

## Oct 26 ~6 PM PT: apply-overrides drift scout (#474)
- APPLY-OVERRIDES-DRIFT.md. Full rerun = 8 works on room-06/4 shift 3-6 cm; cause honeybadger trueW unrounded hand-patch vs base 0.6382. Max fields: patch directly, never full rerun. Next: exact trueW into base/overrides + --check mode, then zero-diff verify. LIVE still 41cd44cc.
- Oct 26 ~6:05 PM PT: #474 slice 2 DEPLOYED as c8c400de. Full apply-overrides rerun: only room-06/4 changed (8 works, true honeybadger width). drift-check = 0. tagsaudit desktop+phone PASS. LIVE now c8c400de. See DEPLOY-474.md. Rule from now on: run tools/drift-check.py before any apply-overrides ship.
- Oct 26 ~6:30 PM PT: #352 fence ground-AO strip (one merged multiply decal) DEPLOYED as **779aefe6**. tagsaudit desktop and phone PASS. See DEPLOY-352AO.md. Staging play-tags is now marked STALE-DO-NOT-REGEN.md (both levels).
## Next backlog (~6:30 PM PT)
- #352: TJ eyeball of fence and AO darkness. Remaining #352 items are tuning only.
- Lean polish candidates: ostrich UV doc (#470), the null guard audit on try/catch-swallowed builders (S.err352 and friends, surfaced in the HUD debug).
- Oct 26 ~6:12 PM PT: #303 HQ base maps (Visual #477) DEPLOYED as **2990b99b**. tagsaudit desktop and phone PASS, now with the builderErrs gate. Tints kept, albedo mean-normalised. See DEPLOY-303.md. Queue: #307 neural stickers, then #358 window cards. #349 is parked.
- Oct 26 ~6:25 PM PT: #307 Neural Dance stickers (Visual #478) DEPLOYED as **632aa649**. tagsaudit desktop and phone PASS. Strips now feed the vinyl poses; the paintings are kept as the fallback. See DEPLOY-307N.md. NEXT: #358 window mesh cards (Visual #479). That means replacing the clerestory glow placement with facade cards plus GlowAttach. Not started.
- Oct 26 ~6:50 PM PT: #358 facade window mesh cards (Visual #479) DEPLOYED as **f6c9462b** (entry index-D8RD1gJ8). 16 cards on the courtyard facades, clear of doors, sill 2.75 m. Glows at GlowAttach x1.8, arched enabled. tagsaudit desktop and phone PASS, and builderErrs now gates glow358.err. LIVE now f6c9462b. See DEPLOY-358.md.
## Next backlog (~6:50 PM PT)
- #358: TJ night eyeball (glowGain, sill height). Possibly per-card emissive frame at night.
- #307: wall-decal placement of neural poses (not done). #352: AO darkness eyeball. Ostrich UV doc (#470). #349 / #391 still parked.
- Oct 26 ~6:45 PM PT: #307 wall-decal placement of Neural Dance poses (0.18 m, die-cut) DEPLOYED as **d80c5c83** (entry index-CzEFA0iQ). tagsaudit desktop and phone PASS. LIVE now d80c5c83. See DEPLOY-307W.md.
## Next backlog (~6:45 PM PT)
- #307: TJ eyeball of the decal size. #358 / #352 / #303: eyeball holds. Ostrich UV (#470): needs a UV-unwrapped GLB from Visual (ostrich-robot has none yet), so ask Visual. Null-guard audit on try/catch-swallowed builders. #349 / #391 still parked.
- Oct 26 ~6:55 PM PT: #475 builderErrs gap audit DEPLOYED as **f3ea9dd9** (entry index-r4132e0h). The 354 l/t/e and 352 AO catches are no longer silent, and __stickerWalls307 is now gated. tagsaudit desktop and phone PASS. LIVE now f3ea9dd9. See DEPLOY-475B.md.
## Next backlog (~6:55 PM PT)
- Eyeball holds: #307 decal / #358 / #352 / #303. Ostrich UV (#470): ask Visual. #349 / #391 parked. Possible: gate muralLod402/plaqueTex as soft warnings (non-failing) in tagsaudit.
- Oct 26 ~7:00 PM PT: #476 tagsaudit softWarnings (non-failing) for plaqueTex/muralLod402/plaqueEnlarge337/ride/tour. TEST-ONLY, no deploy, LIVE still f3ea9dd9. desktop and phone PASS, softWarnings []. See TAGSAUDIT-SOFTWARN-476.md.
## Next backlog (~7:00 PM PT)
- Warn-once on the silent tags.js update() muralLod402 catch (next deploy slot). Eyeball holds #307/#358/#352/#303. Ostrich UV (#470): Visual. #349/#391 parked.

- Oct 26 ~6:52 PM PT: muralLod402 warn-once DEPLOYED as d1fe2e66 (tagsaudit desktop+phone PASS, softWarnings []). HARD RULE (TJ via Studio mgr): hex/tag gallery only, no dungeon/museum work.
- Oct 26 ~6:58 PM PT: neuralDance drawDance warn-once DEPLOYED as **3385951c** (entry main-BK49ARJj.js). tagsaudit desktop and phone PASS, softWarnings []. LIVE now 3385951c. See DEPLOY-ND176W.md.
## Next backlog (~6:58 PM PT)
- Remaining silent hex catches: the tags.js prewarm r.compile (l.287) and the neuralDance running probe (l.169). Both are benign, so add a warn-once only if useful. Eyeball holds #307/#358/#352/#303. #349/#391 parked. Ostrich #470 parked (not hex).
- Oct 26 ~7:02 PM PT: prewarm r.compile + neuralDance probe warn-onces DEPLOYED as **f66a87aa** (main-DzVfLnIJ.js). tagsaudit desktop+phone PASS, softWarnings []. LIVE now f66a87aa. See DEPLOY-287W.md. tags.js has no silent catches left except gpu sniff (l.29) and sound.start (l.245), both intentional.
## Next backlog (~7:02 PM PT)
- Audit wiring done; stop warn-once churn. Eyeball holds #307/#358/#352/#303. #349/#391 parked. Ostrich #470 parked.
- Oct 26 ~7:20 PM PT: #391 base-texture budget DEPLOYED as **bda451e3** (index-DJcW2ww5.js). 5 works had been booting 2400 px bases; they now get a 512 px base and hi streams the 2400 original. Saves ~3.3 MB at boot. tagsaudit desktop+phone PASS. LIVE now bda451e3. See DEPLOY-391B.md.
## Next backlog (~7:20 PM PT)
- Other base >256 px outliers (780/868/1600 px) could get the same treatment if they have hi. Eyeball holds #307/#358/#352/#303. #349/#391-plaque swap parked (note: gen.py already serves plaques-webp). Ostrich #470 parked.
- Oct 26 ~7:25 PM PT: #391C last 4 local bases >512 px (780/748/868/1600) to b512 + hi DEPLOYED as **fe20c932** (index-llkoyEc0.js). tagsaudit desktop+phone PASS. LIVE now fe20c932. See DEPLOY-391C.md. #391 plaque WebP: ALREADY LIVE via gen.py (HEX-PERF-391.md).
## Next backlog (~7:27 PM PT)
- Remote 1600 px display bases (strawberry-point x15, paul-murphy x36, archived 19/433/436/437, hummingbird-190): measure what they boot at and consider a b512 slice. Check the 404 assets/*-plaque.png refs. Eyeball holds #307/#358/#352/#303. #349 parked. Ostrich #470 parked.
- Oct 26 ~7:40 PM PT: #391D DEPLOYED as **471e3a9a** (index-CfCCVGjI.js). 57 remote 1600 px boot bases (17.7 MB) moved to b512 + hi (2.4 MB), saving about 15 MB at boot. tagsaudit desktop+phone PASS. LIVE now 471e3a9a. See DEPLOY-391D.md. The assets/*-plaque.png refs are USED by basename (tags.js:143), so the 404 is cosmetic only and they were left for the TJ rename.
## Next backlog (~7:40 PM PT)
- Boot base budget is now done (every painting base is 512 px or less). Possible next: renderer.info draw-call/LOD scout. Eyeball holds #307/#358/#352/#303. #349 parked. #391 plaque rename needs TJ. Ostrich #470 parked.
- Oct 26 ~7:33 PM PT: renderer.info scout (DRAWCALL-LOD-SCOUT.md): dense rooms ran ~1100 calls, 2790 meshes, shadows static. #477 merged the door trims into 2 draws, DEPLOYED as **d1e5978b** (index-BpXMoCz3.js). Dense view 875 -> 767 calls. tagsaudit desktop+phone PASS. LIVE now d1e5978b. See DEPLOY-477.md. The studio-tracker Time comment was NOT posted (needs approval).
## Next backlog (~7:35 PM PT)
- Scout #2: fence352 merge (97 -> 1, shared material, UV-baked repeat). Scout #3: name the 228 unnamed meshes, then merge the walls/cornices. Eyeball holds #307/#358/#352/#303. #349 parked. #391 plaque rename needs TJ. Ostrich #470 parked.
- Oct 26 ~7:55 PM PT: #478 naming + cornice/jamb merge DEPLOYED as **74d6cb37** (index-BwwSfuHW.js). tagsaudit desktop+phone PASS local+LIVE, colliders 99. Next: roomWall merge via wall-record API (stickerWalls307 + tagsaudit), then hang478Part pools/bars. Time posted on studio-tracker #391.
- Oct 26 ~8:05 PM PT: #479 hang478Part pools+bars -> 2 InstancedMesh DEPLOYED as **9ab8feeb** (index-3lRe4SPL.js). LIVE spawn 436->364, dense 654->578, median 249->219. tagsaudit desktop+phone PASS local+LIVE. See DEPLOY-479.md.
## Next backlog (~8:05 PM PT)
- #1 roomWall merge: first give stickerWalls307 + tagsaudit wall records {pos, ry, L, h, th}, then merge per material. Then hang478Rim (frames, shared frameMat) could instance the same way if no per-frame material swaps (check frames.js/#301 first). Eyeball holds #307/#358/#352/#303. #349/#391-rename parked. Ostrich #470 parked.
- Oct 26 ~10:08 PM PT: #486 domeLeadLight per-k merge (13 -> 2, floorPatterns re-pointed so post-load tex swaps hit the merged mesh) DEPLOYED as **957dcefe** (index-BC5Zntr-.js). tagsaudit desktop+phone PASS local+LIVE, colliders 99. See gallery-courtyard/DEPLOY-486.md.
## Next backlog (~10:08 PM PT)
- glassDome merge HELD (transparent normal-blend caps, sort risk). Re-run _drawscout for remaining LOW-risk shared-mat merges. roomWall merge via wall-record API. Eyeball holds #307/#358/#352/#303. #349/#391-rename/#380/ride/Ostrich/atlas parked.
- Oct 26 ~10:20 PM PT: #487 fountainJet merge (10 static tubes on shared additive jetM -> 1; jetM opacity pulse intact) DEPLOYED as **958e63e2** (index-B51kQf-F.js). tagsaudit desktop+phone PASS local+LIVE (LIVE phone mute-meter flake on 1st run, rerun PASS), colliders 99. See DEPLOY-487.md.
## Next backlog (~10:22 PM PT)
- After #487 remaining visible groups are unique-texture (hang art 82, roomSign 9, glabel 6), animated (ostrich parts, rayGlow, fountainColumn), glTF windows (6/4, check material sharing next), or HOLD (glassDome). anon 29 mixed — next scout candidate (split anon by material uuid). Eyeball holds #307/#358/#352/#303. #349/#391-rename/#380/ride/Ostrich/atlas parked.
- Oct 26 ~10:30 PM PT: #488 glTF window-card merge DEPLOYED as **4ed8521f** (index-D2kR8CrF.js). tagsaudit desktop+phone PASS local+LIVE, colliders 99. See DEPLOY-488.md.
## Next backlog (~10:30 PM PT)
- Draw-call merges are mostly done. What's left is unique-texture (hang art, roomSign, glabel, anon planes; only an atlas would batch them), animated (ostrich, rayGlow, fountainColumn), or HOLD (glassDome). Next: re-run _drawscout for the median/dense delta, or stop merge work. Eyeball holds #307/#358/#352/#303. Parked: #349, #391-rename, #380, ride, Ostrich, atlas.
- ~10:35 PM PT: DRAWCALL-AFTER-488.md. LIVE 4ed8521f: spawn 207 / median 186 / dense 333 (from 1122). Merge lane closed. Invent lane paused pending TJ eyeballs/holds (glassDome, ostrich, rayGlow, atlas, #391 rename, hang478Rim merge would need approval). Nothing shipped.
