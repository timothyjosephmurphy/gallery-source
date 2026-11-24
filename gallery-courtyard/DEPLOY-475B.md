# #475 builderErrs gap audit DEPLOYED Mon Oct 26 2026 ~6:55 PM PT
Deployment f3ea9dd9-a576-4058-9c5b-4d03e75e8cf3 on preview-251 (replaces d80c5c83). Entry index-r4132e0h.js (alias verified).
- Audit: listed every builder try/catch in src. Silent before this (console.warn only, so tagsaudit could not see a failure): #354 group labels, wall titles and eagle brass (tags.js), and the #352 fence AO (horizon352.js). Also window.__stickerWalls307.err was set but not in the builderErrs list.
- Change: the 354 catches now record window.__g354.err ('354l|354t|354e: ...'). The 352 AO catch records window.__h352ao.err. tests/tagsaudit.mjs builderErrs adds __stickerWalls307, __g354 and __h352ao. No visual or behaviour change.
- Not gated (on purpose): best-effort catches in tour.js, the plaqueEnlarge canvas fallback, the muralLod402 fallback to full, and plaqueTex (each one degrades gracefully).
- Checks: tagsaudit desktop PASS and phone PASS, builderErrs [] (/tmp/au/w475b-tagsaudit-*.log).
- Rollback: /tmp/tags.js.pre475b, /tmp/horizon352.js.pre475b, /tmp/tagsaudit.mjs.pre475b; old execute /tmp/execute.pre475b.js, old dist /tmp/dist.pre475b.
