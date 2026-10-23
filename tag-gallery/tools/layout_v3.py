#!/usr/bin/env python3
"""Tag gallery layout (studio-tracker #251). Rerun whenever tags change:
   node tools/extract.mjs <repo> [proposals...] && python3 tools/imgdims.py && python3 tools/layout.py
1. similarity: weighted Jaccard over tags, weight = idf (rarer tags count more) x kind (series > place > subject)
2. rooms: average-linkage clustering capped by room size; small clusters merged into their most similar room
3. placement: rooms on hex cells around a fixed entrance hub (gates + checkout), simulated annealing on
   sum(sim(i,j) * hexdist(room i, room j)) over all painting pairs, with loop constraints (every room >= 2 exits, no bridges)
4. doors: all hub doors + room-room doors pruned (lowest similarity first) while the graph stays 2-edge-connected
5. walls: per room, annealed perimeter order (adjacent paintings similar, paintings related to a neighbour room
   on the wall facing it), packed at true size with plaques beside each painting, no overlaps
Output: data/layout.json"""
import json, math, random, itertools, collections, sys
import numpy as np
random.seed(251)
D = json.load(open('data/works.json')); TAGS = D['tags']; W = D['works']; N = len(W)
KIND = {'series': 1.5, 'place': 1.2, 'subject': 1.0}
df = collections.Counter(t for w in W for t in w['tags'])
wt = {t: math.log(1 + N / df[t]) * KIND.get(TAGS.get(t, {}).get('kind'), 1.0) for t in df}
TS = [set(w['tags']) for w in W]
S = np.zeros((N, N))
for i in range(N):
    for j in range(i + 1, N):
        a, b = TS[i], TS[j]; inter = sum(wt[t] for t in a & b)
        if inter: S[i, j] = S[j, i] = inter / sum(wt[t] for t in a | b)
# ---- sizes (metres, true size) ----
FR = 0.03  # frame
for w in W:
    if w['size']: w['w'], w['h'], w['approx'] = w['size']['w'], w['size']['h'], w['size'].get('approx', False)
    else:  # unknown size: 12 in long side, image aspect, flagged
        k = 0.305 / max(w['texW'], w['texH']); w['w'], w['h'], w['approx'] = w['texW'] * k, w['texH'] * k, 'default-12in'
    w['fw'], w['fh'] = w['w'] + 2 * FR, w['h'] + 2 * FR
# ---- clustering ----
CAP, MINR = 20, 8
cl = [[i] for i in range(N)]
def link(a, b): return S[np.ix_(a, b)].mean()
while True:
    best, bp = 0.12, None
    for x in range(len(cl)):
        for y in range(x + 1, len(cl)):
            if len(cl[x]) + len(cl[y]) > CAP: continue
            v = link(cl[x], cl[y])
            if v > best: best, bp = v, (x, y)
    if not bp: break
    x, y = bp; cl[x] += cl[y]; del cl[y]
changed = True
while changed:
    changed = False; cl.sort(key=len)
    for x, c in enumerate(cl):
        if len(c) >= MINR: continue
        cand = [(link(c, d), y) for y, d in enumerate(cl) if y != x and len(d) + len(c) <= CAP + 4]
        if not cand: continue
        v, y = max(cand); cl[y] += c; del cl[x]; changed = True; break
# ---- tight sets of three (triptychs): one horizontal row, same wall, in order ----
import re
ORD = {'past': 1, 'present': 2, 'future': 3}
def setkey(i):
    t = W[i]['title']; m = re.search(r'#\s*(\d+)', t)
    if m: return 'title:' + re.sub(r'#\s*\d+.*$', '', t).strip().lower(), int(m.group(1))
    for k, v in ORD.items():
        if re.search(r'\b' + k + r'\b', t, re.I): return None, v
    return None, 0
SETS = []
for t in df:
    if TAGS.get(t, {}).get('kind') == 'series' and df[t] == 3:
        mem = [i for i in range(N) if t in TS[i]]; SETS.append((t, sorted(mem, key=lambda i: (setkey(i)[1], W[i]['title']))))
bytitle = collections.defaultdict(list)
for i in range(N):
    k, n = setkey(i)
    if k: bytitle[k].append((n, i))
for k, v in bytitle.items():
    if len(v) == 3 and not any(set(i for _, i in v) & set(m) for _, m in SETS): SETS.append((k, [i for _, i in sorted(v)]))
# Burning Man Temple 2022 set of four: 2x2 grid on one wall (TJ's exception to the one-row rule)
TEMPLE = ['burning-man-temple-2022-daytime', 'burning-man-temple-2022-blue', 'burning-man-temple-2022-pink', 'burning-man-temple-2022-flame']
GRID = [next(i for i in range(N) if W[i]['id'] == t) for t in TEMPLE if any(W[i]['id'] == t for i in range(N))]
if len(GRID) == 4: SETS.append(('burning-man-temple-2022 (2x2 grid)', GRID))
GRIDSET = set(GRID) if len(GRID) == 4 else set()
GGAP = 0.12
for name, mem in SETS:  # same room: the room holding most of the set
    home = collections.Counter(next(x for x, c in enumerate(cl) if i in c) for i in mem).most_common(1)[0][0]
    for i in mem:
        for c in cl:
            if i in c and c is not cl[home]: c.remove(i); cl[home].append(i)
