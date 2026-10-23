#!/usr/bin/env python3
# #235: bake the real shop data the galleries need into src/shop.json (never invented):
#  - originals: the live checkout price, only when checkout lists the work as available
#  - prints (#270, TJ): the MEDIUM available print size (the middle of the shop's sizes, smallest to largest), framed with the shop's first frame choice, plus its unframed price
# Sources: https://tjm.art/catalog/products.json (print variants, sizes, frames) and /checkout/cart/catalog (live availability + prices).
import json, sys, urllib.request, glob, os
W = '/workspace'
get = lambda u: json.load(urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'tjm-gallery-build'}), timeout=60))
pj = get('https://tjm.art/catalog/products.json'); cap = get('https://tjm.art/checkout/cart/catalog')
live = {p['id']: p for p in cap['products'] if p.get('status') == 'available'}
ids = set()
for f in glob.glob(W + '/play-*/src/catalog.json') + [W + '/play-splat/src/picker-paintings.json']:
    d = json.load(open(f)); P = d['paintings'] if isinstance(d, dict) else d
    ids |= {p.get('slug') or p['id'] for p in P}
FRAME_ORDER = []  # the shop's order (PrintOptions.astro lists frames in catalog order)
for p in pj['prints']:
    k = p.get('frame', {}).get('name')
    if k and k not in FRAME_ORDER: FRAME_ORDER.append(k)
prints = {}
for p in pj['prints']:
    if p['id'] in live: prints.setdefault(p['productId'], []).append(p)
out, missing = {}, {'noPrice': [], 'noPrints': []}
inch = lambda d: [round(d['width'], 2), round(d['height'], 2)]
for pid in sorted(ids):
    e = {}
    if pid in live and live[pid].get('type') is None: e['p'] = live[pid]['amount']
    v = prints.get(pid, [])
    base = [x for x in v if not x.get('frame') and not x.get('mat')]
    if base:
        by = sorted(base, key=lambda x: x['paperSize']['width'] * x['paperSize']['height']); big = by[(len(by) - 1) // 2]  # medium size
        fr = sorted([x for x in v if x.get('frame') and x['id'].startswith(big['id'] + '-frame-')], key=lambda x: FRAME_ORDER.index(x['frame']['name']))
        if fr:
            f = fr[0]; size = big['title'].split(' — ')[-1]
            e['pr'] = {'id': f['id'], 'a': f['amount'], 'in': inch(f['frame']['size']), 'win': inch(f['mat']['window']), 'img': inch(f['imageSize']),
                       'frame': f['frame']['name'], 'color': f['frame'].get('color', '#262321'), 'size': size, 'base': big['id'], 'baseA': big['amount'], 'of': [x['title'].split(' — ')[-1] for x in by]}
    if not e.get('pr'): missing['noPrints'].append(pid)
    if e: out[pid] = e
json.dump({'v': cap['version'], 'shop': out}, open(W + '/gallery-core/src/shop.json', 'w'), separators=(',', ':'))
print(len(out), 'entries;', sum('pr' in e for e in out.values()), 'with prints;', sum('p' in e for e in out.values()), 'priced originals; frame order', FRAME_ORDER)
json.dump(missing, open('/tmp/shop235-missing.tmp.json', 'w'))
