import { chromium } from 'playwright-core'; import fs from 'node:fs';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport:{width:1280,height:800} })).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto(process.argv[2]); await p.waitForFunction(()=>window.game&&game.tags&&game.tags.ready&&window.__kino800,null,{timeout:120000});
const K = JSON.parse(fs.readFileSync('src/catalog.json')).layout.tags.openCourts.find(o=>o.id==='kinoteka').kino800;
const r = await p.evaluate((K)=>{ const at=(u,v)=>[K.D[0]+K.t[0]*u+K.f[0]*v, K.D[1]+K.t[1]*u+K.f[1]*v];
  const walk=[]; for(let v=13.2;v<=21.8;v+=0.1){const [x,z]=at(0,v); walk.push(game.walkable(x,z));}
  const rows=[]; for(let i=0;i<8;i++){const v=14.2+0.95*i; let lo=0,hi=0; for(let u=0;u>-3;u-=0.01){const [x,z]=at(u,v); if(!game.walkable(x,z)){lo=u;break;}} for(let u=0;u<3;u+=0.01){const [x,z]=at(u,v); if(!game.walkable(x,z)){hi=u;break;}} rows.push(+(hi-lo).toFixed(2)); }
  return {aisleWalkAll:walk.every(Boolean), walkSamples:walk.length, walkableWidthAtRows:rows}; }, K);
console.log(JSON.stringify({...r,errs})); await b.close();
