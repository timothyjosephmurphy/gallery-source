# B2a (Oct 27 2026): hang patches applied to the committed src/catalog.json AFTER apply-overrides (the full regen drifts, see
# gallery-courtyard/APPLY-OVERRIDES-DRIFT.md). Idempotent: checks state before each step. Same placement math as tools/rows.py.
#   #767 remove Sunrise in Puerto Vallarta; #318 Forest Triptych one row; #742 Honey Badger / Coined / Syrenka trio; #763 label w/o price.
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import repack
F = 'src/catalog.json'; c = json.load(open(F)); T = c['layout']['tags']
R = {p['id']: p for p in c['paintings']}; LP = {q['id']: q for q in T['paintings']}
PLQ_W, PLQ_H, PG = 0.26, 0.18, 0.02
def drop(i):
    c['paintings'][:] = [p for p in c['paintings'] if p['id'] != i]; T['paintings'][:] = [q for q in T['paintings'] if q['id'] != i]
def put(i, rid, wk, sc, yc, plaque_s=None):
    w = repack.FR[rid]['walls'][str(wk)]; ix, iz = w['ix'], w['iz']; tx, tz = iz, -ix; p, q = R[i], LP[i]
    for o in (p, q): o.update(room=rid, wall=wk, x=round(w['bx'] + tx * sc, 3), z=round(w['bz'] + tz * sc, 3), y=yc, ix=ix, iz=iz)
    q['s'] = round(sc, 3); p['stack'] = None; p['grid'] = None; p['cy'] = None; p.pop('artScale', None)
    if plaque_s is None: p['plaqueAt'] = None; q['plaque'] = None; return
    py = 1.45 if (yc - p['fh'] / 2) <= 1.45 <= (yc + p['fh'] / 2) else round(yc, 3)
    pa = dict(p.get('plaqueAt') or dict(w=PLQ_W, h=PLQ_H)); pa.update(s=round(plaque_s, 3), x=round(w['bx'] + tx * plaque_s, 3), z=round(w['bz'] + tz * plaque_s, 3), y=py)
    p['plaqueAt'] = pa; q['plaque'] = dict(pa)
def row(rid, wk, units, yc, centre=None, gap=0.05, inner=0.04):
    """units: list of [ids] (a triptych is one unit, one plaque after its last panel). Laid out left->right (increasing s)."""
    W = [sum(R[i]['fw'] for i in u) + inner * (len(u) - 1) + PG + PLQ_W for u in units]; tot = sum(W) + gap * (len(W) - 1)
    w = repack.FR[rid]['walls'][str(wk)]; iv = max(repack.ivs({r['id']: r for r in T['rooms']}[rid], wk, w['bx'], w['bz'], w['ix'], w['iz'], res=False), key=lambda x: x[1] - x[0])
    x0 = ((iv[0] + iv[1]) / 2 if centre is None else centre) - tot / 2
    assert x0 >= iv[0] - 1e-6 and x0 + tot <= iv[1] + 1e-6, (rid, wk, x0, tot, iv)
    for u, wu in zip(units, W):
        cur = x0
        for k, i in enumerate(u):
            last = k == len(u) - 1; put(i, rid, wk, cur + R[i]['fw'] / 2, yc, cur + R[i]['fw'] + PG + PLQ_W / 2 if last else None); cur += R[i]['fw'] + inner
        x0 += wu + gap
    return x0, tot
log = []
# #767
PV = 'book-art-87cf2a732259b313f5ab'
if PV in R: drop(PV); c.setdefault('excluded', []); log.append('#767 removed ' + PV)
if isinstance(c.get('excluded'), list) and PV not in c['excluded']: c['excluded'].append(PV)
# #318 Forest Triptych: one horizontal row, 302 / 303 / 304 left->right, same height, 4 cm gaps, one plaque after the set
FT = ['older-work-forest-triptych-original-2', 'older-work-forest-triptych-original-1', 'older-work-forest-triptych-original-3']
row('room-02', 5, [FT], 1.219, centre=1.285); log.append('#318 triptych row room-02/5')
# #742 trio on room-07/5 (Bitcoiners): Honey Badger | Coined (middle) | Syrenka, then the wall's 3 small works as one column
TRIO = ['honeybadger-and-cub-with-genesis-block', 'coined-in-watercolor-film-poster', 'warszawska-syrenka']
end, tot = row('room-07', 5, [[TRIO[0]], [TRIO[1]], [TRIO[2]]], 1.219, centre=-2.6 + (sum(R[i]['fw'] for i in TRIO) + 3 * (PG + PLQ_W) + 0.1) / 2 + 0.1)
col = [('archived-painting-367', 1.95), ('archived-painting-362', 1.35), ('book-art-0351c2ff290526e4f204', 0.85)]
cw = max(R[i]['fw'] for i, _ in col); cs = end + cw / 2
assert cs + cw / 2 + PG + PLQ_W <= 2.6, cs
for i, y in col: put(i, 'room-07', 5, cs, y, cs + cw / 2 + PG + PLQ_W / 2)
log.append('#742 trio room-07/5')
# #763 doorway/room label without the price line
for r in T['rooms']:
    if '$' in r.get('label', ''): r['label'] = ' · '.join(x for x in r['label'].split(' · ') if '$' not in x); log.append('#763 label ' + r['id'] + ' -> ' + r['label'])
json.dump(c, open(F, 'w'), separators=(',', ':'))
print('\n'.join(log))
