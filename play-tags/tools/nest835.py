# #835: root-absolute /img/play -> BASE_URL prefix (fix 404s under /play/). Idempotent.
import json,re
P="(import.meta.env.BASE_URL || '/') + '"
for f in ['frames','shafts357','eagleBrass354','wallTitles354','groupLabels354']:
    F='src/%s.js'%f; s=open(F).read(); s=s.replace("= '/img/play/","= "+P+"img/play/").replace("FV = '/img/play/","FV = "+P+"img/play/"); open(F,'w').write(s)
F='src/testimap.js'; s=open(F).read(); s=s.replace("i.src = '/img/play/preview-251/testimap/'","i.src = BASE + 'img/play/preview-251/testimap/'"); open(F,'w').write(s)
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (834,835)
T['nest'].update(issue=835,prev=834); T['note835']='Root-absolute /img/play asset paths -> BASE_URL prefix (frames, frames-variants, light-shafts, eagle-brass, wall-titles-354, group-labels, testimap) to fix 404s under tjm.art/play'
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print('ok')
