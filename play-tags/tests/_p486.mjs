import { chromium } from 'playwright-core'; const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] }); const p = await (await b.newContext({viewport:{width:1280,height:800}})).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>{if(/486 merge/.test(m.text()))errs.push(m.text())});
await p.goto(process.argv[2]); await p.waitForFunction(() => window.game && game.tags && game.tags.ready, null, { timeout: 240000 });
await p.waitForTimeout(8000);
console.log(JSON.stringify(await p.evaluate(()=>{const L=[];game.scene.traverse(o=>{if(o.isMesh&&o.name==='domeLeadLight')L.push(o)});
 const f=x=>({merged:!!x.userData.merge486,verts:x.geometry.attributes.position.count,mat:x.material.uuid.slice(0,8),map:!!x.material.map,img:x.material.map?.image?.width||0,rep:x.material.map?x.material.map.repeat.toArray():null,color:x.material.color.getHexString(),op:x.material.opacity,blend:x.material.blending,ro:x.renderOrder,vis:x.visible});
 return {m486:window.__m486,n:L.length,meshes:L.slice(0,4).map(f),uniqMats:new Set(L.map(x=>x.material.uuid)).size}})),JSON.stringify(errs)); await b.close();
