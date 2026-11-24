# #777 (TJ-approved Oct 27 ~13:48 PT): NESTLED honeycomb from gallery-tj-feedback/hex-plan-honeycomb-nest/plan-nest.json.
# Runs on the honeycomb774/B2a catalog (/tmp/pre775/catalog.json). All 13 cells R=8.75 (pavilion too); inner 6 at 2*AP on 0/60/..;
# outer 6 nestled in the pockets at 3R=26.25 on 30/90/.. (each shares walls with two inners). Rigid per-room translation (walls keep
# their k, works keep wall + offset); doors re-cut on the plan's shared walls, works slide only to clear a door gap (or a full-wall swap).
# No courtyards, NO Friends outer court (FC mural, plate, Neural Dance, teaser, Austin four parked), Paul annex parked.
# Usage: python3 tools/nest777.py [art]
import json, math, sys
CAT = 'src/catalog.json'; c = json.load(open(CAT)); T = c['layout']['tags']
PL = json.load(open('/workspace/gallery-tj-feedback/hex-plan-honeycomb-nest/plan-nest.json'))
R = PL['R_m']; AP = R * math.sqrt(3) / 2; DW = 2.2; CLR = 0.12
def nv(k): a = math.radians(60 * k); return (math.cos(a), math.sin(a))
def tv(k): n = nv(k); return (-n[1], n[0])
def dot(a, b): return a[0] * b[0] + a[1] * b[1]
def kof(ix, iz): return min(range(6), key=lambda k: dot(nv(k), (-ix, -iz)) * -1)
ROOM = {r['id']: r for r in T['rooms']}
if sys.argv[1:] == ['art']:
    SL = json.load(open('src/outer-slots.json'))['slots']; ex = T['outerCourts'][0]
    def at(s, off=0): return dict(x=round(s['mid'][0] + s['t'][0] * (s['s'] + off) + s['n'][0] * 0.06, 3), z=round(s['mid'][1] + s['t'][1] * (s['s'] + off) + s['n'][1] * 0.06, 3), wallFacing=s['n'])
    for a in ex['art']:
        if a['id'] == 'cormorant-presiding-over-sunset-on-puget-sound': a.update(at(SL['cormorant']), movedBy='#777 outer wall room-10 k%d' % SL['cormorant']['k'])
        elif a['id'] == 'cormorant-qr-brass-plaque': a.update(at(SL['corm-plates']), onWallOf=None, movedBy='#777 beside the Cormorant')
    open(CAT, 'w').write(json.dumps(c, ensure_ascii=False, separators=(',', ':'))); print('art placed from outer-slots'); sys.exit()
H = T['honeycomb']; assert H and H['issue'] == 774 and not T.get('nest'), 'needs the honeycomb774 base'
INNER = {int(k): v for k, v in H['inner'].items()}; OUTER = {int(k): v for k, v in H['outer'].items()}
PLAN_ID = dict(zip([INNER[k] for k in range(6)], ['H2', 'H1', 'H3', 'H8', 'H11', 'H7'])); PLAN_ID.update(zip([OUTER[k] for k in range(6)], ['H5', 'H12', 'H9', 'H4', 'H6', 'H10']))
PC = {p['id']: p for p in PL['rooms']}
NEW = {rid: tuple(PC[pid]['center_m']) for rid, pid in PLAN_ID.items()}
for k0 in range(6):  # sanity: inner on the 60k rays at 2AP, outer in the 30+60k pockets at 3R
    assert math.hypot(NEW[INNER[k0]][0] - 2 * AP * nv(k0)[0], NEW[INNER[k0]][1] - 2 * AP * nv(k0)[1]) < 0.01
    assert math.hypot(NEW[OUTER[k0]][0] - 3 * R * math.cos(math.radians(30 + 60 * k0)), NEW[OUTER[k0]][1] - 3 * R * math.sin(math.radians(30 + 60 * k0))) < 0.01
