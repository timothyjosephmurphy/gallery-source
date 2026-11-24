#!/usr/bin/env python3
"""#19 size/price plaque chrome. Pillow only, seed 19. No text baked. python3 make.py"""
import json, random, os, math
from PIL import Image, ImageDraw, ImageFilter
HERE=os.path.dirname(os.path.abspath(__file__))
FACE=(0x15,0x10,0x0b); OCHRE=(0xF7,0xCC,0x3A); BRASS=(0xB8,0x8A,0x3E); BRASS_D=(0x7A,0x55,0x22); BRASS_L=(0xE6,0xC2,0x78)
PLASTER=(0xF3,0xE6,0xD8)
# rects as fractions of (W,H), top-left origin
R={"titleBand":(0.12,0.13,0.88,0.30),"sizeLine":(0.12,0.40,0.88,0.54),"priceLine":(0.12,0.58,0.88,0.72),"statusChip":(0.28,0.79,0.72,0.88)}
def brass(W,H,r):
    im=Image.new("RGB",(W,H),BRASS); px=im.load()
    for y in range(H):
        for x in range(W):
            t=0.5+0.5*math.sin((x+y*0.3)/W*6.0)
            n=r.randint(-8,8)
            c=[int(BRASS_D[i]*(1-t)*0.4+BRASS[i]*0.6+BRASS_L[i]*t*0.4)+n for i in range(3)]
            px[x,y]=tuple(max(0,min(255,v)) for v in c)
    return im
def make(W,H,nfs,seed):
    r=random.Random(seed); s=W/512
    im=brass(W,H,r).convert("RGBA")
    m=Image.new("L",(W,H),0); ImageDraw.Draw(m).rounded_rectangle([0,0,W-1,H-1],radius=int(28*s),fill=255)
    d=ImageDraw.Draw(im); b=int(30*s)
    d.rounded_rectangle([b-int(4*s),b-int(4*s),W-b+int(4*s),H-b+int(4*s)],radius=int(16*s),fill=BRASS_D)
    d.rounded_rectangle([b,b,W-b,H-b],radius=int(12*s),fill=FACE)
    g=int(8*s); d.rounded_rectangle([b+g,b+g,W-b-g,H-b-g],radius=int(8*s),outline=OCHRE,width=max(1,int(2*s)))
    # face grain
    for _ in range(int(900*s*s)):
        x,y=r.randint(b+g+2,W-b-g-2),r.randint(b+g+2,H-b-g-2); v=r.randint(0,8)
        d.point((x,y),fill=(0x15+v,0x10+v,0x0b+v,255))
    # rule under title band + crest
    y=int(H*0.345); cx=W//2
    d.line([W*0.16,y,cx-24*s,y],fill=OCHRE,width=max(1,int(2*s))); d.line([cx+24*s,y,W*0.84,y],fill=OCHRE,width=max(1,int(2*s)))
    for k in range(7):  # fan
        a=math.pi*(1+k/6); d.line([cx,y,cx+math.cos(a)*16*s,y+math.sin(a)*16*s],fill=OCHRE,width=max(1,int(1.5*s)))
    d.polygon([(cx,y-5*s),(cx+7*s,y),(cx,y+7*s),(cx-7*s,y)],fill=OCHRE)
    # thin divider between size/price
    y2=int(H*0.56); d.line([W*0.30,y2,W*0.70,y2],fill=(0x5a,0x46,0x22),width=1)
    # bottom crest tiny diamonds
    yb=int(H*0.925)
    for dx in (-18,0,18):
        q=cx+dx*s; rr=(4 if dx else 6)*s; d.polygon([(q,yb-rr),(q+rr,yb),(q,yb+rr),(q-rr,yb)],fill=OCHRE)
    # status chip outline (empty)
    if nfs:
        x0,y0,x1,y1=[R["statusChip"][i]*(W if i%2==0 else H) for i in range(4)]
        d.rounded_rectangle([x0,y0,x1,y1],radius=int((y1-y0)/2),outline=BRASS_L,width=max(1,int(2*s)),fill=(0x24,0x1a,0x10))
        d.ellipse([x0+8*s,(y0+y1)/2-5*s,x0+18*s,(y0+y1)/2+5*s],outline=(0xC8,0x64,0x4E),width=max(1,int(2*s)))  # status dot only
    # screw bosses
    for (x,y) in [(b/2,b/2),(W-b/2,b/2),(b/2,H-b/2),(W-b/2,H-b/2)]:
        rr=9*s; d.ellipse([x-rr,y-rr,x+rr,y+rr],fill=BRASS_D); d.ellipse([x-rr+2*s,y-rr+2*s,x+rr-2*s,y+rr-2*s],fill=BRASS_L)
        d.line([x-rr+3*s,y+rr-3*s,x+rr-3*s,y-rr+3*s],fill=BRASS_D,width=max(1,int(2*s)))
    im.putalpha(m); return im
