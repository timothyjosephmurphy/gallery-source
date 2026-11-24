#!/usr/bin/env python3
"""Night companions for Gallery #352 dawn horizon plates (studio-tracker #358).
Reuses dawn alpha silhouettes (identical framing/seams), regrades to PNW night. Seed 358.
Run from horizon/: python3 night/make-night.py"""
import numpy as np, json, os
from PIL import Image
H=os.path.dirname(os.path.abspath(__file__)); D=os.path.dirname(H); rng=np.random.default_rng(358)
def hx(h): return np.array([int(h[i:i+2],16) for i in (1,3,5)],float)
def night(name, dark, light, rim, lights):
    a=np.asarray(Image.open(f"{D}/horizon-{name}.png").convert("RGBA")).astype(float)
    lum=(a[...,:3]@[.299,.587,.114])/255.
    t=np.clip((lum-lum[a[...,3]>10].min())/(np.ptp(lum[a[...,3]>10])+1e-6),0,1)[...,None]
    rgb=dark+(light-dark)*t**1.2
    al=a[...,3]/255.
    # moonlit rim on ridgeline: alpha edge from above
    up=np.roll(al,4,axis=0); edge=np.clip(al-up,0,1)[...,None]
    rgb=rgb+(rim-rgb)*edge*.55
    h,w=al.shape
    if lights:  # subtle warm valley-floor windows, seamless (wrap x)
        glow=np.zeros((h,w))
        ys=rng.integers(int(h*.72),h-6,220); xs=rng.integers(0,w,220)
        ys=ys[al[ys,xs]>.95]; xs=xs[:len(ys)] if False else xs[al[ys if len(ys)==220 else ys,xs[:len(ys)]]>-1][:len(ys)]
        yy,xx=np.mgrid[-6:7,-6:7]; k=np.exp(-(xx**2+yy**2)/5.)
        for y,x in zip(ys,xs):
            for dy in range(13):
                r=(y-6+dy)
                if 0<=r<h: glow[r,(np.arange(x-6,x+7))%w]+=k[dy]*rng.uniform(.4,1)
        glow=np.clip(glow,0,1)[...,None]
        rgb=rgb+(hx('#F7A66E')-rgb)*glow*.6
    out=np.dstack([np.clip(rgb,0,255),a[...,3]]).astype(np.uint8)
    im=Image.fromarray(out,"RGBA"); base=f"{H}/horizon-{name}.night"
    im.save(base+".png"); im.save(base+".webp",quality=88)
    im.resize((w//2,h//2),Image.LANCZOS).save(base+".phone.webp",quality=85)
    return im
def sky(w=2048,h=1024):
    y=np.linspace(0,1,h)[:,None,None]
    stops=[(0,'#0E0F2A'),(.55,'#1F2150'),(.85,'#3A3A6E'),(.95,'#6E4F78'),(1,'#B07A6A')]  # indigo→faint apricot residual
    c=np.zeros((h,1,3))
    for (p0,c0),(p1,c1) in zip(stops,stops[1:]):
        m=(y>=p0)&(y<=p1); f=(y-p0)/(p1-p0); c=np.where(m,hx(c0)+(hx(c1)-hx(c0))*f,c)
    img=np.repeat(c,w,1)
    n=140; sy=(rng.beta(1,2.2,n)*h*.8).astype(int); sx=rng.integers(0,w,n)
    for y,x in zip(sy,sx):
        b=rng.uniform(.35,1)*(1-y/h); r=1 if rng.random()<.85 else 2
        for dy in range(-r,r+1):
            for dx in range(-r,r+1):
                f=b*np.exp(-(dx*dx+dy*dy)/(.6*r)); yy=y+dy
                if 0<=yy<h: img[yy,(x+dx)%w]+= (hx('#EDEBFF')-img[yy,(x+dx)%w])*f
    im=Image.fromarray(np.clip(img,0,255).astype(np.uint8))
    im.save(f"{H}/sky-night.png"); im.save(f"{H}/sky-night.webp",quality=88)
    im.resize((1024,512),Image.LANCZOS).save(f"{H}/sky-night.phone.webp",quality=85); return im
dr=night("distant-range",hx('#1C1E3E'),hx('#4A4A7E'),hx('#A9B4E0'),False)
mv=night("mid-valley",hx('#0F1A22'),hx('#2C3E4E'),hx('#6F86A8'),True)
sk=sky()
for nm,lay in (("distant-range",dr),("mid-valley",mv)):
    bg=sk.resize(lay.size).convert("RGBA"); bg.alpha_composite(lay); bg.convert("RGB").save(f"{H}/horizon-{nm}.night_baked.webp",quality=86)
# preview: dawn (left) vs night (right), each layers over sky
def comp(skyim,a,b):
    c=skyim.resize((2048,512)).convert("RGBA"); c.alpha_composite(a); c.alpha_composite(b); return c.convert("RGB")
dawnsky=Image.open(f"{D}/horizon-distant-range_baked.webp").convert("RGB")
# dawn sky sample = top row colors of baked stretched (approx)
dawnc=comp(Image.fromarray(np.repeat(np.asarray(dawnsky)[:,:1],2048,1)), Image.open(f"{D}/horizon-distant-range.png").convert("RGBA"), Image.open(f"{D}/horizon-mid-valley.png").convert("RGBA"))
nightc=comp(sk.crop((0,512,2048,1024)),dr,mv)
p=Image.new("RGB",(2048,1040),"black"); p.paste(dawnc,(0,0)); p.paste(nightc,(0,528)); p.save(f"{H}/preview.png")
json.dump({"ticket":"studio-tracker #358 (night companions to Gallery #352)","swap":{"rule":"sunElevationDeg < -6 → night; -6..+2 → crossfade dawn↔night by t=(2-elev)/8; > 2 → dawn","note":"same size/alpha/UV/order as horizon.json; swap texture URLs only"},
 "sky":{"desktop":"night/sky-night.webp","phone":"night/sky-night.phone.webp","master":"night/sky-night.png","size":[2048,1024],"wrapS":"RepeatWrapping","horizonRow":"bottom edge = horizon"},
 "layers":[{"name":n,"desktop":f"night/horizon-{n}.night.webp","phone":f"night/horizon-{n}.night.phone.webp","master":f"night/horizon-{n}.night.png","baked":f"night/horizon-{n}.night_baked.webp","replaces":f"horizon-{n}.webp","order":o} for n,o in (("distant-range",0),("mid-valley",1))]},open(f"{H}/night.json","w"),indent=1)
