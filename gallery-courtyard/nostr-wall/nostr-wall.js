// Nostr wall — read-only NIP-01 fetch of TJ Murphy's latest kind-1 notes. No keys, no signing.
export const AUTHOR = '7edfc4a9556797f26adab9d1fd5adbe5f66f174546f8ddeee09502cd532f88cb';
export const DEFAULT_RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.primal.net'];
const CACHE_KEY = 'nostr-wall:v1';
export const CACHE_TTL_MS = 10 * 60 * 1000;
const mem = new Map();

const B32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
function polymod(v) { const G = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]; let c = 1;
  for (const x of v) { const b = c >> 25; c = ((c & 0x1ffffff) << 5) ^ x; for (let i = 0; i < 5; i++) if ((b >> i) & 1) c ^= G[i]; } return c; }
function bech32(hrp, bytes) {
  const d = []; let acc = 0, bits = 0;
  for (const b of bytes) { acc = (acc << 8) | b; bits += 8; while (bits >= 5) { bits -= 5; d.push((acc >> bits) & 31); } }
  if (bits) d.push((acc << (5 - bits)) & 31);
  const hx = [...hrp].map(c => c.charCodeAt(0) >> 5).concat([0], [...hrp].map(c => c.charCodeAt(0) & 31));
  const p = polymod(hx.concat(d, [0, 0, 0, 0, 0, 0])) ^ 1;
  const cs = [0, 1, 2, 3, 4, 5].map(i => (p >> (5 * (5 - i))) & 31);
  return hrp + '1' + d.concat(cs).map(x => B32[x]).join('');
}
export function noteId(hex) { return bech32('note', hex.match(/../g).map(h => parseInt(h, 16))); }

export function isValidNote(ev) {
  return ev && ev.kind === 1 && ev.pubkey === AUTHOR && /^[0-9a-f]{64}$/.test(ev.id) &&
    Number.isInteger(ev.created_at) && typeof ev.content === 'string';
}
export function toPlain(ev, zaps = 0) {
  return { id: ev.id, createdAt: ev.created_at, content: ev.content, zaps, url: `https://njump.me/${noteId(ev.id)}` };
}
export function dedupeSort(events) {
  const m = new Map(); for (const e of events) if (isValidNote(e)) m.set(e.id, e);
  return [...m.values()].sort((a, b) => b.created_at - a.created_at);
}
export function countZaps(zapEvents, ids) {
  const set = new Set(ids), seen = new Set(), c = {};
  for (const z of zapEvents) {
    if (!z || z.kind !== 9735 || seen.has(z.id)) continue; seen.add(z.id);
    const e = (z.tags || []).find(t => t[0] === 'e' && set.has(t[1]));
    if (e) c[e[1]] = (c[e[1]] || 0) + 1;
  }
  return c;
}

function query(relay, filters, timeoutMs) {
  return new Promise(resolve => {
    const out = []; let ws, done = false;
    const finish = () => { if (done) return; done = true; clearTimeout(t); try { ws.close(); } catch {} resolve(out); };
    const t = setTimeout(finish, timeoutMs);
    try { ws = new WebSocket(relay); } catch { return finish(); }
    const sub = 'w' + Math.random().toString(36).slice(2, 8);
    ws.onopen = () => ws.send(JSON.stringify(['REQ', sub, ...filters]));
    ws.onmessage = m => { let msg; try { msg = JSON.parse(m.data); } catch { return; }
      if (msg[0] === 'EVENT' && msg[1] === sub) out.push(msg[2]);
      else if ((msg[0] === 'EOSE' && msg[1] === sub) || msg[0] === 'CLOSED') finish(); };
    ws.onerror = finish; ws.onclose = finish;
  });
}
async function queryAll(relays, filters, timeoutMs) {
  return (await Promise.all(relays.map(r => query(r, filters, timeoutMs)))).flat();
}

