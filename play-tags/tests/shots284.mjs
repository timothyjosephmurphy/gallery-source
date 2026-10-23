// #284 screenshots -> /workspace/shots/284/
import { chromium } from 'playwright-core'; import fs from 'node:fs';
const url = process.argv[2], D = '/workspace/shots/284/', tag = process.argv[3] || ''; fs.mkdirSync(D, { recursive: true });
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const C = JSON.parse(fs.readFileSync(new URL('../src/catalog.json', import.meta.url))), T = C.layout.tags, St = C.layout.start;
const st = C.paintings.filter(p => p.stack && p.stack.n === 3)[0] || C.paintings.find(p => p.stack);
const c1 = T.courtyards[1], fr = T.outerCourts.find(o => o.id === 'friends-court');
const views = [['start', [St.x, St.z, St.x + Math.sin(St.yaw) * -5, St.z + Math.cos(St.yaw) * -5]], ['start-gate', [St.x, St.z, -10, 0]],
  ['courtyard', [c1.center[0] + 3.2, c1.center[1] + 1.4, c1.center[0], c1.center[1]]], ['outer', [fr.center[0] + 3, fr.center[1] + 3, fr.center[0], fr.center[1]]],
  ['salon', [st.x + st.ix * 3.2, st.z + st.iz * 3.2, st.x, st.z]]];
const pg = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); await pg.goto(url);
await pg.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs, null, { timeout: 120000 }); await pg.evaluate(() => { window.__noNav = true; window.__tour && __tour.stop && __tour.stop(); }); await pg.waitForTimeout(6000);
for (const [n, v] of views) { await pg.evaluate(v => { game.hideStart && game.hideStart(); game.view(v[0], v[1], v[2], v[3]); }, v); await pg.waitForTimeout(3500); await pg.screenshot({ path: D + tag + n + '.png' }); }
console.log('ok'); await b.close();
