// Every 3rd swarm: floor erupts, a giant machine elf swallows you, ~18s in the hyperspace realm, white-out, back.
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
// arrival title card as you emerge into the Hyperspace Realm (DOM overlay, gone after 4.2 s)
function realmTitle() {
  try { const d = document.createElement('div'); d.id = 'realmtitle'; d.textContent = 'HYPERSPACE REALM'; document.body.appendChild(d); setTimeout(() => d.remove(), 4200); window.__realmTitleShown = (window.__realmTitleShown || 0) + 1; } catch (e) {}
}
const clamp01 = x => Math.min(1, Math.max(0, x));
const ease = x => { x = clamp01(x); return x * x * (3 - 2 * x); };
const T = { erupt: 3.5, engulf: 5.2, world: 5.2 + 18, white: 5.2 + 18 + 1.6 };
const FRAGS = ['THEY ARE SO HAPPY TO SEE YOU', 'YOU HAVE BEEN HERE BEFORE', 'LOOK AT WHAT THEY ARE SHOWING YOU', 'IT IS ALL LANGUAGE', 'THE PAINTINGS ARE WINDOWS', 'DO NOT TRY TO REMEMBER THIS'];

const kaleido = (extra = '') => new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 } }, side: THREE.BackSide, depthWrite: false,
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `uniform float uTime; varying vec2 vUv;
    vec3 hsv(float h,float s,float v){ vec3 k=clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.); return v*mix(vec3(1.),k,s); }
    void main(){
      vec2 p = vec2(vUv.x*6.2832, vUv.y*40. - uTime*6.);           // around + along the tunnel
      float a = abs(mod(p.x*3., 2.0944) - 1.0472);                  // kaleidoscope folds
      vec2 q = vec2(cos(a), sin(a)) * (2. + sin(p.y*0.5));
      float f = 0.;
      for (int i = 0; i < 4; i++) { q = abs(q) / dot(q, q) - 0.9 + 0.1*sin(uTime*0.3); f += length(q); }   // little fractal fold
      float m = sin(p.y*2. + f*2. + uTime*2.) * 0.5 + 0.5;
      float hex = step(0.85, fract(f*1.7 + p.y*0.25));
      vec3 c = hsv(fract(f*0.12 + p.y*0.03 + uTime*0.1), 0.85, 0.35 + 0.65*m) + hex*vec3(1.,.9,.6);
      gl_FragColor = vec4(floor(c*8.)/8., 1.); }`,
});

