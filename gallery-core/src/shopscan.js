// #235 / #201 Buy Scanner shop layer. Real shop data only (src/shop.json, baked by tools/shop.py from the live catalog + checkout):
//  - aiming the scanner at a painting for sale: the beam and a frame glow turn green and its price floats clear of the work;
//    at one that is not for sale: red glow and a floating 'Not for sale'
//  - #270 (TJ): ONLY for the painting the laser is on, and only when the shop sells a print of it: a true-size copy of the
//    print (real shop size, the shop's first frame) appears beside it, clear of the plaque and other frames, with a small
//    'Print  $price' label above or below it (hover expands it to size and frame). The copy stays while the laser, mouse or
//    finger is on it or its label; scanning it, clicking or tapping the label adds that print (not the original) to the cart.
//    It goes ~1.2 s after both laser and cursor have left. No mock-up prints hang anywhere else.
import SHOP from './shop.json';
const IN = 0.0254, GAP = 0.16, TAG_H = 0.11, LABEL_W = 0.46, LABEL_H = 0.13, MARGIN = 0.05;
export const shopEntry = id => SHOP.shop[id] || null;
export const money = a => '$' + Number(a).toLocaleString('en-US', { minimumFractionDigits: Number(a) % 1 ? 2 : 0, maximumFractionDigits: 2 });
export function createShopScan({ THREE, scene, camera, paintings, boards = [], walkable, exempt, unit, rampFloors = false }) {
  const S = { previews: [], skipped: [], aim: null, label: null, labelFor: null, built: new Set() };
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const plane = (w, h, mat) => { const m = new THREE.Mesh(unit, mat); m.scale.set(w, h, 1); exempt && exempt(m); return m; };
  // rectangles (in a painting's wall plane) taken by every other work, plaque, story board and preview near it
  const v = new THREE.Vector3();
  function obstacles(p, own = true) {
    p.group.updateWorldMatrix(true, false); const inv = new THREE.Matrix4().copy(p.group.matrixWorld).invert(), out = [];
    const add = (obj, w, h) => { obj.updateWorldMatrix(true, false); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, zz = 1e9;
      for (const [a, b] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) { v.set(a, b, 0).applyMatrix4(obj.matrixWorld).applyMatrix4(inv); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); zz = Math.min(zz, Math.abs(v.z)); }
      if (zz < 0.6 && x1 - x0 > 0.01) out.push([x0, y0, x1, y1]); };
    p.group.updateMatrixWorld();
    for (const q of paintings) { if (q === p || q.state !== 'wall' || (p.freestanding && q.data.ix * p.data.ix + q.data.iz * p.data.iz < 0.5) /* #765: works on the far face of a freestanding wall are not in the way */ || q.group.position.distanceTo(p.group.position) > 6 + q.w / 2 + p.w / 2) continue; add(q.frame); if (q.plaque) add(q.plaque); if (q.preview && q.preview.visible) q.preview.traverse(o => { if (o.userData.box) add(o); }); if (q.priceBox) add(q.priceBox); }
    for (const b of boards) if (b.parent && b.parent.position.distanceTo(p.group.position) < 6 + b.scale.x / 2 + p.w / 2) add(b);
    if (p.preview) p.preview.traverse(o => { if (o.userData.box) add(o); }); // its own print preview (when placing its price)
    // its own frame, lamp bar and plaque
    if (own) { out.push([-p.w / 2, -p.h / 2, p.w / 2, p.h / 2], [-Math.min(0.4, p.w * 0.3), p.h / 2, Math.min(0.4, p.w * 0.3), p.h / 2 + 0.16]); if (p.plaque) add(p.plaque); else out.push([-0.14, -p.h / 2 - 0.16, 0.14, -p.h / 2]); }
    return out;
  }
  const hit = (r, obs) => obs.some(o => r[0] < o[2] + MARGIN && r[2] > o[0] - MARGIN && r[1] < o[3] + MARGIN && r[3] > o[1] - MARGIN);
  // a spot is on real wall if the floor in front of it is walkable and the space behind it is not (no doorways, corners or open air)
  // (gugg-ny's ramp and the scanned room have floors at several heights: walkable() takes the floor height to test against)
  function onWall(p, x0, x1, y) { if (p.freestanding) return true; /* #765: hex courtyard murals on freestanding walls (flag absent in museums) */ p.group.updateWorldMatrix(true, false); const cy = p.group.position.y;
    const refs = rampFloors ? [undefined, ...[1.6, 1.3].map(d => cy - d)] : [undefined];
    for (const x of [x0, x1]) { let ok = false;
      for (const ref of refs) { if (![0.45, 0.8, 1.2, 1.7, 2.2].some(d => { v.set(x, y, d).applyMatrix4(p.group.matrixWorld); return walkable(v.x, v.z, ref); })) continue; /* open floor in front (walls keep a walking margin; furniture may stand under the art) */ v.set(x, y, -0.3).applyMatrix4(p.group.matrixWorld); if (walkable(v.x, v.z, ref)) continue; ok = true; break; }
      if (!ok) return false; }
    return true; }
  function floorY(p) { return p.group.position.y; } // local y = 0 is the painting centre; world y of a local y is centre + y
  // candidate spots, nearest first: beside it (level, then a little higher / lower), above it, then below its plaque
  function place(p, w, h, prefer = ['r', 'l', 'up'], accept = null) {
    const obs = obstacles(p), cy = floorY(p), C = [];
    for (const k of prefer) {
      if (k === 'up') { for (const dx of [0, 0.3, -0.3, 0.6, -0.6]) C.push([dx, p.h / 2 + 0.2 + h / 2]); continue; }
      const sd = k === 'r' ? 1 : -1;
      for (const dx of [0, 0.25, 0.5]) for (const dy of [0, 0.3, -0.3, 0.6, -0.6]) C.push([sd * (p.w / 2 + GAP + w / 2 + dx), dy]);
    }
    for (const sd of [1, -1]) C.push([sd * (0.14 + GAP + w / 2), -p.h / 2 - 0.07]); // beside its plaque
    for (const dx of [0, 0.35, -0.35]) C.push([dx, -p.h / 2 - 0.2 - h / 2]); // below the plaque
    for (let [x, y] of C) {
      const lo = cy + y - h / 2; if (lo < 0.4) continue; // off the floor
      const r = [x - w / 2, y - h / 2, x + w / 2, y + h / 2];
      if (cy + r[3] > 3.4) continue; // under the ceiling
      if (!hit(r, obs) && (!S.labelPass && onWall(p, r[0], r[2], y) || S.labelPass) && (!accept || accept(x, y))) return { x, y };
    }
    return null;
  }
  // ---- print previews ----
  function buildPreview(p) {
    S.built.add(p); const e = shopEntry(p.data.slug), pr = e && e.pr; if (!pr) return;
    const W = pr.in[0] * IN, H = pr.in[1] * IN, tagW = Math.max(W, 0.34), totalH = H + 0.03 + TAG_H;
    const others = obstacles(p, false); if (hit([-p.w / 2 + 0.1, -p.h / 2 + 0.1, p.w / 2 - 0.1, p.h / 2 - 0.1], others)) { S.skipped.push(p.data.slug); return; } // it hangs over another work (a book page on a display): no room for a preview
    const spot = place(p, Math.max(W, tagW), totalH); if (!spot) { S.skipped.push(p.data.slug); return; }
    const g = new THREE.Group(); g.position.set(spot.x, spot.y + (totalH / 2 - H / 2), 0.1); g.userData.p = p;
    const frame = plane(W, H, new THREE.MeshBasicMaterial({ color: new THREE.Color(pr.color) })); frame.userData.box = 1; g.add(frame);
    const mould = Math.min(0.022, W * 0.06), mat = plane(W - 2 * mould, H - 2 * mould, new THREE.MeshBasicMaterial({ color: 0xf6f4ee })); mat.position.z = 0.004; g.add(mat);
    const iw = pr.img[0] * IN, ih = pr.img[1] * IN, img = new THREE.Mesh(unit, p.mesh.material); img.scale.set(iw, ih, 1); img.position.z = 0.008; g.add(img); // the painting's own image, shared material (hi-res follows)
    const edge = plane(W + 0.012, H + 0.012, new THREE.MeshBasicMaterial({ color: 0x111111 })); edge.position.z = -0.004; g.add(edge); // thin shadow line so it reads as floating
    const mk = full => tex(512, Math.round(512 * TAG_H / tagW), (x, w, h) => { x.fillStyle = 'rgba(18,16,14,0.92)'; x.fillRect(0, 0, w, h); x.strokeStyle = '#d9b46a'; x.lineWidth = 4; x.strokeRect(2, 2, w - 4, h - 4);
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#f4e6c8'; x.font = `bold ${Math.round(h * (full ? 0.34 : 0.5))}px Georgia, serif`; x.fillText(`Print  ${money(pr.a)}`, w / 2, h * (full ? 0.34 : 0.52), w - 24);
      if (full) { x.fillStyle = '#b9d9c2'; x.font = `${Math.round(h * 0.24)}px Arial, sans-serif`; x.fillText(`${pr.size} · ${pr.frame} frame · click / tap to add`, w / 2, h * 0.74, w - 24); } });
    const tShort = mk(false), tFull = mk(true);
    const tag = plane(tagW, TAG_H, new THREE.MeshBasicMaterial({ map: tShort, transparent: true })); tag.position.set(0, -H / 2 - 0.03 - TAG_H / 2, 0.004); tag.userData.box = 1; tag.userData.label = 1; g.add(tag);
    g.userData.expand = on => { const m = on ? tFull : tShort; if (tag.material.map !== m) { tag.material.map = m; tag.material.needsUpdate = true; } };
    const glow = plane(W + 0.06, H + 0.06, new THREE.MeshBasicMaterial({ color: 0x2bff6a, transparent: true, opacity: 0.85 })); glow.position.z = -0.006; glow.visible = false; g.add(glow);
    for (const m of [frame, mat, img, tag]) m.userData.print = p;
    g.userData.glow = glow; g.userData.entry = pr; g.visible = false; p.preview = g; p.group.add(g); S.previews.push(p);
  }
  // ---- aim feedback: glow + floating price / 'Not for sale' ----
  const glow = new THREE.Mesh(unit, new THREE.MeshBasicMaterial({ color: 0x2bff6a, transparent: true, opacity: 0.9 })); glow.visible = false; exempt && exempt(glow);
  const labels = {};
  function labelMesh(kind, text) { const k = kind + text; if (labels[k]) return labels[k];
    const t = tex(512, 144, (x, w, h) => { const sale = kind === 'sale'; x.fillStyle = sale ? 'rgba(12,40,22,0.94)' : 'rgba(52,10,10,0.94)'; x.fillRect(0, 0, w, h); x.strokeStyle = sale ? '#3aff7a' : '#ff4a3a'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6);
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = sale ? '#d4ffe0' : '#ffd6d0'; x.font = `bold ${sale ? 64 : 54}px Georgia, serif`; x.fillText(text, w / 2, sale ? 62 : h / 2, w - 30);
      if (sale) { x.font = '26px Arial, sans-serif'; x.fillStyle = '#9fe0b4'; x.fillText('Original · scan to add to cart', w / 2, 114, w - 30); } });
    const m = plane(LABEL_W, LABEL_H, new THREE.MeshBasicMaterial({ map: t, transparent: true, depthTest: true })); m.userData.box = 1; return (labels[k] = m); }
  function showFor(p, kind) {
    if (S.labelFor === p && S.kind === kind) return; hideLabel();
    const e = shopEntry(p.data.slug), text = kind === 'sale' ? money(e.p) : 'Not for sale';
    if (window.__shopSoftGlow && !glow.userData.soft) { // #301 (preview opt-in): a soft halo radiating from around the frame into the wall, same colours, additive, no lights
      const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), img = x.createImageData(256, 256);
      for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const u = Math.abs(i / 127.5 - 1), v = Math.abs(j / 127.5 - 1), k = 0.62, du = Math.max(0, (u - k) / (1 - k)), dv = Math.max(0, (v - k) / (1 - k)), d = Math.min(1, Math.hypot(du, dv)), a = Math.pow(1 - d, 2.2) * (u < k && v < k ? 0.55 : 1); const o = (j * 256 + i) * 4; img.data[o] = img.data[o + 1] = img.data[o + 2] = 255; img.data[o + 3] = Math.round(a * 255); }
      x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); glow.material = new THREE.MeshBasicMaterial({ color: 0x2bff6a, map: t, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }); glow.userData.soft = true; }
    glow.material.color.setHex(kind === 'nfs' ? 0xff2a1a : 0x2bff6a);
    if (glow.userData.soft) { const m = 0.62, pw = p.w + 0.07, ph = p.h + 0.07, gw = pw / m, gh = ph / m, e = 0.32; glow.scale.set(gw, gh, 1); void e; glow.position.set(0, 0, -0.004); } // halo fades out ~0.3 m past the frame, behind the plaques
    else { glow.scale.set(p.w + 0.07, p.h + 0.07, 1); glow.position.set(0, 0, 0.001); }
    p.group.add(glow); glow.visible = true;
    const lab = labelMesh(kind, text), hud = hudRects();
    const P = (acc, free) => { S.labelPass = free; try { return place(p, LABEL_W, LABEL_H, ['up', 'r', 'l'], acc); } finally { S.labelPass = false; } };
    const clear = (x, y) => !hud.some(R => overlapScreen(screenRect(p, x, y, LABEL_W, LABEL_H), R));
    const spot = P(clear, false) || P(clear, true) || P(null, true); // on the wall if it can, else floating just off it (labels need no wall behind)
    if (spot) { lab.position.set(spot.x, spot.y, 0.07); p.group.add(lab); p.priceBox = lab; S.label = lab; }
    S.labelFor = p; S.kind = kind; S.labelSpot = spot;
  }
  function hideLabel() { if (S.label) { S.label.parent && S.label.parent.remove(S.label); if (S.labelFor) S.labelFor.priceBox = null; } S.label = null; S.labelFor = null; S.kind = null; if (glow.parent) glow.parent.remove(glow); glow.visible = false; }
  // HUD boxes on screen (buttons, pills, sticks, tool bar): a label must not land under them
  function hudRects() { const out = []; for (const e of document.querySelectorAll('body *')) { if (e.tagName === 'CANVAS') continue; const st = getComputedStyle(e); if (st.position !== 'fixed' && st.position !== 'absolute') continue; if (st.display === 'none' || st.visibility === 'hidden' || +st.opacity === 0) continue;
    const b = e.getBoundingClientRect(); if (b.width < 4 || b.height < 4 || b.width > innerWidth * 0.9 || b.height > innerHeight * 0.9) continue; if (!e.textContent.trim() && st.backgroundColor === 'rgba(0, 0, 0, 0)' && st.borderStyle === 'none') continue; out.push([b.left, b.top, b.right, b.bottom]); } return out; }
  function screenRect(p, x, y, w, h) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; p.group.updateWorldMatrix(true, false); camera.updateMatrixWorld();
    for (const [a, b] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) { v.set(x + a * w, y + b * h, 0.07).applyMatrix4(p.group.matrixWorld).project(camera); const sx = (v.x + 1) / 2 * innerWidth, sy = (1 - v.y) / 2 * innerHeight; x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy); }
    return [x0, y0, x1, y1]; }
  const overlapScreen = (A, B) => A[0] < B[2] + 6 && A[2] > B[0] - 6 && A[1] < B[3] + 6 && A[3] > B[1] - 6;
  const ray = new THREE.Raycaster(), c0 = new THREE.Vector2(0, 0);
  function aimAt(targets) {
    camera.updateMatrixWorld(); ray.setFromCamera(c0, camera); ray.far = 30;
    const prev = S.previews.filter(p => p.preview.visible && p === S.active).flatMap(p => p.preview.children.filter(m => m.userData.print));
    const h = ray.intersectObjects([...targets, ...prev], false)[0]; if (!h) return null;
    if (h.object.userData.print) return { kind: 'print', p: h.object.userData.print, entry: h.object.userData.print.preview.userData.entry };
    const p = h.object.userData.p; if (!p) return null; const e = shopEntry(p.data.slug);
    return { kind: p.data.status === 'available' && e && e.p ? 'sale' : 'nfs', p };
  }
  let aimT = 0, lastPrint = null; S.active = null; S.keepUntil = 0; S.hover = false;
  const HOLD = 1200; // ms the print copy stays after laser and cursor have both left
  function activate(p) { if (S.active === p) return; if (S.active && S.active.preview) S.active.preview.visible = false; S.active = null;
    if (!p || p.state !== 'wall') return; const e = shopEntry(p.data.slug); if (!e || !e.pr) return; if (!S.built.has(p)) buildPreview(p); if (p.preview) { p.preview.visible = true; S.active = p; } }
  // mouse (pointer not locked) and touch: hovering the copy or its label keeps it; click / tap on it adds the print
  const mray = new THREE.Raycaster(), mv = new THREE.Vector2(); mray.layers.enableAll(); // the copy is on the true-colour layer
  function previewAt(cx, cy) { if (!S.active || !S.active.preview || !S.active.preview.visible) return null; mv.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); camera.updateMatrixWorld(); mray.setFromCamera(mv, camera);
    const h = mray.intersectObjects(S.active.preview.children.filter(m => m.userData.print), false)[0]; return h ? { kind: 'print', p: S.active, entry: S.active.preview.userData.entry, label: !!h.object.userData.label } : null; }
  const add = a => { if (window.__buyPrint) window.__buyPrint(a); S.added = (S.added || 0) + 1; };
  document.addEventListener('pointerlockchange', () => { if (document.pointerLockElement) S.hover = false; }); // the laser takes over from the cursor
  let touchAt = -1e9; // compatibility mouse events after a tap must not count as hovering
  addEventListener('mousemove', e => { if (document.pointerLockElement || performance.now() - touchAt < 1000) return; const a = previewAt(e.clientX, e.clientY); S.hover = !!a; if (a) S.keepUntil = performance.now() + HOLD; }, { passive: true });
  addEventListener('pointerdown', e => { if (document.pointerLockElement || e.pointerType !== 'mouse' || e.button !== 0) return; const a = previewAt(e.clientX, e.clientY); if (a) { e.stopImmediatePropagation(); e.preventDefault(); add(a); S.keepUntil = performance.now() + HOLD; } }, true);
  let tt = null; addEventListener('touchstart', e => { touchAt = performance.now(); const t = e.changedTouches[0]; tt = t ? { x: t.clientX, y: t.clientY, at: performance.now() } : null; const a = t && previewAt(t.clientX, t.clientY); if (a) { S.hover = true; S.keepUntil = performance.now() + HOLD; } }, { passive: true, capture: true });
  addEventListener('touchend', e => { touchAt = performance.now(); S.hover = false; const t = e.changedTouches[0]; if (!tt || !t || performance.now() - tt.at > 500 || Math.hypot(t.clientX - tt.x, t.clientY - tt.y) > 18) return; const a = previewAt(t.clientX, t.clientY); S.hover = false; if (a) { e.stopPropagation(); add(a); S.keepUntil = performance.now() + HOLD; } }, { capture: true });
  function update(dt, scannerOn, targets) {
    const now = performance.now();
    if (S.active && (S.active.state !== 'wall' || !S.active.group.visible)) activate(null);
    if (S.active && now > S.keepUntil && !S.hover) activate(null);
    if (S.active) S.active.preview.userData.expand(S.hover || (S.aim && S.aim.kind === 'print'));
    if (!scannerOn) { if (S.aim) { S.aim = null; hideLabel(); if (lastPrint) { lastPrint.preview.userData.glow.visible = false; lastPrint = null; } } return; }
    if (now - aimT < 80) return; aimT = now;
    const a = aimAt(targets); S.aim = a;
    if (a && (a.kind === 'print' || a.kind === 'sale' || a.kind === 'nfs')) { if (a.kind !== 'print') activate(a.p); if (S.active === a.p) S.keepUntil = now + HOLD; }
    if (lastPrint && (!a || a.p !== lastPrint || a.kind !== 'print')) { lastPrint.preview.userData.glow.visible = false; lastPrint = null; }
    if (!a) { hideLabel(); return; }
    if (a.kind === 'print') { hideLabel(); a.p.preview.userData.glow.visible = true; lastPrint = a.p; return; }
    showFor(a.p, a.kind);
    if (S.label && now - (S.hudT || 0) > 500) { S.hudT = now; const L = S.label.position, R = screenRect(S.labelFor, L.x, L.y, LABEL_W, LABEL_H); if (hudRects().some(H => overlapScreen(R, H))) { const p = S.labelFor, k = S.kind; hideLabel(); showFor(p, k); } }
  }
  const api = { update, state: S, get aim() { return S.aim; }, beamColor: () => !S.aim ? null : S.aim.kind === 'nfs' ? 0xff2010 : 0x40ff70,
    hudRects, screenRect, buildAll: () => { for (const p of paintings) if (!S.built.has(p) && p.state === 'wall') buildPreview(p); return S.previews.length; }, activate, previewAt, HOLD, obstacles, overlaps: hit, onWall,
    printAt: targets => { const a = aimAt(targets); return a && a.kind === 'print' ? a : null; }, money, shopEntry, version: SHOP.v };
  window.__shopScan = api; return api;
}
