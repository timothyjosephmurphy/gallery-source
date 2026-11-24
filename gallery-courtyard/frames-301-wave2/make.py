#!/usr/bin/env python3
"""#301 frame variants wave 2 (oak, maple, float-charcoal, copper liner). Same strip UV as frames-301:
U along moulding (tiles seamlessly), V across profile 0=back/wall .. 1=canvas lip. numpy+Pillow, seed 3013. python3 make.py"""
import json, os, numpy as np
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__)); rng=np.random.default_rng(3013)
W,H=2048,256
B=[(0,.10,'back'),(.10,.34,'outer_bevel'),(.34,.72,'face'),(.72,.88,'step_cove'),(.88,1.0,'liner_lip')]
v=np.linspace(0,1,H)[:,None]; u=np.linspace(0,1,W,endpoint=False)[None,:]
def ss(a,b,x): t=np.clip((x-a)/(b-a),0,1); return t*t*(3-2*t)
def tn(fu,fv,amp,oct=6):  # tileable in U (integer frequencies)
    n=np.zeros((H,W))
    for k in range(oct):
        f=int(fu*2**k); n+=np.sin(2*np.pi*(u*f+rng.uniform())+v*fv*(k+1)*rng.uniform(.5,2)+rng.uniform(0,6.28))/(2**k)
    return n*amp
H0=0.15*ss(.10,.34,v)+0.25*ss(.12,.30,v)**.6+0.04*np.sin(np.clip((v-.34)/.38,0,1)*np.pi)-0.12*ss(.72,.80,v)+0.06*ss(.84,.88,v)-0.05*ss(.95,1,v)
H0=np.broadcast_to(H0,(H,W)).copy()
def normal(h,k=0.6):
    gx=(np.roll(h,-1,1)-np.roll(h,1,1))/2*H*0.9; gy=np.gradient(h*H*0.9,axis=0)
    n=np.stack([-gx*k,gy*k,np.ones_like(h)],-1); n/=np.linalg.norm(n,axis=-1,keepdims=True)
    return ((n*.5+.5)*255).astype(np.uint8)
def ao_map(extra=0):
    a=1-0.5*ss(.70,.80,v)*(1-ss(.80,.86,v))*2-0.3*(1-ss(0,.1,v))
    a=np.broadcast_to(a,(H,W))-extra
    return (np.clip(a,0,1)*255).astype(np.uint8)
def srgb(c): return (np.clip(c,0,1)**(1/2.2)*255).astype(np.uint8)
def rough_bands(vals,noise):
    r=np.where(v<.10,vals[0],np.where(v<.34,vals[1],np.where(v<.72,vals[2],np.where(v<.88,vals[3],vals[4]))))
    return (np.clip(np.broadcast_to(r,(H,W))+noise,0,1)*255).astype(np.uint8)
curv=lambda h:np.clip(-np.gradient(np.gradient(h,axis=0),axis=0)*H*H*0.02,0,1)
out={}
def wood(base,rings,warp_amp,fig,pore_rate,shade):
    warp=tn(3,2,warp_amp,4)
    ring=np.sin(2*np.pi*(v*rings+warp*12+tn(2,1,0.05,3)))
    fine=tn(40,30,1,3)
    figure=np.sin(2*np.pi*(u*64+tn(4,3,0.3,3)))*fig   # maple curl / ray fleck
    pores=(rng.random((H,W))>pore_rate)*1.0; pores=np.maximum(pores,np.roll(pores,1,1)*.6)
    g=0.5+0.25*ring+0.08*fine+0.12*figure
    c=np.array(base)[None,None]*(0.8+0.4*g[...,None])
    c*=(1-shade*pores[...,None]); c*=(1+0.2*curv(H0)[...,None]); c[v[:,0]<.10]*=0.6
    h=H0+0.0012*ring-0.0025*pores+0.0006*figure+tn(40,6,0.0004)
    return c,h,g,pores
