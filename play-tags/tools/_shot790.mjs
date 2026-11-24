import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const url = process.argv[2] || 'http://localhost:4190/play/';
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(/790|784/.test(m.text()))errs.push(m.text())});
await p.goto(url); await p.waitForFunction(() => window.game && game.tags && game.tags.ready, null, { timeout: 120000 }); await p.waitForTimeout(15000);
const info = await p.evaluate(() => { const g = game.scene.getObjectByName('berlin-el-salvador-mural'); const fr = g && g.getObjectByName('muralFrame'); const m = g && g.getObjectByName('mural');
  const st = []; game.scene.traverse(o => { if (/^steeples784/.test(o.name)) st.push(o.name); });
  return { b790: window.__berlin790, frameVisible: fr && fr.visible, muralScale: m && m.scale.toArray(), steeples: st, wallMesh: !!game.scene.getObjectByName('berlinWall790') }; });
console.log(JSON.stringify(info));
const shots = [['far',[20.0,1.6,-11.6],[24.724,1.6,-14.274]],['near',[21.6,1.6,-12.4],[24.724,1.3,-14.274]]];
await p.evaluate(()=>{const s=document.getElementById('start'); if(s) s.style.display='none';}); for (const [n,pos,look] of shots) { await p.evaluate(([pos,look])=>{game.freeze=true;const c=game.camera;c.position.set(...pos);c.lookAt(...look);},[pos,look]); await p.waitForTimeout(2500);
  await p.evaluate(([pos,look])=>{const c=game.camera;c.position.set(...pos);c.lookAt(...look);},[pos,look]); await p.waitForTimeout(300); await p.screenshot({ path: `/tmp/shot790-${n}.png` }); }
console.log(JSON.stringify({ errs })); await b.close();
