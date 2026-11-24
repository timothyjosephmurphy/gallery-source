import numpy as np, json
from PIL import Image, ImageFilter
rng=np.random.default_rng(352)
W,H=2048,512
def tile_noise(n,octs,amp0=1.0):
    x=np.arange(n)/n; y=np.zeros(n); a=amp0
    for k in octs:
        for _ in range(2):
            y+=a*np.sin(2*np.pi*(k*x+rng.random()))  # integer freq => seamless
        a*=0.55
    return y
def ridge(n,octs,base,amp,sharp=False):
    y=tile_noise(n,octs)
    if sharp: y=-np.abs(y)+np.abs(y).mean()
    y=(y-y.min())/(y.max()-y.min())
    return base-amp*y
def hexc(h): return np.array([int(h[i:i+2],16) for i in (1,3,5)],float)
def layer(top_y,col_top,col_bot,haze,H):
    yy=np.arange(H)[:,None]; t=np.clip((yy-top_y[None,:])/ (H*0.6),0,1)
    rgb=col_top[None,None,:]*(1-t[...,None])+col_bot[None,None,:]*t[...,None]
    rgb=rgb*(1-haze)+hexc('#F3E6D8')*haze
    a=np.clip((yy-top_y[None,:])/2.5+0.5,0,1)
    # watercolor grain
    g=rng.normal(0,4,(H,W,1)); rgb=np.clip(rgb+g,0,255)
    return rgb,a
def comp(layers):
    out=np.zeros((H,W,3)); A=np.zeros((H,W))
    for rgb,a in layers:  # back to front
        out=out*(1-a[...,None])+rgb*a[...,None]; A=A+a*(1-A)
    rgbA=np.dstack([out/np.maximum(A,1e-4)[...,None],A*255]).clip(0,255).astype(np.uint8)
    im=Image.fromarray(rgbA,'RGBA')
    return im.filter(ImageFilter.GaussianBlur(1.2))
# distant range: Rainier-ish peak + Cascades, two haze tiers
x=np.arange(W)
far=ridge(W,[2,5,11,23],H*0.62,H*0.30,True)
rain=H*0.12+ (np.abs(x-W*0.62)/ (W*0.16))**1.3*H*0.5
far=np.minimum(far,np.where(np.abs(x-W*0.62)<W*0.2,rain,far))
far2=ridge(W,[3,7,17,31],H*0.75,H*0.22,True)
dist=comp([layer(far,hexc('#B9A0E0'),hexc('#9DB7CF'),0.45,H),
           layer(far2,hexc('#9A78CF'),hexc('#5E7289'),0.35,H)])
# snow-pink cap on Rainier via lighter tint near peak
a=np.array(dist).astype(float); yy=np.arange(H)[:,None]
cap=((yy<far[None,:]+H*0.10)&(np.abs(x-W*0.62)[None,:]<W*0.09)&(a[...,3]>0))
a[cap,:3]=a[cap,:3]*0.4+hexc('#F7D9CC')*0.6
dist=Image.fromarray(a.clip(0,255).astype(np.uint8),'RGBA')
# mid valley: foothills sage/green, fading to lawn green at bottom
m1=ridge(W,[2,4,9,19],H*0.45,H*0.30)
m2=ridge(W,[3,6,13],H*0.62,H*0.22)
m3=ridge(W,[1,3,8],H*0.80,H*0.15)
mid=comp([layer(m1,hexc('#8FAE9E'),hexc('#6F8F86'),0.35,H),
          layer(m2,hexc('#7FA07A'),hexc('#5E7F5E'),0.20,H),
          layer(m3,hexc('#6E9A5C'),hexc('#4F7A45'),0.08,H)])
# warm dawn rim light on ridge tops (apricot)
def rim(im,tops):
    a=np.array(im).astype(float)
    for t in tops:
        d=yy-t[None,:]; m=(d>=0)&(d<6)
        a[m,:3]=a[m,:3]*0.55+hexc('#F7A66E')*0.45
    return Image.fromarray(a.clip(0,255).astype(np.uint8),'RGBA')
mid=rim(mid,[m1,m2,m3]); dist=rim(dist,[far])
sky=Image.open('../hq-assets/sky/sky-pnw-sunset.webp').convert('RGBA').resize((W,H))
for name,im in [('horizon-distant-range',dist),('horizon-mid-valley',mid)]:
    im.save(name+'.png'); im.save(name+'.webp',quality=90)
    ph=im.resize((W//2,H//2),Image.LANCZOS); ph.save(name+'.phone.webp',quality=88)
    b=Image.new('RGBA',(W,H)); 
    # baked opaque variant over dawn gradient
    g=np.linspace(0,1,H)[:,None,None]; grad=(hexc('#E9A9A6')*(1-g)+hexc('#F7A66E')*g)
    bg=Image.fromarray(np.broadcast_to(grad,(H,W,3)).astype(np.uint8)).convert('RGBA')
    Image.alpha_composite(bg,im).convert('RGB').save(name+'_baked.webp',quality=90)
# preview: dawn sample + both layers, 2x tiled to show seam
g=np.linspace(0,1,H*2)[:,None,None]
grad=hexc('#F3E6D8')*(1-g)**2+hexc('#F7A66E')*(1-(1-g)**2)*0.6+hexc('#E9A9A6')*(1-(1-g)**2)*0.4
pv=Image.fromarray(np.broadcast_to(grad,(H*2,W*2,3)).astype(np.uint8)).convert('RGBA')
for im,yo in [(dist,int(H*0.55)),(mid,int(H*0.95))]:
    for k in (0,1): pv.alpha_composite(im,(k*W,yo))
pv.convert('RGB').resize((W,H)).save('preview.png')
json.dump({"ticket":"Gallery #352","uv":{"wrapS":"RepeatWrapping (seamless horizontally)","wrapT":"ClampToEdge"},
 "layers":[{"name":"distant-range","desktop":"horizon-distant-range.webp","phone":"horizon-distant-range.phone.webp","master":"horizon-distant-range.png","baked":"horizon-distant-range_baked.webp","size":[W,H],"phoneSize":[W//2,H//2],"alpha":True,"order":0,"suggest":{"type":"cylinder band or billboard","radiusMult":1.0,"fog":False,"depthWrite":False}},
 {"name":"mid-valley","desktop":"horizon-mid-valley.webp","phone":"horizon-mid-valley.phone.webp","master":"horizon-mid-valley.png","baked":"horizon-mid-valley_baked.webp","size":[W,H],"phoneSize":[W//2,H//2],"alpha":True,"order":1,"suggest":{"type":"cylinder band or billboard","radiusMult":0.7,"depthWrite":False}}]},open('horizon.json','w'),indent=1)
