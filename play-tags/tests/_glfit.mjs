import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const url = process.argv[2];
for (const dev of ['desktop','phone']) { const p = await (await b.newContext(dev==='phone'?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:800}})).newPage();
await p.goto(url); await p.waitForFunction(()=>window.game&&game.tags&&game.tags.ready,null,{timeout:120000}); await p.waitForTimeout(10000);
console.log(dev, JSON.stringify(await p.evaluate(()=>{const g=window.__glabels354; let grp=null; (function f(o){ if(o.name==='groupLabels354') grp=o; else (o.children||[]).forEach(f);})(window.game.scene||window.scene||{children:[]}); if(!g) return "noS"; return {skipped:g.skipped,err:g.err,fit:g.fit,placed:g.placed.map(x=>x.id+':'+x.k),vis:grp?grp.children.filter(m=>m.visible).map(m=>m.name.slice(9)):'nogrp'}})));}
await b.close();
