# #781 (TJ-approved Oct 27 2026 via Studio manager): Bitcoin open-air trapezoid COURTYARD outside H2 (plan-nest.json "bitcoin_courtyard").
# PATCHES the LIVE #780 catalog (pristine at /tmp/pre781-catalog.json). START untouched.
# - H2 (room-02) NE wall k0 gets ONE 1.2 m outer door at its midpoint (18.562,10.716) -> 'courtyard-btc' (one-door side space).
#   H2 k0 works re-spaced around the door if they block it (order kept, true size).
# - T.openCourts += walkable trapezoid + freestanding outer edge (20.625,21.434)-(28.875,7.144). Legs H5 / H10 outer faces: open, TBD.
# - Berlin-El Salvador mural + shipping-container dressing ON HOLD (TJ sending a further-back photo; no plinth; mural goes on a container).
import json, math
CAT = 'src/catalog.json'; c = json.load(open(CAT)); T = c['layout']['tags']
assert T['nest']['issue'] == 780 and len(T.get('openCourts', [])) == 1, 'needs the LIVE #780 catalog (/tmp/pre781-catalog.json)'
V = json.load(open('/workspace/gallery-tj-feedback/hex-plan-honeycomb-nest/plan-nest.json'))['bitcoin_courtyard']['vertices_m']
ROOM = {r['id']: r for r in T['rooms']}; LP = {p['id']: p for p in T['paintings']}
R = 8.25; AP = R * math.sqrt(3) / 2; ROT = 30; DW = 1.2; WT = 0.16; RID = 'room-02'; K = 0
def nv(k): a = math.radians(60 * k + ROT); return (round(math.cos(a), 4) + 0.0, round(math.sin(a), 4) + 0.0)
def tv(k): n = nv(k); return (-n[1] + 0.0, n[0])
H = ROOM[RID]; assert H['planId'] == 'H2' and K not in H['doorWalls']
cx, cz = H['center']; n = nv(K); t = tv(K); m = (cx + AP * n[0], cz + AP * n[1])
assert abs(m[0] - 18.562) < 2e-3 and abs(m[1] - 10.716) < 2e-3, m
H['doorWalls'] = sorted(H['doorWalls'] + [K]); H['doorOffsets'][str(K)] = 0.0; H['doorWidths'][str(K)] = DW; H['neighbours'][str(K)] = 'courtyard-btc'
P = [p for p in c['paintings'] if p['room'] == RID and p['wall'] == K]
def s_of(x, z): return (x - m[0]) * t[0] + (z - m[1]) * t[1]
def span(p):
    lo, hi = -p['fw'] / 2, p['fw'] / 2; q = p.get('plaqueAt')
    if q: d = s_of(q['x'], q['z']) - s_of(p['x'], p['z']); lo, hi = min(lo, d - q['w'] / 2), max(hi, d + q['w'] / 2)
    return lo, hi
def place(p, s_new):
    q = p.get('plaqueAt'); dq = s_of(q['x'], q['z']) - s_of(p['x'], p['z']) if q else None
    p['x'], p['z'] = round(m[0] + t[0] * s_new - n[0] * 0.03, 3), round(m[1] + t[1] * s_new - n[1] * 0.03, 3)
    if q: q['x'], q['z'] = round(p['x'] + t[0] * dq, 3), round(p['z'] + t[1] * dq, 3)
    l = LP.get(p['id'])
    if l:
        l.update(x=p['x'], z=p['z'], s=round(s_new, 3))
        if l.get('plaque') and q: l['plaque'].update(x=q['x'], z=q['z'])
GAP = 0.15; LIM = R / 2 - 0.3; CLR = DW / 2 + 0.2; moved = {}
P.sort(key=lambda p: s_of(p['x'], p['z']))
blocking = [p['id'] for p in P if (lambda s, sp: s + sp[1] > -CLR and s + sp[0] < CLR)(s_of(p['x'], p['z']), span(p))]
if blocking:
    neg = [p for p in P if s_of(p['x'], p['z']) < 0]; pos = [p for p in P if s_of(p['x'], p['z']) >= 0]
    def tot(g): return sum(span(p)[1] - span(p)[0] for p in g) + GAP * max(len(g) - 1, 0)
    while tot(neg) > LIM - CLR and neg: pos.insert(0, neg.pop())
    while tot(pos) > LIM - CLR and pos: neg.append(pos.pop(0))
    for g, a, b in ((neg, -LIM, -CLR), (pos, CLR, LIM)):
        assert tot(g) <= b - a + 1e-6, ([p['id'] for p in g], tot(g)); s = a + (b - a - tot(g)) / 2
        for p in g: lo, hi = span(p); place(p, s - lo); moved[p['id']] = 'H2 k0 s=%.3f' % (s - lo); s += hi - lo + GAP
# ---- open court geometry: outer edge V3->V2 (diagonal), inward normal toward the court
dx, dz = V[2][0] - V[3][0], V[2][1] - V[3][1]; L = math.hypot(dx, dz); ux, uz = dx / L, dz / L
inn = (-0.866, -0.5); assert abs(inn[0] * ux + inn[1] * uz) < 1e-3
ox, oz = -inn[0] * WT / 2, -inn[1] * WT / 2
T['openCourts'].append(dict(id='courtyard-btc', label='Bitcoin Courtyard', poly=V, center=[21.656, 12.503], radius=8.25, door=dict(room=RID, k=K, width=DW, at=[18.562, 10.716]),
    walls=[dict(id='courtyard-btc-outer-wall', x0=round(V[3][0] - ux * 0.1 + ox, 3), z0=round(V[3][1] - uz * 0.1 + oz, 3), x1=round(V[2][0] + ux * 0.1 + ox, 3), z1=round(V[2][1] + uz * 0.1 + oz, 3), nx=inn[0], nz=inn[1])],
    note='#780 open-air trapezoid outside H2 Bitcoin between H5 (left, TBD) and H10 (right, TBD); outer edge reserved for the Berlin-El Salvador mural on a shipping container'))
MW, MH = 2.08, 0.62; mx, mz = (V[2][0] + V[3][0]) / 2, (V[2][1] + V[3][1]) / 2
EX = T['outerCourts'][0]; assert EX.get('virtual') and not any(a['id'] == 'berlin-el-salvador-mural' for a in EX['art'])
EX['art'].append(dict(id='berlin-el-salvador-mural', kind='mural', title='Berlin, El Salvador Bitcoin mural', tags=['bitcoin', 'el-salvador'], tagsProposed=True, w=MW, h=MH,
    sizeSource='photo-estimate (artist-with-sign.jpeg, TJ ~1.75 m reference; width, height from hero.jpeg aspect); conservative, not enlarged', tex='art/berlin-el-salvador-mural-780.webp',
    url='https://tjm.art/murals/berlin-el-salvador/', placeholder=False, wallFacing=[inn[0], inn[1]], freestanding=True, x=round(mx + inn[0] * 0.03, 3), z=round(mz + inn[1] * 0.03, 3), y=1.6, room='courtyard-btc', movedBy='#781 Bitcoin courtyard outer wall, centred, eye level'))
T['nest']['issue'] = 781; T['nest']['prev'] = 780; T['nest']['bitcoinCourtyard'] = dict(moved=moved, blocking=blocking, door='room-02 k0 1.2 m')
open(CAT, 'w').write(json.dumps(c, ensure_ascii=False, separators=(',', ':')))
print('blocking', blocking); print('moved', moved); print(T['openCourts'][-1]['walls'])
