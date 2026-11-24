import { chromium } from 'playwright-core'; const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] }); const p = await (await b.newContext({viewport:{width:1280,height:800}})).newPage();
await p.goto(process.argv[2]); await p.waitForFunction(() => window.game && game.tags && game.tags.ready, null, { timeout: 240000 });
await p.waitForTimeout(8000);
console.log(JSON.stringify(await p.evaluate(()=>{const vis=o=>{for(let q=o;q;q=q.parent)if(!q.visible)return false;return true};const A=[],W=[];
game.scene.traverse(o=>{if(!o.isMesh)return;const m=o.material;
 if(/^Window|window/i.test(o.name)){W.push({n:o.name,par:o.parent?.name,gp:o.parent?.parent?.name,mat:m.uuid?.slice(0,6),mn:m.name,t:m.type,map:!!m.map,tr:m.transparent,op:m.opacity,col:m.color?.getHexString(),v:o.geometry.attributes.position.count,vis:vis(o)})}
 if(/^anon478(Box)/.test(o.name)&&vis(o)){const wp=o.getWorldPosition(new o.position.constructor());A.push({n:o.name,mat:m.uuid.slice(0,6),col:m.color.getHexString(),t:m.type,par:o.parent?.name,parT:o.parent?.type,gp:o.parent?.parent?.name,p:wp.toArray().map(x=>+x.toFixed(2)),s:o.scale.toArray(),ud:Object.keys(o.userData),cast:o.castShadow})}});
 return {A,W}}),null,0)); await b.close();
