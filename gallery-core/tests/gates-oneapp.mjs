// One app (#24): from every gallery, walk into every gate to another TJ gallery and back; the top page never reloads, the
// old frame is dropped after each swap, the URL is the deep link, and Montreal's gate links out. usage: node gates-oneapp.mjs ORIGIN [phone]
import { chromium } from '/workspace/play-bilbao/node_modules/playwright-core/index.mjs';
const O = process.argv[2], PHONE = process.argv[3] === 'phone', IDS = ['play', 'orsay', 'bilbao', 'uffizi', 'gugg-ny'], PATH = id => id === 'play' ? '/play/' : `/play/${id}/`;
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-precise-memory-info', '--js-flags=--expose-gc'] });
const p = await (await b.newContext(PHONE ? { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 720 } })).newPage();
if (process.env.QUIET) await p.addInitScript(() => { for (const k of ['log','info','warn','error','debug']) console[k] = () => {}; }); const CDP = await p.context().newCDPSession(p); await CDP.send('Runtime.enable'); const errs = []; p.on('pageerror', e => errs.push(e.message)); let navs = 0; p.on('framenavigated', f => { if (f === p.mainFrame()) navs++; });
const fr = async () => { const h = await p.$('iframe.g:not(.next)'); const f = await h.contentFrame(); await h.dispose(); return f; };
const waitGame = async () => { await p.waitForFunction(() => { try { const f = document.querySelector('iframe.g:not(.next)'); const w = f.contentWindow; return !!(w.game && w.game.nPaintings > 0 && w.__gatesApi && w.__gatesApi.gates); /* a boolean: a returned gates array would be held as a handle and pin the old frame */ } catch (e) { return false; } }, null, { timeout: 120000 }); };
await p.goto(O + '/play/'); await waitGame(); await p.evaluate(() => { window.__marker = 1; });
const log = [], mem = [], fail = []; let here = 'play';
async function walk(to) { const f = await fr(); const r = await f.evaluate(to => { const G = window.__gatesApi, g = G.gates.find(x => x.id === to); if (!g) return { missing: true, have: G.gates.map(x => x.id) };
    const c = window.game.camera; c.position.set(g.face.x + g.inward.x * 0.2, c.position.y, g.face.z + g.inward.z * 0.2); return { ok: true }; }, to);
  console.error("walk", here, to); if (!r.ok) { fail.push(`${here}: no gate to ${to} (${r.have})`); return false; }
  const t0 = Date.now(); try { await p.waitForFunction(to => window.__playShell.current === to && document.querySelectorAll('iframe.g').length === 1, to, { timeout: 60000 }); } catch (e) { fail.push(`${here} -> ${to}: no swap`); return false; }
  await waitGame(); await p.waitForTimeout(1500); await CDP.send('Runtime.discardConsoleEntries'); /* DevTools keeps console args (and so old frames) alive; a real visitor's browser doesn't */ await p.evaluate(async () => { for (let i = 0; i < 4; i++) { window.gc && window.gc(); await new Promise(r => setTimeout(r, 300)); } }); const s = await p.evaluate(() => ({ path: location.pathname, marker: window.__marker, frames: document.querySelectorAll('iframe').length, mem: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null }));
  if (s.path !== PATH(to) || s.marker !== 1 || s.frames !== 1) fail.push(`${here} -> ${to}: ${JSON.stringify(s)}`);
  log.push(`${here}->${to} ${Date.now() - t0}ms`); console.error(log[log.length - 1], s.mem); mem.push(s.mem); here = to; return true; }
