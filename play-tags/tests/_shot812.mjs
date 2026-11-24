import { chromium } from 'playwright-core';
const [url, D = '/workspace/shots/812/'] = process.argv.slice(2);
const C = {'room-01':[0,14.289],'room-02':[12.375,7.145],'room-03':[-12.375,7.145],'room-04':[-12.375,-21.434],'room-05':[12.375,21.434],'room-06':[12.375,-21.434],'room-07':[12.375,-7.145],'room-08':[-12.375,-7.145],'room-09':[-24.75,0],'room-10':[24.75,0],'room-11':[0,-14.289],'room-12':[-12.375,21.434]};
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await (await b.newContext({ viewport: { width: 1100, height: 620 } })).newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await pg.addInitScript(() => { window.__noNav = true; }); await pg.goto(url + '?tour=0');
await pg.waitForFunction(() => window.game && game.tags && game.tags.ready, null, { timeout: 180000 }); await pg.waitForTimeout(8000);
const props = await pg.evaluate(() => { let s = game.camera; while (s.parent) s = s.parent; let sc = s; if (sc === game.camera) sc = game.scene; const g = []; sc.traverse(o => { if (o.name === 'guitar764') o.children.forEach(m => m.isMesh && m.geometry.type === 'BoxGeometry' && g.push([+m.position.x.toFixed(2), +m.position.z.toFixed(2)])); });
  const bk = []; sc.traverse(o => { if (/book|lectern/i.test(o.name) && o.parent && !/book|lectern/i.test(o.parent.name)) bk.push([o.name, +o.position.x.toFixed(2), +o.position.z.toFixed(2)]); }); return { g, bk }; });
const near = (p) => Object.entries(C).find(([k, c]) => Math.hypot(p[0] - c[0], p[1] - c[1]) < 1.5)?.[0] || 'none';
console.log('guitar', JSON.stringify(props.g.map(p => near(p))), 'books', JSON.stringify(props.bk.map(([n, x, z]) => n + '@' + near([x, z]))));
for (const r of ['room-04','room-06','room-09','room-10','room-01','room-11','room-02','room-07','room-05','room-12','room-03','room-08']) { const [x, z] = C[r], L = Math.hypot(x, z), ax = x - x / L * 4.5, az = z - z / L * 4.5;
  await pg.evaluate(([a, c, x, z]) => { game.freeze = false; game.hideStart && game.hideStart(); game.view(a, c, x, z); }, [ax, az, x, z]); await pg.waitForTimeout(2500); await pg.screenshot({ path: D + r + '.png' }); }
console.log('errs', JSON.stringify(errs)); await b.close();
