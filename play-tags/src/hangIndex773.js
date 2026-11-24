// #773 hang index (prep, NOT wired yet — wire after #765 lands in tags.js, with B2).
// Planning overlay for TJ: tiny labels up in a ceiling corner of every hex gallery wall.
//
// MAPPING RULE (stable):
//   Rooms:  only W.rooms with kind === 'room' (hex galleries; hub/courts/outer excluded),
//           sorted by room id (string sort: room-01, room-02, …) → H1, H2, … Hn.
//           Adding room-14 later appends H14; existing numbers never shift.
//   Walls:  H#-n where n = hex side index k + 1 (k = 0..5 from tags-world.js makeWorld,
//           side k faces angle 60·k°: k=0 → +x, then counter-clockwise in x/z).
//           A side split by a door is still ONE wall number (label goes on its first segment).
//           So every room has H#-1 … H#-6, independent of door cuts.
//   Side 1 of each room shows "H# · H#-1" so the room index is visible too.
//   Slots:  H#-w-s per hung painting (W.art kind 'painting'; wall = src.wall + 1 = hex side k + 1).
//           Within room+wall: y DESC rounded to 5 cm rows (top first), then u ASC with
//           u = x*iz - z*ix (tangent (iz,-ix) = visitor's right while facing the wall), then id.
//           Computed live from W.art so it follows hang deploys; the CSV
//           (gallery-tj-feedback/hang-index, rebuild-hang-index.py) uses the identical sort.
//           Label: 12 x 3 cm, just above the frame's top-left corner.
//
// Toggle: on only when URL has ?hangIndex=1 (off for visitors by default). ?hangIndex=0 forces off.
// Usage (later, in tags.js after makeWorld): installHangIndex(THREE, root, W)
import { WALL_H } from './tags-world.js';

export function hangIndexEnabled(search = (typeof location !== 'undefined' ? location.search : '')) {
  return new URLSearchParams(search).get('hangIndex') === '1';
}
// #856 edit mode: ?key= shows wall names (+ locks); ?hangIndex=1 adds slot labels; ?hangIndex=0 forces all off.
export function hangIndexMode(search = (typeof location !== 'undefined' ? location.search : '')) {
  const q = new URLSearchParams(search), h = q.get('hangIndex');
  if (h === '0') return null; if (h === '1') return { slots: true, edit: q.has('key') }; return q.get('key') ? { slots: false, edit: true } : null;
}
export const LOCK_KEY = 'tjmWallLocks:tags';
// wall id 'room-01:3' for a point on / just inside a hex wall with inward normal (ix,iz); null if not a hex gallery wall
export function wallIdAt(W, x, z, ix, iz) {
  const L = Math.hypot(ix, iz) || 1; ix /= L; iz /= L; const r = W.roomAt(x + ix * 0.3, z + iz * 0.3); if (!r || r.kind !== 'room') return null;
  let best = null, bd = 1e9;
  for (const w of W.walls) { if (w.room !== r.id || w.free || w.k == null) continue; const dot = -(w.nx * ix + w.nz * iz); if (dot < 0.9) continue;
    const dx = w.x1 - w.x0, dz = w.z1 - w.z0, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - w.x0) * dx + (z - w.z0) * dz) / l2)), d = Math.hypot(w.x0 + dx * t - x, w.z0 + dz * t - z);
    if (d < bd) { bd = d; best = w; } }
  return best && bd < 1.0 ? r.id + ':' + best.k : null;
}
function lockTex(THREE, locked) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.fillStyle = locked ? 'rgba(170,40,30,0.9)' : 'rgba(40,130,60,0.85)'; g.strokeStyle = g.fillStyle; g.lineWidth = 7;
  g.beginPath(); if (locked) g.arc(32, 28, 13, Math.PI, 0); else g.arc(32, 22, 13, Math.PI, -0.25 * Math.PI); g.stroke(); // shackle: closed / swung open
  g.fillRect(14, 28, 36, 28); g.fillStyle = '#fff'; g.fillRect(29, 36, 6, 12);
  const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter; return t;
}
// #856 per-wall locks (client-only, localStorage LOCK_KEY). Locked wall = gravity gun cannot grab from or hang onto it.
export function installWallLocks(THREE, idx, W) {
  let set = new Set(); try { set = new Set(JSON.parse(localStorage.getItem(LOCK_KEY) || '[]')); } catch (e) {}
  const tex = [lockTex(THREE, false), lockTex(THREE, true)], icons = [];
  for (const m of idx.group.children) { const u = m.userData.hangIndex; if (!u || u.slot || u.k == null) continue;
    const id = u.room + ':' + u.k, ic = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), new THREE.MeshBasicMaterial({ map: tex[+set.has(id)], transparent: true, depthWrite: false }));
    ic.position.copy(m.position).addScaledVector(u.t, -0.23); ic.rotation.copy(m.rotation); ic.name = 'wallLock:' + id; ic.userData.wallLock = id; idx.group.add(ic); icons.push(ic); }
  const save = () => { try { localStorage.setItem(LOCK_KEY, JSON.stringify([...set].sort())); } catch (e) {} };
  const toggle = id => { if (set.has(id)) set.delete(id); else set.add(id); save(); for (const ic of icons) if (ic.userData.wallLock === id) ic.material.map = tex[+set.has(id)]; return set.has(id); };
  const api = { key: LOCK_KEY, icons, locked: id => !!id && set.has(id), toggle, list: () => [...set],
    at: (pos, n) => api.locked(wallIdAt(W, pos.x, pos.z, n.x, n.z)),
    painting: p => { const d = p && p.data; if (!d || !Number.isFinite(d.ix)) return false; return api.locked(wallIdAt(W, d.x, d.z, d.ix, d.iz)); } };
  const ray = new THREE.Raycaster();
  addEventListener('mousedown', e => { if (e.button !== 0) return; const g = window.game; if (!g || !g.camera) return; const locked = !!document.pointerLockElement;
    const v = locked ? new THREE.Vector2(0, 0) : new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    if (!locked && e.target && e.target.tagName !== 'CANVAS') return;
    g.camera.updateMatrixWorld(); ray.setFromCamera(v, g.camera); ray.far = 14; const h = ray.intersectObjects(icons, false)[0]; if (!h) return;
    e.stopImmediatePropagation(); e.preventDefault(); const on = toggle(h.object.userData.wallLock); const u = h.object.userData.wallLock; g.say?.((on ? 'WALL LOCKED ' : 'WALL UNLOCKED ') + (idx.map.get(u.split(':')[0]) + '-' + (+u.split(':')[1] + 1)), 1.4); }, true);
  return api;
}

