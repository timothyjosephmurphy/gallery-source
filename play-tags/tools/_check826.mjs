import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1280,height:800}}); await ctx.route('**/img/play/**', async r=>{const u=new URL(r.request().url()); try{const res=await r.fetch({url:'https://img.tjm.art'+u.pathname.slice(4)}); await r.fulfill({response:res})}catch(e){await r.abort()}});
const p=await ctx.newPage(); const errs=[], man=[]; p.on('pageerror',e=>errs.push(String(e))); p.on('response',r=>{if(/advice-maeve-1\/.*manifest/.test(r.url()))man.push(r.status()+' '+r.url().split('/').pop())});
await p.goto('https://preview-251.tjm-tag-gallery-preview.pages.dev/play/'); await p.waitForFunction(()=>window.game&&game.tags&&game.tags.ready&&game.nPaintings>50,null,{timeout:120000});
await p.waitForFunction(()=>window.__advice&&__advice.state.man,null,{timeout:60000}).catch(()=>{});
console.log(JSON.stringify(await p.evaluate(()=>{const S=window.__advice&&__advice.state;return S&&{man:S.man&&Object.keys(S.man).length,dur:S.dur&&Object.keys(S.dur).length,ready:S.audioReady}})),man,'pageErrors',errs.length,errs.slice(0,3)); await b.close();