function cacheGet() {
  try { if (typeof localStorage !== 'undefined') { const v = JSON.parse(localStorage.getItem(CACHE_KEY)); if (v && Date.now() - v.t < CACHE_TTL_MS) return v.notes; return null; } } catch {}
  const v = mem.get(CACHE_KEY); return v && Date.now() - v.t < CACHE_TTL_MS ? v.notes : null;
}
function cacheSet(notes) {
  const v = { t: Date.now(), notes };
  try { if (typeof localStorage !== 'undefined') { localStorage.setItem(CACHE_KEY, JSON.stringify(v)); return; } } catch {}
  mem.set(CACHE_KEY, v);
}
export function clearCache() { mem.clear(); try { localStorage.removeItem(CACHE_KEY); } catch {} }

export async function loadFallback() {
  try {
    const url = new URL('./fallback.json', import.meta.url);
    if (url.protocol === 'file:') { const fs = await import('node:fs/promises'); return JSON.parse(await fs.readFile(url, 'utf8')); }
    return await (await fetch(url)).json();
  } catch { return []; }
}

export async function getNotes({ limit = 10, relays = DEFAULT_RELAYS, timeoutMs = 4000, useCache = true, zaps = true } = {}) {
  if (useCache) { const c = cacheGet(); if (c && c.length >= Math.min(limit, 1)) return c.slice(0, limit); }
  let notes = [];
  if (typeof WebSocket !== 'undefined') {
    const evs = dedupeSort(await queryAll(relays, [{ kinds: [1], authors: [AUTHOR], limit }], timeoutMs)).slice(0, limit);
    let zc = {};
    if (zaps && evs.length) zc = countZaps(await queryAll(relays, [{ kinds: [9735], '#e': evs.map(e => e.id) }], timeoutMs), evs.map(e => e.id));
    notes = evs.map(e => toPlain(e, zc[e.id] || 0));
  }
  if (!notes.length) return (await loadFallback()).slice(0, limit);
  if (useCache) cacheSet(notes);
  return notes;
}

function wrap(ctx, text, maxW) {
  const lines = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      let w = word;
      while (ctx.measureText(w).width > maxW && w.length > 1) { // hard-break long URLs
        let i = w.length; while (i > 1 && ctx.measureText(w.slice(0, i)).width > maxW) i--;
        if (line) { lines.push(line); line = ''; } lines.push(w.slice(0, i)); w = w.slice(i);
      }
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    lines.push(line);
  }
  return lines;
}

export function renderNotesToCanvas(notes, { width = 1024, height = 1024, padding = 40, fontSize = 22,
  font = 'system-ui, sans-serif', background = '#111', color = '#eee', accent = '#b388ff', title = 'TJ Murphy on Nostr', canvas } = {}) {
  const c = canvas || document.createElement('canvas'); c.width = width; c.height = height;
  const ctx = c.getContext('2d'); const lh = fontSize * 1.35, maxW = width - padding * 2;
  ctx.fillStyle = background; ctx.fillRect(0, 0, width, height); ctx.textBaseline = 'top';
  let y = padding;
  ctx.fillStyle = accent; ctx.font = `bold ${fontSize * 1.5}px ${font}`; ctx.fillText(title, padding, y); y += fontSize * 2.5;
  for (const n of notes) {
    if (y > height - padding - lh) break;
    ctx.fillStyle = accent; ctx.font = `${fontSize * 0.8}px ${font}`;
    ctx.fillText(new Date(n.createdAt * 1000).toLocaleString() + (n.zaps ? `  ⚡ ${n.zaps}` : ''), padding, y); y += lh;
    ctx.fillStyle = color; ctx.font = `${fontSize}px ${font}`;
    for (const l of wrap(ctx, n.content, maxW).slice(0, 8)) { if (y > height - padding - lh) break; ctx.fillText(l, padding, y); y += lh; }
    y += lh * 0.6;
  }
  return c; // use: new THREE.CanvasTexture(c)
}
