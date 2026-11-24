# #844 TJ walk: outdoor loc signs back to gold entrance lettering (mosaic824 retired for loc)
import json
J='src/signs818.js'; s=open(J).read()
a="const m = mosaicSignMesh(s.label, 3.6, 0.45);"
if a in s: s=s.replace(a,"const m = goldSignMesh(s.label, 3.6, 0.45); /* gold844 */"); open(J,'w').write(s)
assert 'goldSignMesh)(s.label, 3.6, 0.45)' in s or 'goldSignMesh(s.label, 3.6, 0.45)' in s
F='src/catalog.json'; c=json.load(open(F)); N=c['layout']['tags']['nest']; assert N['issue'] in (843,844),N
N['note844']='TJ walk: outdoor loc signs back to gold entrance lettering (Warsaw etc readable; mosaic824 retired for loc)'
N.update(issue=844,prev=843)
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
print(844)
# annex844: parent-requested mosaic plaque "Paul Murphy Annex" on courtyard-fountain-sw room-face arch
s=open(J).read()
a="const m = goldSignMesh(s.label, 3.6, 0.45); /* gold844 */"
if a in s: s=s.replace(a,"const m = (s.style === 'mosaic' ? mosaicSignMesh : goldSignMesh)(s.label, 3.6, 0.45); /* gold844 loc; mosaic only for annex844 */"); open(J,'w').write(s)
c=json.load(open(F)); L=c['layout']['tags']['locSigns818']
if not any(x.get('label')=='Paul Murphy Annex' for x in L): L.append({'court':'courtyard-fountain-sw','at':'room','label':'Paul Murphy Annex','style':'mosaic'})
N=c['layout']['tags']['nest']
if 'annex844' not in N['note844']: N['note844']+='; annex844: Paul Murphy Annex mosaic plaque on courtyard-fountain-sw room-face arch'
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
