# #838 (#788 TJ Oct 29): Paul Murphy fountain court: hang wall + iron811 fence REMOVED, half fountain back at hex centre, 3 outer-edge booths
# (one 3.05 m booth per low834 edge, works on racks at TRUE size 13/13/12); room-11 wall 0 portrait-with-hat sized to Rainier reference width. Idempotent.
import json, math
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (837,838), T['nest']
oc=[o for o in T['openCourts'] if o['id']=='courtyard-fountain-sw'][0]
oc['walls']=[w for w in oc['walls'] if w['id']!='courtyard-fountain-sw-hang-wall']
oc['fences']=[f for f in oc.get('fences',[]) if not f.get('iron811')]
oc['ist811']['vistaLine']=dict(x0=-28.962,z0=-7.194,x1=-20.712,z1=-21.484,nx=0.866,nz=0.5)
HC=[-24.75,-14.289]; oc['fountain']=dict(at=HC,r=0.675,vscale=0.5); oc.pop('fountainRemoved834',None)
edges=[w for w in oc['walls'] if 'low834' in w['id']]; assert len(edges)==3
PP=[p for p in c['paintings'] if p['id'].startswith('paul-murphy-painting')]; PP.sort(key=lambda p:int(p['id'].split('-')[-1])); assert len(PP)==38
LP={l['id']:l for l in T['paintings'] if l['id'] in {p['id'] for p in PP}}
BW=3.05; BACK=0.30; OFF=0.06; GAP=0.1; FRONT=BACK+BW; ROWY=[1.62,1.12]; chunks=[PP[0:13],PP[13:26],PP[26:]]; booths=[]
for bi,(w,ws) in enumerate(zip(edges,chunks)):
    O=(w['x0'],w['z0']); L=math.hypot(w['x1']-O[0],w['z1']-O[1]); t=((w['x1']-O[0])/L,(w['z1']-O[1])/L); n=(w['nx'],w['nz'])
    P=lambda s,d:(round(O[0]+t[0]*s+n[0]*d,3),round(O[1]+t[1]*s+n[1]*d,3)); sc=L/2
    for p in ws:
        m=round(p['fw']-p['w'],4); p.update(w=p['trueW'],h=p['trueH'],iw=p['trueW'],ih=p['trueH'],fw=round(p['trueW']+m,4),fh=round(p['trueH']+m,4),artScale=1)
    rows=[('back',ROWY[0],sc-1.25,sc+1.25),('back',ROWY[1],sc-1.25,sc+1.25),('left',1.4,BACK+0.75,FRONT-0.25),('right',1.4,BACK+0.75,FRONT-0.25)]
    fill=[[] for _ in rows]; i=0
    for p in ws:
        while sum(q['fw'] for q in fill[i])+GAP*len(fill[i])+p['fw']>rows[i][3]-rows[i][2]: i+=1
        fill[i].append(p)
    for (side,y,u0,u1),row in zip(rows,fill):
        tot=sum(q['fw'] for q in row)+GAP*(len(row)-1); u=(u0+u1)/2-tot/2
        for p in row:
            uc=u+p['fw']/2; u+=p['fw']+GAP
            if side=='back': (x,z),f=P(uc,BACK+OFF),n
            elif side=='left': (x,z),f=P(sc-BW/2+OFF,uc),t
            else: (x,z),f=P(sc+BW/2-OFF,uc),(-t[0],-t[1])
            p.update(x=x,z=z,y=y,cy=y,ix=round(f[0],3),iz=round(f[1],3),s=round(uc,3),wall=bi,booth798=bi+1,rack798=side,freestanding=True)
            for k in ('hang808','hang817'): p.pop(k,None)
            LP[p['id']].update(x=x,z=z,y=y,ix=round(f[0],3),iz=round(f[1],3),s=round(uc,3),wall=bi,w=p['w'],h=p['h'],fw=p['fw'],fh=p['fh'],booth798=bi+1,rack798=side,freestanding=True)
            assert p['w']<=p['trueW']+1e-6
    racks=[dict(side='back',a=P(sc-BW/2,BACK),b=P(sc+BW/2,BACK),face=n),dict(side='left',a=P(sc-BW/2,BACK),b=P(sc-BW/2,FRONT),face=t),dict(side='right',a=P(sc+BW/2,BACK),b=P(sc+BW/2,FRONT),face=(-t[0],-t[1]))]
    booths.append(dict(n=bi+1,edge=w['id'],centre=P(sc,BACK+BW/2),back=[P(sc-BW/2,BACK),P(sc+BW/2,BACK)],front=[P(sc-BW/2,FRONT),P(sc+BW/2,FRONT)],face=[round(n[0],3),round(n[1],3)],size=BW,racks=racks,works=[p['id'] for p in ws],awning=None))
