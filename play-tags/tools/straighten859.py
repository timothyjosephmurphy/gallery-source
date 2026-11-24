# #859 (TJ Nov 4 2026): straighten in place. Same room+wall for every work; level rows, aligned columns, even gaps.
# Usage: python3 tools/straighten859.py src/catalog.json out.json  -> writes moves {id:{y,ds}} + patched catalog
import json, sys, collections, statistics as st
c = json.load(open(sys.argv[1])); P = c['paintings']; L = {q['id']: q for q in c['layout']['tags']['paintings']}
KEEPY = {'book-art-1143b08e177333e43dc7', 'book-art-db933efcbc4fbe01c841'}  # Kristine/Steve: plaque sits between at eye height
EYE, PW, TOL = 1.45, 0.26, 0.10
G = collections.defaultdict(list)
for p in P:
    if p.get('room') and p.get('wall') is not None and p['id'] in L and str(p['room']).startswith('room-'): G[(p['room'], p['wall'])].append(p)
moves = {}
SR = lambda p: p['x'] * p['iz'] - p['z'] * p['ix']  # real along-wall position (layout s can lag the x/z)
def env(p):  # horizontal envelope incl. plaque
    s = SR(p); a, b = s - p['fw'] / 2, s + p['fw'] / 2
    pl = p.get('plaqueAt')
    if pl: ps_ = pl['x'] * p['iz'] - pl['z'] * p['ix']; a, b = min(a, ps_ - PW / 2), max(b, ps_ + PW / 2)
    return a, b
def stack(items, gap, centre, heights=None):
    hs = heights or [p['fh'] for p in items]; tot = sum(hs) + gap * (len(hs) - 1); top = centre + tot / 2; ys = []
    for h in hs: ys.append(round(top - h / 2, 3)); top -= h + gap
    return ys
