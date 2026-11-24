# #778 (TJ-approved Oct 27 2026 ~14:27 PT): REVISED nest map, R=8.25 everywhere + START entry room, plan rotated +30 deg.
# Source of truth: gallery-tj-feedback/hex-plan-honeycomb-nest/plan-nest.json. Runs on the LIVE #777 catalog (/tmp/pre778/catalog.json),
# which is the same 13-cell nest (same rooms, same 18 doors, same hang the plan's wall-need table was computed from), only R=8.75 and unrotated.
# Each room is moved RIGIDLY: rotated +30 deg about its own centre (walls keep k; T.wallRot=30 so wall k's normal is 60k+30) and
# translated to its plan centre. R 8.75 -> 8.25 shortens walls by 0.5 m: a wall whose works no longer fit inside it is re-spaced (order kept,
# true size). START is a real hex room with one full-width door to H11 Portrait; H11's old south wall works move to its solid walls.
# START walls (inside face): Gallery map NW (150, shared with H4), world/testimonials map NE (30, shared with H6), small FC mural S (270).
# Usage: python3 tools/nest778.py [art]
import json, math, sys, re
CAT = 'src/catalog.json'; c = json.load(open(CAT)); T = c['layout']['tags']
PL = json.load(open('/workspace/gallery-tj-feedback/hex-plan-honeycomb-nest/plan-nest.json'))
ROT = PL['rotation_deg_applied']; assert ROT == 30
R = PL['R_m']; AP = R * math.sqrt(3) / 2; GAP = 0.15
def nv(k): a = math.radians(60 * k + ROT); return (math.cos(a), math.sin(a))
def tv(k): n = nv(k); return (-n[1], n[0])
def dot(a, b): return a[0] * b[0] + a[1] * b[1]
def kof(ix, iz): return max(range(6), key=lambda k: dot(nv(k), (-ix, -iz)))
ROOM = {r['id']: r for r in T['rooms']}
if sys.argv[1:] == ['art']:
    SL = json.load(open('src/outer-slots.json'))['slots']; ex = T['outerCourts'][0]
    def at(s, off=0): return dict(x=round(s['mid'][0] + s['t'][0] * (s['s'] + off) + s['n'][0] * 0.06, 3), z=round(s['mid'][1] + s['t'][1] * (s['s'] + off) + s['n'][1] * 0.06, 3), wallFacing=s['n'])
    for a in ex['art']:
        if a['id'] == 'cormorant-presiding-over-sunset-on-puget-sound': a.update(at(SL['cormorant']), movedBy='#778 inside face %s k%d' % (SL['cormorant']['room'], SL['cormorant']['k']))
        elif a['id'] == 'cormorant-qr-brass-plaque': a.update(at(SL['corm-plates']), onWallOf=None, movedBy='#778 beside the Cormorant')
        elif a['id'] in ('friends-club-mural-teaser', 'friends-club-teaser-plaque'): a.update(at(SL[a['id']]), room='start', onWallOf=None, movedBy='#778 START-S (Garden Comrade awaits the hang step)')
    open(CAT, 'w').write(json.dumps(c, ensure_ascii=False, separators=(',', ':'))); print('art placed from outer-slots'); sys.exit()
NE = T.get('nest'); assert NE and NE['issue'] == 777 and not T.get('wallRot'), 'needs the LIVE #777 nest catalog (/tmp/pre778/catalog.json)'
PC = {p['id']: p for p in PL['rooms']}; assert all(abs(p['radius_m'] - R) < 1e-9 for p in PC.values()) and len(PC) == 14
PLAN_ID = {rid: r['planId'] for rid, r in ROOM.items()}; NEW = {rid: tuple(v + 0.0 for v in PC[pid]['center_m']) for rid, pid in PLAN_ID.items()}  # +0.0: no -0.0 (door keys)
for rid, r in ROOM.items():  # sanity: the plan is the #777 nest rotated +30 deg (scaled to R=8.25)
    o = r['center']; a0 = math.degrees(math.atan2(o[1], o[0])); a1 = math.degrees(math.atan2(NEW[rid][1], NEW[rid][0])); assert abs(((a1 - a0 - ROT) + 180) % 360 - 180) < 0.05, (rid, a0, a1)
