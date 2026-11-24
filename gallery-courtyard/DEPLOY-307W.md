# #307 wall decals use Neural Dance poses: DEPLOYED Mon Oct 26 2026 ~6:45 PM PT
Deployment d80c5c83-1b9e-435d-89b7-c7d39766bc38 on preview-251 (replaces f6c9462b). Entry index-CzEFA0iQ.js (alias verified).
- Change: src/stickerBot306.js exposes st.neuralTexs (the loaded pose list). src/stickerWalls307.js now places the wall stickers as Neural Dance poses at Visual size_m 0.18 m tall, keeping the aspect ratio, transparent with alphaTest 0.4 and polygonOffset. If the poses never loaded, it falls back to the old 0.075 m painting stand-ins. The cornice margin grew by 0.09 m (half the decal height). Counter: __stickerWalls307.neuralUsed. No new assets (it reuses the R2 sticker306/neural poses).
- Checks: tagsaudit desktop PASS, phone PASS (/tmp/au/w307-tagsaudit-*.log). tests/_smoke307w.mjs: local desktop, local phone and LIVE desktop PASS (neuralTexs 10, walls ready, no page errors).
- Rollback: copy /tmp/stickerWalls307.js.pre307w and /tmp/stickerBot306.js.pre307w back to src, then rebuild, gen, splice and execute. The old execute.js is /tmp/execute.pre307w.js.
- Open: TJ eyeball of the 0.18 m decal size on walls. The click-to-stick path was not exercised by an automated click.
