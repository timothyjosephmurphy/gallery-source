import { chromium } from 'playwright-core'; const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] }); const p = await (await b.newContext({viewport:{width:1280,height:800}})).newPage();
await p.goto(process.argv[2]); await p.waitForFunction(() => window.game && game.tags && game.tags.ready, null, { timeout: 240000 });
await p.waitForTimeout(8000);
console.log(JSON.stringify(await p.evaluate(()=>{const G={},W=[];game.scene.traverse(o=>{if(!o.isMesh)return;const m=Array.isArray(o.material)?o.material[0]:o.material;
 const path=[];let q=o;while(q&&path.length<5){path.push(q.name||'?');q=q.parent}
 if(/^anon/.test(o.name)||!o.name){const k=m.uuid.slice(0,6);(G[k]=G[k]||{type:m.type,col:m.color?.getHexString(),op:m.opacity,tr:m.transparent,map:!!m.map,blend:m.blending,n:0,names:[],geo:[],par:[],inst:o.isInstancedMesh,skin:o.isSkinnedMesh});G[k].n++;G[k].names.push(o.name);G[k].geo.push(o.geometry.type+':'+o.geometry.attributes.position.count);G[k].par.push(path.slice(1,4).join('<'))}
 if(/window|glass|frame|pane|sash/i.test(path.join(' '))||/window|glass/i.test(m.name||''))W.push({n:o.name,path:path.join('<'),mat:m.uuid.slice(0,6),mn:m.name,t:m.type,map:!!m.map,tr:m.transparent,op:m.opacity,v:o.geometry.attributes.position.count,vis:o.visible,ro:o.renderOrder,ud:Object.keys(o.userData)})});
 return {G,W}}),null,1)); await b.close();
