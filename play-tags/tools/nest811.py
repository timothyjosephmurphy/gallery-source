# #811 (TJ via Studio manager, Oct 28 2026): Fountain Courtyard SW -> Istanbul overlook (src/fountainIstanbul811.js): Ottoman tiered fountain
# replaces the #786 round stone fountain (west786 skips it when ist811 is set), low wrought-iron fence (iron811) on the outer fence line +
# Bosphorus vista strip, 3 striped awnings mounted on the Paul hang wall, 2 cafe tables under them (cafe808 free-standing awning retired),
# wooden easel facing the wine table with a duplicate "Father Paul" (room-05 Family hang untouched). Paul hangs unchanged (true sizes).
# Catalog only. Idempotent; asserts prev nest 810 or 811. Backs up catalog + deploy/execute.js once to /tmp/*.810.
import json, os, shutil
F='src/catalog.json'
if not os.path.exists('/tmp/catalog.json.810'): shutil.copy(F,'/tmp/catalog.json.810')
if not os.path.exists('/tmp/execute.js.810'): shutil.copy('deploy/execute.js','/tmp/execute.js.810')
c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (810,811), T['nest']
oc=next(o for o in T['openCourts'] if o['id']=='courtyard-fountain-sw'); assert oc['walls'][0].get('hang808')
assert any(p['id']=='book-art-82127d1886ae57d5cb6e' and p['room']=='room-05' for p in c['paintings']), 'Father Paul not in room-05'
oc.pop('cafe808',None); oc['fences'][0]['iron811']=True
oc['ist811']=dict(awning='#7a2230',awnings=[dict(u=-5.1,w=4.9),dict(u=0,w=4.9),dict(u=5.1,w=4.9)],cafes=[dict(u=4.3,v=1.3),dict(u=-4.3,v=1.3)],
  easel=dict(u=4.3,v=3.6,id='book-art-82127d1886ae57d5cb6e',dup=True),vistaD=60,vistaW=110,horizonY=2.0)
oc['note']=oc.get('note','').split(' | #811')[0]+' | #811 Istanbul overlook: Ottoman fountain, iron fence + Bosphorus vista, wall awnings + cafe, Father Paul easel (copy)'
T['nest'].update(issue=811,prev=810,ist811=dict(court='courtyard-fountain-sw',module='src/fountainIstanbul811.js',fatherPaul='duplicate on easel; room-05 hang kept'))
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(811,T['nest']['ist811'])