LP = {p['id']: p for p in T['paintings']}
# ---- rigid move: rotate about the old centre, translate to the plan centre
CR, SR = math.cos(math.radians(ROT)), math.sin(math.radians(ROT))
def rv(x, z): return x * CR - z * SR, x * SR + z * CR
OLD = {rid: tuple(r['center']) for rid, r in ROOM.items()}
def mv(rid, x, z): o, n = OLD[rid], NEW[rid]; dx, dz = rv(x - o[0], z - o[1]); return round(dx + n[0], 3), round(dz + n[1], 3)
for p in c['paintings']:
    p['ix'], p['iz'] = [round(v, 4) for v in rv(p['ix'], p['iz'])]; DA = AP - ROOM[p['room']]['apothem']  # walls come in by the apothem change
    p['x'], p['z'] = mv(p['room'], p['x'], p['z']); p['x'], p['z'] = round(p['x'] - p['ix'] * DA, 3), round(p['z'] - p['iz'] * DA, 3)
    if p.get('plaqueAt'): q = p['plaqueAt']; q['x'], q['z'] = mv(p['room'], q['x'], q['z']); q['x'], q['z'] = round(q['x'] - p['ix'] * DA, 3), round(q['z'] - p['iz'] * DA, 3)
    l = LP.get(p['id'])
    if l:
        l.update(x=p['x'], z=p['z'], ix=p['ix'], iz=p['iz'])
        if l.get('plaque') and p.get('plaqueAt'): l['plaque'].update(x=p['plaqueAt']['x'], z=p['plaqueAt']['z'])
EX = T['outerCourts'][0]; assert EX.get('virtual')
EAG = next((a for a in EX['art'] if a['id'] == 'eagle-brass-plaque'), None)
if EAG: EAG['wallFacing'] = [round(v, 4) for v in rv(*EAG['wallFacing'])]; DA = AP - ROOM[EAG['room']]['apothem']; EAG['x'], EAG['z'] = mv(EAG['room'], EAG['x'], EAG['z']); EAG['x'], EAG['z'] = round(EAG['x'] - EAG['wallFacing'][0] * DA, 3), round(EAG['z'] - EAG['wallFacing'][1] * DA, 3)
for rid, r in ROOM.items():
    r['center'] = list(NEW[rid]); r.update(radius=R, apothem=AP)
    if r.get('innerDoor'): n = nv(r['innerDoorWall']); r['innerDoor'] = [round(NEW[rid][0] + AP * n[0], 2), round(NEW[rid][1] + AP * n[1], 2)]
    if r.get('centerpiece'): r['centerpiece'].update(x=NEW[rid][0], z=NEW[rid][1])
DOORW = round(R - 0.5, 3)
for r in ROOM.values(): r['doorWidths'] = {str(k): DOORW for k in r['doorWalls']}
# ---- START room + the entry door (H11 south wall <-> START north wall)
RID = {v: k for k, v in PLAN_ID.items()}; RID['P'] = 'hub'; SC = [v + 0.0 for v in PC['START']['center_m']]
TPL = ROOM[RID['H11']]
ST = dict(id='start', index=len(T['rooms']), label='Start', entry=True, radius=R, apothem=AP, center=SC, count=0, mainTags=[], combines={}, doorWalls=[], doorOffsets={}, doorWidths={}, neighbours={}, innerDoorWall=-1, innerDoor=None,
          wallSegments=6, blankSegments=[], wallColor=TPL.get('wallColor'), palette=TPL.get('palette'), planId='START', note='#778 START / Entry: one door to H11 Portrait; walls carry the gallery map, world/testimonials map and the small FC mural')
T['rooms'].append(ST); ROOM['start'] = ST; PLAN_ID['start'] = 'START'; NEW['start'] = tuple(SC); RID['START'] = 'start'
def cen(a): return (0, 0) if a == 'hub' else NEW[a]
def wall_to(a, b): ca, cb = cen(a), cen(b); d = (cb[0] - ca[0], cb[1] - ca[1]); assert abs(math.hypot(*d) - 2 * AP) < 0.02, (a, b); return max(range(6), key=lambda k: dot(nv(k), d))
ADJ = {frozenset(x) for x in PL['adjacency_shared_walls']}
DOORS = []
for d in PL['doors']:
    a, b = RID[d['between'][0]], RID[d['between'][1]]
    if a == 'hub': a, b = b, a
    DOORS.append((a, wall_to(a, b), b, None if b == 'hub' else wall_to(b, a)))
