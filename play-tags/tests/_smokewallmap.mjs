import { chromium } from 'playwright-core';
const [url, dev = 'desktop', shot] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } };
const p = await (await b.newContext(o)).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
await p.goto(url); try { await p.waitForFunction(() => window.game && game.tags && game.tags.ready && game.nPaintings > 50, null, { timeout: 90000 }); } catch (e) { errs.push('timeout ' + await p.evaluate(() => JSON.stringify({ main: window.__mainLoaded, g: !!window.game, fb: document.body.innerText.slice(0, 200) }))); }
await p.waitForFunction(() => window.window.__wallMap, null, {timeout: 60000}).catch(()=>{});
const r = await p.evaluate(() => window.game ? { wm: window.__wallMap ? { err: window.__wallMap.err || null, rooms: (window.__wallMap.rooms||[]).length, go: typeof window.__wallMap.go } : null, n: game.nPaintings, pose: game.player && game.player(), mm: !!document.querySelector('.mm-wrap'), tags: !!game.tags } : null);
if (shot) await p.screenshot({ path: shot });
console.log(JSON.stringify({ r, errs: errs.slice(0, 12) })); await b.close();
