# #802 (TJ Oct 27 2026): park color wheel 184 (H9 k4) + 13th ridge strip Study G (H12 k0). Parked via parked777 (records kept). Idempotent; asserts 801/802.
import json
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (801,802), T['nest']
PK=T['parked777']; IDS=['older-work-lake-hillside-color-wheel-original-3','older-work-ridge-strips-unindexed-original-7']; n=0
for i in IDS:
    for p in [p for p in c['paintings'] if p['id']==i]: c['paintings'].remove(p); p['parkedBy']='#802 TJ removed'; PK['paintings'].append(p); n+=1
    for q in [q for q in T['paintings'] if q['id']==i]: T['paintings'].remove(q); q['parkedBy']='#802 TJ removed'; PK['layoutPaintings'].append(q); n+=1
T['noLamp788']=[x for x in T.get('noLamp788',[]) if x not in IDS]
T['nest'].update(issue=802,prev=801,park802=IDS)
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(802,n)
