// #308 follow-up: clicking the guide bot (desktop, pointer locked) frees the mouse so the menu buttons can be clicked; relocked when the menu closes. Phone: no pointer-lock use at all.
import { chromium } from 'playwright-core';
const url = process.argv[2] || 'http://localhost:4252/play/?tour=0';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const fails = []; const ok = (n, c, x = '') => { console.log((c ? 'PASS' : 'FAIL') + ' · ' + n + ' · ' + x); if (!c) fails.push(n); };
for (const dev of ['desktop', 'phone']) {
  const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } };
  const ctx = await b.newContext(o), p = await ctx.newPage(); await p.addInitScript(() => { window.__noNav = 1; window.__gbMenu = true; window.__pl = { el: null, exit: 0, req: 0 };
    Object.defineProperty(document, 'pointerLockElement', { get: () => window.__pl.el, configurable: true }); document.exitPointerLock = () => { window.__pl.exit++; window.__pl.el = null; setTimeout(() => document.dispatchEvent(new Event('pointerlockchange')), 0); };
    Element.prototype.requestPointerLock = function () { window.__pl.req++; window.__pl.el = this; setTimeout(() => document.dispatchEvent(new Event('pointerlockchange')), 0); }; });
  await p.goto(url); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs && eggs.eggs && eggs.eggs.checkoutRun && eggs.drone, null, { timeout: 150000 });
  await p.evaluate(() => { const s = document.getElementById('start'); if (s) s.style.display = 'none'; }); await p.waitForTimeout(1500);
  const put = () => p.evaluate(() => { const D = eggs.drone, c = game.camera, T = game.THREE; const f = new T.Vector3(); c.getWorldDirection(f); D.root.position.set(c.position.x + f.x * 2.2, c.position.y + f.y * 2.2, c.position.z + f.z * 2.2); window.__hv = D.root.position.y; if (!window.__hi) window.__hi = setInterval(() => { if (!window.__rideOn && !(window.__ride && window.__ride.active)) eggs.drone.root.position.y = window.__hv; }, 8); /* #323: the guide bot walks on the floor now; hold it at the aim height for the menu test */  D.root.visible = true; D.root.updateMatrixWorld(true); });
  const st = () => p.evaluate(() => { const g = document.getElementById('gbMenu'); return { menu: !!g && getComputedStyle(g).display !== 'none', ...window.__pl, locked: !!window.__pl.el, freed: eggs.eggs.checkoutRun.state.freed, running: eggs.eggs.checkoutRun.running }; });
  if (dev === 'desktop') {
    await p.evaluate(() => { window.__pl.el = document.querySelector('canvas'); }); let s;
    for (let k = 0; k < 8; k++) { await put(); await p.waitForTimeout(400); s = await st(); if (s.menu) break; }
    ok('menu shown with the crosshair on the bot (locked)', s.menu && s.locked, JSON.stringify(s));
    await p.evaluate(() => window.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true, cancelable: true }))); await p.waitForTimeout(300); s = await st();
    ok('click on the bot releases pointer lock and does not start the run', s.exit === 1 && !s.locked && !s.running && s.freed && s.menu, JSON.stringify(s));
    const click = await p.evaluate(() => { const g = document.getElementById('gbGuide'), r = g.getBoundingClientRect(); return { w: r.width, h: r.height, vis: getComputedStyle(g).pointerEvents !== 'none' }; });
    ok('menu buttons are present and clickable while the mouse is free', click.w > 100 && click.h >= 40 && click.vis, JSON.stringify(click));
    await p.evaluate(() => { eggs.eggs.checkoutRun.state.show = 0.2; }); /* the menu's 6 s timer, fast-forwarded (swiftshader runs ~3 fps) */
    let relocked = false; for (let k = 0; k < 70 && !relocked; k++) { await p.waitForTimeout(500); s = await st(); relocked = s.locked; }
    ok('pointer relocked once the menu closes', relocked && s.req >= 1 && !s.freed, JSON.stringify(s));
    // Ask for guidance while freed: guide opens, no relock until the guide closes
    await p.evaluate(() => { window.__pl.el = document.querySelector('canvas'); window.__pl.req = 0; window.__pl.exit = 0; });
    for (let k = 0; k < 8; k++) { await put(); await p.waitForTimeout(400); s = await st(); if (s.menu) break; }
    await p.evaluate(() => window.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true, cancelable: true }))); await p.waitForTimeout(300);
    await p.evaluate(() => { window.__ride = undefined; document.getElementById('gbGuide').click(); }); await p.waitForTimeout(1500); s = await st(); /* ride disabled here: this checks the text guide path */
    const open = await p.evaluate(() => window.__eggGuide === 1); await p.waitForTimeout(8000); s = await st();
    ok('guide open: mouse stays free', open && !s.locked, JSON.stringify(s));
    await p.evaluate(() => eggs.eggs.guide.close()); await p.waitForTimeout(2500); s = await st();
    ok('guide closed: pointer relocked', s.locked, JSON.stringify(s));
  } else {
    await p.waitForTimeout(500); for (let k = 0; k < 3; k++) { await put(); await p.waitForTimeout(300); const sc = await p.evaluate(() => { const c = game.camera, v = eggs.drone.root.position.clone().project(c); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight }; }); await p.touchscreen.tap(sc.x, sc.y); await p.waitForTimeout(800); if ((await st()).menu) break; }
    const s = await st(); ok('phone: tap shows the menu, pointer lock never touched', s.menu && s.exit === 0 && s.req === 0, JSON.stringify(s));
  }
  await ctx.close();
}
console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); await b.close(); process.exit(fails.length ? 1 : 0);
