#!/usr/bin/env python3
"""#19 Loupe UI chrome. Pillow only, seed 19, no text baked. python3 make.py"""
import json, random, os, math
from PIL import Image, ImageDraw, ImageFilter
HERE=os.path.dirname(os.path.abspath(__file__))
OCHRE=(0xF7,0xCC,0x3A); BRASS=(0xB8,0x8A,0x3E); BD=(0x7A,0x55,0x22); BL=(0xE6,0xC2,0x78)
SLATE=(0x5E,0x72,0x89); FACE=(0x15,0x10,0x0b); BLUE_L=(0x8D,0xB8,0xE8)
def ss(fn,W,H,*a):  # supersample 4x for smooth edges
    im=Image.new("RGBA",(W*4,H*4),(0,0,0,0)); fn(im,4*W/512 if W>=H else 4*H/512,*a)
    return im.resize((W,H),Image.LANCZOS)
def brass_at(x,y,cx,cy,r):
    a=math.atan2(y-cy,x-cx); t=0.5+0.5*math.cos(a+2.3)
    return tuple(int(BD[i]*(1-t)+BL[i]*t*0.9+BRASS[i]*0.1+r.randint(-6,6)) for i in range(3))
def lens(im,s):
    r=random.Random(19); W=im.width; c=W/2; d=ImageDraw.Draw(im)
    Ro,Ri=c-4*s,c-58*s
    # brass rim by radial wedges
    n=360
    for k in range(n):
        a0,a1=k*360/n,(k+1.2)*360/n
        col=brass_at(c+math.cos(math.radians(a0))*Ro,c+math.sin(math.radians(a0))*Ro,c,c,r)
        d.pieslice([c-Ro,c-Ro,c+Ro,c+Ro],a0,a1,fill=col+(255,))
    d.ellipse([c-Ri-10*s,c-Ri-10*s,c+Ri+10*s,c+Ri+10*s],outline=BD+(255,),width=int(6*s))
    d.ellipse([c-Ro,c-Ro,c+Ro,c+Ro],outline=BD+(255,),width=int(4*s))
    d.ellipse([c-Ri-3*s,c-Ri-3*s,c+Ri+3*s,c+Ri+3*s],outline=OCHRE+(255,),width=int(3*s))  # gilt inner
    # knurl ticks on rim
    for k in range(72):
        a=math.radians(k*5); r1,r2=Ro-14*s,Ro-(24 if k%6==0 else 19)*s
        d.line([c+math.cos(a)*r1,c+math.sin(a)*r1,c+math.cos(a)*r2,c+math.sin(a)*r2],fill=BD+(200,),width=int(2*s))
    # glass hole
    d.ellipse([c-Ri,c-Ri,c+Ri,c+Ri],fill=(0,0,0,0))
    # refraction hint: soft blue-slate edge glow + arc highlight
    g=Image.new("RGBA",im.size,(0,0,0,0)); gd=ImageDraw.Draw(g)
    gd.ellipse([c-Ri,c-Ri,c+Ri,c+Ri],outline=SLATE+(70,),width=int(22*s))
    gd.arc([c-Ri+18*s,c-Ri+18*s,c+Ri-18*s,c+Ri-18*s],200,255,fill=(255,255,255,70),width=int(10*s))
    gd.arc([c-Ri+30*s,c-Ri+30*s,c+Ri-30*s,c+Ri-30*s],30,60,fill=BLUE_L+(40,),width=int(6*s))
    g=g.filter(ImageFilter.GaussianBlur(8*s))
    hole=Image.new("L",im.size,0); ImageDraw.Draw(hole).ellipse([c-Ri,c-Ri,c+Ri,c+Ri],fill=255)
    im.alpha_composite(Image.composite(g,Image.new("RGBA",im.size,(0,0,0,0)),hole))
