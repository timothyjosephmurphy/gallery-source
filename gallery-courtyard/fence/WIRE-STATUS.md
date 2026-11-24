# #352 fence wire-up status (Oct 26 2026, not deployed)
Files touched (play-tags):
- src/horizon352.js: buildFence() rewritten. Bronze posts+rails replaced by one cutout plane per W.fences segment (albedo/roughness/normal, repeat.x = L/2 m, wrapT clamp, alphaTest 0.5, DoubleSide, metal/rough 0.6) + #2B2F38 6 cm square posts every ~2 m. Phone/low loads *.phone.webp. Backup of old version: /tmp/horizon352.js.bak
- public/fence/: 8 webp copied (desktop+phone albedo/roughness/normal + AO strip). PNG not copied. About 620 KB on disk.
Not touched: courtyard296.js call site (same signature), hang-overrides, eggs, agents.js, ostrichbot.js, BOOK_DEFS.
AO ground strip copied but not wired yet (optional decal).
Build: `npm run build` compiles OK (local dist/ only).
Remaining deploy steps (after #281 and #288c): rebuild, look at the fence in the browser on desktop and phone, check the deploy size is still under the CF limit, then the normal Pages deploy, then comment on card #352.
