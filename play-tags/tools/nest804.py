# #804 (TJ Oct 27 2026): phone memory hotfix (Aw Snap). gallery-core: touch base wall-tex LRU 40 + <=1024 px shrink, touch Low unless ?q=,
# webglcontextlost texture counter (window.__texLost); kino800.js: leaving releases both videos. Idempotent; asserts 803/804.
import json
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (803,804), T['nest']
T['nest'].update(issue=804, prev=803, mem804={'1':'touch base wall-tex LRU 40','2':'touch wall tex <=1024 px','3':'touch Low unless ?q=','5':'kino800 leave releases video','4':'skipped'})
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(804)
