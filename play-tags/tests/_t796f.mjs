import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto('http://localhost:4252/play/'); await p.waitForFunction(() => window.eggs && window.eggs.eggs && window.eggs.eggs.drone, null, { timeout: 90000 }); await p.waitForTimeout(4000);
await p.evaluate(() => { const dr = window.eggs.eggs.drone; const c = game.camera, f = c.position.clone(); c.getWorldDirection(f); dr.root.position.set(c.position.x + f.x * 3, dr.root.position.y, c.position.z + f.z * 3); dr.debug && 0; window.__hopFlip = () => { dr.flip(); }; });
const s = () => p.evaluate(() => { const dr = window.eggs.eggs.drone, h = dr.root.getObjectByName('ostrichBot'), v = h.getWorldPosition(dr.root.position.clone()); return [v.y, dr.root.position.y, dr.rig.rotation.z].map(x => +x.toFixed(2)).join('/'); });
console.log('pre', await s()); await p.evaluate(() => window.__hopFlip());
for (let i = 0; i < 10; i++) { await p.waitForTimeout(300); console.log(await s()); } await b.close();
