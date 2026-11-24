# P8 thumbs (#40,#43,#41,#39,#42,#44). render() reused from make_thumbs_p7.py.
from PIL import Image, ImageDraw, ImageFilter
import os
OUT=os.path.dirname(os.path.abspath(__file__))
V=[235,170,105,40]
def C(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))
UM,QR,QG,BS,CB,RS,DV,PT,NG=map(C,["#2a3b8f","#c2336b","#d49a2a","#5a3324","#3d6fb6","#b07a45","#4b2a6e","#1aa3a3","#f0b81a"])
def mix(a,b,t): return tuple(int(a[i]*(1-t)+b[i]*t) for i in range(3))
W=(246,242,232)
S={
"40-oyster-bed-waits":((576,384),3,[("r",(0,0,576,384),0),("r",(0,170,576,384),1),("r",(0,230,576,250),2),("r",(0,270,576,288),2),("r",(0,310,576,330),2),("p",[(0,384),(200,200),(260,200),(120,384)],0),("e",(420,250,460,330),3),("r",(500,180,508,330),3)],
 [W,mix(PT,W,.5),mix(RS,QR,.3),mix(UM,BS,.5)]),
"43-kelp-forest-rejoins":((384,512),3,[("r",(0,0,384,512),2),("p",[(250,0),(330,0),(200,512),(140,512)],1),("p",[(320,0),(370,0),(280,512),(240,512)],0),("p",[(0,0),(120,0),(140,512),(0,512)],3),("l",[(360,200),(260,260),(140,300)],3)],
 [W,mix(mix(PT,NG,.5),W,.4),mix(PT,UM,.5),mix(RS,UM,.5)]),
"41-two-keys-on-one-hook":((384,512),3,[("r",(0,0,384,512),1),("r",(240,40,384,260),0),("e",(280,80,360,180),2),("r",(150,180,200,196),3),("l",[(175,196),(160,300)],2),("e",(140,290,170,360),3),("e",(170,300,200,370),3),("p",[(0,0),(80,0),(384,512),(250,512)],0)],
 [W,mix(NG,W,.5),QR,mix(UM,BS,.5)]),
"39-cairns-on-the-ridge":((576,384),3,[("r",(0,0,576,384),0),("p",[(0,384),(0,260),(576,90),(576,384)],2),("p",[(0,384),(0,320),(576,200),(576,384)],3),("e",(120,230,150,270),1),("e",(250,190,275,225),1),("e",(370,150,390,180),1),("e",(470,120,485,145),0),("e",(500,300,515,345),3)],
 [mix(NG,W,.4),PT,mix(BS,UM,.3),mix(UM,BS,.5)]),
"42-bell-rope-in-the-plaza":((576,384),3,[("r",(0,0,576,384),0),("r",(0,230,576,384),1),("r",(0,0,70,384),3),("l",[(60,0),(60,260)],2),("r",(120,170,260,200),2),("r",(330,160,500,190),2),("e",(110,230,140,270),2),("e",(200,240,230,280),2),("e",(300,235,330,275),2),("e",(400,240,430,280),2)],
 [W,mix(NG,W,.6),mix(QR,PT,.4),mix(UM,BS,.5)]),
"44-nine-copies-drying":((576,384),3,[("r",(0,0,576,384),1),("r",(100,40,420,200),0)]+[("r",(110+i*34,90,136+i*34,140),0) for i in range(9)]+[("r",(0,300,576,384),2),("r",(470,60,560,384),3),("r",(490,90,540,300),1)],
 [W,mix(PT,NG,.4),mix(RS,BS,.4),mix(UM,BS,.5)]),
}
def render(size,blur,shapes,pal):
    im=Image.new("RGB",size)
    for k,g,v in shapes:
        lay=Image.new("RGB",size,pal[v]); m=Image.new("L",size,0); d=ImageDraw.Draw(m)
        {"r":lambda:d.rectangle(g,fill=255),"e":lambda:d.ellipse(g,fill=255),"p":lambda:d.polygon(g,fill=255),"l":lambda:d.line(g,fill=255,width=8)}[k]()
        im.paste(lay,(0,0),m.filter(ImageFilter.GaussianBlur(blur*2)))
    return im.filter(ImageFilter.GaussianBlur(blur))
vals=[]
for n,(sz,b,sh,pal) in S.items():  # dict order = P8 paint order
    g=render(sz,b,sh,[(x,x,x) for x in V]); g.convert("L").save(f"{OUT}/{n}-value.png"); vals.append(g)
    render(sz,b,sh,pal).save(f"{OUT}/{n}-limited.png")
sheet=Image.new("RGB",(6*600,540),(255,255,255))
for i,g in enumerate(vals): sheet.paste(g,(12+600*i+(576-g.width)//2,14+(512-g.height)//2))
sheet.convert("L").save(f"{OUT}/sheet-p8-order.png")
