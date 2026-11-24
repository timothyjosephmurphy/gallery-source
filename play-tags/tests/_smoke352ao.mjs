import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const url = process.argv[2];
for (const dev of ['desktop','phone']) { const p = await (await b.newContext(dev==='phone'?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:800}})).newPage();
await p.goto(url); await p.waitForFunction(()=>window.game&&game.tags&&game.tags.ready,null,{timeout:120000}); await p.waitForTimeout(10000);
console.log(dev, JSON.stringify(await p.evaluate(()=>{let n=0,f=0;(function w(o){ if(o.name==='fence352-ao') n++; if(o.name==='fence352') f=o.children.length; (o.children||[]).forEach(w);})(window.game.scene||window.scene||{children:[]}); return {ao:n,fenceKids:f};})));}
await b.close();
