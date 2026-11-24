# prewarm + neuralDance probe warn-once DEPLOYED Mon Oct 26 2026 ~7:02 PM PT
Deployment f66a87aa-e8fb-4262-a484-6ad4dfdbdf74 on preview-251 (replaces 3385951c). Entry main-DzVfLnIJ.js.
- Last two silent hex catches in tags.js closed: prewarm r.compile slice (l.287) now counts __tagsPrewarm.err and logs '[tagsPrewarm] compile slice failed, continuing' once; danceKick running probe (l.169) logs '[neuralDance] kick/running probe failed' once. Behavior unchanged.
- tagsaudit softWarnings regex now includes tagsPrewarm (non-failing).
- Checks: tagsaudit local+LIVE desktop PASS, phone PASS, softWarnings [] (/tmp/au/w287-*.log).
- Rollback: /tmp/tags.js.pre287w, /tmp/tagsaudit.mjs.pre287w, /tmp/execute.pre287w.js, /tmp/dist.pre287w
