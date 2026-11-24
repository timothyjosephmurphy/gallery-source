import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await p.goto(process.argv[2], { waitUntil: 'commit' }); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && game.fps > 0, null, { timeout: 240000, polling: 200 }); await p.waitForTimeout(8000);
console.log(JSON.stringify(await p.evaluate(async () => { const R = game.renderer, fr = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); R.info.autoReset = false;
 const snap = async () => { await fr(); R.info.reset(); await new Promise(r => requestAnimationFrame(r)); return R.info.render.calls; };
 const lights = []; game.scene.traverse(o => { if (o.isLight && o.castShadow) lights.push({ t: o.type, n: o.name, ms: o.shadow.mapSize.x, au: o.shadow.autoUpdate, vis: o.visible }); });
 const res = { lights, autoUpdate: R.shadowMap.autoUpdate, type: R.shadowMap.type };
 for (const [x, z, tx, tz] of [[9.9 + 3, 7.5, 9.9, 7.5], [-6.3, -13.7, -6.3, -16.7]]) { game.view(x, z, tx, tz); const a = await snap(); R.shadowMap.autoUpdate = false; const s = await snap(); R.shadowMap.autoUpdate = true; res['v' + x] = { all: a, noShadowPass: s }; }
 return res; }))); await b.close();
