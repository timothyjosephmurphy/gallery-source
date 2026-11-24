# #738 hide bottom HUD, minimap, scan tool during guided tour. DEPLOYED Tue Oct 27 2026 PT
Deployment d3da0b48-9944-443d-9b23-0bebfea0eb41 on preview-251 (replaces c1c14299). Entry index-BBKhhagk.js.
- play-tags/src/tour.js: appended rAF watcher. Tour active = window.__tourOn OR #tourRing shown (so it covers the free-walk controls step too). It sets window.__tourHud and toggles body.tour738. CSS hides #hud (tool strip + cart count), #touch/#tfire/#tswap/#tlaunch (SCAN), .mm-wrap/.mm-btn (minimap), #cross. Everything comes back when the tour ends or on Exit.
- gallery-core/src/main.js L1644/1646: the FP viewmodel (scanner/gun mesh + laser) is skipped when window.__tourHud is set. Only tags sets it, so museums are unaffected (none were rebuilt).
- Top chrome (Home/Cart/Ask Guide/sound) unchanged. No caption, path or ostrich changes.
- Probe tests/_hud738.mjs (local + LIVE): hidden while tour is on, restored after. tagsaudit desktop+phone PASS local (phone first run had a mute-residual flake, 0.00057, and passed on rerun) and LIVE. Logs /tmp/au738-*.log
- Rollback: /tmp/tour.js.pre738 -> play-tags/src/tour.js; /tmp/core-main.js.pre738 -> gallery-core/src/main.js; /tmp/execute.js.pre738 (+ /tmp/_worker.js.pre738) re-run via Cloudflare execute restores c1c14299.
