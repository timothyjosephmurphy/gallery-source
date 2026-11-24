// #354: Visual's blank brushed-brass caption plate (R2 play/preview-251/eagle-brass/, 1600x640, 0.40 x 0.16 m) beside
// "Sunrise on Rainier with Eagle" (painting-portrait-with-hat). Hung on the painting's left (+t) side, under the existing
// eagle art plaque, aligned with the painting's lower area; clear of the lamp bar above. Caption is drawn at runtime on a
// canvas over the blank brass face (locked text, Writer/TJ). Phone/low loads the -phone webp. ?eaglebrass=0 turns it off.
import * as THREE from 'three';
const BASE = (import.meta.env.BASE_URL || '/') + 'img/play/preview-251/eagle-brass/';
export const EAGLE_BRASS_CAPTION = 'Sunrise on Rainier with Eagle \u2014 TJ Murphy';
const PID = 'painting-portrait-with-hat', PW = 0.40, PH = 0.16, GAP = 0.04, Y_C = 1.11;
export function installEagleBrass354({ root, CATALOG, low }) {
  const S = window.__eaglebrass354 = { placed: null, err: null };
  if (new URLSearchParams(location.search).get('eaglebrass') === '0') { S.err = 'off'; return S; }
  let p = null; for (const q of CATALOG.paintings || []) if (q.id === PID && isFinite(q.x)) p = q;
  for (const q of (CATALOG.layout && CATALOG.layout.tags && CATALOG.layout.tags.paintings) || []) if (q.id === PID && isFinite(q.x)) p = q;
  if (!p) { S.err = 'painting not in catalog'; return S; }
  const n = new THREE.Vector3(p.ix, 0, p.iz).normalize(), t = new THREE.Vector3(-n.z, 0, n.x), off = (p.fw || p.w) / 2 + GAP + PW / 2;
  const pos = new THREE.Vector3(p.x, Y_C, p.z).addScaledVector(t, off).addScaledVector(n, 0.012);
  const W = low ? 800 : 1600, H = low ? 320 : 640, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = low ? 2 : 8;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.05 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), mat); m.position.copy(pos); m.lookAt(pos.x + n.x, pos.y, pos.z + n.z); m.name = 'eagleBrass354'; root.add(m);
  const img = new Image(); img.crossOrigin = 'anonymous';
  img.onload = () => { ctx.drawImage(img, 0, 0, W, H);
    const [a, b] = EAGLE_BRASS_CAPTION.split(' \u2014 '), f = H / 640;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const ink = (txt, y, px, it) => { ctx.font = (it ? 'italic ' : '') + Math.round(px * f) + 'px Georgia, "Times New Roman", serif';
      ctx.fillStyle = 'rgba(255,240,200,0.35)'; ctx.fillText(txt, W / 2 + 2 * f, y + 2 * f); ctx.fillStyle = '#2b1d0c'; ctx.fillText(txt, W / 2, y); };
    ink(a, H * 0.42, 118, true); ink(b, H * 0.68, 78, false); tex.needsUpdate = true; };
  img.onerror = () => { S.err = 'tex'; };
  img.src = BASE + (low ? 'eagle-brass-plaque.phone.webp' : 'eagle-brass-plaque.desktop.webp');
  S.placed = { x: +pos.x.toFixed(3), y: Y_C, z: +pos.z.toFixed(3), w: PW, h: PH, caption: EAGLE_BRASS_CAPTION };
  return S;
}
