// Video holograms of TJ (one per room): SBS colour|alpha H.264 + room-based audio with doorway crossfades.
import * as THREE from 'three';
const VS = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }';
const FS = `varying vec2 vUv; uniform sampler2D map; uniform float t, flick;
  void main(){ vec3 c = texture2D(map, vec2(vUv.x*.5, vUv.y)).rgb; float a = texture2D(map, vec2(.5+vUv.x*.5, vUv.y)).r;
    a = smoothstep(.08,.6,a) * smoothstep(1.,.86,vUv.y) * smoothstep(0.,.16,vUv.y) * smoothstep(0.,.07,vUv.x) * smoothstep(1.,.95,vUv.x);
    c = mix(c, c*vec3(.7,1.,1.15)+vec3(.0,.04,.07), .4);
    float sl = .86 + .14*sin(vUv.y*408.*3.14159 + t*6.);
    float band = smoothstep(.0,.02, abs(fract(vUv.y*.5 - t*.12)-.5)-.47);
    c *= sl * flick * (1. + .5*(1.-band));
    gl_FragColor = vec4(c*.95, a*.9*flick);
    #include <colorspace_fragment>
  }`;
let glowTex = null;
function glow() { if (glowTex) return glowTex; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  r.addColorStop(0, 'rgba(160,240,255,1)'); r.addColorStop(.35, 'rgba(70,200,255,.55)'); r.addColorStop(.8, 'rgba(40,140,255,.15)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return (glowTex = new THREE.CanvasTexture(c)); }

function makeOne(scene, d, low, base) {
  const H = d.h || 1.62, W = H * d.asp;
  const root = new THREE.Group(); root.position.set(d.x, d.y, d.z); scene.add(root);
  const video = document.createElement('video');
  Object.assign(video, { src: base + d.src, loop: true, muted: true, playsInline: true, crossOrigin: 'anonymous', preload: 'metadata' });
  video.setAttribute('playsinline', ''); video.setAttribute('webkit-playsinline', '');
  const still = new THREE.TextureLoader().load(base + d.still), vtex = new THREE.VideoTexture(video);
  vtex.colorSpace = still.colorSpace = THREE.SRGBColorSpace;
  const uni = { map: { value: still }, t: { value: 0 }, flick: { value: 1 } };
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.ShaderMaterial({ uniforms: uni, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide }));
  plane.position.y = 0.06 + H / 2; plane.renderOrder = 5; root.add(plane);
  const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false };
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.95, 48), new THREE.MeshBasicMaterial({ map: glow(), ...add })); disc.rotation.x = -Math.PI / 2; disc.position.y = 0.012; root.add(disc);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.68, 64), new THREE.MeshBasicMaterial({ color: 0x66ddff, ...add, opacity: .8 })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.015; root.add(ring);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.6, H + 0.2, 40, 1, true), new THREE.ShaderMaterial({ ...add, side: THREE.DoubleSide, uniforms: uni, vertexShader: VS,
    fragmentShader: 'varying vec2 vUv; uniform float flick; void main(){ gl_FragColor = vec4(vec3(.25,.7,1.)*.11*(1.-vUv.y)*flick, 1.); }' }));
  cone.position.y = (H + 0.2) / 2; root.add(cone);
  if (!low) { const l = new THREE.PointLight(0x66ccff, 2.5, 5, 2); l.position.y = 0.4; root.add(l); }
  return { d, root, video, vtex, still, uni, plane, ring, gain: null, pan: null, pauseAt: 0, playing: false };
}

