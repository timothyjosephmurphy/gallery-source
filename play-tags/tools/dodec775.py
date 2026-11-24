# #775 (TJ-approved Oct 27 2026 ~1:15 PM PT): dodecagon. Open 12-gon plaza (R 10) + ONE ring of 12 wedge rooms (isosceles trapezoids
# between concentric 12-gons, outer R 22.25). Doors 2.4 m to the plaza, 1.6 m to each neighbour; H11 Portrait outer door 2.4 m into the
# Friends outer court (14 x 12 m). Geometry: gallery-tj-feedback/hex-plan-dodec/plan-dodec.json. Runs on src/catalog.json from the
# #774/B2a honeycomb catalog (LIVE d701a4a8). Hang: per room, the works keep their order (old wall, then left->right) in clusters
# (grids/stacks/sets/plaques move as one rigid block) and are re-laid along the wedge's hang runs: outer wall first (set pieces pinned
# there: Syrenka trio in H10, Forest Triptych in H2), then both radial walls, then the plaza-wall stubs. Usage: python3 tools/dodec775.py [art]
import json, math, sys
CAT = 'src/catalog.json'; c = json.load(open(CAT)); T = c['layout']['tags']
PLAN = json.load(open('/workspace/gallery-tj-feedback/hex-plan-dodec/plan-dodec.json'))
def dot(a, b): return a[0] * b[0] + a[1] * b[1]
ROOM = {r['id']: r for r in T['rooms']}; LP = {p['id']: p for p in T['paintings']}
if sys.argv[1:] == ['art']:  # after tools/outerslots.mjs: exterior boards/murals onto their outer-wall slots
    SL = json.load(open('src/outer-slots.json'))['slots']; fc = T['outerCourts'][0]
    def at(s, off): return dict(x=round(s['mid'][0] + s['t'][0] * (s['s'] + off) + s['n'][0] * 0.06, 3), z=round(s['mid'][1] + s['t'][1] * (s['s'] + off) + s['n'][1] * 0.06, 3), wallFacing=s['n'])
    for a in fc['art']:
        if a['id'] == 'cormorant-presiding-over-sunset-on-puget-sound': a.update(at(SL['cormorant'], 0), movedBy='#775 outer wall ' + SL['cormorant']['room'])
        elif a['id'] == 'cormorant-qr-brass-plaque': a.update(at(SL['corm-plates'], 0))
        elif a['id'] == 'friends-club-mural-teaser': a.update(at(SL['teaser'], 0), movedBy='#775 outer wall ' + SL['teaser']['room'])
        elif a['id'] == 'friends-club-teaser-plaque': a.update(at(SL['teaser-plaque'], 0))
    open(CAT, 'w').write(json.dumps(c, ensure_ascii=False, separators=(',', ':'))); print('art placed from outer-slots'); sys.exit()
assert T.get('dodec') is None, 'already dodec'
# ---- old wall frame for each work (hex rooms): k from the facing, apothem plane, tangent = viewer-right
def hexk(ix, iz): return max(range(6), key=lambda k: dot((math.cos(math.radians(60 * k)), math.sin(math.radians(60 * k))), (-ix, -iz)))
def oldframe(rid, k):
    r = ROOM[rid]; n = (math.cos(math.radians(60 * k)), math.sin(math.radians(60 * k))); t = (-n[1], n[0])
    foot = (r['center'][0] + r['apothem'] * n[0], r['center'][1] + r['apothem'] * n[1]); return foot, n, t
def local(foot, n, t, x, z): d = (x - foot[0], z - foot[1]); return dot(d, t), dot(d, n)
# ---- new geometry from the plan
HID = {p['hid']: p['id'] for p in PLAN['rooms']}; NEWP = {p['id']: [tuple(v) for v in p['poly']] for p in PLAN['rooms']}
RI, RO = PLAN['courtyard']['apothem_m'], PLAN['outer']['apothem_m']
def edges(rid):
    P = NEWP[rid]; cx = sum(p[0] for p in P) / 4; cz = sum(p[1] for p in P) / 4; out = []
    for k in range(4):
        A, B = P[k], P[(k + 1) % 4]; L = math.hypot(B[0] - A[0], B[1] - A[1]); t = ((B[0] - A[0]) / L, (B[1] - A[1]) / L); m = ((A[0] + B[0]) / 2, (A[1] + B[1]) / 2)
        n = (t[1], -t[0]); n = n if dot(n, (m[0] - cx, m[1] - cz)) > 0 else (-n[0], -n[1])
        tr = (-n[1], n[0]); s_sign = 1 if dot(tr, t) > 0 else -1  # viewer-right tangent
        rm = math.hypot(*m); kind = 'inner' if abs(rm - RI) < 0.3 else 'outer' if abs(rm - RO) < 0.3 else 'radial'
        Ain = A if kind != 'radial' else (A if math.hypot(*A) < math.hypot(*B) else B)
        out.append(dict(k=k, A=A, B=B, L=L, t=t, tr=tr, m=m, n=n, kind=kind, inner_end=Ain))
    return (cx, cz), out
