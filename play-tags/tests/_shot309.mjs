import { chromium } from 'playwright-core'; import fs from 'node:fs';
const url = process.argv[2], dev = process.argv[3] || 'desktop', D = '/workspace/shots/tour2/'; fs.mkdirSync(D, { recursive: true });
const C = JSON.parse(fs.readFileSync(new URL('../src/catalog.json', import.meta.url))); const P = id => C.paintings.find(p => p.id === id);
// [name, painting id centre, distance, lateral offset]
const V = [['f309-temple-2x2-daytime','archived-painting-19',4.2],['f309-hayek-row','older-work-hayek-stark-gomez-el-bawab-original-2',3.8],['f309-portraits-row','older-work-portraits-319-329-original-2',3.8],['f309-pnut-row','older-work-figen-pnut-swoll-original-2',3.8],['f309-fernandez-row','older-work-fernandez-moran-pysh-original-2',3.8]];
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
