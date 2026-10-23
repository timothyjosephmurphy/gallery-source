# #269: real pixel size of every served image (the runtime texture), plus a scan for black borders baked into the file.
import json, os, io, urllib.request, concurrent.futures as cf
from PIL import Image
P = json.load(open('src/catalog.json'))['paintings']
BASE = {'mva/': 'https://media.vermillionaurora.com/', 'tjm/': 'https://tjm.art/', 'img/': 'https://img.tjm.art/'}
def load(p, s=None):
    s = s or p['img']
    if s.startswith('https://'):
        f = '/tmp/remimg/' + s.split('//', 1)[1].replace('/', '_')
        if not os.path.exists(f): open(f, 'wb').write(urllib.request.urlopen(urllib.request.Request(s, headers={'User-Agent': 'tjm-audit'}), timeout=60).read())
        return Image.open(f)
    if s.startswith('art/'): return Image.open('public/' + s)
    for a, b in BASE.items():
        if s.startswith(a):
            f = '/tmp/remimg/' + s.replace('/', '_')
            if not os.path.exists(f): open(f, 'wb').write(urllib.request.urlopen(urllib.request.Request(b + s[len(a):], headers={'User-Agent': 'tjm-audit'}), timeout=60).read())
            return Image.open(f)
def border(im):  # fraction of each edge band (rows/cols) that is near-black, scanning inward
    g = im.convert('L'); g.thumbnail((400, 400)); w, h = g.size; px = g.load()
    def dark(line): return sum(1 for v in line if v < 18) / len(line) > 0.97
    out = {}
    for side in ('top', 'bottom', 'left', 'right'):
        n = 0; N = h if side in ('top', 'bottom') else w
        while n < N // 3:
            i = n if side in ('top', 'left') else N - 1 - n
            line = [px[x, i] for x in range(w)] if side in ('top', 'bottom') else [px[i, y] for y in range(h)]
            if not dark(line): break
            n += 1
        out[side] = round(n / N, 3)
    return out
def one(p):
    try:
        im = load(p); r = {'px': list(im.size), 'border': border(im)}
        if p.get('hi'): h = load(p, p['hi']); r['hiPx'] = list(h.size); r['hiBorder'] = border(h)
        return p['id'], r
    except Exception as e: return p['id'], {'err': str(e)[:120]}
R = dict(cf.ThreadPoolExecutor(12).map(one, P))
json.dump(R, open('tools/realdims.json', 'w'), indent=0)
print(len(R), 'errors', [k for k, v in R.items() if 'err' in v])
