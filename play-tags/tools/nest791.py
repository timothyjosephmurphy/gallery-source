# #791 hang redo from TJ hang-together feedback (Oct 27 2026). Plan: /tmp/HANG-PLAN-791.md. Folds #790 Berlin blend (source nest 790, never deployed).
import json, math
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert str(T['nest']['issue']) in ('789','790'), T['nest']['issue']
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
PLACED=set(); DOORS=[tuple(d) for d in json.load(open('tools/doors791.json'))]
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
def rows2(lines,rid,k,ys,plq=True,gap=0.12,skip=(),near=None):
    uw=(lambda i:R[i]['fw']+PG+PLQ_W) if plq else (lambda i:R[i]['fw'])
    W=[sum(uw(i) for i in L)+gap*(len(L)-1) for L in lines]; tot=max(W)
    ids={i for L in lines for i in L}|set(skip)
    iv=[x for x in free(rid,k,ids) if x[1]-x[0]>=tot]
    if not iv: return None
    if near is None: a,b=max(iv,key=lambda x:x[1]-x[0]); mid=(a+b)/2
    else:
        a,b=min(iv,key=lambda x:abs((x[0]+x[1])/2-near)); mid=min(max(near,a+tot/2),b-tot/2)
    for L,w,y in zip(lines,W,ys):
        cur=mid-w/2
        for i in L: put(i,rid,k,cur+R[i]['fw']/2,y,(cur+R[i]['fw']+PG+PLQ_W/2) if plq else None); cur+=uw(i)+gap
    return (rid,k,round(tot,2),round(mid,2))
def two_high(A,B,gapv=0.14,base=1.1): return [base+max(R[i]['fh'] for i in B)/2+gapv+max(R[i]['fh'] for i in A)/2, base]
def try_(tag,fn_list):
    for f in fn_list:
        r=f()
        if r: LOG.append((tag,r)); return r
    STILL.append((tag,'FAILED')); print('FAIL',tag); return None
ES=['painting-insect-garden','painting-emergence','painting-twin-dragons']; CHASE='painting-portrait-in-green'
# 1) H8 k5 sunrises -> H4 k2 dawn/sunrise wall (vacated by El Salvador: Future)
SUN=['el-zonte-before-dawn','el-zonte-at-sunrise']
try_('#791 H8 sunrises -> H4 dawn wall',[lambda:rows2([SUN],'room-04',2,[1.45],skip=['painting-twin-dragons']),
     lambda:rows2([SUN],'room-04',2,two_high([SUN[0]],[SUN[1]]),skip=['painting-twin-dragons'])])
# small H8 k5 works -> 2-high block that stays in El Salvador room if possible
SM=['book-art-ac338ff3806b66917b3c','book-art-e3293c73dbb01f94b39b','older-work-shore-figures-original-1','older-work-shore-figures-original-2']
SM=[i for i in SM if i in R] or [p['id'] for p in c['paintings'] if p['room']=='room-08' and p['wall']==5 and p['id'] not in ES+[CHASE]+SUN]
SM=[p['id'] for p in c['paintings'] if p['room']=='room-08' and p['wall']==5 and p['id'] not in ES+[CHASE]+SUN]
# 2) El Salvador Past-Present-Future + Chase Toole one row on H8 k5 (skip everything currently on k5)
K5=[p['id'] for p in c['paintings'] if p['room']=='room-08' and p['wall']==5]
def es_row():
    r=rows2([ES],'room-08',5,[1.45],plq=False,gap=0.06,skip=K5+ES,near=-9)
    if not r: return None
    f=R[ES[-1]]; s0=sof('room-08',5,f['x'],f['z']); ps=s0+f['fw']/2+PG+PLQ_W/2; (mx,mz),t,_=frame('room-08',5)
    pa=dict(w=PLQ_W,h=PLQ_H,s=round(ps,3),x=round(mx+t[0]*ps,3),z=round(mz+t[1]*ps,3),y=1.45,set='El Salvador: Past / Present / Future (Chase Toole collab)'); f['plaqueAt']=pa; LP[ES[-1]]['plaque']=dict(pa)
    return r
