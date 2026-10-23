// #251 browser audit for the tag gallery (desktop | phone 390x844). Ports the #243 hang audit (true size, frame overlaps,
// plaques at 1.45 m and unblocked, every view spot reachable on foot) and the egg audit's 'painting backed by a wall' check,
// plus: doorway intrusion by any runtime object (eggs, guide bot, gates), DMT nowhere, silent when muted, minimap clear of the HUD.
// Writes the dome/garden colliders to tools/module-colliders.json so the build's doorcheck covers them too.
import { chromium } from 'playwright-core'; import fs from 'node:fs';
const [url, dev = 'desktop'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } };
const p = await (await b.newContext(o)).newPage(); const errs = [];
p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/tjm-play-layouts|ERR_FAILED|status of 404|WebSocket connection to 'wss:/.test(m.text())) errs.push(m.text().slice(0, 200)); });
await p.addInitScript(() => { const A = window.AudioContext; window.__ctxs = []; // every context's output goes through a meter, so 'silent' is measured, not assumed
  window.AudioContext = window.webkitAudioContext = class extends A { constructor(...a) { super(...a); window.__ctxs.push(this); const m = super.createAnalyser(); m.fftSize = 2048; AudioNode.prototype.connect.call(m, this.destination); this.__meter = m; } };
  const c0 = AudioNode.prototype.connect; AudioNode.prototype.connect = function (t, ...r) { if (t && t === this.context.destination && this.context.__meter && this !== this.context.__meter) return c0.call(this, this.context.__meter, ...r); return c0.call(this, t, ...r); };
  window.__level = () => (window.__ctxs || []).map(c => { if (c.state !== 'running') return 0; const a = new Float32Array(2048); c.__meter.getFloatTimeDomainData(a); let m = 0; for (const v of a) m = Math.max(m, Math.abs(v)); return m; }); });