assert len(DOORS) == 19 and sum(1 for x in DOORS if x[2] == 'hub') == 6 and sum(1 for x in DOORS if 'start' in (x[0], x[2])) == 1
for a, ka, b, kb in DOORS:  # every pre-existing #777 door must be on the same wall k; only the entry is new
    for rid, k, to in ((a, ka, b), (b, kb, a)):
        if rid == 'hub': continue
        r = ROOM[rid]
        if 'start' in (a, b): r['doorWalls'] = sorted(set(r['doorWalls'] + [k])); r['doorOffsets'][str(k)] = 0.0; r['doorWidths'][str(k)] = DOORW; r['neighbours'][str(k)] = to
        else: assert k in r['doorWalls'] and (to == 'hub' and r['innerDoorWall'] == k or r['neighbours'].get(str(k)) == to), ('door moved?', rid, k, to)
INNER = [RID[x] for x in ('H2', 'H1', 'H3', 'H8', 'H11', 'H7')]
for x, y in PL['hang_walls_no_door']: assert RID[x] in INNER and RID[y] in INNER and wall_to(RID[x], RID[y]) not in ROOM[RID[x]]['doorWalls']
ndoor = sum(len(r['doorWalls']) for r in ROOM.values()); assert ndoor == 6 + 2 * 13, ndoor  # 6 hub doors (one side) + 13 room-room doors (two sides)
# ---- hang helpers (as #777)
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
def lim(rid, k): dw = ROOM[rid]['doorWalls']; return (-(R / 2 - (0.3 if (k - 1) % 6 in dw else 0.15)), R / 2 - (0.3 if (k + 1) % 6 in dw else 0.15))
def solid(rid): return [k for k in range(6) if k not in ROOM[rid]['doorWalls']]
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
def respace(rid, k):  # keep order, equal gaps inside the wall limits (true size)
    CLs = clusters(units(rid, k)); a0, b0 = lim(rid, k); tot = sum(q['hi'] - q['lo'] for q in CLs); g = (b0 - a0 - tot) / (len(CLs) + 1)
    assert g >= 0.06, ('respace: wall too short', rid, PLAN_ID[rid], k, round(tot, 2), round(b0 - a0, 2), len(CLs))
    x = a0 + g; sh = {}
    for q in CLs:
        for u in q['u']: sh[u[3]['id']] = x - q['lo']
        x += q['hi'] - q['lo'] + g
    apply_shift(rid, k, sh)
MOVES = []
HOST = next((p for p in c['paintings'] if EAG and p['id'] == EAG.get('onWallOf')), None)
if HOST: hn = (HOST['ix'], HOST['iz']); ht = (-hn[1], hn[0]); dv = (EAG['x'] - HOST['x'], EAG['z'] - HOST['z']); EREL = (dot(dv, ht), dot(dv, hn))
# 1) H11's south wall is now the entry door. H11 keeps only 2 solid walls at R=8.25 (7.45 m usable each), which cannot hold all 19 Portrait works
#    in one true-size row (14.6 m of works+plaques). So the 6 works of that wall move AS ONE ROW (order kept) onto START's free SW wall (210 deg),
#    the wall beside the doorway, NOT a program wall. Flagged for TJ in the hang step.
H11 = RID['H11']; KS = wall_to(H11, 'start'); K_OV = max(range(6), key=lambda k: dot(nv(k), (math.cos(math.radians(210)), math.sin(math.radians(210)))))
def xfer(ra, ka, rb, kb, ids):
    ca, cb = ROOM[ra]['center'], ROOM[rb]['center']; na, ta, nb, tb = nv(ka), tv(ka), nv(kb), tv(kb)
    def P(x, z): dx, dz = x - ca[0], z - ca[1]; d_, s_ = dot((dx, dz), na), dot((dx, dz), ta); return round(cb[0] + nb[0] * d_ + tb[0] * s_, 3), round(cb[1] + nb[1] * d_ + tb[1] * s_, 3)
    for p in [p for p in c['paintings'] if p['room'] == ra and p['id'] in ids]:
        p['x'], p['z'] = P(p['x'], p['z']); p['ix'], p['iz'] = round(-nb[0], 4), round(-nb[1], 4); p['wall'] = kb; p['room'] = rb; p['movedBy'] = '#778 H11 south wall became the START door: row moved to START-SW (awaits hang step)'
        if p.get('plaqueAt'): p['plaqueAt']['x'], p['plaqueAt']['z'] = P(p['plaqueAt']['x'], p['plaqueAt']['z'])
        l = LP.get(p['id'])
        if l:
            l.update(x=p['x'], z=p['z'], ix=p['ix'], iz=p['iz'], wall=kb, room=rb)
            if l.get('plaque') and p.get('plaqueAt'): l['plaque'].update(x=p['plaqueAt']['x'], z=p['plaqueAt']['z'])
