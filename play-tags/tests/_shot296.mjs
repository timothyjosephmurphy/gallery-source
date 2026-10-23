import { chromium } from 'playwright-core'; import fs from 'node:fs';
const [url, dev = 'desktop'] = process.argv.slice(2), D = '/workspace/shots/tour2/'; fs.mkdirSync(D, { recursive: true });
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1100, height: 620 } };
const pg = await (await b.newContext(o)).newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 200))); pg.on('console', m => { if (/c296|error/i.test(m.text())) errs.push(m.text().slice(0, 200)); });
await pg.addInitScript(() => { window.__noNav = true; }); await pg.goto(url + (url.includes('?') ? '&' : '?') + 'tour=0');
await pg.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs, null, { timeout: 180000 }); await pg.waitForTimeout(6000);
const shots = [['fountain', 7, 0, 0, 0], ['fountain-close', 3.2, 2.2, 0, 0], ['sky', 4, 0, 0, 0, 'up'], ['rooms', 6, -6, 4, 4]];
for (const [name, x, z, lx, lz, mode] of shots) {
  await pg.evaluate(([x, z, lx, lz, mode]) => { game.freeze = false; game.hideStart && game.hideStart(); game.view(x, z, lx, lz); if (mode === 'up') { const c = game.camera; c.lookAt(c.position.x + 3, 30, c.position.z + 6); } }, [x, z, lx, lz, mode]);
  await pg.waitForTimeout(4000); const f = D + `f296-${name}` + (dev === 'phone' ? '-phone' : '') + '.png'; await pg.screenshot({ path: f }); console.log(f);
}
console.log(JSON.stringify(await pg.evaluate(() => { const c = window.__c296 || {}; return { keys: Object.keys(c), texErr: c.texErr, err: c.err, fountain: !!window.__fountain }; })), JSON.stringify(errs.slice(0, 6)));
await b.close();