await p.goto(url); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && game.nPaintings > 50 && window.eggs, null, { timeout: 120000 }); await p.waitForTimeout(9000);
const r = await p.evaluate(async () => {
  const g = game, T = g.THREE, P = g.paintings, V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z), out = { n: P.length, size: [], overlap: [], plaqueY: [], blocked: [], unreachable: [], floating: [], doorway: [], dmt: 0, mute: null, hud: [] };
  g.scene.updateMatrixWorld(true);
  const info = P.map(q => { const n = V(q.data.ix, 0, q.data.iz).normalize(); return { q, c: q.group.getWorldPosition(V()), n, t: V(-n.z, 0, n.x) }; });
  // true size: the shown image is never larger than the listed size and keeps its own aspect (fit inside, never stretched)
  for (const a of info) { const d = a.q.data, m = a.q.mesh; const K = d.artScale || 1; /* #292: preview display scale (1.5x), uniform */ if (m.scale.x > d.iw + 1e-3 || m.scale.y > d.ih + 1e-3) out.size.push(d.id + ' larger than listed x' + K); if (d.trueW && (Math.abs(d.iw / d.trueW - K) > 0.01 || Math.abs(d.ih / d.trueH - K) > 0.01)) out.size.push(d.id + ' not uniformly x' + K);
    const im = m.material.map && m.material.map.image; if (im && im.width) { const ia = im.width / im.height, sa = m.scale.x / m.scale.y; if (Math.abs(ia / sa - 1) > 0.035) out.size.push(d.id + ' stretched ' + ia.toFixed(3) + ' vs ' + sa.toFixed(3)); } }
  for (let i = 0; i < info.length; i++) for (let j = i + 1; j < info.length; j++) { const a = info[i], c = info[j]; if (a.n.dot(c.n) < 0.99) continue; const d = V().subVectors(c.c, a.c); if (Math.abs(d.dot(a.n)) > 0.3) continue;
    if (Math.abs(d.dot(a.t)) < (a.q.data.fw + c.q.data.fw) / 2 - 0.01 && Math.abs(d.y) < (a.q.data.fh + c.q.data.fh) / 2 - 0.01) out.overlap.push(a.q.data.id + '/' + c.q.data.id); }
  const ray = new T.Raycaster(); ray.camera = g.camera; const solid = h => h.object.visible && !h.object.isSprite && !h.object.isPoints && h.object.material && !(h.object.material.transparent && h.object.material.opacity < 0.2);
  for (const a of info) { const pl = a.q.plaque; if (!pl || !pl.visible) continue; const pp = pl.getWorldPosition(V()); const dd = a.q.data, fh = dd.fh || dd.h, spans = dd.y - fh / 2 <= 1.45 && 1.45 <= dd.y + fh / 2; /* framed height, same as doorcheck */ /* #292: 1.45 m wherever the painting spans it, else beside its own centre */ if (spans ? Math.abs(pp.y - 1.45) > 0.01 : Math.abs(pp.y - dd.y) > 0.02) out.plaqueY.push(a.q.data.id + ':' + pp.y.toFixed(3));
    const from = pp.clone().addScaledVector(a.n, 1.4); from.y = 1.6; ray.set(from, V().subVectors(pp, from).normalize()); ray.far = from.distanceTo(pp) + 0.05;
    const hit = ray.intersectObjects(g.scene.children, true).find(solid);
    if (hit) { let o = hit.object, ok = false; while (o) { if (o === pl || o === a.q.group) { ok = true; break; } o = o.parent; } if (!ok && hit.distance < ray.far - 0.12) out.blocked.push(a.q.data.id + ' by ' + (hit.object.name || hit.object.type)); } }
  // painting backed by a wall (egg audit 'floating'): a ray straight back from the painting meets a wall within 15 cm
  const walls = []; g.scene.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === 'BoxGeometry' && /roomWall|muralWall/.test(o.name)) walls.push(o); });
  for (const a of info) { ray.set(a.c.clone().addScaledVector(a.n, 0.1), a.n.clone().negate()); ray.far = 0.35; if (!ray.intersectObjects(walls, false).length) out.floating.push(a.q.data.id); }
  // reachable on foot from the start
  const S = 0.25, st = g.camera.position, key = (x, z) => Math.round(x / S) + ',' + Math.round(z / S), seen = new Set([key(st.x, st.z)]), Q = [[Math.round(st.x / S), Math.round(st.z / S)]];
  while (Q.length && seen.size < 600000) { const [i, k] = Q.pop(); for (const [di, dk] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, c = k + dk, kk = a + ',' + c; if (seen.has(kk) || !g.walkable(a * S, c * S)) continue; seen.add(kk); Q.push([a, c]); } }
  for (const a of info) { let ok = false; for (const dd of [1.2, 1.6, 2, 2.6]) { const s2 = a.c.clone().addScaledVector(a.n, dd); if (seen.has(key(s2.x, s2.z))) { ok = true; break; } } if (!ok) out.unreachable.push(a.q.data.id); }
  out.cells = seen.size;
  // every door is reachable on both sides (no sealed door)
  out.doorsUnreachable = g.tags.doors.filter(d => d.kind !== 'gate' && d.kind !== 'checkout' && ![1, -1].every(s => [0.6, 0.9].some(v => seen.has(key(d.x + s * d.nx * v, d.z + s * d.nz * v))))).map(d => d.room + '->' + d.to);
  // runtime objects (eggs, guide bot, props) in a doorway: world boxes vs each door's clear zone, below head height
  const arch = new Set(); for (const n of ['tagsArchitecture']) g.scene.getObjectByName(n)?.traverse(o => arch.add(o));
  const G2 = g.tags.garden || {}; for (const k of ['domes', 'garden']) G2[k] && G2[k].group && G2[k].group.traverse(o => arch.add(o)); P.forEach(q => q.group.traverse(o => arch.add(o)));
  const pos0 = new Map(g.scene.children.map(o => [o, o.position.clone()])); await new Promise(r => setTimeout(r, 2500)); const mov = new Set(); for (const [o, v] of pos0) if (v.distanceTo(o.position) > 0.05) o.traverse(x => mov.add(x)); out.movingSkipped = [...pos0.keys()].filter(o => mov.has(o)).map(o => o.name || o.type); // passers-by (drone, walking eggs, guide bot) are not fixed obstructions
  const props = []; g.scene.traverse(o => { if (!o.isMesh || arch.has(o) || mov.has(o) || !o.visible || o.isInstancedMesh) return; let vis = true; for (let q = o.parent; q; q = q.parent) if (q.visible === false) vis = false; if (!vis) return; const bb = new T.Box3().setFromObject(o); if (bb.isEmpty() || bb.min.y > 2.4 || bb.max.y < 0.15) return; const sz = bb.getSize(V()); if (sz.x > 30 || sz.z > 30) return; props.push({ o, bb }); });
  for (const d of g.tags.doors) { const tx = -d.nz, tz = d.nx; for (const { o, bb } of props) { const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2, hw = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2;
      const u = (cx - d.x) * tx + (cz - d.z) * tz, v = (cx - d.x) * d.nx + (cz - d.z) * d.nz; if (Math.abs(u) - hw < d.width / 2 - 0.05 && Math.abs(v) - hw < 1.0 && !(d.oneSided && v < 0.75 /* the gate's own arch, portal and step */)) out.doorway.push(`${(o.name || o.type) + '<' + (o.parent && (o.parent.name || o.parent.type)) + '<' + (o.parent && o.parent.parent && (o.parent.parent.name || o.parent.parent.type))}@${cx.toFixed(1)},${cz.toFixed(1)} in ${d.room}->${d.to}`); } }
  out.doorway = [...new Set(out.doorway)];
  out.colliders = g.tags.allColliders ? g.tags.allColliders() : [];
  out.dmt = /\bDMT\b/.test(document.documentElement.outerHTML + document.body.innerText) ? 1 : 0;
  out.murals = g.tags.report.murals;
  return out; });
