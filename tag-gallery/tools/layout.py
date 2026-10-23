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
D = json.load(open('data/works.json')); TAGS = D['tags']; W = D['works']
MURAL_IDS = {'cormorant-presiding-over-sunset-on-puget-sound'}  # v4: hangs outdoors in a courtyard, not in a room
OUTDOOR_W = {w['id']: w for w in W if w['id'] in MURAL_IDS}; W = [w for w in W if w['id'] not in MURAL_IDS]; N = len(W)
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
# #284: use the hung size up front (catalog.py's #269 photo-shape rule: listed long side, served image's aspect), so the
# salon stacks and room sizes are measured on exactly what hangs
import os as _os
_DIMG = json.load(open('data/imgdims.json')); _RDP = '/workspace/play-tags/tools/realdims.json'; _RD = json.load(open(_RDP)) if _os.path.exists(_RDP) else {}
for w in W:
    _r = _RD.get(w['id'], {}); _d = _r.get('hiPx') or _r.get('px') or _DIMG.get(w.get('tex'))
    if _d:
        _a = _d[0] / _d[1]; _L = max(w['w'], w['h']); w['w'], w['h'] = (_L, _L / _a) if _a >= 1 else (_L * _a, _L)
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
_DM = [next((i for i in range(N) if W[i]['title'] == t), None) for t in ('My Dad, Paul Murphy', 'Mother Ruth')]  # #267: Dad and Mom side by side on one wall
if None not in _DM: SETS.append(('dad-and-mom (side by side)', _DM))
_T10 = [next((i for i in range(N) if W[i]['title'] == t), None) for t in ('Max Keiser & Michael Saylor', 'Symbiosis #1', 'Ser at Pacific Bitcoin Festival')]  # #284: tour stop 10 hangs on one wall
if None not in _T10: SETS.append(('tour-stop-10 (one wall)', _T10))
_T2 = [next((i for i in range(N) if W[i]['title'] == t), None) for t in ('Meditating at Denny Blaine on Solstice 2015', 'Meditation at Denny Blaine', 'Self Portrait, Meditation at Denny Blaine')]  # #284: tour stop 2 trio on one wall
if None not in _T2 and not any(set(_T2) & set(m) for _, m in SETS): SETS.append(('tour-stop-2 (one wall)', _T2))
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
while len(cl) > 12:  # v3+ ring has exactly 12 room cells: merge the most similar small pair
    v_, x_, y_ = max((link(cl[x], cl[y]), x, y) for x in range(len(cl)) for y in range(x + 1, len(cl)) if len(cl[x]) + len(cl[y]) <= 26)
    cl[x_] += cl[y_]; del cl[y_]
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
# v4: two outer courtyards on the outside of the ring, each touching two neighbouring rooms (a door from each): one for the
# Friends Club mural + Neural Dance projection next to the festival rooms, one for the garden mural next to the Pacific Northwest rooms
OUTER = []; _used = set()
for oname, otags, orad in (('friends-court', {'festival', 'burning-man', 'bass-coast'}, 9.0), ('garden-court', {'pacific-northwest', 'seattle'}, 6.0)):
    best_ = None
    for a in CELLS:
        for b in nbrs(a):
            if b in CELLS and a < b:
                for o in set(nbrs(a)) & set(nbrs(b)):
                    if hd(o, HUB) != 3 or o in _used: continue
                    sc = sum(1 for i in cl[cellroom[a]] + cl[cellroom[b]] if set(W[i]['tags']) & otags)
                    if best_ is None or sc > best_[0]: best_ = (sc, a, b, o)
    sc, a, b, o = best_; _used.add(o); OUTER.append(dict(id=oname, cell=o, radius=orad, rooms=[a, b], score=sc))
    doors.add(tuple(sorted((a, o)))); doors.add(tuple(sorted((b, o))))
