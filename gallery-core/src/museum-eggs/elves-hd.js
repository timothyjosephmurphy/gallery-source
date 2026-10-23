// HD machine elves (museum-eggs/src/elves-hd.js, TJ 2026-10-18): a drop-in replacement for each gallery's src/elves3d.js with the
// same exports (elfUniforms, makeElf, animateElf, tickElfMaterials) and the same rig, so every caller (swarm, chase, drag, splats,
// realm, glitter sweepers, the banana elf) works unchanged. Higher-resolution geometry: a 320-facet jewel shell (was 80) over a smooth
// nested glowing core, a rounded floppy jester hat (smooth tubes, bells with rims), jointed arms with mitten hands and thumbs,
// legs with curled-toe shoes, a smoother look (finer colour steps, softer facet gaps). Same ~8 draw calls per elf.
// Phones: call setElfQuality('low') before the first makeElf() (galleries pass their LOW flag) -> lighter geometry (~45% of the triangles).
import * as THREE from 'three';
let LOWQ = typeof window !== 'undefined' && window.__elfLow === true; // optional global switch
export function setElfQuality(q) { LOWQ = q === 'low' || q === true; G = null; }

export const elfUniforms = { uTime: { value: 0 }, uPulse: { value: 0 } };

// convert geometry to flat facets with per-face centre + random attributes
function facetize(g, open = 1) {
  g = g.index ? g.toNonIndexed() : g; g.computeVertexNormals();
  const p = g.attributes.position.array, n = p.length / 9, c = new Float32Array(p.length), r = new Float32Array(p.length / 3), o = new Float32Array(p.length / 3);
  for (let f = 0; f < n; f++) {
    const cx = (p[f * 9] + p[f * 9 + 3] + p[f * 9 + 6]) / 3, cy = (p[f * 9 + 1] + p[f * 9 + 4] + p[f * 9 + 7]) / 3, cz = (p[f * 9 + 2] + p[f * 9 + 5] + p[f * 9 + 8]) / 3;
    const rr = Math.abs(Math.sin(f * 12.9898 + cx * 78.233) * 43758.5453) % 1;
    for (let v = 0; v < 3; v++) { c.set([cx, cy, cz], f * 9 + v * 3); r[f * 3 + v] = rr; o[f * 3 + v] = open; }
  }
  g.setAttribute('aCenter', new THREE.BufferAttribute(c, 3)); g.setAttribute('aRand', new THREE.BufferAttribute(r, 1)); g.setAttribute('aOpen', new THREE.BufferAttribute(o, 1));
  return g;
}
function merge(list) {
  const out = new THREE.BufferGeometry(), keys = ['position', 'normal', 'aCenter', 'aRand', 'aOpen'], data = {};
  keys.forEach(k => data[k] = []);
  list.forEach(g => keys.forEach(k => data[k].push(...g.attributes[k].array)));
  keys.forEach(k => out.setAttribute(k, new THREE.Float32BufferAttribute(data[k], list[0].attributes[k].itemSize)));
  return out;
}

