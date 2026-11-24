// #795 (TJ Oct 27 ~4:49 PM PT, ref gallery-tj-feedback/start-roadster-thrusters/): START roadster upgraded with thrusters.
// Original procedural design (no third-party assets/logos). Rear twin nozzles + 4 underbody jets. Trigger: player within 40 m who had the car
// behind them (forward·dir < 0) then turns to face it (forward·dir > 0.92, held 0.35 s) -> jets glow, smoke puffs, lift + arc away. One-shot per load.
// Decor only: no colliders, not raycast-pickable, outside the walkable poly. Audio synthesized; skipped when game.holo.muted.
import * as THREE from 'three';
export function installRoadster795(root, T) {
  const out = [], M = (c, r, m, e) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...(e ? { emissive: e, emissiveIntensity: 0 } : {}) });
  const red = M(0xb3121b, 0.3, 0.6), blk = M(0x141416, 0.5, 0.3), glass = M(0x1c2630, 0.1, 0.8), rim = M(0x9a9ea4, 0.3, 0.9), steel = M(0x55595f, 0.35, 0.9);
  const box = new THREE.BoxGeometry(1, 1, 1), noz = new THREE.CylinderGeometry(0.17, 0.24, 0.42, 14, 1, true), plate = new THREE.CylinderGeometry(0.2, 0.2, 0.06, 12);
  const cars = [];
  for (const oc of T.openCourts || []) { const R = oc.roadster; if (!R) continue;
    const g = new THREE.Group(); g.name = 'roadster795'; g.position.set(R.x, 0, R.z); g.rotation.y = R.yaw || 0; root.add(g);
    const add = (geo, mat, sx, sy, sz, x, y, z, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.rotation.z = rz; g.add(m); return m; };
    add(box, red, 3.9, 0.4, 1.78, 0, 0.48, 0); add(box, red, 1.35, 0.26, 1.7, 1.6, 0.42, 0, -0.17); add(box, red, 0.95, 0.32, 1.74, -1.55, 0.66, 0, 0.1);
    add(box, blk, 0.9, 0.12, 1.5, -0.25, 0.75, 0); add(box, glass, 0.08, 0.36, 1.5, 0.35, 0.92, 0, -0.75); add(box, blk, 0.3, 0.25, 1.4, -0.85, 0.85, 0);
    add(box, blk, 0.5, 0.06, 1.9, -2.05, 0.92, 0); add(box, blk, 0.06, 0.2, 0.06, -1.95, 0.8, 0.6); add(box, blk, 0.06, 0.2, 0.06, -1.95, 0.8, -0.6); // rear wing
    add(box, steel, 0.7, 0.3, 1.3, -1.85, 0.6, 0); // thruster pod
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x6fd8ff, transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending });
    const flameGeo = new THREE.ConeGeometry(0.2, 1.6, 12, 1, true); flameGeo.translate(0, -0.8, 0);
    const jets = [];
    for (const z of [0.38, -0.38]) { const n = new THREE.Mesh(noz, steel); n.rotation.z = Math.PI / 2; n.position.set(-2.25, 0.6, z); g.add(n);
      const p = new THREE.Mesh(plate, M(0x220000, 0.4, 0.2, 0x66e0ff)); p.rotation.z = Math.PI / 2; p.position.set(-2.12, 0.6, z); g.add(p);
      const f = new THREE.Mesh(flameGeo, glowMat); f.rotation.z = -Math.PI / 2; f.position.set(-2.45, 0.6, z); f.scale.set(1, 0.01, 1); g.add(f); jets.push({ p, f, dir: 'rear' }); }
    for (const [x, z] of [[0.9, 0.55], [0.9, -0.55], [-0.9, 0.55], [-0.9, -0.55]]) { const n = new THREE.Mesh(noz, steel); n.scale.set(0.6, 0.35, 0.6); n.position.set(x, 0.2, z); g.add(n);
      const p = new THREE.Mesh(plate, M(0x220000, 0.4, 0.2, 0x66e0ff)); p.scale.set(0.6, 1, 0.6); p.position.set(x, 0.25, z); g.add(p);
      const f = new THREE.Mesh(flameGeo, glowMat); f.scale.set(0.6, 0.01, 0.6); f.position.set(x, 0.12, z); g.add(f); jets.push({ p, f, dir: 'down' }); }
    const wheel = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 14), hub = new THREE.CylinderGeometry(0.2, 0.2, 0.27, 10);
    for (const [x, z] of [[1.3, 0.82], [1.3, -0.82], [-1.25, 0.82], [-1.25, -0.82]]) { const w = new THREE.Mesh(wheel, blk); w.rotation.x = Math.PI / 2; w.position.set(x, 0.34, z); g.add(w);
      const h = new THREE.Mesh(hub, rim); h.rotation.x = Math.PI / 2; h.position.set(x, 0.34, z); g.add(h); }
    g.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; m.userData.decor = true; m.raycast = () => {}; } });
    const puffs = []; const puffMat = new THREE.MeshBasicMaterial({ color: 0xcfd3d8, transparent: true, opacity: 0, depthWrite: false }), puffGeo = new THREE.SphereGeometry(0.35, 8, 6);
    for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(puffGeo, puffMat.clone()); s.visible = false; s.raycast = () => {}; root.add(s); puffs.push({ s, t: 9 }); }
    cars.push({ id: oc.id, g, jets, glowMat, puffs, x0: R.x, z0: R.z, yaw: R.yaw || 0, state: 'rest', t: 0, behind: false, hold: 0 });
    out.push({ id: oc.id, x: R.x, z: R.z, meshes: g.children.length }); }
  if (!cars.length) return out;
  const fwd = new THREE.Vector3(), to = new THREE.Vector3(); let last = performance.now();
  function sound() { try { const G = window.game; if (G && G.holo && G.holo.muted) return; const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
    const ac = sound.ac || (sound.ac = new A()); if (ac.state === 'suspended') ac.resume(); const n = ac.sampleRate * 3, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; const src = ac.createBufferSource(); src.buffer = b; const lp = ac.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(300, ac.currentTime); lp.frequency.linearRampToValueAtTime(1600, ac.currentTime + 0.8); lp.frequency.linearRampToValueAtTime(500, ac.currentTime + 3);
    const gn = ac.createGain(); gn.gain.setValueAtTime(0, ac.currentTime); gn.gain.linearRampToValueAtTime(0.18, ac.currentTime + 0.4); gn.gain.linearRampToValueAtTime(0, ac.currentTime + 3);
    src.connect(lp).connect(gn).connect(ac.destination); src.start(); } catch (e) {} }
  function setGlow(c, k) { c.glowMat.opacity = 0.85 * k; for (const j of c.jets) { j.p.material.emissiveIntensity = 3 * k; j.f.scale.y = Math.max(0.01, k * (0.8 + 0.2 * Math.random())); } }
  function tick() { const now = performance.now(), dt = Math.min(0.2, (now - last) / 1000); last = now; const cam = window.game && window.game.camera;
    for (const c of cars) { if (c.state === 'gone') continue;
      if (c.state === 'rest' && cam) { to.set(c.x0 - cam.position.x, 0, c.z0 - cam.position.z); const dist = to.length();
        if (dist < 40 && dist > 0.5) { to.divideScalar(dist); cam.getWorldDirection(fwd); fwd.y = 0; fwd.normalize(); const dot = fwd.dot(to);
          if (dot < 0) c.behind = true; if (c.behind && dot > 0.92) { if ((c.hold += dt) > 0.35) { c.state = 'ignite'; c.t = 0; sound(); } } else c.hold = 0; } else { c.hold = 0; } }
      else if (c.state !== 'rest') { c.t += dt; const t = c.t;
        if (c.state === 'ignite') { setGlow(c, Math.min(1, t / 0.8)); c.g.position.y = Math.sin(t * 40) * 0.02; if (t > 1) { c.state = 'fly'; c.t = 0; } }
        else { setGlow(c, 1); const u = t; const fx = Math.cos(c.yaw), fz = -Math.sin(c.yaw); // local +x (nose) in world, away from the fence
          const lift = Math.min(u, 1.5) * 1.5 + Math.max(0, u - 1.5) * 8 + u * u * 1.2, ahead = u * u * 6;
          c.g.position.set(c.x0 + fx * ahead, lift, c.z0 + fz * ahead); c.g.rotation.z = Math.min(0.35, u * 0.2);
          if (u > 7) { c.state = 'gone'; c.g.visible = false; for (const p of c.puffs) p.s.visible = false; } }
        for (const p of c.puffs) { p.t += dt; if (p.t > 1.6 && t < 4) { p.t = Math.random() * 0.3; p.s.position.copy(c.g.position).add(new THREE.Vector3(Math.random() - 0.5, 0.1, Math.random() - 0.5)); p.s.visible = true; }
          p.s.scale.setScalar(1 + p.t * 2); p.s.material.opacity = Math.max(0, 0.5 * (1 - p.t / 1.6)); } } }
    if (cars.some(c => c.state !== 'gone')) requestAnimationFrame(tick); }
  requestAnimationFrame(tick);
  out.state = () => cars.map(c => c.state); out.trigger = () => { for (const c of cars) if (c.state === 'rest') { c.state = 'ignite'; c.t = 0; sound(); } };
  return out;
}
