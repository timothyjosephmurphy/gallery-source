# #808 (TJ Oct 28 2026): Paul Murphy market booths out (booths798 cleared -> market798 no-op), Paul annex open plaza lead-in to Kinoteka;
# all 38 paulMurphy works rehung on a new hang wall along the outer edge of courtyard-fountain-sw (inset from the fence), enlarged uniformly
# (artScale K, aspect kept) to fill the wall in 2 rows; cafe corner (cafe808) in fountain-sw. Family room-05 untouched. Idempotent; asserts 807/808.
import json, math
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (807,808), T['nest']
OC={o['id']:o for o in T['openCourts']}; pa=OC['courtyard-paul']; fs=OC['courtyard-fountain-sw']
pa.pop('booths798',None); pa['note']='#808 Paul annex: market booths removed; open plaza lead-in to the Kinoteka door (low801 parapets); works moved to courtyard-fountain-sw'
f=fs['fences'][0]; n=tuple(fs['inn']); INSET=0.3; TRIM=0.6
L0=math.hypot(f['x1']-f['x0'],f['z1']-f['z0']); t=((f['x1']-f['x0'])/L0,(f['z1']-f['z0'])/L0)
A=(f['x0']+t[0]*TRIM+n[0]*INSET, f['z0']+t[1]*TRIM+n[1]*INSET); L=L0-2*TRIM
wall=dict(id='courtyard-fountain-sw-hang-wall',x0=round(A[0],3),z0=round(A[1],3),x1=round(A[0]+t[0]*L,3),z1=round(A[1]+t[1]*L,3),nx=n[0],nz=n[1],hang808=True)
fs['walls']=[wall]
PP=sorted([p for p in c['paintings'] if p.get('paulMurphy')],key=lambda p:int(p['id'].split('-')[-1])); assert len(PP)==38
assert all(p['room'] in ('courtyard-paul','courtyard-fountain-sw') for p in PP)
LP={l['id']:l for l in T['paintings']}; FR=0.03; GAP=0.22; EDGE=0.35; U=L-2*EDGE
def pack(K):
    rows=[[],[]]; i=0
    for p in PP:
        w=p['trueW']*K+FR
        while rows[i] and sum(p2['trueW']*K+FR for p2 in rows[i])+GAP*len(rows[i])+w>U:
            i+=1
            if i>1: return None
        rows[i].append(p)
    return rows
K=3.0
while not pack(K): K=round(K-0.05,2)
rows=pack(K); ROWY=[2.75,1.32]; OFF=0.11
for y,row in zip(ROWY,rows):
    tot=sum(p['trueW']*K+FR for p in row)+GAP*(len(row)-1); s=EDGE+(U-tot)/2
    for p in row:
        w=round(p['trueW']*K,4); h=round(p['trueH']*K,4); fw=round(w+FR,4); fh=round(h+FR,4); sc=s+fw/2; s+=fw+GAP
        x=round(A[0]+t[0]*sc+n[0]*OFF,3); z=round(A[1]+t[1]*sc+n[1]*OFF,3)
        for k in ('freestanding','booth798','rack798'): p.pop(k,None)
        p.update(room='courtyard-fountain-sw',wall=0,x=x,z=z,y=y,cy=y,ix=round(n[0],3),iz=round(n[1],3),s=round(sc,3),w=w,h=h,iw=w,ih=h,fw=fw,fh=fh,artScale=K,hang808=True)
        l=LP[p['id']]; l.update(room='courtyard-fountain-sw',wall=0,x=x,z=z,y=y,ix=p['ix'],iz=p['iz'],s=p['s'],w=w,h=h,fw=fw,fh=fh)
assert rows[0][-1]['y']-rows[0][0]['fh']>=0  # sanity
mx0=max(p['fh'] for p in rows[0]); mx1=max(p['fh'] for p in rows[1]); assert ROWY[1]+mx1/2 < ROWY[0]-mx0/2, (mx0,mx1)
# cafe corner: between fountain and the south corner (poly[3]), clear of fountain, wall view and door
C=fs['center']; Q=fs['poly'][3]; cc=(round(C[0]+(Q[0]-C[0])*0.5,3),round(C[1]+(Q[1]-C[1])*0.5,3))
fs['cafe808']=dict(at=list(cc),face=[round(-t[0],3),round(-t[1],3)],awning='#7a2230',r=1.6)
fs['note']='#808 Fountain Courtyard SW: Paul Murphy wall (38 works, x%.2f, 2 rows) on the outer edge + cafe corner'%K
T['nest'].update(issue=808,prev=807,paul808=dict(tracker=None,booths=0,works=38,court='courtyard-fountain-sw',artScale=K,rows=[len(r) for r in rows],cafe=list(cc)))
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(808,K,[len(r) for r in rows],wall,cc)
