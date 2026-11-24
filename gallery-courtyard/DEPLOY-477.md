# #477 door-trim merge DEPLOYED Mon Oct 26 2026 ~7:33 PM PT
Deployment d1e5978b-b4af-4db4-9942-0a3adc719855 on preview-251 (replaces 471e3a9a). Entry index-BpXMoCz3.js.
- Found by DRAWCALL-LOD-SCOUT.md: courtyard296 section 4 built 6 or 12 separate MeshBasic meshes per doorway (orange/blue ring + 2 bars, both sides on room doors), about 150 static unlit draws.
- Change: each piece is baked to world space and merged per colour with mergeGeometries, giving 2 meshes named 'doorTrim' (the tagsaudit arch rule still matches). Same materials, so the result is pixel-identical. If the merge fails it logs console.warn('[477 trim merge]') and falls back to unmerged meshes. __c296.trimDraws = 2.
- Measured: dense view 875 -> 767 calls on LIVE (local 707). tagsaudit local and LIVE, desktop PASS and phone PASS. builderErrs, softWarnings and pageErrors all [] (/tmp/au/t477-*.log).
- Rollback: /tmp/courtyard296.js.pre477, /tmp/execute.pre477.js (re-run it to restore 471e3a9a)
