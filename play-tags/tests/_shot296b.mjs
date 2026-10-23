import { chromium } from 'playwright-core'; import fs from 'node:fs';
const [url, dev = 'desktop'] = process.argv.slice(2), D = '/workspace/shots/tour2/'; fs.mkdirSync(D, { recursive: true });
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1100, height: 620 } };
const pg = await (await b.newContext(o)).newPage(); await pg.addInitScript(() => { window.__noNav = true; }); await pg.goto(url + '?tour=0');
await pg.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs && window.__rayGlow, null, { timeout: 180000 }); await pg.waitForTimeout(5000);
const sfx = dev === 'phone' ? '-phone' : '';
for (const [name, room, mode] of [['ray-room-03', 'room-03', 'ray'], ['ray-room-08', 'room-08', 'ray'], ['domes', 'room-05', 'domes']]) {
  const r = await pg.evaluate(([room, mode]) => { game.freeze = false; game.hideStart && game.hideStart(); const dd = game.tags.doors.find(d => d.room === room && d.kind === 'inner'), L = Math.hypot(dd.x, dd.z), ux = dd.x / L, uz = dd.z / L; __rayGlow.point(room, 120);
    if (mode === 'ray') { game.view(-ux * 3.2 + 0.0, -uz * 3.2, ux * 9, uz * 9); } else { game.view(ux * 3, uz * 3 + 0.01, ux * 3 - uz * 2, uz * 3 + ux * 2); const c = game.camera; c.lookAt(c.position.x + ux * 5, 7.5, c.position.z + uz * 5); } return { ux, uz }; }, [room, mode]);
  await pg.waitForTimeout(5000); const f = D + `f296-${name}${sfx}.png`; await pg.screenshot({ path: f }); console.log(f, JSON.stringify(r));
}
await b.close();
