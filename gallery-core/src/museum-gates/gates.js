// museum-gates: a small side hall of slipgates linking the museum versions (TJ's five galleries + Chase Toole's Montreal).
// installGates(ctx) finds a plain stretch of wall with nothing behind it (outside the building), opens a doorway in it, builds a
// small room behind and hangs one swirling gate per other museum, each showing a hazy view of that museum's entrance with a label.
// Walk into a gate, or click / tap it: hyperspace tunnel + whoosh (~1.9 s), then the browser goes to that museum. Self-contained: needs only three.
import * as THREE from 'three';
import { ENTRANCE } from './entrances.js';
import { tunnel } from './tunnel.js';
import { FIRST_TEX } from './prefetch-tex.js';
export const MUSEUMS = [
  { id: 'play', url: '/play/', frame: '/play/g/play/', label: 'TJM Gallery', sub: 'tjm.art/play' },
  { id: 'orsay', url: '/play/orsay/', frame: '/play/g/orsay/', label: "Musée d'Orsay", sub: 'Paris' },
  { id: 'bilbao', url: '/play/bilbao/', frame: '/play/g/bilbao/', label: 'Guggenheim Bilbao', sub: 'Bilbao' },
  { id: 'uffizi', url: '/play/uffizi/', frame: '/play/g/uffizi/', label: 'Uffizi', sub: 'Florence' },
  { id: 'gugg-ny', url: '/play/gugg-ny/', frame: '/play/g/gugg-ny/', label: 'Guggenheim New York', sub: 'New York' },
  { id: 'montreal', url: 'https://chase-toole-site-7b3.pages.dev/play-montreal/', label: 'Montreal — Chase Toole', sub: 'MBAM' },
];
// future dungeon gates: dormant arches until each gets a url
// #211: the 'Portal' arch is open now: it is the gate into TJ's Living Room (/play/home/, the scanned room). A dungeon slot with a url is a
// live gate (walk in / click / tap, prefetch, shell swap); the room's own slipgate brings you back here with ?via=home, in front of this arch.
export const DUNGEONS = [{ id: 'halo', label: 'Halo' }, { id: 'farcry', label: 'Far Cry' }, { id: 'myst', label: 'Myst' },
  { id: 'home', label: "TJ's Living Room", sub: 'a scanned room · walk in', url: '/play/home/', frame: '/play/g/home/', was: 'portal' }, { id: 'skyrim', label: 'Skyrim' }];
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const DIM = { RW: 6.4, RD: 4.2, RHt: 3.0, OW: 2.0, OH: 2.5 };
// UVs of a replacement wall piece in the original box's texture space, so the cut wall looks untouched (as museum-eggs' secret room)
function remapUV(piece, orig) {
  const p = orig.geometry.parameters, w = p.width, h = p.height, d = p.depth, o = orig.position, g = piece.geometry, pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i) + piece.position.x - o.x, y = pos.getY(i) + piece.position.y - o.y, z = pos.getZ(i) + piece.position.z - o.z, nx = nor.getX(i), ny = nor.getY(i);
    let u, v; if (nx > 0.5) { u = (-z + d / 2) / d; v = (y + h / 2) / h; } else if (nx < -0.5) { u = (z + d / 2) / d; v = (y + h / 2) / h; }
    else if (ny > 0.5) { u = (x + w / 2) / w; v = 1 - (z + d / 2) / d; } else if (ny < -0.5) { u = (x + w / 2) / w; v = (z + d / 2) / d; }
    else if (nor.getZ(i) > 0.5) { u = (x + w / 2) / w; v = (y + h / 2) / h; } else { u = (-x + w / 2) / w; v = (y + h / 2) / h; }
    uv.setXY(i, u, v); }
  uv.needsUpdate = true;
}
function labelTex(title, sub) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#16121e'; x.fillRect(0, 0, 512, 128); x.strokeStyle = '#c9a85a'; x.lineWidth = 6; x.strokeRect(5, 5, 502, 118);
  x.fillStyle = '#f1dfa8'; x.textAlign = 'center'; x.textBaseline = 'middle'; let fs = 46; x.font = `bold ${fs}px Georgia, serif`; while (x.measureText(title).width > 470 && fs > 22) { fs -= 2; x.font = `bold ${fs}px Georgia, serif`; }
  x.fillText(title, 256, sub ? 52 : 64); if (sub) { x.fillStyle = '#b9a6d8'; x.font = 'italic 26px Georgia, serif'; x.fillText(sub, 256, 98); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const gateVS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }';
const gateFS = `varying vec2 vUv; uniform sampler2D uMap; uniform float uTime, uHot, uAspect, uMix, uDim; uniform vec3 uTint;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
  void main(){
    vec2 p = vec2((vUv.x - .5) * uAspect, vUv.y); float r = uAspect * .5;
    if (p.y > 1. - r && length(p - vec2(0., 1. - r)) > r) discard;                       // round top
    // slow liquid ripple (no swirl): the surface wobbles like a heat shimmer
    vec2 q = vUv + .010 * vec2(sin(vUv.y * 26. + uTime * 2.7) + .6 * sin(vUv.y * 61. - uTime * 4.1), sin(vUv.x * 19. - uTime * 2.2));
    float haze = n(p * 5. + vec2(uTime * .15, -uTime * .9)) * .6 + n(p * 13. + vec2(-uTime * .6, uTime * 1.7)) * .4;
    float st = h(floor(vUv * vec2(70., 120.)) + floor(uTime * 20.) * 1.37);                // coarse flickering static
    vec3 img = texture2D(uMap, clamp(q, .002, .998)).rgb;
    vec3 base = mix(uTint * .45, uTint * 1.35 + .12, haze);
    vec3 col = mix(base, img * .85 + uTint * .22, uMix * (.5 + .25 * haze));
    col += (st - .5) * .2 + vec3(.75, .8, 1.) * pow(haze, 7.) * .9;                        // static grain + bright motes
    col *= .93 + .07 * sin(uTime * 57. + vUv.y * 340.);                                     // faint scan flicker
    float edge = smoothstep(0., .06, min(min(p.x + r, r - p.x), p.y));
    col = col * (1. - uDim) + vec3(.08, .07, .1) * uDim + (st - .5) * .05 * uDim;
    col *= 1. + uHot * .8;
    gl_FragColor = vec4(col, (.95 * edge + .05) * (1. - .3 * uDim)); }`;
