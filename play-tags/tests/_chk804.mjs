import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'] });
for (const dev of (process.argv[3]||'phone,desktop').split(',')) {
const o = dev==='phone'?{ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2 }:{viewport:{width:1280,height:800}};
const p = await (await b.newContext(o)).newPage();
await p.addInitScript(()=>{try{localStorage.setItem('tjmPlayQ','high')}catch(e){}});
await p.goto(process.argv[2]); await p.waitForFunction(()=>window.game&&game.tags&&game.tags.ready,null,{timeout:120000});
// walk camera around to load/evict
const r = await p.evaluate(async()=>{ const g=game, out={tier:document.documentElement.innerHTML.match(/tjmPlayQ/)?1:0}; const P=g.paintings; const pts=P.filter((_,i)=>i%15==0).map(q=>q.group.getWorldPosition(new g.THREE.Vector3()));
 for (const c of pts){ g.camera.position.set(c.x,1.6,c.z); await new Promise(r=>setTimeout(r,700)); }
 out.load=window.__tagsLoad; out.shrink=window.__shrink804||0; out.evict=window.__baseEvict||0; out.tex=g.renderer?g.renderer.info.memory.textures:null;
 out.maxW=Math.max(...P.filter(q=>q.baseTex).map(q=>q.baseTex.image.width)); return out; });
const t = await p.evaluate(()=>{ try { return [...document.querySelectorAll('*')].length && (window.game.tier||null) } catch(e){return null} });
console.log(dev, JSON.stringify(r), 'tier', t, 'url', p.url());
}
await b.close();