// mute: tap to start the fountain sound, press M (mute), then every audio context must be suspended / closed or fully gained down
await p.evaluate(() => { window.__noNav = true; }); await (dev === 'phone' ? p.touchscreen.tap(o.viewport.width / 2, o.viewport.height * 0.7) : p.mouse.click(o.viewport.width / 2, o.viewport.height * 0.7)).catch(() => {}); await p.waitForTimeout(800);
r.mute = await p.evaluate(async () => { const startMuted = !!game.holo.muted; if (startMuted && window.__holoToggle) window.__holoToggle(); await new Promise(r => setTimeout(r, 300)); if (game.tags.sound && !game.tags.sound.playing) try { game.tags.sound.start(); } catch (e) {} const ct = game.tags.world.rooms.find(r => r.kind === 'court'), c = game.tags.world.colliders.find(c => /fountain/.test(c.kind)) || { x: ct.center[0], z: ct.center[1] }; /* #284: plain courts have no fountain: stand by a courtyard centre */ game.view(c.x + 2.2, c.z, c.x, c.z); await new Promise(r => setTimeout(r, 2500)); window.__dbg = (JSON.stringify({ playing: game.tags.sound && game.tags.sound.playing, keys: game.tags.sound && Object.keys(game.tags.sound), ctx: (window.__ctxs || []).map(c => c.state), lv: window.__level(), pos: [game.camera.position.x, game.camera.position.z], court: [c.x, c.z] })); let before = 0; for (let i = 0; i < 10; i++) { before = Math.max(before, ...window.__level(), 0); await new Promise(r => setTimeout(r, 100)); }
  if (!game.holo.muted && window.__holoToggle) window.__holoToggle(); await new Promise(r => setTimeout(r, 1500)); let after = 0; for (let i = 0; i < 10; i++) { after = Math.max(after, ...window.__level(), 0); await new Promise(r => setTimeout(r, 100)); }
  return { startMuted, muted: !!game.holo.muted, before: +before.toFixed(4), after: +after.toFixed(5), ctxs: (window.__ctxs || []).map(c => c.state) }; });
console.log('DBGSND', await p.evaluate(() => window.__dbg)); r.mute.silent = r.mute.muted && r.mute.before > 1e-4 /* sound really played first */ && r.mute.after < 1e-4;
r.hud = await p.evaluate(() => { const mm = document.querySelector('.mm-wrap'); if (!mm) return ['no minimap']; const a = mm.getBoundingClientRect(), hits = [];
  for (const e of document.querySelectorAll('body *')) { if (e === mm || mm.contains(e) || e.contains(mm)) continue; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0 || e.tagName === 'CANVAS') continue; if (!(cs.position === 'fixed' || cs.position === 'absolute')) continue;
    const q = e.getBoundingClientRect(); if (q.width < 4 || q.height < 4 || q.width > innerWidth * 0.9) continue; if (q.left < a.right - 2 && q.right > a.left + 2 && q.top < a.bottom - 2 && q.bottom > a.top + 2) hits.push((e.id || e.className || e.tagName) + ''); }
  return hits.slice(0, 10); });
fs.writeFileSync(new URL('../tools/module-colliders.json', import.meta.url), JSON.stringify(r.colliders)); const nCol = r.colliders.length; delete r.colliders;
r.pageErrors = errs; r.pass = !r.size.length && !r.overlap.length && !r.plaqueY.length && !r.blocked.length && !r.unreachable.length && !r.floating.length && !r.doorway.length && !r.doorsUnreachable.length && !r.dmt && r.mute.silent && !r.hud.length && !errs.length;
console.log(JSON.stringify({ ...r, colliders: nCol }, null, 0).slice(0, 6000)); console.log(r.pass ? `TAGSAUDIT ${dev} PASS` : `TAGSAUDIT ${dev} FAIL`); await b.close();
