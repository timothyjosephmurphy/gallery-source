# #817 (TJ Oct 28 2026 SM): fountain-sw polish. Cafe tables/chairs/wine REMOVED (ist811.cafes=[], cafe808 gone);
# all 38 Paul Murphy works rehung in ONE eye-level row (cy 1.55, x1.90 true-aspect, gaps justified) along the court's 3 walls:
# room-09 outer wall (N) -> hang wall (fence side, under awnings) -> room-04 outer wall (S). Father Paul easel moved in front of
# the fountain on the entry side, facing the room-08 door (visible on walking in). Tour/welcome untouched. Idempotent; asserts 816/817.
# Backs up once to /tmp/*.816 (execute.js must be the LIVE #816 build, not #815/#814). Set NEST817_LOCAL=1 only for an offline copy test.
import json, math, os, shutil
LOCAL=os.environ.get('NEST817_LOCAL')=='1'; F='src/catalog.json'
if not LOCAL:
    for s,d in ((F,'/tmp/catalog.json.816'),('deploy/execute.js','/tmp/execute.js.816'),('src/fountainIstanbul811.js','/tmp/fountainIstanbul811.js.816')):
        if not os.path.exists(d): shutil.copy(s,d)
    ex=open('/tmp/execute.js.816').read(); assert 'index-Ba9lwWP_.js' not in ex and 'index-Ck1GdsHN.js' not in ex, 'rollback backup is #815/#814, not #816'
c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in ((815,816,817) if LOCAL else (816,817)), T['nest']
prev=T['nest']['issue'] if T['nest']['issue']!=817 else T['nest'].get('prev')
fs=next(o for o in T['openCourts'] if o['id']=='courtyard-fountain-sw'); fs.pop('cafe808',None)
I=fs['ist811']; I['cafes']=[]; I['cafeRemoved817']=True
hw=fs['walls'][0]; P0,P1,P2,P3=fs['poly']; FC=fs['fountain']['at']; D=fs['door']['at']
def seg(a,b,n,off,t0,t1):
    L=math.hypot(b[0]-a[0],b[1]-a[1]); t=((b[0]-a[0])/L,(b[1]-a[1])/L)
    A=(a[0]+t[0]*t0+n[0]*off,a[1]+t[1]*t0+n[1]*off); return dict(A=A,t=t,n=n,L=L-t0-t1)
def inward(a,b):
    nx,nz=b[1]-a[1],-(b[0]-a[0]); L=math.hypot(nx,nz); nx,nz=nx/L,nz/L; m=((a[0]+b[0])/2,(a[1]+b[1])/2)
    return (nx,nz) if (FC[0]-m[0])*nx+(FC[1]-m[1])*nz>0 else (-nx,-nz)
S=[seg(P1,P2,inward(P1,P2),0.05,0.6,1.35),                              # N: room-09 outer wall, door end -> hang-wall corner
   seg((hw['x0'],hw['z0']),(hw['x1'],hw['z1']),(hw['nx'],hw['nz']),0.11,0.35,0.35),  # hang wall (fence side)
   seg(P3,P0,inward(P3,P0),0.05,1.35,0.6)]                              # S: room-04 outer wall, hang-wall corner -> door end
PP=sorted([p for p in c['paintings'] if p.get('paulMurphy')],key=lambda p:int(p['id'].split('-')[-1])); assert len(PP)==38
LP={l['id']:l for l in T['paintings']}; K=1.9; FR=0.03; CY=1.55
fw=[round(round(p['trueW']*K,4)+FR,4) for p in PP]; TOT=sum(S[i]['L'] for i in range(3))
cut=[]; acc=0; tgt=[S[0]['L']/TOT*sum(fw),(S[0]['L']+S[1]['L'])/TOT*sum(fw)]; j=0
for i,w in enumerate(fw):
    if j<2 and acc+w/2>tgt[j]: cut.append(i); j+=1
    acc+=w
