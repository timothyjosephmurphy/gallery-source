# #303 HQ base maps (Visual #477) DEPLOYED Mon Oct 26 2026 ~6:12 PM PT
Deployment 2990b99b-e047-4f47-a22d-2f01777cf210 on preview-251 (replaces 779aefe6). Entry index-D-9s1tu6.js (alias verified).
- Upload: 14 webps (plaster/ashlar/flagstone map + _n, flagstone _r; desktop + .phone) to R2 tjm-images play/preview-251/hq-basemaps-303/, byte sizes match.
- Change (src/overlays303.js only): the existing #303 macro shader patch now also samples the base map with the same world-planar 1 m UV, perturbs the normal with _n (world-plane basis, strength 0.5/0.7/0.6), and multiplies roughness by flagstone _r. Constant roughness 0.9/0.85/1.0, metalness 0. Phone loads .phone.webp. Macro multiply is unchanged and now sits on top of the base.
- Deviation from WIRE.md: mesh colours were NOT set to white. TJ's #295 sunrise pastels and coral walkways are kept. Each base albedo is divided by its own mean linear colour, so it adds plaster/stone detail without muddying or darkening the palette. If Visual wants the raw albedo, drop that divide in BMAP.mean.
- tests/tagsaudit.mjs: new builderErrs gate (#475 null-guard follow-up). It fails if any builder try/catch recorded an error (__c296.err*, __o303/__wallMap/__frameBars/__testiMap/__ride/__phone304/__c295/__c294/__plaque337/__stickerBot306 .err, neural dance error). Backup: tests/tagsaudit.mjs.pre-builderr.
- Checks: tagsaudit desktop PASS, phone PASS (/tmp/au/b303-*.log). tests/_smoke303b.mjs: local desktop shows base 2048 x3, no shader errors. LIVE phone shows base 1024 x3, PASS.
- Rollback: copy /tmp/overlays303.js.pre303b to src/overlays303.js, then rebuild, gen, splice and execute. The old execute.js is /tmp/execute.pre303b.js.
- Still open: an eyeball of the normal strength and detail contrast in a real GPU browser.
