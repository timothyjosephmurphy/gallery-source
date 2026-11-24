# #839 (#788 TJ Oct 29 ~7:35 PM PT): Paul Murphy fountain court: booths798 REMOVED; all 38 Paul works rehung TRUE size in one row on the
# 3 outer low834 parapets (inner face). Parapets are 1.0 m (low801), so the row centre is cy 0.68 (top <= 0.96 m). Hang wall/iron fence stay gone,
# half fountain at hex centre, vistaLine/easel as #838. Idempotent; asserts 838/839.
import json, math, os, shutil
F='src/catalog.json'
for s,d in ((F,'/tmp/catalog.json.839'),('src/hang-overrides.json','/tmp/hang-overrides.json.839'),('deploy/execute.js','/tmp/execute.js.838b')):
    if not os.path.exists(d): shutil.copy(s,d)
c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (838,839), T['nest']
oc=[o for o in T['openCourts'] if o['id']=='courtyard-fountain-sw'][0]
assert not any(w['id']=='courtyard-fountain-sw-hang-wall' for w in oc['walls']) and not any(f.get('iron811') for f in oc.get('fences',[]))
oc.pop('booths798',None)
edges=[w for w in oc['walls'] if 'low834' in w['id']]; assert len(edges)==3
PP=sorted([p for p in c['paintings'] if p['id'].startswith('paul-murphy-painting')],key=lambda p:int(p['id'].split('-')[-1])); assert len(PP)==38
LP={l['id']:l for l in T['paintings'] if l['id'] in {p['id'] for p in PP}}; assert len(LP)==38
OFF=0.08/2+0.11; END=0.45; CY=0.68; chunks=[PP[0:13],PP[13:26],PP[26:]]; rep=[]
for bi,(w,ws) in enumerate(zip(edges,chunks)):
    O=(w['x0'],w['z0']); L=math.hypot(w['x1']-O[0],w['z1']-O[1]); t=((w['x1']-O[0])/L,(w['z1']-O[1])/L); n=(w['nx'],w['nz'])
    for p in ws:
        m=round(p['fw']-p['w'],4); p.update(w=p['trueW'],h=p['trueH'],iw=p['trueW'],ih=p['trueH'],fw=round(p['trueW']+m,4),fh=round(p['trueH']+m,4),artScale=1)
        assert CY+p['fh']/2<=0.97, p['id']
    span=L-2*END; gap=(span-sum(p['fw'] for p in ws))/(len(ws)-1); assert gap>=0.15, gap; u=END
    for p in ws:
        uc=u+p['fw']/2; u+=p['fw']+gap
        x,z=round(O[0]+t[0]*uc+n[0]*OFF,3),round(O[1]+t[1]*uc+n[1]*OFF,3)
        for k in ('booth798','rack798','freestanding','hang808','hang817'): p.pop(k,None); LP[p['id']].pop(k,None)
        p.update(room='courtyard-fountain-sw',x=x,z=z,y=CY,cy=CY,ix=round(n[0],3),iz=round(n[1],3),s=round(uc,3),wall=bi,low839=w['id'])
        LP[p['id']].update(room='courtyard-fountain-sw',x=x,z=z,y=CY,ix=round(n[0],3),iz=round(n[1],3),s=round(uc,3),wall=bi,w=p['w'],h=p['h'],fw=p['fw'],fh=p['fh'])
    rep.append((w['id'],len(ws),round(gap,3)))
oc['note']=oc['note'].split(' | #838')[0]+' | #838 TJ: hang wall + iron fence removed, half fountain at hex centre | #839 TJ: booths removed; 38 Paul works true size, one row on the 3 outer low834 parapets'
T['nest'].update(issue=839,prev=838)
T['note839']='#788: Paul fountain court booths798 removed; 38 Paul works true size one row on 3 outer parapets (13/13/12, cy 0.68)'
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
print(839,rep)
