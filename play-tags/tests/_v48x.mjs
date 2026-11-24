import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({viewport:{width:1280,height:800}})).newPage(); const w=[]; p.on('console',m=>{if(/48x/.test(m.text()))w.push(m.text())});
await p.goto(process.argv[2]); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && game.fps > 0, null, { timeout: 240000 });
await p.waitForTimeout(3000);
console.log(JSON.stringify(await p.evaluate(()=>{const o={m:window.__m48x,inst:[]}; game.scene.traverse(x=>{if(/^hang48x/.test(x.name)){let on=0;const e=x.instanceMatrix.array;for(let i=0;i<x.count;i++)if(e[i*16]!==0)on++;o.inst.push([x.name,x.count,on]);}}); return o;})), w); await b.close();
