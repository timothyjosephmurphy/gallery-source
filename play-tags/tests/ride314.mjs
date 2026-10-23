// #314 ride: 'Ask for guidance' -> the ostrich carries the rider once round the ring of galleries, then the courtyard finale (captions only), Get off. Desktop + 390x844.
import { chromium } from 'playwright-core'; import fs from 'node:fs';
const url = process.argv[2] || 'http://localhost:4255/play/?tour=0', only = process.argv[3]; const D = '/workspace/shots/tour2/'; fs.mkdirSync(D, { recursive: true });
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const fails = []; const ok = (n, c, x = '') => { console.log((c ? 'PASS' : 'FAIL') + ' · ' + n + ' · ' + x); if (!c) fails.push(n); };
for (const dev of ['desktop', 'phone']) { if (only && only !== dev) continue;
  const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } };
  const ctx = await b.newContext(o), p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await p.addInitScript(() => { window.__noNav = 1; }); await p.goto(url);
  await p.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs && eggs.drone && window.__ride && window.__ostrichBot && window.__ostrichBot.ready, null, { timeout: 180000 });
  await p.evaluate(() => { const s = document.getElementById('start'); if (s) s.style.display = 'none'; window.__rideRate = 6; }); await p.waitForTimeout(1500);
  const ob = await p.evaluate(() => ({ ...window.__ostrichBot, api: undefined }));
  ok('ostrich model loaded (' + (dev === 'phone' ? 'LOD1' : 'LOD0') + ')', ob.ready && ob.clips.length === 9 && ob.tris > 1500 && (dev === 'phone' ? ob.tris < 2600 : ob.tris < 8500), JSON.stringify({ tris: ob.tris, clips: ob.clips.join(',') }));
  ok('walking ostrich egg removed', await p.evaluate(() => !eggs.eggs.ostrich && !game.scene.getObjectByName('egg-ostrich')));
  const c0y = await p.evaluate(() => game.camera.position.y);
  // 'Ask for guidance' from the guide bot menu starts the ride
  await p.evaluate(() => { const D = eggs.drone, c = game.camera, T = game.THREE, f = new T.Vector3(); c.getWorldDirection(f); f.y = 0; f.normalize(); D.root.position.set(c.position.x + f.x * 2.2, 1.5, c.position.z + f.z * 2.2); window.__hv = D.root.position.y; if (!window.__hi) window.__hi = setInterval(() => { if (!window.__rideOn && !(window.__ride && window.__ride.active)) eggs.drone.root.position.y = window.__hv; }, 8); /* #323: the guide bot walks on the floor now; hold it at the aim height for the menu test */  D.root.visible = true; });
  let menu = false; for (let k = 0; k < 6 && !menu; k++) { const sc = await p.evaluate(() => { const D = eggs.drone, c = game.camera, T = game.THREE, f = new T.Vector3(); c.getWorldDirection(f); f.y = 0; f.normalize(); D.root.position.set(c.position.x + f.x * 2.2, 1.5, c.position.z + f.z * 2.2); window.__hv = D.root.position.y; if (!window.__hi) window.__hi = setInterval(() => { if (!window.__rideOn && !(window.__ride && window.__ride.active)) eggs.drone.root.position.y = window.__hv; }, 8); /* #323: the guide bot walks on the floor now; hold it at the aim height for the menu test */  const v = D.root.position.clone().project(c); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight }; });
    if (dev === 'phone') await p.touchscreen.tap(sc.x, sc.y); else { await p.mouse.move(sc.x - 40, sc.y - 40); await p.mouse.move(sc.x, sc.y, { steps: 4 }); } await p.waitForTimeout(900); menu = await p.evaluate(() => { const g = document.getElementById('gbMenu'); return !!g && getComputedStyle(g).display !== 'none'; }); }
  ok('guide menu shows', menu);
  await p.evaluate(() => document.getElementById('gbGuide').click()); await p.waitForTimeout(1200);
  let s = await p.evaluate(() => ({ active: __ride.active, off: getComputedStyle(document.getElementById('rideOff')).display, legs: __ride.legs().length, errors: __ride.state.errors, route: __ride.route().length, froze: game.freeze }));
  ok("'Ask for guidance' starts the ride, Get off button visible", s.active && s.off !== 'none' && s.legs > 12 && s.route === 12 && s.froze, JSON.stringify(s));
  const shot = async n => p.screenshot({ path: D + `ride-${dev}-${n}.png` });
  const seen = { rooms: new Set(), paints: 0 }; let phase = '', t0 = Date.now(), shots = {}, maxY = 0, minY = 9, bad = [];
  while (Date.now() - t0 < (dev === 'phone' ? 900000 : 900000)) { await p.waitForTimeout(700);
    const q = await p.evaluate(() => { const S = __ride.state, c = game.camera, D = eggs.drone; const L = __ride.legs(); return { ph: S.phase, stops: S.stops, cy: c.position.y, ry: D.root.position.y, log: S.log.length, cap: document.getElementById('rideCap').textContent, room: (game.tags.world.roomAt(c.position.x, c.position.z) || {}).id, fin: S.finale, hi: document.querySelectorAll('.rideHi').length, clip: window.__ostrichBot.api.state.cur }; });
    if (q.room) seen.rooms.add(q.room); maxY = Math.max(maxY, q.cy); if (q.cy < minY) { minY = q.cy; var minAt = `${q.ph}/${q.clip}/stops${q.stops}`; }
    if (q.ph === 'ride' && !shots.mount) { shots.mount = 1; await shot('seat'); } if (q.ph === 'hold' && !shots.hold) { shots.hold = 1; await shot('paint-stop'); }
    if (q.ph === 'finale' && q.fin >= 2 && !shots.gate) { shots.gate = 1; await shot('finale-gate'); } if (q.ph === 'finale' && q.fin >= 3 && q.hi && !shots.scan) { shots.scan = 1; await shot('finale-scanner'); }
    if (q.ph === 'finale' && q.fin >= 6) { s = q; break; } phase = q.ph; }
  await p.waitForTimeout(800); await shot('finale-getoff');
  const st = await p.evaluate(() => ({ stops: __ride.state.stops, log: __ride.state.log, rooms: __ride.state.rooms, errors: __ride.state.errors, offBig: document.getElementById('rideOff').classList.contains('big'), active: __ride.active }));
  ok('every ring room visited, ~2 paintings each', st.rooms.length === 12 && st.rooms.every(r => r.got >= 1) && st.stops >= 20, JSON.stringify({ stops: st.stops, rooms: st.rooms.map(r => r.got).join(''), errors: st.errors }));
  ok('rooms entered during the ride (ring rooms + courtyard)', [...seen.rooms].filter(r => /^room-/.test(r)).length >= 12, [...seen.rooms].join(','));
  const fin = st.log.slice(-6); ok('finale: portals, Buy Scanner, other HUD tools, ask for help, then Get off offered', fin.length === 6 && /checkout (portals|fountain)/.test(fin[1]) && /Buy Scanner/.test(fin[2]) && /other fun tools in the HUD/.test(fin[3]) && /ask the guide bot for help at any time/.test(fin[4]) && /Get off/.test(fin[5]) && st.offBig, fin.map(x => x.slice(0, 40)).join(' | '));
  ok('camera rides at the saddle height, never underground', minY > 1.2 && maxY < 3.4, `cam y ${minY.toFixed(2)}..${maxY.toFixed(2)} (walking eye ${c0y.toFixed(2)}) min at ${typeof minAt !== 'undefined' ? minAt : '?'}`);
  await p.evaluate(() => document.getElementById('rideOff').click()); await p.waitForTimeout(800);
  const e = await p.evaluate(() => ({ active: __ride.active, froze: game.freeze, cy: game.camera.position.y, cap: document.getElementById('rideCap').style.display, off: getComputedStyle(document.getElementById('rideOff')).display, mode: eggs.drone.mode, nave: window.__ostrichBot.api.nodes.Neck.visible, hi: document.querySelectorAll('.rideHi').length }));
  ok('Get off: control back, eye height restored, bot is the guide again', !e.active && !e.froze && Math.abs(e.cy - c0y) < 0.05 && e.off === 'none' && e.cap === 'none' && e.nave && !e.hi && e.mode !== 'tow', JSON.stringify(e));
  ok('no page errors', errs.length === 0, errs.join(' | ')); await ctx.close(); }
console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); await b.close(); process.exit(fails.length ? 1 : 0);
