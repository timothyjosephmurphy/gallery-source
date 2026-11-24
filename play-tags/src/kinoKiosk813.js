// #813 (TJ Oct 28 2026): Kinoteka BFF'26 film kiosk. Procedural stand at the front-left of the hall (off the centre aisle) + a DOM list
// of the 18 cinema-programme titles (src/kino-bff26.json). Free full films play in-gallery (Coined: chunked mp4 on the screen texture;
// YouTube: an HTML iframe laid over the projected screen). Gated / trailer-only titles show a card that links out to IndeeHub (new tab);
// no IndeeHub player is ever embedded. Resume is per film id in S.res.
import * as THREE from 'three';
import CAT from './kino-bff26.json';
export function installKiosk813(G, I, { fy, S, scr, muted, add, M, cv, low }) {
  const films = [...CAT.films].sort((p, q) => (p.mode === 'gated') - (q.mode === 'gated')) /* kiosk842: free / YouTube first */, byId = id => films.find(f => f.id === id), K = { cat: CAT, opens: 0, cards: 0 };
  // ---- 3D stand (decor only, no collider): dark plinth + angled lit panel, faces the entrance
  const st = new THREE.Group(); st.name = 'kiosk813'; st.position.set(-1.9, fy, 11.75); st.rotation.y = Math.PI / 2; /* kiosk842: just inside the door, immediately on your right walking in, faces the entry path */ I.add(st);
  add(M(0x2a2420, 0.6, 0.3), 0.7, 1.05, 0.45, 0, 0.525, 0, st); add(M(0xc9a34a, 0.35, 0.8), 0.78, 0.05, 0.52, 0, 1.07, 0, st);
  const tx = cv(512, 640, (x, w, h) => { x.fillStyle = '#14100d'; x.fillRect(0, 0, w, h); x.strokeStyle = '#c9a34a'; x.lineWidth = 10; x.strokeRect(14, 14, w - 28, h - 28);
    x.fillStyle = '#f3ead6'; x.textAlign = 'center'; x.font = 'bold 64px Georgia, serif'; x.fillText('BFF’26', w / 2, 120); x.font = '34px Georgia, serif'; x.fillText('FILM KIOSK', w / 2, 172);
    x.fillStyle = '#c9a34a'; x.fillRect(80, 200, w - 160, 3); x.fillStyle = '#e8dcc0'; x.font = '24px Georgia, serif'; x.textAlign = 'left';
    films.slice(0, 12).forEach((f, i) => x.fillText((f.mode === 'gated' ? '◦ ' : '▶ ') + f.title.split(' — ')[0].slice(0, 30), 60, 250 + i * 30));
    x.textAlign = 'center'; x.fillStyle = '#f3ead6'; x.font = 'bold 26px Georgia, serif'; x.fillText('Tap  FILMS  to choose', w / 2, 612); });
  const pan = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.0), new THREE.MeshBasicMaterial({ map: tx, toneMapped: false })); pan.position.set(0, 1.62, 0.03); pan.rotation.x = -0.18; st.add(pan);
  add(M(0x2a2420, 0.6, 0.3), 0.86, 1.06, 0.04, 0, 1.62, 0, st).rotation.x = -0.18;
  st.traverse(o => { if (o.isMesh) o.userData.decor800 = true; });
  // ---- DOM: FILMS button (only near/in the hall) + list panel + gated card
  const css = document.createElement('style'); css.textContent = `#k813b{position:fixed;right:12px;top:62px;z-index:60;font:600 14px Georgia,serif;background:#14100dd9;color:#f3ead6;border:1px solid #c9a34a;border-radius:8px;padding:8px 12px;cursor:pointer;display:none}
#k813p{position:fixed;right:12px;top:104px;z-index:61;width:min(360px,calc(100vw - 24px));max-height:calc(100vh - 130px);overflow:auto;background:#14100df0;color:#f3ead6;border:1px solid #c9a34a;border-radius:10px;font:14px Georgia,serif;display:none;padding:10px}
#k813p h3{margin:2px 4px 8px;font-size:16px}#k813p button.f{display:flex;justify-content:space-between;gap:8px;width:100%;text-align:left;background:none;color:inherit;border:0;border-bottom:1px solid #3a3128;padding:9px 4px;font:inherit;cursor:pointer}
#k813p button.f.on{color:#ffd77a}#k813p .tg{font-size:11px;padding:2px 6px;border-radius:4px;white-space:nowrap;align-self:center}#k813p .fr{background:#2f5d3a}#k813p .ih{background:#4a3a20}
#k813c{margin:8px 2px;padding:10px;border:1px solid #c9a34a;border-radius:8px;background:#221a14;display:none}#k813c a{display:block;margin-top:8px;padding:9px;border-radius:6px;text-align:center;text-decoration:none;color:#14100d;background:#ffd77a;font-weight:700}#k813c a.s{background:none;color:#e8dcc0;border:1px solid #6a5a40;font-weight:400}
#k813y{position:fixed;z-index:20;border:0;display:none;background:#000}`;
  document.head.appendChild(css);
  const el = (t, id, p = document.body) => { const e = document.createElement(t); if (id) e.id = id; p.appendChild(e); return e; };
  const btn = el('button', 'k813b'), pnl = el('div', 'k813p'); btn.textContent = '🎞 FILMS';
  ['pointerdown', 'touchstart', 'mousedown', 'keydown'].forEach(ev => [btn, pnl].forEach(n => n.addEventListener(ev, e => e.stopPropagation())));
  const h = el('h3', '', pnl); h.textContent = 'Bitcoin Film Fest ’26 · cinema programme'; const cardEl = el('div', 'k813c', pnl), list = el('div', '', pnl); const sec = t => { const d = el('div', '', list); d.style.cssText = 'font-size:12px;letter-spacing:.06em;color:#ffd77a;margin:10px 4px 2px'; d.textContent = t; }; sec('▶ WATCH FREE HERE · tap to play'); let ihHead = false;
  const rows = films.map(f => { if (f.mode === 'gated' && !ihHead) { ihHead = true; const x = el('a', 'k842ih', list); x.href = CAT.home || 'https://indeehub.studio/'; x.target = '_blank'; x.rel = 'noopener'; x.textContent = 'View the rest on IndeeHub ↗'; x.style.cssText = 'display:block;margin:12px 2px 4px;padding:9px;border-radius:6px;text-align:center;text-decoration:none;color:#14100d;background:#ffd77a;font-weight:700'; sec('ON INDEEHUB · ticket holders / subscribe / rent'); } const b = el('button', '', list); b.className = 'f'; b.dataset.id = f.id; b.innerHTML = '<span></span><span class="tg"></span>'; b.firstChild.textContent = f.title;
    b.lastChild.textContent = f.mode === 'gated' ? 'IndeeHub ↗' : f.mode === 'yt' ? '▶ YouTube · here' : '▶ Free · here'; b.lastChild.classList.add(f.mode === 'gated' ? 'ih' : 'fr'); b.onclick = () => { const r = S.pick(f.id); mark(); if (r !== 'gated') pnl.scrollTop = 0; }; return b; });
  const mark = () => rows.forEach(b => b.classList.toggle('on', b.dataset.id === S.film));
  btn.onclick = () => { const o = pnl.style.display !== 'block'; pnl.style.display = o ? 'block' : 'none'; if (o) { K.opens++; mark(); } };
  K.card = f => { K.cardId = f ? f.id : null; if (!f) { cardEl.style.display = 'none'; return; } K.cards++; cardEl.innerHTML = '';
    const t = el('b', '', cardEl); t.textContent = f.title; const m = el('div', '', cardEl); m.style.cssText = 'font-size:12px;opacity:.75;margin:3px 0 6px'; m.textContent = f.meta; el('div', '', cardEl).textContent = f.blurb;
    const a = (href, txt, cls, id) => { const x = el('a', id || '', cardEl); x.href = href; x.target = '_blank'; x.rel = 'noopener'; x.textContent = txt; if (cls) x.className = cls; return x; };
    a(f.ih, 'Watch on IndeeHub ↗', '', 'k813ih'); a(CAT.screening, 'Become a ticket holder · Screening Room ↗', 's');
    if (f.trailer) a('https://www.youtube.com/watch?v=' + f.trailer, 'Trailer on YouTube ↗', 's'); a(CAT.faq, 'Festival ticket → VOD (FAQ) ↗', 's');
    cardEl.style.display = 'block'; pnl.style.display = 'block'; pnl.scrollTop = 0; };
  K.byId = byId; let shown = false;
  K.near = n => { if (n === shown) return; shown = n; btn.style.display = n ? 'block' : 'none'; if (!n) { pnl.style.display = 'none'; K.card(null); } };
  // ---- YouTube free full films: iframe over the projected screen; per-film resume via the player's infoDelivery currentTime
  let yf = null, yid = null, yst = -1, ymute = null, yInfo = 0, yT = 0; const post = (func, args = []) => { try { yf.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*'); } catch (e) {} };
  addEventListener('message', e => { if (!yf || e.source !== yf.contentWindow) return; let d; try { d = JSON.parse(e.data); } catch (x) { return; } const i = d && d.info; if (!i) return;
    if (typeof i.currentTime === 'number' && yid) { S.res[yid] = { t: i.currentTime }; yInfo = performance.now(); } if (typeof i.playerState === 'number') yst = i.playerState; });
  K.startYT = id => { const f = byId(id); if (!f || !f.yt) return; K.stopYT(); yid = id; yst = -1; ymute = null; const R = S.res[id];
    yf = el('iframe', 'k813y'); yf.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; yf.title = f.title;
    yf.src = 'https://www.youtube-nocookie.com/embed/' + f.yt + '?enablejsapi=1&autoplay=1&playsinline=1&rel=0&modestbranding=1' + (muted() ? '&mute=1' : '') + (R ? '&start=' + Math.floor(R.t) : '') + '&origin=' + encodeURIComponent(location.origin);
    yf.addEventListener('load', () => { try { yf.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 813 }), '*'); } catch (e) {} }); K.yt = (K.yt || 0) + 1; };
  K.stopYT = () => { yT = 0; if (yf) { post('pauseVideo'); yf.remove(); yf = null; } yid = null; yst = -1; };
  K.ytPlaying = () => !!yf && yst !== 2 && yst !== 0;
  const c4 = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(() => new THREE.Vector3()), hw = scr.geometry.parameters.width / 2, hh = scr.geometry.parameters.height / 2;
  K.tickYT = cam => { if (!yf) return; const now = performance.now(), dt = yT ? (now - yT) / 1000 : 0; yT = now; if (now - yInfo > 2500 && yst !== 2 && yst !== 0 && dt < 1) { const r = S.res[yid] || (S.res[yid] = { t: 0 }); r.t += dt; } // wall-clock fallback when the player sends no infoDelivery const m = muted(); if (m !== ymute) { ymute = m; post(m ? 'mute' : 'unMute'); }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, ok = true; const W = innerWidth, H = innerHeight;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b], k) => { const p = scr.localToWorld(c4[k].set(a * hw, b * hh, 0)).project(cam); if (p.z > 1 || p.z < -1) ok = false; const sx = (p.x + 1) / 2 * W, sy = (1 - p.y) / 2 * H; x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy); });
    if (!ok || x1 - x0 < 60) { yf.style.display = 'none'; return; } x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(W, x1); y1 = Math.min(H, y1);
    yf.style.cssText = `display:block;left:${x0}px;top:${y0}px;width:${x1 - x0}px;height:${y1 - y0}px`; };
  return K;
}
