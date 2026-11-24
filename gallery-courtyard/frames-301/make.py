#!/usr/bin/env python3
"""Procedural museum-black moulding strip maps for studio-tracker #301. Original design.
Strip: U = along moulding (tiles), V = across profile (0=back/wall .. 1=canvas lip)."""
import json, numpy as np
from PIL import Image
rng=np.random.default_rng(301)
W,H=2048,256
# bands (v0,v1,name)
B=[(0,.10,'back'),(.10,.34,'outer_bevel'),(.34,.72,'face'),(.72,.88,'step_cove'),(.88,1.0,'liner_lip')]
v=np.linspace(0,1,H)[:,None]; u=np.linspace(0,1,W,endpoint=False)[None,:]
def ss(a,b,x): t=np.clip((x-a)/(b-a),0,1); return t*t*(3-2*t)
# height profile across V (mm-ish normalized)
h=0.15*ss(.10,.34,v)+0.25*ss(.12,.30,v)**.6 + 0.10*np.sin(np.clip((v-.34)/.38,0,1)*np.pi)*0.4 \
  -0.12*ss(.72,.80,v)+0.06*ss(.84,.88,v)-0.05*ss(.95,1,v)
h=np.broadcast_to(h,(H,W)).copy()
# fine tileable lacquer/brush grain along U
def tnoise(fu,fv,amp):
    n=np.zeros((H,W))
    for k in range(6):
        f=fu*(2**k); ph=rng.uniform(0,6.28,(1,1))
        n+=np.sin(2*np.pi*(u*f+rng.uniform())+v*fv*(k+1)*rng.uniform(.5,2)+ph)/(2**k)
    return n*amp
grain=tnoise(64,6,0.0006)+rng.normal(0,1,(H,W))*0.0002
hh=h+grain
dy,dx=np.gradient(hh*H*0.9)
nz=np.ones_like(dx); n=np.stack([-dx*0.6,dy*0.6,nz],-1)  # OpenGL +Y (V up = image up flipped)
n/=np.linalg.norm(n,axis=-1,keepdims=True)
nrm=((n*.5+.5)*255).astype(np.uint8)
# albedo near-black, edge lift on ridges
curv=np.clip(-np.gradient(np.gradient(h,axis=0),axis=0)*H*H*0.02,0,1)
base=0.018+0.012*ss(.10,.34,v)-0.008*ss(.72,.86,v)
alb=base+0.03*curv+grain*4
col=np.stack([alb*1.0,alb*0.98,alb*0.95],-1)
albedo=(np.clip(col,0,1)**(1/2.2)*255).astype(np.uint8)
# roughness: satin face .42, lip .35, back .8
r=np.where(v<.10,.82,np.where(v<.34,.45,np.where(v<.72,.40,np.where(v<.88,.55,.34))))
r=np.broadcast_to(r,(H,W))+tnoise(32,2,0.012)
rough=(np.clip(r,0,1)*255).astype(np.uint8)
# AO
ao=1-0.5*ss(.70,.80,v)*(1-ss(.80,.86,v))*2-0.3*(1-ss(.0,.1,v))
ao=(np.clip(np.broadcast_to(ao,(H,W)),0,1)*255).astype(np.uint8)
# liner accent: muted antique gold, painterly
lv=np.linspace(0,1,64)[:,None]
g=np.array([.42,.33,.17])*(0.75+0.25*np.sin(lv*np.pi))[...,None]
g=np.broadcast_to(g,(64,W,3))*(1+np.random.default_rng(7).normal(0,.04,(64,W,1)))
liner=(np.clip(g,0,1)**(1/2.2)*255).astype(np.uint8)
# wall contact shadow: 512x512 alpha frame ring (9-slice), soft
S=512; y,x=np.mgrid[0:S,0:S]/(S-1)
d=np.minimum(np.minimum(x,1-x),np.minimum(y,1-y))
a=np.clip(1-d/0.5,0,1)**3*0.6; a[(d>0.18)]=a[(d>0.18)]*0  # inside covered by frame
a=np.clip(1-np.abs(d-0.12)/0.12,0,1)**2*0.55; a*=(1+0.15*(y-.5))  # slight bias down
sh=np.zeros((S,S,4),np.uint8); sh[...,3]=(np.clip(a,0,1)*255).astype(np.uint8)
out={'frame-black':albedo,'frame-black_n':nrm,'frame-black_r':rough,'frame-black_ao':ao,'frame-liner-gold':liner}
for k,im in out.items():
    I=Image.fromarray(im); I.save(k+'.webp',quality=90)
    I.resize((I.width//2,max(I.height//2,8)),Image.LANCZOS).save(k+'.phone.webp',quality=85)
S_=Image.fromarray(sh,'RGBA'); S_.save('frame-contact-shadow.png'); S_.save('frame-contact-shadow.webp',lossless=True)
S_.resize((256,256),Image.LANCZOS).save('frame-contact-shadow.phone.webp',lossless=True)
# preview
P=Image.new('RGB',(1024,1100),(40,38,36)); yy=10
for k in out:
    I=Image.open(k+'.webp').convert('RGB').resize((1004,128 if 'liner' not in k else 40)); P.paste(I,(10,yy)); yy+=I.height+12
bg=Image.new('RGBA',(256,256),(200,190,175,255)); bg.alpha_composite(S_.resize((256,256)))
P.paste(bg.convert('RGB'),(10,yy)); P.save('preview.png')
json.dump({'issue':'studio-tracker#301','style':'museum black satin lacquer, original procedural',
 'strip':{'size':[W,H],'phone':[W//2,H//2],'u':'along moulding, tiles; scale U by world length (~1 repeat per 0.6 m)','v':'across profile 0=back/wall -> 1=canvas lip'},
 'uv_bands':{n:[a,b] for a,b,n in B},
 'maps':{'albedo':'frame-black.webp','normal':'frame-black_n.webp (OpenGL +Y)','roughness':'frame-black_r.webp','ao':'frame-black_ao.webp','liner_optional':'frame-liner-gold.webp (map to v .88-1.0, metalness .6 rough .45)','contact_shadow':'frame-contact-shadow.png/.webp (RGBA, 9-slice quad 1-2 mm off wall, multiply/alpha, slight downward bias)'},
 'phone_suffix':'.phone.webp','material':{'metalness':0.0,'roughness_scale':1.0,'normalScale':[1,1],'envMapIntensity':0.6},
 'profile_mm':{'face_width':55,'depth_off_wall':38,'liner_width':8,'bevel':14},
 'instancing':'One shared InstancedMesh (Gallery geometry); per-instance scale -> fix corner miters by building frame from 4 mitred sides or keep UV in world mm so texture does not stretch; no per-frame lights; contact shadow as second instanced quad sharing one material.'},open('frames.json','w'),indent=1)
