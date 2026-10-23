import { chromium } from 'playwright-core'; import fs from 'node:fs';
const url = process.argv[2], dev = process.argv[3] || 'desktop', D = '/workspace/shots/tour2/'; fs.mkdirSync(D, { recursive: true });
const C = JSON.parse(fs.readFileSync(new URL('../src/catalog.json', import.meta.url))); const P = id => C.paintings.find(p => p.id === id);
// [name, painting id centre, distance, lateral offset]
const V = [['f1022-father-paul-ruth', 'book-art-0a80f9a5da0d39edc80f', 3.4], ['f1022-rainier-alone', 'sunrise-on-rainier-from-denny-blaine', 5.5], ['f1022-red-cloud-panorama', 'painting-portrait-with-hat', 5.5], ['f1022-temple-2x2-centred', 'archived-painting-20', 5.0, -1.6], ['f1022-mayan-warrior-door-wall', 'archived-painting-18', 3.6], ['f1022-catherine-2x2-blank-wall', 'book-art-596837cb5ff533c620dd', 3.2, -0.55], ['f1022-ukraine-row', 'warszawska-syrenka', 4.2, -1.6], ['f1022-lisa-wall', 'book-art-7123da0440d527299914', 3.6], ['f1022-vesper-own-wall', 'book-art-b01b8695b2528cb850a3', 4.0], ['f1022-bull-wall', 'book-art-0351c2ff290526e4f204', 4.0, 0.2], ['f1022-hummingbird', 'book-art-b7a9cd259d8ac51a236b', 2.4], ['f1022-painting-4', 'archived-painting-4', 2.6]];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1100, height: 620 } };
const pg = await (await b.newContext(o)).newPage();
await pg.goto(url); await pg.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs, null, { timeout: 180000 }); await pg.evaluate(() => { window.__noNav = true; }); await pg.waitForTimeout(6000);
const only = process.argv[4];
for (const [name, id, d, lat = 0] of V) { if (only && !name.includes(only)) continue; const p = P(id); if (!p) { console.log('missing', id); continue; }
  const tx = p.iz, tz = -p.ix, px = p.x + p.ix * d + tx * lat, pz = p.z + p.iz * d + tz * lat;
  await pg.evaluate(v => { game.freeze = false; game.hideStart && game.hideStart(); game.view(v[0], v[1], v[2], v[3]); }, [px, pz, p.x + tx * lat, p.z + tz * lat]);
  await pg.waitForTimeout(4500); const f = D + name + (dev === 'phone' ? '-phone' : '') + '.png'; await pg.screenshot({ path: f }); console.log(f); }
await b.close();