export function makeHolos(scene, camera, defs, { low = false, base = '' } = {}) {
  const H = defs.map(d => makeOne(scene, d, low, base));
  const NEAR = 1.5, FLOOR = 0.12; // #239 quieter: full volume within 1.5 m, easing to FLOOR at the room's farthest corner
  H.forEach(h => { const b = h.d.b; h.pv = 1; h.far = b ? Math.max(...[[b.minX, b.minZ], [b.minX, b.maxZ], [b.maxX, b.minZ], [b.maxX, b.maxZ]].map(([x, z]) => Math.hypot(x - h.d.x, z - h.d.z))) : 12; });
  const proxGain = (h, d) => { const u = Math.min(1, Math.max(0, (d - NEAR) / (h.far - NEAR))); const e = u * u * (3 - 2 * u); return 1 - (1 - FLOOR) * e; };
  let ctx = null, master = null, muted = false, started = false, lowStill = false, active = null, switches = 0;
  const FADE = 0.4; // setTargetAtTime time constant: ~95% in 1.2 s
  const showVideo = h => { h.uni.map.value = (!lowStill && h.playing) ? h.vtex : h.still; };
  H.forEach(h => { h.video.addEventListener('playing', () => { h.playing = true; showVideo(h); }); h.video.addEventListener('pause', () => { h.playing = false; showVideo(h); }); });
  const masterOn = () => !muted && !document.hidden;
  function setGains(instant) {
    H.forEach(h => { const v = h === active ? 1 : 0;
      if (h.gain) { if (instant) h.gain.gain.value = v; else h.gain.gain.setTargetAtTime(v, ctx.currentTime, FADE); }
      else h.video.muted = !(started && v && masterOn()); });
    if (master) master.gain.setTargetAtTime(masterOn() ? (window.__tourVO ? 0.25 : 0.7) : 0, ctx.currentTime, 0.08); /* #809: room holos sit under the tour VO, never the reverse */
  }
  const play = h => { h.pauseAt = 0; if (document.hidden) return; h.video.play().catch(() => {}); };
  function begin() { // from a user gesture
    if (started) { if (ctx && ctx.state === 'suspended') ctx.resume(); return; } started = true;
    try { ctx = window.__sharedAC = window.__sharedAC || new (window.AudioContext || window.webkitAudioContext)(); /* #809: one AudioContext shared with the tour guide (iOS drops a 2nd context) */ master = ctx.createGain(); master.connect(ctx.destination);
      H.forEach(h => { const s = ctx.createMediaElementSource(h.video); h.pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null; h.gain = ctx.createGain(); h.gain.gain.value = h === active ? 1 : 0; h.prox = ctx.createGain(); h.prox.gain.value = h.pv;
        (h.pan ? s.connect(h.pan).connect(h.prox) : s.connect(h.prox)).connect(h.gain).connect(master); h.video.muted = false; });
    } catch (e) { ctx = null; master = null; H.forEach(h => { h.gain = null; }); }
    setGains(true); if (active) play(active);
  }
  addEventListener('visibilitychange', () => { if (document.hidden) H.forEach(h => h.video.pause()); else if (active) play(active); setGains(); });
  const right = new THREE.Vector3();
  function update(dt, now, roomId) {
    if (started && !!window.__tourVO !== !!H.__vo) { H.__vo = !!window.__tourVO; setGains(); } if (ctx && ctx.state !== 'running' && ctx.state !== 'closed' && !document.hidden) ctx.resume().catch(() => {});
    const nxt = H.find(h => h.d.room === roomId) || null;
    if (nxt !== active) { const old = active; active = nxt; switches++;
      if (old) old.pauseAt = now + (started ? 2000 : 0); // let its audio fade out, then stop decoding
      if (active) play(active); setGains(!started); }
    const cp = camera.position; right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    for (const h of H) {
      if (h.pauseAt && now >= h.pauseAt && h !== active) { h.pauseAt = 0; h.video.pause(); }
      if (h === active && started && h.video.paused && !document.hidden) play(h);
      h.uni.t.value = now / 1000; h.uni.flick.value = 0.93 + 0.05 * Math.sin(now / 37 + h.d.x) + (Math.random() < 0.01 ? -0.25 : 0);
      const dx = h.d.x - cp.x, dz = h.d.z - cp.z; h.plane.rotation.y = Math.atan2(-dx, -dz); h.ring.rotation.z += dt * 0.4;
      if (h === active) { const pv = proxGain(h, Math.hypot(dx, dz)); if (Math.abs(pv - h.pv) > 0.003) { h.pv = pv; if (h.prox) h.prox.gain.setTargetAtTime(pv, ctx.currentTime, 0.15); else if (!h.gain) h.video.volume = pv; } }
      if (h.pan && h === active) { const L = Math.hypot(dx, dz) || 1; h.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, (dx * right.x + dz * right.z) / L)) * 0.3, ctx.currentTime, 0.1); }
    }
  }
  function setLowStill(on) { lowStill = on; H.forEach(showVideo); } // audio keeps coming from the (undrawn) video element
  function toggleMute() { muted = !muted; begin(); setGains(); return muted; }
  function setMuted(m, gesture) { muted = !!m; if (gesture) begin(); setGains(); return muted; }
  return { H, begin, update, toggleMute, setMuted, setLowStill, get muted() { return muted; },
    get state() { return { started, ctx: ctx && ctx.state, active: active && active.d.room, switches, lowStill, holos: H.map(h => ({ room: h.d.room, paused: h.video.paused, t: +h.video.currentTime.toFixed(2), gain: h.gain ? +h.gain.gain.value.toFixed(3) : (h.video.muted ? 0 : 1), prox: h.prox ? +h.prox.gain.value.toFixed(3) : +h.pv.toFixed(3), proxTarget: +h.pv.toFixed(3), far: +h.far.toFixed(1), video: h.uni.map.value === h.vtex })) }; } };
}

// #267 tour (tag gallery): the welcome hologram reuses this exact look
export { VS as HOLO_VS, FS as HOLO_FS, glow as holoGlow };
