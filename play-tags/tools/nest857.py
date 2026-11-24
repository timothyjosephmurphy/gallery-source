# #857: Cascades mountain bands cut where the fountain Bosphorus skyline sits. Asserts tip 856. Idempotent.
import json, os, shutil
F='src/catalog.json'
if not os.path.exists('/tmp/catalog.json.856'): shutil.copy(F,'/tmp/catalog.json.856')
c=json.load(open(F)); N=c['layout']['tags']['nest']; assert N['issue'] in (856,857), N
N.update(issue=857,prev=856)
N['note857']='Cascades mountain bands (horizon352 distant + mid-valley, day and night) now have a gap over the fountain-sw Bosphorus skyline arc (vista811 arc projected onto each band, +/-4 deg pad), so the night sky shows clean above Istanbul instead of hills stacking over it. Cascades stay everywhere else. No new art. Soft holds, plaques untouched. Keeps 851-856.'
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(N['note857'][:60])
