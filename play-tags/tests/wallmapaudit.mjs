// #291 wall map audit: the board exists in the courtyard; every room on it escorts the player there along walk paths
// (smooth: many frames, no teleport), control comes back after each; a real tap on the board picks the right room and escorts.
import { chromium } from 'playwright-core';
const URL = process.argv[2] || 'http://127.0.0.1:4251/play/?tour=0', phone = process.argv[3] === 'phone';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext(phone ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
await p.goto(URL); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs && window.eggs.world && window.__wallMap, null, { timeout: 180000 });
await p.evaluate(() => { const s = document.getElementById('start'); if (s) s.style.display = 'none'; });
const fails = [], info = await p.evaluate(() => ({ rooms: __wallMap.rooms, pos: __wallMap.pos, err: __wallMap.err }));
if (info.err) fails.push('init ' + info.err); if (Math.hypot(...info.pos) > 16) fails.push('board not on a courtyard-facing outer wall');
for (const id of info.rooms) {
  await p.evaluate(s => { const c = game.camera; c.position.x = s[0]; c.position.z = s[1]; game.freeze = false; window.__reading = false; }, await p.evaluate(() => __wallMap.stand));
  const ok = await p.evaluate(id => __wallMap.go(id, 14), id); if (!ok) { fails.push('no escort ' + id); continue; }
  try { await p.waitForFunction(n => __wallMap.escorts.length >= n && !__wallMap.active, info.rooms.indexOf(id) + 1, { timeout: 200000 }); } catch (e) { fails.push('stuck ' + id); await p.evaluate(() => { __wallMap.active = null; game.freeze = false; window.__reading = false; }); continue; }
  const r = await p.evaluate(id => { const e = __wallMap.escorts.at(-1), W = window.eggs.world, room = game.tags && null; return { e, freeze: !!game.freeze }; }, id);
  if (!r.e.ok) fails.push('escort fail ' + id); if (r.e.frames < 8) fails.push('teleport ' + id + ' frames ' + r.e.frames); if (r.freeze) fails.push('control not returned ' + id);
}
// real tap on the board
const tgt = info.rooms.find(r => r.startsWith('room-')) || info.rooms[0];
await p.evaluate(() => { const s = __wallMap.stand, c = game.camera; c.position.set(s[0], 1.6, s[1]); c.lookAt(__wallMap.pos[0], 1.45, __wallMap.pos[1]); game.freeze = false; window.__reading = false; });
await p.waitForTimeout(400); const xy = await p.evaluate(id => __wallMap.screenOf(id), tgt); const n0 = await p.evaluate(() => __wallMap.escorts.length);
await p.evaluate(() => { game.freeze = false; window.__reading = false; });
if (phone) await p.touchscreen.tap(xy[0], xy[1]); else await p.mouse.click(xy[0], xy[1]);
await p.waitForTimeout(300); const tapped = await p.evaluate(() => __wallMap.tapped);
if (tapped !== tgt) fails.push('tap picked ' + tapped + ' wanted ' + tgt);
else { try { await p.waitForFunction(n => __wallMap.escorts.length > n && !__wallMap.active, n0, { timeout: 240000 }); } catch (e) { fails.push('tap escort did not finish'); } }
if (errs.length) fails.push('page errors: ' + errs.slice(0, 2).join(' | '));
console.log(JSON.stringify({ rooms: info.rooms.length, escorts: await p.evaluate(() => __wallMap.escorts.length), tapped, fails }));
console.log(fails.length ? 'WALLMAP FAIL' : 'WALLMAP PASS'); await b.close(); process.exit(fails.length ? 1 : 0);
