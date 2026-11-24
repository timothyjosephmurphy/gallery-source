# #774 (TJ-approved Oct 27 ~12:34 PT): honeycomb. Pavilion r=9 at the centre, 6 inner rooms sharing walls with it, 6 outer rooms
# sharing walls with those inners; all 12 gallery rooms r=8.75; no green inner courtyard hexes. Geometry target:
# gallery-tj-feedback/hex-plan-774/plan-v2-honeycomb.json. Runs on src/catalog.json AFTER apply-overrides (rigid per-wall move:
# every work keeps its room, wall and offset along the wall; walls only grow). Usage: python3 tools/honeycomb774.py [art]
import json, math, sys
CAT = 'src/catalog.json'; c = json.load(open(CAT)); T = c['layout']['tags']; PLAN = json.load(open('/workspace/gallery-tj-feedback/hex-plan-774/plan-v2-honeycomb.json'))
R = 8.75; AP = R * math.sqrt(3) / 2; RP = 9.0; APP = RP * math.sqrt(3) / 2; DW = 2.2; CLR = 0.12; WT = 0.16
def nv(k): a = math.radians(60 * k); return (math.cos(a), math.sin(a))
def tv(k): n = nv(k); return (-n[1], n[0])
def dot(a, b): return a[0] * b[0] + a[1] * b[1]
def kof(ix, iz): return min(range(6), key=lambda k: dot(nv(k), (-ix, -iz)) * -1)
ROOM = {r['id']: r for r in T['rooms']}
if sys.argv[1:] == ['art']:  # step 3 (after tools/outerslots.mjs): exterior murals onto their regenerated outer-wall slots
    SL = json.load(open('src/outer-slots.json'))['slots']; fc = T['outerCourts'][0]
    def at(s, off): return dict(x=round(s['mid'][0] + s['t'][0] * (s['s'] + off) + s['n'][0] * 0.06, 3), z=round(s['mid'][1] + s['t'][1] * (s['s'] + off) + s['n'][1] * 0.06, 3), wallFacing=s['n'])
    for a in fc['art']:
        if a['id'] == 'cormorant-presiding-over-sunset-on-puget-sound': a.update(at(SL['cormorant'], 0), movedBy='#774 outer wall room-10 k3')
        elif a['id'] == 'cormorant-qr-brass-plaque': a.update(at(SL['cormorant'], 1.4))
        elif a['id'] == 'friends-club-mural-teaser': a.update(at(SL['teaser'], 0), movedBy='#774 outer wall room-04 k1')
        elif a['id'] == 'friends-club-teaser-plaque': a.update(at(SL['teaser-plaque'], 0))
    open(CAT, 'w').write(json.dumps(c, ensure_ascii=False, separators=(',', ':'))); print('art placed from outer-slots'); sys.exit()
assert T.get('honeycomb') is None, 'already honeycomb'
# ---- new centres (plan) ----
RAY = {}; NEW = {}
for p in PLAN['rooms']:
    k0 = round(math.degrees(math.atan2(p['c'][1], p['c'][0])) / 60) % 6; RAY[p['id']] = (p['ring'], k0)
    d = (RP * math.sqrt(3) / 2 + AP) if p['ring'] == 1 else (APP + AP) + 2 * AP; NEW[p['id']] = (d * nv(k0)[0], d * nv(k0)[1])
INNER = {k0: rid for rid, (g, k0) in RAY.items() if g == 1}; OUTER = {k0: rid for rid, (g, k0) in RAY.items() if g == 2}
OLD = {rid: (tuple(r['center']), r['apothem']) for rid, r in ROOM.items()}
# Paul annex (#310, one-door side room, r=6) moves from room-02 wall 0 (now shared with room-05) to the outside of room-05 wall 0
ANX = next(r for r in T['rooms'] if r.get('annex')); host = OUTER[0]; ANX_K = 0
NEW[ANX['id']] = tuple(NEW[host][i] + (AP + ANX['apothem']) * nv(ANX_K)[i] for i in range(2))
def move(rid, x, z, k=None, k2=None, ap2=None):  # point on/near wall k of room rid -> same offset on wall k2 of its new hex
    (cx, cz), ap = OLD[rid]; r = ROOM[rid]; nx, nz = NEW[rid]; ap2 = ap2 if ap2 is not None else (R * math.sqrt(3) / 2 if not r.get('annex') else r['apothem'])
    if k is None: return x - cx + nx, z - cz + nz
    k2 = k if k2 is None else k2; s = dot((x - cx, z - cz), tv(k)); o = dot((x - cx, z - cz), nv(k)) - ap
    return nx + (ap2 + o) * nv(k2)[0] + s * tv(k2)[0], nz + (ap2 + o) * nv(k2)[1] + s * tv(k2)[1]
