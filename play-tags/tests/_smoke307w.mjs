import { chromium } from 'playwright-core';
const [url, dev = 'desktop'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } };
const p = await (await b.newContext(o)).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(url); await p.waitForFunction(() => window.__stickerBot306?.neural && window.__stickerBot306.neural.ok + window.__stickerBot306.neural.err >= 10 && window.__stickerWalls307, null, { timeout: 180000 });
const r = await p.evaluate(() => ({ nt: (window.__stickerBot306.neuralTexs || []).length, walls: window.__stickerWalls307.state, neural: window.__stickerBot306.neural }));
console.log(JSON.stringify({ r, errs })); console.log(r.nt === 10 && r.walls === 'ready' && !errs.length ? 'SMOKE307W PASS' : 'SMOKE307W FAIL'); await b.close();
