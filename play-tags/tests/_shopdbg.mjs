// #235 / #201 Buy Scanner shop audit. usage: node tests/shopaudit.mjs GALLERY_URL [desktop|phone] [shotPrefix]
// Checks: green + real price over a painting for sale, red 'Not for sale' over one that is not, labels clear of the work, its plaque,
// other works and the HUD; true-size framed print previews beside paintings with prints (real price, on real wall, clear of everything);
// scanning a preview adds that print to the cart and it reaches the site cart; silent when muted; no forbidden word; no errors.
// #270 (TJ): no print copies on the walls until the laser is on a painting with prints; then exactly that painting's copy
// (medium shop size, true size) with a 'Print  $price' label; it stays while the laser or the mouse / finger is on it, goes
// ~1.2 s after both leave; clicking (desktop) or tapping (phone) the label adds that medium print to the cart.
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
const SHOP = JSON.parse(readFileSync('/workspace/gallery-core/src/shop.json', 'utf8')).shop;
const [URL_, DEV = 'desktop', SHOT = ''] = process.argv.slice(2), phone = DEV === 'phone';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctxB = await b.newContext(phone ? { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 720 } });
const p = await ctxB.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/tjm-play-layouts|ERR_FAILED|status of 404|WebSocket|relay\./.test(m.text())) errs.push(m.text().slice(0, 200)); });
await p.addInitScript(() => { window.__noNav = true; window.__snd = { osc: 0, src: 0 }; const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
  const po = A.prototype.createOscillator, pb = A.prototype.createBufferSource;
  A.prototype.createOscillator = function () { const o = po.call(this), s = o.start.bind(o); o.start = (...a) => { __snd.osc++; return s(...a); }; return o; };
  A.prototype.createBufferSource = function () { const o = pb.call(this), s = o.start.bind(o); o.start = (...a) => { __snd.src++; return s(...a); }; return o; }; });
const res = []; const ok = (n, c, d = '') => res.push([c ? 'PASS' : 'FAIL', n, d]); const wait = ms => p.waitForTimeout(ms);
await p.goto(URL_); await p.waitForFunction(() => window.game && game.nPaintings > 0 && window.__shopScan, null, { timeout: 300000 });
await p.evaluate(async () => { try { localStorage.removeItem('va-cart-v1'); } catch (e) {} document.getElementById('start')?.click(); await new Promise(r => setTimeout(r, 700)); game.holo.setMuted(true); game.setWeapon(1); window.__s0 = { ...__snd }; });
await wait(600);
// build every preview and check each placement against everything around it
const P = await p.evaluate(() => { const S = __shopScan; S.buildAll(); const out = { n: S.state.previews.length, skipped: S.state.skipped.slice(), bad: [], sizes: [] };
  for (const q of S.state.previews) { const g = q.preview; q.preview = null; const obs = S.obstacles(q); q.preview = g; // everything around it, its own frame / lamp / plaque included
    const boxes = []; g.updateMatrixWorld(); const inv = new game.THREE.Matrix4().copy(q.group.matrixWorld).invert(), v = new game.THREE.Vector3();
    g.traverse(o => { if (!o.userData.box) return; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [a, b] of [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]]) { v.set(a, b, 0).applyMatrix4(o.matrixWorld).applyMatrix4(inv); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); } boxes.push([x0, y0, x1, y1]); });
    const own = [-q.w / 2, -q.h / 2 - 0.16, q.w / 2, q.h / 2 + 0.16];
    const clash = boxes.some(r => S.overlaps(r, obs));
    const wall = S.onWall(q, boxes[0][0], boxes[0][2], g.position.y); const fr = g.children[0], e = g.userData.entry;
    out.sizes.push([q.data.slug, +(fr.scale.x / 0.0254).toFixed(2), e.in[0], +(fr.scale.y / 0.0254).toFixed(2), e.in[1], e.a, e.id]);
    if (clash || !wall) out.bad.push([q.data.slug, clash ? 'overlap' : 'off-wall', clash ? JSON.stringify([boxes.map(b => b.map(x => +x.toFixed(2))), obs.filter(o => boxes.some(r => S.overlaps(r, [o]))).map(o => o.map(x => +x.toFixed(2)))]) : '']); }
  out.visibleAfterBuild = S.state.previews.filter(q => q.preview.visible).length;
  out.plaques = game.paintings.filter(q => q.state === 'wall' && q.plaque).map(q => { const v = new game.THREE.Vector3(); q.plaque.getWorldPosition(v); return +v.y.toFixed(2); });
  return out; });
