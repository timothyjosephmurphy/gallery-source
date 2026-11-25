// #267 tour audit: walks the whole guided tour headless (desktop | phone 390x844) at ?tourrate=8. Checks: welcome hologram plays
// with Skip + captions, offer clip + controls overlay, tapping the bot starts the tour, every clip in manifest order, every stop
// reached on open floor; #286: the controls line shows the controls overlay (phone thumbs / desktop keys), each stop glides close to
// 3-4 of its paintings in turn (focused on screen, near), control comes back, and a wandering player is glided back onto the route; countdown ring, captions, silent when muted, exit any time, the forbidden word nowhere.
import { chromium } from 'playwright-core'; import fs from 'node:fs';
const [url, dev = 'desktop'] = process.argv.slice(2);
const MAN = JSON.parse(fs.readFileSync(new URL('../src/tour-manifest.json', import.meta.url))); MAN.clips = MAN.clips.filter(c => !c.skip814); const ORDER = MAN.clips.slice().sort((a, b) => a.seq - b.seq).filter(c => c.file).map(c => c.file); /* #814 route by seq; silent stop has no file */
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const o = dev === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } };
const ctx = await b.newContext(o); const p = await ctx.newPage(); const errs = [], fails = [];
p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/tjm-play-layouts|ERR_FAILED|status of 404|WebSocket connection/.test(m.text())) errs.push(m.text().slice(0, 200)); });
const sep = url.includes('?') ? '&' : '?';
await p.goto(url + sep + 'tourrate=' + (process.env.TOURRATE || 8)); await p.waitForFunction(() => window.game && game.tags && game.tags.ready && window.eggs && window.eggs.drone && window.__tour, null, { timeout: 120000 });
await p.evaluate(() => { document.body.classList.add('portraitok'); document.getElementById('start').style.display = 'none'; });
const t0 = Date.now(); await p.waitForFunction(() => __tour.phase === 'welcome', null, { timeout: 15000 }); const arriveMs = Date.now() - t0;
await p.waitForFunction(() => __tour.state.caption, null, { timeout: 8000 }).catch(() => {});
const w = await p.evaluate(() => ({ skip: getComputedStyle(document.getElementById('tourSkip')).display, cap: __tour.state.caption, frozen: __tour.state.frozen }));
if (w.skip === 'none') fails.push('no Skip button'); if (!w.cap) fails.push('no welcome caption');
await p.waitForFunction(() => __tour.phase === 'offer', null, { timeout: 20000 });
await p.waitForFunction(() => __tour.state.clip, null, { timeout: 5000 }).catch(() => {}); await p.waitForTimeout(200);
const of = await p.evaluate(() => ({ gap: __tour.state.gap, panel: getComputedStyle(document.getElementById('tourOffer')).display, clip: __tour.state.clip, cap: __tour.state.caption, skipped: __tour.S.skipped }));
if (!(of.gap >= 0.9 / (+process.env.TOURRATE || 8) && of.gap < 3)) fails.push('no ~1 s pause before the first bot line: ' + of.gap); if (of.panel === 'none') fails.push('no controls overlay'); if (of.clip !== '01-offer.mp3' && of.clip !== '00-welcome.mp3' /* #809 Maeve welcome line precedes the offer */) fails.push('offer clip not playing: ' + of.clip); if (of.skipped) fails.push('hologram did not play through');
// tap the bot
let ph = 'offer';
for (let k = 0; k < 3 && ph === 'offer'; k++) { const bot = await p.evaluate(() => { const D = eggs.drone, v = D.root.position.clone(); v.y += 0.1; v.project(game.camera); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight, z: v.z }; });
  if (dev === 'phone') await p.touchscreen.tap(bot.x, bot.y); else await p.mouse.click(bot.x, bot.y); await p.waitForTimeout(400); ph = await p.evaluate(() => __tour.phase); }
