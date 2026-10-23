# #295: Visual's sunburst mosaic generator (gallery-courtyard/gen.py, floor part) with strong rays aimed at the layout's real door rays
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
hexr=r/(N*0.5)
ray=0.5+0.5*np.cos(24*ang)            # fine rays
import json
RA=json.load(open('/workspace/play-tags/tools/rays295.json'))  # strong rays at this layout's real door angles (W.rays)
strong=np.zeros(ang.shape)
for a0 in RA:
  dd=np.abs((ang-a0+np.pi)%(2*np.pi)-np.pi); strong=np.maximum(strong,np.clip(1-dd*r/(0.016*N),0,1))
strong*=(r>N*0.04)
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
for n in(2048,1024):
  out.resize((n,n),Image.LANCZOS).save(f"/workspace/play-tags/public/courtyard/sunburst-295-{n}.webp",quality=80,method=6)
