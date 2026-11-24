import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({viewport:{width:1280,height:800}})).newPage();
await p.goto(process.argv[2]); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && game.fps > 0, null, { timeout: 240000 });
await p.waitForTimeout(4000);
const r = await p.evaluate(()=>{const o=[];const mc={};game.scene.traverse(x=>{if(x.isMesh&&/^anon478/.test(x.name))mc[x.material.uuid]=(mc[x.material.uuid]||0)+1;});
game.scene.traverse(x=>{if(!x.isMesh||!/^anon478/.test(x.name)||mc[x.material.uuid]<2)return;let vis=true;for(let a=x;a;a=a.parent)if(!a.visible)vis=false;const m=x.material;o.push([x.name,m.uuid.slice(0,6),m.type,'#'+(m.color?m.color.getHexString():''),m.map&&m.map.image&&(m.map.image.src||m.map.image.width),vis,x.parent&&(x.parent.type+':'+x.parent.name),x.parent===game.scene,x.position.toArray().map(v=>+v.toFixed(2)),JSON.stringify(x.geometry.parameters),x.castShadow,x.receiveShadow,x.matrixAutoUpdate,Object.keys(x.userData).join(",")]);});return o;});
r.sort().forEach(x=>console.log(JSON.stringify(x))); await b.close();
