// #251 garden: domed, columned ceilings with a ring of clerestory windows for every gallery room.
// Original procedural design (TJ Murphy gallery). All rooms share 3 merged meshes: stone, glass, light shafts.
import { TAU, bake, merge, M, fp, tierOf } from './util.js';

const STONE = 0xe9dfcc, CORNICE = 0xd8cbb2, COFFER = 0xcdbd9f, COFFER_IN = 0xb9a888, BRONZE = 0x5b4a33, PIER = 0xe2d6bf;

// Per-triangle tint so the dome reads as coffered (rows x columns), without extra geometry.
function coffer(THREE, g, cx, cy, cz, rows, cols) {
  const p = g.attributes.position.array, c = g.attributes.color.array, a = new THREE.Color(COFFER), b = new THREE.Color(COFFER_IN);
  for (let i = 0; i < p.length; i += 9) {
    const x = (p[i] + p[i + 3] + p[i + 6]) / 3 - cx, y = (p[i + 1] + p[i + 4] + p[i + 7]) / 3 - cy, z = (p[i + 2] + p[i + 5] + p[i + 8]) / 3 - cz;
    const lat = Math.atan2(y, Math.hypot(x, z)), lon = Math.atan2(z, x) + Math.PI;
    const inner = Math.floor(lat / (Math.PI / 2) * rows * 2) % 2 === 1 && Math.floor(lon / TAU * cols * 2) % 2 === 1;
    const col = inner ? b : a; for (let v = 0; v < 3; v++) c.set([col.r, col.g, col.b], i + v * 3);
  }
  return g;
}

