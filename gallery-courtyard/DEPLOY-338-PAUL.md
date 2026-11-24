# #338 follow-up: Paul annex hi-res masters, DEPLOYED (Mon Oct 26 2026, ~5:55 PM PT)
Deployment 41cd44cc-b319-4165-908b-37f60f4c7428 on preview-251, replacing bece9ece. Entry index-DUVr1Ql1.js (alias verified); main-DhG0Lm2-.js carries 37 gallery-hi/paul-murphy URLs.
- Bug: tools/apply-overrides.py applied hires-338.json `max` before paulroom.build() created the Paul annex records, so all 37 Paul Murphy paintings (hi = 1600 px display webp) never got their 2400 px master. 71 of 109 got it before, 108 of 109 now (1 id is not in the catalog).
- Fix: second max pass right after paulroom.build (fills only records with no max). src/catalog.json patched with max/maxW/maxH only. A full apply-overrides rerun moved some positions (pre-existing drift unrelated to this), so I left that out on purpose.
- All 37 URLs return 200 from img.tjm.art. Gating is unchanged: desktop/tablet only, within 2.8 m, and capped by the existing queue.
- Checks: tagsaudit desktop PASS and phone PASS, pageErrors empty (/tmp/ta338-d.log and /tmp/ta338-p.log).
- Rollback: /tmp/catalog.pre338paul.json → src/catalog.json and /tmp/apply-overrides.py.pre338paul → tools/, then rebuild, gen, splice and execute. The old execute.js is /tmp/execute.pre338paul.js.
- Open: apply-overrides rerun drift (x/z/s shifts on some walls) needs its own scout before anyone reruns it.
