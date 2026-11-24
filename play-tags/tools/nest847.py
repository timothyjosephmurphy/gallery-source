# #847: max tier from real display masters (>=1600px, <=2400 long side, aspect within 3%, no upscale); Forest-3 from #846 30px-cropped master. Idempotent.
import json
h=json.load(open('/workspace/gallery-hires-338/hires-338.json'))
F='src/catalog.json'; c=json.load(open(F)); N=c['layout']['tags']['nest']; assert N['issue'] in (846,847)
before={p['id']:(p.get('w'),p.get('h'),p.get('img')) for p in c['paintings']}; n=0
for p in c['paintings']:
    if p['id'] in h and not p.get('max'): p.update(h[p['id']]); n+=1
assert before=={p['id']:(p.get('w'),p.get('h'),p.get('img')) for p in c['paintings']}
t=sum(1 for p in c['paintings'] if p.get('max'))
N.update(issue=847,prev=846)
if n or 'note847' not in N: N['note847']=f'#338 expand: +{n} max tier (<=2400, CDN gallery-hi) from real display masters; total max {t}. Forest-3 from #846 cropped master. Size/aspect skips left as-is.'
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print('added',n,'total',t)