GEO = {rid: edges(rid) for rid in NEWP}
def key(p): return (round(p[0], 2), round(p[1], 2))
EDGE_OWNER = {}
for rid, (_, E) in GEO.items():
    for e in E: EDGE_OWNER.setdefault(tuple(sorted([key(e['A']), key(e['B'])])), []).append((rid, e['k']))
NCD, CDW, ODW, CLR, CORNER = PLAN['rules']['neighborDoor_m'], PLAN['rules']['courtDoor_m'], 2.4, 0.2, 0.3
RAD_DOOR_C = 1.45  # neighbour door centre, metres from the plaza end of the radial wall (keeps the long outer part of the radial wall whole)
FC_ROOM = HID[PLAN['outerCourt']['portalRoom']]
DOORS = {rid: {} for rid in NEWP}  # k -> (offset along viewer-right tangent... stored along edge tangent t, width, to)
for rid, (C, E) in GEO.items():
    for e in E:
        if e['kind'] == 'inner': DOORS[rid][e['k']] = (0.0, CDW, 'courtyard')
        elif e['kind'] == 'outer' and rid == FC_ROOM: DOORS[rid][e['k']] = (0.0, ODW, 'outer')
        elif e['kind'] == 'radial':
            other = [o for o in EDGE_OWNER[tuple(sorted([key(e['A']), key(e['B'])]))] if o[0] != rid][0][0]
            P0 = e['inner_end']; u = (e['t'][0], e['t'][1]) if P0 == e['A'] else (-e['t'][0], -e['t'][1])
            dc = (P0[0] + u[0] * RAD_DOOR_C, P0[1] + u[1] * RAD_DOOR_C); off = dot((dc[0] - e['m'][0], dc[1] - e['m'][1]), e['t'])
            DOORS[rid][e['k']] = (off, NCD, other)
# ---- hang runs on each wall (inside face), in viewer-right coordinate s about the edge midpoint
def runs(rid):
    _, E = GEO[rid]; out = []
    for e in E:
        h = e['L'] / 2; cuts = []
        if e['k'] in DOORS[rid]: o, w, _ = DOORS[rid][e['k']]; o_r = o * dot(e['t'], e['tr']); cuts.append((o_r - w / 2 - CLR, o_r + w / 2 + CLR))
        a = -h + CORNER; segs = []
        for lo, hi in sorted(cuts): segs.append((a, lo)); a = hi
        segs.append((a, h - CORNER))
        for lo, hi in segs:
            if hi - lo > 0.4: out.append(dict(e=e, lo=lo, hi=hi))
    pri = {'outer': 0, 'radial': 1, 'inner': 2}; out.sort(key=lambda r: (pri[r['e']['kind']], -(r['hi'] - r['lo'])))
    return out
# ---- clusters per room (painting + plaque units; overlapping along the wall = one rigid block)
SET_IDS = {'room-10': {'honeybadger-and-cub-with-genesis-block', 'coined-in-watercolor-film-poster', 'warszawska-syrenka'},
           'room-02': {'older-work-forest-triptych-original-1', 'older-work-forest-triptych-original-2', 'older-work-forest-triptych-original-3'}}
def clusters(rid):
    byk = {}
    for p in c['paintings']:
        if p['room'] != rid: continue
        k = hexk(p['ix'], p['iz']); foot, n, t = oldframe(rid, k); s, o = local(foot, n, t, p['x'], p['z'])
        lo, hi = s - p['fw'] / 2, s + p['fw'] / 2
        if p.get('plaqueAt'): q = p['plaqueAt']; sq, _ = local(foot, n, t, q['x'], q['z']); lo, hi = min(lo, sq - q['w'] / 2), max(hi, sq + q['w'] / 2)
        byk.setdefault(k, []).append(dict(p=p, s=s, lo=lo, hi=hi, k=k))
    out = []
    for k in sorted(byk):
        U = sorted(byk[k], key=lambda u: u['lo']); cur = None
        for u in U:
            if cur and u['lo'] < cur['hi'] + 0.1: cur['units'].append(u); cur['hi'] = max(cur['hi'], u['hi'])
            else: cur = dict(units=[u], lo=u['lo'], hi=u['hi'], k=k); out.append(cur)
    for cl in out: cl['w'] = cl['hi'] - cl['lo']; cl['set'] = bool(SET_IDS.get(rid, set()) & {u['p']['id'] for u in cl['units']})
    return out