cl = [c for c in cl if c]
SETOF = {i: mem for _, mem in SETS for i in mem}
MINUNITS = 10  # v2: no blank walls -> enough units for up to 9 wall segments
def nunits(c): return len(c) - sum(len(m) - 1 for _, m in SETS if m[0] in c)
moved = []
while True:
    small = [c for c in cl if nunits(c) < MINUNITS]
    if not small: break
    c = small[0]
    cand = [(S[i, c].mean(), i, d) for d in cl if d is not c and nunits(d) > MINUNITS + 2 for i in d if i not in SETOF]
    v, i, d = max(cand); d.remove(i); c.append(i); moved.append((W[i]['title'], i))
print('rebalanced', len(moved))
print('sets', [(n, [W[i]['title'] for i in m]) for n, m in SETS])
K = len(cl)
room_of = np.zeros(N, int)
for k, c in enumerate(cl):
    for i in c: room_of[i] = k
RS = np.zeros((K, K))
for a in range(K):
    for b in range(K): RS[a, b] = S[np.ix_(cl[a], cl[b])].sum() if a != b else 0
def label(c):
    cnt = collections.Counter(t for i in c for t in W[i]['tags'])
    score = sorted(cnt, key=lambda t: -cnt[t] * wt[t])
    main = [t for t in score if cnt[t] >= max(2, 0.3 * len(c))][:3] or score[:1]
    comb = [t for t in score if cnt[t] >= 2 or cnt[t] / len(c) >= 0.2]
    return main, comb, cnt
# ---- v3 hex placement: pavilion at the centre, ring 1 = courtyards, ring 2 = the 12 gallery rooms ----
DIRS = [(1, 0), (0, 1), (-1, 1), (-1, 0), (0, -1), (1, -1)]  # axial; DIRS[k] lies across wall k (angle 60k deg)
def hd(a, b): dq, dr = a[0] - b[0], a[1] - b[1]; return (abs(dq) + abs(dr) + abs(dq + dr)) // 2
HUB = (0, 0)
def nbrs(c): return [(c[0] + d[0], c[1] + d[1]) for d in DIRS]
def bridges(nodes, edges):
    adj = collections.defaultdict(list)
    for i, (u, v) in enumerate(edges): adj[u].append((v, i)); adj[v].append((u, i))
    disc, low, out, t = {}, {}, [], [0]
    def dfs(u, pe):
        disc[u] = low[u] = t[0]; t[0] += 1
        for v, i in adj[u]:
            if i == pe: continue
            if v in disc: low[u] = min(low[u], disc[v])
            else:
                dfs(v, i); low[u] = min(low[u], low[v])
                if low[v] > disc[u]: out.append(i)
    sys.setrecursionlimit(10000); dfs(next(iter(nodes)), -1)
    return out, len(disc) == len(nodes)
YARDS1 = [tuple(d) for d in DIRS]
CELLS = [(q, r) for q in range(-2, 3) for r in range(-2, 3) if hd((q, r), HUB) == 2]
assert K == len(CELLS) == 12, f'v3 ring layout expects 12 rooms, got {K}'
CORNER_CELLS = {(2 * DIRS[k][0], 2 * DIRS[k][1]): k for k in range(6)}
def walkproxy(c): return 2.0 if c in CORNER_CELLS else math.sqrt(3)  # centre distance in cell spacings (corner rooms: straight colonnade; edge rooms: colonnade between two courtyards)
LAMBDA_WALK = 1.0
def cost(pos, full=True):
    return sum(RS[a, b] * hd(pos[a], pos[b]) for a in range(K) for b in range(a + 1, K)) + LAMBDA_WALK * sum(len(cl[a]) * walkproxy(pos[a]) for a in range(K))
def simpart(pos): return sum(RS[a, b] * hd(pos[a], pos[b]) for a in range(K) for b in range(a + 1, K))
def rand_pos(): return random.sample(CELLS, K)
rand_scores = [cost(rand_pos()) for _ in range(300)]
order = sorted(range(K), key=lambda a: -RS[a].sum()); pos = [None] * K
for a in order:
    free = [c for c in CELLS if c not in pos]
    pos[a] = min(free, key=lambda c: sum(RS[a, b] * hd(c, pos[b]) for b in range(K) if pos[b]) + LAMBDA_WALK * len(cl[a]) * walkproxy(c))
greedy = cost(pos); print('greedy', greedy)
cur, cc = pos[:], greedy; best, bc = cur[:], cc; T = cc * 0.02
for it in range(60000):
    p = cur[:]; a, b = random.sample(range(K), 2); p[a], p[b] = p[b], p[a]; c2 = cost(p)
    if c2 < cc or random.random() < math.exp((cc - c2) / T): cur, cc = p, c2
    if cc < bc: best, bc = cur[:], cc
    T *= 0.99985
