import { chromium } from 'playwright-core'; import fs from 'node:fs';
// usage: node _shot1023.mjs URL desktop|phone prefix  [spawn|ray|map|mural ...]
const [url, dev = 'desktop', pre = 'x', ...what] = process.argv.slice(2), D = '/workspace/shots/tour2/'; fs.mkdirSync(D, { recursive: true });
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1100, height: 620 } };
const pg = await (await b.newContext(o)).newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await pg.addInitScript(() => { window.__noNav = true; }); await pg.goto(url + '?tour=0');
await pg.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs, null, { timeout: 180000 }); await pg.waitForTimeout(6000);
const sfx = dev === 'phone' ? '-phone' : '';
const views = { spawn: null, 'spawn-turn': ['turn'], ray: ['ray'], 'far-door': ['door'] };
for (const w of what) {
  await pg.evaluate(([w]) => { game.freeze = false; game.hideStart && game.hideStart(); const T = game.tags;
    if (w === 'spawn') { const st = game.tags.report && null; game.view(4.7, 3.4, 4.7 + Math.sin(-2.19) * 5, 3.4 + Math.cos(-2.19) * 5); }
    else if (w === 'door') { const d = T.doors.find(d => d.room === 'room-05' && d.kind === 'inner'); game.view(d.x + d.nx * -1.0, d.z + d.nz * -1.0, 0, 0); }
    else if (w === 'door2') { const d = T.doors.find(d => d.room === 'room-09' && d.kind === 'inner'); game.view(d.x * 0.7, d.z * 0.7, 0, 0); }
    else if (w.startsWith('v=')) { const a = w.slice(2).split(',').map(Number); game.view(a[0], a[1], a[2], a[3]); } else if (w === 'teaser') { game.view(-3.8, -10.1, -9.8, -10.1); } else if (w === 'teaser2') { game.view(-2.0, -6.0, -9.8, -9.5); }
    else if (w === 'bot') { const b = window.__ostrichBot.api.g, v = new b.position.constructor(); b.getWorldPosition(v); window.__botpos = [v.x, v.y, v.z]; game.view(v.x + 1.6, v.z + 1.6, v.x, v.z); }
    else if (w === 'above') { game.view(9, 9, 0, 0); game.camera.position.y = 4.5; game.camera.lookAt(0, 0, 0); } }, [w]);
  await pg.waitForTimeout(4500); if (w === 'bot') console.log(JSON.stringify(await pg.evaluate(() => window.__botpos)), await pg.evaluate(() => JSON.stringify({clip: window.__ostrichBot.api.state.cur, y: window.__ostrichBot.api.g.position.y}))); const f = D + `g1023-${pre}-${w}${sfx}.png`; await pg.screenshot({ path: f }); console.log(f);
}
console.log(JSON.stringify(errs.slice(0, 4))); await b.close();
