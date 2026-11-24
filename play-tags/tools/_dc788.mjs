// #251 doorway / path check (runs before every build; exit 1 fails it). TJ: no column or any other object may ever stand in a
// doorway or block a path. Also: no wall across a door, every painting/plaque view zone clear, plaques at 1.45 m, no frame overlaps.
import fs from 'node:fs';
import { makeWorld, segDist } from '../src/tags-world.js';
const C = JSON.parse(fs.readFileSync(new URL('../src/catalog.json', import.meta.url))), W = makeWorld(C.layout.tags, C.paintings), bad = [];
fs.writeFileSync("/tmp/doors788.json", JSON.stringify(W.doors.map(d=>[d.x,d.z,d.width,d.nx,d.nz])));
const CF = new URL('./module-colliders.json', import.meta.url); // dome + garden colliders, dumped from the live scene by tests/tagsaudit.mjs
const extraCols = fs.existsSync(CF) ? JSON.parse(fs.readFileSync(CF)).filter(c => !W.colliders.some(w => Math.abs(w.x - c.x) < 1e-3 && Math.abs(w.z - c.z) < 1e-3)) : [];
if (!fs.existsSync(CF)) console.log('note: no module-colliders.json yet (run tests/tagsaudit.mjs)');
for (const c of [...W.colliders, ...extraCols]) { const id = `${c.kind || 'prop'}@${c.x.toFixed(2)},${c.z.toFixed(2)}`;
  if (W.inDoorZone(c.x, c.z, c.r)) bad.push('in doorway: ' + id);
  if (W.inPath(c.x, c.z, c.r) && !/fountain/.test(c.kind)) bad.push('blocks path: ' + id);
  if (W.inView(c.x, c.z, c.r)) bad.push('blocks art/plaque: ' + id); }
for (const d of W.doors) for (const w of W.walls) { if (segDist(d.x, d.z, w.x0, w.z0, w.x1, w.z1) < d.width / 2 - 0.05) bad.push(`wall across door ${d.room}->${d.to}`); }
for (const d of W.doors) for (const w of W.walls.filter(w => w.free)) for (const v of [0.6, 1.2]) for (const s of [1, -1]) { const x = d.x + s * d.nx * v, z = d.z + s * d.nz * v; if (!d.oneSided || s > 0) if (segDist(x, z, w.x0, w.z0, w.x1, w.z1) < 0.4) bad.push(`free wall ${w.id} in front of door ${d.room}->${d.to}`); }
for (const p of W.paths) { const L = Math.hypot(p.x1 - p.x0, p.z1 - p.z0); for (let t = 0; t <= L; t += 0.25) { const x = p.x0 + (p.x1 - p.x0) * t / L, z = p.z0 + (p.z1 - p.z0) * t / L;
  for (const w of W.walls) if (segDist(x, z, w.x0, w.z0, w.x1, w.z1) < Math.min(0.5, p.width / 2) - 0.05 && !W.doors.some(d => Math.hypot(d.x - x, d.z - z) < 1)) { bad.push(`wall ${w.room}/${w.k ?? w.id} on path at ${x.toFixed(1)},${z.toFixed(1)}`); break; } } }
// #292: a plaque sits at 1.45 m whenever its painting spans that height; in a salon column it sits beside its own painting's centre
for (const a of W.art.filter(a => a.kind === 'plaque' || a.kind === 'brass-plaque')) { const pa = a.kind === 'plaque' && W.art.find(q => q.kind === 'painting' && q.id + ':plaque' === a.id);
  const ok = !pa || (pa.y - pa.h / 2 <= 1.45 && 1.45 <= pa.y + pa.h / 2) ? Math.abs(a.y - 1.45) <= 0.005 : (Math.abs(a.y - pa.y) <= 0.02 || Math.abs(a.y - 1.45) <= 0.005); if (!ok) bad.push('plaque not at 1.45 m / beside its painting: ' + a.id); }
