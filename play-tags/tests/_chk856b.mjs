import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await p.goto('http://localhost:4856/play/?key=x'); await p.waitForFunction(() => window.game && game.tags && game.tags.ready, null, { timeout: 120000 });
console.log(JSON.stringify(await p.evaluate(() => { const L = window.__wallLocks, P = game.paintings.filter(p => p.state==='wall' && /^room-/.test(p.data.room||''));
  // lock every wall, count paintings caught, then try grab via primary on one
  const all = [...new Set(L.icons.map(i => i.userData.wallLock))]; all.forEach(L.toggle);
  const caught = P.filter(p => L.painting(p)).length, miss = P.filter(p => !L.painting(p)).slice(0,3).map(p => [p.data.id, p.data.room, p.data.wall, p.data.ix, p.data.iz]);
  const t = P.find(p => L.painting(p)); const pos = new game.THREE.Vector3(t.data.x, t.data.y, t.data.z), n = new game.THREE.Vector3(t.data.ix, 0, t.data.iz);
  const hangBlock = L.at(pos, n); all.forEach(L.toggle); return { walls: all.length, P: P.length, caught, miss, hangBlock, after: L.list().length, ls: localStorage.getItem(L.key) }; })));
await b.close();