def place_unit(rid, u, e, s_new, okind):
    """move one painting (and plaque) from old local (s along viewer-right, offset o) to edge e at viewer-right s_new"""
    p = u['p']; foot, n, t = oldframe(rid, u['k']); n2, tr = e['n'], e['tr']
    def mv(x, z): s, o = local(foot, n, t, x, z); s2 = s - u['s'] + s_new; return round(e['m'][0] + tr[0] * s2 + n2[0] * o, 3), round(e['m'][1] + tr[1] * s2 + n2[1] * o, 3), s2
    p['x'], p['z'], s_p = mv(p['x'], p['z']); p['ix'], p['iz'] = round(-n2[0], 4), round(-n2[1], 4); p['wall'] = e['k']
    l = LP.get(p['id'])
    if l: l.update(x=p['x'], z=p['z'], ix=p['ix'], iz=p['iz'], wall=e['k'], s=round(s_p, 3), room=p['room'])
    if p.get('plaqueAt'):
        q = p['plaqueAt']; q['x'], q['z'], s_q = mv(q['x'], q['z'])
        if 's' in q: q['s'] = round(s_q, 3)
        if l and l.get('plaque'): l['plaque'].update(x=q['x'], z=q['z'], s=round(s_q, 3))
def pack(rid, CL, RUNS):
    """next-fit in order with gap g; set clusters pinned to the first (outer) run. Returns assignment or None"""
    for g in [x / 100 for x in range(45, 5, -1)]:
        order = [cl for cl in CL if cl['set']] + [cl for cl in CL if not cl['set']]; asg = [[] for _ in RUNS]; i = 0; ok = True; left = list(order)
        # pass 1: sequential fill
        for ri, r in enumerate(RUNS):
            used = 0
            while left and used + left[0]['w'] + (g if asg[ri] else 0) <= (r['hi'] - r['lo']) - 2 * 0.0:
                used += left[0]['w'] + (g if asg[ri] else 0); asg[ri].append(left.pop(0))
        # pass 2: anything left goes into any run with room (small works into the stubs)
        for cl in list(left):
            for ri, r in enumerate(RUNS):
                used = sum(x['w'] for x in asg[ri]) + g * len(asg[ri])
                if used + cl['w'] <= r['hi'] - r['lo']: asg[ri].append(cl); left.remove(cl); break
        if not left and all(not cl['set'] or any(cl in asg[0] for _ in [0]) for cl in order): return g, asg
    return None, None
REPORT = {}
_FC0 = next(o for o in T['outerCourts'] if o['id'] == 'friends-court'); EG0 = next((a for a in _FC0['art'] if a['id'] == 'eagle-brass-plaque'), None); EGREF = None
if EG0:  # eagle brass plate (inside its room): remember the offset from its nearest work in that work's wall frame
    pn = min((p for p in c['paintings'] if p['room'] == EG0['room']), key=lambda p: math.hypot(p['x'] - EG0['x'], p['z'] - EG0['z']))
    tt = (pn['iz'], -pn['ix']); EGREF = (pn, dot((EG0['x'] - pn['x'], EG0['z'] - pn['z']), tt), dot((EG0['x'] - pn['x'], EG0['z'] - pn['z']), (pn['ix'], pn['iz'])))
for rid in NEWP:
    CL = clusters(rid); RUNS = runs(rid); g, asg = pack(rid, CL, RUNS)
    if g is None: raise SystemExit(f'{rid}: does not fit ({sum(cl["w"] for cl in CL):.2f} m of works, runs {[round(r["hi"]-r["lo"],2) for r in RUNS]})')
    for r, A in zip(RUNS, asg):
        if not A: continue
        tot = sum(cl['w'] for cl in A); free = (r['hi'] - r['lo']) - tot; gap = min(0.6, free / (len(A) + 1)); s = r['lo'] + (free - gap * (len(A) - 1)) / 2
        for cl in A:
            for u in cl['units']: place_unit(rid, u, r['e'], s + (u['s'] - cl['lo']), r['e']['kind'])
            s += cl['w'] + gap
    REPORT[rid] = dict(works=sum(len(cl['units']) for cl in CL), need=round(sum(cl['w'] for cl in CL), 2), runs=round(sum(r['hi'] - r['lo'] for r in RUNS), 2), minGap=g,
                       perWall={RUNS[i]['e']['kind'] + str(RUNS[i]['e']['k']): len(sum([cl['units'] for cl in A], [])) for i, A in enumerate(asg) if A})
