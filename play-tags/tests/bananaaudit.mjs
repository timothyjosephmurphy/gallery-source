// #282 banana cycle: elf eats it, peel + tape stay, drone tapes up a fresh one; no flicker, duplicates or floating.
import { chromium } from 'playwright-core';
const [url, dev = 'desktop'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } };
const p = await (await b.newContext(o)).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { window.__noNav = true; });
await p.goto(url); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs && eggs.eggs && eggs.eggs.banana && game.tags.report.eggPasses > 3, null, { timeout: 200000 });
await p.evaluate(() => { const B = eggs.eggs.banana, g = B.group, s = B.spot; const v = s.pos.clone().addScaledVector(s.n, 2.2); game.view(v.x, v.z, Math.atan2(-s.n.x, -s.n.z), 0);
  const geo = g.children.find(c => c.isMesh && c.geometry.attributes.position.count > 200).geometry, n0 = geo.attributes.position.count;
  window.__ban = { log: [], flips: 0, last: null, g0: g.position.clone(), anchor: s.pos.clone(), maxBananas: 0, tapes0: B.tapes, peelSeen: false, tapeAfterEat: null, n0 };
  const cnt = () => { let n = 0; game.scene.traverse(o => { if (o.isMesh && o.geometry && o.geometry.attributes.position && o.geometry.attributes.position.count === n0) { let vis = o.visible; for (let q = o.parent; q; q = q.parent) if (!q.visible) vis = false; if (vis) n++; } }); return n; };
  const sample = () => { const W = window.__ban, hb = B.hasBanana; if (W.last !== null && hb !== W.last) W.flips++; W.last = hb; W.maxBananas = Math.max(W.maxBananas, cnt()); if (B.peel.visible) W.peelSeen = true; if (B.mode === 'leave' && W.tapeAfterEat === null) W.tapeAfterEat = B.tapes;
    if (W.log[W.log.length - 1] !== B.mode) W.log.push(B.mode); W.moved = g.position.distanceTo(W.g0); W.off = Math.hypot(g.position.x - W.anchor.x, g.position.z - W.anchor.z); };
  const tick = () => { for (let i = 0; i < 12; i++) { eggs.advance(0.05); sample(); } setTimeout(tick, 60); }; sample(); B.eatNow(); tick(); }); // egg time runs ~10x via the eggs test hook
let r; for (let i = 0; i < 240; i++) { await p.waitForTimeout(1000); r = await p.evaluate(() => ({ ...window.__ban, mode: eggs.eggs.banana.mode, has: eggs.eggs.banana.hasBanana, tapes: eggs.eggs.banana.tapes, bananasNow: null })); if (r.log.includes('gone') && r.has || r.log.at(-1) === 'wait' && r.log.length > 2) break; }
r.movedList = await p.evaluate(() => game.tags.report.eggsMoved); const pass = r.log.includes('peel') && r.log.includes('eat') && r.has && r.peelSeen && r.flips === 2 && r.maxBananas <= 2 && r.moved < 0.001 && r.off < 0.001 && r.tapes >= r.tapes0 && !errs.length;
console.log(JSON.stringify({ dev, log: r.log, has: r.has, flips: r.flips, maxBananasVisible: r.maxBananas, peelSeen: r.peelSeen, tapes0: r.tapes0, tapesAfterEat: r.tapeAfterEat, tapesNow: r.tapes, moved: r.moved, offAnchor: r.off, errs, movedList: r.movedList, pass }));
console.log('BANANAAUDIT ' + dev + (pass ? ' PASS' : ' FAIL')); await b.close();
