// Pull tagged TJ Murphy paintings from a vermillionaurora checkout + pending tag proposals -> data/works.json
// usage: node tools/extract.mjs [/path/to/vermillionaurora] [proposal.json ...]
import fs from 'node:fs'; import path from 'node:path';
const REPO = process.argv[2] || '/workspace/va-251';
const PROPS = process.argv.length > 3 ? process.argv.slice(3) : ['/workspace/tags-proposal-250.json', '/workspace/tags-proposal-250-additions.json'];
const C = path.join(REPO, 'catalog');
const all = (await import(path.join(C, 'all-products.mjs'))).default;
const rw = await import(path.join(C, 'related-works.mjs'));
const tagsData = JSON.parse(fs.readFileSync(path.join(C, 'painting-tags.json'), 'utf8'));
const assign = {}; const add = (id, ts) => { id = rw.resolveId(id); assign[id] = [...new Set([...(assign[id] || []), ...ts])]; };
for (const [id, ts] of Object.entries(tagsData.assignments)) add(id, ts);
for (const f of PROPS) for (const [id, ts] of Object.entries(JSON.parse(fs.readFileSync(f, 'utf8')))) if (Array.isArray(ts)) add(id, ts);
const group = rw.twinGroups(all, (tagsData.twins || []).map(g => g.map(rw.resolveId)));
const eligible = p => p && p.type === 'painting' && p.artist === 'TJ Murphy';
const rank = p => (p.bookGallery ? 2 : p.archive || p.olderWork ? 1 : 0);
// physical size in metres (true size); approx flag when estimated / unit unknown / defaulted
const IN = 0.0254, U = { in: IN, cm: 0.01, mm: 0.001, ft: 0.3048 };
function size(p) {
  const d = p.dimensions || p.estimatedDimensions;
  if (d && d.width && d.height) return { w: d.width * (U[d.unit] || IN), h: d.height * (U[d.unit] || IN), approx: !!(d.approximate || p.estimatedDimensions && !p.dimensions) };
  for (const s of p.bookSources || []) for (const m of s.measurements || []) { const q = /([\d.]+)\s*[x×]\s*([\d.]+)/.exec(m); if (q) return { w: +q[1] * IN, h: +q[2] * IN, approx: true, note: 'book measurement, inches assumed' }; }
  return null;
}
const groups = new Map();
for (const p of all) { if (!eligible(p)) continue; const g = group(p.id); (groups.get(g) || groups.set(g, []).get(g)).push(p); }
const works = [];
for (const [g, ps] of groups) {
  const tags = [...new Set(ps.flatMap(p => assign[p.id] || []))];
  if (!tags.length) continue;
  ps.sort((a, b) => rank(a) - rank(b) || (b.listing?.status === 'available') - (a.listing?.status === 'available'));
  const p = ps[0], sz = ps.map(size).find(Boolean) || null;
  const img = ps.map(q => q.image).find(i => i && (i.src || i.fullSrc));
  if (!img) continue;
  works.push({ id: p.id, twins: ps.slice(1).map(q => q.id), title: p.title, url: `https://tjm.art/products/${p.slug}/`, tags, size: sz, img: img.src, hi: img.fullSrc || img.src, imgW: img.width || null, imgH: img.height || null, year: p.year || null, medium: p.medium || null });
}
const defs = { ...tagsData.tags };
for (const t of new Set(works.flatMap(w => w.tags))) if (!defs[t]) defs[t] = { label: t.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase()), kind: 'subject', proposed: true };
fs.writeFileSync(new URL('../data/works.json', import.meta.url), JSON.stringify({ tags: defs, works }, null, 1));
console.log('works', works.length, 'noSize', works.filter(w => !w.size).length, 'noImgDims', works.filter(w => !w.imgW).length, 'tags', Object.keys(defs).length);