let AC = null;
// original synthesized teleport: a bright falling "zap" (detuned saws through a closing low-pass), a rushing noise whoosh with a
// resonant sweep, and a short metallic echo tail. Quiet; silent when muted. No samples.
function whoosh(muted) { if (muted) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const a = AC, t = a.currentTime; if (a.state === 'suspended') a.resume();
  const out = a.createGain(); out.gain.value = 0.2; const dl = a.createDelay(0.5), fb = a.createGain(); dl.delayTime.value = 0.11; fb.gain.value = 0.32; out.connect(a.destination); out.connect(dl); dl.connect(fb).connect(dl); dl.connect(a.destination);
  const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(5200, t); lp.frequency.exponentialRampToValueAtTime(260, t + 0.55); lp.Q.value = 6;
  const zg = a.createGain(); zg.gain.setValueAtTime(0.0001, t); zg.gain.linearRampToValueAtTime(0.5, t + 0.012); zg.gain.exponentialRampToValueAtTime(0.001, t + 0.6); lp.connect(zg).connect(out);
  for (const d of [-9, 0, 11]) { const o = a.createOscillator(); o.type = 'sawtooth'; o.detune.value = d * 10; o.frequency.setValueAtTime(1180, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.5); o.connect(lp); o.start(t); o.stop(t + 0.62); }
  const len = 1.3, buf = a.createBuffer(1, Math.floor(a.sampleRate * len), a.sampleRate), dd = buf.getChannelData(0); for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1;
  const ns = a.createBufferSource(); ns.buffer = buf; const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 4; bp.frequency.setValueAtTime(380, t); bp.frequency.exponentialRampToValueAtTime(3400, t + 0.35); bp.frequency.exponentialRampToValueAtTime(500, t + 1.2);
  const ng = a.createGain(); ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(0.55, t + 0.06); ng.gain.exponentialRampToValueAtTime(0.001, t + len); ns.connect(bp).connect(ng).connect(out); ns.start(t);
  const ring = a.createOscillator(), rg = a.createGain(); ring.type = 'triangle'; ring.frequency.setValueAtTime(1760, t + 0.02); ring.frequency.exponentialRampToValueAtTime(1320, t + 0.9); rg.gain.setValueAtTime(0.0001, t); rg.gain.linearRampToValueAtTime(0.05, t + 0.03); rg.gain.exponentialRampToValueAtTime(0.0005, t + 0.9);
  ring.connect(rg).connect(out); ring.start(t); ring.stop(t + 0.95); setTimeout(() => { try { out.disconnect(); dl.disconnect(); fb.disconnect(); } catch (e) {} }, 2600); } catch (e) {} }

