import os, json, numpy as np
from PIL import Image, ImageDraw, ImageFont
from hqlib import seam_stats
OUT=os.path.dirname(os.path.abspath(__file__)); PB="/workspace/play-tags/public/pbr"
M=json.load(open(f"{OUT}/manifest.json"))
FT=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",15) if os.path.exists("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf") else ImageFont.load_default()
def load(p,mode="RGB"): return Image.open(p).convert(mode)
def seam_score(a,horiz_only=False):
    a=a.astype(np.float32)
    h=np.abs(a[:,0]-a[:,-1]).mean()/(np.abs(np.diff(a,axis=1)).mean()+1e-6)
    if horiz_only: return h
    v=np.abs(a[0]-a[-1]).mean()/(np.abs(np.diff(a,axis=0)).mean()+1e-6)
    return max(h,v)
seam={}
os.makedirs(f"{OUT}/previews/tile3x3",exist_ok=True)
for r in M['files']:
    if r['map']!='color': continue
    key=r['file']; a=np.asarray(load(f"{OUT}/{r['file']}"))
    sky=r['category']=='sky'
    # for 8-bit decoded files compare the wrap-around neighbour step with the average interior step
    seam[key]=[round(x,2) for x in seam_stats(a,sky)]
    if r['tier']=='desktop':
        im=load(f"{OUT}/{r['file']}")
        if sky:
            t=Image.new("RGB",(2*1024,512)); s=im.resize((1024,512))
            t.paste(s,(0,0)); t.paste(s,(1024,0)); t.save(f"{OUT}/previews/tile3x3/{r['slug']}-2x1-wrap.png")
        else:
            s=im.resize((384,384),Image.LANCZOS); t=Image.new("RGB",(1152,1152))
            for i in range(3):
                for j in range(3): t.paste(s,(i*384,j*384))
            t.save(f"{OUT}/previews/tile3x3/{r['slug']}-3x3.png")
# true full-res seam check on the desktop files: crop 256px window straddling tile joint
for r in M['files']:
    pass
raw=json.load(open(f"{OUT}/previews/seam-raw.json"))
failraw=[k for k,v in raw.items() if v[0]>v[2]*1.05]
faildec=[k for k,v in seam.items() if v[0]>max(v[2]*1.05,v[1]+2.0)]
print("raw: max wrap/mean",round(max(v[0]/max(v[1],1e-6) for v in raw.values()),2),"fails raw",failraw,"| decoded fails",faildec)
json.dump(dict(raw_float_pre_encode=raw,decoded_webp=seam),open(f"{OUT}/previews/seam-scores.json","w"),indent=1)
# ---------- before/after contact sheet ----------
def tinted(img,hexv):
    a=np.asarray(img).astype(np.float32)/255; lin=np.where(a<=0.04045,a/12.92,((a+0.055)/1.055)**2.4)
    t=np.array([(hexv>>16)&255,(hexv>>8)&255,hexv&255],np.float32)/255; tl=np.where(t<=0.04045,t/12.92,((t+0.055)/1.055)**2.4)
    o=lin*tl; s=np.where(o<=0.0031308,o*12.92,1.055*np.power(np.maximum(o,1e-9),1/2.4)-0.055)
    return Image.fromarray((s.clip(0,1)*255).astype(np.uint8))
