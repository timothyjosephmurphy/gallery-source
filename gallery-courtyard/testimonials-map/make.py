#!/usr/bin/env python3
"""Testimonials world map art (#293). Original procedural design: hand-traced coarse
lon/lat polygons, noise-warped, watercolor washes. Equirectangular, 2:1 = TestiFace 5.6x2.8.
Regenerate: python3 make.py"""
import json, math, numpy as np
from PIL import Image, ImageDraw, ImageFilter
R=np.random.default_rng(293); OUT='.'
P=dict(ocean='#9DB7CF',ocean_deep='#5E7289',paper='#F3E6D8',coast='#5E7289',grat='#F3E6D8',
 land=['#8FAE9E','#F7A66E','#E9A9A6','#F7CC3A','#C8644E','#9A78CF','#8FAE9E'],
 pin='#C8644E',pin_hover='#F48A5C',pin_sel='#F7CC3A',pin_ring='#3A3432',pin_dot='#F3E6D8')
# coarse original outlines (lon,lat); continent index -> colour
C={
0:[(-168,66),(-156,71),(-128,70),(-95,72),(-80,73),(-62,60),(-56,52),(-66,44),(-76,35),(-81,26),(-82,30),(-90,29),(-97,26),(-97,21),(-88,21),(-87,16),(-83,10),(-78,8),(-82,8),(-92,15),(-105,20),(-112,29),(-117,32),(-124,40),(-124,48),(-133,57),(-150,60),(-165,55),(-160,59)],
1:[(-78,8),(-72,12),(-62,10),(-50,1),(-35,-6),(-39,-15),(-48,-26),(-58,-38),(-65,-42),(-68,-55),(-73,-50),(-74,-40),(-71,-25),(-76,-13),(-81,-5),(-80,1)],
2:[(-10,36),(-9,43),(-1,46),(-4,48),(5,52),(9,54),(8,57),(12,56),(14,54),(22,55),(21,60),(18,63),(14,67),(18,70),(26,71),(30,70),(42,67),(60,69),(80,73),(105,77),(140,72),(180,68),(180,65),(160,60),(155,52),(141,46),(135,43),(129,35),(122,40),(121,31),(118,24),(108,21),(106,10),(100,13),(100,3),(104,1),(98,8),(92,22),(88,22),(80,15),(77,8),(72,20),(67,25),(57,25),(52,25),(56,26),(58,22),(52,16),(44,12),(42,16),(35,28),(35,32),(36,36),(28,36),(26,40),(23,36),(20,40),(15,38),(18,40),(12,44),(8,44),(3,42),(-2,36)],
3:[(-17,21),(-17,14),(-12,7),(-8,4),(5,6),(9,4),(9,-1),(13,-12),(12,-17),(18,-34),(26,-34),(32,-28),(35,-20),(40,-15),(39,-6),(44,1),(51,11),(43,11),(38,18),(33,30),(25,32),(20,31),(11,33),(10,37),(-1,36),(-6,36),(-10,30)],
4:[(114,-22),(114,-34),(118,-35),(130,-32),(138,-35),(144,-38),(150,-37),(153,-28),(153,-25),(146,-19),(143,-11),(136,-12),(131,-11),(126,-14)],
5:[(-55,60),(-44,60),(-20,70),(-20,78),(-40,83),(-65,80),(-72,77),(-58,74)],
6:[(-180,-72),(180,-72),(180,-90),(-180,-90)],
}
ISL=[(0,[(-170,71),(-120,72),(-100,82),(-70,83),(-85,70)]),(2,[(-6,50),(1,51),(-3,58),(-6,56)]),(2,[(130,31),(140,35),(142,42),(138,38)]),
(3,[(44,-25),(50,-15),(49,-12),(43,-18)]),(4,[(166,-46),(174,-36),(178,-38),(168,-47)]),(2,[(95,5),(106,-6),(102,-4)]),(2,[(110,-7),(115,-8),(110,-6)]),
(4,[(131,-1),(150,-6),(141,-9)]),(2,[(109,1),(118,7),(119,-4),(111,-3)]),(2,[(-24,64),(-14,66),(-14,64),(-22,63)])]
def poly_px(pts,W,H,warp):
    out=[]
    for i in range(len(pts)):
        a,b=pts[i],pts[(i+1)%len(pts)]
        n=max(2,int(math.hypot(b[0]-a[0],b[1]-a[1])/2))
        for t in np.linspace(0,1,n,endpoint=False):
            lo=a[0]+(b[0]-a[0])*t; la=a[1]+(b[1]-a[1])*t
            j=warp*(math.sin(lo*.37+la*.21)*.6+R.normal(0,.35)) if abs(la)<85 else 0
            out.append(((lo+180+j)/360*W,(90-la+j*.7)/180*H))
    return out
