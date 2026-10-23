from hqlib import *
def _rrect_sdf(W,H,m,rad):
    ys,xs=np.mgrid[0:H,0:W].astype(np.float32); x=xs+0.5-W/2; y=ys+0.5-H/2
    hw=W/2-m-rad; hh=H/2-m-rad
    qx=np.abs(x)-hw; qy=np.abs(y)-hh
    return np.hypot(np.maximum(qx,0),np.maximum(qy,0))+np.minimum(np.maximum(qx,qy),0)-rad   # <0 inside
def normal_flat(hgt,strength,w=None,h=None):
    H,W=hgt.shape
    gx=np.gradient(hgt,axis=1)*W*strength; gy=np.gradient(hgt,axis=0)*W*strength
    n=np.stack([-gx,gy,np.ones_like(gx)],-1); n/=np.linalg.norm(n,axis=-1,keepdims=True)
    return ((n*0.5+0.5)*255+0.5).clip(0,255).astype(np.uint8)
def _noise(h,w,beta,rng,**k): return pnoise(h,w,beta,rng,**k)
def _rivets(W,H,sdfm,pts,r):
    ys,xs=np.mgrid[0:H,0:W].astype(np.float32); out=np.zeros((H,W),np.float32)
    for (px,py) in pts:
        d=np.hypot(xs-px,ys-py); out=np.maximum(out,np.sqrt(np.clip(1-(d/r)**2,0,1)))
    return out
TEXT_RECT=[0.07,0.2,0.93,0.8]   # uv rect left,top,right,bottom reserved for lettering (all plates)

