# #810 (TJ Oct 28 2026; refs gallery-handoff/berlin-es-court-refs-2026-10-28): Bitcoin Courtyard (courtyard-btc) remodelled after the real
# Berlin, El Salvador court (src/berlinCourt810.js). Absorbs the Berlin-ES mural skew fix: the mural texture is now the rectified, frontal
# sign (art/berlin-es-sign-810.webp, cropped + perspective-corrected from TJ's photo 01), true sign size ~3.05 x 0.87 m, resting on the
# block row (bottom 0.62 m) with its plane parallel to and 0.20 m off the wall line (was 0.14 m, a skewed hero photo + #790 painted wall).
# #790 blend retired on this wall (blend790 removed; module kept, no-op). Steeples #784 shifted aside so the mountain vista reads.
# Catalog only; no hang changes elsewhere. Idempotent; asserts prev nest 809 (Maeve tour) or 810. Backs up catalog + deploy/execute.js once.
import json, os, shutil, math
F='src/catalog.json'
if not os.path.exists('/tmp/catalog.json.809'): shutil.copy(F,'/tmp/catalog.json.809')
if not os.path.exists('/tmp/execute.js.809'): shutil.copy('deploy/execute.js','/tmp/execute.js.809')
assert os.path.exists('public/art/berlin-es-sign-810.webp'), 'sign texture missing'
c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (809,810), T['nest']
oc=next(o for o in T['openCourts'] if o['id']=='courtyard-btc'); w=oc['walls'][0]; assert w['id']=='courtyard-btc-outer-wall'
w.pop('blend790',None)
w['court810']=dict(hoopU=-4.6,hoopV=1.25,gateU=-6.9,windowU=-2.6,smallWinU=0.4,pipeU=3.9,goalU=5.7,ballU=2.1,ballV=1.9,blocks=8,blockH=0.52,sidewalk=1.05,sidewalkHalf=7.4,sideline=1.15,buildingH=4.25,depth=6.5,mountainBack=5,sign='berlin-el-salvador-mural')
w['steeples810']=dict(along=-13,back=8,scale=0.8)
mx,mz=(w['x0']+w['x1'])/2,(w['z0']+w['z1'])/2; d=0.17  # +0.03 world offset -> 0.20 m off the wall line, in front of the 0.09 facade
def find(o):
  if isinstance(o,dict):
    if o.get('id')=='berlin-el-salvador-mural' and o.get('kind')=='mural': yield o
    for v in o.values(): yield from find(v)
  elif isinstance(o,list):
    for v in o: yield from find(v)
ms=list(find(c)); assert ms, 'mural not found'
for m in ms:
  m.update(tex='art/berlin-es-sign-810.webp',w=3.05,h=0.87,y=1.055,x=round(mx+w['nx']*d,3),z=round(mz+w['nz']*d,3),wallFacing=[w['nx'],w['nz']],
    sizeSource='#810: rectified sign from TJ ref 01 (2048x584, aspect 3.507); scaled from ref 02 (TJ ~1.75 m): sign ~3.05 x 0.87 m on 0.52 m blocks',
    movedBy='#810 sign rests on the block row (bottom 0.62 m incl. 0.10 sidewalk), plane flush/parallel to the btc outer wall (skew fix)')
oc['note']=oc.get('note','').split(' | #810')[0]+' | #810 remodel after real Berlin, El Salvador court: concrete court, hoop, white building, blocks + sign, goal, mountain'
T['nest'].update(issue=810,prev=809,court810=dict(court='courtyard-btc',module='src/berlinCourt810.js',signTex='art/berlin-es-sign-810.webp',skewFix='rectified frontal sign, plane parallel to wall @0.20 m, blend790 retired',refs='berlin-es-court-refs-2026-10-28/01-07'))
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(810,len(ms),T['nest']['court810'])