pos = best; final = cost(pos); simOnly = simpart(pos)
# ---- doors: each room opens to both ring neighbours (the outer loop) and onto one courtyard colonnade toward the pavilion ----
cellroom = {pos[a]: a for a in range(K)}; cellroom[HUB] = 'hub'
def esim(e): a, b = cellroom.get(e[0], 'x'), cellroom.get(e[1], 'x'); return 1e9 if not (isinstance(a, (int, np.integer)) and isinstance(b, (int, np.integer))) else RS[a, b]
doors = set()
for c in CELLS:
    for n in nbrs(c):
        if n in CELLS: doors.add(tuple(sorted((c, n))))
COLDOOR = {}
for c in CELLS:
    y = YARDS1[CORNER_CELLS[c]] if c in CORNER_CELLS else min((n for n in nbrs(c) if n in YARDS1), key=lambda n: YARDS1.index(n))
    COLDOOR[c] = y; doors.add(tuple(sorted((c, y))))
# ---- rooms: walls, ordering, packing ----
DOOR, DCLR, CORNER, PLQ, PGAP, SP = 1.6, 0.45, 0.6, 0.26, 0.06, 0.35
def item_w1(i): return W[i]['fw'] + PGAP + PLQ + SP
def item_w(u):
    if isinstance(u, tuple) and u[0] in GRIDSET: return max(W[i]['fw'] for i in u[:2]) + max(W[i]['fw'] for i in u[2:]) + GGAP + PGAP + PLQ + SP
    return sum(item_w1(i) for i in u) if isinstance(u, tuple) else item_w1(u)
def segments(r, doorwalls):
    out = []
    for k in range(6):
        if k in doorwalls:
            h = DOOR / 2 + DCLR; out += [(k, -r / 2 + CORNER, -h), (k, h, r / 2 - CORNER)]
        else: out.append((k, -r / 2 + CORNER, r / 2 - CORNER))
    return out
def pack(seq, segs):
    n, m = len(seq), len(segs)
    if n < m: return None
    caps = [b - a for _, a, b in segs]; tot = sum(item_w(u) for u in seq); ctot = sum(caps)
    place, j, acc, cum = [], 0, 0.0, 0.0
    for si in range(m):
        k, a, b = segs[si]; cum += caps[si]; x = a; took = 0
        while j < n:
            left_units, left_segs = n - j, m - si - 1
            if took and left_units <= left_segs: break
            wv = item_w(seq[j])
            if x + wv - SP > b + 1e-9: break
            if took and si < m - 1 and acc + wv / 2 > tot * cum / ctot: break
            place.append((seq[j], si, x)); x += wv; acc += wv; j += 1; took += 1
        if not took: return None
    return place if j == n else None
def pack_old(seq, segs):
    place, si, x = [], 0, None
    for i in seq:
        while si < len(segs):
            k, a, b = segs[si]
            if x is None: x = a
            if x + item_w(i) - SP <= b + 1e-9: place.append((i, si, x)); x += item_w(i); break
            si += 1; x = None
        else: return None
    return place
def room_cell_dir(cell, k): return (cell[0] + DIRS[k][0], cell[1] + DIRS[k][1])
def build_rooms():
  global ROOMS, PLACED
  ROOMS = []; PLACED = []
  for a in range(K):
    c = cl[a]; cell = pos[a]
    units, seen = [], set()
    for i in c:
        if i in seen: continue
        if i in SETOF: u = tuple(SETOF[i]); seen |= set(u); units.append(u)
        else: seen.add(i); units.append(i)
    mem = lambda u: list(u) if isinstance(u, tuple) else [u]
    usim = lambda u, v: max(S[x, y] for x in mem(u) for y in mem(v))
    dw = {k for k in range(6) if tuple(sorted((cell, room_cell_dir(cell, k)))) in doors}
    nb = {k: cellroom.get(room_cell_dir(cell, k)) for k in range(6)}
    aff = {(i, k): (S[i, cl[nb[k]]].mean() if isinstance(nb[k], (int, np.integer)) else 0.0) for i in c for k in range(6)}
    need = sum(item_w(u) for u in units)
    r = RFIX if 'RFIX' in globals() else 5.0
    while True:
        segs = segments(r, dw)
        if sum(b - a2 for _, a2, b in segs) * 0.9 >= need and all(item_w(u) - SP <= max(b - a2 for _, a2, b in segs) for u in units):
            seq = sorted(units, key=lambda u: -sum(S[i, c].sum() for i in mem(u))); pl = pack(seq, segs)
            for _t in range(300):  # v3: try other orders before growing the room (wide sets need a full wall)
                if pl: break
                random.shuffle(seq); pl = pack(seq, segs)
            if pl: break
        r += 0.25
    def ocost(seq):
        pl = pack(seq, segs)
        if pl is None: return 1e9, None
        adjs = sum(usim(seq[j], seq[(j + 1) % len(seq)]) for j in range(len(seq)))
        fa = sum(aff[(i, segs[si][0])] for u, si, _ in pl for i in mem(u))
        return -(adjs + 1.5 * fa), pl
    seq = [i for i, _, _ in pl]; oc, opl = ocost(seq); T = 0.3
    for it in range(4000 if len(seq) > 2 else 0):
        s2 = seq[:]; x, y = sorted(random.sample(range(len(s2)), 2))
        if random.random() < 0.5: s2[x:y + 1] = s2[x:y + 1][::-1]
        else: s2[x], s2[y] = s2[y], s2[x]
        c2, p2 = ocost(s2)
        if c2 < oc or random.random() < math.exp((oc - c2) / T): seq, oc, opl = s2, c2, p2
        T *= 0.999
    # spread items evenly within each segment
    bys = collections.defaultdict(list)
    for u, si, x in opl: bys[si] += mem(u)
    ap = r * math.sqrt(3) / 2
    Rc_center = None
    main, comb, cnt = label(c)
    room = dict(id=f'room-{a + 1:02d}', index=a, cell=list(cell), radius=r, apothem=ap, count=len(c), label=' · '.join(TAGS.get(t, {}).get('label', t) for t in main),
                mainTags=main, combines={t: cnt[t] for t in comb}, doorWalls=sorted(dw), neighbours={k: (f'room-{nb[k] + 1:02d}' if isinstance(nb[k], (int, np.integer)) else nb[k]) for k in range(6) if nb[k] is not None})
    room['_bys'] = bys; room['_segs'] = segs; ROOMS.append(room)
