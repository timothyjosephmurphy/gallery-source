// #271 / #274 / #275 art-clearance audit (desktop | phone 390x844):
//  - occlusion: every painting, mural and the Neural Dance wall is ray-sampled (5x5 points) from several standing spots at
//    1.6 m eye height (2.5 m in front, 3 m in front +-1.2 m to the sides, and the room / courtyard centre); fails if more
//    than 5% of the work is hidden from any of them (the work's own frame, plaque and glow don't count)
//  - frames: every hung painting's picture aspect within 1% of its loaded image, picture = frame opening (no black bars)
//  - eggs (e.g. the money printer): none in a doorway, on a path, against a wall or in front of any work (3 m zone)
//  - Neural Dance: the real tjm.art/neural-dance/ simulation is live on the wall when near, torn down when away
import { chromium } from 'playwright-core';
const [url, dev = 'desktop'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } };
const p = await (await b.newContext(o)).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { window.__noNav = true; });
await p.goto(url); await p.waitForFunction(() => window.game && game.tags && game.tags.garden && game.fps > 0 && window.eggs, null, { timeout: 200000 }); await p.waitForTimeout(4000);
const r = await p.evaluate(async () => {
  const T = game.THREE, W = game.tags.world, sc = game.scene, out = { occluded: [], checkedArt: 0, rays: 0 };
  // eggs (dropped by museum-eggs after load): clear of doors, paths, walls and art
  const eggPos = () => new Map(sc.children.filter(o => /^egg-/.test(o.name || '')).map(o => [o, o.position.clone()])); await new Promise(r => setTimeout(r, 6000)); const e0 = eggPos(); await new Promise(r => setTimeout(r, 2500)); const moving = new Set([...eggPos()].filter(([o, v]) => v.distanceTo(e0.get(o) || v) > 0.05).map(([o]) => o));
  for (const o of sc.children) if (/^egg-(ostrich|drone|banana|elf)/.test(o.name || '')) moving.add(o); /* wanderers pause between walks: still passers-by */ out.walkingEggs = [...moving].map(o => o.name);
  out.eggs = []; for (const o of sc.children) { if (moving.has(o)) continue; if (!/^egg-/.test(o.name || '') || o.visible === false) continue; const bb = new T.Box3().setFromObject(o); if (bb.isEmpty() || bb.min.y > 2.4) continue; const c = bb.getCenter(new T.Vector3()), s = bb.getSize(new T.Vector3()), rr = Math.max(s.x, s.z) / 2; if (!window.__tagsEggClear(c.x, c.z, rr)) out.eggs.push(o.name + '@' + c.x.toFixed(1) + ',' + c.z.toFixed(1)); }
  const money = sc.children.find(o => /money|monetary|printer/i.test(o.name || '')); out.moneyPrinter = money ? money.name : null;
  // works to check: paintings on walls, murals, the Neural Dance wall
  const works = []; for (const q of game.paintings) if (q.state === 'wall') works.push({ id: q.data.id, obj: q.group, w: q.w, h: q.h, plane: q.mesh });
  sc.traverse(m => { if (m.name === 'mural' || m.name === 'neuralDance') { const g = m.parent; const s = new T.Vector3(); m.getWorldScale(s); const geo = m.geometry.parameters || {}; works.push({ id: g.name || m.name, obj: g, w: (geo.width || 1) * s.x, h: (geo.height || 1) * s.y, plane: m }); } });
  const rc = new T.Raycaster(); rc.layers.enableAll(); const occ = []; sc.traverse(m => { if ((m.isMesh || m.isInstancedMesh) && m.visible) occ.push(m); });
  const visible = m => { for (let q = m; q; q = q.parent) if (q.visible === false) return false; return true; };
  const mov = new Set(); for (const o of moving) o.traverse(x => mov.add(x)); // walking eggs / the guide bot pass by: not fixed obstructions
  const blockers = occ.filter(m => !mov.has(m) && visible(m) && !(m.material && (m.material.transparent && m.material.opacity < 0.5)) && !/sky|garden-water|garden-lawn|floor|ground|groundcover|dome|glass/i.test(m.name || ''));
  for (const wk of works) { const g = wk.obj; g.updateMatrixWorld(true); const own = new Set(); g.traverse(x => own.add(x)); const n = new T.Vector3(0, 0, 1).transformDirection(g.matrixWorld); n.y = 0; n.normalize(); const t = new T.Vector3(-n.z, 0, n.x), C = g.getWorldPosition(new T.Vector3());
    const rm = W.roomAt(C.x + n.x, C.z + n.z), spots = [[2.5, 0], [3, 1.2], [3, -1.2]].map(([d, s]) => C.clone().addScaledVector(n, d).addScaledVector(t, s));
    if (rm && rm.center && rm.kind !== 'hub') { const cc = new T.Vector3(rm.center[0], 0, rm.center[1]), d = cc.clone().sub(C).dot(n); if (d > 1.5 && d < 16) spots.push(cc); }
    let worst = 0, worstAt = null; const byMap = new Map(); out.checkedArt++;
    for (const s of spots) { if (!W.walkable(s.x, s.z)) continue; const eye = new T.Vector3(s.x, 1.6, s.z); let hid = 0, tot = 0;
      for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { const pt = C.clone().addScaledVector(t, wk.w * (i / 4 - 0.5) * 0.92); pt.y += wk.h * (j / 4 - 0.5) * 0.92; pt.addScaledVector(n, 0.03);
        const dir = pt.clone().sub(eye), L = dir.length(); rc.set(eye, dir.normalize()); rc.far = L - 0.02; tot++; out.rays++;
        const h = rc.intersectObjects(blockers, false).find(x => !own.has(x.object) && !/plaque/i.test(x.object.name || '')); if (h) { hid++; let nm = ''; for (let q = h.object, k = 0; q && k < 6; q = q.parent, k++) nm += (q.name || q.type) + '<'; byMap.set(nm, (byMap.get(nm) || 0) + 1); } }
      const f = hid / tot; if (f > worst) { worst = f; worstAt = [+s.x.toFixed(1), +s.z.toFixed(1)]; } }
    if (worst > 0.05) { out.occluded.push({ id: wk.id, hidden: Math.round(worst * 100) + '%', from: worstAt, by: [...byMap].slice(0, 3) }); } }
  // frames hug their images
  out.aspect = []; for (const q of game.paintings) { if (q.state !== 'wall') continue; const im = q.mesh.material.map && q.mesh.material.map.image; if (!im || !im.width) continue; const s = q.mesh.scale, a = (s.x / s.y) / (im.width / im.height); if (Math.abs(a - 1) > 0.01) out.aspect.push(q.data.id + ' ' + a.toFixed(3)); }
  // Neural Dance: near -> the real page is running and copied to the wall; away -> torn down
  const nd = []; sc.traverse(m => { if (m.name === 'neuralDance') nd.push(m); }); out.neural = { wall: nd.length };
  if (nd.length) { const m = nd[0], c = m.getWorldPosition(new T.Vector3()), n = new T.Vector3(0, 0, 1).transformDirection(m.matrixWorld); game.view(c.x + n.x * 4, c.z + n.z * 4, c.x, c.z);
    for (let i = 0; i < 60 && !(window.__neuralDance && window.__neuralDance.state === 'live' && document.querySelector('iframe[title="Neural Dance"]')?.contentDocument?.getElementById('canvas')); i++) await new Promise(r => setTimeout(r, 500));
    await new Promise(r => setTimeout(r, 2500)); const f = document.querySelector('iframe[title="Neural Dance"]'), d = f && f.contentDocument, cv = d && d.getElementById('canvas');
    out.neural.live = !!cv; out.neural.title = d && d.title; out.neural.inert = !!(f && f.inert && f.tabIndex === -1 && getComputedStyle(f).pointerEvents === 'none'); out.neural.focusStolen = document.activeElement === f;
    const tex = m.material.map.image, x = tex.getContext('2d').getImageData(0, 0, tex.width, tex.height).data; let lit = 0; for (let i = 0; i < x.length; i += 400) if (x[i] + x[i + 1] + x[i + 2] > 60) lit++; out.neural.litSamples = lit;
    out.neural.audioOn = !!(d && /Stop audio/i.test(d.getElementById('audio')?.textContent || ''));
    game.view(c.x + n.x * 45, c.z + n.z * 45, c.x, c.z); for (let i = 0; i < 10; i++) await new Promise(r => setTimeout(r, 300)); out.neural.tornDownWhenAway = !document.querySelector('iframe[title="Neural Dance"]'); }
  return out; });
