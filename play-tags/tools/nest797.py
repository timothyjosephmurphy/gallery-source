# #797 START roadster new white procedural body. Idempotent; asserts nest 796/797.
import json
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (796,797), T['nest']
T['nest'].update(issue=797,prev=796,roadster797='newWhiteProcedural')
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(T['nest']['issue'])