def noise(W,H,s,oct=4):
    acc=np.zeros((H,W))
    for o in range(oct):
        f=s*2**o; g=R.random((int(H/f)+2,int(W/f)+2))
        acc+=np.asarray(Image.fromarray((g*255).astype('uint8')).resize((W,H),Image.BICUBIC),float)/255/2**o
    return acc/acc.max()
def hx(h):return np.array([int(h[i:i+2],16) for i in (1,3,5)],float)
def build(W):
    H=W//2; idx=Image.new('L',(W,H),255); d=ImageDraw.Draw(idx)
    for k,p in C.items(): d.polygon(poly_px(p,W,H,0.9),fill=k)
    for k,p in ISL: d.polygon(poly_px(p,W,H,0.3),fill=k)
    ia=np.array(idx); land=(ia<255)
    m=Image.fromarray((land*255).astype('uint8')).filter(ImageFilter.GaussianBlur(W/700)); lm=np.array(m,float)/255
    nz=noise(W,H,W/16); nf=noise(W,H,W/128)
    # ocean: soft blue toward paper near coasts, deeper mid-ocean
    dist=np.array(Image.fromarray((land*255).astype('uint8')).filter(ImageFilter.GaussianBlur(W/60)),float)/255
    oc=hx(P['ocean'])*(1-.18*(1-dist)*nz[...,None].squeeze()[...,None]) if False else None
    oc=hx(P['ocean'])[None,None]*np.ones((H,W,1))
    oc=oc*(0.92+0.08*nz)[...,None]+ (hx(P['paper'])-hx(P['ocean']))[None,None]*(0.45*dist)[...,None]
    oc=oc*(1-0.08*(1-dist)[...,None])
    # land: per-continent wash with granulation + darker pooled edges
    lc=np.zeros((H,W,3))
    for k,c in enumerate(P['land']): lc[ia==k]=hx(c)
    lc=np.array(Image.fromarray(lc.astype('uint8')).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(W/900)),float)
    edge=np.clip(lm*(1-lm)*4,0,1)
    lc=lc*(0.88+0.16*nz[...,None])*(1-0.18*edge[...,None])*(0.96+0.06*nf[...,None])
    img=oc*(1-lm[...,None])+lc*lm[...,None]
    # coast line + graticule (dusk slate, soft)
    cl=np.array(Image.fromarray((land*255).astype('uint8')).filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(W/2048)),float)/255
    cl=np.clip(cl*2.2,0,.85); img=img*(1-cl[...,None])+hx(P['coast'])*cl[...,None]
    g=Image.new('L',(W,H),0); gd=ImageDraw.Draw(g)
    for lo in range(-180,181,30): gd.line([(lo+180)/360*W,0,(lo+180)/360*W,H],fill=60,width=max(1,W//1024))
    for la in range(-60,61,30): gd.line([0,(90-la)/180*H,W,(90-la)/180*H],fill=60,width=max(1,W//1024))
    ga=np.array(g,float)/255*(1-lm); img=img*(1-ga[...,None])+hx(P['grat'])*ga[...,None]
    # paper border vignette
    yy,xx=np.mgrid[0:H,0:W]; b=np.minimum.reduce([xx,W-xx,yy*2,(H-yy)*2])/W
    v=np.clip(1-b/0.02,0,1)**2; img=img*(1-.5*v[...,None])+hx(P['paper'])*.5*v[...,None]
    img=np.clip(img,0,255).astype('uint8'); return Image.fromarray(img),lm,nz
def save(im,name,png=True):
    im.save(f'{OUT}/{name}.webp',quality=88)
    if png: im.save(f'{OUT}/{name}.png',optimize=True)
alb,lm,nz=build(2048); save(alb,'map-albedo-2048'); save(alb.resize((1024,512),Image.LANCZOS),'map-albedo-1024')
# relief: height = blurred land * low noise -> normal + roughness
h=np.array(Image.fromarray((lm*255).astype('uint8')).filter(ImageFilter.GaussianBlur(6)),float)/255*(0.7+0.3*nz)
gy,gx=np.gradient(h*6); n=np.dstack([-gx,-gy,np.ones_like(h)]); n/=np.linalg.norm(n,axis=2,keepdims=True)
nrm=Image.fromarray(((n*.5+.5)*255).astype('uint8')); save(nrm,'map-normal-2048',False); save(nrm.resize((1024,512),Image.LANCZOS),'map-normal-1024',False)
rough=Image.fromarray((np.clip(0.55+0.25*lm+0.08*nz-0.04,0,1)*255).astype('uint8'))
save(rough,'map-roughness-2048',False); save(rough.resize((1024,512),Image.LANCZOS),'map-roughness-1024',False)
# pins: 3 states x 128px cells (teardrop, brass-ring head, cream dot, soft ground shadow)
S=128; sheet=Image.new('RGBA',(S*3,S),(0,0,0,0))
for i,(key,sc) in enumerate([('pin',1.0),('pin_hover',1.1),('pin_sel',1.18)]):
    big=Image.new('RGBA',(S*4,S*4),(0,0,0,0)); d=ImageDraw.Draw(big); c=S*2; r=int(150*sc*.62)
    tip=(c,S*4-40); hy=tip[1]-int(r*2.6)
    d.ellipse([c-r*.9,tip[1]-14,c+r*.9,tip[1]+10],fill=(58,52,50,70))
    d.polygon([(c-r*.72,hy+r*.6),(c+r*.72,hy+r*.6),tip],fill=P['pin_ring'])
    d.ellipse([c-r-10,hy-r-10,c+r+10,hy+r+10],fill=P['pin_ring'])
    d.polygon([(c-r*.58,hy+r*.6),(c+r*.58,hy+r*.6),(c,tip[1]-14)],fill=P[key])
    d.ellipse([c-r,hy-r,c+r,hy+r],fill=P[key])
    d.ellipse([c-r*.42,hy-r*.42,c+r*.42,hy+r*.42],fill=P['pin_dot'])
    d.ellipse([c-r*.62,hy-r*.78,c-r*.18,hy-r*.4],fill=(255,255,255,110))
    if key=='pin_sel':
        for a in range(0,360,45):
            x=c+math.cos(math.radians(a))*r*1.5; y=hy+math.sin(math.radians(a))*r*1.5
            d.ellipse([x-9,y-9,x+9,y+9],fill=P['pin_sel'])
    sheet.paste(big.resize((S,S),Image.LANCZOS),(i*S,0))
sheet.save(f'{OUT}/pins-sheet.png',optimize=True); sheet.save(f'{OUT}/pins-sheet.webp',quality=92,lossless=True)
sheet.resize((S*3//2,S//2),Image.LANCZOS).save(f'{OUT}/pins-sheet-64.png',optimize=True)
# preview: map + demo pins (fake demo coords, not data)
pv=alb.resize((1024,512)).convert('RGBA'); pin=sheet.crop((0,0,S,S)).resize((36,36),Image.LANCZOS)
demo=[(-122.3,47.6),(-89.2,13.7),(-99.1,19.4),(-0.1,51.5),(139.7,35.7),(151.2,-33.9),(18.4,-33.9),(-46.6,-23.5)]
for lo,la in demo:
    x=int((lo+180)/360*1024); y=int((90-la)/180*512); pv.alpha_composite(pin,(x-18,y-34))
sel=sheet.crop((2*S,0,3*S,S)).resize((44,44),Image.LANCZOS); pv.alpha_composite(sel,(int((-122.3+180)/360*1024)-22,int((90-47.6)/180*512)-41))
canvas=Image.new('RGBA',(1024,512+140),P['paper']); canvas.paste(pv,(0,0)); canvas.alpha_composite(sheet,(20,512+6))
canvas.convert('RGB').save(f'{OUT}/preview.png',optimize=True)
json.dump({'issue':293,'projection':'equirectangular (plate carree), 2:1',
 'uv':'u=(lon+180)/360, v=(90-lat)/180 from TOP (flipY=false); in three.js default flipY=true use v=1-(90-lat)/180 i.e. (lat+90)/180',
 'face_m':[5.6,2.8],'face_note':'TestiFace in props2 testimonials-map lod0/lod1 is 5.6x2.8 => 1 px(2048) = 2.73 mm',
 'world_pos':'x=(u-0.5)*5.6, y=(0.5-v_top)*2.8 on face plane, z=+0.02 for pins',
 'textures':{'albedo':['map-albedo-2048.webp/png','map-albedo-1024.webp/png'],'normal':['map-normal-2048.webp','map-normal-1024.webp'],'roughness':['map-roughness-2048.webp','map-roughness-1024.webp']},
 'pins':{'sheet':'pins-sheet.png (384x128, 3 cells: default, hover, selected) + pins-sheet-64.png','anchor':'tip at cell (0.5, 0.97) -> sprite center offset y=+0.47*size','size_m':{'default':0.14,'hover':0.16,'selected':0.18,'phone_min':0.16},'states':['default','hover','selected']},
 'colors':P,'normal_strength':0.35,'roughness_note':'oceans ~0.55, land ~0.8; if face stays Unlit, ignore normal/rough'},open(f'{OUT}/map.json','w'),indent=1)