if (ph !== 'tour') { fails.push('tapping the bot did not start the tour (' + ph + ')'); await p.evaluate(() => __tour.start()); }
// ride it, sampling each stop and mute once
const stops = [], caps = new Set(); let rings = new Set(), muteChecked = null, lastStep = -1, ctlSeen = null, wandered = null;
const introW = { kinds: new Set(), pos: [] };
for (let i = 0; i < 6000; i++) { await p.waitForTimeout(150); const s = await p.evaluate(() => { const T = __tour, st = T.state, g = game, c = g.camera.position, S = T.S;
    let fz = null; if (S.focus && !S.ftow) { const P = S.focus.p, q = P.group.getWorldPosition(P.group.position.clone()), d = Math.hypot(q.x - c.x, q.z - c.z), a = q.clone().project(g.camera); fz = { t: P.data.title, d: +d.toFixed(2), on: Math.abs(a.x) < 0.9 && Math.abs(a.y) < 0.9 && a.z < 1 }; }
    let mural = null; if (S.cur && S.cur.kind === 'stop' && S.view && S.view.st.mural && st.t > 1) { const a = S.view.look.clone().project(g.camera); mural = Math.abs(a.x) < 1 && Math.abs(a.y) < 1 && a.z < 1; }
    const el = document.getElementById('tourCtl'); const ctl = el && getComputedStyle(el).display !== 'none' ? { thumbs: el.querySelectorAll('.th').length, anim: [...el.querySelectorAll('.th')].map(t => getComputedStyle(t).animationName).join(','), shift: /Shift/.test(el.textContent), wasd: /W.*A.*S.*D/.test(el.textContent) } : null;
    return { ...st, order: S.cur && S.cur.to, walk: !!eggs.world.walkable(c.x, c.z), fz, mural, ctlInfo: ctl, ringOn: getComputedStyle(document.getElementById('tourRing')).display !== 'none' }; });
  if (s.caption) caps.add(s.caption); if (s.ringOn) rings.add(s.ring);
  if (s.clip === '02-controls.mp3' && s.ctlInfo && !ctlSeen) ctlSeen = { ...s.ctlInfo, frozen: s.frozen };
  if (s.kind === 'stop') { let k = stops.find(x => x.order === s.order); if (!k) stops.push(k = { order: s.order, walk: true, focus: [], mural: null, freed: false });
    k.walk = k.walk && s.walk; if (s.fz) { const f = k.focus.find(x => x.t === s.fz.t); if (f) { f.d = Math.min(f.d, s.fz.d); f.on = f.on || s.fz.on; } else k.focus.push(s.fz); } if (s.mural !== null) k.mural = s.mural; if (!s.frozen) k.freed = true;
    // wander once: when control comes back at a mid-tour stop, walk the player far off (teleport the TEST player only) and expect a glide back
    if (!s.frozen && wandered === null && s.order >= 6) { wandered = await p.evaluate(() => { const c = game.camera.position, W = eggs.world; for (const r of [7, 6, 5, 4]) for (let a = 0; a < 6.28; a += 0.4) { const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r; if (W.walkable(x, z)) { c.x = x; c.z = z; return { at: __tour.S.cur && __tour.S.cur.to, r }; } } return { at: null }; }); } }
  if (s.step === 6 && muteChecked === null) { await p.evaluate(() => window.__holoToggle && window.__holoToggle()); muteChecked = await p.waitForFunction(() => __tour.state.audioMuted && __tour.state.videoMuted, null, { timeout: 3000 }).then(() => true, () => false); await p.evaluate(() => window.__holoToggle && window.__holoToggle()); }
  if (s.clip === '02-intro.mp3') { introW.kinds.add(s.kind); introW.pos.push(await p.evaluate(() => [game.camera.position.x, game.camera.position.z])); }
  if (s.phase !== 'tour') break; }
