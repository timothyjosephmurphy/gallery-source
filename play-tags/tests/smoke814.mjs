// #814 smoke: phone far-blank LOD under arches, holos off, tour stop 1 clean. node tests/smoke814.mjs URL outdir
import { chromium } from 'playwright-core';
const [url, out = '/workspace/shots/814'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage(); const errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto(url + (url.includes('?') ? '&' : '?') + 'tour=0'); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && game.nPaintings > 50 && window.eggs && eggs.world, null, { timeout: 120000 });
await p.evaluate(() => { document.body.classList.add('portraitok'); const s = document.getElementById('start'); if (s) s.style.display = 'none'; });
await p.waitForTimeout(6000);
const res = { far: [] };
// walk a loop of room centres (phone LRU churn), then stand at each doorway looking in and count blank paintings within 20 m in front
const C = await p.evaluate(() => { const T = (window.CATALOG_T || null); return game.tags && game.tags.rooms ? null : null; });
const rooms = await p.evaluate(() => (window.__catRooms = (game.catalog || {}).layout ? game.catalog.layout.tags.rooms.map(r => r.center) : null));
const centers = rooms || [[0,14.289],[12.375,7.145],[-12.375,7.145],[12.375,21.434],[12.375,-21.434],[12.375,-7.145],[-12.375,-7.145],[-24.75,0],[24.75,0],[0,-14.289],[-12.375,21.434],[-12.375,-21.434]];
for (let i = 0; i < centers.length; i++) { const [x, z] = centers[i];
  const r = await p.evaluate(async ([x, z]) => { const g = game, c = g.camera.position, W = eggs.world; let sx = x * 0.62, sz = z * 0.62; for (let k = 0; k < 20 && !W.walkable(sx, sz); k++) { sx = x * (0.62 - k * 0.02); sz = z * (0.62 - k * 0.02); }
    c.x = sx; c.z = sz; g.camera.lookAt(x, 1.6, z); await new Promise(r => setTimeout(r, 3500)); g.scene.updateMatrixWorld(true);
    const fw = new g.THREE.Vector3(); g.camera.getWorldDirection(fw); let n = 0, blank = 0, stub = 0;
    for (const q of g.paintings) { if (q.state !== 'wall') continue; const v = q.group.getWorldPosition(new g.THREE.Vector3()).sub(c); const d = v.length(); if (d > 20 || v.normalize().dot(fw) < 0.5) continue; n++; if (!q.mesh.material.map) blank++; else if (q.mesh.material.map === q.farStub) stub++; }
    return { n, blank, stub, at: [+sx.toFixed(1), +sz.toFixed(1)], load: window.__tagsLoad, evict: window.__baseEvict || 0 }; }, [x, z]);
  res.far.push(r); if (i % 3 === 0) await p.screenshot({ path: `${out}/far-${i}.png` }); }
res.holo = await p.evaluate(() => ({ holos: game.holo && game.holo.state ? game.holo.state.holos.length : null, guitar: window.__guitar764, flag: window.__holo814, videosPlaying: [...document.querySelectorAll('video')].filter(v => !v.paused).length }));
// tour: start, through stop 1 (Rainier)
await p.evaluate(() => { try { sessionStorage.removeItem('tjmTourSeen'); } catch (e) {} });
await p.goto(url + (url.includes('?') ? '&' : '?') + 'tour=1&tourrate=2'); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs && eggs.drone && window.__tour, null, { timeout: 120000 });
await p.evaluate(() => { document.body.classList.add('portraitok'); document.getElementById('start').style.display = 'none'; });
await p.waitForFunction(() => __tour.phase === 'welcome', null, { timeout: 20000 }); await p.evaluate(() => __tour.skip());
await p.waitForFunction(() => __tour.phase === 'offer', null, { timeout: 10000 }); await p.waitForTimeout(500);
const c0 = await p.evaluate(() => [game.camera.position.x, game.camera.position.z]); await p.evaluate(() => __tour.start());
await p.waitForTimeout(1200); const lead = await p.evaluate(c0 => ({ moved: +Math.hypot(game.camera.position.x - c0[0], game.camera.position.z - c0[1]).toFixed(2), st: __tour.state }), c0);
await p.screenshot({ path: `${out}/tour-lead.png` });
const tl = []; for (let k = 0; k < 120; k++) { await p.waitForTimeout(250); const s = await p.evaluate(() => { const s = __tour.state; return { step: s.step, kind: s.kind, clip: s.clip, frozen: s.frozen, focus: s.focus, vo: !!window.__tourVO, err: s.errors.length }; }); tl.push(s); if (s.step >= 3) break; if (s.kind === 'stop' && s.focus && !tl.shot) { tl.shot = 1; await p.screenshot({ path: `${out}/tour-stop1.png` }); } }
res.tour = { lead: { moved: lead.moved, kind: lead.st.kind, clip: lead.st.clip, frozen: lead.st.frozen }, timeline: tl.filter((s, i) => i === 0 || JSON.stringify(s) !== JSON.stringify(tl[i - 1])), end: await p.evaluate(() => { const s = __tour.state; return { errors: s.errors, visited: s.visited, log: s.log, focusLog: s.focusLog, glides: s.glides }; }) };
res.holoDuringTour = await p.evaluate(() => ({ videosPlaying: [...document.querySelectorAll('video')].filter(v => !v.paused && !v.muted).length }));
res.forbid = await p.evaluate(() => new RegExp(String.fromCharCode(68, 77, 84)).test(document.body.innerText + document.title)); res.errs = errs;
console.log(JSON.stringify(res, null, 1)); await b.close();
