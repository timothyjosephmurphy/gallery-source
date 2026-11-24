# B2a (Oct 27 2026, after #774 honeycomb): hang patches on the honeycomb src/catalog.json. Run AFTER apply-overrides -> honeycomb774.py -> outerslots -> honeycomb774.py art.
# Wall frame = honeycomb hex (centre, apothem, wall k normal at 60k deg); paintings 3 cm off the wall face, plaques beside.
#   #767 drop Sunrise in Puerto Vallarta; #318 Forest Triptych one row; #742 Honey Badger | Coined | Syrenka trio; #766 Cormorant QR plate alone outside;
#   #760 four Austin portraits -> Friends Court (outside face of room-11 w3); #763 labels without prices.
import json, math
F = 'src/catalog.json'; c = json.load(open(F)); T = c['layout']['tags']; ROOMS = {r['id']: r for r in T['rooms']}
R = {p['id']: p for p in c['paintings']}; LP = {q['id']: q for q in T['paintings']}
PLQ_W, PLQ_H, PG, DW = 0.26, 0.18, 0.02, 2.2
def nv(k): a = math.radians(60 * k); return (math.cos(a), math.sin(a))
def tv(k): n = nv(k); return (-n[1], n[0])
def frame(rid, k, ext=False):
    r = ROOMS[rid]; n, t = nv(k), tv(k); cx, cz = r['center']; d = r['apothem'] + (0.11 if ext else -0.03)
    if ext: t = (-t[0], -t[1])  # visitor's right while facing the outside face
    return (cx + d * n[0], cz + d * n[1]), t, ((n[0], n[1]) if ext else (-n[0], -n[1])), r['radius'] / 2
def busy(rid, k, skip):
    r = ROOMS[rid]; out = []
    if k in r['doorWalls']: o = r['doorOffsets'][str(k)]; out.append((o - DW / 2 - 0.1, o + DW / 2 + 0.1))
    (mx, mz), t, _, _ = frame(rid, k)
    for p in c['paintings']:
        if p['room'] != rid or p.get('wall') != k or p['id'] in skip: continue
        s = (p['x'] - mx) * t[0] + (p['z'] - mz) * t[1]; out.append((s - p['fw'] / 2, s + p['fw'] / 2))
        if p.get('plaqueAt'): q = p['plaqueAt']; s = (q['x'] - mx) * t[0] + (q['z'] - mz) * t[1]; out.append((s - q['w'] / 2, s + q['w'] / 2))
    return out
def free(rid, k, skip=(), ext=False):
    h = ROOMS[rid]['radius'] / 2 - 0.25; B = sorted(busy(rid, k, skip)) if not ext else []; iv, a = [], -h
    for lo, hi in B:
        if lo > a: iv.append((a, min(lo, h)))
        a = max(a, hi)
    if a < h: iv.append((a, h))
    return [x for x in iv if x[1] - x[0] > 0.1]
def put(i, rid, k, s, y, ps, ext=False, room=None):
    (mx, mz), t, f, _ = frame(rid, k, ext); p, q = R[i], LP.get(i, {})
    for o in (p, q): o.update(room=room or rid, wall=k, x=round(mx + t[0] * s, 3), z=round(mz + t[1] * s, 3), y=y, ix=round(f[0], 4), iz=round(f[1], 4))
    q['s'] = round(s, 3); p['stack'] = None; p['grid'] = None; p['cy'] = None
    if ps is None: p['plaqueAt'] = None; q['plaque'] = None; return
    py = 1.45 if (y - p['fh'] / 2) <= 1.45 <= (y + p['fh'] / 2) else round(y, 3)
    pa = dict(w=PLQ_W, h=PLQ_H, s=round(ps, 3), x=round(mx + t[0] * ps, 3), z=round(mz + t[1] * ps, 3), y=py); p['plaqueAt'] = pa; q['plaque'] = dict(pa)
def row(units, rid, k, y, gap=0.06, inner=0.04, ext=False, room=None, skip=()):
    W = [sum(R[i]['fw'] for i in u) + inner * (len(u) - 1) + PG + PLQ_W for u in units]; tot = sum(W) + gap * (len(W) - 1)
    iv = [x for x in free(rid, k, set(skip) | {i for u in units for i in u}, ext) if x[1] - x[0] >= tot]
    if not iv: return None
    a, b = max(iv, key=lambda x: x[1] - x[0]); x0 = (a + b) / 2 - tot / 2
    for u, wu in zip(units, W):
        cur = x0
        for j, i in enumerate(u): put(i, rid, k, cur + R[i]['fw'] / 2, y, cur + R[i]['fw'] + PG + PLQ_W / 2 if j == len(u) - 1 else None, ext, room); cur += R[i]['fw'] + inner
        x0 += wu + gap
    return (rid, k, round(tot, 2))
log = []
PV = 'book-art-87cf2a732259b313f5ab'  # #767
if PV in R: c['paintings'][:] = [p for p in c['paintings'] if p['id'] != PV]; T['paintings'][:] = [q for q in T['paintings'] if q['id'] != PV]; R.pop(PV); log.append('#767 removed ' + PV)
if PV not in c.setdefault('excluded', []): c['excluded'].append(PV)
FT = ['older-work-forest-triptych-original-2', 'older-work-forest-triptych-original-1', 'older-work-forest-triptych-original-3']  # #318: 302 | 303 | 304, one plaque after the set
log.append(('#318', row([FT], 'room-02', 5, 1.45)))
TRIO = ['honeybadger-and-cub-with-genesis-block', 'coined-in-watercolor-film-poster', 'warszawska-syrenka']  # #742
for rid in ('room-07', 'room-10', 'room-11'):
    done = next((x for x in (row([[i] for i in TRIO], rid, k, 1.219) for k in range(6)) if x), None)
    if done: log.append(('#742', done)); break
else: raise SystemExit('no wall for the trio')
AUS = ['book-art-1ff2691533c9a9d8b091', 'book-art-df8db0bc08adfeae5829', 'book-art-4a03ad4df3ef51a39639', 'book-art-616ff8378f27047b4a91']  # #760
log.append(('#760', row([[i] for i in AUS], 'room-11', 3, 1.3, ext=True, room='friends-court')))
FC = next(o for o in T['outerCourts'] if o['id'] == 'friends-court')
for a in FC['art']:  # #766: Cormorant QR plate off the mural wall, alone on the outside of room-10 w4 (lawn side)
    if a['id'] == 'cormorant-qr-brass-plaque':
        (mx, mz), t, f, _ = frame('room-10', 4, True); a.update(x=round(mx, 3), z=round(mz, 3), y=1.45, wallFacing=[round(f[0], 4), round(f[1], 4)], onWallOf=None, movedBy='#766 alone on room-10 w4 outside'); log.append('#766 plate room-10 w4 outside')
for r in T['rooms']:  # #763
    if '$' in r.get('label', ''): r['label'] = ' · '.join(x for x in r['label'].split(' · ') if '$' not in x); log.append('#763 ' + r['id'] + ' -> ' + r['label'])
open(F, 'w').write(json.dumps(c, ensure_ascii=False, separators=(',', ':'))); print('\n'.join(map(str, log)))
