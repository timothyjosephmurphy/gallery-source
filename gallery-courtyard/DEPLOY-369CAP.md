# #369 follow-up: ostrich Walk timeScale cap raised, DEPLOYED (Mon Oct 26 2026, ~5:35 PM PT)
Deployment bece9ece-eacc-4b47-a6cb-6f624353a275 on preview-251, replacing f5e870c2. Entry index-DYMbnN0Q.js (alias verified).
- src/ostrichbot.js: Walk timeScale cap went from a hard 9 to the WALK_TS_CAP constant, now 15. At BOT_SCALE 1.1 the old cap stopped at 9*0.274*1.1 = 2.71 m/s, so planted feet skated above that. The new cap reaches about 4.5 m/s. Below 2.71 m/s nothing changes.
- Checks: tagsaudit desktop PASS and phone PASS with pageErrors empty (/tmp/ta369-d.log and /tmp/ta369-p.log).
- Rollback: copy /tmp/ostrichbot.js.pre369cap back, then rebuild, gen, splice and execute. The old execute.js is /tmp/execute.pre369cap.js.
- Still needs TJ to eyeball a fast run. Only the hard cap was raised; nothing smooths the change in rate.
