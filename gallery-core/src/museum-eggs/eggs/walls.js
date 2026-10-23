// Wall eggs: 5 (definition of insanity), 6 (not a soup), 9 (Untitled #4 + audio guide), 13 (Hayek & Keynes bobbleheads)
import { THREE, V, builder, MAT, plaque, canvasTex, rand, pick, clamp } from '../kit.js';
import { SCRIPT } from '../untitled4-script.js';
const mount = (E, spot, name) => { const g = new THREE.Group(); g.name = name; g.position.copy(spot.pos); g.rotation.y = spot.yaw; E.scene.add(g); E.world.reserveWall(spot, name); return g; };
const frameGeo = (w, h, b = 0.04, c = 0x2a241d, depth = 0.03) => { const f = builder(); f.box(w + 2 * b, b, depth, c, 0, h / 2 + b / 2, depth / 2); f.box(w + 2 * b, b, depth, c, 0, -h / 2 - b / 2, depth / 2); f.box(b, h, depth, c, -w / 2 - b / 2, 0, depth / 2); f.box(b, h, depth, c, w / 2 + b / 2, 0, depth / 2); f.box(w, h, 0.006, 0x1a1612, 0, 0, 0.003); return f; };

// ---- 5. 'Did I ever tell you the definition of insanity?' between two identical copies of one small TJ painting ----
export function eggInsanity(E) {
  const ps = (E.ctx.paintings || []).filter(p => p.data && p.data.w > 0.15 && p.data.w < 0.45 && p.data.h < 0.45 && p.mesh);
  if (!ps.length) return null; ps.sort((a, b) => a.data.w * a.data.h - b.data.w * b.data.h); const p = ps[0], w = p.data.w, h = p.data.h, pw = 0.46;
  const W = 2 * (w + 0.1) + pw + 0.5, spot = E.world.findWallSpot({ w: W, h: Math.max(h, 0.2) + 0.25, y: 1.5, seed: E.seed + 51, spread: 8 }); if (!spot) return null;
  const g = mount(E, spot, 'egg-insanity'); const mats = [];
  for (const s of [-1, 1]) { const x = s * (pw / 2 + 0.2 + w / 2); const fr = frameGeo(w, h, 0.03).mesh(MAT.lam); fr.position.set(x, 0, 0); g.add(fr);
    const m = new THREE.MeshBasicMaterial({ color: 0x5e5040, toneMapped: false }); mats.push(m); const c = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); c.position.set(x, 0, 0.032); g.add(c);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(Math.min(0.3, w * 0.7), 0.025, 0.04).toNonIndexed(), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.8, 1.2) })); bar.position.set(x, h / 2 + 0.1, 0.06); g.add(bar); }
  const pl = plaque(['Did I ever tell you the definition of insanity?', 'Hanging the same painting twice.'], pw, 0.2, { brass: true, size: 30, italic: true }); pl.position.set(0, -0.02, 0.012); g.add(pl);
  { const b = builder(); b.box(pw + 0.02, 0.22, 0.01, 0x6d5218, 0, -0.02, 0.005); const bm = b.mesh(MAT.shiny); g.add(bm); }
  let tex = null; const grab = () => { const t = p.baseTex || (p.mesh.material.map && p.mesh.material.map.image ? p.mesh.material.map : null); if (t && t !== tex) { tex = t; mats.forEach(m => { m.map = t; m.color.set(0xffffff); m.needsUpdate = true; }); } };
  let tt = 0; return { name: 'insanity', group: g, anchor: spot.pos, spot, update(dt) { if (!tex && (tt -= dt) < 0) { tt = 1; grab(); } }, painting: p.data.id, spot,
    view: () => ({ from: spot.pos.clone().addScaledVector(spot.n, 1.15).setY(1.5), to: spot.pos.clone() }) };
}

