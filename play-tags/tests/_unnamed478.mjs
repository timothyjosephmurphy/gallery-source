import { chromium } from 'playwright-core';
const url = process.argv[2];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await p.goto(url, { waitUntil: 'commit' }); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && game.fps > 0, null, { timeout: 240000, polling: 200 });
await p.waitForTimeout(6000);
const r = await p.evaluate(() => { const g = {}; let n = 0; const named = {};
  game.scene.traverse(o => { if (!o.isMesh) return; let a = o, nm = ''; while (a && !nm) { nm = a.name; a = a.parent; }
    if (nm) { const k = nm.replace(/[-_]?\d+.*$/, '').slice(0, 28); named[k] = (named[k] || 0) + 1; return; } n++;
    const m = Array.isArray(o.material) ? o.material[0] : o.material; const pc = []; for (let q = o.parent; q && pc.length < 3; q = q.parent) pc.push(q.type);
    const k = `${o.geometry.type}|${m.type}|${m.color ? m.color.getHexString() : ''}|${m.map ? 'map' : ''}|${pc.join('<')}|${o.geometry.type === 'ShapeGeometry' ? '' : o.position.y.toFixed(3)}`; g[k] = (g[k] || 0) + 1; });
  return { n, groups: Object.entries(g).sort((a, b) => b[1] - a[1]), named: Object.entries(named).sort((a, b) => b[1] - a[1]).slice(0, 40), cornices: named.cornice, jambs: named.jamb, walls: named.roomWall }; });
console.log(JSON.stringify(r, null, 0)); await b.close();
