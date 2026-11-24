# #788 hang polish (TJ Oct 27 2026): rehang parked door-wall works (#783/#785/#786/#787) on non-door walls; #740 Family / Renoirs grid;
# #741 hummingbird flock; #744 Small Watercolors 3x3 (color wheel out); #745 thin frames on small paintings. True size, no layout PUT/DELETE.
import json, math
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue']==787
ROOMS={r['id']:r for r in T['rooms']}; PK=T['parked777']
# unpark everything first (we re-park what does not fit)
for p in PK['paintings']: c['paintings'].append(p)
for q in PK['layoutPaintings']: T['paintings'].append(q)
R={p['id']:p for p in c['paintings']}; LP={q['id']:q for q in T['paintings']}
PLQ_W,PLQ_H,PG,DW=0.26,0.18,0.02,2.2
def nv(k): a=math.radians(60*k+T.get('wallRot',30)); return (math.cos(a),math.sin(a))
def tv(k): n=nv(k); return (-n[1],n[0])
def frame(rid,k):
    r=ROOMS[rid]; n,t=nv(k),tv(k); cx,cz=r['center']; d=r['apothem']-0.03
    return (cx+d*n[0],cz+d*n[1]),t,(-n[0],-n[1])
def sof(rid,k,x,z): (mx,mz),t,_=frame(rid,k); return (x-mx)*t[0]+(z-mz)*t[1]
PLACED=set(); DOORS=[tuple(d) for d in json.load(open('tools/doors788.json'))]
if 0:
  for r in T['rooms']:
    for kd in r['doorWalls']:
        n,t=nv(kd),tv(kd); o=r['doorOffsets'].get(str(kd),0.0); cx,cz=r['center']
        DOORS.append((cx+r['apothem']*n[0]+o*t[0],cz+r['apothem']*n[1]+o*t[1],r.get('doorWidths',{}).get(str(kd),2.2),n[0],n[1]))
def busy(rid,k,skip):
    r=ROOMS[rid]; out=[]
    assert k not in r['doorWalls'], (rid,k)
    (mx,mz),t,f=frame(rid,k)
    for (dx,dz,dw,nx,nz) in DOORS:
        st=-4.2
        while st<4.2:
            x,z=mx+t[0]*st,mz+t[1]*st; v=(x-dx)*nx+(z-dz)*nz; u=abs((x-dx)*-nz+(z-dz)*nx)
            if abs(v)<0.32 and u<dw/2+0.05: out.append((st-0.05,st+0.05))
            st+=0.05
    for p in c['paintings']:
        if p['room']!=rid or p.get('wall')!=k or p['id'] in skip: continue
        if p['id'] in PARK and p['id'] not in PLACED: continue
        s=sof(rid,k,p['x'],p['z']); out.append((s-p['fw']/2,s+p['fw']/2))
        if p.get('plaqueAt'): q=p['plaqueAt']; s=sof(rid,k,q['x'],q['z']); out.append((s-q['w']/2,s+q['w']/2))
    return out
def free(rid,k,skip=()):
    h=ROOMS[rid]['radius']/2-0.3; B=sorted(busy(rid,k,set(skip))); iv,a=[],-h
    for lo,hi in B:
        if lo>a+0.12: iv.append((a+0.12,min(lo-0.12,h)))
        a=max(a,hi)
    if a+0.12<h: iv.append((a+0.12,h))
    return [x for x in iv if x[1]-x[0]>0.1]
def put(i,rid,k,s,y,ps):
    (mx,mz),t,f=frame(rid,k); p,q=R[i],LP.setdefault(i,{'id':i})
    for o in (p,q): o.update(room=rid,wall=k,x=round(mx+t[0]*s,3),z=round(mz+t[1]*s,3),y=round(y,3),ix=round(f[0],4),iz=round(f[1],4))
    q['s']=round(s,3); p['stack']=None; p['grid']=None; p['cy']=None; p.pop('parkedBy',None); q.pop('parkedBy',None); PLACED.add(i)
    if ps is None: p['plaqueAt']=None; q['plaque']=None; return
    py=1.45 if (y-p['fh']/2)<=1.45<=(y+p['fh']/2) else round(y,3)
    pa=dict(w=PLQ_W,h=PLQ_H,s=round(ps,3),x=round(mx+t[0]*ps,3),z=round(mz+t[1]*ps,3),y=py); p['plaqueAt']=pa; q['plaque']=dict(pa)
