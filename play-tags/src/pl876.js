// #876 4-band progressive painting textures + Friends Club mural 3-band loader
import * as THREE from 'three';
import TH876 from './thumbs876.json';

export function createPL876({ renderer, camera, paintings, BASE, sharp, LOW, PLACEHOLDER }) {
  const Dl = matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 820);
  const CD876 = /(^|\.)tjm\.art$/.test(location.hostname);
  const PH876 = (() => { const t = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); t.needsUpdate = true; t.userData.ph876 = 1; return t; })();
  const MOB = Dl || LOW;
  const BUDGET = (MOB ? 120 : 400) * 1048576;
  const TB = CD876 ? 'https://img.tjm.art/play/thumbs/' : '/play/thumbs/';
  const CAP = MOB ? 1024 : 0;
  const CONC = [8, 4, MOB ? 2 : 4, 1];
  const NEAR = [0, 15, 8, 3];
  const KEEP = [0, 25, 10, 4.5];
  const NM = ['tiny', 'base', 'hi', 'max'];
  const list = [], Q = [[], [], [], []], act = [0, 0, 0, 0], upQ = [];
  const st = { loads: [0, 0, 0, 0], fails: [0, 0, 0, 0], evict: 0, down: 0, up: 0, uploads: 0, ib: 0, img: 0, lat: [], peakMB: 0, skipBudget: 0 };
  let bytes = 0, IB = null;
  const est = (w, h) => w * h * 4 * 1.33;
  const camP = camera.position, fw = new THREE.Vector3(), tv = new THREE.Vector3();
  const maxOK = () => !MOB && renderer.capabilities.maxTextureSize >= 4096 && !window.__noMaxTex;

  (async () => {
    try {
      if (typeof createImageBitmap !== 'function') throw 0;
      const c = document.createElement('canvas'); c.width = 1; c.height = 2;
      const x = c.getContext('2d'); x.fillStyle = '#f00'; x.fillRect(0, 0, 1, 1); x.fillStyle = '#00f'; x.fillRect(0, 1, 1, 1);
      const bl = await new Promise(r => c.toBlob(r, 'image/png'));
      const b = await createImageBitmap(bl, { imageOrientation: 'flipY', premultiplyAlpha: 'none' });
      const d = document.createElement('canvas'); d.width = 1; d.height = 2;
      const y = d.getContext('2d'); y.drawImage(b, 0, 0);
      const px = y.getImageData(0, 0, 1, 1).data;
      b.close && b.close();
      IB = px[2] > 200 && px[0] < 60;
    } catch { IB = false; }
  })();

  function rurl(r) {
    if (!r) return null;
    if (CD876 || /^https:\/\/img\.tjm\.art\//.test(r)) return r;
    if (/^https:\/\/tjm\.art\//.test(r)) return '/tjm' + r.slice(15);
    if (/^https:\/\/media\.vermillionaurora\.com\//.test(r)) return '/mva' + r.slice(34);
    if (/^(art|img|mva|tjm)\//.test(r)) return BASE + r;
    return null;
  }

  function add(p) {
    const id = p.data.id, m = TH876[id];
    p.tx = [null, null, null, null]; p.want = 0; p.shown = -1; p.q = [0, 0, 0, 0]; p.bad = [0, 0, 0, 0];
    p.asp = m ? m[0] / m[1] : p.data.w / p.data.h;
    p.u = [
      m ? TB + 't128/' + id + '.webp' : p.baseUrl,
      m && m[2] ? TB + 'b256/' + id + '.webp' : p.baseUrl,
      rurl(p.data.hi) || (m && m[2] ? p.baseUrl : null),
      p.data.max || null
    ];
    p.sz = [
      m ? [Math.round(128 * m[0] / Math.max(m[0], m[1])), Math.round(128 * m[1] / Math.max(m[0], m[1]))] : [128, 128],
      m ? (m[2] ? [Math.round(256 * m[0] / Math.max(m[0], m[1])), Math.round(256 * m[1] / Math.max(m[0], m[1]))] : [m[0], m[1]]) : [256, 256],
      MOB ? [1024, 768] : [1600, 1200],
      [2400, 1800]
    ];
    list.push(p);
    enq(p, 0);
  }

  function enq(p, b) {
    if (p.tx[b] || p.q[b] || p.bad[b] > 1 || !p.u[b]) return;
    p.q[b] = 1;
    Q[b].push(p);
  }

  async function decode(url, cap) {
    const t0 = performance.now();
    let r;
    try { r = await fetch(url, { mode: 'cors', credentials: 'omit' }); } catch { r = null; }
    if (!r || !r.ok) throw new Error('http ' + (r && r.status));
    const bl = await r.blob();
    if (IB) {
      let bm = await createImageBitmap(bl, { imageOrientation: 'flipY', premultiplyAlpha: 'none' });
      if (cap && Math.max(bm.width, bm.height) > cap) {
        const k = cap / Math.max(bm.width, bm.height);
        const b2 = await createImageBitmap(bm, { resizeWidth: Math.max(1, Math.round(bm.width * k)), resizeHeight: Math.max(1, Math.round(bm.height * k)), resizeQuality: 'high' });
        bm.close(); bm = b2;
      }
      st.ib++;
      return { img: bm, flip: false, ms: performance.now() - t0 };
    }
    const u = URL.createObjectURL(bl);
    try {
      const im = new Image(); im.crossOrigin = 'anonymous'; im.src = u;
      await im.decode();
      let out = im;
      if (cap && Math.max(im.width, im.height) > cap) {
        const k = cap / Math.max(im.width, im.height), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        out = c;
      }
      st.img++;
      return { img: out, flip: true, ms: performance.now() - t0 };
    } finally { URL.revokeObjectURL(u); }
  }

  function mk(r, p, b) {
    const t = new THREE.Texture(r.img);
    sharp(t);
    t.flipY = r.flip;
    t.userData.b876 = est(r.img.width, r.img.height);
    if (b <= 1) t.userData.asp876 = p.asp;
    return t;
  }

  function free(t) {
    if (!t || t.userData.ph876) return;
    bytes -= t.userData.b876 || 0;
    t.dispose();
    const im = t.image;
    if (im && im.close && t.userData.close876) try { im.close(); } catch {}
  }

  function setMap(p, b) {
    const t = p.tx[b]; if (!t) return;
    const m = p.mesh.material;
    if (m.map !== t) { const f = !m.map; m.map = t; m.color.set(0xffffff); if (f) m.needsUpdate = true; }
    p.shown = b;
    p.baseTex = p.tx[1] || p.tx[0];
    p.hiTex = p.tx[3] || p.tx[2] || null;
    p.maxTex = p.tx[3] ? 1 : 0;
    p.hi = p.hiTex ? 1 : 0;
    p.base = p.tx[1] ? 1 : 0;
    p.band876 = NM[b];
  }

  function best(p, lim) { for (let b = lim; b >= 0; b--) if (p.tx[b]) return b; return -1; }

  function drop(p, b) {
    const t = p.tx[b]; if (!t) return;
    p.tx[b] = null;
    if (p.shown === b) {
      const k = best(p, b - 1);
      if (k >= 0) setMap(p, k);
      else { p.mesh.material.map = null; p.mesh.material.needsUpdate = true; p.mesh.material.color.set(PLACEHOLDER); p.shown = -1; }
    } else if (p.shown >= 0) setMap(p, p.shown);
    free(t);
    st.down++;
  }

  function fit(need, p) {
    if (bytes + need <= BUDGET) return true;
    const c = [];
    for (const o of list) if (o !== p) for (let b = 3; b >= 1; b--) if (o.tx[b]) c.push([o, b, o.dist]);
    c.sort((a, b) => b[2] - a[2] || b[1] - a[1]);
    for (const [o, b, d] of c) {
      if (bytes + need <= BUDGET) break;
      if (d <= p.dist + 0.5) break;
      drop(o, b);
      if (o.want >= b) o.want = b - 1;
      (o.evD || (o.evD = [0, 0, 0, 0]))[b] = o.dist;
      st.evict++;
    }
    return bytes + need <= BUDGET;
  }

  function pump() {
    if (IB === null) return;
    for (let b = 0; b < 4; b++) {
      const q = Q[b];
      if (q.length > 1) q.sort((x, y) => x.pri - y.pri);
      while (act[b] < CONC[b] && q.length) {
        const p = q.shift(); p.q[b] = 0;
        if (b > 0 && (p.want < b || p.tx[b])) continue;
        const need = est(p.sz[b][0], p.sz[b][1]);
        if (b > 0 && !fit(need, p)) { st.skipBudget++; continue; }
        act[b]++;
        const t0 = performance.now();
        decode(p.u[b], b >= 2 ? CAP : 0).then(r => {
          act[b]--; upQ.push({ p, b, r, t0 }); pump();
        }, () => {
          act[b]--; p.bad[b]++; st.fails[b]++;
          if (p.bad[b] < 2) setTimeout(() => enq(p, b), 800);
          pump();
        });
      }
    }
  }

  function upFrame() {
    requestAnimationFrame(upFrame);
    let small = 0, big = 0;
    while (upQ.length && small < 4 && big < 1) {
      const it = upQ.shift(), p = it.p, b = it.b;
      if (p.tx[b] || (b > 0 && p.want < b)) { it.r.img.close && it.r.img.close(); continue; }
      const t = mk(it.r, p, b);
      t.userData.close876 = b >= 2;
      renderer.initTexture(t);
      bytes += t.userData.b876;
      st.peakMB = Math.max(st.peakMB, bytes / 1048576);
      p.tx[b] = t; st.loads[b]++; st.uploads++;
      if (b >= 2) { big++; st.lat.push(Math.round(performance.now() - it.t0)); if (st.lat.length > 40) st.lat.shift(); } else small++;
      if ((b > p.shown && b <= Math.max(p.want, 0)) || p.shown < 0) setMap(p, b);
      if (b === 3 && p.tx[2]) drop(p, 2);
      if (bytes > BUDGET) fit(0, { dist: -1 });
    }
  }
  requestAnimationFrame(upFrame);

  function update() {
    const e = camP, dir = camera.getWorldDirection(fw), mx = maxOK();
    for (const p of list) {
      if (p.state !== 'wall' && p.state !== undefined) continue;
      const d = p.dist - p.w / 2;
      let w = d < NEAR[3] && mx && p.u[3] ? 3 : d < NEAR[2] && p.u[2] ? 2 : d < NEAR[1] ? 1 : 0;
      const c = p.want;
      if (c >= 3 && d < KEEP[3] && mx && p.u[3]) w = Math.max(w, 3);
      if (c >= 2 && d < KEEP[2] && p.u[2]) w = Math.max(w, 2);
      if (c >= 1 && d < KEEP[1]) w = Math.max(w, 1);
      if (p.tourPin) w = Math.max(w, p.u[2] ? 2 : 1);
      if (p.evD) for (; w > 0; w--) { const ev = p.evD[w]; if (!ev) break; if (p.dist < ev - 1.5 || bytes < BUDGET * 0.7) { p.evD[w] = 0; break; } }
      if (w > c) st.up++;
      p.want = w;
      tv.copy(p.group.position).sub(e);
      p.pri = p.tourPin ? d - 1e3 : tv.dot(dir) > 0 ? d * 0.6 : d * 1.4;
      enq(p, 0);
      if (w > 0) enq(p, w);
      if (p.shown > w) {
        const k = best(p, w);
        if (k >= 0) { for (let b = 3; b > w; b--) if (p.tx[b]) drop(p, b); } else enq(p, 0);
      } else if (p.shown < w) {
        const k = best(p, w);
        if (k > p.shown) setMap(p, k);
      }
    }
    pump();
    let done = 0;
    for (const p of list) if (p.shown >= 0) done++;
    window.__tagsLoad = { done, queued: Q[0].length + Q[1].length + Q[2].length + Q[3].length, active: act[0] + act[1] + act[2] + act[3], total: paintings.length, resident: done, cap: 0 };
  }

  function stats() {
    const c = [0, 0, 0, 0], r = [0, 0, 0, 0];
    for (const p of list) { if (p.shown >= 0) c[p.shown]++; for (let b = 0; b < 4; b++) if (p.tx[b]) r[b]++; }
    return { n: list.length, shown: { tiny: c[0], base: c[1], hi: c[2], max: c[3] }, resident: { tiny: r[0], base: r[1], hi: r[2], max: r[3] }, paintMB: +(bytes / 1048576).toFixed(1), budgetMB: BUDGET / 1048576, mobile: MOB, ib: IB, queued: Q.map(q => q.length), active: act.slice(), ...st, lat: st.lat.slice(-12) };
  }

  async function loadTex(url, cap) {
    const r = await decode(url, cap || 0), t = new THREE.Texture(r.img);
    t.flipY = r.flip; t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
    t.anisotropy = MOB ? 2 : 8; t.needsUpdate = true;
    t.userData.b876 = est(r.img.width, r.img.height);
    return t;
  }

  /* Friends Club mural (3528x784): tiny 256 px at boot -> 1024 px within 40 m -> full within 14 m (back down at 20 m / 50 m). */
  window.__mural876 = (dt, K, C, c, at) => {
    const u = [
      'https://img.tjm.art/play/thumbs/mural/friends-club-mural-256.webp',
      'https://img.tjm.art/play/thumbs/mural/friends-club-mural-1024.webp',
      /^(https?:)?\/\//.test(dt.tex) ? dt.tex : '/play/' + dt.tex
    ].map(x => CD876 ? x : x.replace('https://img.tjm.art/', '/play/img/'));
    const L = { lvl: -1, want: 0, t: [null, null, null], busy: [0, 0, 0], near: false }, rec = c.find(q => q.m === K);
    at.lod = 'tiny';
    const show = b => {
      const t = L.t[b]; if (!t) return;
      if (K.material.map !== t) { const first = !K.material.map; K.material.map = t; K.material.color.set(0xffffff); if (first) K.material.needsUpdate = true; }
      L.lvl = b; at.lod = ['tiny', 'mid', 'full'][b]; at.image = [t.image.width, t.image.height];
      for (let k = 1; k < 3; k++) if (k > b && L.t[k] && k > L.want) { L.t[k].dispose(); L.t[k].image && L.t[k].image.close && L.t[k].image.close(); L.t[k] = null; }
    };
    const get = b => {
      if (L.t[b] || L.busy[b]) return;
      L.busy[b] = 1;
      loadTex(u[b], b === 2 && MOB ? 2048 : 0).then(t => {
        L.busy[b] = 0; renderer.initTexture(t); L.t[b] = t;
        if ((b === 0 && !K.material.map) || (b <= L.want && b > L.lvl)) show(b);
      }, e => { L.busy[b] = 0; console.warn('[mural876]', u[b], e && e.message); });
    };
    L.band876 = a => {
      let w = a < 14 ? 2 : a < 40 ? 1 : 0;
      if (L.want >= 2 && a < 20) w = 2; else if (L.want >= 1 && a < 50) w = Math.max(w, 1);
      L.want = w; get(0); if (w > 0) get(w);
      const k = L.t[w] ? w : (L.t[1] && w >= 1 ? 1 : 0);
      if (L.t[k] && k !== L.lvl) show(k);
    };
    if (rec) { rec.lod = L; rec.rec = at; }
    const Z = 3528 / 784, mt = C.w / C.h; at.image = [3528, 784];
    if (Math.abs(Z / mt - 1) > 0.03) { at.mismatch = true; if (Z > mt) K.scale.set(C.w, C.w / Z, 1); else K.scale.set(C.h * Z, C.h, 1); }
    get(0);
    const cp = camera.position;
    L.band876(Math.hypot(cp.x - C.x, cp.z - C.z));
    return true;
  };

  const api = { add, update, stats, loadTex, PH876, get list() { return list; }, get bytes() { return bytes; } };
  window.__pl876 = api;
  return api;
}
