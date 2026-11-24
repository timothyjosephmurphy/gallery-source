# #813 (TJ Oct 28 2026): Kinoteka BFF'26 film kiosk (src/kinoKiosk813.js + src/kino-bff26.json; kino800 per-film resume). Catalog only records the nest.
# Idempotent; asserts prev nest 812 or 813. Backs up catalog + deploy/execute.js once to /tmp/*.812.
import json, os, shutil
F='src/catalog.json'
if not os.path.exists('/tmp/catalog.json.812'): shutil.copy(F,'/tmp/catalog.json.812')
if not os.path.exists('/tmp/execute.js.812'): shutil.copy('deploy/execute.js','/tmp/execute.js.812')
assert 'index-DXjFbW36.js' in open('/tmp/execute.js.812').read(), 'rollback backup is not #812'
c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (812,813), T['nest']
T['nest'].update(issue=813,prev=812,kiosk813={'films':'src/kino-bff26.json','default':'coined','free':['coined','hummingbird'],'at_local_uv':[-4.75,12.35]},note813='#813 Kinoteka BFF26 film kiosk: 18 cinema titles, free in-gallery (Coined chunks, Hummingbird YT), others link out to IndeeHub; per-film resume')
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(813,T['nest']['issue'],T['nest']['prev'])
