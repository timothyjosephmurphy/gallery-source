// Egg 8b: talk to the guide drone. T (or the phone 'Ask Guide' button) opens a small prompt with a mic button and a text box.
// What you ask for is matched locally (fuzzy + synonyms) against painting titles, captions, tags, descriptions and room names,
// plus the slipgate and checkout. No network, no paid AI. The drone answers (quiet synthesized voice + caption), flies ahead
// along a walkable path, waits if you fall behind, then flips and spotlights the painting.
import { THREE, V } from '../kit.js';

const STOP = new Set('a an the of to me my i im i\'m want wanna would like love see show find take bring lead guide go get where wheres is are was some something any anything one ones please can could you your us we let lets with in on at by for from and or that this those these there here thing things piece pieces painting paintings art artwork artworks work works picture pictures look looking about kind sort type maybe really very just mostly'.split(' '));
const SYN = [
  ['sunset', 'sundown', 'dusk', 'evening', 'twilight', 'golden'], ['sunrise', 'dawn', 'morning', 'daybreak'], ['sun', 'sunny', 'sunlight'],
  ['portrait', 'face', 'faces', 'person', 'people', 'figure', 'man', 'woman', 'girl', 'boy', 'lady', 'guy', 'selfie', 'self'],
  ['family', 'friend', 'friends', 'relative'], ['sea', 'ocean', 'beach', 'wave', 'waves', 'surf', 'coast', 'shore', 'bay', 'water', 'island', 'strait', 'sound'],
  ['mountain', 'peak', 'hill', 'summit', 'ridge', 'volcano'], ['night', 'moon', 'moonlit', 'moonrise', 'star', 'stars', 'nocturne'],
  ['bitcoin', 'btc', 'satoshi', 'crypto', 'bitcoiner', 'bitcoiners', 'sats'], ['salvador', 'salvadoran', 'zonte', 'tunco', 'atami', 'salvadorian'],
  ['burning', 'burn', 'playa', 'festival'], ['flower', 'flowers', 'sunflower', 'floral', 'garden', 'bloom', 'blossom'],
  ['bird', 'birds', 'cormorant', 'heron', 'eagle', 'owl', 'gull'], ['mural', 'murals', 'wall'], ['city', 'seattle', 'street', 'urban', 'town'],
  ['abstract', 'psychedelic', 'visionary', 'trippy', 'cosmic', 'surreal'], ['meditation', 'meditate', 'calm', 'zen', 'peaceful'],
  ['travel', 'travels', 'trip', 'journey', 'abroad'], ['old', 'older', 'archive', 'archived', 'early', 'vintage'], ['lake', 'river', 'pond'],
  ['hike', 'hiking', 'trail', 'trek'], ['collab', 'collaboration', 'together'], ['greece', 'greek'], ['maui', 'hawaii', 'kihei']];
const SPECIAL = [
  { kind: 'gate', words: ['gate', 'slipgate', 'hyperspace', 'portal', 'realm', 'warp', 'teleporter', 'elves', 'elf'], label: 'the hyperspace slipgate' },
  { kind: 'checkout', words: ['checkout', 'check', 'cart', 'pay', 'buy', 'shop', 'purchase', 'cashier', 'till', 'register', 'store'], label: 'the checkout' }];