build_rooms()  # v3: each room sized to its paintings
# ---- coordinates ----
RMAX = max(r['radius'] for r in ROOMS); HALL = 2.0; RC = RMAX + HALL / math.sqrt(3); SPACING = RC * math.sqrt(3)  # honeycomb cell circumradius RC; a 2 m colonnade hallway runs between all cells
def center(cell):
    q, rr = cell; ax = q + rr / 2; return (ax * SPACING, rr * SPACING * math.sqrt(3) / 2)
HUBR = RMAX  # central pavilion, same cell size
for room in ROOMS:
    cx, cz = center(tuple(room['cell'])); room['center'] = [cx, cz]; r, ap = room['radius'], room['apothem']
    room['_used'] = set(room['_bys']); 
    for si, items in room.pop('_bys').items():
        k, a, b = room['_segs'][si]; tot = sum(item_w1(i) - SP for i in items if i not in GRIDSET) + (item_w(tuple(GRID)) - SP if GRIDSET & set(items) else 0); nunit = len(items) - sum(1 for j in range(1, len(items)) if items[j] in SETOF and items[j - 1] in SETOF.get(items[j], []))
        gap = ((b - a) - tot) / (nunit + 1); x = a + gap
        th = math.radians(60 * k); n = (math.cos(th), math.sin(th)); t = (-n[1], n[0])
        for i in items:
            w = W[i]
            if i in GRIDSET:
                if i != GRID[0]: continue
                cw = [max(W[j]['fw'] for j in GRID[:2]), max(W[j]['fw'] for j in GRID[2:])]; rh = max(W[j]['fh'] for j in GRID); yc = max(1.75, rh + GGAP / 2 + 0.4)
                mx, mz = cx + ap * n[0], cz + ap * n[1]; ps = x + cw[0] + GGAP + cw[1] + PGAP + PLQ / 2
                for gi, j in enumerate(GRID):  # order: top-left, top-right, bottom-left, bottom-right (reading order)
                    col, row = gi % 2, gi // 2; sj = x + (cw[0] / 2 if col == 0 else cw[0] + GGAP + cw[1] / 2); yj = yc + (rh + GGAP) / 2 * (1 if row == 0 else -1); wj = W[j]
                    PLACED.append(dict(id=wj['id'], twins=wj['twins'], title=wj['title'], url=wj['url'], tex=wj['tex'], tags=wj['tags'], room=room['id'], wall=k, s=round(sj, 3),
                        x=round(mx + sj * t[0] - 0.03 * n[0], 3), z=round(mz + sj * t[1] - 0.03 * n[1], 3), y=round(yj, 3), ix=round(-n[0], 4), iz=round(-n[1], 4),
                        w=round(wj['w'], 4), h=round(wj['h'], 4), fw=round(wj['fw'], 4), fh=round(wj['fh'], 4), approxSize=wj['approx'], smax=1, s_scale=1,
                        plaque=dict(s=round(ps, 3), x=round(mx + ps * t[0] - 0.03 * n[0], 3), z=round(mz + ps * t[1] - 0.03 * n[1], 3), y=1.45, w=PLQ, h=0.18, shared=True) if gi == 0 else None,
                        affinityWall=room['neighbours'].get(k), set='burning-man-temple-2022 (2x2 grid)', setPos=gi + 1, grid=dict(col=col, row=row)))
                x += item_w(tuple(GRID)) - SP + gap; continue
            s = x + w['fw'] / 2; ps = x + w['fw'] + PGAP + PLQ / 2; nxt = items[items.index(i) + 1] if items.index(i) + 1 < len(items) else None
            x += item_w1(i) - SP + (SP if nxt is not None and nxt in SETOF.get(i, []) else gap)
            mx, mz = cx + ap * n[0], cz + ap * n[1]
            y = max(1.6, w['fh'] / 2 + 0.45)
            PLACED.append(dict(id=w['id'], twins=w['twins'], title=w['title'], url=w['url'], tex=w['tex'], tags=w['tags'], room=room['id'], wall=k, s=round(s, 3),
                x=round(mx + s * t[0] - 0.03 * n[0], 3), z=round(mz + s * t[1] - 0.03 * n[1], 3), y=round(y, 3), ix=round(-n[0], 4), iz=round(-n[1], 4),
                w=round(w['w'], 4), h=round(w['h'], 4), fw=round(w['fw'], 4), fh=round(w['fh'], 4), approxSize=w['approx'], smax=1, s_scale=1,
                plaque=dict(s=round(ps, 3), x=round(mx + ps * t[0] - 0.03 * n[0], 3), z=round(mz + ps * t[1] - 0.03 * n[1], 3), y=1.45, w=PLQ, h=0.18),
                affinityWall=room['neighbours'].get(k), set=next((n for n, m in SETS if i in m), None), setPos=(SETOF[i].index(i) + 1 if i in SETOF else None)))
    room['wallSegments'] = len(room['_segs']); room['blankSegments'] = [list(room['_segs'][si][:1]) + [round(room['_segs'][si][1], 2), round(room['_segs'][si][2], 2)] for si in range(len(room['_segs'])) if si not in room['_used']]
    room.pop('_segs'); room.pop('_used')
