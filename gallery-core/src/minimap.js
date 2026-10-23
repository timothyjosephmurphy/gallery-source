// minimap.js — generic, silent 2D-canvas minimap for gallery-core (first used by #251 tag gallery).
// API: createMinimap({ rooms, doors, getPlayer, parent = document.body, ...opts }) -> { update(), setVisible(bool), toggle(), isVisible(), setData({rooms,doors,gates,checkout}), dispose(), el }
//  rooms[]: {id, kind:'room'|'hub'|'court'|'outer'|..., poly:[[x,z],...]} (or center+radius: hex fallback)
//  doors[]: {x, z, nx, nz, width, kind}; kind 'gate' draws as a gate; id/kind 'checkout' draws as checkout
//  gates[], checkout: optional extras {x,z,width?} (checkout may be an object or array)
//  getPlayer(): {x, z, yaw} — yaw radians, 0 = +z, increasing toward +x
// Options: key ('m'), hz (10), span (metres shown across, 44), size (px, auto), visible (true),
//  storageKey ('minimap.visible' or null), top/left (CSS), theme (colour overrides), follow (true: centred on player).
// Draws only at ~hz, never plays audio, renders no text.
const THEME = {
  bg: 'rgba(43,33,24,0.78)', rim: '#b8a27e', rimDark: '#5c4630',
  room: 'rgba(214,196,160,0.28)', roomEdge: '#d9c9a3', hub: 'rgba(196,112,72,0.22)', hubEdge: '#c97a52',
  court: 'rgba(122,140,92,0.30)', courtEdge: '#8fa06a', door: '#f2e6c8', gate: '#c2552f', checkout: '#e2b649',
  player: '#fff4dc', playerEdge: '#7a2e14', cone: 'rgba(255,236,190,0.22)',
};
const hexPoly = (c, r) => Array.from({ length: 6 }, (_, i) => { const a = (60 * i - 30) * Math.PI / 180; return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]; });

