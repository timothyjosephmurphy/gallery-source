# #309 (TJ, preview): hang the missing paintings from /workspace/gallery-courtyard/data/missing-paintings.json (the 38 Paul Murphy pieces are held for #310).
# Real image aspect, never stretched: the picture is fitted inside its listed W x H (contain), flagged when the aspect differs by more than 8 %.
import json, os, io, re, urllib.request, collections
from PIL import Image
DATA = '/workspace/gallery-courtyard/data/missing-paintings.json'; CACHE = 'tools/img309.json'; IN = 0.0254
SKIP_SLUGS = {'cormorant-presiding-over-sunset-on-puget-sound'}  # already hung as the courtyard mural
GROUPS = [  # (group key regexp on slug, preferred rooms in order)
    (r'ammous|fernandez|figen|hayek-stark|portraits-319|rochard|yakes|legend-of-billy', ['room-07', 'room-10', 'room-11']),
    (r'forest-triptych|lake-hillside|mountain-layers|ridge-strips|shore-figures|pitchers|hummingbird-feeder', ['room-09', 'room-01', 'room-03']),
    (r'strawberry-point', ['room-03', 'room-01', 'room-09']),
    (r'archived-painting-43|book-art-67cc', ['room-04']),
    (r'book-art-a2e5|book-art-e329', ['room-08']),
    (r'provibes', ['room-02', 'room-07']),
]
def aspects(items):
    A = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    for m in items:
        u = m['image_url']
        if u in A: continue
        try: im = Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'tjm-gallery-build'}), timeout=60).read())); A[u] = [im.size[0], im.size[1]]
        except Exception as e: A[u] = None
    json.dump(A, open(CACHE, 'w')); return A
def build(c, LP, R, live):
    M = [m for m in json.load(open(DATA))['paintings'] if m['kind'] != 'paul-murphy' and m['slug'] not in SKIP_SLUGS]
    A = aspects(M); flags = []; out = []
    for m in M:
        if m['slug'] in R: continue
        s = m.get('size_in') or {}; wd, ht = s.get('w'), s.get('h'); asp = (A.get(m['image_url']) or [4, 3]); asp = asp[0] / asp[1]; note = None
        if not wd:  # unsized book-art piece: placeholder 15 in on the long side, real aspect
            long_ = 15.0; wd, ht = (long_, long_ / asp) if asp >= 1 else (long_ * asp, long_); note = 'PLACEHOLDER 15 in on the long side (no size listed)'
        w, h = wd * IN, ht * IN
        if w / h > asp: w2, h2 = h * asp, h  # image narrower than the listed box: keep height
        else: w2, h2 = w, w / asp
        dev = abs((w / h) / asp - 1)
        if dev > 0.08 and not note: note = 'listed %.2fx%.2f in, image aspect %.2f vs %.2f (%.0f%% off): fitted inside, not stretched' % (wd, ht, w / h, asp, dev * 100)
        w, h = round(w2, 4), round(h2, 4); lv = live.get(m['slug'], {})
        rec = dict(id=m['slug'], room=None, wall=None, x=0, y=1.219, z=0, ix=0, iz=0, w=w, h=h, iw=w, ih=h, fw=round(w + 0.06, 4), fh=round(h + 0.06, 4), photoShape=False, s=1, smax=1, title=m['title'], url=m['url'], status='available' if lv.get('status') == 'available' else 'nfs', price=None,
                   img='img/' + m['image_url'].split('img.tjm.art/')[1], hi=m['image_url'], plaqueAt=None, set=None, grid=None, stack=None, approxSize=note or False, medium=m.get('medium'), imported309=True)
        lp = dict(id=m['slug'], twins=[], title=m['title'], url=m['url'], tex=m['image_url'], tags=[], room=None, wall=None, s=0, x=0, z=0, y=1.219, ix=0, iz=0, w=w, h=h, fw=rec['fw'], fh=rec['fh'], approxSize=rec['approxSize'], smax=1, s_scale=1, plaque=None, affinityWall=None, set=None, setPos=None)
        c['paintings'].append(rec); c['layout']['tags']['paintings'].append(lp); R[rec['id']] = rec; LP[rec['id']] = lp; out.append(rec['id'])
        if note: flags.append((rec['id'], note))
    RDp = 'tools/realdims.json'; RD = json.load(open(RDp)); z = dict(top=0.0, bottom=0.0, left=0.0, right=0.0)
    for m in M:
        d = A.get(m['image_url'])
        if d: RD[m['slug']] = dict(px=d, border=z, hiPx=d, hiBorder=z)
    json.dump(RD, open(RDp, 'w'))
    return out, flags
def group_of(pid):
    for k, (rx, rooms) in enumerate(GROUPS):
        if re.search(rx, pid): return k, rooms
    return 99, []
