// perf pass Oct 26 2026: tier-aware plaque textures. Low/phone tier downsamples to half resolution (max 1024 px) via canvas;
// mipmaps on, anisotropy 2 on low / 4 otherwise. Falls back to the original texture on any error.
export function tierPlaqueTex(THREE, t, low) {
  try {
    const img = t.image;
    // plaque-sharp: remember the full-res source so the #337 overlay can show it (mesh keeps the tier texture).
    if (img) t.userData.fullSrc = (img.currentSrc || img.src) || img;
    if (low && img && img.width > 512) {
      const s = Math.min(0.5, 1024 / img.width), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const ct = new THREE.CanvasTexture(c); ct.userData.fullSrc = t.userData.fullSrc; t.dispose(); t = ct;
    }
  } catch (e) { console.warn('[plaqueTex]', e); }
  t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = low ? 2 : 4;
  return t;
}
