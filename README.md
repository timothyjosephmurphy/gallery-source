# gallery-source (public)

This is the source for TJ Murphy's walkable 3D gallery of his paintings, at [tjm.art/play](https://tjm.art/play/). In the gallery you can browse the work at true size, learn the stories behind the paintings, and buy originals and prints. Bitcoin is accepted at checkout on tjm.art.

The repository is public and holds the full gallery source, including the Kinoteka Neural Dance annex. The standalone Neural Dance simulation app (`/neural-dance/*`) lives in the separate `neural-dance` repository. The gallery keeps a `/tjm/neural-dance/` embed URL for the projection wall, and runs the annex inside `/play/` from the `nd-annex/` tree in this repo.

## What is in the gallery

These are features that exist in the source today.

**Hex rooms and tags.** The walkable plan is a honeycomb of hexagonal rooms around a central pavilion, plus courtyards and outer grounds. Room shapes, doors, and hanging positions come from `tag-gallery/data/layout.json`, built into geometry by `play-tags/src/tags-world.js`. Paintings are grouped by tag into the rooms (people, landscapes, Bitcoiners, and the rest). Doorways are wide round or elliptical arches. A minimap (key N) shows the rooms, doors, and the checkout fountain.

**Courtyards and outdoor work.** The START courtyard is the usual entrance. Around the ring there are named outdoor courts, including the Paul Murphy court, a garden patio, and a fountain court with a painted Bosphorus vista, cafe tables, and awnings. Church steeples sit over the Berlin wall. A shipping container and pines, a roadster beyond the START fence, and outdoor location signs are part of the grounds.

**The Kinoteka and the Neural Dance annex.** The Kinoteka is a cinema hall off the Paul courtyard, with a film screen, seats, and (once you are inside) usher elves. Two doorways in the hall's west wall open onto an observation balcony that looks down into a capture room and an energy room: the Neural Dance annex, built from `nd-annex/` and loaded as `/play/assets/annex871-r899.js`. The annex cuts those doorways at runtime, hooks the stairs and sunken floors into the walk mesh, and runs the capture-to-energy simulation inside the same scene. `/play/kinoteka` and `/play/kinoteka/` serve the normal `/play/` index with a 200 (no redirect); the address bar stays on that path, and the client treats it as the `kinoteka-steps` alias. You spawn at the foot of the Kinoteka front steps, looking in. `?room=kinoteka-steps`, `?goto=kinoteka-steps`, and `?room=kinoteka` do the same. If a `room` or `goto` query is also present, it wins. Other annex aliases (`?room=neural-dance`, `?room=kinoteka-annex-door`, and the room/stairs/stage variants in `nd-annex/src/inSceneAnnex.js`) still spawn at their annex views. Plain `/play/` is unchanged and still opens at the START courtyard entrance.

**Murals and the Berlin wall.** Large outdoor murals include the Friends Club mural, the cormorant garden mural, and the Berlin / El Salvador wall, which is painted to the edges of the wall with no frame. Mural detail uses distance-based LODs.

**Guided tour and the ostrich.** Maeve's walk (Irish-voiced narration from the `hex-tour-maeve-walk` pack) is a guided tour with a countdown and an exit at any time. The ostrich is the guide bot; you can also ask it for a ride once around the galleries. An exhibitions wall map and a testimonials map hang in the courts.

**Plaques and story panels.** Brass plaques beside the paintings, and the story plates from `storyPlaques335.js`, are on a soft hold (`BRASS_HOLD_829` in `play-tags/src/tags.js`). They are not drawn until TJ says to put them back. Wall title plates and group labels still hang. Room titles follow the room you are in.

**Buying work.** The Buy Scanner (key 1) is aimed at a painting: click or tap SCAN to add an available original or print to the in-game cart. Walking through the gold checkout fountain or ring hands the cart to `tjm.art` (`va-cart-v1`, then `/cart/?from=play`, or `to-cart.html` when the gallery is on a preview host). Paintings stay at catalog size; nothing is enlarged past its real dimensions.