const jewel = new THREE.ShaderMaterial({
  uniforms: elfUniforms,
  vertexShader: `attribute vec3 aCenter; attribute float aRand; attribute float aOpen; uniform float uTime;
    varying vec3 vN; varying vec3 vC; varying vec3 vP; varying float vR; varying vec3 vV; varying float vPh;
    void main(){
      float ph = dot(modelMatrix[3].xyz, vec3(1.3, 0.7, 2.1));
      float open = pow(max(0., sin(uTime*1.6 + ph + aRand*6.283)), 4.) * 0.022 * aOpen;   // facets drift apart (smaller facets, smaller gaps)
      float shimmer = 0.012 * sin(uTime*6. + aRand*40.) * aOpen;
      vec3 dir = normalize(aCenter + 1e-5);
      vec3 pos = position + dir * (open + shimmer);
      // facets twist about their centre while open (turning inside out)
      float a = open * 14. * (aRand - .5);
      vec3 lp = position - aCenter; pos = aCenter + dir*(open+shimmer) + vec3(lp.x*cos(a)-lp.y*sin(a), lp.x*sin(a)+lp.y*cos(a), lp.z);
      vN = normalize(normalMatrix * normal); vC = aCenter; vP = position; vR = aRand; vPh = ph;
      vec4 mv = modelViewMatrix * vec4(pos,1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform float uTime; uniform float uPulse; varying vec3 vN; varying vec3 vC; varying vec3 vP; varying float vR; varying vec3 vV; varying float vPh;
    vec3 hsv(float h,float s,float v){ vec3 k=clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.); return v*mix(vec3(1.),k,s); }
    void main(){
      // harlequin diamonds + fluid mandala flowing over the facets
      vec2 d = vec2(vC.x + vC.y, vC.x - vC.y) * 9.;
      float harl = mod(floor(d.x) + floor(d.y), 2.);
      float r = length(vC.xy) * 14., ang = atan(vC.y, vC.x);
      float mand = sin(r - uTime*3. + vPh) + sin(abs(mod(ang*3., 2.094) - 1.047)*8. + uTime*2.);
      float h = fract(vR*0.08 + harl*0.18 + mand*0.06 + uTime*0.07 + vPh*0.37);
      float fres = pow(1. - max(dot(vN, vV), 0.), 2.);
      float lit = 0.5 + 0.5*max(dot(vN, normalize(vec3(.3,.9,.6))), 0.);
      vec3 c = hsv(h, 0.7, lit*(0.75+0.25*harl)) + fres * hsv(h + .33, .9, .9);
      // facet sparkle / emissive glints
      float spec = pow(max(dot(reflect(-vV, vN), normalize(vec3(.2,.8,.6))), 0.), 24.);
      float glint = step(0.93, fract(vR*61. + uTime*0.9)) * 0.9;
      c += vec3(1.) * (spec*0.8 + glint);
      // eyes opening on some facets (front half), pupils looking at the viewer
      float eyeOn = step(0.62, vR) * step(-0.02, vC.z) * smoothstep(0.2, 0.6, sin(uTime*1.3 + vR*30. + vPh));
      float de = length(vP - vC);
      if (eyeOn > 0. && de < 0.022) { c = mix(mix(vec3(1., .97, .6), vec3(.55, .9, 1.), step(de, 0.016)), vec3(.02), step(de, 0.009)); } // eye: white, iris ring, pupil
      // grin band: facets in the lower front open into glowing nested geometry
      if (vC.z > 0.07 && vC.y < -0.02 && vC.y > -0.11 && abs(vC.x) < 0.15) {
        float rings = fract(length(vP.xy - vec2(0., -0.07))*40. - uTime*2.);
        c = mix(vec3(0.03, 0., 0.05), hsv(fract(uTime*0.3 + rings), .9, 1.), step(0.7, rings));
      }
      c *= 1. + uPulse*0.25;
      gl_FragColor = vec4(floor(c*24.)/24., 1.);
    }`,
});
const hatMat = new THREE.ShaderMaterial({ uniforms: elfUniforms, fragmentShader: jewel.fragmentShader,
  vertexShader: jewel.vertexShader.replace('vN = normalize', `float fl = clamp((abs(position.x) - 0.06) / 0.25, 0., 1.); fl = fl * fl; float sg = sign(position.x);
      float w = uTime * 2.4 + ph + sg * 1.1;
      pos += vec3(sg * 0.035 * sin(w), -0.03 * (0.5 + 0.5 * sin(w * 1.3 + 0.7)) - 0.015, 0.06 * sin(w * 0.8 + sg)) * fl;
      vN = normalize`) });
const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const orbMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false });
const haloMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.35, depthWrite: false });

// shared geometry (built on first use so setElfQuality() can pick the tier)
const tube = (pts, r0, r1, seg, rad) => { const curve = new THREE.CatmullRomCurve3(pts), tb = new THREE.TubeGeometry(curve, seg, 1, rad, false), pa = tb.attributes.position;
  for (let i = 0; i <= seg; i++) { const t = i / seg, c = curve.getPointAt(t), k = r0 + (r1 - r0) * t; for (let j = 0; j <= rad; j++) { const v = i * (rad + 1) + j; pa.setXYZ(v, c.x + (pa.getX(v) - c.x) * k, c.y + (pa.getY(v) - c.y) * k, c.z + (pa.getZ(v) - c.z) * k); } }
  tb.computeVertexNormals(); return tb; };
