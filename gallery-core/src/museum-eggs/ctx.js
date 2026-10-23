import { MUSEUM } from '../museum.config.js';
// Build an installEggs ctx from a TJM gallery's window.game (every gallery exposes the same fields).
import { THREE, V } from './kit.js';
import { makeWorld } from './world.js';
export function detectOpenings(game) {
  const out = [], scene = game.scene; scene.updateMatrixWorld(true);
  // glazed window panes: thin transparent boxes at least 1 m tall
  scene.traverse(m => { if (!m.isMesh || m.geometry.type !== 'BoxGeometry' || !(m.material && m.material.transparent)) return; const p = m.geometry.parameters, s = m.getWorldScale(V());
    const w = p.width * s.x, h = p.height * s.y, d = p.depth * s.z; if (h < 1 || Math.min(w, d) > 0.06 || Math.max(w, d) < 0.8) return; const c = m.getWorldPosition(V()), ax = w < d ? V(1, 0, 0) : V(0, 0, 1);
    const inA = game.walkable(c.x + ax.x * 1.2, c.z + ax.z * 1.2), inB = game.walkable(c.x - ax.x * 1.2, c.z - ax.z * 1.2); if (inA === inB) return; out.push({ c, n: inA ? ax.clone().negate() : ax.clone(), w: Math.max(w, d), h, kind: 'window' }); });
  // classic room windows (main.js windowSpots)
  (game.windowSpots || []).forEach(wd => { const horiz = wd.side === 'N' || wd.side === 'S', mid = (wd.from + wd.to) / 2; const c = horiz ? V(mid, (wd.sill + wd.head) / 2, wd.c) : V(wd.c, (wd.sill + wd.head) / 2, mid); out.push({ c, n: V(-wd.inward[0], 0, -wd.inward[1]), w: wd.to - wd.from, h: wd.head - wd.sill, kind: 'window' }); });
  return out;
}
export function displayMode() { try { const q = new URLSearchParams(location.search).get('display'); if (q === 'window' || q === 'niche') return q;
  return /(^|\.)tjm\.art$/.test(location.hostname) && MUSEUM.id === 'play' ? 'window' : 'niche'; /* one app (#24): only TJM's own gallery uses window display */ } catch (e) { return 'niche'; } }
export function ctxFromGame(game, o = {}) {
  const walkExtra = o.walkExtra || window.__walkExtra; // optional hook: an array the gallery's walkable() also checks
  const world = makeWorld({ scene: game.scene, walkable: game.walkable, paintings: game.paintings, rooms: game.ROOMS, gates: [game.GATE, game.CHK], start: game.camera.position });
  return {
    scene: game.scene, camera: game.camera, canvas: game.renderer && game.renderer.domElement, walkable: game.walkable, rooms: game.ROOMS, paintings: game.paintings, gate: game.GATE, checkout: game.CHK, world,
    findWallSpot: q => world.findWallSpot(q), findFloorSpot: q => world.findFloorSpot(q),
    addWalkable: walkExtra ? f => walkExtra.push(f) : null,
    openings: o.openings || detectOpenings(game),
    elves: game.makeElf ? { make: game.makeElf, animate: game.animateElf, list: o.elves || [] } : null,
    isMuted: () => !!(game.holo && game.holo.muted),
    isRealm: () => !!(game.chaosActive || game.falling),
    isBusy: () => !!(game.chaosActive || game.falling || (game.swarm && game.swarm.locked) || window.__reading),
    tools: game.tools || null, // optional: museum-tools glitterblower api (sweepAt, pushables)
    // how cultural artifacts are shown: 'window' (by a window, lit: the Quake gallery at tjm.art/play) or 'niche' (a lit alcove along a wall)
    display: o.display || displayMode(),
    audioContext: o.audioContext || null, lowPower: game.tier === 'low', seed: o.seed || 1, ...o,
  };
}
