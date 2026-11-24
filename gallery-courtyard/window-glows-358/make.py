#!/usr/bin/env python3
"""#358 window glow sprites. Procedural only. RGBA, premultiply-safe, additive."""
import json, numpy as np
from PIL import Image, ImageFilter, ImageDraw
CORE=np.array([255,214,160])/255; MID=np.array([247,166,110])/255; EDGE=np.array([200,100,78])/255
def sdf_mask(kind,W,H):
    m=Image.new("L",(W,H),0); d=ImageDraw.Draw(m)
    x0,y0,x1,y1=int(W*.22),int(H*.18),int(W*.78),int(H*.82)
    if kind=="arched":
        r=(x1-x0)//2; d.rectangle([x0,y0+r,x1,y1],fill=255); d.ellipse([x0,y0,x1,y0+2*r],fill=255)
    else: d.rectangle([x0,y0,x1,y1],fill=255)
    pane=np.array(m,float)/255
    if kind=="mullion":
        mu=Image.new("L",(W,H),0); dm=ImageDraw.Draw(mu); t=max(2,W//60)
        cx=(x0+x1)//2; dm.rectangle([cx-t,y0,cx+t,y1],fill=255)
        for f in (1/3,2/3): y=int(y0+(y1-y0)*f); dm.rectangle([x0,y-t,x1,y+t],fill=255)
        mu=np.array(mu.filter(ImageFilter.GaussianBlur(t*.6)),float)/255
        pane*=1-.75*mu
    return pane,(x0,y0,x1,y1)
def curtain(W,H,box):
    x0,y0,x1,y1=box; yy,xx=np.mgrid[0:H,0:W]; w=(x1-x0)*.22
    # two soft drapes with gentle sway, plus folds
    l=np.clip((x0+w+np.sin(yy/H*6)*w*.15-xx)/(w*.3),0,1)
    r=np.clip((xx-(x1-w-np.sin(yy/H*6+1)*w*.15))/(w*.3),0,1)
    folds=.85+.15*np.sin(xx/W*90)
    return 1-.45*np.maximum(l,r)*folds
def make(kind,W,H,curt=False):
    pane,box=sdf_mask(kind,W,H)
    yy,xx=np.mgrid[0:H,0:W]; cx,cy=(box[0]+box[2])/2,(box[1]+box[3])*.52
    rad=np.sqrt(((xx-cx)/(box[2]-box[0]))**2+((yy-cy)/(box[3]-box[1]))**2)
    inner=np.clip(1-rad*1.1,0,1)  # warm hotspot toward centre
    if curt: pane=pane*curtain(W,H,box)
    bloom=np.array(Image.fromarray((pane*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(W*.06)),float)/255
    soft=np.array(Image.fromarray((pane*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(W*.012)),float)/255
    a=np.clip(soft*(.55+.4*inner)+bloom*.35,0,1)
    t=np.clip(inner*1.3,0,1)[...,None]
    col=MID*(1-t)+CORE*t; col=col*(soft[...,None])+EDGE*(1-soft[...,None])
    rng=np.random.default_rng(358); a*=1+rng.normal(0,.012,a.shape)
    rgba=np.dstack([np.clip(col,0,1)*255,np.clip(a,0,1)*255]).astype(np.uint8)
    return Image.fromarray(rgba,"RGBA")
SIZES={"desktop":(512,768),"phone":(256,384)}
out=[];prev=[]
for kind in ("single","mullion","arched"):
  for curt in (False,True):
    name=f"glow-{kind}"+("-curtain" if curt else "")
    for tier,(W,H) in SIZES.items():
        im=make(kind,W,H,curt); fn=f"{name}.{tier}.webp"
        im.save(fn,"WEBP",quality=90,method=6,exact=True)
        if tier=="desktop": im.save(f"{name}.png"); prev.append((name,im))
    out.append({"id":name,"shape":kind,"curtain":curt,
      "files":{"desktop":f"{name}.desktop.webp","phone":f"{name}.phone.webp","png":f"{name}.png"},
      "emissiveIntensity":1.1 if curt else 1.4,"color":"#F7A66E"})
json.dump({"issue":358,"blend":"additive","depthWrite":False,"premultipliedAlpha":False,
 "toneMapped":False,"nightOnly":{"sunElevationDegMax":-4,"fadeInDeg":[-4,2],"note":"lerp intensity 0->1 as sun goes from +2 to -4 deg"},
 "flicker":{"enabled":True,"amp":0.04,"hz":0.3,"perWindowPhase":"random"},
 "litFraction":0.6,"curtainShare":0.3,"pairsWith":"../horizon/night/night.json","sprites":out},open("glows.json","w"),indent=1)
bg=Image.new("RGBA",(3*300,2*440),(28,30,52,255))
for i,(n,im) in enumerate(prev):
    t=im.resize((256,384)); x,y=(i//2)*300+22,(i%2)*440+28
    bg.alpha_composite(t,(x,y)); ImageDraw.Draw(bg).text((x,y+392),n,fill=(240,230,220,255))
bg.convert("RGB").save("preview.png")