let G = null;
function geo() { if (G) return G; const L = LOWQ, sd = L ? 1 : 2, sm = n => L ? Math.max(5, Math.round(n * 0.55)) : n;
  G = {
    shell: facetize(new THREE.IcosahedronGeometry(0.17, sd)),
    core: new THREE.IcosahedronGeometry(0.1, L ? 1 : 2),
    cap: (() => { // rounded dome, a soft rolled band, two smooth floppy points that droop, bells with rims at the tips
      const parts = [facetize(new THREE.SphereGeometry(0.165, sm(24), sm(10), 0, 6.283, 0, 1.5708).scale(1, 0.8, 1).translate(0, 0.05, 0), 0.2),
        facetize(new THREE.TorusGeometry(0.162, 0.016, sm(8), sm(32)).rotateX(Math.PI / 2).scale(1, 1, 1).translate(0, 0.055, 0), 0.1)];
      [-1, 1].forEach(sg => {
        parts.push(facetize(tube([new THREE.Vector3(sg * 0.05, 0.15, 0), new THREE.Vector3(sg * 0.13, 0.26, -0.01), new THREE.Vector3(sg * 0.24, 0.24, 0.01), new THREE.Vector3(sg * 0.3, 0.12, 0.03), new THREE.Vector3(sg * 0.31, 0.035, 0.04)], 0.062, 0.008, sm(28), sm(12)), 0.25));
        parts.push(facetize(new THREE.SphereGeometry(0.03, sm(14), sm(10)).translate(sg * 0.31, 0.0, 0.04), 0.3));
        parts.push(facetize(new THREE.TorusGeometry(0.03, 0.005, 6, sm(16)).rotateX(Math.PI / 2).translate(sg * 0.31, -0.012, 0.04), 0.1));
        parts.push(facetize(new THREE.SphereGeometry(0.008, 6, 4).translate(sg * 0.31, -0.03, 0.04), 0)); });
      return merge(parts); })(),
    leg: (() => merge([facetize(new THREE.CylinderGeometry(0.024, 0.019, 0.11, sm(12), 2).translate(0, -0.055, 0), 0), facetize(new THREE.SphereGeometry(0.02, sm(10), sm(8)).translate(0, -0.11, 0), 0), // knee-less leg + ankle
      facetize(tube([new THREE.Vector3(0, -0.118, -0.02), new THREE.Vector3(0, -0.122, 0.03), new THREE.Vector3(0, -0.11, 0.075), new THREE.Vector3(0, -0.085, 0.085)], 0.03, 0.008, sm(12), sm(10)), 0.4)]))(), // curled-toe shoe
    arm: (() => merge([facetize(new THREE.CylinderGeometry(0.025, 0.02, 0.12, sm(12), 2).translate(0, -0.06, 0), 0), facetize(new THREE.SphereGeometry(0.022, sm(10), sm(8)).translate(0, -0.005, 0), 0), // shoulder ball
      facetize(new THREE.SphereGeometry(0.034, sm(14), sm(10)).scale(1, 1.15, 0.8).translate(0, -0.135, 0), 0.5), facetize(new THREE.SphereGeometry(0.013, sm(8), sm(6)).scale(1, 1.6, 1).translate(0.026, -0.12, 0.012), 0.2)]))(), // mitten + thumb
    orb: new THREE.IcosahedronGeometry(0.06, L ? 0 : 1),
    halo: new THREE.IcosahedronGeometry(0.13, 0) };
  return G; }
export function makeElf(seed = Math.random()) { const G = geo();
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const shell = new THREE.Mesh(G.shell, jewel); body.add(shell);
  const core = new THREE.Mesh(G.core, coreMat); body.add(core); const halo = new THREE.Mesh(G.halo, haloMat); core.add(halo); // nested: a faint wire cage around the core
  const cap = new THREE.Mesh(G.cap, hatMat); body.add(cap);
  const arm = x => { const a = new THREE.Mesh(G.arm, jewel); a.position.set(x, 0.0, 0.04); body.add(a); return a; };
  const armL = arm(-0.17), armR = arm(0.17);
  const leg = x => { const l = new THREE.Mesh(G.leg, jewel); l.position.set(x, -0.13, 0.02); body.add(l); return l; };
  const legL = leg(-0.07), legR = leg(0.07);
  const orb = new THREE.Mesh(G.orb, orbMat); orb.position.set(0, 0.42, 0.1); body.add(orb);
  root.userData.rig = { body, shell, core, cap, armL, armR, legL, legR, orb, seed, glitch: 0 };
  return root;
}

