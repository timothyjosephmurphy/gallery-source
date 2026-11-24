import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(/78[46]/.test(m.text()))errs.push(m.text())});
await p.goto('http://localhost:4189/play/'); await p.waitForFunction(() => window.game && game.tags && game.tags.ready, null, { timeout: 120000 }); await p.waitForTimeout(12000); const sp = await p.evaluate(()=>{const c=game.camera.position,d=new (c.constructor)();game.camera.getWorldDirection(d);return [c.x,c.z,d.x,d.z]}); errs.push("spawn "+sp.map(v=>v.toFixed(2)).join(",")); await p.evaluate(() => { for (const e of document.querySelectorAll('body *')) if (/TJM GALLERY/.test(e.textContent) && getComputedStyle(e).position === 'fixed') e.style.display = 'none'; });
const info = await p.evaluate(() => { const o = game.scene.getObjectByName('cormorant-qr-brass-plaque'); const m = game.scene.getObjectByName('cormorant-presiding-over-sunset-on-puget-sound'); const V=()=>new game.THREE.Vector3();
  const f = o && o.getWorldPosition(V()); const mm = m && m.getWorldPosition(V()); const ch=[]; o && o.traverse(q=>ch.push([q.name,q.type,q.visible, q.scale&&q.scale.toArray().map(v=>+v.toFixed(3))]));
  return { plaque: f && f.toArray(), mural: mm && mm.toArray(), ch }; });
console.log(JSON.stringify(info));
for (const [n, pos, look] of [['eagle',[-7.99,1.6,23.08],[-5.83,1.45,24.33]],['h9k1',[-24.75,1.6,-1.5],[-24.75,1.45,7.1]],['h5k0',[11.5,1.6,20.9],[18.56,1.45,25.0]]]) {
  await p.evaluate(([pos, look]) => { game.freeze = true; const c = game.camera; c.position.set(...pos); c.lookAt(...look); if (game.player) game.player.position?.set?.(pos[0],0,pos[2]); }, [pos, look]);
  await p.waitForTimeout(2500); await p.evaluate(([pos, look]) => { const c = game.camera; c.position.set(...pos); c.lookAt(...look); }, [pos, look]); await p.waitForTimeout(300);
  await p.screenshot({ path: `/tmp/shot789b-${n}.png` }); }
console.log(JSON.stringify({ errs })); await b.close();
