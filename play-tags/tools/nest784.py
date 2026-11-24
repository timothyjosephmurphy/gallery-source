# #784 (TJ Oct 27 2026): Paul Murphy nestled annex in the former BTC pocket (door H5 k5) + Bitcoin courtyard moved off H7 (door H7 k5).
# Patches LIVE #783 catalog (/tmp/pre784-catalog.json). START untouched. Parked Paul Murphy works hung two rows on the annex outer wall.
import json, math
CAT = 'src/catalog.json'; c = json.load(open(CAT)); T = c['layout']['tags']; assert T['nest']['issue'] == 783
PN = json.load(open('/workspace/gallery-tj-feedback/hex-plan-honeycomb-nest/plan-nest.json'))
ROOM = {r['id']: r for r in T['rooms']}; LP = {p['id']: p for p in T['paintings']}
R = 8.25; AP = R * math.sqrt(3) / 2; DW = 1.2; WT = 0.16
def nv(k): a = math.radians(60 * k + 30); return (round(math.cos(a), 4) + 0.0, round(math.sin(a), 4) + 0.0)
def tv(k): n = nv(k); return (-n[1] + 0.0, n[0])
def add_door(RID, K, to, at):
    H = ROOM[RID]; assert K not in H['doorWalls']
    cx, cz = H['center']; n = nv(K); t = tv(K); m = (cx + AP * n[0], cz + AP * n[1]); assert abs(m[0]-at[0]) < 2e-3 and abs(m[1]-at[1]) < 2e-3, m
    H['doorWalls'] = sorted(H['doorWalls'] + [K]); H['doorOffsets'][str(K)] = 0.0; H['doorWidths'][str(K)] = DW; H['neighbours'][str(K)] = to
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
            for p in g: lo, hi = span(p); place(p, s - lo); moved[p['id']] = '%s k%d s=%.3f' % (RID, K, s - lo); s += hi - lo + GAP
    return blocking, moved
# ---- 1. H2 k0 door removed (wall closes; its works were already clear of the door span)
H2 = ROOM['room-02']; assert H2['neighbours']['0'] == 'courtyard-btc'
H2['doorWalls'] = [k for k in H2['doorWalls'] if k != 0]
for d in ('doorOffsets', 'doorWidths', 'neighbours'): H2[d].pop('0', None)
# ---- 2. old BTC court -> courtyard-paul (same poly + outer wall), door H5 k5
OC = {o['id']: o for o in T['openCourts']}; old = OC['courtyard-btc']
pv = PN['paul_murphy_annex']['vertices_m']; assert pv == old['poly']
pb, pm = add_door('room-05', 5, 'courtyard-paul', [18.562, 17.861])
paul = dict(id='courtyard-paul', label='Paul Murphy', poly=pv, center=[21.656, 12.503], radius=8.25, door=dict(room='room-05', k=5, width=DW, at=[18.562, 17.861]),
    walls=[dict(old['walls'][0], id='courtyard-paul-outer-wall')], note='#784 Paul Murphy nestled annex off H5 Family (former BTC pocket); outer edge = Paul Murphy hang')
# ---- 3. BTC court -> pocket H6|H7|H10, door H7 k5
V = PN['bitcoin_courtyard']['vertices_m']
bb, bm = add_door('room-07', 5, 'courtyard-btc', [18.562, -10.716])
dx, dz = V[2][0] - V[3][0], V[2][1] - V[3][1]; L = math.hypot(dx, dz); ux, uz = dx / L, dz / L
inn = (-0.866, 0.5); assert abs(inn[0] * ux + inn[1] * uz) < 1e-3
ox, oz = -inn[0] * WT / 2, -inn[1] * WT / 2
btc = dict(old, poly=V, center=[21.656, -12.503], door=dict(room='room-07', k=5, width=DW, at=[18.562, -10.716]),
    walls=[dict(id='courtyard-btc-outer-wall', x0=round(V[3][0] - ux * 0.1 + ox, 3), z0=round(V[3][1] - uz * 0.1 + oz, 3), x1=round(V[2][0] + ux * 0.1 + ox, 3), z1=round(V[2][1] + uz * 0.1 + oz, 3), nx=inn[0], nz=inn[1], steeples=True)],
    note='#784 Bitcoin courtyard nestled off H7 between H6|H7|H10; outer edge = Berlin-El Salvador mural; church steeples beyond')