try_('#791 El Salvador Past-Present-Future one row, one set plaque (H8 k5)',[es_row])
SH=['older-work-shore-figures-original-2','older-work-shore-figures-original-3']
n1=R.get('older-work-shore-figures-original-1')
try_('#791 shore figures series with Figures on a Shore',[lambda:rows2([SH],n1['room'],n1['wall'],[1.45],skip=SH,near=sof(n1['room'],n1['wall'],n1['x'],n1['z'])),lambda:rows2([[SH[0]],[SH[1]]],n1['room'],n1['wall'],two_high([SH[0]],[SH[1]]),skip=SH)])
try_('#791 Chase Toole + El Salvador small works H8 k5',[lambda:rows2([['book-art-ac338ff3806b66917b3c'],['book-art-e3293c73dbb01f94b39b'],[CHASE]],'room-08',5,[2.04,1.57,0.95],skip=K5)])
moved=set(PLACED)
SM=[i for i in K5 if i not in moved]; print('SM',[(i,R[i]['title'][:20]) for i in SM])
# 3) Austin friends set (#760; Friends Court wall is now the full-width H1 door) -> 2-high block nearest Friends Court
AU=['book-art-1ff2691533c9a9d8b091','book-art-df8db0bc08adfeae5829','book-art-4a03ad4df3ef51a39639','book-art-616ff8378f27047b4a91','book-art-c33709aeb2717b0c53de']
A,B=AU[:3],AU[3:]
try_('#791 Austin friends',[lambda rid=rid,k=k:rows2([A,B],rid,k,two_high(A,B),skip=AU+['painting-insect-garden']) for rid,k in [('room-01',5),('room-01',3),('room-12',1),('room-05',0)]])
h=(len(SM)+1)//2
if SM: try_('#791 H8 small works 2-high',[lambda rid=rid,k=k:rows2([SM[:h],SM[h:]],rid,k,two_high(SM[:h],SM[h:])) for rid,k in [('room-08',5),('room-08',1),('room-04',2),('room-04',5),('room-04',3)]])
# 4) Honey Badger - Coined - Syrenka (#742) one row on a H10 wall
K1=[p['id'] for p in c['paintings'] if p['room']=='room-10' and p['wall']==1 and not p['id'].startswith('honeybadger')]
h1=(len(K1)+1)//2
try_('#791 H10 k1 portraits -> H10 k4 (vacated by El Salvador: Present)',[lambda:rows2([K1],'room-10',4,[1.45],skip=K1),lambda:rows2([K1[:h1],K1[h1:]],'room-10',4,two_high(K1[:h1],K1[h1:]),skip=K1)])
HB=['honeybadger-and-cub-with-genesis-block','coined-in-watercolor-film-poster','warszawska-syrenka']
try_('#742 trio',[lambda rid=rid,k=k:rows2([HB],rid,k,[1.45],skip=HB) for rid,k in [('room-10',1),('room-10',5),('room-10',0),('room-10',4)]])
# 5) Ukraine three in a row (#354): Vision / Mother of Kiev / Girl Wearing Flower Crown
GIRL=[p['id'] for p in c['paintings'] if p['title'].startswith('Girl Wearing Flower')][0]
UK=['painting-sunflower-woman','painting-figures-in-wheatfield',GIRL]
KS=['book-art-1143b08e177333e43dc7','book-art-db933efcbc4fbe01c841']
r=try_('#354 Ukraine row',[lambda:rows2([UK],'room-11',0,[1.45],skip=UK),lambda:rows2([UK],'room-11',0,[1.45],skip=UK+KS),lambda:rows2([UK],'room-11',2,[1.45],skip=UK)])
if r and r[0]=='room-11' and r[1]==0 and any(R[i]['room']=='room-11' and R[i]['wall']==0 and i not in PLACED for i in KS):
    # Kristine & Steve were displaced -> two-high column in the Girl's old H11 k2 slot
    try_('#791 Kristine/Steve',[lambda rid=rid,k=k:rows2([[KS[0]],[KS[1]]],rid,k,two_high([KS[0]],[KS[1]]),skip=KS) for rid,k in [('room-11',2),('room-12',3),('room-06',0)]])
