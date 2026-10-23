// #150: phone controls don't overlap (portrait + landscape, common sizes), zoom is blocked in the gallery,
// start screen is short, toolbar order is 1 Buy Scanner, 2 Soup. usage: node phoneui.mjs URL
import { chromium } from '/workspace/play-bilbao/node_modules/playwright-core/index.mjs';
const URL_ = process.argv[2]; const SIZES = [[375, 667], [390, 844], [430, 932], [360, 780], [667, 375], [844, 390], [932, 430], [780, 360]];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const out = []; let fail = 0;
for (const [w, h] of SIZES) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
  await p.goto(URL_); await p.waitForFunction(() => window.game && game.nPaintings > 0, null, { timeout: 120000 });
  const start = await p.evaluate(() => { const s = document.getElementById('start'); return s ? s.innerText.replace(/\s+/g, ' ').trim() : ''; });
  await p.evaluate(() => { const s = document.getElementById('start'); if (s) s.click(); }); await p.waitForTimeout(1500); await p.evaluate(() => document.getElementById('cart')?.classList.add('open')); await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const sel = ['#tfire', '#tswap', '#tlaunch', '#trun', '#tburst', '#tmove', '#soundbtn', '#homebtn', '#cart', '#hud', '#tmute'];
    const R = sel.map(s => [s, document.querySelector(s)]).filter(([, e]) => e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && !e.hidden && e.getBoundingClientRect().width > 0).map(([s, e]) => [s, e.getBoundingClientRect()]);
    const ov = []; for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) { const a = R[i][1], c = R[j][1];
      const x = Math.min(a.right, c.right) - Math.max(a.left, c.left), y = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top); if (x > 1 && y > 1) ov.push(R[i][0] + '/' + R[j][0]); }
    const off = R.filter(([, a]) => a.left < -1 || a.top < -1 || a.right > innerWidth + 1 || a.bottom > innerHeight + 1).map(([s]) => s);
    const cut = [...document.querySelectorAll('#hud .wpn')].filter(e => e.scrollWidth > e.clientWidth + 1).length;
    const vp = document.querySelector('meta[name=viewport]')?.content || '';
    const ta = getComputedStyle(document.querySelector('canvas')).touchAction;
    const order = [...document.querySelectorAll('#hud .wpn')].map(e => e.textContent.trim().replace(/\s+/g, ' ')).slice(0, 3);
    return { ov, off, cut, zoomBlocked: /user-scalable=no/.test(vp) && /maximum-scale=1/.test(vp) && ta === 'none', order, weapon: window.game && game.weapon };
  });
  const bad = r.ov.length || r.off.length || r.cut || !r.zoomBlocked || /WASD|Shift|mouse/i.test(start); if (bad) fail++;
  out.push({ size: w + 'x' + h, ...r, startText: start.slice(0, 160), ok: !bad }); await p.close();
}
console.log(JSON.stringify(out, null, 1)); console.log(fail ? `PHONEUI FAIL: ${fail}/${SIZES.length} sizes` : `PHONEUI PASS: ${SIZES.length} sizes`); await b.close(); process.exit(fail ? 1 : 0);
