import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); await p.addInitScript(() => { window.__noNav = 1; }); await p.goto('http://localhost:4252/play/?tour=0'); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs && eggs.eggs && eggs.eggs.checkoutRun, null, { timeout: 120000 });
console.log(JSON.stringify(await p.evaluate(async () => { const CR = eggs.eggs.checkoutRun; const fr = eggs.world.randomFree(0.3, (x, z) => Math.hypot(x, z) > 20); game.camera.position.x = fr.x; game.camera.position.z = fr.z;
 let frames = 0; const cnt = () => { frames++; requestAnimationFrame(cnt); }; cnt(); CR.start(); const S = window.__checkoutRun, r = S.run; const info = { from: [fr.x, fr.z], L: r.L, gate: r.gate, pts: r.pts.length };
 const log = []; const t0 = performance.now(); while (!window.__checkoutGo && performance.now() - t0 < 40000) { await new Promise(q => setTimeout(q, 2000)); const R = S.run; log.push([Math.round(performance.now() - t0), R && +R.s.toFixed(1), R && +R.t.toFixed(1), frames, R && R.seg]); }
 return { info, log, go: window.__checkoutGo, pos: [game.camera.position.x, game.camera.position.z] }; })));
await b.close();
