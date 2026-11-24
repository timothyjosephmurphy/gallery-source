# #479 frame card textures, seed 358
import random, math
from PIL import Image, ImageDraw, ImageFilter
random.seed(358)
G='/workspace/gallery-courtyard/window-glows-358/'
SLATE=(0x3A,0x34,0x32,255); PL=(0xE9,0xE5,0xDC,255)
def card(shape,W=512,H=768):
    im=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(im)
    # outer frame w/ soft edge
    m=int(W*0.06); d.rounded_rectangle([m,m*0.8,W-m,H-m*0.8],radius=int(W*.03),fill=SLATE)
    # plaster trim band
    x0,x1,y0,y1=int(.22*W),int(.78*W),int(.18*H),int(.82*H); t=int(W*.035)
    d.rectangle([x0-t,y0-t,x1+t,y1+t],fill=PL)
    d.rectangle([x0-t,y1+t,x1+t,y1+t*2],fill=PL) # sill
    # noise grain
    px=im.load()
    for y in range(H):
        for x in range(W):
            r,g,b,a=px[x,y]
            if a: n=random.randint(-6,6); px[x,y]=(max(0,min(255,r+n)),max(0,min(255,g+n)),max(0,min(255,b+n)),a)
    # cut glass opening
    mask=Image.new('L',(W,H),0); md=ImageDraw.Draw(mask)
    if shape=='arched':
        r=(x1-x0)//2; md.rectangle([x0,y0+r,x1,y1],fill=255); md.pieslice([x0,y0,x1,y0+2*r],180,360,fill=255)
        d.pieslice([x0-t,y0-t,x1+t,y0+2*r+t],180,360,outline=PL,width=t)
    else: md.rectangle([x0,y0,x1,y1],fill=255)
    a=im.getchannel('A').filter(ImageFilter.GaussianBlur(1.5))
    a=Image.composite(Image.new('L',(W,H),0),a,mask); im.putalpha(a)
    d=ImageDraw.Draw(im); b=max(3,int(W*.014))
    if shape=='mullion':
        for i in (1,):
            xm=(x0+x1)//2; d.rectangle([xm-b,y0,xm+b,y1],fill=SLATE)
        for j in (1,2):
            ym=y0+(y1-y0)*j//3; d.rectangle([x0,ym-b,x1,ym+b],fill=SLATE)
    if shape=='arched':
        r=(x1-x0)//2; d.rectangle([x0,y0+r-b,x1,y0+r+b],fill=SLATE); d.rectangle([(x0+x1)//2-b,y0+r,(x0+x1)//2+b,y1],fill=SLATE)
    return im
pv=Image.new('RGBA',(512*3+80,768+40),(20,22,30,255))
for i,s in enumerate(['single','mullion','arched']):
    im=card(s); im.save(f'frame-{s}.png'); im.save(f'frame-{s}.webp',quality=88)
    im.resize((256,384),Image.LANCZOS).save(f'frame-{s}.phone.webp',quality=85)
    g=Image.open(G+f'glow-{s}.png').convert('RGBA').resize((512,768))
    pv.alpha_composite(g,(20+i*532,20)); pv.alpha_composite(im,(20+i*532,20))
pv.convert('RGB').save('preview.png')
