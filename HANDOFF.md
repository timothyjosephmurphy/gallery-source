# Handoff to ChatGPT (Codex / Agent mode): website and 3D gallery development

Written Fri Oct 23, 2026, 1:15 PM PT, for TJ Murphy (artist, Vermillion Aurora Productions). You take over for a few days (about Oct 24 to 27) while Grok Bot usage is exhausted. TJ's Grok Bot did all work so far. This file is self-contained; facts come from box files and GitHub cards as of today. If something here conflicts with a card in the tracker, the newest TJ comment wins. If unsure, do not guess: comment on the card and ask TJ.

You are not given secrets. Anything named "ask TJ" below is something TJ must hand you or set up. Never print, commit or paste keys, tokens, passwords or env values.

---

## 1) What exists and where

**Product.** A 3D walkable art gallery (plain three.js, built with Vite) of TJ's paintings, shown at https://tjm.art/play/ (the live "dungeon" gallery) and, in development, a new hex-cell "tag gallery": a courtyard with a fountain at the centre, 12 hexagonal rooms around it clustered by painting tags, a minimap, a guide bot, a checkout portal in the fountain.

**Where the work lives:** the source is now in the private GitHub repo `timothyjosephmurphy/gallery-source` (this repo), copied from the box `/workspace` on Oct 23, 2026. Original box paths are listed below. Treat this repo as the source of truth and commit as you go (see section 6).

