// #308: guide bot menu (hover on desktop / tap on phone) with 'Take me to checkout' + 'Ask for guidance'; the checkout run must ARRIVE and open checkout
// (desktop + phone, empty + full cart, from the start and from far away, and via the guide's own 'checkout' answer).
import { chromium } from 'playwright-core';
const [url = 'http://localhost:4252/play/?tour=0', which = 'all'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const out = []; let fail = 0;
for (const dev of ['desktop', 'phone']) for (const full of [false, true]) for (const spot of ['start', 'far']) for (const how of ['menu', 'guide']) {
  if (how === 'guide' && (spot === 'far')) continue;
  if (process.env.ONLY && process.env.ONLY !== `${dev}:${full}:${spot}:${how}`) continue;
  const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } };
  const ctx = await b.newContext(o), p = await ctx.newPage(); await p.addInitScript((full) => { window.__noNav = 1; if (full) sessionStorage.setItem('tjmPlayState', JSON.stringify({ pos: [2.6, 1.6, 1.9], quat: [0, 0, 0, 1], cart: ['archived-painting-2', 'archived-painting-1', 'painting-portrait-with-cheese'] })); }, full);
  await p.goto(url + (full ? '&resume=1' : '')); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs && eggs.eggs && eggs.eggs.checkoutRun && eggs.drone, null, { timeout: 150000 });
  await p.evaluate(() => { const s = document.getElementById('start'); if (s) s.style.display = 'none'; }); await p.waitForTimeout(1500);
  if (spot === 'far') await p.evaluate(() => { const fr = eggs.world.randomFree(0.3, (x, z) => Math.hypot(x, z) > 20); game.camera.position.x = fr.x; game.camera.position.z = fr.z; });
  const r = { dev, full, spot, how };
  if (how === 'menu') {
    // put the bot where it can be seen, hover (desktop) or tap (phone) it
    const bp = await p.evaluate(() => { const D = eggs.drone, c = game.camera, T = game.THREE; const f = new T.Vector3(); c.getWorldDirection(f); f.y = 0; f.normalize(); D.root.position.set(c.position.x + f.x * 2.2, 1.5, c.position.z + f.z * 2.2); D.root.visible = true; return null; });
    await p.waitForTimeout(600);
    let scr = null; const poke = async () => { for (let k = 0; k < 5; k++) { scr = await p.evaluate(() => { const D = eggs.drone, c = game.camera, T = game.THREE; const f = new T.Vector3(); c.getWorldDirection(f); f.y = 0; f.normalize(); D.root.position.set(c.position.x + f.x * 2.2, 1.5, c.position.z + f.z * 2.2); c.updateMatrixWorld(); const v = D.root.position.clone(); v.y += 0.05; v.project(c); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight }; });
        if (dev === 'phone') await p.touchscreen.tap(scr.x, scr.y); else { await p.mouse.move(scr.x - 40, scr.y - 40); await p.mouse.move(scr.x, scr.y, { steps: 4 }); }
        await p.waitForTimeout(800); if (await p.evaluate(() => { const g = document.getElementById('gbMenu'); return !!g && getComputedStyle(g).display !== 'none'; })) return k + 1; } return 0; };
    r.tries = await poke();
    const m = await p.evaluate(() => { const g = document.getElementById('gbMenu'); if (!g) return { menu: false }; const bs = [...g.querySelectorAll('button')].map(b => ({ t: b.textContent.trim(), h: Math.round(b.getBoundingClientRect().height), vis: b.getBoundingClientRect().width > 0 })); const rc = g.getBoundingClientRect(); return { menu: getComputedStyle(g).display !== 'none', bs, inView: rc.left >= 0 && rc.right <= innerWidth && rc.top >= 0 && rc.bottom <= innerHeight }; });
    Object.assign(r, m); const okMenu = m.menu && m.bs && m.bs.length === 2 && /checkout/i.test(m.bs[0].t) && /guidance/i.test(m.bs[1].t) && m.inView && m.bs.every(x => x.h >= 40);
    if (!okMenu) { r.err = 'menu not shown/usable'; }
    if (spot === 'start') await p.screenshot({ path: `/workspace/shots/tour2/gbmenu-${dev}-${full ? 'full' : 'empty'}.png` });
    if (spot === 'start' && !full) { // 'Ask for guidance' opens the guide
      await p.evaluate(() => document.getElementById('gbGuide') && document.getElementById('gbGuide').click()); for (let k = 0; k < 8 && !r.guideOpen; k++) { await p.waitForTimeout(400); r.guideOpen = await p.evaluate(() => { if (window.__ride && window.__ride.active) return true; /* #314: guidance is a ride */ const g = document.getElementById('eggGuide'); return !!g && getComputedStyle(g).display !== 'none'; }); }
      if (!r.guideOpen) r.err = (r.err || '') + ' guidance did not open';
      await p.evaluate(() => { if (window.__ride && window.__ride.active) window.__ride.getOff(); eggs.eggs.guide.close(); }); await p.waitForTimeout(300);
      await poke(); }
    const clicked = await p.evaluate(() => { const g = document.getElementById('crGo'); if (!g || g.getBoundingClientRect().width === 0) return false; g.click(); return true; });
    if (!clicked && !r.err) r.err = 'checkout button not clickable'; if (!clicked) await p.evaluate(() => eggs.eggs.checkoutRun.start());
  } else await p.evaluate(() => eggs.eggs.guide.go({ kind: 'checkout', label: 'Checkout' }));
  const t0 = Date.now(); while (Date.now() - t0 < 45000 && !(await p.evaluate(() => window.__checkoutGo))) await p.waitForTimeout(500);
  const e = await p.evaluate(() => ({ go: window.__checkoutGo || null, pos: [+game.camera.position.x.toFixed(2), +game.camera.position.z.toFixed(2)], cart: window.__museumCart.count(), stored: (JSON.parse(localStorage.getItem('va-cart-v1') || '[]')).length, running: eggs.eggs.checkoutRun.running }));
  Object.assign(r, e, { ms: Date.now() - t0 }); r.ok = !!e.go && !r.err && (!full || /items=archived-painting-2/.test(e.go)) && (!full || e.stored >= 3);
  if (!r.ok) fail++; out.push(r); await ctx.close();
}
console.log(out.map(r => JSON.stringify(r)).join('\n')); console.log(fail ? 'FAIL ' + fail : 'PASS'); await b.close(); process.exit(fail ? 1 : 0);