# hub: entrance hall with checkout + slipgates on the flanks of its doorways
hub_dw = list(range(6))  # v3: a door on every pavilion wall, each onto a colonnade across a courtyard
GATES = [('checkout', 'Checkout', True), ('dungeon', 'The Dungeon (TJM Gallery)', True), ('orsay', "Musee d'Orsay", True), ('bilbao', 'Guggenheim Bilbao', True),
         ('uffizi', 'Uffizi', True), ('gugg-ny', 'Guggenheim New York', True), ('concert-hall', 'Concert Hall (coming soon, inactive)', False)]
slots = []
for k in range(6):
    if k in hub_dw: slots += [(k, -HUBR / 4 - 0.4), (k, HUBR / 4 + 0.4)]
    else: slots += [(k, 0.0)]
# checkout on the wall facing the start; gates spread around
slots.sort(key=lambda s: (s[0] != 3, s[0], s[1]))
hub_gates = []
ap = HUBR * math.sqrt(3) / 2
for (gid, glabel, active), (k, s) in zip(GATES, slots):
    th = math.radians(60 * k); n = (math.cos(th), math.sin(th)); t = (-n[1], n[0])
    hub_gates.append(dict(id=gid, label=glabel, active=active, wall=k, s=s, width=1.8, x=round(ap * n[0] + s * t[0], 3), z=round(ap * n[1] + s * t[1], 3), ix=-n[0], iz=-n[1]))
hub = dict(id='hub', label='Central Pavilion', cell=[0, 0], center=[0, 0], radius=HUBR, apothem=ap, doorWalls=hub_dw, gates=hub_gates, start=dict(x=0, z=0, faceWall=3))
corr = []
for u, v in sorted(doors):
    if u not in CELLS or v not in CELLS: continue
    cu, cv = center(u), center(v); ru = HUBR if u == HUB else ROOMS[cellroom[u]]['radius']; rv = HUBR if v == HUB else ROOMS[cellroom[v]]['radius']
    dx, dz = cv[0] - cu[0], cv[1] - cu[1]; L = math.hypot(dx, dz); ux, uz = dx / L, dz / L
    au, av = ru * math.sqrt(3) / 2, rv * math.sqrt(3) / 2
    corr.append(dict(a=('hub' if u == HUB else ROOMS[cellroom[u]]['id']), b=('hub' if v == HUB else ROOMS[cellroom[v]]['id']), width=DOOR,
        p0=[round(cu[0] + ux * au, 3), round(cu[1] + uz * au, 3)], p1=[round(cv[0] - ux * av, 3), round(cv[1] - uz * av, 3)], sim=round(float(esim((u, v))), 3) if esim((u, v)) < 1e9 else None))
# ---- overlap self-check (same wall, frames + plaques) ----
bad = []
by = collections.defaultdict(list)
for p in PLACED:
    by[(p['room'], p['wall'], p.get('grid', {}).get('row', 0))].append((p['s'] - p['fw'] / 2, p['s'] + p['fw'] / 2, p['id']))
    if p['plaque']: by[(p['room'], p['wall'], 0)].append((p['plaque']['s'] - PLQ / 2, p['plaque']['s'] + PLQ / 2, p['id'] + ':plaque'))
