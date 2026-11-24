import { chromium } from 'playwright-core';
const [url,dev,tag,ang,cx,cz,extra='']=process.argv.slice(2);
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const o=dev==='phone'?{viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2}:{viewport:{width:1280,height:800}};
const ctx=await b.newContext(o); await ctx.route('**/img/play/**', async r=>{const u=new URL(r.request().url()); try{const res=await r.fetch({url:'https://img.tjm.art'+u.pathname.slice(4)}); await r.fulfill({response:res})}catch(e){await r.abort()}}); const p=await ctx.newPage();
await p.goto(url); await p.waitForFunction(()=>window.game&&game.tags&&game.tags.ready&&game.nPaintings>50,null,{timeout:120000}); await p.waitForTimeout(8000);
await p.addStyleTag({content:'body > *:not(canvas){visibility:hidden !important}'});
const r=await p.evaluate(([ang,cx,cz,extra])=>{const c=game.camera;const f=()=>{c.position.set(+cx,1.6,+cz);c.rotation.set(0.05,+ang,0,'YXZ');requestAnimationFrame(f)};f();return extra?String(eval(extra)):''},[ang,cx,cz,extra]);
await p.waitForTimeout(3000); await p.screenshot({path:`/tmp/s794-${tag}.png`}); console.log('ok',r); await b.close();
