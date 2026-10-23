// HD soup (2026-10-18): self-contained drop-in replacement for /workspace/museum-shared/soup.js (copy over each gallery's src/soup.js). Same exports, same splat texture aspect (4:5) and blob
// centre (u 0.5, v 0.4 from the top), so main.js's splat() / SPLAT_GEO / cap are unchanged. Original procedural art, no assets.
// Desktop: 512x640 splats with wet rim, spray streaks, tapered drips with bulb ends, gloss + beads. Phones / coarse pointer: 256x320.
// Still 4 cached texture variants (no per-throw canvas work after the first 4), so the splat cap and performance stay as before.
import * as THREE from 'three';
const LOW = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
let quality = LOW ? 'low' : 'hd';
// --- unchanged from museum-shared/soup.js (thermos, sounds, pose) ---
export const SOUP = { slot: 'Soup Thermos', hudName: 'SOUP THERMOS', fireLabel: 'THROW', help: 'click throw soup' };
const flat = c => new THREE.MeshLambertMaterial({ color: c });
// held vacuum flask: brushed-steel body with a red plaid band, black shoulder + neck, cup-lid off, soup at the brim
export function buildThermos(g) {
  const TS = quality === 'low' ? 16 : 36; // HD: smooth body (was 14 flat-shaded sides)
  const steel = new THREE.MeshPhongMaterial({ color: 0xd4d8dd, specular: 0xffffff, shininess: 60, flatShading: quality === 'low' }); // brushed stainless
  const black = flat(0x1c1c1e);
  const plaid = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#b3222a'; x.fillRect(0, 0, 64, 64);
    x.fillStyle = 'rgba(20,30,60,.55)'; for (let i = 0; i < 64; i += 16) { x.fillRect(i, 0, 6, 64); x.fillRect(0, i, 64, 6); }
    x.fillStyle = 'rgba(240,210,120,.6)'; for (let i = 8; i < 64; i += 16) { x.fillRect(i, 0, 1.5, 64); x.fillRect(0, i, 64, 1.5); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshLambertMaterial({ map: t }); })();
  const add = (geo, m, y) => { const o = new THREE.Mesh(geo, m); o.position.y = y; g.add(o); return o; };
  const body = new THREE.Group(); g.add(body); // carried upright (TJ); the fling tips it forward
  const a = (geo, m, y) => { const o = new THREE.Mesh(geo, m); o.position.y = y; body.add(o); return o; };
  a(new THREE.CylinderGeometry(0.075, 0.075, 0.34, TS), steel, 0);
  a(new THREE.CylinderGeometry(0.077, 0.077, 0.12, TS, 1, true), plaid, -0.02);
  a(new THREE.CylinderGeometry(0.078, 0.078, 0.025, TS), black, -0.16);
  a(new THREE.CylinderGeometry(0.05, 0.075, 0.05, TS), black, 0.195);
  a(new THREE.CylinderGeometry(0.045, 0.045, 0.04, TS, 1, true), steel, 0.24);
  const soup = a(new THREE.CircleGeometry(0.042, TS), new THREE.MeshLambertMaterial({ color: 0xd2451b }), 0.255); soup.rotation.x = -Math.PI / 2;
  const hd = a(new THREE.TorusGeometry(0.05, 0.012, 10, 20, Math.PI), black, 0.02); hd.rotation.set(0, Math.PI / 2, Math.PI / 2); hd.position.x = 0.085;
  return g;
}
// little slosh on throw, wet splash on hit (synthesised; silent when muted)
let actx = null;
function noise(dur, f0, f1, vol, q = 1.2) {
  const a = actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const t = a.currentTime;
  const b = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; f.type = 'bandpass'; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.value = vol;
  s.connect(f).connect(g).connect(a.destination); s.start(t); }
export function sloshSound(muted) { if (muted && muted()) return; try { noise(0.32, 300, 900, 0.5, 2.5); } catch (e) {} }
export function splashSound(muted) { if (muted && muted()) return; try { noise(0.22, 1800, 400, 0.45, 0.8); } catch (e) {} }
// view-model pose: upright while carried; on THROW a quick fling (k = 1 at release -> 0): tips forward, arcs up and out, returns upright
export function thermosPose(g, k) { const s = k > 0 ? Math.sin(Math.PI * (1 - k)) : 0, e = k > 0 ? Math.sin(Math.PI * (1 - k) * 0.5) : 0;
  g.position.y += 0.085; g.position.x -= 0.03; g.rotation.x = -1.9 * s; g.position.y += 0.09 * s; g.position.z -= 0.14 * s + 0.02 * e; g.rotation.z = -0.15 * s; }
