# P6 batch thumbs (#22,#35,#30,#33,#23,#31). Reuses render() pattern from make_thumbs_p4.py.
from PIL import Image, ImageDraw, ImageFilter
import os
OUT=os.path.dirname(os.path.abspath(__file__))
V=[235,170,105,40]
def C(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))
UM,QR,QG,BS,CB,RS,DV,PT,NG=map(C,["#2a3b8f","#c2336b","#d49a2a","#5a3324","#3d6fb6","#b07a45","#4b2a6e","#1aa3a3","#f0b81a"])
def mix(a,b,t): return tuple(int(a[i]*(1-t)+b[i]*t) for i in range(3))
W=(246,242,232)
S={
"22-pharmacy-price-tags":((576,384),4,[("r",(0,0,576,384),0),("r",(300,0,576,280),1),("e",(330,20,560,250),2),("r",(0,280,576,384),2),("e",(140,230,200,270),1),("r",(80,120,130,280),3),("r",(220,140,250,280),3)],
 [mix(QG,W,.5),mix(CB,W,.5),mix(DV,CB,.4),mix(UM,BS,.5)]),
"35-seed-packet-in-garden":((576,384),3,[("r",(0,0,576,384),1),("r",(0,220,576,384),3),("e",(250,260,290,290),0),("e",(380,250,440,300),2),("l",[(160,260),(390,280)],2),("e",(120,110,200,270),2),("e",(220,140,280,270),2)],
 [W,mix(QG,QR,.3),mix(BS,QG,.3),mix(BS,UM,.5)]),
"30-pruning-the-orchard":((448,448),3,[("r",(0,0,448,448),0),("r",(0,330,448,448),1),("r",(205,180,245,380),3),("l",[(225,200),(100,90)],3),("l",[(225,200),(350,90)],3),("l",[(225,190),(225,60)],3),("e",(80,60,370,200),1),("e",(150,80,175,105),0),("e",(280,100,305,125),0),("l",[(80,340),(110,200)],2),("l",[(370,340),(340,200)],2)],
 [W,mix(PT,QG,.4),mix(BS,QG,.3),mix(BS,UM,.5)]),
"33-disagreement-over-tea":((576,384),4,[("r",(0,0,576,384),1),("r",(0,260,576,384),2),("r",(270,0,306,240),0),("e",(250,220,326,290),3),("e",(120,250,170,290),2),("e",(400,250,450,290),2),("e",(20,120,130,384),3),("e",(446,120,556,384),3)],
 [W,mix(CB,W,.4),mix(QR,BS,.3),mix(UM,BS,.5)]),
"23-messengers-over-the-pass":((576,288),3,[("r",(0,0,576,288),0),("p",[(0,140),(200,90),(400,130),(576,100),(576,288),(0,288)],1),("p",[(0,190),(250,150),(576,180),(576,288),(0,288)],2),("p",[(0,240),(300,210),(576,250),(576,288),(0,288)],3),("e",(100,105,112,117),0),("e",(300,155,312,167),0),("e",(470,175,482,187),0),("e",(520,95,530,105),1)],
 [mix(QR,W,.5),mix(CB,W,.3),mix(UM,DV,.3),mix(BS,UM,.5)]),
"31-family-album-timechain":((576,384),3,[("r",(0,0,576,384),2),("r",(100,70,476,320),1),("p",[(180,0),(260,0),(420,384),(340,384)],0),("r",(130,100,210,160),2),("r",(190,140,270,200),2),("r",(320,110,400,170),2),("r",(380,150,450,210),2),("e",(20,250,140,370),3),("e",(440,260,560,370),3),("e",(240,300,330,384),3)],
 [mix(QG,W,.5),mix(QG,W,.7),mix(CB,QR,.5),mix(BS,UM,.4)]),
}
def render(size,blur,shapes,pal):
    im=Image.new("RGB",size)
    for k,g,v in shapes:
        lay=Image.new("RGB",size,pal[v]); m=Image.new("L",size,0); d=ImageDraw.Draw(m)
        {"r":lambda:d.rectangle(g,fill=255),"e":lambda:d.ellipse(g,fill=255),"p":lambda:d.polygon(g,fill=255),"l":lambda:d.line(g,fill=255,width=8)}[k]()
        im.paste(lay,(0,0),m.filter(ImageFilter.GaussianBlur(blur*2)))
    return im.filter(ImageFilter.GaussianBlur(blur))
vals=[]
for n,(sz,b,sh,pal) in S.items():  # dict order = P6 paint order
    g=render(sz,b,sh,[(x,x,x) for x in V]); g.convert("L").save(f"{OUT}/{n}-value.png"); vals.append(g)
    render(sz,b,sh,pal).save(f"{OUT}/{n}-limited.png")
sheet=Image.new("RGB",(3*600,2*540),(255,255,255))
for i,g in enumerate(vals): sheet.paste(g,(12+600*(i%3)+(576-g.width)//2,14+540*(i//3)+(512-g.height)//2))
sheet.convert("L").save(f"{OUT}/sheet-p6-order.png")