OVIDS = [u[3]['id'] for u in units(H11, KS)]; xfer(H11, KS, 'start', K_OV, OVIDS); MOVES.append(('H11', KS, 'START', K_OV, OVIDS))
assert not units(H11, KS)
# 2) shorter walls: any wall whose works now cross its limits or each other gets re-spaced (order kept)
RESPACED = []
for rid in ROOM:
    for k in range(6):
        U = units(rid, k)
        if not U: continue
        assert k not in ROOM[rid]['doorWalls'], ('work on a door wall', rid, k)
        CLs = clusters(U); a0, b0 = lim(rid, k)
        if CLs[0]['lo'] < a0 - 1e-6 or CLs[-1]['hi'] > b0 + 1e-6 or any(CLs[i + 1]['lo'] - CLs[i]['hi'] < GAP - 1e-6 for i in range(len(CLs) - 1)): 
            try: respace(rid, k); RESPACED.append((PLAN_ID[rid], k))
            except AssertionError:  # move this wall's narrowest cluster to the room's emptiest other solid wall, then re-space both
                cl = min(CLs, key=lambda q: q['hi'] - q['lo']); kb = min((q for q in solid(rid) if q != k), key=lambda q: sum(u[2] - u[1] for u in units(rid, q)))
                rot_wall(rid, k, kb, [u[3]['id'] for u in cl['u']]); apply_shift(rid, kb, {u[3]['id']: lim(rid, kb)[1] + 1 + (cl['hi'] - cl['lo']) / 2 - (cl['lo'] + cl['hi']) / 2 for u in cl['u']})
                respace(rid, k); respace(rid, kb); RESPACED.append((PLAN_ID[rid], k, '->', kb, [u[3]['id'] for u in cl['u']]))
# 3) boards: map + world/testimonials map + small FC mural hard-placed inside START; timeline+Nostr and Cormorant keep their #777 walls
K_MAP, K_TESTI, K_S = wall_to('start', RID['H4']), wall_to('start', RID['H6']), max(range(6), key=lambda k: dot(nv(k), (0, -1)))
for k, f in ((K_MAP, 150), (K_TESTI, 30), (K_S, 270)): assert abs(((60 * k + ROT) - f + 180) % 360 - 180) < 0.5, (k, f)
assert ST['doorWalls'] == [wall_to('start', H11)] and not {K_MAP, K_TESTI, K_S, K_OV} & set(ST['doorWalls']) and K_OV not in (K_MAP, K_TESTI, K_S)
RESERVED = dict(NE['boards']); RESERVED.update({'map': ('start', K_MAP), 'testi': ('start', K_TESTI), 'fc-small': ('start', K_S)})
for nm in ('timeline-nostr', 'cormorant'): rid, k = RESERVED[nm]; assert not units(rid, k) and k in solid(rid), nm
BOARDS = [('timeline-nostr', [('timeline', 2.8, 2.4), ('nostr', 2.3, 2.4)], 0.2), ('map', [('map', 3.2, 2.13)], 0), ('testi', [('testi', 5.6, 2.8)], 0),
          ('cormorant', [('cormorant', 2.286, 1.524), ('corm-plates', 0.9, 0.45)], 0.35), ('fc-small', [('friends-club-mural-teaser', 6.096, 1.3716), ('friends-club-teaser-plaque', 0.8, 0.5)], 0.15)]
PARK = T['parked777']; TEAS = {'friends-club-mural-teaser', 'friends-club-teaser-plaque'}
EX['art'] += [a for a in PARK['art'] if a['id'] in TEAS]; PARK['art'] = [a for a in PARK['art'] if a['id'] not in TEAS]
PARK['note'] = '#778 parked (not in the revised nest plan): Paul annex room-13 and the Friends outer court; the small FC teaser mural + plate were unparked to START-S'
SL = dict(note='generated by tools/nest778.py (#778): boards on the inside face of a solid wall; map/testi/small-FC inside START', slots={}, walls={})
for name, items, gap in BOARDS:
    rid, k = RESERVED[name]; r = ROOM[rid]; n = nv(k); nin = (-n[0], -n[1]); t = tv(k)
    mid = [round(r['center'][0] + (AP - 0.08) * n[0], 3), round(r['center'][1] + (AP - 0.08) * n[1], 3)]
    tot = sum(w for _, w, _ in items) + gap * (len(items) - 1); a, b = lim(rid, k); assert tot <= b - a, (name, tot, b - a); s0 = (a + b) / 2 - tot / 2
    SL['walls'][rid + '/' + str(k)] = dict(room=rid, k=k, mid=mid, n=[round(nin[0], 3), round(nin[1], 3)], t=[round(t[0], 3), round(t[1], 3)], inside=True, L=R)
    for iid, w, h in items: SL['slots'][iid] = dict(room=rid, k=k, s=round(s0 + w / 2, 3), w=w, h=h, mid=mid, n=[round(nin[0], 3), round(nin[1], 3)], t=[round(t[0], 3), round(t[1], 3)], inside=True); s0 += w + gap
