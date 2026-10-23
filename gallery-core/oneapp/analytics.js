/* #240 Cloudflare Web Analytics. Page views come from Cloudflare's cookie-free beacon, which tjm.art auto-installs on this shell page.
   The gallery frames (/play/g/*) are excluded by a Web Analytics rule, so each visit counts once at its deep link.
   Fallback screens: the first time a frame shows one, a hidden frame loads /play/fb/<type>/ = one cookie-free virtual page view.
   Nothing extra is sent under Do Not Track or Global Privacy Control. No audio, no UI, no game code touched. */
(function () {
  var T = { nogl2: 1, inapp: 1, lost: 1, stall: 1 }, seen = {}, n = 0;
  if (navigator.globalPrivacyControl || navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
  function ping(why) { why = T[why] ? why : 'other'; if (seen[why] || n > 4) return; seen[why] = 1; n++;
    var f = document.createElement('iframe'); f.src = '/play/fb/' + why + '/'; f.tabIndex = -1; f.title = '';
    f.setAttribute('aria-hidden', 'true'); f.style.cssText = 'position:fixed;left:-9px;top:-9px;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
    document.body.appendChild(f); setTimeout(function () { f.remove(); }, 20000); }
  var iv = setInterval(function () { try { var s = window.__playShell, w = s && s.frame && s.frame.contentWindow, why = w && w.__fallback;
    if (why) ping(why); if (n > 4) clearInterval(iv); } catch (e) {} }, 1000);
  window.__playAnalytics = { ping: ping, get sent() { return Object.keys(seen); } };
})();
