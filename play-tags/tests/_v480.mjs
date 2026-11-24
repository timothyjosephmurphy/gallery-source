import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({viewport:{width:1280,height:800}})).newPage(); const w=[]; p.on('console',m=>{if(/480/.test(m.text()))w.push(m.text())});
await p.goto(process.argv[2]); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && game.fps > 0, null, { timeout: 240000 });
await p.waitForTimeout(3000);
console.log(JSON.stringify(await p.evaluate(()=>{const o={m:window.__m480,merged:[],hiddenAnonBox:0};game.scene.traverse(x=>{if(x.name==='anon480Merge')o.merged.push([x.material.uuid.slice(0,6),x.geometry.attributes.position.count,x.visible]);if(x.name==='anon478Box'&&!x.visible)o.hiddenAnonBox++;});return o;})), w); await b.close();