export function createChaos({ scene, camera, renderer, makeElf, animateElf, elfUniforms, say, canvas, floorY }) {
  const fade = document.createElement('div');
  Object.assign(fade.style, { position: 'fixed', inset: '0', pointerEvents: 'none', opacity: '0', background: '#fff', zIndex: 5 });
  document.body.appendChild(fade);
  let st = null;

  // ---- eruption props (built lazily) ----
  const crackTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    x.strokeStyle = '#ffb030'; x.lineCap = 'round';
    for (let i = 0; i < 14; i++) { let px = 64, py = 64, a = i / 14 * 6.283; x.lineWidth = 5; x.beginPath(); x.moveTo(px, py);
      for (let k = 0; k < 6; k++) { a += (Math.random() - 0.5) * 0.9; px += Math.cos(a) * 11; py += Math.sin(a) * 11; x.lineTo(px, py); x.lineWidth = Math.max(1, 5 - k); } x.stroke(); }
    const g = x.createRadialGradient(64, 64, 2, 64, 64, 30); g.addColorStop(0, 'rgba(255,240,160,1)'); g.addColorStop(1, 'rgba(255,90,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; return t; })();
  const chunkGeo = new THREE.BoxGeometry(0.25, 0.18, 0.22), chunkMat = new THREE.MeshLambertMaterial({ color: 0x6b5638 });

  // ---- chaos world ----
  const world = new THREE.Scene(); world.fog = new THREE.FogExp2(0x000000, 0.02);
  const wcam = new THREE.PerspectiveCamera(85, camera.aspect, 0.05, 400);
  const tunnelMat = kaleido();
  const tunnel = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 300, 24, 1, true).rotateX(Math.PI / 2), tunnelMat); world.add(tunnel);
  const floorMat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 } },
    vertexShader: `uniform float uTime; varying vec2 vP; void main(){ vec3 p = position; vP = p.xy; p.z += sin(length(p.xy)*0.6 - uTime*2.)*0.5; gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.); }`,
    fragmentShader: `uniform float uTime; varying vec2 vP;
      vec3 hsv(float h,float s,float v){ vec3 k=clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.); return v*mix(vec3(1.),k,s); }
      void main(){ vec2 g = vP*0.6; vec2 r = vec2(g.x + g.y*0.577, g.y*1.155); vec2 f = fract(r); float tri = step(f.x, f.y);
        float b = 1. - smoothstep(0.0, 0.08, min(min(f.x, f.y), abs(f.x - f.y)));
        float br = 0.5 + 0.5*sin(length(vP)*0.6 - uTime*2.);
        vec3 c = hsv(fract(tri*0.5 + length(floor(r))*0.05 + uTime*0.15), .8, 0.25 + 0.5*br) + b*vec3(1.,.8,.4);
        gl_FragColor = vec4(c, 1.); }` });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 300, 60, 150).rotateX(-Math.PI / 2), floorMat); floor.position.y = -6; world.add(floor);
  // jewel palace: nested counter-rotating polyhedra ahead
  const palace = new THREE.Group(); world.add(palace);
  const shells = [new THREE.IcosahedronGeometry(6, 0), new THREE.DodecahedronGeometry(4.2, 0), new THREE.OctahedronGeometry(2.8, 0), new THREE.TetrahedronGeometry(1.6, 0)].map((g, i) => {
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: i % 2 === 0, transparent: true, opacity: i % 2 ? 0.55 : 1 }));
    palace.add(m); return m; });
  const orbiters = [];
  for (let i = 0; i < 16; i++) { const e = makeElf(i / 16); e.scale.setScalar(3 + (i % 3)); world.add(e); orbiters.push({ e, a: i / 16 * 6.283, r: 4 + (i % 4) * 1.4, y: (i % 5) - 2, sp: 0.4 + (i % 3) * 0.25 }); }
  // feedback trails: a translucent black quad instead of a full clear
  const trailScene = new THREE.Scene(), trailCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  trailScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthTest: false, depthWrite: false })));
  let look = { x: 0, y: 0 };
  addEventListener('mousemove', e => { if (!st || st.t < T.engulf) return; look.x = Math.max(-0.6, Math.min(0.6, look.x - e.movementX * 0.002)); look.y = Math.max(-0.4, Math.min(0.4, look.y - e.movementY * 0.002)); });

  function start(opts = {}) {
    const giant = makeElf(0.77); giant.scale.setScalar(11);
    const fwd = V(0, 0, -1).applyQuaternion(camera.quaternion).setY(0).normalize();
    const base = camera.position.clone().addScaledVector(fwd, 3.2);
    giant.position.set(base.x, -5, base.z); scene.add(giant);
    const crack = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: crackTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    crack.position.set(camera.position.x, floorY(camera.position.x, camera.position.z) + 0.02, camera.position.z); // erupts right under the player scene.add(crack);
    const fissureLight = new THREE.PointLight(0xff7020, 0, 12); fissureLight.position.copy(crack.position).y += 0.5; scene.add(fissureLight);
    const chunks = [];
    for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(chunkGeo, chunkMat); m.position.copy(crack.position); scene.add(m);
      chunks.push({ m, v: V((Math.random() - 0.5) * 6, 4 + Math.random() * 6, (Math.random() - 0.5) * 6), w: V(Math.random() * 9, Math.random() * 9, 0), t0: Math.random() * 1.5 }); }
    st = { t: opts.direct ? T.engulf - 0.6 : 0, direct: !!opts.direct, wl: opts.worldLen || 18, savedPos: (opts.savedPos || camera.position).clone(), savedQuat: (opts.savedQuat || camera.quaternion).clone(), giant, crack, fissureLight, chunks, base, frag: -1, done: false };
    if (opts.direct) { giant.visible = false; crack.visible = false; chunks.forEach(c => c.m.visible = false); } else say('THE FLOOR IS... OPENING', 3);
  }
  function cleanupGallery() { scene.remove(st.giant, st.crack, st.fissureLight, ...st.chunks.map(c => c.m)); }

  function update(dt, now) {
    if (!st) return false;
    st.t += dt; const t = st.t;
    tunnelMat.uniforms.uTime.value = floorMat.uniforms.uTime.value = now / 1000;
    const TW = T.engulf + st.wl, TWH = TW + 1.6;
    if (t < T.engulf && st.direct) { fade.style.background = '#000'; fade.style.opacity = String(ease((t - T.engulf + 0.6) / 0.6)); }
    else if (t < T.engulf) {
      // eruption: shake, fissure grows, chunks fly, giant rises
      const k = ease(t / 2.2), shake = (t < T.erupt ? 0.12 : 0.05) * (1 - clamp01((t - 3) / 2));
      st.crack.scale.setScalar(0.5 + k * 5); st.fissureLight.intensity = 30 * k;
      st.chunks.forEach(c => { const tt = t - c.t0; if (tt < 0) return; c.m.position.set(st.crack.position.x + c.v.x * tt * 0.4, st.crack.position.y + c.v.y * tt - 4.9 * tt * tt, st.crack.position.z + c.v.z * tt * 0.4); c.m.rotation.set(c.w.x * tt, c.w.y * tt, 0); if (c.m.position.y < 0) c.m.position.y = 0; });
      const rise = ease((t - 0.6) / 2.6);
      st.giant.position.y = -5 + rise * (st.savedPos.y + 2.0 + 5);
      animateElf(st.giant, 'idle', t, camera, dt);
      const mouth = st.giant.localToWorld(V(0, -0.19, 0.2));
      const e = ease((t - T.erupt) / (T.engulf - T.erupt));
      camera.position.copy(st.savedPos).lerp(mouth, e * 0.97).add(V((Math.random() - .5) * shake, (Math.random() - .5) * shake, (Math.random() - .5) * shake));
      const lq = camera.clone(); lq.lookAt(mouth); camera.quaternion.copy(st.savedQuat).slerp(lq.quaternion, ease((t - 1.5) / 2));
      fade.style.background = '#000'; fade.style.opacity = String(ease((t - T.engulf + 0.6) / 0.6));
      if (t > 1.5 && t < 1.6) say('SOMETHING ENORMOUS IS VERY HAPPY TO SEE YOU', 3);
      canvas.style.filter = `saturate(${1 + k}) contrast(${1 + k * 0.3})`;
    } else if (t < TW) {
      if (!st.inWorld) { st.inWorld = true; cleanupGallery(); look = { x: 0, y: 0 }; realmTitle(); }
      const w = t - T.engulf;
      fade.style.background = w < 1 ? '#000' : '#fff';
      fade.style.opacity = String(w < 1 ? 1 - w : ease((w - (st.wl - 1.6)) / 1.6));
      wcam.position.set(Math.sin(w * 0.4) * 1.5, Math.cos(w * 0.3) * 1, -w * 2.2);
      wcam.rotation.set(look.y + Math.sin(w * 0.5) * 0.1, look.x, Math.sin(w * 0.23) * 0.6, 'YXZ');
      tunnel.position.z = wcam.position.z; floor.position.z = wcam.position.z;
      palace.position.set(0, 0, wcam.position.z - 22);
      shells.forEach((m, i) => { m.rotation.set(w * (0.3 + i * 0.2) * (i % 2 ? -1 : 1), w * (0.5 + i * 0.1), 0); m.material.color.setHSL((w * 0.1 + i * 0.25) % 1, 1, 0.6); m.scale.setScalar(1 + 0.15 * Math.sin(w * 2 + i)); });
      orbiters.forEach((o, i) => { const a = o.a + w * o.sp; o.e.position.set(Math.cos(a) * o.r, o.y + Math.abs(Math.sin(w * 3 + i)) * 1.2, wcam.position.z - 8 + Math.sin(a) * o.r); animateElf(o.e, 'idle', w + i, wcam, dt); });
      const fi = Math.floor(w / 3); if (fi !== st.frag && fi < 6) { st.frag = fi; say(FRAGS[fi % FRAGS.length], 2.8); }
      const s = now / 1000;
      canvas.style.filter = `saturate(${2.2 + Math.sin(s * 2)}) hue-rotate(${(s * 60) % 360}deg) drop-shadow(${4 + 3 * Math.sin(s * 3)}px 0 rgba(255,0,80,.6)) drop-shadow(${-4 - 3 * Math.sin(s * 3)}px 0 rgba(0,255,240,.6))`;
      canvas.style.transform = `scale(${1.04 + 0.03 * Math.sin(s * 1.7)}) skew(${3 * Math.sin(s * 0.9)}deg, ${2 * Math.sin(s * 1.3)}deg) rotate(${2 * Math.sin(s * 0.7)}deg)`;
      elfUniforms.uPulse.value = 1;
    } else if (t < TWH) {
      if (!st.back) { st.back = true; camera.position.copy(st.savedPos); camera.quaternion.copy(st.savedQuat);
        const eu = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ'); eu.x = 0; eu.z = 0; camera.quaternion.setFromEuler(eu);
        canvas.style.filter = ''; canvas.style.transform = ''; say('WELCOME BACK.', 4); }
      fade.style.background = '#fff'; fade.style.opacity = String(1 - ease((t - TW) / (TWH - TW)));
    } else { fade.style.opacity = '0'; st.done = true; const r = st; st = null; return { finished: true, savedPos: r.savedPos }; }
    return true;
  }
  function render() {
    if (st && st.inWorld && !st.back) { renderer.render(trailScene, trailCam); renderer.clearDepth(); renderer.render(world, wcam); return true; }
    return false;
  }
  return { start, update, render, get state() { return st; } };
}
