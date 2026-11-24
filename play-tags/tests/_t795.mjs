import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(process.argv[2] || 'http://localhost:4252/play/'); await p.waitForFunction(() => window.__roadster785 && window.game && game.camera, null, { timeout: 90000 });
await p.waitForTimeout(3000); const st = () => p.evaluate(() => window.__roadster785.state()[0]);
console.log('spawn(behind)', await st());
await p.evaluate(() => { const o = window.__roadster785[0], c = game.camera, g = c.getWorldDirection.bind(c); window.__face = true; c.getWorldDirection = v => window.__face ? v.set(o.x - c.position.x, 0, o.z - c.position.z).normalize() : g(v); });
for (let i = 0; i < 12; i++) { await p.waitForTimeout(500); const s = await st(); console.log('facing', i, s); if (s !== 'rest') break; }
await p.evaluate(() => { const c = game.camera; delete c.getWorldDirection; });
const pos = () => p.evaluate(() => { const g = game.scene ? null : null; let r; (window.game.scene || window.game.camera.parent || {}).traverse?.(m => { if (m.name === 'roadster795') r = [m.position.x, m.position.y, m.position.z].map(v => +v.toFixed(1)); }); return r; });
for (let i = 0; i < 8; i++) { await p.waitForTimeout(1500); console.log(await st(), await pos()); if (i == 1) await p.screenshot({ path: '/tmp/shot795-fly.png' }); }
console.log('errs', errs.slice(0, 3)); await b.close();