LP = {p['id']: p for p in T['paintings']}
for p in c['paintings']:
    if p['room'] not in ROOM: continue
    k = kof(p['ix'], p['iz'])
    p['x'], p['z'] = [round(v, 3) for v in move(p['room'], p['x'], p['z'], k)]
    if p.get('plaqueAt'): q = p['plaqueAt']; q['x'], q['z'] = [round(v, 3) for v in move(p['room'], q['x'], q['z'], k)]
    l = LP.get(p['id'])
    if l: l.update(x=p['x'], z=p['z'], room=p['room'], wall=k);  (l.get('plaque') or {}).update(**({k_: p['plaqueAt'][k_] for k_ in ('x', 'z')} if p.get('plaqueAt') and l.get('plaque') else {}))
# exterior art that hangs on room walls: eagle plaque (inside room-12), cormorant (room-10 k3), teaser (room-04 k0 -> k1, k0 is now shared with its inner room)
FC = next(o for o in T['outerCourts'] if o['id'] == 'friends-court')
for a in FC['art']:
    if a.get('room'): a['x'], a['z'] = [round(v, 3) for v in move(a['room'], a['x'], a['z'], kof(*a['wallFacing']))]
# ---- rooms: radius, centre, doors ----
for rid, r in ROOM.items():
    if not r.get('annex'): r.update(radius=R, apothem=AP)
    r['center'] = list(NEW[rid]); r['doorWalls'] = []; r['doorOffsets'] = {}; r['neighbours'] = {}; r['innerDoorWall'] = -1; r['innerDoor'] = None
    if r.get('centerpiece'): r['centerpiece'].update(x=NEW[rid][0], z=NEW[rid][1])
    r['ring'] = RAY.get(rid, (0, None))[0]; r['ray'] = RAY.get(rid, (0, None))[1]
def units(rid, k):  # painting + its plaque move together along the wall
    out = []; cx, cz = ROOM[rid]['center']
    for p in c['paintings']:
        if p['room'] != rid or kof(p['ix'], p['iz']) != k: continue
        s = dot((p['x'] - cx, p['z'] - cz), tv(k)); lo, hi = s - p['fw'] / 2, s + p['fw'] / 2
        if p.get('plaqueAt'): q = p['plaqueAt']; sq = dot((q['x'] - cx, q['z'] - cz), tv(k)); lo, hi = min(lo, sq - q['w'] / 2), max(hi, sq + q['w'] / 2)
        out.append((s, lo, hi, p))
    return out
WL = R / 2 - 0.15
def shift_cost(rid, k, o):
    if rid in (None, 'hub'): return 0.0, {}
    U = units(rid, k); L = [u for u in U if u[0] < o]; Rr = [u for u in U if u[0] >= o]; sh = {}
    dl = max([0] + [u[2] - (o - DW / 2 - CLR) for u in L]); dr = max([0] + [(o + DW / 2 + CLR) - u[1] for u in Rr])
    if L and min(u[1] for u in L) - dl < -WL: return None, None
    if Rr and max(u[2] for u in Rr) + dr > WL: return None, None
    for u in L: sh[u[3]['id']] = -dl
    for u in Rr: sh[u[3]['id']] = dr
    return dl * len(L) + dr * len(Rr), sh
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
        if p.get('plaqueAt') and 's' in p['plaqueAt']: p['plaqueAt']['s'] = round(p['plaqueAt']['s'] + d, 3)