OUTCELLS = [q['cell'] for q in OUTER]; ORAD = {q['cell']: q['radius'] for q in OUTER}
OTOUCH = [(c, k, q["cell"]) for q in OUTER for c in q["rooms"] for k in range(6) if (c[0] + DIRS[k][0], c[1] + DIRS[k][1]) == q["cell"]]
# ---- rooms: walls, ordering, packing ----
DOOR, DCLR, CORNER, PLQ, PGAP, SP = 1.6, 0.45, 0.6, 0.26, 0.06, 0.35
# #284 salon hanging: a vertical band centred on 48 in; small works stack 2-3 high in a column, large/tall ones hang alone.
# Every plaque stays at 1.45 m: a stack's first plaque sits left of the column, the others to its right (top to bottom = left to right).
BAND_C, BAND_H, SGAP, SMALL_H, SMALL_W = 48 * 0.0254, 1.40, 0.10, 0.64, 0.95
class Stack(tuple): pass
def stack_w(u): return PLQ + PGAP + max(W[i]['fw'] for i in u) + (len(u) - 1) * (PLQ + PGAP) + SP
def stack_h(u): return sum(W[i]['fh'] for i in u) + SGAP * (len(u) - 1)
def stackable(i): return W[i]['fh'] <= SMALL_H and W[i]['fw'] <= SMALL_W
def make_stacks(units, order):
    singles = [u for u in order if not isinstance(u, tuple) and stackable(u)]; rest = [u for u in units if not (not isinstance(u, tuple) and stackable(u))]
    out, cur, left = [], [], len(units) - MINUNITS  # keep >= MINUNITS units: every wall segment still gets a work (no blank walls)
    for i in singles:
        if cur and (left <= 0 or len(cur) >= 3 or stack_h(cur + [i]) > BAND_H or abs(W[i]['fw'] - W[cur[0]]['fw']) > 0.35): out.append(cur); cur = []
        elif cur: left -= 1
        cur.append(i)
    if cur: out.append(cur)
    return rest + [Stack(c) if len(c) > 1 else c[0] for c in out]
def item_w1(i): return W[i]['fw'] + PGAP + PLQ + SP
def item_w(u):
    if isinstance(u, Stack): return stack_w(u)
    if isinstance(u, tuple) and u[0] in GRIDSET: return max(W[i]['fw'] for i in u[:2]) + max(W[i]['fw'] for i in u[2:]) + GGAP + PGAP + PLQ + SP
    return sum(item_w1(i) for i in u) if isinstance(u, tuple) else item_w1(u)
DOOROFF = {}  # v4: (cell, wall) -> door centre along the wall, inside the part shared with the neighbour
def segments(r, doorwalls, cell=None):
    out = []
    for k in range(6):
        if k in doorwalls:
            h = DOOR / 2 + DCLR; o = DOOROFF.get((cell, k), 0.0)
            for a_, b_ in ((-r / 2 + CORNER, o - h), (o + h, r / 2 - CORNER)):
                if b_ - a_ >= 0.8: out.append((k, a_, b_))
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
    units = make_stacks(units, sorted(units, key=lambda u: -sum(S[i, c].sum() for i in mem(u))))
    dw = {k for k in range(6) if tuple(sorted((cell, room_cell_dir(cell, k)))) in doors}
    nb = {k: cellroom.get(room_cell_dir(cell, k)) for k in range(6)}
    aff = {(i, k): (S[i, cl[nb[k]]].mean() if isinstance(nb[k], (int, np.integer)) else 0.0) for i in c for k in range(6)}
    need = sum(item_w(u) for u in units)
    r = RSTART.get(cell, 5.0)
    while True:
        segs = segments(r, dw, cell)
        if sum(b - a2 for _, a2, b in segs) * 0.97 >= need and all(item_w(u) - SP <= max(b - a2 for _, a2, b in segs) for u in units):
            seq = sorted(units, key=lambda u: -sum(S[i, c].sum() for i in mem(u))); pl = pack(seq, segs)
            for _t in range(300):  # v3: try other orders before growing the room (wide sets need a full wall)
                if pl: break
                random.shuffle(seq); pl = pack(seq, segs)
            if pl: break
        r += 0.25
        if r > 14: print("STUCK", a, cell, need, [item_w(u) for u in units], segs); raise SystemExit
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
    for u, si, x in opl: bys[si].append(u)
    ap = r * math.sqrt(3) / 2
    Rc_center = None
    main, comb, cnt = label(c)
    room = dict(id=f'room-{a + 1:02d}', index=a, cell=list(cell), radius=r, apothem=ap, count=len(c), label=' · '.join(TAGS.get(t, {}).get('label', t) for t in main),
                mainTags=main, combines={t: cnt[t] for t in comb}, doorWalls=sorted(dw), neighbours={k: (f'room-{nb[k] + 1:02d}' if isinstance(nb[k], (int, np.integer)) else nb[k]) for k in range(6) if nb[k] is not None})
    room['_bys'] = bys; room['_segs'] = segs; ROOMS.append(room)
