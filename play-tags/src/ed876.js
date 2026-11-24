// #876 elf carry drop: never land the visitor inside a fountain, the H8 helix dais, or any other obstacle.
import * as THREE from 'three';

export function createED876({ CATALOG, scene, camera, walkable, roomAt, pillars, MINI, DAIS }) {
  const PR = 0.42, MG = 0.2, FT = [];
  (function scan(o, d) {
    if (!o || d > 6 || typeof o !== 'object') return;
    if (Array.isArray(o)) { for (const x of o) scan(x, d + 1); return; }
    for (const k in o) {
      const v = o[k];
      if (k === 'fountains' && Array.isArray(v)) {
        for (const f of v) if (f && isFinite(f.x) && isFinite(f.z)) FT.push({ x: f.x, z: f.z, r: (f.r || 1.2) + 0.3, kind: 'fountain' });
      } else if (v && typeof v === 'object') scan(v, d + 1);
    }
  })(CATALOG.layout && CATALOG.layout.tags, 0);

  const cols = () => {
    const a = FT.slice();
    try { const g = window.game; if (g && g.tags && g.tags.allColliders) for (const c of g.tags.allColliders()) a.push(c); } catch {}
    try { for (const k of ['__helix876', '__helix875']) { const H = window[k]; if (H && H.base) { a.push({ x: H.base.x, z: H.base.z, r: Math.max(H.base.r || 0, H.daisR || 0.85), kind: 'helix' }); break; } } } catch {}
    try { const w = window.eggs && window.eggs.world; if (w && w.colliders) for (const c of w.colliders) if (!c.off && !c.pass && c.r < 3) a.push(c); } catch {}
    return a;
  };

  let OB = null, OBt = -1e9;
  const ob = () => {
    const now = performance.now();
    if (OB && now - OBt < 15e3) return OB;
    OBt = now; OB = [];
    const bx = new THREE.Box3();
    try {
      scene.traverse(o => {
        if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.visible || !o.geometry || o.userData.noRay || o.userData.decor || o.userData.grab || o.userData.ball) return;
        for (let q = o; q; q = q.parent) if (q.visible === false) return;
        bx.setFromObject(o);
        if (!isFinite(bx.min.x) || bx.max.y < 0.15 || bx.min.y > 1.6) return;
        const sx = bx.max.x - bx.min.x, sz = bx.max.z - bx.min.z;
        if ((sx > 5 && sz > 5) || sx * sz > 12 || (sx < 0.03 && sz < 0.03)) return;
        OB.push([bx.min.x, bx.min.z, bx.max.x, bx.max.z]);
      });
    } catch {}
    return OB;
  };
  const inOb = (x, z, m) => { for (const b of ob()) if (x > b[0] - m && x < b[2] + m && z > b[1] - m && z < b[3] + m) return true; return false; };

  function clear(x, z, C) {
    C = C || cols();
    if (inOb(x, z, PR)) return false;
    if (!walkable(x, z)) return false;
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; if (!walkable(x + Math.cos(a) * PR, z + Math.sin(a) * PR)) return false; }
    for (const c of C) if (Math.hypot(x - c.x, z - c.z) < (c.r || 0.5) + PR + MG) return false;
    for (const [px, pz] of pillars) if (Math.abs(x - px) < 0.3 + PR + MG && Math.abs(z - pz) < 0.3 + PR + MG) return false;
    for (const b of MINI) if (Math.abs(x - b.x) < 1.9 && Math.abs(z - b.z) < 1.9) return false;
    return !(Math.abs(x - DAIS.x) < 2.8 && Math.abs(z - DAIS.z) < 2.8);
  }

  function free(x, z, C) {
    const S = 0.25, seen = new Set(['0,0']), q = [[0, 0]];
    let n = 0;
    while (q.length && n < 64) {
      const [i, k] = q.shift(); n++;
      for (const [di, dk] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = i + di, b = k + dk, key = a + ',' + b;
        if (seen.has(key) || Math.abs(a) > 8 || Math.abs(b) > 8) continue;
        seen.add(key);
        if (clear(x + a * S, z + b * S, C)) q.push([a, b]);
      }
    }
    return n >= 64;
  }

  function centre(r) {
    if (r.id === 'central') return [DAIS.x, DAIS.z];
    if (r.center) return [r.center[0], r.center[1]];
    if (isFinite(r.minX)) return [(r.minX + r.maxX) / 2, (r.minZ + r.maxZ) / 2];
    return [camera.position.x, camera.position.z];
  }

  function pick(r, info) {
    if (!r) return null;
    const C = cols(), [cx, cz] = centre(r), R = Math.min(9, (r.radius || 8) * 0.92);
    let tries = 0;
    for (let rad = 0; rad <= R; rad += 0.5) {
      const n = rad ? Math.max(8, Math.round(Math.PI * 2 * rad / 0.5)) : 1;
      for (let j = 0; j < n; j++) {
        const a = j / n * Math.PI * 2 + rad * 0.37, x = cx + Math.cos(a) * rad, z = cz + Math.sin(a) * rad;
        tries++;
        const ra = roomAt(x, z);
        if (!ra || ra.id !== r.id) continue;
        if (clear(x, z, C) && free(x, z, C)) {
          if (info) Object.assign(info, { room: r.id, centre: [cx, cz], x, z, ring: rad, tries });
          return new THREE.Vector3(x, 0, z);
        }
      }
    }
    const p = camera.position;
    for (let rad = 0; rad <= 6; rad += 0.5) {
      const n = rad ? Math.max(8, Math.round(Math.PI * 2 * rad / 0.5)) : 1;
      for (let j = 0; j < n; j++) {
        const a = j / n * Math.PI * 2, x = p.x + Math.cos(a) * rad, z = p.z + Math.sin(a) * rad;
        tries++;
        if (clear(x, z, C) && free(x, z, C)) {
          if (info) Object.assign(info, { room: r.id, fallback: 1, x, z, ring: rad, tries });
          return new THREE.Vector3(x, 0, z);
        }
      }
    }
    if (info) Object.assign(info, { room: r.id, fallback: 2, tries });
    return null;
  }

  window.__elfDrop876 = { pick, clear: (x, z) => clear(x, z), free: (x, z) => free(x, z), cols, obs: ob, PR, MG, last: null };
  return {
    pick: r => {
      const i = {};
      let v = pick(r, i);
      if (!v) { const G = window.__checkoutGate && window.__checkoutGate.pos; v = G ? new THREE.Vector3(G.x, 0, G.z) : new THREE.Vector3(camera.position.x, 0, camera.position.z); i.gate = 1; }
      window.__elfDrop876.last = i;
      return v;
    }
  };
}
