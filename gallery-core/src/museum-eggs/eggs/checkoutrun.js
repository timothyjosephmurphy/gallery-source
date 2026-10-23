// #236 'Take me to checkout': aim at the guide bot (desktop crosshair, or mouse over it when the pointer is free) or tap it (phone) and
// a 'Take me to checkout' button appears by it. Click / tap it (with the crosshair on the bot a click works too) and the flying bot
// tows you along a walkable path, fast, to the checkout gate; walking through it takes your in-game cart to the tjm.art cart.
// Esc or CANCEL stops partway and leaves you standing on open floor. If the gate can't be reached on foot (the splat rooms keep it
// in a sealed vault) it tows you a short way and then sends you to checkout directly: no dead ends. Makes no sound of its own.
import { THREE, V } from '../kit.js';
export function eggCheckoutRun(E, drone) {
  if (!drone || !drone.tow) return null;
  const { ctx, world, camera } = E, SPEED = 7.5, ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const css = document.createElement('style'); css.textContent = `
.cr-btn{position:fixed;z-index:44;transform:translate(-50%,-100%);padding:9px 14px;border-radius:999px;border:1px solid #f3d36a;background:#1c2a1ee8;color:#fff7d8;font:700 14px system-ui,sans-serif;letter-spacing:.02em;box-shadow:0 4px 18px #0009;cursor:pointer;display:none;white-space:nowrap;-webkit-tap-highlight-color:transparent}
.cr-btn.on{display:block}.cr-btn small{display:block;font-weight:400;font-size:10px;opacity:.7;text-align:center}
.cr-cancel{position:fixed;z-index:44;left:50%;top:calc(64px + env(safe-area-inset-top));transform:translateX(-50%);padding:8px 16px;border-radius:999px;border:1px solid #fff6;background:#000b;color:#fff;font:700 13px system-ui,sans-serif;display:none}
.cr-cancel.on{display:block}`; document.head.appendChild(css);
  const btn = document.createElement('button'); btn.className = 'cr-btn'; btn.id = 'crGo'; btn.type = 'button'; btn.innerHTML = 'Take me to checkout<small>click</small>';
  const MENU = !!window.__gbMenu; // #308 (preview opt-in): hover/tap menu on the guide bot: Take me to checkout / Ask for guidance
  let menu = null, askBtn = null;
  if (MENU) { menu = document.createElement('div'); menu.id = 'gbMenu'; menu.className = 'cr-btn'; menu.style.cssText = 'display:none;padding:6px;border-radius:16px;background:#1c2a1eee';
    askBtn = document.createElement('button'); askBtn.id = 'gbGuide'; askBtn.type = 'button'; askBtn.textContent = 'Ask for guidance';
    for (const b of [btn, askBtn]) { b.style.cssText = 'display:block;width:100%;margin:3px 0;min-height:44px;padding:10px 16px;border-radius:12px;border:1px solid #f3d36a;background:#243826;color:#fff7d8;font:700 15px system-ui,sans-serif;cursor:pointer;position:static;transform:none;pointer-events:auto'; }
    askBtn.style.borderColor = '#9fd3ff'; menu.append(btn, askBtn); document.body.appendChild(menu); } else document.body.appendChild(btn);
  if (askBtn) { const ask = e => { e.preventDefault(); e.stopPropagation(); S.show = 0; try { if (window.__ride && window.__ride.ready && !window.__ride.active && window.__ride.start()) { /* #314: guidance is a ride round the galleries */ } else { const g = window.eggs && window.eggs.eggs && window.eggs.eggs.guide; g && g.open(); } } catch (err) {} S.asks = (S.asks || 0) + 1; };
    askBtn.addEventListener('click', ask); askBtn.addEventListener('touchend', ask); ['mousedown', 'touchstart', 'pointerdown'].forEach(n => { askBtn.addEventListener(n, e => e.stopPropagation()); menu.addEventListener(n, e => e.stopPropagation()); }); menu.addEventListener('mouseenter', () => { S.over = true; }); menu.addEventListener('mouseleave', () => { S.over = false; }); }
  const cancel = document.createElement('button'); cancel.className = 'cr-cancel'; cancel.id = 'crCancel'; cancel.type = 'button'; cancel.textContent = 'CANCEL (Esc)'; document.body.appendChild(cancel);
  const touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window; if (!MENU) btn.querySelector('small').textContent = touch ? 'tap' : 'click'; else btn.querySelector('small').remove();
  const beam = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(), V()]), new THREE.LineBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.8, toneMapped: false }));
  beam.visible = false; beam.frustumCulled = false; E.scene.add(beam);
  const S = { show: 0, aimed: false, run: null, done: false, runs: 0, cancels: 0 };
  const locked = () => !!document.pointerLockElement;
  const usable = () => !S.run && !E.isRealm() && !(ctx.isBusy && ctx.isBusy()) && drone.root.visible !== false && !['knock', 'fetch', 'banana'].includes(drone.mode); // mid-job (a purchase delivery, a banana run) the bot finishes first
  function hits(x, y) { ndc.set(x, y); ray.setFromCamera(ndc, camera); ray.far = 14; return ray.intersectObject(drone.root, true).length > 0; }
  const box = () => menu || btn;
  function place() { const p = drone.root.position.clone(); p.y += 0.32; p.project(camera); if (p.z > 1) { S.show = 0; return; }
    const B = box(); B.style.left = Math.min(innerWidth - 110, Math.max(110, (p.x + 1) / 2 * innerWidth)) + 'px'; B.style.top = Math.min(innerHeight - (MENU ? 130 : 120), Math.max(MENU ? 120 : 70, (1 - p.y) / 2 * innerHeight)) + 'px'; }
  // pointer free (not locked): mouse over the bot
  addEventListener('mousemove', e => { if (locked() || !usable()) return; if (hits(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1)) S.show = 3.5; }, { passive: true });
  // phone: a tap on the bot (short touch, little movement)
  let t0 = null; addEventListener('touchstart', e => { const t = e.changedTouches[0]; t0 = t ? { x: t.clientX, y: t.clientY, at: performance.now() } : null; }, { passive: true });
  addEventListener('touchend', e => { const t = e.changedTouches[0]; if (!t0 || !t || !usable() || e.target === btn) return; if (performance.now() - t0.at > 450 || Math.hypot(t.clientX - t0.x, t.clientY - t0.y) > 18) return;
    if (hits(t.clientX / innerWidth * 2 - 1, -(t.clientY / innerHeight) * 2 + 1)) S.show = 6; }, { passive: true });
  // crosshair on the bot + click (pointer locked): start the run instead of firing the weapon
  addEventListener('mousedown', e => { if (!locked() || !S.show || e.button !== 0 || !usable() || (performance.now() - (S.aimedAt || 0) > 700 && !hits(0, 0))) return; /* crosshair on (or just off) the bot */ e.preventDefault(); e.stopImmediatePropagation();
    if (MENU && !touch) { S.freed = true; S.show = Math.max(S.show, 6); try { document.exitPointerLock(); } catch (err) {} return; } /* #308: a click on the bot frees the mouse so the menu buttons can be clicked; relocked when the menu closes */
    start(); }, true);
  btn.addEventListener('mouseenter', () => { S.over = true; }); btn.addEventListener('mouseleave', () => { S.over = false; });
  const press = e => { e.preventDefault(); e.stopPropagation(); start(); }; btn.addEventListener('click', press); btn.addEventListener('touchend', press);
  ['mousedown', 'touchstart', 'pointerdown'].forEach(n => { btn.addEventListener(n, e => e.stopPropagation()); cancel.addEventListener(n, e => e.stopPropagation()); });
  cancel.addEventListener('click', e => { e.preventDefault(); stop(true); }); cancel.addEventListener('touchend', e => { e.preventDefault(); stop(true); });
  addEventListener('keydown', e => { if (e.code === 'Escape' && S.run) stop(true); }, true);
  // ---- the run: a walkable path (the bots' floor grid) to just inside the checkout gate, or a short tow + direct checkout
  function route() { const CHK = ctx.checkout /* read live: the checkout target is data (#296 may move it) */; const from = V(camera.position.x, 0, camera.position.z);
    if (CHK && CHK.pos) { const n = CHK.n, front = V(CHK.pos.x + n.x * 1.1, 0, CHK.pos.z + n.z * 1.1), inside = V(CHK.pos.x + n.x * 0.25, 0, CHK.pos.z + n.z * 0.25);
      const path = world.path(from, front, 0.35); if (path && path.length) return { pts: [from, ...path.map(q => V(q.x, 0, q.z)), front, inside], gate: true }; }
    // gate out of reach on foot: a short tow across open floor toward the room's open side, then checkout directly
    const c = camera.position, f = V(); camera.getWorldDirection(f); f.y = 0; f.normalize(); let to = null;
    for (const r of [3, 2.2, 1.5]) { const t = world.randomFree(0.2, (x, z) => { const d = Math.hypot(x - c.x, z - c.z); return d > r * 0.7 && d < r * 1.3; }); if (t) { to = V(t.x, 0, t.z); break; } }
    const path = to ? world.path(from, to, 0.35) : null; return { pts: path && path.length ? [from, ...path.map(q => V(q.x, 0, q.z))] : [from], gate: false }; }
  function start() { if (!usable()) return; S.freed = false; const r = route(); const pts = r.pts; let L = 0; const acc = [0]; for (let i = 1; i < pts.length; i++) { L += pts[i].distanceTo(pts[i - 1]); acc.push(L); }
    S.run = { ...r, L, acc, s: 0, t: 0 }; S.runs++; S.show = 0; box().classList.remove('on'); if (menu) menu.style.display = 'none'; cancel.classList.add('on'); drone.tow(true); beam.visible = true;
    E.O && E.O.caption && E.O.caption('Hold on! To the checkout…', 2.2); window.__checkoutRun = S; }
  window.__takeMeToCheckout = () => start(); // the guide's 'checkout' answer uses the same towed run
  function stop(cancelled) { if (!S.run) return; const r = S.run; S.run = null; cancel.classList.remove('on'); beam.visible = false; drone.tow(false);
    if (cancelled) { S.cancels++; // stand on open floor where we stopped (the path is on the floor grid, so we already are; nudge if not)
      const c = camera.position; if (!ctx.walkable(c.x, c.z)) { const p = r.pts[Math.max(0, r.seg || 0)]; c.x = p.x; c.z = p.z; } E.O && E.O.caption && E.O.caption('Okay, stopping here.', 1.6); } }
  const at = (r, s) => { let i = 1; while (i < r.acc.length - 1 && r.acc[i] < s) i++; r.seg = i - 1; const a = r.pts[i - 1], b = r.pts[i], seg = (r.acc[i] - r.acc[i - 1]) || 1e-6, u = Math.min(1, Math.max(0, (s - r.acc[i - 1]) / seg)); return V(a.x + (b.x - a.x) * u, 0, a.z + (b.z - a.z) * u); };
  function update(dt) {
    if (S.run) { const r = S.run, now = performance.now(); dt = Math.min(0.4, Math.max(0, (now - (r.wall || now)) / 1000)); /* #308: was 0.1, which crawled at low fps and read as 'stuck' */ r.wall = now; r.t += dt; if (r.t > r.L / SPEED + 7 && r.s < r.L) r.s = r.L; /* #308 failsafe: always arrive, never hang */ /* wall-clock: just as quick on a slow device */ const ramp = Math.min(1, r.t / 0.6); r.s = Math.min(r.L, r.s + SPEED * ramp * dt);
      const me = at(r, r.s), ahead = at(r, Math.min(r.L, r.s + 1.4)); const c = camera.position; c.x = me.x; c.z = me.z;
      const dp = drone.root.position; dp.x += (ahead.x - dp.x) * Math.min(1, dt * 10); dp.z += (ahead.z - dp.z) * Math.min(1, dt * 10); drone.root.rotation.y = Math.atan2(ahead.x - me.x, ahead.z - me.z) || drone.root.rotation.y;
      if (r.L > 0.3) { const look = V(ahead.x, c.y - 0.1, ahead.z); if (look.distanceTo(V(c.x, c.y, c.z)) > 0.2) camera.lookAt(look); }
      const a = beam.geometry.attributes.position; a.setXYZ(0, dp.x, dp.y - 0.05, dp.z); a.setXYZ(1, c.x, c.y - 0.35, c.z); a.needsUpdate = true;
      if (r.s >= r.L - 1e-3 && r.t > 0.3) { const g = r.gate; S.lastT = r.t; stop(false); S.done = true; if (!g || !window.__checkoutGo) setTimeout(() => window.__goCheckout && !window.__checkoutGo && window.__goCheckout(), g ? 400 : 150); } // through the gate (or straight there)
      return; }
    // hover state (crosshair on the bot while locked), and the button follows the bot
    if ((S.aimT = (S.aimT || 0) - dt) <= 0) { S.aimT = 0.1; S.aimed = locked() && usable() && hits(0, 0); if (S.aimed) { S.show = Math.max(S.show, 0.8); S.aimedAt = performance.now(); } }
    if (S.over) S.show = Math.max(S.show, 0.5); if (menu && menu.matches(':hover')) S.show = Math.max(S.show, 0.8); S.show = Math.max(0, S.show - dt); const on = S.show > 0 && usable() && !(window.__tour && window.__tour.phase === 'offer'); const was = box().classList.contains('on'); box().classList.toggle('on', on); if (menu) menu.style.display = on ? 'block' : 'none';
    if (MENU && S.freed && !on && !S.run && !window.__eggGuide && !document.pointerLockElement && ctx.canvas) { S.freed = false; S.relocks = (S.relocks || 0) + 1; try { const r = ctx.canvas.requestPointerLock(); r && r.catch && r.catch(() => {}); } catch (err) {} } /* menu closed: take the mouse back (if the browser refuses without a click, the usual click-to-look still works) */
    if (on && !was) { place(); drone.attend && drone.attend(); /* it waits by you while the button is up */ if (!MENU) btn.querySelector('small').textContent = locked() ? 'click' : touch ? 'tap' : 'click'; } } // placed once when it appears, so it stays put (easy to click)
  /* arrival record for tests */ const _stop = stop; 
  return { name: 'checkoutRun', update, start, stop: () => stop(true), get running() { return !!S.run; }, state: S, btn, cancel };
}
