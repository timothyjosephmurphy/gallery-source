#!/usr/bin/env python3
"""#340 theater gobo / beam cookie pack. Pillow only, seed 340. White=pass, black=block. python3 make.py"""
import json, random, os, math
from PIL import Image, ImageDraw, ImageFilter, ImageChops
HERE=os.path.dirname(os.path.abspath(__file__)); S=1024
def circle_mask(soft=40):
    m=Image.new("L",(S,S),0); ImageDraw.Draw(m).ellipse([24,24,S-24,S-24],fill=255)
    return m.filter(ImageFilter.GaussianBlur(soft))
def noise(r,cell):
    n=S//cell+2; im=Image.new("L",(n,n)); im.putdata([r.randint(0,255) for _ in range(n*n)])
    return im.resize((S+cell*2,S+cell*2),Image.BICUBIC).crop((cell,cell,S+cell,S+cell))
def breakup(r):
    a=noise(r,128); b=noise(r,48); c=noise(r,20)
    m=Image.blend(Image.blend(a,b,0.4),c,0.2)
    m=m.point(lambda v:255 if v>132 else 0).filter(ImageFilter.GaussianBlur(9))
    m=m.point(lambda v:min(255,int(v*1.1)))
    return m
def bars(r):
    m=Image.new("L",(S,S),0); d=ImageDraw.Draw(m); n=7; w=S/n
    for i in range(n): d.rectangle([i*w+w*0.22,0,i*w+w*0.78,S],fill=255)
    return m.filter(ImageFilter.GaussianBlur(10))
def dots(r):
    m=Image.new("L",(S,S),0); d=ImageDraw.Draw(m); pts=[]
    while len(pts)<38:
        x,y,rr=r.randint(80,S-80),r.randint(80,S-80),r.randint(14,46)
        if all((x-a)**2+(y-b)**2>(rr+c+30)**2 for a,b,c in pts): pts.append((x,y,rr))
    for x,y,rr in pts: d.ellipse([x-rr,y-rr*r.uniform(.8,1),x+rr,y+rr],fill=r.randint(170,255))
    return m.filter(ImageFilter.GaussianBlur(12))
def venetian(r):
    m=Image.new("L",(S,S)); d=ImageDraw.Draw(m)
    for y in range(S):
        t=(y%80)/80; v=255 if t<0.62 else 0; d.line([0,y,S,y],fill=v)
    m=m.filter(ImageFilter.GaussianBlur(7))
    # slight sag/irregularity
    return m.transform((S,S),Image.AFFINE,(1,0.015,-8,0,1,0),resample=Image.BICUBIC)
def falloff(r):
    m=Image.new("L",(S,S)); px=m.load(); c=S/2
    for y in range(S):
        for x in range(S):
            d=math.hypot(x-c,y-c)/(c-16)
            px[x,y]=0 if d>=1 else int(255*(1-d**2.2)**1.4)
    return m
GEN={"gobo-breakup":breakup,"gobo-bars":bars,"gobo-dots":dots,"gobo-venetian":venetian,"beam-falloff":falloff}
META={"gobo-breakup":{"cone_deg":[24,36],"intensity":0.8,"tint":{"warm":"#F7A66E","cool":"#9DB7CF"},"use":"organic leafy/cloud wash on stage floor and back wall; rotate slowly (2-4 deg/s) for life"},
"gobo-bars":{"cone_deg":[18,30],"intensity":0.9,"tint":{"warm":"#F7CC3A","cool":"#9DB7CF"},"use":"shutter/barn-door bars; rotate 0-90 deg for window/jail looks"},
"gobo-dots":{"cone_deg":[30,45],"intensity":0.6,"tint":{"cool":"#B9A0E0","moon":"#8DB8E8"},"use":"sparse moonlight-through-leaves; pair with low ambient"},
"gobo-venetian":{"cone_deg":[20,32],"intensity":0.75,"tint":{"warm":"#F7A66E","dusk":"#E9A9A6"},"use":"soft horizontal blinds across a back wall or audience"},
"beam-falloff":{"cone_deg":[10,50],"intensity":1.0,"tint":{"neutral":"#F3E6D8"},"use":"base Fresnel/PAR soft edge; multiply every gobo by this (or use alone)"}}
def main():
    r=random.Random(340); ring=circle_mask(); J={"issue":340,"related":[10,180,357],"preview_only":True,"approved":False,
      "convention":"luminance mask: white=pass, black=block; RGBA with RGB=mask and A=mask (use either). Linear-ish, not sRGB-critical.",
      "blend":"multiply","shader_hint":"beamColor *= texture(gobo, projUV).r * texture(beamFalloff, projUV).r; SpotLight.map in three r155+ also accepts it",
      "gobos":[]}
    out={}
    for k,f in GEN.items():
        m=f(r)
        if k!="beam-falloff": m=ImageChops.multiply(m,ring)
        out[k]=m; im=Image.merge("RGBA",(m,m,m,m))
        im.save(f"{HERE}/{k}.png"); im.save(f"{HERE}/{k}.desktop.webp",quality=90)
        im.resize((512,512),Image.LANCZOS).save(f"{HERE}/{k}.phone.webp",quality=88)
        J["gobos"].append({"id":k,"png":f"{k}.png","desktop":f"{k}.desktop.webp","phone":f"{k}.phone.webp","px":[1024,1024],"phone_px":[512,512],"blend":"multiply",
            "suggested_cone_deg":META[k]["cone_deg"],"intensity_hint":META[k]["intensity"],"tint_hex":META[k]["tint"],"use":META[k]["use"]})
    json.dump(J,open(f"{HERE}/gobos.json","w"),indent=2)
    # preview: 5 projections on dark stage
    W,H=1500,620; P=Image.new("RGB",(W,H),(0x14,0x12,0x18)); d=ImageDraw.Draw(P)
    d.rectangle([0,430,W,H],fill=(0x2a,0x22,0x1c))
    tints=[(0xF7,0xA6,0x6E),(0xF7,0xCC,0x3A),(0xB9,0xA0,0xE0),(0xE9,0xA9,0xA6),(0xF3,0xE6,0xD8)]
    for i,k in enumerate(GEN):
        m=out[k].resize((260,260),Image.LANCZOS)
        col=Image.new("RGB",(260,260),tints[i]); lit=Image.new("RGB",(260,260))
        lit=Image.composite(col,Image.new("RGB",(260,260)),m.point(lambda v:int(v*0.85)))
        x=30+i*294; P.paste(ImageChops.add(P.crop((x,90,x+260,350)),lit),(x,90))
        # faint cone
        cone=Image.new("L",(W,H),0); ImageDraw.Draw(cone).polygon([(x+130,0),(x+10,220),(x+250,220)],fill=28)
        P=Image.composite(Image.new("RGB",(W,H),tints[i]),P,cone.filter(ImageFilter.GaussianBlur(20)))
        # warm floor pool
        pool=Image.new("L",(W,H),0); ImageDraw.Draw(pool).ellipse([x+20,450,x+240,520],fill=40)
        P=Image.composite(Image.new("RGB",(W,H),tints[i]),P,pool.filter(ImageFilter.GaussianBlur(14)))
    P.save(f"{HERE}/preview.png")
if __name__=="__main__": main()
