# neuralDance warn-once DEPLOYED Mon Oct 26 2026 ~6:58 PM PT
Deployment 3385951c-48df-4008-9386-c41d0c27f2e0 on preview-251 (replaces d1fe2e66). Entry main-BK49ARJj.js (contains [neuralDance]).
- Gap: drawDance() per-frame iframe-canvas copy in tags.js caught errors silently (catch(e){}), the same pattern as #402.
- Change: on the first failure it logs console.warn('[neuralDance] frame copy failed, keeping last frame', msg) once (drawDance.w). The last frame stays. No visual change.
- tagsaudit.mjs softWarnings regex now includes neuralDance (non-failing).
- Checks: tagsaudit local and LIVE, desktop PASS and phone PASS, softWarnings [] (/tmp/au/w176-*.log). The first LIVE desktop run hit a goto timeout, and the retry passed.
- Rollback: /tmp/tags.js.pre176w, /tmp/tagsaudit.mjs.pre176w, /tmp/execute.pre176w.js, /tmp/dist.pre176w
