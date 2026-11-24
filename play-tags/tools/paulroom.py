# #310 (TJ, preview): a Paul Murphy room off to the side. All 38 paul-murphy-painting-* hung at TRUE size (artScale 1.0, never stretched), each in its own
# frame with its plaque and product link. Annex hex room 'room-13' (radius 8) joined to room-07 through a door on room-07's outer wall 5.
import json, math
import import309
IN = 0.0254; RID = 'room-13'; HOST = __import__('os').environ.get('HOST', 'room-02'); HW = int(__import__('os').environ.get('HW', '0')); RAD = float(json.load(open('src/hang-overrides.json')).get('paulRoom', {}).get('radius', 8.0)); HOFF = float(__import__('os').environ.get('HOFF', '0.9')); DATA = import309.DATA
def add_room(c):
    rooms = c['layout']['tags']['rooms']; host = next(r for r in rooms if r['id'] == HOST)
    if any(r['id'] == RID for r in rooms): return
    ap = RAD * math.sqrt(3) / 2; th = math.radians(60 * HW); n = (math.cos(th), math.sin(th)); d = host['apothem'] + ap
    host['doorWalls'] = sorted(set(host['doorWalls'] + [HW])); host['neighbours'][str(HW)] = RID; host['doorOffsets'][str(HW)] = HOFF
    j = (HW + 3) % 6
    rooms.append(dict(id=RID, index=12, cell=[3, -3], radius=RAD, apothem=ap, count=38, label='Paul Murphy', mainTags=['paul-murphy'], annex=True, combines={}, doorWalls=[j], neighbours={str(j): HOST}, innerDoorWall=-1, innerDoor=None,
                      center=[host['center'][0] + n[0] * d, host['center'][1] + n[1] * d], wallSegments=6, blankSegments=[], walkToPavilion=None, doorOffsets={str(j): -HOFF}, wallColor='#efe3cf', palette=host.get('palette', []), centerpiece=None))
def build(c, LP, R, live):
    d = json.load(open(DATA)); M = [m for m in d['paintings'] if m['kind'] == 'paul-murphy']; A = import309.aspects(M); out = []
    for m in M:
        s = m['size_in']; wd, ht = s['w'], s['h']; asp = (A.get(m['image_url']) or [wd, ht]); asp = asp[0] / asp[1]
        w, h = wd * IN, ht * IN
        if w / h > asp: w2, h2 = h * asp, h
        else: w2, h2 = w, w / asp
        w, h = round(w2, 4), round(h2, 4); lv = live.get(m['slug'], {}); cap = 'Watercolor · %g × %g in' % (wd, ht)
        rec = dict(id=m['slug'], room=RID, wall=None, x=0, y=1.45, z=0, ix=0, iz=0, w=w, h=h, iw=w, ih=h, fw=round(w + 0.06, 4), fh=round(h + 0.06, 4), photoShape=False, s=1, smax=1, title=m['title'], url=m['url'], status='available' if lv.get('status') == 'available' else 'nfs', price=None,
                   img='img/' + m['image_url'].split('img.tjm.art/')[1], hi=m['image_url'], plaqueAt=None, set=None, grid=None, stack=None, approxSize=False, medium=m.get('medium'), caption=cap, trueW=w, trueH=h, artScale=1.0, paulMurphy=True, cy=1.45)
        lp = dict(id=m['slug'], twins=[], title=m['title'], url=m['url'], tex=m['image_url'], tags=[], room=RID, wall=None, s=0, x=0, z=0, y=1.45, ix=0, iz=0, w=w, h=h, fw=rec['fw'], fh=rec['fh'], approxSize=False, smax=1, s_scale=1, plaque=None, affinityWall=None, set=None, setPos=None)
        c['paintings'].append(rec); c['layout']['tags']['paintings'].append(lp); R[rec['id']] = rec; LP[rec['id']] = lp; out.append(rec['id'])
    RDp = 'tools/realdims.json'; RD = json.load(open(RDp)); z = dict(top=0.0, bottom=0.0, left=0.0, right=0.0)
    for m in M:
        dd = A.get(m['image_url'])
        if dd: RD[m['slug']] = dict(px=dd, border=z, hiPx=dd, hiBorder=z)
    json.dump(RD, open(RDp, 'w'))
    return out
def place(c, LP):
    r = next(r for r in c['layout']['tags']['rooms'] if r['id'] == RID); cx, cz = r['center']; ap = r['apothem']; half = r['radius'] / 2 - 0.55
    ps = sorted([p for p in c['paintings'] if p.get('paulMurphy')], key=lambda p: int(p['id'].rsplit('-', 1)[1])); doorw = [int(k) for k in r['doorWalls']]
    NR = int(json.load(open('src/hang-overrides.json')).get('paulRoom', {}).get('rows', 1)); walls = [k for k in range(6) if k not in doorw]; walls = [k for k in walls for _ in range(NR)]; unit = lambda p: p['fw'] + 0.04 + 0.26 + 0.1  # painting + gap + plaque + gap
    # fill wall by wall in number order; balance so every wall is used evenly
    tot = sum(unit(p) for p in ps); per = tot / len(walls); rows = []; cur = []; acc = 0
    for p in ps:
        if cur and acc + unit(p) > 2 * half - 0.05 or (acc >= per and len(rows) < len(walls) - 1 and cur): rows.append(cur); cur = []; acc = 0
        cur.append(p); acc += unit(p)
    rows.append(cur); rep = []
    assert len(rows) <= len(walls) and all(sum(unit(p) for p in rw) - 0.1 <= 2 * half for rw in rows), [round(sum(unit(p) for p in rw), 2) for rw in rows]
    seen = {}
    for k, rw in zip(walls, rows):
        lvl = seen.get(k, 0); seen[k] = lvl + 1; yy = 1.45 if NR == 1 else (1.85 if lvl == 0 else 1.15); py = yy if NR > 1 else 1.45
        th = math.radians(60 * k); n = (math.cos(th), math.sin(th)); ix, iz = -n[0], -n[1]; tx, tz = iz, -ix
        bx, bz = cx + (ap - 0.03) * n[0], cz + (ap - 0.03) * n[1]; L = sum(unit(p) for p in rw) - 0.1; s = -L / 2
        for p in rw:
            sc = s + p['fw'] / 2; sp = sc + p['fw'] / 2 + 0.04 + 0.13; q = LP[p['id']]
            pl = dict(s=round(sp, 3), x=round(bx + tx * sp, 3), z=round(bz + tz * sp, 3), y=py, w=0.26, h=0.18)
            for o in (p, q): o.update(room=RID, wall=k, x=round(bx + tx * sc, 3), z=round(bz + tz * sc, 3), y=yy, ix=ix, iz=iz); p['cy'] = yy
            q['s'] = round(sc, 3); p['plaqueAt'] = dict(pl); q['plaque'] = dict(pl); s += unit(p)
        rep.append((k, lvl, len(rw), round(L, 2)))
    return rep
