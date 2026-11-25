import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const pg = await (await b.newContext({ viewport: { width: 1600, height: 900 } })).newPage(); await pg.goto('http://127.0.0.1:4839/play/');
await pg.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs, null, { timeout: 120000 }); await pg.evaluate(() => { window.__noNav = true; }); await pg.waitForTimeout(6000);
for (const [n,v] of [['a',[-21,-12.5,-31,-13]],['b',[-23,-16,-24,-21.4]]]) { await pg.evaluate(v => { game.hideStart && game.hideStart(); game.view(...v); }, v); await pg.waitForTimeout(5000); await pg.screenshot({ path: `/workspace/notes/paul-court-839-${n}.png` }); }
await b.close();