export function buildDomes(tags) {
  const { THREE } = tags, tier = tierOf(tags), low = tier === 'low';
  const group = new THREE.Group(); group.name = 'garden-domes';
  const stone = [], glass = [], shafts = [], colliders = [], skipped = [];
  const high = tier === 'high', seg = low ? 24 : high ? 96 : 40, N = low ? 12 : 16; // #276: smooth high-segment domes on the high tier
  const box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(1, 1, 1, low ? 8 : high ? 32 : 16), plane = new THREE.PlaneGeometry(1, 1);
  for (const r of tags.rooms.filter(r => r.kind === 'room')) {
    const [cx, cz] = r.center, H = r.wallH || 4.2, rd = r.apothem * 0.74, Dh = 1.7, top = H + Dh, add = (g, m, col) => stone.push(bake(THREE, g, m, col));
    // 1. ceiling slab: hexagon (just past the wall line) with a round opening for the drum
    const sh = new THREE.Shape(); r.poly.forEach(([x, z], i) => { const px = (x - cx) * 1.03, pz = -(z - cz) * 1.03; i ? sh.lineTo(px, pz) : sh.moveTo(px, pz); });
    const hole = new THREE.Path(); hole.absarc(0, 0, rd, 0, TAU, true); sh.holes.push(hole);
    const slab = new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: false, curveSegments: seg / 4 }); slab.rotateX(-Math.PI / 2);
    add(slab, M(THREE, { x: cx, y: H - 0.04, z: cz }), STONE); slab.dispose();
    // 2. drum: moulded sill and lintel rings (lathe profiles), piers with engaged columns, framed clerestory windows
    const ring = (y0, prof, col) => { const g = new THREE.LatheGeometry(prof.map(([dr, dy]) => new THREE.Vector2(rd + dr, dy)), seg); add(g, M(THREE, { x: cx, y: y0, z: cz }), col); g.dispose(); };
    ring(H + 0.18, [[0.45, 0], [0.45, 0.12], [0.3, 0.2], [0.3, 0.32], [-0.12, 0.32], [-0.12, 0], [0.45, 0]], CORNICE);
    ring(top - 0.3, [[0.4, 0], [0.4, 0.3], [-0.2, 0.3], [-0.2, 0.18], [-0.08, 0.1], [-0.08, 0], [0.4, 0]], CORNICE);
    const pw = Math.max(0.32, TAU * rd / N * 0.28), wy0 = H + 0.5, wy1 = top - 0.3, wh = wy1 - wy0, gapW = 2 * (rd + 0.1) * Math.sin(Math.PI / N) - pw;
    for (let i = 0; i < N; i++) {
      const ap = (i + 0.5) / N * TAU, aw = i / N * TAU, px = Math.cos(ap), pz = Math.sin(ap), wx = Math.cos(aw), wz = Math.sin(aw);
      // pier and its engaged column (base, shaft, capital) on the inner face: the "columns under the dome ring"
      add(box, M(THREE, { x: cx + px * (rd + 0.12), y: (wy0 + wy1) / 2, z: cz + pz * (rd + 0.12), ry: -ap, sx: 0.4, sy: wh, sz: pw }), PIER);
      const ccx = cx + px * (rd - 0.16), ccz = cz + pz * (rd - 0.16);
      add(cyl, M(THREE, { x: ccx, y: wy0 + 0.05, z: ccz, sx: 0.15, sy: 0.1, sz: 0.15 }), CORNICE);
      add(cyl, M(THREE, { x: ccx, y: (wy0 + wy1) / 2, z: ccz, sx: 0.1, sy: wh - 0.2, sz: 0.1 }), STONE);
      add(box, M(THREE, { x: ccx, y: wy1 - 0.07, z: ccz, ry: -ap, sx: 0.26, sy: 0.14, sz: 0.26 }), CORNICE);
      // window: glass pane, bronze frame (head, sill, jambs), centre mullion and transom
      const gx = cx + wx * (rd + 0.1), gz = cz + wz * (rd + 0.1), ry = -aw + Math.PI / 2, fr = (u, y, w, h) => add(box, M(THREE, { x: gx - wz * u, y, z: gz + wx * u, ry, sx: w, sy: h, sz: 0.07 }), BRONZE);
      glass.push(bake(THREE, plane, M(THREE, { x: gx, y: wy0 + wh / 2, z: gz, ry, sx: gapW, sy: wh }), 0xfff3d6));
      fr(0, wy1 - 0.03, gapW, 0.06); fr(0, wy0 + 0.03, gapW, 0.06); fr(gapW / 2 - 0.03, wy0 + wh / 2, 0.06, wh); fr(-gapW / 2 + 0.03, wy0 + wh / 2, 0.06, wh);
      fr(0, wy0 + wh / 2, 0.04, wh); fr(0, wy0 + wh * 0.62, gapW, 0.04);
      // daylight shaft: a soft additive quad slanting from the window down into the room, stopping well above the art
      if (!low) {
        const q = new THREE.BufferGeometry(), inX = -wx, inZ = -wz, tx = -wz * gapW / 2, tz = wx * gapW / 2, d = 1.6, dy = 1.4;
        const P = [gx - tx, wy1, gz - tz, gx + tx, wy1, gz + tz, gx + tx + inX * d, wy0 - dy, gz + tz + inZ * d, gx - tx, wy1, gz - tz, gx + tx + inX * d, wy0 - dy, gz + tz + inZ * d, gx - tx + inX * d, wy0 - dy, gz - tz + inZ * d];
        q.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); q.computeVertexNormals();
        const C = []; for (const y of [1, 1, 0, 1, 0, 0]) C.push(y, y * 0.96, y * 0.86); q.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); shafts.push(q);
      }
    }
    // 3. dome: coffered hemisphere (slightly raised) with an oculus and its ring
    const dome = new THREE.SphereGeometry(rd + 0.1, seg, low ? 8 : high ? 40 : 16, 0, TAU, 0.16, Math.PI / 2 - 0.16);
    const dg = bake(THREE, dome, M(THREE, { x: cx, y: top, z: cz, sy: 0.82 }), COFFER); coffer(THREE, dg, cx, top, cz, 5, N); stone.push(dg); dome.dispose();
    const oc = new THREE.TorusGeometry((rd + 0.1) * Math.sin(0.16), 0.09, 6, seg); add(oc, M(THREE, { x: cx, y: top + (rd + 0.1) * 0.82 * Math.cos(0.16), z: cz, rx: Math.PI / 2 }), CORNICE); oc.dispose();
    glass.push(bake(THREE, new THREE.CircleGeometry((rd + 0.1) * Math.sin(0.16), 16), M(THREE, { x: cx, y: top + (rd + 0.1) * 0.82 - 0.02, z: cz, rx: Math.PI / 2 }), 0xfff8e4));
    // 4. wall columns: full-height engaged columns tucked into the hex corners, only where keepClear() allows
    r.poly.forEach(([vx, vz], k) => {
      const dx = cx - vx, dz = cz - vz, L = Math.hypot(dx, dz), x = vx + dx / L * 0.3, z = vz + dz / L * 0.3, R = 0.2;
      if (!tags.keepClear(x, z, R)) { skipped.push({ room: r.id, k }); return; }
      add(cyl, M(THREE, { x, y: 0.09, z, sx: 0.24, sy: 0.18, sz: 0.24 }), CORNICE);
      add(cyl, M(THREE, { x, y: H / 2, z, sx: 0.15, sy: H - 0.4, sz: 0.15 }), STONE);
      add(box, M(THREE, { x, y: H - 0.15, z, ry: Math.atan2(dx, dz), sx: 0.4, sy: 0.22, sz: 0.4 }), CORNICE);
      const c = fp(x, z, R, 'dome-column', `${r.id}/corner${k}`, 0, H); colliders.push(c); tags.addCollider?.({ x: c.x, z: c.z, r: c.r, kind: c.kind });
    });
  }
  const stoneMesh = new THREE.Mesh(merge(THREE, stone), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide, emissive: 0x4a4236 }) /* bounced daylight from the clerestory */);
  const glassMesh = new THREE.Mesh(merge(THREE, glass), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.92 }));
  stoneMesh.name = 'domes-stone'; glassMesh.name = 'domes-glass'; group.add(stoneMesh, glassMesh);
  if (shafts.length) { const g = merge(THREE, shafts), m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.name = 'domes-daylight'; m.renderOrder = 2; group.add(m); }
  // daylight: one shadowless warm sun from above for medium/high; low tier relies on the bright glass and existing lights
  if (!low) { const sun = new THREE.DirectionalLight(0xfff1d8, 0.55); sun.position.set(20, 60, 10); sun.name = 'domes-daylight-sun'; group.add(sun, sun.target); }
  box.dispose(); cyl.dispose(); plane.dispose();
  return { group, colliders, skipped };
}
