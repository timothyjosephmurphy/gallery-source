# #850: wire #199 characters pack (elf + broom + dustpan only) from CDN characters-199; procedural fallback. Asserts tip 849. Idempotent.
import json, os, shutil
F='src/catalog.json'
for s,d in ((F,'/tmp/catalog.json.849'),('deploy/execute.js','/tmp/execute.js.849b')):
    if not os.path.exists(d): shutil.copy(s,d)
c=json.load(open(F)); N=c['layout']['tags']['nest']; assert N['issue'] in (849,850), N
N.update(issue=850,prev=849)
N['note850']='#199 characters-199: machine elf + broom + dustpan meshopt GLBs (lod0 desktop / lod1 coarse pointer) from https://img.tjm.art/play/preview-251/characters-199/ swapped into makeElf rig (same hooks body/shell/core/cap/arms/legs/orb + halo/face) and sweeper broom/pan (attach 0.16,0.06,0.07 / -0.13,-0.2,0.17; sweeper scale 0.05). Procedural stays until load and on failure. No hang changes; BRASS_HOLD_829 untouched.'
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(N['note850'])
