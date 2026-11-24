import { chromium } from 'playwright-core';
const [url, dev = 'desktop'] = process.argv.slice(2), D = '/workspace/shots/810live/';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1100, height: 620 } };
const pg = await (await b.newContext(o)).newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await pg.addInitScript(() => { window.__noNav = true; }); await pg.goto(url + '?tour=0');
await pg.waitForFunction(() => window.game && game.tags && game.tags.ready, null, { timeout: 180000 }); await pg.waitForTimeout(8000);
const W = (u, v) => [24.819 + u * 0.5 - v * 0.866, -14.329 + u * 0.866 + v * 0.5];
const V = { door: [[0, 7.0], [0, 0]], mid: [[0, 4.2], [0, 0.5]], left: [[3.5, 5.5], [-4.5, 0.5]], right: [[-3, 5.8], [4, 0]], up: [[0, 6.8], [0, -20]] };
for (const [k, [a, t]] of Object.entries(V)) { await pg.evaluate(([a, t, up]) => { game.freeze = false; game.hideStart && game.hideStart(); game.view(a[0], a[1], t[0], t[1]); if (up) { game.camera.lookAt(t[0], 9, t[1]); } }, [W(...a), W(...t), k === 'up']); await pg.waitForTimeout(2500); await pg.screenshot({ path: D + k + (dev === 'phone' ? '-phone' : '') + '.png' }); }
console.log(JSON.stringify({ court810: await pg.evaluate(() => window.__court810), steeples: await pg.evaluate(() => window.__steeples784), b790: await pg.evaluate(() => window.__berlin790), errs }));
await b.close();