const deacc = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const stem = w => w.length > 4 && w.endsWith('ies') ? w.slice(0, -3) + 'y' : w.length > 3 && w.endsWith('es') && /(ch|sh|x|ss)es$/.test(w) ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w;
const words = s => deacc(s).replace(/[^a-z0-9#' ]+/g, ' ').split(/\s+/).map(w => w.replace(/'s$/, '').replace(/'/g, '')).filter(Boolean);
const toks = s => words(s).filter(w => !STOP.has(w)).map(stem);
const synOf = new Map(); SYN.forEach(g => { const gs = g.map(stem); gs.forEach(w => synOf.set(w, gs)); });
function lev(a, b, max = 2) { if (Math.abs(a.length - b.length) > max) return max + 1; let p = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) { const c = [i]; let lo = i; for (let j = 1; j <= b.length; j++) { c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); lo = Math.min(lo, c[j]); } if (lo > max) return max + 1; p = c; } return p[b.length]; }
// how well one query token matches one document token (0..1)
function tokScore(q, d) { if (q === d) return 1; if (q.length >= 4 && d.length >= 4 && (d.startsWith(q) || q.startsWith(d))) return 0.8;
  if (q.length >= 5 && lev(q, d, 1) <= 1) return 0.75; if (q.length >= 7 && lev(q, d, 2) <= 2) return 0.6; const s = synOf.get(q); if (s && s.includes(d)) return 0.6; return 0; }

export function buildGuideIndex(ctx) {
  const rooms = ctx.rooms || [], docs = [];
  const roomName = id => { const r = rooms.find(q => q.id === id); return r ? [r.title, r.name, r.id, ...(r.galleries || [])].filter(Boolean).join(' ') : String(id || ''); };
  for (const p of ctx.paintings || []) { const d = p.data; if (!d || !d.title) continue; if (p.state && p.state !== 'wall') continue;
    const tags = [].concat(d.tags || [], d.keywords || [], d.series || [], d.place || [], d.location || []).join(' ');
    const desc = [d.caption, d.desc, d.description, d.blurb, d.story, d.medium, d.year].filter(Boolean).join(' ');
    docs.push({ kind: 'painting', p, label: d.title, fields: [[toks(d.title), 1], [toks(tags), 0.8], [toks(desc), 0.55], [toks(roomName(d.room)), 0.5]], title: words(d.title).filter(w => !STOP.has(w)).join(' ') }); }
  for (const r of rooms) { const nm = [r.title, r.name].filter(Boolean)[0] || r.id; docs.push({ kind: 'room', room: r, label: nm, fields: [[toks([r.title, r.name, r.id].join(' ')), 0.9], [toks((r.galleries || []).join(' ')), 0.7]], title: words(nm).filter(w => !STOP.has(w)).join(' ') }); }
  if (ctx.gate) docs.push({ kind: 'gate', label: SPECIAL[0].label, fields: [[SPECIAL[0].words.map(stem), 1]], title: 'slipgate' });
  if (ctx.checkout) docs.push({ kind: 'checkout', label: SPECIAL[1].label, fields: [[SPECIAL[1].words.map(stem), 1]], title: 'checkout' });
  return docs;
}
export function matchGuide(docs, text) {
  const q = toks(text); if (!q.length) return { q, results: [] };
  const res = [];
  for (const d of docs) { let sum = 0; for (const qt of q) { let best = 0; for (const [ts, w] of d.fields) for (const t of ts) { const s = tokScore(qt, t) * w; if (s > best) best = s; if (best >= 1) break; } sum += best; }
    let score = sum / q.length; const core = words(text).filter(w => !STOP.has(w)).join(' ');
    if (core.length > 3 && d.title.includes(core)) score += 0.6; if (core && d.title === core) score += 0.4;
    if (d.kind === 'room') score *= 0.92; if (d.kind === 'gate' || d.kind === 'checkout') score *= 1.05;
    if (score > 0) res.push({ d, score, exact: !!core && d.title === core }); }
  res.sort((a, b) => b.score - a.score); return { q, results: res };
}

