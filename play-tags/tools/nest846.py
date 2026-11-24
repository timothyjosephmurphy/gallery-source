# #846 TJ walk: TJ Forest 304 left white margin cropped (~30px of 1369 master); true height 0.762 m kept
import json,os
from PIL import Image
ID='older-work-forest-triptych-original-3'; CROP=30; H=0.762
M='/workspace/vm-540/static/display/older-work-forest-triptych-3.jpg'
im=Image.open(M).convert('RGB'); W0,H0=im.size; assert (W0,H0)==(1369,6088)
c=im.crop((CROP,0,W0,H0)); nw,nh=c.size
px={}
for L in (480,960):
    p=f'public/art/older-work-forest-triptych-3-846-{L}.webp'
    r=c.resize((round(nw*L/nh),L),Image.LANCZOS); r.save(p,'WEBP',quality=88,method=6); px[L]=r.size
w=round(H*nw/nh,4); assert w<=0.1969  # 7.75 in true width cap
IMG='art/older-work-forest-triptych-3-846-480.webp'; HI='art/older-work-forest-triptych-3-846-960.webp'
NOTE='#846: left white margin cropped (~30px of 1369 master).'
F='src/hang-overrides.json'; h=json.load(open(F)); E=[e for e in h['assets'] if e.get('id')==ID]; assert len(E)==1
E[0].update(img='art/older-work-forest-triptych-3-846-480.webp',hi='art/older-work-forest-triptych-3-846-960.webp',w=w,h=H,note846=NOTE)
open(F,'w').write(json.dumps(h,ensure_ascii=False,indent=1))
F='src/catalog.json'; c2=json.load(open(F)); T=c2['layout']['tags']; N=T['nest']; assert N['issue'] in (845,846),N
n=0
def walk(o):
    global n
    if isinstance(o,dict):
        if o.get('id')==ID and 'w' in o and 'h' in o:
            fw=o.get('fw'); d=(fw-o['w']) if fw else None
            o['w']=w; o['h']=H
            if 'iw' in o: o['iw']=w; o['ih']=H
            if 'img' in o: o['img']=IMG; o['hi']=HI
            if d is not None: o['fw']=round(w+d,4)
            n+=1
        for v in o.values(): walk(v)
    elif isinstance(o,list):
        for v in o: walk(v)
walk(c2); assert n>=1
N['note846']='TJ walk: '+NOTE+f' TJ Forest 304 now {w}x{H} m, art/older-work-forest-triptych-3-846-480/960.webp'
N.update(issue=846,prev=845)
open(F,'w').write(json.dumps(c2,ensure_ascii=False,separators=(',',':')))
F='tools/realdims.json'; rd=json.load(open(F))
if ID in rd: rd[ID].update(px=list(px[480]),hiPx=list(px[960])); open(F,'w').write(json.dumps(rd))
print(846,CROP,(nw,nh),w,H,px,n)
