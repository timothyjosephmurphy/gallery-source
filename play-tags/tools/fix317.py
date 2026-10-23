# #317/#318 (TJ): paintings that showed a white/cream margin inside the frame were hung from 1200x630 social-preview cards (img.tjm.art/social/*.jpg).
#  - 46 older-work pieces: use the product page's real display image (img.tjm.art/display/<name>-480|960.webp), real aspect, listed true size fitted inside (never stretched).
#  - 2 El Salvador book-art pieces (no display image exists): crop the card's margin off (tools/whitemargin317.json), size = the 15 in placeholder on the long side, real aspect.
# Writes the 'assets' entries into src/hang-overrides.json (idempotent: entries whose note starts '#317' are replaced).
import json, io, urllib.request
from PIL import Image
IN = 0.0254
R = json.load(open('tools/real317.json')); WM = json.load(open('tools/whitemargin317.json'))
M = {m['slug']: m for m in json.load(open('/workspace/gallery-courtyard/data/missing-paintings.json'))['paintings']}
O = json.load(open('src/hang-overrides.json')); O['assets'] = [a for a in O.get('assets', []) if not str(a.get('note', '')).startswith('#317')]
flags = []; n = 0
def get(u): return urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'tjm-gallery-build'}), timeout=60).read()
for slug, v in sorted(R.items()):
    if slug not in WM or max(WM[slug]['margin'].values()) < 0.004: continue  # only pieces that really have a baked margin (not the hummingbird, not the unhung provibes pair)
    m = M[slug]
    if 'url' in v:
        base = v['url'].rsplit('.', 1)[0].replace('https://img.tjm.art/', ''); px = v['w960'] if 'w960' in v else v['px']; asp = px[0] / px[1]
        s = m['size_in']; w, h = s['w'] * IN, s['h'] * IN
        w2, h2 = (h * asp, h) if w / h > asp else (w, w / asp); dev = abs((w / h) / asp - 1)
        note = '#317/#318: real display image (not the 1200x630 social card). Listed %.2fx%.2f in; image aspect %.3f, fitted inside at true size, never stretched%s' % (s['w'], s['h'], asp, ' (listed vs image aspect differs %.0f%%, listed size needs TJ confirmation)' % (dev * 100) if dev > 0.08 else '')
        if dev > 0.08: flags.append((slug, round(dev, 3), s))
        O['assets'].append(dict(id=slug, img='img/' + base + '-480.webp', hi='https://img.tjm.art/' + base + '-960.webp', w=round(w2, 4), h=round(h2, 4), note=note)); n += 1
    else:  # book-art: crop the social card margin
        mg = WM[slug]['margin']; im = Image.open(io.BytesIO(get(m['image_url']))).convert('RGB'); W_, H_ = im.size; inset = 3
        box = (round(mg['left'] * W_) + inset, round(mg['top'] * H_) + inset, W_ - round(mg['right'] * W_) - inset, H_ - round(mg['bottom'] * H_) - inset)
        c = im.crop(box); out = 'public/art/%s-317.webp' % slug; c.save(out, quality=88, method=6); asp = c.size[0] / c.size[1]
        long_ = 15.0 * IN; w, h = (long_, long_ / asp) if asp >= 1 else (long_ * asp, long_)
        O['assets'].append(dict(id=slug, img='art/%s-317.webp' % slug, hi=None, w=round(w, 4), h=round(h, 4), note='#317: card margin cropped off (%dx%d px of the 1200x630 social card; margins L/R/T/B %.3f/%.3f/%.3f/%.3f); no real image or size is published, so the 15 in placeholder on the long side is kept, real aspect %.3f' % (c.size[0], c.size[1], mg['left'], mg['right'], mg['top'], mg['bottom'], asp))); n += 1
RDp = 'tools/realdims.json'; RD = json.load(open(RDp)); z = dict(top=0.0, bottom=0.0, left=0.0, right=0.0)  # doorcheck compares frame aspect with these real pixel sizes
for a in O['assets']:
    if not a['note'].startswith('#317'): continue
    v = R[a['id']]
    if 'url' in v: RD[a['id']] = dict(px=v['w480'], border=z, hiPx=v['w960'], hiBorder=z)
    else: d = list(Image.open('public/' + a['img']).size); RD[a['id']] = dict(px=d, border=z, hiPx=d, hiBorder=z)
json.dump(RD, open(RDp, 'w'))
json.dump(O, open('src/hang-overrides.json', 'w'), indent=1)
print(n, 'assets; aspect flags:', len(flags)); json.dump(flags, open('tools/fix317-flags.json', 'w'), indent=0)
