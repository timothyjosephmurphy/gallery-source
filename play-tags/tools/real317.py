# #317/#318: the older-work and two book-art pieces were hung from social-preview cards (1200x630 white cards with a small painting inside).
# Find each product page's real display image (img.tjm.art/display/...) and record it, with its pixel size and aspect, in tools/real317.json.
import json, re, io, urllib.request, concurrent.futures as cf
from PIL import Image
M = [m for m in json.load(open('/workspace/gallery-courtyard/data/missing-paintings.json'))['paintings'] if m['kind'] == 'older-work' or m['slug'] in ('book-art-a2e53a8418a8d84f3dc5', 'book-art-e3293c73dbb01f94b39b')]
def get(u): return urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'tjm-gallery-build'}), timeout=60).read()
def one(m):
    s = m['slug']; mm = re.match(r'older-work-(.*)-original-(\d+)$', s)
    try:
        html = get(m['url']).decode('utf8', 'ignore'); urls = sorted(set(re.findall(r'https://img\.tjm\.art/display/[^"\'\s<>]+\.(?:jpg|webp)', html)))
        pick = [u for u in urls if mm and re.search(r'/older-work-%s-%s[-.]' % (re.escape(mm.group(1)), mm.group(2)), u)] or (urls if not mm else [])
        if not pick: return s, {'err': 'no display image', 'urls': urls[:6]}
        u = pick[0]; im = Image.open(io.BytesIO(get(u))); return s, {'url': u, 'px': list(im.size), 'all': urls[:8]}
    except Exception as e: return s, {'err': str(e)[:100]}
R = dict(cf.ThreadPoolExecutor(8).map(one, M)); json.dump(R, open('tools/real317.json', 'w'), indent=0)
print(len(R), 'errors', {k: v for k, v in R.items() if 'err' in v})
