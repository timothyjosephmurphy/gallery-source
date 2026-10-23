# #295/#299 (TJ rule): "when a room has empty wall space, spread out the stacks there before keeping them stacked; keep TJ-set groups intact".
# Auto stacks (col 'room-...') are the only thing touched. For every room, a stack that cannot become one row in place gives up its lowest members to
# the other wall of the same room with the most free span (checked by running the real repack on a copy), until the wall flattens or nothing fits.
import copy, json, collections
import repack
def _apply(c, LP, mv, FR):
    R = {p['id']: p for p in c['paintings']}; p, q = R[mv['id']], LP[mv['id']]; rid, wk = mv['wall'].split('/'); f = FR[rid]['walls'][wk]
    t = (f['iz'], -f['ix']); x, z = f['bx'] + t[0] * mv['s'], f['bz'] + t[1] * mv['s']
    for o in (p, q): o.update(room=rid, wall=int(wk), x=round(x, 3), z=round(z, 3), ix=f['ix'], iz=f['iz'])
    p['stack'] = None; p['grid'] = None; q['s'] = mv['s']
    pl = dict(s=mv['s'] + 0.5, x=round(f['bx'] + t[0] * (mv['s'] + 0.5), 3), z=round(f['bz'] + t[1] * (mv['s'] + 0.5), 3), y=1.45, w=0.26, h=0.18); p['plaqueAt'] = dict(pl); q['plaque'] = dict(pl)
def trial(c0, LP0, moves, FR):
    c, LP = copy.deepcopy(c0), copy.deepcopy(LP0)
    for mv in moves: _apply(c, LP, mv, FR)
    return c, repack.run(c, LP)
def plan(c0, LP0, FR, protect=(), reserve=()):
    moves = []; c, rep = trial(c0, LP0, moves, FR); bad0 = set(w.split(' ')[0] for w in rep['noFit']) | set(rep.get('noFitEvenAt1x', []))
    for it in range(80):
        flat = set(rep.get('flattened', [])); cand = None
        by = collections.defaultdict(list)
        for p in c['paintings']:
            if p['room'] in FR and p['id'] in LP0: by[(p['room'], p['wall'])].append(p)
        # a wall with an auto stack that is not flat and not already a failed wall
        for (rid, wk), ps in sorted(by.items()):
            key = f'{rid}/w{wk}'
            if key in flat or key in bad0 or key in set(rep.get('noFitEvenAt1x', [])) or any(q['id'] in protect for q in ps): continue
            st = collections.defaultdict(list)
            for p in ps:
                col = (p.get('stack') or {}).get('col') or ''
                if col.startswith('room-'): st[col].append(p)
            st = {k: v for k, v in st.items() if len(v) > 1}
            if st: cand = (rid, wk, st); break
        if not cand: break
        rid, wk, st = cand; col, mem = max(st.items(), key=lambda kv: len(kv[1])); mem = sorted(mem, key=lambda p: p['stack']['pos'])
        victim = mem[-1]; need = victim['fw'] + repack.PG + repack.PLQ + 0.1
        free = rep.get('free', {}); opts = []
        for w2 in range(6):
            k2 = f'{rid}/{w2}'
            if w2 == wk or k2 not in free or f'{rid}/w{w2}' in bad0 or k2 in reserve: continue
            for j, fv in enumerate(free[k2]):
                if fv >= need: opts.append((fv, w2, j))
        done = False
        for fv, w2, j in sorted(opts, reverse=True):
            f = FR[rid]['walls'][str(w2)]; iv = repack.ivs([r for r in c['layout']['tags']['rooms'] if r['id'] == rid][0], w2, f['bx'], f['bz'], f['ix'], f['iz'])[j]
            mv = dict(id=victim['id'], wall=f'{rid}/{w2}', s=round((iv[0] + iv[1]) / 2, 2))
            c2, rep2 = trial(c0, LP0, moves + [mv], FR)
            bad2 = set(w.split(' ')[0] for w in rep2['noFit']) | set(rep2.get('noFitEvenAt1x', []))
            if bad2 - bad0: continue
            moves.append(mv); c, rep = c2, rep2; done = True; break
        if not done:
            bad0.add(f'{rid}/w{wk}')  # nowhere to go: stays stacked
    return moves, rep

