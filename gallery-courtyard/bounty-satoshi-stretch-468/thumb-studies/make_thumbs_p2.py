# P2 batch thumbs (#1,#11,#16,#3,#19,#13). Reuses render() pattern from make_thumbs.py.
from PIL import Image, ImageDraw, ImageFilter
import os
OUT=os.path.dirname(os.path.abspath(__file__))
V=[235,170,105,40]
def C(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))
UM,QR,QG,BS,CB,RS,DV,PT,NG=map(C,["#2a3b8f","#c2336b","#d49a2a","#5a3324","#3d6fb6","#b07a45","#4b2a6e","#1aa3a3","#f0b81a"])
def mix(a,b,t): return tuple(int(a[i]*(1-t)+b[i]*t) for i in range(3))
W=(246,242,232)
S={
"01-two-notebooks-kitchen-table":((512,384),3,[("r",(0,0,512,384),1),("r",(90,90,256,280),0),("r",(256,90,420,280),0),("e",(200,150,280,230),2),("e",(240,160,320,240),2),("e",(212,162,268,218),0),("e",(252,172,308,228),0),("p",[(420,120),(512,160),(512,220),(440,190)],2),("e",(60,290,200,384),2),("e",(320,300,460,384),2),("e",(40,40,100,100),2)],
 [mix(W,QG,.1),mix(RS,QG,.5),mix(BS,QR,.3),mix(CB,UM,.5)]),
"11-pages-begin-to-fuse":((512,384),3,[("r",(0,0,512,384),1),("r",(0,0,80,384),3),("r",(400,0,512,250),0),("r",(0,250,512,384),2),("r",(110,200,256,300),0),("r",(256,200,400,300),0),("e",(210,215,300,290),2),("e",(235,235,275,270),3),("l",[(150,20),(160,180)],0),("l",[(300,10),(310,150)],0)],
 [mix(QG,W,.5),mix(UM,BS,.35),mix(UM,QR,.25),mix(UM,BS,.6)]),
"16-heron-one-line":((512,384),3,[("r",(0,0,512,384),0),("r",(0,220,512,270),1),("r",(0,270,512,384),1),("r",(0,280,512,300),0),("l",[(360,384),(355,200)],3),("e",(330,130,390,190),3),("l",[(360,140),(345,70)],3),("e",(338,58,358,76),3),("e",(70,240,90,300),2)],
 [mix(W,QR,.06),mix(CB,W,.55),mix(RS,CB,.4),mix(UM,BS,.4)]),
"03-generals-at-low-tide":((576,192),2,[("r",(0,0,576,192),2),("r",(0,0,576,40),3),("r",(0,100,576,118),0),("r",(0,118,576,192),1),("e",(20,120,120,170),3),("e",(170,125,250,165),3),("e",(300,120,390,168),3),("e",(440,122,540,170),3),("e",(60,110,70,120),0),("e",(205,112,215,122),0),("e",(340,108,350,118),0),("e",(485,110,495,120),0),("l",[(65,135),(65,185)],0),("l",[(345,135),(345,185)],0)],
 [mix(NG,QR,.25),mix(PT,UM,.4),mix(DV,UM,.4),mix(BS,UM,.5)]),
"19-two-rivers-hood-canal":((384,512),3,[("r",(0,0,384,512),2),("p",[(0,0),(200,0),(0,360)],1),("p",[(0,0),(120,0),(0,200)],0),("r",(0,360,384,512),1),("p",[(30,380),(384,330),(384,400),(30,450)],3),("r",(110,350,190,410),0),("r",(190,345,270,400),0),("e",(280,350,320,385),3),("e",(300,40,384,140),3)],
 [mix(W,CB,.1),mix(RS,CB,.35),mix(PT,QG,.35),mix(BS,UM,.5)]),
"13-nine-pages-at-dawn":((384,512),3,[("r",(0,0,384,512),1),("r",(30,30,170,200),2),("r",(45,45,155,185),0),("r",(0,300,384,512),2),("r",(120,310,270,390),0),("e",(70,300,110,330),2),("e",(290,305,330,335),2),("p",[(20,330),(80,330),(60,512),(0,512)],3),("p",[(300,330),(370,330),(384,512),(330,512)],3)],
 [W,mix(NG,QR,.35),mix(BS,RS,.4),mix(PT,UM,.6)]),
}
def render(size,blur,shapes,pal):
    im=Image.new("RGB",size)
    for k,g,v in shapes:
        lay=Image.new("RGB",size,pal[v]); m=Image.new("L",size,0); d=ImageDraw.Draw(m)
        {"r":lambda:d.rectangle(g,fill=255),"e":lambda:d.ellipse(g,fill=255),"p":lambda:d.polygon(g,fill=255),"l":lambda:d.line(g,fill=255,width=8)}[k]()
        im.paste(lay,(0,0),m.filter(ImageFilter.GaussianBlur(blur*2)))
    return im.filter(ImageFilter.GaussianBlur(blur))
vals=[]
for n,(sz,b,sh,pal) in S.items():  # dict order = P2 paint order
    g=render(sz,b,sh,[(x,x,x) for x in V]); g.convert("L").save(f"{OUT}/{n}-value.png"); vals.append(g)
    render(sz,b,sh,pal).save(f"{OUT}/{n}-limited.png")
sheet=Image.new("RGB",(3*600,2*540),(255,255,255))
for i,g in enumerate(vals): sheet.paste(g,(12+600*(i%3)+(576-g.width)//2,14+540*(i//3)+(512-g.height)//2))
sheet.convert("L").save(f"{OUT}/sheet-p2-order.png")
