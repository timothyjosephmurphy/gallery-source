// #765 probe: the courtyard cormorant mural is in game.paintings, the Buy Scanner reads it as not for sale, shows its print copy, and a click/tap on the print label adds the medium framed print
import { chromium } from 'playwright-core';
const url = process.argv[2] || 'http://localhost:4338/play/?tour=0'; const phone = process.argv[3] === 'phone', ID = 'cormorant-presiding-over-sunset-on-puget-sound';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext(phone ? { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 800 } })).newPage(); await p.addInitScript(() => { window.__noNav = 1; });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(url); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && window.__shopScan && game.paintings.some(q => q.data.id === 'cormorant-presiding-over-sunset-on-puget-sound'), null, { timeout: 180000 }).catch(() => {});
await p.evaluate(async () => { document.getElementById('start')?.click(); await new Promise(r => setTimeout(r, 700)); game.setWeapon(1); });
const r = await p.evaluate(async ID => { const q = game.paintings.find(x => x.data.id === ID); if (!q) return { inPaintings: false };
  const d = q.data, cam = game.camera; const put = () => { cam.position.set(d.x + d.ix * 3.2, 1.6, d.z + d.iz * 3.2); cam.lookAt(d.x, d.y, d.z); cam.updateMatrixWorld(); };
  for (let i = 0; i < 30; i++) { put(); await new Promise(r => setTimeout(r, 100)); }
  const S = __shopScan; window.__dbg = { obs: S.obstacles(q, false).map(o => o.map(x => +x.toFixed(2))), own: S.obstacles(q).length, near: game.paintings.filter(o => o !== q && o.group.position.distanceTo(q.group.position) < 5).map(o => o.data.id), skipped: S.state.skipped.slice(), built: S.state.built.has(q), pv: !!q.preview, gv: q.group.visible, ent: !!S.shopEntry(q.data.slug) }; const act = S.state.active === q, vis = !!(q.preview && q.preview.visible), beam = S.beamColor && S.beamColor();
  let label = null; if (q.preview) { const l = q.preview.children.find(m => m.userData.label); l.updateMatrixWorld(true); const v = l.getWorldPosition(new game.THREE.Vector3()).project(cam); label = [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; }
  return { dbg: window.__dbg, inPaintings: true, status: d.status, active: act, visible: vis, beam: beam && beam.toString(16), entry: q.preview && q.preview.userData.entry.id, label, grabbable: false }; }, ID);
let cart = null;
if (r.label) { await p.evaluate(() => { try { document.exitPointerLock(); } catch (e) {} }); if (phone) await p.touchscreen.tap(r.label[0], r.label[1]); else { await p.mouse.move(r.label[0], r.label[1]); await p.waitForTimeout(150); await p.mouse.click(r.label[0], r.label[1]); }
  await p.waitForTimeout(800); cart = await p.evaluate(() => (__shopScan.state.added || 0) + ' ' + (document.getElementById('cartlist')?.textContent || '')); }
const ok = r.inPaintings && r.status !== 'available' && r.visible && /medium-frame-black/.test(r.entry || '') && /Cormorant/.test(cart || '') && /Medium print/.test(cart || '');
console.log(JSON.stringify({ ...r, cart: (cart || '').slice(0, 200) })); console.log(ok ? 'PASS scan765' : 'FAIL scan765', 'errors', errs.length, errs.slice(0, 3)); await b.close();