| What | Path (box) / repo | Notes |
|---|---|---|
| Tag gallery app (the main target) | `play-tags/` | Vite, `base: '/play/'`, three ^0.170. `src/` (tags.js, tags-world.js, ostrichbot.js, ride.js, tour.js, wallmap.js, courtyard29x/296 files, frames.js, catalog.json, hang-overrides.json, museum.config.js), `tools/` (python and node data tools), `tests/` (audits), `deploy/` (gen.py, execute.js, splice.py), `public/` (art, courtyard, pbr, plaques). |
| Shared engine | `gallery-core/` | `vite-core.js`, `src/` (museum-eggs, museum-gates, main.js), `oneapp/build.py`, tests. `play-tags/vite.config.js` imports `../gallery-core/vite-core.js`, so keep both dirs side by side. |
| Layout design data | `tag-gallery/` | `DESIGN*.md`, `HANDOFF.md`, `tools/{extract.mjs,imgdims.py,layout.py,palette.py,diagram.py}`, `data/{layout.json,works.json,imgdims.json,palette.json}`. layout.json contract: rooms (center, radius, apothem, walls k=0..5 with normal angle 60k deg), corridors, paintings (true size w/h, frame, plaque at 1.45 m), gates, checks. |
| Courtyard art and data | `gallery-courtyard/` | `data/` = `missing-paintings.json`, `prices.json`, `testimonials-map.json`, `book-art-duplicates.md`. `hq-assets/` = PBR textures and `manifest.json`, `report.md`. Also mosaic, dome-glass, sign PNG/WebP. |
| Guide bot model | `ostrich-robot/` | `ostrich-lod0.glb` (7,818 tris, 247 KB, desktop), `ostrich-lod1.glb` (2,132 tris, 147 KB, phone), `build.py` (Blender 4.2.3 script), `NOTES.md` (node names, clips, materials). |
| Older notes | `gallery-handoff/` | `HANDOFF.md` (museum galleries, shared modules; background), `tj-fixes-1022.md` (TJ's Oct 22 fix list), `issue309.md` (missing paintings). |

**GitHub repos** (account `timothyjosephmurphy`):
- `vermillionaurora` (public, branch `main`): the tjm.art website (Astro; Cloudflare Workers Builds deploys on merge to `main`). Live gallery files ship as `static/play/`. Open a PR; never push to `main` without TJ.
- `studio-tracker` (private): the issue board. All specs live on its cards. You need read and comment access.
- `relaygate` (public, MIT, branch `main`): the Relay Gate spec and importer. Public, so nothing sensitive goes in.
- Chase's repo `websitehandoff5-svg/chase-toole-site`: **off limits.**

**URLs**
- Live (do not touch): https://tjm.art/play/
- Preview (all gallery work goes here): https://preview-251.tjm-tag-gallery-preview.pages.dev/play/ (Cloudflare Pages project `tjm-tag-gallery-preview`, branch alias `preview-251`, noindex, nothing links to it). Each deploy also gets its own hash URL like `https://94d73423.tjm-tag-gallery-preview.pages.dev/play/`.
- Image proxies used by the build: `/play/art/` and `/play/pbr/` come from tjm.art, `/play/img/` from img.tjm.art (R2; ostrich GLBs sit at `img/play/preview-289/`), `/play/mva/` from media.vermillionaurora.com.

**Commands** (run in `play-tags/`)
```
npm install
npm run check                      # doorcheck: layout and door sanity
npm run build                      # testimonials.mjs + doorcheck + vite build -> dist/ (base /play/)
npm run dev                        # local dev, or: npx vite preview --port 4173
# data tools (run from play-tags/): tools/apply-overrides.py, rows.py, catalog.py, realdims.py, fix317.py, whitemargin317.py
# Regenerate layout (after a tag change): see tag-gallery/HANDOFF.md
```
Audits in `play-tags/tests/` (Playwright, run against a local or preview URL, desktop and phone `390x844`):
`tagsaudit`, `shopaudit.local`, `eggaudit.local`, `clearaudit`, `jumpaudit`, `touraudit` (set `TOURRATE=2`), `wallmapaudit`, `checkout308`, `ride314`, `gbmenulock308`, `testiaudit`, `bananaaudit`, `loadperf`. Batch runners: `tests/_runall.sh <tag> <audit...>`, `tests/_seq.sh`. Example: `node tests/tagsaudit.mjs http://localhost:4173/play/ desktop` then `... phone`. A known, accepted phone failure: tagsaudit's mute precondition (no sound measured before muting).

**Deploy (preview only).** Method: `python3 deploy/gen.py tjm-tag-gallery-preview` reads `dist/` and writes `deploy/_worker.js` (a single Pages worker with the built files embedded; art and PBR are proxied, a few new local images are inlined by filename, e.g. names containing `-317`; large new textures go to R2 under `play/preview-NNN/`). `deploy/execute.js` then posts that worker as a Pages deployment with branch `preview-251`. Grok Bot ran `execute.js` through a Cloudflare API connector. You will use `wrangler` instead (needs TJ's preview token, section 6). Rough equivalent: `npx wrangler pages deploy <dir> --project-name tjm-tag-gallery-preview --branch preview-251`. Keep the noindex header, the `/play/` base and the proxy rules from `_worker.js`; compare against the current preview first.

**One deploy at a time.** Never run two deploys in parallel; wait for the previous to return 200 on the preview URL.

**Asset formats.** Models are GLB with meshopt compression (gltf-transform, `MeshoptDecoder` in the loader). Two LODs: LOD0 for desktop, LOD1 for phones (<2.5k tris, under 300 KB each). Textures: WebP; target is KTX2/Basis with mipmaps (#303). Paintings render at true size in metres from `catalog.json` plus `hang-overrides.json`; images are web WebP from tjm.art (hi-res originals are not on the box).

**Data files.** `play-tags/src/catalog.json` is built from `catalog.base.json` by `tools/apply-overrides.py`: edit `hang-overrides.json` and rerun, not the catalog. Also `tools/realdims.json` (true sizes, border values), `src/testimonials.json`, `gallery-courtyard/data/*.json`, `tag-gallery/data/layout.json`.

---

## 2) Hard rules from TJ (do not break)

1. All gallery work goes to the **preview only** until TJ approves in writing. No live deploy, no merge to `main` that changes `/play/`, no public links to the preview.
2. **Never touch Chase's repo** (`websitehandoff5-svg/chase-toole-site`) or his Cloudflare account, and **never move or rename `/play/media/`** on any site.
3. **No prices and no emojis in public copy** (plaques, posts, blog, site text). Prices only appear where the real shop data lists them, and never on social copy.
4. Business name is **"Vermillion Aurora Productions"** (sole proprietorship). Never write "LLC".
5. **Never print or commit secrets** (API keys, tokens, env values, Nostr private keys, layout save URLs). Name them only as "ask TJ". If you see one in a file, say so to TJ without echoing it.
6. **Deploy one at a time.** Preview only. Do not touch main-site production.
7. **Confirm with TJ before destructive git steps** (force-push, reset --hard, rebase of pushed commits, deleting branches or files). Prefer new branches and PRs.
8. The **Relay Gate repo is public**. Make no public Relay Gate mentions beyond what is already published (README and spec on GitHub). Do not post, tweet, announce or contact anyone.
9. Do not send emails, messages or posts, create purchases, or contact people on TJ's behalf. Draft only.
10. True size for paintings: never stretch. (Preview-only exceptions TJ approved: preview paintings hang at 1.5x display scale, `MUSEUM.artScale = 1.5`; a few named pairs are enlarged per `gallery-handoff/tj-fixes-1022.md`.) One painting per frame. No overlaps. Plaques beside each painting at 1.45 m, never blocked.
11. No dead ends: every room and hallway is on a loop. The word "DMT" appears nowhere in the shipped build.
12. Original designs only (procedural geometry, synthesized audio, own models). Phone performance matters: LOD tiers, silent when muted.
13. Do not PUT or DELETE the layouts Worker (`tjm-play-layouts`). Read only.
14. Do not use `pkill` by pattern; stop only your own process by PID.

---

## 3) Prioritized queue (next four days), with TJ's requirements

Status note: items marked "started" already have code in `play-tags/` from Grok Bot but no deploy and no comment on the card yet. Verify in the preview, finish, then comment. Cards live at `https://github.com/timothyjosephmurphy/studio-tracker/issues/N`. Before each deploy, run the audits listed in section 1 on desktop and 390x844.

**Day 1: guide bot and the picture-quality bugs TJ reported Oct 23**

1. **#321 Guide bot walks by default (started).** TJ: "the guide bot should be walking by default, not flying." Use the ostrich's Walk clip as the default idle and travel state on the floor (clips: Walk, Fly, Hover, Takeoff, Land, Flip, Point_L, Point_R). Flying is at most an occasional flourish. Keep the hologram projector, the hover menu (#308) and the ride tour (#314). Supersedes the older "hover by default" rule. Source: `src/ostrichbot.js`, `src/eggs-run.js` (`droneFly:false`).
2. **#322 Guide bot larger, about waist height (started: `BOT_SCALE = 1.1`).** TJ: "roughly waist height (about 1 m)." The model is about 0.88 m tall at scale 1. Keep the ride seat, walk default and ride tour working at the new size; check it does not block doorways (now 2.2 m arches) or paintings. Purple ostrich, original design; #163 chunkier variant is related.
3. **#317 No white borders on paintings.** TJ, iPhone: "a row of paintings, including the small portraits in black frames, show a white border on the left/right sides between the image and the frame. The image should fill the frame edge to edge." Second example: El Salvador "Sunset from Atami". TJ asks to check EVERY painting. Do an automated pass: detect near-white edge rows and columns on every hung image, crop them or set the border values in `realdims.json` so the picture fills the frame; report the list fixed. Started: `tools/whitemargin317.py`, `fix317.py`, `real317.py`, `fix317-flags.json`. Screenshots on box: `white-border-report*.png` (ask TJ if you need them).
4. **#318 Forest Triptych (TJ Forest 302/303/304).** TJ: hang at actual size, "make sure they hang as a triptych." Cause: the gallery uses a 1200x630 preview card with white around a thin strip. Find the real painting image, crop to the painting only, use the true size (catalog frame 0.367 x 1.633 m), hang three panels in order, same height, small even gap, one plaque. Ask TJ for sizes if not recorded.
5. **#320 Ukraine paintings in one row at true sizes.** TJ: "make sure all the Ukraine paintings are hung on one wall together, in a row." Match by title, tag or collection (include "Vision of Ukraine at Peace" and the Ukraine portraits). Single row, true sizes, even gaps, common eye line, no overlaps, passes audit. If one wall is too short, use the longest and tell TJ before splitting. Started: `hang-overrides.json` "#320 Ukraine" row via `tools/rows.py`.
6. **#319 Strawberry Point on one wall in the Pacific room.** All 15 Strawberry Point works (including the Backpacking Trip pieces) on one tidy wall at true sizes. Confirm the "Pacific" room name against the layout first; ask TJ if unclear. Leave Travis at Bass Coast where it is. Started via the same rows tool.

**Day 2: tour, checkout and navigation**

7. **#314 Ride tour (deployed to preview; verify and polish).** Visitor picks "Ask for guidance", hops on the purple ostrich, which walks the tour looping the hex galleries and ending at the courtyard; a "Get off" button is visible at all times and dismounts at the current spot. The bot points with head and beak but its head must never block the painting being pointed at. Works on desktop and phone. Needs the saddle and RiderSeat node (exists in the GLB).
8. **#308 Hover menu and checkout route.** Hover (desktop) or tap (phone) the guide bot shows "Take me to checkout" and "Ask for guidance". TJ: clicking the guide bot must free the mouse so the menu is clickable (pointer lock released; mouse retaken when the menu closes). "Take me to checkout" must really arrive and open checkout, empty or full cart, desktop and phone; route target is data-driven (the checkout is the walk-in fountain portal from #296). Mostly deployed Oct 22; re-verify after the #321/#322 changes.
9. **#316, #315 painting fixes.** #316: replace the low-res duplicate "Lake in the North Cascades" with the hi-res one, at the same size as the centre painting, with correct Not-for-sale status. #315: Painting #2 and "Sunrise on Rainier with Eagle" kept both, same size (assumed same width 60 in), stacked on one wall. Ask TJ whether same width or same height was meant.
10. **#304 Phone Myst-style tap-to-move.** Both modes always active: quick tap on floor or doorway glides there (glowing target ring, stops short of walls); tap a painting walks to a viewing spot; press-drag lower-left spawns a floating thumbstick; drag elsewhere looks. First-visit hint: "Tap to walk, drag to look." Existing tap actions keep priority. iPhone test.

**Day 3: layout and data**

11. **#309 Missing paintings and #310 Paul Murphy room.** Gallery had 215 unique pieces vs 362 tjm.art product pages; 67 of the missing were hung Oct 22. Remaining: Cormorant Presiding over Sunset (60 x 40 in) and the 38 `paul-murphy-painting-*` pieces, which TJ's #310 wants in a side room off the main galleries at true size, each with frame, plaque and product link. (An older fix note says hold the Paul pieces; #310 later asks for them. Ask TJ to confirm.) List of URLs and sizes: `gallery-handoff/issue309.md` and the comment on card #309. Fix Romance in Yelapa's link to `/products/romance-in-yelapa/`.
12. **#300 Hex gallery wider, arched doorways (deployed).** 2.2 m round arches, centred. Keep signs and the #296 doorway trim fitted. Check walkability on phones.
13. **#301 Frames with real dimension (deployed Oct 22).** Beveled or stepped profile, inner lip, depth off the wall, soft contact shadow; one shared instanced geometry; cheap on phones. Re-check after #317 fixes.
14. **#299 Split group-photographed paintings** into individual frames (the four-portrait strip, the Dorian Nakamoto and Michael Saylor pair, others). Each product gets its own photo, frame and label.
15. **#280, #281, #287 Bitcoin cluster and book plinths.** Bitcoin artifacts (pizzas, Don't Trust Verify, money printer) near the Bitcoin room; readable art books on centred plinths under the domes (Landscapes room-01, Portraits room-11, Reflections on Time room-05); nothing blocks doors, paths or plaques.

**Day 4: stretch and quality**

16. **#303 Full visual quality pass** (after layout settles): PBR materials, KTX2/Basis with mipmaps, device quality tiers (desktop 2K-4K, phones 1K-2K), LOD meshes, progressive hi-res painting textures, baked AO. Acceptance: 60 fps recent desktop, about 30 fps mid iPhone, before/after screenshots.
17. **#305** (intro narration plays during the first walk, existing audio only), **#294, #293, #291, #306, #307**: verify what shipped; do the rest only after items 1-15.
18. Blocked or on hold, do not start: **#311** photo booth (backend draft PR #711 on `vermillionaurora`, not merged), **#240** fallback logging, **#29**, **#30**, **#10** concert hall, **#257** Blender MCP evaluation.

Website (tjm.art, Astro, `vermillionaurora`): PR only, TJ approves before merge. Cards if asked: #7, #8, #49, #50, #90. Stay on gallery items unless TJ redirects you.

---

## 4) Open questions that need TJ's answers

- **#319:** is "the Pacific room" the right room name (check against `layout.json` labels)?
- **#320:** if all Ukraine paintings do not fit on one wall, may the row split, and where?
- **#315:** same width (60 in) or same height for Painting #2 and Sunrise on Rainier with Eagle?
- **#318:** true physical sizes of the three Forest panels if the catalog is wrong.
- **#309/#310:** hang the 38 Paul Murphy paintings now (side room) or still hold? Confirm the Temple, Daytime size of 45 x 24 in (it came from a bot, not TJ). Sizes for the 8 book-art pieces (El Salvador, Bass Coast, Punta El Zonte) are unknown; placeholders are flagged.
- **#258:** TJ is to remeasure 53 paintings whose caption does not match the photo (photo is treated as correct for now).
- **#308/#296:** confirm checkout stays at the centre fountain portal.
- **#240:** analytics choice for fallback-screen logging (Cloudflare Web Analytics, a small counter, or none).
- **#311:** photo booth moderation choices (approve first or instant, retention, frame, NSFW filter, route and admin password).
- Anything not in a card: ask, do not invent.

---

## 5) How to report back

- After each card: **comment on the studio-tracker card** with what changed, the preview link (hash URL plus `preview-251`), which audits ran on desktop and 390x844 with PASS/FAIL, and screenshots. Include a one-line "Time:" for work spent. Note any decision you made and why.
- Keep a **`CHANGELOG.md`** at the root of your working repo (newest first): date and time in PT, card number, files touched, preview URL, audits.
- One card per commit or PR where possible, with the card number in the message (for example `#317: crop white margins on 41 paintings`).
- Never comment with secrets, prices in public copy, emojis or the word "LLC". Do not close cards; TJ closes them after approving on the preview.
- At the end of each day, post one short summary on #251 listing done, blocked and next.

---

## 6) How ChatGPT gets access (TJ sets these up)

0. **UPDATE (Oct 23, 2026): the source is now in this private GitHub repo, `timothyjosephmurphy/gallery-source`** (this repo). Use it instead of the zip described below: clone it, `cd play-tags && npm install && npm run build`. The folders sit side by side as the build needs. Files over 25 MB, videos, `dist*`, `node_modules`, secrets and generated deploy workers (`play-tags/deploy/_worker.js`, `execute.js`, regenerate with `deploy/gen.py`) are NOT in the repo; see `LARGE_FILES.md`. TJ invites ChatGPT's connected GitHub account as a collaborator (write). Commit one card per commit and keep `CHANGELOG.md` at the repo root.

1. **Source zip of the gallery (superseded by the repo above; kept for reference)** (the work was not in git). TJ or Grok Bot builds it on the box, excluding `node_modules`, `dist*`, `.git` and secret files:
   `cd /workspace && zip -r gallery-src.zip play-tags gallery-core tag-gallery gallery-courtyard ostrich-robot gallery-handoff -x '*/node_modules/*' -x 'play-tags/dist*' -x '*.env*'` (about 100 MB; do not include `museum-shared/layout-save-urls.txt`). TJ uploads it to ChatGPT, or puts it in a **private** GitHub repo (for example `tjm-gallery-src`) and invites ChatGPT's connected account.
2. **GitHub access:** a collaborator invite (write) on that new private repo, plus read and comment on `studio-tracker`. For `vermillionaurora`, fork-and-PR or a branch-only collaborator; no push rights to `main`.
3. **Cloudflare:** TJ creates a **Pages-only API token** scoped to the single project `tjm-tag-gallery-preview` (Account, Cloudflare Pages: Edit, no zone or Workers access, no other projects), plus the account ID. Share by a private channel, not in chat history or files. **Do NOT share any main-site production tokens** (Workers Builds for `vermillionaurora`, tjm.art DNS, R2 admin, Chase's account, or the layouts Worker).
4. **R2 textures:** big textures live under `play/preview-NNN/` on img.tjm.art; ask TJ to upload new ones.
5. **Local tools you need:** Node 20+, npm, Python 3 with Pillow, Playwright (Chromium) for audits, `wrangler`. Blender 4.2.3 only if you rebuild the ostrich.
6. **Ask TJ if missing:** the original hi-res paintings (not on the box), screenshots referenced on cards, and any approval for non-preview changes.

When you start, first (a) unzip and `git init`, (b) `npm install && npm run build` in `play-tags/`, (c) open the preview and click through to see the current state, then begin with item 1.
