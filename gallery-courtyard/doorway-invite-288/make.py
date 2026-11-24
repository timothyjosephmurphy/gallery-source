#!/usr/bin/env python3
"""#288 inviting doorway textures. Pillow only, seed 288, no text. python3 make.py"""
import json, random, os, math
from PIL import Image, ImageDraw, ImageFilter
HERE=os.path.dirname(os.path.abspath(__file__))
PLASTER=(0xF3,0xE6,0xD8); APRICOT=(0xF7,0xA6,0x6E); OCHRE=(0xF7,0xCC,0x3A); TERRA=(0xC8,0x64,0x4E)
SLATE=(0x5E,0x72,0x89); GROUT=(0xB9,0xAF,0xA4); CORAL=(0xF4,0x8A,0x5C); FLECKS=[(0x8D,0xB8,0xE8),(0xB9,0xA0,0xE0),APRICOT]
def jit(c,r,a): return tuple(max(0,min(255,v+r.randint(-a,a))) for v in c)
def save(im,n,phone=None):
    im.save(f"{HERE}/{n}.png"); im.save(f"{HERE}/{n}.desktop.webp",quality=90)
    im.resize(phone or (im.width//2,im.height//2),Image.LANCZOS).save(f"{HERE}/{n}.phone.webp",quality=88)
def glow(r):
    W,H=1024,512; im=Image.new("RGBA",(W,H),(0,0,0,0))
    # half-ellipse spill from top edge (door line) into the room, soft falloff
    a=Image.new("L",(W,H),0); ad=ImageDraw.Draw(a)
    for k in range(60,0,-1):
        t=k/60; ad.ellipse([W/2-W*0.48*t,-H*0.9*t,W/2+W*0.48*t,H*0.9*t],fill=int(170*(1-t)**1.6))
    a=a.filter(ImageFilter.GaussianBlur(18))
    col=Image.new("RGB",(W,H)); cd=ImageDraw.Draw(col)
    for y in range(H):
        t=y/H; cd.line([0,y,W,y],fill=tuple(int(OCHRE[i]*(1-t)+APRICOT[i]*t) for i in range(3)))
    # faint watercolor mottling
    n=Image.new("L",(W//16,H//16)); n.putdata([r.randint(200,255) for _ in range((W//16)*(H//16))])
    n=n.resize((W,H),Image.BICUBIC).filter(ImageFilter.GaussianBlur(10))
    a=Image.composite(a,Image.new("L",(W,H),0),n) if False else Image.eval(Image.merge("L",[a]),lambda v:v)
    from PIL import ImageChops
    a=ImageChops.multiply(a,n)
    col.putalpha(a); return col
def reveal(r):
    W,H=1024,64; im=Image.new("RGBA",(W,H),SLATE+(255,)); d=ImageDraw.Draw(im)
    x=0
    while x<W:  # slate tesserae, tileable in X (wraps width exactly)
        w=16
        for y0 in (6,22,38):
            d.rounded_rectangle([x+1,y0+1,x+w-1,y0+15],radius=2,fill=jit(SLATE,r,10)+(255,))
        x+=w
    d.rectangle([0,0,W,4],fill=OCHRE+(255,)); d.rectangle([0,H-6,W,H-5],fill=OCHRE+(255,))
    d.rectangle([0,H-4,W,H],fill=GROUT+(255,))
    for x in range(32,W,64): d.polygon([(x,27),(x+5,32),(x,37),(x-5,32)],fill=OCHRE+(255,))
    return im
def banner(r):
    W,H=1024,192; im=Image.new("RGB",(W,H),GROUT); d=ImageDraw.Draw(im)
    def tiles(box,color,s,amt,fl=0):
        x0,y0,x1,y1=box; y=y0
        while y<y1:
            x=x0
            while x<x1:
                w=s+r.randint(-s//4,s//4); c=color
                if r.random()<fl: c=tuple(int(a*.35+b*.65) for a,b in zip(r.choice(FLECKS),color))
                xe,ye=min(x+w,x1)-1,min(y+s,y1)-1
                if xe>x+1 and ye>y+1: d.rounded_rectangle([x+1,y+1,xe,ye],radius=2,fill=jit(c,r,amt))
                x+=w
            y+=s
    tiles((0,0,W,H),TERRA,18,14); d.rectangle([22,22,W-23,H-23],fill=GROUT)
    tiles((24,24,W-24,H-24),OCHRE,7,12); d.rectangle([32,32,W-33,H-33],fill=GROUT)
    tiles((33,33,W-33,H-33),PLASTER,14,7,0.10)
    # tiny sunburst keystone mark at top center of border (no text)
    cx=W//2
    for k in range(9):
        a=math.pi*(1+k/8); d.line([cx,22,cx+math.cos(a)*18,22+math.sin(a)*18],fill=OCHRE,width=3)
    return im
def main():
    r=random.Random(288)
    g=glow(r); save(g,"threshold-glow",(512,256))
    v=reveal(r); save(v,"arch-reveal",(512,32))
    b=banner(r); save(b,"header-banner",(512,96))
    J={"issue":288,"preview_only":True,"approved":False,"note":"No text baked. Pair header-banner with group-labels-354 or room signs.",
     "assets":{
      "threshold-glow":{"png":"threshold-glow.png","desktop":"threshold-glow.desktop.webp","phone":"threshold-glow.phone.webp","px":[1024,512],"phone_px":[512,256],
        "blend":"additive (THREE.AdditiveBlending, depthWrite:false, toneMapped:false); premultiplied:false",
        "world_size_m":[3.0,1.5],"uv":"v=1 (top edge) on door threshold line; spills into the room toward v=0. Lay as floor decal y+0.005.",
        "intensity":{"day":0.45,"dusk":0.8,"night":1.0},"pairs":"Ramp it with window-glows-358 and the horizon night state; at night set the doorway interior lamp to ~#F7CC3A at matching strength"},
      "arch-reveal":{"png":"arch-reveal.png","desktop":"arch-reveal.desktop.webp","phone":"arch-reveal.phone.webp","px":[1024,64],"phone_px":[512,32],
        "blend":"normal, opaque","tile":"RepeatWrapping in U (seamless at 64px period)","world_size_m":[4.0,0.25],
        "uv":"U runs along the inner jamb + arch path; v=1 gilt edge faces the opening, grout edge faces the wall","intensity":{"day":1.0,"night":"emissive 0.15 of OCHRE optional"}},
      "header-banner":{"png":"header-banner.png","desktop":"header-banner.desktop.webp","phone":"header-banner.phone.webp","px":[1024,192],"phone_px":[512,96],
        "blend":"normal, opaque","world_size_m":[2.4,0.45],"labelRect_px":[60,48,964,144],"labelRect_uv":{"u0":0.0586,"v0":0.25,"u1":0.9414,"v1":0.75},
        "uv":"Center above the door lintel; group-labels-354 plaques (4:1) fit labelRect when scaled to ~0.9 m wide, or leave empty"}}}
    json.dump(J,open(f"{HERE}/doorway.json","w"),indent=2)
    # preview: hex wall segment with doorway
    P=Image.new("RGBA",(1200,800),(0x2a,0x26,0x30,255)); d=ImageDraw.Draw(P)
    d.polygon([(0,560),(1200,560),(1200,800),(0,800)],fill=(0x9a,0x90,0x86,255))  # floor
    d.polygon([(100,0),(1100,0),(1100,560),(100,560)],fill=PLASTER+(255,))       # wall
    dx0,dx1,top=450,750,280
    d.rectangle([dx0,top,dx1,560],fill=(0x3a,0x30,0x2a,255))
    d.pieslice([dx0,top-150,dx1,top+150],180,360,fill=(0x3a,0x30,0x2a,255))
    inner=Image.new("RGBA",(300,280),(0,0,0,0)); ImageDraw.Draw(inner).rectangle([30,30,270,280],fill=APRICOT+(120,))
    P.alpha_composite(inner.filter(ImageFilter.GaussianBlur(30)),(dx0,top))
    rv=v.resize((512,20)); 
    for x,y,w,h in ((dx0-20,top,20,280),(dx1,top,20,280)):
        P.alpha_composite(rv.rotate(90,expand=True).resize((w,h)),(x,y))
    d.arc([dx0-20,top-170,dx1+20,top+170],180,360,fill=SLATE+(255,),width=20); d.arc([dx0-1,top-151,dx1+1,top+151],180,360,fill=OCHRE+(255,),width=3)
    P.paste(b.resize((420,79)),(390,18))
    gl=g.resize((600,220)); from PIL import ImageChops
    base=P.convert("RGB"); add=Image.new("RGB",P.size); add.paste(Image.composite(gl.convert("RGB"),Image.new("RGB",gl.size),gl.getchannel("A")),(300,560))
    ImageChops.add(base,add).save(f"{HERE}/preview.png")
if __name__=="__main__": main()
