import { chromium } from 'playwright-core'; import fs from 'node:fs';
const url = process.argv[2], dev = process.argv[3] || 'desktop', only = process.argv[4], D = '/workspace/shots/tour2/'; fs.mkdirSync(D, { recursive: true });
const SL = JSON.parse(fs.readFileSync(new URL('../src/outer-slots.json', import.meta.url))).slots;
const at = (k, d, ds = 0, ex = 0) => { const s = SL[k], px = s.mid[0] + s.t[0] * (s.s + ds) + s.n[0] * d, pz = s.mid[1] + s.t[1] * (s.s + ds) + s.n[1] * d; return [px, pz, s.mid[0] + s.t[0] * (s.s + ex), s.mid[1] + s.t[1] * (s.s + ex)]; };
const pair = (() => { const a = SL.timeline, b = SL.nostr; const m = (a.s + b.s) / 2; return [a.mid[0] + a.n[0] * 6.2 + a.t[0] * m, a.mid[1] + a.n[1] * 6.2 + a.t[1] * m, a.mid[0] + a.t[0] * m, a.mid[1] + a.t[1] * m]; })();
const views = [['c295-pair-timeline-nostr', pair], ['c295-wallmap', at('map', 5)], ['c295-testimonials', at('testi', 5.5)], ['c295-cormorant-group', at('cormorant', 5.2, 0, 0.6)], ['c295-timeline-close', at('timeline', 3.2, 0, 0)], ['c295-nostr-close', at('nostr', 3.2, 0, 0)],
  ['c295-center-sunburst', [0, 0, 12, 0], 0], ['c295-aerial', 'aerial']];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 720 } };
const pg = await (await b.newContext(o)).newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 160))); pg.on('console', m => { if (m.type() === 'error' && !/WebSocket|503/.test(m.text())) errs.push(m.text().slice(0, 160)); });
await pg.goto(url); await pg.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs, null, { timeout: 180000 }); await pg.evaluate(() => { window.__noNav = true; }); await pg.waitForTimeout(8000);
console.log(JSON.stringify(await pg.evaluate(() => ({ c295: window.__c295, c294: window.__c294 && { err: window.__c294.err, timeline: window.__c294.timeline && Object.keys(window.__c294.timeline) } }))).slice(0, 600));
for (const [name, v] of views) { if (only && !name.includes(only)) continue;
  if (v === 'aerial') await pg.evaluate(() => { game.hideStart && game.hideStart(); game.freeze = true; const c = game.camera; c.position.set(0, 70, 30); c.lookAt(0, 0, 0); });
  else await pg.evaluate(v => { game.freeze = false; game.hideStart && game.hideStart(); game.view(v[0], v[1], v[2], v[3]); if (v[4] != null) game.camera.rotateX(v[4]); }, v);
  await pg.waitForTimeout(5000); const f = D + name + (dev === 'phone' ? '-phone' : '') + '.png'; await pg.screenshot({ path: f }); console.log(f); }
console.log('errs', JSON.stringify(errs.slice(0, 5))); await b.close();
