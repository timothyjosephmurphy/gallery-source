import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1024, height: 640 } })).newPage();
await p.goto(process.argv[2]); await p.waitForFunction(() => window.__c296?.glow358?.ready, null, { timeout: 180000 }); await new Promise(r => setTimeout(r, 3000));
for (const i of [0, 5]) { await p.evaluate(i => { const s = window.__c296.glow358.slots[i], c = window.game.camera; const f = () => { c.position.set(s.x + s.nx * 6, 1.7, s.z + s.nz * 6); c.lookAt(s.x, 3.1, s.z); }; f(); window.__f358 = setInterval(f, 5); }, i);
  await p.evaluate(() => document.querySelectorAll('#menu,#overlay,.overlay').forEach(e => e.style.display = 'none')); await new Promise(r => setTimeout(r, 1500)); await p.screenshot({ path: `/tmp/s358-${i}.png` }); await p.evaluate(() => clearInterval(window.__f358)); }
await b.close();
