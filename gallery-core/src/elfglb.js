// #199 characters pack (nest 850): machine elf + broom + dustpan meshopt GLBs on the CDN.
// One load per model (shared geometry/materials across the swarm); procedural stays until it lands, and on any failure it simply remains.
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
export const ELF_GLB_BASE = 'https://img.tjm.art/play/preview-251/characters-199/';
const LOW = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
let loader = null; const T = {}, W = {};
// cb(template) runs once the GLB is ready (immediately if cached); never runs on failure (procedural fallback)
export function onElfGLB(name, cb) {
  if (typeof window === 'undefined' || window.__noElfGLB) return;
  if (T[name]) { try { cb(T[name]); } catch (e) { console.warn('elfglb', name, e); } return; }
  if (W[name]) { W[name].push(cb); return; } W[name] = [cb];
  try { loader = loader || new GLTFLoader().setMeshoptDecoder(MeshoptDecoder); } catch (e) { return; }
  loader.load(ELF_GLB_BASE + name + (LOW ? '-lod1' : '-lod0') + '.glb', gltf => {
    T[name] = gltf.scene; (window.__elfGLB = window.__elfGLB || {})[name] = LOW ? 1 : 0;
    const q = W[name]; W[name] = null; for (const f of q) { try { f(T[name]); } catch (e) { console.warn('elfglb', name, e); } }
  }, undefined, e => { W[name] = null; console.warn('elfglb fallback', name, e && e.message); });
}
// replace a prop group's meshes with a clone of the GLB (group keeps its position/rotation/visible, driven by code)
export function swapPropGLB(g, name) { onElfGLB(name, tpl => { for (const c of [...g.children]) g.remove(c); g.add(tpl.clone()); g.userData.glb = name; }); }
