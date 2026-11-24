# #307 Neural Dance pose stickers (Visual #478) DEPLOYED Mon Oct 26 2026 ~6:25 PM PT
Deployment 632aa649-532a-425d-85af-b18845379b26 on preview-251 (replaces 2990b99b). Entry index-ldRsns9i.js (alias verified).
- Upload: 20 webps (pose-01..10, desktop 304 px and .phone 152 px) to R2 tjm-images play/preview-251/sticker306/neural/, byte sizes match. Atlas and strip-sheet were not uploaded (not needed).
- Change (src/stickerBot306.js): each SlotMouth strip now carries 3 random neural poses. The planes are 0.075 m tall, width set from the aspect ratio (max 0.08), transparent, alphaTest 0.4. If the poses fail to load, the 3 painting stand-ins (public/sticker306/*.webp) are still the fallback. Phone loads .phone. Added st.neural {ok, err} and a test hook st.feed().
- Checks: tagsaudit desktop PASS, phone PASS (/tmp/au/n307-*.log). tests/_smoke307n.mjs: local phone and LIVE desktop both PASS (neural ok 10, err 0, strip fed).
- Rollback: copy /tmp/stickerBot306.js.pre307n to src/stickerBot306.js, then rebuild, gen, splice and execute. The old execute.js is /tmp/execute.pre307n.js.
- Not done: wall-decal placement using size_m 0.12-0.18 m (the wall sticker module __stickerWalls307 still uses its existing art). The atlas is unused.
