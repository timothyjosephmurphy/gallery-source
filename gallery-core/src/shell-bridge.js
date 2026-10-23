// One app (#24, #172): when a gallery runs inside the /play/ shell, gates swap galleries through the shell (no page reload)
// and links / page moves go to the top window. Outside the shell (opened directly) nothing changes.
(function () {
  let shell = null; try { if (window.parent !== window && window.parent.__playShell) shell = window.parent.__playShell; } catch (e) {}
  window.__inShell = !!shell; if (!shell) return;
  // on swap the shell calls __shellUnload before dropping this frame: close audio and lose GL contexts so nothing keeps the old
  // gallery alive (an open AudioContext can pin a detached frame and its GPU memory)
  const ACs = [], GLs = []; const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) { const W = function (...a) { const c = new AC(...a); ACs.push(c); return c; }; W.prototype = AC.prototype; window.AudioContext = W; if (window.webkitAudioContext) window.webkitAudioContext = W; }
  const gc0 = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, o) { const c = gc0.call(this, t, o); if (c && /webgl/.test(t) && !GLs.includes(c)) GLs.push(c); return c; };
  window.__shellUnload = () => { ACs.forEach(c => { try { c.close(); } catch (e) {} }); GLs.forEach(g => { try { const x = g.getExtension('WEBGL_lose_context'); x && x.loseContext(); } catch (e) {} });
    try { speechSynthesis.cancel(); } catch (e) {} document.querySelectorAll('audio,video').forEach(m => { try { m.pause(); m.removeAttribute('src'); m.load(); } catch (e) {} }); };
  window.__gatesNav = u => shell.go(u, window);
  const b = document.createElement('base'); b.target = '_top'; (document.head || document.documentElement).prepend(b);
})();
