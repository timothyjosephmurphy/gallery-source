# #851: batch-two walk fixes (Buy Scanner soft recoil + reliable beep; doorTrim rings hug elliptical full-width arches). Asserts tip 850. Idempotent.
import json, os, shutil
F='src/catalog.json'
if not os.path.exists('/tmp/catalog.json.850'): shutil.copy(F,'/tmp/catalog.json.850')
c=json.load(open(F)); N=c['layout']['tags']['nest']; assert N['issue'] in (850,851), N
N.update(issue=851,prev=850)
N['note851']='Buy Scanner: recoil 1 -> 0.28 (soup/grav unchanged); scanBeep resumes a suspended AudioContext on the click path, gain 0.035 -> 0.06, and also beeps on a miss (AIM AT A PAINTING) so every scan is audible; respects holo.muted; cart/prices/shop untouched. Spurious lines above courtyard arches: courtyard296 orange/blue doorTrim rings were circular (radius w2) on #777/#782 elliptical full-width doors, so they arced metres above the wall into the sky; ring.scale.y = rise/w2 now hugs the arch. BRASS_HOLD_829 untouched.'
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(N['note851'][:80])
