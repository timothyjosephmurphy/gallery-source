import { MUSEUM } from './museum.config.js'; // per-museum config (gallery-core #24)
// #242 per-gallery eggs flag: set `eggs: false` in a gallery's src/museum.config.js and no easter egg code, models or sounds load
// (the guide drone and its purchase hand-off are eggs too, so they go with them). Default is on, so the /play galleries are unchanged.
if (MUSEUM.eggs === false) { window.eggs = null; window.__eggsOff = true; }
else if (MUSEUM.eggsAfterFirstFrame) { // #272: this gallery spawns its eggs after the first playable frame, off the load path
  const go = () => (window.requestIdleCallback || (f => setTimeout(f, 50)))(() => import('./eggs-run.js'), { timeout: 1500 });
  const t0 = performance.now(), wait = () => (window.game && (window.game.fps > 0 || window.__auditNoRender || performance.now() - t0 > 8000) ? setTimeout(go, 600) : setTimeout(wait, 100)); wait(); }
else import('./eggs-run.js');
