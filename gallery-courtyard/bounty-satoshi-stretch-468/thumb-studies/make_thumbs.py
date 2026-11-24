from PIL import Image, ImageDraw, ImageFilter
import os
OUT=os.path.dirname(os.path.abspath(__file__))
V=[235,170,105,40]  # light, light-mid, mid-dark, dark
def C(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))
UM,QR,IY,QG,BS,PB,LY,RS,SG=map(C,["#2a3b8f","#c2336b","#e8a317","#d49a2a","#5a3324","#1f4f74","#f2e36b","#b07a45","#5b7a2a"])
def mix(a,b,t): return tuple(int(a[i]*(1-t)+b[i]*t) for i in range(3))
W=(246,242,232)
S={
"26-stranger-nods-back":((512,384),3,[("r",(0,0,512,384),2),("r",(0,200,512,384),1),("r",(0,0,150,384),3),("r",(380,0,512,384),3),("r",(50,140,120,230),0),("r",(410,90,460,150),0),("p",[(180,384),(250,200),(262,200),(330,384)],2),("r",(215,250,228,320),3),("r",(290,240,303,315),3)],
 [mix(IY,W,.4),mix(UM,QR,.25),mix(UM,W,.0),mix(UM,BS,.5)]),
"24-garden-adjusts":((512,512),2,[("r",(0,0,512,512),1),("e",(40,30,150,120),0),("e",(360,50,470,150),0),("e",(200,10,300,80),0),("e",(150,180,380,400),3),("e",(190,250,260,320),1),("e",(270,240,340,310),1),("e",(200,320,270,380),1),("e",(280,320,340,380),1),("r",(0,400,512,512),2),("r",(400,330,490,420),0)],
 [mix(LY,W,.5),mix(PB,LY,.6),mix(QR,RS,.5),mix(PB,SG,.6)]),
"29-patient-heat":((512,384),3,[("r",(0,0,512,384),3),("r",(0,290,512,384),2),("e",(290,150,450,300),2),("e",(340,195,400,250),0),("e",(80,250,160,300),1),("e",(200,140,250,300),3),("e",(250,160,290,300),3)],
 [mix(IY,W,.2),mix(UM,W,.35),mix(BS,QG,.2),mix(UM,BS,.4)]),
"32-wifi-hut-el-zonte":((512,288),3,[("r",(0,0,512,288),1),("r",(0,150,512,210),0),("r",(0,215,512,288),2),("p",[(40,150),(110,95),(180,150)],2),("r",(60,150,160,215),3),("e",(230,175,330,225),1),("e",(400,215,512,240),0),("e",(440,40,446,46),0)],
 [mix(LY,W,.4),mix(QR,PB,.3),mix(PB,QR,.3),mix(UM,RS,.3)]),
"34-fingerprint-of-a-leaf":((384,512),2,[("r",(0,0,384,512),1),("e",(40,200,330,460),2),("e",(80,60,320,330),1),("l",[(200,320),(200,80)],0),("l",[(200,200),(120,140)],0),("l",[(200,200),(280,140)],0),("l",[(200,260),(130,230)],0),("e",(140,380,260,470),3),("e",(60,90,80,110),0),("e",(300,400,320,420),0)],
 [mix(IY,W,.6),mix(SG,IY,.4),mix(QR,IY,.5),mix(PB,BS,.5)]),
"38-last-signature-before-dawn":((512,384),4,[("r",(0,0,512,384),2),("r",(0,40,512,110),1),("r",(0,270,512,384),3),("e",(170,150,350,280),1),("e",(205,175,315,255),0),("e",(415,190,425,210),0),("e",(80,210,160,384),3),("e",(370,220,440,384),3)],
 [W,mix(QR,UM,.3),mix(UM,W,.2),mix(UM,BS,.5)]),
}
def render(size,blur,shapes,pal):
    im=Image.new("RGB",size)
    for k,g,v in shapes:
        lay=Image.new("RGB",size,pal[v]); m=Image.new("L",size,0); d=ImageDraw.Draw(m)
        {"r":lambda:d.rectangle(g,fill=255),"e":lambda:d.ellipse(g,fill=255),"p":lambda:d.polygon(g,fill=255),"l":lambda:d.line(g,fill=255,width=8)}[k]()
        im.paste(lay,(0,0),m.filter(ImageFilter.GaussianBlur(blur*2)))
    return im.filter(ImageFilter.GaussianBlur(blur))
vals=[]
for n,(sz,b,sh,pal) in S.items():
    g=render(sz,b,sh,[(x,x,x) for x in V]); g.convert("L").save(f"{OUT}/{n}-value.png"); vals.append(g)
    render(sz,b,sh,pal).save(f"{OUT}/{n}-limited.png")
sheet=Image.new("RGB",(3*540,2*540),(255,255,255))
for i,g in enumerate(vals): sheet.paste(g,(14+540*(i%3)+(512-g.width)//2,14+540*(i//3)+(512-g.height)//2))
sheet.convert("L").save(f"{OUT}/sheet-easel-order.png")
