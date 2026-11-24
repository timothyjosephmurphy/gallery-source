# #410 paint-first thumbs + Rogan bonus. Same render() pattern as #468 make_thumbs_p7.py.
from PIL import Image, ImageDraw, ImageFilter
import os,sys
OUT=os.path.dirname(os.path.abspath(__file__))
V=[235,170,105,40]
def C(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))
UM,QR,QG,BS,CB,RS,DV,PT,NG,CO=map(C,["#2a3b8f","#c2336b","#d49a2a","#5a3324","#3d6fb6","#b07a45","#4b2a6e","#1aa3a3","#f0b81a","#e8641e"])
def mix(a,b,t): return tuple(int(a[i]*(1-t)+b[i]*t) for i in range(3))
W=(246,242,232)
S={
"01-03-mirror-of-every-headline":((384,512),3,[("r",(0,0,384,512),2),("e",(70,90,320,400),3),("p",[(195,245),(80,140),(150,100)],2),("p",[(195,245),(300,150),(310,280)],1),("p",[(195,245),(110,370),(260,390)],2),("e",(160,215,235,275),0),("e",(185,230,210,258),1),("r",(150,390,240,512),2)],
 [W,mix(PT,W,.3),mix(DV,UM,.4),mix(DV,(40,40,50),.5)]),
"02-11-machine-offers-its-hand":((576,384),3,[("r",(0,0,576,384),2),("r",(190,40,390,330),0),("l",[(220,120),(360,260)],1),("l",[(230,250),(350,110)],1),("p",[(0,230),(240,190),(260,215),(0,290)],1),("p",[(576,220),(330,180),(310,205),(576,280)],0),("r",(260,180,320,230),3)],
 [W,mix(QR,NG,.5),mix(PT,UM,.5),mix(UM,BS,.5)]),
"03-11b-lamps-in-a-ripple":((576,384),3,[("r",(0,0,576,384),2),("r",(0,230,576,384),3),("e",(40,190,90,240),0),("e",(140,195,185,240),0),("e",(240,200,280,238),1),("e",(330,205,362,236),1),("e",(410,208,436,234),1),("e",(500,250,570,330),2),("r",(0,300,576,384),3)],
 [mix(NG,W,.3),CO,mix(UM,DV,.4),mix(UM,BS,.6)]),
"04-12-seeing-the-worst-staying-anyway":((384,512),3,[("r",(0,0,384,512),2),("r",(0,330,384,512),3),("l",[(90,340),(90,500)],1),("l",[(290,340),(290,500)],1),("e",(70,150,320,300),0),("r",(70,225,320,260),2),("e",(130,250,180,400),3),("e",(205,250,255,400),3),("e",(140,260,165,285),1)],
 [mix(CO,W,.4),mix(QR,PT,.5),mix(PT,UM,.6),mix(UM,BS,.6)]),
"05-17-self-portrait-turned-toward-you":((384,512),3,[("r",(0,0,384,512),1),("r",(0,0,110,512),0),("p",[(230,60),(380,40),(380,300),(240,320)],2),("e",(120,110,220,230),1),("e",(140,140,190,200),0),("r",(110,230,240,512),3),("l",[(200,330),(40,420)],0),("e",(60,440,200,500),2)],
 [mix(QG,W,.4),mix(QR,QG,.5),mix(PT,DV,.4),mix(UM,BS,.5)]),
"06-5b-soft-exit-BRIDGE":((576,384),3,[("r",(0,0,576,384),0),("r",(0,0,260,384),2),("l",[(130,0),(130,384)],3),("r",(170,200,250,384),3),("r",(260,280,576,384),1),("e",(330,150,380,330),3),("e",(370,190,400,220),1)],
 [mix(NG,CO,.3),mix(QG,W,.5),mix(PT,UM,.6),mix(UM,BS,.6)]),
}
R={
"05-prescribed":((384,512),3,[("r",(0,0,384,512),0),("p",[(0,0),(130,240),(130,330),(0,512)],2),("p",[(384,0),(254,240),(254,330),(384,512)],2),("r",(130,200,254,330),1),("e",(160,370,230,470),3),("e",(185,400,205,420),0)],
 [W,mix(PT,W,.6),mix(PT,UM,.4),mix(UM,BS,.5)]),
"07-soma-sky":((576,384),3,[("r",(0,0,576,384),1),("r",(470,0,576,384),0),("r",(0,250,576,384),3),("e",(60,210,110,280),2),("e",(160,215,210,280),2),("e",(260,210,310,280),2),("e",(360,215,410,280),2),("e",(470,230,505,290),3)],
 [mix(CO,QR,.3),mix(CB,W,.2),mix(CB,UM,.5),mix(UM,BS,.6)]),
"12-hunters-prayer":((384,512),3,[("r",(0,0,384,512),1),("r",(0,0,384,180),0),("e",(80,280,330,420),2),("e",(40,240,110,330),3),("e",(240,250,290,330),3),("r",(0,430,384,512),2)],
 [mix(W,(200,205,200),.3),mix((110,140,90),W,.4),mix((70,100,60),BS,.3),mix(UM,BS,.6)]),
"14-peaceful-warrior":((384,512),3,[("r",(0,0,384,512),3),("p",[(192,0),(60,512),(324,512)],1),("e",(70,400,314,500),0),("e",(170,280,215,420),3),("e",(175,250,210,285),3)],
 [mix(NG,W,.3),mix(QG,NG,.4),mix(UM,CB,.3),mix(UM,(10,10,30),.5)]),
}
def render(size,blur,shapes,pal):
    im=Image.new("RGB",size)
    for k,g,v in shapes:
        lay=Image.new("RGB",size,pal[v]); m=Image.new("L",size,0); d=ImageDraw.Draw(m)
        {"r":lambda:d.rectangle(g,fill=255),"e":lambda:d.ellipse(g,fill=255),"p":lambda:d.polygon(g,fill=255),"l":lambda:d.line(g,fill=255,width=8)}[k]()
        im.paste(lay,(0,0),m.filter(ImageFilter.GaussianBlur(blur*2)))
    return im.filter(ImageFilter.GaussianBlur(blur))
def run(D,out,sheetname,cols):
    os.makedirs(out,exist_ok=True); vals=[]
    for n,(sz,b,sh,pal) in D.items():  # dict order = paint-lock order
        g=render(sz,b,sh,[(x,x,x) for x in V]); g.convert("L").save(f"{out}/{n}-value.png"); vals.append(g)
        render(sz,b,sh,pal).save(f"{out}/{n}-limited.png")
    rows=(len(vals)+cols-1)//cols
    sheet=Image.new("RGB",(cols*600,rows*540),(255,255,255))
    for i,g in enumerate(vals):
        c,r=i%cols,i//cols; sheet.paste(g,(12+600*c+(576-g.width)//2,14+540*r+(512-g.height)//2))
    sheet.convert("L").save(f"{out}/{sheetname}")
run(S,OUT,"sheet-410-paint-lock-order.png",3)   # row1: #3,#11,11b  row2: #12,#17,5b bridge (end)
run(R,"/workspace/rogan-series/thumbs","sheet-rogan-bonus-05-07-12-14.png",4)