const end = await p.evaluate(() => ({ ...__tour.state, frozen: !!game.freeze, reading: !!window.__reading, forbid: new RegExp(String.fromCharCode(68, 77, 84)).test(document.body.innerText + document.title) }));
{ const P = introW.pos, mv = P.length > 1 ? Math.hypot(P[P.length - 1][0] - P[0][0], P[P.length - 1][1] - P[0][1]) : 0; introW.moved = +mv.toFixed(1); if (MAN.clips.some(c => c.file === '02-intro.mp3') && (!introW.kinds.has('walk') || introW.kinds.has('stop') || mv < 1.5)) fails.push('preamble not narrated on the first walk ' + JSON.stringify({ kinds: [...introW.kinds], moved: mv })); }
if (end.phase !== 'ended') fails.push('tour did not end: ' + end.phase);
if (JSON.stringify(end.log.filter(f => f !== '01-offer.mp3')) !== JSON.stringify(ORDER.filter(f => f !== '01-offer.mp3')) /* #809: tapping Tour during Maeve's welcome line skips the offer line */) fails.push('clip order ' + end.log.join(','));
const want = MAN.clips.filter(c => c.type === 'stop').sort((a, b) => a.seq - b.seq).map(c => c.order); // #305: the preamble is narrated on the first walk, not at a stop if (JSON.stringify(end.visited.filter((x, i, a) => a.indexOf(x) === i)) !== JSON.stringify(want)) fails.push('visited ' + end.visited);
const SP = { 3: 4, 13: 4, 16: 4, 9: 4, 7: 4 }; // #815 route
for (const s of stops) { if (!s.walk) fails.push('stop ' + s.order + ' off the floor'); const want = SP[s.order];
  { const seen = (end.focusSeen || {})[s.order]; if (seen) s.focus = Object.entries(seen).map(([t, v]) => ({ t, ...v })); if (end.freed && end.freed[s.order] != null) s.freed = true; }
  if (want) { const got = (end.focusLog[s.order] || []).length; if (got < want) fails.push('stop ' + s.order + ' focused ' + got + '/' + want); if (!s.focus.length || !s.focus.every(f => f.on && f.d < (dev === 'phone' ? 5.2 : 3.4) /* a wide 1.5x painting needs more distance to fit a portrait phone screen */)) fails.push('stop ' + s.order + ' focus not close/on screen ' + JSON.stringify(s.focus)); if (!s.freed) fails.push('stop ' + s.order + ' never returned control'); }
  else if (s.mural === false) fails.push('mural stop not framed'); }
if (![3, 13, 16, 9, 7].every(o => (end.focusLog[o] || []).length >= 3)) fails.push('multi-painting focus missing');
if (!ctlSeen) fails.push('no controls overlay during the controls line'); /* #814: bot leads during the controls line (frozen by design) */ else if (dev === 'phone' ? !(ctlSeen.thumbs >= 1 && /tcDrag/.test(ctlSeen.anim)) /* #304: move pad removed, look-drag only */ : !(ctlSeen.shift && ctlSeen.wasd)) fails.push('controls overlay content ' + JSON.stringify(ctlSeen));
const pull = end.pulls.find(x => x.from > 3); if (!wandered || wandered.at == null) fails.push('could not wander'); else if (!pull) fails.push('no pull back after wandering ' + JSON.stringify(end.pulls));
if (end.glides.some(g => g.L > 1 && g.frames < 4)) fails.push('a stop move looked like a teleport ' + JSON.stringify(end.glides.filter(g => g.frames < 4)));
if (stops.length !== want.length) fails.push('sampled stops ' + stops.map(s => s.order));
if (end.errors.length) fails.push('tour errors ' + end.errors); if (end.frozen || end.reading) fails.push('controls not released at the end');
if (muteChecked !== true) fails.push('not silent when muted'); if (rings.size < 5) fails.push('countdown ring did not count'); if (caps.size < 10 /* #814 shorter route */) fails.push('few captions: ' + caps.size); if (end.forbid) fails.push('forbidden word in DOM');
// exit any time: restart, exit mid-walk
await p.evaluate(() => { __tour.S.phase = 'offer'; __tour.start(); }); await p.waitForTimeout(1500);
const ex = await p.evaluate(() => { __tour.exit(); const c = game.camera.position; return { phase: __tour.phase, frozen: !!game.freeze, walk: !!eggs.world.walkable(c.x, c.z), ring: getComputedStyle(document.getElementById('tourRing')).display }; });
if (ex.phase !== 'exited' || ex.frozen || !ex.walk || ex.ring !== 'none') fails.push('exit failed ' + JSON.stringify(ex));
if (errs.length) fails.push('page errors: ' + errs.slice(0, 3).join(' | '));
console.log(JSON.stringify({ dev, introWalk: introW.moved, arriveMs, welcome: w, offer: of, ctl: ctlSeen, wandered, pulls: end.pulls, focus: end.focusLog, stops: stops.map(s => ({ o: s.order, n: s.focus.length, freed: s.freed })), rings: rings.size, captions: caps.size, muteChecked, end: { phase: end.phase, visited: end.visited, errors: end.errors }, exit: ex }, null, 0));
console.log(fails.length ? 'TOUR AUDIT FAIL\n- ' + fails.join('\n- ') : 'TOUR AUDIT PASS'); await b.close(); process.exit(fails.length ? 1 : 0);
