import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for (const phone of [false,true]) { const c=await b.newContext(phone?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:800}}); const p=await c.newPage(); const errs=[];
p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(/toolglb|error/i.test(m.text()))errs.push(m.text().slice(0,150))});
await p.goto('http://localhost:4182/play/',{waitUntil:'load'});await p.waitForTimeout(20000); await p.mouse.click(640,400).catch(()=>{}); for (let i=0;i<6;i++){ await p.mouse.wheel(0,120); await p.waitForTimeout(400); await p.mouse.down(); await p.waitForTimeout(300); await p.mouse.up(); }
console.log(phone?'phone':'desktop', JSON.stringify(await p.evaluate(()=>window.__toolGLB||null)), errs.slice(0,6)); await c.close(); }
await b.close();
