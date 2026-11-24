# #473 group-label fit: DEPLOYED (Mon Oct 26 2026, ~5:23 PM PT)
Deployment f5e870c2-a82d-4e0b-9b73-f205c08c3aca on preview-251, replacing 00d93b35. Entry index-BQOT8TKH.js.
- groupLabels354.js: labels scale k = clamp((hang width + 0.3) / 1.6, 0.55, 1). Forest Triptych and Hummingbirds get 0.55. Each mesh stays hidden until its texture loads.
- wallTitles354.js: hidden labels get userData.wtHidden so a late texture load can't show them again.
- Checks: tagsaudit desktop PASS (one retry after a transient 500 from the local proxy) and phone PASS (/tmp/taglf-*.log). Live smoke with tests/_glfit.mjs: 13 placed, 11 visible, err null.
- Rollback: copy /tmp/groupLabels354.js.pre-glfit and /tmp/wallTitles354.js.pre-glfit back into place, rebuild, gen, splice, execute. Old execute.js is at /tmp/execute.pre-glfit.js.
- Note: vite preview doesn't serve /img/. tests/_glfit.mjs needs the live alias, or a route to the live site.
