# #812 (TJ via SM, Oct 28 2026): floor props by ring. Inner ring 1 (01/02/03/07/08/11) = book lecterns; outer ring 2 (04/05/06/09/10/12) = guitar holo plinths.
# Code: src/guitarHolo764.js GUITAR764 rooms; gallery-core/src/main.js TAGS_BOOKS (#elif tags) rooms. Catalog only records the nest.
# Idempotent; asserts prev nest 811 or 812. Backs up catalog + deploy/execute.js once to /tmp/*.811.
import json, os, shutil
F='src/catalog.json'
if not os.path.exists('/tmp/catalog.json.811'): shutil.copy(F,'/tmp/catalog.json.811')
if not os.path.exists('/tmp/execute.js.811'): shutil.copy('deploy/execute.js','/tmp/execute.js.811')
assert 'index-D1W2mU6V.js' in open('/tmp/execute.js.811').read(), 'rollback backup is not #811'
c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (811,812), T['nest']
g={'holo_central_full_v2':['room-02','room-04'],'holo_bass_full_v2':['room-07','room-06'],'holo_irish_full_v2':['room-03','room-09'],'holo_psy':['room-08','room-10']}
bk={'landscapes':['room-01','room-01'],'portraits':['room-11','room-11'],'reflections':['room-05','room-02'],'changing-light':['room-12','room-07']}
T['nest'].update(issue=812,prev=811,guitar812=g,books812=bk,note812='#812 floor props by ring: books inner ring 1, guitar holos outer ring 2 (from->to)')
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(812,T['nest']['issue'],T['nest']['prev'])
