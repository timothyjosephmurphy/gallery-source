# Original procedural soft light-shaft gobos for #357. numpy + PIL only.
import numpy as np, json
from PIL import Image, ImageFilter
rng=np.random.default_rng(357)
def noise(h,w,s,o=4):
    a=np.zeros((h,w))
    for i in range(o):
        g=rng.random((max(2,h//(s>>i or 1)),max(2,w//(s>>i or 1))))
        a+=np.array(Image.fromarray((g*255).astype(np.uint8)).resize((w,h),Image.BICUBIC))/255*0.5**i
    return a/a.max()
def sstep(x):x=np.clip(x,0,1);return x*x*(3-2*x)
TINTS={"apricot-dawn":(247,166,110),"daylight-cool":(232,240,248)}
def wedge(w,h,peak):
    y,x=np.mgrid[0:h,0:w]/np.array([h,w])[:,None,None]
    width=0.12+0.30*y               # widens with distance from aperture (top)
    across=sstep(1-np.abs(x-0.5)/(width/2+1e-6))**1.5
    along=sstep(y/0.08)*(1-y)**1.6   # soft start, long fade
    streak=0.75+0.25*noise(h,w,64)   # painterly variation, no hard lines
    return across*along*streak*peak
def slits(w,h,peak,n=3):
    y,x=np.mgrid[0:h,0:w]/np.array([h,w])[:,None,None];a=np.zeros((h,w))
    for i in range(n):
        c=0.5+(i-(n-1)/2)*0.2+0.18*(y-0.5)   # slight skew = sun-raked
        bw=0.05+0.06*y
        a+=sstep(1-np.abs(x-c)/bw)*(0.7+0.3*rng.random())
    along=sstep(y/0.1)*(1-y)**1.4
    return np.clip(a,0,1)*along*(0.8+0.2*noise(h,w,48))*peak
def save(a,tint,name,w,h,blur):
    al=Image.fromarray((np.clip(a,0,1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur))
    im=Image.new("RGBA",(w,h),tint+(0,));im.putalpha(al)
    im.save(f"{name}.webp",quality=88,method=6);return im
SIZES={"desktop":(1024,2048,10),"phone":(512,1024,5)}
cards=[]
for t,c in TINTS.items():
  for kind,fn in (("wedge",wedge),("slits",slits)):
    for dev,(w,h,b) in SIZES.items():
      n=f"shaft-{kind}-{t}-{dev}";save(fn(w,h,0.85),c,n,w,h,b);cards.append(n)
# dust motes: 4x4 sheet of 64px soft sprites, faint
S=64;sheet=np.zeros((4*S,4*S))
yy,xx=np.mgrid[0:S,0:S]-S/2
for i in range(16):
    r=rng.uniform(2,7);sx=rng.uniform(.8,1.3)
    sp=np.exp(-((xx*sx)**2+(yy/sx)**2)/(2*r*r))*rng.uniform(.35,.6)
    sheet[(i//4)*S:(i//4+1)*S,(i%4)*S:(i%4+1)*S]=sp
im=Image.new("RGBA",(4*S,4*S),(255,236,214,0));im.putalpha(Image.fromarray((sheet*255).astype(np.uint8)));im.save("dust-motes-4x4.webp",quality=90)
# preview over dusk-slate bg
P=Image.new("RGB",(1024,600),(94,114,137));x=10
for n in [c for c in cards if c.endswith("desktop")]:
    s=Image.open(n+".webp").resize((240,480));P.paste(s,(x,10),s);x+=254
d=Image.open("dust-motes-4x4.webp").resize((96,96));P.paste(d,(10,496),d)
P.save("preview.png")
json.dump({"tracker":"#357","supersedes_look_of":"#296 light shafts (maps only; lighting code is Gallery's)",
 "cards":{n:{"file":n+".webp","aspect":"1:2 (w:h), aperture at top edge, fades toward bottom"} for n in cards},
 "dust":{"file":"dust-motes-4x4.webp","grid":[4,4],"sprite_px":64,"count_hint":"20-40 per shaft","opacity":[0.05,0.15],"drift_speed_mps":[0.01,0.04]},
 "suggested":{"opacity_range":[0.08,0.22],"opacity_default":0.14,
  "note":"#296 opacity unknown to Visual; target well under it, roughly half or less",
  "blending":"additive (THREE.AdditiveBlending), depthWrite false, toneMapped true",
  "fade":"opacity *= smoothstep(0.05,0.35,sunElevationRad) * (1-smoothstep(1.0,1.35,sunElevationRad))",
  "tint":"apricot-dawn when sun elevation < ~20deg, crossfade to daylight-cool above",
  "align":"orient card long axis along -sunDirection; billboard around that axis only"}},open("shafts.json","w"),indent=1)
