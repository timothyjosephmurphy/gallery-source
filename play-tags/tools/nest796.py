# #796 guidebot pack: wing-held 3D signs (checkoutrun.js override), flip grounded ostrich, lead beep fix. Idempotent; asserts nest 795/796.
import json
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (795,796), T['nest']
T['nest'].update(issue=796,prev=795,guidebot796='wingSigns+flipGrounded+leadBeeps')
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(T['nest']['issue'])