export function createMinimap({ rooms = [], doors = [], gates = [], checkout = null, getPlayer = () => null, parent = document.body,
  key = 'm', hz = 10, span = 44, size = 0, visible = true, storageKey = 'minimap.visible', top = 'calc(104px + env(safe-area-inset-top))',
  left = 'calc(8px + env(safe-area-inset-left))', btnTop = 'calc(60px + env(safe-area-inset-top))', theme = {}, follow = true } = {}) {
  const T = { ...THEME, ...theme };
  let data; const setData = d => {
    const rs = (d.rooms || []).map(r => ({ kind: r.kind || 'room', poly: r.poly && r.poly.length > 2 ? r.poly : (r.center ? hexPoly(r.center, r.radius || 5) : null) })).filter(r => r.poly);
    const ds = d.doors || [];
    const co = [].concat(d.checkout || []).concat(ds.filter(x => x.kind === 'checkout' || x.id === 'checkout'));
    const gs = (d.gates || []).concat(ds.filter(x => x.kind === 'gate' && x.id !== 'checkout'));
    const dd = ds.filter(x => x.kind !== 'gate' && x.kind !== 'checkout' && x.id !== 'checkout');
    let b = [Infinity, -Infinity, Infinity, -Infinity];
    for (const r of rs) for (const [x, z] of r.poly) { b[0] = Math.min(b[0], x); b[1] = Math.max(b[1], x); b[2] = Math.min(b[2], z); b[3] = Math.max(b[3], z); }
    data = { rooms: rs, doors: dd, gates: gs, checkout: co, bounds: isFinite(b[0]) ? b : [-20, 20, -20, 20] }; dirty = true;
  };
  let dirty = true; setData({ rooms, doors, gates, checkout });

  try { if (storageKey) { const s = localStorage.getItem(storageKey); if (s != null) visible = s === '1'; } } catch {}
  const px = size || Math.round(Math.max(96, Math.min(140, (typeof innerWidth === 'number' ? innerWidth : 390) * 0.33)));
  const wrap = document.createElement('div');
  wrap.className = 'mm-wrap';
  wrap.style.cssText = `position:fixed;top:${top};left:${left};width:${px}px;height:${px}px;z-index:25;pointer-events:none;border-radius:50%;` +
    `box-shadow:0 0 0 3px ${T.rimDark},0 0 0 5px ${T.rim},0 3px 10px rgba(0,0,0,.45);overflow:hidden`;
  const cv = document.createElement('canvas'); const dpr = Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);
  cv.width = cv.height = Math.round(px * dpr); cv.style.cssText = 'width:100%;height:100%;display:block';
  cv.setAttribute('aria-label', 'map'); wrap.appendChild(cv);
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'mm-btn'; btn.title = 'Map (M)'; btn.setAttribute('aria-label', 'Toggle map');
  btn.style.cssText = `position:fixed;top:${btnTop};left:${left};z-index:30;width:40px;height:40px;padding:0;border-radius:50%;cursor:pointer;` +
    `background:radial-gradient(circle at 35% 30%,#d98a5c,#9c4a26);border:2px solid ${T.rim};box-shadow:0 2px 6px rgba(0,0,0,.4);touch-action:manipulation`;
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" style="display:block;margin:auto"><circle cx="12" cy="12" r="8.5" fill="none" stroke="#f4e6c8" stroke-width="1.6"/><path d="M12 5 L14.6 13 L12 11.6 L9.4 13 Z" fill="#f4e6c8"/></svg>';
  parent.appendChild(wrap); parent.appendChild(btn);
  const ctx = cv.getContext('2d');

  const setVisible = v => { visible = !!v; wrap.style.display = visible ? 'block' : 'none'; btn.setAttribute('aria-pressed', String(visible)); btn.style.opacity = visible ? '1' : '.7';
    try { storageKey && localStorage.setItem(storageKey, visible ? '1' : '0'); } catch {} dirty = true; if (visible) draw(); };
  const toggle = () => setVisible(!visible);
  const onBtn = e => { e.preventDefault(); e.stopPropagation(); toggle(); btn.blur(); };
  const onKey = e => { if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return; const t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if ((e.key || '').toLowerCase() === key) toggle(); };
  btn.addEventListener('click', onBtn); addEventListener('keydown', onKey);

  let last = 0, lastPose = '';
  function draw() {
    const W = cv.width, s = W / span, p = getPlayer() || { x: 0, z: 0, yaw: 0 };
    const b = data.bounds; let cx = p.x, cz = p.z;
    if (!follow) { cx = (b[0] + b[1]) / 2; cz = (b[2] + b[3]) / 2; }
    const X = x => W / 2 + (x - cx) * s, Y = z => W / 2 + (z - cz) * s; // top-down: +x right, +z down
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, W);
    ctx.fillStyle = T.bg; ctx.fillRect(0, 0, W, W);
    // faint travertine coursing
    ctx.strokeStyle = 'rgba(232,214,178,0.06)'; ctx.lineWidth = 1; const g = 4 * s, ox = ((-cx * s) % g + g) % g, oz = ((-cz * s) % g + g) % g;
    ctx.beginPath(); for (let v = ox; v < W; v += g) { ctx.moveTo(v, 0); ctx.lineTo(v, W); } for (let v = oz; v < W; v += g) { ctx.moveTo(0, v); ctx.lineTo(W, v); } ctx.stroke();
    ctx.lineJoin = 'round';
    for (const r of data.rooms) {
      const k = r.kind, fill = k === 'hub' ? T.hub : (k === 'court' || k === 'outer') ? T.court : T.room, edge = k === 'hub' ? T.hubEdge : (k === 'court' || k === 'outer') ? T.courtEdge : T.roomEdge;
      ctx.beginPath(); r.poly.forEach(([x, z], i) => i ? ctx.lineTo(X(x), Y(z)) : ctx.moveTo(X(x), Y(z))); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill(); ctx.setLineDash(k === 'court' || k === 'outer' ? [3 * dpr, 3 * dpr] : []); ctx.strokeStyle = edge; ctx.lineWidth = 1.5 * dpr; ctx.stroke();
    }
    ctx.setLineDash([]);
    // doorways: a gap-bar across the wall line
    ctx.strokeStyle = T.door; ctx.lineWidth = 2.5 * dpr; ctx.lineCap = 'round';
    for (const d of data.doors) { const hw = (d.width || 1.6) / 2, tx = -(d.nz || 0), tz = d.nx || 0; if (!d.nx && !d.nz) { ctx.beginPath(); ctx.arc(X(d.x), Y(d.z), 1.5 * dpr, 0, 7); ctx.fillStyle = T.door; ctx.fill(); continue; }
      ctx.beginPath(); ctx.moveTo(X(d.x - tx * hw), Y(d.z - tz * hw)); ctx.lineTo(X(d.x + tx * hw), Y(d.z + tz * hw)); ctx.stroke(); }
    // gates: terracotta arch
    for (const q of data.gates) { const x = X(q.x), y = Y(q.z), r = 3.2 * dpr; ctx.fillStyle = T.gate; ctx.strokeStyle = '#f4e6c8'; ctx.lineWidth = 1 * dpr;
      ctx.beginPath(); ctx.moveTo(x - r, y + r); ctx.lineTo(x - r, y); ctx.arc(x, y, r, Math.PI, 0); ctx.lineTo(x + r, y + r); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    // checkout: gold coin
    for (const q of data.checkout) { const x = X(q.x), y = Y(q.z); ctx.beginPath(); ctx.arc(x, y, 3.6 * dpr, 0, 7); ctx.fillStyle = T.checkout; ctx.fill(); ctx.strokeStyle = '#6b4a12'; ctx.lineWidth = 1.2 * dpr; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 1.6 * dpr, 0, 7); ctx.stroke(); }
    // player: view cone + arrow; yaw 0 = +z, toward +x
    const yaw = p.yaw || 0, fx = Math.sin(yaw), fz = Math.cos(yaw), x0 = X(p.x), y0 = Y(p.z), a = Math.atan2(fz, fx);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.arc(x0, y0, 9 * s, a - 0.55, a + 0.55); ctx.closePath(); ctx.fillStyle = T.cone; ctx.fill();
    ctx.save(); ctx.translate(x0, y0); ctx.rotate(a); const u = 5 * dpr;
    ctx.beginPath(); ctx.moveTo(u * 1.4, 0); ctx.lineTo(-u, u * 0.85); ctx.lineTo(-u * 0.45, 0); ctx.lineTo(-u, -u * 0.85); ctx.closePath();
    ctx.fillStyle = T.player; ctx.fill(); ctx.strokeStyle = T.playerEdge; ctx.lineWidth = 1.4 * dpr; ctx.stroke(); ctx.restore();
    dirty = false;
  }
  function update(now = (typeof performance !== 'undefined' ? performance.now() : Date.now())) {
    if (!visible || now - last < 1000 / hz) return false;
    last = now; const p = getPlayer() || {}; const k = `${(p.x || 0).toFixed(2)},${(p.z || 0).toFixed(2)},${(p.yaw || 0).toFixed(3)}`;
    if (k === lastPose && !dirty) return false; lastPose = k; draw(); return true;
  }
  function dispose() { removeEventListener('keydown', onKey); btn.removeEventListener('click', onBtn); wrap.remove(); btn.remove(); }
  setVisible(visible);
  return { update, setVisible, toggle, isVisible: () => visible, setData: d => setData({ ...data, ...d }), dispose, el: wrap, button: btn, canvas: cv };
}
export default createMinimap;
