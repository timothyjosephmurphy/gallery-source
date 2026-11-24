// #470 (Visual): ostrich bump pack. The GLBs carry no UVs (POSITION,NORMAL only), so UVs are generated at runtime on the loaded geometry
// (the GLB itself is untouched): feathers get a dominant-axis box projection, legs/neck a cylindrical strip (U around, V along).
// Maps live on R2 (img.tjm.art/play/preview-251/ostrich-bump-470/) behind the preview's /img/ proxy; too big to embed in the worker.
import * as THREE from 'three';
const DIR = import.meta.env.BASE_URL + 'img/play/preview-251/ostrich-bump-470/';
const FEATHER = /^(Body|Wing_[LR]|Tail)$/, SKIN = /^(Neck|Leg_[LR])$/, BEAK = /^Beak$/, SHELL = /^Shell_/;
function boxUV(g, s) { const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)); let u, v;
    if (ax >= ay && ax >= az) { u = p.getZ(i); v = p.getY(i); } else if (ay >= az) { u = p.getX(i); v = p.getZ(i); } else { u = p.getX(i); v = p.getY(i); }
    uv[i * 2] = u / s; uv[i * 2 + 1] = -v / s; /* V runs head->tail-ish downwards */ } return uv; }
function cylUV(g) { g.computeBoundingBox(); const b = g.boundingBox, sz = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3()), p = g.attributes.position;
  const ax = sz.x >= sz.y && sz.x >= sz.z ? 0 : sz.y >= sz.z ? 1 : 2, L = [sz.x, sz.y, sz.z][ax] || 1, uv = new Float32Array(p.count * 2), q = [0, 0, 0];
  for (let i = 0; i < p.count; i++) { q[0] = p.getX(i) - c.x; q[1] = p.getY(i) - c.y; q[2] = p.getZ(i) - c.z; const a = q[(ax + 1) % 3], d = q[(ax + 2) % 3];
    uv[i * 2] = Math.atan2(d, a) / (2 * Math.PI) + 0.5; uv[i * 2 + 1] = q[ax] / L + 0.5; } return uv; }
export function applyOstrichBump(model, low) {
  const tl = new THREE.TextureLoader(), sfx = low ? '.phone.webp' : '.webp', cache = {};
  const tex = (n, rep) => { const k = n + rep; if (cache[k]) return cache[k]; const t = tl.load(DIR + n + sfx); t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = low ? 2 : 4; return cache[k] = t; };
  const st = { bump: null, feather: [], skin: [], beak: [], maps: 0, mats: 0 }, mats = new Map();
  model.updateMatrixWorld(true); let H = 0.88; { const bb = new THREE.Box3().setFromObject(model); H = bb.max.y - bb.min.y || H; }
  model.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.normal) return;
    const nm = [o.name, o.name.replace(/_\d+$/, ''), o.parent && o.parent.name].find(x => x && (FEATHER.test(x) || SKIN.test(x) || BEAK.test(x))); /* multi-material nodes load as a Group of Body_1.. meshes */ if (!nm) return;
    const kind = FEATHER.test(nm) ? 'feather' : SKIN.test(nm) ? 'skin' : 'beak';
    const list = Array.isArray(o.material) ? o.material : [o.material]; let touched = false;
    const out = list.map(m => { if (!m) return m;
      if (kind === 'beak') { if (m.name !== 'Apricot') return m; const c = mats.get('beak|' + m.uuid) || m.clone(); c.roughness = 0.4; mats.set('beak|' + m.uuid, c); touched = true; return c; }
      if (!SHELL.test(m.name)) return m; /* brass/LED/dark/apricot trim stay as modelled */
      const key = kind + '|' + m.uuid; let c = mats.get(key);
      if (!c) { c = m.clone(); c.name = m.name + '-' + kind + '470'; c.metalness = 0; c.roughness = 1;
        if (kind === 'feather') { const r = [4, 4]; c.normalMap = tex('feather-n', r); c.roughnessMap = tex('feather-r', r); c.aoMap = tex('feather-ao', r); c.aoMapIntensity = 0.8; c.normalScale.set(low ? 0.6 : 0.8, low ? 0.6 : 0.8); st.maps += 3; }
        else { const r = [1, 3]; c.normalMap = tex('skin-n', r); c.roughnessMap = tex('skin-r', r); c.normalScale.set(0.5, 0.5); st.maps += 2; }
        c.needsUpdate = true; mats.set(key, c); st.mats++; }
      touched = true; return c; });
    if (!touched) return;
    if (kind !== 'beak' && !o.geometry.attributes.uv) { const uv = kind === 'feather' ? boxUV(o.geometry, H) : cylUV(o.geometry); o.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); o.geometry.setAttribute('uv1', new THREE.BufferAttribute(uv, 2)); o.geometry.setAttribute('uv2', new THREE.BufferAttribute(uv, 2)); }
    o.material = Array.isArray(o.material) ? out : out[0]; if (!st[kind].includes(nm)) st[kind].push(nm); st.meshes = (st.meshes || 0) + 1; });
  st.bump = st.mats ? '470' : null; st.textures = Object.keys(cache).length; return st;
}
