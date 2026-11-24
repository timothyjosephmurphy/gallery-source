import { chromium } from 'playwright-core';
const url=process.argv[2]; const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1280,height:800}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto(url); await p.waitForFunction(()=>window.game&&game.tags&&game.tags.ready&&game.nPaintings>50,null,{timeout:180000});
await p.waitForTimeout(4000);
console.log(JSON.stringify(await p.evaluate(()=>{const names={};game.scene.traverse(o=>{if(/brass|eagle|story335/i.test(o.name)&&o.visible)names[o.name.replace(/-.*/,'')]=(names[o.name.replace(/-.*/,'')]||0)+1;});
 return {idx:[...document.scripts].map(s=>s.src).filter(Boolean),eagle:window.__eaglebrass354,story:window.__story335,hold:window.__brassHold829,brassVisible:names,rainier:game.paintings.some(p=>p.data&&p.data.id==='painting-portrait-with-hat'),n:game.nPaintings}})),'errs',errs.length);
await b.close();