for k, v in by.items():
    v.sort()
    for x, y in zip(v, v[1:]):
        if y[0] < x[1] - 1e-6: bad.append((k, x[2], y[2]))
degs = collections.Counter(x for e in corr for x in (e['a'], e['b']))
sets_check = {n: (len({(p['room'], p['wall']) for p in PLACED if p['set'] == n}) == 1 and [p['id'] for p in sorted([p for p in PLACED if p['set'] == n], key=lambda p: (-p['y'], p['s']))] == [W[i]['id'] for i in m]) for n, m in SETS}
# ---- v3: walk network (rooms, pavilion, colonnades, courtyards), courtyards, windows ----
import heapq, colorsys
CA = RC * math.sqrt(3) / 2  # cell apothem
def vkey(p): return (round(p[0], 2), round(p[1], 2))
def cell_vertex(c, k): cx, cz = center(c); return vkey((cx + RC * math.cos(math.radians(30 + 60 * k)), cz + RC * math.sin(math.radians(30 + 60 * k))))
def edge_of(c, k): return [cell_vertex(c, (k - 1) % 6), cell_vertex(c, k)]  # wall k of the cell lies between vertices k-1 and k
def emid(c, k): cx, cz = center(c); th = math.radians(60 * k); return vkey((cx + CA * math.cos(th), cz + CA * math.sin(th)))
NODE = {}; EDGES = []  # (u, v, length, kind)
def addn(name, p): NODE[name] = p; return name
def adde(u, v, kind): EDGES.append((u, v, math.dist(NODE[u], NODE[v]), kind))
YCELL = {c: f'court-{i + 1}' for i, c in enumerate(YARDS1)}
addn('hub', (0.0, 0.0))
for r in ROOMS: addn(r['id'], tuple(r['center']))
halls, windows = [], []
INNER = set(YARDS1) | {HUB}
for c in INNER:  # colonnade hallways along every courtyard edge (pavilion ring, between courtyards, courtyard/room edges)
    for k, n in enumerate(nbrs(c)):
        if c in YCELL and (n in INNER and (n == HUB or c < n) or n in CELLS):
            v0, v1 = edge_of(c, k); m = emid(c, k)
            for p in (v0, v1, m): addn(p, p)
            adde(v0, m, 'colonnade'); adde(m, v1, 'colonnade')
            both = n in YCELL
            halls.append(dict(kind='colonnade', between=[YCELL[c], YCELL[n] if n in YCELL else ('hub' if n == HUB else ROOMS[cellroom[n]]['id'])], p0=list(v0), p1=list(v1), width=HALL,
                              views='courtyards on both sides' if both else 'courtyard side open between columns'))
            windows.append(dict(kind='colonnade-view', x=m[0], z=m[1], sides=2 if both else 1, courtyard=YCELL[c]))
def door_pt(c, k, ap): cx, cz = center(c); th = math.radians(60 * k); return (cx + ap * math.cos(th), cz + ap * math.sin(th))
for r in ROOMS:
    c = tuple(r['cell'])
    for k in r['doorWalls']:
        n = room_cell_dir(c, k); dp = addn(f"{r['id']}:d{k}", door_pt(c, k, r['apothem'])); adde(r['id'], dp, 'room')
        m = emid(c, k); addn(m, m); adde(dp, m, 'vestibule')  # room-room doors meet at the shared edge midpoint
for k in range(6):  # pavilion doors -> crossing colonnade through courtyard k to the corner room
    dp = addn(f'hub:d{k}', door_pt(HUB, k, HUBR * math.sqrt(3) / 2)); adde('hub', dp, 'pavilion'); m0 = emid(HUB, k); addn(m0, m0); adde(dp, m0, 'vestibule')
    y = YARDS1[k]; xc = addn(f'cross-{k}', center(y)); m1 = emid(y, k); addn(m1, m1)
    adde(m0, xc, 'crossing-colonnade'); adde(xc, m1, 'crossing-colonnade')
    halls.append(dict(kind='crossing-colonnade', through=YCELL[y], p0=list(m0), p1=list(m1), width=HALL, views='courtyard on both sides'))
    windows.append(dict(kind='colonnade-view', x=(m0[0] + center(y)[0]) / 2, z=(m0[1] + center(y)[1]) / 2, sides=2, courtyard=YCELL[y]))
