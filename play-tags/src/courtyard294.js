// #294 (TJ, preview): two boards on the bare walls kept free in #293. Timeline wall (room-08 k1): Writer's sourced timeline
// (courtyard-timeline.md, verbatim). Nostr wall (room-09 k4): Website's read-only nostr-wall module, TJ's own kind-1 notes from
// public relays (no keys, no signing), falling back to a real snapshot. All text drawn with fillText, so note content can't inject markup.
import * as THREE from 'three';
import TL from './courtyard-timeline.md?raw';
import FALLBACK from './nostr-wall/fallback.json';
import { getNotes, renderNotesToCanvas } from './nostr-wall/nostr-wall.js';
import SLOTS from './outer-slots.json'; // #295: boards as a pair on a courtyard-facing outer wall (tools/outerslots.mjs)
const ITEMS = TL.split('\n').map(l => l.match(/^- ([^:]+): (.+)$/)).filter(Boolean).map(m => ({ when: m[1], text: m[2] }));
function board({ game, root, slot, name }) {
  if (!slot) return null; const BW = slot.w, BH = slot.h, [nx, nz] = slot.n, [tx, tz] = slot.t;
  const g = new THREE.Group(); g.name = name; g.position.set(slot.mid[0] + tx * slot.s + nx * 0.07, 0, slot.mid[1] + tz * slot.s + nz * 0.07); g.rotation.y = Math.atan2(nx, nz);
  { const old = game.scene.getObjectByName(name); if (old) old.parent.remove(old); } game.scene.add(g); // on the scene itself (the architecture root gets rebuilt), replacing any earlier copy
  const fr = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.12, BH + 0.12, 0.04), new THREE.MeshStandardMaterial({ color: 0x5a3e26, roughness: 0.7 })); fr.position.set(0, 1.75, -0.01); g.add(fr);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshBasicMaterial({ toneMapped: false })); face.position.set(0, 1.75, 0.015); face.name = name + 'Face'; g.add(face);
  return { g, face, BW, BH, w: slot };
}
export function installCourtyard294({ game, W, root, low }) {
  const S = window.__c294 = { timeline: null, nostr: null, installs: ((window.__c294 && window.__c294.installs) || 0) + 1 };
  const tw = SLOTS.slots.timeline, nw = SLOTS.slots.nostr;
  // timeline
  const A = board({ game, root, slot: tw, name: 'timelineWall' });
  if (A) { const CW = low ? 1000 : 1600, CH = Math.round(CW * A.BH / A.BW), c = document.createElement('canvas'); c.width = CW; c.height = CH; const x = c.getContext('2d');
    x.fillStyle = '#f3ead8'; x.fillRect(0, 0, CW, CH); x.fillStyle = '#3b2a1c'; x.textAlign = 'center'; x.font = `bold ${CW / 22}px Georgia, serif`; x.fillText('TJ Murphy: a timeline', CW / 2, CH * 0.09);
    const cols = 2, per = Math.ceil(ITEMS.length / cols), colW = CW / cols, fs = CW / 47, lh = fs * 1.18, rowH = CH * 0.84 / per; x.textAlign = 'left';
    ITEMS.forEach((it, i) => { const col = Math.floor(i / per), row = i % per, x0 = col * colW + CW * 0.035, y0 = CH * 0.15 + row * rowH;
      x.fillStyle = '#a4432a'; { let k = 1.05; x.font = `bold ${fs * k}px Georgia, serif`; const mw = CW * 0.088, w0 = x.measureText(it.when).width; if (w0 > mw) { k *= mw / w0; x.font = `bold ${fs * k}px Georgia, serif`; } x.fillText(it.when, x0, y0 + fs); }
      x.fillStyle = '#3b2a1c'; x.font = `${fs}px Georgia, serif`; const maxW = colW - CW * 0.035 * 2 - CW * 0.1 - CW * 0.01; let line = '', y = y0 + fs;
      for (const wd of it.text.split(' ')) { const t = line ? line + ' ' + wd : wd; if (x.measureText(t).width > maxW && line) { x.fillText(line, x0 + CW * 0.1, y); y += lh; line = wd; } else line = t; }
      x.fillText(line, x0 + CW * 0.1, y); });
    x.strokeStyle = '#5a3e26'; x.lineWidth = 10; x.strokeRect(5, 5, CW - 10, CH - 10);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; A.face.material.map = t; A.face.material.needsUpdate = true;
    S.timeline = { room: tw.room, k: tw.k, pair: 'with nostr',  items: ITEMS.length, size: [+A.BW.toFixed(2), +A.BH.toFixed(2)], source: 'gallery-courtyard/timeline.md (Writer)' }; }
  // nostr
  const B = board({ game, root, slot: nw, name: 'nostrWall' });
  if (B) { const CW = low ? 700 : 1024, c = document.createElement('canvas'), tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const paint = (notes, src) => { renderNotesToCanvas(notes, { canvas: c, width: CW, height: Math.round(CW * B.BH / B.BW), fontSize: CW / 24, background: '#16121f', color: '#f1ecf8', accent: '#c9a2ff', title: 'TJ Murphy on Nostr (read-only)' });
      tex.needsUpdate = true; B.face.material.map = tex; B.face.material.needsUpdate = true; S.nostr = { room: nw.room, k: nw.k, notes: notes.length, ids: notes.map(n => n.id), source: src, size: [+B.BW.toFixed(2), +B.BH.toFixed(2)] }; };
    paint(FALLBACK, 'snapshot');
    getNotes({ limit: 8, timeoutMs: 4000 }).then(n => { if (n && n.length) paint(n, 'relays'); }).catch(() => {}); }
  S.groups = () => [A, B].map(o => o && { name: o.g.name, parent: o.g.parent && o.g.parent.type, inScene: (() => { let p = o.g; while (p.parent) p = p.parent; return p.type; })(), vis: o.g.visible });
  return S;
}
