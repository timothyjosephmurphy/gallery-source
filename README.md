# gallery-source (private)

Source for TJ Murphy's 3D walkable art gallery and the new hex-cell "tag gallery". Start with `HANDOFF.md` (rules, queue, access). Copied from the Grok Bot box `/workspace` on Oct 23, 2026.

## Layout
| Folder | What |
|---|---|
| `HANDOFF.md` | Full handoff for ChatGPT: what exists, hard rules, queue, how to report back. |
| `play-tags/` | Main app (Vite, three.js, `base: '/play/'`). `src/`, `tools/` (python/node data tools), `tests/` (Playwright audits), `deploy/` (`gen.py`, `splice.py`), `public/`. |
| `gallery-core/` | Shared engine. `play-tags/vite.config.js` imports `../gallery-core/vite-core.js`, so keep both folders side by side. |
| `tag-gallery/` | Layout design docs and data (`data/layout.json`, `works.json`, ...), `tools/`. See its `HANDOFF.md`. |
| `gallery-courtyard/` | Courtyard textures, signs, `data/*.json`, `hq-assets/`. |
| `ostrich-robot/` | Guide bot GLBs, `build.py` (Blender 4.2.3), `NOTES.md`. |
| `gallery-handoff/` | Older notes, `tj-fixes-1022.md`, `issue309.md`. |
| `LARGE_FILES.md` | What was left out (build outputs, secrets, big or hi-res assets) and where it lives. |

## Quick start
```
cd play-tags
npm install
npm run check
npm run build
npm run dev
```

## Not in this repo
No secrets (`.env*`, tokens, keys, layout save URLs), no `node_modules`, no `dist*`, no videos, no files over 25 MB. Do not commit any of those. Deploys go to the preview project only, per `HANDOFF.md`.
