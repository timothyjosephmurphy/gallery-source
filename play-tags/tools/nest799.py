# #799 (TJ Oct 27 2026): welcome hologram -> TJ-approved IMG_1853 (img.tjm.art/play/tour/299/, 20.53 s). Idempotent; asserts 798/799.
import json
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (798,799), T['nest']
T['nest'].update(issue=799,prev=798,welcome799=dict(base='https://img.tjm.art/play/tour/299/',video='holo_welcome_v2-cropped.mp4',still='still_welcome_v2-cropped.jpg',dur_s=20.53,src='IMG_1853.MOV'))
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(799)
