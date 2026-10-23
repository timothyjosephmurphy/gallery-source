// #289 (TJ): the guide bot is a flying purple ostrich (original model, /workspace/ostrich-robot, built in Blender, meshopt-compressed).
// It skins the shared guide drone exactly like the duck did (the drone's own meshes are hidden), so every drone behaviour (tow, cart delivery,
// guide chat, the #308 menu) keeps working. Animation follows how the drone moves: Hover when it waits, Walk when it drifts slowly, Fly when it
// travels; one-shots Takeoff / Land / Flip / Point_L / Point_R are exposed for the tour and the ride (#314). LOD1 on phones. Falls back to the duck.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { skinDuck } from './duckbot.js';
const BASE = import.meta.env.BASE_URL + 'img/play/preview-289/';
export const BOT_SCALE = 1.1, /* #322 (TJ): about waist height, ~1 m standing (the model is ~0.88 m tall at scale 1) */ RIDE_SCALE = 2.6; // guide size / rider size (RiderSeat is at (0, 0.426, 0) on Body and assumes ~2.6x)
export function skinOstrich(D, low) {
  if (!D || D.__duck) return D && D.__duck;
  const root = D.root; for (const c of root.children.slice()) c.visible = false;
  const holder = new THREE.Group(); holder.name = 'ostrichBot'; holder.position.y = -0.2; holder.scale.setScalar(BOT_SCALE); root.add(holder);
  // #322: the hover/tap menu and the crosshair click raycast the drone root; the drone's own meshes are hidden, so a fixed invisible hit volume covers the bird's whole body (waist-high, ~1 m)
  { const hit = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), new THREE.MeshBasicMaterial({ visible: false })); hit.name = 'ostrichHit'; hit.position.set(0, 0.45, 0); hit.visible = false; hit.frustumCulled = false; root.add(hit); }
  const S = { cur: null, once: null, t: 0, sp: 0, last: root.position.clone(), rider: false, scale: BOT_SCALE };
  const api = { g: holder, ready: false, failed: false, mixer: null, actions: {}, nodes: {}, state: S };
  window.__ostrichBot = { low: !!low, ready: false, meshes: 0, tris: 0, clips: [], api };
  api.play = (name, fade = 0.25, ts = 1) => { const a = api.actions[name]; if (!a) return null; if (S.cur !== name) { const p = api.actions[S.cur]; a.reset().setEffectiveWeight(1).fadeIn(fade).play(); if (p) p.fadeOut(fade); S.cur = name; } a.setEffectiveTimeScale(ts); return a; };
  api.oneShot = (name, then) => { const a = api.actions[name]; if (!a || !api.mixer) return 0; const prev = S.cur; S.once = { name, then: then || prev, until: a.getClip().duration }; a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.setEffectiveWeight(1).fadeIn(0.15).play(); const p = api.actions[S.cur]; if (p) p.fadeOut(0.15); S.cur = name; return a.getClip().duration; };
  api.point = side => api.oneShot(side < 0 ? 'Point_L' : 'Point_R', 'Walk'); api.flip = () => api.oneShot('Flip'); api.takeoff = () => api.oneShot('Takeoff', 'Fly'); api.land = () => api.oneShot('Land', 'Walk');
  // rider mode (#314): hide Neck and Head (the saddle camera would look into them) and scale to ~2.6x
  api.rider = on => { S.rider = !!on; for (const k of ['Neck', 'Head']) { const n = api.nodes[k]; if (n) n.visible = !on; } holder.scale.setScalar(on ? RIDE_SCALE : BOT_SCALE); holder.position.y = on ? 0 : -0.105 - (S.minY || 0) * BOT_SCALE; };
  api.seat = () => api.nodes.RiderSeat; api.snap = n => { api.play(n, 0, n === 'Walk' ? 0.0001 : 1); if (api.mixer) api.mixer.update(0.001); }; api.force = n => { S.force = n || null; }; api.walkSpeed = v => { S.sp = v; }; api.still = on => { S.still = !!on; };
  api.update = dt => { if (!dt || !api.mixer) return; const p = root.position, v = Math.hypot(p.x - S.last.x, p.z - S.last.z) / dt; S.last.copy(p); S.sp += (Math.min(v, 8) - S.sp) * Math.min(1, dt * 5);
    if (S.once) { S.once.until -= dt; if (S.once.until <= 0) { const n = S.once.then || 'Hover'; S.once = null; api.play(n, 0.2); } }
    else {
      // #321 (TJ): it WALKS by default (feet on the floor; the drone rides low, eggs-run.js droneFly:false). Moving fast only speeds the stride up; standing still holds the walk pose.
      // Flying is an occasional flourish: every 40-70 s of strolling it takes off, circles up ~0.9 m for a few seconds, and lands (never while riding, towing, fetching or reading).
      const busy = S.rider || window.__reading || window.__rideOn || ['tow', 'fetch', 'cart', 'haulTo'].includes(D.mode) || S.force;
      S.fl = S.fl || { next: 40 + Math.random() * 30, ph: 0, t: 0, y: 0 }; const F = S.fl;
      if (F.ph === 0) { F.next -= dt; if (F.next <= 0 && !busy && api.actions.Takeoff) { F.ph = 1; F.t = 0; api.takeoff(); } }
      else if (busy) { F.ph = 0; F.next = 40 + Math.random() * 30; }
      const moving = S.sp > 0.18, want = S.force || (F.ph === 2 ? 'Fly' : 'Walk');
      if (F.ph === 1) { F.t += dt; if (F.t > 0.9) { F.ph = 2; F.t = 0; } } else if (F.ph === 2) { F.t += dt; if (F.t > 3.6) { F.ph = 3; F.t = 0; api.land(); } } else if (F.ph === 3) { F.t += dt; if (F.t > 1.1) { F.ph = 0; F.next = 40 + Math.random() * 30; } }
      if (F.ph === 2) api.play('Fly', 0.3, 1); else if (F.ph === 0) api.play(want, 0.3, want === 'Walk' ? (moving && !S.still ? Math.min(2.2, Math.max(0.6, S.sp / 1.1)) : 0.0001) : 1);
    }
    { const F = S.fl; if (F) { F.y += ((F.ph === 1 || F.ph === 2 ? 0.9 : 0) - F.y) * Math.min(1, dt * 2.4); if (!S.rider) holder.position.y = -0.105 - (S.minY || 0) * holder.scale.x + F.y; } }
    api.mixer.update(dt); };
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load(BASE + (low ? 'ostrich-lod1.glb' : 'ostrich-lod0.glb'), gltf => {
    const m = gltf.scene; m.traverse(o => { if (o.name) api.nodes[o.name] = o; if (o.isMesh) { o.frustumCulled = false; window.__ostrichBot.meshes++; const g = o.geometry; window.__ostrichBot.tris += (g.index ? g.index.count : g.attributes.position.count) / 3; if (o.material) { o.material.side = THREE.DoubleSide; } } });
    holder.add(m); { holder.updateMatrixWorld(true); const wy = new THREE.Vector3(), v = new THREE.Vector3(); holder.getWorldPosition(wy); let mn = 1e9; m.traverse(o => { if (o.isMesh) { o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; for (const y of [bb.min.y, bb.max.y]) for (const x of [bb.min.x, bb.max.x]) for (const z of [bb.min.z, bb.max.z]) { v.set(x, y, z).applyMatrix4(o.matrixWorld); mn = Math.min(mn, v.y); } } }); S.minY = (mn - wy.y) / holder.scale.x; /* lowest vertex of the rest pose, in holder units: the feet stand on the floor */ window.__ostrichBot.minY = S.minY; } api.mixer = new THREE.AnimationMixer(m); for (const c of gltf.animations) api.actions[c.name] = api.mixer.clipAction(c);
    window.__ostrichBot.clips = gltf.animations.map(c => c.name); api.ready = true; window.__ostrichBot.ready = true; api.play('Walk', 0, 0.0001); api.mixer.update(0.01);
  }, undefined, err => { api.failed = true; window.__ostrichBot.error = String(err && err.message || err); holder.visible = false; D.__duck = null; skinDuck(D, low); });
  D.__duck = api; return api;
}
