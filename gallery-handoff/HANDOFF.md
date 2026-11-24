# Gallery assistant handoff

For the new **Gallery** assistant that owns TJ Murphy's 3D web galleries.
Facts gathered from box sources as of **Sun Oct 18, 2026 ~2:45 AM PT** (America/Los_Angeles). Do not invent; prefer the linked dirs and studio-tracker issues.

Primary sources: `/workspace/museum-eggs/` (esp. `CHANGES-2026-10-18.md`, `INTEGRATION.md`), `/workspace/museum-tools/`, `/workspace/museum-move/`, `/workspace/museum-gates/`, `/workspace/museum-shared/`, `/workspace/chase-project/time-log.md`, per-gallery READMEs (`ORSAY.md`, `GUGG-NY.md`, `play-montreal/README.md`), and open issues in `timothyjosephmurphy/studio-tracker` with label `galleries-3d`.

---

## 1) Galleries

| Name | Live URL | Source on box | Build | Deploy |
|---|---|---|---|---|
| **TJM Gallery** | https://tjm.art/play/ | `/workspace/play-gallery` | `npx vite build` with **base `/play/`** → `dist/` | Copy built assets into **vermillionaurora** repo `static/play/`, open a PR, merge to `main` (Workers Builds). Latest: PR **#620** (merged ~2:36 AM PT Oct 18). Also ships `static/play/to-cart.html`. |
| **Musée d'Orsay** | https://tjm-play-orsay.pages.dev/ | `/workspace/play-orsay` | `cp .env.orsay .env.production && npx vite build --base / --outDir dist && python3 deploy/gen.py` | Cloudflare Pages project **`tjm-play-orsay`**, TJ account **`3c1fddf0f4f4fc9c84594757d2e1bda0`**. Run `deploy/execute.js` via Cloudflare connector `execute`. No media copied; `/art/*` proxies tjm.art. |
| **Guggenheim Bilbao** | https://tjm-play-bilbao.pages.dev/ | `/workspace/play-bilbao` | same Vite `--base /` + `deploy/gen.py` (default project `tjm-play-bilbao`) | Pages **`tjm-play-bilbao`**, same TJ account. |
| **Uffizi** | https://tjm-play-uffizi.pages.dev/ | `/workspace/play-uffizi` | same; `deploy/gen.py` default `tjm-play-uffizi` | Pages **`tjm-play-uffizi`**, same TJ account. |
| **Guggenheim NY** | https://tjm.art/play/g/gugg-ny/ (old https://tjm-play-gugg-ny.pages.dev/ redirects) | `/workspace/play-gugg-ny` | `npx vite build --base / --outDir dist && python3 deploy/gen.py` | Served from website `static/play/` shared bundle (old Pages **`tjm-play-gugg-ny`** no longer primary). See `GUGG-NY.md`. |
| **Montreal (MBAM) — Chase Toole** | https://chase-toole-site-7b3.pages.dev/play-montreal/ | `/workspace/chase-toole-site/play-montreal` (also mirrored under site `public/play-montreal/`) | `cd play-montreal && npm run layout && npm run build` → `../public/play-montreal/` | **Chase's** GitHub **`websitehandoff5-svg/chase-toole-site`**, Cloudflare Pages **`chase-toole-site`**, Chase account **`d4cd4947ec5996a991e43fa6134e6704`**. PRs on that repo only (latest gallery work: PRs #4–#10). Site also hosts The Dungeon at `/play/`. |

**Guggenheim NY note (Oct 26 2026 scout):** `https://tjm-play-gugg-ny.pages.dev/` 301 → `https://tjm.art/play/gugg-ny/` → `https://tjm.art/play/g/gugg-ny/`. Production is the vermillionaurora website `static/play/` shared bundle, not the old Pages project. Local `play-gugg-ny/src` is stripped (no `main.js`/`move.js`, like Orsay/Bilbao/Uffizi), so the box cannot rebuild it; a rebuild needs recovered source or a website PR. Fairer-chase move is already live in `main-ClTpcqQe-r243.js`.

**Gate network** (`museum-gates`): each museum has a slipgate hall linking the six URLs above (`src/gates.js` `MUSEUMS`). Dormant dungeon arches: Halo, Far Cry, Myst, Portal, Skyrim.

**Layouts Worker** (TJ account): `https://tjm-play-layouts.timothyjosephmurphy.workers.dev` — GET/PUT/DELETE per gallery. Save URLs (secret keys) in `/workspace/museum-shared/layout-save-urls.txt`. **Do not PUT or DELETE layouts** from this assistant (see Hard rules). Montreal gravity-gun saves are localStorage only (no Worker).

