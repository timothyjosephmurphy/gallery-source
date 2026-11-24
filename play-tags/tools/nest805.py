# #805 B4 (TJ Oct 27 2026 ~11:55 PM PT): exhibitions-349 approved as drafted; exhibition + mural pins on the collectors world map
# (testimap.js), legend, cards with cardLine, escort only when room set. Idempotent; asserts 804/805.
import json
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (804,805), T['nest']
T['nest'].update(issue=805, prev=804, b4map805={'data':'exhibitions-349 approved:true','pins':'collector + exhibition + mural','escort':'room set only; null = card-only'})
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(805)
