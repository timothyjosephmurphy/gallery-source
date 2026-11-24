import { chromium } from 'playwright-core';
const url = process.argv[2] || 'http://localhost:4338/play/', dev = process.argv[3] || 'desktop';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const ctx = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 720 } };
const p = await (await b.newContext(ctx)).newPage(); await p.addInitScript(() => { window.__noNav = 1; });
await p.goto(url + (url.includes('?') ? '&' : '?') + 'tourrate=8'); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs && eggs.drone && window.__tour, null, { timeout: 180000 });
await p.waitForTimeout(1500); await p.evaluate(() => { __tour.S.phase = 'offer'; __tour.start(); });
const mid = [], seq = []; let last = null, t0 = Date.now();
while (Date.now() - t0 < 240000) { await p.waitForTimeout(100); const s = await p.evaluate(() => { const c = game.camera.position, S = __tour.S; return { ph: __tour.phase, to: S.cur && S.cur.to, kind: S.cur && S.cur.kind, clip: __tour.state.clip, x: c.x, z: c.z, m: __tour.inMid(c.x, c.z), i: S.i, err: S.errors.slice(), hud: !!window.__tourHud }; });
  if (s.ph !== 'tour') { last = s; break; } if (s.clip !== (seq[seq.length - 1] || {}).clip) seq.push({ clip: s.clip, to: s.to, hud: s.hud });
  if (s.m && s.i > 1) mid.push([s.i, s.kind, s.to, +s.x.toFixed(1), +s.z.toFixed(1)]); last = s; }
const v = await p.evaluate(() => ({ visited: __tour.S.visited, ringed: __tour.S.ringed, errors: __tour.S.errors, hudAfter: !!window.__tourHud, frozen: !!game.freeze }));
console.log(JSON.stringify({ dev, end: last && last.ph, secs: (Date.now() - t0) / 1000, seq: seq.map(x => x.clip), hudOnDuring: seq.every(x => x.hud), midSamplesAfterOpening: mid.length, mid: mid.slice(0, 8), ...v }));
await b.close();