# 6) H11 START overflow: Brothers + Dawn in her Flight Helmet join the H11 two-high block if room
BR=['book-art-37fe572d9bb47cab3bc7','book-art-6bcf18417734a8e3010a']
r=rows2([[BR[0]],[BR[1]]],'room-11',0,two_high([BR[0]],[BR[1]]),skip=BR,near=sof('room-11',0,R['book-art-7123da0440d527299914']['x'],R['book-art-7123da0440d527299914']['z']))
LOG.append(('#783 H11 6/6',r or 'no room on H11 k0 - pair stays together on H12 k3'))
# 7) H9 k3: clean Small Watercolors 3x3 (no plaques, no lamps) + hummingbird 2x2 flock beside it
WC=['older-work-mountain-layers-original-1','older-work-mountain-layers-original-2','older-work-mountain-layers-original-3','older-work-mountain-layers-original-4','older-work-beach-sunsets-original-1','older-work-beach-sunsets-original-2','older-work-beach-sunsets-original-3']
WC+= [p['id'] for p in c['paintings'] if p['title'] in ('TJ Mountain Lake 145','TJ Golden Hillside 141')]
HM=['book-art-aa4dcced8a2ae6a8111c','book-art-8fde7c978d6cd5d53727','book-art-b7a9cd259d8ac51a236b','older-work-hummingbird-feeder-190']
assert len(WC)==9 and all(i in R for i in HM)
G=[WC[0:3],WC[3:6],WC[6:9]]; rh=max(R[i]['fh'] for i in WC)+0.08; ys=[1.45+rh,1.45,1.45-rh]
gw=3*0.2078+2*0.08; hw=2*(0.335+PG+PLQ_W)+0.12
iv=[x for x in free('room-09',3,WC+HM) if x[1]-x[0]>=gw+0.45+hw]
if iv:
    a,b=max(iv,key=lambda x:x[1]-x[0]); m=(a+b)/2; g0=m-(gw+0.45+hw)/2
    for row,y in zip(G,ys):
        for j,i in enumerate(row): put(i,'room-09',3,g0+0.1039+j*(0.2078+0.08),y,None)
    h0=g0+gw+0.45; hys=[1.45+0.335/2+0.06,1.45-0.335/2-0.06]
    for j,i in enumerate(HM):
        col,rw=j%2,j//2; s=h0+col*(0.335+PG+PLQ_W+0.12)+R[i]['fw']/2
        put(i,'room-09',3,s,hys[rw],s+R[i]['fw']/2+PG+PLQ_W/2)
    LOG.append(('#744/#741 H9 k3 3x3 + hummingbird 2x2',round(g0,2),round(gw+0.45+hw,2)))
    T['noLamp788']=sorted(set(T.get('noLamp788') or [])|set(WC))
else: STILL.append(('#744 H9 grid','FAILED'))
# 8) 13th ridge strip (CONFLICTS 1): centred directly under the 4x3 Ridges grid on H12 k0 (same set, same wall, no plaque/lamp)
RS=[p for p in c['paintings'] if p['room']=='room-12' and p['wall']==0 and 'ridge-strip' in p['id']]
g=R['older-work-ridge-strips-unindexed-original-7']; ss=[sof('room-12',0,p['x'],p['z']) for p in RS]; sc=(min(ss)+max(ss))/2
yl=min(p['y'] for p in RS); pitch=sorted(set(round(p['y'],2) for p in RS)); dy=pitch[1]-pitch[0] if len(pitch)>1 else 0.4
ny=round(yl-dy,3); lo,hi=sc-g['fw']/2,sc+g['fw']/2
clash=[p['id'] for p in c['paintings'] if p['room']=='room-12' and p['wall']==0 and p['id']!=g['id'] and abs(sof('room-12',0,p['x'],p['z'])-sc)<(p['fw']+g['fw'])/2+0.05 and abs(p['y']-ny)<(p['fh']+g['fh'])/2+0.05]
if not clash:
    put(g['id'],'room-12',0,sc,ny,None); T['noLamp788']=sorted(set(T['noLamp788'])|{g['id']}); LOG.append(('#740 13th strip under grid',round(sc,2),ny,len(RS)))
else: LOG.append(('#740 13th strip stays H12 k1 (clash)',clash))
def park(i,why):
    p=R[i]; p['parkedBy']=why; q=LP.get(i)
    c['paintings'].remove(p); PK['paintings'].append(p)
    if q: T['paintings'].remove(q); q['parkedBy']=why; PK['layoutPaintings'].append(q)
PK['paintings']=[]; PK['layoutPaintings']=[]
for p in list(c['paintings']):
    if p['id'] in PARK and p['id'] not in PLACED: park(p['id'],(p.get('parkedBy') or '')+('' if not p.get('parkedBy') else '')) if p.get('parkedBy') else park(p['id'],'')
for tag,i in STILL:
    q=[p for p in PK['paintings'] if p['id']==i]
    if q: q[0]['parkedBy']=(q[0]['parkedBy'] or '')+' | #791 no free non-door wall wide enough'
T['nest'].update(issue=791,prev=789,fold790="Berlin-ES mural blend (berlinWall790.js) folded in",hang791=dict(log=[str(x) for x in LOG],still=[list(x) for x in STILL]))
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
for x in LOG: print(x)
print('STILL',STILL); print('parked now',[(p['id'],(p.get('parkedBy') or '')[:30]) for p in PK['paintings']])
