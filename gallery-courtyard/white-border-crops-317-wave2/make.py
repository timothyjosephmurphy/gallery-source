#!/usr/bin/env python3
"""#338/#317 wave 2: crop near-white margins (same margins() as data/white_border_317.py).
Picks the largest on-box source per id; uses soft thresholds (lum>=195, 90% of line, chroma<=30)."""
import glob,json,os,sys
import numpy as np
from PIL import Image,ImageDraw
OUT=os.path.dirname(os.path.abspath(__file__))
SRC={
 "book-art-596837cb5ff533c620dd":["/workspace/**/*596837cb5ff533c620dd*.*"],
 "book-art-a61c71e5de8cc1b71500":["/workspace/**/*a61c71e5de8cc1b71500*.*"],
 "book-art-7bce6e3509027d1f7a0b":["/workspace/**/*7bce6e3509027d1f7a0b*.*"],
 "book-art-9209f1fd7d47f373597f":["/workspace/**/*9209f1fd7d47f373597f*.*"],
 "older-work-lake-hillside-color-wheel-original-3":["/workspace/**/older-work-lake-hillside-color-wheel-3*.*"],
 "older-work-portraits-319-329-original-4":["/workspace/**/older-work-portraits-319-329-4*.*"],
 "archived-painting-73":["/workspace/**/archived-painting-73.*","/workspace/**/archived-painting-73-*.*"],
 "archived-painting-2":["/workspace/**/archived-painting-2.*","/workspace/**/archived-painting-2-*.*"],
 "book-art-4bf5a04e40e7d8341378":["/workspace/**/*4bf5a04e40e7d8341378*.*"],
 "book-art-74a736000a32427842b1":["/workspace/**/*74a736000a32427842b1*.*"],
 "older-work-ridge-strips-unindexed-original-6":["/workspace/**/older-work-ridge-strips-unindexed-6*.*"],
 "older-work-yakes-todd-dickerson-original-2":["/workspace/**/older-work-yakes-todd-dickerson-2*.*"],
}
SUBJECT={k for k in SRC if k.startswith("book-art-") and k[9:] in ("596837cb5ff533c620dd","a61c71e5de8cc1b71500","7bce6e3509027d1f7a0b","9209f1fd7d47f373597f")}
SUBJECT_PAD=0.03
SKIP={"older-work-lake-hillside-color-wheel-original-3","book-art-4bf5a04e40e7d8341378"}|set(sys.argv[1:])  # eyeballed: wash/sky is composition
def margins(im,lum_t,frac=0.95,chroma=22):
    a=np.asarray(im.convert("RGB"),dtype=np.int16); L=a.mean(2); C=a.max(2)-a.min(2)
    w=(L>=lum_t)&(C<=chroma); H,W=w.shape
    def run(lines):
        k=0
        for r in lines:
            if r.mean()>=frac: k+=1
            else: break
        return k
    return dict(top=run(w),bottom=run(w[::-1]),left=run(w.T),right=run(w.T[::-1]))
def best(pats):
    fs=set()
    for p in pats: fs|=set(glob.glob(p,recursive=True))
    fs=[f for f in fs if f.lower().endswith(('.jpg','.jpeg','.png','.webp')) and '/node_modules/' not in f and '/white-border-crops' not in f and '/.cache/' not in f and '/social/' not in f]
    def px(f):
        try: return Image.open(f).size[0]*Image.open(f).size[1]
        except Exception: return 0
    return max(fs,key=px)
def pct(m,W,H): return {k:round(100*v/(H if k in('top','bottom') else W),2) for k,v in m.items()}
rows=[];thumbs=[]
for id_,pats in SRC.items():
    f=best(pats); im=Image.open(f).convert("RGB"); W,H=im.size
    m=margins(im,195,0.9,30); pad=lambda v:v+int(v>0)*max(1,round(0.004*max(W,H)))  # tiny overshoot to kill halo
    box=(pad(m["left"]),pad(m["top"]),W-pad(m["right"]),H-pad(m["bottom"]))
    if id_ in SUBJECT:  # figure cut-outs on white paper: margins() eats pale skin -> crop to subject bbox + pad instead
        a=np.asarray(im,dtype=np.int16); ink=(a.mean(2)<235)|((a.max(2)-a.min(2))>14)
        rr=np.where(ink.mean(1)>0.002)[0]; cc=np.where(ink.mean(0)>0.002)[0]; p=round(SUBJECT_PAD*max(W,H))
        box=tuple(int(v) for v in (max(0,cc[0]-p),max(0,rr[0]-p),min(W,cc[-1]+1+p),min(H,rr[-1]+1+p)))
    skip=id_ in SKIP or box==(0,0,W,H)
    c=im if skip else im.crop(box)
    after=margins(c,195,0.9,30)
    r=dict(id=id_,source=f,size=[W,H],before_pct=pct(m,W,H),crop_box=list(box),after_size=list(c.size),after_pct=pct(after,*c.size),cropped=not skip)
    if not skip:
        c.save(f"{OUT}/{id_}-317w2.png")
        d=c.copy(); d.thumbnail((2400,2400),Image.LANCZOS); d.save(f"{OUT}/{id_}-317w2.webp",quality=88)
        p=d.resize((max(1,d.width//2),max(1,d.height//2)),Image.LANCZOS); p.save(f"{OUT}/{id_}-317w2-phone.webp",quality=85)
    rows.append(r)
    a=im.copy(); a.thumbnail((360,360)); b=c.copy(); b.thumbnail((360,360)); thumbs.append((id_,a,b,skip))
json.dump(rows,open(f"{OUT}/borders-wave2.json","w"),indent=1)
cw=760; sheet=Image.new("RGB",(cw,len(thumbs)*400),(60,60,60)); dr=ImageDraw.Draw(sheet)
for i,(id_,a,b,skip) in enumerate(thumbs):
    y=i*400; sheet.paste(a,(10,y+30)); sheet.paste(b,(390,y+30))
    dr.text((10,y+8),f"{id_}  BEFORE | AFTER{'  (SKIPPED)' if skip else ''}",fill=(255,255,0))
sheet.save(f"{OUT}/contact-sheet-wave2.jpg",quality=85)
for r in rows: print(r["id"],r["size"],r["before_pct"],"->",r["after_size"],r["cropped"],r["source"])