RSTART = {}
build_rooms()  # each room sized to its paintings
# ---- coordinates ----
# ---- v4 geometry: rooms touch their ring neighbours (shared walls, doors through them); small courtyards hug the pavilion ----
from scipy.optimize import minimize
HALL = 2.0
RP = 9.0; APP = RP * math.sqrt(3) / 2; HUBR = RP          # pavilion hex: open column ring on its outline, walled round core inside
RCORE = 4.6                                               # circular core wall holding the gates
RY = 4.6; APY = RY * math.sqrt(3) / 2                     # inner courtyards, smaller than any room
def nv(k): th = math.radians(60 * k); return np.array([math.cos(th), math.sin(th)])
def tv(k): th = math.radians(60 * k); return np.array([-math.sin(th), math.cos(th)])
YPOS = {YARDS1[k]: (APP + APY) * nv(k) for k in range(6)}  # courtyards touch the pavilion's column ring
RING = [(c, n, k) for c in CELLS for k, n in enumerate(nbrs(c)) if n in CELLS and c < n]
CORN = [(c, CORNER_CELLS[c]) for c in CELLS if c in CORNER_CELLS]
SHARE = DOOR + 2 * DCLR                                   # shared wall length needed for a doorway
FIX = [((0.0, 0.0), RP, 'hub')] + [(tuple(YPOS[y]), RY, YCELL_ID) for y, YCELL_ID in zip(YARDS1, [f'court-{i + 1}' for i in range(6)])]
def solve_geometry():
    global CPOS, RC, RMAX, SPACING, RAD, APR
    RAD = {c: ROOMS[cellroom[c]]['radius'] for c in CELLS}; RAD.update(ORAD); APR = {c: RAD[c] * math.sqrt(3) / 2 for c in RAD}
    GEOM = CELLS + OUTCELLS
    def lattice(c): q, r = c; return np.array([(q + r / 2) * 17.0, r * 17.0 * math.sqrt(3) / 2])
    x0 = np.concatenate([lattice(c) for c in GEOM]); IDX = {c: i for i, c in enumerate(GEOM)}
    AX = [nv(0), nv(1), nv(2)]
    def sep(d, ra, rb): return max(abs(d @ a) for a in AX) - (ra + rb) * math.sqrt(3) / 2  # >= 0: identically oriented hexes do not overlap
    def viol(x, detail=False):
        P = {c: x[2 * IDX[c]: 2 * IDX[c] + 2] for c in GEOM}; out = []
        for c, k, o in OTOUCH:
            d = P[o] - P[c]; out.append(('otouch', c, o, d @ nv(k) - (APR[c] + APR[o]))); out.append(('oshare', c, o, max(0, abs(d @ tv(k)) - ((RAD[c] + RAD[o]) / 2 - SHARE))))
        for c, n, k in RING:
            d = P[n] - P[c]; out.append(('touch', c, n, d @ nv(k) - (APR[c] + APR[n]))); out.append(('share', c, n, max(0, abs(d @ tv(k)) - ((RAD[c] + RAD[n]) / 2 - SHARE))))
        for c, k in CORN:
            pass  # v4: corner rooms face their courtyard across the open colonnade ground (no touch needed)
        cs = GEOM
        for i, a in enumerate(cs):
            for b in cs[i + 1:]: out.append(('overlap', a, b, min(0, sep(P[b] - P[a], RAD[a], RAD[b]))))
            for p, r, nm in FIX: out.append(('overlapF', a, nm, min(0, sep(P[a] - np.array(p), RAD[a], r))))
        return out
    def obj(x):
        v = sum(t[3] ** 2 for t in viol(x)); P = x.reshape(-1, 2)  # walking weight on rooms only
        return 1000 * v + 0.02 * sum(len(cl[cellroom[c]]) * np.linalg.norm(P[IDX[c]]) for c in CELLS)
    res = None
    for scale in (1.0, 1.1, 0.9, 1.2):
        r_ = minimize(obj, x0 * scale, method='L-BFGS-B', options=dict(maxiter=20000, maxfun=200000))
        if res is None or r_.fun < res.fun: res = r_
    worst = max(abs(t[3]) for t in viol(res.x)); print('geometry worst violation m', round(worst, 4))
    assert worst < 0.02, [t for t in viol(res.x) if abs(t[3]) > 0.02]
    CPOS = {c: res.x[2 * IDX[c]: 2 * IDX[c] + 2] for c in GEOM}
    RC = RMAX = max(RAD.values()); SPACING = None

def door_offsets():
    DOOROFF.clear()
    for c, n, k in RING:
        sn = (CPOS[n] - CPOS[c]) @ tv(k); lo, hi = max(-RAD[c] / 2, sn - RAD[n] / 2), min(RAD[c] / 2, sn + RAD[n] / 2); mid = (lo + hi) / 2
        DOOROFF[(c, k)] = float(mid); DOOROFF[(n, (k + 3) % 6)] = float(-(mid - sn))
    for c, k, o in OTOUCH:
        sn = (CPOS[o] - CPOS[c]) @ tv(k); lo, hi = max(-RAD[c] / 2, sn - RAD[o] / 2), min(RAD[c] / 2, sn + RAD[o] / 2); DOOROFF[(c, k)] = float((lo + hi) / 2)
for it_ in range(4):
    solve_geometry(); door_offsets(); before = {c: ROOMS[cellroom[c]]['radius'] for c in CELLS}
    RSTART = {c: before[c] for c in CELLS}; build_rooms()
    if all(ROOMS[cellroom[c]]['radius'] == before[c] for c in CELLS): break
