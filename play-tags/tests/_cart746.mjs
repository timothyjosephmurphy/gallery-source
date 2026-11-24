// #746 probe: scan-equivalent takePainting -> time to cart appearance, cart/bot coherence while pushing, ostrich attached to the drone (thrusters) during pull-off
import { chromium } from 'playwright-core';
const url = process.argv[2] || 'http://localhost:4338/play/?tour=0'; const phone = process.argv[3] === 'phone';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext(phone ? { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 800 } })).newPage(); await p.addInitScript(() => { window.__noNav = 1; });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(url); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs && eggs.drone && window.__ostrichBot && __ostrichBot.ready, null, { timeout: 180000 }); await p.waitForTimeout(2500);
const r = await p.evaluate(async () => { const dr = eggs.drone, D = dr.debug.D, root = dr.group, ob = __ostrichBot.api, cam = game.camera;
  const ps = game.paintings.filter(q => q.state === 'wall' && q.w < 1.3 && q.h < 1.3); const q = ps[5]; const d = q.data;
  cam.position.set(d.x + d.ix * 3, 1.6, d.z + d.iz * 3); cam.lookAt(d.x, d.y, d.z);
  let G = 0; const u0 = dr.update; dr.update = (dt, tm) => { G += dt; return u0(dt, tm); }; const t0 = performance.now(); const log = []; let lastK = ''; const trace = []; const world_ok = () => { const ry = root.rotation.y; const x = root.position.x + Math.sin(ry) * 0.81, z = root.position.z + Math.cos(ry) * 0.81; return eggs.world.walkable(x, z) ? 'W' : 'X'; }; let maxLift = 0; let maxOffAt = ''; let tCart = null, tPull = null, maxOff = 0, maxYaw = 0, maxDetach = 0, pushN = 0, hoverN = 0, maxGap = 0; const T = game.THREE, w = new T.Vector3();
  eggs.takePainting(q, () => {});
  while (G < 60 && performance.now() - t0 < 280000) { await new Promise(r => setTimeout(r, 100)); const s = G;
    { const kk = D.mode + ':' + dr.debug.phase; if (kk !== lastK) { lastK = kk; log.push(kk + '@' + s.toFixed(1)); } }
    if (D.cart && tCart == null) { tCart = s; const P = D.cart.position; let zz = P.z; Object.defineProperty(P, 'z', { get: () => zz, set: v => { if (Math.abs(v - zz) > 0.5 && !window.__jumpStack) window.__jumpStack = new Error('jump ' + zz + '->' + v).stack; zz = v; } }); }
    if (D.cart && (D.mode === 'cart' || D.pushing) && dr.debug.phase !== 5) { pushN++; const ry = root.rotation.y, f = new T.Vector3(Math.sin(ry), 0, Math.cos(ry)); const want = new T.Vector3(root.position.x, 0, root.position.z).addScaledVector(f, 0.81);
      const o = want.clone().setY(0).distanceTo(new T.Vector3(D.cart.position.x, 0, D.cart.position.z)); if (o > maxOff) { maxOffAt = D.mode + ':' + dr.debug.phase + '@' + s.toFixed(1); } maxOff = Math.max(maxOff, want.distanceTo(new T.Vector3(D.cart.position.x, 0, D.cart.position.z))); let dy = D.cart.rotation.y - ry; dy = Math.abs(Math.atan2(Math.sin(dy), Math.cos(dy))); maxYaw = Math.max(maxYaw, dy); }
    if (D.hover && root.position.y > 0.2) { hoverN++; maxLift = Math.max(maxLift, root.position.y); if (tPull == null) tPull = s; ob.g.getWorldPosition(w); /* holder origin rides with root: feet offset vs drone */ const rel = root.position.y - (w.y - ob.g.position.y * 0) ; maxDetach = Math.max(maxDetach, Math.abs((root.position.y - w.y) - (D.__b746 ??= root.position.y - w.y))); }
    if (s < 0.6) trace.push([s.toFixed(2), D.mode + ':' + dr.debug.phase, root.position.x.toFixed(2), root.position.z.toFixed(2), (root.rotation.y*57.3).toFixed(0), D.cart ? D.cart.position.x.toFixed(2) : '-', D.cart ? D.cart.position.z.toFixed(2) : '-', D.cart ? D.cart.id : '-', D.cartLastOk ? D.cartLastOk.z.toFixed(2) : '-', world_ok()].join(' '));
    if (D.mode === 'cart' && dr.debug.items > 0 && tPull != null) break; }
  return { tCart, tPull, end: +G.toFixed(1), wall: (performance.now() - t0) / 1000, maxOffAt, mode: D.mode, items: dr.debug.items, pushN, maxOff: +maxOff.toFixed(3), maxYawDeg: +(maxYaw * 57.3).toFixed(1), hoverN, maxDetach: +maxDetach.toFixed(3), maxLift: +maxLift.toFixed(2), log: log.join(' '), stack: window.__jumpStack || null }; });
const ok = r.tCart != null && r.tCart < 1.5 && r.maxOff < 0.25 && r.maxYawDeg < 8 && r.hoverN > 0 && r.maxDetach < 0.05 && r.maxLift > 0.4 && r.items > 0;
console.log(JSON.stringify(r)); console.log(ok ? 'PASS cart746' : 'FAIL cart746', 'errors', errs.length, errs.slice(0, 3)); await b.close();
