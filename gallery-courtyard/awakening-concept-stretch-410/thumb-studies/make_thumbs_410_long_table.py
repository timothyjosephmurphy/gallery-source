# #410 #15 Long Table thumbs only (card 19). Reuses make_thumbs_410 helpers; old sheets not regenerated.
import os
src=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"make_thumbs_410.py")).read()
src=src[:src.index("run(S,OUT")]
exec(src)
OC=C("#d89a3a")
VP=(288,150)
sh=[("r",(0,0,576,384),3),("r",(0,0,576,150),2),
 ("p",[(VP[0]-10,VP[1]),(VP[0]+10,VP[1]),(470,384),(106,384)],1),
 ("l",[(0,40),VP],0),("l",[(576,40),VP],0)]
sh+=[("e",(x-4,y-4,x+4,y+4),0) for t in (0.1,0.25,0.4,0.55,0.7,0.85) for (x,y) in ((int(t*VP[0]),int(40+t*110)),(int(576-t*288),int(40+t*110)))]
for i,t in enumerate((0.35,0.55,0.75,0.95)):
    y=int(VP[1]+t*234); dx=int(18+t*180); r=int(6+t*22)
    sh+=[("e",(VP[0]-dx-r-20,y-2*r,VP[0]-dx-20,y),2),("e",(VP[0]+dx+20,y-2*r,VP[0]+dx+r+20,y),2)]
    sh+=[("e",(VP[0]-dx//2-r//2,y-r//3,VP[0]-dx//2+r//2,y+r//3),0)]
D={"19-15-long-table-many-languages":((576,384),3,sh,[W,OC,mix(UM,BS,.3),mix(UM,(10,10,40),.6)])}
run(D,OUT,"sheet-410-15-long-table.png",1)
