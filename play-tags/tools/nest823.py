# #823 = tracker #786 (TJ walk notes Oct 28 2026 ~5:33-5:37 PM PT) on LIVE #822 (dfd01581 / index-BsWWnu4I.js):
# (1) plinth faces the Reflections on Time cover, (2) START maps stop: hex wall map then world/testimonials map, (3) firmer wall-side strafe,
# (4) Kinoteka stop tows up the steps inside the hall, (5) remesh to trimmed maeve-walk-2 (45 clips, soft-pass cuts). Idempotent; backups /tmp/*.822.
import json, os, shutil, re
for s in ('src/catalog.json','src/tour.js','src/tour-manifest.json'):
    d='/tmp/'+os.path.basename(s)+'.822'
    if not os.path.exists(d): shutil.copy(s,d)
assert 'index-BsWWnu4I.js' in open('/tmp/execute.js.822').read(), 'rollback backup is not #822'
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (822,823), T['nest']
W=json.load(open('/tmp/wm823.json')); assert W['clip_count']==45 and len(W['clips'])==45
CUT=W['cut_soft_pass']; assert set(CUT)=={'stop-07-pass-paul-fountain','walk-04-to-05','walk-12-to-13','walk-21-to-22'}
assert not any(k['id'] in CUT for k in W['clips'])
ty=lambda i: {'00-welcome':'welcome','01-offer':'offer','02-controls':'controls'}.get(i) or i.split('-')[0]
clips=[dict(order=k['seq'],seq=k['seq'],file=k['file'],room_stop=k['id'],type=ty(k['id']),transcript=k['transcript'],duration_s=k['duration_s']) for k in W['clips']]
spoken=round(sum(k['duration_s'] for k in clips),2); B2='https://img.tjm.art/play/tour/maeve-walk-2/'
old=json.load(open('/tmp/tour-manifest.json.822')); oldseq={k['room_stop']:k['seq'] for k in old['clips']}
newseq={k['room_stop']:k['seq'] for k in clips}
M=dict(voice='Maeve (soft Irish)',voiceId=W['voiceId'],model=W['model'],speed=W['speed'],base_url=B2,pack=W['pack'],route819='24 stops walk script 2026-10-28 -> Kinoteka',remesh784='maeve-walk-2 (stop-20 Portraits and Studies)',remesh786='maeve-walk-2 trimmed: 45 clips, soft-pass cuts '+', '.join(CUT),cut_soft_pass=CUT,spoken_total_s=spoken,clips=clips)
open('src/tour-manifest.json','w').write(json.dumps(M,ensure_ascii=False,indent=1))
t=open('src/tour.js').read()
# ---- (5) STOPS keys -> new seq (by clip id); drop cut stop
m=re.search(r"const STOPS = \{.*?\n(?=for \(const k in STOPS\))",t,re.S); blk=m.group(0)
if 'maps: [' not in blk:
    o2id={v:k for k,v in oldseq.items()}
    def rk(mm):
        k=int(mm.group(2)); cid=o2id[k]
        if cid in CUT: return None
        return mm.group(1)+str(newseq[cid])+': {'
    lines=[]
    for ln in blk.split('\n'):
        mm=re.match(r"^(\s+)(\d+): \{",ln)
        if mm:
            r=rk(mm)
            if r is None: continue
            ln=r+ln[mm.end():]
        lines.append(ln)
    blk='\n'.join(lines)
    blk=blk.replace("  3: { here: 1 },","  3: { maps: [[0, 'wall'], [0.47, 'testi']] }, /* #786: hex gallery map, then (at 'And here') the world exhibitions map */")
    blk=blk.replace("{ at: [12.375, 7.145, 0.866, 0.5, 3.2] }, /* #783: Reflections on Time lectern (room-02 centre), not the checkout shaft */",
      "{ at: [12.375, 7.145, -0.866, -0.5, 3.0] }, /* #786: face the cover - lectern yaw -120 deg tilts its desk toward (-0.866,-0.5); #783 stood behind it */")
    blk=blk.replace("{ kino: 'kinoteka' } };","{ kino: 'kinoteka', inside: 1 } }; /* #786: up the steps into the hall */")
    t=t[:m.start()]+blk+t[m.end():]