CW=300; GAP=10; LAB=26
def cell(img,label,sky=False,tile=True):
    im=img.resize((CW,CW//2 if sky else CW),Image.LANCZOS); c=Image.new("RGB",(CW,CW+LAB),(24,22,26)); d=ImageDraw.Draw(c)
    c.paste(im,(0,LAB)); d.text((6,5),label,fill=(255,236,200),font=FT); return c
def tile2(img): # 2x2 repeat to show tiling at cell size
    s=img.resize((CW//2,CW//2),Image.LANCZOS); t=Image.new("RGB",(CW,CW))
    for i in range(2):
        for j in range(2): t.paste(s,(i*CW//2,j*CW//2))
    return t
wall0=load(f"{PB}/wall_diff.webp"); floor0=load(f"{PB}/floor_diff.webp"); metal0=load(f"{PB}/metal_diff.webp")
rowsdef=[
 ("WALLS",[("BEFORE wall_diff (tinted 0xB8ADA0)",tile2(tinted(wall0,0xb8ada0)))]+[("AFTER "+s,tile2(load(f"{OUT}/walls/{s}.webp"))) for s in ("wall-plaster","wall-ashlar")]),
 ("FLOORS",[("BEFORE floor_diff (tinted 0x6E665E)",tile2(tinted(floor0,0x6e665e)))]+[("AFTER "+s,tile2(load(f"{OUT}/floors/{s}.webp"))) for s in ("floor-flagstone","floor-planks","floor-terrazzo")]),
 ("CEILINGS",[("BEFORE metal_diff (tint 0x6A5850)",tile2(tinted(metal0,0x6a5850)))]+[("AFTER "+s,tile2(load(f"{OUT}/ceilings/{s}.webp"))) for s in ("ceiling-coffer","ceiling-plaster")]),
 ("SKY",[("BEFORE flat 0xCFE0EA (no sky texture)",Image.new("RGB",(CW,CW//2),(0xcf,0xe0,0xea)))]+[("AFTER "+s,load(f"{OUT}/sky/{s}.webp")) for s in ("sky-pnw-day","sky-pnw-sunset")]),
 ("PROPS",[("BEFORE metal_diff",tile2(metal0))]+[("AFTER "+s,tile2(load(f"{OUT}/props/{s}.webp"))) for s in ("prop-brass","prop-walnut","prop-marble","prop-linen","prop-felt")]),
]
maxc=max(len(r[1]) for r in rowsdef); W=maxc*(CW+GAP)+GAP; H=len(rowsdef)*(CW+LAB+GAP)+GAP
sheet=Image.new("RGB",(W,H),(40,36,40))
for ri,(name,cells) in enumerate(rowsdef):
    for ci,(lab,im) in enumerate(cells):
        c=cell(im,lab,sky=(name=="SKY"))
        sheet.paste(c,(GAP+ci*(CW+GAP),GAP+ri*(CW+LAB+GAP)))
sheet.save(f"{OUT}/preview.png",optimize=True)
# ---------- lit preview (normal + roughness, raking light) ----------
def lit(slug,cat):
    S=512; col=np.asarray(load(f"{OUT}/{cat}/{slug}.phone.webp").resize((S,S))).astype(np.float32)/255
    npth=f"{OUT}/{cat}/{slug}_n.phone.webp"; rpth=f"{OUT}/{cat}/{slug}_r.phone.webp"
    N=(np.asarray(load(npth).resize((S,S))).astype(np.float32)/255*2-1) if os.path.exists(npth) else np.dstack([np.zeros((S,S)),np.zeros((S,S)),np.ones((S,S))]).astype(np.float32)
    R=(np.asarray(load(rpth,"L").resize((S,S))).astype(np.float32)/255) if os.path.exists(rpth) else np.full((S,S),0.9,np.float32)
    L=np.array([-0.55,0.45,0.70]); L/=np.linalg.norm(L); V=np.array([0,0,1.]); Hh=(L+V); Hh/=np.linalg.norm(Hh)
    n=N/np.linalg.norm(N,axis=-1,keepdims=True); nl=np.clip(n@L,0,1)[...,None]; nh=np.clip(n@Hh,0,1)
    sp=(1-R)**2*np.power(nh,8+(1-R)*90)*0.9
    metal=slug=="prop-brass"
    o=col*(0.30+0.85*nl) if not metal else col*(0.12+0.35*nl)+col*sp[...,None]*2.0
    o=o+(sp[...,None]*0.5 if not metal else 0)
    return Image.fromarray((np.clip(o,0,1)*255).astype(np.uint8))
items=[("wall-plaster","walls"),("wall-ashlar","walls"),("floor-flagstone","floors"),("floor-planks","floors"),("floor-terrazzo","floors"),("ceiling-coffer","ceilings"),("prop-brass","props"),("prop-walnut","props"),("prop-marble","props"),("prop-linen","props")]
LS=Image.new("RGB",(5*260,2*286),(30,28,32)); d=ImageDraw.Draw(LS)
for i,(s,c) in enumerate(items):
    im=lit(s,c).resize((256,256),Image.LANCZOS); x=(i%5)*260+2; y=(i//5)*286
    LS.paste(im,(x,y+26)); d.text((x+4,y+4),s+" (lit: colour+normal+rough)",fill=(255,236,200),font=ImageFont.load_default())
LS.save(f"{OUT}/previews/lit-check.png",optimize=True)
print("done")
