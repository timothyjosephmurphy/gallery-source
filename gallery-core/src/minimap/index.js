// Shared minimap for the three.js galleries (studio-tracker #251).
// initMinimap({ scene, camera, layout, container }) -> { update(), toggle(), dispose() }
// 2D canvas, static plan pre-rendered once, live layer redrawn at most ~15 fps. Silent.
import './minimap.css';

const FRAME_MS = 66; // ~15 fps cap
const AVOID = '#hud,#tfire,#tswap,#trun,#tscan,#homebtn,#homelink,#eggAsk,#cartbtn,#hudcart,[data-minimap-avoid]';
const SIDE = { N: 'maxZ', S: 'minZ', E: 'maxX', W: 'minX' };

// ---------- layout normalisation: dungeon/museum rect layouts + tag-gallery hex layouts ----------
function hex(cx, cz, r) { const p = []; for (let k = 0; k < 6; k++) { const a = (30 + 60 * k) * Math.PI / 180; p.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]); } return p; }
function rectPoly(r) { return [[r.minX, r.minZ], [r.maxX, r.minZ], [r.maxX, r.maxZ], [r.minX, r.maxZ]]; }
function wallSeg(r, wall, from, to) { // rect wall opening -> segment
  if (wall === 'N' || wall === 'S') { const z = r[SIDE[wall]]; return [[from, z], [to, z]]; }
  const x = r[SIDE[wall]]; return [[x, from], [x, to]];
}
function hexDoor(c, ap, k, off = 0, w = 1.4) { const a = k * Math.PI / 3, mx = c[0] + ap * Math.cos(a), mz = c[1] + ap * Math.sin(a), tx = -Math.sin(a), tz = Math.cos(a), m = off;
  return [[mx + tx * (m - w / 2), mz + tz * (m - w / 2)], [mx + tx * (m + w / 2), mz + tz * (m + w / 2)]]; }

export function normalizeLayout(L) {
  L = L && L.layout && !L.rooms ? L.layout : (L || {});
  const out = { rooms: [], halls: [], circles: [], doors: [], gates: [], checkout: [] };
  const byId = {};
  for (const r of L.rooms || []) {
    let poly = null;
    if (Array.isArray(r.polygon)) poly = r.polygon.map(p => Array.isArray(p) ? p : [p.x, p.z]);
    else if (r.minX != null) poly = rectPoly(r);
    else if (r.center && r.radius) poly = hex(r.center[0], r.center[1], r.radius);
    if (!poly) continue;
    byId[r.id] = r; out.rooms.push({ id: r.id, poly });
    for (const o of r.openings || []) out.doors.push(wallSeg(r, o.wall, o.from, o.to));
    if (r.center && r.radius && r.minX == null) { const ap = r.apothem || r.radius * Math.sqrt(3) / 2;
      for (const k of r.doorWalls || []) out.doors.push(hexDoor(r.center, ap, k, (r.doorOffsets || {})[k] || 0)); }
  }
  for (const h of L.hallways || []) if (h.minX != null) out.halls.push(rectPoly(h));
  for (const c of L.corridors || []) if (c.p0 && c.p1) out.doors.push([c.p0, c.p1]);
  for (const d of L.doorways || L.doors || []) if (d && d.p0) out.doors.push([d.p0, d.p1]); else if (d && d.x != null) out.doors.push([[d.x - .7, d.z], [d.x + .7, d.z]]);
  const hub = L.hub; if (hub && hub.center) { out.rooms.push({ id: hub.id || 'hub', poly: hex(hub.center[0], hub.center[1], hub.radius || 9) });
    if (hub.coreRadius) out.circles.push({ x: hub.center[0], z: hub.center[1], r: hub.coreRadius, line: 1 }); }
  for (const c of [...(L.courtyards || []), ...(L.outerCourts || [])]) if (c.center) out.circles.push({ x: c.center[0], z: c.center[1], r: c.radius || 4 });
  const mark = (g, kind) => { if (!g) return;
    if (g.x != null) { (kind === 'checkout' ? out.checkout : out.gates).push({ x: g.x, z: g.z, active: g.active !== false, label: g.label || g.id }); return; }
    const r = byId[g.room]; if (r && r.minX != null) { const s = wallSeg(r, g.wall, g.from, g.to); (kind === 'checkout' ? out.checkout : out.gates).push({ x: (s[0][0] + s[1][0]) / 2, z: (s[0][1] + s[1][1]) / 2, active: true, seg: s }); } };
  mark(L.gate, 'gate'); (L.gates || []).forEach(g => mark(g, g.id === 'checkout' ? 'checkout' : 'gate'));
  ((hub && hub.gates) || []).forEach(g => mark(g, g.id === 'checkout' ? 'checkout' : 'gate'));
  [].concat(L.checkout || []).forEach(g => mark(g, 'checkout'));
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  const grow = (x, z) => { if (x < minX) minX = x; if (x > maxX) maxX = x; if (z < minZ) minZ = z; if (z > maxZ) maxZ = z; };
  out.rooms.forEach(r => r.poly.forEach(p => grow(p[0], p[1]))); out.halls.forEach(h => h.forEach(p => grow(p[0], p[1])));
  out.circles.forEach(c => { grow(c.x - c.r, c.z - c.r); grow(c.x + c.r, c.z + c.r); });
  if (!isFinite(minX)) { minX = -10; maxX = 10; minZ = -10; maxZ = 10; }
  out.bounds = { minX, maxX, minZ, maxZ };
  return out;
}

