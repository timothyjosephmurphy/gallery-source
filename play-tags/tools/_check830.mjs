import { chromium } from 'playwright-core';
const url=process.argv[2]; const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await (await b.newContext({viewport:{width:1280,height:800}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto(url); await p.waitForFunction(()=>window.game&&game.tags&&game.tags.ready&&game.nPaintings>50&&game.grav,null,{timeout:180000});
await p.waitForFunction(()=>window.eggs&&eggs.drone,null,{timeout:120000}).catch(()=>{}); await p.waitForTimeout(3000);
const r1=await p.evaluate(()=>{const T=game.THREE,c=game.camera,out=[];
 const sm=game.paintings.filter(q=>q.state==='wall'&&q.h<0.8).sort((a,b)=>a.h-b.h)[0];
 for(const q of game.paintings.filter(q=>q.state==='wall').slice(0,40)){const d=q.data;const ey=1.6;c.position.set(d.x+d.ix*2.2,ey,d.z+d.iz*2.2);
  const res={};for(const ty of [0.5,2.5]){c.lookAt(d.x,ty,d.z);c.updateMatrixWorld();const pl=game.grav.placement(sm);res[ty]=pl?+pl.pos.y.toFixed(2):null;}
  out.push(res); if(res[0.5]!=null&&res[2.5]!=null&&res[2.5]-res[0.5]>1.5)break;}
 return {h:sm.h,last:out[out.length-1],tried:out.length,idx:[...document.scripts].map(s=>s.src).filter(s=>/index-/.test(s)),hold:window.__brassHold829};});
const r2=await p.evaluate(()=>{const q=game.paintings.find(q=>q.state==='wall'&&q.group.visible);game.setWeapon(2);game.grav.grab(q);const ops=[];q.group.traverse(c=>{if(c.isMesh)ops.push(c.material.opacity)});
 const other=game.paintings.find(x=>x!==q&&x.state==='wall');const oo=[];other.group.traverse(c=>{if(c.isMesh)oo.push(c.material.opacity)});
 return {heldOp:ops,otherOp:oo}});
await p.waitForTimeout(2000);
const r3=await p.evaluate(()=>{const d=eggs.drone;const h=d&&d.hauling;const q=game.paintings.find(x=>x.state==='held');const p0=game.grav.drop();const ops=[];p0&&p0.group.traverse(c=>{if(c.isMesh)ops.push(c.material.opacity)});game.setWeapon(1);return {hauling:h,afterDropOp:ops,hook:!!game.grav.dropHook}});
await p.waitForTimeout(1500); const r4=await p.evaluate(()=>eggs.drone.hauling);
console.log(JSON.stringify({r1,r2,r3,haulAfterSwitch:r4,errs}));await b.close();
