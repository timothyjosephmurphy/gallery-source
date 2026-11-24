import { chromium } from 'playwright-core';
const [url, dev = 'desktop'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } };
const p = await (await b.newContext(o)).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(url); await p.waitForFunction(() => window.__stickerBot306 && window.__stickerBot306.state === 'ready' && window.__stickerBot306.neural && window.__stickerBot306.neural.ok + window.__stickerBot306.neural.err >= 10, null, { timeout: 180000 });
const r = await p.evaluate(async () => { const s = window.__stickerBot306; s.feed(); await new Promise(r => setTimeout(r, 3000)); return { neural: s.neural, strips: s.strips, presses: s.presses, err: s.err }; });
console.log(JSON.stringify({ r, errs })); console.log(r.neural.ok === 10 && !r.neural.err && !errs.length ? 'SMOKE307N PASS' : 'SMOKE307N FAIL'); await b.close();