const A = W.art.filter(a => a.kind !== 'projection'); for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) { const a = A[i], b = A[j]; if (a.ix * b.ix + a.iz * b.iz < 0.99) continue;
  const dx = b.x - a.x, dz = b.z - a.z; if (Math.abs(dx * a.ix + dz * a.iz) > 0.3) continue; const du = Math.abs(dx * a.iz - dz * a.ix), dy = Math.abs(a.y - b.y);
  if (du < (a.w + b.w) / 2 - 0.01 && dy < (a.h + b.h) / 2 - 0.01) bad.push(`overlap ${a.id} / ${b.id}`); }
for (const a of W.art.filter(a => a.kind === 'painting')) for (const d of W.doors) { const v = (a.x - d.x) * d.nx + (a.z - d.z) * d.nz, u = Math.abs((a.x - d.x) * -d.nz + (a.z - d.z) * d.nx); if (Math.abs(v) < 0.3 && u < d.width / 2 + a.w / 2 - 0.01) bad.push(`painting in doorway ${a.id} ${JSON.stringify({x:a.x,z:a.z,w:a.w,d:{x:d.x,z:d.z,nx:d.nx,nz:d.nz,width:d.width,room:d.room,to:d.to,kind:d.kind}})}`); }
// #352: the courtyard-edge fence never crosses a door, a path or a viewing spot
{ const nf = (x, z, m) => (W.fences || []).some(f => segDist(x, z, f.x0, f.z0, f.x1, f.z1) < m);
  for (const d of W.doors) if (nf(d.x, d.z, d.width / 2 + 0.3)) bad.push(`fence across door ${d.room}->${d.to}`);
  for (const p of W.paths) { const L = Math.hypot(p.x1 - p.x0, p.z1 - p.z0); for (let t = 0; t <= L; t += 0.25) if (nf(p.x0 + (p.x1 - p.x0) * t / L, p.z0 + (p.z1 - p.z0) * t / L, p.width / 2)) { bad.push(`fence blocks path ${p.room || ''}`); break; } }
  for (const a of W.art) if (nf(a.x + a.ix * 1.5, a.z + a.iz * 1.5, 0.5)) bad.push('fence in view of ' + a.id);
  console.log(`fence: ${(W.fences || []).length} segments`); }
// no dead ends: room graph (doors) must give every node 2+ exits and have no bridges (every route on a loop)
const G = new Map(), add = (a, b) => { if (!G.has(a)) G.set(a, new Set()); if (!G.has(b)) G.set(b, new Set()); G.get(a).add(b); G.get(b).add(a); };
const nearCourt = d => { if (!C.layout.tags.courtyards.length) return 'hub'; /* #774 honeycomb: inner rooms open straight onto the pavilion */ let b = null, bd = 1e9; for (const c of C.layout.tags.courtyards) { const q = Math.hypot(d.x - c.center[0], d.z - c.center[1]); if (q < bd) { bd = q; b = c.id; } } return b; };
const nearOuter = d => { let b = null, bd = 1e9; for (const c of C.layout.tags.outerCourts) { const q = Math.hypot(d.x - c.center[0], d.z - c.center[1]); if (q < bd) { bd = q; b = c.id; } } if (C.layout.tags.grounds && bd > 9.5) return 'grounds'; return b; }; // #774: lawn round the honeycomb
if (C.layout.tags.grounds) for (const o of C.layout.tags.outerCourts) add(o.id, 'grounds'); // courts open onto the lawn
for (const d of W.doors) { if (d.kind === 'room') add(d.room, d.to); else if (d.kind === 'inner') add(d.room, nearCourt(d)); else if (d.kind === 'outer') add(d.room, nearOuter(d)); }
for (const c of C.layout.tags.courtyards) add('hub', c.id); // open colonnade ground: every court opens onto the pavilion band
const cs = C.layout.tags.courtyards; for (let i = 0; i < cs.length; i++) add(cs[i].id, cs[(i + 1) % cs.length].id); // and onto its neighbours round the ring
const ANNEX = new Set(C.layout.tags.rooms.filter(r => r.annex || r.entry /* #778 START entry room: one portal door to H11 */).map(r => r.id).concat((C.layout.tags.openCourts || []).map(o => o.id) /* #779 H1 courtyard: one-door open-air side space */)); // #310: the Paul Murphy annex is a deliberate one-door side room
const deadEnds = [...G].filter(([k, v]) => v.size < 2 && !ANNEX.has(k)).map(([k]) => k);
let bridges = 0; { let t = 0; const tin = new Map(), low = new Map(); const dfs = (u, p) => { tin.set(u, ++t); low.set(u, t); for (const v of G.get(u)) { if (v === p) continue; if (tin.has(v)) low.set(u, Math.min(low.get(u), tin.get(v))); else { dfs(v, u); low.set(u, Math.min(low.get(u), low.get(v))); if (low.get(v) > tin.get(u) && !ANNEX.has(v)) { bridges++; bad.push('bridge (dead-end route) ' + u + '-' + v); } } } }; dfs('hub', null);
  for (const k of G.keys()) if (!tin.has(k)) bad.push('unreachable node ' + k); }