blk=re.search(r"const STOPS = \{.*?\n(?=for \(const k in STOPS\))",t,re.S).group(0)
keys={int(k) for k in re.findall(r"^\s+(\d+): \{",blk,re.M)}; stops={k['seq'] for k in clips if k['type']=='stop'}
assert len(stops)==23 and keys==stops, ('STOPS/clip mismatch', keys^stops)
assert "31: { at: [12.375, 7.145, -0.866, -0.5, 3.0] }" in blk and "44: { kino: 'kinoteka', inside: 1 }" in blk and "'Tipi'" not in blk
# ---- (2) maps view
MV="""    if (st.maps) { const b = st.beat || 0, want = st.maps[b] && st.maps[b][1], wm = window.__wallMap, tm = window.__testiMap; /* #786 maps stop; fail soft when a map is not installed yet */
      let pick = want === 'testi' ? (tm && tm.stand && tm.face ? 'testi' : (wm && wm.stand ? 'wall' : null)) : (wm && wm.stand && wm.pos ? 'wall' : (tm && tm.stand && tm.face ? 'testi' : null));
      if (pick) { const s = pick === 'wall' ? V(wm.stand[0], 0, wm.stand[1]) : V(tm.stand[0], 0, tm.stand[1]), lk = pick === 'wall' ? V(wm.pos[0], 1.6, wm.pos[1]) : V(tm.face[0], 1.7, tm.face[1]), n = V(s.x - lk.x, 0, s.z - lk.z).normalize(); st.shown = pick; return { order, stand: s, look: lk, n, t: V(n.z, 0, -n.x), st, map: pick }; }
      const f = V(); camera.getWorldDirection(f); f.y = 0; f.normalize(); const s = V(camera.position.x, 0, camera.position.z); st.shown = null; return { order, stand: s, look: V(s.x + f.x * 4, 1.6, s.z + f.z * 4), n: f.clone().negate(), t: V(-f.z, 0, f.x), st, map: null }; }
"""
A="    if (st.kino) {"
if 'st.maps) {' not in t: t=t.replace(A,MV+A,1)
# ---- (4) kino inside
KI="""    if (st.kino && st.inside) { const k = (LT0.openCourts || []).find(o => o.id === st.kino), K = k && k.kino800; if (K) { const W = world(), D = K.D, F = K.f, U = K.t, P = (u, v) => V(D[0] + F[0] * v + U[0] * u, 0, D[1] + F[1] * v + U[1] * u), fy = K.rise || 0; /* #786: stand inside the hall (centre aisle, past the kiosk), facing the screen with the kiosk on the right */
      const look = P(-1.2, 22); look.y = fy + 2.2; const n = V(-F[0], 0, -F[1]), t = V(n.z, 0, -n.x);
      for (const v of [13.2, 12.6, 14, 16]) for (const u of [0, 0.3, -0.3]) { const s = P(u, v); if (W.walkable(s.x, s.z) && (!W.clearAt || W.clearAt(s.x, s.z) >= 0.25)) return { order, stand: s, look, n, t, st, kinoIn: 1, kinoDoor: { out: P(0, -3.2), line: [P(0, -1), P(0, 1), P(0, 4), P(0, 7), P(0, 9.6), P(0, 11.05)] } }; } } }
"""
if 'st.kino && st.inside' not in t: t=t.replace(A,KI+A,1)
# ---- (3) strafe
o1="w = Math.min(1, Math.max(0.6, 1 - (rem - 3) / 12))"; n1="w = Math.min(1, Math.max(0.88, 1 - (rem - 5) / 10)) /* #786: firmer strafe - look locked on the art (floor 0.88, full within 5 m) */"
if o1 in t: t=t.replace(o1,n1)
o2="for (const o of [2.4, 1.8, 1.2]) { const x = r.x + r.x / rn * o"; n2="for (const o of [3.0, 2.4, 1.8, 1.2]) /* #786 farther out along the wall first */ { const x = r.x + r.x / rn * o"
if o2 in t: t=t.replace(o2,n2)
o3="Math.min(1, dt * (art ? 2.5 : 4))"; n3="Math.min(1, dt * (art ? 2.1 : 4))"
if o3 in t: t=t.replace(o3,n3)
# ---- (2) maps beats in the stop update + no early free on the maps stop
o4="    const sp = (S.view.st && S.view.st.spots) || [], f = clipTime() / st.clip.duration_s;\n"
n4=o4+"""    if (S.view.st && S.view.st.maps) { const ms = S.view.st.maps; let b = 0; for (let j = 0; j < ms.length; j++) if (f >= ms[j][0]) b = j; /* #786: hex map first, then the world map */
      if ((S.mapBeat ?? -1) !== b || (!S.view.map && ms[b] && (window.__wallMap || window.__testiMap) && !S.tow)) { S.mapBeat = b; S.view.st.beat = b; const v = viewFor(st.to); if (v && (v.map !== S.view.map || !S.tow)) { S.view = v; (S.mapLog = S.mapLog || []).push(v.map + '@' + f.toFixed(2)); if (Math.hypot(camera.position.x - v.stand.x, camera.position.z - v.stand.z) > 0.3) towTo(v, Math.max(1.5, (ms[b + 1] ? ms[b + 1][0] - f : 1 - f) * st.clip.duration_s * 0.6) / RATE); } }
      if (S.tow) { if (stepTow(dt)) frame(S.view, dt); } else frame(S.view, dt); if (clipDone()) { S.hold += dt; if (S.hold > 0.7 / RATE) { S.mapBeat = -1; next(); } } return; }
"""
if 'S.view.st.maps) { const ms' not in t: t=t.replace(o4,n4,1)
# maps walk-in uses beat 0
o5="    S.view = viewFor(st.to); if (!S.view)"
n5="    if (STOPS[st.to] && STOPS[st.to].maps) { STOPS[st.to].beat = 0; S.mapBeat = st.kind === 'stop' ? 0 : -1; } S.view = viewFor(st.to); if (!S.view)"
if 'STOPS[st.to].maps' not in t: t=t.replace(o5,n5,1)
o7="const path = ringPath(from, view.stand); const pts = [from, ...(path || []).map(q => V(q.x, 0, q.z)), view.stand];"
n7="const kd = view.kinoDoor, path = ringPath(from, kd ? kd.out : view.stand); const pts = [from, ...(path || []).map(q => V(q.x, 0, q.z)), ...(kd ? [kd.out, ...kd.line] : []), view.stand]; /* #786: world path to the foot of the Kinoteka steps, then straight up the centre aisle through the doors (all walkable) */"
if o7 in t: t=t.replace(o7,n7)
assert n7 in t
o8="    c.x = me.x; c.z = me.z; const D = drone();"
n8="    c.x = me.x; c.z = me.z; if (r.view && r.view.kinoIn) kinoEye(c, dt); const D = drone();"
if o8 in t: t=t.replace(o8,n8)
o9="  function stepTow(dt) {"
n9="  const KINO = ((LT0.openCourts || []).find(o => o.kino800) || {}).kino800; function kinoEye(c, dt) { if (!KINO) return; const v = (c.x - KINO.D[0]) * KINO.f[0] + (c.z - KINO.D[1]) * KINO.f[1], st = KINO.stairs || [7, 9.6], fl = Math.min(1, Math.max(0, (v - st[0]) / (st[1] - st[0]))) * (KINO.rise || 0); c.y += (fl + 1.6 - c.y) * Math.min(1, dt * 6); } /* #786: eye climbs the Kinoteka steps during the frozen tow (was 1.6 inside, then a pop) */\n"+o9
if 'function kinoEye' not in t: t=t.replace(o9,n9,1)
o10="  function frame(view, dt) { const c = camera.position,"
n10="  function frame(view, dt) { const c = camera.position; if (view.kinoIn) kinoEye(c, dt); const"
if o10 in t: t=t.replace(o10,n10,1)
for x in (n8,'function kinoEye',n10): assert x in t, x
# expose mapLog in state
o6="kind: S.cur && S.cur.kind }; } };"; n6="kind: S.cur && S.cur.kind, mapLog: (S.mapLog || []).slice() }; } };"
if o6 in t: t=t.replace(o6,n6)
for x in (n1,n2,n3,'S.view.st.maps) { const ms','STOPS[st.to].maps','mapLog: (S.mapLog','st.kino && st.inside','st.maps) { const b'): assert x in t, x
open('src/tour.js','w').write(t)
T['nest'].update(issue=823,prev=822,note823=('tracker #786: (1) plinth stop faces the Reflections on Time cover (at normal flipped to [-0.866,-0.5], 3.0 m); (2) START maps stop: hex wall map, then at 0.47 of the clip the world/testimonials map (fail-soft); '
 '(3) firmer strafe: look-to-art weight floor 0.88 (full within 5 m), ring vias 3.0/2.4/1.8/1.2 m, turn 2.1; (4) Kinoteka stop tows up the steps into the hall (centre aisle v~13 m, facing screen, kiosk on the right); '
 '(5) remesh maeve-walk-2 trimmed: 45 clips, %ss; soft-pass cuts %s (STOPS re-keyed, Paul fountain stop dropped); old packs untouched')%(spoken,', '.join(CUT)))
T['tour786']=dict(base=B2,pack=W['pack'],clips=45,spoken_s=spoken,cut_soft_pass=CUT,plinth=[12.375,7.145,-0.866,-0.5,3.0],maps=[[0,'wall'],[0.47,'testi']],strafe=dict(floor=0.88,full_m=5,vias=[3.0,2.4,1.8,1.2]),kino='inside hall')
T.setdefault('tour784',{}).update(clips=45,spoken_s=spoken,remesh786=True)
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
print('ok nest 823', spoken)
