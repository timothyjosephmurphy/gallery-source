import os, json, numpy as np
from PIL import Image, ImageDraw, ImageFont
OUT=os.path.dirname(os.path.abspath(__file__)); PB="/workspace/play-tags/public/pbr"
FT=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",15)
def L(p,mode="RGB"): return Image.open(f"{OUT}/{p}").convert(mode)
CW=300; GAP=10; LAB=26
def cell(img,label):
    c=Image.new("RGB",(img.width,img.height+LAB),(24,22,26)); c.paste(img,(0,LAB)); ImageDraw.Draw(c).text((6,5),label,fill=(255,236,200),font=FT); return c
def tile2(img,s=CW):
    t=img.resize((s//2,s//2),Image.LANCZOS); o=Image.new("RGB",(s,s))
    for i in range(2):
        for j in range(2): o.paste(t,(i*s//2,j*s//2))
    return o
def sw(hexv,s=CW): return Image.new("RGB",(s,s),tuple(int(hexv[i:i+2],16) for i in (1,3,5)))
def sheet(rows,name):
    W=max(len(r) for r in rows)*(CW+GAP)+GAP; H=sum(max(c.height for c in r) for r in rows)+GAP*(len(rows)+1)
    S=Image.new("RGB",(W,H),(40,36,40)); y=GAP
    for r in rows:
        for i,c in enumerate(r): S.paste(c,(GAP+i*(CW+GAP),y))
        y+=max(c.height for c in r)+GAP
    S.save(f"{OUT}/{name}",optimize=True)
def ext(slug,lab,flat): return [cell(sw(flat),"BEFORE flat "+flat+" ("+lab+")"),cell(tile2(L(f"exterior/{slug}.webp")),"AFTER "+slug)]
rows=[ext("ext-stucco","facade skin","#F7A66E")[:1]+[cell(tile2(L("exterior/ext-stucco.webp")),"AFTER ext-stucco (neutral)")]+[cell(tile2(Image.fromarray((np.asarray(L("exterior/ext-stucco.webp")).astype(np.float32)*np.array(c)/255).astype(np.uint8))),"AFTER x tint "+n) for c,n in (((247,166,110),"Apricot"),(((157,183,207)),"Horizon Blue"))],
 ext("ext-travertine","plinth/jambs","#CBB89A")+ext("ext-paving","path lanes","#D9CCB2"),
 ext("ext-gravel","gravel ground","#CDBFA3")+ext("ext-lawn","lawn","#5F8F45"),
 ext("ext-foliage","hedge","#3F6A34")+ext("ext-roof-tile","no roof texture","#B8673F"),
 ext("ext-cornice-clay","cornice","#B8673F")+ext("ext-trim-slate","door surround","#5E7289")]
iv=L("exterior/ext-ivy-card.webp","RGBA"); bg=Image.new("RGBA",iv.size,(120,116,110,255)); bg.alpha_composite(iv)
rows.append([cell(sw("#3D6B2F"),"BEFORE flat 0x3D6B2F ivy card"),cell(bg.convert("RGB").resize((CW,int(CW*0.75))),"AFTER ext-ivy-card (alpha on grey)")])
sheet(rows,"preview-exterior.png")
# signs: demo lettering is NOT part of the assets
def demo(slug,txt,col):
    im=L(f"signs/{slug}.webp","RGBA"); bgc=Image.new("RGBA",im.size,(214,200,186,255)); bgc.alpha_composite(im)
    d=ImageDraw.Draw(bgc); f=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",78); tw=d.textlength(txt,font=f)
    d.text(((im.width-tw)/2,im.height/2-52),txt,fill=col,font=f); return bgc.convert("RGB")
SW=2*CW+GAP
def wcell(img,lab): 
    im=img.resize((SW,int(SW/4)),Image.LANCZOS); return cell(im,lab)
srows=[[wcell(sw("#F3E6D8",1024).resize((1024,256)),"BEFORE: flat/canvas label (no plate)"),wcell(demo("sign-plate-enamel","LANDSCAPES",(243,230,216)),"AFTER sign-plate-enamel (demo text)")],
 [wcell(demo("sign-plate-brass","BITCOINERS",(70,44,22)),"AFTER sign-plate-brass (demo text)"),wcell(demo("sign-plate-wood","FESTIVAL",(247,204,58)),"AFTER sign-plate-wood (demo text)")]]
# curved-sign check: map plate onto a 24 deg arc at 0.8 apothem to show the curve
import math
def arcprev(slug,txt,col):
    pl=np.asarray(demo(slug,txt,col)).astype(np.float32); H,W_=pl.shape[:2]; S=700; out=np.full((S,S,3),(60,56,60),np.float32)
    r0,r1=0.55*S,0.55*S*1.14; ys,xs=np.mgrid[0:S,0:S].astype(np.float32); cx,cy=S/2,S*0.95
    dx=xs-cx; dy=cy-ys; r=np.hypot(dx,dy); th=np.degrees(np.arctan2(dx,dy))
    m=(r>=r0)&(r<=r1)&(np.abs(th)<=12); u=((th+12)/24*(W_-1)).clip(0,W_-1).astype(int); v=((1-(r-r0)/(r1-r0))*(H-1)).clip(0,H-1).astype(int)
    out[m]=pl[v[m],u[m]]; return Image.fromarray(out.astype(np.uint8))
arc=Image.new("RGB",(3*350,149)); 
for i,(s,t,c) in enumerate((("sign-plate-enamel","LANDSCAPES",(243,230,216)),("sign-plate-brass","BITCOINERS",(70,44,22)),("sign-plate-wood","FESTIVAL",(247,204,58)))): arc.paste(arcprev(s,t,c).crop((250,215,450,300)).resize((350,149)),(i*350,0))
srows.append([cell(arc.resize((SW,int(SW*149/1050))),"curved-arc check: plate bent onto a 24 deg band (floor-arc sign geometry)")])
S=Image.new("RGB",(2*SW+3*GAP,sum(max(c.height for c in r)+GAP for r in srows)+GAP),(40,36,40)); y=GAP
for r in srows:
    for i,c in enumerate(r): S.paste(c,(GAP+i*(SW+GAP),y))
    y+=max(c.height for c in r)+GAP
S.save(f"{OUT}/preview-signs.png",optimize=True)
# AO preview: floor plan with/without AO + decals on a wall mock
fl=L("ao/ao-plan-floor.phone.webp","L"); cl=L("ao/ao-plan-ceiling.phone.webp","L")
flat=Image.new("L",fl.size,235); bef=Image.merge("RGB",[Image.new("L",fl.size,214)]*3).resize((512,512))
base=np.full((1024,1024,3),(236,214,186),np.float32)
aft=(base*(np.asarray(fl).astype(np.float32)/255)[...,None]).astype(np.uint8)
mock=Image.new("RGB",(1024,512),(243,230,216)); W_=np.asarray(mock).astype(np.float32)
wb=L("ao/ao-wall-base.webp","RGBA"); wc=L("ao/ao-wall-ceiling.webp","RGBA"); co=L("ao/ao-corner.webp","RGBA")
im=Image.new("RGBA",(1024,512),(243,230,216,255)); im.alpha_composite(wb.resize((1024,int(512*0.8/2.7))),(0,512-int(512*0.8/2.7))); im.alpha_composite(wc.resize((1024,int(512*0.6/2.7))),(0,0)); im.alpha_composite(co.resize((int(512*0.8/2.7),512)),(512-int(512*0.8/2.7)//2,0))
S=Image.new("RGB",(512*3+4*GAP,512+LAB+GAP*2+ (512+LAB)+GAP),(40,36,40))
S.paste(cell(Image.fromarray(np.full((512,512,3),(236,214,186),np.uint8)),"BEFORE flat floor (no AO)"),(GAP,GAP))
S.paste(cell(Image.fromarray(aft).resize((512,512)),"AFTER ao-plan-floor x floor colour"),(2*GAP+512,GAP))
S.paste(cell(Image.fromarray((np.full((1024,1024,3),(243,230,216),np.float32)*(np.asarray(cl).astype(np.float32)/255).repeat(2,0).repeat(2,1)[...,None]).astype(np.uint8)).resize((512,512)),"AFTER ao-plan-ceiling x ceiling colour"),(3*GAP+1024,GAP))
S.paste(cell(im.convert("RGB").resize((1024,512)),"decals on a 2.7 m wall mock: wall-base + wall-ceiling + corner strip (before: flat wall)"),(GAP,2*GAP+512+LAB))
S.save(f"{OUT}/preview-ao.png",optimize=True); print("ok")
