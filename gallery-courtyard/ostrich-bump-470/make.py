#!/usr/bin/env python3
"""studio-tracker #470 - ostrich guide-bot procedural bump/PBR maps. Seed 470.
Original procedural (numpy+Pillow). All maps tile seamlessly (wrap-around math)."""
import json, numpy as np
from PIL import Image
SEED=470; S=2048; rng=np.random.default_rng(SEED)

def pnoise(n,h,w,beta):  # periodic FFT noise -> seamless
    f=np.fft.fft2(rng.standard_normal((h,w)))
    ky=np.fft.fftfreq(h)[:,None]; kx=np.fft.fftfreq(w)[None,:]
    k=np.sqrt(kx**2+ky**2); k[0,0]=1
    r=np.real(np.fft.ifft2(f/k**beta)); return (r-r.min())/(np.ptp(r)+1e-9)

def blur(a,s):  # periodic gaussian
    h,w=a.shape; ky=np.fft.fftfreq(h)[:,None]; kx=np.fft.fftfreq(w)[None,:]
    return np.real(np.fft.ifft2(np.fft.fft2(a)*np.exp(-2*(np.pi*s)**2*(kx**2+ky**2))))

def normal(h,strength):
    dx=(np.roll(h,-1,1)-np.roll(h,1,1))*strength; dy=(np.roll(h,-1,0)-np.roll(h,1,0))*strength
    # OpenGL +Y: green up; image rows go down, so +Y = -d/drow
    n=np.dstack([-dx,dy,np.ones_like(h)]); n/=np.linalg.norm(n,axis=2,keepdims=True)
    return ((n*0.5+0.5)*255).astype(np.uint8)

def feathers():
    H=np.zeros((S,S)); C=14; R=14; cw=S/C; rh=S/R
    L=int(rh*2.2); W=int(cw*0.75)
    yy,xx=np.mgrid[0:L,-W:W+1].astype(float)
    for r in range(R):
        for c in range(C):
            cx=(c+0.5*(r%2))*cw+rng.uniform(-6,6); cy=r*rh+rng.uniform(-5,5)
            ang=rng.uniform(-0.12,0.12); u=yy*np.cos(ang)+xx*np.sin(ang); v=xx*np.cos(ang)-yy*np.sin(ang)
            t=u/L; half=W*np.sin(np.clip(t,0,1)*np.pi)**0.7*(1-0.35*t)
            m=np.clip(1-np.abs(v)/(half+1e-6),0,1)*(t<1)
            rach=np.exp(-(v/2.2)**2)*(1-t)
            barb=0.5+0.5*np.sin((u*0.9+np.abs(v)*1.6)*0.55+rng.uniform(0,6))
            fh=(m**0.6)*(0.55+0.25*t+0.12*barb)+0.25*rach*m  # tip (bottom) lies on top
            fh=fh*m + r*0  # local height
            ys=(np.arange(L)+int(cy))%S; xs=(np.arange(-W,W+1)+int(cx))%S
            sub=H[np.ix_(ys,xs)]; base=sub.max()*0  # layering: newer rows overlap older
            H[np.ix_(ys,xs)]=np.where(m>0.02,np.maximum(sub*0.6,fh+0.0),sub)
    H=blur(H,0.8)+0.08*pnoise(0,S,S,1.4)
    return (H-H.min())/np.ptp(H)