# ---- rooms
for rid, (C, E) in GEO.items():
    r = ROOM[rid]; P = NEWP[rid]
    r.update(poly=[list(p) for p in P], center=[round(C[0], 3), round(C[1], 3)], radius=round(min(math.hypot(p[0] - C[0], p[1] - C[1]) for p in P), 3),
             apothem=round(min(abs(dot((C[0] - e['m'][0], C[1] - e['m'][1]), e['n'])) for e in E), 3), shape='wedge-775', wallSegments=4)
    r['doorWalls'] = sorted(DOORS[rid]); r['doorOffsets'] = {str(k): round(v[0], 3) for k, v in DOORS[rid].items()}; r['doorWidths'] = {str(k): v[1] for k, v in DOORS[rid].items()}
    r['neighbours'] = {str(k): v[2] for k, v in DOORS[rid].items() if v[2].startswith('room-')}
    ki = next(e['k'] for e in E if e['kind'] == 'inner'); r['innerDoorWall'] = ki; ei = E[ki]; r['innerDoor'] = [round(ei['m'][0], 2), round(ei['m'][1], 2)]
    if r.get('centerpiece'): r['centerpiece'].update(x=r['center'][0], z=r['center'][1])
    for f in ('ring', 'ray', 'cell'): r.pop(f, None)
    r['hid'] = next(p['hid'] for p in PLAN['rooms'] if p['id'] == rid)
# ---- Friends outer court (14 x 12, open air) behind H11's outer door; Paul annex off its east side
OC = PLAN['outerCourt']; FC = next(o for o in T['outerCourts'] if o['id'] == 'friends-court')
CP = OC['poly']; ccx = sum(p[0] for p in CP) / 4; ccz = sum(p[1] for p in CP) / 4; zN, zS = max(p[1] for p in CP), min(p[1] for p in CP)
FC.update(center=[ccx, ccz], radius=7.0, poly=[list(p) for p in CP], rooms=[FC_ROOM], colonnadeSides=[], fountains=[], fountainPaths=[], spokes=[], cell=None, portal=dict(room=FC_ROOM, door=OC['door']['center'], width=ODW))
art = {a['id']: a for a in FC['art']}; mur = art['friends-club-mural']
def rigid(a_from_c, a_from_n, to_c, to_n):  # rotation+translation taking wall centre/normal from -> to
    th = math.atan2(to_n[1], to_n[0]) - math.atan2(a_from_n[1], a_from_n[0]); C_, S_ = math.cos(th), math.sin(th)
    return lambda x, z: (round(to_c[0] + (x - a_from_c[0]) * C_ - (z - a_from_c[1]) * S_, 3), round(to_c[1] + (x - a_from_c[0]) * S_ + (z - a_from_c[1]) * C_, 3))
MW = (0.0, zS + 0.75); f = rigid(mur['wallCenter'], mur['wallFacing'], MW, (0, 1))
for a in FC['art']:
    if a['id'] == 'friends-club-mural' or a.get('onWallOf') == 'friends-club-mural':
        if a.get('x') is not None: a['x'], a['z'] = f(a['x'], a['z'])
        a['wallFacing'] = [0, 1]
mur['wallCenter'] = list(MW)
# Neural Dance projection: free wall on the court's west edge, facing in (east); dance floor ~10 x 7 m stays open in front of the mural
nd = art['neural-dance']; nd.update(wallCenter=[-6.6, round((zN + zS) / 2 - 0.5, 3)], wallFacing=[1, 0], courtWall=None)
# Austin four (#760): one row on the court face of H11's outer wall, two each side of the door
eo = next(e for e in GEO[FC_ROOM][1] if e['kind'] == 'outer'); nout = eo['n']; tr_out = (-(-nout[1]), -nout[0])  # viewer in the court faces -nout
FP = [p for p in c['paintings'] if p['room'] == 'friends-court']; FP.sort(key=lambda p: p['x'])
half = eo['L'] / 2; dl, dr = ODW / 2 + 0.35, half - 0.4; slots = []
for side in (-1, 1):
    grp = FP[:2] if side < 0 else FP[2:]; tot = sum(max(p['fw'], p.get('plaqueAt', {}).get('w', 0)) for p in grp) + 0.4 * (len(grp) - 1); s = side * (dl + dr) / 2 - tot / 2
    for p in grp: w = max(p['fw'], 0.0); slots.append((p, s + w / 2)); s += w + 0.4
