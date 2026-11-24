import { chromium } from 'playwright-core';
const url = process.argv[2] || 'http://localhost:4737/play/?tour=0';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); await p.addInitScript(() => { window.__noNav = 1; });
await p.goto(url);
await p.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs && eggs.drone && window.__ostrichBot && window.__ostrichBot.ready, null, { timeout: 180000 });
await p.waitForTimeout(3000);
const probe = () => p.evaluate(() => { const a = __ostrichBot.api, T = a.g.parent.constructor; let mn = 1e9; const v = a.g.position.clone(); a.g.updateMatrixWorld(true);
  a.g.traverse(o => { if (o.isSkinnedMesh) { const pa = o.geometry.attributes.position; for (let i = 0; i < pa.count; i += 3) { v.fromBufferAttribute(pa, i); o.applyBoneTransform(i, v); v.applyMatrix4(o.matrixWorld); mn = Math.min(mn, v.y); } } else if (o.isMesh && o.name !== 'ostrichHit') { const pa = o.geometry.attributes.position; for (let i = 0; i < pa.count; i += 3) { v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld); mn = Math.min(mn, v.y); } } });
  const r = eggs.drone.root; return { footMin: +mn.toFixed(3), rootY: +r.position.y.toFixed(3), holderY: +a.g.position.y.toFixed(3), cur: a.state.cur, sp: +a.state.sp.toFixed(2), minY: +a.state.minY.toFixed(3) }; });
for (let i = 0; i < 12; i++) { console.log(JSON.stringify(await probe())); await p.waitForTimeout(700); }
await p.screenshot({ path: '/tmp/feet737.png' }); await b.close();
