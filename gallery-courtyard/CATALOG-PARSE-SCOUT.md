# catalog.json parse scout, Tue Oct 27 2026 ~1:10 AM PT. Doc only.
## Today
- play-tags/src/catalog.json (455,592 B) is a LOCAL override. gallery-core/vite-core.js resolveId prefers LOCAL over CORE, so the core main.js:13 `import CATALOG from './catalog.json'` picks up the play-tags copy. ride.js and tour.js import it too. Vite 5.4.21 json default (stringify:false) inlines it as an object literal in main (~410 KB of 771 KB).
- There are no named JSON imports in play-tags or core src, so `json.stringify` would be safe.
## Option 1: `json: { stringify: true }` in play-tags/vite.config.js only (no core edit; museums have their own configs)
Trial build: main 771.19 KB -> 831.21 KB (gz 204,405 -> 206,916 B, +2.5 KB) because of the string escaping. The node microbench (15 runs, compile+eval of this catalog) shows a literal median of 2.1 ms vs JSON.parse 2.5 ms. That is no measurable win on desktop V8. A phone win is theoretical (maybe a few ms) and would need on-device measurement. Reverted.
## Option 2: fetch /play/catalog.json before hang
CATALOG is used synchronously at core module top level (main.js:215 hangGugg, :218 slug map). Making it async means editing shared gallery-core main.js, which the frozen museums also use, or adding a play-tags main.js wrapper with a top-level await. gen.py inlines every asset into execute.js, so a fetch adds a round trip unless gen.py also serves it. tagsaudit boot timing would also be at risk.
## Verdict
Option 1: **DON'T** (bigger bundle, no measured parse win). Option 2: **HOLD for TJ approval** (core/boot-path change, so it isn't play-tags-only in practice).
