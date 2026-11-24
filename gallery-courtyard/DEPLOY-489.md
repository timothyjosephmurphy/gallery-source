# #489 vendor-three manualChunks DEPLOYED Tue Oct 27 2026 ~12:50 AM PT
Deployment 56a62895-5392-4903-b36d-d9b4bc469d25 on preview-251 (replaces 4ed8521f). Entry index-C6VDMZMR.js (alias verified). gen.py then splice.py both run.
## Why B and not A (far-cull)
- I probed LIVE 4ed8521f with tests/_fardist.mjs (a _drawscout copy that adds distance bands). Densest view (15.1,-14.3), 287 calls: hang 99 draws by distance <12/12-18/18-25/>25 m = 41/18/40/0. roomSign 5 = 0/2/1/2. glabel 4 = 1/0/1/2. anon 30 = 0/4/3/23 (out of scope).
- The core (gallery-core main.js:882-892) already hides painting groups at >=24 m unless they are in your room, and plaques at >=14 m. Every far hang draw left is art 12-24 m away in or near your room. Culling it at 18-25 m would make visible art pop off the walls, which breaks "nearby art stays correct". A safe >=25 m gate only saves ~4 draws (signs/labels), below the 15-call bar, so A is noise-only. No code was changed for A.
## Change (B)
- play-tags/vite.config.js: build.rollupOptions.output.manualChunks puts node_modules/three/** into a `vendor-three` chunk.
- Before, three was hidden inside museum.config-*.js (690.7 KB) plus BufferGeometryUtils-*.js. Now museum.config is 2.2 KB and vendor-three is 808.6 KB (209 KB gz); main went from 886.0 KB to 771.2 KB. Total JS 1,997,207 -> 1,996,250 B. No runtime or visual change; gen.py still inlines everything.
- tagsaudit local + LIVE, desktop and phone: PASS. pageErrors/softWarnings [], colliders 99. Logs /tmp/au/t489*.
- Rollback: re-run /tmp/execute.js.pre489 (the 4ed8521f bundle), or cp /tmp/vite.config.js.pre489 play-tags/vite.config.js, then rebuild/gen/splice/execute. /tmp/execute.js.489 = this deploy.
