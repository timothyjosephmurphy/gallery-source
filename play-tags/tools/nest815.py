# #815 (TJ Oct 28 2026 SM): tour stop 4 = Bitcoiners (room-10, Maeve clips 08/09 remapped back in), The Big Corners (room-02, clips 10/11) dropped.
# Keeps #814 (holos off, lead at once, no Catherine, far LOD). Idempotent; asserts nest 814 or 815; backs up once to /tmp/*.814.
import json, os, shutil
F='src/catalog.json'; M='src/tour-manifest.json'
for s,d in ((F,'/tmp/catalog.json.814'),('deploy/execute.js','/tmp/execute.js.814'),(M,'/tmp/tour-manifest.json.814'),('src/tour.js','/tmp/tour.js.814'),('tests/touraudit814.mjs','/tmp/touraudit814.mjs.814')):
    if not os.path.exists(d): shutil.copy(s,d)
assert 'index-Ck1GdsHN.js' in open('/tmp/execute.js.814').read(), 'rollback backup is not #814'
c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (814,815), T['nest']
assert any(r['id']=='room-10' and r['label']=='Bitcoiners' for r in T['rooms'])
T['nest'].update(issue=815,prev=814,tour815=['room-11 Rainier','room-05 Mom and Dad','room-08 El Salvador (pause)','room-10 Bitcoiners','room-07 Portraits','kinoteka'],note815='#815 Bitcoiners (room-10, clips 08/09) replaces Big Corners (room-02, clips 10/11); #814 holos-off/lead-at-once kept')
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
m=json.load(open(M)); C={x['order']:x for x in m['clips']}
for o,s in ((8,7),(9,8)): C[o]['seq']=s; C[o].pop('skip814',None)
for o,s in ((10,107),(11,108)): C[o]['seq']=s; C[o]['skip814']=True
m.pop('route814',None) if False else None
m['route815']={'order':['Rainier (room-11)','Mom and Dad (room-05)','El Salvador (room-08, pause)','Bitcoiners (room-10)','Portraits (room-07)','Kinoteka'],'dropped':[4,5,10,11]}
open(M,'w').write(json.dumps(m,ensure_ascii=False,indent=1))
t=open('src/tour.js').read()
t=t.replace("route Rainier, Mom&Dad, El Salvador, Big Corners, Portraits, Kinoteka; Catherine/room-10 clips skipped","route Rainier, Mom&Dad, El Salvador, Bitcoiners (#815 room-10), Portraits, Kinoteka; Catherine + Big Corners clips skipped")
t=t.replace("/* #814 off-route */ 9:","/* #815 stop 4 Bitcoiners room-10 */ 9:").replace("  11: { spots: [[0.03, 'Brekkie","  /* #815 off-route */ 11: { spots: [[0.03, 'Brekkie")
open('src/tour.js','w').write(t)
a=open('tests/touraudit814.mjs').read().replace("{ 3: 4, 13: 4, 16: 4, 11: 4, 7: 4 }; // #814 route","{ 3: 4, 13: 4, 16: 4, 9: 4, 7: 4 }; // #815 route").replace("[3, 13, 16, 11, 7].every","[3, 13, 16, 9, 7].every")
open('tests/touraudit815.mjs','w').write(a)
print(815,T['nest'])