const QUICK = process.argv[4] === 'quick'; for (const a of QUICK ? ['orsay'] : IDS.slice(1)) { await walk(a); for (const c of IDS.filter(x => x !== a && x !== 'play')) { await walk(c); await walk(a); } await walk('play'); }
if (process.env.SNAP) { const cdp = await p.context().newCDPSession(p); const fs = await import('fs'); const out = fs.createWriteStream(process.env.SNAP); cdp.on('HeapProfiler.addHeapSnapshotChunk', e => out.write(e.chunk)); await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false }); await new Promise(r => out.end(r)); console.error('snap', JSON.stringify(await cdp.send('Memory.getDOMCounters'))); }
const mtl = await (await fr()).evaluate(() => (window.__gatesApi.gates.find(g => g.id === 'montreal') || {}).url);
if (!/^https:\/\/chase-toole-site/.test(mtl || '')) fail.push('montreal gate url ' + mtl);
await p.goBack(); await p.waitForFunction(() => { const m = /^\/play\/([a-z-]+)\/$/.exec(location.pathname); return window.__playShell.current === (m ? m[1] : 'play') && document.querySelectorAll('iframe.g').length === 1; }, null, { timeout: 60000 }); await waitGame(); const back = await p.evaluate(() => ({ cur: window.__playShell.current, path: location.pathname, marker: window.__marker }));
if (back.marker !== 1 || back.path === '/play/') fail.push('back button: ' + JSON.stringify(back));
// #211: the dungeon's open realm gate into TJ's Living Room (/play/home/, was the dormant 'Portal' arch) and the room's hallway slipgate back:
// both are shell swaps (no reload), and coming back puts you in front of that gate in the dungeon (?via=home), facing into the gate room
if (!QUICK || process.env.HOME_LEG) { here = await p.evaluate(() => window.__playShell.current); if (here !== 'play') await walk('play');
  const hg = await (await fr()).evaluate(() => { const g = window.__gatesApi.gates.find(x => x.id === 'home'); return g ? { url: g.url, dungeon: !!g.dungeon, was: g.was, dormant: window.__gatesApi.dormant.map(d => d.id) } : null; });
  if (!hg || hg.url !== '/play/home/' || hg.dormant.includes('portal')) fail.push('home gate: ' + JSON.stringify(hg));
  else { const t0 = Date.now(); await (await fr()).evaluate(() => { const g = window.__gatesApi.gates.find(x => x.id === 'home'), c = window.game.camera; c.position.set(g.face.x + g.inward.x * 0.2, c.position.y, g.face.z + g.inward.z * 0.2); });
    try { await p.waitForFunction(() => window.__playShell.current === 'home' && document.querySelectorAll('iframe.g').length === 1, null, { timeout: 60000 });
      await p.waitForFunction(() => { try { const w = document.querySelector('iframe.g:not(.next)').contentWindow; return !!(w.game && w.game.nPaintings > 0 && w.__dungeonGate && w.__splat && w.__splat.ready); } catch (e) { return false; } }, null, { timeout: 120000 });
      const s1 = await p.evaluate(() => ({ path: location.pathname, marker: window.__marker, frames: document.querySelectorAll('iframe').length })); log.push(`play->home ${Date.now() - t0}ms`);
      if (s1.path !== '/play/home/' || s1.marker !== 1 || s1.frames !== 1) fail.push('play -> home: ' + JSON.stringify(s1));
      const t1 = Date.now(); await (await fr()).evaluate(async () => { document.getElementById('start')?.click(); const D = window.__dungeonGate, c = window.game.camera; for (let k = 6; k >= 0 && !D.going; k--) { c.position.set(D.pos.x + D.n.x * (0.25 + k * 0.2), c.position.y, D.pos.z + D.n.z * (0.25 + k * 0.2)); await new Promise(r => setTimeout(r, 400)); } });
      await p.waitForFunction(() => window.__playShell.current === 'play' && document.querySelectorAll('iframe.g').length === 1, null, { timeout: 60000 }); await waitGame(); await p.waitForTimeout(800);
      const s2 = await p.evaluate(() => { const w = document.querySelector('iframe.g:not(.next)').contentWindow, g = w.__gatesApi.gates.find(x => x.id === 'home'), c = w.game.camera.position, a = w.__gatesArrived;
        return { path: location.pathname, marker: window.__marker, frames: document.querySelectorAll('iframe').length, arrived: a && a.id, dist: g ? +Math.hypot(c.x - g.face.x, c.z - g.face.z).toFixed(2) : -1, mem: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 0 }; });
      log.push(`home->play ${Date.now() - t1}ms`); mem.push(s2.mem); here = 'play';
      if (s2.path !== '/play/' || s2.marker !== 1 || s2.frames !== 1 || s2.arrived !== 'home' || !(s2.dist > 1 && s2.dist < 2.4)) fail.push('home -> play (back at the gate): ' + JSON.stringify(s2)); else console.error('home leg ok', JSON.stringify(s2));
    } catch (e) { fail.push('home leg: ' + e.message.slice(0, 160)); } } }
const out = { swaps: log.length, topNavigations: navs, back, memMB: { min: Math.min(...mem), max: Math.max(...mem), last: mem[mem.length - 1] }, loads: await p.evaluate(() => window.__playShell.stats.loads.map(l => l.ms)), fail, errs: errs.slice(0, 5) };
const ok = !fail.length && !errs.length; /* reloads would reset window.__marker (checked per swap) */ console.log(JSON.stringify(out), ok ? 'GATES PASS' : 'GATES FAIL'); await b.close(); process.exit(ok ? 0 : 1);
