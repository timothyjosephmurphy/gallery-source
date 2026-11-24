import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for (const dev of ['desktop','phone']){
const o=dev==='phone'?{viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2}:{viewport:{width:1280,height:800}};
const ctx=await b.newContext(o);const p=await ctx.newPage();const errs=[],bad=[];
p.on('pageerror',e=>errs.push(e.message));p.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url())});
await p.goto('http://localhost:4182/play/',{waitUntil:'load'});await p.waitForTimeout(8000);
await p.waitForTimeout(8000);const r=await p.evaluate(()=>({start:getComputedStyle(document.getElementById('start')).display,noEnter:!!window.__noEnter783,walk34:(()=>{try{const E=window.eggs;const W=E&&E.world;if(!W)return 'n/a';return [3.2,2.7,3.8,2.2,4.4].map(d=>W.walkable(12.375+0.866*d,7.145+0.5*d)?1:0).join('')}catch(e){return 'err'}})(),url:location.pathname,canvas:!!document.querySelector('canvas'),js:[...document.scripts].map(s=>s.src).filter(Boolean)}));
await p.screenshot({path:`/tmp/ta821-${dev}.png`});
console.log(dev,JSON.stringify(r),'errs',errs.length,errs.slice(0,3),'bad',bad.filter(u=>!u.includes('/img/')).slice(0,5));
await ctx.close();}
await b.close();
