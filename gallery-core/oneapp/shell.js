// /play/ shell (#24, #172): one page for all of TJ's galleries. Each gallery runs in a frame (/play/g/<id>/) so the shell can
// load the next one in the background, swap with a fade (no page reload), and drop the old frame (its WebGL context and GPU
// memory go with it). Deep links: /play/ (TJM Gallery), /play/orsay/, /play/bilbao/, /play/uffizi/, /play/gugg-ny/, /play/home/ (TJ's Living Room, #211).
(function () {
  var IDS = { play: '/play/', orsay: '/play/orsay/', bilbao: '/play/bilbao/', uffizi: '/play/uffizi/', 'gugg-ny': '/play/gugg-ny/', home: '/play/home/' };
  var RX = /^\/play\/(orsay|bilbao|uffizi|gugg-ny|home)(\/|\/index\.html)?$/, cur = null, busy = false, stats = { swaps: 0, loads: [], reloads: 0 };
  function idOf(path) { var m = RX.exec(path); return m ? m[1] : (/^\/play(\/|\/index\.html)?$/.test(path) ? 'play' : null); }
  function clean(search) { var q = new URLSearchParams(search); q.delete('via'); var s = q.toString(); return s ? '?' + s : ''; }
  var probe = document.getElementById('sa');
  function insets(f) { try { var cs = getComputedStyle(probe), st = f.contentDocument.documentElement.style;
    ['top', 'right', 'bottom', 'left'].forEach(function (k) { st.setProperty('--sa-' + k, cs.getPropertyValue('padding-' + k)); }); } catch (e) {} }
  function mk(id, search, hash) { var f = document.createElement('iframe'); f.className = 'g'; f.dataset.g = id; f.title = 'Gallery';
    f.allow = 'fullscreen; autoplay; gamepad; xr-spatial-tracking; clipboard-write'; f.src = '/play/g/' + id + '/' + (search || '') + (hash || '');
    f.addEventListener('load', function () { insets(f); try { var d = f.contentDocument; if (f === cur && d.title) document.title = d.title;
      if (!/^\/play\/g\//.test(f.contentWindow.location.pathname) && f.contentWindow.location.href !== 'about:blank') location.replace(f.contentWindow.location.href); } catch (e) {} });
    document.body.appendChild(f); return f; }
  function ready(f, ms) { return new Promise(function (res) { var t0 = performance.now(); (function poll() { var ok = false;
    try { var g = f.contentWindow.game; ok = !!(g && g.nPaintings > 0); } catch (e) {}
    if (ok || performance.now() - t0 > ms) return requestAnimationFrame(function () { requestAnimationFrame(function () { res(ok); }); }); setTimeout(poll, 120); })(); }); }
  function go(u, from, opt) { opt = opt || {}; var url; try { url = new URL(u, location.href); } catch (e) { return; }
    var id = url.origin === location.origin ? idOf(url.pathname) : null;
    if (!id) { location.assign(url.href); return; } // other sites (Chase's Montreal) and other tjm.art pages: a normal page move
    if (busy) return; busy = true; var old = cur, t0 = performance.now(), nf = mk(id, url.search, url.hash); nf.classList.add('next');
    ready(nf, 20000).then(function (ok) { stats.loads.push({ id: id, ms: Math.round(performance.now() - t0), ok: ok });
      if (opt.push !== false) history.pushState({ g: id }, '', IDS[id] + clean(url.search) + url.hash);
      cur = nf; nf.classList.remove('next'); try { document.title = nf.contentDocument.title || document.title; nf.contentWindow.focus(); } catch (e) {}
      stats.swaps++; setTimeout(function () { if (old) { try { old.contentWindow.__shellUnload && old.contentWindow.__shellUnload(); } catch (e) {} try { old.src = 'about:blank'; } catch (e) {} old.remove(); } busy = false; }, 350); }); }
  window.__playShell = { go: go, get current() { return cur && cur.dataset.g; }, get frame() { return cur; }, stats: stats };
  addEventListener('popstate', function () { var id = idOf(location.pathname); if (id && (!cur || id !== cur.dataset.g)) go(location.href, null, { push: false }); });
  addEventListener('resize', function () { if (cur) insets(cur); });
  ['gesturestart', 'gesturechange'].forEach(function (ev) { document.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false }); });
  var id0 = idOf(location.pathname) || 'play'; cur = mk(id0, location.search, location.hash);
  if (performance.getEntriesByType && (performance.getEntriesByType('navigation')[0] || {}).type === 'reload') stats.reloads++;
})();
