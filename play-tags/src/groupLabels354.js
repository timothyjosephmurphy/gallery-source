// #354: Visual's thematic group wall labels (public/group-labels/, labels354.json), ~1.6 x 0.4 m.
// Hang labels: centred over the hang's members (catalog layout x/z/y/fh, inward normal ix/iz), 6 cm above the top frame, capped under the 4.2 m wall top.
// Door labels: inside face of the room's inner (nave) door, above the 3.5 m arch apex. Phone/low loads the -phone webp. ?glabels=0 turns them off.
import * as THREE from 'three';
import { DOOR_H, WALL_H } from './tags-world.js';
import FAM788D from './label-family788.desktop.webp?inline'; import FAM788P from './label-family788.phone.webp?inline';
// #788 (TJ Oct 27 2026): bundled label patches on top of the R2 labels354.json (no R2 write): Father Paul sign reads "Family" (#740),
// Ridges sign removed (#740), Small Watercolors 3x3 without the color wheel (#744), Hummingbirds flock +2 feeder studies (#741),
// Bounty of Satoshi drops Phoenix Rising (now rehung on H2 SW wall, #787 park).
export function patch788(cfg, list) { const rm = { 'small-watercolors': ['older-work-lake-hillside-color-wheel-original-3'], 'bounty-of-satoshi': ['painting-phoenix-rising'] };
  const add = { hummingbirds: ['book-art-aa4dcced8a2ae6a8111c', 'book-art-8fde7c978d6cd5d53727'] };
  cfg[list] = (cfg[list] || []).filter(L => L.id !== 'renoirs-and-ridges' && L.id !== 'ridges').map(L => { L = { ...L };
    if (L.members && rm[L.id]) L.members = L.members.filter(i => !rm[L.id].includes(i)); if (L.members && add[L.id]) L.members = [...L.members, ...add[L.id].filter(i => !L.members.includes(i))];
    if (L.id === 'father-paul' && list === 'labels') { L.title = 'Family'; L.desktopUrl = FAM788D; L.phoneUrl = FAM788P; } return L; }); return cfg; }
const BASE = (import.meta.env.BASE_URL || '/') + 'img/play/preview-251/group-labels/';
export function installGroupLabels354({ root, CATALOG, W, low }) {
  const S = window.__glabels354 = { placed: [], skipped: [], err: null, fit: 'glfit' };
  if (new URLSearchParams(location.search).get('glabels') === '0') { S.err = 'off'; return S; }
  const LP = new Map(); for (const p of CATALOG.paintings || []) if (isFinite(p.x)) LP.set(p.id, p);
  for (const p of (CATALOG.layout && CATALOG.layout.tags && CATALOG.layout.tags.paintings) || []) if (isFinite(p.x)) LP.set(p.id, p);
  fetch(BASE + 'labels354.json').then(r => r.json()).then(cfg => { cfg = patch788(cfg, 'labels');
    const Wd = cfg.w || 1.6, Ht = cfg.h || 0.4, geo = new THREE.PlaneGeometry(Wd, Ht), loader = new THREE.TextureLoader(), grp = new THREE.Group(); grp.name = 'groupLabels354'; root.add(grp);
    for (const L of cfg.labels) {
      let pos = null, nrm = null, k = 1;
      if (L.members && CATALOG.layout && CATALOG.layout.tags && CATALOG.layout.tags.noWallPlates817) { S.skipped.push(L.id + ': #817 on-wall plate off'); continue; } /* #817 */
      if (L.members) { const ms = L.members.map(i => LP.get(i)).filter(Boolean); if (!ms.length) { S.skipped.push(L.id + ': members not in catalog'); continue; }
        const a = ms[0], n = new THREE.Vector3(a.ix, 0, a.iz).normalize(), t = new THREE.Vector3(-n.z, 0, n.x);
        let lo = Infinity, hi = -Infinity, top = -Infinity; for (const m of ms) { const s = m.x * t.x + m.z * t.z, hw = (m.fw || m.w) / 2; lo = Math.min(lo, s - hw); hi = Math.max(hi, s + hw); top = Math.max(top, m.y + (m.fh || m.h) / 2); }
        k = Math.min(1, Math.max(0.55, (hi - lo + 0.3) / Wd)); const s0 = a.x * t.x + a.z * t.z, mid = (lo + hi) / 2; let y = top + 0.06 + Ht * k / 2; const cap = WALL_H - 0.05 - Ht * k / 2;
        if (y > cap) { S.skipped.push(L.id + ': clamped under wall top (grid top ' + top.toFixed(2) + ' m)'); y = cap; }
        pos = new THREE.Vector3(a.x + t.x * (mid - s0), y, a.z + t.z * (mid - s0)).addScaledVector(n, 0.005); nrm = n;
      } else if (L.door) { const d = (W.doors || []).find(q => q.room === L.door && q.kind === 'inner'); if (!d) { S.skipped.push(L.id + ': no inner door ' + L.door); continue; }
        nrm = new THREE.Vector3(-d.nx, 0, -d.nz); pos = new THREE.Vector3(d.x, DOOR_H + 0.05 + Ht / 2, d.z).addScaledVector(nrm, 0.035);
      } else { S.skipped.push(L.id + ': ' + (L.skip || 'no placement')); continue; }
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0 }), m = new THREE.Mesh(geo, mat); m.visible = false; // glfit: hidden until its texture lands (no blank white slab)
      loader.load((low ? L.phoneUrl : L.desktopUrl) || BASE + (low ? L.phone : L.desktop), tx => { tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = low ? 2 : 8; mat.map = tx; mat.needsUpdate = true; if (!m.userData.wtHidden) m.visible = true; }, undefined, () => { S.err = 'tex ' + L.id; });
      m.scale.setScalar(k); m.position.copy(pos); m.lookAt(pos.x + nrm.x, pos.y, pos.z + nrm.z); m.name = 'glabel354-' + L.id; grp.add(m);
      S.placed.push({ id: L.id, k: +k.toFixed(2), x: +pos.x.toFixed(2), y: +pos.y.toFixed(2), z: +pos.z.toFixed(2) });
    }
  }).catch(e => { S.err = String(e); });
  return S;
}
