// Phone + onboarding UI shared by every gallery (studio-tracker #149, #150; 2026-10-18). Self-contained: no gallery CSS edits needed.
//  #149  phone controls are laid out from the real screen size and safe areas (notch / Dynamic Island, Safari bars), with a minimum gap
//        between buttons; they shrink on small screens, and the hotbar stays clear of the button cluster (wraps instead of being cut off).
//        Pinch zoom and double-tap zoom are blocked inside the gallery (viewport meta, touch-action, iOS gesture events, double-tap).
//        The game's own touch look / move keep working: we never stop propagation, we only cancel the browser's default zoom.
//  #150  start screen: one short movement line (keyboard on desktop, thumbs on touch), 'TAP TO ENTER' on touch; a one-line tip when a
//        tool is selected (fades after a few seconds); a short thumb-help overlay the first times a touch visitor enters;
//        toolbar order 1 Buy Scanner (default), 2 Soup, then the rest (window.__toolStep gives the next tool in hotbar order).
// Silent: this module makes no sound.
(function () {
  if (typeof document === 'undefined' || window.__museumUI) return; window.__museumUI = 1;
  const coarse = matchMedia('(pointer:coarse)').matches, root = document.documentElement;
  // ---------- zoom guard ----------
  const vp = document.querySelector('meta[name=viewport]'); if (vp) vp.content = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
  const noZoom = e => { e.preventDefault(); };
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => document.addEventListener(ev, noZoom, { passive: false }));
  document.addEventListener('touchmove', e => { if (e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault(); }, { passive: false });
  let lastEnd = 0; document.addEventListener('touchend', e => { const now = e.timeStamp || performance.now(), t = e.target, tag = t && t.tagName;
    if (now - lastEnd < 350 && e.touches.length === 0 && !(tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'A' || tag === 'BUTTON')) e.preventDefault(); lastEnd = now; }, { passive: false });
  document.addEventListener('dblclick', e => { if (coarse) e.preventDefault(); }, { passive: false });
  // ---------- styles ----------
  const st = document.createElement('style'); st.id = 'museum-ui-css';
  st.textContent = [
    'html,body{touch-action:none;overscroll-behavior:none;-webkit-text-size-adjust:100%}',
    'canvas,#touch,#touch *,#hud,#hud *,#trun,#tburst{touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}',
    '#openbrowser,#cart,.lbl3d.board,#eggAskBox{touch-action:pan-y}',
    '#start .ui-help{margin:10px 16px 0;font:13px/1.5 monospace;color:#e8c070;max-width:90vw}',
    '#museum-tip{position:fixed;left:50%;transform:translateX(-50%);bottom:var(--ui-tipb,40px);z-index:35;width:max-content;max-width:min(560px,var(--ui-tipw,90vw));',
    ' box-sizing:border-box;padding:6px 14px;border-radius:14px;background:rgba(20,14,8,.78);border:1px solid rgba(200,160,100,.5);color:#f6e2b4;font:600 13px/1.35 Georgia,serif;text-align:center;',
    ' pointer-events:none;opacity:0;transition:opacity .35s}#museum-tip.on{opacity:1}',
    '.museum-thumb{position:fixed;z-index:34;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:6px;color:#f6e2b4;font:600 13px/1.3 Georgia,serif;text-align:center;',
    ' text-shadow:0 1px 3px #000;opacity:0;transition:opacity .5s}.museum-thumb.on{opacity:.95}',
    '.museum-thumb i{display:block;width:58px;height:58px;border-radius:50%;border:2px dashed rgba(246,226,180,.85);background:rgba(20,14,8,.35)}',
    '.museum-thumb span{background:rgba(20,14,8,.7);border:1px solid rgba(200,160,100,.5);border-radius:12px;padding:4px 10px;max-width:42vw}',
    '@media (pointer:coarse){',
    ' #tmove{left:var(--ui-sl,0px)!important;bottom:calc(var(--ui-sb,0px) + var(--ui-hudh,26px))!important;width:calc(50vw - var(--ui-sl,0px))!important;height:45vh!important}',
    ' #tfire{position:fixed!important;right:calc(var(--ui-sr) + var(--ui-m))!important;bottom:calc(var(--ui-cb))!important;width:var(--ui-bf)!important;height:var(--ui-bf)!important;font-size:var(--ui-ff)!important;box-sizing:border-box}',
    ' #tswap{position:fixed!important;right:auto!important;left:calc(var(--ui-sl) + var(--ui-m))!important;bottom:calc(var(--ui-sb) + var(--ui-hudh) + 45vh + 8px)!important;display:flex!important;align-items:center;justify-content:center;padding:0!important;width:var(--ui-bs)!important;height:var(--ui-bs)!important;font-size:var(--ui-fs)!important;box-sizing:border-box}',
    ' #tlaunch,#tburst{position:fixed!important;right:calc(var(--ui-sr) + var(--ui-m) + (var(--ui-bf) - var(--ui-bs)) / 2)!important;bottom:calc(var(--ui-cb) + var(--ui-bf) + var(--ui-gap))!important;width:var(--ui-bs)!important;height:var(--ui-bs)!important;font-size:var(--ui-fs)!important;box-sizing:border-box}',
    ' #trun{left:calc(var(--ui-sl) + var(--ui-m))!important;bottom:calc(var(--ui-sb) + var(--ui-hudh) + 45vh + 8px)!important}',
    ' #hud{flex-wrap:wrap!important;justify-content:center!important;row-gap:2px;box-sizing:border-box;width:max-content!important;max-width:var(--ui-hudw)!important;left:var(--ui-hudx)!important;transform:translateX(-50%)!important;bottom:var(--ui-sb)!important}',
    ' #hud .wpn{white-space:nowrap}#hud #runcell,#hud .cell:has(#hitn){display:none!important}',
    ' #tswap svg{width:58%;height:58%;pointer-events:none}',
    ' #eggAsk{right:calc(var(--ui-sr) + 10px)!important}', '}', '@media (pointer:coarse) and (max-width:560px){#title{display:none!important}',
    '}'].join('\n');
  (document.head || root).appendChild(st);
  // ---------- layout from the real screen (safe areas measured with a probe) ----------
  const probe = document.createElement('div'); probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  const px = v => parseFloat(v) || 0;
  function layout() {
    if (!probe.parentNode && document.body) document.body.appendChild(probe);
    const cs = getComputedStyle(probe), fk = window.__uiSafeArea /* test hook */, sl = fk ? fk.l : px(cs.paddingLeft), sr = fk ? fk.r : px(cs.paddingRight), sb = fk ? fk.b : px(cs.paddingBottom), W = innerWidth, H = innerHeight, small = Math.min(W, H);
    const bf = Math.round(Math.max(50, Math.min(76, small * 0.16))), bs = Math.round(bf * 0.8), gap = Math.max(10, Math.round(bf * 0.2)), m = Math.max(10, Math.round(bf * 0.18));
    const cluster = m + bf + gap + bs, side = Math.max(sl, sr) + cluster + 8, set = (k, v) => root.style.setProperty(k, v);
    set('--ui-sl', sl + 'px'); set('--ui-sr', sr + 'px'); set('--ui-sb', sb + 'px'); set('--ui-bf', bf + 'px'); set('--ui-bs', bs + 'px'); set('--ui-gap', gap + 'px'); set('--ui-m', m + 'px');
    set('--ui-ff', Math.max(11, Math.round(bf * 0.2)) + 'px'); set('--ui-fs', Math.max(10, Math.round(bs * 0.19)) + 'px'); set('--ui-side', side + 'px');
    // wide enough: the hotbar sits between the side clusters; narrow (portrait): full width, and the buttons sit above it
    const wide = W - 2 * side >= 300; set('--ui-hudw', (wide ? W - 2 * side : W - sl - sr - 8) + 'px'); set('--ui-hudx', (wide ? W / 2 : sl + (W - sl - sr) / 2) + 'px');
    const hud = document.getElementById('hud'), hh = hud && coarse ? Math.ceil(hud.getBoundingClientRect().height) : 26; set('--ui-hudh', hh + 'px');
    const cb = wide ? sb + m : sb + hh + m; set('--ui-cb', cb + 'px');
    set('--ui-tipw', (wide ? W - 2 * side : W - sl - sr - 24) + 'px'); set('--ui-tipb', (wide || !coarse ? sb + hh + 10 : cb + bf + gap + bs + 10) + 'px');
  }
  let lt = 0; const relayout = () => { cancelAnimationFrame(lt); lt = requestAnimationFrame(() => { layout(); requestAnimationFrame(layout); }); };
  addEventListener('resize', relayout); addEventListener('orientationchange', () => setTimeout(relayout, 250)); if (window.visualViewport) visualViewport.addEventListener('resize', relayout);
  // ---------- toolbar: 1 Buy Scanner, 2 Soup, then the rest; numbers follow the hotbar order ----------
  const slots = () => [...document.querySelectorAll('#hud .wpn')];
  function reorder() { const hud = document.getElementById('hud'); if (!hud) return; const s = hud.querySelector('.wpn[data-w="0"]'), b = hud.querySelector('.wpn[data-w="1"]');
    if (s && b && s.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) s.before(b);
    slots().forEach((el, i) => { const n = el.querySelector('b'); if (n && n.textContent !== String(i + 1)) n.textContent = String(i + 1); }); }
  window.__toolStep = (w, dir) => { const o = slots().map(el => +el.dataset.w); if (!o.length) return w; const i = o.indexOf(w); return o[((i < 0 ? 0 : i) + (dir < 0 ? o.length - 1 : 1)) % o.length]; };
  window.__toolAt = n => { const el = slots()[n - 1]; return el ? +el.dataset.w : null; }; // number key n (1-based, hotbar order) -> weapon index
  // ---------- start screen ----------
  const DESK = 'WASD move · mouse look · Shift to run', TOUCH = 'Left thumb: move · Right thumb: drag to look · Tap a painting to open it';
  function startScreen() { const s = document.getElementById('start'); if (!s || s.__ui) return; s.__ui = 1;
    [...s.querySelectorAll('p')].forEach(p => { const t = p.textContent.trim(); if (/^(CLICK|TAP) TO ENTER$/i.test(t)) { if (coarse) p.textContent = 'TAP TO ENTER'; }
      else if (p.classList.contains('help') || /WASD|Shift|wheel|switch tool/i.test(t)) { if (!p.classList.contains('ui-help')) p.style.display = 'none'; } });
    let h = s.querySelector('.ui-help'); if (!h) { h = document.createElement('p'); h.className = 'ui-help'; const hl = s.querySelector('#homelink'); if (hl) hl.before(h); else s.appendChild(h); }
    const txt = coarse ? TOUCH : DESK; h.textContent = txt; // other modules append their old key help here; keep just the one line
    new MutationObserver(() => { if (h.textContent !== txt) h.textContent = txt; }).observe(h, { childList: true, characterData: true, subtree: true }); }
  // ---------- tool tips ----------
  const TIPS = {
    'buy scanner': ['Buy Scanner: aim at a painting and click to add it to your cart', 'Buy Scanner: aim at a painting and tap SCAN to add it to your cart'],
    'soup thermos': ['Soup Thermos: click to throw soup', 'Soup Thermos: tap THROW to throw soup'],
    'gravity gun': ['Gravity Gun: click to grab or hang, right-click to launch', 'Gravity Gun: tap GRAB to grab or hang, LAUNCH to throw'],
    'glitter cannon': ['Glitter Cannon: hold click to spray, right-click for a burst', 'Glitter Cannon: hold SPRAY, tap BURST for a burst'],
    'leaf blower': ['Leaf Blower: hold click to blow', 'Leaf Blower: hold BLOW'] };
  let tip = null, tipT = 0, shown = null, quietUntil = performance.now() + 2500;
  function showTip(text) { if (!text) return; if (!tip) { tip = document.createElement('div'); tip.id = 'museum-tip'; tip.setAttribute('role', 'status'); document.body.appendChild(tip); }
    tip.textContent = text; tip.classList.add('on'); clearTimeout(tipT); tipT = setTimeout(() => tip.classList.remove('on'), 3800); }
  function onTool() { const on = document.querySelector('#hud .wpn.on'); const w = on ? on.dataset.w : null; if (w === shown) return; const first = shown === null; shown = w;
    if (first || performance.now() < quietUntil || startVisible()) return; const name = on.textContent.replace(/^\s*\d+\s*/, '').trim().toLowerCase(), t = TIPS[name]; if (t) showTip(t[coarse ? 1 : 0]); }
  window.__museumTip = showTip;
  function startVisible() { const s = document.getElementById('start'); return !!s && getComputedStyle(s).display !== 'none'; }
  // ---------- thumb help (touch): shown the first few times a visitor enters ----------
  let thumbDone = !coarse; function thumbHelp() { if (thumbDone || startVisible() || window.__reading) return; thumbDone = true;
    let n = 0; try { n = +localStorage.getItem('museum-thumbhelp') || 0; localStorage.setItem('museum-thumbhelp', String(n + 1)); } catch (e) {} if (n >= 3) return;
    const mk = (cls, text, css) => { const d = document.createElement('div'); d.className = 'museum-thumb ' + cls; d.innerHTML = '<i></i><span></span>'; d.querySelector('span').textContent = text; d.style.cssText = css; document.body.appendChild(d); return d; };
    const a = mk('l', 'Left thumb: drag to move', 'left:calc(var(--ui-sl,0px) + 14px);bottom:calc(var(--ui-tipb,40px) + 44px);align-items:flex-start');
    const b = mk('r', 'Right thumb: drag to look · tap a painting to open it', 'right:calc(var(--ui-sr,0px) + 14px);top:34%;align-items:flex-end');
    requestAnimationFrame(() => { a.classList.add('on'); b.classList.add('on'); });
    const off = () => { [a, b].forEach(d => { d.classList.remove('on'); setTimeout(() => d.remove(), 600); }); removeEventListener('touchmove', mv, true); };
    let moves = 0; const mv = () => { if (++moves > 40) off(); }; addEventListener('touchmove', mv, true); setTimeout(off, 7000); }
  // ---------- boot ----------
  function boot() { if (!document.body) return setTimeout(boot, 30); document.body.appendChild(probe); startScreen(); reorder(); layout(); relayout();
    const hud = document.getElementById('hud'); if (hud) new MutationObserver(() => { reorder(); onTool(); relayout(); }).observe(hud, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    const s = document.getElementById('start'); if (s) new MutationObserver(() => { if (!startVisible()) { quietUntil = Math.min(quietUntil, performance.now() + 600); setTimeout(thumbHelp, 700); } }).observe(s, { attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
    setInterval(() => { if (!thumbDone && !startVisible()) thumbHelp(); }, 1500); onTool(); }
  boot();
})();
