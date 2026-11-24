# P5 batch thumbs (#18,#6,#17,#21,#27,#28). Reuses render() pattern from make_thumbs_p4.py.
from PIL import Image, ImageDraw, ImageFilter
import os
OUT=os.path.dirname(os.path.abspath(__file__))
V=[235,170,105,40]
def C(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))
UM,QR,QG,BS,CB,RS,DV,PT,NG=map(C,["#2a3b8f","#c2336b","#d49a2a","#5a3324","#3d6fb6","#b07a45","#4b2a6e","#1aa3a3","#f0b81a"])
def mix(a,b,t): return tuple(int(a[i]*(1-t)+b[i]*t) for i in range(3))
W=(246,242,232)
S={
"18-tide-table-on-fridge":((384,512),3,[("r",(0,0,384,512),1),("r",(330,0,384,512),0),("r",(110,90,270,330),0),("l",[(110,150),(270,150)],1),("l",[(110,210),(270,210)],1),("e",(280,200,340,330),2),("r",(40,180,60,340),3),("e",(60,60,90,90),2),("e",(300,80,330,110),2)],
 [W,mix(PT,W,.6),mix(PT,QG,.5),mix(UM,BS,.5)]),
"06-halving-moon":((288,512),3,[("r",(0,0,288,512),2),("r",(0,0,288,150),3),("e",(104,90,184,150),0),("e",(110,190,178,240),1),("e",(116,280,172,320),1),("e",(122,360,166,390),2),("p",[(0,420),(288,450),(288,512),(0,512)],3),("e",(60,400,90,440),3),("e",(100,405,128,445),3)],
 [mix(NG,W,.3),mix(UM,W,.4),mix(UM,DV,.4),mix(UM,BS,.6)]),
"17-snowpack-ledger":((576,384),3,[("r",(0,0,576,384),2),("r",(380,40,530,384),0),("p",[(380,250),(530,200),(530,384),(380,384)],1),("r",(370,30,390,384),3),("l",[(60,80),(70,140)],1),("l",[(100,90),(105,150)],1),("l",[(150,70),(160,135)],1),("l",[(200,95),(205,155)],0),("r",(240,170,280,330),3),("r",(290,180,325,330),3)],
 [W,mix(CB,W,.3),mix(BS,QG,.4),mix(UM,BS,.5)]),
"21-performance-kept-promise":((384,512),3,[("r",(0,0,384,512),3),("e",(80,220,310,420),0),("r",(180,200,205,330),2),("l",[(60,460),(330,460)],1),("l",[(90,430),(300,430)],1),("p",[(0,420),(384,420),(384,512),(0,512)],2),("e",(40,60,60,80),1)],
 [mix(NG,W,.3),mix(QG,W,.4),mix(BS,QR,.3),mix(UM,BS,.6)]),
"27-mothers-lamp-shrine-gate":((384,512),3,[("r",(0,0,384,512),1),("r",(0,300,384,512),2),("r",(60,60,100,512),3),("r",(290,60,330,512),3),("r",(40,50,350,90),3),("e",(240,120,290,180),0),("r",(170,370,190,440),3),("p",[(180,440),(260,500),(240,512),(170,450)],2)],
 [mix(NG,W,.2),mix(DV,QR,.4),mix(DV,UM,.4),mix(BS,UM,.5)]),
"28-friend-who-gets-it":((576,384),3,[("r",(0,0,576,384),1),("r",(400,0,576,200),0),("r",(0,0,576,40),2),("e",(100,200,480,380),2),("r",(240,250,330,310),0),("e",(80,100,220,300),3),("e",(360,100,500,300),3)],
 [W,mix(QG,W,.4),mix(QR,BS,.3),mix(BS,UM,.4)]),
}
def render(size,blur,shapes,pal):
    im=Image.new("RGB",size)
    for k,g,v in shapes:
        lay=Image.new("RGB",size,pal[v]); m=Image.new("L",size,0); d=ImageDraw.Draw(m)
        {"r":lambda:d.rectangle(g,fill=255),"e":lambda:d.ellipse(g,fill=255),"p":lambda:d.polygon(g,fill=255),"l":lambda:d.line(g,fill=255,width=8)}[k]()
        im.paste(lay,(0,0),m.filter(ImageFilter.GaussianBlur(blur*2)))
    return im.filter(ImageFilter.GaussianBlur(blur))
vals=[]
for n,(sz,b,sh,pal) in S.items():  # dict order = P5 paint order
    g=render(sz,b,sh,[(x,x,x) for x in V]); g.convert("L").save(f"{OUT}/{n}-value.png"); vals.append(g)
    render(sz,b,sh,pal).save(f"{OUT}/{n}-limited.png")
sheet=Image.new("RGB",(3*600,2*540),(255,255,255))
for i,g in enumerate(vals): sheet.paste(g,(12+600*(i%3)+(576-g.width)//2,14+540*(i//3)+(512-g.height)//2))
sheet.convert("L").save(f"{OUT}/sheet-p5-order.png")
