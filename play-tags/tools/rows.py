# #323 true-size row groups (TJ: #318 Forest Triptych, #319 Strawberry Point, #320 Ukraine). Specs live in hang-overrides.json 'rows':
#   {name, wall:'room-NN/k', reserve:[a,b] | 'all', span:[a,b] | null (null = whole free wall), rows:[[unit,...],...], y:[centre y per row], gap, inner, note}
#   unit = [painting ids] (a triptych is one unit of three panels, one plaque after the last panel); every painting at TRUE size (never scaled/stretched),
#   plaque beside its painting (1.45 m when the frame spans 1.45, else at the painting's centre).
import math, repack
PLQ_W, PLQ_H, PG = 0.26, 0.18, 0.02
def reserve(specs):
    for sp in specs:
        rid, wk = sp['wall'].split('/'); wk = int(wk); repack.RESERVE.setdefault((rid, wk), []).append((-99, 99) if sp.get('reserve') == 'all' else tuple(sp['reserve']))
def displace(c, specs, displaced):
    """works hanging on a whole-wall reserve (other than the row members) are detached and re-placed like #300 displaced works."""
    members = {i for sp in specs for row in sp['rows'] for u in row for i in u}
    for sp in specs:
        if sp.get('reserve') != 'all': continue
        rid, wk = sp['wall'].split('/'); wk = int(wk)
        for p in c['paintings']:
            if p.get('room') == rid and p.get('wall') == wk and p['id'] not in displaced and p['id'] not in members: displaced.append(p['id'])
def stash(c, LP, specs):
    """take the row members off the lists (so spread/repack never touch them)."""
    members = {i for sp in specs for row in sp['rows'] for u in row for i in u}; keep = {}
    for p in list(c['paintings']):
        if p['id'] in members: keep[p['id']] = (p, LP[p['id']])
    c['paintings'] = [p for p in c['paintings'] if p['id'] not in members]; c['layout']['tags']['paintings'] = [q for q in c['layout']['tags']['paintings'] if q['id'] not in members]
    return keep
def place(c, LP, keep, specs):
    rooms = {r['id']: r for r in c['layout']['tags']['rooms']}; rep = []
    for sp in specs:
        rid, wk = sp['wall'].split('/'); wk = int(wk); w = repack.FR[rid]['walls'][str(wk)]; ix, iz = w['ix'], w['iz']; tx, tz = iz, -ix
        iv = repack.ivs(rooms[rid], wk, w['bx'], w['bz'], ix, iz, res=False); a, b = sp.get('span') or max(iv, key=lambda x: x[1] - x[0])
        for ri, row in enumerate(sp['rows']):
            gap, inner, PG = sp.get('gap', 0.03), sp.get('inner', 0.04), sp.get('pg', 0.02); W = []
            for u in row:
                ps = [keep[i][0] for i in u]; W.append(sum(p['fw'] for p in ps) + inner * (len(ps) - 1) + PG + PLQ_W)
            tot = sum(W) + gap * (len(W) - 1); rep.append(dict(name=sp['name'], wall=sp['wall'], row=ri, need=round(tot, 3), have=round(b - a, 3), ok=tot <= b - a + 1e-9))
            x0 = (a + b) / 2 - tot / 2; yc = sp['y'][ri]
            for u, wu in zip(row, W):
                ps = [keep[i][0] for i in u]; cur = x0
                for k, p in enumerate(ps):
                    sc = cur + p['fw'] / 2; q = keep[p['id']][1]
                    for o in (p, q): o.update(room=rid, wall=wk, x=round(w['bx'] + tx * sc, 3), z=round(w['bz'] + tz * sc, 3), y=yc, ix=ix, iz=iz)
                    q['s'] = round(sc, 3); p['stack'] = None; p['grid'] = None; p['cy'] = None; p.pop('artScale', None)
                    last = k == len(ps) - 1
                    if last:
                        ps_ = cur + p['fw'] + PG + PLQ_W / 2; py = 1.45 if (yc - p['fh'] / 2) <= 1.45 <= (yc + p['fh'] / 2) else round(yc, 3)
                        pa = dict(p.get('plaqueAt') or dict(w=PLQ_W, h=PLQ_H)); pa.update(s=round(ps_, 3), x=round(w['bx'] + tx * ps_, 3), z=round(w['bz'] + tz * ps_, 3), y=py)
                        p['plaqueAt'] = pa; q['plaque'] = dict(pa)
                    else: p['plaqueAt'] = None; q['plaque'] = None
                    cur += p['fw'] + inner
                x0 += wu + gap
        for u in [i for row in sp['rows'] for un in row for i in un]:
            p, q = keep[u]; c['paintings'].append(p); c['layout']['tags']['paintings'].append(q)
    return rep