export function installGates(ctx) {
  const scene = ctx.scene, camera = ctx.camera, canvas = ctx.canvas || document.querySelector('canvas'), here = ctx.here;
  const walkable = ctx.walkable, avoid = ctx.avoid || [], start = ctx.start || camera.position.clone(); let D = { ...DIM, ...(ctx.dims || {}) };
  const SIZES0 = [D, { ...D, RW: 4.6, RD: 3.6, OW: 1.8 }, { ...D, RW: 4.6, RD: 3.6, OW: 1.6, OH: 2.4 }, { ...D, RW: 4.6, RD: 2.2, OW: 1.6, OH: 2.4, slack: 0.25 }];
  // first pass keeps well away from the gallery's own gates; if no wall is free, a stretch right beside one is allowed (never overlapping it)
  const SIZES = [...SIZES0.map(z => ({ ...z, near: 0 })), ...SIZES0.slice(1).map(z => ({ ...z, near: 1 }))];
  const dests = (ctx.museums || MUSEUMS).filter(m => m.id !== here);
  scene.updateMatrixWorld(true);
  // ---- every visible mesh's world box once (for "is anything in the way" tests)
  const boxes = [], big = []; scene.traverse(o => { if (!o.isMesh || o.visible === false) return; let vis = true; for (let p = o.parent; p; p = p.parent) if (p.visible === false) vis = false; if (!vis) return;
    const b = new THREE.Box3().setFromObject(o); if (b.isEmpty()) return; const s = b.getSize(V()); if (s.x > 150 || s.z > 150 || s.y > 80) return;
    if (s.x * s.z > 600 && o.geometry && o.geometry.type !== 'PlaneGeometry') { big.push(o); return; } boxes.push({ o, b, s }); }); // big = merged batches: probed by rays instead
  let hall = null, tried = 0, walls = []; const why = {}; const no = k => { why[k] = (why[k] || 0) + 1; };
  const hit = (reg, skip) => boxes.some(q => q.o !== skip && q.b.intersectsBox(reg) && q.b.max.y > 0.26 && q.s.y > 0.02);
  // ---- preferred layout: replace the hyperspace-realm slipgate (ctx.realm) with a short hallway into a gate room that holds it
  if (ctx.realm) hall = findRealm();
  function findRealm() { const G = ctx.realm; if (!G || !G.pos || !G.n) return null;
    const n = V(G.n.x, 0, G.n.z).normalize(), t = V(n.z, 0, -n.x), alongX = Math.abs(n.z) > 0.5; let best = null;
    for (const { o, b, s } of boxes) { if (!o.geometry || o.geometry.type !== 'BoxGeometry' || o.parent !== scene || Math.abs(o.rotation.y) > 1e-6 || b.min.y > 0.06 || s.y < 3.0) continue;
      const th = alongX ? s.z : s.x; if (th > 0.8) continue; const face = alongX ? (n.z > 0 ? b.max.z : b.min.z) : (n.x > 0 ? b.max.x : b.min.x);
      if (Math.abs(face - (alongX ? G.pos.z : G.pos.x)) > 0.25) continue; const a = alongX ? G.pos.x : G.pos.z, a0 = alongX ? b.min.x : b.min.z, a1 = alongX ? b.max.x : b.max.z;
      if (a - 1.45 < a0 || a + 1.45 > a1) continue; best = { m: o, b, along: alongX ? 'x' : 'z', T: th, pos: alongX ? V(a, 0, face) : V(face, 0, a) }; break; }
    if (!best) { no('realm: no plain wall behind the gate'); return null; }
    const c = { ...best, n, t }, P2 = (u, d, y = 0) => c.pos.clone().addScaledVector(t, u).addScaledVector(n, -d).setY(y), HW = 2.4, HL = ctx.hallLen || 2.4, T = c.T;
    const free = (u0, u1, d0, d1) => { for (let u = u0; u <= u1 + 1e-6; u += 0.4) for (let d = d0; d <= d1 + 1e-6; d += 0.4) { const q = P2(u, d); if (walkable(q.x, q.z)) return false; }
      if (hit(new THREE.Box3().setFromPoints([P2(u0, d0, 0.05), P2(u1, d1, 4.4)]), c.m)) return false;
      if (big.length) { const rc = new THREE.Raycaster(); for (const y of [0.4, 1.4, 2.4, 3.4, 4.2]) { // merged geometry: rays across the region, both ways
        for (let d = d0; d <= d1 + 1e-6; d += 0.8) { rc.set(P2(u0, d, y), t.clone()); rc.far = u1 - u0; if (rc.intersectObjects(big, false).length) return false; }
        for (let u = u0; u <= u1 + 1e-6; u += 0.8) { rc.set(P2(u, d0, y), n.clone().negate()); rc.far = d1 - d0; if (rc.intersectObjects(big, false).length) return false; } } }
      return true; };
    if (!free(-HW / 2 - 0.3, HW / 2 + 0.3, T + 0.05, T + HL + 0.2)) { no('realm: hallway blocked'); return null; }
    for (const [RW, RD] of [[9.6, 6], [8.2, 5.6]]) for (const off of [0, 1, -1, 2, -2, 3, -3]) {
      if (free(off - RW / 2 - 0.3, off + RW / 2 + 0.3, T + HL + 0.2, T + HL + 0.2 + RD + 0.4)) return { ...c, mode: 'realm', RW, RD, HL, HW, off };
      no('realm: room blocked'); }
    return null; }
  let voidTried = false;
  for (const DD of (hall ? [] : SIZES)) { D = DD;
    if (DD.near && !voidTried) { voidTried = true; const v = ctx.voids !== false ? findVoid() : null; if (v) { hall = v; break; } }
  walls = boxes.filter(({ o, b, s }) => o.geometry && o.geometry.type === 'BoxGeometry' && o.parent === scene && Math.abs(o.rotation.y) < 1e-6 && !(o.material && o.material.transparent)
      && b.min.y < 0.06 && s.y >= D.RHt + 0.3 && Math.min(s.x, s.z) <= 0.7 && Math.max(s.x, s.z) >= D.OW + 1.8);
    const pr = (ctx.paintings || []).map(q => { const d = q.data || q; return { x: d.x, z: d.z, ix: d.ix ?? d.nx ?? 0, iz: d.iz ?? d.nz ?? 0, w: q.w || d.w || 1 }; }).filter(q => isFinite(q.x) && isFinite(q.z));
    const cands = [];
    for (const { o: m, b } of walls) { const along = (b.max.x - b.min.x) > (b.max.z - b.min.z) ? 'x' : 'z', T = along === 'x' ? b.max.z - b.min.z : b.max.x - b.min.x;
      const a0 = along === 'x' ? b.min.x : b.min.z, a1 = along === 'x' ? b.max.x : b.max.z, c0 = along === 'x' ? (b.min.z + b.max.z) / 2 : (b.min.x + b.max.x) / 2;
      for (const sg of [1, -1]) { const n = along === 'x' ? V(0, 0, sg) : V(sg, 0, 0), t = V(n.z, 0, -n.x);
        for (let a = a0 + D.OW / 2 + 0.9; a <= a1 - D.OW / 2 - 0.9; a += 0.2) { const pos = along === 'x' ? V(a, 0, c0 + sg * T / 2) : V(c0 + sg * T / 2, 0, a);
          cands.push({ m, b, along, T, a0, a1, n, t, pos, d: Math.hypot(pos.x - start.x, pos.z - start.z) }); } } }
    cands.sort((p, q) => p.d - q.d);
    const P = (c, u, d, y = 0) => c.pos.clone().addScaledVector(c.t, u).addScaledVector(c.n, d).setY(y);
    const regBox = (c, u0, u1, d0, d1, y0, y1) => new THREE.Box3().setFromPoints([P(c, u0, d0, y0), P(c, u1, d1, y1)]);
    for (const c of cands) { tried++;
      if (c.d < (D.near ? 3.5 : (ctx.minStart || 8)) || avoid.some(q => Math.hypot(c.pos.x - q.x, c.pos.z - q.z) < (D.near ? (q.rMin || 2.4) : (q.r || 5)))) { no('near start/gate'); continue; }
      let ok = true; // the floor in front of the opening is open gallery floor
      for (let u = -D.OW / 2 - 0.4; u <= D.OW / 2 + 0.4 && ok; u += 0.4) for (const d of [0.7, 1.3, 2.0]) { const q = P(c, u, d); if (!walkable(q.x, q.z)) { ok = false; break; } }
      if (!ok) { no('front not walkable'); continue; }
      // no painting (even one drawn by another mesh) hangs on this stretch, on either face of the wall
      // (on the gallery face only the doorway + its sign need clear wall; on the far face, the whole room)
      const FW = D.OW / 2 + 0.2;
      if (pr.some(q => { const dn = (q.x - c.pos.x) * c.n.x + (q.z - c.pos.z) * c.n.z, du = Math.abs((q.x - c.pos.x) * c.t.x + (q.z - c.pos.z) * c.t.z), f = q.ix * c.n.x + q.iz * c.n.z;
        if (Math.abs(f) < 0.9) return false; if (f > 0) return Math.abs(dn) < 0.6 && du < FW + q.w / 2; return dn < 0.2 && dn > -c.T - 0.6 && du < D.RW / 2 + 0.4 + q.w / 2; })) { no('painting'); continue; }
      if (ctx.nearDoor) { for (let u = -D.RW / 2 - 0.5; u <= D.RW / 2 + 0.5; u += 0.5) { const q = P(c, u, 0.8); if (ctx.nearDoor(q.x, q.z, 0.6)) { ok = false; break; } } if (!ok) { no('doorway'); continue; } }
      // nothing on or in front of this stretch of wall (paintings, labels, signs, benches, eggs...): 0.8 m deep, full room width, up to the sign
      if (hit(regBox(c, -FW, FW, 0.02, 0.8, 0.3, D.RHt + 0.3), c.m)) { no('object in front'); continue; }
      // behind the wall: outside the building (not walkable) and empty
      for (let u = -D.RW / 2 - 0.3; u <= D.RW / 2 + 0.3 && ok; u += 0.4) for (let d = c.T + 0.05; d <= c.T + D.RD + (D.slack || 0.4); d += 0.4) { const q = P(c, u, -d); if (walkable(q.x, q.z)) { ok = false; break; } }
      if (!ok) { no('walkable behind'); continue; }
      if (hit(regBox(c, -D.RW / 2 - 0.3, D.RW / 2 + 0.3, -c.T - 0.02, -c.T - D.RD - (D.slack || 0.4), 0.05, D.RHt + 0.3), c.m)) { no('object behind'); continue; }
      hall = c; break; }
  if (hall) break; }
  // ---- no free wall: look for an empty, unwalkable side space that opens off a passage (the dead-end gap between double walls
  // beside a doorway): its mouth borders walkable floor along its whole width, walls bound both long sides, nothing stands inside
  function findVoid() {
    const G = 0.25; let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9;
    for (const { b, s } of boxes) if (s.y > 2) { bx0 = Math.min(bx0, b.min.x); bx1 = Math.max(bx1, b.max.x); bz0 = Math.min(bz0, b.min.z); bz1 = Math.max(bz1, b.max.z); }
    const NX = Math.ceil((bx1 - bx0) / G) + 1, NZ = Math.ceil((bz1 - bz0) / G) + 1; if (!(NX > 0 && NZ > 0) || NX * NZ > 900000) return null;
    const occ = new Uint8Array(NX * NZ), wk = new Uint8Array(NX * NZ);
    for (const { b, s } of boxes) { if (b.max.y < 0.3 || b.min.y > 2.8 || s.y < 0.02 || (s.x > 60 && s.z > 60)) continue;
      for (let i = Math.max(0, Math.floor((b.min.x - bx0) / G)); i <= Math.min(NX - 1, Math.floor((b.max.x - bx0) / G)); i++) for (let j = Math.max(0, Math.floor((b.min.z - bz0) / G)); j <= Math.min(NZ - 1, Math.floor((b.max.z - bz0) / G)); j++) occ[j * NX + i] = 1; }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) wk[j * NX + i] = walkable(bx0 + (i + 0.5) * G, bz0 + (j + 0.5) * G) ? 1 : 0;
    const K = (x, z) => { const i = Math.floor((x - bx0) / G), j = Math.floor((z - bz0) / G); return i < 0 || j < 0 || i >= NX || j >= NZ ? -1 : j * NX + i; };
    const E = (x, z) => { const k = K(x, z); return k >= 0 && !occ[k] && !wk[k]; }, O = (x, z) => { const k = K(x, z); return k < 0 || occ[k] === 1; }, Wk = (x, z) => { const k = K(x, z); return k >= 0 && wk[k] === 1; };
    const found = [], seen = new Set();
    for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = V(nx, 0, nz), n = ni.clone().negate(), t = V(n.z, 0, -n.x);
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { if (!wk[j * NX + i]) continue; const cx = bx0 + (i + 0.5) * G, cz = bz0 + (j + 0.5) * G;
        if (!E(cx + nx * G, cz + nz * G)) continue; const m0 = V(cx + nx * G / 2, 0, cz + nz * G / 2); // a point on the mouth line
        const ok = (u) => { const q = m0.clone().addScaledVector(t, u); return Wk(q.x - nx * G / 2, q.z - nz * G / 2) && E(q.x + nx * G / 2, q.z + nz * G / 2); };
        let ua = 0, ub = 0; while (ua > -6 && ok(ua - G)) ua -= G; while (ub < 6 && ok(ub + G)) ub += G;
        const key = nx + ',' + nz + ',' + (m0.clone().addScaledVector(t, ua).x).toFixed(2) + ',' + (m0.clone().addScaledVector(t, ua).z).toFixed(2); if (seen.has(key)) continue; seen.add(key);
        const mw = ub - ua + G; if (mw < 2.2 || mw > 4.5) continue;
        const mc = m0.clone().addScaledVector(t, (ua + ub) / 2), RW = mw - 0.1;
        let dv = 0.2; const across = d => { for (let u = -RW / 2 + 0.1; u <= RW / 2 - 0.1 + 1e-6; u += G) { const q = mc.clone().addScaledVector(t, u).addScaledVector(ni, d); if (!E(q.x, q.z)) return false; } return true; };
        while (dv < 8 && across(dv + G)) dv += G; if (dv < 4.0) continue; const RD = Math.min(6, dv - 0.15);
        let wall = 0, tot = 0; for (let d = 0.5; d <= RD; d += 0.5) for (const sg of [-1, 1]) { tot++; const q = mc.clone().addScaledVector(t, sg * (RW / 2 + 0.2)).addScaledVector(ni, d); if (O(q.x, q.z)) wall++; }
        if (wall < tot * 0.7) continue;
        let pass = 0; for (let u = -RW / 2 + 0.3; u <= RW / 2 - 0.3; u += 0.4) { const q = mc.clone().addScaledVector(t, u).addScaledVector(ni, -0.8); if (Wk(q.x, q.z)) pass++; } if (!pass) continue;
        const d0 = Math.hypot(mc.x - start.x, mc.z - start.z); if (d0 < 3.5 || avoid.some(q => Math.hypot(mc.x - q.x, mc.z - q.z) < (q.rMin || 2.4) + 1)) continue;
        found.push({ mode: 'void', n, t, pos: mc, T: 0, RW, RD, d: d0 }); } }
    found.sort((a, b) => a.d - b.d); window.__gatesVoids = found.length; return found[0] || null;
  }
  if (!hall) { console.warn('[gates] no free wall for the slipgate hall'); window.gates = { hall: null, tried, why, walls: walls.length, gates: [], dests }; return window.gates; }
  const REALM = hall.mode === 'realm'; if (REALM) D = { ...D, RW: hall.RW, RD: hall.RD, OW: hall.HW, OH: 2.7, RHt: 4.3 };
  const VOID = hall.mode === 'void'; if (VOID) D = { ...D, RW: hall.RW, RD: hall.RD, OW: hall.RW, OH: 2.6, RHt: 3.1 };
  const { m, n, t, T, along, pos } = hall, y0 = VOID ? 0 : m.position.y - m.geometry.parameters.height / 2;
  const grp = new THREE.Group(); grp.name = 'museum-gates'; scene.add(grp);
  const pieces = [];
  if (!VOID) { const H = m.geometry.parameters.height, aC = along === 'x' ? pos.x : pos.z, mc = m.position;
  // ---- cut the doorway: hide the wall box and rebuild it around the opening (same material, same texture mapping)
  m.visible = false; m.raycast = () => {}; m.userData.gatesReplaced = 1;
  const L = along === 'x' ? m.geometry.parameters.width : m.geometry.parameters.depth, wa0 = (along === 'x' ? mc.x : mc.z) - L / 2, wa1 = wa0 + L, lo = aC - D.OW / 2, hi = aC + D.OW / 2;
  const piece = (s0, s1, ya, yb) => { if (s1 - s0 < 0.005 || yb - ya < 0.005) return; const th = along === 'x' ? m.geometry.parameters.depth : m.geometry.parameters.width;
    const g = new THREE.BoxGeometry(along === 'x' ? s1 - s0 : th, yb - ya, along === 'x' ? th : s1 - s0), me = new THREE.Mesh(g, m.material); const mid = (s0 + s1) / 2;
    me.position.set(along === 'x' ? mid : mc.x, y0 + (ya + yb) / 2, along === 'x' ? mc.z : mid); me.castShadow = me.receiveShadow = true; remapUV(me, m); me.name = 'gates-wall'; scene.add(me); pieces.push(me); };
  piece(wa0, lo, 0, H); piece(hi, wa1, 0, H); piece(lo, hi, D.OH, H); }
  // ---- the room behind
  const back = pos.clone().addScaledVector(n, -T); const W = (u, d, y = 0) => back.clone().addScaledVector(t, u).addScaledVector(n, -d).setY(y0 + y);
  const ax = Math.abs(t.x) > 0.5, roomMat = new THREE.MeshLambertMaterial({ color: 0x3a3346 }), trimMat = new THREE.MeshLambertMaterial({ color: 0x8c7a52 });
  const rbox = (w, h, d, at, mat = roomMat) => { const me = new THREE.Mesh(new THREE.BoxGeometry(ax ? w : d, h, ax ? d : w), mat); me.position.copy(at); me.name = 'gates-wall'; scene.add(me); pieces.push(me); return me; };
  const { RW, RD, RHt } = D;
  const floorMat = new THREE.MeshLambertMaterial({ color: 0x241f2c }), glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.3, 2.2) });
  const floorAt = (u0, u1, d0, d1) => { const fm = new THREE.Mesh(new THREE.PlaneGeometry(u1 - u0, d1 - d0), floorMat); fm.rotation.x = -Math.PI / 2; if (!ax) fm.rotation.z = Math.PI / 2; fm.position.copy(W((u0 + u1) / 2, (d0 + d1) / 2, 0.006)); grp.add(fm); };
  const stripAt = (u, d, len, alongU, y) => { const sm = new THREE.Mesh(new THREE.BoxGeometry((ax === alongU) ? len : 0.06, 0.03, (ax === alongU) ? 0.06 : len), glow); sm.position.copy(W(u, d, y)); grp.add(sm); };
  let R0 = 0, R1 = RD, OFF = 0;
  if (REALM) { const HW = hall.HW, HL = hall.HL; OFF = hall.off; R0 = HL + 0.2; R1 = R0 + RD; const L0 = OFF - RW / 2 - 0.2, L1 = OFF + RW / 2 + 0.2, OH = D.OH;
    rbox(0.2, OH + 0.12, HL + 0.2, W(-HW / 2 - 0.1, (HL + 0.2) / 2, (OH + 0.12) / 2)); rbox(0.2, OH + 0.12, HL + 0.2, W(HW / 2 + 0.1, (HL + 0.2) / 2, (OH + 0.12) / 2)); rbox(HW + 0.4, 0.12, HL + 0.2, W(0, (HL + 0.2) / 2, OH + 0.06)); // hallway
    const seg = (ua, ub, h0, h1) => { if (ub - ua > 0.01) rbox(ub - ua, h1 - h0, 0.2, W((ua + ub) / 2, HL + 0.1, (h0 + h1) / 2)); };
    seg(L0, -HW / 2 - 0.2, 0, RHt); seg(HW / 2 + 0.2, L1, 0, RHt); seg(-HW / 2 - 0.2, HW / 2 + 0.2, OH + 0.12, RHt); // room front wall, open to the hallway
    rbox(0.2, RHt, RD + 0.4, W(L0 + 0.1, (R0 + R1) / 2, RHt / 2)); rbox(0.2, RHt, RD + 0.4, W(L1 - 0.1, (R0 + R1) / 2, RHt / 2)); rbox(RW + 0.4, RHt, 0.2, W(OFF, R1 + 0.1, RHt / 2));
    rbox(RW + 0.4, 0.12, RD + 0.4, W(OFF, (R0 + R1) / 2, RHt + 0.06)); floorAt(-HW / 2, HW / 2, 0, R0); floorAt(OFF - RW / 2, OFF + RW / 2, R0, R1);
    stripAt(0, HL / 2, HL, false, OH - 0.02); stripAt(OFF, R0 + RD * 0.3, RW - 1, true, RHt - 0.02); stripAt(OFF, R0 + RD * 0.7, RW - 1, true, RHt - 0.02);
    // the realm slipgate itself moves to the middle of the back wall, facing the hallway (same object, so the walk-in trip and the elves' drag follow it)
    const G = ctx.realm, gp = W(OFF, R1); if (ctx.moveRealm) ctx.moveRealm(gp, n.clone()); else { G.pos.copy(gp); const g = G.mesh && G.mesh.parent; if (g) { g.position.copy(gp).addScaledVector(n, 0.04); g.rotation.y = Math.atan2(n.x, n.z); g.updateMatrixWorld(true); } }
    if (G.mesh && ctx.restyleRealm !== false) { G.mesh.material = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, toneMapped: false, vertexShader: gateVS, fragmentShader: gateFS,
      uniforms: { uMap: { value: new THREE.DataTexture(new Uint8Array([60, 40, 120, 255]), 1, 1) }, uTime: { value: 0 }, uHot: { value: 0 }, uAspect: { value: (G.w || 1.5) / (G.h || 2.6) }, uMix: { value: 0 }, uDim: { value: 0 }, uTint: { value: new THREE.Color(0.55, 0.32, 0.95) } } });
      G.mesh.material.uniforms.uMap.value.needsUpdate = true; }
  } else {
  if (!VOID) { rbox(0.2, RHt, RD + 0.2, W(-RW / 2 - 0.1, RD / 2 + 0.1, RHt / 2)); rbox(0.2, RHt, RD + 0.2, W(RW / 2 + 0.1, RD / 2 + 0.1, RHt / 2)); }
    rbox(RW + (VOID ? 0 : 0.4), RHt, 0.2, W(0, RD + 0.1, RHt / 2));
    if (VOID) rbox(RW, RHt - D.OH + 0.12, 0.25, W(0, 0.125, (D.OH + RHt + 0.12) / 2), trimMat); // fascia over the mouth, carries the sign
    rbox(RW + (VOID ? 0 : 0.4), 0.12, RD + 0.2, W(0, RD / 2 + 0.1, RHt + 0.06)); // ceiling
    // the passage through the gallery wall above the opening is the wall's own lintel; a little trim frames it on the gallery side
    { const fm = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), new THREE.MeshLambertMaterial({ color: 0x241f2c })); fm.rotation.x = -Math.PI / 2; fm.position.copy(W(0, RD / 2, 0.006)); if (!ax) fm.rotation.z = Math.PI / 2; grp.add(fm); }
    const strip = new THREE.Mesh(new THREE.BoxGeometry(ax ? RW - 0.4 : 0.06, 0.03, ax ? 0.06 : RW - 0.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.3, 2.2) })); strip.position.copy(W(0, RD / 2, RHt - 0.02)); grp.add(strip);
  }
  { const sg = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(1.9, D.OW + (VOID ? -0.3 : 0.1)), Math.min(1.9, D.OW + (VOID ? -0.3 : 0.1)) * 0.22), new THREE.MeshBasicMaterial({ map: labelTex('SLIPGATES', REALM ? 'hyperspace realm · other museums' : 'to the other museums'), toneMapped: false }));
    const at = pos.clone().addScaledVector(n, 0.03); at.y = y0 + D.OH + (VOID ? 0.25 : 0.3); sg.position.copy(at); sg.rotation.y = Math.atan2(n.x, n.z); sg.name = 'gates-sign'; grp.add(sg); }
  // ---- the gates: three on the back wall, one on each side wall
  const gw0 = Math.min(1.3, (RW - 0.6) / 3 - 0.35), su = gw0 + 0.85, sd = Math.max(RD - 1.55, RD / 2 + 0.1);
  const gwR = RW >= 9 ? 1.2 : 1.0, k1 = 1.25 + 0.1 + gwR / 2 + 0.16, k2 = k1 + gwR + 0.55, side = f => [0.78, 0.5, 0.22].map(r => ({ u: f === 'left' ? OFF - RW / 2 : OFF + RW / 2, d: R0 + RD * r, f, gw: 1.05 }));
  const realmSlots = REALM ? [{ u: OFF - k1, d: R1, f: 'back', gw: gwR }, { u: OFF + k1, d: R1, f: 'back', gw: gwR }, { u: OFF - k2, d: R1, f: 'back', gw: gwR }, { u: OFF + k2, d: R1, f: 'back', gw: gwR }, ...side('left'), ...side('right')] : null;
  const slots = REALM ? realmSlots : VOID ? [{ u: 0, d: RD, f: 'back', gw: Math.min(1.2, RW - 0.9) }, { u: -RW / 2, d: RD - 1.0, f: 'left', gw: 1.0 }, { u: RW / 2, d: RD - 1.0, f: 'right', gw: 1.0 }, { u: -RW / 2, d: RD - 2.45, f: 'left', gw: 1.0 }, { u: RW / 2, d: RD - 2.45, f: 'right', gw: 1.0 }]
    : [{ u: -su, d: RD, f: 'back' }, { u: 0, d: RD, f: 'back' }, { u: su, d: RD, f: 'back' }, { u: -RW / 2, d: sd, f: 'left' }, { u: RW / 2, d: sd, f: 'right' }];
  const order = REALM ? [0, 1, 2, 3, 4] : VOID ? [0, 1, 2, 3, 4] : [1, 0, 2, 3, 4], gh = 2.3, gates = [];
  dests.slice(0, 5).forEach((dst, k) => { const s = slots[order[k]], gw = s.gw || gw0;
    const inward = s.f === 'back' ? n.clone() : s.f === 'left' ? t.clone() : t.clone().negate(); // gate faces into the room
    const face = W(s.u, s.d, 0).addScaledVector(inward, 0.06); const g = new THREE.Group(); g.position.copy(face); g.rotation.y = Math.atan2(inward.x, inward.z); grp.add(g);
    const tex = new THREE.TextureLoader().load(ENTRANCE[dst.id] || ''); tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, toneMapped: false, uniforms: { uMap: { value: tex }, uTime: { value: k * 3.1 }, uHot: { value: 0 }, uAspect: { value: gw / gh }, uMix: { value: 0.78 }, uDim: { value: 0 }, uTint: { value: new THREE.Color(0.42, 0.3, 0.85) } }, vertexShader: gateVS, fragmentShader: gateFS });
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), mat); pm.position.y = gh / 2; pm.name = 'gate:' + dst.id; g.add(pm);
    const fr = new THREE.MeshLambertMaterial({ color: 0x6d6378 }); const post = (x) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, gh + 0.2, 0.18), fr); b.position.set(x, (gh + 0.2) / 2, 0.02); g.add(b); };
    post(-gw / 2 - 0.08); post(gw / 2 + 0.08); { const l = new THREE.Mesh(new THREE.BoxGeometry(gw + 0.5, 0.18, 0.22), trimMat); l.position.set(0, gh + 0.25, 0.03); g.add(l); }
    { const st = new THREE.Mesh(new THREE.BoxGeometry(gw + 0.4, 0.08, 0.5), trimMat); st.position.set(0, 0.04, 0.2); g.add(st); }
    const lb = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.35), new THREE.MeshBasicMaterial({ map: labelTex(dst.label, dst.sub), toneMapped: false })); lb.position.set(0, gh + 0.55, 0.15); g.add(lb);
    const centre = face.clone(); centre.y = y0 + 1.2;
    gates.push({ ...dst, group: g, mesh: pm, mat, face, inward, centre, gw }); });
  const dormant = [];
  if (REALM) (ctx.dungeons || DUNGEONS).slice(0, realmSlots.length - 5).forEach((dg, k) => { const sl = realmSlots[5 + k], gw = sl.gw, inward = sl.f === 'left' ? t.clone() : t.clone().negate();
    const face = W(sl.u, sl.d, 0).addScaledVector(inward, 0.06), g = new THREE.Group(); g.position.copy(face); g.rotation.y = Math.atan2(inward.x, inward.z); grp.add(g);
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, toneMapped: false, vertexShader: gateVS, fragmentShader: gateFS, uniforms: { uMap: { value: new THREE.DataTexture(new Uint8Array([20, 18, 26, 255]), 1, 1) }, uTime: { value: k }, uHot: { value: 0 }, uAspect: { value: gw / gh }, uMix: { value: 0 }, uDim: { value: 0.82 }, uTint: { value: new THREE.Color(0.3, 0.28, 0.36) } } });
    if (dg.url) { const tex = new THREE.TextureLoader().load(ENTRANCE[dg.id] || ''); tex.colorSpace = THREE.SRGBColorSpace; // #211: an open dungeon gate (warm, like the room's own slipgate)
      Object.assign(mat.uniforms, { uMap: { value: tex }, uMix: { value: ENTRANCE[dg.id] ? 0.7 : 0 }, uDim: { value: 0 }, uTint: { value: new THREE.Color(0.78, 0.58, 0.4) } }); }
    else mat.uniforms.uMap.value.needsUpdate = true; const pm = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), mat); pm.position.y = gh / 2; pm.name = (dg.url ? 'gate:' : 'dormant:') + dg.id; g.add(pm);
    const fr = new THREE.MeshLambertMaterial({ color: 0x4d4756 }); for (const x of [-gw / 2 - 0.08, gw / 2 + 0.08]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, gh + 0.2, 0.18), fr); b.position.set(x, (gh + 0.2) / 2, 0.02); g.add(b); }
    { const l = new THREE.Mesh(new THREE.BoxGeometry(gw + 0.5, 0.18, 0.22), trimMat); l.position.set(0, gh + 0.25, 0.03); g.add(l); }
    const lb = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.35), new THREE.MeshBasicMaterial({ map: labelTex(dg.label, dg.url ? dg.sub : 'dungeon · coming soon'), toneMapped: false, transparent: true, opacity: dg.url ? 1 : 0.7 })); lb.position.set(0, gh + 0.55, 0.15); g.add(lb);
    if (dg.url) { const centre = face.clone(); centre.y = y0 + 1.2; gates.push({ ...dg, group: g, mesh: pm, mat, face, inward, centre, gw, dungeon: true }); return; }
    dormant.push({ ...dg, group: g, mat }); });
  // ---- walkable: the room (with a margin) and the passage through the wall
  const rect = (u0, u1, d0, d1) => { const p1 = W(u0, d0), p2 = W(u1, d1); return { minX: Math.min(p1.x, p2.x), maxX: Math.max(p1.x, p2.x), minZ: Math.min(p1.z, p2.z), maxZ: Math.max(p1.z, p2.z), y: y0 }; };
  const rects = REALM ? [rect(-hall.HW / 2 + 0.35, hall.HW / 2 - 0.35, -T - 0.5, R0 + 0.5), rect(OFF - RW / 2 + 0.35, OFF + RW / 2 - 0.35, R0 + 0.35, R1 - 0.4)] : VOID ? [rect(-RW / 2 + 0.35, RW / 2 - 0.35, -0.3, RD - 0.4)] : [rect(-RW / 2 + 0.35, RW / 2 - 0.35, 0.35, RD - 0.4), rect(-D.OW / 2 + 0.35, D.OW / 2 - 0.35, -T - 0.4, 0.5)];
  if (ctx.addWalkRect) rects.forEach(r => ctx.addWalkRect(r));
  // ---- leaving through a gate
  let leaving = false;
  const go = ctx.navigate || (u => location.assign(u));
  const navUrl = gt => gt.url + (gt.url.includes('?') ? '&' : '?') + 'via=' + encodeURIComponent(here);
  function leave(gt, how = 'walk') { if (leaving || !gt) return; leaving = true; window.__gateLeft = { id: gt.id, url: navUrl(gt), how }; console.info('[jump] museum gate', gt.id, how); console.info('[jump] museum gate', gt.id, how); console.info('[jump] museum gate', gt.id, how); console.info('[jump] museum gate', gt.id, how); console.info('[jump] museum gate', gt.id, how);
    prefetch(gt, true); gt.mat.uniforms.uHot.value = 1; whoosh(ctx.isMuted && ctx.isMuted());
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
    // 2026-10-18: navigate the instant the gate is touched; the short tunnel (~400 ms) plays while the next page loads
    const ms = ctx.delay || 400, tn = tunnel({ dir: 'in', ms, text: 'SLIPGATE → ' + gt.label.toUpperCase() }); window.__gateLeftT = performance.now();
    (window.__gatesNav || go)(navUrl(gt));
    addEventListener('pageshow', e => { if (e.persisted) { tn.kill(); leaving = false; gt.mat.uniforms.uHot.value = 0; } }); }
  // ---- prefetch: the destination page (speculation rules + rel=prefetch), then its JS/CSS bundles and first textures, once, in idle time
  const phone = matchMedia('(pointer:coarse)').matches || innerWidth < 760, fetched = new Set();
  const addLink = (href, as, cors) => { if (document.head.querySelector('link[rel=prefetch][href="' + href + '"]')) return; const l = document.createElement('link'); l.rel = 'prefetch'; l.href = href; if (as) l.as = as; if (cors) l.crossOrigin = 'anonymous'; document.head.appendChild(l); };
  function prefetch(gt, now, room) { if (fetched.has(gt.id) || (phone && fetched.size >= 2 && !now && !room)) return; fetched.add(gt.id);
    const run = async () => { const u = navUrl(gt);
      if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) { const sr = document.createElement('script'); sr.type = 'speculationrules'; sr.textContent = JSON.stringify({ prefetch: [{ source: 'list', urls: [u], eagerness: 'immediate' }] }); document.head.appendChild(sr); }
      addLink(u, 'document'); addLink(gt.url, 'document'); // rel=prefetch for the page too (works where speculation rules don't)
      if (now) return; let html = '';
      try { const r = await fetch(gt.frame || gt.url, { mode: 'cors', credentials: 'omit' }); if (r.ok) html = await r.text(); } catch (e) {}
      const seen = new Set(); for (const m of html.matchAll(/<(script|link)\b[^>]*?(?:src|href)="([^"]+\.(js|css))"[^>]*>/g)) { const href = new URL(m[2], new URL(gt.frame || gt.url, location.href)).href; if (seen.has(href) || !/\/assets\//.test(href)) continue; seen.add(href); addLink(href, m[3] === 'js' ? 'script' : 'style', /crossorigin/.test(m[0])); }
      (FIRST_TEX[gt.id] || []).slice(0, phone ? 0 : 4).forEach(t => addLink(t, 'image', true));
      window.__gatesPrefetched = [...fetched]; };
    if (room || now) run(); else (window.requestIdleCallback || (f => setTimeout(f, 300)))(run, { timeout: 2000 }); }
  // click (pointer locked: the crosshair; otherwise the cursor) or tap a gate within 8 m
  const ray = new THREE.Raycaster(); ray.far = 8;
  const pick = (cx, cy) => { const ndc = cx == null ? new THREE.Vector2(0, 0) : new THREE.Vector2(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); camera.updateMatrixWorld(); ray.setFromCamera(ndc, camera);
    const hs = ray.intersectObjects([...gates.map(g => g.mesh), ...pieces], false); return hs.length && hs[0].object.name.startsWith('gate:') ? gates.find(g => g.mesh === hs[0].object) : null; };
  addEventListener('mousedown', e => { if (leaving || e.button !== 0) return; if (!document.pointerLockElement && !(e.target && e.target.tagName === 'CANVAS')) return; /* a click on the start screen / UI never fires a gate behind it */ const gt = document.pointerLockElement ? pick() : pick(e.clientX, e.clientY); if (gt) { e.stopImmediatePropagation(); e.preventDefault(); leave(gt, 'click'); } }, true);
  let tp = null; addEventListener('touchstart', e => { tp = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now() } : null; }, { capture: true, passive: true });
  addEventListener('touchend', e => { if (!tp || leaving) return; const c = e.changedTouches[0]; if (performance.now() - tp.t < 350 && Math.hypot(c.clientX - tp.x, c.clientY - tp.y) < 14) { const gt = pick(c.clientX, c.clientY); if (gt) leave(gt, 'tap'); } tp = null; }, { capture: true, passive: true });
  // per frame: swirl, distance culling, walk-in trigger
  let last = performance.now(), T0 = 0;
  const tick = () => { requestAnimationFrame(tick); const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; T0 += dt;
    const c = camera.position, far = Math.hypot(c.x - pos.x, c.z - pos.z) > 45; grp.visible = !far; if (far) return;
    const inRoom = rects.some(r => c.x > r.minX - 0.4 && c.x < r.maxX + 0.4 && c.z > r.minZ - 0.4 && c.z < r.maxZ + 0.4);
    if (!leaving) { let best = null, bd = 8; for (const g of gates) { const dd = Math.hypot(c.x - g.face.x, c.z - g.face.z); if (dd < bd) { bd = dd; best = g; } if (inRoom) prefetch(g, false, true); } if (best) prefetch(best); }
    for (const g of dormant) g.mat.uniforms.uTime.value += dt; if (REALM && ctx.realm.mesh && ctx.realm.mesh.material.uniforms && ctx.realm.mesh.material.uniforms.uMix) ctx.realm.mesh.material.uniforms.uTime.value += dt;
    for (const g of gates) { g.mat.uniforms.uTime.value += dt; if (leaving || (ctx.isBusy && ctx.isBusy())) continue;
      const dx = c.x - g.face.x, dz = c.z - g.face.z, out = dx * g.inward.x + dz * g.inward.z, lat = Math.abs(dx * g.inward.z - dz * g.inward.x);
      if (out < 0.62 && out > -0.5 && lat < g.gw / 2 && Math.abs(c.y - (y0 + 1.6)) < 1.2) leave(g, 'walk'); } };
  tick();
  const api = { why, size: D, mode: REALM ? 'realm' : VOID ? 'void' : 'wall', dormant, realm: REALM ? ctx.realm : null, hall: { pos: pos.clone(), n: n.clone(), t: t.clone(), T, y0 }, gates, dests, rects, pieces, group: grp, tried, leave, get leaving() { return leaving; },
    inside: W(OFF, (R0 + R1) / 2, 0), front: pos.clone().addScaledVector(n, 2.2).setY(y0), insideView: { from: W(OFF, R0 + 0.4, 1.6), to: W(OFF, R1, 1.5) },
    view(i = -1) { const s = i < 0 ? api.front : gates[i].face.clone().addScaledVector(gates[i].inward, 2.2); const look = i < 0 ? W(OFF, R1, 1.5) : gates[i].centre; return { from: s, to: look }; } };
  // #211: back from an open dungeon gate's room (?via=home): stand 1.6 m in front of that gate, facing away from it, so there is no dead end
  { let via = window.__gatesVia || null; try { via = via || new URLSearchParams(location.search).get('via'); } catch (e) {} /* the arrival script (index.html) strips ?via early and keeps it in __gatesVia */ const gt = via && gates.find(g => g.dungeon && g.id === via);
    if (gt) { const at = gt.face.clone().addScaledVector(gt.inward, 1.6), look = at.clone().addScaledVector(gt.inward, 1); const put = () => { camera.position.set(at.x, y0 + (ctx.eye || 1.62), at.z); camera.lookAt(look.x, y0 + (ctx.eye || 1.62), look.z); };
      put(); requestAnimationFrame(put); setTimeout(put, 300); api.arrived = { id: gt.id, at: at.clone() }; window.__gatesArrived = api.arrived; } }
  window.gates = api; return api;
}