def plate_enamel(W=1024,H=256,seed=301):
    rng=np.random.default_rng(seed)
    s=_rrect_sdf(W,H,4,26)                           # outer shape
    inside=smooth(1.5,-1.0,s)
    border_o=smooth(-18,-20,s)*0+ (1-smooth(-22,-19,s)); rim=(s<-1)&(s>-22)  # raised rolled rim
    rimm=smooth(-0.5,-2.5,s)*smooth(-24,-20,s)       # 1 inside outer rim band
    line1=smooth(2.2,0,np.abs(s+34))                  # ochre pinstripe
    line2=smooth(1.2,0,np.abs(s+44))
    field=smooth(-40,-47,s)
    pw=hx("slate")*0.8+np.array([20,28,50],np.float32)*0.2          # deep Dusk Slate enamel
    cloud=_noise(H,W,1.3,rng,fmax=6); fine=_noise(H,W,0.4,rng,fmin=60,fmax=W//2)
    yy=np.mgrid[0:H,0:W][0].astype(np.float32)/H
    gloss=0.10*np.cos((yy-0.18)*np.pi*0.9)                          # soft painterly sheen
    col=np.broadcast_to(pw,(H,W,3)).astype(np.float32).copy()*(1+0.03*cloud+gloss)[...,None]
    col=mix(col,hx("slate")*0.55+hx("blue")*0.45,smooth(0.3,2,cloud)*0.18*field)
    rimc=hx("dawn")*0.96
    col=mix(col,rimc*(1+0.02*fine)[...,None],rimm)
    col=mix(col,hx("ochre")*0.95,np.clip(line1,0,1)*(1-rimm)); col=mix(col,hx("terracotta")*0.9,np.clip(line2,0,1)*(1-rimm)*0.9)
    # rivets
    pts=[(46,46),(W-46,46),(46,H-46),(W-46,H-46)]
    riv=_rivets(W,H,None,pts,11)
    col=mix(col,hx("ochre")*0.9+60*0.1,riv*0.9)
    # enamel chips at the edge
    chip=smooth(-20,-3,s)*smooth(1.6,2.8,_noise(H,W,0.6,rng,fmin=20,fmax=300))
    col=mix(col,np.array([40,36,44],np.float32),chip*0.8)
    col=np.where((inside<0.5)[...,None],col,col)
    height=0.45*smooth(-2,-12,s)*0+0.3*rimm+0.25*np.clip(line1,0,1)*0.3+0.35*riv+0.1*field*0-0.4*chip+0.02*fine
    rough=np.clip(0.14+0.45*chip+0.25*rimm*0.3+0.10*smooth(0.2,2.5,-cloud)+0.35*(1-field)*0.2,0.08,1)
    alpha=inside
    return dict(color=col,height=height,rough=rough,alpha=alpha,nstr=0.015,metal=0.0)

def plate_brass(W=1024,H=256,seed=311):
    rng=np.random.default_rng(seed)
    s=_rrect_sdf(W,H,4,22)
    inside=smooth(1.5,-1.0,s)
    streak=_noise(H,W,0.6,rng,kx=0.02,ky=1.0,fmin=8,fmax=W//2); cloud=_noise(H,W,1.4,rng,fmax=7); patch=_noise(H,W,1.1,rng,fmin=3,fmax=30)
    fine=_noise(H,W,0.35,rng,fmin=60,fmax=W//2)
    base=np.array([214,168,84],np.float32); lo=np.array([168,116,56],np.float32); hi=np.array([248,212,132],np.float32)
    t=np.clip(0.5+0.09*streak+0.12*cloud+0.03*fine,0,1)
    col=np.where(t[...,None]<0.5,mix(lo,base,t*2),mix(base,hi,(t-0.5)*2))
    # bevelled frame: lit upper-left, dark lower-right
    bev=smooth(-0.5,-2,s)*smooth(-26,-14,s)
    ys,xs=np.mgrid[0:H,0:W].astype(np.float32)
    lit=0.5+0.5*(-(xs/W-0.5)*0.4-(ys/H-0.5))
    col=col*(1+bev[...,None]*(0.30*(lit-0.5)[...,None]*2))
    # engraved double line (dark inside, bright edge)
    ln=np.clip(smooth(2.5,0,np.abs(s+38)),0,1); col=col*(1-0.35*ln[...,None])
    ln2=np.clip(smooth(1.5,0,np.abs(s+48)),0,1); col=col*(1-0.22*ln2[...,None])
    # etched fine hatch in the field margin (pure texture, text area clear)
    margin=(1-smooth(-52,-58,s))
    hatch=(np.sin((xs+ys)*0.9)*0.5+0.5)*(margin*(s<-50))
    col=col*(1-0.06*hatch[...,None]*(s<-50)[...,None]*0)
    pts=[(44,44),(W-44,44),(44,H-44),(W-44,H-44)]; riv=_rivets(W,H,None,pts,10); col=mix(col,hi*1.0,riv*0.8)
    col=mix(col,hx("sage")*0.6+lo*0.4,smooth(1.6,2.7,patch)*0.18)
    col=mix(col,hx("terracotta")*0.5+lo*0.5,smooth(1.4,2.6,-patch*0.8-cloud*0.4)*0.15)
    height=0.25*bev+0.12*(1-smooth(-40,-30,s))*0+0.1*ln*-1+0.5*riv+0.03*streak
    rough=np.clip(0.30+0.08*streak+0.06*fine+0.15*smooth(1.0,2.4,patch)+0.2*ln,0.12,0.8)
    return dict(color=col,height=height,rough=rough,alpha=inside,nstr=0.012,metal=1.0)

def plate_wood(W=1024,H=256,seed=321):
    rng=np.random.default_rng(seed)
    s=_rrect_sdf(W,H,4,18); inside=smooth(1.5,-1.0,s)
    ys,xs=np.mgrid[0:H,0:W].astype(np.float32)
    wob=_noise(H,W,1.4,rng,kx=0.06,ky=1.0,fmin=1,fmax=30); cath=_noise(H,W,1.2,rng,kx=0.05,ky=0.5,fmax=24)
    fine=_noise(H,W,0.35,rng,kx=0.02,ky=1.0,fmin=2,fmax=W//2)
    g=ys/H*3.2+0.45*wob+0.9*cath; rings=(0.5+0.5*np.sin(g*2*np.pi))**1.2
    pores=smooth(1.1,2.3,fine)
    dark=np.array([88,54,38],np.float32); mid_=np.array([128,82,54],np.float32); light=np.array([170,114,74],np.float32)
    t=np.clip(0.35+0.5*rings+0.06*wob,0,1)
    col=np.where(t[...,None]<0.5,mix(dark,mid_,t*2),mix(mid_,light,(t-0.5)*2))*(1-0.22*pores)[...,None]
    # carved border: outer fillet (raised), cove (recessed, painted gold), inner bead, recessed field
    fil=smooth(-0.5,-2,s)*smooth(-20,-17,s); cove=smooth(-20,-22,s)*smooth(-34,-31,s)
    bead=smooth(-36,-38,s)*smooth(-46,-43,s); field=smooth(-48,-52,s)
    col=col*(1+0.10*fil[...,None])
    gold=hx("ochre")*0.85+np.array([30,0,-30],np.float32)*0.2
    col=mix(col,gold*(0.85+0.15*rings)[...,None],cove*0.9)          # gilded groove
    col=mix(col,col*0.86,field)                                      # recessed field slightly darker
    col=col*(1-0.30*smooth(-48,-52,s)*smooth(-58,-52,s)*0)[...,None]
    # corner sunbursts: small gilded rosettes
    for (px,py) in [(46,46),(W-46,46),(46,H-46),(W-46,H-46)]:
        d=np.hypot(xs-px,ys-py); a=np.arctan2(ys-py,xs-px); ros=(d<16+7*np.cos(8*a)**2)*1.0
        col=mix(col,gold,ndi.gaussian_filter(ros,0.8)*0.95)
    height=0.5+0.22*fil-0.30*cove+0.14*bead-0.12*field+0.04*(rings-0.5)-0.15*pores
    rough=np.clip(0.42+0.33*pores+0.06*rings-0.18*cove,0.15,0.9)
    return dict(color=col,height=height,rough=rough,alpha=inside,nstr=0.02,metal=0.0)
