// #289 (TJ): micro duck robot guide. An original procedural design (no outside model): a pearl-white shell body, a round head
// with a soft orange visor-beak, two cyan LED eyes, a brass lens on the crown (the hologram projector), little orange webbed feet
// that paddle, and a body that waddles side to side as it moves. It skins the shared guide drone (its own rotor meshes are hidden),
// so every drone behaviour (tow, cart delivery, guide chat) still works. LOD: phones get fewer segments and no point light.
import * as THREE from 'three';
export function skinDuck(D, low) {
  if (!D || D.__duck) return D && D.__duck;
  const seg = low ? 10 : 22, root = D.root, old = root.children.slice(); for (const c of old) c.visible = false;
  const g = new THREE.Group(); g.name = 'duckBot'; root.add(g);
  const shell = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.35, metalness: 0.15 }), orange = new THREE.MeshStandardMaterial({ color: 0xf08a24, roughness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x23272e, roughness: 0.4, metalness: 0.5 }), led = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 2.2, 2.6), toneMapped: false });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a14a, roughness: 0.3, metalness: 0.9 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.13, seg, seg), shell); body.scale.set(1, 0.78, 1.3); body.position.set(0, -0.03, 0); g.add(body);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.07, seg), shell); tail.rotation.x = -2.0; tail.position.set(0, 0.03, -0.165); g.add(tail);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.128, 0.008, 6, seg * 2), dark); band.rotation.x = Math.PI / 2; band.scale.set(1, 1.3, 1); band.position.y = -0.04; g.add(band);
  for (const sd of [-1, 1]) { const w = new THREE.Mesh(new THREE.SphereGeometry(0.07, seg, 8), shell); w.scale.set(0.35, 0.7, 1.2); w.position.set(sd * 0.125, -0.02, -0.01); w.name = 'wing'; g.add(w); }
  const head = new THREE.Group(); head.position.set(0, 0.06, 0.1); g.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.075, seg, seg), shell));
  const beak = new THREE.Mesh(new THREE.SphereGeometry(0.045, seg, 8), orange); beak.scale.set(1.15, 0.45, 1.2); beak.position.set(0, -0.012, 0.075); head.add(beak);
  for (const sd of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), led); e.position.set(sd * 0.034, 0.02, 0.062); head.add(e); }
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.02, seg), brass); lens.position.y = 0.075; head.add(lens);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.017, seg), led); glass.rotation.x = -Math.PI / 2; glass.position.y = 0.086; head.add(glass);
  const feet = []; for (const sd of [-1, 1]) { const leg = new THREE.Group(); leg.position.set(sd * 0.05, -0.11, 0.01); g.add(leg);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.04, 6), dark); shin.position.y = -0.02; leg.add(shin);
    const foot = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.06, 3), orange); foot.rotation.x = Math.PI / 2; foot.scale.set(1, 1, 0.25); foot.position.set(0, -0.042, 0.02); leg.add(foot); feet.push(leg); }
  if (!low) { const pl = new THREE.PointLight(0x7fe8ff, 0.25, 1.2); pl.position.set(0, 0.1, 0.15); g.add(pl); }
  const last = root.position.clone(); let t = 0, sp = 0;
  const duck = { g, update(dt) { if (!dt) return; const p = root.position, v = Math.hypot(p.x - last.x, p.z - last.z) / dt; last.copy(p); sp += (Math.min(v, 3) - sp) * Math.min(1, dt * 6);
      t += dt * (4 + sp * 5); const a = Math.min(1, sp / 1.2); g.rotation.z = Math.sin(t) * 0.18 * a; g.position.y = Math.abs(Math.sin(t)) * 0.012 * a + Math.sin(t * 0.3) * 0.004;
      feet[0].rotation.x = Math.sin(t) * 0.7 * a; feet[1].rotation.x = -Math.sin(t) * 0.7 * a; head.rotation.y = Math.sin(t * 0.37) * 0.25 * (1 - a); } };
  D.__duck = duck; window.__duckBot = { skinned: true, low: !!low, meshes: 0 }; g.traverse(o => { if (o.isMesh) window.__duckBot.meshes++; }); return duck;
}
