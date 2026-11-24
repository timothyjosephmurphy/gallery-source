import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(process.argv[2] || 'http://localhost:4252/play/'); await p.waitForFunction(() => window.eggs && window.eggs.eggs && window.__checkoutRun !== undefined || (window.eggs && window.eggs.eggs && window.eggs.eggs.checkoutRun), null, { timeout: 90000 }).catch(() => {});
await p.waitForTimeout(4000);
const info = await p.evaluate(() => { const e = window.eggs.eggs, cr = e.checkoutRun, dr = e.drone; return { keys: Object.keys(e).slice(0, 40), cr: !!cr, signs: !!(cr && cr.signs && cr.signs.g), menu: !!window.__gbMenu, ride: !!(window.__ride && window.__ride.ready), lead: typeof (dr && dr.cancelLead) }; });
console.log(JSON.stringify(info));
const r = await p.evaluate(async () => { const e = window.eggs.eggs, cr = e.checkoutRun, dr = e.drone, c = game.camera; const out = {};
  // put the bot 2.5 m in front of the camera, raise signs
  const f = new (c.position.constructor)(); c.getWorldDirection(f); f.y = 0; f.normalize(); dr.root.position.set(c.position.x + f.x * 2.5, dr.root.position.y, c.position.z + f.z * 2.5);
  cr.state.show = 5; for (let i = 0; i < 20; i++) { cr.update(0.05); }
  const SG = cr.signs; out.vis = SG.g && SG.g.visible; out.k = SG.k;
  const proj = m => { const v = m.getWorldPosition(new (c.position.constructor)()); v.project(c); return [v.x, v.y]; }; out.ck = proj(SG.ck); out.ask = proj(SG.ask);
  // flip: ostrich holder world y stays near floor
  const h = dr.root.getObjectByName('ostrichBot'); window.__dbgD = 1; dr.flip(); const ys = []; for (let i = 0; i < 6; i++) { await new Promise(r => setTimeout(r, 200)); const v = h.getWorldPosition(new (c.position.constructor)()); ys.push(+v.y.toFixed(2) + '/' + (+dr.root.position.y.toFixed(2)) + '/' + (+dr.rig.rotation.z.toFixed(2))); } out.flip = ys;
  window.__cartOpened = 0; const oc = window.__goCheckout; 
  // aim at guidance sign via mouse (unlocked)
  const [ax, ay] = out.ask; const ev = (t, x, y) => window.dispatchEvent(new MouseEvent(t, { clientX: (x + 1) / 2 * innerWidth, clientY: (1 - y) / 2 * innerHeight, button: 0, bubbles: true, cancelable: true }));
  ev('mousedown', ax, ay); out.afterAsk = { picks: cr.state.picks, last: cr.state.lastPick, asks: cr.state.asks, run: cr.running, rideActive: !!(window.__ride && window.__ride.active), cartPanel: !!document.querySelector('#cart.on, .cart-open') };
  if (window.__ride && window.__ride.active && window.__ride.stop) window.__ride.stop();
  await new Promise(r => setTimeout(r, 500));
  dr.root.position.set(c.position.x + f.x * 2.5, dr.root.position.y, c.position.z + f.z * 2.5); cr.state.show = 5; for (let i = 0; i < 20; i++) cr.update(0.05);
  const ck0 = proj(SG.ck); ev('mousedown', ck0[0], ck0[1]); out.afterCk = { last: cr.state.lastPick, run: cr.running }; cr.stop();
  return out; });
console.log(JSON.stringify(r)); await p.screenshot({ path: '/tmp/shot796.png' }); console.log('errs', errs.slice(0, 3)); await b.close();