for (const k of deadEnds) bad.push('dead end: ' + k);
let wallChecked = 0;
for (const a of W.art.filter(a => a.kind === 'painting' || a.kind === 'plaque')) { const segs = W.walls.filter(w => w.room === a.room && Math.abs(w.nx * -a.ix + w.nz * -a.iz - 1) < 0.01);
  if (segs.length) wallChecked++;
  const ok = segs.some(w => { const L = Math.hypot(w.x1 - w.x0, w.z1 - w.z0), tx = (w.x1 - w.x0) / L, tz = (w.z1 - w.z0) / L, u = (a.x - w.x0) * tx + (a.z - w.z0) * tz, v = Math.abs((a.x - w.x0) * w.nx + (a.z - w.z0) * w.nz); return v < 0.15 && u - a.w / 2 > -0.02 && u + a.w / 2 < L + 0.02; });
  if (segs.length && !ok) bad.push('off its wall / over a door gap: ' + a.id); }
// #269: every frame hugs its image: picture area aspect within 1% of the served image, even moulding all round, no letterbox
const RDF = new URL('./realdims.json', import.meta.url), RD = fs.existsSync(RDF) ? JSON.parse(fs.readFileSync(RDF)) : {}; let aspectChecked = 0;
for (const p of C.paintings) { const r = RD[p.id]; if (r && r.hiPx) r.px = r.hiPx; if (!r || !r.px) { bad.push('no served image size for ' + p.id); continue; } aspectChecked++;
  const ia = r.px[0] / r.px[1];
  if (Math.abs((p.w / p.h) / ia - 1) > 0.01) bad.push(`image aspect off >1%: ${p.id} ${(p.w / p.h).toFixed(3)} vs ${ia.toFixed(3)}`);
  if (Math.abs((p.iw / p.ih) / ia - 1) > 0.01 || Math.abs(p.w - p.iw) > 1e-3 || Math.abs(p.h - p.ih) > 1e-3) bad.push('letterboxed (picture smaller than its frame opening): ' + p.id);
  if (Math.abs((p.fw - p.w) - (p.fh - p.h)) > 0.01) bad.push('uneven frame moulding: ' + p.id); }
const out = { aspectChecked, nodes: G.size, deadEnds: deadEnds.length, bridges, wallChecked, doors: W.doors.length, paths: W.paths.length, colliders: W.colliders.length + extraCols.length, columns: W.columns.length, columnsLeftOut: W.skipped.length, problems: bad.length };
console.log(JSON.stringify(out)); [...new Set(bad)].slice(0, 40).forEach(b => console.log(' -', b)); console.log(bad.length ? 'DOORCHECK FAIL' : 'DOORCHECK PASS'); process.exit(bad.length ? 1 : 0);