def save(name,arr,mode):
    im=Image.fromarray(arr,mode); im.save(f"{name}.png",optimize=True)
    im.save(f"{name}.webp",quality=90,method=6)
    im.resize((im.width//2,im.height//2),Image.LANCZOS).save(f"{name}.phone.webp",quality=85,method=6)
    return im

H=feathers()
fn=save("feather-n",normal(H,9.0),"RGB")
ao=np.clip(1-2.2*np.clip(blur(H,14)-H,0,None),0,1)**1.3; ao=0.35+0.65*ao
save("feather-ao",(ao*255).astype(np.uint8),"L")
rough=0.62+0.18*pnoise(0,S,S,1.1)-0.12*H+0.12*(1-ao)
save("feather-r",(np.clip(rough,0,1)*255).astype(np.uint8),"L")

# skin strips 1024x256 (pebbly leg/neck skin, scale rings across width)
sh,sw=256,1024
cell=pnoise(0,sh,sw,0.6); bumps=blur((cell>0.55).astype(float),2.5)
rings=0.5+0.5*np.cos(np.arange(sw)[None,:]*2*np.pi/32)
Hs=0.6*bumps+0.25*rings**4+0.15*pnoise(0,sh,sw,1.5); Hs=(Hs-Hs.min())/np.ptp(Hs)
save("skin-n",normal(Hs,5.0),"RGB")
save("skin-r",(np.clip(0.55+0.2*Hs+0.1*pnoise(0,sh,sw,1.2),0,1)*255).astype(np.uint8),"L")

# preview: purple sphere lit with feather normals (tiled 2x) + flat plane swatches
P=640; y,x=np.mgrid[-1:1:P*1j,-1:1:P*1j]; m=x*x+y*y<1; z=np.sqrt(np.clip(1-x*x-y*y,0,1))
nm=np.asarray(fn).astype(float)/127.5-1
uu=((np.arctan2(x,z)/np.pi*0.5+0.5)*2*S).astype(int)%S; vv=((y*0.5+0.5)*2*S).astype(int)%S
tn=nm[vv,uu]; aot=ao[vv,uu]
T=np.dstack([np.ones_like(x),np.zeros_like(x),-x]); T/=np.linalg.norm(T,axis=2,keepdims=True)
N=np.dstack([x,-y,z]); B=np.cross(N,T)
n=T*tn[...,0:1]+B*tn[...,1:2]*-1+N*tn[...,2:3]; n/=np.linalg.norm(n,axis=2,keepdims=True)
Ld=np.array([-0.5,0.6,0.62]); Ld/=np.linalg.norm(Ld)
dif=np.clip((n*Ld).sum(2),0,1); hv=Ld+[0,0,1]; hv/=np.linalg.norm(hv)
spec=np.clip((n*hv).sum(2),0,1)**24*0.25
col=np.array([0.48,0.27,0.72])
img=(col*(0.18+0.85*dif[...,None])*aot[...,None]+spec[...,None])*m[...,None]+(~m)[...,None]*0.08
sheet=Image.new("RGB",(P+3*320+40,P+20),(20,20,24)); sheet.paste(Image.fromarray((np.clip(img,0,1)*255).astype(np.uint8)),(10,10))
for i,nmf in enumerate(["feather-n","feather-r","feather-ao"]):
    t=Image.open(f"{nmf}.png").convert("RGB").resize((300,300)); sheet.paste(t,(P+20+i*320,10))
for i,nmf in enumerate(["skin-n","skin-r"]):
    t=Image.open(f"{nmf}.png").convert("RGB").resize((940,235)); sheet.paste(t.crop((0,0,940,150)),(P+20,330+i*160))
sheet.save("preview.png")

json.dump({"tracker":"studio-tracker#470","seed":SEED,"normalConvention":"OpenGL +Y (three.js default)",
 "feather":{"type":"MeshStandardMaterial","color":"#7b46b8","metalness":0.0,"roughness":1.0,
   "roughnessRange":[0.45,0.85],"roughnessMap":"feather-r.webp","normalMap":"feather-n.webp","normalScale":[0.8,0.8],
   "aoMap":"feather-ao.webp","aoMapIntensity":0.8,"repeat":[4,4],"wrap":"RepeatWrapping","colorSpace":"maps are linear/NoColorSpace",
   "phone":{"suffix":".phone.webp","normalScale":[0.6,0.6]}},
 "skin":{"type":"MeshStandardMaterial","color":"#9a6fc4","metalness":0.0,"roughness":1.0,"roughnessRange":[0.5,0.85],
   "normalMap":"skin-n.png","roughnessMap":"skin-r.png","normalScale":[0.5,0.5],"repeat":[1,3],"note":"strip: U wraps around leg/neck circumference"},
 "playTags":{"ostrich-feather":"feather","ostrich-leg":"skin","ostrich-neck":"skin","ostrich-beak":"leave untextured, roughness 0.4"}},
 open("materials.json","w"),indent=2)
print("ok")
