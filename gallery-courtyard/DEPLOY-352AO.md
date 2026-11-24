# #352 slice: fence ground-AO strip, DEPLOYED (Mon Oct 26 2026, ~6:30 PM PT)
Deployment 779aefe6-9006-4304-87e1-c55450b156cf on preview-251, replacing c8c400de. Entry index-5orTojY3.js (alias verified).
- Scout: the #352 fence and horizon plates were already wired and LIVE. The one piece left over was Visual's ground AO strip (fence-ground-ao-strip[.phone].webp, already served at /img/play/preview-251/fence/), marked "copied but not wired".
- Change (src/horizon352.js, buildFence only): one 0.5 m multiply-blend decal per fence segment, UVs baked to the 2 m tile, all merged into ONE mesh 'fence352-ao' (1 draw call, not 224). y=0.006 with polygonOffset and depthWrite off, inside its own try/catch so the fence can't break. Phone loads .phone.webp.
- Checks: tagsaudit desktop PASS and phone PASS, pageErrors empty (/tmp/ta352-desktop.log, /tmp/ta352-phone.log). tests/_smoke352ao.mjs (local and LIVE): ao=1, fence children 226, on desktop and phone.
- No catalog change, so drift-check doesn't apply.
- Rollback: copy /tmp/horizon352.js.pre352ao to src/horizon352.js, then rebuild, gen, splice and execute. The old execute.js is /tmp/execute.pre352ao.js.
- Still open on #352: a visual eyeball of the decal darkness, which may need tuning if it reads too heavy.