const want = Object.entries(SHOP).filter(([, e]) => e.pr).map(([k]) => k);
ok('print previews built beside paintings with prints', P.n > 0, `${P.n} previews, ${P.skipped.length} without room on the wall`);
ok('every preview clear of other works, plaques and story boards, on real wall', !P.bad.length, JSON.stringify(P.bad.slice(0, 5)));
ok('no print copies hang on the walls on their own (all hidden until aimed at)', P.visibleAfterBuild === 0, P.visibleAfterBuild + ' visible');
ok('previews true size (frame = shop frame size)', P.sizes.every(s => Math.abs(s[1] - s[2]) < 0.05 && Math.abs(s[3] - s[4]) < 0.05), P.sizes.length + ' checked');
ok('preview price and variant from the shop data', P.sizes.every(s => SHOP[s[0]] && SHOP[s[0]].pr.a === s[5] && SHOP[s[0]].pr.id === s[6]));
// stand in front of a painting and aim at a point on it
const standOn = (slug, aimAt) => p.evaluate(([slug, aimAt]) => { const c = game.camera, T = game.THREE, q = game.paintings.find(x => x.data.slug === slug);
  const n = new T.Vector3(0, 0, 1).applyQuaternion(q.group.quaternion); n.y = 0; n.normalize();
  const tgt = aimAt === 'print' && q.preview ? q.preview.children[0].getWorldPosition(new T.Vector3()) : q.group.getWorldPosition(new T.Vector3());
  for (const d of [2.4, 2.0, 2.8, 1.7, 3.4, 1.4, 4, 1.1, 0.8]) { const pos = tgt.clone().addScaledVector(n, d); if (!game.walkable(pos.x, pos.z)) continue;
    pos.y = c.position.y; c.position.copy(pos); c.lookAt(tgt); c.updateMatrixWorld(true); return { slug, status: q.data.status }; }
  return null; }, [slug, aimAt]);
// stand in front of a painting (or its print preview) and wait until the scanner reports it; try the next candidate if something else is in the way
const stand = async (pred, aimAt = 'painting') => { const list = await p.evaluate(src => { const pred = eval(src); return game.paintings.filter(q => q.state === 'wall' && pred(q)).map(q => q.data.slug); }, pred.toString());
  for (const slug of list.slice(0, 8)) { if (aimAt === 'print') { if (!await standOn(slug, 'painting')) continue; if (!await p.waitForFunction(slug => __shopScan.state.active && __shopScan.state.active.data.slug === slug, slug, { timeout: 12000 }).then(() => 1, () => 0)) continue; }
    const s = await standOn(slug, aimAt); if (!s) continue;
    const got = await p.waitForFunction(([slug, aimAt]) => { const a = __shopScan.aim; return a && a.p.data.slug === slug && (aimAt === 'print') === (a.kind === 'print') && (aimAt === 'print' || !!__shopScan.state.label); }, [slug, aimAt], { timeout: 12000 }).then(() => true).catch(() => false);
    if (got) return s; }
  return null; };
const look = () => p.evaluate(() => { const S = __shopScan, a = S.aim, L = S.state.label, c = game.camera, T = game.THREE; const r = { kind: a && a.kind, slug: a && a.p.data.slug, beam: S.beamColor(), label: !!L };
  const scr = o => { o.updateMatrixWorld(); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [a, b] of [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]]) { const v = new T.Vector3(a, b, 0).applyMatrix4(o.matrixWorld).project(c); const x = (v.x + 1) / 2 * innerWidth, y = (1 - v.y) / 2 * innerHeight; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; };
  if (L) { r.lab = scr(L).map(Math.round); r.labText = L.material.map.image.toDataURL ? 1 : 0;
    const q = a.p, hit = (A, B) => A[0] < B[2] && A[2] > B[0] && A[1] < B[3] && A[3] > B[1];
    const lp = L.position, lr = [lp.x - L.scale.x / 2, lp.y - L.scale.y / 2, lp.x + L.scale.x / 2, lp.y + L.scale.y / 2]; // label rect in the wall plane
    q.priceBox = null; const obs = S.obstacles(q); q.priceBox = L; r.overWork = obs.filter(o => hit(lr, o)).map(o => o.map(x => +x.toFixed(2))).slice(0, 3);
    r.overWork = r.overWork.length ? r.overWork : false;
    const hud = [...document.querySelectorAll('body *')].filter(e => { if (e.tagName === 'CANVAS' || !e.offsetParent && getComputedStyle(e).position !== 'fixed') return false; const s = getComputedStyle(e); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false; const b = e.getBoundingClientRect(); return b.width > 4 && b.height > 4 && b.width < innerWidth * 0.9 && (s.position === 'fixed' || s.position === 'absolute') && e.textContent.trim(); }).map(e => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom, e.id || e.className]; });
    r.overHud = hud.filter(R => hit(r.lab, R)).map(R => R[4]).slice(0, 4); r.onScreen = r.lab[0] >= 0 && r.lab[1] >= 0 && r.lab[2] <= innerWidth && r.lab[3] <= innerHeight; }
  return r; });
