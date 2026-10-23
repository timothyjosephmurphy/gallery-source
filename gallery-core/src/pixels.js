// Procedural pixel art: textures, machine elves, weapon HUD sprites (all generated in-browser)
import * as THREE from 'three';
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function tex(c, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function noise(x, w, h, amt) { for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(0,0,0,${rnd() * amt})`; x.fillRect(rnd() * w | 0, rnd() * h | 0, 2, 2); } }
export function brickTex(rx, ry) {
  const [c, x] = cv(32, 32); x.fillStyle = '#2a1a12'; x.fillRect(0, 0, 32, 32);
  for (let r = 0; r < 4; r++) for (let b = -1; b < 3; b++) {
    const o = r % 2 ? 8 : 0; const v = 90 + rnd() * 40 | 0;
    x.fillStyle = `rgb(${v},${v * 0.45 | 0},${v * 0.3 | 0})`; x.fillRect(b * 16 + o + 1, r * 8 + 1, 14, 6);
  }
  noise(x, 32, 32, 0.4); return tex(c, rx, ry);
}
export function floorTex(rx, ry) {
  const [c, x] = cv(32, 32);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const v = (i + j) % 2 ? 70 : 55; x.fillStyle = `rgb(${v},${v},${v - 10})`; x.fillRect(i * 16, j * 16, 16, 16); }
  x.strokeStyle = '#222'; x.strokeRect(0.5, 0.5, 31, 31); noise(x, 32, 32, 0.5); return tex(c, rx, ry);
}
export function ceilTex(rx, ry) {
  const [c, x] = cv(32, 32); x.fillStyle = '#3a3428'; x.fillRect(0, 0, 32, 32);
  x.fillStyle = '#fd8'; x.fillRect(12, 12, 8, 8); noise(x, 32, 32, 0.5); return tex(c, rx, ry);
}
// Liquid paint splat: 256x320 canvas, organic noisy rim, satellite droplets, gravity drips running down,
// darker wet rim, glossy specular highlights. Top 256x256 holds the blob (centre at 128,128); drips run into the bottom.
// A few variants are built once and shared, so firing costs nothing on phones.
const SPL = [];
export function splatTex() {
  if (SPL.length < 4) {
    const W = 256, H = 320, [c, x] = cv(W, H), cx = 128, cy = 128, R = 54 + rnd() * 10;
    const hue = 24 + rnd() * 10, base = `hsl(${hue},100%,50%)`, dark = `hsl(${hue - 6},100%,34%)`;
    // organic outline: sum of low-frequency sines + spikes
    const N = 96, ph = [rnd() * 6, rnd() * 6, rnd() * 6], rr = [];
    for (let i = 0; i < N; i++) { const a = i / N * 6.283;
      let r = R * (1 + 0.13 * Math.sin(a * 3 + ph[0]) + 0.08 * Math.sin(a * 5 + ph[1]) + 0.05 * Math.sin(a * 9 + ph[2]));
      rr.push(r); }
    for (let k = 0; k < 7; k++) { const i = rnd() * N | 0, L = 10 + rnd() * 22; for (let j = -2; j <= 2; j++) rr[(i + j + N) % N] += L * (1 - Math.abs(j) / 3); }
    const blob = (sc, fill) => { x.beginPath(); for (let i = 0; i <= N; i++) { const a = i / N * 6.283, r = rr[i % N] * sc, X = cx + Math.cos(a) * r, Y = cy + Math.sin(a) * r; i ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.closePath(); x.fillStyle = fill; x.fill(); };
    // drips: rounded runs down from the lower rim, each ending in a bead
    const drips = [];
    for (let k = 0, n = 2 + (rnd() * 3 | 0); k < n; k++) { const a = 0.6 + rnd() * 1.9, i = Math.round(a / 6.283 * N) % N;
      drips.push({ x: cx + Math.cos(a) * rr[i] * 0.8, y: cy + Math.sin(a) * rr[i] * 0.8, w: 5 + rnd() * 7, len: 40 + rnd() * (H - 60 - cy - rr[i] * 0.8) }); }
    const drawDrips = (fill, grow = 0) => { x.fillStyle = fill; drips.forEach(d => { const w = d.w + grow, y2 = Math.min(H - d.w - 4, d.y + d.len);
      x.beginPath(); x.moveTo(d.x - w, d.y); x.quadraticCurveTo(d.x - w * 0.8, (d.y + y2) / 2, d.x - w * 0.7, y2); x.arc(d.x, y2, w * 1.25, Math.PI, 0, true);
      x.lineTo(d.x + w * 0.7, y2); x.quadraticCurveTo(d.x + w * 0.8, (d.y + y2) / 2, d.x + w, d.y); x.fill();
      x.beginPath(); x.arc(d.x, y2 + w * 0.2, w * 1.35, 0, 6.283); x.fill(); }); };
    // satellite droplets flung outward
    const drops = []; for (let k = 0; k < 16; k++) { const a = rnd() * 6.283, d = R * (1.25 + rnd() * 0.9); drops.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.5 + rnd() * 5]); }
    // 1) wet rim (darker, slightly bigger), 2) body, 3) inner pooled tone
    blob(1.04, dark); drawDrips(dark, 1.5); drops.forEach(([X, Y, r]) => { x.fillStyle = dark; x.beginPath(); x.arc(X, Y, r + 1, 0, 6.283); x.fill(); });
    blob(1.0, base); drawDrips(base); drops.forEach(([X, Y, r]) => { x.fillStyle = base; x.beginPath(); x.arc(X, Y, r, 0, 6.283); x.fill(); });
    const g = x.createRadialGradient(cx - 10, cy - 12, 4, cx, cy, R * 1.1); g.addColorStop(0, `hsla(${hue + 10},100%,62%,0.9)`); g.addColorStop(0.7, `hsla(${hue},100%,52%,0)`);
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = g; x.fillRect(0, 0, W, H);
    // thickness shading along the lower edge of drips/blob
    x.fillStyle = 'rgba(80,20,0,0.18)'; drips.forEach(d => { x.fillRect(d.x + d.w * 0.25, d.y, d.w * 0.6, d.len); });
    // glossy specular: soft sheen + crisp highlight streaks on blob, beads and drops
    const sh = x.createRadialGradient(cx - 18, cy - 22, 2, cx - 18, cy - 22, R * 0.75); sh.addColorStop(0, 'rgba(255,255,240,0.55)'); sh.addColorStop(1, 'rgba(255,255,240,0)');
    x.fillStyle = sh; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,250,0.95)';
    x.beginPath(); x.ellipse(cx - 22, cy - 26, 13, 5, -0.6, 0, 6.283); x.fill();
    x.beginPath(); x.ellipse(cx - 2, cy - 36, 4, 2, -0.4, 0, 6.283); x.fill();
    x.beginPath(); x.ellipse(cx + 20, cy + 14, 6, 2.2, -0.7, 0, 6.283); x.fillStyle = 'rgba(255,255,250,0.5)'; x.fill();
    x.fillStyle = 'rgba(255,255,250,0.9)';
    drips.forEach(d => { const y2 = Math.min(H - d.w - 4, d.y + d.len); x.beginPath(); x.ellipse(d.x - d.w * 0.45, y2 - d.w * 0.3, d.w * 0.32, d.w * 0.5, 0.3, 0, 6.283); x.fill();
      x.fillRect(d.x - d.w * 0.55, d.y + 6, Math.max(1.2, d.w * 0.18), d.len * 0.6); });
    drops.forEach(([X, Y, r]) => { if (r > 2.5) { x.beginPath(); x.arc(X - r * 0.35, Y - r * 0.35, r * 0.3, 0, 6.283); x.fill(); } });
    x.globalCompositeOperation = 'source-over';
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = true; t.anisotropy = 4; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; SPL.push(t);
  }
  return SPL[(rnd() * SPL.length) | 0];
}
export function plaqueTex(text, sold) {
  const [c, x] = cv(256, 40); x.fillStyle = sold ? '#600' : '#2a2014'; x.fillRect(0, 0, 256, 40);
  x.strokeStyle = sold ? '#f44' : '#c9a24a'; x.lineWidth = 3; x.strokeRect(2, 2, 252, 36);
  x.fillStyle = sold ? '#fff' : '#f0d070'; x.font = 'bold 15px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text.length > 30 ? text.slice(0, 29) + '…' : text, 128, 21);
  const t = tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
// 16x20 elf: pointy hat, big eyes, glow halo; 4 hue-shifted frames with wiggle
export function elfFrames() {
  const art = [
    '......h.........', '.....hh.........', '....hhhh........', '...hhhhhh.......', '..hhhhhhhh......',
    '...ssssss.......', '..ssssssss......', '..sEEssEEs......', '..sEPssPEs......', '..ssssssss......',
    '...smmmms.......', '....ssss........', '..bbbbbbbb......', '.sbbbbbbbbs.....', '.s.bbbbbb.s.....',
    '...bbbbbb.......', '...bb..bb.......', '...ll..ll.......', '..lll..lll......', '................'];
  const frames = [];
  for (let f = 0; f < 4; f++) {
    const [c, x] = cv(20, 24); const hue = (f * 90 + 280) % 360;
    const g = x.createRadialGradient(10, 12, 1, 10, 12, 11); g.addColorStop(0, `hsla(${hue},70%,50%,.55)`); g.addColorStop(1, 'hsla(0,0%,0%,0)');
    x.fillStyle = g; x.fillRect(0, 0, 20, 24);
    const pal = { h: `hsl(${hue},100%,55%)`, s: `hsl(${(hue + 120) % 360},90%,65%)`, E: '#fff', P: '#000', m: '#f0f', b: `hsl(${(hue + 200) % 360},100%,50%)`, l: '#ff0' };
    const dx = f % 2 ? 1 : 0;
    art.forEach((row, yy) => [...row].forEach((ch, xx) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(xx + 2 + (yy < 5 ? dx : 0), yy + 2, 1, 1); } }));
    // scrub brush
    x.fillStyle = '#a60'; x.fillRect(f % 2 ? 0 : 15, 13, 4, 2); x.fillStyle = '#fff'; x.fillRect(f % 2 ? 0 : 15, 15, 4, 1);
    // Quake-ish grit: darken toward the bottom-right, speckle noise, muted saturation
    const d = x.getImageData(0, 0, 20, 24);
    for (let yy = 0; yy < 24; yy++) for (let xx = 0; xx < 20; xx++) {
      const i = (yy * 20 + xx) * 4; if (d.data[i + 3] < 200) { d.data[i + 3] *= 0.6; continue; }
      const sh = 1 - 0.35 * (yy / 24) - 0.15 * (xx / 20) - rnd() * 0.18, g = (d.data[i] + d.data[i + 1] + d.data[i + 2]) / 3;
      for (let k = 0; k < 3; k++) d.data[i + k] = Math.min(255, (d.data[i + k] * 0.7 + g * 0.3) * sh);
    }
    x.putImageData(d, 0, 0);
    const t = tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; frames.push(t);
  }
  return frames;
}
export function weaponSprite(kind) {
  const [c, x] = cv(96, 64);
  const px = (col, a, b, w, h) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  // hand
  px('#c88050', 36, 44, 24, 20); px('#a06040', 36, 44, 24, 3); px('#e0a070', 40, 48, 4, 12);
  if (kind === 0) { // (legacy sprite, unused by the thermos)
    px('#555', 42, 24, 12, 22); px('#888', 44, 24, 3, 22); px('#333', 44, 14, 8, 12); px('#999', 45, 14, 2, 12);
    px('#ff7a00', 28, 30, 14, 14); px('#ffb040', 30, 32, 4, 4); px('#a04000', 28, 42, 14, 2); px('#ff7a00', 46, 12, 4, 3);
  } else { // buy tool: gold price-gun with $ tag
    px('#c9a24a', 38, 26, 22, 18); px('#f0d070', 40, 28, 18, 3); px('#7a5a20', 38, 42, 22, 2);
    px('#fff', 42, 10, 14, 14); px('#0a0', 47, 12, 4, 10); px('#0a0', 44, 13, 10, 2); px('#0a0', 44, 16, 10, 2); px('#0a0', 44, 19, 10, 2);
  }
  return c;
}
export function poolTex() {
  const [c, x] = cv(64, 64); const g = x.createRadialGradient(32, 26, 2, 32, 30, 32);
  g.addColorStop(0, 'rgba(255,200,130,.55)'); g.addColorStop(0.6, 'rgba(255,170,90,.2)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}

// ---- Quake-style gritty textures (limited muddy palette) ----
const QPAL = [[20,16,12],[39,30,22],[55,43,31],[71,55,39],[87,67,47],[107,83,59],[127,99,71],[59,51,35],[79,71,47],[99,91,63],[47,47,51],[67,67,71],[91,91,95],[119,115,111],[123,63,31],[159,83,35],[191,111,47],[227,155,63]];
function quantize(c) {
  const x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < d.data.length; i += 4) {
    let best = 0, bd = 1e9;
    for (let k = 0; k < QPAL.length; k++) { const p = QPAL[k], e = (p[0] - d.data[i]) ** 2 + (p[1] - d.data[i + 1]) ** 2 + (p[2] - d.data[i + 2]) ** 2; if (e < bd) { bd = e; best = k; } }
    d.data[i] = QPAL[best][0]; d.data[i + 1] = QPAL[best][1]; d.data[i + 2] = QPAL[best][2];
  }
  x.putImageData(d, 0, 0); return c;
}
function grit(x, w, h, n = 900, a = 0.35) { for (let i = 0; i < n; i++) { const v = rnd() < 0.5 ? 0 : 255; x.fillStyle = `rgba(${v},${v},${v},${rnd() * a})`; x.fillRect(rnd() * w | 0, rnd() * h | 0, 1 + (rnd() * 2 | 0), 1); } }
export function stoneTex(rx, ry) {
  const [c, x] = cv(64, 64); x.fillStyle = '#1e1810'; x.fillRect(0, 0, 64, 64);
  for (let r = 0; r < 4; r++) for (let b = -1; b < 3; b++) {
    const o = r % 2 ? 16 : 0, v = 85 + rnd() * 45 | 0;
    x.fillStyle = `rgb(${v},${v * 0.8 | 0},${v * 0.6 | 0})`; x.fillRect(b * 32 + o + 1, r * 16 + 1, 30, 14);
    x.fillStyle = 'rgba(255,230,190,.18)'; x.fillRect(b * 32 + o + 1, r * 16 + 1, 30, 2);
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(b * 32 + o + 1, r * 16 + 13, 30, 2);
  }
  grit(x, 64, 64); return tex(quantize(c), rx, ry);
}
export function metalTex(rx, ry) {
  const [c, x] = cv(64, 64); x.fillStyle = '#4a4a4e'; x.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    x.fillStyle = (i + j) % 2 ? '#56565a' : '#46464a'; x.fillRect(i * 32 + 1, j * 32 + 1, 30, 30);
    x.fillStyle = '#77736f'; x.fillRect(i * 32 + 1, j * 32 + 1, 30, 1); x.fillStyle = '#202024'; x.fillRect(i * 32 + 1, j * 32 + 30, 30, 1);
    for (const [a, b] of [[4, 4], [27, 4], [4, 27], [27, 27]]) { x.fillStyle = '#88847f'; x.fillRect(i * 32 + a, j * 32 + b, 2, 2); x.fillStyle = '#18181a'; x.fillRect(i * 32 + a + 1, j * 32 + b + 1, 2, 1); }
  }
  x.fillStyle = 'rgba(123,63,31,.5)'; for (let i = 0; i < 40; i++) x.fillRect(rnd() * 64 | 0, rnd() * 64 | 0, 2, 3 + rnd() * 6 | 0); // rust streaks
  grit(x, 64, 64, 700, 0.3); return tex(quantize(c), rx, ry);
}
export function woodTex(rx, ry) {
  const [c, x] = cv(32, 64);
  for (let y = 0; y < 64; y++) { const v = 60 + Math.sin(y * 0.7 + rnd()) * 12 + rnd() * 10 | 0; x.fillStyle = `rgb(${v},${v * 0.72 | 0},${v * 0.48 | 0})`; x.fillRect(0, y, 32, 1); }
  x.fillStyle = '#1e1810'; x.fillRect(15, 0, 1, 64); grit(x, 32, 64, 300); return tex(quantize(c), rx, ry);
}
export function flagTex(rx, ry) {
  const [c, x] = cv(64, 64); x.fillStyle = '#16120c'; x.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const v = 55 + rnd() * 30 | 0; x.fillStyle = `rgb(${v},${v * 0.9 | 0},${v * 0.65 | 0})`; x.fillRect(i * 32 + 1, j * 32 + 1, 30, 30); }
  grit(x, 64, 64, 1200, 0.4); return tex(quantize(c), rx, ry);
}
export function lavaTex() {
  const [c, x] = cv(32, 8);
  for (let i = 0; i < 32; i++) for (let j = 0; j < 8; j++) { const v = Math.sin(i * 0.6 + j * 0.9) + Math.sin(i * 0.23 - j * 1.3); x.fillStyle = v > 0.8 ? '#ffd040' : v > 0 ? '#ff7a10' : v > -0.8 ? '#c03a08' : '#601804'; x.fillRect(i, j, 1, 1); }
  return tex(c, 8, 1);
}

// calm, fine-grained smooth stone for gallery walls (high-res, meant for mipmaps + anisotropy)
let _smooth;
export function smoothStoneCanvas() {
  if (_smooth) return _smooth;
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  x.fillStyle = '#4e463d'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 60; i++) { // soft mottling, tileable via wrap-around draws
    const px = Math.random() * S, py = Math.random() * S, r = 40 + Math.random() * 110, a = 0.025 + Math.random() * 0.03, l = Math.random() < 0.5;
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
      const g = x.createRadialGradient(px + dx, py + dy, 0, px + dx, py + dy, r);
      g.addColorStop(0, l ? `rgba(200,185,160,${a})` : `rgba(20,15,10,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px + dx - r, py + dy - r, 2 * r, 2 * r);
    }
  }
  const im = x.getImageData(0, 0, S, S), d = im.data; // fine low-contrast grain
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 10; d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9; }
  x.putImageData(im, 0, 0);
  x.strokeStyle = 'rgba(25,20,15,.22)'; x.lineWidth = 1.5; // faint ashlar seams: 2 courses per tile
  x.beginPath(); x.moveTo(0, 0.5); x.lineTo(S, 0.5); x.moveTo(0, S / 2); x.lineTo(S, S / 2);
  x.moveTo(0.5, 0); x.lineTo(0.5, S / 2); x.moveTo(S / 2, S / 2); x.lineTo(S / 2, S); x.stroke();
  return _smooth = c;
}
