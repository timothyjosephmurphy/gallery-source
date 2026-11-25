# Large, omitted, and external (R2/CDN) files

GitHub rejects or warns on large files. This public repo also leaves out generated outputs and secrets.

## Excluded from git (local build/tooling, or over 25 MB)

| Path / Pattern | Why excluded | How to obtain / rebuild |
|---|---|---|
| `play-tags/node_modules/` | Dependencies | `cd play-tags && npm install` |
| `play-tags/dist*` | Vite build output | `cd play-tags && npm run build` |
| `play-tags/public/assets/annex871-r899.js` | Generated annex sidecar | `cd play-tags && npm run build:annex` (this also runs as the first step of `npm run build`) |
| `play-tags/deploy/_worker.js`, `execute.js` | Generated Cloudflare Worker bundle | `cd play-tags && python3 deploy/gen.py` |
| `.env*`, `*.log`, `*.orig`, `*.bak*` | Local env, logs, backups | Local only; never commit secrets |
| `gallery-courtyard/white-border-crops-317-wave2/archived-painting-73-317w2.png` | 27.6 MB (over the 25 MB limit) | Stored off-repo / R2 (`play/preview-251/`) |

## Related code that lives in another repository

The standalone Neural Dance simulation app (`/neural-dance/*`) is maintained in the `neural-dance` repository. This repo holds the in-gallery Kinoteka annex (`nd-annex/`) and the `/tjm/neural-dance/` embed URL used by the projection wall.

Do not commit private journal material, anything tagged `[PRIVATE]`, secrets (`LAYOUT_SAVE_KEY`, `.env*`, API tokens, Worker secrets), or files over 25 MB.

## Media served from R2 / CDN (`https://img.tjm.art`)

At runtime, `play-tags` and `deploy/gen.py` proxy or load large or streaming media from `https://img.tjm.art`:

- Painting progressive thumbnails (`t128/`, `b256/`) and Friends Club mural LODs (`256`, `1024`): `https://img.tjm.art/play/thumbs/`
- Full-res painting WebPs and hi-res masters: `https://img.tjm.art/play/art/` and `https://img.tjm.art/play/preview-251/art-317/`
- PBR material maps: `https://img.tjm.art/play/pbr/`
- Welcome hologram video and still (`holo_welcome_860.mp4`, `still_welcome_860.jpg`): `https://img.tjm.art/play/tour/860/`
- Guided tour narration audio (Maeve walk): `https://img.tjm.art/play/tour/maeve-walk-5-stops/`
- Courtyard and testimap large textures (`preview-251/courtyard-296/`, `horizon/`, `frames/`, and others): `https://img.tjm.art/play/preview-251/`
- Live testimonials API: `https://tjm.art/testimonials/api/approved` (fetched at build time by `play-tags/tools/testimonials.mjs`)

The annex painting `play-tags/public/art/paradise-dystopia.jpg` is tracked here and inlined by `deploy/gen.py`, because it is not on the art CDN path above.
