# #821 = tracker #783 (TJ Oct 28 2026): no CLICK TO ENTER gate (tags-only listener in gallery-core + tour finish), stop 34 -> Reflections on
# Time lectern in room-02, tow strafes facing the art + wall-side CCW ring vias, room-06 label -> Portraits and Studies. Idempotent; backups /tmp/*.820.
import json, os, shutil
CORE='/workspace/gallery-core/src/main.js'
for s in ('src/catalog.json','src/catalog.base.json','src/tour.js','src/escortCaptions355.js',CORE):
    d='/tmp/'+os.path.basename(s)+'.820'
    if not os.path.exists(d): shutil.copy(s,d)
assert 'index-B0Gk9C5W.js' in open('/tmp/execute.js.820').read()
def rep(F,R):
    t=open(F).read()
    for a,b in R:
        if b not in t: assert t.count(a)==1,(F,a[:60]); t=t.replace(a,b)
    open(F,'w').write(t)
U="controls.addEventListener('unlock', () => { if (!window.__test && !window.__reading) start.style.display = 'flex'; });"
rep(CORE,[(U, U+"\n//#if tags\n{ /* #783 (TJ): open with controls active, no CLICK TO ENTER gate. Hide #start once loaded; an unlock never brings it back (index.html gates hint + body click re-acquire look). */\n  controls.addEventListener('unlock', () => { start.style.display = 'none'; });\n  const t0783 = performance.now(), hide783 = () => { const p = document.getElementById('tags-progress'); if (window.game && ((p && p.classList.contains('done')) || performance.now() - t0783 > 15000)) { start.style.display = 'none'; window.__noEnter783 = 1; return; } requestAnimationFrame(hide783); }; requestAnimationFrame(hide783); }\n//#endif")])
F='src/tour.js'
rep(F,[("  34: { at: [0, 0, 0.866, 0.5, 3.2] },","  34: { at: [12.375, 7.145, 0.866, 0.5, 3.2] }, /* #783: Reflections on Time lectern (room-02 centre), not the checkout shaft */"),
 ("    if (!touch && !window.__test) { const s = document.getElementById('start'); if (s) s.style.display = 'flex'; } }","    /* #783: no CLICK TO ENTER after the tour; the gates hint / body click re-acquires look */ }"),
 ("      .map(r => { for (const rr of [0, 0.6, 1.2, 1.8, 2.4])","      .map(r => { const rn = Math.hypot(r.x, r.z) || 1; for (const o of [2.4, 1.8, 1.2]) { const x = r.x + r.x / rn * o, z = r.z + r.z / rn * o; if (W.walkable(x, z) && (!W.clearAt || W.clearAt(x, z) >= 0.5)) return V(x, 0, z); } /* #783: wall-side pass (outer half of the room), no zigzag through the middle */ for (const rr of [0, 0.6, 1.2, 1.8, 2.4])"),
 ("let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;","let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; if (d < -Math.PI + 0.35) d += 2 * Math.PI; /* #783: near-ties take the CCW arc */"),
 ("    if (r.L - r.s > 0.25) { const lk = V(ahead.x, c.y - 0.05, ahead.z); if (lk.distanceTo(c) > 0.3) camera.quaternion.slerp(qLook(c, lk), Math.min(1, dt * 4)); }",
  "    if (r.L - r.s > 0.25) { const st = r.view && r.view.st, art = st && !st.here && !st.kino && r.view.look; let lk = V(ahead.x, c.y - 0.05, ahead.z);\n      if (art) { /* #783: strafe - keep facing the destination art while the path carries us; mild look-ahead only on legs without a wall target */ const rem = r.L - r.s, w = Math.min(1, Math.max(0.6, 1 - (rem - 3) / 12)), da = V(ahead.x - me.x, 0, ahead.z - me.z), dl = V(r.view.look.x - me.x, 0, r.view.look.z - me.z); if (da.lengthSq() > 1e-6) da.normalize(); if (dl.lengthSq() > 1e-6) dl.normalize(); const dir = da.multiplyScalar(1 - w).add(dl.multiplyScalar(w)); if (dir.lengthSq() < 0.04) dir.copy(dl); dir.normalize(); lk = V(c.x + dir.x * 4, c.y - 0.05, c.z + dir.z * 4); }\n      if (lk.distanceTo(c) > 0.3) camera.quaternion.slerp(qLook(c, lk), Math.min(1, dt * (art ? 2.5 : 4))); const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ'); e.z = 0; camera.quaternion.setFromEuler(e); }")])
rep('src/escortCaptions355.js',[("Okay, I'll take you to the Catherine dance gallery.","Okay, I'll take you to Portraits and Studies.")])
B='src/catalog.base.json'; b=open(B).read()
for a in ('Catherine dance series \\u00b7 Portrait','Catherine dance series · Portrait'):
    b=b.replace('"'+a+'"','"Portraits and Studies"')
open(B,'w').write(b)
for F in ('src/catalog.json',):
    c=json.load(open(F)); T=c['layout']['tags']
    for r in T['rooms']:
        if r['id']=='room-06': r['label']='Portraits and Studies'
    if F=='src/catalog.json':
        assert T['nest']['issue'] in (820,821)
        T['nest'].update(issue=821,prev=820,note821='tracker #783: no CLICK TO ENTER gate (controls active on open, unlock/tour end never restore it); stop-17 Reflections on Time plinth stop 34 -> room-02 lectern [12.375,7.145]; tour tow strafes facing the art with wall-side CCW ring vias; room-06 renamed Portraits and Studies')
    open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
print('ok nest 821')
