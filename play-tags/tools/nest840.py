# #840 (#788 TJ Oct 29 ~7:56 PM PT): striped awnings on the TWO outer low834 parapets in TJ's shot (low834-0 + low834-1, the west V
# that carries Paul works). Wall-local mount (A.wall), low over the 1.0 m parapet on iron posts. Booths/mid wall/fence stay gone. Idempotent; asserts 839/840.
import json, os, shutil, re
F='src/catalog.json'; M='src/fountainIstanbul811.js'
c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (839,840), T['nest']
oc=[o for o in T['openCourts'] if o['id']=='courtyard-fountain-sw'][0]; C=oc['ist811']
assert not any('hang-wall' in w['id'] for w in oc['walls']) and 'booths798' not in oc
C['awnings']=[{'wall':'courtyard-fountain-sw-low834-%d'%i,'u':0,'w':7.4,'d':1.1,'y':1.75,'drop':0.3,'posts':True} for i in (0,1)]
oc['note']=oc['note'].split(' | #840')[0]+' | #840 TJ: awnings on the 2 outer parapets (low834-0/1)'
T['nest'].update(issue=840,prev=839); T['note840']='#788: Paul court awnings on outer parapets low834-0 + low834-1 (wall-local, posts, y 1.75)'
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
s=open(M).read()
if 'awn840' not in s:
    a="for (const A of C.awnings || []) { const g = G(A.u, 0.09, yawIn, 'awning811'), D = A.d || 1.5, Y0 = A.y || C.awningY || 3.6, drop = 0.5,"
    assert a in s
    s=s.replace(a,"for (const A of C.awnings || []) { const aw = A.wall && oc.walls.find(q => q.id === A.wall); /* awn840 wall-local mount */ const g = aw ? (() => { const g = new THREE.Group(), WL = Math.hypot(aw.x1 - aw.x0, aw.z1 - aw.z0); g.position.set((aw.x0 + aw.x1) / 2 + (aw.x1 - aw.x0) / WL * A.u + aw.nx * 0.06, 0, (aw.z0 + aw.z1) / 2 + (aw.z1 - aw.z0) / WL * A.u + aw.nz * 0.06); g.rotation.y = Math.atan2(aw.nx, aw.nz); g.name = 'awning811'; root.add(g); return g; })() : G(A.u, 0.09, yawIn, 'awning811'), D = A.d || 1.5, Y0 = A.y || C.awningY || 3.6, drop = A.drop || 0.5,")
    b="add(g, box, iron, 0, Y0 - drop - 0.01, D, A.w, 0.03, 0.03); out.parts.push('awning'); }"
    assert b in s
    s=s.replace(b,"add(g, box, iron, 0, Y0 - drop - 0.01, D, A.w, 0.03, 0.03); if (A.posts) for (const s of [-1, 1]) { add(g, box, iron, s * A.w / 2, (Y0 - drop) / 2, D, 0.05, Y0 - drop, 0.05); add(g, box, iron, s * A.w / 2, Y0 / 2, 0.0, 0.05, Y0, 0.05); } out.parts.push('awning'); }")
    open(M,'w').write(s)
print(840, [a['wall'] for a in C['awnings']])