export const FLING_TIME = 0.38;
// --- HD parts ---
export function setSoupQuality(q) { quality = q === 'low' ? 'low' : 'hd'; }
// smoother, glossier soup projectile (one shared geometry; main.js clones the mesh per throw)
export function soupBlob() {
  const geo = new THREE.IcosahedronGeometry(0.075, quality === 'low' ? 2 : 3), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + Math.sin(x * 38) * Math.sin(y * 33) * 0.07 + Math.sin(z * 61 + x * 20) * 0.03 + (z < -0.03 ? (-0.03 - z) * 3 : 0); // wobble + a trailing tail
    p.setXYZ(i, x * k, y * k, z * k); }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: 0xd8471a, emissive: 0x4a1104, specular: 0xffd0b0, shininess: 70 }));
}
const TEX = []; let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function makeTex() {
  const S = quality === 'low' ? 1 : 2, W = 256 * S, H = 320 * S, cx = 128 * S, cy = 128 * S;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const R = (50 + rnd() * 12) * S, N = 256, rr = [], ph = [rnd() * 6, rnd() * 6, rnd() * 6, rnd() * 6];
  for (let i = 0; i < N; i++) { const a = i / N * 6.283; rr.push(R * (1 + 0.14 * Math.sin(a * 3 + ph[0]) + 0.08 * Math.sin(a * 5 + ph[1]) + 0.05 * Math.sin(a * 9 + ph[2]) + 0.025 * Math.sin(a * 17 + ph[3]) + 0.012 * Math.sin(a * 31))); }
  for (let k = 0; k < 9; k++) { const i = rnd() * N | 0, L = (6 + rnd() * 22) * S, w = 3 + (rnd() * 5 | 0); for (let j = -w; j <= w; j++) rr[(i + j + N) % N] += L * Math.cos(j / w * Math.PI / 2) ** 2; } // lobes
  const path = sc => { x.beginPath(); for (let i = 0; i <= N; i++) { const a = i / N * 6.283, r = rr[i % N] * sc, px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); };
  // drips: run straight down from the lower half, taper, end in a bulb
  const drips = []; for (let k = 0, n = 3 + (rnd() * 3 | 0); k < n; k++) { const a = 0.55 + rnd() * 2.0, i = Math.round(a / 6.283 * N) % N; drips.push({ x: cx + Math.cos(a) * rr[i] * 0.82, y: cy + Math.sin(a) * rr[i] * 0.82, w: (3.2 + rnd() * 4.8) * S, l: (26 + rnd() * 120) * S }); }
  const dripPath = (d, g) => { const y2 = Math.min(H - 16 * S, d.y + d.l), w0 = d.w + g, w1 = d.w * 0.55 + g; x.beginPath(); x.moveTo(d.x - w0, d.y);
    x.bezierCurveTo(d.x - w0 * 0.9, d.y + (y2 - d.y) * 0.4, d.x - w1, y2 - 6 * S, d.x - w1, y2); x.arc(d.x, y2 + w1 * 0.3, w1 * 1.35 + g * 0.2, Math.PI, 0, true); x.lineTo(d.x + w1, y2);
    x.bezierCurveTo(d.x + w1, y2 - 6 * S, d.x + w0 * 0.9, d.y + (y2 - d.y) * 0.4, d.x + w0, d.y); x.closePath(); };
  // spray: thin tapered streaks flung outward + satellite droplets
  const streaks = []; for (let k = 0; k < 16; k++) { const a = rnd() * 6.283, d0 = R * (0.95 + rnd() * 0.1), d1 = R * (1.25 + rnd() * 0.7); streaks.push([a, d0, d1, (1.5 + rnd() * 3) * S]); }
  const drops = []; for (let k = 0; k < 22; k++) { const a = rnd() * 6.283, d = R * (1.25 + rnd() * 0.95); drops.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d, (1.2 + rnd() * 4.5) * S]); }
  const fillAll = (f, g) => { x.fillStyle = f; path(1 + g / R); x.fill(); drips.forEach(d => { dripPath(d, g); x.fill(); });
    streaks.forEach(([a, d0, d1, w]) => { const ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca, ww = w + g * 0.6; x.beginPath(); x.moveTo(cx + ca * d0 + nx * ww, cy + sa * d0 + ny * ww); x.quadraticCurveTo(cx + ca * (d0 + d1) / 2 + nx * ww * 0.6, cy + sa * (d0 + d1) / 2 + ny * ww * 0.6, cx + ca * d1, cy + sa * d1); x.quadraticCurveTo(cx + ca * (d0 + d1) / 2 - nx * ww * 0.6, cy + sa * (d0 + d1) / 2 - ny * ww * 0.6, cx + ca * d0 - nx * ww, cy + sa * d0 - ny * ww); x.fill();
      x.beginPath(); x.arc(cx + ca * d1, cy + sa * d1, ww * 0.9, 0, 6.283); x.fill(); });
    drops.forEach(([X, Y, r]) => { x.beginPath(); x.arc(X, Y, r + g * 0.5, 0, 6.283); x.fill(); }); };
  fillAll('#7e1d0c', 2.2 * S);            // dark wet rim (meniscus)
  fillAll('#c63d17', 0);                  // body
  x.globalCompositeOperation = 'source-atop';
  // depth: deeper centre, lighter thin edges, warm top-left light
  let gr = x.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.25); gr.addColorStop(0, 'rgba(150,32,10,.55)'); gr.addColorStop(0.55, 'rgba(200,64,24,0)'); gr.addColorStop(1, 'rgba(240,120,60,.35)'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
  gr = x.createRadialGradient(cx - R * 0.3, cy - R * 0.35, 2 * S, cx - R * 0.1, cy - R * 0.1, R); gr.addColorStop(0, 'rgba(255,150,80,.75)'); gr.addColorStop(1, 'rgba(230,90,40,0)'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
  // inner edge shadow just inside the rim (wet thickness)
  x.save(); path(1); x.clip(); x.lineWidth = 7 * S; x.strokeStyle = 'rgba(110,22,8,.45)'; x.shadowColor = 'rgba(90,15,5,.6)'; x.shadowBlur = 8 * S; path(1.01); x.stroke(); x.restore();
  // creamy swirl (two strands) + soft cream marbling
  x.lineCap = 'round'; for (const [w, a0, col] of [[4 * S, 0, 'rgba(255,214,170,.42)'], [2 * S, 1.4, 'rgba(255,235,210,.35)']]) { x.lineWidth = w; x.strokeStyle = col; x.beginPath(); for (let a = 0; a < 9.5; a += 0.12) { const r = (3 + a * 4.6) * S * (1 + 0.08 * Math.sin(a * 3 + a0)); x.lineTo(cx + Math.cos(a + a0) * r, cy + Math.sin(a + a0) * r * 0.92); } x.stroke(); }
  for (let k = 0; k < 6; k++) { const a = rnd() * 6.283, d = rnd() * R * 0.6; gr = x.createRadialGradient(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0, cx + Math.cos(a) * d, cy + Math.sin(a) * d, (8 + rnd() * 14) * S); gr.addColorStop(0, 'rgba(255,190,140,.25)'); gr.addColorStop(1, 'rgba(255,190,140,0)'); x.fillStyle = gr; x.fillRect(0, 0, W, H); }
  // gloss: a few sharp specular streaks + tiny oil beads, and a highlight line down each drip
  x.fillStyle = 'rgba(255,248,236,.75)'; for (let k = 0; k < 5; k++) { x.beginPath(); x.ellipse(cx - R * (0.2 + rnd() * 0.4), cy - R * (0.15 + rnd() * 0.45), (4 + rnd() * 9) * S, (1.2 + rnd() * 2) * S, -0.6 + rnd() * 0.4, 0, 6.283); x.fill(); }
  for (let k = 0; k < 18; k++) { const a = rnd() * 6.283, d = rnd() * R * 0.85, X = cx + Math.cos(a) * d, Y = cy + Math.sin(a) * d, r = (0.8 + rnd() * 2.2) * S; x.fillStyle = 'rgba(255,170,90,.55)'; x.beginPath(); x.arc(X, Y, r, 0, 6.283); x.fill(); x.fillStyle = 'rgba(255,250,240,.8)'; x.beginPath(); x.arc(X - r * 0.35, Y - r * 0.35, r * 0.35, 0, 6.283); x.fill(); }
  drips.forEach(d => { const y2 = Math.min(H - 16 * S, d.y + d.l); x.strokeStyle = 'rgba(255,230,200,.45)'; x.lineWidth = 1.6 * S; x.beginPath(); x.moveTo(d.x - d.w * 0.35, d.y + 4 * S); x.lineTo(d.x - d.w * 0.25, y2 - 2 * S); x.stroke();
    x.fillStyle = 'rgba(255,248,236,.8)'; x.beginPath(); x.arc(d.x - d.w * 0.3, y2 + d.w * 0.1, 1.6 * S, 0, 6.283); x.fill(); });
  drops.forEach(([X, Y, r]) => { if (r < 2 * S) return; x.fillStyle = 'rgba(255,245,230,.75)'; x.beginPath(); x.arc(X - r * 0.35, Y - r * 0.35, r * 0.3, 0, 6.283); x.fill(); });
  x.globalCompositeOperation = 'source-over';
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// same contract as soup.js: up to 4 cached variants, then a random one of them
export function soupSplatTex() { if (TEX.length < 4) { TEX.push(makeTex()); return TEX[TEX.length - 1]; } return TEX[(Math.random() * 4) | 0]; }
