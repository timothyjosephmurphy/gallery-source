// #354 wall title plates (wall-title-plates-354): 2.0 x 0.5 m headers centred above a hang grid, bottom edge `gap` (0.2 m) over the top frame,
// clamped under the wall top. Members come from walltitles354.json (same ids as group labels). Entries with `door` go on the inner door header.
// When a plate is placed, the matching small groupLabels354 label is hidden so the two don't stack. ?wtitles=0 turns them off.
import * as THREE from 'three';
import { DOOR_H, WALL_H } from './tags-world.js';
import { patch788 } from './groupLabels354.js';
const BASE = (import.meta.env.BASE_URL || '/') + 'img/play/preview-251/wall-titles-354/';
export function installWallTitles354({ root, CATALOG, W, low }) {
  const S = window.__wtitles354 = { placed: [], skipped: [], err: null };
  if (new URLSearchParams(location.search).get('wtitles') === '0') { S.err = 'off'; return S; }
  const LP = new Map(); for (const p of CATALOG.paintings || []) if (isFinite(p.x)) LP.set(p.id, p);
  for (const p of (CATALOG.layout && CATALOG.layout.tags && CATALOG.layout.tags.paintings) || []) if (isFinite(p.x)) LP.set(p.id, p);
  fetch(BASE + 'walltitles354.json').then(r => r.json()).then(cfg => { cfg = patch788(cfg, 'plates');
    const Wd = cfg.w || 2.0, Ht = cfg.h || 0.5, gap = cfg.gap ?? 0.2, geo = new THREE.PlaneGeometry(Wd, Ht), loader = new THREE.TextureLoader(), grp = new THREE.Group(); grp.name = 'wallTitles354'; root.add(grp);
    for (const L of cfg.plates) {
      let pos = null, nrm = null;
      if (L.members && CATALOG.layout && CATALOG.layout.tags && CATALOG.layout.tags.noWallPlates817) { S.skipped.push(L.id + ': #817 on-wall plate off'); continue; } /* #817 */
      if (L.members) { const ms = L.members.map(i => LP.get(i)).filter(Boolean); if (!ms.length) { S.skipped.push(L.id + ': members not in catalog'); continue; }
        const a = ms[0], n = new THREE.Vector3(a.ix, 0, a.iz).normalize(), t = new THREE.Vector3(-n.z, 0, n.x);
        let lo = Infinity, hi = -Infinity, top = -Infinity; for (const m of ms) { const s = m.x * t.x + m.z * t.z, hw = (m.fw || m.w) / 2; lo = Math.min(lo, s - hw); hi = Math.max(hi, s + hw); top = Math.max(top, m.y + (m.fh || m.h) / 2); }
        const s0 = a.x * t.x + a.z * t.z, mid = (lo + hi) / 2; let y = top + gap + Ht / 2; const cap = WALL_H - 0.05 - Ht / 2;
        if (y > cap) { S.skipped.push(L.id + ': clamped under wall top (grid top ' + top.toFixed(2) + ' m)'); y = cap; }
        pos = new THREE.Vector3(a.x + t.x * (mid - s0), y, a.z + t.z * (mid - s0)).addScaledVector(n, 0.008); nrm = n;
      } else if (L.door) { const d = (W.doors || []).find(q => q.room === L.door && q.kind === 'inner'); if (!d) { S.skipped.push(L.id + ': no inner door ' + L.door); continue; }
        nrm = new THREE.Vector3(-d.nx, 0, -d.nz); pos = new THREE.Vector3(d.x, DOOR_H + 0.05 + Ht / 2, d.z).addScaledVector(nrm, 0.04);
      } else { S.skipped.push(L.id + ': ' + (L.skip || 'no placement')); continue; }
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0 });
      loader.load(BASE + (low ? L.phone : L.desktop), tx => { tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = low ? 2 : 8; mat.map = tx; mat.needsUpdate = true; }, undefined, () => { S.err = 'tex ' + L.id; });
      const m = new THREE.Mesh(geo, mat); m.position.copy(pos); m.lookAt(pos.x + nrm.x, pos.y, pos.z + nrm.z); m.name = 'wtitle354-' + L.id; grp.add(m);
      const hide = () => { const sm = root.getObjectByName('glabel354-' + L.id); if (sm) { sm.visible = false; sm.userData.wtHidden = true; } return !!sm; }; if (!hide()) [500, 2000, 5000].forEach(ms => setTimeout(hide, ms));
      S.placed.push({ id: L.id, x: +pos.x.toFixed(2), y: +pos.y.toFixed(2), z: +pos.z.toFixed(2) });
    }
  }).catch(e => { S.err = String(e); });
  return S;
}
