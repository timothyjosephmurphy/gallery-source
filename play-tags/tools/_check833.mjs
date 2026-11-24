import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto(`https://preview-251.tjm-tag-gallery-preview.pages.dev/play/?key=${process.env.LAYOUT_SAVE_KEY || "<LAYOUT_SAVE_KEY>"}`,{waitUntil:'load'});await p.waitForFunction(()=>window.game&&game.tags&&game.tags.ready,null,{timeout:180000});
const r=await p.evaluate(()=>{let v=null,aw=[],wall=null;const sc=game.scene||game.tags.scene;sc.traverse(o=>{if(o.name==='vista811')v=o.geometry.parameters.thetaLength;if(o.name==='awning811')aw.push(+o.position.y.toFixed(2));});
const ps=game.paintings.filter(q=>((q.data||q).room)==='courtyard-fountain-sw');let top=0;for(const q of ps){const d=q.data||q;const t=(d.y??d.cy??1.55)+(d.h||q.h||0)/2;if(t>top)top=t;}
const W=(game.tags.world||{}).walls||[];const hw=W.find(w=>w.id==='courtyard-fountain-sw-hang-wall');return {vistaTheta:v,awningGroupsY:aw,wallH:hw&&hw.h,n:ps.length,maxTop:+top.toFixed(2)}});
console.log(JSON.stringify(r),'errors',errs);await b.close();
