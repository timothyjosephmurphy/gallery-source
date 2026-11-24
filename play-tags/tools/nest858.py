# #858: soft-blend the Bosphorus/Cascades edges (no hard cut). Asserts tip 857. Idempotent.
import json, os, shutil
F='src/catalog.json'
if not os.path.exists('/tmp/catalog.json.857'): shutil.copy(F,'/tmp/catalog.json.857')
c=json.load(open(F)); N=c['layout']['tags']['nest']; assert N['issue'] in (857,858), N
N.update(issue=858,prev=857)
N['note858']='Cascades bands are full circles again with a soft alpha fade (day and night) over the Bosphorus skyline sector: gone in the middle, ramping in over about 14 degrees at each edge, no vertical cliff. Bosphorus vista edges (left, right, top) fade into the sky. No new art. Soft holds, plaques untouched. Keeps 851-857.'
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(N['note858'][:60])
