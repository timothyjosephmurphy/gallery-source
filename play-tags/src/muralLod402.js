// #402 mural LOD: distance-tiered mural textures (spirit of plaqueTex.js). Far = downsampled canvas copy (max 1024 px,
// cheaper mips/upload); near = the original full-res texture. Mesh scale/aspect is never touched (true-size hang kept).
// Hysteresis NEAR/FAR avoids flapping; checks run ~4x/s. Falls back to full texture on any error.
export const MURAL_NEAR = 14, MURAL_FAR = 20;
export function makeMuralLod(THREE, full, low) {
  full.colorSpace = THREE.SRGBColorSpace; full.generateMipmaps = true; full.minFilter = THREE.LinearMipmapLinearFilter; full.anisotropy = low ? 2 : 8;
  let far = full;
  try { const img = full.image, max = low ? 512 : 1024;
    if (img && img.width > max) { const s = max / Math.max(img.width, img.height), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      far = new THREE.CanvasTexture(c); far.colorSpace = THREE.SRGBColorSpace; far.generateMipmaps = true; far.minFilter = THREE.LinearMipmapLinearFilter; far.anisotropy = 2; } }
  catch (e) { console.warn('[muralLod402]', e); far = full; }
  return { full, far, near: false };
}
export function updateMuralLods(list, cam, acc) {
  if (!cam || !list.length) return; const p = cam.position;
  for (const r of list) { if (!r.lod) continue; const d = Math.hypot(p.x - r.a.x, p.z - r.a.z);
    if (r.lod.band876) { r.lod.band876(d); continue; }
    const want = r.lod.near ? d < MURAL_FAR : d < MURAL_NEAR;
    if (want !== r.lod.near) { r.lod.near = want; r.m.material.map = want ? r.lod.full : r.lod.far; r.m.material.needsUpdate = true; if (r.rec) r.rec.lod = want ? 'near' : 'far'; } }
}
