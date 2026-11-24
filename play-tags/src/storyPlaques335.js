// #335 (TJ approved Oct 29 2026): Writer's story plaques, one brass Art Deco plate per story group, hung beside the group's paintings at eye level.
// Plate face 0.45 x 0.28 m (gallery-courtyard/story-plaques NOTES.md). Text is baked at runtime into the plate albedo (option B):
// title + story inside text_rect x 96..928, y 88..552 of a 1024x640 canvas, ink #2a1a0c. Albedo = per-room brass plate (phone tier, upscaled).
// Placement: the wall holding most of the group's paintings; first free slot beside the cluster (paintings, plaques, signs, doors, wall ends checked).
// Read-only: no layout writes. ?story335=0 turns them off. State on window.__story335.
import * as THREE from 'three';
import DATA from './storyPlaques335.json';
const FW = 0.45, FH = 0.28;
function wrap(ctx, text, maxW) { const out = []; for (const para of String(text).split(/\n+/)) { let line = ''; for (const w of para.split(/\s+/)) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); } return out; }
function bake(img, g, low) {
  const cw = low ? 512 : 1024, ch = cw * 0.625, k = cw / 1024, cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const c = cv.getContext('2d');
  c.drawImage(img, 0, 0, cw, ch); const x0 = 96 * k, x1 = 928 * k, y0 = 88 * k, y1 = 552 * k, W = x1 - x0 - 24 * k, ink = '#2a1a0c', serif = 'Georgia, "Times New Roman", serif';
  c.fillStyle = ink; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  let ts = 40 * k; c.font = `bold ${ts}px ${serif}`; while (c.measureText(g.title).width > W && ts > 22 * k) { ts -= k; c.font = `bold ${ts}px ${serif}`; }
  let y = y0 + 14 * k + ts; c.fillText(g.title, (x0 + x1) / 2, y); y += 14 * k;
  c.fillRect((x0 + x1) / 2 - 120 * k, y, 240 * k, Math.max(1, 2 * k)); c.beginPath(); c.arc((x0 + x1) / 2, y + k, 5 * k, 0, 7); c.fill(); y += 18 * k;
  let bs = 28 * k, lines; for (;;) { c.font = `${bs}px ${serif}`; lines = wrap(c, g.text, W); if (y + lines.length * bs * 1.3 <= y1 - 6 * k || bs <= 15 * k) break; bs -= k; }
  const lh = bs * 1.3, top = y + Math.max(0, (y1 - 6 * k - y - lines.length * lh) / 2); for (let i = 0; i < lines.length; i++) c.fillText(lines[i], (x0 + x1) / 2, top + (i + 0.82) * lh);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = low ? 2 : 8; return { tx, bs: +(bs / k).toFixed(1), lines: lines.length };
}
export function installStoryPlaques335({ root, CATALOG, W, low }) {
  const S = window.__story335 = { placed: [], skipped: [], missing: [], err: null };
  if (new URLSearchParams(location.search).get('story335') === '0') { S.err = 'off'; return S; }
  const LP = new Map(); for (const p of (CATALOG.layout && CATALOG.layout.tags && CATALOG.layout.tags.paintings) || []) if (isFinite(p.x)) LP.set(p.id, p);
  const obst = (W.art || []).map(a => ({ x: a.x, z: a.z, y: a.y, w: a.w, h: a.h, ix: a.ix, iz: a.iz, id: a.id }));
  const grp = new THREE.Group(); grp.name = 'storyPlaques335'; root.add(grp); const geo = new THREE.PlaneGeometry(FW, FH), loader = new THREE.ImageLoader();
  for (const g of DATA) {
    const ms = g.ids.map(i => LP.get(i)).filter(Boolean); for (const i of g.ids) if (!LP.has(i)) S.missing.push(g.id + ':' + i);
    if (!ms.length) { S.skipped.push(g.id + ': no paintings hung'); continue; }
    const key = m => [Math.round(m.ix * 50), Math.round(m.iz * 50), Math.round((m.x * m.ix + m.z * m.iz) * 5)].join(), cl = new Map();
    for (const m of ms) { const k = key(m); if (!cl.has(k)) cl.set(k, []); cl.get(k).push(m); }
    const clusters = [...cl.values()].sort((a, b) => b.length - a.length || b.reduce((s, m) => s + m.fw, 0) - a.reduce((s, m) => s + m.fw, 0));
    let pick = null, why = [];
    for (const relax of [0, 1]) { if (pick) break;
    for (const best of clusters) {
      const a = best[0], L = Math.hypot(a.ix, a.iz) || 1, n = new THREE.Vector2(a.ix / L, a.iz / L), t = new THREE.Vector2(-n.y, n.x), d0 = a.x * n.x + a.z * n.y;
      const sOf = (x, z) => x * t.x + z * t.y; let lo = Infinity, hi = -Infinity, bot = Infinity; for (const m of best) { const s = sOf(m.x, m.z); lo = Math.min(lo, s - m.fw / 2); hi = Math.max(hi, s + m.fw / 2); bot = Math.min(bot, m.y - m.fh / 2); }
      // wall segments on this plane (art hangs ~3 cm in front of the layout line, either facing)
      const segs = (W.walls || []).filter(w => Math.abs(Math.abs(w.nx * n.x + w.nz * n.y) - 1) < 0.02 && Math.abs(w.x0 * n.x + w.z0 * n.y - d0) < 0.2).map(w => { const p = sOf(w.x0, w.z0), q = sOf(w.x1, w.z1); return [Math.min(p, q), Math.max(p, q)]; });
      const same = obst.filter(o => { const l = Math.hypot(o.ix, o.iz) || 1; return (o.ix * n.x + o.iz * n.y) / l > 0.98 && Math.abs(o.x * n.x + o.z * n.y - d0) < 0.15; });
      const s0 = sOf(a.x, a.z), at = s => [a.x + t.x * (s - s0), a.z + t.y * (s - s0)];
      const free = (s, y) => { if (!segs.some(([p, q]) => s - FW / 2 > p + 0.12 && s + FW / 2 < q - 0.12)) return 'wall';
        for (const o of same) { const os = sOf(o.x, o.z); if (Math.abs(os - s) < (o.w + FW) / 2 + 0.05 && Math.abs(o.y - y) < (o.h + FH) / 2 + 0.05) return o.id; }
        const [px, pz] = at(s); for (const P of S.placed) if (Math.hypot(P.x - px, P.z - pz) < FW + 0.05 && Math.abs(P.y - y) < FH + 0.05) return 'story'; return false; };
      // eye-level band first (1.45 +/- 0.3), scanning outward from the cluster edge up to 2.5 m; then under the cluster (centre >= 0.95 m)
      const cands = []; for (let off = 0.1; off <= (relax ? 6 : 2.5); off += 0.05) for (const y of (relax ? [1.45, 1.3, 1.6, 1.15, 1.75, 1.0, 1.9, 0.85] : [1.45, 1.3, 1.6, 1.15, 1.75])) for (const s of [hi + off + FW / 2, lo - off - FW / 2]) cands.push({ s, y, gap: +off.toFixed(2), cost: off + Math.abs(y - 1.45) * 2 });
      { const y = bot - 0.06 - FH / 2; if (y >= (relax ? 0.75 : 0.95)) cands.push({ s: (lo + hi) / 2, y, gap: 'below', cost: 0.4 + Math.abs(y - 1.45) * 2 }); if (relax) for (const s of [lo + FW / 2, hi - FW / 2]) for (let y = bot - 0.06 - FH / 2; y >= 0.75; y -= 0.1) cands.push({ s, y, gap: 'below-side', cost: 0.6 + Math.abs(y - 1.45) * 2 }); }
      cands.sort((p, q) => p.cost - q.cost); for (const c of cands) { const r = free(c.s, c.y); if (!r) { const [px, pz] = at(c.s); pick = { ...c, px, pz, n, best, a }; break; } why.push(r); }
      if (pick) break;
    }
    }
    if (!pick) { S.skipped.push(g.id + ': no free slot (' + [...new Set(why)].slice(0, 4).join(',') + ')'); continue; }
    const { n, best, a } = pick, pos = new THREE.Vector3(pick.px + n.x * 0.012, pick.y, pick.pz + n.y * 0.012);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42, metalness: 0.35, alphaTest: 0.5 }), m = new THREE.Mesh(geo, mat); m.visible = false;
    m.position.copy(pos); m.lookAt(pos.x + n.x, pos.y, pos.z + n.y); m.name = 'brassStory335-' + g.id; grp.add(m);
    const rec = { id: g.id, wall: best.length + '/' + ms.length, room: a.room, x: +pos.x.toFixed(2), y: +pos.y.toFixed(2), z: +pos.z.toFixed(2), gap: pick.gap, plate: g.plate }; S.placed.push(rec);
    loader.load(import.meta.env.BASE_URL + 'story335/plate-' + g.plate + '.webp', img => { try { const b = bake(img, g, low); mat.map = b.tx; mat.needsUpdate = true; m.visible = true; rec.font = b.bs; rec.lines = b.lines; } catch (e) { S.err = 'bake ' + g.id + ' ' + e; } }, undefined, () => { S.err = 'tex ' + g.id; });
  }
  return S;
}
