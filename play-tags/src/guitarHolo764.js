// #764 (TJ Oct 27 2026): floor plinths with the four guitar holograms from the Quake dungeon (harness2-uffizi HOLOS), one per hex room
// that had no floor plinth (book plinths sit in H1/H5/H11/H12). Same SBS colour|alpha videos already hosted on img.tjm.art/play/holo/,
// drawn by gallery-core makeHolos (shaders, glow disc, room audio). Mute follows game.holo. Plinth = MINI step (2.8 x 0.25), walkable.
import * as THREE from 'three';
import { makeHolos } from './holo.js';
const BASE = 'https://img.tjm.art/play/holo/';
export const GUITAR764 = [
  { room: 'room-04', src: 'holo_central_full_v2.mp4', still: 'still_central_full.jpg', asp: 600 / 408, title: 'Barre-chord loop (2026-08-21)' },
  { room: 'room-06', src: 'holo_bass_full_v2.mp4', still: 'still_bass_full.jpg', asp: 454 / 408, title: 'Bass and guitar in counterpoint, G (2026-03-10)' },
  { room: 'room-09', src: 'holo_irish_full_v2.mp4', still: 'still_irish_full.jpg', asp: 454 / 408, title: 'Improv after two days of drilling Irish tunes (2026-03-20)' },
  { room: 'room-10', src: 'holo_psy.mp4', still: 'still_psy.jpg', asp: 454 / 408, title: 'Psychedelic (2026-09-16)' }];
export function installGuitar764(root, T, low, W) {
  const open = new Set((T.openCourts || []).map(o => o.id)), PH = 0.25, HALF = 1.4;
  const defs = GUITAR764.map(d => { const r = (T.rooms || []).find(q => q.id === d.room); if (!r || open.has(r.id)) return null; const [x, z] = r.center, a = r.radius || 7;
    return { ...d, x, z, y: PH, b: { minX: x - a, maxX: x + a, minZ: z - a, maxZ: z + a } }; }).filter(Boolean);
  const metal = new THREE.MeshStandardMaterial({ color: 0x8a8d92, roughness: 0.35, metalness: 0.8 }), rim = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.5, metalness: 0.6 });
  const G = new THREE.Group(); G.name = 'guitar764'; root.add(G);
  for (const d of defs) { const m = new THREE.Mesh(new THREE.BoxGeometry(2 * HALF, PH, 2 * HALF), [rim, rim, metal, rim, rim, rim]); m.position.set(d.x, PH / 2, d.z); m.name = 'guitar764-plinth-' + d.room; G.add(m); }
  const prev = window.__floorH800; // chain onto the #800 floor hook read by gallery-core floorH
  window.__floorH800 = (x, z) => { const h = prev ? prev(x, z) : null; if (h != null) return h; for (const d of defs) if (Math.abs(x - d.x) < HALF && Math.abs(z - d.z) < HALF) return PH; return null; };
  const cam = () => window.game && game.camera;
  const camP = { get position() { return cam().position; }, get quaternion() { return cam().quaternion; } }; // game.camera may not exist yet at install
  const holo = makeHolos(root, camP, defs, { low, base: BASE });
  const S = { rooms: defs.map(d => d.room), urls: defs.map(d => BASE + d.src), started: false };
  const first = () => { holo.begin(); holo.setMuted(!!(window.game && game.holo && game.holo.muted)); S.started = true; }; ['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, first, { passive: true }));
  let t0 = 0; const tick = now => { requestAnimationFrame(tick); const c = cam(); if (!c) return; const dt = t0 ? Math.min(0.5, (now - t0) / 1000) : 0; t0 = now;
    const gm = !!(window.game && game.holo && game.holo.muted); if (gm !== holo.muted) holo.setMuted(gm);
    const rm = W.roomAt(c.position.x, c.position.z); holo.update(dt, now, rm ? rm.id : null);
    for (const d of defs) { const dx = c.position.x - d.x, dz = c.position.z - d.z, q = Math.hypot(dx, dz); if (q < 0.6 && q > 0) { c.position.x = d.x + dx / q * 0.6; c.position.z = d.z + dz / q * 0.6; } } };
  requestAnimationFrame(tick);
  S.holo = holo; S.state = () => holo.state; return S;
}
