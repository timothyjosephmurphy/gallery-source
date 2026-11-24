# #841 (#788 TJ Oct 29 ~8:33 PM PT): awnings OFF the low834 parapets, ON the hex building courtyard faces (room-09 k4, room-04 k2),
# building-mounted cantilever (no posts). All 38 Paul works rehung TRUE size, one eye-level row (cy 1.55) on those two faces under the awnings.
# low834 parapets stay (empty). Soft holds untouched. Idempotent; asserts 840/841.
import json, math, re
F='src/catalog.json'; M='src/fountainIstanbul811.js'
c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (840,841), T['nest']
oc=[o for o in T['openCourts'] if o['id']=='courtyard-fountain-sw'][0]; C=oc['ist811']
C['awnings']=[{'room':r,'k':k,'u':0,'w':7.8,'d':1.5,'y':3.6,'drop':0.5} for r,k in (('room-09',4),('room-04',2))]
# hex faces: midpoint, tangent (x0->x1), outward normal into court
F2={'room-09':((-28.875,-7.144),(-20.625,-7.144),(0.0,-1.0)),'room-04':((-16.50,-14.289),(-20.625,-21.434),(-0.8660254,0.5))}
CY=1.55; OFF=0.08+0.03
cp={p['id']:p for p in c['paintings'] if p['id'].startswith('paul-murphy-painting-')}
tp={p['id']:p for p in T['paintings'] if p['id'].startswith('paul-murphy-painting-')}
assert len(cp)==38 and len(tp)==38
ids=sorted(cp,key=lambda i:int(i.rsplit('-',1)[1]))
# split by width ~ half
tot=sum(cp[i]['trueW'] for i in ids); acc=0; cut=0
for n,i in enumerate(ids):
    acc+=cp[i]['trueW']
    if acc>=tot/2: cut=n+1 if abs(acc-tot/2)<abs(acc-cp[i]['trueW']-tot/2) else n; break
groups={'room-09':ids[:cut],'room-04':ids[cut:]}; counts={}
for wi,(room,g) in enumerate(groups.items()):
    (x0,z0),(x1,z1),(nx,nz)=F2[room]; L=math.hypot(x1-x0,z1-z0); tx,tz=(x1-x0)/L,(z1-z0)/L; mx,mz=(x0+x1)/2,(z0+z1)/2
    ws=[cp[i]['trueW']+0.03 for i in g]; span=7.6; gap=(span-sum(ws))/(len(g)-1); assert gap>0.08, gap
    s=-span/2
    for i,w in zip(g,ws):
        sc=s+w/2; s+=w+gap; x=round(mx+tx*sc+nx*OFF,3); z=round(mz+tz*sc+nz*OFF,3)
        for P in (cp[i],tp[i]):
            P.update(room='courtyard-fountain-sw',wall=wi,x=x,z=z,y=CY,ix=nx,iz=nz,s=round(sc,3),w=cp[i]['trueW'],h=cp[i]['trueH'],fw=round(cp[i]['trueW']+0.03,4),fh=round(cp[i]['trueH']+0.03,4),hex841='%s-k%d'%(room,(4 if room=='room-09' else 2)))
            P.pop('low839',None)
            if 'cy' in P or P is cp[i]: P['cy']=CY
            if 'artScale' in P: P['artScale']=1
            if 's_scale' in P: P['s_scale']=1
    counts[room]=len(g)
assert all(cp[i]['w']==cp[i]['trueW'] and cp[i]['h']==cp[i]['trueH'] for i in ids)
oc['note']=oc['note'].split(' | #841')[0]+' | #841 TJ: awnings + 38 Paul hangs on hex courtyard faces room-09 k4 / room-04 k2; low834 parapets empty'
T['nest'].update(issue=841,prev=840); T['note841']='#788: awnings moved off low834 onto hex building faces room-09 k4 + room-04 k2 (no posts, y 3.6); Paul 38 true size one row cy 1.55 (%s)'%counts
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
s=open(M).read()
if 'awn841' not in s:
    a="const aw = A.wall && oc.walls.find(q => q.id === A.wall); /* awn840 wall-local mount */"
    assert a in s
    s=s.replace(a,"const aw = (A.wall && oc.walls.find(q => q.id === A.wall)) || (A.room && W.walls.find(q => q.room === A.room && q.k === A.k)); /* awn840 wall-local mount; awn841 hex room face */")
    b="+ aw.nx * 0.06, 0, (aw.z0 + aw.z1) / 2 + (aw.z1 - aw.z0) / WL * A.u + aw.nz * 0.06)"
    assert b in s
    s=s.replace(b,"+ aw.nx * (A.room ? 0.1 : 0.06), 0, (aw.z0 + aw.z1) / 2 + (aw.z1 - aw.z0) / WL * A.u + aw.nz * (A.room ? 0.1 : 0.06))")
    open(M,'w').write(s)
print(841, counts, C['awnings'])