LP = {p['id']: p for p in T['paintings']}
# ---- park: Paul annex room-13 + Friends-court works (Austin four) + FC art
PARK = dict(note='#777 parked (not in the nest plan): Paul annex room-13 and the Friends outer court; TJ to follow up', rooms=[], paintings=[], layoutPaintings=[], art=[])
ANX = [r for r in T['rooms'] if r.get('annex')]
for r in ANX: PARK['rooms'].append(r); T['rooms'].remove(r); del ROOM[r['id']]
gone = {r['id'] for r in ANX} | {'friends-court'}
PARK['paintings'] = [p for p in c['paintings'] if p['room'] in gone]; c['paintings'] = [p for p in c['paintings'] if p['room'] not in gone]
PARK['layoutPaintings'] = [p for p in T['paintings'] if p.get('room') in gone]; T['paintings'] = [p for p in T['paintings'] if p.get('room') not in gone]
FC = next(o for o in T['outerCourts'] if o['id'] == 'friends-court'); KEEP = {'cormorant-presiding-over-sunset-on-puget-sound', 'cormorant-qr-brass-plaque', 'eagle-brass-plaque'}
PARK['art'] = [a for a in FC['art'] if a['id'] not in KEEP]; PARK['friendsCourt'] = {k: v for k, v in FC.items() if k != 'art'}
EX = dict(id='exterior-art', virtual=True, center=[0, 0], radius=0, fountains=[], fountainPaths=[], spokes=[], colonnadeSides=[], art=[a for a in FC['art'] if a['id'] in KEEP],
          note='#777: no outer court; carrier for the exterior Cormorant board + plates and the eagle plate (no floor, no walls)')
T['outerCourts'] = [EX]; T['parked777'] = PARK
# ---- rigid translate
OLD = {rid: tuple(r['center']) for rid, r in ROOM.items()}
def mv(rid, x, z): o, n = OLD[rid], NEW[rid]; return round(x - o[0] + n[0], 3), round(z - o[1] + n[1], 3)
for p in c['paintings']:
    p['x'], p['z'] = mv(p['room'], p['x'], p['z'])
    if p.get('plaqueAt'): p['plaqueAt']['x'], p['plaqueAt']['z'] = mv(p['room'], p['plaqueAt']['x'], p['plaqueAt']['z'])
    l = LP.get(p['id'])
    if l:
        l.update(x=p['x'], z=p['z'])
        if l.get('plaque') and p.get('plaqueAt'): l['plaque'].update(x=p['plaqueAt']['x'], z=p['plaqueAt']['z'])
for a in EX['art']:
    rid = a.get('room') or 'room-10'; a['x'], a['z'] = mv(rid, a['x'], a['z'])
for rid, r in ROOM.items():
    r['center'] = list(NEW[rid]); r.update(radius=R, apothem=AP, doorWalls=[], doorOffsets={}, neighbours={}, innerDoorWall=-1, innerDoor=None, planId=PLAN_ID[rid])
    if r.get('centerpiece'): r['centerpiece'].update(x=NEW[rid][0], z=NEW[rid][1])
hub = T['hub']; hub.update(radius=R, apothem=AP); T['pavilionRadius'] = R
# ---- doors: EXACTLY the plan's 18 (6 pavilion<->inner + 12 inner<->outer), FULL-WIDTH arches (TJ 13:53); inner-inner = solid HANG walls
DOORW = round(R - 0.5, 3)  # opening spans the wall: 0.25 m stubs each end carry the 0.2 m jambs
RID = {v: k for k, v in PLAN_ID.items()}; RID['P'] = 'hub'
def wall_to(a, b):  # wall index of room a facing room b (centres 2AP apart)
    ca = (0, 0) if a == 'hub' else NEW[a]; cb = (0, 0) if b == 'hub' else NEW[b]; d = (cb[0] - ca[0], cb[1] - ca[1]); assert abs(math.hypot(*d) - 2 * AP) < 0.02, (a, b)
    return max(range(6), key=lambda k: dot(nv(k), d))
DOORS = []
for d in PL['doors']:
    a, b = RID[d['between'][0]], RID[d['between'][1]]
    if a == 'hub': a, b = b, a
    DOORS.append((a, wall_to(a, b), b, None if b == 'hub' else wall_to(b, a)))
assert len(DOORS) == 18 and sum(1 for x in DOORS if x[2] == 'hub') == 6
for a, ka, b, kb in DOORS:
    for rid, k, to in ((a, ka, b), (b, kb, a)):
        if rid == 'hub': continue
        r = ROOM[rid]; r['doorWalls'] = sorted(set(r['doorWalls'] + [k])); r['doorOffsets'][str(k)] = 0.0; r.setdefault('doorWidths', {})[str(k)] = DOORW
        if to == 'hub': r['innerDoorWall'] = k; n = nv(k); r['innerDoor'] = [round(r['center'][0] + AP * n[0], 2), round(r['center'][1] + AP * n[1], 2)]
        else: r['neighbours'][str(k)] = to
