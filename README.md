# gallery-source (public)

Source of truth for TJ Murphy's 3D walkable art gallery at **[tjm.art/play](https://tjm.art/play/)**.

## Version control and deploy rule
- **Every deploy to `tjm.art/play` (or any preview) must build strictly from a committed, pushed commit in this repository.**
- Never edit or patch build outputs (`dist/`, `_worker.js`, `tour-wire*`) out-of-band after `vite build`. Make the change in `src/` / `public/`, commit, push, tag if shipping live, and deploy from the clean checkout.
- Before pushing: verify no secrets, no private Neural Dance source code, and no files over 25 MB are staged.

## Layout
| Folder | What |
|---|---|
| `play-tags/` | Main Vite app (`base: '/play/'`, three ^0.170). `src/`, `public/` (including `public/art/` and `public/assets/` sidecars `court876-r876.js`, `kino874-r874.js`, `helix876-r876.js`, `helix875-r875.glb`), `tools/`, `tests/`, `deploy/gen.py`. |
| `gallery-core/` | Shared engine (`vite-core.js`, `src/main.js`, `src/gravgun.js`, `src/books.js`, etc.). `play-tags/vite.config.js` imports `../gallery-core/vite-core.js`, so keep both directories side by side. |
| `tag-gallery/` | Layout design docs and data (`data/layout.json`, `works.json`, `tools/`). |
| `gallery-courtyard/` | Courtyard textures, signs, `data/*.json`, `hq-assets/`. |
| `ostrich-robot/` | Guide bot GLBs (`ostrich-lod0.glb`, `ostrich-lod1.glb`), `build.py`, `NOTES.md`. |
| `gallery-handoff/` | Historical notes and handoff docs. |
| `LARGE_FILES.md` | Omitted files (>25 MB, build outputs, R2-hosted media, secrets, excluded private Neural Dance annex). |

## Build & deploy from a fresh clone
```bash
git clone https://github.com/timothyjosephmurphy/gallery-source.git
cd gallery-source/play-tags
npm install
npm run check      # runs doorcheck.mjs
npm run build      # runs testimonials.mjs, doorcheck.mjs, vite build -> dist/
python3 deploy/gen.py
```
`deploy/gen.py` packages `dist/` (HTML/JS/CSS/webmanifest + `.glb` assets + inline R2 fallback images/audio/plaques) into `play-tags/deploy/_worker.js` (gitignored) for Cloudflare Pages / Workers deployment (`wrangler`).

`play-tags/tools/_check832.mjs` and `_check833.mjs` read the layout-save key from `LAYOUT_SAVE_KEY` env var (`process.env.LAYOUT_SAVE_KEY`); never hardcode keys in tracked files.

## What is excluded
- **Secrets:** `.env*`, tokens, Worker secrets, and the private layout-save key (`LAYOUT_SAVE_KEY`).
- **Private Neural Dance code:** the private Neural Dance simulation app and Kinoteka Neural Dance annex (`annex871-r899` / `nd-annex-869` / `/neural-dance/` app bundle) are excluded. Only the public embed URL (`/tjm/neural-dance/`) used by the gallery iframe projection is kept.
- **Private journal project:** none present or permitted.
- **Large media / generated artifacts:** `node_modules/`, `dist*`, `_worker.js`, `execute.js`, and >25 MB binaries (see `LARGE_FILES.md`).
