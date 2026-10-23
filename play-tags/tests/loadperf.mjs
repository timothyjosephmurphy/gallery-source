// #272 first-load profile: time to first playable frame (game + tags ready and a frame rendered), main-thread long tasks
// until then, image requests before playable. desktop | phone (390x844, 4x CPU throttle, ~9 Mbps / 60 ms network).
import { chromium } from 'playwright-core';
const [url, dev = 'desktop'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } };
const ctx = await b.newContext(o), p = await ctx.newPage();
if (dev === 'phone') { const s = await ctx.newCDPSession(p); await s.send('Emulation.setCPUThrottlingRate', { rate: 4 }); await s.send('Network.enable'); await s.send('Network.emulateNetworkConditions', { offline: false, latency: 60, downloadThroughput: 9e6 / 8, uploadThroughput: 3e6 / 8 }); }
await p.addInitScript(() => { window.__lt = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); } catch (e) {} });
let imgs = 0, playable = false; p.on('request', r => { if (!playable && /\.(webp|jpe?g|png)(\?|$)/.test(r.url())) { imgs++; if (process.env.LISTIMG) console.error(r.url().slice(0, 120)); } });
const t0 = Date.now(); await p.goto(url, { waitUntil: 'commit' });
await p.waitForFunction(() => window.game && game.tags && game.tags.ready && game.fps > 0, null, { timeout: 300000, polling: 100 });
const tPlay = Date.now() - t0; playable = true;
const r = await p.evaluate(() => { const lt = window.__lt; return { longTasks: lt.length, longTaskMs: lt.reduce((a, x) => a + x[1], 0), maxLongTask: Math.max(0, ...lt.map(x => x[1])), progressBar: !!document.getElementById('tags-progress') }; });
await p.waitForTimeout(8000);
const later = await p.evaluate(() => ({ fps: game.fps, tier: game.tier, detail: game.tags.detail || null, autoSteps: game.autoSteps, tris: window.__tagsTris ? window.__tagsTris() : null }));
console.log(JSON.stringify({ dev, timeToPlayableMs: tPlay, imagesBeforePlayable: imgs, ...r, ...later }));
await b.close();
