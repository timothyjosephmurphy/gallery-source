// Frames for every room wall (even empty ones), calibrated on the painting planes of the current catalog: node tools/wallframes.mjs > tools/wallframes.json
import fs from 'node:fs';
const C = JSON.parse(fs.readFileSync(new URL('../src/catalog.json', import.meta.url))), T = C.layout.tags;
const out = {}, chk = [];
for (const r of T.rooms) {
  const known = {}; for (const p of C.paintings) if (p.room === r.id && !known[p.wall]) known[p.wall] = p;
  const ws = Object.keys(known).map(Number); if (!ws.length) { out[r.id] = null; continue; }
  const [cx, cz] = r.center, k0 = ws[0], p0 = known[k0], a0 = Math.atan2(p0.iz, p0.ix);
  const dpl = ((cx - p0.x) * p0.ix + (cz - p0.z) * p0.iz) * -1; // distance centre -> painting plane (along inward normal: centre is at +dpl... sign handled below)
  const d = Math.abs((p0.x - cx) * p0.ix + (p0.z - cz) * p0.iz);
  // sign of rotation per wall step from two known walls (default +60deg)
  let sgn = 1; if (ws.length > 1) { const k1 = ws[1], p1 = known[k1], a1 = Math.atan2(p1.iz, p1.ix); let da = ((a1 - a0) * 180 / Math.PI + 540) % 360 - 180; const step = ((k1 - k0) * 60 + 540) % 360 - 180; sgn = Math.abs(da - step) < 5 ? 1 : (Math.abs(da + step) < 5 ? -1 : 0); }
  out[r.id] = { center: r.center, d: +d.toFixed(3), sgn, walls: {} };
  for (let k = 0; k < 6; k++) {
    const a = a0 + sgn * (k - k0) * Math.PI / 3, ix = Math.cos(a), iz = Math.sin(a), bx = cx - ix * d, bz = cz - iz * d;
    out[r.id].walls[k] = { bx: +bx.toFixed(3), bz: +bz.toFixed(3), ix: +ix.toFixed(4), iz: +iz.toFixed(4), door: (r.doorWalls || []).includes(k) ? +((r.doorOffsets || {})[k] ?? 0) : null };
    if (known[k]) { const q = known[k]; chk.push(Math.hypot((q.x - bx) * q.iz * 0 + ((q.x - bx) * -q.iz + (q.z - bz) * q.ix) * 0, 0) + Math.abs((q.x - bx) * q.ix + (q.z - bz) * q.iz) + Math.abs(q.ix - ix) + Math.abs(q.iz - iz)); }
  }
}
console.error('max plane/normal mismatch', Math.max(...chk).toFixed(4));
console.log(JSON.stringify(out));
