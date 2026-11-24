# #789 hang polish leftovers (TJ Oct 27 2026): rehang #783/#785/#786/#788 parked works on free non-door walls; true size; no layout PUT/DELETE.
import json, math
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue']==788
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
PLACED=set(); DOORS=[tuple(d) for d in json.load(open('tools/doors789.json'))]
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
G3=['older-work-legend-of-billy-buff-original-2','painting-golden-coast','painting-sunset-silhouette','book-art-d1399111a441ed91feaa','book-art-471daf14a8bb7883f114']
G8=['painting-insect-garden','painting-twin-dragons','painting-emergence','book-art-c33709aeb2717b0c53de']
G7=['book-art-0351c2ff290526e4f204','archived-painting-362']
G83=['book-art-37fe572d9bb47cab3bc7','book-art-6bcf18417734a8e3010a']
hang('#786 H3 set',G3,[('room-09',1)])
hang('#786 H8 set',G8,[('room-05',0),('room-04',2),('room-10',4),('room-10',1),('room-12',1)])
hang('#785 H7 pair',G7,[('room-07',1),('room-10',1),('room-02',2),('room-12',3)],two=True)
todo=list(G83)
def stackcols(todo,cands,tag):
    while todo:
        A,B=todo[0],(todo[1] if len(todo)>1 else None); grp=[A]+([B] if B else [])
        top=0.95+(R[B]['fh']/2+0.14 if B else 0.5)+R[A]['fh']/2; r=None
        for rid,k in cands:
            r=rows([[A]]+([[B]] if B else []),rid,k,[top,0.95] if B else [1.45])
            if r: LOG.append((tag+' two-high col',r,grp)); break
        if not r: STILL.extend((tag,i) for i in grp)
        del todo[:len(grp)]
stackcols(todo,[('room-11',0),('room-12',3),('room-02',2)],'#783 START overflow')
hang('#744 color wheel',['older-work-lake-hillside-color-wheel-original-3'],[('room-09',4)])
hang('#740 13th ridge strip',['older-work-ridge-strips-unindexed-original-7'],[('room-12',1)])
# ---- eagle brass plate (#354 art plate for painting-portrait-with-hat): left floating in the H3/H12 arch after the painting moved
# to the H12 Renoirs wall (TJ floating-brass-plaque.png, Oct 27). Remount on the painting's open side at 1.45 m.
hp=R['painting-portrait-with-hat']; (mx,mz),tt,ff=frame(hp['room'],hp['wall']); s_h=sof(hp['room'],hp['wall'],hp['x'],hp['z'])
EA=[a for o in T['outerCourts'] for a in o.get('art',[]) if a['id']=='eagle-brass-plaque'][0]; sE=s_h+hp['fw']/2+0.04+EA['w']/2  # open side (caption side is blocked by moonlit-water's plaque)
old=(EA['x'],EA['z']); EA.update(x=round(mx+tt[0]*sE,3),z=round(mz+tt[1]*sE,3),y=1.45,wallFacing=[round(ff[0],4),round(ff[1],4)],room=hp['room'],movedBy='#789 remounted beside painting-portrait-with-hat on H12 wall %d (was floating in the H3/H12 arch at %s)'%(hp['wall'],old))
LOG.append(('#789 eagle plate',EA['x'],EA['z'],round(sE,3)))
def park(i,why):
    p=R[i]; p['parkedBy']=why; q=LP.get(i)
    c['paintings'].remove(p); PK['paintings'].append(p)
    if q: T['paintings'].remove(q); q['parkedBy']=why; PK['layoutPaintings'].append(q)
PK['paintings']=[]; PK['layoutPaintings']=[]
for p in list(c['paintings']):
    if p['id'] in PARK and p['id'] not in PLACED: park(p['id'],(p.get('parkedBy') or '')+('' if not p.get('parkedBy') else '')) if p.get('parkedBy') else park(p['id'],'')
for tag,i in STILL:
    q=[p for p in PK['paintings'] if p['id']==i]
    if q: q[0]['parkedBy']=(q[0]['parkedBy'] or '')+' | #789 no free non-door wall wide enough'
T['nest'].update(issue=789,prev=788,hang789=dict(log=[str(x) for x in LOG],still=[list(x) for x in STILL]))
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
for x in LOG: print(x)
print('STILL',STILL); print('parked now',[(p['id'],(p.get('parkedBy') or '')[:30]) for p in PK['paintings']])
