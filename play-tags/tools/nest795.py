# #795 START roadster thrusters + look-to-flyaway (src/roadster795.js). Idempotent; asserts nest 790/795.
import json
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (790,795), T['nest']
T['nest'].update(issue=795,prev=790,roadster795='thrusters+lookFlyaway')
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(T['nest']['issue'])
