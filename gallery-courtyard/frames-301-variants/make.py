#!/usr/bin/env python3
"""#301 frame variants (walnut, white, dark-ornate, silver liner). Same strip UV as frames-301:
U along moulding (tiles seamlessly), V across profile 0=back/wall .. 1=canvas lip. numpy+Pillow, seed 3012. python3 make.py"""
import json, os, numpy as np
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__)); rng=np.random.default_rng(3012)
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
# --- walnut: warped long grain + pores, warm oiled
warp=tn(3,2,0.02,4)
ring=np.sin(2*np.pi*(v*9+warp*12+tn(2,1,0.05,3)))
fine=tn(40,30,1,3)
pores=(rng.random((H,W))>0.985)*1.0
pores=np.maximum(pores,np.roll(pores,1,1)*.6)
g=0.5+0.25*ring+0.08*fine
lin=np.array([0.20,0.105,0.055])[None,None]*(0.75+0.5*g[...,None])
lin*= (1-0.35*pores[...,None]); lin*=(1+0.25*curv(H0)[...,None]); lin[v[:,0]<.10]*=0.55
h=H0+0.0015*ring+0.003*pores*-1+tn(40,6,0.0004)
out['frame-walnut']=srgb(lin); out['frame-walnut_n']=normal(h); out['frame-walnut_r']=rough_bands([.85,.52,.48,.6,.45],0.05*g-0.03*ring*0+0.06*pores)
out['frame-walnut_ao']=ao_map(0.15*pores)
# --- white satin float: soft brush strokes, faint warm/blue watercolor drift
brush=tn(24,4,1,4); drift=tn(1,1,1,2)
c=np.array([0.86,0.84,0.80])[None,None]*(1+0.012*brush[...,None])
c=c+np.stack([0.008*drift,0.004*drift,-0.006*drift],-1)
c*=(1+0.03*curv(H0)[...,None]); c[v[:,0]<.10]*=0.82; c*= (1-0.06*ss(.72,.80,v)[...,None])
out['frame-white']=srgb(c); out['frame-white_n']=normal(H0+0.0004*brush); out['frame-white_r']=rough_bands([.85,.5,.46,.55,.42],0.015*brush); out['frame-white_ao']=ao_map()
# --- dark ornate: scroll/leaf relief in face band, period W/16
P=16; ph=u*P*2*np.pi; fv=np.clip((v-.36)/.34,0,1)
scroll=np.sin(ph+np.sin(fv*np.pi)*2.2)*np.sin(fv*np.pi)            # S-curve vine
leaf=np.exp(-((np.mod(u*P*2,1)-.5)**2/0.02+(fv-.5-0.25*np.sin(ph))**2/0.03))
stem=np.exp(-((fv-.5-0.25*np.sin(ph))**2)/0.004)
relief=(0.6*leaf+0.5*stem+0.15*np.clip(scroll,0,1))*((v>.36)&(v<.70))
beads=np.exp(-((np.mod(u*P*8,1)-.5)**2+((v-.80)/.03)**2)/0.05)*((v>.76)&(v<.85))
h=H0+0.010*relief+0.004*beads+tn(32,6,0.0004)
rel=np.clip(relief+beads,0,1)
c=np.array([0.022,0.019,0.016])[None,None]*(1+0.8*curv(h*0.5)[...,None]+0.9*rel[...,None])
c=c+np.array([0.02,0.015,0.006])[None,None]*rel[...,None]**2   # worn high-point warmth
out['frame-dark-ornate']=srgb(c); out['frame-dark-ornate_n']=normal(h,0.8)
out['frame-dark-ornate_r']=rough_bands([.85,.48,.44,.55,.36],-0.12*rel+tn(32,2,0.012))
out['frame-dark-ornate_ao']=ao_map(0.25*np.clip(stem*0.3+(1-rel)*((v>.36)&(v<.70))*0.15,0,0.4)*np.broadcast_to(1.0,(H,W)))
# --- silver/pewter liner 2048x64 (like gold liner)
lv=np.linspace(0,1,64)[:,None]
s=np.array([.42,.43,.45])*(0.72+0.28*np.sin(lv*np.pi))[...,None]
s=np.broadcast_to(s,(64,W,3))*(1+rng.normal(0,.035,(64,W,1)))
out['frame-liner-silver']=srgb(s)
for k,im in out.items():
    I=Image.fromarray(im); I.save(f"{HERE}/{k}.webp",quality=90); I.save(f"{HERE}/{k}.png",optimize=True)
    I.resize((I.width//2,max(I.height//2,8)),Image.LANCZOS).save(f"{HERE}/{k}.phone.webp",quality=85)
def mat(id,metal=0.0,env=0.6):
    return {"albedo":f"{id}.webp","normal":f"{id}_n.webp (OpenGL +Y)","roughness":f"{id}_r.webp","ao":f"{id}_ao.webp","png_masters":True,
            "material":{"metalness":metal,"roughness_scale":1.0,"normalScale":[1,1],"envMapIntensity":env}}
J={"issue":"studio-tracker#301","extends":"../frames-301/frames.json","style":"original procedural, painterly",
   "strip":{"size":[W,H],"phone":[W//2,H//2],"u":"along moulding, tiles; ~1 repeat per 0.6 m","v":"across profile 0=back/wall -> 1=canvas lip"},
   "uv_bands":{n:[a,b] for a,b,n in B},"phone_suffix":".phone.webp",
   "variants":{"frame-walnut":{**mat("frame-walnut",0,0.5),"use":"portraits, Father Paul, Reiki, warm rooms"},
               "frame-white":{**mat("frame-white",0,0.5),"use":"small watercolors, light rooms"},
               "frame-dark-ornate":{**mat("frame-dark-ornate",0,0.7),"use":"festival / Burning Man, Temples (optional)","note":"relief period = 1/16 U; keep U repeat in world mm so motifs don't stretch"},
               "frame-black":{"see":"../frames-301/","use":"landscapes (default)"}},
   "liners":{"frame-liner-silver":{"file":"frame-liner-silver.webp","png":"frame-liner-silver.png","px":[W,64],"map_v":[.88,1.0],"metalness":0.6,"roughness":0.4,"pairs":"walnut, white, dark-ornate"},
             "frame-liner-gold":{"see":"../frames-301/frame-liner-gold.webp"}},
   "contact_shadow":"reuse ../frames-301/frame-contact-shadow.*"}
json.dump(J,open(f"{HERE}/frames-variants.json","w"),indent=1)
# preview: four frames on Dawn Plaster
Pv=Image.new('RGB',(1600,560),(0xF3,0xE6,0xD8))
gold=Image.open(os.path.join(HERE,'../frames-301/frame-black.webp')) if os.path.exists(os.path.join(HERE,'../frames-301/frame-black.webp')) else None
items=[('frame-walnut','frame-liner-gold'),('frame-white','frame-liner-silver'),('frame-dark-ornate','frame-liner-silver'),('frame-black','frame-liner-gold')]
def load(k):
    p=f"{HERE}/{k}.webp"
    return Image.open(p if os.path.exists(p) else f"{HERE}/../frames-301/{k}.webp").convert('RGB')
for i,(f,l) in enumerate(items):
    st=load(f).resize((1024,64)); ln=load(l).resize((1024,10))
    x0,y0,w,hh=40+i*390,60,350,440; t=48
    fr=Image.new('RGB',(w,hh),(0,0,0)); 
    art=Image.new('RGB',(w-2*t,hh-2*t),[(0x9D,0xB7,0xCF),(0xE9,0xA9,0xA6),(0xF7,0xA6,0x6E),(0x8F,0xAE,0x9E)][i])
    fr.paste(art,(t,t))
    top=st.crop((0,0,w,64)).resize((w,t)).transpose(Image.FLIP_TOP_BOTTOM)  # v1 (lip) toward art
    fr.paste(top,(0,0)); fr.paste(top.transpose(Image.FLIP_TOP_BOTTOM),(0,hh-t))
    side=st.crop((0,0,hh,64)).resize((hh,t)).rotate(90,expand=True)
    fr.paste(side.transpose(Image.FLIP_LEFT_RIGHT),(0,0)); fr.paste(side,(w-t,0))
    d_=Image.new('RGB',(w-2*t+12,hh-2*t+12)); d_.paste(ln.resize((w-2*t+12,6)),(0,0))
    from PIL import ImageDraw; dd=ImageDraw.Draw(fr); lc=tuple(np.array(ln).reshape(-1,3).mean(0).astype(int))
    dd.rectangle([t-4,t-4,w-t+3,hh-t+3],outline=lc,width=4)
    sh=Image.new('RGB',(w,hh),(0xC9,0xBD,0xB0)); Pv.paste(sh,(x0+8,y0+10)); Pv.paste(fr,(x0,y0))
Pv.save(f"{HERE}/preview.png")
