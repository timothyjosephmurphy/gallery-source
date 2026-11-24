# #484 domeLight + doorLightPool per-k merge DEPLOYED Mon Oct 26 2026 ~10:00 PM PT
Deployment b76722e8-71fd-452b-a691-b1cd75a1d9d4 on preview-251 (replaces 45677f76). Entry index-D-mszu1_.js (alias verified; gen.py + splice.py both run).
- Census: domeLight (1/room) + doorLightPool (1/inner door) all use pools[k] (k=room%2), MeshBasic additive, depthWrite false, alphaMap fade -> order-independent. k0=13, k1=12 meshes. rg: no name lookups / picking / colliders / night (#352/#358) writes to pools or these meshes.
- Change (play-tags/src/courtyard296.js, right after doorLightPool loop): world-bake + mergeGeometries per k -> 1 mesh each (name 'domeLight', renderOrder 3, userData.merge484). window.__m484 = {before 25, draws 2, k0 13, k1 12}. Fail soft: console.warn('[484 merge]'), __m484.err, originals stay.
- Result: -23 draws (probe tests/_p484.mjs local+LIVE).
- tagsaudit local+LIVE desktop/phone PASS; builderErrs/softWarnings/pageErrors []; colliders 99. (One local phone run hit a transient vite-preview 500 while running concurrently with probe; solo rerun PASS.) Logs /tmp/au/l484*, /tmp/au/t484*.
- Rollback: /tmp/courtyard296.js.pre484, /tmp/execute.js.pre484 (re-run via Cloudflare execute -> restores 45677f76 bundle).