else: raise SystemExit('room sizes did not settle')
def center(cell):
    if cell == HUB: return (0.0, 0.0)
    if cell in YPOS: return tuple(float(v) for v in YPOS[cell])
    return tuple(float(v) for v in CPOS[cell])
for room in ROOMS:
    cx, cz = center(tuple(room['cell'])); room['center'] = [cx, cz]; r, ap = room['radius'], room['apothem']
    room['_used'] = set(room['_bys']); 
    for si, units in room.pop('_bys').items():
        k, a, b = room['_segs'][si]
        gap = ((b - a) - sum(item_w(u) - SP for u in units)) / (len(units) + 1); x = a + gap
        th = math.radians(60 * k); n = (math.cos(th), math.sin(th)); t = (-n[1], n[0]); mx, mz = cx + ap * n[0], cz + ap * n[1]
        def emit(i, s, y, ps, plq=True, **extra):
            w = W[i]; d = dict(id=w['id'], twins=w['twins'], title=w['title'], url=w['url'], tex=w['tex'], tags=w['tags'], room=room['id'], wall=k, s=round(s, 3),
                x=round(mx + s * t[0] - 0.03 * n[0], 3), z=round(mz + s * t[1] - 0.03 * n[1], 3), y=round(y, 3), ix=round(-n[0], 4), iz=round(-n[1], 4),
                w=round(w['w'], 4), h=round(w['h'], 4), fw=round(w['fw'], 4), fh=round(w['fh'], 4), approxSize=w['approx'], smax=1, s_scale=1,
                plaque=dict(s=round(ps, 3), x=round(mx + ps * t[0] - 0.03 * n[0], 3), z=round(mz + ps * t[1] - 0.03 * n[1], 3), y=1.45, w=PLQ, h=0.18) if plq else None,
                affinityWall=room['neighbours'].get(k), set=next((nm for nm, m in SETS if i in m), None), setPos=(SETOF[i].index(i) + 1 if i in SETOF else None))
            d.update(extra); PLACED.append(d)
        for u in units:
            if isinstance(u, Stack):  # salon column centred on the 48 in band, plaques at 1.45 m beside it
                col = f"{room['id']}-w{k}-c{round(x, 2)}"; cwid = max(W[i]['fw'] for i in u); sc = x + PLQ + PGAP + cwid / 2; top = BAND_C + stack_h(u) / 2
                for j, i in enumerate(u):
                    ps = x + PLQ / 2 if j == 0 else x + PLQ + PGAP + cwid + PGAP + (j - 1) * (PLQ + PGAP) + PLQ / 2
                    emit(i, sc, top - W[i]['fh'] / 2, ps, stack=dict(col=col, pos=j + 1, n=len(u))); top -= W[i]['fh'] + SGAP
            elif isinstance(u, tuple) and u[0] in GRIDSET:
                cw = [max(W[j]['fw'] for j in GRID[:2]), max(W[j]['fw'] for j in GRID[2:])]; rh = max(W[j]['fh'] for j in GRID); yc = max(BAND_C, rh + GGAP / 2 + 0.3)
                ps = x + cw[0] + GGAP + cw[1] + PGAP + PLQ / 2
                for gi, j in enumerate(GRID):  # reading order: top-left, top-right, bottom-left, bottom-right
                    col, row = gi % 2, gi // 2; sj = x + (cw[0] / 2 if col == 0 else cw[0] + GGAP + cw[1] / 2)
                    emit(j, sj, yc + (rh + GGAP) / 2 * (1 if row == 0 else -1), ps, plq=gi == 0, grid=dict(col=col, row=row))
                    if gi == 0: PLACED[-1]['plaque']['shared'] = True
            else:
                mem = list(u) if isinstance(u, tuple) else [u]; y = max(BAND_C, max(W[i]['fh'] for i in mem) / 2 + 0.3); xx = x
                for i in mem:
                    emit(i, xx + W[i]['fw'] / 2, y, xx + W[i]['fw'] + PGAP + PLQ / 2); xx += item_w1(i)
            x += item_w(u) - SP + gap
    room['wallSegments'] = len(room['_segs']); room['blankSegments'] = [list(room['_segs'][si][:1]) + [round(room['_segs'][si][1], 2), round(room['_segs'][si][2], 2)] for si in range(len(room['_segs'])) if si not in room['_used']]
    room.pop('_segs'); room.pop('_used')
# v4 pavilion: open column ring on the outer hex, walled circular core inside with the gates set into the core wall,
# six openings in the core wall (at 60k deg) between the gates; checkout kiosk in the ring walk, seen through the opening the start faces
GATES = [('dungeon', 'The Dungeon (TJM Gallery)', True), ('orsay', "Musee d'Orsay", True), ('bilbao', 'Guggenheim Bilbao', True),
         ('uffizi', 'Uffizi', True), ('gugg-ny', 'Guggenheim New York', True), ('concert-hall', 'Concert Hall (coming soon, inactive)', False)]
