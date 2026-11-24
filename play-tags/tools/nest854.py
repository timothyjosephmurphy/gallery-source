# #854: Cascades START courtyard asset pack (#352 horizon plates + court-tree GLBs + steeple-tower GLBs). Asserts tip 853. Idempotent.
import json, os, shutil
F='src/catalog.json'
if not os.path.exists('/tmp/catalog.json.853'): shutil.copy(F,'/tmp/catalog.json.853')
c=json.load(open(F)); N=c['layout']['tags']['nest']; assert N['issue'] in (853,854), N
N.update(issue=854,prev=853)
N['note854']='Cascades START courtyard: #352 horizon plates replaced in R2 (same filenames, painted Cascades distant range + mid valley); berlinCourt810 icosa crowns replaced by court-tree GLBs (CDN play/preview-251/court-trees/, lod0 desktop / lod1 coarse, icosa fallback); steeples784 towers replaced by steeple-tower GLBs (CDN play/preview-251/steeples-784/, procedural fallback). Soft holds, brass, plaques untouched; fountain/mosaic pack still on hold. Keeps 851 + 852 Bosphorus vista + pines + 853 revert.'
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(N['note854'][:80])