def unitw(i): return R[i]['fw']+PG+PLQ_W
def rows(lines,rid,k,ys,gap=0.12,near=None,skip=()):
    """lines: list of id-rows, each centred on the same interval; each painting has its plaque to its right"""
    W=[sum(unitw(i) for i in L)+gap*(len(L)-1) for L in lines]; tot=max(W)
    ids={i for L in lines for i in L}|set(skip)
    iv=[x for x in free(rid,k,ids) if x[1]-x[0]>=tot]
    if not iv: return None
    if near is None: a,b=max(iv,key=lambda x:x[1]-x[0]); mid=(a+b)/2
    else:
        a,b=min(iv,key=lambda x:0 if x[0]+tot/2<=near<=x[1]-tot/2 else min(abs(near-x[0]-tot/2),abs(near-x[1]+tot/2))); mid=min(max(near,a+tot/2),b-tot/2)
    for L,w,y in zip(lines,W,ys):
        cur=mid-w/2
        for i in L: put(i,rid,k,cur+R[i]['fw']/2,y,cur+R[i]['fw']+PG+PLQ_W/2); cur+=unitw(i)+gap
    return (rid,k,round(tot,2))
LOG=[]; PARK={p['id'] for p in PK['paintings']}; STILL=[]
def hang(tag,ids,cands,two=False):
    ids=[i for i in ids if i in R]
    for rid,k in cands:
        r=rows([ids],rid,k,[1.45])
        if r: LOG.append((tag,'one row',r,ids)); return
    if two or len(ids)>1:
        h=(len(ids)+1)//2; A,B=ids[:h],ids[h:]
        ya=1.45+max(R[i]['fh'] for i in A)/2+0.08 if False else None
        for rid,k in cands:
            top=0.9+max(R[i]['fh'] for i in B)/2+0.12+max(R[i]['fh'] for i in A)/2
            r=rows([A,B],rid,k,[max(top,1.9),0.9])
            if r: LOG.append((tag,'two high',r,ids)); return
    left=list(ids)
    for i in ids:  # greedy singles
        for rid,k in cands:
            r=rows([[i]],rid,k,[1.45])
            if r: LOG.append((tag,'single',r,i)); left.remove(i); break
    for i in left: STILL.append((tag,i))
P785a=['book-art-94e2edf9a24c90950489','daniel-portrait-1','book-art-7df006b029abcb751da2','book-art-ded6b759e667e3c2a313']
P785b=['book-art-0351c2ff290526e4f204','archived-painting-367','archived-painting-362','meditation-at-denny-blaine']
P786a=['older-work-legend-of-billy-buff-original-2','painting-golden-coast','painting-sunset-silhouette','book-art-d1399111a441ed91feaa','book-art-471daf14a8bb7883f114']
P786b=['painting-emergence','painting-insect-garden','painting-twin-dragons','book-art-c33709aeb2717b0c53de']
P787=['painting-phoenix-rising','painting-portrait-with-cheese','book-art-1fb8762b7bf8fce0d0f9','book-art-a26ad79970ed645ce1a9']
P783=[p['id'] for p in PK['paintings'] if (p.get('parkedBy') or '').startswith('#783')]
# ---- #740 Family: Father Paul group off the crowded k0 onto the freed solid H5 SE (k5), sign reads "Family"
FAM=['book-art-0a80f9a5da0d39edc80f','book-art-82127d1886ae57d5cb6e','archived-painting-img-1555','grandpa-howard']
LOG.append(('#740 Family k5',rows([FAM],'room-05',5,[1.5])))
hang('#785 H1',P785a,[('room-01',5),('room-01',3)])
hang('#785 H7',P785b,[('room-07',1),('room-07',3)])
hang('#786 H3',P786a,[('room-03',0),('room-03',4)])
hang('#786 H8',P786b,[('room-08',1),('room-08',5)])
hang('#787 H2',P787,[('room-02',2),('room-02',4)])
# #783 START overflow -> H11 two-high
todo=list(P783)
def stackcols(todo,cands,tag):
    while todo:
        A,B=todo[0],(todo[1] if len(todo)>1 else None); grp=[A]+([B] if B else [])
        top=0.95+(R[B]['fh']/2+0.14 if B else 0.5)+R[A]['fh']/2
        r=None
        for rid,k in cands:
            r=rows([[A]]+([[B]] if B else []),rid,k,[top,0.95] if B else [1.45])
            if r: LOG.append((tag+' two-high col',r,grp)); break
        if not r: STILL.extend((tag,i) for i in grp)
        del todo[:len(grp)]
