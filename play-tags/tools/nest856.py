# #856: edit mode (?key=) wall hang-index names upper-left + per-wall lock icons (localStorage tjmWallLocks:tags; gravity gun no grab/hang on locked walls). Asserts tip 855. Idempotent.
import json, os, shutil
F='src/catalog.json'
if not os.path.exists('/tmp/catalog.json.855'): shutil.copy(F,'/tmp/catalog.json.855')
c=json.load(open(F)); N=c['layout']['tags']['nest']; assert N['issue'] in (855,856), N
N.update(issue=856,prev=855)
N['note856']='Edit mode (?key=): each hex gallery wall shows its #773 hang-index name (H#-n) upper-left plus a padlock icon; click/aim+click toggles the lock. Locked wall = gravity gun cannot grab from or hang onto it (WALL LOCKED). Locks are client-only in localStorage tjmWallLocks:tags (no layouts Worker writes). ?hangIndex=1 still adds slot labels, ?hangIndex=0 forces off; visitors see nothing. Museums unchanged. Soft holds, brass, plaques untouched. Keeps 851-855.'
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(N['note856'][:60])