# oak: golden, strong open-pore rays
c,h,g,p=wood([0.48,0.32,0.15],12,0.025,0.0,0.97,0.30)
out['frame-oak']=srgb(c); out['frame-oak_n']=normal(h); out['frame-oak_r']=rough_bands([.85,.55,.50,.6,.46],0.04*g+0.08*p); out['frame-oak_ao']=ao_map(0.18*p)
# maple: pale, tight, subtle curl figure
c,h,g,p=wood([0.70,0.56,0.38],18,0.01,0.6,0.995,0.12)
out['frame-maple']=srgb(c); out['frame-maple_n']=normal(h,0.5); out['frame-maple_r']=rough_bands([.85,.5,.44,.55,.42],0.03*g); out['frame-maple_ao']=ao_map(0.06*p)
# float charcoal: thin modern float; flatter profile, near-matte
Hf=0.08*ss(.10,.20,v)+0.02*ss(.20,.34,v)-0.10*ss(.70,.74,v)+0.04*ss(.86,.88,v); Hf=np.broadcast_to(Hf,(H,W)).copy()
brush=tn(28,4,1,4)
c=np.array([0.055,0.056,0.058])[None,None]*(1+0.05*brush[...,None]+0.3*curv(Hf)[...,None]); c[v[:,0]<.10]*=0.7
c*=(1-0.35*ss(.70,.76,v)[...,None])  # shadow gap reveal
out['frame-float-charcoal']=srgb(c); out['frame-float-charcoal_n']=normal(Hf+0.0003*brush); out['frame-float-charcoal_r']=rough_bands([.9,.74,.72,.8,.66],0.02*brush)
out['frame-float-charcoal_ao']=ao_map(0.25*ss(.70,.74,v)*(1-ss(.76,.80,v)))
# copper liner 2048x64
lv=np.linspace(0,1,64)[:,None]
s=np.array([.55,.27,.15])*(0.7+0.3*np.sin(lv*np.pi))[...,None]
s=np.broadcast_to(s,(64,W,3))*(1+rng.normal(0,.04,(64,W,1)))
s=s+np.array([0.0,0.02,0.02])*np.clip(tn(6,1,1,2)[:64,:,None],0,1)*0.4   # faint patina drift
out['frame-liner-copper']=srgb(s)
for k,im in out.items():
    I=Image.fromarray(im); I.save(f"{HERE}/{k}.webp",quality=90); I.save(f"{HERE}/{k}.png",optimize=True)
    I.resize((I.width//2,max(I.height//2,8)),Image.LANCZOS).save(f"{HERE}/{k}.phone.webp",quality=85)
def mat(id,metal=0.0,env=0.6):
    return {"albedo":f"{id}.webp","normal":f"{id}_n.webp (OpenGL +Y)","roughness":f"{id}_r.webp","ao":f"{id}_ao.webp","png_masters":True,
            "material":{"metalness":metal,"roughness_scale":1.0,"normalScale":[1,1],"envMapIntensity":env}}
J={"issue":"studio-tracker#301","wave":2,"extends":["../frames-301/frames.json","../frames-301-variants/frames-variants.json"],"style":"original procedural, painterly",
   "strip":{"size":[W,H],"phone":[W//2,H//2],"u":"along moulding, tiles; ~1 repeat per 0.6 m","v":"across profile 0=back/wall -> 1=canvas lip"},
   "uv_bands":{n:[a,b] for a,b,n in B},"phone_suffix":".phone.webp",
   "variants":{"frame-oak":{**mat("frame-oak",0,0.5),"use":"warm landscapes, Bass Coast Sunrises, Forest Triptych"},
               "frame-maple":{**mat("frame-maple",0,0.5),"use":"light watercolors, Hummingbirds, airy rooms"},
               "frame-float-charcoal":{**mat("frame-float-charcoal",0,0.35),"use":"contemporary / Bitcoiners, large canvases; float with shadow gap","note":"flatter profile; shadow-gap reveal baked at v .70-.76"}},
   "liners":{"frame-liner-copper":{"file":"frame-liner-copper.webp","png":"frame-liner-copper.png","px":[W,64],"map_v":[.88,1.0],"metalness":0.65,"roughness":0.42,"pairs":"oak, maple, walnut, float-charcoal"}},
   "contact_shadow":"reuse ../frames-301/frame-contact-shadow.*"}
json.dump(J,open(f"{HERE}/frames-wave2.json","w"),indent=1)
from PIL import ImageDraw
Pv=Image.new('RGB',(1220,560),(0xF3,0xE6,0xD8))
items=[('frame-oak','frame-liner-copper'),('frame-maple','frame-liner-copper'),('frame-float-charcoal','frame-liner-copper')]
for i,(f,l) in enumerate(items):
    st=Image.open(f"{HERE}/{f}.webp").convert('RGB'); ln=Image.open(f"{HERE}/{l}.webp").convert('RGB')
    x0,y0,w,hh=40+i*390,60,350,440; t=48 if i<2 else 30
    fr=Image.new('RGB',(w,hh)); fr.paste(Image.new('RGB',(w-2*t,hh-2*t),[(0x9D,0xB7,0xCF),(0xE9,0xA9,0xA6),(0x8F,0xAE,0x9E)][i]),(t,t))
    top=st.crop((0,0,w,256)).resize((w,t)).transpose(Image.FLIP_TOP_BOTTOM)
    fr.paste(top,(0,0)); fr.paste(top.transpose(Image.FLIP_TOP_BOTTOM),(0,hh-t))
    side=st.crop((0,0,hh,256)).resize((hh,t)).rotate(90,expand=True)
    fr.paste(side.transpose(Image.FLIP_LEFT_RIGHT),(0,0)); fr.paste(side,(w-t,0))
    lc=tuple(np.array(ln).reshape(-1,3).mean(0).astype(int)); ImageDraw.Draw(fr).rectangle([t-4,t-4,w-t+3,hh-t+3],outline=lc,width=4)
    Pv.paste(Image.new('RGB',(w,hh),(0xC9,0xBD,0xB0)),(x0+8,y0+10)); Pv.paste(fr,(x0,y0))
Pv.save(f"{HERE}/preview.png")
