# #402 muralLod402 warn-once DEPLOYED Mon Oct 26 2026 ~6:52 PM PT
Deployment d1fe2e66-2eaa-45bf-9f46-b80cea2795d3 on preview-251 (replaces f3ea9dd9). Entry main-ChfjFXUZ.js (alias serves it, contains [muralLod402]).
- Gap from #476: the per-frame muralLod402 catch in tags.js update() was silent (catch(e){}).
- Change: on the first failure it now logs console.warn('[muralLod402] LOD update failed, staying on full', msg) once (update.w402 flag). Fallback to full is unchanged. #476 softWarnings now picks it up. No visual change.
- Checks: tagsaudit local and LIVE, desktop PASS and phone PASS. softWarnings [] and pageErrors [] (/tmp/au/w402-*.log).
- Rollback: /tmp/tags.js.pre402w, old execute /tmp/execute.pre402w.js, old dist /tmp/dist.pre402w.
