#!/usr/bin/env python3
"""Group label plaques for studio-tracker #354. Pillow only, seed 354. Run: python3 make.py"""
import json, random, re, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE=os.path.dirname(os.path.abspath(__file__))
TITLES=["Bitcoiners","Festival · Burning Man","Bass Coast Sunrises","Temples","Renoirs & Ridges","Father Paul","Reiki","Bounty of Satoshi","Ukraine","Small Watercolors","Attendees","Landscapes by Size","Forest Triptych","Hummingbirds"]
PLASTER=(0xF3,0xE6,0xD8); SLATE=(0x5E,0x72,0x89); TERRA=(0xC8,0x64,0x4E); OCHRE=(0xF7,0xCC,0x3A); GROUT=(0xB9,0xAF,0xA4)
FLECKS=[(0x8D,0xB8,0xE8),(0xB9,0xA0,0xE0),(0xF7,0xA6,0x6E)]
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
W,H=1024,256
def slug(t): return re.sub(r"[^a-z0-9]+","-",t.lower().replace("&","and")).strip("-")
def jit(c,r,a): return tuple(max(0,min(255,v+r.randint(-a,a))) for v in c)
def tiles(d,r,box,color,size,amt,fleck=0.0):
    x0,y0,x1,y1=box; y=y0
    while y<y1:
        x=x0+r.randint(-size//3,0)
        while x<x1:
            w=size+r.randint(-size//4,size//4); h=size+r.randint(-size//4,size//4)
            c=r.choice(FLECKS) if r.random()<fleck else color
            c=tuple(int(a*0.35+b*0.65) for a,b in zip(c,color)) if c!=color else c
            if min(x+w,x1)-1>max(x,x0)+1 and min(y+h,y1)-1>y+1: d.rounded_rectangle([max(x,x0)+1,y+1,min(x+w,x1)-1,min(y+h,y1)-1],radius=2,fill=jit(c,r,amt))
            x+=w
        y+=size
def plaque(title,seed):
    r=random.Random(seed)
    im=Image.new("RGB",(W,H),GROUT); d=ImageDraw.Draw(im)
    tiles(d,r,(0,0,W,H),TERRA,18,14)                 # outer border band
    d.rectangle([22,22,W-23,H-23],fill=GROUT)
    tiles(d,r,(24,24,W-24,H-24),OCHRE,7,12)           # thin gilded inner
    d.rectangle([32,32,W-33,H-33],fill=GROUT)
    tiles(d,r,(33,33,W-33,H-33),PLASTER,14,7,fleck=0.10)  # field
    # watercolor wash blooms
    wash=Image.new("RGB",(W,H),PLASTER); wd=ImageDraw.Draw(wash)
    for _ in range(9):
        cx,cy=r.randint(40,W-40),r.randint(40,H-40); rad=r.randint(40,120)
        wd.ellipse([cx-rad,cy-rad,cx+rad,cy+rad],fill=tuple(int(a*.85+b*.15) for a,b in zip(PLASTER,r.choice(FLECKS))))
    wash=wash.filter(ImageFilter.GaussianBlur(30))
    mask=Image.new("L",(W,H),0); ImageDraw.Draw(mask).rectangle([33,33,W-33,H-33],fill=90)
    im.paste(Image.blend(im,wash,0.5),(0,0),mask)
    # text
    size=110
    while True:
        f=ImageFont.truetype(FONT,size); bb=d.textbbox((0,0),title,font=f)
        if bb[2]-bb[0]<=W-130 or size<40: break
        size-=4
    tw,th=bb[2]-bb[0],bb[3]-bb[1]; tx=(W-tw)//2-bb[0]; ty=(H-th)//2-bb[1]
    tm=Image.new("L",(W,H),0); ImageDraw.Draw(tm).text((tx,ty),title,font=f,fill=255)
    tm=tm.filter(ImageFilter.GaussianBlur(0.8))
    lt=Image.new("RGB",(W,H),SLATE); ld=ImageDraw.Draw(lt)
    for y in range(0,H,6):            # tessera texture in letters
        for x in range(0,W,6): ld.rectangle([x,y,x+5,y+5],fill=jit(SLATE,r,10))
    for y in range(0,H,6): ld.line([0,y,W,y],fill=jit(SLATE,r,4)[:1]*0+(80,95,112))
    for x in range(0,W,6): ld.line([x,0,x,H],fill=(80,95,112))
    im.paste(lt,(0,0),tm)
    return im
def main():
    out=[]; prev=Image.new("RGB",(2*560+60,7*150+60),PLASTER); pd=ImageDraw.Draw(prev)
    rr=random.Random(354)
    for y in range(0,prev.height,4):
        pd.line([0,y,prev.width,y],fill=jit((232,226,220),rr,3))
    for i,t in enumerate(TITLES):
        s=slug(t); im=plaque(t,354*100+i)
        im.save(f"{HERE}/label-{s}.png")
        im.save(f"{HERE}/label-{s}.desktop.webp",quality=88)
        im.resize((512,128),Image.LANCZOS).save(f"{HERE}/label-{s}.phone.webp",quality=86)
        th=im.resize((520,130),Image.LANCZOS); px,py=40+(i%2)*560,40+(i//2)*150
        pd.rectangle([px+4,py+6,px+524,py+136],fill=(200,192,184)); prev.paste(th,(px,py))
        out.append(dict(id=s,title=t,fileDesktop=f"label-{s}.desktop.webp",filePhone=f"label-{s}.phone.webp",filePng=f"label-{s}.png",widthPx=W,heightPx=H,
            suggestedUse="Wall plaque centered above the group's hang grid (~eye height+); also usable as door header"))
    prev.save(f"{HERE}/preview.png")
    json.dump(out,open(f"{HERE}/labels.json","w"),indent=2,ensure_ascii=False)
if __name__=="__main__": main()
