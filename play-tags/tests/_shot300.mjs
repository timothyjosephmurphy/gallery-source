import { chromium } from 'playwright-core'; import fs from 'node:fs';
const [url, dev = 'desktop', pick = 'room-01:inner'] = process.argv.slice(2), D = '/workspace/shots/tour2/'; fs.mkdirSync(D, { recursive: true });
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1100, height: 620 } };
const pg = await (await b.newContext(o)).newPage(); pg.on('pageerror', e => console.log('ERR', String(e).slice(0, 200)));
await pg.addInitScript(() => { window.__noNav = true; }); await pg.goto(url + (url.includes('?') ? '&' : '?') + 'tour=0');
await pg.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs, null, { timeout: 180000 }); await pg.waitForTimeout(5000);
for (const spec of pick.split(',')) { const [room, kind, side = 'out', dist = '4.5'] = spec.split(':');
  const r = await pg.evaluate(([room, kind, side, dist]) => { const d = game.tags.doors.find(d => d.room === room && (d.kind === kind || d.to === kind)); if (!d) return null; const s = side === 'out' ? 1 : -1, L = +dist; game.freeze = false; game.hideStart && game.hideStart();
    game.view(d.x + d.nx * s * L, d.z + d.nz * s * L, d.x, d.z); return { d: [d.x, d.z], w: d.width }; }, [room, kind, side, dist]);
  if (!r) { console.log('no door', spec); continue; } await pg.waitForTimeout(4500); const f = D + `f300-${room}-${kind}-${side}` + (dev === 'phone' ? '-phone' : '') + '.png'; await pg.screenshot({ path: f }); console.log(f, JSON.stringify(r)); }
console.log(JSON.stringify(await pg.evaluate(() => ({ sign: window.__signFit300, c295: { a: __c295.arches, l: __c295.lintels } }))));
await b.close();
