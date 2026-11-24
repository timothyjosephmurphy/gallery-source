import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:1280,height:720}});const bad=[],ok={};
p.on('response',r=>{const u=r.url();if(r.status()>=400)bad.push(r.status()+' '+u);const m=u.match(/img\/play\/preview-251\/([^/]+)\//);if(m&&r.status()<400)ok[m[1]]=(ok[m[1]]||0)+1});
await p.goto(process.argv[2]||'https://tjm.art/play/',{waitUntil:'load'});await p.waitForFunction(()=>window.game&&game.tags&&game.tags.ready,null,{timeout:180000});await p.waitForTimeout(8000);
const idx=await p.evaluate(()=>[...document.scripts].map(s=>s.src).filter(Boolean));
console.log(JSON.stringify({idx,ok,bad:bad.slice(0,30),nbad:bad.length},null,1));await b.close();