stackcols(todo,[('room-11',0),('room-11',2)],'#783 H11')
# ---- #740 Renoirs & Ridges: strips into a regular 4x3 grid, no plaques, no lamp bars on the wall
RR=['lisa-climbing-tahoma-at-sunrise-from-denny-blaine','sunrise-on-tahoma-from-denny-blaine','painting-portrait-with-hat']
ST=['older-work-sunset-ridge-strips-original-%d'%n for n in range(1,7)]+['older-work-ridge-strips-unindexed-original-%d'%n for n in range(1,8)]
ss=[sof('room-12',0,R[i]['x'],R[i]['z']) for i in ST]; cw=max(R[i]['fw'] for i in ST); pitch=cw+0.1
GRID,G13=ST[:12],ST[12]
s0=(min(ss)+max(ss))/2-1.5*pitch
for n,i in enumerate(GRID): put(i,'room-12',0,s0+(n%4)*pitch,[2.25,1.85,1.45][n//4],None)
for i in RR: R[i]['plaqueAt']=None; LP[i]['plaque']=None
LOG.append(('#740 Renoirs grid 4x3 pitch',round(pitch,3),'s0',round(s0,3)))
# ---- #744 Small Watercolors 3x3, color wheel parked
CW='older-work-lake-hillside-color-wheel-original-3'
SW=['older-work-mountain-layers-original-%d'%n for n in (1,2,3,4)]+['older-work-beach-sunsets-original-%d'%n for n in (1,2,3)]+['older-work-lake-hillside-color-wheel-original-%d'%n for n in (1,2)]
mid=sum(sof('room-09',3,R[i]['x'],R[i]['z']) for i in SW)/len(SW); cu=max(unitw(i) for i in SW)+0.1
for n,i in enumerate(SW): s=mid+(n%3-1)*cu-unitw(i)/2+R[i]['fw']/2; put(i,'room-09',3,s,[2.15,1.75,1.35][n//3],s+R[i]['fw']/2+PG+PLQ_W/2)
# ---- #741 Hummingbirds flock 2x2 (two feeder studies off room-12 walls)
HB=['book-art-b7a9cd259d8ac51a236b','book-art-aa4dcced8a2ae6a8111c','older-work-hummingbird-feeder-190','book-art-8fde7c978d6cd5d53727']
near=sof('room-09',3,R[HB[0]]['x'],R[HB[0]]['z'])
LOG.append(('#741 HB flock',rows([HB[:2],HB[2:]],'room-09',3,[1.85,1.35],gap=0.08,near=near,skip=[CW])))
# ---- park leftovers
def park(i,why):
    p=R[i]; p['parkedBy']=why; q=LP.get(i)
    c['paintings'].remove(p); PK['paintings'].append(p)
    if q: T['paintings'].remove(q); q['parkedBy']=why; PK['layoutPaintings'].append(q)
PK['paintings']=[]; PK['layoutPaintings']=[]
for p in list(c['paintings']):
    if p['id'] in PARK and p['id'] not in PLACED: park(p['id'],p.get('parkedBy',''))
park(CW,'#744 color wheel off the Small Watercolors 3x3 (TJ Oct 27)')
park(G13,'#740 13th ridge strip: Renoirs & Ridges is a regular 4x3 grid (TJ Oct 27) - TJ to place')
# ---- #745 thin frames on small paintings (canvas <= 0.40 m): 1.5 cm per side
th=0
for p in c['paintings']:
    if max(p['w'],p['h'])<=0.40 and (p['fw']-p['w']>0.031 or p['fh']-p['h']>0.031):
        p['fw']=round(p['w']+0.03,4); p['fh']=round(p['h']+0.03,4); th+=1
        q=LP.get(p['id'])
        if q: q['fw']=p['fw']; q['fh']=p['fh']
T['noLamp788']=RR+GRID
T['nest'].update(issue=788,prev=787,hang788=dict(log=[str(x) for x in LOG],still=[list(x) for x in STILL],thinFrames=th))
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
for x in LOG: print(x)
print('STILL',STILL); print('thin',th,'parked now',[(p['id'],p['parkedBy'][:20]) for p in PK['paintings']])
