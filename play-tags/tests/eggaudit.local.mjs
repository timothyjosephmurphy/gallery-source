// Egg layout audit (runs the gallery's own painting audit too, after the eggs are installed):
//  - every wall egg sits flat on a real wall, clear of paintings, boards, windows, doorways and gates
//  - floor props are out of doorways and painting viewing zones, and the walkable floor stays connected
//  - the original painting audit (floating / overlapping frames) still passes with the eggs in the scene
// usage: node tests/eggaudit.mjs [url] [desktop|phone]
import { chromium } from '/workspace/play-tags/node_modules/playwright-core/index.mjs';
const URL_ = process.argv[2] || 'http://127.0.0.1:5191/play/', DEV = process.argv[3] || 'desktop';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const o = DEV === 'phone' ? { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 720 } };
const p = await (await b.newContext(o)).newPage(); const errs = [];
p.on("pageerror", e => { if (!/relay\.damus\.io/.test(e.message)) errs.push(e.message); }); p.on('console', m => { if (m.type() === 'error' && !/tjm-play-layouts|ERR_FAILED|status of 404|relay\.damus\.io/.test(m.text())) errs.push(m.text().slice(0, 200)); });
await p.goto(URL_); await p.waitForFunction(() => window.game && game.nPaintings > 0 && window.eggs && (!game.grav || game.grav.loaded), null, { timeout: 120000 }); await p.waitForFunction(() => game.tags && game.tags.report && game.tags.report.eggPasses > 3, null, { timeout: 60000 }); // tags relocates eggs out of view zones on its 0.5 s tick once they spawn: audit the settled layout
const r = await p.evaluate(() => { const T = game.THREE, V = (x, y, z) => new T.Vector3(x, y, z), W = eggs.world, E = eggs.eggs, own = new Set(); game.paintings.forEach(q => q.group.traverse(o => own.add(o)));
  game.scene.updateMatrixWorld(true);
  // ---- 1. the gallery's own audit, verbatim logic, with eggs present
  const walls = []; game.scene.traverse(o => { if (o.isMesh && !own.has(o) && o.geometry && o.geometry.type === 'BoxGeometry' && !(o.material && o.material.transparent)) walls.push(o); });
  const rc = new T.Raycaster(); const floating = [], overlap = []; const P = game.paintings.map(q => ({ d: q.data, w: q.w, h: q.h }));
  for (const { d, w, h } of P) { const n = V(d.ix, 0, d.iz).normalize(), t = V(n.z, 0, -n.x); let miss = 0; for (const u of [-0.48, -0.25, 0, 0.25, 0.48]) for (const v of [-0.45, 0, 0.45]) { const o = V(d.x, d.y + v * h, d.z).addScaledVector(t, u * w).addScaledVector(n, 0.25); rc.set(o, n.clone().negate()); rc.far = 0.6; if (!rc.intersectObjects(walls, false).length) miss++; } if (miss) floating.push([d.id, miss]); }
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const a = P[i], c = P[j]; if (Math.abs(a.d.ix - c.d.ix) > 0.01 || Math.abs(a.d.iz - c.d.iz) > 0.01) continue; const ddx = a.d.x - c.d.x, ddz = a.d.z - c.d.z; const perp = Math.abs(ddx * a.d.ix + ddz * a.d.iz); /* #323: distances measured along / across the wall's own axes (diagonal walls too) */ if (perp > 0.4) continue; const al = Math.abs(ddx * a.d.iz - ddz * a.d.ix); if (al < (a.w + c.w) / 2 + 0.05 && Math.abs(a.d.y - c.d.y) < (a.h + c.h) / 2 + 0.02) overlap.push([a.d.id, c.d.id]); }
  // egg meshes the gallery audit (and gravity gun) would mistake for walls: only the secret room's own walls may be BoxGeometry
  const eggBoxes = []; for (const k in E) { const g = E[k].group; if (!g) continue; g.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === 'BoxGeometry' && !(o.material && o.material.transparent) && k !== 'secret') eggBoxes.push(k + ':' + (o.name || '?')); }); }
  // ---- 2. wall eggs
  const wallMeshes = W.wallMeshes(), gal = W.wallRes.filter(s => s.name.startsWith('gallery:')), wallEggs = [];
  const spots = { untitled4: E.untitled4 && E.untitled4.spot, insanity: E.insanity && E.insanity.spot, notasoup: E.notasoup && E.notasoup.spot, banana: E.banana && E.banana.spot, bobbleheads: E.bobbleheads && E.bobbleheads.spot, spice: E.dune && E.dune.wspot };
  for (const [k, s] of Object.entries(spots)) { if (!s) continue; const t = V(s.n.z, 0, -s.n.x), bad = [];
    for (const u of [-0.48, 0, 0.48]) for (const v of [-0.45, 0, 0.45]) { const o = s.pos.clone().addScaledVector(t, u * s.w).add(V(0, v * s.h, 0)).addScaledVector(s.n, 0.25); rc.set(o, s.n.clone().negate()); rc.far = 0.6; const h = rc.intersectObjects(wallMeshes, false)[0]; if (!h || h.distance < 0.17 || h.distance > 0.33) bad.push('off-wall'); }
    for (const q of game.paintings) { const d = q.data; if (V(d.ix, 0, d.iz).dot(s.n) < 0.99) continue; const dx = d.x - s.pos.x, dz = d.z - s.pos.z; if (Math.abs(dx * s.n.x + dz * s.n.z) > 0.4) continue; if (Math.abs(dx * t.x + dz * t.z) < (q.w + s.w) / 2 + 0.1 && Math.abs(d.y - s.pos.y) < (q.h + s.h) / 2 + 0.05) bad.push('painting ' + d.id); }
    for (const g of gal) { if (g.n.dot(s.n) < 0.99) continue; const dx = g.pos.x - s.pos.x, dz = g.pos.z - s.pos.z; if (Math.abs(dx * s.n.x + dz * s.n.z) < 0.4 && Math.abs(dx * t.x + dz * t.z) < (g.w + s.w) / 2 && Math.abs(g.pos.y - s.pos.y) < (g.h + s.h) / 2) bad.push(g.name); }
    const f = s.pos.clone().addScaledVector(s.n, 0.8); if (W.nearDoor(f.x, f.z, 0.4)) bad.push('doorway'); if (!game.walkable(f.x, f.z)) bad.push('front not walkable');
    wallEggs.push([k, [+s.pos.x.toFixed(1), +s.pos.y.toFixed(1), +s.pos.z.toFixed(1)], bad.length ? [...new Set(bad)] : 'ok']); }
  // ---- 3. floor props + connectivity
  const floorEggs = []; const gates = [game.GATE, game.CHK].filter(Boolean).map(g => g.pos);
  for (const c of W.colliders) { if (c.off) continue; const bad = []; if (W.nearDoor(c.x, c.z, c.r + 0.3)) bad.push('doorway'); if (W.inPaintZone(c.x, c.z, Math.max(0, c.r - 0.2))) bad.push('painting view zone'); if (gates.some(g => Math.hypot(g.x - c.x, g.z - c.z) < 2.5 + c.r)) bad.push('gate');
    if (!game.walkable(c.x, c.z)) bad.push('outside the floor'); floorEggs.push([c.name, +c.x.toFixed(1), +c.z.toFixed(1), c.r, bad.length ? bad : 'ok']); }
  // BFS over the 0.5 m nav grid: cells reachable from the start, with and without the eggs' colliders
  const blocked = (x, z) => W.colliders.some(c => !c.off && Math.hypot(c.x - x, c.z - z) < c.r + 0.3);
  const bfs = withEggs => { const seen = new Uint8Array(W.NX * W.NZ), q = []; const s = W.cell(10, 20) >= 0 ? W.cell(game.camera.position.x, game.camera.position.z) : 0; const start = W.walk[s] ? s : W.walk.findIndex(v => v); q.push(start); seen[start] = 1; let n = 0;
    while (q.length) { const k = q.pop(); n++; const i = k % W.NX, j = (k - i) / W.NX; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, c = j + dj; if (a < 0 || c < 0 || a >= W.NX || c >= W.NZ) continue; const kk = c * W.NX + a; if (seen[kk] || !W.walk[kk]) continue; if (withEggs && blocked(W.cx(a), W.cz(c))) continue; seen[kk] = 1; q.push(kk); } } return { n, seen }; };
  const A0 = bfs(false), A1 = bfs(true);
  // every painting's viewing spot (1.5 m in front) and every door stays reachable
  const lost = []; for (const q of game.paintings) { const d = q.data, x = d.x + d.ix * 1.5, z = d.z + d.iz * 1.5, k = W.cell(x, z); if (k >= 0 && A0.seen[k] && !A1.seen[k]) lost.push('painting ' + d.id); }
  for (const d of W.doors) { const k = W.cell((d.minX + d.maxX) / 2, (d.minZ + d.maxZ) / 2); if (k >= 0 && A0.seen[k] && !A1.seen[k]) lost.push('door'); }
  const txt = document.body.innerText + ' ' + JSON.stringify(Object.keys(E));
  return { paintings: P.length, floating, overlap, eggBoxes, wallEggs, floorEggs, reach: { before: A0.n, after: A1.n, lostCells: A0.n - A1.n, lost }, skipped: eggs.skipped, errors: eggs.errors, bannedWordInDom: new RegExp('\\b' + ['D','M','T'].join('') + '\\b', 'i').test(txt) }; });
const fail = r.floating.length || r.overlap.length || r.eggBoxes.length || r.wallEggs.some(w => w[2] !== 'ok') || r.floorEggs.some(f => f[4] !== 'ok') || r.reach.lost.length || r.bannedWordInDom || r.errors.length || errs.length;
console.log(JSON.stringify({ dev: DEV, pass: !fail, ...r, pageErrors: errs }, null, 1)); await b.close(); process.exit(fail ? 1 : 0);