for p, s in slots:
    dx = (p['plaqueAt']['x'] - p['x'], p['plaqueAt']['z'] - p['z']) if p.get('plaqueAt') else None; oi = (p['ix'], p['iz'])
    p['x'] = round(eo['m'][0] + tr_out[0] * s + nout[0] * 0.03, 3); p['z'] = round(eo['m'][1] + tr_out[1] * s + nout[1] * 0.03, 3); p['ix'], p['iz'] = nout
    if dx: # plaque below-right as before: keep its along-wall offset, flip to the new wall
        old_t = (oi[1], -oi[0]); so = dot(dx, old_t); p['plaqueAt']['x'] = round(p['x'] + so * tr_out[0], 3); p['plaqueAt']['z'] = round(p['z'] + so * tr_out[1], 3)
    l = LP.get(p['id'])
    if l: l.update(x=p['x'], z=p['z'], ix=p['ix'], iz=p['iz']); (l.get('plaque') and p.get('plaqueAt') and l['plaque'].update(x=p['plaqueAt']['x'], z=p['plaqueAt']['z']))
# Paul annex (room-13, hex r=6, one door on its wall 3): rigid translate so wall 3 sits on the court's east edge
ANX = next(r for r in T['rooms'] if r.get('annex')); old = ANX['center']; new = [7.0 + ANX['apothem'], round(ccz - ANX['doorOffsets']['3'] * 0, 3)]
d = (new[0] - old[0], new[1] - old[1]); ANX['center'] = new; ANX['neighbours'] = {'3': 'friends-court'}
for p in c['paintings']:
    if p['room'] != ANX['id']: continue
    p['x'] = round(p['x'] + d[0], 3); p['z'] = round(p['z'] + d[1], 3)
    if p.get('plaqueAt'): p['plaqueAt']['x'] = round(p['plaqueAt']['x'] + d[0], 3); p['plaqueAt']['z'] = round(p['plaqueAt']['z'] + d[1], 3)
    l = LP.get(p['id'])
    if l: l.update(x=p['x'], z=p['z']); (l.get('plaque') and p.get('plaqueAt') and l['plaque'].update(x=p['plaqueAt']['x'], z=p['plaqueAt']['z']))
# eagle brass plate inside room-12: stays with its nearest work (moved above)
EG = art.get('eagle-brass-plaque')
if EG and EGREF:
    pn, so, no = EGREF; tt = (pn['iz'], -pn['ix']); EG['x'] = round(pn['x'] + so * tt[0] + no * pn['ix'], 3); EG['z'] = round(pn['z'] + so * tt[1] + no * pn['iz'], 3)
    if 'wallFacing' in EG: EG['wallFacing'] = [pn['ix'], pn['iz']]
    print('eagle plate with', pn['id'], EG['x'], EG['z'])
# ---- world flags
T['courtyards'] = []; T['courtyardRadius'] = None; T['windows'] = []; T['corridors'] = []; T.pop('honeycomb', None)
T['halls'] = [h for h in T['halls'] if h.get('kind') != 'courtyard-peristyle']
T['grounds'] = dict(center=[0, -6], radius=37.0, note='#775 lawn round the dodecagon (reached through the Friends outer court)')
T['culDeSac'] = ['friends-court', 'grounds']; T['plazaR'] = round(PLAN['courtyard']['apothem_m'] - 0.3, 2)
T['sharedWalls'] = [dict(rooms=sorted([o[0] for o in v]), gap=0.0) for v in EDGE_OWNER.values() if len(v) == 2]
T['dodec'] = dict(issue=775, plazaR=PLAN['courtyard']['circumradius_m'], outerR=PLAN['outer']['circumradius_m'], ring=[p['id'] for p in PLAN['rooms']], fcPortal=FC_ROOM)
T['dais'] = dict(x=-4.0, z=2.4)
c['layout']['nave'] = dict(minX=-40, maxX=40, minZ=-44, maxZ=34)
c['layout']['start'] = dict(x=-1.4, z=0.0, yaw=0.0)  # plaza centre, beside the checkout pillar, facing H1 Landscapes
open(CAT, 'w').write(json.dumps(c, ensure_ascii=False, separators=(',', ':')))
json.dump(dict(rooms=REPORT, doors={k: {str(kk): v for kk, v in d_.items()} for k, d_ in DOORS.items()}), open('/workspace/gallery-tj-feedback/hex-plan-dodec/as-built-775.json', 'w'), indent=1)
for rid in sorted(REPORT): print(rid, REPORT[rid])
