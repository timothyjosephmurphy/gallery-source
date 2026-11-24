#!/usr/bin/env python3
"""Neural Dance pose stickers (#478 / #307). Deterministic, procedural silhouettes."""
import json, math, random
from PIL import Image, ImageDraw, ImageFilter
random.seed(307)
FILL=(42,36,48,255); CREAM=(250,240,222,255); WHITE=(255,255,255,255); PAPER=(243,230,216,255)
S=4  # supersample
# joints in unit coords (x right, y down), figure ~1.0 tall
def P(**k): return k
POSES={
 "idle-sway":dict(h=(0,-.42),n=(0,-.32),hip=(.02,.05),le=(-.12,-.15),lh=(-.14,.02),re=(.12,-.15),rh=(.15,.02),lk=(-.06,.27),lf=(-.08,.5),rk=(.08,.27),rf=(.1,.5)),
 "arms-up":dict(h=(0,-.4),n=(0,-.3),hip=(0,.06),le=(-.12,-.45),lh=(-.16,-.62),re=(.12,-.45),rh=(.16,-.62),lk=(-.07,.28),lf=(-.09,.5),rk=(.07,.28),rf=(.09,.5)),
 "spin":dict(h=(.03,-.4),n=(.02,-.3),hip=(0,.06),le=(-.2,-.3),lh=(-.38,-.36),re=(.2,-.25),rh=(.36,-.18),lk=(-.02,.28),lf=(0,.5),rk=(.14,.22),rf=(.05,.32)),
 "kick":dict(h=(-.08,-.38),n=(-.06,-.28),hip=(0,.06),le=(-.22,-.3),lh=(-.3,-.45),re=(.08,-.18),rh=(.2,-.25),lk=(-.04,.28),lf=(-.06,.5),rk=(.2,.0),rf=(.42,-.08)),
 "crouch":dict(h=(.02,-.12),n=(.02,-.02),hip=(0,.25),le=(-.14,.08),lh=(-.22,.2),re=(.16,.04),rh=(.3,-.05),lk=(-.2,.3),lf=(-.18,.5),rk=(.18,.32),rf=(.16,.5)),
 "reach":dict(h=(.1,-.38),n=(.07,-.28),hip=(0,.06),le=(-.06,-.15),lh=(-.15,-.02),re=(.24,-.38),rh=(.4,-.5),lk=(-.1,.28),lf=(-.18,.5),rk=(.06,.28),rf=(.1,.5)),
 "duet-lean-left":dict(h=(-.14,-.36),n=(-.1,-.26),hip=(0,.06),le=(-.28,-.24),lh=(-.42,-.28),re=(.02,-.12),rh=(.1,0),lk=(-.06,.28),lf=(-.1,.5),rk=(.12,.27),rf=(.2,.5)),
 "duet-lean-right":dict(h=(.14,-.36),n=(.1,-.26),hip=(0,.06),le=(-.04,-.12),lh=(-.12,0),re=(.28,-.24),rh=(.42,-.28),lk=(-.12,.27),lf=(-.2,.5),rk=(.06,.28),rf=(.1,.5)),
 "jump":dict(h=(0,-.44),n=(0,-.34),hip=(0,.0),le=(-.18,-.4),lh=(-.3,-.55),re=(.18,-.4),rh=(.3,-.55),lk=(-.18,.16),lf=(-.12,.36),rk=(.18,.16),rf=(.12,.36)),
 "arabesque":dict(h=(-.18,-.3),n=(-.12,-.22),hip=(.02,.06),le=(-.3,-.32),lh=(-.46,-.4),re=(.1,-.25),rh=(.2,-.38),lk=(.0,.28),lf=(.0,.5),rk=(.22,.0),rf=(.44,-.12)),
}
LIMBS=[("n","hip",.09),("n","le",.045),("le","lh",.038),("n","re",.045),("re","rh",.038),("hip","lk",.055),("lk","lf",.045),("hip","rk",.055),("rk","rf",.045)]
def silhouette(j,px):
    xs=[v[0] for v in j.values()]; ys=[v[1] for v in j.values()]
    span=max(max(xs)-min(xs)+.2,max(ys)-min(ys)+.2); sc=px*S/span
    W=int((max(xs)-min(xs)+.2)*sc); H=int((max(ys)-min(ys)+.2)*sc)
    m=Image.new("L",(W,H),0); d=ImageDraw.Draw(m)
    T=lambda p:((p[0]-min(xs)+.1)*sc,(p[1]-min(ys)+.1)*sc)
    for a,b,w in LIMBS:
        A,B=T(j[a]),T(j[b]); r=w*sc/2
        d.line([A,B],fill=255,width=int(2*r))
        for q in(A,B): d.ellipse([q[0]-r,q[1]-r,q[0]+r,q[1]+r],fill=255)
    hx,hy=T(j["h"]); r=.07*sc; d.ellipse([hx-r,hy-r,hx+r,hy+r],fill=255)
    return m
