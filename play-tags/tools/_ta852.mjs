import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await (await b.newContext({viewport:{width:1280,height:800}})).newPage(); const errs=[],warn=[];
p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(/852/.test(m.text()))warn.push(m.text())});
await p.goto(process.argv[2],{waitUntil:'domcontentloaded',timeout:90000});await p.waitForTimeout(25000);
console.log(JSON.stringify(await p.evaluate(()=>({v:window.__ist811&&window.__ist811.vista852,t:window.__trees852}))),JSON.stringify({errs:errs.slice(0,5),warn}));
await b.close();
