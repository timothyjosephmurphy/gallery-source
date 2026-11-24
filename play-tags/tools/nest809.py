# #809 (TJ Oct 28 2026, #755 B5): guided tour remeshed to Music's Maeve VO pack (img.tjm.art/play/tour/maeve/, 16 clips, short CCW 7 stops ->
# open plaza -> Kinoteka); far-blank fix = tour pins current+next stop base textures (gallery-core #804 LRU honours p.tourPin, tour-on only).
# Catalog: nest marker only (no hang/size changes). Idempotent; asserts 808/809. Backs up catalog + deploy/execute.js once.
import json, os, shutil
F='src/catalog.json'
if not os.path.exists('/tmp/catalog.json.808'): shutil.copy(F,'/tmp/catalog.json.808')
if not os.path.exists('/tmp/execute.js.808'): shutil.copy('deploy/execute.js','/tmp/execute.js.808')
c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (808,809), T['nest']
M=json.load(open('src/tour-manifest.json')); assert len(M['clips'])==16 and 'maeve' in M['base_url']
T['nest'].update(issue=809,prev=808,tour809=dict(tracker=755,voice='Maeve',clips=16,stops=7,route='short CCW: start,room-06,room-07,room-10,room-02,room-05,kinoteka',farBlank='tourPin current+next stop'))
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(809,T['nest']['tour809'])