// ---- 6. a framed picture of a plaid steel soup thermos: 'Ceci n'est pas une soupe.' ----
export function eggMagritte(E) {
  const w = 0.72, h = 0.92, spot = E.world.findWallSpot({ w: w + 0.25, h: h + 0.35, y: 1.62, seed: E.seed + 61, spread: 8 }); if (!spot) return null;
  const g = mount(E, spot, 'egg-not-a-soup');
  const t = canvasTex(576, 736, (x, W, H) => {
    const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#e9dcb8'); bg.addColorStop(1, '#d9c99c'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
    const cx = W / 2, top = 120, bw = 190, bh = 380; x.save(); x.translate(cx, 0);
    // steel cup-cap and shoulder
    const steel = (y0, y1, w0) => { const gr = x.createLinearGradient(-w0 / 2, 0, w0 / 2, 0); gr.addColorStop(0, '#6f757c'); gr.addColorStop(0.35, '#eef1f4'); gr.addColorStop(0.55, '#a9b0b8'); gr.addColorStop(1, '#5d636a'); x.fillStyle = gr; x.fillRect(-w0 / 2, y0, w0, y1 - y0); };
    steel(top - 70, top - 8, bw * 0.78); x.fillStyle = '#4a4f55'; x.fillRect(-bw * 0.39, top - 14, bw * 0.78, 6); steel(top - 8, top + 22, bw * 0.92);
    // plaid body (rounded)
    x.beginPath(); x.roundRect(-bw / 2, top + 22, bw, bh, 26); x.save(); x.clip(); x.fillStyle = '#a3201e'; x.fillRect(-bw / 2, top, bw, bh + 40);
    x.globalAlpha = 0.55; x.fillStyle = '#123d2a'; for (let k = -2; k < 4; k++) { x.fillRect(-bw / 2 + k * 64 + 20, top, 26, bh + 40); x.fillRect(-bw / 2, top + 30 + k * 72 + 70, bw, 26); }
    x.globalAlpha = 0.6; x.fillStyle = '#16244a'; for (let k = -2; k < 4; k++) { x.fillRect(-bw / 2 + k * 64 + 50, top, 8, bh + 40); x.fillRect(-bw / 2, top + 100 + k * 72 + 30, bw, 8); }
    x.globalAlpha = 0.5; x.fillStyle = '#e8d070'; for (let k = -2; k < 4; k++) { x.fillRect(-bw / 2 + k * 64 + 6, top, 3, bh + 40); x.fillRect(-bw / 2, top + 52 + k * 72 + 60, bw, 3); }
    x.globalAlpha = 1; const sh = x.createLinearGradient(-bw / 2, 0, bw / 2, 0); sh.addColorStop(0, 'rgba(0,0,0,.45)'); sh.addColorStop(0.3, 'rgba(255,255,255,.12)'); sh.addColorStop(0.45, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.5)'); x.fillStyle = sh; x.fillRect(-bw / 2, top, bw, bh + 40); x.restore();
    steel(top + bh, top + bh + 26, bw * 0.96); x.restore();
    x.fillStyle = 'rgba(60,40,20,.18)'; x.beginPath(); x.ellipse(cx + 12, top + bh + 34, bw * 0.62, 12, 0, 0, 7); x.fill();
    x.fillStyle = '#1a1410'; x.font = 'italic 54px "Brush Script MT","Segoe Script","Lucida Handwriting",cursive'; x.textAlign = 'center'; x.fillText("Ceci n'est pas une soupe.", cx, H - 70, W - 50); });
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); pic.position.z = 0.034; g.add(pic);
  g.add(frameGeo(w, h, 0.055, 0x9a7a3a, 0.04).mesh(MAT.shiny));
  const lab = plaque(['La Trahison du Déjeuner', 'Oil on canvas, 2026'], 0.2, 0.0625, { title: true, size: 40, align: 'left' }); lab.position.set(w / 2 + 0.2, -0.25, 0.008); g.add(lab);
  return { name: 'notasoup', group: g, anchor: spot.pos, spot, view: () => ({ from: spot.pos.clone().addScaledVector(spot.n, 1.9).setY(1.6), to: spot.pos.clone() }) };
}

