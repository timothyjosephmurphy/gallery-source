# #779 (TJ-approved Oct 27 2026 via Studio manager): H1 open-air trapezoid COURTYARD from plan-nest.json "courtyard" (README "Courtyard v4").
# PATCHES the LIVE #778 catalog (nest778.py output, deploy 1f6d137a; pristine copy at /tmp/pre779/catalog.json). Nest unchanged otherwise.
# - H1 north wall (k1) gets ONE 1.2 m outer door at its midpoint (0, 21.434) -> 'courtyard-h1' (one-door side space, like the annex).
#   H1 k1 works re-spaced around the door (order kept, true size); rice-paddies (+plate) moves to H1 k3 (freed by the Cormorant).
# - T.openCourts: walkable trapezoid floor + one freestanding outer wall (-8.25..8.25, z 28.579). Legs are H12 k0 / H5 k2 outer faces.
# - Art (exterior-art virtual carrier): Cormorant + plate on H12 k0 outer face; Neural Dance on H5 k2 outer face; full Friends Club
#   mural + brass plate on the outer wall (12.192 m true size on a 16.5 m wall). START-S cleared: FC teaser + plate re-parked.
# Usage: python3 tools/nest779.py
import json, math
CAT = 'src/catalog.json'; c = json.load(open(CAT)); T = c['layout']['tags']
assert T['nest']['issue'] == 778 and not T.get('openCourts'), 'needs the LIVE #778 catalog (/tmp/pre779/catalog.json)'
PL = json.load(open('/workspace/gallery-tj-feedback/hex-plan-honeycomb-nest/plan-nest.json'))['courtyard']; V = PL['vertices_m']
ROOM = {r['id']: r for r in T['rooms']}; LP = {p['id']: p for p in T['paintings']}
R = 8.25; AP = R * math.sqrt(3) / 2; ROT = 30; DW = 1.2; WT = 0.16
def nv(k): a = math.radians(60 * k + ROT); return (round(math.cos(a), 4) + 0.0, round(math.sin(a), 4) + 0.0)
def tv(k): n = nv(k); return (-n[1] + 0.0, n[0])
def mid(rid, k): cx, cz = ROOM[rid]['center']; n = nv(k); return (cx + AP * n[0], cz + AP * n[1])
H1 = ROOM['room-01']; assert H1['planId'] == 'H1' and 1 not in H1['doorWalls']
m1 = mid('room-01', 1); assert abs(m1[0]) < 1e-3 and abs(m1[1] - V[0][1]) < 1e-3, m1
H1['doorWalls'] = sorted(H1['doorWalls'] + [1]); H1['doorOffsets']['1'] = 0.0; H1['doorWidths']['1'] = DW; H1['neighbours']['1'] = 'courtyard-h1'
# ---- H1 hang: move a painting (+plate) rigidly along its wall / onto another wall
def place(p, k, s_new):
    cx, cz = H1['center']; n = nv(k); t = tv(k); m = mid('room-01', k)
    q = p.get('plaqueAt'); dq = None
    if q: dq = (q['x'] - p['x']) * tv(p['wall'])[0] + (q['z'] - p['z']) * tv(p['wall'])[1]
    p['x'], p['z'] = round(m[0] + t[0] * s_new - n[0] * 0.0, 3), round(m[1] + t[1] * s_new, 3); p['ix'], p['iz'] = -n[0] + 0.0, -n[1] + 0.0; p['wall'] = k
    # keep the old 3 cm stand-off from the wall line (paintings sit ~0.03 m inside)
    p['x'], p['z'] = round(p['x'] - n[0] * 0.03, 3), round(p['z'] - n[1] * 0.03, 3)
    if q: q['x'], q['z'] = round(p['x'] + t[0] * dq, 3), round(p['z'] + t[1] * dq, 3)
    l = LP.get(p['id'])
    if l:
        l.update(x=p['x'], z=p['z'], ix=p['ix'], iz=p['iz'], wall=k, s=round(s_new, 3))
        if l.get('plaque') and q: l['plaque'].update(x=q['x'], z=q['z'])
P1 = {p['id']: p for p in c['paintings'] if p['room'] == 'room-01'}
def span(p):  # (lo, hi) of painting+plate relative to the painting centre, along its wall tangent
    t = tv(p['wall']); lo, hi = -p['fw'] / 2, p['fw'] / 2; q = p.get('plaqueAt')
    if q: d = (q['x'] - p['x']) * t[0] + (q['z'] - p['z']) * t[1]; lo, hi = min(lo, d - q['w'] / 2), max(hi, d + q['w'] / 2)
    return lo, hi
moved = {}
rp = P1['rice-paddies-in-vietnam']; lo, hi = span(rp); place(rp, 3, -(lo + hi) / 2); moved['rice-paddies-in-vietnam'] = 'H1 k1 -> H1 k3 (centred)'
GAP = 0.15; LIM = R / 2 - 0.3; DOOR_CLR = DW / 2 + 0.2
def pack(ids, a, b):  # pack in order, centred in [a, b]
    sp = [span(P1[i]) for i in ids]; tot = sum(h - l for l, h in sp) + GAP * (len(ids) - 1); assert tot <= b - a + 1e-6, (ids, tot, b - a)
    s = a + (b - a - tot) / 2
    for i, (l, h) in zip(ids, sp): place(P1[i], 1, s - l); moved[i] = 'H1 k1 s=%.3f' % (s - l); s += (h - l) + GAP
