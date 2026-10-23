import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }), p = await ctx.newPage(); await p.addInitScript(() => { window.__noNav = 1; });
await p.goto('http://localhost:4255/play/?tour=0');
await p.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs && eggs.drone && window.__ride && window.__ostrichBot && window.__ostrichBot.ready, null, { timeout: 180000 });
await p.evaluate(() => { const s = document.getElementById('start'); if (s) s.style.display = 'none'; window.__rideRate = 6; }); await p.waitForTimeout(1500);
await p.evaluate(() => window.__ride.start()); 
for (let i = 0; i < 70; i++) { await p.waitForTimeout(500); const q = await p.evaluate(() => { const S = __ride.state, a = __ostrichBot.api; return [S.phase, +game.camera.position.y.toFixed(2), +eggs.drone.root.position.y.toFixed(2), S.cur || a.state.cur, +a.g.scale.x.toFixed(2), +a.g.position.y.toFixed(2), a.state.still ? 's' : 'm', a.state.sp.toFixed(2)].join(' '); }); console.log(i, q); }
await b.close();
