# #853: TJ revert of characters-199 elf+broom+dustpan GLBs (nest 850) back to procedural pre-850. Asserts tip 852. Idempotent.
import json, os, shutil
F='src/catalog.json'
if not os.path.exists('/tmp/catalog.json.852'): shutil.copy(F,'/tmp/catalog.json.852')
c=json.load(open(F)); N=c['layout']['tags']['nest']; assert N['issue'] in (852,853), N
N.update(issue=853,prev=852)
N['note853']='TJ revert: characters-199 elf + broom + dustpan GLBs (nest 850) removed from hex elves/omens; procedural makeElf rig and sweeper broom+pan restored as pre-850 (CDN keys left in R2, no longer loaded). Keeps 851 Buy Scanner beep + softer recoil + arch doorTrim and 852 Bosphorus vista + pine GLBs. Soft holds, brass, plaques untouched.'
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(N['note853'][:80])
