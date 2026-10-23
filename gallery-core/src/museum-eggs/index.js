// museum-eggs: one entry point. installEggs(ctx) adds 17 procedural easter eggs to a TJM gallery without editing it.
// See ../INTEGRATION.md for the ctx fields. Everything is original and procedural; sounds are synthesized and obey mute.
import { THREE, V, makeAudio, makeOverlay, makeSpatial, makeClicks, makePuffs, setQuality } from './kit.js';
import { makeWorld } from './world.js';
import { eggSecret } from './eggs/secret.js';
import { eggBox } from './eggs/box.js';
import { eggSlender } from './eggs/slender.js';
import { EGG_FLAGS } from './egg-config.js';
import { eggInsanity, eggMagritte, eggUntitled4, eggBobbleheads } from './eggs/walls.js';
import { eggSatoshi, eggPizza, eggCoin, eggPrinter } from './eggs/floor.js';
import { eggDrone, eggBanana, eggOstrich } from './eggs/agents.js';
import { eggGuide } from './eggs/guide.js';
import { eggCheckoutRun } from './eggs/checkoutrun.js';
import { eggDune } from './eggs/dune.js';
import { eggStarship } from './eggs/starship.js';
export { ctxFromGame } from './ctx.js';
export function installEggs(ctx) {
  if (ctx && ctx.eggs === false) return null; // #242: per-gallery eggs-off flag (gallery-core MUSEUM.eggs === false); nothing is built
  const t0 = performance.now();
  const noop = () => false; ctx = { isMuted: noop, isRealm: noop, isBusy: noop, seed: 1, ...ctx };
  const world = ctx.world || makeWorld({ scene: ctx.scene, walkable: ctx.walkable, paintings: ctx.paintings, rooms: ctx.rooms, gates: [ctx.gate, ctx.checkout], start: ctx.camera.position });
  const E = { ctx, scene: ctx.scene, camera: ctx.camera, world, seed: ctx.seed, pushables: [], sweepHooks: [], foundSet: new Set(), errors: [],
    get cam() { return ctx.camera.position; }, walk: (x, z) => ctx.walkable(x, z), isRealm: () => !!ctx.isRealm(), found: n => { E.foundSet.add(n); ctx.onFound && ctx.onFound(n); } };
  if (!ctx.world) { if (ctx.findWallSpot) world.findWallSpot = ctx.findWallSpot; if (ctx.findFloorSpot) world.findFloorSpot = ctx.findFloorSpot; } // custom finders from the gallery
  setQuality(ctx.quality ? ctx.quality === 'low' : !!ctx.lowPower); // 'hd' models by default; lighter on low-tier devices
  E.A = makeAudio(ctx); E.O = makeOverlay(ctx); E.S = makeSpatial(ctx); E.clicks = makeClicks(ctx); E.puffs = makePuffs(ctx.scene, ctx.lowPower ? 40 : 64);
  const eggs = {}, skipped = [];
  // ctx.only: the egg set a gallery asks for (e.g. the splat rooms keep just the guide bot); everything else is switched off, not skipped
  const only = ctx.only ? new Set(ctx.only) : null, disabled = [];
  const times = {}; const flags = { ...EGG_FLAGS, ...(ctx.eggFlags || {}) }; const add = (name, fn, ...a) => { if ((only && !only.has(name)) || flags[name] === false) { disabled.push(name); return null; } const t1 = performance.now(); try { const r = fn(E, ...a); if (r) eggs[name] = r; else skipped.push(name); return r; } catch (e) { skipped.push(name); E.errors.push(name + ': ' + (e && e.message)); console.warn('[eggs]', name, e); return null; } finally { times[name] = Math.round(performance.now() - t1); } };
  const sec = add('secret', eggSecret);
  if (sec) { world._wm = null; world.reserveWall({ pos: sec.room.pos.clone().setY(1.5), n: sec.room.n, w: sec.room.RW + 1.2, h: 3 }, 'secret'); }
  add('untitled4', eggUntitled4); add('insanity', eggInsanity); add('notasoup', eggMagritte); add('bobbleheads', eggBobbleheads);
  add('printer', eggPrinter); add('satoshi', eggSatoshi); /* printer first: it gets first pick of the windows (#137) */ add('pizza', eggPizza); add('coin', eggCoin);
  const drone = add('drone', eggDrone); add('guide', eggGuide, drone);
  if (drone && (!only || only.has('guide'))) { try { const r = eggCheckoutRun(E, drone); if (r) eggs.checkoutRun = r; } catch (e) { E.errors.push('checkoutRun: ' + e.message); } } /* #236: part of the guide bot (on wherever it is) */
  add('banana', eggBanana, drone); add('dune', eggDune);
  add('box', eggBox); if (!window.__noOstrichEgg) add('ostrich', eggOstrich); add('slender', eggSlender); /* the slender figure (was 'tallman') */ add('starship', eggStarship);
  // purchases: the drone brings a cart with a mini copy (polls painting state; galleries can also call api.purchase)
  const seen = new Set(); (ctx.paintings || []).forEach(p => { if (p.state === 'cart' || p.state === 'lifting') seen.add(p); });
  let pollT = 0, cullT = 0, last = performance.now(), tm = 0, frames = 0, dtSum = 0;
  function cull(hide = E.isRealm(), now = performance.now()) { cullT = now; for (const k in eggs) { const e = eggs[k]; if (!e.group || !e.anchor) continue; e.group.visible = !hide && e.anchor.distanceTo(E.cam) < (e.cull || 32); } } // 4 Hz, wall-clock
  let skew = 0; // test hook: advance() moves egg time forward without rendering
  function tick(now = performance.now()) {
    now += skew; const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; if (window.__paused || document.hidden) return; tm += dt; frames++; dtSum += dt;
    const hide = E.isRealm(); E.A.tick();
    if (now - cullT > 250) cull(hide, now);
    for (const k in eggs) { const e = eggs[k]; if (!e.update) continue; try { e.update(dt, tm); } catch (err) { if (!e.err) { e.err = 1; E.errors.push(k + ': ' + err.message); console.warn('[eggs]', k, err); } } }
    if (tools) toolTick(dt);
    E.puffs.update(dt); E.O.update(dt, ctx.camera, hide || ctx.isBusy());
    if (!ctx.isBusy() && !hide) world.pushOut(ctx.camera.position);
    if (ctx.paintings && drone && (pollT -= dt) <= 0) { pollT = 0.5; for (const p of ctx.paintings) if ((p.state === 'cart' || p.state === 'lifting') && !seen.has(p)) { seen.add(p); setTimeout(() => drone.deliverPurchase(p), 2400); } }
  }
  // optional tool-pack hooks (museum-tools/glitterblower.js): leaf blower pushes our props, the drone sweeps glitter
  const tools = ctx.tools || null, toolPush = [];
  if (tools && tools.pushables && tools.pushables.add) for (const p of E.pushables) { const acc = V(), wp = V(), e = { name: 'egg-' + p.name, object: p.obj, radius: p.r || 0.4, mass: p.mass || 1, getPosition: () => p.obj.getWorldPosition(wp), onPush: imp => acc.add(imp) };
    tools.pushables.add(e); toolPush.push({ p, acc, t: 0 }); }
  if (tools && tools.sweepAt) E.sweepHooks.push((x, z, r) => tools.sweepAt(V(x, 0, z), r + 0.15));
  let glitT = 3;
  function toolTick(dt) { for (const q of toolPush) { q.t += dt; if (q.t < 0.12) continue; q.t = 0; if (q.acc.lengthSq() > 4e-4) { q.p.push(q.acc.clone()); } q.acc.set(0, 0, 0); } // blower force arrives per frame; hand it on in ~8 Hz pulses
    if (drone && tools && tools.glitter && (glitT -= dt) <= 0) { glitT = 4; const g = tools.glitter; if (g.settled > 0 && g.positions && g.states) { const dp = drone.root.position; let best = null, bd = 25;
      for (let i = 0; i < g.cap; i += 7) if (g.states[i] === 2) { const d = Math.hypot(g.positions[i * 3] - dp.x, g.positions[i * 3 + 2] - dp.z); if (d < bd) { bd = d; best = i; } }
      if (best != null) drone.sweepTo({ x: g.positions[best * 3], z: g.positions[best * 3 + 2] }); } } }
  if (ctx.addTick) ctx.addTick(tick); else { const raf = () => { requestAnimationFrame(raf); tick(); }; requestAnimationFrame(raf); }
  const api = {
    eggs, skipped, disabled, world, E, get found() { return [...E.foundSet]; }, get errors() { return E.errors; }, tick,
    pushables: E.pushables, sweepHooks: E.sweepHooks, onSweep: fn => E.sweepHooks.push(fn),
    push(name, imp) { const p = E.pushables.find(q => q.name === name || q.obj === name); if (p) p.push(imp.clone ? imp.clone() : V(imp.x, imp.y || 0, imp.z)); return !!p; },
    // leaf blower: everything pushable in a cone in front of `origin` along `dir` gets shoved (falls off with distance)
    blow(origin = ctx.camera.position, dir = ctx.camera.getWorldDirection(V()), o = {}) { const range = o.range || 6, cos = Math.cos((o.cone || 30) * Math.PI / 180), k = o.strength || 4; let n = 0;
      for (const p of E.pushables) { const c = p.obj.getWorldPosition(V()), d = V().subVectors(c, origin), L = d.length(); if (L > range || L < 0.01) continue; if (d.normalize().dot(dir) < cos) continue; p.push(dir.clone().setY(Math.max(0, dir.y) + 0.15).normalize().multiplyScalar(k * (1 - L / range * 0.7))); n++; } return n; },
    // gravity gun: the pushable closest to the aim ray (within 14 m) gets launched
    gravPush(origin = ctx.camera.position, dir = ctx.camera.getWorldDirection(V()), o = {}) { let best = null, bd = 1e9; for (const p of E.pushables) { const c = p.obj.getWorldPosition(V()); c.y += 0.3; const d = V().subVectors(c, origin), L = d.length(); if (L > (o.range || 14)) continue; const off = d.clone().sub(dir.clone().multiplyScalar(d.dot(dir))).length(); if (d.dot(dir) <= 0 || off > p.r + 0.35) continue; if (L < bd && E.S.los(c, origin)) { bd = L; best = p; } }
      if (best) best.push(dir.clone().multiplyScalar(o.strength || 7).add(V(0, 2.5, 0))); return best ? best.name : null; },
    purchase: p => drone ? drone.deliverPurchase(p) : false, drone: drone || null,
    // buy-flow hand-off (see CHANGES-2026-10-18.md): the gallery calls this instead of its own lift-off animation. The drone brings the
    // trolley and takes the painting off the wall; done() fires the moment it leaves the wall (mark IN CART / the empty spot then).
    takePainting: (p, done) => { if (!drone || !p || !p.data || ctx.isRealm()) return false; seen.add(p); return drone.deliverPurchase(p, done); },
    view(name, which = 'view') { const e = eggs[name]; if (!e || !e[which]) return null; const v = e[which](); if (!v) return null; ctx.camera.position.copy(v.from); ctx.camera.lookAt(v.to); cull(); return v; },
    get fps() { return frames / Math.max(1e-3, dtSum); },
    advance(sec, step = 0.05) { const n = Math.ceil(sec / step); for (let i = 0; i < n; i++) { skew += step * 1000; tick(); } },
    installMs: 0, times, worldMs: 0, ctx,
  };
  api.installMs = Math.round(performance.now() - t0);
  return api;
}