---

## 2) Shared modules and harnesses

| Module | Canonical path | Per-gallery copy | Integrate / tests |
|---|---|---|---|
| Easter eggs + guide drone | `/workspace/museum-eggs/src/` | `<gallery>/src/museum-eggs/` | `integrate-buy.py`; harness `museum-eggs/harness-uffizi` or `harness2-uffizi`. Tests: `eggaudit.mjs`, `eggbehave.mjs`, `eggshots.mjs`, `eggfps.mjs`, `eggrender.mjs`, `navtest.mjs`. |
| Glitter Cannon + Leaf Blower | `/workspace/museum-tools/src/glitterblower.js` | `<gallery>/src/glitterblower.js` | `python3 museum-tools/integrate.py <gallery>`; harness `museum-tools/harness-orsay`; `tests/run.mjs`. |
| Move (sprint, footsteps, chase) | `/workspace/museum-move/src/move.js` | `<gallery>/src/move.js` | `integrate.py` / Montreal: `integrate-hold-montreal.py` + hand wiring; `tests/move.mjs`, `moveflat.mjs`. Hold API added 2026-10-18. |
| Gates + cart handoff | `/workspace/museum-gates/` | `<gallery>/src/museum-gates/` + inject into `index.html` | `tools/wire-tjm.sh`, `integrate-cart.py`, `tools/inject.mjs`; `tests/gatetest.mjs`, `dragtest.mjs`; eggs `tmp/gatejump.mjs`. |
| Soup / gravgun / eggs-install | `/workspace/museum-shared/` (`soup.js`, `gravgun.js`, `eggs-install.js`) | each gallery `src/` | HD soup: `museum-eggs/src/soup-hd.js` → `src/soup.js`. HD elves: `elves-hd.js` + shim as `elves3d.js`. |

**Typical egg test loop**
```
cd /workspace/museum-eggs/harness-uffizi && npx vite --port 5191 --strictPort --host 127.0.0.1
node tests/eggaudit.mjs  http://127.0.0.1:5191/play/ desktop   # must pass; also checks DMT not in DOM
node tests/eggbehave.mjs http://127.0.0.1:5191/play/ desktop
```
Museum Pages previews: `tests/audit.mjs`, `live.mjs`, `realm.mjs`, `extras.mjs`, `shots.mjs`, `fps.mjs`. Montreal: `tests/audit.mjs`, `loops.mjs`, `features.mjs`, `pianist.mjs`, `move.mjs`.

**Oct 18 integrate recipe** (from `CHANGES-2026-10-18.md`): rsync `museum-eggs/src/` → `museum-eggs/`; copy `move.js`, `soup-hd.js`, elves shim; run `integrate-hold.py` + `integrate-buy.py` on eggs galleries; Montreal uses `integrate-hold-montreal.py` (no eggs/drone buy handoff). Display: `window` on tjm.art/play, else `niche` (`?display=` override).

---

## 3) State ~2:45 AM PT, Oct 18 2026