# ---- #309: place the imported paintings, series by series, into the free wall intervals (checked with the real repack on a copy)
import re as _re, import309
def _series(pid): return _re.sub(r'(-original)?-\d+$', '', pid)
def place(c0, LP0, FR, ids, reserve=(), base_moves=()):
    moves = list(base_moves); c, rep = trial(c0, LP0, moves, FR); bad0 = set(w.split(' ')[0] for w in rep['noFit']) | set(rep.get('noFitEvenAt1x', []))
    rooms = {r['id']: r for r in c0['layout']['tags']['rooms']}; R0 = {p['id']: p for p in c0['paintings']}; placed = {}; report = {'unplaced': [], 'placed': {}}
    order = sorted(ids, key=lambda i: (import309.group_of(i)[0], _series(i), int(_re.findall(r'(\d+)$', i)[0]) if _re.findall(r'(\d+)$', i) else 0, i))
    prev = None; done_ser = set()
    for pid in order:
        ser0 = _series(pid)
        if ser0 not in done_ser and sum(1 for i in order if _series(i) == ser0) > 1:  # try to keep the whole series on one wall interval
            done_ser.add(ser0); mem = [i for i in order if _series(i) == ser0]; tneed = sum(R0[i]['fw'] * 1.5 + repack.PG + repack.PLQ + 0.04 for i in mem); free = rep.get('free', {}); cands = []
            pref = import309.group_of(pid)[1]; rl = list(pref) + [r for r in sorted(FR, key=lambda r: -sum(sum(v) for k, v in free.items() if k.startswith(r + '/'))) if r not in pref and FR[r]]
            for rid in rl:
                for w2 in range(6):
                    k2 = f'{rid}/{w2}'
                    if k2 in free and f'{rid}/w{w2}' not in bad0 and k2 not in reserve: cands += [(rid, w2, j) for j, fv in enumerate(free[k2]) if fv >= tneed]
            for rid, w2, j in cands:
                f = FR[rid]['walls'][str(w2)]; iv = repack.ivs(rooms[rid], w2, f['bx'], f['bz'], f['ix'], f['iz'])[j]; cnt = sum(1 for m in moves if m['wall'] == f'{rid}/{w2}')
                mvs = [dict(id=i, wall=f'{rid}/{w2}', s=round(iv[1] - 0.3 - 0.01 * (cnt + n), 3)) for n, i in enumerate(mem)]
                c2, rep2 = trial(c0, LP0, moves + mvs, FR)
                if (set(w.split(' ')[0] for w in rep2['noFit']) | set(rep2.get('noFitEvenAt1x', []))) - bad0: continue
                moves += mvs; c, rep = c2, rep2; prev = (ser0, rid, w2)
                for m in mvs: report['placed'][m['id']] = m['wall']
                break
        if pid in report['placed']: continue
        p = None
        p = R0[pid]; need = p['fw'] * 1.5 + repack.PG + repack.PLQ + 0.04; ser = _series(pid); pref = import309.group_of(pid)[1]
        free = rep.get('free', {}); cands = []
        def add(rid, w2):
            k2 = f'{rid}/{w2}'
            if k2 not in free or f'{rid}/w{w2}' in bad0 or k2 in reserve: return
            for j, fv in enumerate(free[k2]):
                if fv >= need: cands.append((rid, w2, j, fv))
        if prev and prev[0] == ser: add(prev[1], prev[2])
        for rid in pref:
            for w2 in range(6): add(rid, w2)
        tot = sorted(FR, key=lambda r: -sum(sum(v) for k, v in free.items() if k.startswith(r + '/')))
        for rid in tot:
            if FR[rid]:
                for w2 in range(6): add(rid, w2)
        seen = set(); ok = False
        for rid, w2, j, fv in cands:
            if (rid, w2, j) in seen: continue
            seen.add((rid, w2, j)); f = FR[rid]['walls'][str(w2)]
            iv = repack.ivs(rooms[rid], w2, f['bx'], f['bz'], f['ix'], f['iz'])[j]; cnt = sum(1 for m in moves if m['wall'] == f'{rid}/{w2}')
            mv = dict(id=pid, wall=f'{rid}/{w2}', s=round(iv[1] - 0.3 - 0.01 * cnt, 3))
            c2, rep2 = trial(c0, LP0, moves + [mv], FR)
            if (set(w.split(' ')[0] for w in rep2['noFit']) | set(rep2.get('noFitEvenAt1x', []))) - bad0: continue
            moves.append(mv); c, rep = c2, rep2; prev = (ser, rid, w2); report['placed'][pid] = mv['wall']; ok = True; break
        if not ok: report['unplaced'].append(pid)
    return moves, report

# ---- #300: wider doorways took wall space. Works that a doorway displaced, and any that no wall had room for at 1.5x, are re-hung on the
# best wall that still holds them: own room first, then its neighbours. A wall may drop to true size (1.0x, never shrunk below it); never
# overlapping, never in a doorway. A wall that already fails even at 1.0x is not used.
def place_relaxed(c0, LP0, FR, ids, pref=None, reserve=()):
    pref = pref or {}; moves = []; c, rep = trial(c0, LP0, moves, FR); bad0 = set(rep.get('noFitEvenAt1x', []))
    rooms = {r['id']: r for r in c0['layout']['tags']['rooms']}; R0 = {p['id']: p for p in c0['paintings']}; report = {'unplaced': [], 'placed': {}}
    for pid in ids:
        need = R0[pid]['fw'] + repack.PG + repack.PLQ + 0.04; own = pref.get(pid) or list(import309.group_of(pid)[1]); ok = False
        rl = list(own) + [r for r in sorted(FR, key=lambda r: -sum(sum(v) for k, v in rep.get('free', {}).items() if k.startswith(r + '/'))) if r not in own and FR[r]]
        nf = set(w.split(' ')[0] for w in rep.get('noFit', []))
        for rid in rl:
            if not FR.get(rid): continue
            cands = []
            for w2 in range(6):
                k2 = f'{rid}/{w2}'
                if k2 in reserve or f'{rid}/w{w2}' in bad0: continue
                f = FR[rid]['walls'][str(w2)]
                for j, iv in enumerate(repack.ivs(rooms[rid], w2, f['bx'], f['bz'], f['ix'], f['iz'])):
                    if iv[1] - iv[0] >= need: cands.append((0 if f'{rid}/w{w2}' in nf else 1, -(rep.get('free', {}).get(k2, [0] * 9)[j] if j < len(rep.get('free', {}).get(k2, [])) else 0), w2, iv))
            for _, _, w2, iv in sorted(cands, key=lambda q: q[:3]):
                cnt = sum(1 for m in moves if m['wall'] == f'{rid}/{w2}'); mv = dict(id=pid, wall=f'{rid}/{w2}', s=round(iv[1] - 0.3 - 0.01 * cnt, 3))
                c2, rep2 = trial(c0, LP0, moves + [mv], FR)
                if set(rep2.get('noFitEvenAt1x', [])) - bad0: continue
                moves.append(mv); c, rep = c2, rep2; report['placed'][pid] = mv['wall']; ok = True; break
            if ok: break
        if not ok: report['unplaced'].append(pid)
    return moves, report