HANG_NO_DOOR = [(RID[x], RID[y]) for x, y in PL['hang_walls_no_door']]
# ---- hang: works on a door wall (now a full-width opening) move to a solid wall of the SAME room. Whole wall first (rotate + slide, rows kept),
# else per stacked cluster, best fit. Works on solid walls never move. Boards reserve one empty solid wall each (inside face; no lawn doors).
def units(rid, k):
    out = []; cx, cz = ROOM[rid]['center']
    for p in c['paintings']:
        if p['room'] != rid or kof(p['ix'], p['iz']) != k: continue
        s = dot((p['x'] - cx, p['z'] - cz), tv(k)); lo, hi = s - p['fw'] / 2, s + p['fw'] / 2
        if p.get('plaqueAt'): q = p['plaqueAt']; sq = dot((q['x'] - cx, q['z'] - cz), tv(k)); lo, hi = min(lo, sq - q['w'] / 2), max(hi, sq + q['w'] / 2)
        out.append((s, lo, hi, p))
    return out
def clusters(U):
    U = sorted(U, key=lambda u: u[1]); out = []
    for u in U:
        if out and u[1] < out[-1]['hi'] + 0.02: out[-1]['u'].append(u); out[-1]['hi'] = max(out[-1]['hi'], u[2])
        else: out.append(dict(lo=u[1], hi=u[2], u=[u]))
    return out
def lim(rid, k): dw = ROOM[rid]['doorWalls']; return (-(R / 2 - (0.4 if (k - 1) % 6 in dw else 0.15)), R / 2 - (0.4 if (k + 1) % 6 in dw else 0.15))
GAP = 0.15
def gaps(rid, k):
    a, b = lim(rid, k); occ = sorted((u[1], u[2]) for u in units(rid, k)); out = []; x = a
    for lo, hi in occ:
        if lo - GAP > x: out.append((x, lo - GAP))
        x = max(x, hi + GAP)
    if b > x: out.append((x, b))
    return out
def move_units(rid, ka, kb, U, dshift):
    ids = [u[3]['id'] for u in U]; rot_wall(rid, ka, kb, ids)
    if dshift: apply_shift(rid, kb, {i: dshift for i in ids})
def rot_wall(rid, ka, kb, ids):
    th = math.radians(60 * (kb - ka)); C_, S_ = math.cos(th), math.sin(th); cx, cz = ROOM[rid]['center']
    def R2(x, z): dx, dz = x - cx, z - cz; return round(cx + dx * C_ - dz * S_, 3), round(cz + dx * S_ + dz * C_, 3)
    for p in [p for p in c['paintings'] if p['room'] == rid and p['id'] in ids]:
        p['x'], p['z'] = R2(p['x'], p['z']); p['ix'], p['iz'] = round(p['ix'] * C_ - p['iz'] * S_, 4), round(p['ix'] * S_ + p['iz'] * C_, 4); p['wall'] = kb
        if p.get('plaqueAt'): p['plaqueAt']['x'], p['plaqueAt']['z'] = R2(p['plaqueAt']['x'], p['plaqueAt']['z'])
        l = LP.get(p['id'])
        if l:
            l.update(x=p['x'], z=p['z'], ix=p['ix'], iz=p['iz'], wall=kb)
            if l.get('plaque') and p.get('plaqueAt'): l['plaque'].update(x=p['plaqueAt']['x'], z=p['plaqueAt']['z'])
def apply_shift(rid, k, sh):
    t = tv(k)
    for p in c['paintings']:
        d = sh.get(p['id'], 0)
        if p['room'] != rid or not d: continue
        p['x'] = round(p['x'] + d * t[0], 3); p['z'] = round(p['z'] + d * t[1], 3)
        if p.get('plaqueAt'): p['plaqueAt']['x'] = round(p['plaqueAt']['x'] + d * t[0], 3); p['plaqueAt']['z'] = round(p['plaqueAt']['z'] + d * t[1], 3)
        l = LP.get(p['id'])
        if l:
            l.update(x=p['x'], z=p['z'], s=round(l.get('s', 0) + d, 3))
            if l.get('plaque') and p.get('plaqueAt'): l['plaque'].update(x=p['plaqueAt']['x'], z=p['plaqueAt']['z'], s=round(l['plaque'].get('s', 0) + d, 3))