SHIFTED = []
def door(a, ka, b=None, kb=None, ext=None):
    lim = R / 2 - 0.6 - DW / 2; best = None
    for i in range(-int(lim / 0.05), int(lim / 0.05) + 1):
        o = i * 0.05; ca, sa = shift_cost(a, ka, o); cb, sb = shift_cost(b, kb, -o)
        if ca is None or cb is None: continue
        if b is not None and b != 'hub' and ROOM[b].get('annex') and abs(o) > ROOM[b]['radius'] / 2 - 0.6 - DW / 2: continue
        key = (ca + cb, abs(o))
        if best is None or key < best[0]: best = (key, o, sa, sb)
    if best is None: raise SystemExit(f'no door gap {a} w{ka} <-> {b} w{kb}')
    _, best, sa, sb = best
    if sa and any(sa.values()): apply_shift(a, ka, sa); SHIFTED.append((a, ka, round(best, 2), {k_: round(v, 2) for k_, v in sa.items() if v}))
    if sb and any(sb.values()): apply_shift(b, kb, sb); SHIFTED.append((b, kb, round(-best, 2), {k_: round(v, 2) for k_, v in sb.items() if v}))
    for rid, k, o, to in ((a, ka, best, b), (b, kb, -best, a)):
        if rid in (None, 'hub'): continue
        r = ROOM[rid]; r['doorWalls'] = sorted(set(r['doorWalls'] + [k])); r['doorOffsets'][str(k)] = round(o, 2)
        if to == 'hub': r['innerDoorWall'] = k; n, t = nv(k), tv(k); r['innerDoor'] = [round(r['center'][0] + AP * n[0] + o * t[0], 2), round(r['center'][1] + AP * n[1] + o * t[1], 2)]
        elif to is not None: r['neighbours'][str(k)] = to
    return best
def items(rid, k): return [(u[1], u[2]) for u in units(rid, k)]
def load(rid, k): return sum(u[2] - u[1] for u in units(rid, k)) + 0.06 * len(units(rid, k))
def rot_wall(rid, ka, kb, ids=None):  # every work on wall ka -> same offset on wall kb (rotate about the room centre)
    th = math.radians(60 * (kb - ka)); C_, S_ = math.cos(th), math.sin(th); cx, cz = ROOM[rid]['center']
    def R2(x, z): dx, dz = x - cx, z - cz; return round(cx + dx * C_ - dz * S_, 3), round(cz + dx * S_ + dz * C_, 3)
    for p in [p for p in c['paintings'] if p['room'] == rid and (p['id'] in ids if ids is not None else kof(p['ix'], p['iz']) == ka)]:
        p['x'], p['z'] = R2(p['x'], p['z']); p['ix'], p['iz'] = round(p['ix'] * C_ - p['iz'] * S_, 4), round(p['ix'] * S_ + p['iz'] * C_, 4); p['wall'] = kb
        if p.get('plaqueAt'): p['plaqueAt']['x'], p['plaqueAt']['z'] = R2(p['plaqueAt']['x'], p['plaqueAt']['z'])
        l = LP.get(p['id'])
        if l:
            l.update(x=p['x'], z=p['z'], ix=p['ix'], iz=p['iz'], wall=kb)
            if l.get('plaque') and p.get('plaqueAt'): l['plaque'].update(x=p['plaqueAt']['x'], z=p['plaqueAt']['z'])
PLANNED = {}
for k0 in range(6): PLANNED[INNER[k0]] = {(k0 + 3) % 6, (k0 + 2) % 6, (k0 + 4) % 6, k0}; PLANNED[OUTER[k0]] = {(k0 + 3) % 6}
POCKET_DOOR = {'room-06': 2, 'room-09': 0, 'room-12': 5, 'room-10': 1, 'room-04': 5}
for k0, o in OUTER.items(): PLANNED[o].add(POCKET_DOOR.get(o, min(((k0 + 2) % 6, (k0 + 4) % 6), key=lambda kk: load(o, kk))))
PLANNED[host].add(ANX_K); SWAPS = []
for rid, dws in PLANNED.items():
    for k in sorted(dws):
        if load(rid, k) + DW + 2 * CLR <= 2 * WL - 0.1: continue
        cand = sorted((kk for kk in range(6) if kk not in dws), key=lambda kk: load(rid, kk))
        kb = cand[0]; assert load(rid, kb) + DW + 2 * CLR <= 2 * WL - 0.1, (rid, k, kb)
        A_ = [u[3]['id'] for u in units(rid, k)]; B_ = [u[3]['id'] for u in units(rid, kb)]; rot_wall(rid, k, kb, A_); rot_wall(rid, kb, k, B_)
        SWAPS.append((rid, k, kb))
SHARED = []
for k0 in range(6):
    i, j, o = INNER[k0], INNER[(k0 + 1) % 6], OUTER[k0]
    door(i, (k0 + 3) % 6, 'hub')                                   # inner -> pavilion
    door(i, (k0 + 2) % 6, j, (k0 + 5) % 6); SHARED.append([i, j])  # inner ring
    door(i, k0, o, (k0 + 3) % 6); SHARED.append([i, o])            # inner -> outer
