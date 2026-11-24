# #800 (TJ Oct 27 2026): (a) Paul market -> 2 booths (outer ends), clear middle aisle; 38 works on all 3 white wire racks of each booth, true size.
# (b) Kinoteka: door in the Paul outer wall at the aisle; plaza, steps up (1.2 m), portico, cinema hall (open court 'kinoteka', annex). Idempotent; asserts 799/800.
import json, math
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (799,800), T['nest']
oc=[o for o in T['openCourts'] if o['id']=='courtyard-paul'][0]
O=oc['poly'][3]; E2=oc['poly'][2]; L=math.hypot(E2[0]-O[0],E2[1]-O[1]); t=((E2[0]-O[0])/L,(E2[1]-O[1])/L); n=(-0.866,-0.5)
P=lambda s,d:(round(O[0]+t[0]*s+n[0]*d,3),round(O[1]+t[1]*s+n[1]*d,3))
BW=3.05; BACK=0.30; OFF=0.06; GAP=0.1; FRONT=BACK+BW; mid=L/2; centres=[3.70,L-3.70]
PP=[p for p in c['paintings'] if p['id'].startswith('paul-murphy-painting')]; PP.sort(key=lambda p:int(p['id'].split('-')[-1])); assert len(PP)==38
LP={l['id']:l for l in T['paintings'] if l['id'] in {p['id'] for p in PP}}
chunks=[PP[0:19],PP[19:]]; booths=[]; YT,YB=1.70,1.05
for bi,(sc,ws) in enumerate(zip(centres,chunks)):
    racks=[dict(side='back',a=P(sc-BW/2,BACK),b=P(sc+BW/2,BACK),face=n),dict(side='left',a=P(sc-BW/2,BACK),b=P(sc-BW/2,FRONT),face=t),dict(side='right',a=P(sc+BW/2,BACK),b=P(sc+BW/2,FRONT),face=(-t[0],-t[1]))]
    k=len(ws); nb=k-2*(k//3); groups=[('back',ws[:nb]),('left',ws[nb:nb+k//3]),('right',ws[nb+k//3:])]
    for side,g in groups:
        u0,u1=(sc-1.3,sc+1.3) if side=='back' else (BACK+0.35,FRONT-0.3)
        h=(len(g)+1)//2
        for y,row in ((YT,g[:h]),(YB,g[h:])):
            tot=sum(q['fw'] for q in row)+GAP*(len(row)-1); assert tot<=u1-u0,(side,tot); u=(u0+u1)/2-tot/2
            for p in row:
                uc=u+p['fw']/2; u+=p['fw']+GAP
                if side=='back': x,z=P(uc,BACK+OFF); f=n
                elif side=='left': x,z=P(sc-BW/2+OFF,uc); f=t
                else: x,z=P(sc+BW/2-OFF,uc); f=(-t[0],-t[1])
                p.update(x=x,z=z,y=y,cy=y,ix=round(f[0],3),iz=round(f[1],3),s=round(uc,3),booth798=bi+1,rack798=side); p['freestanding']=True
                LP[p['id']].update(x=x,z=z,y=y,ix=round(f[0],3),iz=round(f[1],3),s=round(uc,3))
                assert p['w']<=p['trueW']+1e-6 and p['h']<=p['trueH']+1e-6
    booths.append(dict(n=bi+1,centre=P(sc,BACK+BW/2),back=[P(sc-BW/2,BACK),P(sc+BW/2,BACK)],front=[P(sc-BW/2,FRONT),P(sc+BW/2,FRONT)],face=[round(n[0],3),round(n[1],3)],size=BW,racks=racks,works=[p['id'] for p in ws],awning=['#c8553d','#2f6f8f'][bi],white=True,wireStep=0.5))
oc['booths798']=booths
# Paul outer wall split round the Kinoteka door (s = mid)
W0=[w for w in oc['walls'] if w['id'].startswith('courtyard-paul-outer-wall')][0]; A=(20.644,21.561); B=(28.994,7.097); WL=math.hypot(B[0]-A[0],B[1]-A[1]); wt=((B[0]-A[0])/WL,(B[1]-A[1])/WL)
Dm=P(mid,0); sd=(Dm[0]-A[0])*wt[0]+(Dm[1]-A[1])*wt[1]; DW=2.2; Q=lambda s:(round(A[0]+wt[0]*s,3),round(A[1]+wt[1]*s,3)); D=Q(sd)
a1,b1=Q(sd-DW/2),Q(sd+DW/2)
oc['walls']=[dict(W0,id='courtyard-paul-outer-wall',x0=A[0],z0=A[1],x1=a1[0],z1=a1[1]),dict(W0,id='courtyard-paul-outer-wall-b',x0=b1[0],z0=b1[1],x1=B[0],z1=B[1])]
oc['note']='#800 Paul market: 2 booths 3.05 m at the outer ends, works on all 3 white wire racks, true size; middle aisle -> Kinoteka door in the outer wall; door H2 NE (#787)'
# Kinoteka frame: origin D on the wall, f outward (away from Paul), u along wt
f=(0.866,0.5); K=lambda u,v:[round(D[0]+wt[0]*u+f[0]*v,3),round(D[1]+wt[1]*u+f[1]*v,3)]
poly=[K(-4.5,0),K(4.5,0),K(4.5,7),K(3.5,7),K(3.5,11),K(6,11),K(6,25),K(-6,25),K(-6,11),K(-3.5,11),K(-3.5,7),K(-4.5,7)]
seg=lambda i,a,b:dict(id='kino800-'+i,x0=a[0],z0=a[1],x1=b[0],z1=b[1],nx=0,nz=0,kino800=True)
walls=[seg('pl-l',K(-4.5,0.15),K(-4.5,7)),seg('pl-r',K(4.5,0.15),K(4.5,7)),seg('pl-fl',K(-4.5,7),K(-3.5,7)),seg('pl-fr',K(3.5,7),K(4.5,7)),
       seg('st-l',K(-3.5,7),K(-3.5,11)),seg('st-r',K(3.5,7),K(3.5,11)),seg('fr-l',K(-6,11),K(-1.1,11)),seg('fr-r',K(1.1,11),K(6,11)),
       seg('hl-l',K(-6,11),K(-6,25)),seg('hl-r',K(6,11),K(6,25)),seg('hl-b',K(-6,25),K(6,25))]
rows=[]
for i in range(8):
    v=14.2+0.95*i; rows.append(seg('row%d'%i,K(-3.6,v),K(3.6,v)))
walls+=rows
cols=[dict(at=K(u,9.95),r=0.3) for u in (-2.9,-1.55,1.55,2.9)]
kc=dict(id='kinoteka',label='Kinoteka',poly=poly,center=K(0,16),radius=8,walls=walls,
  doors800=[dict(x=D[0],z=D[1],nx=f[0],nz=f[1],width=DW,room='courtyard-paul',to='kinoteka',kind='court')],
  kino800=dict(D=list(D),f=list(f),t=list(wt),stairs=[7,9.6],rise=1.2,hall=[11,25],halfW=6,cols=cols,
    film=dict(title='Coined in Watercolor: The Art of Going All In',base='https://img.tjm.art/play/preview-251/kino800/',chunks=15,chunk_s=48,poster='poster.jpg',youtube='https://www.youtube.com/watch?v=i7tvzE_bqM8',page='https://tjm.art/film/')),
  note='#800 Kinoteka cinema (PKiN, Warsaw) reached through the Paul Murphy market; one door; floor rises 1.2 m up the steps')
T['openCourts']=[o for o in T['openCourts'] if o['id']!='kinoteka']+[kc]
T['nest'].update(issue=800,prev=799,paulMarket798=dict(booths=2,size_m=BW,works=len(PP),racks='back+left+right',white=True),kino800=dict(door=list(D)))
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(800,[(b['n'],len(b['works'])) for b in booths],D)
