import { chromium } from 'playwright-core';
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(`https://preview-251.tjm-tag-gallery-preview.pages.dev/play/?key=${process.env.LAYOUT_SAVE_KEY || "<LAYOUT_SAVE_KEY>"}`,{waitUntil:'load'});await p.waitForFunction(()=>window.game&&game.tags&&game.tags.ready,null,{timeout:180000});
const r=await p.evaluate(()=>{const f=id=>{const q=game.paintings.find(q=>(q.data||q).id===id||q.id===id);if(!q)return null;const d=q.data||q;return {iw:d.iw,ih:d.ih,dw:d.w,dh:d.h,w:q.w,h:q.h,fw:d.fw,fh:d.fh,room:d.room,state:q.state}};return {es:f('sunset-in-el-zonte-el-salvador'),hi:f('painting-red-horizon')}});
console.log(JSON.stringify(r),'errors',errs);await b.close();
