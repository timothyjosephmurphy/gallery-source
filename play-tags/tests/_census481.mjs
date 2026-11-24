import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({viewport:{width:1280,height:800}})).newPage();
await p.goto(process.argv[2]); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && game.fps > 0, null, { timeout: 240000 });
await p.waitForTimeout(4000);
const r = await p.evaluate(()=>{const c={};game.scene.traverse(x=>{if(!x.isMesh)return;const m=Array.isArray(x.material)?'arr':x.material.uuid;const k=(x.name||'?')+'|'+(x.isInstancedMesh?'I':'');c[k]=c[k]||{n:0,mats:new Set()};c[k].n++;c[k].mats.add(m);});return Object.entries(c).map(([k,v])=>[k,v.n,v.mats.size]).filter(x=>x[1]>=3).sort((a,b)=>b[1]-a[1]).slice(0,30);});
console.log(JSON.stringify(r)); await b.close();
