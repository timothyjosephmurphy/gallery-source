// #199 HUD tool pack (nest 848): swap procedural view-model meshes for meshopt GLBs on the CDN.
// Procedural build stays in place until the GLB loads; on any failure it simply remains (phone/offline safe).
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
export const TOOL_GLB_BASE = 'https://img.tjm.art/play/preview-251/tools-199/';
const LOW = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
let loader = null;
// keep: objects from the procedural build to retain (sprites, beams); map(root) rewires userData hooks
export function swapToolGLB(g, name, map, keep = []) {
  if (typeof window === 'undefined' || window.__noToolGLB) return;
  try { loader = loader || new GLTFLoader().setMeshoptDecoder(MeshoptDecoder); } catch (e) { return; }
  loader.load(TOOL_GLB_BASE + name + (LOW ? '-lod1' : '-lod0') + '.glb', gltf => {
    try { const root = gltf.scene, get = n => root.getObjectByName(n);
      const ok = map ? map(get, root) : true; if (ok === false) return;
      for (const c of [...g.children]) if (!keep.includes(c)) g.remove(c);
      g.add(root); g.userData.glb = name; (window.__toolGLB = window.__toolGLB || {})[name] = LOW ? 1 : 0;
    } catch (e) { console.warn('toolglb', name, e); }
  }, undefined, e => console.warn('toolglb fallback', name, e && e.message));
}
export function anchorTo(obj, node) { if (obj && node) obj.position.copy(node.position); }
export { THREE };
