# Large, Omitted, and External (R2/CDN) Files

GitHub rejects/warns on large files and this public repo excludes generated outputs, secrets, and private projects.

## Excluded from git (local build/tooling or >25 MB)
| Path / Pattern | Why excluded | How to obtain / rebuild |
|---|---|---|
| `play-tags/node_modules/` | Dependencies | `cd play-tags && npm install` |
| `play-tags/dist*` | Vite build output | `cd play-tags && npm run build` |
| `play-tags/deploy/_worker.js`, `execute.js` | Generated Cloudflare Worker bundle (~4.7 MB) | `cd play-tags && python3 deploy/gen.py` |
| `.env*`, `*.log`, `*.orig`, `*.bak*` | Local env/logs/backups | Local only; never commit |
| `gallery-courtyard/white-border-crops-317-wave2/archived-painting-73-317w2.png` | 27.6 MB (> 25 MB limit) | Stored off-repo / R2 (`play/preview-251/`) |

## Excluded private code (by policy)
- **Neural Dance private app & Kinoteka ND annex** (`annex871-r899*.js`, `nd-annex-869`, `/neural-dance/*` app bundle, `paradise-dystopia.jpg`): kept out of this public repo. Only the `/tjm/neural-dance/` embed URL in `play-tags/src/tags.js` and `deploy/gen.py` is retained.

## Media served from R2 / CDN (`https://img.tjm.art`)
At runtime, `play-tags` and `deploy/gen.py` proxy or load large/streaming media from `https://img.tjm.art`:
- Painting progressive thumbnails (`t128/`, `b256/`) and Friends Club mural LODs (`256`, `1024`): `https://img.tjm.art/play/thumbs/`
- Full-res painting WebPs & hi-res masters: `https://img.tjm.art/play/art/` and `https://img.tjm.art/play/preview-251/art-317/`
- PBR material maps: `https://img.tjm.art/play/pbr/`
- Welcome hologram video & still (`holo_welcome_860.mp4`, `still_welcome_860.jpg`): `https://img.tjm.art/play/tour/860/`
- Guided tour narration audio (53 clips): `https://img.tjm.art/play/tour/maeve-walk-5-stops/`
- Courtyard & testimap large textures (`preview-251/courtyard-296/`, `horizon/`, `frames/`, etc.): `https://img.tjm.art/play/preview-251/`
- Live testimonials API: `https://tjm.art/testimonials/api/approved` (fetched at build time by `play-tags/tools/testimonials.mjs`)
