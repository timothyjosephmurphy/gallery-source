# #485 phone/low hang-plaque canvas 384x120 DEPLOYED Mon Oct 26 2026 ~10:05 PM PT
Deployment 7cf808a9-87be-40d9-8078-99cb7b39f361 on preview-251 (replaces b76722e8). Entry index-CBcukwTy.js (alias verified; gen.py + splice.py both run). Change lives in main-CeCNzzPk.js.
- Change: /workspace/gallery-core/src/main.js plaqueMesh(), right after the 512x160 canvas line, a `//#if tags` block (stripped for every other museum by vite-core museumLines):
  `if (LOW) { c.width = 384; c.height = 120; x.scale(0.75, 0.75); }` -> same layout drawn at 0.75. LOW = look.js tier (coarse pointer default 'low'). Desktop/medium/high unchanged 512x160.
- Mesh, PLAQUE_W/H scale, unit plane, plaqueAt (#8) placement, temple shared plaque hide: untouched. Brass plates (plaqueTex / plaques-webp, #337 enlarge PLATE_RE) untouched.
- Probe tests/_p485.mjs local+LIVE: desktop 310x 512x160, phone 310x 384x120; 309 visible + 1 hidden (temple) both.
- Memory: ~310 x 512x160x4x1.33 ≈ 135 MB -> 384x120 ≈ 76 MB on phone/low (-44%). Draws unchanged.
- tagsaudit local+LIVE desktop/phone PASS; builderErrs/softWarnings/pageErrors []; colliders 99. Logs /tmp/au/l485*, /tmp/au/t485*.
- NOTE: patch is in shared core main.js (no play-tags-local override of main.js exists) but gated //#if tags only. Not yet folded into tools/patch-core.py; if core is rebuilt from main.js.orig, re-apply.
- Rollback: cp /tmp/core-main.js.pre485 /workspace/gallery-core/src/main.js, rebuild + gen.py + splice.py + execute (or Pages rollback to b76722e8). /tmp/execute.js.485 = this deploy.
- FOLDED Mon Oct 26 2026 ~10:10 PM PT: tools/patch-core.py now appends the #485 block (idempotent, anchored on the 512x160 canvas line). Target overridable via PATCH_CORE_TARGET. Verified: main.js.orig copy -> patched/hooks/holo/#485 all apply, LOW gate present; current core main.js unchanged (cmp) -> no deploy, LIVE stays 7cf808a9. Backup /tmp/patch-core.py.pre485.