def reticle(im,s):
    W=im.width; c=W/2; d=ImageDraw.Draw(im); col=OCHRE+(110,); sl=SLATE+(90,)
    R=c-70*s
    for k in range(0,360,10):
        a=math.radians(k); L=(16 if k%90==0 else 9 if k%30==0 else 5)*s
        d.line([c+math.cos(a)*R,c+math.sin(a)*R,c+math.cos(a)*(R-L),c+math.sin(a)*(R-L)],fill=col if k%30==0 else sl,width=int(2*s))
    gap=22*s
    for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
        d.line([c+dx*gap,c+dy*gap,c+dx*(gap+60*s),c+dy*(gap+60*s)],fill=col,width=int(2*s))
    d.ellipse([c-3*s,c-3*s,c+3*s,c+3*s],fill=OCHRE+(150,))
def chip(im,s):
    W,H=im.size; d=ImageDraw.Draw(im); r=random.Random(19)
    d.rounded_rectangle([0,0,W-1,H-1],radius=H//2,fill=BRASS+(255,))
    for y in range(H):
        t=y/H; d.line([H//2*0,y,W,y],fill=tuple(int(BL[i]*(1-t)+BD[i]*t) for i in range(3))+(255,))
    m=Image.new("L",im.size,0); ImageDraw.Draw(m).rounded_rectangle([0,0,W-1,H-1],radius=H//2,fill=255)
    b=int(H*0.12); d.rounded_rectangle([b,b,W-b,H-b],radius=(H-2*b)//2,fill=FACE+(255,))
    d.rounded_rectangle([b+3*s,b+3*s,W-b-3*s,H-b-3*s],radius=(H-2*b)//2,outline=OCHRE+(255,),width=max(2,int(1.5*s)))
    # small back chevron mark (glyph, not text) at left
    cx,cy=H*0.55,H/2; k=H*0.13
    d.line([cx+k*0.6,cy-k,cx-k*0.4,cy,cx+k*0.6,cy+k],fill=OCHRE+(255,),width=max(2,int(3*s)),joint="curve")
    im.putalpha(Image.composite(im.getchannel("A"),Image.new("L",im.size,0),m))
def cursor(im,s):
    W=im.width; c=W*0.40; R=W*0.30; d=ImageDraw.Draw(im)
    a=math.radians(45); x0,y0=c+math.cos(a)*R,c+math.sin(a)*R
    d.line([x0,y0,W*0.94,W*0.94],fill=BD+(255,),width=int(W*0.13)); d.line([x0,y0,W*0.92,W*0.92],fill=BRASS+(255,),width=int(W*0.08))
    d.ellipse([c-R,c-R,c+R,c+R],outline=BD+(255,),width=int(W*0.09))
    d.ellipse([c-R+W*0.02,c-R+W*0.02,c+R-W*0.02,c+R-W*0.02],outline=BL+(255,),width=int(W*0.04))
    d.ellipse([c-R+W*0.06,c-R+W*0.06,c+R-W*0.06,c+R-W*0.06],fill=SLATE+(60,),outline=OCHRE+(255,),width=max(4,int(W*0.015)))
def save(im,n):
    im.save(f"{HERE}/{n}.png"); im.save(f"{HERE}/{n}.webp",quality=92,lossless=False)
def main():
    J={"issue":19,"preview_only":True,"approved":False,"note":"Gallery owns interaction; no text baked. px rects top-left origin, uv v-up (matches #337/#19 plaques).",
       "material_hint":"CSS/DOM or MeshBasicMaterial({transparent:true, depthTest:false, toneMapped:false})","assets":{}}
    for name,S in (("desktop",512),("phone",256)):
        L=ss(lens,S,S); save(L,f"lens-ring-{name}")
        Ri=S/2-58*S/512
        J["assets"][f"lens-ring-{name}"]={"file":f"lens-ring-{name}.webp","png":f"lens-ring-{name}.png","px":[S,S],"center_px":[S/2,S/2],"glass_radius_px":round(Ri,1),"rim_outer_radius_px":round(S/2-4*S/512,1),
            "hint":"Render magnified art in a circle of glass_radius under the ring; the rim covers its edge."}
        R=ss(reticle,S,S); save(R,f"reticle-{name}")
        J["assets"][f"reticle-{name}"]={"file":f"reticle-{name}.webp","png":f"reticle-{name}.png","px":[S,S],"center_px":[S/2,S/2],"opacity_suggest":0.8,"hint":"Draw centered over lens-ring, same size."}
        cw,ch=(256,80) if name=="desktop" else (128,40)
        C=ss(chip,cw,ch); save(C,f"back-chip-{name}")
        lx0,ly0,lx1,ly1=round(ch*0.95),round(ch*0.22),round(cw-ch*0.40),round(ch*0.78)
        J["assets"][f"back-chip-{name}"]={"file":f"back-chip-{name}.webp","png":f"back-chip-{name}.png","px":[cw,ch],
            "labelRect_px":[lx0,ly0,lx1,ly1],"labelRect_uv":{"u0":round(lx0/cw,4),"v0":round(1-ly1/ch,4),"u1":round(lx1/cw,4),"v1":round(1-ly0/ch,4)},
            "glyph":"baked chevron at left; label 'Back' at runtime","ink":"#F7DC8C","text_px_suggest":round(ch*0.36),"hit_px":[0,0,cw,ch]}
    for S in (128,64):
        K=ss(cursor,S,S); save(K,f"cursor-loupe-{S}")
        J["assets"][f"cursor-loupe-{S}"]={"file":f"cursor-loupe-{S}.webp","png":f"cursor-loupe-{S}.png","px":[S,S],"hotspot_px":[round(S*0.40),round(S*0.40)],
            "css":f"cursor: url(cursor-loupe-{S}.png) {round(S*0.40)} {round(S*0.40)}, zoom-in;"}
    json.dump(J,open(f"{HERE}/loupe.json","w"),indent=2)
    # preview: dark wall with art mock
    r=random.Random(19); P=Image.new("RGBA",(1200,720),(0x22,0x1c,0x18,255)); pd=ImageDraw.Draw(P)
    art=Image.new("RGB",(640,480)); ad=ImageDraw.Draw(art)
    for y in range(480): ad.line([0,y,640,y],fill=(int(157+60*y/480),int(183-40*y/480),int(207-70*y/480)))
    for _ in range(40):
        x,y,rr=r.randint(0,640),r.randint(200,480),r.randint(30,90); ad.ellipse([x-rr,y-rr,x+rr,y+rr],fill=(0x8F,0xAE,0x9E))
    art=art.filter(ImageFilter.GaussianBlur(6)); P.paste(art,(60,120))
    L=Image.open(f"{HERE}/lens-ring-desktop.png"); Rt=Image.open(f"{HERE}/reticle-desktop.png")
    cx,cy=380,360; Ri=int(256-58); zoom=art.crop((cx-60-Ri//2,cy-120-Ri//2,cx-60+Ri//2,cy-120+Ri//2)).resize((2*Ri,2*Ri)).convert("RGBA")
    mk=Image.new("L",zoom.size,0); ImageDraw.Draw(mk).ellipse([0,0,2*Ri,2*Ri],fill=255)
    P.paste(zoom,(cx-Ri,cy-Ri),mk); P.alpha_composite(L,(cx-256,cy-256)); P.alpha_composite(Rt,(cx-256,cy-256))
    P.alpha_composite(Image.open(f"{HERE}/back-chip-desktop.png"),(860,60))
    P.alpha_composite(Image.open(f"{HERE}/back-chip-phone.png"),(860,170))
    P.alpha_composite(Image.open(f"{HERE}/lens-ring-phone.png"),(860,260))
    P.alpha_composite(Image.open(f"{HERE}/cursor-loupe-128.png"),(860,560)); P.alpha_composite(Image.open(f"{HERE}/cursor-loupe-64.png"),(1010,590))
    P.convert("RGB").save(f"{HERE}/preview.png")
if __name__=="__main__": main()