// ---------- component ----------
export function initMinimap({ scene, camera, layout, container } = {}) {
  if (!camera) throw new Error('initMinimap: camera required');
  const host = container || document.body, plan = normalizeLayout(layout), dpr = Math.min(2, window.devicePixelRatio || 1);
  const wrap = document.createElement('div'); wrap.className = 'mm-wrap'; wrap.id = 'minimap';
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'mm-btn'; btn.id = 'minimap-btn'; btn.setAttribute('aria-label', 'Toggle map (M)'); btn.textContent = 'MAP';
  const cv = document.createElement('canvas'); cv.className = 'mm-plate'; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Floor plan with your position');
  wrap.append(btn, cv); host.appendChild(wrap);
  let on = true; try { on = localStorage.getItem('mm-on') !== '0'; } catch (e) {}
  let size = 0, sc = 1, ox = 0, oz = 0, base = null, last = 0, placeT = 0, dead = false, lastKey = '';
  const ctx = cv.getContext('2d');
  const toPx = (x, z) => [ox + (x - plan.bounds.minX) * sc, oz + (z - plan.bounds.minZ) * sc];

  function bake() { // static plan into an offscreen canvas
    const vw = window.innerWidth, vh = window.innerHeight;
    size = Math.round(Math.max(96, Math.min(164, Math.min(vw, vh) * 0.36)));
    cv.width = cv.height = size * dpr; cv.style.width = cv.style.height = size + 'px';
    const b = plan.bounds, pad = 8, w = b.maxX - b.minX || 1, h = b.maxZ - b.minZ || 1;
    sc = (size - 2 * pad) / Math.max(w, h); ox = pad + ((size - 2 * pad) - w * sc) / 2; oz = pad + ((size - 2 * pad) - h * sc) / 2;
    base = document.createElement('canvas'); base.width = base.height = size * dpr; const g = base.getContext('2d'); g.scale(dpr, dpr);
    const path = poly => { g.beginPath(); poly.forEach((p, i) => { const q = toPx(p[0], p[1]); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); };
    g.lineJoin = 'round';
    plan.halls.forEach(hp => { path(hp); g.fillStyle = '#1d3a3a'; g.fill(); });
    plan.circles.forEach(c => { const q = toPx(c.x, c.z); g.beginPath(); g.arc(q[0], q[1], c.r * sc, 0, 7); if (c.line) { g.strokeStyle = '#6fd6c466'; g.lineWidth = 1; g.stroke(); } else { g.fillStyle = '#20403b'; g.fill(); } });
    plan.rooms.forEach(r => { path(r.poly); g.fillStyle = '#16302f'; g.fill(); g.strokeStyle = '#7fe0cf'; g.lineWidth = 1.4; g.stroke(); });
    g.lineCap = 'round'; g.strokeStyle = '#0b1418'; g.lineWidth = Math.max(2.2, 1.4 * sc);
    plan.doors.forEach(d => { const a = toPx(d[0][0], d[0][1]), c = toPx(d[1][0], d[1][1]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(c[0], c[1]); g.stroke(); });
    g.strokeStyle = '#f2efe4'; g.lineWidth = 1;
    plan.doors.forEach(d => { const a = toPx(d[0][0], d[0][1]), c = toPx(d[1][0], d[1][1]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(c[0], c[1]); g.setLineDash([1.5, 2]); g.stroke(); g.setLineDash([]); });
    plan.gates.forEach(m => { const q = toPx(m.x, m.z); g.beginPath(); g.arc(q[0], q[1], 3.2, 0, 7); g.fillStyle = m.active ? '#b98cff' : '#5b4a78'; g.fill(); });
    plan.checkout.forEach(m => { const q = toPx(m.x, m.z); g.save(); g.translate(q[0], q[1]); g.rotate(Math.PI / 4); g.fillStyle = '#ffd27a'; g.fillRect(-3.4, -3.4, 6.8, 6.8); g.restore(); });
    g.fillStyle = '#7fe0cf99'; g.font = '700 9px system-ui,sans-serif'; g.fillText('N', size - 13, 12); // world -Z up
    lastKey = '';
  }
  const rects = () => [...document.querySelectorAll(AVOID)].filter(e => !wrap.contains(e)).map(e => e.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0);
  const hit = (a, list) => list.some(r => a.left < r.right && a.right > r.left && a.top < r.bottom && a.bottom > r.top);
  function place() { // choose the first corner slot that clears every HUD control
    const vw = window.innerWidth, vh = window.innerHeight, list = rects(), m = 8, bh = 26, H = size + bh + 4, W = size;
    const cs = getComputedStyle(document.documentElement), sv = n => parseFloat(cs.getPropertyValue(n)) || 0;
    const st = sv('--ui-st'), sl = sv('--ui-sl'), sr = sv('--ui-sr');
    const cand = [];
    for (let y = m + st; y + H < vh - m; y += 16) { cand.push({ x: m + sl, y, r: 0 }); cand.push({ x: vw - W - m - sr, y, r: 1 }); }
    let best = cand.find(c => !hit({ left: c.x, top: c.y, right: c.x + W, bottom: c.y + H }, list)) || cand[0] || { x: m, y: m, r: 0 };
    wrap.style.left = best.x + 'px'; wrap.style.top = best.y + 'px'; wrap.classList.toggle('mm-right', !!best.r);
  }
  function apply() { wrap.classList.toggle('mm-off', !on); btn.setAttribute('aria-pressed', String(on)); btn.textContent = on ? 'MAP ▾' : 'MAP ▸'; try { localStorage.setItem('mm-on', on ? '1' : '0'); } catch (e) {} }
  function draw() {
    camera.updateMatrixWorld && camera.updateMatrixWorld();
    const e = camera.matrixWorld.elements, x = e[12], z = e[14], fx = -e[8], fz = -e[10];
    const key = x.toFixed(2) + ',' + z.toFixed(2) + ',' + Math.atan2(fz, fx).toFixed(2);
    if (key === lastKey) return; lastKey = key;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(base, 0, 0); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let [px, pz] = toPx(x, z); px = Math.max(5, Math.min(size - 5, px)); pz = Math.max(5, Math.min(size - 5, pz));
    const a = Math.atan2(fz, fx);
    ctx.save(); ctx.translate(px, pz);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 16, a - 0.45, a + 0.45); ctx.closePath(); ctx.fillStyle = '#ff8a5c33'; ctx.fill(); // view wedge
    ctx.rotate(a); ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-4.5, 4.5); ctx.lineTo(-2, 0); ctx.lineTo(-4.5, -4.5); ctx.closePath();
    ctx.fillStyle = '#ff8a5c'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#0b1418'; ctx.stroke(); ctx.restore();
    wrap.dataset.x = x.toFixed(2); wrap.dataset.z = z.toFixed(2); wrap.dataset.heading = a.toFixed(3); wrap.dataset.frames = String((+wrap.dataset.frames || 0) + 1);
  }
  function update(now = performance.now()) {
    if (dead) return;
    if (now - placeT > 1000) { placeT = now; place(); }
    if (!on || now - last < FRAME_MS) return; last = now; draw();
  }
  function toggle(force) { on = typeof force === 'boolean' ? force : !on; apply(); if (on) { lastKey = ''; last = 0; update(); } return on; }
  const onKey = ev => { if (ev.repeat || ev.ctrlKey || ev.metaKey || ev.altKey) return; const t = ev.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return; if (ev.code === 'KeyM' || ev.key === 'm' || ev.key === 'M') toggle(); };
  const onBtn = ev => { ev.preventDefault(); ev.stopPropagation(); toggle(); };
  const onResize = () => { bake(); place(); lastKey = ''; };
  btn.addEventListener('click', onBtn); btn.addEventListener('pointerdown', ev => ev.stopPropagation());
  window.addEventListener('keydown', onKey); window.addEventListener('resize', onResize);
  bake(); apply(); place(); update();
  return {
    update, toggle,
    dispose() { dead = true; window.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); btn.removeEventListener('click', onBtn); wrap.remove(); },
    get visible() { return on; }, element: wrap, plan,
  };
}
export default initMinimap;