while len(cut)<2: cut.append(len(PP))
groups=[PP[:cut[0]],PP[cut[0]:cut[1]],PP[cut[1]:]]; rep=[]
for g,sg in zip(groups,S):
    ws=[round(p['trueW']*K,4)+FR for p in g]; gap=(sg['L']-sum(ws))/(len(g)+1); assert gap>=0.12,(gap,len(g)); s=gap
    for p,wf in zip(g,ws):
        w=round(p['trueW']*K,4); h=round(p['trueH']*K,4); sc=s+wf/2; s+=wf+gap
        x=round(sg['A'][0]+sg['t'][0]*sc,3); z=round(sg['A'][1]+sg['t'][1]*sc,3); ix,iz=round(sg['n'][0],3),round(sg['n'][1],3)
        p.update(room='courtyard-fountain-sw',wall=0,x=x,z=z,y=CY,cy=CY,ix=ix,iz=iz,s=round(sc,3),w=w,h=h,iw=w,ih=h,fw=round(w+FR,4),fh=round(h+FR,4),artScale=K,hang808=True,hang817=True)
        LP[p['id']].update(room='courtyard-fountain-sw',wall=0,x=x,z=z,y=CY,ix=ix,iz=iz,s=p['s'],w=w,h=h,fw=p['fw'],fh=p['fh'])
    rep.append((len(g),round(gap,3)))
# easel: in front of the fountain on the entry side, a little off the door->fountain axis so the walk stays clear; faces the door
dx,dz=D[0]-FC[0],D[1]-FC[1]; L=math.hypot(dx,dz); ux,uz=dx/L,dz/L; R=fs['fountain']['r']+0.75
ex,ez=FC[0]+ux*R-uz*1.1,FC[1]+uz*R+ux*1.1; fx,fz=D[0]-ex,D[1]-ez; fl=math.hypot(fx,fz)
I['easel'].update(at=[round(ex,3),round(ez,3)],face=[round(fx/fl,3),round(fz/fl,3)]); I['easel'].pop('u',None); I['easel'].pop('v',None)
fs['note']=fs['note'].split(' | #817')[0]+' | #817 cafe sets removed; 38 Paul works in one eye-level row (x1.90, cy 1.55) on N wall/hang wall/S wall; Father Paul easel in front of the fountain facing the entry door'
T['nest'].update(issue=817,prev=prev,note817='#817 fountain-sw: cafes out, Paul works 1 eye-level row on 3 walls, easel in front of fountain facing door')
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
j=open('src/fountainIstanbul811.js').read()
old="g = G(E.u, E.v, yawIn + Math.PI, 'easel811')"
new="g = E.at ? (() => { const q = new THREE.Group(); q.position.set(E.at[0], 0, E.at[1]); q.rotation.y = Math.atan2(E.face[0], E.face[1]); q.name = 'easel811'; root.add(q); return q; })() /* #817 in front of fountain, faces entry */ : G(E.u, E.v, yawIn + Math.PI, 'easel811')"
if old in j: j=j.replace(old,new)
assert new in j; open('src/fountainIstanbul811.js','w').write(j)
print(817,'prev',prev,'groups',rep,'easel',I['easel'])
# (4) #817 TJ: on-wall group/title plates (L.members, e.g. "Attendees") off gallery-wide; door/arch entrance plates (L.door) + NAVE_SIGNS kept
c=json.load(open(F)); c['layout']['tags']['noWallPlates817']=True; open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
for fn in ('src/groupLabels354.js','src/wallTitles354.js'):
    s=open(fn).read(); a="      if (L.members) { const ms"; b="      if (L.members && CATALOG.layout && CATALOG.layout.tags && CATALOG.layout.tags.noWallPlates817) { S.skipped.push(L.id + ': #817 on-wall plate off'); continue; } /* #817 */\n"+a
    if '#817 on-wall plate off' not in s: assert s.count(a)==1,fn; s=s.replace(a,b); open(fn,'w').write(s)
print('plates817 ok')
