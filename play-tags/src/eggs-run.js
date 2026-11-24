// the egg installer proper; loaded only by eggs-install.js when this museum has eggs on (MUSEUM.eggs !== false, #242)
import { MUSEUM } from './museum.config.js';
// museum easter eggs (shared module in ./museum-eggs, canonical copy /workspace/museum-eggs/src)
import { installEggs, ctxFromGame } from './museum-eggs/index.js';
import { makeWorld } from './museum-eggs/world.js';
const game = window.game, ctx = ctxFromGame(game, { seed: 1 });
// our walls are densely hung, so the floor in front of them is all viewing zone: if a floor egg finds no spot by a wall or in a
// corner, let it stand out on the open floor instead (still clear of doors, gates, paintings' viewing zones and other eggs)
const world = ctx.world = makeWorld({ scene: ctx.scene, walkable: ctx.walkable, paintings: ctx.paintings, rooms: ctx.rooms, gates: [ctx.gate, ctx.checkout], start: ctx.camera.position });
const floorSpot = world.findFloorSpot.bind(world);
world.findFloorSpot = (q = {}) => floorSpot(q) || floorSpot({ ...q, place: 'open' }) || floorSpot({ ...q, place: 'open', spread: 0, minStart: 3 });
const eggs = window.eggs = installEggs({ ...ctx, eggs: MUSEUM.eggs, droneFly: false /* #321 (TJ): the guide bot walks on the floor by default; no automatic flying (ostrichbot.js) */ });
const GRAV = 2; // slot of the gravity gun (tool 3)
addEventListener('mousedown', e => { if (document.pointerLockElement && e.button === 2 && game.weapon === GRAV) eggs.gravPush(); });
document.getElementById('tlaunch')?.addEventListener('touchstart', () => { if (game.weapon === GRAV) eggs.gravPush(); }, { passive: true });
// #830 (TJ): wire the #213 guide-bot trolley: the bot hauls its cart behind you while the Gravity Gun is out, and a held painting
// aimed at the trolley goes onto it (dropHook). eggs tick internally (no eggs.update), so a light rAF loop drives haul().
{ const drone = eggs && eggs.drone; let hooked = null;
  if (drone && drone.haul) { const tick = () => { requestAnimationFrame(tick);
      const gv = game.grav; if (gv && hooked !== gv) { hooked = gv; gv.dropHook = p => { const dir = new game.THREE.Vector3(); game.camera.getWorldDirection(dir); return !!(drone.aimsAtTrolley(game.camera.position, dir) && drone.stow(p)); }; }
      try { drone.haul(game.weapon === GRAV && !game.pausedPortrait); } catch (e) {} };
    requestAnimationFrame(tick); } }

// museum-gates: side hall of slipgates to the other museums (shared module in ./museum-gates, canonical /workspace/museum-gates/src)
import { installGates } from './museum-gates/index.js';
window.__gatesApi = MUSEUM.gates === false ? null : installGates({ scene: ctx.scene, camera: ctx.camera, canvas: ctx.canvas, here: MUSEUM.id, walkable: ctx.walkable, paintings: ctx.paintings,
  addWalkRect: r => (window.__walkExtra = window.__walkExtra || []).push((x, z) => x > r.minX && x < r.maxX && z > r.minZ && z < r.maxZ),
  avoid: [ctx.gate, ctx.checkout].filter(Boolean).map(p => ({ x: (p.pos || p).x, z: (p.pos || p).z, r: 5, rMin: (p.w || 1.5) / 2 + 1.5 })), start: ctx.camera.position.clone(), isMuted: ctx.isMuted, isBusy: ctx.isBusy, realm: window.game && window.game.GATE,
  nearDoor: ctx.world && ctx.world.nearDoor ? (x, z, r) => ctx.world.nearDoor(x, z, r) : null });
