# STICKER-307: stickers on walls (Oct 26 2026, preview, NOT deployed)
- New: src/stickerWalls307.js, wired in src/tags.js after #306. stickerBot306.js gets a tiny hook (st.landed/st.take/st.texs); backup at src/stickerBot306.js.pre307.
- UX: click/tap a strip lying on the floor (within 3 m) to pick it up (+3 in hand). Click/tap blank room or mural wall (within 4 m) to stick one. A small pill at the bottom shows the count and why a tap was rejected.
- Rules: no stickers on paintings, plaques or projections (art box + 15 cm), below 0.4 m, or within 25 cm of the cornice. Up to 9 in hand. Up to 30 on walls; past that the oldest comes off. Nothing is saved, so a reload resets it all.
- Walkability: stickers are flat pictures only, with no colliders. Doorcheck PASS (problems 0).
- Textures: #306 stand-ins (el-zonte-at-dawn, honeybadger-and-cub, warszawska-syrenka).
- Build: /tmp/ptbuild-307/dist (vite OK, only the usual chunk-size warning). Not tested in a browser.
