# Kinoteka Neural Dance annex

In-gallery annex for the walkable 3D gallery at tjm.art/play. Two doorways in the Kinoteka hall open onto an observation balcony that looks down into a capture room and an energy room. The annex runs inside the `/play/` scene (`window.game`); it is not the standalone Neural Dance simulation app. That app lives in the separate `neural-dance` repository and is embedded from `/tjm/neural-dance/` when the gallery uses the projection wall.

`src/inSceneAnnex.js` is the entry that play-tags bundles (via `npm run build:annex`) into `/play/assets/annex871-r899.js`. It cuts the hall doorways at runtime, hooks walkable floor height for the stairs and sunken rooms, and reads deep-link aliases (`?room=neural-dance`, `?room=kinoteka-annex-door`, `/play/kinoteka`, and the others listed in the `DEEP` / `STEPS` maps). Query-string `room` or `goto` wins over the pathname alias.

```bash
# from play-tags, after npm install (uses the esbuild that ships with Vite)
npm run build:annex
# annex unit tests
node test/nd871.test.mjs
```

The standalone two-room demo pages in this folder (`index.html`, `src/main.js`) are for local annex development. They are not deployed as `/neural-dance/` from this repository.
