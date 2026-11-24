import { chromium } from 'playwright-core';
const url = process.argv[2] || 'http://localhost:4338/play/?tour=0'; const phone = process.argv[3] === 'phone';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext(phone ? { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 800 } })).newPage(); await p.addInitScript(() => { window.__noNav = 1; });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(url); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && game.grav, null, { timeout: 180000 }); await p.waitForTimeout(2500);
const r = await p.evaluate(() => { const g = game.grav, T = game.THREE, cam = game.camera, out = [];
  const wallPs = game.paintings.filter(q => q.state === 'wall' && q.w < 1.2 && q.h < 1.2);
  for (const k of [0, 7, 15, 30]) { const q = wallPs[k % wallPs.length]; if (!q) continue; const d = q.data;
    // pick a different painting to hold, aim at q's wall beside q
    const held = wallPs[(k + 3) % wallPs.length]; g.grab(held);
    const n = new T.Vector3(d.ix, 0, d.iz), t = new T.Vector3(n.z, 0, -n.x), off = (q.w / 2 + held.w / 2 + 0.25);
    let res = null;
    for (const s of [1, -1]) { const tgt = new T.Vector3(d.x, d.y, d.z).addScaledVector(t, s * off); cam.position.copy(tgt).addScaledVector(n, 2.2); cam.position.y = 1.6; cam.lookAt(tgt); cam.updateMatrixWorld();
      const rc = new T.Raycaster(); rc.setFromCamera(new T.Vector2(0, 0), cam); const hs = rc.intersectObjects(game.scene.children, true).filter(h => !h.object.isSprite).slice(0, 3).map(h => `${h.object.name || '?'}:${h.object.geometry && h.object.geometry.type}:${h.object.isInstancedMesh ? 'inst' : ''}:${h.distance.toFixed(2)}`);
      const pl = g.placement(held); res = { id: held.data.id, side: s, pl: pl ? { ok: pl.ok } : null, hs }; if (pl && pl.ok) break; }
    const ok = res.pl && res.pl.ok ? g.hang() : (g.drop && g.drop(), false); if (!ok && held.state === 'held') { held.state = 'wall'; }
    out.push({ ...res, hung: ok, state: held.state }); }
  return out; });
console.log(JSON.stringify(r, null, 1)); console.log('errors', errs.length, errs.slice(0, 3)); await b.close();
