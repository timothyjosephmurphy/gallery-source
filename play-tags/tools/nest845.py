# #845 TJ walk: Paul Murphy Annex plaque mosaic -> gold (illegible tesserae)
import json
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; N=T['nest']; assert N['issue'] in (844,845),N
E=[x for x in T['locSigns818'] if x.get('label')=='Paul Murphy Annex']; assert len(E)==1
E[0].pop('style',None)
N['note845']='TJ walk: Paul Murphy Annex plaque mosaic -> goldSignMesh (mosaic illegible); label unchanged'
N.update(issue=845,prev=844)
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
print(845,E[0])
