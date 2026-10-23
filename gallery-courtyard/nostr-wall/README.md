# Nostr wall (Gallery courtyard)

Read-only, zero-dependency ES module that shows TJ Murphy's latest kind-1 Nostr notes
(npub10m0uf224v7tly6k6h8gl6kkmuhmx7969gmudmmhqj5pv65e03r9sxsumee). No keys, no signing.

- NIP-01 `REQ` to relay.damus.io, nos.lol, relay.primal.net with per-relay timeout
- Dedupe by id, newest first; zap counts from kind 9735 `#e` tags
- Cache: localStorage (10 min TTL) in browsers, in-memory elsewhere
- Fallback: `fallback.json` (snapshot of real notes; refresh with `node snapshot.mjs`)

## Usage in Gallery (three.js)
```js
import * as THREE from 'three';
import { getNotes, renderNotesToCanvas } from './nostr-wall/nostr-wall.js';

const notes = await getNotes({ limit: 10, timeoutMs: 4000 }); // [{id, createdAt, content, zaps, url}]
const tex = new THREE.CanvasTexture(renderNotesToCanvas(notes, { width: 1024, height: 1024 }));
tex.colorSpace = THREE.SRGBColorSpace;
wall.material = new THREE.MeshBasicMaterial({ map: tex });
```
Options for `renderNotesToCanvas`: width, height, padding, fontSize, font, background, color, accent, title, canvas.
Text is drawn with `fillText` only (no HTML), so note content can't inject markup.

## Files
- `nostr-wall.js` module · `fallback.json` snapshot · `snapshot.mjs` refresh · `index.html` test page (serve over http) · `test.mjs` (`node --test test.mjs`)

## Status check (Oct 22, 2026, #294)
- `node --test test.mjs`: 5/5 pass (Node 22.20). Live check with `getNotes({useCache:false})` reached the relays and returned 1 note (the Relay Gate note, Oct 21 2026) in about 1.3 s. TJ's npub has only 1 kind-1 note on those relays so far, so `fallback.json` (1 note, same as live) is current.
- Known notes / gaps:
  - Public relays sometimes answer with WebSocket 503 or time out. That is expected: the module falls back to `fallback.json` silently. Re-run `node snapshot.mjs` when TJ posts more.
  - `renderNotesToCanvas` caps each note at 8 wrapped lines, so the end of long notes is cut. The Relay Gate note loses its last lines (MIT line, links).
  - The Relay Gate note says the code is public, but TJ made the repo private on Oct 21 (his words as posted; content is shown unmodified). TJ to decide whether to hide or replace it.
  - Zaps are counted from kind 9735 `#e` tags only; the one note has 0.
  - Needs Node 18+ for `test.mjs` and `snapshot.mjs` (global WebSocket/fetch); `index.html` must be served over http, not opened as a file.
  - Per #294 (3:11 PM PT): the board hangs flat on a courtyard-facing outer wall next to the timeline board; mounting is Gallery's job, not this module's.