report = []
for k, ps in sorted(G.items()):
    S = SR
    ps.sort(key=S); blocks = []
    for p in ps:  # blocks = frames whose horizontal spans overlap (vertical stacks)
        a, b = S(p) - p['fw'] / 2, S(p) + p['fw'] / 2
        if blocks and a < blocks[-1]['b'] - 0.02: blocks[-1]['m'].append(p); blocks[-1]['b'] = max(blocks[-1]['b'], b)
        else: blocks.append(dict(a=a, b=b, m=[p]))
    rowmode = any(len(bl['m']) == 1 and abs(bl['m'][0]['y'] - EYE) > TOL for bl in blocks) or any(len({round(q['y'] / TOL) for q in bl['m']}) < len(bl['m']) or any(abs(q['y'] - r['y']) < TOL for i, q in enumerate(bl['m']) for r in bl['m'][i + 1:]) for bl in blocks)
    new = {p['id']: dict(y=p['y'], s=S(p)) for p in ps}
    if rowmode:  # brick rows (e.g. strawberry two rows): level each y-row, even gaps along the row inside its extent
        rows = []
        for p in sorted(ps, key=lambda p: -p['y']):
            if rows and abs(rows[-1][0]['y'] - p['y']) < TOL: rows[-1].append(p)
            else: rows.append([p])
        for r in rows:
            y = round(st.mean(q['y'] for q in r), 3); r.sort(key=S)
            for q in r: new[q['id']]['y'] = y
            if False:  # rows keep their columns; level only
                a = S(r[0]) - r[0]['fw'] / 2; b = S(r[-1]) + r[-1]['fw'] / 2; g = (b - a - sum(q['fw'] for q in r)) / (len(r) - 1); x = a
                for q in r: new[q['id']]['s'] = round(x + q['fw'] / 2, 3); x += q['fw'] + g
    else:
        for bl in blocks: bl['m'].sort(key=lambda p: -p['y'])
        # groups of neighbouring blocks with the same count >= 2 share rows (grids); others stand alone
        i = 0; LEV = []
        while i < len(blocks):
            j = i
            while j + 1 < len(blocks) and len(blocks[j + 1]['m']) == len(blocks[i]['m']) >= 2 and all(max(blocks[j+1]['m'][t]['fh'], blocks[i]['m'][t]['fh']) / min(blocks[j+1]['m'][t]['fh'], blocks[i]['m'][t]['fh']) < 1.5 for t in range(len(blocks[i]['m']))): j += 1
            grp = blocks[i:j + 1]; n = len(grp[0]['m'])
            oth = [q for bl in blocks if bl not in grp and len(bl['m']) > 1 for q in bl['m']]
            shared = n > 1 and any(abs(q['y'] - r['y']) < 0.05 for bl in grp for q in bl['m'] for r in oth)
            if shared:  # rows already shared with neighbouring blocks: align columns, level later
                for bl in grp:
                    sc = round(st.mean(S(q) for q in bl['m']), 3)
                    for q in bl['m']: new[q['id']]['s'] = sc; LEV.append(q)
            elif n == 1: new[grp[0]['m'][0]['id']]['y'] = EYE
            else:
                gaps = [bl['m'][t]['y'] - bl['m'][t]['fh'] / 2 - bl['m'][t + 1]['y'] - bl['m'][t + 1]['fh'] / 2 for bl in grp for t in range(n - 1)]
                gap = round(min(0.3, max(0.06, st.median(gaps))), 3)
                H = [max(bl['m'][t]['fh'] for bl in grp) for t in range(n)] if len(grp) > 1 else None
                cen = st.mean((bl['m'][0]['y'] + bl['m'][0]['fh'] / 2 + bl['m'][-1]['y'] - bl['m'][-1]['fh'] / 2) / 2 for bl in grp)
                cen = EYE if (len(grp) == 1 or abs(cen - EYE) < 0.15) else round(cen, 3)
                ys = stack(grp[0]['m'], gap, cen, H or [p['fh'] for p in grp[0]['m']])
                for bl in grp:
                    if H is None: ys = stack(bl['m'], gap, cen)
                    sc = round(st.mean(S(q) for q in bl['m']), 3)
                    for t, q in enumerate(bl['m']): new[q['id']].update(y=ys[t], s=sc)
            i = j + 1
        LEV.sort(key=lambda p: -p['y']); rows = []
        for p in LEV:
            if rows and abs(rows[-1][0]['y'] - p['y']) < TOL: rows[-1].append(p)
            else: rows.append([p])
        for r in rows:
            y = round(st.mean(q['y'] for q in r), 3)
            for q in r: new[q['id']]['y'] = y
        # even gaps between blocks (envelopes incl. plaques), outer edges kept
        if len(blocks) > 2:
            E = []
            for bl in blocks:
                ea = min(env(q)[0] - S(q) + new[q['id']]['s'] for q in bl['m']); eb = max(env(q)[1] - S(q) + new[q['id']]['s'] for q in bl['m']); E.append((ea, eb))
            A, B = E[0][0], E[-1][1]; g = (B - A - sum(b - a for a, b in E)) / (len(E) - 1)
            if g >= 0.08:
                x = A
                for bl, (ea, eb) in zip(blocks, E):
                    d = x - ea
                    for q in bl['m']: new[q['id']]['s'] = round(new[q['id']]['s'] + d, 3)
                    x += (eb - ea) + g
    for p in ps:
        if p['id'] in KEEPY: new[p['id']]['y'] = p['y']
        n_ = new[p['id']]; ds = round(n_['s'] - S(p), 3); dy = round(n_['y'] - p['y'], 3)
        if abs(ds) < 0.002 and abs(dy) < 0.002: continue
        moves[p['id']] = dict(wall=f'{k[0]}/{k[1]}', y=n_['y'], ds=ds, dy=dy)
        q = L[p['id']]; dx, dz = p['iz'] * ds, -p['ix'] * ds
        for o in (p, q): o['x'] = round(o['x'] + dx, 3); o['z'] = round(o['z'] + dz, 3); o['y'] = n_['y']
        q['s'] = round(q['s'] + ds, 3)
        for pl in (p.get('plaqueAt'), q.get('plaque')):
            if pl:
                pl['y'] = EYE if n_['y'] - p['fh'] / 2 <= EYE <= n_['y'] + p['fh'] / 2 else n_['y']  # existing plaque rule: 1.45 if the frame spans it, else beside its centre
                pl['s'] = round(pl['s'] + ds, 3); pl['x'] = round(pl['x'] + dx, 3); pl['z'] = round(pl['z'] + dz, 3)
    report.append((k, len(ps), sum(1 for p in ps if p['id'] in moves), 'rows' if rowmode else 'blocks'))
for r in report: print(*r)
print('walls', len(report), 'adjusted walls', sum(1 for r in report if r[2]), 'works moved', len(moves))
json.dump(c, open(sys.argv[2], 'w')); json.dump(moves, open('/workspace/straighten859/moves.json', 'w'), indent=1)