r.errors = errs.slice(0, 5);
r.bubble = await p.evaluate(() => { let bub = null, pillar = false; game.scene.traverse(o => { if (o.name === 'checkoutBubble' || o.name === 'checkoutFountain') bub = o; if (o.name === 'checkoutPillar') pillar = true; }); return { present: !!bub, pillar, atCentre: !!bub && Math.hypot(bub.position.x, bub.position.z) < 0.01, walkCore: eggs.world.walkable(0, 0) }; }); // #290 (#296: the centrepiece is now the walk-in sun fountain, group 'checkoutFountain')
r.fountain = await p.evaluate(() => { const n = {}; let sprites = 0; game.scene.traverse(o => { if (['sunMedallion', 'checkoutRing', 'fountainWater', 'fountainCurb'].includes(o.name)) n[o.name] = (n[o.name] || 0) + 1; if (o.isSprite && o.visible && (() => { const w = o.getWorldPosition(new game.THREE.Vector3()); return Math.hypot(w.x, w.z) < 6 && Math.abs(w.y) < 20; })()) { let q = o, inF = false; while (q) { if (q.name === 'checkoutFountain') inF = true; q = q.parent; } if (!inF) sprites++; /* the fountain's own soft-glow sprites are light, not text */ } if (o.name === 'bubble' || o.name === 'checkoutLabel') n.OLD = 1; }); return { parts: n, floatingSprites: sprites, walkIn: window.eggs.world.walkable(1.9, 0) && window.eggs.world.walkable(0, 1.9) }; }); // #296: medallion + tiled ring + water, no bubble, no floating text, walk-in
r.pass = r.fountain.parts.sunMedallion === 1 && r.fountain.parts.checkoutRing === 1 && r.fountain.parts.fountainWater === 1 && !r.fountain.parts.OLD && !r.fountain.floatingSprites && r.fountain.walkIn && r.bubble.present && !r.bubble.pillar && r.bubble.atCentre && !r.bubble.walkCore && !r.occluded.length && !r.aspect.length && !r.eggs.length && r.neural.live && r.neural.inert && !r.neural.focusStolen && r.neural.litSamples > 20 && !r.neural.audioOn && r.neural.tornDownWhenAway;
console.log(JSON.stringify(r).slice(0, 3000)); console.log('CLEARAUDIT', dev, r.pass ? 'PASS' : 'FAIL'); await b.close(); process.exit(r.pass ? 0 : 1);