def sticker(name,long_px,border):
    pad=border+4; inner=long_px-2*pad
    m=silhouette(POSES[name],inner)
    b=border*S; W,H=m.size; big=Image.new("L",(W+2*(b+16),H+2*(b+16)),0); big.paste(m,(b+16,b+16))
    dil=big.filter(ImageFilter.MaxFilter(1+2*(b//2)*2 if False else (2*b+1) | 1)) if b<60 else big
    dil=dil.filter(ImageFilter.GaussianBlur(b/3)).point(lambda v:255 if v>60 else 0)
    hl=big.filter(ImageFilter.MaxFilter(2*S+1))
    out=Image.new("RGBA",big.size,(0,0,0,0))
    out.paste(WHITE,mask=dil); out.paste(CREAM,mask=hl); out.paste(FILL,mask=big)
    out=out.crop(out.getbbox())
    w,h=out.size; k=(long_px-8)/max(w,h)
    out=out.resize((max(1,round(w*k)),max(1,round(h*k))),Image.LANCZOS)
    c=Image.new("RGBA",(out.width+8,out.height+8),(0,0,0,0)); c.paste(out,(4,4)); return c
meta=[]
names=list(POSES)
desk=[]
for i,n in enumerate(names,1):
    pid=f"pose-{i:02d}"; d=sticker(n,304,8); p=sticker(n,152,5); desk.append(d)
    d.save(f"poses/{pid}.png"); d.save(f"poses/{pid}.webp",lossless=True)
    p.save(f"poses/{pid}.phone.png"); p.save(f"poses/{pid}.phone.webp",lossless=True)
    hgt=d.height/max(d.size)
    meta.append(dict(id=pid,pose=n,source="procedural",sizes_px=dict(desktop=list(d.size),phone=list(p.size)),
      size_m=round(.12+.06*hgt,3),fill="#2A2430",border_px=dict(desktop=8,phone=5),edge_highlight="#FAF0DE 1px"))
# strip: 8 poses, transparent gaps
st=desk[:8]; H=max(s.height for s in st); gap=12
strip=Image.new("RGBA",(sum(s.width for s in st)+gap*9,H+2*gap),(0,0,0,0)); x=gap
for s in st: strip.paste(s,(x,gap+(H-s.height)//2),s); x+=s.width+gap
strip.save("strip-sheet.png"); strip.save("strip-sheet.webp",lossless=True)
# atlas 5x2, 320 cells
C=320; atl=Image.new("RGBA",(5*C,2*C),(0,0,0,0)); frames={}
for i,s in enumerate(desk):
    cx,cy=(i%5)*C,(i//5)*C; ox,oy=cx+(C-s.width)//2,cy+(C-s.height)//2; atl.paste(s,(ox,oy),s)
    frames[meta[i]["id"]]=[ox,oy,s.width,s.height]
atl.save("atlas.webp",lossless=True)
pv=Image.new("RGBA",(max(atl.width,strip.width)+40,atl.height+strip.height+60),PAPER)
pv.alpha_composite(atl,(20,20)); pv.alpha_composite(strip,(20,atl.height+40)); pv.convert("RGB").save("preview.png")
json.dump(dict(issue="studio-tracker#478 for #307",dest_hint="/img/play/preview-251/sticker306/neural/",
  replaces="play-tags/public/sticker306/*.webp (placeholders kept until Gallery chooses)",
  strip=dict(file="strip-sheet.webp",size=list(strip.size),poses=[m["id"] for m in meta[:8]],background="transparent"),
  atlas=dict(file="atlas.webp",grid="5x2",cell=C,frames=frames),stickers=meta),open("stickers.json","w"),indent=1)
print("ok",strip.size)