hub_gates = []
for j, (gid, glabel, active) in enumerate(GATES):
    a = math.radians(30 + 60 * j)
    hub_gates.append(dict(id=gid, label=glabel, active=active, onCoreWall=True, angle=30 + 60 * j, width=1.8, x=round(RCORE * math.cos(a), 3), z=round(RCORE * math.sin(a), 3), ix=-math.cos(a), iz=-math.sin(a)))
CHECKOUT = dict(id='checkout', label='Checkout', active=True, angle=0, x=round((RCORE + APP) / 2 + 0.3, 3), z=0.0, width=1.8, facing='core opening at 0 deg', where='ring walk between the column ring and the core')
hub_gates.append(CHECKOUT)
hub_dw = list(range(6))
ap = APP
hub = dict(id='hub', label='Central Pavilion', cell=[0, 0], center=[0, 0], radius=HUBR, apothem=APP, coreRadius=RCORE, columnRing=dict(every=2.0, dia=0.4),
           coreOpenings=[60 * k for k in range(6)], doorWalls=hub_dw, gates=hub_gates, start=dict(x=0, z=0, faceAngle=0, note='centre of the core, facing the opening toward the checkout'))
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
by = collections.defaultdict(list)  # #284: 2-D rectangles (salon stacks share horizontal space)
for p in PLACED:
    by[(p['room'], p['wall'])].append((p['s'] - p['fw'] / 2, p['s'] + p['fw'] / 2, p['y'] - p['fh'] / 2, p['y'] + p['fh'] / 2, p['id']))
    if p['plaque']: by[(p['room'], p['wall'])].append((p['plaque']['s'] - PLQ / 2, p['plaque']['s'] + PLQ / 2, 1.36, 1.54, p['id'] + ':plaque'))
for k, v in by.items():
    for ii, A in enumerate(v):
        for B in v[ii + 1:]:
            if A[0] < B[1] - 1e-6 and B[0] < A[1] - 1e-6 and A[2] < B[3] - 1e-6 and B[2] < A[3] - 1e-6: bad.append((k, A[4], B[4]))
degs = collections.Counter(x for e in corr for x in (e['a'], e['b']))
sets_check = {n: (len({(p['room'], p['wall']) for p in PLACED if p['set'] == n}) == 1 and [p['id'] for p in sorted([p for p in PLACED if p['set'] == n], key=lambda p: (-p['y'], p['s']))] == [W[i]['id'] for i in m]) for n, m in SETS}
# ---- v4: walk, courtyards, colonnades, loops ----
import heapq, colorsys
YCELL = {c: f'court-{i + 1}' for i, c in enumerate(YARDS1)}
FR_, P0, P1 = 1.2, 1.7, 2.7  # fountain radius, ring path inner/outer radius
yards = []
for i, c in enumerate(YARDS1):
    cx, cz = center(c)
    spokes = [dict(toWall=j, x1=round(cx + APY * math.cos(math.radians(60 * j)), 2), z1=round(cz + APY * math.sin(math.radians(60 * j)), 2), width=1.4) for j in range(6)]
    beds = [dict(x=round(cx + RY * 0.72 * math.cos(math.radians(30 + 60 * j)), 2), z=round(cz + RY * 0.72 * math.sin(math.radians(30 + 60 * j)), 2), r=0.55) for j in range(6)]
    yards.append(dict(id=YCELL[c], cell=list(c), center=[cx, cz], radius=RY, walkable=True, fountains=[dict(x=cx, z=cz, r=FR_)], fountainPaths=[dict(x=cx, z=cz, r0=P0, r1=P1)],
                      spokes=spokes, beds=beds, peristyle=dict(columnEvery=1.8, columnDia=0.3, note='open column ring on the courtyard outline: views in from every side, step through anywhere'),
                      borders=['hub', ROOMS[cellroom[(2 * c[0], 2 * c[1])]]['id']]))
halls = [dict(kind='pavilion-column-ring', radius=HUBR, columnEvery=2.0, note='open colonnade around the pavilion')] + [dict(kind='courtyard-peristyle', courtyard=y['id'], center=y['center'], radius=RY) for y in yards]
windows = [dict(kind='peristyle-view', courtyard=y['id'], x=round(y['center'][0] + RY * math.cos(math.radians(30 + 60 * j)) * 0.5 + 0, 2), z=round(y['center'][1] + RY * math.sin(math.radians(30 + 60 * j)) * 0.5, 2)) for y in yards for j in ()]
# walking: the pavilion's outer ring is open all round and the ground between pavilion, courtyards and rooms is open colonnade,
# so a route is straight unless it meets a courtyard, where it follows the ring path half way round the fountain
def seg_pt(a, b, p):
    a, b, p = map(np.array, (a, b, p)); d = b - a; u = max(0, min(1, (p - a) @ d / (d @ d))); return float(np.linalg.norm(a + u * d - p))
