// #251 screenshots -> /workspace/shots/251/
import { chromium } from 'playwright-core'; import fs from 'node:fs';
const url = process.argv[2], D = '/workspace/shots/251/'; fs.mkdirSync(D, { recursive: true });
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const C = JSON.parse(fs.readFileSync(new URL('../src/catalog.json', import.meta.url))), T = C.layout.tags;
const P = id => C.paintings.find(p => p.id === id), front = (p, d) => [p.x + p.ix * d, p.z + p.iz * d, p.x, p.z];
const room = id => T.rooms.find(r => r.id === id), oc = id => T.outerCourts.find(o => o.id === id), art = (o, id) => o.art.find(a => a.id === id);
const fr = oc('friends-court'), mur = art(fr, 'friends-club-mural'), nd = art(fr, 'neural-dance'), gc = oc('garden-court'), cor = art(gc, 'cormorant-presiding-over-sunset-on-puget-sound');
const c1 = T.courtyards[1], r8 = room('room-08');
const views = [
  ['desktop', '01-pavilion-gates-checkout', [-3, 0, 4.6, 0]],
  ['desktop', '02-concert-hall-coming-soon', [1.6, -0.9, 3.98, -2.3]],
  ['desktop', '03-temple-2x2', front(P('burning-man-temple-2022-daytime'), 3.2).map((v, i) => i === 1 ? v + 0.53 : i === 3 ? v + 0.53 : v)],
  ['desktop', '04-el-salvador-triptych', front(P('painting-emergence'), 3.4)],
  ['desktop', '05-room-dome-clerestory', [r8.center[0] + 1, r8.center[1] + 1, r8.center[0] - 3, r8.center[1] - 2], 0.75],
  ['desktop', '06-courtyard-fountain', [c1.center[0] + 3.2, c1.center[1] + 1.4, c1.center[0], c1.center[1]]],
  ['desktop', '07-friends-club-mural', [mur.x + mur.wallFacing[0] * 9, mur.z + mur.wallFacing[1] * 9, mur.x, mur.z]],
  ['desktop', '08-neural-dance-wall', [nd.wallCenter[0] + nd.wallFacing[0] * 6, nd.wallCenter[1] + nd.wallFacing[1] * 6, nd.wallCenter[0], nd.wallCenter[1]]],
  ['desktop', '09-cormorant-garden-mural', [cor.x + cor.wallFacing[0] * 3, cor.z + cor.wallFacing[1] * 3, cor.x + 0.6, cor.z]],
  ['desktop', '10-room-wall-plaques', front(P('rice-paddies-in-vietnam'), 2.2)],
  ['phone', '11-phone-start-minimap-hud', null],
  ['phone', '12-phone-courtyard', [c1.center[0] + 3.2, c1.center[1] + 1.4, c1.center[0], c1.center[1]]],
];
const ctxs = {}; const out = [];
for (const [dev, name, v, up] of views) {
  if (!ctxs[dev]) { const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1600, height: 900 } };
    const pg = await (await b.newContext(o)).newPage(); await pg.goto(url); await pg.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs, null, { timeout: 120000 }); await pg.evaluate(() => { window.__noNav = true; }); await pg.waitForTimeout(6000); ctxs[dev] = pg; }
  const pg = ctxs[dev];
  if (v) await pg.evaluate(([v, up]) => { game.hideStart && game.hideStart(); game.view(v[0], v[1], v[2], v[3]); if (up) game.camera.rotateX(up); }, [v, up]); else await pg.evaluate(() => { const s = document.getElementById('start'); s && s.click && 0; });
  await pg.waitForTimeout(4500); const f = D + name + '.png'; await pg.screenshot({ path: f }); out.push(f);
}
console.log(out.join('\n')); await b.close();