json.dump(SL, open('src/outer-slots.json', 'w'), indent=1)
TW = open('src/testimap.js').read()
TW2 = re.sub(r"export const TESTI_WALL = \{[^}]*\}( /\*[^*]*\*/)?", "export const TESTI_WALL = { room: 'start', k: %d, inside: true } /* #778 START-NE (shared with H6), inside START */" % K_TESTI, TW, count=1)
TW2 = re.sub(r"FREE_WALLS_294 = \[[^\]]*\]", "FREE_WALLS_294 = [{ room: '%s', k: %d, for: 'timeline wall' }, { room: '%s', k: %d, for: 'Nostr feed wall' }]" % (*RESERVED['timeline-nostr'], *RESERVED['timeline-nostr']), TW2, count=1)
assert "room: 'start'" in TW2; open('src/testimap.js', 'w').write(TW2)
if HOST:  # eagle plate rides with its host painting (pose relative to the host, captured after the rigid move)
    hn = (HOST['ix'], HOST['iz']); ht = (-hn[1], hn[0]); EAG.update(x=round(HOST['x'] + ht[0] * EREL[0] + hn[0] * EREL[1], 3), z=round(HOST['z'] + ht[1] * EREL[0] + hn[1] * EREL[1], 3), wallFacing=[round(hn[0], 3), round(hn[1], 3)])
# ---- metadata, nave, spawn
T['dais'] = dict(x=-4.0, z=0.0, note='#778: hologram dais on the 180 deg bisector between the H3 and H8 doors (the old -4.5,2.6 spot is in the H3 doorway after the +30 deg turn; r 4.0: the 4.8 m dais stays 1 m+ clear of both full-width door planes)')
T['wallRot'] = ROT; T['hub'].update(radius=R, apothem=AP); T['pavilionRadius'] = R; T['honeycomb']['pavilionR'] = R
SHARED = [[a, b] for a, ka, b, kb in DOORS] + [[RID[x], RID[y]] for x, y in PL['hang_walls_no_door']] + [['start', RID['H4']], ['start', RID['H6']]]
T['sharedWalls'] = [dict(rooms=s, gap=0.0) for s in SHARED]
T['nest'] = dict(issue=778, prev=777, note='revised map R8.25 + START (TJ-approved Oct 27 2026 ~14:27 PT)', roomR=R, pavilionR=R, wallRot=ROT, plan='gallery-tj-feedback/hex-plan-honeycomb-nest/plan-nest.json', planId=PLAN_ID,
                 hangWallsNoDoor=PL['hang_walls_no_door'], startSolid=['H4', 'H6'], doors=[list(d) for d in DOORS], boards=RESERVED, doorWidth=DOORW, startWalls=dict(map=K_MAP, testi=K_TESTI, south=K_S), respaced=RESPACED, h11Moves=MOVES)
BB = PL['bbox_m']; c['layout']['nave'] = dict(minX=BB['xmin'] - 3, maxX=BB['xmax'] + 3, minZ=BB['ymin'] - 3, maxZ=BB['ymax'] + 3)
SP = dict(x=SC[0], z=round(SC[1] - 2.0, 3)); c['layout']['start'] = dict(SP, yaw=0.0)  # inside START, looking +z through the H11 Portrait doorway
T['hub']['start'] = dict(SP, faceAngle=90, note='#778: spawn inside START facing the H11 doorway (north)')
open(CAT, 'w').write(json.dumps(c, ensure_ascii=False, separators=(',', ':')))
json.dump(dict(h11Moves=MOVES, respaced=RESPACED, boards=RESERVED), open('/workspace/gallery-tj-feedback/hex-plan-honeycomb-nest/door-shifts-778.json', 'w'), indent=1)
print('h11 moves', MOVES, '\nrespaced', RESPACED, '\nboards', RESERVED)
for rid in sorted(ROOM): r = ROOM[rid]; print(rid, PLAN_ID[rid], [round(v, 2) for v in r['center']], r['doorWalls'], r['neighbours'])
