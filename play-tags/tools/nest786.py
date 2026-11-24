# #786 (TJ Oct 27 2026): two west open-air courts: NW Garden Patio (H3 door, wood fence, Cormorant + QR plate, patio set) and SW Fountain Courtyard (H8 door, fountain, low iron fence).
import json, math
CAT='src/catalog.json'; c=json.load(open(CAT)); T=c['layout']['tags']; assert T['nest']['issue']==785
PN=json.load(open('/workspace/gallery-tj-feedback/hex-plan-honeycomb-nest/plan-nest.json'))
R={r['id']:r for r in T['rooms']}; PK=T['parked777']; DW=7.75; rep={}
def court(cid,label,poly,center,room,k,at,inn):
    H=R[room]; assert k not in H['doorWalls']
    H['doorWalls']=sorted(H['doorWalls']+[k]); H['doorWidths'][str(k)]=DW; H['doorOffsets'][str(k)]=0.0; H['neighbours'][str(k)]=cid
    P=[p for p in c['paintings'] if p['room']==room and p['wall']==k]; ids={p['id'] for p in P}
    for p in P: p['parkedBy']='#786 door wall %s k%d full-width arch into %s'%(room,k,cid)
    c['paintings']=[p for p in c['paintings'] if p['id'] not in ids]; PK['paintings']+=P
    L=[p for p in T['paintings'] if p['id'] in ids]; T['paintings']=[p for p in T['paintings'] if p['id'] not in ids]; PK['layoutPaintings']+=L
    A,B=poly[2],poly[3]; ox,oz=-inn[0]*0.1,-inn[1]*0.1  # outer edge H9 tip -> other tip, 0.1 m outside
    oc=dict(id=cid,label=label,poly=poly,center=center,radius=8.25,door=dict(room=room,k=k,width=DW,at=at),walls=[],
        fences=[dict(id=cid+'-outer-fence',x0=round(A[0]+ox,3),z0=round(A[1]+oz,3),x1=round(B[0]+ox,3),z1=round(B[1]+oz,3))],inn=inn)
    T['openCourts'].append(oc); rep[cid]=dict(door='%s k%d %.2f m'%(room,k,DW),parked=sorted(ids)); return oc
NW=[[-16.5,14.289],[-20.625,7.144],[-28.875,7.144],[-20.625,21.434]]; SW=[[-16.5,-14.289],[-20.625,-7.144],[-28.875,-7.144],[-20.625,-21.434]]
a=court('courtyard-patio','Garden Patio',NW,[-21.656,12.503],'room-03',2,[-18.562,10.716],[0.866,-0.5])
b=court('courtyard-fountain-sw','Fountain Courtyard',SW,[-21.656,-12.503],'room-08',3,[-18.562,-10.716],[0.866,0.5])
a['fences'][0]['wood']=True
# local frame on the NW outer edge: M = edge mid, n inward, t along edge
M=(-24.75,14.289); n=(0.866,-0.5); t=(0.5,0.866)
P=lambda u,d:[round(M[0]+t[0]*u+n[0]*d,3),round(M[1]+t[1]*u+n[1]*d,3)]
yaw=lambda f:round(math.atan2(f[0],f[1]),4)
a['patio']=dict(floor='flagstone',furniture=[
  dict(kind='sofa',at=P(-3.2,2.15),face=list(n),r=0.95),
  dict(kind='table',at=P(-3.2,3.35),face=list(n),r=0.55),
  dict(kind='chair',at=P(-4.1,4.55),face=[-n[0],-n[1]],r=0.5),
  dict(kind='chair',at=P(-2.3,4.55),face=[-n[0],-n[1]],r=0.5)],
  shrubs=[P(u,0.35) for u in (-7.2,-6.0,-4.8,-3.6,-2.4,3.0,4.2,5.4,6.6)],
  panel=dict(at=P(0.2,-0.02),w=3.6,h=2.7,face=list(n)))
b['fountain']=dict(at=[-21.656,-12.503],r=1.35)
EX=T['outerCourts'][0]; ART={x['id']:x for x in EX['art']}
m=ART['cormorant-presiding-over-sunset-on-puget-sound']; mp=P(0,0.05)
m.update(x=mp[0],z=mp[1],y=1.55,wallFacing=list(n),room='courtyard-patio',movedBy='#786 Garden Patio outer wood fence, centred, catalog size 2.286 x 1.524 m')
q=ART['cormorant-qr-brass-plaque']; qp=P(1.45,0.05)
q.update(x=qp[0],z=qp[1],y=1.45,wallFacing=list(n),room='courtyard-patio',movedBy='#786 on the patio wood fence beside the Cormorant (label)')
T['nest'].update(issue=786,prev=785,westCourts786=dict(rep,cormorant=dict(x=mp[0],z=mp[1],facing=list(n)),plaque=dict(x=qp[0],z=qp[1],facing=list(n))))
open(CAT,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(json.dumps(T['nest']['westCourts786']))
