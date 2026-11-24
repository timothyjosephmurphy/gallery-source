# #837 (#338 expand): add archived-painting-img-1555 max (from print master, #317 border trim, 0.8% aspect, no stretch); set max/maxW/maxH only for hung ids in hires-338.json. Idempotent.
import json
H='/workspace/gallery-hires-338/hires-338.json'; h=json.load(open(H))
h['archived-painting-img-1555']={'max':'https://img.tjm.art/gallery-hi/archived-painting-img-1555-2400.webp','maxW':2400,'maxH':1888}
open(H,'w').write(json.dumps(h,indent=1))
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (836,837)
before={p['id']:(p.get('w'),p.get('h'),p.get('img')) for p in c['paintings']}; n=0
for p in c['paintings']:
    if p['id'] in h and not p.get('max'): p.update(h[p['id']]); n+=1
assert before=={p['id']:(p.get('w'),p.get('h'),p.get('img')) for p in c['paintings']}
T['nest'].update(issue=837,prev=836)
T['note837']='#338 expand: max tier (<2.8 m, desktop/tablet) now on %d paintings; +archived-painting-img-1555 from real print master (white edge trim, 2400x1888). 301 aspect skip (-4%%, no stretch), rest need real rescans. AI-sharpen not shipped.'%sum(1 for p in c['paintings'] if p.get('max'))
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print('added',n,'total',sum(1 for p in c['paintings'] if p.get('max')))
