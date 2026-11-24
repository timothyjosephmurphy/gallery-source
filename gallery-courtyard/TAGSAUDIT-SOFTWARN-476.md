# #476 tagsaudit soft warnings (test-only, NOT deployed) Mon Oct 26 2026 ~7:00 PM PT
- play-tags/tests/tagsaudit.mjs now records console warnings tagged [plaqueTex] [muralLod402] [plaqueEnlarge337] [ride] [tour] into r.softWarnings. They never fail the audit. This covers the graceful-degrade catches that #475 left ungated on purpose.
- No src change and no deploy. LIVE stays f3ea9dd9.
- Run vs LIVE: desktop PASS, phone PASS, softWarnings [] for both (/tmp/au/w476-*.log).
- Gap: the muralLod402 per-frame catch in tags.js update() is silent (catch(e){}), so a warning can't be seen there. Adding a warn-once to it would need a deploy. Small, and a candidate for the next slot.
- Rollback: /tmp/tagsaudit.mjs.pre476
