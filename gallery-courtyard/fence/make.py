# Original procedural wrought-iron fence bay, seed 352. Tiles horizontally (2 m per tile).
import numpy as np, json
from PIL import Image, ImageDraw, ImageFilter
W,H=2048,1024; S=2  # supersample
rng=np.random.default_rng(352)
m=Image.new('L',(W*S,H*S),0); d=ImageDraw.Draw(m)
px=W*S/2.0  # px per meter (2 m wide, 1 m tall)
def r(a,b,c,e): d.rectangle([a*px,b*px,c*px,e*px],255)
r(0,0.16,2,0.19); r(0,0.86,2,0.89)          # top / bottom rails
n=16
for i in range(n):                           # pickets 12.5 cm pitch
    x=(i+0.5)*2/n; r(x-0.009,0.06,x+0.009,0.97)
    d.polygon([(x*px,0.015*px),((x-0.022)*px,0.07*px),((x+0.022)*px,0.07*px)],255)  # spear finial
for i in range(0,n,2):                       # sun rings between pickets, mid band
    cx=(i+1)*2/n; cy=0.52; R=0.045*px; w=0.008*px
    d.ellipse([cx*px-R,cy*px-R,cx*px+R,cy*px+R],outline=255,width=int(w))
    d.ellipse([cx*px-R*.3,cy*px-R*.3,cx*px+R*.3,cy*px+R*.3],255)
r(0,0.0,0.03,0.0)  # noop
mask=m.resize((W,H),Image.LANCZOS)
a=np.asarray(mask).astype(np.float32)/255
# height for normal: blurred mask = rounded bars
h=np.asarray(mask.filter(ImageFilter.GaussianBlur(3))).astype(np.float32)/255
gy,gx=np.gradient(h); st=4.0
nx,ny,nz=-gx*st,-gy*st,np.ones_like(h); l=np.sqrt(nx**2+ny**2+nz**2)
nrm=np.dstack([(nx/l+1)/2,(-ny/l+1)/2,nz/l])*255  # OpenGL +Y
nrm[a<0.02]=[128,128,255]
# albedo: dark iron w/ slate tint, grain, warm apricot paint wear on top edges
base=np.array([0x2B,0x2F,0x38],np.float32)
noise=Image.fromarray((rng.random((H//8,W//8))*255).astype(np.uint8)).resize((W,H),Image.BICUBIC)
nz2=(np.asarray(noise)/255.0-0.5)
col=base[None,None,:]*(1+0.25*nz2[...,None])
rim=np.clip(-gy*6,0,1)[...,None]  # upward-facing edges
col=col*(1-0.35*rim)+np.array([0xF7,0xA6,0x6E])*0.35*rim
# ochre accent on sun-ring cores
yy,xx=np.mgrid[0:H,0:W]
for i in range(0,n,2):
    cx=(i+1)*W/n; cy=0.52*H; dd=np.hypot(xx-cx,yy-cy)
    k=(dd<0.045*0.3*W/2+2)[...,None]*0.75
    col=col*(1-k)+np.array([0xF7,0xCC,0x3A])*0.85*k
alb=np.dstack([np.clip(col,0,255),a*255]).astype(np.uint8)
rough=np.clip((0.62+0.18*nz2-0.15*rim[...,0])*255,0,255).astype(np.uint8)
ao=np.clip(1-0.5*np.asarray(mask.filter(ImageFilter.GaussianBlur(24))).astype(np.float32)/255*(1-a),0,1)
# AO strip: ground contact shadow for lawn/path under fence (2 m x 0.5 m)
gs=np.linspace(0,1,256)[:,None]; ao_strip=(255*(1-0.55*np.exp(-((gs-0.5)/0.18)**2))*np.ones((1,W))).astype(np.uint8)
def save(arr,name,mode):
    im=Image.fromarray(arr,mode); im.save(name+'.webp',quality=92,lossless=(mode=='RGBA'))
    im.resize((im.width//2,im.height//2),Image.LANCZOS).save(name+'.phone.webp',quality=88)
    return im
A=save(alb,'fence-iron_albedo','RGBA'); A.save('fence-iron_albedo.png')
save(rough,'fence-iron_roughness','L'); save(nrm.astype(np.uint8),'fence-iron_normal','RGB')
save(ao_strip,'fence-ground-ao-strip','L')
# preview: over baked horizon
bg=Image.open('../horizon/horizon-mid-valley_baked.webp').convert('RGBA').resize((W,H//2))
pv=Image.new('RGBA',(W,H+H//2),(243,230,216,255)); pv.paste(bg,(0,0))
pv.alpha_composite(A.resize((W//2,H//2)),(0,0)); pv.alpha_composite(A.resize((W//2,H//2)),(W//2,0))
for j,f in enumerate(['fence-iron_roughness.webp','fence-iron_normal.webp','fence-ground-ao-strip.webp']):
    pv.paste(Image.open(f).convert('RGBA').resize((W//3,H//3)),(j*W//3,H//2+40))
pv.paste(Image.fromarray(alb).resize((W//2,H//2)),(0,H//2+H//3+80))
pv.convert('RGB').save('preview.png')