export function hangIndexMap(W) {
  const rooms = W.rooms.filter(r => r.kind === 'room').map(r => r.id).sort();
  return new Map(rooms.map((id, i) => [id, 'H' + (i + 1)]));
}

export function slotKey(a) { return [-Math.round(a.y / 0.05), a.x * a.iz - a.z * a.ix, a.id]; }
function cmpKey(p, q) { const a = slotKey(p), b = slotKey(q); return a[0] - b[0] || a[1] - b[1] || (a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : 0); }

// -> [{ code:'H1-2-1', H, wall, slot, art }]
export function slotOrder(W, map = hangIndexMap(W)) {
  const groups = new Map();
  for (const a of W.art || []) {
    if (a.kind !== 'painting') continue;
    const H = map.get(a.room), k = a.src && a.src.wall; if (!H || k == null) continue;
    const key = H + '-' + (k + 1); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(a);
  }
  const out = [];
  for (const [key, list] of groups) list.sort(cmpKey).forEach((a, i) => out.push({ code: key + '-' + (i + 1), H: key.split('-')[0], wall: +key.split('-')[1], slot: i + 1, art: a }));
  return out;
}

function labelTex(THREE, text) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 32;
  const g = c.getContext('2d'); g.font = '20px monospace'; g.fillStyle = 'rgba(60,60,60,0.55)';
  g.textBaseline = 'middle'; g.fillText(text, 4, 16);
  const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter; return t;
}

export function installHangIndex(THREE, parent, W, { force = false } = {}) {
  const mode = force ? { slots: true, edit: false } : hangIndexMode(); if (!mode) return null;
  const map = hangIndexMap(W), grp = new THREE.Group(); grp.name = 'hangIndex773';
  const seen = new Set();
  for (const w of W.walls) {
    const H = map.get(w.room); if (!H || w.free || w.k == null) continue;
    const key = w.room + ':' + w.k; if (seen.has(key)) continue; seen.add(key);
    const text = w.k === 0 ? `${H} · ${H}-1` : `${H}-${w.k + 1}`;
    const L = Math.hypot(w.x1 - w.x0, w.z1 - w.z0) || 1, tx = (w.x1 - w.x0) / L, tz = (w.z1 - w.z0) / L;
    const W_ = 0.32, Hh = 0.08; // 32 cm x 8 cm plate: tiny
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W_, Hh),
      new THREE.MeshBasicMaterial({ map: labelTex(THREE, text), transparent: true, depthWrite: false }));
    // corner: start of the side, 25 cm in along the wall, 18 cm under the wall top, 4 cm inside (normal points out)
    m.position.set(w.x0 + tx * (0.25 + W_ / 2) - w.nx * 0.04, (w.h || WALL_H) - 0.18, w.z0 + tz * (0.25 + W_ / 2) - w.nz * 0.04);
    m.rotation.y = Math.atan2(-w.nx, -w.nz); // face into the room
    m.name = 'hangIndex:' + text; m.userData.hangIndex = { room: w.room, H, wall: w.k + 1, k: w.k, t: new THREE.Vector3(tx, 0, tz) };
    grp.add(m);
  }
  // slot labels: tinier, top-left corner of each frame (visitor's left), 3 cm above, 1 cm off the canvas face
  const slots = mode.slots ? slotOrder(W, map) : [];
  for (const s of slots) {
    const a = s.art, tx = a.iz, tz = -a.ix, W_ = 0.12, Hh = 0.03;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W_, Hh),
      new THREE.MeshBasicMaterial({ map: labelTex(THREE, s.code), transparent: true, depthWrite: false }));
    const off = -(a.w || 0.5) / 2 + W_ / 2;
    m.position.set(a.x + tx * off + a.ix * 0.01, a.y + (a.h || 0.5) / 2 + 0.03, a.z + tz * off + a.iz * 0.01);
    m.rotation.y = Math.atan2(a.ix, a.iz); // face into the room
    m.name = 'hangIndex:' + s.code; m.userData.hangIndex = { room: a.room, H: s.H, wall: s.wall, slot: s.slot, painting: a.id };
    grp.add(m);
  }
  parent.add(grp);
  const out = { group: grp, map, slots, mode, dispose() { parent.remove(grp); grp.traverse(o => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); }); } };
  if (mode.edit) { try { out.locks = window.__wallLocks = installWallLocks(THREE, out, W); } catch (e) { console.warn('[856 locks]', e); } }
  return out;
}