# outer rooms: one exterior door into the pocket ground between the rays (no dead ends); the other pocket wall keeps its outer-wall boards
for k0, o in OUTER.items():
    k = POCKET_DOOR.get(o)
    if k is None: k = min(((k0 + 2) % 6, (k0 + 4) % 6), key=lambda kk: sum(h - l for l, h in items(o, kk)))
    door(o, k, None)
door(host, ANX_K, ANX['id'], (ANX_K + 3) % 6); SHARED.append([host, ANX['id']])
# ---- Friends Court: into the pocket between rays 180 and 240 (touches room-08, room-11, room-04, room-06; doors from room-04 w5 and room-06 w2)
C0 = tuple(FC['center']); PC = tuple(NEW[INNER[3]][i] + NEW[INNER[4]][i] for i in range(2)); D = (PC[0] - C0[0], PC[1] - C0[1])
FC.update(center=[round(PC[0], 3), round(PC[1], 3)], radius=R, rooms=['room-04', 'room-06'], colonnadeSides=[], cell=None)
for f in FC['fountains'] + FC.get('fountainPaths', []): f.update(x=PC[0], z=PC[1])
def dp(rid, k): r = ROOM[rid]; o = r['doorOffsets'][str(k)]; n, t = nv(k), tv(k); return (r['center'][0] + AP * n[0] + o * t[0] + 1.2 * n[0], r['center'][1] + AP * n[1] + o * t[1] + 1.2 * n[1])
FC['spokes'] = [dict(x0=PC[0], z0=PC[1], x1=round(x, 2), z1=round(z, 2), width=1.6) for x, z in (dp('room-04', 5), dp('room-06', 2))]
u210 = nv(3.5); u30 = nv(0.5)
for a in FC['art']:
    if a['id'] == 'friends-club-mural':  # free wall across the open (outward) side of the pocket, facing in toward the pavilion
        wc = (PC[0] + 4.5 * u210[0], PC[1] + 4.5 * u210[1]); d = (wc[0] - a['wallCenter'][0], wc[1] - a['wallCenter'][1]); a['wallCenter'] = [round(wc[0], 3), round(wc[1], 3)]; a['x'] = round(a['x'] + d[0], 3); a['z'] = round(a['z'] + d[1], 3); MD = d
for a in FC['art']:
    if a.get('onWallOf') == 'friends-club-mural': a['x'] = round(a['x'] + MD[0], 3); a['z'] = round(a['z'] + MD[1], 3)
    if a['id'] == 'neural-dance':  # free wall flat against room-08 wall 4 (no door), facing into the pocket
        n = nv(4); h8 = ROOM[INNER[3]]['center']; a.update(wallCenter=[round(h8[0] + (AP + 0.12) * n[0], 3), round(h8[1] + (AP + 0.12) * n[1], 3)], wallFacing=[round(n[0], 3), round(n[1], 3)], courtWall=None)
# ---- no inner courtyards; walkable outdoor ground round the honeycomb; start inside the pavilion
T['courtyards'] = []; T['courtyardRadius'] = None; T['halls'] = [h for h in T['halls'] if h['kind'] != 'courtyard-peristyle']; T['windows'] = []
T['grounds'] = dict(center=[0, 0], radius=41.0, note='#774 open lawn round the honeycomb (pockets between outer rooms)')
T['sharedWalls'] = [dict(rooms=s, gap=0.0) for s in SHARED] + [dict(rooms=[o, 'hub'], gap=0.0) for o in INNER.values()]
T['corridors'] = []; T['honeycomb'] = dict(issue=774, roomR=R, pavilionR=RP, inner={k: v for k, v in INNER.items()}, outer={k: v for k, v in OUTER.items()})
c['layout']['nave'] = dict(minX=-50, maxX=52, minZ=-44, maxZ=44)
T['dais'] = dict(x=-4.0, z=2.4)  # gallery-core tags DAIS: clear of the six pavilion doors (/tmp/dais.mjs search)
c['layout']['start'] = dict(x=-5.2, z=-0.6, yaw=0.05)  # inside the pavilion (the old courtyard spot is now inside room-08)
open(CAT, 'w').write(json.dumps(c, ensure_ascii=False, separators=(',', ':')))
json.dump(SHIFTED, open('/workspace/gallery-tj-feedback/hex-plan-774/door-shifts-774.json', 'w'), indent=1); print('shifted walls', len(SHIFTED), 'swapped walls', SWAPS)
for rid in sorted(ROOM): r = ROOM[rid]; print(rid, [round(v, 2) for v in r['center']], r['radius'], r['doorWalls'], r['doorOffsets'], r['neighbours'], r['innerDoorWall'])
