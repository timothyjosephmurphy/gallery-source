# #814 (TJ Oct 28 2026): walk fixes. Far-blank LOD (phone BASE_MAX 56, protect 19 m, 96px farStub, in-front promote), holograms parked OFF
# (room + guitar; ?holos=1 re-enables), Maeve tour remesh (Rainier, Mom&Dad, El Salvador pause, Big Corners, Portraits, Kinoteka; no Catherine; immediate lead).
# Idempotent; asserts prev nest 813 or 814. Backs up catalog + deploy/execute.js once to /tmp/*.813.
import json, os, shutil
F='src/catalog.json'
if not os.path.exists('/tmp/catalog.json.813'): shutil.copy(F,'/tmp/catalog.json.813')
if not os.path.exists('/tmp/execute.js.813'): shutil.copy('deploy/execute.js','/tmp/execute.js.813')
assert 'index-CXB7Gswr.js' in open('/tmp/execute.js.813').read(), 'rollback backup is not #813'
c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (813,814), T['nest']
T['nest'].update(issue=814,prev=813,lod814={'baseMaxTouch':56,'protectM':19,'farStubPx':96,'placeholder':'0x9a8c74'},holos814='off (?holos=1)',tour814=['room-11 Rainier','room-05 Mom and Dad','room-08 El Salvador (pause)','room-02 Big Corners','room-07 Portraits','kinoteka'],note814='#814 far paintings stay textured; holos parked off; Maeve tour remesh, no Catherine, bot leads at once')
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(814,T['nest']['issue'],T['nest']['prev'])