def rects(W,H,nfs):
    o={}
    for k,(u0,t0,u1,t1) in R.items():
        if k=="statusChip" and not nfs: note="optional: empty area, chip drawn at runtime if needed"
        else: note=None
        o[k]={"rect_px":[round(u0*W),round(t0*H),round(u1*W),round(t1*H)],
              "rect_uv":{"u0":u0,"v0":round(1-t1,4),"u1":u1,"v1":round(1-t0,4)}}
        if note: o[k]["note"]=note
    return o
def main():
    J={"issue":19,"preview_only":True,"approved":False,"note":"Gallery owns interaction; runtime copy only. No text baked.",
       "rect_convention":"rect_px = [x0,y0,x1,y1] top-left origin; rect_uv v-up (matches #337 overlay.json)",
       "material_hint":"MeshBasicMaterial({map, transparent:true, toneMapped:false}); alpha only at rounded corners",
       "face_rgb":"#15100b","ink":{"title":"#F7DC8C","size":"#EDE3CF","price":"#F7CC3A","muted":"#B9AFA4","nfs":"#C8644E"},
       "text_px_suggest":{"desktop":{"title":34,"size":28,"price":30,"status":20},"phone":{"title":17,"size":14,"price":15,"status":10}},
       "variants":{}}
    imgs=[]
    for name,(W,H) in {"desktop":(512,640),"phone":(256,320)}.items():
        for nfs in (False,True):
            key=("nfs-" if nfs else "")+name; fn=f"plaque-{key}"
            im=make(W,H,nfs,19+(W)+nfs); im.save(f"{HERE}/{fn}.png"); im.save(f"{HERE}/{fn}.webp",quality=90)
            J["variants"][key]={"file":fn+".webp","png":fn+".png","px":[W,H],"world_size_m":[0.20,0.25] if name=="desktop" else [0.20,0.25],
                "statusChip_baked":nfs,"rects":rects(W,H,nfs)}
            if nfs: J["variants"][key]["nfs_note"]="Chip outline + small terracotta dot baked; text 'Not for sale' rendered at runtime inside statusChip."
            if name=="desktop": imgs.append(im)
    json.dump(J,open(f"{HERE}/plaques.json","w"),indent=2)
    r=random.Random(19); P=Image.new("RGB",(1520,900),PLASTER); pd=ImageDraw.Draw(P)
    for y in range(0,900,3): pd.line([0,y,1520,y],fill=tuple(c+r.randint(-4,2) for c in PLASTER))
    pd.rectangle([60,120,560,780],fill=(0x9D,0xB7,0xCF),outline=(0x5E,0x72,0x89),width=10)  # stand-in artwork
    sh=Image.new("RGBA",(512,640),(0,0,0,0)); ImageDraw.Draw(sh).rounded_rectangle([0,0,511,639],radius=28,fill=(0,0,0,90)); sh=sh.filter(ImageFilter.GaussianBlur(10))
    for i,im in enumerate(imgs):
        t=im.resize((384,480),Image.LANCZOS); x=640+i*420; P.paste(sh.resize((384,480)),(x+8,218),sh.resize((384,480))); P.paste(t,(x,210),t)
    P.save(f"{HERE}/preview.png")
if __name__=="__main__": main()
