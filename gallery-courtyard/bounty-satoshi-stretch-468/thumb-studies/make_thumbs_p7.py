# P7-tail thumbs (#36,#37). Same render() pattern as make_thumbs_p6.py.
from PIL import Image, ImageDraw, ImageFilter
import os
OUT=os.path.dirname(os.path.abspath(__file__))
V=[235,170,105,40]
def C(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))
UM,QR,QG,BS,CB,RS,DV,PT,NG=map(C,["#2a3b8f","#c2336b","#d49a2a","#5a3324","#3d6fb6","#b07a45","#4b2a6e","#1aa3a3","#f0b81a"])
def mix(a,b,t): return tuple(int(a[i]*(1-t)+b[i]*t) for i in range(3))
W=(246,242,232)
S={
"36-letter-returned-rewritten":((384,512),3,[("r",(0,0,384,512),2),("p",[(250,0),(384,0),(384,120),(140,512),(20,512)],1),("p",[(290,0),(370,0),(160,512),(90,512)],0),("p",[(0,512),(0,260),(384,40),(384,140),(160,512)],1),("p",[(0,512),(0,330),(120,512)],3),("e",(40,340,95,450),3),("r",(140,380,190,410),0),("e",(180,330,235,430),2)],
 [W,mix(NG,W,.6),mix(UM,QR,.35),mix(UM,BS,.5)]),
"37-waiting-room-with-kindness":((576,384),3,[("r",(0,0,576,384),1),("r",(0,280,576,384),2),("r",(440,60,540,320),0),("e",(40,170,100,300),3),("e",(120,180,170,300),3),("e",(200,190,240,300),2),("e",(270,200,300,290),2),("e",(330,205,355,285),2),("e",(160,220,180,236),0),("r",(430,50,446,330),3)],
 [W,mix(PT,mix(NG,W,.5),.4),mix(RS,QR,.3),mix(UM,BS,.5)]),
}
def render(size,blur,shapes,pal):
    im=Image.new("RGB",size)
    for k,g,v in shapes:
        lay=Image.new("RGB",size,pal[v]); m=Image.new("L",size,0); d=ImageDraw.Draw(m)
        {"r":lambda:d.rectangle(g,fill=255),"e":lambda:d.ellipse(g,fill=255),"p":lambda:d.polygon(g,fill=255),"l":lambda:d.line(g,fill=255,width=8)}[k]()
        im.paste(lay,(0,0),m.filter(ImageFilter.GaussianBlur(blur*2)))
    return im.filter(ImageFilter.GaussianBlur(blur))
vals=[]
for n,(sz,b,sh,pal) in S.items():  # dict order = P7-tail paint order
    g=render(sz,b,sh,[(x,x,x) for x in V]); g.convert("L").save(f"{OUT}/{n}-value.png"); vals.append(g)
    render(sz,b,sh,pal).save(f"{OUT}/{n}-limited.png")
sheet=Image.new("RGB",(2*600,540),(255,255,255))
for i,g in enumerate(vals): sheet.paste(g,(12+600*i+(576-g.width)//2,14+(512-g.height)//2))
sheet.convert("L").save(f"{OUT}/sheet-p7-tail-order.png")
