// Anonymous splat counter: which paintings visitors hit with the soup thermos.
// Batched (15 s timer + page hide), at most one report per painting per session, fire-and-forget, silent on any failure.
// Only active on tjm.art (the demo never reports). window.__splatTest = 1 marks hits as test hits (kept separate on the stats page).
const API = 'https://splats.tjm.art/hit';
const ON = /(^|\.)tjm\.art$/.test(location.hostname);
let sid = '', sent = new Set(), q = new Set(), timer = 0;
try { sid = sessionStorage.getItem('tjmSplatSid') || ''; sent = new Set(JSON.parse(sessionStorage.getItem('tjmSplatSent') || '[]')); } catch (e) {}
if (!/^[A-Za-z0-9_-]{16,40}$/.test(sid)) { const a = new Uint8Array(16); crypto.getRandomValues(a); sid = [...a].map(x => (x % 36).toString(36)).join('') + 'xx'; try { sessionStorage.setItem('tjmSplatSid', sid); } catch (e) {} }
function flush(hidden) {
  clearTimeout(timer); timer = 0; if (!q.size || !ON) return;
  const hits = [...q]; q.clear(); hits.forEach(s => sent.add(s));
  try { sessionStorage.setItem('tjmSplatSent', JSON.stringify([...sent])); } catch (e) {}
  const body = JSON.stringify({ sid, hits, test: window.__splatTest ? 1 : 0 });
  try {
    // text/plain keeps it a "simple" request: no CORS preflight, and sendBeacon survives the page closing
    if (hidden && navigator.sendBeacon && navigator.sendBeacon(API, new Blob([body], { type: 'text/plain' }))) return;
    fetch(API, { method: 'POST', body, headers: { 'content-type': 'text/plain' }, keepalive: true, mode: 'cors', credentials: 'omit' }).catch(() => {});
  } catch (e) {}
}
export function trackSplat(slug) {
  if (!ON || !slug || sent.has(slug) || q.has(slug)) return;
  q.add(slug); if (!timer) timer = setTimeout(() => flush(false), 15000);
}
addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(true); });
addEventListener('pagehide', () => flush(true));
export const splatLog = { flush: () => flush(false), get queued() { return [...q]; }, get sent() { return [...sent]; }, get on() { return ON; } };
