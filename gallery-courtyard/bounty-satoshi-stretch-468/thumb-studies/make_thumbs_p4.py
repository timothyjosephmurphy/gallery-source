# P4 batch thumbs (#4,#2,#15,#10,#9,#20). Reuses render() pattern from make_thumbs.py.
from PIL import Image, ImageDraw, ImageFilter
import os
OUT=os.path.dirname(os.path.abspath(__file__))
V=[235,170,105,40]
def C(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))
UM,QR,QG,BS,CB,RS,DV,PT,NG=map(C,["#2a3b8f","#c2336b","#d49a2a","#5a3324","#3d6fb6","#b07a45","#4b2a6e","#1aa3a3","#f0b81a"])
def mix(a,b,t): return tuple(int(a[i]*(1-t)+b[i]*t) for i in range(3))
W=(246,242,232)
S={
"04-esperanza-counting-rain":((576,384),3,[("r",(0,0,576,384),0),("r",(0,0,576,90),3),("r",(0,200,576,384),2),("e",(120,250,400,340),0),("e",(180,270,300,320),1),("l",[(60,100),(80,190)],0),("l",[(160,100),(180,190)],0),("l",[(260,100),(280,190)],0),("r",(410,150,445,260),3)],
 [W,mix(QR,PT,.5),mix(CB,UM,.4),mix(UM,BS,.5)]),
"02-mycelium-ledger":((384,512),3,[("r",(0,0,384,170),0),("r",(0,170,384,512),3),("r",(90,0,130,260),2),("r",(250,0,290,260),2),("l",[(110,260),(180,360),(270,260)],1),("l",[(60,420),(190,360),(330,440)],1),("e",(175,350,195,370),0),("e",(55,410,72,428),0),("e",(320,430,338,448),0)],
 [mix(QG,W,.4),mix(PT,QG,.4),mix(BS,UM,.2),mix(BS,UM,.5)]),
"15-salmon-run-consensus":((576,384),3,[("r",(0,0,576,384),1),("e",(40,40,160,140),2),("e",(300,200,440,320),2),("l",[(100,250),(160,190)],3),("l",[(220,220),(280,160)],3),("l",[(340,150),(400,90)],3),("l",[(450,260),(510,200)],3),("l",[(220,320),(170,350)],2),("e",(250,60,270,80),0),("e",(470,120,490,140),0),("r",(520,0,576,90),3)],
 [W,mix(PT,W,.4),mix(RS,BS,.4),mix(QR,UM,.3)]),
"10-hands-that-verify":((384,512),3,[("r",(0,0,384,512),2),("r",(0,0,190,140),1),("r",(190,0,384,140),1),("p",[(150,260),(234,260),(220,300),(164,300)],0),("l",[(192,180),(192,330)],0),("r",(150,330,234,345),0),("e",(30,200,120,420),3),("e",(270,190,370,430),3),("e",(60,440,140,500),1),("e",(80,60,95,75),0)],
 [mix(QG,W,.3),mix(QR,QG,.4),mix(PT,UM,.4),mix(UM,BS,.5)]),
"09-chain-of-lanterns-warsaw":((576,384),3,[("r",(0,0,576,384),2),("p",[(0,0),(200,0),(300,200),(0,384)],3),("p",[(576,0),(420,0),(320,200),(576,384)],3),("e",(110,100,150,140),0),("e",(180,130,205,155),0),("e",(235,152,250,167),0),("e",(270,170,280,180),0),("l",[(130,120),(275,175)],1),("r",(380,250,410,384),3),("r",(430,240,460,384),3),("e",(60,150,110,200),0)],
 [mix(NG,W,.3),mix(QG,BS,.3),mix(UM,DV,.4),mix(UM,BS,.6)]),
"20-lantern-kept-through-storm":((384,512),3,[("r",(0,0,384,512),2),("r",(40,40,200,250),3),("p",[(40,120),(200,60),(200,140),(40,200)],1),("e",(230,150,350,270),1),("e",(270,190,310,240),0),("r",(90,330,300,400),0),("r",(0,400,384,512),3),("r",(320,40,360,200),3)],
 [mix(NG,W,.3),mix(NG,BS,.4),mix(BS,UM,.3),mix(DV,UM,.5)]),
}
def render(size,blur,shapes,pal):
    im=Image.new("RGB",size)
    for k,g,v in shapes:
        lay=Image.new("RGB",size,pal[v]); m=Image.new("L",size,0); d=ImageDraw.Draw(m)
        {"r":lambda:d.rectangle(g,fill=255),"e":lambda:d.ellipse(g,fill=255),"p":lambda:d.polygon(g,fill=255),"l":lambda:d.line(g,fill=255,width=8)}[k]()
        im.paste(lay,(0,0),m.filter(ImageFilter.GaussianBlur(blur*2)))
    return im.filter(ImageFilter.GaussianBlur(blur))
vals=[]
for n,(sz,b,sh,pal) in S.items():  # dict order = P4 paint order
    g=render(sz,b,sh,[(x,x,x) for x in V]); g.convert("L").save(f"{OUT}/{n}-value.png"); vals.append(g)
    render(sz,b,sh,pal).save(f"{OUT}/{n}-limited.png")
sheet=Image.new("RGB",(3*600,2*540),(255,255,255))
for i,g in enumerate(vals): sheet.paste(g,(12+600*(i%3)+(576-g.width)//2,14+540*(i//3)+(512-g.height)//2))
sheet.convert("L").save(f"{OUT}/sheet-p4-order.png")