EAG = next((a for a in EX['art'] if a['id'] == 'eagle-brass-plaque'), None); HOST = next((p for p in c['paintings'] if EAG and p['id'] == EAG.get('onWallOf')), None)
if HOST:  # eagle plate rides with its host painting (pose relative to the host)
    hn = (HOST['ix'], HOST['iz']); ht = (-hn[1], hn[0]); dv = (EAG['x'] - HOST['x'], EAG['z'] - HOST['z']); EREL = (dot(dv, ht), dot(dv, hn))
MOVES = []
def solid(rid): return [k for k in range(6) if k not in ROOM[rid]['doorWalls']]
def relocate(rid, ka, avoid=()):
    U = units(rid, ka)
    if not U: return
    span = (min(u[1] for u in U), max(u[2] for u in U)); L_ = span[1] - span[0]
    best = None
    for kb in solid(rid):
        if kb == ka or kb in avoid: continue
        for g0, g1 in gaps(rid, kb):
            if g1 - g0 >= L_ and (best is None or g1 - g0 < best[0]): best = (g1 - g0, kb, g0, g1)
    if best:
        _, kb, g0, g1 = best; d = (g0 + g1) / 2 - (span[0] + span[1]) / 2; move_units(rid, ka, kb, U, d); MOVES.append((rid, ka, kb, 'wall', len(U))); return
    for cl in sorted(clusters(U), key=lambda q: q['lo'] - q['hi']):
        L_ = cl['hi'] - cl['lo']; best = None
        for kb in solid(rid):
            if kb == ka or kb in avoid: continue
            for g0, g1 in gaps(rid, kb):
                if g1 - g0 >= L_ and (best is None or g1 - g0 < best[0]): best = (g1 - g0, kb, g0, g1)
        assert best, ('no room for cluster', rid, ka, [u[3]['id'] for u in cl['u']], L_)
        _, kb, g0, g1 = best; d = (g0 + g1) / 2 - (cl['lo'] + cl['hi']) / 2; move_units(rid, ka, kb, cl['u'], d); MOVES.append((rid, ka, kb, 'cluster', len(cl['u'])))
# boards: group -> (width needed), chosen room/wall = an existing solid wall whose works can be rehung elsewhere in the room
BOARDS = [('timeline-nostr', [('timeline', 2.8, 2.4), ('nostr', 2.3, 2.4)], 0.2), ('map', [('map', 3.2, 2.13)], 0), ('testi', [('testi', 5.6, 2.8)], 0),
          ('cormorant', [('cormorant', 2.286, 1.524), ('corm-plates', 0.9, 0.45)], 0.35)]
RESERVED = {}
def relocate_all(rid, walls, avoid=()):  # every cluster from these walls, largest first, best fit onto solid walls
    CL = [(ka, cl) for ka in walls for cl in clusters(units(rid, ka))]; CL.sort(key=lambda q: q[1]['lo'] - q[1]['hi'])
    for ka, cl in CL:
        L_ = cl['hi'] - cl['lo']; best = None
        for kb in solid(rid):
            if kb in walls or kb in avoid: continue
            for g0, g1 in gaps(rid, kb):
                if g1 - g0 >= L_ and (best is None or g1 - g0 < best[0]): best = (g1 - g0, kb, g0, g1)
        assert best, ('no room for cluster', rid, ka, [u[3]['id'] for u in cl['u']], round(L_, 2))
        _, kb, g0, g1 = best; d = (g0 + g1) / 2 - (cl['lo'] + cl['hi']) / 2; move_units(rid, ka, kb, cl['u'], d); MOVES.append((rid, ka, kb, len(cl['u'])))
