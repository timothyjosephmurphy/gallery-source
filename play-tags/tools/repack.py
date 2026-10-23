# #292 (TJ-approved, preview only): show every painting at MUSEUM.artScale (1.5x), uniform with frames, never stretched.
# Room sizes stay as they are: each wall is re-packed in its own span (corners and door openings kept clear), order kept,
# salon columns re-stacked on the 48 in line, every plaque beside its own painting (1.45 m when the painting spans it).
# A wall that can't fit at 1.5x is left at 1.0x and reported (never shrunk below true size, never overlapping).
import re, collections, json, os
PLQ, PG, G, SG, CORNER, DOOR_HALF, BAND_C, FLAT_C = 0.26, 0.06, 0.1, 0.08, 0.75, 1.3, 1.219, 1.45
def scale():
    m = re.search(r'artScale:\s*([0-9.]+)', open('src/museum.config.js').read()); return float(m.group(1)) if m else 1.0
COLS = [q for q in (json.load(open('tools/module-colliders.json')) if os.path.exists('tools/module-colliders.json') else []) if q.get('kind') == 'dome-column']
RESERVE = {}  # #323 rows: (room, wall) -> [(a, b)] stretches kept for a true-size row group (tools/rows.py); a whole-wall reserve is [(-99, 99)]
def ivs(r, wk, bx, bz, ix, iz, res=True):
    tx, tz = iz, -ix; half = r['radius'] / 2 - 0.2; cut = list(RESERVE.get((r['id'], wk), [])) if res else []
    if wk in r.get('doorWalls', []): off = float(r.get('doorOffsets', {}).get(str(wk), 0)); cut.append((off - DOOR_HALF, off + DOOR_HALF))
    for q in COLS:  # dome corner columns standing near this wall line
        dx, dz = q['x'] - bx, q['z'] - bz; v = -(dx * ix + dz * iz); u = dx * tx + dz * tz
        if abs(v) < q['r'] + 0.9 and abs(u) < half + 1: cut.append((u - q['r'] - 0.3, u + q['r'] + 0.3))
    iv = [[-half, half]]
    for a_, b_ in sorted(cut):
        nv = []
        for lo, hi in iv:
            if b_ <= lo or a_ >= hi: nv.append([lo, hi])
            else:
                if a_ > lo: nv.append([lo, a_])
                if b_ < hi: nv.append([b_, hi])
        iv = nv
    return [x for x in iv if x[1] - x[0] > 0.3] or [[-0.1, 0.1]]
