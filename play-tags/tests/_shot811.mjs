import { chromium } from 'playwright-core';
const [url, dev = 'desktop'] = process.argv.slice(2), D = process.argv[4] || '/workspace/shots/811/';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1100, height: 620 } };
const pg = await (await b.newContext(o)).newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await pg.addInitScript(() => { window.__noNav = true; }); await pg.goto(url + '?tour=0');
await pg.waitForFunction(() => window.game && game.tags && game.tags.ready, null, { timeout: 180000 }); await pg.waitForTimeout(8000);
const W = (u, v) => [-24.577 + u * 0.5 + v * 0.866, -14.189 - u * 0.866 + v * 0.5];
const V = { door: [[3.6, 7.8], [0, 0]], mid: [[-1, 6.2], [1, 0]], paul: [[0, 4.6], [-3, 0.5]], easel: [[3.0, 0.6], [4.3, 3.6]], cafe: [[4.6, 5.6], [4.3, 0.8]], vista: [[-7.2, 1.2], [-9.5, -6]] };
for (const [k, [a, t]] of Object.entries(V)) { await pg.evaluate(([a, t, up]) => { game.freeze = false; game.hideStart && game.hideStart(); game.view(a[0], a[1], t[0], t[1]); if (up) { game.camera.lookAt(t[0], 9, t[1]); } }, [W(...a), W(...t), false]); await pg.waitForTimeout(2500); await pg.screenshot({ path: D + k + (dev === 'phone' ? '-phone' : '') + '.png' }); }
console.log(JSON.stringify({ ist811: await pg.evaluate(() => window.__ist811), errs }));
await b.close();
