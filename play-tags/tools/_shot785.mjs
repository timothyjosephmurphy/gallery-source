import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(/78[04]/.test(m.text()))errs.push(m.text())});
await p.goto('http://localhost:4185/play/'); await p.waitForFunction(() => window.game && game.tags && game.tags.ready, null, { timeout: 120000 }); await p.waitForTimeout(12000); const sp = await p.evaluate(()=>{const c=game.camera.position,d=new (c.constructor)();game.camera.getWorldDirection(d);return [c.x,c.z,d.x,d.z]}); errs.push("spawn "+sp.map(v=>v.toFixed(2)).join(",")); await p.evaluate(() => { for (const e of document.querySelectorAll('body *')) if (/TJM GALLERY/.test(e.textContent) && getComputedStyle(e).position === 'fixed') e.style.display = 'none'; });
for (const [n, pos, look] of [['h1door',[0,1.6,12],[0,1.8,24]],['start',[0,1.6,-27.6],[0,1.6,-14]],['fence',[0,1.6,-22.5],[1.5,0.8,-33]],['maps',[0,1.6,-24.5],[-6,1.8,-25]],['world',[0,1.6,-24.5],[6,1.8,-25]]]) {
  await p.evaluate(([pos, look]) => { game.freeze = true; const c = game.camera; c.position.set(...pos); c.lookAt(...look); if (game.player) game.player.position?.set?.(pos[0],0,pos[2]); }, [pos, look]);
  await p.waitForTimeout(2500); await p.evaluate(([pos, look]) => { const c = game.camera; c.position.set(...pos); c.lookAt(...look); }, [pos, look]); await p.waitForTimeout(300);
  await p.screenshot({ path: `/tmp/shot785-${n}.png` }); }
console.log(JSON.stringify({ errs, c: await p.evaluate(() => [window.__roadster785, window.__stickerBot306]) })); await b.close();
