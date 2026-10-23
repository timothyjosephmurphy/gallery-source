# Dominant palette per painting (k-means-ish via PIL quantize on a 64px thumbnail) -> data/palette.json
import json, io, urllib.request, concurrent.futures as cf, os
from PIL import Image
W = json.load(open('data/works.json'))['works']; out = json.load(open('data/palette.json')) if os.path.exists('data/palette.json') else {}
def pal(w):
    if w['id'] in out: return out[w['id']]
    im = Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(w['tex'], headers={'User-Agent': 'Mozilla/5.0'}), timeout=60).read())).convert('RGB')
    im.thumbnail((64, 64)); q = im.quantize(5, method=Image.Quantize.MEDIANCUT); p = q.getpalette()[:15]; cnt = sorted(q.getcolors(), reverse=True)
    return [[p[i * 3], p[i * 3 + 1], p[i * 3 + 2], n] for n, i in cnt]
with cf.ThreadPoolExecutor(12) as ex:
    for w, r in zip(W, ex.map(pal, W)): out[w['id']] = r
json.dump(out, open('data/palette.json', 'w')); print(len(out))