// 1. for sale -> green, real price, clear of everything
const s1 = await stand(q => q.data.status === 'available' && __shopScan.shopEntry(q.data.slug) && __shopScan.shopEntry(q.data.slug).p && __shopScan.shopEntry(q.data.slug).pr); // a painting that has a print, so the Print-label checks have one
const L1 = await look();
ok('for sale: scanner green with the price', s1 && L1.kind === 'sale' && L1.beam === 0x40ff70 && L1.label, JSON.stringify({ s1, k: L1.kind }));
const price = s1 && SHOP[s1.slug].p; ok('price is the real checkout price', !!price, `${s1 && s1.slug} $${price}`);
ok('price label clear of the painting, its plaque, other works, previews', L1.label && !L1.overWork, JSON.stringify(L1.overWork));
ok('price label clear of the HUD and on screen', L1.label && !L1.overHud.length && L1.onScreen, JSON.stringify(L1.overHud));
if (SHOT) await p.screenshot({ path: SHOT + '-price.png' });
// #270: exactly this painting's print copy appears (if the shop sells a print of it), with a 'Print  $price' label
const A1 = await p.evaluate(() => { const S = __shopScan, a = S.aim, vis = S.state.previews.filter(q => q.preview.visible); const e = a && S.shopEntry(a.p.data.slug);
  return { hasPr: !!(e && e.pr), vis: vis.map(q => q.data.slug), active: S.state.active && S.state.active.data.slug, slug: a && a.p.data.slug }; });
