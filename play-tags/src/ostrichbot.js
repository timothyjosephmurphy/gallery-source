// #289 (TJ): the guide bot is a flying purple ostrich (original model, /workspace/ostrich-robot, built in Blender, meshopt-compressed).
// It skins the shared guide drone exactly like the duck did (the drone's own meshes are hidden), so every drone behaviour (tow, cart delivery,
// guide chat, the #308 menu) keeps working. Animation follows how the drone moves: Hover when it waits, Walk when it drifts slowly, Fly when it
// travels; one-shots Takeoff / Land / Flip / Point_L / Point_R are exposed for the tour and the ride (#314). LOD1 on phones. Falls back to the duck.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { skinDuck } from './duckbot.js';
import { applyOstrichBump } from './ostrichBump470.js';
const BASE = import.meta.env.BASE_URL + 'img/play/preview-289/';
/* #369: Walk clip (2 s) stance foot slides back 0.274 model-units/s at timeScale 1 (measured Foot_L/R z, frames 0-0.9 s) => ground speed = 0.274*scale*timeScale; play at sp/that so planted feet don't skate */
const WALK_STANCE_V = 0.274;
// #369 follow-up: the old cap of 9 topped out at 9*0.274*1.1 = 2.71 m/s, so the feet skated above that. 15 covers ~4.5 m/s (guide) and leaves rider scale unaffected in practice.
const WALK_TS_CAP = 15;
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
  api.rider = on => { S.rider = !!on; for (const k of ['Neck', 'Head']) { const n = api.nodes[k]; if (n) n.visible = !on; } holder.scale.setScalar(on ? RIDE_SCALE : BOT_SCALE); holder.position.y = on ? 0 : -root.position.y + 0.03 - (S.minY || 0) * BOT_SCALE; };
  api.seat = () => api.nodes.RiderSeat; api.snap = n => { api.play(n, 0, n === 'Walk' ? 0.0001 : 1); if (api.mixer) api.mixer.update(0.001); }; api.force = n => { S.force = n || null; }; api.walkSpeed = v => { S.sp = v; }; api.still = on => { S.still = !!on; };
  api.update = dt => { if (!dt || !api.mixer) return; const p = root.position, v = Math.hypot(p.x - S.last.x, p.z - S.last.z) / dt; S.last.copy(p); S.sp += (Math.min(v, 8) - S.sp) * Math.min(1, dt * 5);
    if (S.once) { S.once.until -= dt; if (S.once.until <= 0) { const n = S.once.then || 'Walk'; S.once = null; api.play(n, 0.2); } }
    else {
      // #321 (TJ): it WALKS by default (feet on the floor; the drone rides low, eggs-run.js droneFly:false). Moving fast only speeds the stride up; standing still holds the walk pose.
      // No automatic flying or hovering: Fly/Takeoff/Land are only played when the tour or ride asks for them.
      const busy = S.rider || window.__reading || window.__rideOn || ['tow', 'fetch', 'cart', 'haulTo'].includes(D.mode) || S.force;
      S.fl = S.fl || { next: 40 + Math.random() * 30, ph: 0, t: 0, y: 0 }; const F = S.fl;
      if (F.ph === 0) { F.next = 1e9; /* #321: no automatic flying flourish; walks by default */ }
      else if (busy) { F.ph = 0; F.next = 40 + Math.random() * 30; }
      const moving = S.sp > 0.18, want = S.force || (F.ph === 2 ? 'Fly' : 'Walk');
      if (F.ph === 1) { F.t += dt; if (F.t > 0.9) { F.ph = 2; F.t = 0; } } else if (F.ph === 2) { F.t += dt; if (F.t > 3.6) { F.ph = 3; F.t = 0; api.land(); } } else if (F.ph === 3) { F.t += dt; if (F.t > 1.1) { F.ph = 0; F.next = 40 + Math.random() * 30; } }
      if (F.ph === 2) api.play('Fly', 0.3, 1); else if (F.ph === 0) api.play(want, 0.3, want === 'Walk' ? (moving && !S.still ? Math.min(WALK_TS_CAP, S.sp / (WALK_STANCE_V * holder.scale.x)) : 0.0001) : 1);
    }
    { const F = S.fl || (S.fl = { next: 1e9, ph: 0, t: 0, y: 0 }); /* #796: always ground the bird (was skipped while a one-shot played) */ if (F) { F.y += ((F.ph === 1 || F.ph === 2 ? 0.9 : 0) - F.y) * Math.min(1, dt * 2.4); if (!S.rider) holder.position.y = -root.position.y + 0.03 - (S.minY || 0) * holder.scale.x + (D.flip >= 0 || D.hopT > 0 || D.flipPending ? 0 : F.y) + (D.hover && !(D.flip >= 0 || D.hopT > 0 || D.flipPending) ? Math.max(0, root.position.y - 0.105) : 0); /* #737: feet on world floor y=0; #746: while the drone hovers (pull-off) the bird rises WITH it, so the thrusters stay on the bird; #796 (TJ Oct 27 ~4:46 PM): during a flip hop only the jets (rig) leave the floor and flip, the ostrich stays grounded */ holder.rotation.set(0, holder.rotation.y, 0); } }
    api.mixer.update(dt); };
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load(BASE + (low ? 'ostrich-lod1.glb' : 'ostrich-lod0.glb'), gltf => {
    const m = gltf.scene; m.traverse(o => { if (o.name) api.nodes[o.name] = o; if (o.isMesh) { o.frustumCulled = false; window.__ostrichBot.meshes++; const g = o.geometry; window.__ostrichBot.tris += (g.index ? g.index.count : g.attributes.position.count) / 3; if (o.material) { o.material.side = THREE.DoubleSide; } } });
    holder.add(m); { holder.updateMatrixWorld(true); const wy = new THREE.Vector3(), v = new THREE.Vector3(); holder.getWorldPosition(wy); let mn = 1e9; m.traverse(o => { if (o.isMesh) { o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; for (const y of [bb.min.y, bb.max.y]) for (const x of [bb.min.x, bb.max.x]) for (const z of [bb.min.z, bb.max.z]) { v.set(x, y, z).applyMatrix4(o.matrixWorld); mn = Math.min(mn, v.y); } } }); S.minY = (mn - wy.y) / holder.scale.x; /* lowest vertex of the rest pose, in holder units: the feet stand on the floor */ window.__ostrichBot.minY = S.minY; } api.mixer = new THREE.AnimationMixer(m); for (const c of gltf.animations) api.actions[c.name] = api.mixer.clipAction(c);
    try { const b = applyOstrichBump(m, low); window.__ostrichBot.bump = b.bump; window.__ostrichBot.bump470 = b; } catch (e) { window.__ostrichBot.bumpError = String(e && e.message || e); } /* #470 */ window.__ostrichBot.clips = gltf.animations.map(c => c.name); api.ready = true; window.__ostrichBot.ready = true; api.play('Walk', 0, 0.0001); api.mixer.update(0.01); /* #737: re-measure the lowest SKINNED vertex in the Walk pose (bind-pose BB sat ~0.25 m too high, feet sank) */ try { holder.updateMatrixWorld(true); const v = new THREE.Vector3(), w = new THREE.Vector3(); holder.getWorldPosition(w); let mn = 1e9; m.traverse(o => { if (o.isMesh && o.geometry.attributes.position) { const pa = o.geometry.attributes.position; for (let i = 0; i < pa.count; i += 2) { v.fromBufferAttribute(pa, i); if (o.isSkinnedMesh) o.applyBoneTransform(i, v); v.applyMatrix4(o.matrixWorld); if (v.y < mn) mn = v.y; } } }); if (mn < 1e8) { S.minY = (mn - w.y) / holder.scale.x; window.__ostrichBot.minY = S.minY; } } catch (e) { window.__ostrichBot.minYError = String(e && e.message || e); }
  }, undefined, err => { api.failed = true; window.__ostrichBot.error = String(err && err.message || err); holder.visible = false; D.__duck = null; skinDuck(D, low); });
  D.__duck = api; return api;
}
