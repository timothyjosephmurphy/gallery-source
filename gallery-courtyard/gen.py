import numpy as np, math
from PIL import Image, ImageDraw, ImageFilter
rng=np.random.default_rng(295)
P={"Dawn Plaster":"#F3E6D8","Apricot Glow":"#F7A66E","Rose Quartz":"#E9A9A6","Terracotta Ember":"#C8644E","Sunrise Coral":"#F48A5C","Horizon Blue":"#9DB7CF","Dusk Slate":"#5E7289","Gilded Ochre":"#F7CC3A","Grout Ash":"#B9AFA4","Sea Sage":"#8FAE9E","Complement Blue":"#5E9ADB","Contrast Violet":"#9A78CF","Blue Light":"#8DB8E8","Blue Deep":"#3A6FB8","Violet Light":"#B9A0E0","Violet Deep":"#6E4FA8"}
h=lambda s:np.array([int(s[i:i+2],16) for i in (1,3,5)],float)
N=2048;C=14
# jittered grid voronoi
g=N//C+2
pts=(np.stack(np.meshgrid(np.arange(g),np.arange(g),indexing='ij'),-1)+0.15+0.7*rng.random((g,g,2)))*C
yy,xx=np.mgrid[0:N,0:N].astype(np.float32)
gi=(yy//C).astype(int);gj=(xx//C).astype(int)
d1=np.full((N,N),1e9,np.float32);d2=d1.copy();ci=np.zeros((N,N),int);cj=ci.copy()
for a in(-1,0,1):
  for b in(-1,0,1):
    ii=np.clip(gi+a,0,g-1);jj=np.clip(gj+b,0,g-1)
    p=pts[ii,jj];d=np.hypot(p[...,0]-yy,p[...,1]-xx)
    m=d<d1;d2=np.where(m,d1,np.minimum(d2,d));d1=np.where(m,d,d1);ci=np.where(m,ii,ci);cj=np.where(m,jj,cj)
# per-cell color
cy,cx=pts[...,0]-N/2,pts[...,1]-N/2
ang=np.arctan2(cy,cx);r=np.hypot(cy,cx)
# hex distance (flat-top, edges at 30+60k)
hexr=np.max([np.abs(cx*math.cos(t)+cy*math.sin(t)) for t in np.radians([30,90,150])],0)/(N*0.47)
ray=0.5+0.5*np.cos(24*ang)            # fine rays
ent=np.cos(6*(ang-math.radians(30)))  # 1 at entrances
strong=np.clip((ent-0.93)/0.07,0,1)*(hexr>0.08)
stops=[(0,h(P["Gilded Ochre"])),(0.25,h(P["Apricot Glow"])),(0.5,h(P["Rose Quartz"])),(0.75,h(P["Sunrise Coral"])),(1.0,h(P["Horizon Blue"]))]
t=np.clip(hexr,0,1);base=np.zeros(t.shape+(3,))
for (a,ca),(b,cb) in zip(stops,stops[1:]):
  m=(t>=a)&(t<=b);f=((t-a)/(b-a))[...,None];base=np.where(m[...,None],ca*(1-f)+cb*f,base)
cream=h(P["Dawn Plaster"])
col=base*(0.55+0.45*ray[...,None])+cream*(0.45-0.45*ray[...,None])
col=col*(1-strong[...,None]*0.7)+h(P["Terracotta Ember"])*strong[...,None]*0.7
col=col*0.72+cream*0.28   # pastel
col*=(0.92+0.12*rng.random(col.shape[:2]))[...,None]
col+=rng.normal(0,4,col.shape)
ur=rng.random(col.shape[:2])
bm=ur<0.12; pm=(ur>=0.12)&(ur<0.24)   # even, independent scatter
def shades(names):
  st=np.stack([h(P[n]) for n in names]);k=rng.integers(0,3,col.shape[:2])
  return st[k]+rng.normal(0,5,col.shape)
blue=shades(["Blue Light","Complement Blue","Blue Deep"])
vio=shades(["Violet Light","Contrast Violet","Violet Deep"])
col=np.where(bm[...,None],blue,col);col=np.where(pm[...,None],vio,col)
img=col[ci,cj]
# in-tile mottling + grout
noise=np.array(Image.fromarray((rng.random((N//8,N//8))*255).astype(np.uint8)).resize((N,N),Image.BICUBIC))/255.
img*= (0.95+0.08*noise)[...,None]
edge=np.clip((d2-d1)/2.2,0,1)[...,None]
img=img*edge+h(P["Grout Ash"])*(1-edge)*(0.9+0.15*noise[...,None])
img*=(1-0.06*np.clip(1-(d2-d1)/6,0,1))[...,None]  # bevel shade
out=Image.fromarray(np.clip(img,0,255).astype(np.uint8)).filter(ImageFilter.SMOOTH)
out.save("sunburst-floor.png",optimize=True)
for q in(85,80,75,70,60):
  out.save("sunburst-floor.webp",quality=q,method=6)
  import os
  if os.path.getsize("sunburst-floor.webp")<1e6:break
s=out.resize((1024,1024),Image.LANCZOS);s.save("sunburst-floor-1024.png",optimize=True);s.save("sunburst-floor-1024.webp",quality=82,method=6)
# trim motif
W,H=1600,800;S=2;im=Image.new("RGBA",(W*S,H*S),(0,0,0,0));d=ImageDraw.Draw(im)
cx0,cy0=W*S/2,H*S-20
def c(n,a=255):v=h(P[n]).astype(int);return (*v,a)
for i in range(21):
  a0=180+i*180/21;a1=a0+180/21
  d.pieslice([cx0-760*S,cy0-760*S,cx0+760*S,cy0+760*S],a0,a1,fill=c("Apricot Glow" if i%2 else "Rose Quartz"),outline=c("Dawn Plaster"),width=6)
for R,n in((560,"Sunrise Coral"),(420,"Dawn Plaster"),(300,"Gilded Ochre")):
  d.pieslice([cx0-R*S,cy0-R*S,cx0+R*S,cy0+R*S],180,360,fill=c(n))
for i in range(13):
  a=math.radians(180+i*15);d.line([cx0+320*S*math.cos(a),cy0+320*S*math.sin(a),cx0+400*S*math.cos(a),cy0+400*S*math.sin(a)],fill=c("Terracotta Ember"),width=10)
d.arc([cx0-770*S,cy0-770*S,cx0+770*S,cy0+770*S],180,360,fill=c("Dusk Slate"),width=28)
d.rectangle([0,cy0,W*S,H*S],fill=c("Dusk Slate"))
_t=im.resize((W,H),Image.LANCZOS);_t.save("trim-motif.png",optimize=True);_t.save("trim-motif.webp",quality=85,method=6)
# ---------- #296 extensions ----------
import json,os,re
from PIL import ImageFont
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
def rgb(n,j=8):return tuple(int(v) for v in np.clip(h(P[n])+rng.normal(0,j,3),0,255))
def savew(im,name,q=82):im.save(name+".png",optimize=True);im.save(name+".webp",quality=q,method=6)
def tile_quad(d,quad,fill,grout=None):
  d.polygon(quad,fill=fill)
def textmask(txt,rows):
  f=ImageFont.truetype(FONT,100);bb=f.getbbox(txt);w,hh=bb[2]-bb[0],bb[3]-bb[1]
  im=Image.new("L",(w+20,hh+20),0);ImageDraw.Draw(im).text((10-bb[0],10-bb[1]),txt,font=f,fill=255)
  cols=max(1,round((w+20)/(hh+20)*rows));return np.array(im.resize((cols,rows),Image.BOX))>110
# room names from layout.json (#251)
LAY="/workspace/tag-gallery/data/layout.json"
rooms=json.load(open(LAY))["rooms"]
SIGNS=[]
SPAN=24.0;RS=0.80;BAND=0.12   # degrees per sign; mean radius & band height as fraction of hex apothem
def arc_sign(d,cx,cy,Rm,band,ang,span,name,seed):
  rr=np.random.default_rng(seed);rows=11
  arc=math.radians(span)*Rm
  m=textmask(name.upper(),9);tile=min(band/13,arc/(m.shape[1]+4))
  rows=int(band/tile);n=int(arc/tile);ox=(n-m.shape[1])//2;oy=(rows-9)//2
  for i in range(rows):           # i=0 outermost row (letter tops point outward)
    ra=Rm+band/2-(i+1)*tile;rb=ra+tile
    for j in range(n):
      a0=math.radians(ang-span/2+j*span/n);a1=math.radians(ang-span/2+(j+1)*span/n);g=0.08*(a1-a0);p=0.08*tile
      q=[(cx+(ra+p)*math.cos(a0+g),cy+(ra+p)*math.sin(a0+g)),(cx+(rb-p)*math.cos(a0+g),cy+(rb-p)*math.sin(a0+g)),(cx+(rb-p)*math.cos(a1-g),cy+(rb-p)*math.sin(a1-g)),(cx+(ra+p)*math.cos(a1-g),cy+(ra+p)*math.sin(a1-g))]
      if i in(0,rows-1) or j in(0,n-1):nm=["Terracotta Ember","Gilded Ochre"][(i+j)%2]
      elif 0<=i-oy<m.shape[0] and 0<=j-ox<m.shape[1] and m[i-oy,j-ox]:nm="Dusk Slate"
      else:nm=rr.choice(["Dawn Plaster"]*30+["Apricot Glow","Blue Light","Violet Light"])
      v=tuple(int(x) for x in np.clip(h(P[nm])+rr.normal(0,7,3),0,255))
      d.polygon(q,fill=v)
LAYOUT=[]
for idx,r in enumerate(rooms):
  name=r["label"].split("·")[0].strip();slug=r["id"]+"-"+re.sub(r"[^a-z0-9]+","-",name.lower()).strip("-")
  k=idx//2;ang=(30+60*k+(-15 if idx%2==0 else 15))%360
  SIGNS.append((r["id"],name,slug,ang))
  # texture: arc segment centered at top (screen angle -90), 1024 wide
  Rm=1000/(2*math.sin(math.radians(SPAN/2)));band=200
  sag=Rm+band/2-(Rm-band/2)*math.cos(math.radians(SPAN/2));Ht=int(sag)+12
  im=Image.new("RGBA",(1024,Ht),(0,0,0,0));d=ImageDraw.Draw(im)
  arc_sign(d,512,6+Rm+band/2,Rm,band,-90,SPAN,name,idx)
  savew(im,"sign-"+slug)
  LAYOUT.append({"id":r["id"],"label":r["label"],"text":name,"file":"sign-"+slug+".webp","angleDeg":ang,
    "radiusFracApothem":RS,"bandFracApothem":BAND,"spanDeg":SPAN,"radiusPxFloor2048":round(RS*N*0.47,1),
    "note":"angle from center, 0=+x (texture right), increasing toward +y (texture down); texture top = outward"})
# polar mosaic helper
def polar(d,cx,cy,r0,r1,rows,colfn,cols_fn=None):
  dr=(r1-r0)/rows
  for i in range(rows):
    ra,rb=r0+i*dr,r0+(i+1)*dr;n=cols_fn(i) if cols_fn else max(6,int(2*math.pi*(ra+rb)/2/dr))
    for j in range(n):
      a0=2*math.pi*j/n;a1=2*math.pi*(j+1)/n;g=0.06*(a1-a0)
      q=[(cx+(ra+1.5)*math.cos(a0+g),cy+(ra+1.5)*math.sin(a0+g)),(cx+(rb-1.5)*math.cos(a0+g),cy+(rb-1.5)*math.sin(a0+g)),
         (cx+(rb-1.5)*math.cos(a1-g),cy+(rb-1.5)*math.sin(a1-g)),(cx+(ra+1.5)*math.cos(a1-g),cy+(ra+1.5)*math.sin(a1-g))]
      c=colfn(i,j,n,(a0+a1)/2)
      if c:d.polygon(q,fill=c)
# checkout ring
S=2048;im=Image.new("RGBA",(S,S),(0,0,0,0));d=ImageDraw.Draw(im);cx=cy=S/2
d.ellipse([cx-1000,cy-1000,cx+1000,cy+1000],fill=(*h(P["Grout Ash"]).astype(int),255))
d.ellipse([cx-640,cy-640,cx+640,cy+640],fill=(0,0,0,0))
rows=12;tm=textmask(" CHECKOUT  •  CHECKOUT  • ",8);ncol=4*tm.shape[1]//2
def cring(i,j,n,a):
  if i in(0,rows-1):return rgb(["Terracotta Ember","Gilded Ochre"][j%2])
  if i in(1,rows-2):return rgb("Dawn Plaster")
  t_row=rows-3-i  # top of letters outward
  if 0<=t_row<tm.shape[0]:
    col=int(((a+math.pi/2)%(2*math.pi))/(2*math.pi)*tm.shape[1]*2)%tm.shape[1]
    if tm[t_row,col]:return rgb("Dusk Slate",5)
  return rgb(rng.choice(["Apricot Glow"]*18+["Blue Light","Violet Light"]))
polar(d,cx,cy,650,995,rows,cring,lambda i:tm.shape[1]*2)
savew(im,"checkout-ring")
# sun medallion
im=Image.new("RGBA",(S,S),(0,0,0,0));d=ImageDraw.Draw(im)
d.ellipse([cx-1010,cy-1010,cx+1010,cy+1010],fill=(*h(P["Grout Ash"]).astype(int),255))
def sun(i,j,n,a):
  r=i/26
  if r<0.28:return rgb(rng.choice(["Gilded Ochre"]*8+["Apricot Glow"]),10)
  if r<0.33:return rgb("Terracotta Ember")
  ray=(math.cos(16*a)+1)/2
  if i>=24:return rgb(["Dusk Slate","Gilded Ochre"][j%2])
  if ray>0.55+0.4*(r-0.33):return rgb(rng.choice(["Gilded Ochre","Gilded Ochre","Apricot Glow"]))
  return rgb(rng.choice(["Dawn Plaster"]*3+["Sunrise Coral","Blue Light","Complement Blue","Blue Deep","Violet Light","Contrast Violet"]))
polar(d,cx,cy,40,1000,26,sun)
d.ellipse([cx-44,cy-44,cx+44,cy+44],fill=rgb("Gilded Ochre"))
savew(im,"sun-medallion")
# dome glass
GLASS={"orange":("#F7A66E",0.42),"blue":("#5E9ADB",0.38)}
for k,(hx,al) in GLASS.items():
  G=1024;arr=np.zeros((G,G,4));base=h(hx)
  yy2,xx2=np.mgrid[0:G,0:G];u=(xx2+yy2)/64.0;v=(xx2-yy2)/64.0
  cu,cv=np.floor(u).astype(int),np.floor(v).astype(int);pid=(cu*131+cv*71)%997
  var=np.random.default_rng(7).random(1000)[pid]
  fu,fv=u-cu,v-cv;lead=np.minimum(np.minimum(fu,1-fu),np.minimum(fv,1-fv))<0.045
  ripple=0.04*np.sin(xx2/9.0+np.sin(yy2/13.0)*2)
  arr[...,:3]=np.clip(base*(0.88+0.24*var[...,None]+ripple[...,None]),0,255)
  arr[...,3]=255*(al+0.08*(var-0.5))
  arr[lead]=[58,52,50,235]
  savew(Image.fromarray(arr.astype(np.uint8),"RGBA"),"dome-glass-"+k)
# mockup (#296): floor, medallion, checkout ring, signs, domes, facades
M=1600;mk=Image.new("RGB",(M,M),tuple(h("#2E3A4A").astype(int)));O=(800,800);R=480
fl=out.resize((2*R+20,2*R+20),Image.LANCZOS);mask=Image.new("L",fl.size,0);md=ImageDraw.Draw(mask)
hexp=lambda R,o:[(o[0]+R*math.cos(math.radians(60*k)),o[1]+R*math.sin(math.radians(60*k))) for k in range(6)]
md.polygon(hexp(R,(R+10,R+10)),fill=255);mk.paste(fl,(O[0]-R-10,O[1]-R-10),mask)
med=Image.open("sun-medallion.png").resize((200,200),Image.LANCZOS);mk.paste(med,(O[0]-100,O[1]-100),med)
CR,CD=0.97,0.20   # checkout center radius & ring diameter (fractions of apothem), tucked into the 0°/180° corners
AP0=R*0.866;rp=int(CD*AP0);ring=Image.open("checkout-ring.png").resize((rp,rp),Image.LANCZOS)
CHECKOUTS=[]
for ca in(0,180):
  rx=O[0]+CR*AP0*math.cos(math.radians(ca))
  dd0=ImageDraw.Draw(mk);pr=rp*0.31;dd0.ellipse([rx-pr,O[1]-pr,rx+pr,O[1]+pr],fill=(40,60,110))
  mk.paste(ring,(int(rx-rp/2),int(O[1]-rp/2)),ring)
  CHECKOUTS.append({"id":"checkout-"+("east" if ca==0 else "west"),"angleDeg":ca,"radiusFracApothem":CR,"radiusPxFloor2048":round(CR*N*0.47,1),"ringFile":"checkout-ring.webp","ringDiameterFracApothem":CD,
   "clearance":"0.12 apothem to the nearest wall faces; 0.02 apothem past the outer corners of the adjacent signs (345° and 15°)"})
dd=ImageDraw.Draw(mk);walls=["Dawn Plaster","Apricot Glow","Rose Quartz","Horizon Blue","Sea Sage","Sunrise Coral"]
tm=Image.open("trim-motif.png").resize((150,75))
for k in range(6):
  a=math.radians(60*k);b=math.radians(60*(k+1))
  pin=[(O[0]+R*math.cos(a),O[1]+R*math.sin(a)),(O[0]+R*math.cos(b),O[1]+R*math.sin(b))]
  pout=[(O[0]+700*math.cos(b),O[1]+700*math.sin(b)),(O[0]+700*math.cos(a),O[1]+700*math.sin(a))]
  dd.polygon(pin+pout,fill=c(walls[k])[:3],outline=c("Dusk Slate")[:3],width=6);dd.line(pout,fill=c("Terracotta Ember")[:3],width=14)
  m=math.radians(60*k+30);dx,dy=math.cos(m),math.sin(m)
  g=Image.open("dome-glass-"+("orange" if k%2 else "blue")+".png").resize((150,150));dm=Image.new("L",(150,150),0);ImageDraw.Draw(dm).ellipse([0,0,149,149],fill=255)
  gm=Image.fromarray((np.array(g)[...,3]*(np.array(dm)/255)).astype(np.uint8));gc=Image.new("RGB",(150,150),c("Dawn Plaster")[:3]);gc.paste(g.convert("RGB"),(0,0),gm)
  mk.paste(gc,(int(O[0]+620*dx-75),int(O[1]+620*dy-75)),dm);dd.ellipse([O[0]+620*dx-75,O[1]+620*dy-75,O[0]+620*dx+75,O[1]+620*dy+75],outline=c("Dusk Slate")[:3],width=4)
  door=(O[0]+(R*0.866+22)*dx,O[1]+(R*0.866+22)*dy)
  dd.ellipse([door[0]-30,door[1]-30,door[0]+30,door[1]+30],fill=c("Dusk Slate")[:3],outline=c("Gilded Ochre")[:3],width=8)
  t2=tm.rotate(-math.degrees(m)+90,expand=True);mk.paste(t2,(int(O[0]+(R*0.866+80)*dx-t2.width/2),int(O[1]+(R*0.866+80)*dy-t2.height/2)),t2)
# 12 curved signs at ray ends
AP=R*0.866
for i,(rid,name,slug,ang) in enumerate(SIGNS):arc_sign(dd,O[0],O[1],RS*AP,BAND*AP,ang,SPAN,name,i)
json.dump({"coords":"floor texture: center (1024,1024) of 2048; apothem = 0.47*2048 px; angle 0 = +x, increasing toward +y (clockwise on screen)","signs":LAYOUT,"checkouts":CHECKOUTS},open("signs.json","w"),indent=1)
mk.save("mockup.png",optimize=True);mk.save("mockup.webp",quality=82,method=6)
open("palette.md","w").write("""# tjm.art/play — Courtyard Exterior Palette & Sunburst Trim

| Name | Hex | Use |
|---|---|---|
"""+"\n".join(f"| {k} | `{v}` | {u} |" for (k,v),u in zip(P.items(),[
"Main wall field (primary facade); tesserae highlights in floor","Alternate wall color; arch ray (odd); floor mid-ring","Alternate wall color; arch ray (even); floor ring","Accent walls; arch outer band; floor outer ring","Strong entrance rays in floor; roofline cap/cornice; trim tick marks","Accent walls; floor outer edge (sky)","Door surrounds, shutters, arch outline/keystone base","Arch sun core; door hardware & small accents; floor center","Floor grout; stone sills & plinths","Accent walls; planter/shutter alt","Blue accent mid shade: ~12% of floor tesserae (mixed light/mid/deep) evenly scattered; dome-glass-blue base","Violet accent mid shade: ~12% of floor tesserae (mixed light/mid/deep) evenly scattered","Blue accent light shade","Blue accent deep shade","Violet accent light shade","Violet accent deep shade"]))+"""

## Placement spec
- **Walls:** alternate Dawn Plaster / Apricot Glow / Rose Quartz / Horizon Blue / Sea Sage / Sunrise Coral — one per hex building.
- **Trim & window frames:** Dawn Plaster on colored walls; Dusk Slate on Dawn Plaster wall.
- **Door surrounds:** Dusk Slate with a thin Gilded Ochre inner reveal.
- **Sunburst arches over entrances:** 21 alternating Apricot Glow / Rose Quartz rays with Dawn Plaster gaps, Sunrise Coral band, Dawn Plaster ring, Gilded Ochre sun core, Terracotta Ember ticks, Dusk Slate outer rim (see trim-motif.png).
- **Roofline:** Terracotta Ember cornice cap over a Dawn Plaster frieze.
- **Shutters:** Dusk Slate (Sea Sage alternate).
- **Accents:** Gilded Ochre hardware, lamps, house numbers.

## Dome glass (leaded panes, dome-glass-*.png)
- **dome-glass-orange:** pane tint `#F7A66E`, alpha 0.42 (±0.04 per pane, ~#F7A66E6B)
- **dome-glass-blue:** pane tint `#5E9ADB`, alpha 0.38 (±0.04 per pane, ~#5E9ADB61)
- **Lead came:** `#3A3432`, alpha 0.92 (~#3A3432EB), diamond quarries ~90 px

## Mosaic pieces
- Room signs: Grout Ash bed, Dusk Slate letters, Dawn Plaster field with light blue/violet/apricot flecks, Terracotta/Gilded Ochre border.
- Checkout ring: Apricot field, Dusk Slate CHECKOUT letters, Terracotta/Ochre rims.
- Sun medallion: Gilded Ochre core, Terracotta ring, 16 gold rays over Dawn Plaster with blue/violet flecks, Dusk Slate/Ochre rim.

## Sign & checkout placement
See signs.json. 12 curved mosaic signs, each an arc band spanning 24° at 0.80 × apothem (band 0.11 × apothem), two per entrance at the entrance angle ±15° (6° clear gap between neighbours). Two checkout portals with CHECKOUT rings at 0° and 180° (opposite sides, in the hex corners between entrances), center 0.97 × apothem from center, ring diameter 0.20 × apothem (shrunk from 0.31 so it clears the adjacent signs at 0.80 ± 0.06 × apothem and sits about 0.12 × apothem inside the wall faces).

## Floor
Center Gilded Ochre → Apricot Glow → Rose Quartz → Sunrise Coral → Horizon Blue at the hex edges, blended ~28% toward Dawn Plaster for pastel; 24 fine rays alternate with Dawn Plaster; six strong Terracotta Ember rays aim at the six entrances (flat-top hex, edge midpoints at 30°+60°k); Grout Ash grout; ~12% evenly scattered blue tesserae (random mix of #8DB8E8 / #5E9ADB / #3A6FB8, slight per-tile jitter) as an orange complement; ~12% evenly scattered violet (#B9A0E0 / #9A78CF / #6E4FA8 mix) against the sunny yellow; ~14 px irregular tesserae.
""")