oc['booths798']=booths
oc['note']+=' | #838 TJ: hang wall + iron fence removed, half fountain at hex centre, 3 outer-edge booths (38 Paul works true size on racks)'
# B) room-11 wall 0: portrait-with-hat to Rainier reference width, even reflow
R=[p for p in c['paintings'] if p.get('room')=='room-11' and p.get('wall')==0]; ref=[p for p in R if p['id']=='sunrise-on-rainier-from-denny-blaine'][0]
ph=[p for p in R if p['id']=='painting-portrait-with-hat'][0]; m=round(ph['fw']-ph['w'],4); ph.update(w=ref['w'],h=0.7658,iw=ref['w'],ih=0.7658,fw=round(ref['w']+m,4),fh=round(0.7658+m,4))
A=(4.125,-7.144); B=(8.25,-14.289); WL=8.25; tt=((B[0]-A[0])/WL,(B[1]-A[1])/WL)
order=sorted(R,key=lambda p:math.hypot(p['x']-A[0],p['z']-A[1])); assert [p['id'] for p in order]==['book-art-deb3358c321671dae1fc','sunrise-on-rainier-from-denny-blaine','painting-portrait-with-hat']
eag=[a for oc2 in T['outerCourts'] for a in oc2.get('art',[]) if a.get('id')=='eagle-brass-plaque'][0]
PL=[order[0]['plaqueAt']['w'],order[1]['plaqueAt']['w'],eag['w']]; PG=0.08
tot=sum(p['fw'] for p in order)+sum(PL)+3*PG; g=(WL-tot)/4; assert g>0.15, g; u=g
LT={l['id']:l for l in T['paintings']}; at=lambda uc:(round(A[0]+tt[0]*uc,3),round(A[1]+tt[1]*uc,3))
for p,pw in zip(order,PL):
    pc=u+pw/2; u+=pw+PG; uc=u+p['fw']/2; u+=p['fw']+g; x,z=at(uc); p.update(x=x,z=z)
    LT[p['id']].update(x=x,z=z,w=p['w'],h=p['h'],fw=p['fw'],fh=p['fh']); px,pz=at(pc)
    if p.get('plaqueAt'): p['plaqueAt'].update(x=px,z=pz,s=round(WL/2-pc,3))
    else: eag.update(x=px,z=pz)
T['nest'].update(issue=838,prev=837)
T['note838']='#788: Paul fountain court hang wall + iron fence removed, half fountain centred, 3 outer booths true size; room-11 w0 portrait-with-hat w 2.7432 (Rainier ref width)'
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
H='src/hang-overrides.json'; h=json.load(open(H))
def walk(o):
    if isinstance(o,dict):
        if o.get('id')=='painting-portrait-with-hat':
            if 'w' in o and 'wall' not in o: o.update(w=2.7432,h=0.7658,note='#838 (#788 TJ): width matches Sunrise on Rainier reference (2.7432 m), aspect kept')
            if 'wall' in o: o.update(wall='room-11/0',note='#838 (#788 TJ): room-11 wall 0 beside Sunrise on Rainier, same width')
        for v in o.values(): walk(v)
    elif isinstance(o,list): [walk(v) for v in o]
walk(h); open(H,'w').write(json.dumps(h,indent=1,ensure_ascii=False))
print(838,[(b['n'],len(b['works'])) for b in booths],[(p['id'],p['x'],p['z'],p['fw']) for p in order])