for rid in ROOM: relocate_all(rid, list(ROOM[rid]['doorWalls']))
def spare(rid): return sum(sum(g1 - g0 for g0, g1 in gaps(rid, k)) for k in solid(rid) if (rid, k) not in RESERVED.values())
for name, items, gap in BOARDS:
    need = sum(w for _, w, _ in items) + gap * (len(items) - 1)
    for rid in sorted(ROOM, key=lambda r: -spare(r)):
        if rid in [v[0] for v in RESERVED.values()]: continue
        ks = [k for k in solid(rid) if lim(rid, k)[1] - lim(rid, k)[0] >= need + 0.6]
        ks.sort(key=lambda k: sum(u[2] - u[1] for u in units(rid, k)))
        ok = False
        for k in ks:
            snap = json.dumps([c['paintings'], T['paintings']])
            try:
                relocate_all(rid, [k], avoid=[v[1] for v in RESERVED.values() if v[0] == rid]); RESERVED[name] = (rid, k); ok = True; break
            except AssertionError:
                P_, L_ = json.loads(snap); c['paintings'][:] = P_; T['paintings'][:] = L_; LP.clear(); LP.update({p['id']: p for p in T['paintings']})
        if ok: break
    assert name in RESERVED, ('no wall for board', name)
if HOST:
    hn = (HOST['ix'], HOST['iz']); ht = (-hn[1], hn[0]); EAG.update(x=round(HOST['x'] + ht[0] * EREL[0] + hn[0] * EREL[1], 3), z=round(HOST['z'] + ht[1] * EREL[0] + hn[1] * EREL[1], 3), wallFacing=[round(hn[0], 3), round(hn[1], 3)])
# board slots on the INSIDE face of the reserved wall (n points into the room)
SL = dict(note='generated by tools/nest777.py (#777): boards on the inside face of a solid wall (no lawn doors in the nest plan)', slots={}, walls={})
for name, items, gap in BOARDS:
    rid, k = RESERVED[name]; r = ROOM[rid]; n = nv(k); nin = (-n[0], -n[1]); t = tv(k)
    mid = [round(r['center'][0] + (AP - 0.08) * n[0], 3), round(r['center'][1] + (AP - 0.08) * n[1], 3)]
    tot = sum(w for _, w, _ in items) + gap * (len(items) - 1); a, b = lim(rid, k); s0 = (a + b) / 2 - tot / 2
    SL['walls'][rid + '/' + str(k)] = dict(room=rid, k=k, mid=mid, n=[round(nin[0], 3), round(nin[1], 3)], t=[round(t[0], 3), round(t[1], 3)], inside=True, L=R)
    for iid, w, h in items: SL['slots'][iid] = dict(room=rid, k=k, s=round(s0 + w / 2, 3), w=w, h=h, mid=mid, n=[round(nin[0], 3), round(nin[1], 3)], t=[round(t[0], 3), round(t[1], 3)], inside=True); s0 += w + gap
json.dump(SL, open('src/outer-slots.json', 'w'), indent=1)
SHARED = [[a, b] for a, ka, b, kb in DOORS] + [list(x) for x in HANG_NO_DOOR]
T['sharedWalls'] = [dict(rooms=s, gap=0.0) for s in SHARED]
SHIFTED, SWAPS, SKIPPED = MOVES, [], HANG_NO_DOOR
T['courtyards'] = []; T['courtyardRadius'] = None; T['halls'] = [h for h in T['halls'] if h['kind'] != 'courtyard-peristyle']; T['windows'] = []
T['grounds'] = None  # #777: no lawn doors in the plan, so no walkable lawn
T['nest'] = dict(issue=777, roomR=R, pavilionR=R, plan='gallery-tj-feedback/hex-plan-honeycomb-nest/plan-nest.json', planId=PLAN_ID, hangWallsNoDoor=SKIPPED, doors=[list(d) for d in DOORS], boards=RESERVED, doorWidth=DOORW)
T['honeycomb']['pavilionR'] = R
c['layout']['nave'] = dict(minX=-45, maxX=45, minZ=-45, maxZ=45)
open(CAT, 'w').write(json.dumps(c, ensure_ascii=False, separators=(',', ':')))
json.dump(dict(moves=SHIFTED, boards=RESERVED, hangWallsNoDoor=SKIPPED), open('/workspace/gallery-tj-feedback/hex-plan-honeycomb-nest/door-shifts-777.json', 'w'), indent=1)
print('moves', SHIFTED, 'boards', RESERVED, 'parked', len(PARK['paintings']), 'paintings', [a['id'] for a in PARK['art']])
for rid in sorted(ROOM): r = ROOM[rid]; print(rid, PLAN_ID[rid], [round(v, 2) for v in r['center']], r['doorWalls'], r['doorOffsets'], r['neighbours'])
