# #391 base-texture budget: 2400 px bases -> 512 px base + hi stream, DEPLOYED Mon Oct 26 2026 ~7:20 PM PT
Deployment bda451e3-6aa2-4696-8680-e7909fbd9d0c on preview-251 (replaces f66a87aa). Entry index-DJcW2ww5.js, main-o0nWEfXE.js.
- Found: 5 hung catalog works (6 in hang-overrides) used their 2400 px -317 webp as the BOOT base texture (every other base is 256 px). About 3.5 MB of download and roughly 25 Mpx of GPU texture at load, on phone too.
- Fix: new 512 px bases (*-b512-317.webp, 254 KB total) uploaded to R2 tjm-images play/preview-251/art-317/, plus local copies in public/art. The img field points to b512, and the new hi field is the original 2400 file on img.tjm.art (already on R2, returns 200). So the full sharp texture now streams in within 5.5 m through the existing hi queue (HI_MAX cap/evict). The base no longer pays for it up front. archived-painting-73 keeps its max field.
- Files: src/catalog.json (5), src/hang-overrides.json (6), patched with text-only edits. tools/drift-check.py = 0.
- Checks: tagsaudit local and LIVE, desktop PASS and phone PASS, pageErrors [] and softWarnings [] (/tmp/au/b391*.log).
- No eyeball change at viewing distance: you get the same 2400 px texture up close, and the 512 px base only shows beyond 5.5 m.
- Rollback: /tmp/catalog.pre391b.json, /tmp/hang.pre391b.json, /tmp/execute.pre391b.js, /tmp/dist.pre391b
