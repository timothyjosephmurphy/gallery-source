# #391 base-texture budget slice C: last >512 px local bases -> 512 px base + hi, DEPLOYED Mon Oct 26 2026 ~7:25 PM PT
Deployment fe20c932-0fa1-4223-80b2-3a9a708e879f on preview-251 (replaces bda451e3). Entry index-llkoyEc0.js.
- Found: 4 local art bases still over 512 px: book-art-a2e53 (780x604), book-art-e3293 (748x604), lisa-climbing-tahoma-cropped-288 (868x364), ridge-strips-unindexed-6 (1600x506).
- Fix: new 512 px bases (book-art-a2e53/e3293/ridge-6 *-b512-317.webp, lisa *-288-b512.webp; 160 KB total) uploaded to R2 tjm-images play/preview-251/art-317/. Lisa's original is now also on R2 there as hi (it was worker-embedded only). The lisa b512 is still embedded via the gen.py -288 rule. The hi field is the original file on img.tjm.art (all 200).
- Files: src/catalog.json (4 img), src/hang-overrides.json (4 img + hi). Text edits only. drift-check 0.
- Checks: LIVE tagsaudit desktop PASS and phone PASS. builderErrs, pageErrors and softWarnings all [] (/tmp/au/b391c-*.log).
- Remote 1600 px display URLs (strawberry-point, paul-murphy, archived 19/433/436/437, hummingbird-190) are not local art and were not touched. Candidate for a later slice if they boot at 1600.
- Rollback: /tmp/catalog.pre391c.json, /tmp/hang.pre391c.json, /tmp/execute.pre391c.js, /tmp/dist.pre391c
