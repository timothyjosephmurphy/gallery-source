# #825 = tracker #785 on LIVE #824 (a2665316 / index-DjKR3-P5.js): wing signs only (no HTML gbMenu, bigger signs), Ask for guidance opens
# the say-what-you-want guide prompt, advice escort (src/advice785.js) along walls in locked caption order. Idempotent; backups /tmp/*.824.
import json
assert 'index-DjKR3-P5.js' in open('/tmp/execute.js.824').read(), 'rollback backup is not #824'
for f,k in (('src/museum-eggs/eggs/checkoutrun.js',"menu.style.display = 'none'; /* #825"),('src/tags.js','installAdvice785({ game, W })'),('src/tags.js','window.__gbMenu = true')): assert k in open(f).read(), (f,k)
F='src/catalog.json'; c=json.load(open(F)); n=c['layout']['tags']['nest']; assert n['issue'] in (824,825), n
n['issue']=825; n['prev']=824; n['note825']='tracker #785: guide-bot wing signs only (HTML gbMenu hidden, signs 0.86x0.33); Ask for guidance opens guide prompt (say/type what you want; ride/tour words -> ride); art/advice asks -> sequential wall escort with locked 269 captions (+Maeve VO from img.tjm.art/play/tour/advice-maeve-1/ when manifest live)'
json.dump(c,open(F,'w'),ensure_ascii=False,indent=1); print('nest825 ok')
