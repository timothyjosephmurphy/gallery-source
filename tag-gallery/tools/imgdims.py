# Choose a web-sized texture URL per work and record its pixel size (cached in data/imgdims.json).
import json, io, urllib.request, concurrent.futures as cf, os
from PIL import Image
D = json.load(open('data/works.json')); cache = json.load(open('data/imgdims.json')) if os.path.exists('data/imgdims.json') else {}
def absu(u): return u if u.startswith('http') else ('https://img.tjm.art' + u if u.startswith('/display/') else 'https://tjm.art' + u)
def pick(w):
    c = [w['hi'], w['img']]; d = [u for u in c if '/display/' in u]
    if d: return absu(d[0])
    wb = [u for u in c if u.endswith('.webp')]
    return absu(wb[0] if wb else w['img'])
def dims(u):
    if u in cache: return cache[u]
    r = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60).read()
    im = Image.open(io.BytesIO(r)); cache[u] = [im.width, im.height, len(r)]; return cache[u]
ws = D['works']
with cf.ThreadPoolExecutor(12) as ex:
    for w, r in zip(ws, ex.map(lambda w: dims(pick(w)), ws)): w['tex'] = pick(w); w['texW'], w['texH'], w['texBytes'] = r
json.dump(cache, open('data/imgdims.json', 'w')); json.dump(D, open('data/works.json', 'w'), indent=1)
big = [w['id'] for w in ws if w['texBytes'] > 1.5e6]; print('done', len(ws), 'big textures', len(big), big[:5])
