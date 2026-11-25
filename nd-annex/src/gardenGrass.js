// 870 (TJ 9:27 PM): low bed of light, airy ornamental grasses at the base of the Garden Patio board wall that
// holds the seascape (cormorant-over-puget-sound, centre (-24.707, 14.264), 2.286 x 1.524 m, centre y 1.55 ->
// frame bottom ~0.79 m). Tallest blades reach ~0.82 m (just over the frame's bottom edge), never the picture.
// One InstancedMesh (single draw call), no lights, no shadows, no collider; gentle wind in the vertex shader.
export function plantPatioGrass(THREE, scene) {
  if (scene.getObjectByName('patioGrass870')) return null;
  const C = [-24.707, 14.264], N = [0.866, -0.5], A = [0.5, 0.866]; // painting centre, wall normal (into patio), along-wall
  const LEN = 3.3, DEPTH = 0.55, FRAME_BOTTOM = 0.788, COUNT = 1500;
  // tapered, slightly arched blade: 5 segments, base width 1, tip 0 (unit height; scaled per instance)
  const seg = 5, pos = [], col = [], uv = [], idx = [];
  for (let i = 0; i <= seg; i++) { const v = i / seg, w = 0.5 * (1 - v * 0.92), bend = 0.18 * v * v;
    pos.push(-w, v, bend, w, v, bend); uv.push(0, v, 1, v);
    const g = [0.42 + 0.5 * v, 0.55 + 0.33 * v, 0.28 + 0.42 * v]; col.push(...g, ...g); }
  for (let i = 0; i < seg; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const uT = { value: 0 };
  mat.onBeforeCompile = sh => { sh.uniforms.uGrassT = uT;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uGrassT;').replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
  { float ph = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 2.3; float k = uv.y * uv.y; transformed.x += sin(uGrassT * 1.6 + ph) * 0.09 * k; transformed.z += sin(uGrassT * 1.1 + ph * 0.7) * 0.05 * k; }
#endif`); };
  mat.customProgramCacheKey = () => 'patioGrass870';
  const mesh = new THREE.InstancedMesh(geo, mat, COUNT); mesh.name = 'patioGrass870'; mesh.castShadow = false; mesh.receiveShadow = false;
  let seed = 870; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3(), tint = new THREE.Color();
  for (let i = 0; i < COUNT; i++) {
    const t = (rnd() - 0.5) * LEN, d = 0.06 + Math.pow(rnd(), 1.4) * DEPTH; // denser toward the board
    const ends = Math.min(1, (LEN / 2 - Math.abs(t)) / 0.45);            // taper at the bed ends
    const back = 1 - (d - 0.06) / DEPTH;                                  // taller at the back
    let h = (0.32 + 0.5 * back * (0.55 + 0.45 * rnd())) * (0.55 + 0.45 * ends);
    h = Math.min(h, FRAME_BOTTOM + 0.035 + 0.02 * rnd());                 // overlap the frame bottom slightly, no more
    P.set(C[0] + A[0] * t + N[0] * d, 0, C[1] + A[1] * t + N[1] * d);
    E.set((rnd() - 0.5) * 0.5, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.5); Q.setFromEuler(E);
    S.set(0.018 + 0.012 * rnd(), h, 0.018 + 0.012 * rnd());
    M.compose(P, Q, S); mesh.setMatrixAt(i, M);
    tint.setHSL(0.13 + 0.05 * rnd(), 0.35 + 0.2 * rnd(), 0.72 + 0.15 * rnd()); mesh.setColorAt(i, tint);
  }
  mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  if (mesh.computeBoundingSphere) mesh.computeBoundingSphere(); else mesh.frustumCulled = false;
  scene.add(mesh);
  const t0 = performance.now(); mesh.onBeforeRender = () => { uT.value = (performance.now() - t0) / 1000; };
  return mesh;
}
