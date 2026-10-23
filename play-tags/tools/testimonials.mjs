// #293 build step: read the approved collector testimonials from tjm.art (the same public feed the /testimonials page uses) into
// src/testimonials.json, and bake a small world land outline (Natural Earth 110m, public domain) into src/world-land.json once.
// Offline builds keep the last good copy, so a network blip never breaks the build.
import fs from 'fs';
const SRC = 'https://tjm.art/testimonials/api/approved', OUT = new URL('../src/testimonials.json', import.meta.url), LAND = new URL('../src/world-land.json', import.meta.url);
try { const r = await fetch(SRC, { headers: { Accept: 'application/json' } }); if (!r.ok) throw new Error('HTTP ' + r.status); const j = await r.json();
  const items = (j.testimonials || []).filter(t => Array.isArray(t.pin) && t.pin.length === 2).map(t => ({ id: t.id, name: String(t.name || 'A collector').slice(0, 60), city: String(t.city || '').slice(0, 60), pin: t.pin.map(Number), painting: String(t.painting || '').slice(0, 90), quote: String(t.quote || '').replace(/\s+/g, ' ').slice(0, 420) }));
  fs.writeFileSync(OUT, JSON.stringify({ source: SRC, fetchedAt: new Date().toISOString(), updatedAt: j.updatedAt || null, items }, null, 1)); console.log('testimonials', items.length, 'from', SRC);
} catch (e) { if (!fs.existsSync(OUT)) fs.writeFileSync(OUT, JSON.stringify({ source: SRC, items: [] })); console.warn('testimonials: kept cached copy (' + e.message + ')'); }
if (!fs.existsSync(LAND)) { try { const g = await (await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson')).json(); const rings = [];
  for (const f of g.features) { const gm = f.geometry, polys = gm.type === 'Polygon' ? [gm.coordinates] : gm.coordinates; for (const p of polys) rings.push(p[0].map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10])); }
  fs.writeFileSync(LAND, JSON.stringify(rings)); console.log('land rings', rings.length); } catch (e) { console.warn('land outline unavailable', e.message); fs.writeFileSync(LAND, '[]'); } }
