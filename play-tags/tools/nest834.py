# #834 (TJ Oct 29 2026): park TJ Hummingbird Feeder 190 (room-09 wall 3, worse dup of bird-feeder). Parked via parked777 (records kept), #802 pattern. Idempotent; asserts 833/834.
import json
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (833,834), T['nest']
PK=T['parked777']; IDS=['older-work-hummingbird-feeder-190']; n=0
for i in IDS:
    for p in [p for p in c['paintings'] if p['id']==i]: c['paintings'].remove(p); p['parkedBy']='#834 TJ removed'; PK['paintings'].append(p); n+=1
    for q in [q for q in T['paintings'] if q['id']==i]: T['paintings'].remove(q); q['parkedBy']='#834 TJ removed'; PK['layoutPaintings'].append(q); n+=1
T['noLamp788']=[x for x in T.get('noLamp788',[]) if x not in IDS]
T['nest'].update(issue=834,prev=833,park834=IDS)
T['note834']='Parked older-work-hummingbird-feeder-190 (room-09 wall 3 bottom-right, worse dup) into parked777; keepers untouched, hole left'
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
H='src/hang-overrides.json'; O=json.load(open(H))
for g in (O if isinstance(O,list) else O.get('groups',[])):
    if isinstance(g,dict) and g.get('name')=='#354 Hummingbirds stack' and len(g['rows'])==2:
        g['rows']=g['rows'][:1]; g['y']=g['y'][:1]; g['note']+=' | #834 Feeder 190 parked'; n+=1
open(H,'w').write(json.dumps(O,ensure_ascii=False,indent=1)); print(834,n)