def route(a, b):
    L_ = math.dist(a, b)
    for y in yards:
        c = y['center']
        if seg_pt(a, b, c) < P1 - 0.1: L_ += (math.pi - 2) * (P0 + P1) / 2  # around the fountain on the ring path instead of straight through
    return L_
def door_point(r, k):
    c = np.array(r['center']); o = DOOROFF.get((tuple(r['cell']), k), 0.0); return c + r['apothem'] * nv(k) + o * tv(k)
for r in ROOMS:
    c = tuple(r['cell']); k = [w for w in r['doorWalls'] if room_cell_dir(c, w) in YARDS1][0]
    D = door_point(r, k); d = np.array(r['center']) - D
    r['innerDoorWall'] = k; r['innerDoor'] = [round(float(D[0]), 2), round(float(D[1]), 2)]
    start = (D / np.linalg.norm(D)) * APP if np.linalg.norm(D) > APP else D  # leave the pavilion through the column ring, straight toward the door
    r['walkToPavilion'] = round(APP + route(tuple(start), tuple(D)) + float(np.linalg.norm(d)), 1)
walk = dict(meanRooms=round(float(np.mean([r['walkToPavilion'] for r in ROOMS])), 1), meanPerPainting=round(sum(r['walkToPavilion'] * r['count'] for r in ROOMS) / N, 1),
            max=max(r['walkToPavilion'] for r in ROOMS), min=min(r['walkToPavilion'] for r in ROOMS),
            note='pavilion centre to room centre in metres: out through the open column ring, across the open colonnade ground, round courtyard fountains on the ring path, through the inner door')
# loops: nodes = rooms, the open colonnade ground around the pavilion ('plaza', including the pavilion ring), courtyards
E_base = [(ROOMS[cellroom[a]]['id'], ROOMS[cellroom[b]]['id']) for a, b, k in RING]
for r in ROOMS:
    c = tuple(r['cell']); E_base.append((r['id'], YCELL[YARDS1[CORNER_CELLS[c]]] if c in CORNER_CELLS else 'plaza'))
for y in yards: E_base.append((y['id'], 'plaza'))
for q in OUTER:
    for c in q['rooms']: E_base.append((ROOMS[cellroom[c]]['id'], q['id']))  # the courtyard opens to the colonnade ground toward the pavilion
E_full = E_base + [(y['id'], 'plaza') for y in yards for _ in range(3)]  # walkable courtyards: step in/out through the peristyle on the other open sides (3 more per courtyard)
def rank(edges):
    nodes = {x for e in edges for x in e}; par = {x: x for x in nodes}
    def f(x):
        while par[x] != x: par[x] = par[par[x]]; x = par[x]
        return x
    for u, v in edges: par[f(u)] = f(v)
    return len(edges) - len(nodes) + len({f(x) for x in nodes}), nodes
rb, nb_ = rank(E_base); rf, _ = rank(E_full)
degb = collections.Counter(x for e in E_base for x in e)
loops = dict(independentLoopsWithoutCourtyardPaths=rb, independentLoopsWithCourtyardPaths=rf, extraLoopsFromCourtyards=rf - rb,
             deadEnds=sorted(x for x, d in degb.items() if d < 2), bridges=len(bridges(nb_, E_base)[0]))
degs = {r['id']: len(r['doorWalls']) for r in ROOMS}; degs['hub'] = 'open all round'
# ---- v4 outdoor art: murals and the Neural Dance projection in the outer courts ----
PLAYCAT = {p['id']: p for p in json.load(open('/workspace/play-gallery/src/catalog.json'))['paintings']}
fc = PLAYCAT.get('friends-club-mural'); cm = OUTDOOR_W.get('cormorant-presiding-over-sunset-on-puget-sound')
ART = {'friends-court': [dict(id='friends-club-mural', kind='mural', title='Friends Club mural (Friends Club festival 2026, near Lillooet, BC)', tags=['festival', 'friends'], tagsProposed=True,
            w=fc['iw'], h=fc['ih'], sizeSource='play gallery catalog (hung at real size there): 40 x 9 ft shipping-container mural', tex=fc['hi'], url=fc['url'], placeholder=False)],
       'garden-court': [dict(id=cm['id'], kind='mural', title=cm['title'] + ' (garden mural for Brian, Seattle)', tags=sorted(set(cm['tags']) | {'animals'}), tagsProposed=True,
            w=cm['size']['w'], h=cm['size']['h'], sizeSource='catalog products.json 60 x 40 in', tex=cm['tex'], url=cm['url'], placeholder=False)]}