k1 = sorted([p for p in P1.values() if p['wall'] == 1], key=lambda p: (p['x'] - 0) * tv(1)[0] + (p['z'] - m1[1]) * tv(1)[1])
sv = {p['id']: p['x'] * tv(1)[0] for p in k1}
ids = [p['id'] for p in k1]; NEG = ids[:3]  # order kept along the wall; 3 left of the door, the big book-art right (does not fit 2+2)
pack(NEG, -LIM, -DOOR_CLR); pack(ids[3:], DOOR_CLR, LIM)
# ---- open court geometry
cz_out = V[2][1]
T['openCourts'] = [dict(id='courtyard-h1', label='Courtyard', poly=V, center=[0.0, round((V[0][1] + V[2][1]) / 2, 3)], radius=8.25, door=dict(room='room-01', k=1, width=DW, at=[0.0, V[0][1]]),
    walls=[dict(id='courtyard-outer-wall', x0=V[3][0] - 0.1, z0=round(cz_out + WT / 2, 3), x1=V[2][0] + 0.1, z1=round(cz_out + WT / 2, 3), nx=0.0, nz=-1.0)],
    note='#779 open-air trapezoid N of H1 between H12 (left, Cormorant) and H5 (right, Neural Dance); freestanding outer wall carries the Friends Club mural')]
# ---- art
EX = T['outerCourts'][0]; PK = T['parked777']; PKA = {a['id']: a for a in PK['art']}
def on(rid, k, s, y, a, room=None):  # art on a room wall's OUTSIDE face (n = +normal of wall k), 6 cm off the wall line like the #778 slots
    m = mid(rid, k); n = nv(k); t = tv(k)
    a.update(x=round(m[0] + t[0] * s + n[0] * 0.06, 3), z=round(m[1] + t[1] * s + n[1] * 0.06, 3), y=y, wallFacing=[n[0], n[1]], room=room, onWallOf=None)
    for f in ('wallCenter', 'wallLength', 'courtWall'): a.pop(f, None)
A = {a['id']: a for a in EX['art']}
assert nv(0) == (0.866, 0.5) and nv(2) == (-0.866, 0.5)
cm = A['cormorant-presiding-over-sunset-on-puget-sound']; on('room-12', 0, 0.0, 1.55, cm, 'courtyard-h1'); cm['movedBy'] = '#779 courtyard LEFT: H12 NE outer face'
cp = A['cormorant-qr-brass-plaque']; on('room-12', 0, cm['w'] / 2 + 0.15 + cp['w'] / 2, 1.45, cp, 'courtyard-h1'); cp['movedBy'] = '#779 beside the Cormorant'
nd = PKA.pop('neural-dance'); on('room-05', 2, 0.0, 2.188, nd, 'courtyard-h1'); nd['movedBy'] = '#779 courtyard RIGHT: H5 NW outer face'
fc = PKA.pop('friends-club-mural'); fb = PKA.pop('friends-club-brass-plaque'); assert fc['w'] <= 16.5 - 2 * (fb['w'] + 0.3)
zf = round(cz_out - 0.03, 3)
fc.update(x=0.0, z=zf, y=fc['y'], wallFacing=[0.0, -1.0], room='courtyard-h1', movedBy='#779 courtyard outer wall (true size 12.192 x 2.743)')
fb.update(x=round(-(fc['w'] / 2 + 0.15 + fb['w'] / 2), 3), z=zf, y=1.45, wallFacing=[0.0, -1.0], room='courtyard-h1', onWallOf=None, movedBy='#779 beside the FC mural')
for a in (fc, fb): [a.pop(f, None) for f in ('wallCenter', 'wallLength', 'courtWall')]
for i in ('friends-club-mural-teaser', 'friends-club-teaser-plaque'): a = A[i]; a.update(parkedBy='#779 START-S cleared (full FC mural now on the courtyard outer wall)'); PKA[i] = a
EX['art'] = [a for a in EX['art'] if a['id'] not in ('friends-club-mural-teaser', 'friends-club-teaser-plaque')] + [nd, fc, fb]
PK['art'] = list(PKA.values()); PK['note'] += '; #779: neural-dance + friends-club-mural + plate unparked to the H1 courtyard, FC teaser + plate re-parked'
T['nest']['issue'] = 779; T['nest']['prev'] = 778; T['nest']['boards']['cormorant'] = ['room-12', 0, 'outside, courtyard-h1']; T['nest']['boards'].pop('fc-small', None)
T['nest']['courtyard'] = dict(moved=moved, door='room-01 k1 1.2 m', art={'left H12 k0': 'cormorant', 'right H5 k2': 'neural-dance', 'outer wall': 'friends-club-mural'})
open(CAT, 'w').write(json.dumps(c, ensure_ascii=False, separators=(',', ':')))
print('moved', moved); print('art', [(a['id'], a['x'], a['z'], a['y']) for a in EX['art']])
