from hqlib import *
from mat_arch import wall_plaster, grid

def ceiling_coffer(N,seed=61):
    rng=np.random.default_rng(seed)
    yy,xx=grid(N); K=2; C=N/K
    u=((xx%C)/C-0.5); v=((yy%C)/C-0.5)           # -0.5..0.5 within each coffer
    cheb=np.maximum(np.abs(u),np.abs(v))          # square distance from centre
    # profile: outer beam (raised) -> step -> recessed panel
    beam=smooth(0.405,0.395,cheb)*0+ (1-smooth(0.385,0.40,cheb))   # 1 inside the recess, 0 on beam
    step=1-smooth(0.325,0.345,cheb)                 # inner panel
    bevel=smooth(0.30,0.345,cheb)*(1-smooth(0.345,0.385,cheb))
    r=np.hypot(u,v); ang=np.arctan2(v,u)
    petals=0.5+0.5*np.cos(12*ang); ros=(r<0.075+0.035*petals**2)*1.0; ros=ndi.gaussian_filter(ros,1.0)
    ring=smooth(0.115,0.125,r)*(1-smooth(0.135,0.145,r))
    cloud=pnoise(N,N,1.3,rng,fmax=8); mid=pnoise(N,N,1.0,rng,fmin=6,fmax=50); fine=pnoise(N,N,0.4,rng,fmin=50,fmax=500)
    plaster=hx("dawn")*np.array([1,0.99,0.98],np.float32)
    panel_blue=mix(hx("horizon")*0.55+hx("dawn")*0.45,hx("blueL")*0.5+hx("dawn")*0.5,0.5+0.3*cloud)
    col=np.broadcast_to(plaster,(N,N,3)).astype(np.float32).copy()
    col=mix(col,hx("rose")*0.35+hx("dawn")*0.65,bevel*0.9)          # painted step
    col=mix(col,panel_blue,step)
    gold=hx("ochre")*0.85+np.array([40,10,-40],np.float32)*0.3
    col=mix(col,gold*(0.9+0.12*np.cos(ang*12)*0.5)[...,None],ros)
    col=mix(col,hx("terracotta")*0.9,ring*0.6)
    # dentil trim on beam edge
    dent=(np.sin(u*2*np.pi*K*0+ (xx%C)/C*2*np.pi*20)>0)*smooth(0.37,0.385,cheb)*(1-smooth(0.40,0.41,cheb))
    col*= (1-0.07*dent)[...,None]
    height=0.9*(1-step)*0+ 1.0-0.55*step-0.18*(1-smooth(0.385,0.40,cheb))+0.25*ros+0.06*bevel
    height=height+0.01*mid+0.01*fine
    # AO inside recess near step walls
    ao=1-0.28*(smooth(0.27,0.325,cheb)*step)-0.2*smooth(0.33,0.40,cheb)*(1-smooth(0.40,0.45,cheb))
    col=col*ao[...,None]*(1+0.02*cloud+0.012*mid)[...,None]+blur(rng.standard_normal((N,N)).astype(np.float32),0.8)[...,None]*1.2
    height=(height-height.min())/(height.max()-height.min())
    rough=np.clip(0.88-0.45*ros+0.04*mid,0.2,1)
    return dict(color=col,height=height,rough=rough,nstr=0.03)

def ceiling_plaster(N,seed=71):
    d=wall_plaster(N,seed=seed,base="dawn",warmth=1.3)
    c=d['color']; g=c.mean(-1,keepdims=True); d['color']=mix(c,g*np.array([1.02,0.99,0.96],np.float32),0.0)*1.0
    d['color']=np.minimum(d['color']*1.02,255)
    return d