IN_ = 0.0254
PLQ_SCALE = 3.0  # TJ: enlarge every brass plaque by the same factor so the label text reads at ~1.2 m (small text 4 mm -> 12 mm, ~9 px tall at 1080p)
PLAQ = {'friends-court': [dict(id='friends-club-brass-plaque', kind='brass-plaque', title='Friends Club brass plate (etched by TJ)', w=6 * IN_ * PLQ_SCALE, h=6 * IN_ * 999 / 1000 * PLQ_SCALE, trueSizeIn=[6, 6], scale=PLQ_SCALE, mountCentreY=1.45, sizeSource='six-inch plate per the brass plate etching blog post',
            img='assets/friends-club-plaque.png', source='vermillionaurora static/display/friends-club-brass-plate-finished-5c66cc5ab7-1200.webp', tags=['festival', 'friends'])],
        'garden-court': [dict(id='cormorant-qr-brass-plaque', kind='brass-plaque', title='Cormorant Presiding over Sunset on Puget Sound: brass label plate with QR code', w=2.9 * IN_ * PLQ_SCALE, h=2.9 * IN_ / 0.495 * PLQ_SCALE, trueSizeIn=[2.9, 5.86], scale=PLQ_SCALE, mountCentreY=1.45,
            sizeSource='measured against the 6 in eagle plate in the same photo: about 2.9 x 5.9 in (TJ estimate 3.4 x 6.8 in)', img='assets/cormorant-label-plaque.png', source='assets/src/eagle-and-cormorant-plaques.png (TJ photo)', tags=['animals']),
            dict(id='eagle-brass-plaque', kind='brass-plaque', title='Eagle brass plate (etched by TJ): eagle over water', w=6 * IN_ * PLQ_SCALE, h=6 * IN_ * 983 / 1000 * PLQ_SCALE, trueSizeIn=[6, 5.9], scale=PLQ_SCALE, mountCentreY=1.45, sizeSource='6 in per side (TJ)',
            img='assets/eagle-plaque.png', source='assets/src/eagle-and-cormorant-plaques.png (TJ photo)', tags=['animals'])]}
outer_out = []
for q in OUTER:
    o = q['cell']; Y = np.array(CPOS[o]); R_ = q['radius']; AP_ = R_ * math.sqrt(3) / 2
    ks = [(k + 3) % 6 for c, k, oo in OTOUCH if oo == o]  # directions from the court to its two rooms
    m = nv(ks[0]) + nv(ks[1]); m = m / np.linalg.norm(m)
    items = []
    for a in ART[q['id']]:
        pls = PLAQ[q['id']]; plw = sum(x['w'] + 0.25 for x in pls)
        wc = Y - 0.45 * R_ * m; L_ = a['w'] + 0.6 + plw; mt = np.array([-m[1], m[0]])
        mc = wc - mt * plw / 2  # mural left of centre, plaques to its right at eye level
        items.append(dict(a, wallCenter=[round(float(wc[0]), 2), round(float(wc[1]), 2)], wallLength=round(L_, 2), wallFacing=[round(float(m[0]), 3), round(float(m[1]), 3)], freestanding=True,
                          x=round(float(mc[0]), 2), z=round(float(mc[1]), 2), y=round(0.3 + a['h'] / 2, 3), viewFromColonnade=round(float(0.45 * R_ + AP_), 1)))
        off = a['w'] / 2 + 0.25
        for x in pls:
            pc = mc + mt * (off + x['w'] / 2); off += x['w'] + 0.25
            items.append(dict(x, x=round(float(pc[0]), 2), z=round(float(pc[1]), 2), y=1.45, onWallOf=a['id'], wallFacing=[round(float(m[0]), 3), round(float(m[1]), 3)]))
        assert L_ <= R_ * math.sqrt(3) - 0.6, 'mural wall does not fit the court'
    fo = Y + 0.2 * R_ * m
    if q['id'] == 'friends-court':
        j = [x for x in ((ks[0] + 1) % 6, (ks[0] - 1) % 6, (ks[1] + 1) % 6, (ks[1] - 1) % 6) if x not in ks][0]
        sc_ = Y + AP_ * nv(j)
        items.append(dict(id='neural-dance', kind='projection', title='Neural Dance (live projection)', note="TJ's interactive installation from /neural-dance/ run live as a canvas texture in the 3D build",
                          url='https://tjm.art/neural-dance/', w=6.0, h=3.375, courtWall=j, wallCenter=[round(float(sc_[0]), 2), round(float(sc_[1]), 2)], wallLength=6.6,
                          wallFacing=[round(float(-nv(j)[0]), 3), round(float(-nv(j)[1]), 3)], y=round(0.5 + 3.375 / 2, 3)))
        # keep the screen clear of the mural wall
        mw = items[0]; mwc = np.array(mw['wallCenter']); mt = np.array([-m[1], m[0]])
        ends = [mwc + mt * mw['wallLength'] / 2, mwc - mt * mw['wallLength'] / 2]; st = tv(j)
        sends = [sc_ + st * 3.3, sc_ - st * 3.3]
        assert min(seg_pt(tuple(sends[0]), tuple(sends[1]), tuple(e)) for e in ends) > 0.8, 'screen too close to the mural wall'
    outer_out.append(dict(id=q['id'], cell=list(o), center=[round(float(Y[0]), 2), round(float(Y[1]), 2)], radius=R_, walkable=True, rooms=[ROOMS[cellroom[c]]['id'] for c in q['rooms']],
        colonnadeSides=ks, fountains=[dict(x=round(float(fo[0]), 2), z=round(float(fo[1]), 2), r=1.2)], fountainPaths=[dict(x=round(float(fo[0]), 2), z=round(float(fo[1]), 2), r0=1.7, r1=2.7)],
        spokes=[dict(x1=round(float(Y[0] + AP_ * nv(k)[0]), 2), z1=round(float(Y[1] + AP_ * nv(k)[1]), 2), x0=round(float(fo[0]), 2), z0=round(float(fo[1]), 2), width=1.6) for k in ks],
        art=items, peristyle=dict(sides=ks, columnEvery=1.8, note='colonnade along the room walls with views across the court to the art')))