**Latest batch shipped** (eggs galleries via vermillionaurora **#620**; Montreal via chase-toole-site **#10**; museum Pages rebuilt the same night):

- Guide bot / eggs HD props (drone wheels + IK arms, cart fetch, escort that yields at painting view spots, HD ostrich/banana/box/printer/etc.).
- Pointer-lock fix: lock **`document.body`** (not canvas); click-to-look hint; Esc pause panel.
- Faster gates: navigate ≤20 ms on touch; arrival 450 ms tunnel + 300 ms fade; gate-room prefetch.
- Cart handoff: Buy Scanner default; Esc "Go to cart (N)"; HUD Cart button; off-site museums → **https://tjm.art/play/to-cart.html** (merges slugs into `va-cart-v1`, then `/cart/?from=play`). Montreal keeps Chase's own cart.

**Skipped / parked this pass** (see also studio-tracker **#29** "Missing eggs"):

- HD bobbleheads / cake room / security robot / sandworm plaque polish.
- Starship slimming (Starship already skipped on Gugg NY — no window; Orsay/Bilbao often skip Starship when no opening).
- Mute test coverage for wall-ride suction whir and thruster gusts.
- Full frame-rate (`eggfps` / live fps) comparison runs after this ship.

Issue **#29** body: *"Cake room, plaque, Untitled #4 in play. Starship in Orsay, Bilbao and Gugg."*

---

## 4) Hard rules

1. **True size** for paintings — never enlarge past real dimensions / pixel budget (see layout scripts and Montreal hanging rules).
2. **Audit must pass** before deploy (`eggaudit` / gallery `audit.mjs`; Montreal also `loops.mjs` — no dead ends).
3. **No dead ends** in room graphs; every hallway on a loop.
4. The word **`DMT` appears nowhere** (PR #600; `eggaudit` checks DOM).
5. **Original designs only** — procedural architecture, synthesized audio, no copied game assets.
6. **No layout PUT or DELETE** against the layouts Worker (read/GET only unless TJ explicitly asks).
7. **Never move Chase's `/play/media/` folder** (Montreal loads art from `/play/media/art|art-mid|art-hi/`).
8. **Chase work only** via `websitehandoff5-svg/chase-toole-site` and Chase's Cloudflare account `d4cd4947ec5996a991e43fa6134e6704` — never deploy Chase onto TJ's Pages.
9. **Never `pkill` by pattern** — stop only your own processes by PID.
10. **Plaques beside paintings at eye level**, never blocked by lights (issue #19).
11. **Social/public copy: no prices, no emojis.**
12. **Don't interrupt running work** on the shared box.
13. **Budget is tight** — prefer small, high-impact changes; re-use shared modules.

---

## 5) Queued backlog

From TJ direction + open `galleries-3d` issues:

| Priority theme | Notes | Issue(s) |
|---|---|---|
| Unify gallery code | One shared core + small per-museum layout file; Chase gets a copy in his repo | **#24**, **#2** |
| Loupe tool | Zoom painting + open product page; size/price plaques clear of lights | **#19**, **#8** |
| Concert hall | Off tjm.art/play; band plays 12 songs of *Cassandra Holds the Keys* (myth take L). MP3s: `/workspace/music/cassandra-holds-the-keys/` (01–12). Plan cost-consciously | **#10** |
| Guide-bot + elf interactions | 7 gags; optional Runway Austrian-accent robot voice | **#21**, **#28** |
| Portal / gate hall | Already shipping museum gates; dormant dungeon slots; more dungeons | gates module, **#26**, **#9** |
| "Your room" Gaussian splat | Far-out; true-size view-in-my-room | **#6** (not `galleries-3d` label but related) |
| Friends Club splat scan | **On hold** | **#30** |
| Missing eggs | Parked by TJ | **#29** |
| Tool progression + tutorials | | **#27** |
| Calm first-visit + one-tap product links | | **#8** |
| Gallery analytics | time, views, product clicks, `?ref` | **#7** |
| Chase MBAM extras | dead-end hallway work item title is historical; live plan is looped — check issue before acting | **#9** |

### Open `galleries-3d` issue numbers

**2, 7, 8, 9, 10, 19, 21, 24, 26, 27, 28, 29, 30**

(Related but not labeled `galleries-3d`: **#6** Gaussian-splat room.)

---

## Quick pointers

- Chase time log: `/workspace/chase-project/time-log.md`
- Chase handoff guide: `/workspace/chase/guide.md`
- Music tracklist: `/workspace/music/cassandra-holds-the-keys/tracklist.txt`
- After shared-module edits: re-copy into each gallery, run integrate scripts, audit, then deploy (TJ Pages via `deploy/gen.py`+`execute`, play via vermillionaurora `static/play/` PR, Montreal via Chase repo PR).

## Relay Gate (artist-gallery tool) - added by Website, Oct 18 2026

- Spec and site importer (formerly "slipgate"): `/workspace/slipgate-gallery` (`SPEC.md`, `src/`, `bin/`, `test/`), pushed to the public repo https://github.com/timothyjosephmurphy/relaygate (MIT, CI green).
- Nostr-first: galleries are signed events under the artist's key, gates link artists by key, discovery via relays, Lightning zaps. TJ's decisions are in SPEC.md section 10; OpenSats draft in section 9.
- Provenance plan (Nostr-signed certificate of authenticity + OpenTimestamps, verified from the QR label and the 3D gallery): `/workspace/relaygate/coa-proposal.md`, SPEC section 3.7.
- Tracker: studio-tracker #69 (spec), #3 (Bitcoin-native design), #6 (Gaussian-splat view-in-room), #68 (name trademark check), #71 (zap income tracking, Bookkeeper). Website owns the spec and importer; the 3D gallery side that renders imported galleries and gates belongs to Gallery.
