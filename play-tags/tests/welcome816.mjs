// #816 welcome probe at tour rate 1: TJ's welcome hologram must play ~20 s (video+captions) unless Skip is clicked
import { chromium } from 'playwright-core';
const [url, dev = 'desktop'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } };
const ctx = await b.newContext(o); const p = await ctx.newPage(); const fails = []; const MODE = process.env.MODE || '';
await p.addInitScript(() => { const pl = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { if (/holo_welcome/.test(this.src)) window.__wv = this; return pl.call(this); }; });
await p.goto(url); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && window.__tour, null, { timeout: 120000 });
await p.evaluate(() => { document.body.classList.add('portraitok'); const s = document.getElementById('start'); if (s) s.style.display = 'none'; });
await p.waitForFunction(() => __tour.phase === 'welcome', null, { timeout: 20000 });
if (dev === 'phone') await p.touchscreen.tap(195, 700); else await p.mouse.click(640, 700); // a real gesture (spatial audio init)
const t0 = Date.now(), caps = [], samples = []; let end = null;
for (let i = 0; i < 160; i++) { const s = await p.evaluate(() => { const v = window.__wv; return { ph: __tour.phase, cap: __tour.state.caption, sk: __tour.S.skipped, vt: v ? +v.currentTime.toFixed(2) : null, vp: v ? v.paused : null, ve: v ? v.ended : null, vm: v ? v.muted : null, sp: __tour.S.spOk }; });
  s.w = (Date.now() - t0) / 1000; samples.push(s); if (s.cap && caps[caps.length - 1] !== s.cap) caps.push(s.cap);
  if (s.ph !== 'welcome') { end = s; break; } if (MODE === 'pause' && i === 20) await p.evaluate(() => { window.__wv.pause(); window.__wv.play = () => Promise.reject(new Error('NotAllowed')); }); /* simulate a browser pausing the welcome mid-way and refusing to resume */ await p.waitForTimeout(250); }
const last = samples.filter(s => s.ph === 'welcome').pop() || {};
const vlog = await p.evaluate(() => (__tour.S.vLog || []).join(',')); console.log(JSON.stringify({ dev, MODE, vlog, wall: end ? end.w : 'timeout', lastVt: last.vt, end, caps: caps.length, every4: samples.filter((_, i) => i % 8 == 0) }));
if (!end || end.w < 18) fails.push('welcome ended early at ' + (end && end.w)); if (end && end.sk) fails.push('skipped without Skip'); if (caps.length < 3) fails.push('captions stuck: ' + caps.length);
console.log(fails.length ? 'FAIL ' + fails.join('; ') : 'PASS'); await b.close(); process.exit(fails.length ? 1 : 0);
