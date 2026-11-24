import { chromium } from 'playwright-core';
const [url='http://localhost:4173/play/',tag='local']=process.argv.slice(2);
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({viewport:{width:1280,height:800}}); await ctx.route('**/img/play/**', async r=>{const u=new URL(r.request().url()); try{const res=await r.fetch({url:'https://img.tjm.art'+u.pathname.slice(4)}); await r.fulfill({response:res})}catch(e){await r.abort()}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(/764/.test(m.text()))errs.push(m.text())});
await p.goto(url); await p.waitForFunction(()=>window.game&&game.tags&&game.tags.ready&&game.nPaintings>50,null,{timeout:120000}); await p.waitForTimeout(6000);
await p.addStyleTag({content:'body > *:not(canvas){visibility:hidden !important}'});
const r=await p.evaluate(()=>{const g=window.__guitar764; const c=game.camera; const f=()=>{c.position.set(12.375-4.2,1.6,7.145);c.rotation.set(0.05,-Math.PI/2,0,'YXZ');requestAnimationFrame(f)};f(); return {err:g.err,rooms:g.rooms,urls:g.urls,fh:window.__floorH800(12.375,7.145),fh2:window.__floorH800(12.375+2,7.145)};});
await p.waitForTimeout(4000); const st=await p.evaluate(()=>window.__guitar764.state()); await p.screenshot({path:`/tmp/s807-${tag}.png`}); console.log(JSON.stringify(r),JSON.stringify(st).slice(0,300),'errs',errs); await b.close();