for r in ROOMS: r['doorOffsets'] = {int(k): round(DOOROFF.get((tuple(r['cell']), k), 0.0), 2) for k in r['doorWalls']}
sharedWalls = []
for a, b, k in RING:
    ra, rb_ = ROOMS[cellroom[a]], ROOMS[cellroom[b]]; gap = float((CPOS[b] - CPOS[a]) @ nv(k) - (APR[a] + APR[b]))
    sharedWalls.append(dict(rooms=[ra['id'], rb_['id']], gap=round(gap, 3), doorOffset=round(DOOROFF[(a, k)], 2)))
for c, k, o in OTOUCH: sharedWalls.append(dict(rooms=[ROOMS[cellroom[c]]['id'], [q['id'] for q in OUTER if q['cell'] == o][0]], gap=round(float((CPOS[o] - CPOS[c]) @ nv(k) - (APR[c] + APR[o])), 3), doorOffset=round(DOOROFF[(c, k)], 2)))
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
arch = dict(ceiling=6.0, colonnadeHeight=4.5, light='bright daylight from clerestories and courtyards', walls='per-room wallColor (light tint from the room palette)')
out = dict(issue=251, version=4, outerCourts=outer_out, sharedWalls=sharedWalls, pavilionRadius=HUBR, courtyardRadius=RY, halls=halls, loops=loops, walk=walk, courtyards=yards, windows=windows, architecture=arch, sets={n: [W[i]['title'] for i in m] for n, m in SETS}, note='Prototype layout from proposed (unapproved) tags. Sizes in metres; true size, approxSize flags estimates.',
    counts=dict(paintings=len(PLACED), rooms=K, doors=len(corr)), spacing=SPACING,
    score=dict(similarityTermFinal=round(float(simOnly), 2), walkTermFinal=round(float(final - simOnly), 2), formula='sum(sim x hexdist) + 1.0 x sum(paintings x centre distance to pavilion in cell spacings)', randomMean=round(float(np.mean(rand_scores)), 2), randomBest=round(float(min(rand_scores)), 2), greedy=round(float(greedy), 2), final=round(float(final), 2),
               improvementVsRandomPct=round(100 * (1 - final / np.mean(rand_scores)), 1), improvementVsGreedyPct=round(100 * (1 - final / greedy), 1)),
    checks=dict(blankWallSegments={r['id']: r['blankSegments'] for r in ROOMS if r['blankSegments']}, wallSegmentsTotal=sum(r['wallSegments'] for r in ROOMS), overlaps=bad, minExits=min(v for v in degs.values() if isinstance(v, int)), maxGapBetweenNeighbourRooms=max(abs(w['gap']) for w in sharedWalls), exits=dict(degs), setsOneRowInOrder=sets_check,  unplaced=N - len(PLACED)),
    tags={t: dict(TAGS.get(t, {}), weight=round(wt[t], 3), count=df[t]) for t in df}, hub=hub, rooms=ROOMS, corridors=corr, paintings=PLACED)
json.dump(out, open('data/layout.json', 'w'), indent=1, default=lambda o: int(o) if isinstance(o, np.integer) else float(o))
print(json.dumps(loops)); print(json.dumps(walk), len(yards), 'courtyards', len(windows), 'windows'); print(json.dumps(out['score']), json.dumps(out['checks'])[:300])
for r in ROOMS: print(r['wallColor'], r['walkToPavilion'], r['centerpiece']['suggestion'], '|', r['id'], r['cell'], r['count'], f"r={r['radius']}", r['label'], '| combines', r['combines'], '| doors', r['doorWalls'])