const q = (t, fps) => Math.floor(t * fps) / fps;
// mode: peek | walk | scrub | carry | retreat | idle  (walk/retreat = self-dribbling bounce)
export function animateElf(root, mode, t, camera, dt) {
  const r = root.userData.rig, s = r.seed * 10, tq = q(t + s, 8);
  let bounce = 0, squash = 1, aL = 0.3, aR = 0.3, roll = 0, show = 0, lL = 0, lR = 0, splay = 0.12;
  if (mode === 'walk' || mode === 'retreat') {
    const b = Math.abs(Math.sin((t + s) * 9)); bounce = b * 0.16; squash = b < 0.15 ? 0.75 : 1 + b * 0.08;
    { const st = Math.sin((t + s) * 9); lL = st * 0.8; lR = -st * 0.8; } roll = (t + s) * (mode === 'retreat' ? -9 : 9); aL = -1 + Math.sin(t * 18) * 0.6; aR = -1 - Math.sin(t * 18) * 0.6;
  } else if (mode === 'scrub') {
    aR = -1.6 + Math.sin((t + s) * 22) * 0.7; aL = -1.6 - Math.sin((t + s) * 22) * 0.7;
    bounce = Math.abs(Math.sin((t + s) * 11)) * 0.04; roll = Math.sin(t * 5) * 0.3; lL = Math.sin((t + s) * 11) * 0.25; lR = -lL; splay = 0.3;
  } else if (mode === 'carry') {
    aL = aR = -2.9 + Math.sin((t + s) * 8) * 0.2; const b = Math.abs(Math.sin((t + s) * 12)); bounce = b * 0.05; squash = 1 - b * 0.1; lL = Math.sin((t + s) * 12) * 0.5; lR = -lL;
  } else if (mode === 'peek') {
    aL = -2.6; aR = -0.4 + Math.sin((t + s) * 3.1) * 0.35; show = 1; lL = Math.sin((t + s) * 2.7) * 0.2; lR = Math.sin((t + s) * 2.7 + 2) * 0.2; splay = 0.18 + 0.08 * Math.sin((t + s) * 3.7); roll = Math.sin(tq * 4) * 0.2; // holds up a morphing glowing offering
  } else { const b = Math.abs(Math.sin((t + s) * 6)); bounce = b * 0.08; aL = -2.4 + Math.sin(tq * 3) * 0.4; aR = 0.2 + Math.sin((t + s) * 3.3) * 0.5; show = 1; lL = Math.sin((t + s) * 6) * 0.35; lR = -lL; splay = 0.15 + 0.1 * Math.sin((t + s) * 4.1); }
  r.body.position.y = -0.12 + bounce; r.body.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
  r.armL.rotation.set(aL, 0, 0.5 + Math.sin((t + s) * 4.3) * 0.12); r.armR.rotation.set(aR, 0, -0.5 - Math.sin((t + s) * 3.9) * 0.12);
  r.legL.rotation.set(lL, 0, -splay); r.legR.rotation.set(lR, 0, splay);
  // shell rolls (self-dribbling) while the eyes/grin stay facing forward via the shader's world phase
  r.shell.rotation.set(roll * 0.25, Math.sin(tq * 1.1 + s) * 0.4, Math.sin(tq * 0.7) * 0.3);
  r.core.rotation.set(t * 2.3, t * 3.1, 0); r.core.scale.setScalar(0.8 + 0.3 * Math.sin(t * 4 + s));
  r.cap.rotation.z = Math.sin((t + s) * 1.7) * 0.18; r.cap.rotation.x = -bounce * 1.2; r.cap.position.y = 0.06 + Math.abs(Math.sin(t * 9 + s)) * 0.03;
  r.orb.visible = show > 0; r.orb.rotation.set(t * 3, t * 2, 0); r.orb.scale.set(1 + 0.4 * Math.sin(t * 5), 1 + 0.4 * Math.sin(t * 5 + 2), 1 + 0.4 * Math.sin(t * 5 + 4));
  const wp = root.getWorldPosition(new THREE.Vector3());
  root.lookAt(camera.position.x, wp.y, camera.position.z);
  if (r.glitch > 0) r.glitch -= dt; else if (Math.random() < dt * 0.6) r.glitch = 0.12;
  const g = r.glitch > 0; r.body.position.x = g ? (Math.random() - 0.5) * 0.06 : 0; if (g) r.body.scale.x *= 1.5;
}
export function tickElfMaterials(now) {
  const h = (now / 2000) % 1; orbMat.color.setHSL(h, 1, 0.65); coreMat.color.setHSL((h + 0.5) % 1, 1, 0.7); haloMat.color.setHSL((h + 0.25) % 1, 1, 0.75);
}
