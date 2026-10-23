// Hyperspace tunnel overlay (original): a full-screen 2D canvas of streaking star-lines around a swirling violet core.
// tunnel({ dir: 'in' | 'out', text, ms }) -> { el, done(Promise), fade(ms) }. 'in' accelerates into a white flash (leaving),
// 'out' starts at full speed from that flash and slows as the overlay fades away (arriving). No dependencies: this file is
// also inlined into each gallery's index.html (see tools/inject.mjs) so the arrival tunnel is on screen before anything loads.
export function tunnel(o) {
  o = o || {}; var dir = o.dir || 'in', ms = o.ms || 1900, d = document, cv = d.createElement('canvas'), x = cv.getContext('2d'), DPR = Math.min(2, window.devicePixelRatio || 1);
  cv.id = 'gates-tunnel'; cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483000;pointer-events:none;opacity:' + (dir === 'in' ? 0 : 1) + ';transition:opacity .35s';
  var cap = d.createElement('div'); cap.style.cssText = 'position:fixed;left:0;right:0;bottom:16vh;z-index:2147483001;pointer-events:none;text-align:center;font:700 clamp(15px,2.4vw,24px) Georgia,serif;letter-spacing:3px;color:#fff;text-shadow:0 0 14px #9a6bff,0 0 3px #000;opacity:0;transition:opacity .4s';
  cap.textContent = o.text || ''; (d.body || d.documentElement).appendChild(cv); (d.body || d.documentElement).appendChild(cap);
  var W, H, N = innerWidth < 700 ? 260 : 520, S = [], i, t0 = performance.now(), alive = true, fadeAt = 0, fadeMs = 900, res;
  function size() { W = cv.width = Math.round(innerWidth * DPR); H = cv.height = Math.round(innerHeight * DPR); } size(); addEventListener('resize', size);
  function star(s) { s.a = Math.random() * 6.2832; s.r = Math.random() * 0.9 + 0.02; s.v = 0.25 + Math.random() * 0.9; s.h = 250 + Math.random() * 70; s.w = 0.5 + Math.random() * 1.6; return s; }
  for (i = 0; i < N; i++) S.push(star({}));
  var done = new Promise(function (r) { res = r; });
  function speed(k) { return dir === 'in' ? 0.04 + 2.6 * k * k * k : 2.6 * Math.pow(1 - Math.min(1, k), 2) + 0.05; }
  var last = t0;
  function frame(now) {
    if (!alive) return; var dt = Math.min(0.05, (now - last) / 1000); last = now; var k = Math.min(1, (now - t0) / ms), sp = speed(k), cx = W / 2, cy = H / 2, R = Math.hypot(cx, cy);
    x.globalCompositeOperation = 'source-over'; x.fillStyle = 'rgba(6,2,18,' + (0.35 + 0.4 * (1 - Math.min(1, sp))) + ')'; x.fillRect(0, 0, W, H);
    var g = x.createRadialGradient(cx, cy, 0, cx, cy, R * (0.25 + 0.25 * Math.min(1, sp))); g.addColorStop(0, 'rgba(235,220,255,' + (0.25 + 0.5 * Math.min(1, sp / 2)) + ')'); g.addColorStop(0.35, 'rgba(120,70,230,0.22)'); g.addColorStop(1, 'rgba(20,0,60,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'lighter';
    var tw = (now - t0) / 1000 * (dir === 'in' ? 0.6 : -0.4);
    for (i = 0; i < N; i++) { var s = S[i], r0 = s.r; s.r += s.v * sp * dt * (0.4 + s.r * 1.6); if (s.r > 1.2) { star(s); s.r = 0.02 + Math.random() * 0.1; continue; }
      var a = s.a + tw * (1 - s.r), len = Math.max(0.004, s.r - r0) * (4 + 10 * Math.min(1, sp)), r1 = Math.max(0, s.r - len);
      x.strokeStyle = 'hsla(' + s.h + ',90%,' + (60 + 30 * s.r) + '%,' + Math.min(1, 0.25 + s.r) + ')'; x.lineWidth = s.w * DPR * (0.6 + s.r * 1.8);
      x.beginPath(); x.moveTo(cx + Math.cos(a) * r1 * R, cy + Math.sin(a) * r1 * R); x.lineTo(cx + Math.cos(a) * s.r * R, cy + Math.sin(a) * s.r * R); x.stroke(); }
    if (dir === 'in' && k > 0.82) { x.globalCompositeOperation = 'source-over'; x.fillStyle = 'rgba(245,238,255,' + Math.pow((k - 0.82) / 0.18, 2) + ')'; x.fillRect(0, 0, W, H); }
    if (dir === 'out' && k < 0.12) { x.globalCompositeOperation = 'source-over'; x.fillStyle = 'rgba(245,238,255,' + (1 - k / 0.12) + ')'; x.fillRect(0, 0, W, H); }
    if (k >= 1 && dir === 'in') res();
    if (fadeAt && now - fadeAt > fadeMs + 50) { kill(); return; }
    requestAnimationFrame(frame);
  }
  function kill() { alive = false; removeEventListener('resize', size); cv.remove(); cap.remove(); res(); }
  requestAnimationFrame(function () { cv.style.opacity = '1'; cap.style.opacity = '1'; requestAnimationFrame(frame); });
  return { el: cv, done: done, kill: kill, fade: function (m) { fadeMs = m || 900; fadeAt = performance.now(); cv.style.transition = cap.style.transition = 'opacity ' + fadeMs + 'ms ease'; cv.style.opacity = '0'; cap.style.opacity = '0'; return new Promise(function (r) { setTimeout(r, fadeMs); }); } };
}