// ---- 9. 'Untitled #4': a blank canvas with a press-to-play audio guide (TTS + captions) ----
export function eggUntitled4(E) {
  const w = 1.1, h = 1.4, W = w + 0.9, spot = E.world.findWallSpot({ w: W, h: h + 0.2, y: 1.7, seed: E.seed + 91, spread: 8 }); if (!spot) return null;
  const g = mount(E, spot, 'egg-untitled4'); g.position.addScaledVector(spot.t, -0.3);
  const can = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04).toNonIndexed(), new THREE.MeshLambertMaterial({ map: canvasTex(256, 320, (x, A, B) => { x.fillStyle = '#f7f6f2'; x.fillRect(0, 0, A, B); for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '200,196,186'},.12)`; x.fillRect(Math.random() * A, Math.random() * B, 1, 1); } }), emissive: 0x2a2a28 }));
  can.position.z = 0.02; g.add(can);
  const lab = plaque(['Untitled #4', 'Gesso on canvas. Price on request.'], 0.2, 0.0625, { title: true, size: 40, align: 'left' }); lab.position.set(w / 2 + 0.42, -0.08, 0.008); g.add(lab);
  // audio guide box with a big play button
  const guide = new THREE.Group(); guide.position.set(w / 2 + 0.42, -0.42, 0); g.add(guide);
  { const b = builder(); b.box(0.24, 0.3, 0.05, 0x1d1d22, 0, 0, 0.025); b.cyl(0.055, 0.055, 0.02, 20, 0x2a2a30, 0, 0.03, 0.055, Math.PI / 2); guide.add(b.mesh(MAT.shiny)); }
  const btnMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 1.4, 0.4) }); const tri = new THREE.Mesh(new THREE.CircleGeometry(0.03, 3), btnMat); tri.position.set(0.004, 0.03, 0.067); guide.add(tri);
  const gl = plaque(['AUDIO GUIDE', 'Press to play'], 0.2, 0.08, { bg: '#1d1d22', ink: '#f2e6c8', edge: '#555', size: 46, title: true }); gl.position.set(0, -0.09, 0.052); guide.add(gl);
  let play = null;
  function stop() { if (!play) return; play.dead = true; try { if (play.tts) speechSynthesis.cancel(); } catch (e) {} clearTimeout(play.timer); E.O.caption('', 0); play = null; tri.geometry.dispose(); tri.geometry = new THREE.CircleGeometry(0.03, 3); btnMat.color.setRGB(0.2, 1.4, 0.4); }
  function start() { stop(); const tts = 'speechSynthesis' in window && !E.ctx.isMuted(); const me = play = { i: 0, tts, dead: false, t0: performance.now() };
    tri.geometry.dispose(); tri.geometry = new THREE.CircleGeometry(0.03, 4); btnMat.color.setRGB(1.6, 0.3, 0.2); E.found('untitled4');
    let voice = null; if (tts) { try { const vs = speechSynthesis.getVoices(); voice = vs.find(v => /en-GB/i.test(v.lang) && /male|daniel|arthur|george/i.test(v.name)) || vs.find(v => /en-GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null; } catch (e) {} }
    const next = () => { if (me.dead) return; if (me.i >= SCRIPT.length) { me.done = (performance.now() - me.t0) / 1000; E.lastUntitled = me.done; setTimeout(() => { if (play === me) stop(); }, 600); return; }
      const line = SCRIPT[me.i++]; E.O.caption(line, 30); const words = line.split(/\s+/).length, dur = words * 0.37 + 0.45;
      if (me.tts && !E.ctx.isMuted()) { try { const u = new SpeechSynthesisUtterance(line); if (voice) u.voice = voice; u.rate = 0.94; u.pitch = 0.85; u.volume = 0.35; let fired = false; const t0 = performance.now(); const go = bad => { if (fired) return; fired = true; clearTimeout(me.timer); const el = performance.now() - t0;
            if (bad === true || el < dur * 400) { me.tts = false; me.timer = setTimeout(next, Math.max(0, dur * 1000 - el)); } else next(); }; // no voice / speech blocked: keep timed captions
          u.onend = () => go(); u.onerror = () => go(true); me.timer = setTimeout(go, dur * 1000 + 2500); speechSynthesis.speak(u); return; } catch (e) { me.tts = false; } }
      if (me.tts && E.ctx.isMuted()) { try { speechSynthesis.cancel(); } catch (e) {} me.tts = false; }
      me.timer = setTimeout(next, dur * 1000); };
    next(); }
  const toggle = () => play ? stop() : start();
  E.clicks.add(guide, toggle, { reach: 3 }); E.clicks.add(can, toggle, { reach: 3 });
  let away = 0;
  return { name: 'untitled4', group: g, anchor: spot.pos, spot, toggle, stop, get playing() { return !!play; }, get line() { return play ? play.i : -1; },
    update(dt) { if (play && E.cam.distanceTo(g.position) > 14) { if ((away += dt) > 3) stop(); } else away = 0; if (play && play.tts && E.ctx.isMuted()) { try { speechSynthesis.cancel(); } catch (e) {} play.tts = false; } },
    view: () => ({ from: spot.pos.clone().addScaledVector(spot.n, 2.6).setY(1.6), to: spot.pos.clone().setY(1.4) }) };
}

// ---- 13. Hayek and Keynes bobbleheads on a shelf, nodding and arguing ----
const QUIPS = [['K', 'In the long run, we are all bobbleheads.'], ['H', 'Nobody designed this shelf, and yet here we are.'], ['K', 'Just print more gift-shop vouchers. Demand will follow.'], ['H', 'You cannot price a banana by committee, John.'],
  ['K', 'Animal spirits! Have you seen those elves?'], ['H', 'Spontaneous order. Nobody told them to scrub.'], ['K', 'The museum should spend its way out of the cake shortage.'], ['H', 'The cake is a lie. So is your multiplier.'],
  ['K', 'When the facts change, I change my bobble.'], ['H', 'You nod at everything. I nod at prices.'], ['K', 'Aggregate demand for soup is clearly too low.'], ['H', 'Your stimulus is soup thrown at a painting.']];
export function eggBobbleheads(E) {
  const spot = E.world.findWallSpot({ w: 0.95, h: 0.6, y: 1.25, seed: E.seed + 131, spread: 8 }); if (!spot) return null;
  const g = mount(E, spot, 'egg-bobbleheads'); g.position.y = 0;
  { const b = builder(); b.box(0.92, 0.035, 0.24, 0x6b4a2e, 0, 1.0, 0.12); for (const s of [-1, 1]) { b.box(0.03, 0.14, 0.02, 0x2a2a2a, s * 0.36, 0.93, 0.01); b.box(0.03, 0.02, 0.18, 0x2a2a2a, s * 0.36, 0.865, 0.09, -0.6); } g.add(b.mesh(MAT.lam)); }
  const make = (who, x) => { const bob = new THREE.Group(); bob.position.set(x, 1.018, 0.12); g.add(bob); const b = builder(), suit = who === 'H' ? 0x3d3f45 : 0x1f2a44, skin = 0xf0c8a8;
    b.cyl(0.07, 0.075, 0.03, 16, 0x161616, 0, 0.015, 0); b.cyl(0.045, 0.06, 0.12, 10, suit, 0, 0.09, 0); b.box(0.02, 0.06, 0.003, 0xf4f4f4, 0, 0.12, 0.05); b.box(0.012, 0.05, 0.004, who === 'H' ? 0x6a1a1a : 0x2a5a2a, 0, 0.115, 0.053);
    b.cyl(0.006, 0.006, 0.05, 6, 0x999999, 0, 0.17, 0); bob.add(b.mesh(MAT.lam));
    const nm = plaque([who === 'H' ? 'HAYEK' : 'KEYNES'], 0.1, 0.022, { bg: '#d8b048', ink: '#221a08', size: 70, edge: '#6d5218' }); nm.position.set(0, 0.016, 0.0752); bob.add(nm);
    const head = new THREE.Group(); head.position.y = 0.19; bob.add(head); const hb = builder(); hb.sph(0.075, 14, 10, skin, 0, 0.06, 0, 0.92, who === 'K' ? 1.12 : 1.0, 0.95);
    for (const s of [-1, 1]) hb.sph(0.008, 6, 4, 0x111111, s * 0.024, 0.075, 0.066);
    if (who === 'H') { hb.sph(0.077, 12, 6, 0xd8d8d4, -0.004, 0.085, -0.008, 0.95, 0.62, 0.97); hb.box(0.04, 0.008, 0.008, 0x9a9a96, 0, 0.042, 0.07); for (const s of [-1, 1]) hb.tor(0.016, 0.003, 4, 12, 0x111111, s * 0.025, 0.075, 0.07); hb.box(0.012, 0.003, 0.003, 0x111111, 0, 0.077, 0.075); }
    else { hb.sph(0.074, 12, 6, 0x6a5a48, 0, 0.07, -0.02, 0.96, 0.85, 0.9); hb.sph(0.03, 8, 6, 0x4a3426, 0, 0.04, 0.066, 1.3, 0.45, 0.5); hb.sph(0.012, 6, 4, skin, 0, 0.06, 0.075); }
    head.add(hb.mesh(MAT.lam)); return { bob, head, nod: 0, ph: Math.random() * 6 }; };
  const H = make('H', -0.2), K = make('K', 0.2); const st = { i: 0, t: 2 };
  return { name: 'bobbleheads', group: g, anchor: spot.pos, spot, H, K,
    update(dt, tm) { for (const b of [H, K]) { b.nod = Math.max(0, b.nod - dt * 0.5); b.head.rotation.x = Math.sin(tm * 7 + b.ph) * (0.05 + b.nod * 0.35); b.head.rotation.z = Math.sin(tm * 4.3 + b.ph) * (0.03 + b.nod * 0.12); }
      const near = E.cam.distanceTo(spot.pos) < 6; if (!near) return; if ((st.t -= dt) > 0) return;
      const [who, line] = QUIPS[st.i % QUIPS.length]; st.i++; const b = who === 'H' ? H : K; b.nod = 1; E.O.bubble(b.head, line, 3.3, { off: 0.2 }); E.A.tone(who === 'H' ? 520 : 400, 0.05, 'triangle', 0.03); st.t = st.i % 2 ? 3.6 : 7; if (st.i === 1) E.found('bobbleheads'); },
    view: () => ({ from: spot.pos.clone().addScaledVector(spot.n, 1.35).setY(1.35), to: spot.pos.clone().setY(1.12) }) };
}
