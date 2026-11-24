// #797 (TJ Oct 27 ~7:11 PM PT): START roadster reshaped as an ORIGINAL procedural white electric hypercar-roadster (inspired silhouette only;
// no third-party CAD/glTF, no badges/wordmarks). Behavior identical to #795 (copied verbatim below).
// #795 (TJ Oct 27 ~4:49 PM PT, ref gallery-tj-feedback/start-roadster-thrusters/): START roadster upgraded with thrusters.
// Original procedural design (no third-party assets/logos). Rear twin nozzles + 4 underbody jets. Trigger: player within 40 m who had the car
// behind them (forward·dir < 0) then turns to face it (forward·dir > 0.92, held 0.35 s) -> jets glow, smoke puffs, lift + arc away. One-shot per load.
// Decor only: no colliders, not raycast-pickable, outside the walkable poly. Audio synthesized; skipped when game.holo.muted.
import * as THREE from 'three';
export function installRoadster797(root, T) {
  const out = [], M = (c, r, m, e) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...(e ? { emissive: e, emissiveIntensity: 0 } : {}) });
  const steel = M(0x55595f, 0.35, 0.9);
  const box = new THREE.BoxGeometry(1, 1, 1), noz = new THREE.CylinderGeometry(0.17, 0.24, 0.42, 14, 1, true), plate = new THREE.CylinderGeometry(0.2, 0.2, 0.06, 12);
  const cars = [];
  for (const oc of T.openCourts || []) { const R = oc.roadster; if (!R) continue;
    const g = new THREE.Group(); g.name = 'roadster795'; g.userData.v = 797; g.position.set(R.x, 0, R.z); g.rotation.y = R.yaw || 0; root.add(g);
    const add = (geo, mat, sx, sy, sz, x, y, z, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.rotation.z = rz; g.add(m); return m; };
    // #797 body: one smooth extruded side profile (x = nose, y = up), widths tapered per vertex (tumblehome + pinched nose/tail)
    const prof = new THREE.Shape(); prof.moveTo(2.18, 0.30); prof.bezierCurveTo(2.26, 0.42, 2.2, 0.56, 1.95, 0.62); // low rounded nose
    prof.bezierCurveTo(1.3, 0.72, 0.75, 0.80, 0.42, 0.86);      // long sloping hood to windshield base
    prof.bezierCurveTo(0.05, 1.12, -0.45, 1.16, -0.85, 1.08);   // cabin crown (fastback)
    prof.bezierCurveTo(-1.45, 0.98, -1.9, 0.86, -2.12, 0.78);   // tapering tail deck
    prof.bezierCurveTo(-2.2, 0.66, -2.2, 0.42, -2.1, 0.30);     // kamm-cut rear face
    prof.lineTo(2.18, 0.30);
    const bodyGeo = new THREE.ExtrudeGeometry(prof, { depth: 1.5, bevelEnabled: true, bevelThickness: 0.22, bevelSize: 0.1, bevelSegments: 5, curveSegments: 18 });
    bodyGeo.translate(0, 0, -0.75); { const P = bodyGeo.attributes.position;
      for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); const end = Math.max(0, Math.abs(x) - 1.6) / 0.65, top = Math.max(0, y - 0.8) / 0.4;
        P.setZ(i, z * (1 - 0.18 * end * end - 0.32 * top * top)); } bodyGeo.computeVertexNormals(); }
    const white = new THREE.MeshPhysicalMaterial({ color: 0xf4f5f2, roughness: 0.22, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.06 });
    const tint = new THREE.MeshPhysicalMaterial({ color: 0x0b0f14, roughness: 0.04, metalness: 0.6, clearcoat: 1, transparent: true, opacity: 0.92 });
    const lamp = new THREE.MeshStandardMaterial({ color: 0xeef6ff, emissive: 0xdfeeff, emissiveIntensity: 1.2, roughness: 0.2 });
    const tail = new THREE.MeshStandardMaterial({ color: 0x400008, emissive: 0xff1a2a, emissiveIntensity: 1.4, roughness: 0.3 });
    const satin = M(0x16181b, 0.55, 0.4);
    const bodyM = new THREE.Mesh(bodyGeo, white); g.add(bodyM);
    // glass canopy: wraparound windshield + roof panel, slightly proud of the white crown
    const gl = new THREE.Shape(); gl.moveTo(0.48, 0.9); gl.bezierCurveTo(0.12, 1.17, -0.45, 1.22, -0.95, 1.12); gl.lineTo(-0.8, 1.02); gl.bezierCurveTo(-0.4, 1.08, 0.05, 1.05, 0.38, 0.86); gl.lineTo(0.48, 0.9);
    const glGeo = new THREE.ExtrudeGeometry(gl, { depth: 1.0, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.04, bevelSegments: 3, curveSegments: 14 }); glGeo.translate(0, 0.02, -0.5); g.add(new THREE.Mesh(glGeo, tint));
    // side windows (dark, flush) + thin full-width light bars + dark lower aero (splitter, sills, diffuser)
    for (const s of [1, -1]) { add(box, tint, 1.05, 0.16, 0.02, -0.2, 0.98, s * 0.8, 0.05); add(box, satin, 3.1, 0.07, 0.04, 0.0, 0.36, s * 0.93); // sill
      add(box, lamp, 0.42, 0.035, 0.05, 2.0, 0.6, s * 0.52, -0.25); // slim headlamp blades
      add(box, satin, 0.34, 0.1, 0.05, 0.7, 0.52, s * 0.9); } // slim side scoop
    add(box, tail, 0.03, 0.04, 1.55, -2.36, 0.72, 0); // full-width tail light bar
    add(box, satin, 0.3, 0.04, 1.5, 2.1, 0.22, 0); // front splitter (tucked under nose)
    add(box, satin, 0.3, 0.2, 1.5, -2.25, 0.4, 0); // rear diffuser
    add(box, satin, 0.06, 0.04, 1.4, -2.05, 0.96, 0); // subtle ducktail spoiler lip
    add(box, steel, 0.55, 0.22, 1.1, -1.95, 0.55, 0); // thruster pod (tucked behind the license panel)
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x6fd8ff, transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending });
    const flameGeo = new THREE.ConeGeometry(0.2, 1.6, 12, 1, true); flameGeo.translate(0, -0.8, 0);
    const jets = [];
    for (const z of [0.38, -0.38]) { const n = new THREE.Mesh(noz, steel); n.rotation.z = Math.PI / 2; n.position.set(-2.3, 0.55, z); g.add(n);
      const p = new THREE.Mesh(plate, M(0x220000, 0.4, 0.2, 0x66e0ff)); p.rotation.z = Math.PI / 2; p.position.set(-2.17, 0.55, z); g.add(p);
      const f = new THREE.Mesh(flameGeo, glowMat); f.rotation.z = -Math.PI / 2; f.position.set(-2.5, 0.55, z); f.scale.set(1, 0.01, 1); g.add(f); jets.push({ p, f, dir: 'rear' }); }
    for (const [x, z] of [[0.9, 0.55], [0.9, -0.55], [-0.9, 0.55], [-0.9, -0.55]]) { const n = new THREE.Mesh(noz, steel); n.scale.set(0.6, 0.35, 0.6); n.position.set(x, 0.2, z); g.add(n);
      const p = new THREE.Mesh(plate, M(0x220000, 0.4, 0.2, 0x66e0ff)); p.scale.set(0.6, 1, 0.6); p.position.set(x, 0.25, z); g.add(p);
      const f = new THREE.Mesh(flameGeo, glowMat); f.scale.set(0.6, 0.01, 0.6); f.position.set(x, 0.12, z); g.add(f); jets.push({ p, f, dir: 'down' }); }
    // #797 big low-profile wheels: black tyres, dark aero turbine discs with bright lip
    const wheel = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 28), disc = new THREE.CylinderGeometry(0.29, 0.29, 0.31, 24), lip = new THREE.TorusGeometry(0.3, 0.018, 6, 28);
    const tyre = M(0x0d0d0e, 0.85, 0.05), aero = M(0x2a2d31, 0.35, 0.85), bright = M(0xd8dadd, 0.2, 1);
    for (const [x, z] of [[1.42, 0.8], [1.42, -0.8], [-1.38, 0.82], [-1.38, -0.82]]) { const w = new THREE.Mesh(wheel, tyre); w.rotation.x = Math.PI / 2; w.position.set(x, 0.38, z); g.add(w);
      const h = new THREE.Mesh(disc, aero); h.rotation.x = Math.PI / 2; h.position.set(x, 0.38, z); g.add(h);
      for (const s of [1, -1]) { const l = new THREE.Mesh(lip, bright); l.position.set(x, 0.38, z + s * 0.155); g.add(l); }
      for (let k = 0; k < 5; k++) { const v = new THREE.Mesh(box, bright); v.scale.set(0.24, 0.03, 0.32); v.rotation.x = 0; v.position.set(x, 0.38, z); v.rotation.set(Math.PI / 2, 0, 0); v.rotateY(k * Math.PI * 2 / 5); g.add(v); } }
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