**Tools and eggs.** The HUD also carries a soup thermos, a Gravity Gun, a glitter cannon, and a leaf blower. The Gravity Gun grabs, hangs, and launches paintings. Every visitor loads the saved hanging; Save Layout and Reset appear only when the page is opened with the layout-save key, which is read from the `LAYOUT_SAVE_KEY` environment variable and is never stored in this repo. Easter-egg props and the guide-drone interactions live in the shared museum-eggs modules. Elves appear in the scene and in the Kinoteka. There is a physical book reader for selected titles.

**Decor that is currently parked or removed.** Room holograms and the guitar holograms on the plinths stay off unless the page is opened with `?holos=1`. The START courtyard sticker bot has been removed (`removed788`); Neural Dance pose stickers on some walls are still placed by `stickerWalls307.js`.

**Mobile.** On a coarse pointer, phone controls include a move pad, a look drag, a SCAN/THROW button, and a tool swap control (`phone304.js` and the touch HUD in the shell).

**Other.** A spinning helix sculpture stands in its room and can be opened with `?room=h8` (and the `room-08` / `el-salvador` aliases). A read-only Nostr wall in one court shows TJ's latest public notes. A progress bar runs on the start screen while nearby paintings hang.

## Repo layout

| Folder | What |
|---|---|
| `play-tags/` | Main Vite app (`base: '/play/'`, three ^0.170). `src/`, `public/` (including sidecar scripts `court876-r876.js`, `kino874-r874.js`, `helix876-r876.js`), `tools/`, `tests/`, and `deploy/gen.py`. |
| `nd-annex/` | Kinoteka Neural Dance annex source. `src/inSceneAnnex.js` is bundled into `/play/assets/annex871-r899.js` during `npm run build`. |
| `gallery-core/` | Shared engine (`vite-core.js`, `src/main.js`, `src/gravgun.js`, books, eggs, gates, garden, and the other museum modules). `play-tags/vite.config.js` imports `../gallery-core/vite-core.js`, so keep both directories side by side. |
| `tag-gallery/` | Layout design docs and data (`data/layout.json`, `works.json`, `tools/`). |
| `gallery-courtyard/` | Courtyard textures, signs, `data/*.json`, `hq-assets/`. |
| `ostrich-robot/` | Guide bot GLBs (`ostrich-lod0.glb`, `ostrich-lod1.glb`), `build.py`, `NOTES.md`. |
| `gallery-handoff/` | Historical notes and handoff docs. |
| `LARGE_FILES.md` | Build outputs, R2-hosted media, and files omitted because they are over 25 MB or are secrets. |

## Build and deploy

Deploys to `tjm.art/play` or any preview must be built from a commit that has been pushed to this repository and, for a live ship, tagged (for example `live-899`). Never patch `dist/`, `_worker.js`, or a `tour-wire*` output folder after `vite build`. Do not promote a preview to production without TJ's own OK in the Gallery chat. The full audit must pass before a deploy (the 72 known plaqueY holds are expected while plaques stay down; there should be no failed requests, 404s, or JS or WebGL errors). Paintings stay true size. Plaques stay on hold until TJ says otherwise.

Secrets stay in environment variables. `LAYOUT_SAVE_KEY` is read from `process.env.LAYOUT_SAVE_KEY` in the layout-check tools. Never commit `.env*` files, tokens, Worker secrets, or the layout-save key. Do not commit private journal material, anything tagged `[PRIVATE]`, or files over 25 MB.

```bash
git clone https://github.com/timothyjosephmurphy/gallery-source.git
cd gallery-source/play-tags
npm install
npm run check      # doorcheck.mjs
npm run build      # annex sidecar, testimonials.mjs, doorcheck.mjs, vite build -> dist/
python3 deploy/gen.py
```

`deploy/gen.py` packages `dist/` (HTML, JS, CSS, the web manifest, `.glb` assets, and selected inline images and audio) into `play-tags/deploy/_worker.js` (gitignored) for Cloudflare Pages. The worker serves `/play/kinoteka` and `/play/kinoteka/` as the `/play/` index in place, maps `/play/kinoteka/...` to `/play/...`, and leaves `/play/` itself alone. The standalone Neural Dance app is built from the `neural-dance` repository. This worker fetches `/tjm/neural-dance/` from tjm.art when the projection wall uses that embed.

`play-tags/tools/_check832.mjs` and `_check833.mjs` read the layout-save key from `LAYOUT_SAVE_KEY`. Never hardcode a key in a tracked file.