yards = []
for i, c in enumerate(YARDS1):
    cx, cz = center(c); k = i; th = math.radians(60 * k); px, pz = -math.sin(th), math.cos(th)  # perpendicular to the crossing colonnade
    fo = max(0.5 * CA, 4.6); founts = [dict(x=round(cx + sgn * fo * px, 2), z=round(cz + sgn * fo * pz, 2), r=1.4) for sgn in (1, -1)]
    yn = addn(YCELL[c] + ':yard', (cx, cz))
    adde(yn, f'cross-{k}', 'courtyard')  # step out between the crossing colonnade's columns
    spokes = []
    for j in range(6):
        if j in (k, (k + 3) % 6): continue  # those two edges are the crossing colonnade's ends
        m = emid(c, j); adde(yn, m, 'courtyard'); spokes.append(dict(toWall=j, x1=m[0], z1=m[1]))
    beds = [dict(x=round(cx + RMAX * 0.7 * math.cos(math.radians(30 + 60 * j)), 2), z=round(cz + RMAX * 0.7 * math.sin(math.radians(30 + 60 * j)), 2), r=0.8) for j in range(6)]
    beds = [b for b in beds if all(math.dist((b['x'], b['z']), (f['x'], f['z'])) > 3.4 + b['r'] + 0.3 for f in founts)]  # keep beds off the fountain ring paths
    yards.append(dict(id=YCELL[c], cell=list(c), center=[cx, cz], radius=RMAX, walkable=True, fountains=founts, fountainPaths=[dict(x=f['x'], z=f['z'], r0=1.8, r1=3.4) for f in founts],
                      spokes=spokes, beds=beds, crossingColonnadeWall=k, colonnade=dict(columnEvery=2.4, columnDia=0.35),
                      borders=['hub'] + [ROOMS[cellroom[n]]['id'] for n in nbrs(c) if n in CELLS] + [YCELL[n] for n in nbrs(c) if n in YCELL]))
G = collections.defaultdict(list)
for u, v, d, kind in EDGES: G[u].append((v, d)); G[v].append((u, d))
dist = {'hub': 0.0}; pq = [(0.0, 'hub')]
while pq:
    d, u = heapq.heappop(pq)
    if d > dist.get(u, 1e18): continue
    for v, w2 in G[u]:
        if d + w2 < dist.get(v, 1e18): dist[v] = d + w2; heapq.heappush(pq, (d + w2, v))
for r in ROOMS: r['walkToPavilion'] = round(dist[r['id']], 1)
if False: print({k: round(v, 1) for k, v in dist.items() if isinstance(k, str)}); print([(r['id'], r['cell'], r['apothem'], [ (v, round(d,2)) for v, d in G[r['id']]]) for r in ROOMS[:3]]); print('hubN', G['hub'][:2])
walk = dict(meanRooms=round(float(np.mean([r['walkToPavilion'] for r in ROOMS])), 1), meanPerPainting=round(sum(r['walkToPavilion'] * r['count'] for r in ROOMS) / N, 1),
            max=max(r['walkToPavilion'] for r in ROOMS), min=min(r['walkToPavilion'] for r in ROOMS), note='centre of room to centre of pavilion, metres, along doorways, vestibules and colonnades (shortest path)')
def sp(edges):
    g = collections.defaultdict(list)
    for u, v, d, kind in edges: g[u].append((v, d)); g[v].append((u, d))
    ds = {'hub': 0.0}; q = [(0.0, 'hub')]
    while q:
        d, u = heapq.heappop(q)
        if d > ds.get(u, 1e18): continue
        for v, w2 in g[u]:
            if d + w2 < ds.get(v, 1e18): ds[v] = d + w2; heapq.heappush(q, (d + w2, v))
    return ds
dnc = sp([e for e in EDGES if e[3] != 'courtyard'])
for r in ROOMS: r['walkToPavilionColonnadesOnly'] = round(dnc[r['id']], 1)
walk['colonnadesOnly'] = dict(mean=round(float(np.mean([r['walkToPavilionColonnadesOnly'] for r in ROOMS])), 1), max=max(r['walkToPavilionColonnadesOnly'] for r in ROOMS))
def rank(edges):
    nodes = {x for e in edges for x in e[:2]}; par = {x: x for x in nodes}
    def f(x):
        while par[x] != x: par[x] = par[par[x]]; x = par[x]
        return x
    for u, v, *_ in edges: par[f(u)] = f(v)
    return len(edges) - len(nodes) + len({f(x) for x in nodes}), nodes
base = [e for e in EDGES if e[3] != 'courtyard']
rb, nb_ = rank(base); rf, nf = rank(EDGES)
degb = collections.Counter(x for e in base for x in e[:2])
loops = dict(independentLoopsWithoutCourtyards=rb, independentLoopsWithCourtyards=rf, extraLoopsFromCourtyards=rf - rb,
             deadEndsWithoutCourtyards=sorted(str(x) for x, d in degb.items() if d < 2), bridgesWithoutCourtyards=len(bridges(nb_, [e[:2] for e in base])[0]))