def prop_brass(N,seed=81):
    rng=np.random.default_rng(seed)
    streak=pnoise(N,N,0.6,rng,kx=0.02,ky=1.0,fmin=8,fmax=N//2); fine=pnoise(N,N,0.3,rng,kx=0.01,ky=1.0,fmin=50,fmax=N//2)
    cloud=pnoise(N,N,1.4,rng,fmax=7); patch=pnoise(N,N,1.1,rng,fmin=3,fmax=30)
    base=np.array([214,168,84],np.float32); lo=np.array([170,118,56],np.float32); hi=np.array([246,208,128],np.float32)
    t=np.clip(0.5+0.08*streak+0.03*fine+0.12*cloud,0,1)
    col=np.where(t[...,None]<0.5,mix(lo,base,t*2),mix(base,hi,(t-0.5)*2))
    col=mix(col,hx("sage")*0.6+lo*0.4,smooth(1.5,2.6,patch)*0.28)          # light verdigris bloom
    col=mix(col,hx("terracotta")*0.55+lo*0.45,smooth(1.4,2.6,-patch*0.8-cloud*0.4)*0.22)  # warm tarnish
    height=0.5+0.5*np.tanh(0.5*streak+0.3*fine)*0.4
    rough=np.clip(0.36+0.10*streak+0.06*fine+0.12*smooth(1.0,2.4,patch),0.15,0.8)
    return dict(color=col,height=height,rough=rough,nstr=0.0035)

def prop_walnut(N,seed=91):
    rng=np.random.default_rng(seed)
    wob=pnoise(N,N,1.4,rng,kx=0.06,ky=1.0,fmin=1,fmax=30); cath=pnoise(N,N,1.2,rng,kx=0.05,ky=0.5,fmax=24)
    fine=pnoise(N,N,0.35,rng,kx=0.02,ky=1.0,fmin=2,fmax=N//2)
    g=(np.mgrid[0:N,0:N][0].astype(np.float32)/N*14+0.45*wob+0.9*cath)
    rings=0.5+0.5*np.sin(g*2*np.pi); rings=rings**1.2
    pores=smooth(1.1,2.3,fine)
    dark=np.array([74,44,32],np.float32); mid_=np.array([112,70,48],np.float32); light=np.array([152,100,66],np.float32)
    t=np.clip(0.35+0.5*rings+0.06*wob,0,1)
    col=np.where(t[...,None]<0.5,mix(dark,mid_,t*2),mix(mid_,light,(t-0.5)*2))
    col=mix(col,hx("terracotta")*0.35+dark,pnoise(N,N,1.2,rng,fmax=8)*0.5+0.1)*1.0 if False else col
    col=col*(1-0.28*pores[...,None])
    col=mix(col,hx("slate")*0.35+dark*0.5,smooth(1.4,2.6,pnoise(N,N,1.2,rng,kx=0.1,fmax=20))*0.12)  # cool mineral streaks
    height=0.5+0.12*(rings-0.5)-0.4*pores
    rough=np.clip(0.38+0.35*pores+0.08*rings,0.2,0.9)
    return dict(color=col,height=height,rough=rough,nstr=0.006)

def prop_marble(N,seed=101):
    rng=np.random.default_rng(seed)
    w1=pnoise(N,N,1.5,rng,fmax=6); w2=pnoise(N,N,1.4,rng,fmax=12)
    yy_,xx_=grid(N)
    def veins(scale,k,wd):
        f=0.35*pnoise(N,N,1.3,rng,fmin=2,fmax=scale)+0.5*w1+0.18*w2+1.0*np.sin(2*np.pi*k*(xx_+yy_)/N+0.0)
        return 1-smooth(0,wd,np.abs(f))
    v1=veins(6,2,0.20); v2=veins(14,3,0.12)*0.6; v3=veins(40,5,0.08)*0.35
    cloud=pnoise(N,N,1.3,rng,fmax=9); fine=pnoise(N,N,0.5,rng,fmin=80,fmax=N//2)
    base=hx("dawn")*0.5+np.array([252,250,248],np.float32)*0.5
    col=np.broadcast_to(base,(N,N,3)).astype(np.float32).copy()
    col=mix(col,hx("rose")*0.45+hx("dawn")*0.3+hx("ash")*0.25,np.clip(smooth(0.2,2,cloud),0,1)*0.30)
    col=mix(col,hx("horizon")*0.55+hx("slate")*0.35+60*0.1,np.clip(v1*0.75+v2*0.5,0,1)*0.55)
    col=mix(col,hx("ochre")*0.35+hx("apricot")*0.25+hx("dawn")*0.4,np.clip(v3,0,1)*0.45)
    col=col*(1+0.015*cloud+0.01*fine)[...,None]
    rough=np.clip(0.16+0.06*cloud+0.18*np.clip(v1,0,1)+0.03*fine,0.08,0.6)
    return dict(color=col,height=None,rough=rough,nstr=0.0)

def prop_linen(N,seed=111):
    rng=np.random.default_rng(seed)
    T=64; per=N/T; yy,xx=grid(N)
    tx=(xx/per); ty=(yy/per)
    ix=np.floor(tx).astype(int)%T; iy=np.floor(ty).astype(int)%T
    fx=tx-np.floor(tx); fy=ty-np.floor(ty)
    over=((ix+iy)%2==0)           # plain weave: warp over / weft over
    slub_h=rng.normal(0,1,T).astype(np.float32); slub_v=rng.normal(0,1,T).astype(np.float32)
    thread_h=np.sin(np.pi*fy)**0.7; thread_v=np.sin(np.pi*fx)**0.7
    hgt=np.where(over,thread_v,thread_h)*(0.9+0.05*np.where(over,slub_v[ix],slub_h[iy]))
    hgt=0.15+0.85*hgt
    tone=np.where(over,0.5+0.06*slub_v[ix],0.5+0.06*slub_h[iy])
    flax=np.array([226,208,178],np.float32); sage=hx("sage")*0.3+flax*0.7
    cloud=pnoise(N,N,1.3,rng,fmax=10); fine=pnoise(N,N,0.4,rng,fmin=100,fmax=N//2)
    col=mix(flax,sage,np.clip(0.5+0.18*cloud,0,1)*0.35)
    col=col*(0.80+0.30*hgt+0.06*(tone-0.5)*4+0.01*fine)[...,None]
    height=hgt+0.02*fine
    rough=np.clip(0.92-0.1*hgt,0.7,1)
    return dict(color=col,height=height,rough=rough,nstr=0.018)

def prop_felt(N,seed=121):
    rng=np.random.default_rng(seed)
    fz=pnoise(N,N,0.25,rng,fmin=60,fmax=N//2); cloud=pnoise(N,N,1.3,rng,fmax=12); mid=pnoise(N,N,0.8,rng,fmin=10,fmax=120)
    base=hx("slate")*0.85+hx("blue")*0.10+hx("violet")*0.05
    col=base*(1+0.08*cloud+0.05*mid+0.06*fz)[...,None]
    col=mix(col,hx("horizon")*0.8,np.clip(smooth(1.0,2.6,fz)*0.15,0,1))
    return dict(color=col,height=None,rough=np.full((N,N),0.97,np.float32),nstr=0.0)

# ---------------- sky ----------------
def sky(W=2048,seed=131,mode="day"):
    H=W//2; rng=np.random.default_rng(seed)
    u=(np.arange(W)+0.5)/W; v=(np.arange(H)+0.5)/H
    phi=u[None,:]*2*np.pi; el=(0.5-v[:,None])*np.pi
    phi=np.broadcast_to(phi,(H,W)).astype(np.float32); el=np.broadcast_to(el,(H,W)).astype(np.float32)
    D=np.stack([np.cos(el)*np.cos(phi),np.sin(el),np.cos(el)*np.sin(phi)],-1)
    if mode=="day":
        sun_az,sun_el=2.2,0.50
        zen=np.array([58,108,190],np.float32); mid_=np.array([112,164,222],np.float32); hor=np.array([196,222,238],np.float32); haze=np.array([250,232,208],np.float32)
        cl_lit=np.array([255,250,242],np.float32); cl_sh=np.array([150,164,196],np.float32); cl_warm=np.array([255,214,176],np.float32); cover=0.62
        sunc=np.array([255,236,190],np.float32)
    else:
        sun_az,sun_el=2.2,0.045
        zen=np.array([62,74,168],np.float32); mid_=np.array([186,120,170],np.float32); hor=np.array([250,170,112],np.float32); haze=np.array([255,206,140],np.float32)
        cl_lit=np.array([255,184,130],np.float32); cl_sh=np.array([120,92,158],np.float32); cl_warm=np.array([244,120,110],np.float32); cover=0.55
        sunc=np.array([255,224,150],np.float32)
    S=np.array([np.cos(sun_el)*np.cos(sun_az),np.sin(sun_el),np.cos(sun_el)*np.sin(sun_az)],np.float32)
    e=np.clip(el,0,None); t=np.sin(e)
    c=mix(hor,mid_,smooth(0,0.45,t)); c=mix(c,zen,smooth(0.35,1.0,t)**1.2)
    cosg=np.clip(D@S,-1,1); g=np.arccos(cosg)
    hz=np.exp(-e/0.10)                     # warm horizon haze
    c=mix(c,haze,np.clip(hz*(0.35+0.55*np.exp(-(g/1.2)**2)),0,1)*0.75)
    glow=np.exp(-g/0.18)*0.55+np.exp(-g/0.55)*0.28
    c=c+sunc*glow[...,None]*(0.55 if mode=="day" else 0.8)
    c=c+sunc*(smooth(0.021,0.016,g))[...,None]*1.4
    # clouds: planar projection above horizon, foreshortened
    pl=np.stack([D[...,0],D[...,2]],-1)/np.maximum(D[...,1]+0.10,0.06)[...,None]
    NZ=1024
    n1=pnoise(NZ,NZ,1.55,rng,fmax=60); n2=pnoise(NZ,NZ,1.2,rng,fmin=20,fmax=220); wn=pnoise(NZ,NZ,1.6,rng,fmax=12)
    def sample(a,sc,off=(0,0)):
        yy=(pl[...,1]*sc+off[1])%NZ; xx=(pl[...,0]*sc+off[0])%NZ
        return ndi.map_coordinates(a,[yy,xx],order=1,mode='grid-wrap')
    def dens(off=(0,0)):
        wx=0; 
        a=sample(n1,9,off)
        b=sample(n2,20,off)
        return a+0.45*b
    d0=dens(); toward=(S[0],S[2]); ox,oy=toward[0]*1.0,toward[1]*1.0
    d1=dens((ox,oy))
    thr=1.0-cover*1.3
    alpha=smooth(thr,thr+0.9,d0)
    lit=np.clip(0.55+(d0-d1)*0.9,0,1)
    thin=1-smooth(0,0.55,alpha)                       # silver/golden lining on thin edges
    ccol=mix(cl_sh,cl_lit,lit); ccol=mix(ccol,cl_warm,np.clip(0.25*(1-lit)+0.20*thin,0,1)*(0.9 if mode=="day" else 0.6))
    ccol=ccol+sunc*(thin*np.exp(-g/0.5)*0.25)[...,None]
    fade=smooth(0.0,0.20,t)
    a=alpha*fade
    c=mix(c,ccol,a*0.96)
    # high wispy cirrus
    ci=pnoise(NZ,NZ,1.3,rng,kx=1.0,ky=0.12,fmin=3,fmax=120)
    cir=smooth(0.6,2.0,sample(ci,8))*smooth(0.1,0.5,t)*(1-a)
    c=mix(c,cl_lit*0.97+haze*0.03,cir*0.38)
    # ridgelines (Cascades/Olympics layers + a snow volcano), periodic in azimuth
    def ridge(seedr,base,amp,fmax):
        rr=np.random.default_rng(seedr); f=pnoise(1,W,1.4,rr,fmax=fmax)[0]
        f2=pnoise(1,W,1.0,rr,fmin=fmax,fmax=fmax*8)[0]
        return base+amp*(0.5*f+0.18*f2)
    px=u*2*np.pi
    layers=[]
    vol_az=5.0
    dv=np.angle(np.exp(1j*(px-vol_az)))
    cone=0.15*np.exp(-np.abs(dv)/0.075)*(1+0.0)   # Rainier-like cone
    rr1=ridge(3,0.085,0.075,12)+cone*0.0
    rr2=ridge(4,0.052,0.050,22)
    rr3=ridge(5,0.024,0.028,40)
    volr=0.095+0.21*np.exp(-np.abs(dv)/0.11)+0.012*pnoise(1,W,1,np.random.default_rng(6),fmin=20,fmax=200)[0]
    volr=volr-0.012*smooth(0.07,0.0,np.abs(dv))*0    
    if mode=="day":
        far=np.array([150,172,206],np.float32);near=np.array([84,110,128],np.float32);midc=np.array([116,142,168],np.float32); snow=np.array([248,244,244],np.float32)
    else:
        far=np.array([150,110,160],np.float32);near=np.array([60,56,96],np.float32);midc=np.array([104,80,128],np.float32); snow=np.array([255,206,180],np.float32)
    px_rad=np.pi/H
    def cover_mask(rl): return smooth(px_rad*1.2,-px_rad*1.2,(el-rl[None,:]))   # 1 below ridge
    # volcano silhouette over far layer
    vm=cover_mask(volr)
    vcol=mix(far,snow,smooth(0.13,0.22,el)*smooth(-0.1,0.6,pnoise(H,W,1.2,rng,fmin=10,fmax=120)*0.5+0.3))
    vcol=vcol*(0.9+0.1*np.clip(el/0.2,0,1))[...,None] if False else vcol
    # glaciated side-lighting: sun side snow brighter
    c=mix(c,mix(vcol,vcol*0.92+haze*0.08,0.3),vm*smooth(0.0,0.02,0.02)*1.0)
    for rl,colr in ((rr1,far),(rr2,midc),(rr3,near)):
        m=cover_mask(rl)
        shade=colr*(0.92+0.05*pnoise(H,W,1.1,rng,fmin=20,fmax=200))[...,None]
        shade=mix(shade,haze,np.clip(np.exp(-np.clip(el,0,None)/0.06)*0.28,0,1))
        c=mix(c,shade,m)
    # water below: Puget Sound gradient with glitter lane under the sun
    below=smooth(-0.002,-0.012,el)
    d_=np.clip(-el,0,None)
    wcol=mix(hor*0.82+np.array([20,30,20],np.float32)*0.0,mix(np.array([104,152,188],np.float32),np.array([52,92,134],np.float32),smooth(0.0,0.6,d_)),smooth(0,0.12,d_)) if mode=="day" else mix(hor*0.8,mix(np.array([110,86,150],np.float32),np.array([36,36,82],np.float32),smooth(0,0.6,d_)),smooth(0,0.12,d_))
    ripple=pnoise(H,W,1.1,rng,kx=0.2,ky=1.0,fmin=30,fmax=900)
    refl=np.exp(-np.abs(np.angle(np.exp(1j*(phi-sun_az))))/ (0.07+0.9*d_))*smooth(1.0,-0.5,ripple)*np.exp(-d_/0.55)
    wcol=wcol+sunc*np.clip(refl,0,1)[...,None]*(0.45 if mode=="day" else 0.65)
    wcol=wcol*(1+0.025*ripple)[...,None]
    c=mix(c,wcol,below)
    c=u8(c,rng,dither=1.2)
    return c

def snippet(): pass