T['openCourts'] = [paul if o['id'] == 'courtyard-btc' else o for o in T['openCourts']] + [btc]
EX = T['outerCourts'][0]; B = next(a for a in EX['art'] if a['id'] == 'berlin-el-salvador-mural')
mx, mz = (V[2][0] + V[3][0]) / 2, (V[2][1] + V[3][1]) / 2
B.update(x=round(mx + inn[0] * 0.03, 3), z=round(mz + inn[1] * 0.03, 3), wallFacing=[inn[0], inn[1]], room='courtyard-btc', movedBy='#784 moved with the Bitcoin courtyard to the H6|H7|H10 outer wall, centred; ' + B['movedBy'])
# ---- 4. parked Paul Murphy works -> annex outer wall, two rows, true size, order kept
PK = T['parked777']; PP = [p for p in PK['paintings'] if p['id'].startswith('paul-murphy-painting')]; ids = {p['id'] for p in PP}
W0 = paul['walls'][0]; fx, fz = -0.866, -0.5; wx0, wz0 = old['poly'][3]; wx1, wz1 = old['poly'][2]
L = math.hypot(wx1 - wx0, wz1 - wz0); tx, tz = (wx1 - wx0) / L, (wz1 - wz0) / L; cmx, cmz = (wx0 + wx1) / 2, (wz0 + wz1) / 2
half = (len(PP) + 1) // 2; rows = [(PP[:half], 1.95), (PP[half:], 1.32)]; GAP = 0.12; hung = {}
for row, y in rows:
    tot = sum(p['fw'] for p in row) + GAP * (len(row) - 1); assert tot < L - 1.0, tot; s = -tot / 2
    for p in row:
        sc = s + p['fw'] / 2; x, z = round(cmx + tx * sc + fx * 0.03, 3), round(cmz + tz * sc + fz * 0.03, 3)
        p.update(room='courtyard-paul', wall=0, x=x, z=z, y=y, cy=y, ix=fx, iz=fz, freestanding=True, s=round(sc, 3))
        p.pop('parkedBy', None); p['plaqueAt'] = dict(s=round(sc, 3), x=x, z=z, y=round(y - p['fh'] / 2 - 0.12, 3), w=0.26, h=0.18) if False else None
        p.pop('plaqueAt'); hung[p['id']] = [x, z, y]; s += p['fw'] + GAP
c['paintings'] += PP; PK['paintings'] = [p for p in PK['paintings'] if p['id'] not in ids]
lp = [p for p in PK['layoutPaintings'] if p['id'] in ids]
for l in lp:
    h = hung[l['id']]; l.update(room='courtyard-paul', wall=0, x=h[0], z=h[1], y=h[2]); l.pop('plaque', None)
T['paintings'] += lp; PK['layoutPaintings'] = [p for p in PK['layoutPaintings'] if p['id'] not in ids]
PK['note'] += '; #784: %d Paul Murphy works unparked to the courtyard-paul outer wall' % len(PP)
T['nest'].update(issue=784, prev=783, paulAnnex=dict(door='room-05 k5 1.2 m', blocking=pb, moved=pm, hung=len(PP)), bitcoinCourtyard=dict(door='room-07 k5 1.2 m', blocking=bb, moved=bm, removedDoor='room-02 k0'))
open(CAT, 'w').write(json.dumps(c, ensure_ascii=False, separators=(',', ':')))
print('H7 blocking', bb, bm); print('btc wall', btc['walls']); print('berlin', B['x'], B['z'], B['wallFacing']); print('paul hung', len(PP), len(lp))
