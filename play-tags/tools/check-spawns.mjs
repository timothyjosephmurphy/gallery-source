// node tools/check-spawns.mjs <base>
import { chromium } from 'playwright-core';
const base = process.argv[2];
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const cases = [
  { path: '/play/', pos: [0.5, 1.6, -28.2], dir: [-0.72, 0.7], room: 'courtyard-start' },
  { path: '/play/kinoteka', pos: [29.84, 1.6, 17.23], dir: [0.87, 0.5], room: 'courtyard-paul', ks: true },
  { path: '/play/kinoteka/', pos: [29.84, 1.6, 17.23], dir: [0.87, 0.5], room: 'courtyard-paul', ks: true },
  { path: '/play/?room=kinoteka-steps', pos: [29.84, 1.6, 17.23], dir: [0.87, 0.5], room: 'courtyard-paul', ks: true },
  { path: '/play/?goto=kinoteka-steps', pos: [29.84, 1.6, 17.23], dir: [0.87, 0.5], room: 'courtyard-paul', ks: true },
  { path: '/play/?room=kinoteka', pos: [29.84, 1.6, 17.23], dir: [0.87, 0.5], room: 'courtyard-paul', ks: true },
  { path: '/play/?room=neural-dance', pos: [37.43, 2.8, 31.48], dir: [-0.44, 0.76], room: 'kinoteka' },
  { path: '/play/?room=kinoteka-annex-door', pos: [43.42, 2.8, 27.61], dir: [-0.49, 0.85], room: 'kinoteka' },
];
const fail = [];
for (const c of cases) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage();
  const errs = [], bad = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  p.on('console', m => { if (m.type() === 'error' && !/tjm-play-layouts|WebSocket|\/play\/books\/|Failed to load resource|net::ERR_/.test(m.text())) errs.push(m.text().slice(0, 160)); });
  p.on('response', r => { if (r.status() >= 400 && !/\/play\/books\//.test(r.url())) bad.push(r.status() + ' ' + r.url()); });
  p.on('requestfailed', r => { if (!/tjm-play-layouts|\/play\/books\//.test(r.url())) bad.push('FAILED ' + r.url()); });
  const resp = await p.goto(base + c.path, { waitUntil: 'load', timeout: 180000 });
  const code = resp.status();
  const href = await p.evaluate(() => location.href);
  await p.waitForFunction(() => window.game && game.tags && game.tags.ready && window.__annex868, null, { timeout: 180000 });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { window.__playFallback = () => {}; game.hideStart && game.hideStart(); });
  await p.mouse.click(640, 360);
  await p.waitForTimeout(2500);
  const st = await p.evaluate(() => {
    const c = game.camera, d = new game.THREE.Vector3(); c.getWorldDirection(d);
    const r = game.roomAt && game.roomAt(c.position.x, c.position.z);
    return { pos: [c.position.x, c.position.y, c.position.z].map(v => +v.toFixed(2)), dir: [d.x, d.z].map(v => +v.toFixed(2)), room: r && r.id, ks: window.__kinoSteps899 || null, annex: !!(window.__annex868 && window.__annex868.built), href: location.href };
  });
  const near = (a, b, e = 0.06) => Math.hypot(...a.map((v, i) => v - b[i])) <= e;
  const okPos = near(st.pos, c.pos) && near(st.dir, c.dir, 0.08) && st.room === c.room;
  const pathOk = new URL(href).pathname + new URL(href).search === c.path || href.endsWith(c.path);
  const row = { path: c.path, code, okPos, pathOk, href: st.href, ...st, errs, bad };
  if (code !== 200 || !okPos || !pathOk || errs.length || st.annex !== true || (c.ks && !st.ks)) fail.push(row);
  console.log(JSON.stringify(row));
  await ctx.close();
}
await browser.close();
if (fail.length) { console.error('FAIL', fail.length); process.exit(1); }
console.log('ALL OK');