ok('aimed painting: only its own print copy shows (none elsewhere)', A1.hasPr ? A1.vis.length === 1 && A1.vis[0] === A1.slug : A1.vis.length === 0, JSON.stringify(A1));
// 2. not for sale -> red 'Not for sale'
const s2 = await stand(q => q.data.status !== 'available'); const L2 = await look();
const anyNfs = await p.evaluate(() => game.paintings.some(q => q.data.status !== 'available'));
if (!anyNfs) { ok("not for sale: red with 'Not for sale'", true, 'n/a: every work here is for sale'); ok("'Not for sale' clear of works and HUD", true, 'n/a'); } else {
ok("not for sale: red with 'Not for sale'", s2 && L2.kind === 'nfs' && L2.beam === 0xff2010 && L2.label && await p.evaluate(() => __shopScan.state.kind === 'nfs'), JSON.stringify({ s2, k: L2.kind }));
ok("'Not for sale' clear of works and HUD", L2.label && !L2.overWork && !L2.overHud.length && L2.onScreen, JSON.stringify([L2.overWork, L2.overHud])); }
if (SHOT) await p.screenshot({ path: SHOT + '-nfs.png' });
// 3. scan a print preview -> that print in the cart -> reaches the site cart
const s3 = await stand(q => !!q.preview, 'print'); const L3 = await look();
ok('aiming at a print preview: scanner green', s3 && L3.kind === 'print' && L3.beam === 0x40ff70, JSON.stringify({ s3, k: L3.kind }));
if (SHOT) await p.screenshot({ path: SHOT + '-print.png' });
// #270 hover / tap on the label keeps the copy and adds the print; it disappears after laser and cursor leave
// laser off the painting but its copy still on screen: look past the painting's far edge (away from the copy)
const aside = () => p.evaluate(() => { const S = __shopScan, q = S.state.active, c = game.camera, T = game.THREE; if (!q) return; const sd = q.preview.position.x > 0 ? -1 : 1, v = new T.Vector3(sd * (q.w / 2 + 0.25), q.h / 2 + 0.35, 0); /* #292: gaps are tighter at 1.5x, so look past the top corner (bare wall), not into the next painting */ q.group.localToWorld(v); c.lookAt(v); c.updateMatrixWorld(true); });
const away = () => p.evaluate(() => { const c = game.camera; c.lookAt(c.position.x, 40, c.position.z + 0.01); c.updateMatrixWorld(true); });
const labelXY = () => p.evaluate(() => { const S = __shopScan, q = S.state.active; if (!q) return null; const tag = q.preview.children.find(o => o.userData.label), v = new game.THREE.Vector3(); tag.updateMatrixWorld(true); tag.getWorldPosition(v); v.project(game.camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight, tag.material.map.image.width]; });
const LX = await labelXY(); ok('print label shown with the copy', !!LX, JSON.stringify(LX));
const added0 = await p.evaluate(() => __shopScan.state.added || 0);
if (LX) { if (phone) { await p.evaluate(() => { try { document.exitPointerLock(); } catch (e) {} }); await p.touchscreen.tap(LX[0], LX[1]); }
  else { await p.evaluate(() => { try { document.exitPointerLock(); } catch (e) {} }); await aside(); await wait(200); const L2 = await labelXY(); if (L2) { LX[0] = L2[0]; LX[1] = L2[1]; } await p.mouse.move(LX[0], LX[1]); await wait(2000); }
  console.log('DBG', JSON.stringify(await p.evaluate(() => { const S=__shopScan, q=S.state.active; return q ? {vis:q.preview.visible, aim:S.aim&&{k:S.aim.kind,same:S.aim.p===q}, cam:game.camera.position.toArray()} : null; })), LX); await p.screenshot({path:'/tmp/dbg-aside.png'});
  const kept = await p.evaluate(() => !!(__shopScan.state.active && __shopScan.state.active.preview.visible && (!__shopScan.aim || __shopScan.aim.kind !== 'sale' && __shopScan.aim.kind !== 'nfs' || __shopScan.aim.p !== __shopScan.state.active)));
  if (!phone) { ok('copy stays while the cursor is on its label (laser gone > 1.2 s)', kept); await p.mouse.click(LX[0], LX[1]); }
  await wait(300); const added = await p.evaluate(() => __shopScan.state.added || 0);
  ok(phone ? 'tapping the Print label adds the print' : 'clicking the Print label adds the print', added > added0, `${added0} -> ${added}`);
  if (!phone) await p.mouse.move(5, 5); await away(); await wait(1800);
  const gone = await p.evaluate(() => __shopScan.state.previews.filter(q => q.preview.visible).length);
  ok('copy disappears ~1.2 s after laser and cursor have left', gone === 0, gone + ' visible'); }
const before = await p.evaluate(() => __snd.osc);
await p.evaluate(() => game.fire()); await wait(400);
const pid = s3 && SHOP[s3.slug].pr.id;
const C = await p.evaluate(() => { window.__goCheckout && __goCheckout(); return new Promise(r => setTimeout(() => r({ go: window.__checkoutGo || '', ls: JSON.parse(localStorage.getItem('va-cart-v1') || '[]') }), 900)); });
ok('scanning the preview adds that print (not the original) and it reaches the site cart', C.ls.some(i => i.id === pid) && !C.ls.some(i => i.id === (s3 && s3.slug)), JSON.stringify(C.ls));
const snd = await p.evaluate(() => [__snd.osc - __s0.osc, __snd.src - __s0.src]);
ok('silent when muted', snd[0] === 0 && snd[1] === 0, JSON.stringify(snd));
const bodyTxt = await p.evaluate(() => document.body.innerText + JSON.stringify(window.__shopScan.state.skipped));
ok('no forbidden word', !/\bDMT\b/.test(bodyTxt));
ok('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
for (const r of res) console.log(r.join(' · ').slice(0, 300));
console.log('SKIPPED', JSON.stringify(P.skipped)); console.log('PLAQUE_Y', Math.min(...P.plaques), Math.max(...P.plaques));
console.log('SHOPAUDIT', res.filter(r => r[0] === 'PASS').length + '/' + res.length, DEV, URL_);
await b.close();
