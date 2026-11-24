import { chromium } from 'playwright-core'; const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] }); const p = await (await b.newContext({viewport:{width:1280,height:800}})).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>{if(/488 merge|358w/.test(m.text()))errs.push(m.text())});
await p.goto(process.argv[2]); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && game.tags.S?.glow358?.ready!==false, null, { timeout: 240000 });
await p.waitForTimeout(25000);
console.log(JSON.stringify(await p.evaluate(()=>{const vis=o=>{for(let q=o;q;q=q.parent)if(!q.visible)return false;return true};const L=[];game.scene.traverse(o=>{if(o.isMesh&&/^Window/.test(o.name))L.push(o)});
 const V=L.filter(vis);return {m488:window.__m488,all:L.length,visible:V.map(x=>({n:x.name,merged:x.userData.merge488||0,v:x.geometry.attributes.position.count,mat:x.material.type,tr:x.material.transparent,op:x.material.opacity,map:!!x.material.map}))}})),JSON.stringify(errs)); await b.close();
