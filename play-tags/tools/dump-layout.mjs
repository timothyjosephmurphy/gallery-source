// usage: node tools/dump-layout.mjs [room]  -> compact per-wall listing of the current catalog (s, size m, y, stack, title)
import fs from 'node:fs';
const C = JSON.parse(fs.readFileSync(new URL('../src/catalog.json', import.meta.url))), T = C.layout.tags, only = process.argv[2];
const rooms = Object.fromEntries(T.rooms.map(r => [r.id, r]));
const by = {};
for (const p of C.paintings) { if (!rooms[p.room]) continue; (by[p.room + '/' + p.wall] ||= []).push(p); }
for (const k of Object.keys(by).sort()) { const [rid] = k.split('/'); if (only && !k.startsWith(only)) continue; const r = rooms[rid], ps = by[k];
  const tx = ps[0].iz, tz = -ps[0].ix; const s = p => +((p.x * tx + p.z * tz)).toFixed(2);
  const base = s(ps[0]) - (T.paintings.find(l => l.id === ps[0].id)?.s ?? 0);
  console.log(`${k} span=±${(r.radius / 2 - 0.2).toFixed(2)} door=${(r.doorWalls || []).includes(+k.split('/')[1]) ? (r.doorOffsets || {})[k.split('/')[1]] ?? 0 : '-'} n=${ps.length}`);
  for (const p of ps.sort((a, b) => (T.paintings.find(l => l.id === a.id)?.s ?? 0) - (T.paintings.find(l => l.id === b.id)?.s ?? 0)))
    console.log(`  s=${(T.paintings.find(l => l.id === p.id)?.s ?? 0).toFixed(2)} y=${p.y} ${p.fw.toFixed(2)}x${p.fh.toFixed(2)}${p.stack ? ' ST:' + p.stack.col + '#' + p.stack.pos : ''}${p.grid ? ' GR' : ''} ${p.id.slice(0, 34)} | ${p.title.slice(0, 30)}${p.status === 'available' ? ' $' : ''}`);
}
