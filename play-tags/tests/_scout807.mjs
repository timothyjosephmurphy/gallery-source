import { chromium } from 'playwright-core';
const [url='http://localhost:4173/play/']=process.argv.slice(2);
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1280,height:800}}); await ctx.route('**/img/play/**', async r=>{const u=new URL(r.request().url()); try{const res=await r.fetch({url:'https://img.tjm.art'+u.pathname.slice(4)}); await r.fulfill({response:res})}catch(e){await r.abort()}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto(url); await p.waitForFunction(()=>window.game&&game.tags&&game.tags.ready&&game.nPaintings>50,null,{timeout:120000}); await p.waitForTimeout(8000);
const r=await p.evaluate(()=>{const T=game.tags.world||window.__tagsWorld; const sc=game.scene; const out={}; const THREE_=sc.children[0].position.constructor;
 const rooms=(window.CATALOG_TAGS||null); const res={}; const cs={};
 sc.updateMatrixWorld(true);
 const list=[]; sc.traverse(o=>{ if(!o.isMesh||!o.visible) return; o.geometry.computeBoundingBox&&!o.geometry.boundingBox&&o.geometry.computeBoundingBox(); const bb=o.geometry.boundingBox; if(!bb) return; const b2=bb.clone().applyMatrix4(o.matrixWorld); list.push([o.name||o.parent?.name||'?',b2]); });
 return {list:list.filter(([n,b])=>b.min.y<1.4&&b.max.y>0.05&&(b.max.x-b.min.x)<6&&(b.max.z-b.min.z)<6).map(([n,b])=>[n,+((b.min.x+b.max.x)/2).toFixed(2),+((b.min.z+b.max.z)/2).toFixed(2),+(b.max.y).toFixed(2),+(b.max.x-b.min.x).toFixed(2)]), extra: (typeof window.__holo807==='object')?window.__holo807:null};});
const C={'room-01':[0,14.289],'room-02':[12.375,7.145],'room-03':[-12.375,7.145],'room-04':[-12.375,-21.434],'room-05':[12.375,21.434],'room-06':[12.375,-21.434],'room-07':[12.375,-7.145],'room-08':[-12.375,-7.145],'room-09':[-24.75,0],'room-10':[24.75,0],'room-11':[0,-14.289],'room-12':[-12.375,21.434]};
for(const [id,[x,z]] of Object.entries(C)){ const near=r.list.filter(([n,a,c])=>Math.hypot(a-x,c-z)<2.2); console.log(id, JSON.stringify(near.slice(0,8))); }
if(r.extra) console.log('holo807',JSON.stringify(r.extra)); console.log('errs',errs.length,errs.slice(0,3).join(' | ')); await b.close();
