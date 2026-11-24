#!/usr/bin/env python3
"""#340 theater look-dev light probes: soft LDR equirect env maps (2:1) for three.js PMREM. Original, procedural.
numpy+Pillow, seed 340. python3 make.py"""
import json, os, numpy as np
from PIL import Image, ImageDraw
HERE=os.path.dirname(os.path.abspath(__file__)); rng=np.random.default_rng(340)
W,H=1024,512
lon=(np.arange(W)+.5)/W*2*np.pi-np.pi; lat=np.pi/2-(np.arange(H)+.5)/H*np.pi
LON,LAT=np.meshgrid(lon,lat); D=np.stack([np.cos(LAT)*np.sin(LON),np.sin(LAT),np.cos(LAT)*np.cos(LON)],-1)
def dirv(az,el): a,e=np.radians(az),np.radians(el); return np.array([np.cos(e)*np.sin(a),np.sin(e),np.cos(e)*np.cos(a)])
def lobe(az,el,deg,col,amp):
    c=np.clip((D@dirv(az,el)),-1,1); ang=np.degrees(np.arccos(c))
    return amp*np.exp(-(ang/deg)**2)[...,None]*np.array(col)
def hx(h): return np.array([int(h[i:i+2],16)/255 for i in (1,3,5)])**2.2
BLACK=np.array([0.006,0.005,0.006])
def base(floor=0.012,ceil=0.004):
    y=D[...,1:2]; return BLACK+np.where(y<0,floor*np.abs(y)**0.5,ceil*y)
P={
 "probe-warm-key":[(35,40,22,hx("#FFC58A"),1.6),(-60,15,45,hx("#F7A66E"),0.25),(180,10,70,hx("#5E7289"),0.05)],
 "probe-cool-wash":[(0,60,55,hx("#9DB7CF"),0.9),(-110,25,40,hx("#8DB8E8"),0.35),(120,20,50,hx("#5E9ADB"),0.2)],
 "probe-magenta-accent":[(160,30,25,hx("#C76BA8"),0.9),(-30,35,40,hx("#F3E6D8"),0.25),(60,10,50,hx("#9A78CF"),0.18)],
 "probe-neutral-house":[(0,85,70,hx("#F3E6D8"),0.28),(90,40,60,hx("#E9D7C0"),0.08),(-90,40,60,hx("#E9D7C0"),0.08)],
}
HINT={"probe-warm-key":{"exposure":1.0,"envMapIntensity":0.9,"toneMapping":"ACESFilmic","use":"warm tungsten key from stage-left high; pairs with gobo-breakup warm"},
 "probe-cool-wash":{"exposure":0.9,"envMapIntensity":0.8,"toneMapping":"ACESFilmic","use":"cool LED top/side wash; scene transitions, gobo-dots"},
 "probe-magenta-accent":{"exposure":0.85,"envMapIntensity":0.6,"toneMapping":"ACESFilmic","use":"restrained magenta back-rim (upstage); accents only, keep under 0.7"},
 "probe-neutral-house":{"exposure":0.7,"envMapIntensity":0.5,"toneMapping":"ACESFilmic","use":"dim house lights between pieces / walk-in"}}
J={"issue":340,"related":[10,357],"preview_only":True,"approved":False,"format":"LDR sRGB equirectangular 2:1 (not photographic HDRI)",
   "three":"tex=loader.load(file); tex.mapping=THREE.EquirectangularReflectionMapping; tex.colorSpace=THREE.SRGBColorSpace; scene.environment=pmrem.fromEquirectangular(tex).texture",
   "orientation":"u=0.5 faces +Z (stage/audience axis: +Z = toward audience); v=0 top (zenith)","probes":[]}
sheet=[]
for k,L in P.items():
    c=base()
    for az,el,deg,col,a in L: c=c+lobe(az,el,deg,col,a)
    c=c*(1+rng.normal(0,0.01,(H,W,1)))  # dither against banding
    c=c/(1+c)*1.25  # soft shoulder
    im=Image.fromarray((np.clip(c,0,1)**(1/2.2)*255).astype(np.uint8))
    im.save(f"{HERE}/{k}.png"); im.save(f"{HERE}/{k}.webp",quality=92); im.resize((512,256),Image.LANCZOS).save(f"{HERE}/{k}.phone.webp",quality=90)
    J["probes"].append({"id":k,"png":f"{k}.png","desktop":f"{k}.webp","phone":f"{k}.phone.webp","px":[W,H],"phone_px":[512,256],
        "lights":[{"az_deg":a,"el_deg":e,"spread_deg":s} for a,e,s,_,_ in L],**HINT[k]}); sheet.append((k,im))
json.dump(J,open(f"{HERE}/probes.json","w"),indent=2)
S=Image.new("RGB",(1080,4*290+20),(18,16,20)); d=ImageDraw.Draw(S)
for i,(k,im) in enumerate(sheet):
    S.paste(im.resize((1040,260)),(20,20+i*290)); d.text((28,24+i*290),k,fill=(200,190,180))
S.save(f"{HERE}/preview.png")
