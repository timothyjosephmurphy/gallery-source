// #155/#156/#158: carted painting carries only frame + picture + a white back; no IN CART labels; bot wanders near you by default.
import { chromium } from '/workspace/play-bilbao/node_modules/playwright-core/index.mjs';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(process.argv[2]); await p.waitForFunction(() => window.game && game.nPaintings > 0 && window.eggs, null, { timeout: 120000 });
const r = await p.evaluate(() => { const pp = game.paintings.find(q => q.state === 'wall' && q.data); eggs.purchase(pp); let n = 0; for (let i = 0; i < 1500; i++) { eggs.advance(0.1); n++; const s = []; game.scene.traverse(o => { if (o.name === 'egg-carried-painting') s.push(o); }); if (s.length && eggs.eggs.drone.debug.mode === 'cart') break; }
  const copies = []; game.scene.traverse(o => { if (o.name === 'egg-carried-painting') copies.push(o); });
  const c = copies[0], kids = c ? c.children.length : -1, white = c ? c.children.some(o => o.rotation.y === Math.PI && o.material && o.material.color && o.material.color.getHex() === 0xf2efe8) : false;
  let labels = 0; game.scene.traverse(o => { const m = o.material && o.material.map && o.material.map.image; if (m && m.__txt && /IN CART/.test(m.__txt)) labels++; });
  const modes = {}; for (let i = 0; i < 600; i++) { eggs.advance(0.1); const m = eggs.eggs.drone.debug.mode; modes[m] = (modes[m] || 0) + 1; }
  return { steps: n, copies: copies.length, kids, white, labels, modes }; });
const ok = r.copies >= 1 && r.kids === 3 && r.white && !errs.length; console.log(JSON.stringify({ ...r, errs }), ok ? 'CART PASS' : 'CART FAIL'); await b.close(); process.exit(ok ? 0 : 1);
