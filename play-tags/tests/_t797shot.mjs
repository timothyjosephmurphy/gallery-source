import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(process.argv[2] || 'http://localhost:4252/play/'); await p.waitForFunction(() => window.__roadster785 && window.game && game.camera, null, { timeout: 90000 }); await p.waitForTimeout(3000);
const r = await p.evaluate(() => { let g; game.scene.traverse(m => { if (m.name === 'roadster795') g = m; }); return { v: g.userData.v, x: g.position.x, z: g.position.z, yaw: g.rotation.y, st: window.__roadster785.state() }; }); console.log(r);
for (const [i, a] of [[0, 0.6], [1, 2.2], [2, -0.9]].entries ? [[0,0.6],[1,2.2],[2,-0.9]] : []) {
  await p.evaluate(([a, r]) => { document.querySelectorAll('#start').forEach(e => e.style.display = 'none'); const c = game.camera; window.__shot = { c, p: c.position.clone() }; const R = 5.2; const ang = r.yaw + a;
    const px = r.x + Math.cos(ang) * R, pz = r.z - Math.sin(ang) * R; c.position.set(px, 1.7, pz); c.lookAt(r.x, 0.6, r.z); game.renderer.render(game.scene, c); }, [a, r]);
  await p.screenshot({ path: `/tmp/shot797-${i}.png` }); }
console.log('errs', errs.slice(0, 3)); await b.close();
