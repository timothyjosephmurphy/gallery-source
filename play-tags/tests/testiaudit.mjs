// #293 testimonials map audit: board present on its own wall, all build-time pins drawn, tapping/clicking a pin shows that collector's card.
import { chromium } from 'playwright-core';
const URL = process.argv[2] || 'http://127.0.0.1:4251/play/?tour=0', phone = process.argv[3] === 'phone', shot = process.argv[4];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext(phone ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto(URL); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && window.__testiMap, null, { timeout: 180000 });
const fails = []; const info = await p.evaluate(() => { const s = document.getElementById('start'); if (s) s.style.display = 'none'; const t = __testiMap; return { err: t.err, count: t.count, wall: t.wall, free: t.free294, source: t.source }; });
if (info.err) fails.push('init ' + info.err); if (!info.count) fails.push('no testimonials');
await p.evaluate(() => { const t = __testiMap, c = game.camera; c.position.set(t.stand[0], 1.6, t.stand[1]); const w = t.pinWorld(0, true); c.lookAt(w[0], w[1], w[2]); /* aim at the pin, so a narrow phone screen shows it */ game.freeze = true; });
await p.waitForTimeout(600); const xy = await p.evaluate((phone) => { const T = __testiMap; let best = null; for (let i = 0; i < T.count; i++) for (const ins of [true, false]) { const q = T.pinScreen(i, ins); if (q[1] < 90 || q[1] > innerHeight - 140 || q[0] < 20 || q[0] > innerWidth - 20) continue; /* phones: the left half is the move pad, so tap a pin on the right */ if (phone && q[0] < innerWidth * 0.55) continue; if (!best) best = q; } return best || T.pinScreen(0, true); }, phone); await p.evaluate(() => { game.freeze = false; window.__reading = false; });
console.log("XY", JSON.stringify(xy), JSON.stringify(await p.evaluate(() => [innerWidth, innerHeight, game.freeze, window.__reading, (() => { window.__pu = []; addEventListener("pointerup", e => __pu.push([e.pointerType, e.clientX|0]), true); addEventListener("pointerdown", e => __pu.push(["d", e.pointerType]), true); return 1; })()]))); if (phone) await p.touchscreen.tap(xy[0], xy[1]); else await p.mouse.click(xy[0], xy[1]); await p.waitForTimeout(400);
const r = await p.evaluate((xy) => ({ probe: __testiMap.probe(xy[0], xy[1]), pu: window.__pu, tapped: __testiMap.tapped, card: document.getElementById('testiCard').style.display, text: document.getElementById('testiCard').textContent.slice(0, 60) }), xy);
if (!r.tapped || r.card !== 'block') fails.push('tap did not show a card ' + JSON.stringify(r));
if (shot) { await p.evaluate(() => { game.freeze = true; }); await p.waitForTimeout(800); await p.screenshot({ path: shot }); }
if (errs.length) fails.push('page errors ' + errs.slice(0, 2).join(' | '));
console.log(JSON.stringify({ ...info, ...r, fails })); console.log(fails.length ? 'TESTI FAIL' : 'TESTI PASS'); await b.close(); process.exit(fails.length ? 1 : 0);
