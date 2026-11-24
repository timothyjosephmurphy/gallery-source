import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1280,height:800}}); await ctx.route('**/img/play/**', async r=>{const u=new URL(r.request().url()); try{const res=await r.fetch({url:'https://img.tjm.art'+u.pathname.slice(4)}); await r.fulfill({response:res})}catch(e){await r.abort()}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto('https://preview-251.tjm-tag-gallery-preview.pages.dev/play/'); await p.waitForFunction(()=>window.game&&game.tags&&game.tags.ready&&game.nPaintings>50,null,{timeout:120000}); await p.waitForTimeout(8000);
await p.addStyleTag({content:'body > *:not(canvas){visibility:hidden !important}'});
const info=await p.evaluate(()=>{let sc=game.scene; if(!sc){let o=game.camera; while(o.parent)o=o.parent; sc=o;} const L=[],K=[]; sc.traverse(o=>{if(o.name&&o.name.startsWith('locSign818'))L.push([o.name,!!(o.userData&&o.userData.mosaic824),o.position.x.toFixed(2),o.position.z.toFixed(2),o.rotation.y.toFixed(2)]); if(o.name&&/kino.*lintel|lintel818/i.test(o.name))K.push(o.name)}); window.__L=L; return {L,K};});
console.log(JSON.stringify(info));
for (const [i,s] of info.L.entries()) { const [n,,x,z,ry]=s; await p.evaluate(([x,z,ry])=>{const c=game.camera,a=+ry;cancelAnimationFrame(window.__raf);const f=()=>{c.position.set(+x+Math.sin(a)*5,2.2,+z+Math.cos(a)*5);c.lookAt(+x,3.9,+z);window.__raf=requestAnimationFrame(f)};f()},[x,z,ry]); await p.waitForTimeout(2500); await p.screenshot({path:`/tmp/c824-${i}.png`}); }
console.log('pageErrors',errs.length,errs.slice(0,3)); await b.close();
