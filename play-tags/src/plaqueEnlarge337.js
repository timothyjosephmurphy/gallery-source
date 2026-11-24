// #337 plaque readability (click-to-enlarge). Aim at a plaque / label / title plate (crosshair centre under pointer lock,
// or the tap/click point otherwise) and click: an HTML/CSS HUD shows that plate's own texture large on a dark backdrop.
// Silent, read-only, no texture changes. Dismiss: click/tap, Esc (or pointer-lock exit), look away (>35 deg), or walk away (>1.5 m).
// Self-contained so tags.js only needs one import + one install line (perf worker owns the rest of tags.js).
import * as THREE from 'three';
const PLATE_RE = /plaque|label|brass|wtitle|glabel/i;
export function installPlaqueEnlarge337({ game, root }) {
  const ray = new THREE.Raycaster(), v = new THREE.Vector2(), fwd = new THREE.Vector3(), to = new THREE.Vector3(), wp = new THREE.Vector3();
  let down = null, open = null;
  const st = document.createElement('style');
  st.textContent = `#pe337{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;transition:opacity .15s}
#pe337.on{opacity:1;pointer-events:auto;cursor:zoom-out}
#pe337 .bd{position:absolute;inset:0;background:rgba(8,7,6,.82)}
#pe337 figure{position:relative;margin:0;padding:clamp(10px,2vw,18px);background:#15100b;border:2px solid #b08d4a;outline:1px solid #F7CC3A;outline-offset:-7px;border-radius:8px;box-shadow:0 12px 48px #000;text-align:center;transform:scale(.96);transition:transform .15s}
#pe337.on figure{transform:none}
#pe337 img{display:block;width:min(90vw,1100px);max-height:76vh;object-fit:contain;border-radius:4px;filter:contrast(1.12) brightness(1.04)}
#pe337 figcaption{font:500 clamp(13px,2vw,16px)/1.4 system-ui,sans-serif;color:#EDE3CF;margin-top:10px}
@media (prefers-reduced-motion:reduce){#pe337,#pe337 figure{transition:none}}`;
  document.head.appendChild(st);
  const box = document.createElement('div'); box.id = 'pe337'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'false'); box.setAttribute('aria-label', 'Plaque, enlarged'); box.hidden = false;
  box.innerHTML = '<div class="bd"></div><figure><img alt="Plaque text, enlarged"><figcaption>Click, Esc or look away to close</figcaption></figure>';
  document.body.appendChild(box);
  const img = box.querySelector('img');
  const toURL = im => { if (!im) return null; if (im.currentSrc || im.src) return im.currentSrc || im.src; if (im.toDataURL) return im.toDataURL();
    try { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); return c.toDataURL(); } catch (e) { return null; } };
  function show(mesh) { const map = mesh.material.map, fs = map.userData && map.userData.fullSrc; // plaque-sharp: prefer full-res source
    const url = (typeof fs === 'string' ? fs : toURL(fs)) || toURL(map.image); if (!url) return false;
    img.src = url; box.classList.add('on'); mesh.getWorldPosition(wp);
    open = { mesh, at: game.camera.position.clone(), target: wp.clone(), t: performance.now() }; window.__reading = true;
    window.__plaque337 = { open: mesh.name, n: (window.__plaque337?.n || 0) + 1 }; return true; }
  function hide(why) { if (!open) return; box.classList.remove('on'); open = null; setTimeout(() => { window.__reading = false; }, 0);
    if (window.__plaque337) { window.__plaque337.open = null; window.__plaque337.closed = why; } }
  addEventListener('keydown', e => { if (open && e.key === 'Escape') { e.stopPropagation(); hide('esc'); } }, true);
  document.addEventListener('pointerlockchange', () => { if (open && !document.pointerLockElement && performance.now() - open.t > 200) hide('esc'); });
  (function tick() { if (open) { const cam = game.camera; cam.getWorldDirection(fwd); to.copy(open.target).sub(cam.position).normalize();
      if (cam.position.distanceTo(open.at) > 1.5) hide('walk'); else if (performance.now() - open.t > 250 && fwd.dot(to) < Math.cos(35 * Math.PI / 180)) hide('look'); }
    requestAnimationFrame(tick); })();
  addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; }, true);
  addEventListener('pointerup', e => {
    if (open) { e.stopImmediatePropagation(); hide('click'); return; }
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 12 || game.freeze || window.__reading) return;
    if (document.pointerLockElement) v.set(0, 0); else v.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(v, game.camera); ray.far = 6;
    const hit = ray.intersectObject(root, true).find(h => h.object.visible); const m = hit && hit.object;
    if (m && PLATE_RE.test(m.name) && m.material && m.material.map && m.material.map.image && show(m)) e.stopImmediatePropagation(); }, true);
  return { hide, isOpen: () => !!open };
}
