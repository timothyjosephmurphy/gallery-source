# #855: TJ-approved fountain + mosaic courtyard floor (Fountain Courtyard SW). Asserts tip 854. Idempotent.
import json, os, shutil
F='src/catalog.json'
if not os.path.exists('/tmp/catalog.json.854'): shutil.copy(F,'/tmp/catalog.json.854')
c=json.load(open(F)); N=c['layout']['tags']['nest']; assert N['issue'] in (854,855), N
N.update(issue=855,prev=854)
N['note855']='Fountain Courtyard SW: fountainIstanbul811 procedural fountain replaced by fountain-ottoman GLB (CDN play/preview-251/fountain-811/, lod1 + phone Iznik band on coarse; same spot, basin r 1.35 collider unchanged; procedural fallback; GLB spouts replace jets) + mosaic floor overlay (CDN play/preview-251/mosaic-floor/, 1 tile = 1.25 m). Walls, hangs, Bosphorus vista, Paul court items untouched. Soft holds, brass, plaques untouched. Keeps 851-854.'
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(N['note855'][:60])