export function eggGuide(E, drone) {
  if (!drone) return null;
  const { scene, camera, world, O } = E, ctx = E.ctx;
  let docs = null; const index = () => docs || (docs = buildGuideIndex(ctx));
  // ---- spotlight: additive cone + warm wash over the painting (no real light: phone-fast) ----
  const coneMat = new THREE.MeshBasicMaterial({ color: 0xfff1c8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const washMat = new THREE.MeshBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 1, 1, 20, 1, true), coneMat), wash = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), washMat);
  cone.visible = wash.visible = false; cone.userData.egg = wash.userData.egg = 1; cone.renderOrder = wash.renderOrder = 15; scene.add(cone, wash);
  const spot = { t: 0, on: false, p: null };
  function spotlight(p) { const d = p.data, n = V(d.ix, 0, d.iz).normalize(), c = V(d.x, d.y, d.z), w = p.w || d.w, h = p.h || d.h;
    const top = c.clone().addScaledVector(n, 1.5).setY(Math.min(d.y + h / 2 + 1.1, 3.6)), L = top.distanceTo(c);
    cone.scale.set(Math.max(w, h) * 0.62, L, Math.max(w, h) * 0.62); cone.position.copy(top).add(c).multiplyScalar(0.5); cone.quaternion.setFromUnitVectors(V(0, -1, 0), c.clone().sub(top).normalize());
    wash.scale.set(w + 0.35, h + 0.35, 1); wash.position.copy(c).addScaledVector(n, 0.03); wash.rotation.set(0, Math.atan2(n.x, n.z), 0);
    cone.visible = wash.visible = true; spot.t = 0; spot.on = true; spot.p = p; E.found('guide-spotlight'); }
  // ---- voice: tiny robot TTS (quiet) + caption + bubble; silent when muted, captions always ----
  let voice = null; const pickVoice = () => { try { const vs = speechSynthesis.getVoices(); voice = vs.find(v => /en-(US|GB)/i.test(v.lang) && /female|samantha|zira|aria|jenny|google us/i.test(v.name)) || vs.find(v => /^en/i.test(v.lang)) || null; } catch (e) {} };
  function say(line, d = 4.5) { E.O.caption(line, d); O.bubble(drone.rig, line, d, { off: 0.35 }); E.A.tone(1500, 0.05, 'square', 0.03); E.A.tone(1900, 0.05, 'square', 0.025, 0.07);
    if (ctx.isMuted() || !('speechSynthesis' in window)) return; try { if (!voice) pickVoice(); speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(line); if (voice) u.voice = voice; u.pitch = 1.55; u.rate = 1.08; u.volume = 0.4; speechSynthesis.speak(u); } catch (e) {} }
  // ---- UI ----
  const css = document.createElement('style'); css.textContent = `
  #eggAsk{position:fixed;top:calc(52px + env(safe-area-inset-top));right:calc(10px + env(safe-area-inset-right));z-index:41;display:none;padding:7px 11px;border-radius:16px;border:1px solid #fff6;background:#0d1a26cc;color:#eaf6ff;font:600 12px system-ui,sans-serif;letter-spacing:.4px}
  @media (pointer:coarse){#eggAsk{display:block}}
  #eggGuide{position:fixed;left:50%;top:14%;transform:translateX(-50%);z-index:45;display:none;width:min(420px,88vw);padding:12px;border-radius:14px;background:#0d1620ee;border:1px solid #8fd3ff66;color:#eaf6ff;font:14px system-ui,sans-serif;box-shadow:0 8px 30px #0008}
  #eggGuide .row{display:flex;gap:6px}#eggGuide input{flex:1;min-width:0;padding:9px 10px;border-radius:9px;border:1px solid #fff4;background:#fff;color:#111;font-size:16px}
  #eggGuide button{padding:8px 11px;border-radius:9px;border:1px solid #fff5;background:#1f3a52;color:#fff;font:600 13px system-ui,sans-serif;cursor:pointer}
  #eggGuide .mic.on{background:#b3261e}#eggGuide .hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-weight:700;letter-spacing:.5px}
  #eggGuide .hint{opacity:.7;font-size:12px;margin-top:6px}#eggGuide .opts{display:flex;flex-direction:column;gap:6px;margin-top:8px}#eggGuide .opts button{text-align:left;background:#26475f}
  @media (max-height:430px){#eggGuide{top:6%;padding:9px}}`;
  document.head.appendChild(css);
  // #245: one panel only, even if eggs install twice (hot reload, re-entry): drop any earlier instance first
  try { window.__eggGuideUI && window.__eggGuideUI.destroy(); } catch (e) {} document.querySelectorAll('#eggAsk,#eggGuide').forEach(e => e.remove());
  const btn = document.createElement('button'); btn.id = 'eggAsk'; btn.textContent = 'Ask Guide'; document.body.appendChild(btn);
  const box = document.createElement('div'); box.id = 'eggGuide';
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  box.innerHTML = `<div class="hd"><span>ASK THE GUIDE DRONE</span><button class="x" aria-label="Close">✕</button></div><div class="row">${SR ? '<button class="mic" aria-label="Speak">MIC</button>' : ''}<input type="text" placeholder="What would you like to see?" enterkeyhint="go" autocomplete="off"><button class="go">Go</button></div><div class="hint">${SR ? 'Tap MIC and say it, or type: ' : 'Type it: '}"sunsets", "portraits", "El Salvador", "the slipgate", "checkout"</div><div class="opts"></div>`;
  document.body.appendChild(box);
  const input = box.querySelector('input'), opts = box.querySelector('.opts'), mic = box.querySelector('.mic');
  ['keydown', 'keyup', 'keypress'].forEach(t => input.addEventListener(t, e => { e.stopPropagation(); if (t === 'keydown' && e.key === 'Enter') ask(input.value); if (t === 'keydown' && e.key === 'Escape') close(); }));
  ['mousedown', 'pointerdown', 'click'].forEach(t => box.addEventListener(t, e => e.stopPropagation())); box.addEventListener('touchstart', e => e.stopPropagation(), { passive: true }); box.addEventListener('touchend', e => e.stopPropagation());
  const coarse = () => matchMedia('(pointer: coarse)').matches;
  let isOpen = false, wasLocked = false, rec = null, openedAt = 0;
  function open() { if (isOpen || ctx.isRealm()) return; isOpen = true; openedAt = performance.now(); wasLocked = !!document.pointerLockElement; window.__reading = true; window.__eggGuide = 1; if (wasLocked) try { document.exitPointerLock(); } catch (e) {}
    box.style.display = 'block'; opts.innerHTML = ''; input.value = ''; setTimeout(() => { try { input.focus(); } catch (e) {} }, 30); E.found('guide'); drone.attend && drone.attend(); }
  function close(relock = true) { box.style.display = 'none'; opts.innerHTML = ''; try { input.blur(); } catch (e) {} try { const a = document.activeElement; if (a && a !== document.body && box.contains(a)) a.blur(); } catch (e) {}
    if (rec) try { rec.abort(); } catch (e) {} rec = null; mic && mic.classList.remove('on'); if (!isOpen) return; isOpen = false; window.__reading = false; window.__eggGuide = 0; openedAt = 0;
    // iOS: the keyboard scrolls the page under the fixed canvas/HUD; put it back so touch controls line up again
    try { window.scrollTo(0, 0); document.documentElement.scrollTop = document.body.scrollTop = 0; } catch (e) {}
    if (relock && wasLocked && !coarse() && ctx.canvas) try { ctx.canvas.requestPointerLock(); } catch (e) {} }
  btn.addEventListener('click', e => { e.stopPropagation(); isOpen ? close() : open(); }); btn.addEventListener('touchend', e => e.stopPropagation());
  // #245: act on touchend/pointerup too (iOS can swallow the synthetic click while the keyboard is up); dedupe so one tap = one action
  let lastAct = 0; const act = fn => e => { if (e.type !== 'click') e.preventDefault(); e.stopPropagation(); const n = performance.now(); if (n - lastAct < 400) return; lastAct = n; fn(); };
  const xb = box.querySelector('.x'), gb = box.querySelector('.go');
  ['touchend', 'click'].forEach(t => { xb.addEventListener(t, act(() => close()), { passive: false }); gb.addEventListener(t, act(() => ask(input.value)), { passive: false }); });
  // tap/click outside the panel or Esc anywhere closes it
  const outside = e => { if (!isOpen || performance.now() - openedAt < 350) return; const t = e.target; if (box.contains(t) || btn.contains(t)) return; close(); };
  document.addEventListener('touchstart', outside, { capture: true, passive: true }); document.addEventListener('mousedown', outside, true);
  const onEsc = e => { if (isOpen && (e.key === 'Escape' || e.code === 'Escape')) { e.stopPropagation(); close(); } }; addEventListener('keydown', onEsc, true);
  window.__eggGuideUI = { destroy() { try { close(false); } catch (e) {} document.removeEventListener('touchstart', outside, true); document.removeEventListener('mousedown', outside, true); removeEventListener('keydown', onEsc, true); btn.remove(); box.remove(); } };
  addEventListener('keydown', e => { if (e.code !== 'KeyT' || e.repeat || isOpen || e.target && /INPUT|TEXTAREA/.test(e.target.tagName) || ctx.isBusy()) return; e.preventDefault(); open(); });
  if (mic) mic.addEventListener('click', () => { if (rec) { try { rec.stop(); } catch (e) {} return; } try { rec = new SR(); rec.lang = 'en-US'; rec.interimResults = true; rec.maxAlternatives = 3; mic.classList.add('on');
    rec.onresult = ev => { const r = ev.results[ev.results.length - 1]; input.value = r[0].transcript; if (r.isFinal) ask(r[0].transcript); };
    rec.onerror = rec.onend = () => { mic.classList.remove('on'); rec = null; }; setTimeout(() => { if (rec) try { rec.abort(); } catch (e) {} }, 12000); rec.start(); } catch (e) { mic.classList.remove('on'); rec = null; } });
  // ---- resolving a request ----
  const gateGoal = () => { const g = ctx.gate; return g ? g.pos.clone().addScaledVector(g.n, 2.4).setY(0) : null; };
  const chkGoal = () => { const g = ctx.checkout; return g ? g.pos.clone().addScaledVector(g.n || V(0, 0, -1), 2.0).setY(0) : null; };
  const paintGoal = p => { const d = p.data, w = p.w || d.w, tx = d.iz, tz = -d.ix; for (const [k, sd] of [[1.4, 1], [1.4, -1], [1.9, 1], [1.9, -1], [1.7, 0], [2.4, 0]]) { const o = sd * (w / 2 + 0.55), x = d.x + d.ix * k + tx * o, z = d.z + d.iz * k + tz * o; if (world.walkable(x, z) && world.clearAt(x, z) >= 0.3) return V(x, 0, z); } return V(d.x + d.ix * 1.7, 0, d.z + d.iz * 1.7); }; // hover beside it, not in front
  const roomGoal = r => { const c = V((r.minX + r.maxX) / 2, 0, (r.minZ + r.maxZ) / 2); if (world.walkable(c.x, c.z)) return c; return world.randomFree(0.5, (x, z) => x > r.minX && x < r.maxX && z > r.minZ && z < r.maxZ); };
  function go(doc, guess) { let goal = null, label = doc.label, onArrive = null;
    if (doc.kind === 'checkout' && window.__takeMeToCheckout) { window.__takeMeToCheckout(); /* #308: the same towed run as the bot's button: it arrives and opens the checkout (the old 2 m-short stop left visitors hanging) */ return true; }
    if (doc.kind === 'painting') { goal = paintGoal(doc.p); onArrive = () => { spotlight(doc.p); say(`Here it is: ${doc.p.data.title}.`, 5); }; }
    else if (doc.kind === 'room') { goal = roomGoal(doc.room); onArrive = () => say(`Welcome to ${label}.`, 4); }
    else if (doc.kind === 'gate') { goal = gateGoal(); onArrive = () => say('The slipgate. Mind the elves!', 4); }
    else if (doc.kind === 'checkout') { goal = chkGoal(); onArrive = () => say('Checkout! Your cart is ready when you are.', 4); }
    const shortL = label.length > 42 ? label.slice(0, 40) + '…' : label;
    if (!goal || !drone.guideTo({ goal, label: shortL, onArrive })) { say(`Sorry, I can't find a way to ${shortL} from here.`); return false; }
    say(guess ? `Closest I have is ${shortL}. Follow me!` : doc.kind === 'painting' ? `Follow me! ${shortL} is this way.` : `Follow me! ${shortL[0].toUpperCase() + shortL.slice(1)} is this way.`); state.last = { kind: doc.kind, label }; return true; }
  const state = { last: null, lastAsk: null };
  function offer(list, line) { try { input.blur(); } catch (e) {} opts.innerHTML = ''; /* #245: drop the iOS keyboard so the choices and × are reachable */ list.forEach(r => { const b = document.createElement('button'); b.textContent = r.d.label + (r.d.kind === 'room' ? ' (room)' : ''); b.onclick = () => { close(); go(r.d); }; opts.appendChild(b); }); say(line, 5); }
  function ask(text) { text = String(text || '').trim(); if (!text) return null; const { q, results } = matchGuide(index(), text); state.lastAsk = { text, q, top: results.slice(0, 5).map(r => [r.d.label, +r.score.toFixed(2)]) };
    const best = results[0]; const TH = 0.5;
    if (!best || best.score < TH) { const sug = pickSuggestions(); offer(sug, `Sorry, I don't know "${text}" here. Maybe one of these?`); state.lastAsk.outcome = 'none'; return state.lastAsk; }
    const close2 = results.filter(r => r.score >= Math.max(TH, best.score * 0.85));
    const exact = best.exact || best.d.kind === 'gate' || best.d.kind === 'checkout';
    if (best.d.kind === 'room' && !best.exact) { const list = [best, ...results.filter(r => r.d.kind === 'painting' && r.score >= TH).slice(0, 2)]; if (list.length >= 2) { offer(list, 'A whole room, or one of these?'); state.lastAsk.outcome = 'choices'; return state.lastAsk; } }
    if (!exact && close2.length >= 2) { offer(close2.slice(0, 3), `I found ${close2.length > 3 ? 'several' : close2.length} that match. Which one?`); state.lastAsk.outcome = 'choices'; return state.lastAsk; }
    close(); go(best.d, best.score < 0.8); state.lastAsk.outcome = 'lead'; return state.lastAsk; }
  function pickSuggestions() { const ps = index().filter(d => d.kind === 'painting'), out = []; const seen = new Set();
    for (let k = 0; k < 40 && out.length < 3; k++) { const d = ps[Math.floor(Math.random() * ps.length)]; if (!d || seen.has(d.label)) continue; seen.add(d.label); out.push({ d, score: 0 }); } return out; }
  function update(dt) { if (spot.on) { spot.t += dt; const k = spot.t < 0.6 ? spot.t / 0.6 : spot.t > 9 ? Math.max(0, 1 - (spot.t - 9) / 1.2) : 1, fl = 0.92 + Math.sin(spot.t * 7) * 0.04;
      coneMat.opacity = 0.12 * k * fl; washMat.opacity = 0.2 * k; if (spot.t > 10.2) { spot.on = false; cone.visible = wash.visible = false; } }
    if (isOpen && ctx.isRealm()) close(false); if (isOpen && box.style.display === 'none') close(false); }
  return { name: 'guide', group: null, anchor: null, update, open, close, ask, go, say, spotlight, index, get isOpen() { return isOpen; }, get last() { return state.lastAsk; }, get spotOn() { return spot.on; }, hasMic: !!SR,
    view: () => spot.p ? (() => { const d = spot.p.data; return { from: V(d.x + d.ix * 3.2 + d.iz * 1.1, 1.6, d.z + d.iz * 3.2 - d.ix * 1.1), to: V(d.x, d.y, d.z) }; })() : drone.view() };
}
