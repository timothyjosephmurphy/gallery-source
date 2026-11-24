# #785b (TJ): every archway out into an open-air court = near-full width (7.75 m); no hangs on those door walls (parked).
import json
CAT='src/catalog.json'; c=json.load(open(CAT)); T=c['layout']['tags']; assert T['nest']['issue']==785
R={r['id']:r for r in T['rooms']}; PK=T['parked777']; DW=7.75; rep={}
for oc in T['openCourts']:
    d=oc['door']; H=R[d['room']]; k=d['k']; H['doorWidths'][str(k)]=DW; H['doorOffsets'][str(k)]=0.0; d['width']=DW
    P=[p for p in c['paintings'] if p['room']==d['room'] and p['wall']==k]; ids={p['id'] for p in P}
    for p in P: p['parkedBy']='#785 door wall %s k%d widened to full-width arch into %s'%(d['room'],k,oc['id'])
    c['paintings']=[p for p in c['paintings'] if p['id'] not in ids]; PK['paintings']+=P
    L=[p for p in T['paintings'] if p['id'] in ids]; T['paintings']=[p for p in T['paintings'] if p['id'] not in ids]; PK['layoutPaintings']+=L
    rep[oc['id']]=dict(door='%s k%d'%(d['room'],k),parked=sorted(ids))
PK['note']+='; #785: door-wall works parked (full-width court arches)'
T['nest']['courtDoors785']=rep
open(CAT,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(json.dumps(rep,indent=0))
