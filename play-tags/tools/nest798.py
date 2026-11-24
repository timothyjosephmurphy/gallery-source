# #798 (TJ Oct 27 2026): Paul Murphy annex (courtyard-paul) -> art-festival market: 3 booths ~10x10 ft (3.05 m) against the outer wall,
# wire racks (back + 2 sides), Paul Murphy works moved off the long outer-wall rows onto the racks at true size, order kept. Idempotent; asserts 797/798.
import json, math
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (797,798), T['nest']
oc=[o for o in T['openCourts'] if o['id']=='courtyard-paul'][0]
O=oc['poly'][3]; E2=oc['poly'][2]; L=math.hypot(E2[0]-O[0],E2[1]-O[1]); t=((E2[0]-O[0])/L,(E2[1]-O[1])/L); n=(oc['walls'][0]['nx'],oc['walls'][0]['nz'])
P=lambda s,d:(round(O[0]+t[0]*s+n[0]*d,3),round(O[1]+t[1]*s+n[1]*d,3))
BW=3.05; BACK=0.30; OFF=0.06; GAP=0.1; FRONT=BACK+BW; mid=L/2; centres=[mid-4.55,mid,mid+4.55]
PP=[p for p in c['paintings'] if p['id'].startswith('paul-murphy-painting')]; PP.sort(key=lambda p:int(p['id'].split('-')[-1])); assert len(PP)==38
LP={l['id']:l for l in T['paintings'] if l['id'] in {p['id'] for p in PP}}
chunks=[PP[0:13],PP[13:26],PP[26:]]; booths=[]; ROWY=[1.62,1.12]
for bi,(sc,ws) in enumerate(zip(centres,chunks)):
    racks=[dict(side='back',a=P(sc-BW/2,BACK),b=P(sc+BW/2,BACK),face=n),
           dict(side='left',a=P(sc-BW/2,BACK),b=P(sc-BW/2,FRONT),face=t),
           dict(side='right',a=P(sc+BW/2,BACK),b=P(sc+BW/2,FRONT),face=(-t[0],-t[1]))]
    # rows: (rack, y, u-range along rack) ; back u = s offset, sides u = depth
    rows=[('back',ROWY[0],sc-1.25,sc+1.25),('back',ROWY[1],sc-1.25,sc+1.25),('left',1.4,BACK+0.75,FRONT-0.25),('right',1.4,BACK+0.75,FRONT-0.25)]
    fill=[[] for _ in rows]; i=0
    for p in ws:
        while sum(q['fw'] for q in fill[i])+GAP*len(fill[i])+p['fw']>rows[i][3]-rows[i][2]: i+=1
        fill[i].append(p)
    for (side,y,u0,u1),row in zip(rows,fill):
        if not row: continue
        tot=sum(q['fw'] for q in row)+GAP*(len(row)-1); u=(u0+u1)/2-tot/2
        for p in row:
            uc=u+p['fw']/2; u+=p['fw']+GAP
            if side=='back': x,z=P(uc,BACK+OFF); f=n
            elif side=='left': x,z=P(sc-BW/2+OFF*1,uc); x,z=round(x+t[0]*0,3),z; f=t
            else: x,z=P(sc+BW/2-OFF,uc); f=(-t[0],-t[1])
            if side=='left': x,z=P(sc-BW/2+OFF,uc)
            p.update(x=x,z=z,y=y,cy=y,ix=round(f[0],3),iz=round(f[1],3),s=round(uc,3),booth798=bi+1,rack798=side); p['freestanding']=True
            l=LP[p['id']]; l.update(x=x,z=z,y=y,ix=round(f[0],3),iz=round(f[1],3),s=round(uc,3))
            assert p['w']<=p['trueW']+1e-6 and p['h']<=p['trueH']+1e-6
    booths.append(dict(n=bi+1,centre=P(sc,BACK+BW/2),back=[P(sc-BW/2,BACK),P(sc+BW/2,BACK)],front=[P(sc-BW/2,FRONT),P(sc+BW/2,FRONT)],face=[round(n[0],3),round(n[1],3)],size=BW,racks=racks,works=[p['id'] for p in ws],awning=['#c8553d','#2f6f8f','#d9a441'][bi]))
oc['booths798']=booths
oc['note']='#798 Paul Murphy art-festival market: 3 booths 3.05 m (10 ft) on the outer edge, works on wire racks at true size; door H2 NE (#787)'
T['nest'].update(issue=798,prev=797,paulMarket798=dict(booths=3,size_m=BW,works=len(PP)))
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(798,[ (b['n'],len(b['works'])) for b in booths])