degs = {r['id']: len(r['doorWalls']) for r in ROOMS}; degs['hub'] = 6
PAL = json.load(open('data/palette.json'))
def room_palette(ids):
    cs = collections.Counter()
    for i in ids:
        for rr, gg, bb, n in PAL.get(W[i]['id'], []): cs[(rr // 24 * 24 + 12, gg // 24 * 24 + 12, bb // 24 * 24 + 12)] += n
    def ok(c): h, l, s2 = colorsys.rgb_to_hls(*[v / 255 for v in c]); return 0.15 < l < 0.85 and s2 > 0.12
    sat = lambda c: colorsys.rgb_to_hls(*[v / 255 for v in c])[2]
    top = sorted([c for c in cs if ok(c)], key=lambda c: -cs[c] * sat(c) ** 2)[:5] or [c for c, _ in cs.most_common(5)]
    h, l, s2 = colorsys.rgb_to_hls(*[v / 255 for v in top[0]]); wr = colorsys.hls_to_rgb(h, 0.83, min(0.5, max(0.3, s2 * 0.75)))
    hexc = lambda c: '#%02x%02x%02x' % tuple(int(round(v)) for v in c)
    return hexc([v * 255 for v in wr]), [hexc(c) for c in top]
IDEAS = {'mexico': 'papel picado canopy hologram', 'burning-man': 'slowly turning wooden temple model (no fire)', 'family': 'hologram family photo album that turns its pages',
    'bass-coast': 'river-stone dancefloor with sunrise light ring', 'brekkie-bitcoin-b': 'oversized orange calcite B sculpture', 'pacific-northwest': 'mossy cedar stump with ferns and mist',
    'el-salvador': 'volcano miniature with a Bitcoin Beach surf hologram', 'sunset': 'sunset sky dome over a low reflecting pool', 'bitcoiners': 'slowly spinning Bitcoin block hologram',
    'portrait': 'easel and stool, the painter-at-work hologram', 'denny-blaine': 'Mount Rainier relief model at dawn light', 'political-portraits': 'speaker podium hologram'}
for r in ROOMS:
    r['wallColor'], r['palette'] = room_palette(cl[r['index']])
    t0 = next((t for t in r['mainTags'] if t in IDEAS), None); bitc = [x for x in ROOMS if 'bitcoiners' in x['mainTags']]
    idea = IDEAS.get(t0, 'reading bench with a hologram of the room\'s featured painting')
    if t0 == 'bitcoiners' and r is not bitc[0]: idea = 'Bounty of Satoshi treasure chest hologram' if 'animals' not in r['mainTags'] else 'bitcoin-orange animal topiary'
    if 'animals' in r['mainTags'] and t0 == 'bitcoiners': idea = 'bitcoin-orange animal topiary'
    cpr = round(max(0.8, min(2.0, r['apothem'] - 3.4)), 2)
    r['centerpiece'] = dict(x=r['center'][0], z=r['center'][1], radius=cpr, clearPath=round(r['apothem'] - cpr - 1.2, 2), suggestion=idea, status='suggestion only')
arch = dict(ceiling=6.0, hallCeiling=4.5, light='bright daylight from clerestories and courtyards', walls='per-room wallColor (light tint from the room palette)')
vestibules = [dict(p0=list(NODE[u]), p1=list(NODE[v]), width=DOOR) for u, v, d, kind in EDGES if kind == 'vestibule']
out = dict(issue=251, version=3, vestibules=vestibules, cellRadius=RC, halls=halls, loops=loops, walk=walk, courtyards=yards, windows=windows, architecture=arch, sets={n: [W[i]['title'] for i in m] for n, m in SETS}, note='Prototype layout from proposed (unapproved) tags. Sizes in metres; true size, approxSize flags estimates.',
    counts=dict(paintings=len(PLACED), rooms=K, doors=len(corr)), spacing=SPACING,
    score=dict(similarityTermFinal=round(float(simOnly), 2), walkTermFinal=round(float(final - simOnly), 2), formula='sum(sim x hexdist) + 1.0 x sum(paintings x centre distance to pavilion in cell spacings)', randomMean=round(float(np.mean(rand_scores)), 2), randomBest=round(float(min(rand_scores)), 2), greedy=round(float(greedy), 2), final=round(float(final), 2),
               improvementVsRandomPct=round(100 * (1 - final / np.mean(rand_scores)), 1), improvementVsGreedyPct=round(100 * (1 - final / greedy), 1)),
    checks=dict(blankWallSegments={r['id']: r['blankSegments'] for r in ROOMS if r['blankSegments']}, wallSegmentsTotal=sum(r['wallSegments'] for r in ROOMS), overlaps=bad, minExits=min(degs.values()), exits=dict(degs), setsOneRowInOrder=sets_check,  unplaced=N - len(PLACED)),
    tags={t: dict(TAGS.get(t, {}), weight=round(wt[t], 3), count=df[t]) for t in df}, hub=hub, rooms=ROOMS, corridors=corr, paintings=PLACED)
json.dump(out, open('data/layout.json', 'w'), indent=1, default=lambda o: int(o) if isinstance(o, np.integer) else float(o))
print(json.dumps(loops)); print(json.dumps(walk), len(yards), 'courtyards', len(windows), 'windows'); print(json.dumps(out['score']), json.dumps(out['checks'])[:300])
for r in ROOMS: print(r['wallColor'], r['walkToPavilion'], r['centerpiece']['suggestion'], '|', r['id'], r['cell'], r['count'], f"r={r['radius']}", r['label'], '| combines', r['combines'], '| doors', r['doorWalls'])