FR = json.load(open('tools/wallframes.json')) if os.path.exists('tools/wallframes.json') else {}
def run(c, LP):
    k = scale(); rooms = {r['id']: r for r in c['layout']['tags']['rooms']}; rep = {'artScale': k, 'walls': 0, 'scaled': 0, 'noFit': []}
    if k == 1.0: return rep
    by = collections.defaultdict(list)
    for p in c['paintings']:
        if p['room'] in rooms and p['id'] in LP: by[(p['room'], p['wall'])].append(p)
    for (rid, wk), ps in by.items():
        r = rooms[rid]; ix, iz = ps[0]['ix'], ps[0]['iz']; tx, tz = iz, -ix
        q0 = ps[0]; s0 = LP[q0['id']]['s']; bx, bz = q0['x'] - tx * s0, q0['z'] - tz * s0
        units = collections.OrderedDict()
        for p in sorted(ps, key=lambda p: LP[p['id']]['s']):
            key = (p.get('stack') or {}).get('col') or p['id']; units.setdefault(key, []).append(p)
        U = [dict(ps=sorted(v, key=lambda p: (p.get('stack') or {}).get('pos', 1)), s=LP[v[0]['id']]['s']) for v in units.values()]
        # #295/#299 (TJ rule): when a wall has room, spread its auto stacks (col 'room-...') into one row; TJ-set groups (grid-*, cath-*, ...) stay as they are
        AUTO = lambda u: len(u['ps']) > 1 and all(((q.get('stack') or {}).get('col') or '').startswith('room-') for q in u['ps'])
        FLAT = []
        for u in U:
            if AUTO(u): FLAT += [dict(ps=[q], s=u['s'] + 0.001 * i, flat=True) for i, q in enumerate(u['ps'])]
            else: FLAT.append(u)
        want_flat = any(AUTO(u) for u in U) and not any(q.get('noFlat') for q in ps)
        iv = ivs(r, wk, bx, bz, ix, iz)
        def mk(UU):
            gg = [[] for _ in iv]
            for u in UU: j = min(range(len(iv)), key=lambda j: 0 if iv[j][0] <= u['s'] <= iv[j][1] else min(abs(u['s'] - iv[j][0]), abs(u['s'] - iv[j][1]))); gg[j].append(u)
            return gg
        groups = [[] for _ in iv]
        for u in U: j = min(range(len(iv)), key=lambda j: 0 if iv[j][0] <= u['s'] <= iv[j][1] else min(abs(u['s'] - iv[j][0]), abs(u['s'] - iv[j][1]))); groups[j].append(u)
        span = lambda u, kk: max(p['fw'] for p in u['ps']) * kk + PG + PLQ
        def okg(kk, gg, gs): return all(not g or sum(span(u, kk) for u in g) + gg * (len(g) - 1) <= iv[j][1] - iv[j][0] for j, g in enumerate(gs))
        fits = lambda kk, gg: okg(kk, gg, groups)
        def seq(UU, kk, gg):  # #300: order along the wall kept, units filled interval by interval (wider doors split a wall in two)
            gs = [[] for _ in iv]; j = 0; used = 0.0
            for u in sorted(UU, key=lambda u: u['s']):
                while True:
                    if j >= len(iv): return None
                    need = span(u, kk) + (gg if gs[j] else 0)
                    if used + need <= iv[j][1] - iv[j][0] + 1e-9: gs[j].append(u); used += need; break
                    j += 1; used = 0.0
            return gs
        def pick(kk, gg, UU):
            g1 = mk(UU)
            return g1 if okg(kk, gg, g1) else seq(UU, kk, gg)
        flatwall = False; g0 = groups
        if want_flat:
            groups = mk(FLAT)
            if fits(k, 0.03): flatwall = True; rep.setdefault('flattened', []).append(f'{rid}/w{wk}')
            else: groups = g0
        if flatwall: kk = k
        else:
            gs = pick(k, G, U)
            if gs is not None: groups = gs; kk = k
            else:
                gs = pick(k, 0.03, U)
                if gs is not None: groups = gs; kk = k; rep.setdefault('tight', []).append(f'{rid}/w{wk}')
                else:
                    rep['noFit'].append(f'{rid}/w{wk} ({len(ps)} works)'); kk = 1.0
                    gs = pick(1.0, 0.03, U)
                    if gs is None: rep.setdefault('noFitEvenAt1x', []).append(f'{rid}/w{wk}'); continue  # keep the original hang untouched
                    groups = gs
        for g in groups:
            for u in g:
                for q in u['ps']:
                    if ((q.get('stack') or {}).get('col') or '').startswith('room-') and (flatwall or len(u['ps']) == 1): q['stack'] = None  # flat row (or a stack of one): no stack tag
        rep['walls'] += 1; rep.setdefault('free', {})[f'{rid}/{wk}'] = [round((iv[j][1] - iv[j][0]) - (sum(span(u, kk) for u in g) + 0.03 * max(0, len(g) - 1)), 2) for j, g in enumerate(groups)]
        for j, g in enumerate(groups):
            if not g: continue
            a, b = iv[j]; tot = sum(span(u, kk) for u in g); gap = min(0.9, max(0.03, (b - a - tot) / (len(g) + 1)))
            used = tot + gap * (len(g) - 1); cen = sum(u['s'] for u in g) / len(g); x0 = min(max(cen - used / 2, a), b - used)
            for u in g:
                cw = max(p['fw'] for p in u['ps']) * kk; sc = x0 + cw / 2; ps_ = x0 + cw + PG + PLQ / 2
                hs = [p['fh'] * kk for p in u['ps']]; tot_h = sum(hs) + SG * (len(hs) - 1); top = (u['ps'][0].get('cy') or (FLAT_C if flatwall else BAND_C)) + tot_h / 2
                if top - tot_h < 0.3: top = 0.3 + tot_h
                for p, h in zip(u['ps'], hs):
                    if kk != 1.0:
                        p['trueW'], p['trueH'] = p.get('trueW', p['w']), p.get('trueH', p['h'])
                        for f in ('w', 'h', 'iw', 'ih', 'fw', 'fh'):
                            if f in p and p[f] is not None: p[f] = round(p[f] * kk, 4)
                        p['artScale'] = kk; rep['scaled'] += 1
                    y = top - h / 2; top -= h + SG
                    p['x'], p['z'], p['y'] = round(bx + tx * sc, 3), round(bz + tz * sc, 3), round(y, 3)
                    py = 1.45 if (y - h / 2) <= 1.45 <= (y + h / 2) else round(y, 3)
                    pa = dict(p.get('plaqueAt') or dict(w=0.26, h=0.18)); pa.update(s=round(ps_, 3), x=round(bx + tx * ps_, 3), z=round(bz + tz * ps_, 3), y=py); p['plaqueAt'] = pa
                    lq = LP[p['id']]; lq.update(x=p['x'], z=p['z'], y=p['y'], s=round(sc, 3), w=p['w'], h=p['h'], fw=p['fw'], fh=p['fh']); lq['plaque'] = dict(pa)
                x0 += cw + PG + PLQ + gap
    for rid, f in FR.items():  # empty walls: whole span free
        if f is None or rid not in rooms: continue
        for wk, w in f['walls'].items():
            if (rid, int(wk)) not in by: rep.setdefault('free', {})[f'{rid}/{wk}'] = [round(x[1] - x[0], 2) for x in ivs(rooms[rid], int(wk), w['bx'], w['bz'], w['ix'], w['iz'])]
    return rep
