import { chromium } from 'playwright-core';
const url=process.argv[2]; const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1280,height:800}}); await ctx.route('**/img/play/**', async r=>{const u=new URL(r.request().url()); try{const res=await r.fetch({url:'https://img.tjm.art'+u.pathname.slice(u.pathname.indexOf('/play/',4)===-1?4:u.pathname.indexOf('/img/')+4)}); await r.fulfill({response:res})}catch(e){await r.abort()}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto(url); await p.waitForFunction(()=>window.game&&game.tags&&game.tags.ready&&game.nPaintings>50,null,{timeout:180000});
await p.waitForFunction(()=>window.__story335&&__story335.placed.length&&__story335.placed.every(r=>r.font),null,{timeout:60000}).catch(()=>{});
const st=await p.evaluate(()=>window.__story335); console.log(JSON.stringify(st,null,0)); console.log('pageErrors',errs.length,errs.slice(0,3), 'forbid', await p.evaluate(()=>new RegExp(String.fromCharCode(68, 77, 84)).test(document.body.innerText)));
if(process.argv[3]){ for(const r of st.placed.slice(0,+process.argv[3])){ await p.evaluate(r=>{const m=game.scene.getObjectByName('brassStory335-'+r.id);const c=game.camera;const n=new (m.position.constructor)(0,0,1).applyQuaternion(m.quaternion);c.position.set(m.position.x+n.x*0.75,m.position.y,m.position.z+n.z*0.75);c.lookAt(m.position);},r).catch(e=>console.log('cam',e.message)); await p.waitForTimeout(1500); await p.screenshot({path:'/tmp/s335-'+r.id+'.png'}); } }
await b.close();
