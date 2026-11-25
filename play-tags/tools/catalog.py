# #251: layout.json (v4, the source of truth) -> src/catalog.json in the gallery-core shape. Paintings keep their listed true
# size as the frame; the image is fitted inside it at its own aspect (never stretched). Mismatches go to mismatch.json.
import json, os, re
T = '/workspace/tag-gallery'; L = json.load(open(T + '/data/layout.json')); D = json.load(open(T + '/data/imgdims.json'))
U = {p['id']: p for p in json.load(open('/workspace/play-uffizi/src/catalog.json'))['paintings']}
ART = set(f[:-5] for f in os.listdir('/workspace/play-uffizi/public/art'))
def local(u):
    for a, b in (('https://media.vermillionaurora.com/', 'mva/'), ('https://tjm.art/', 'tjm/'), ('https://img.tjm.art/', 'img/')):
        if u.startswith(a): return b + u[len(a):]
    return u
P, mism = [], []
PHOTO = set(re.findall(r'^- (\S+)', open('/workspace/refinement/captions/excluded-52.txt').read(), re.M)) | {'archived-painting-15'}  # TJ 1:01 PM: trust the photo's shape
RD = json.load(open('tools/realdims.json')) if os.path.exists('tools/realdims.json') else {}  # served image px (tools/realdims.py)
for p in L['paintings']:
    r = RD.get(p['id'], {}); d = r.get('hiPx') or r.get('px') or D.get(p['tex']); W, H = p['w'], p['h']; w, h = W, H  # the image seen up close decides the shape
    fw, fh = p['fw'], p['fh']
    if d:  # #269 (TJ): photo-shape rule for EVERY work: caption's longer side is the true size, the other side from the
        # served image's aspect; the frame hugs the image exactly (no padding, no stretch, no crop)
        a = d[0] / d[1]
        if abs((W / H) / a - 1) > 0.01:
            mism.append({'id': p['id'], 'title': p['title'], 'listed_m': [round(W, 3), round(H, 3)], 'image_px': d[:2],
                         'hung_m': None, 'photoShapeList': p['id'] in PHOTO})
        Lg = max(W, H); w, h = (Lg, Lg / a) if a >= 1 else (Lg * a, Lg)
        if mism and mism[-1]['id'] == p['id']: mism[-1]['hung_m'] = [round(w, 3), round(h, 3)]
        W, H = w, h; fw, fh = w + p['fw'] - p['w'], h + p['fh'] - p['h']
    u = U.get(p['id'], {})
    P.append({'id': p['id'], 'room': p['room'], 'wall': p['wall'], 'x': p['x'], 'y': p['y'], 'z': p['z'], 'ix': p['ix'], 'iz': p['iz'],
              'w': w, 'h': h, 'iw': W, 'ih': H, 'fw': fw, 'fh': fh, 'photoShape': p['id'] in PHOTO, 's': 1, 'smax': 1, 'title': p['title'], 'url': p['url'],
              'status': u.get('status', 'nfs'), 'price': None, 'img': f"art/{p['id']}.webp" if p['id'] in ART else local(p['tex']),
              'hi': u.get('hi') if p['id'] in ART else None, 'plaqueAt': p.get('plaque'), 'set': p.get('set'), 'grid': p.get('grid'), 'stack': p.get('stack'), 'approxSize': p.get('approxSize', False)})
# re-space a wall row where a photo-shaped work grew: 1-D push apart in wall order (paintings and their plaques)
import math, collections
rows = collections.defaultdict(list)  # #284: a salon stack (its paintings + flanking plaques) moves as one block
blk = {}
for n, (q, p) in enumerate(zip(P, L['paintings'])):
    if q['grid'] or p.get('s') is None: continue
    key = (q['room'], q['wall']); col = (p.get('stack') or {}).get('col') or f'single-{n}'
    if (key, col) not in blk: blk[(key, col)] = ['b', 0, 0, []]; rows[key].append(blk[(key, col)])
    m = blk[(key, col)][3]; m.append(('p', p['s'], q['fw'], q))
    if q['plaqueAt'] and not q['plaqueAt'].get('shared'): m.append(('l', q['plaqueAt']['s'], q['plaqueAt']['w'], q))
for E in rows.values():
    for e in E:
        lo = min(s - w / 2 for _, s, w, _ in e[3]); hi = max(s + w / 2 for _, s, w, _ in e[3]); e[1], e[2] = (lo + hi) / 2, hi - lo
moved = 0
RAD = {r['id']: r['radius'] for r in L['rooms']}
for (rid, k), E in rows.items():
    E.sort(key=lambda e: e[1]); s0 = [e[1] for e in E]; G = 0.1
    for _ in range(50):
        for i in range(1, len(E)):
            need = E[i - 1][1] + (E[i - 1][2] + E[i][2]) / 2 + G - E[i][1]
            if need > 0: E[i - 1][1] -= need / 2; E[i][1] += need / 2
    # #269: keep the row clear of the hex corners (dome columns stand there): shift it back inside the wall
    R = RAD.get(rid)
    if R:
        lim = R / 2 - 0.6; lo = min(e[1] - e[2] / 2 for e in E); hi = max(e[1] + e[2] / 2 for e in E)
        sh = (-lim - lo) if lo < -lim else (lim - hi) if hi > lim else 0
        if lo < -lim and hi + sh > lim: sh = -(lo + hi) / 2
        for e in E: e[1] += sh
    th = math.radians(60 * k); t = (-math.sin(th), math.cos(th))
    for e, a in zip(E, s0):
        d = e[1] - a
        for kind, ms, _, q in e[3]:
            if kind == 'p': q['x'] += d * t[0]; q['z'] += d * t[1]
            else: q['plaqueAt'] = {**q['plaqueAt'], 's': ms + d, 'x': q['plaqueAt']['x'] + d * t[0], 'z': q['plaqueAt']['z'] + d * t[1]}
    moved += 1
print('re-spaced walls', moved)
lay = {'hall': {'height': 4.2, 'doorHeight': 3.5}, 'rooms': [], 'hallways': [], 'signs': [], 'groupSigns': [],
       'start': {'x': 0.5, 'z': -28.2, 'yaw': -0.8},  # #803 #351: START courtyard facing the gallery wall map  # #351 refine: maps gathering view  # #351 (TJ Oct 26): far side of the courtyard facing the wall map (#291); the checkout is behind you  # #278: beside the central checkout pillar, facing its portal  # off the hologram dais, facing the checkout facing the checkout across the core,
       'nave': {'minX': -48, 'maxX': 30, 'minZ': -30, 'maxZ': 42}, 'corr': [], 'tags': L}
out = json.dumps({'layout': lay, 'paintings': P, 'plaques': []}, ensure_ascii=False)
_forbid = ''.join(chr(c) for c in (68, 77, 84)); assert not re.search(r'\b' + re.escape(_forbid) + r'\b', out)
open('src/catalog.json', 'w').write(out); json.dump(mism, open('mismatch.json', 'w'), indent=1, ensure_ascii=False)
print(len(P), 'paintings', len(mism), 'size/aspect mismatches')
import subprocess, os; os.path.exists("src/catalog.base.json") and os.remove("src/catalog.base.json"); subprocess.run(['python3', 'tools/apply-overrides.py'], check=True)  # #288 overrides
