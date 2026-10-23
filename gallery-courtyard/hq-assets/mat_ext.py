from hqlib import *
from mat_arch import grid

def _norm01(h): return (h-h.min())/(h.max()-h.min()+1e-9)

def ext_stucco(N,seed=201):
    """near-neutral light sand stucco: the code multiplies it by the six sunrise facade colours, so it carries light/shade, not hue"""
    rng=np.random.default_rng(seed)
    cloud=pnoise(N,N,1.4,rng,fmax=8); mid=pnoise(N,N,1.0,rng,fmin=6,fmax=50)
    sand=pnoise(N,N,0.45,rng,fmin=60,fmax=N//2); grain=blur(rng.standard_normal((N,N)).astype(np.float32),0.7)
    sw=pnoise(N,N,1.4,rng,fmin=3,fmax=30)       # trowel swirls
    rain=pnoise(N,N,1.3,rng,kx=1.0,ky=0.05,fmin=3,fmax=60)   # vertical rain streaks
    lum=1+0.016*cloud+0.016*mid+0.018*sw+0.018*sand+0.012*grain-0.018*np.clip(rain,0,3)
    base=np.array([248,244,238],np.float32)
    col=base*lum[...,None]
    col=mix(col,np.array([255,238,214],np.float32),smooth(0.4,2.0,cloud)*0.10)    # warm sun-baked
    col=mix(col,np.array([222,232,240],np.float32),smooth(0.6,2.2,-cloud-0.4*mid)*0.10)  # cool shade
    height=_norm01(0.4*sw+0.25*mid+0.45*sand+0.2*grain)
    rough=np.clip(0.90+0.04*mid+0.03*sand,0.7,1)
    return dict(color=col,height=height,rough=rough,nstr=0.014)

def ext_travertine(N,seed=211):
    rng=np.random.default_rng(seed); yy,xx=grid(N)
    wob=pnoise(N,N,1.4,rng,kx=0.2,ky=1.0,fmax=40); cloud=pnoise(N,N,1.3,rng,fmax=10)
    band=0.5+0.5*np.sin((yy/N*11+0.18*wob+0.1*cloud)*2*np.pi)
    band2=0.5+0.5*np.sin((yy/N*29+0.25*wob)*2*np.pi+1.7)
    cream=np.array([236,220,192],np.float32); warm=np.array([222,190,150],np.float32); rose=hx("rose")*0.4+cream*0.6
    col=mix(cream,warm,0.45*band+0.2*band2); col=mix(col,rose,smooth(0.4,2.0,cloud)*0.28)
    pits=pnoise(N,N,0.5,rng,kx=0.18,ky=1.0,fmin=40,fmax=N//2); pit=smooth(1.7,2.6,pits)    # elongated travertine voids
    fine=pnoise(N,N,0.4,rng,fmin=80,fmax=N//2)
    col=col*(1-0.30*pit)[...,None]*(1+0.02*fine)[...,None]
    col=mix(col,hx("ash")*0.8,pit*0.2)
    height=_norm01(0.5-0.9*pit+0.10*band+0.04*fine)
    rough=np.clip(0.62+0.25*pit+0.05*cloud,0.3,1)
    return dict(color=col,height=height,rough=rough,nstr=0.015)

def ext_paving(N,seed=221):
    rng=np.random.default_rng(seed)
    R=3; hs=np.array([N//3,N//3,N-2*(N//3)]); yy,xx=grid(N)
    edge=np.zeros((N,N),np.float32); bid=np.zeros((N,N),np.int32); k=0; y0=0
    for r in range(R):
        nb=int(rng.choice([2,2,3])); w=rng.uniform(0.8,1.2,nb); w=w/w.sum()*N; cuts=np.concatenate([[0],np.cumsum(w)]); off=rng.uniform(0,N)
        x=(np.arange(N)+off)%N; idx=np.minimum(np.searchsorted(cuts,x,side='right')-1,nb-1)
        left=x-cuts[idx]; right=cuts[idx+1]-x; h=hs[r]
        ey=np.minimum(np.arange(h),h-1-np.arange(h))[:,None].astype(np.float32)
        edge[y0:y0+h]=np.minimum(np.minimum(left,right)[None,:],ey); bid[y0:y0+h]=idx[None,:]+k; k+=nb; y0+=h
    pal=np.array([(232,214,184),(238,222,196),(226,200,170),(240,212,186),(220,206,190),(234,196,166)],np.float32)
    pc=pal[rng.choice(len(pal),k)]*rng.uniform(0.95,1.04,(k,1)).astype(np.float32)
    cloud=pnoise(N,N,1.3,rng,fmax=10); mid=pnoise(N,N,1.0,rng,fmin=8,fmax=80); fine=pnoise(N,N,0.4,rng,fmin=80,fmax=N//2)
    wear=smooth(0.6,2.2,pnoise(N,N,1.2,rng,fmin=3,fmax=25))
    col=pc[bid]*(1+0.05*cloud+0.04*mid+0.025*fine)[...,None]
    col=mix(col,hx("sage")*0.5+hx("ash")*0.5,wear*0.10)      # lichen/damp bloom
    cracks=1-smooth(0.8,2.4,np.abs(pnoise(N,N,1.1,rng,fmin=6,fmax=60)))
    col*= (1-0.12*cracks*smooth(1,2.2,pnoise(N,N,1.3,rng,fmax=8)))[...,None]
    gw=6+2*pnoise(N,N,1,rng,fmax=30); joint=1-smooth(gw-2,gw+1.5,edge)
    ao=1-0.28*(1-smooth(0,30,edge)); col=col*ao[...,None]
    jc=mix(hx("ash")*0.9,hx("sage")*0.6+hx("ash")*0.4,0.25*wear)
    col=mix(col,jc*(0.9+0.06*fine)[...,None],joint)
    height=_norm01(0.7*smooth(gw-1,gw+26,edge)+0.18*mid+0.05*fine-0.25*joint-0.15*cracks)
    rough=np.clip(0.78+0.1*mid+0.15*joint-0.12*smooth(0.4,1.8,cloud)*0,0.45,1)
    return dict(color=col,height=height,rough=rough,nstr=0.020)

def ext_gravel(N,seed=231):
    rng=np.random.default_rng(seed)
    G=112; w=(pnoise(N,N,1.4,rng,fmax=30)*N*0.004,pnoise(N,N,1.4,rng,fmax=30)*N*0.004)
    d1,d2,cid,oy,ox=voronoi(N,G,rng,warp=w,jit=0.95)
    C=N/G; pal=np.array([(224,206,176),(214,190,158),(236,220,194),(206,168,140),(196,184,176),(230,196,160),(168,160,150),(150,164,178),(222,170,140)],np.float32)
    pw=np.array([3,3,2.5,1.6,2,1.6,1.2,0.7,1.]); pw/=pw.sum()
    cc=pal[rng.choice(len(pal),G*G,p=pw)]*rng.uniform(0.88,1.08,(G*G,1)).astype(np.float32)
    col=cc[cid]
    r=d1/ (0.5*(d1+d2)+1e-6)      # 0 at pebble centre, 1 at the boundary
    dome=np.sqrt(np.clip(1-r**2.2,0,1))
    tilt=(ox*0.7+oy*0.5)/C
    fine=pnoise(N,N,0.4,rng,fmin=100,fmax=N//2); cloud=pnoise(N,N,1.3,rng,fmax=10); sp=smooth(1.5,2.6,pnoise(N,N,0.3,rng,fmin=150,fmax=N//2))
    col=col*(0.72+0.34*dome+0.18*tilt+0.04*fine+0.03*cloud)[...,None]
    col=col*(1-0.35*sp)[...,None]
    gap=1-smooth(0.80,0.98,r)
    gapc=np.array([148,132,114],np.float32)*(1+0.1*fine)[...,None]
    col=mix(col,gapc,(1-gap)*0.8)
    col=mix(col,hx("apricot")*0.4+hx("dawn")*0.6,smooth(0.5,2.2,cloud)*0.05)
    height=_norm01(dome*0.9+0.05*fine)
    rough=np.clip(0.80+0.10*(1-dome)+0.05*fine,0.5,1)
    return dict(color=col,height=height,rough=rough,nstr=0.040)

def ext_lawn(N,seed=241):
    rng=np.random.default_rng(seed)
    f1=pnoise(N,N,0.35,rng,fmin=140,fmax=N//2); f2=pnoise(N,N,0.5,rng,fmin=50,fmax=300); f3=pnoise(N,N,0.8,rng,fmin=12,fmax=80)
    cloud=pnoise(N,N,1.3,rng,fmax=10); patch=pnoise(N,N,1.2,rng,fmin=3,fmax=22)
    dark=np.array([52,100,44],np.float32); base=np.array([92,148,62],np.float32); light=np.array([150,196,76],np.float32); dry=np.array([196,184,92],np.float32); sage=hx("sage")*0.5+base*0.5
    t=np.clip(0.5+0.18*f1+0.14*f2+0.10*f3+0.10*cloud,0,1)
    col=np.where(t[...,None]<0.5,mix(dark,base,t*2),mix(base,light,(t-0.5)*2))
    col=mix(col,dry,smooth(1.1,2.4,patch)*0.30)
    col=mix(col,sage,smooth(0.9,2.2,-patch)*0.20)
    clover=smooth(2.0,2.8,pnoise(N,N,0.3,rng,fmin=40,fmax=400)); col=mix(col,np.array([70,138,70],np.float32),clover*0.5)
    bl=0.5+0.5*f1
    height=_norm01(0.6*f1+0.3*f2+0.2*f3)
    rough=np.clip(0.93+0.04*f2,0.8,1)
    return dict(color=col,height=height,rough=rough,nstr=0.06)

def _leaf_stamp(canvas_c,canvas_h,canvas_d,cy,cx,L,Wd,ang,col,layer,vein=True,rng=None,lobed=False):
    N=canvas_c.shape[0]; R=int(L*0.75)+3
    ys=np.arange(cy-R,cy+R+1); xs=np.arange(cx-R,cx+R+1)
    Y,X=np.meshgrid(ys-cy,xs-cx,indexing='ij'); ca,sa=math.cos(ang),math.sin(ang)
    u=(X*ca+Y*sa)/(L/2); v=(-X*sa+Y*ca)/(Wd/2)
    # pointed ellipse (lance leaf): width profile
    prof=np.clip(1-np.abs(u)**1.6,0,1)**0.7
    inside=(np.abs(v)<prof)&(np.abs(u)<1)
    if not inside.any(): return
    yi=ys[:,None]%N; xi=xs[None,:]%N
    t=np.clip(v/np.maximum(prof,1e-3),-1,1)
    shade=0.78+0.28*(1-np.abs(t))**0.8+0.10*(u*0.5+0.5)
    if vein: shade=shade*(1-0.18*smooth(0.06,0.0,np.abs(v)))
    c=col[None,None,:]*shade[...,None]
    m=inside
    sub=canvas_c[yi,xi]; canvas_c[yi,xi]=np.where(m[...,None],c,sub)
    canvas_h[yi,xi]=np.where(m,layer*0.6+0.4*(1-np.abs(t)),canvas_h[yi,xi])
    canvas_d[yi,xi]=np.where(m,layer,canvas_d[yi,xi])

def ext_foliage(N,seed=251):
    """dense clipped-hedge leaf cover (boxwood / laurel / cypress); carries its own greens"""
    rng=np.random.default_rng(seed)
    c=np.broadcast_to(np.array([34,70,30],np.float32),(N,N,3)).copy(); h=np.zeros((N,N),np.float32); dd=np.zeros((N,N),np.float32)
    greens=np.array([(58,112,44),(78,138,52),(98,158,60),(44,96,50),(120,170,70),(64,120,72),(138,176,76)],np.float32)
    gw=np.array([3,3,2,2,1,1.5,0.7]); gw/=gw.sum()
    n=int(N*N/38)
    for i in range(n):
        layer=(i+1)/n
        cy,cx=rng.integers(0,N,2); L=rng.uniform(15,26); Wd=L*rng.uniform(0.45,0.62)
        col=greens[rng.choice(len(greens),p=gw)]*rng.uniform(0.88,1.1)
        # lower layers darker (self-shadow); sky-lit tips brighter
        col=col*(0.55+0.55*layer)
        _leaf_stamp(c,h,dd,cy,cx,L,Wd,rng.uniform(0,2*np.pi),col,layer,rng=rng)
    col=c*(0.85+0.2*dd[...,None])
    sun=pnoise(N,N,1.4,rng,fmax=8); col=mix(col,np.array([170,196,86],np.float32),smooth(1.0,2.4,sun)*0.10)
    col=mix(col,hx("sage")*0.6,smooth(0.8,2.2,-sun)*0.06)
    return dict(color=col,height=_norm01(h),rough=np.clip(0.72+0.18*(1-dd),0.5,1),nstr=0.05)

def ext_roof_tile(N,seed=261):
    rng=np.random.default_rng(seed); yy,xx=grid(N)
    NC=8; NR=4; cw=N/NC; rh=N/NR
    u=(xx%cw)/cw; v=(yy%rh)/rh                      # 0..1 within a tile (u across, v down the slope)
    ci=((xx//cw)%NC).astype(int); ri=((yy//rh)%NR).astype(int)
    tid=(ri*NC+ci)
    prof=np.sin(np.pi*u)                              # half-round barrel profile
    lap=smooth(0.0,0.14,v)*(1-0.0)                    # lip of overlapping course
    shade_v=0.70+0.30*smooth(0.05,0.9,v)              # tile lower end is lifted, upper end tucked
    pal=np.array([(206,102,76),(226,128,88),(214,112,84),(236,150,104),(198,92,72),(222,138,96),(190,108,92)],np.float32)
    tc=pal[rng.integers(0,len(pal),NR*NC)]*rng.uniform(0.92,1.08,(NR*NC,1)).astype(np.float32)
    cloud=pnoise(N,N,1.3,rng,fmax=10); fine=pnoise(N,N,0.45,rng,fmin=60,fmax=N//2); wear=smooth(0.8,2.3,pnoise(N,N,1.2,rng,fmin=3,fmax=30))
    col=tc[tid]*(0.60+0.50*prof**0.8)[...,None]*shade_v[...,None]
    col=col*(1+0.04*cloud+0.03*fine)[...,None]
    col=mix(col,hx("dawn")*0.8,wear*0.14*smooth(0.3,0.8,prof))                         # sun-bleach
    col=mix(col,hx("sage")*0.55,smooth(1.6,2.6,pnoise(N,N,1,rng,fmin=6,fmax=70))*0.25*(1-prof)) # moss in the troughs
    lapedge=smooth(0.0,0.03,v)*(1-smooth(0.03,0.09,v)); col*= (1-0.3*lapedge)[...,None]
    height=_norm01(prof*0.8*(0.55+0.45*smooth(0.04,0.9,v))+0.05*fine+0.05*np.sin(np.pi*v)*0)
    rough=np.clip(0.80+0.10*fine-0.18*prof*(1-wear),0.45,1)
    return dict(color=col,height=height,rough=rough,nstr=0.045)

def ext_cornice_clay(N,seed=271):
    rng=np.random.default_rng(seed); yy,xx=grid(N)
    cloud=pnoise(N,N,1.3,rng,fmax=10); mid=pnoise(N,N,1.0,rng,fmin=8,fmax=70); fine=pnoise(N,N,0.4,rng,fmin=80,fmax=N//2)
    run=pnoise(N,N,1.4,rng,kx=1.0,ky=0.06,fmin=4,fmax=60)      # drip/rain runs
    base=hx("terracotta"); col=np.broadcast_to(base,(N,N,3)).astype(np.float32).copy()
    col=mix(col,hx("coral")*0.9,smooth(0.3,2.0,cloud)*0.35); col=mix(col,np.array([150,64,52],np.float32),smooth(0.4,2.0,-cloud)*0.30)
    col=col*(1+0.05*mid+0.025*fine-0.04*np.clip(run,0,3))[...,None]
    craze=1-smooth(0.5,1.8,np.abs(pnoise(N,N,0.9,rng,fmin=20,fmax=150)))
    col*= (1-0.10*craze*smooth(0.5,2.0,pnoise(N,N,1.3,rng,fmax=9)))[...,None]
    chip=smooth(2.0,2.8,pnoise(N,N,0.6,rng,fmin=20,fmax=250)); col=mix(col,hx("dawn")*0.9,chip*0.55)   # chips reveal pale plaster
    height=_norm01(0.4*mid+0.3*fine-0.8*chip-0.3*craze)
    rough=np.clip(0.55+0.25*chip+0.2*smooth(-0.3,1.5,cloud)+0.1*craze,0.25,1)
    return dict(color=col,height=height,rough=rough,nstr=0.010)

def ext_trim_slate(N,seed=281):
    rng=np.random.default_rng(seed)
    grain=pnoise(N,N,0.9,rng,kx=0.03,ky=1.0,fmin=6,fmax=N//2); brush=pnoise(N,N,1.3,rng,kx=0.04,ky=1.0,fmin=2,fmax=60)
    cloud=pnoise(N,N,1.3,rng,fmax=10)
    base=hx("slate"); col=base*(1+0.035*brush+0.03*grain+0.02*cloud)[...,None]
    col=mix(col,hx("horizon")*0.6+base*0.4,smooth(0.8,2.2,cloud)*0.18)
    wear=smooth(2.0,2.9,pnoise(N,N,0.7,rng,fmin=10,fmax=300))
    col=mix(col,hx("dawn")*0.85,wear*0.5)       # chipped paint over pale primer
    col=col*(1-0.12*smooth(1.0,2.2,pnoise(N,N,0.5,rng,kx=0.03,ky=1,fmin=30,fmax=N//2)))[...,None]
    height=_norm01(0.4*grain+0.25*brush-0.9*wear)
    rough=np.clip(0.52+0.30*wear+0.08*brush+0.1*smooth(-0.5,1.5,cloud),0.25,1)
    return dict(color=col,height=height,rough=rough,nstr=0.012)

def ivy_card(W=512,H=384,seed=291):
    """RGBA 4:3 leaf-cluster card (code's ivy card is 0.16 x 0.12 m). light greens: vertex colours (0x3d6b2f..) multiply them. returns rgba float + height"""
    rng=np.random.default_rng(seed); S=3; w,h=W*S,H*S
    col=np.zeros((h,w,3),np.float32); al=np.zeros((h,w),np.float32); hh=np.zeros((h,w),np.float32)
    def leaf(cx,cy,sz,rot,tint):
        ys,xs=np.mgrid[0:h,0:w].astype(np.float32); X=(xs-cx)/sz; Y=(ys-cy)/sz
        c,s=math.cos(rot),math.sin(rot); u=X*c+Y*s; v=-X*s+Y*c      # u along leaf axis (tip toward -u)
        ang=np.arctan2(v,u+1e-6); r=np.hypot(u,v)
        # three-lobed ivy outline: lobes at 0 (tip, -u), +-70deg, heart base at +u
        th=np.arctan2(v,-u)   # 0 at tip
        lobe=0.62+0.38*np.cos(3*th*1.05)**2*(np.abs(th)<1.9)
        base=np.where(np.abs(th)<1.9,1.0,0.0)
        outline=np.clip(lobe*(1-0.18*(np.abs(th)/1.9)),0,1)
        # heart-shaped notch at petiole side
        inside=(r<outline*0.95)&(r>0.0)
        notch=((u>0.55)&(np.abs(v)<0.12*(u-0.55)*3))
        inside&=~notch
        t=np.clip(r/0.95,0,1)
        vein=np.zeros_like(r)
        for k in (0,1.05,-1.05,0.55,-0.55):
            d=np.abs(np.sin(th-k))*r; vein=np.maximum(vein,smooth(0.03,0.0,d)*(1-t*0.4))
        shade=0.78+0.30*(1-t)+0.10*(1-np.abs(np.sin(th*1.5)))-0.16*vein
        cl=tint[None,None,:]*shade[...,None]
        return inside,cl,(1-t)
    tints=[np.array([150,208,92],np.float32),np.array([120,190,98],np.float32),np.array([178,214,104],np.float32),np.array([104,170,90],np.float32)]
    pos=[(0.30,0.55,0.20,2.6),(0.62,0.38,0.19,0.5),(0.68,0.70,0.17,-1.1),(0.46,0.22,0.12,0.1),(0.20,0.25,0.11,-2.4)]
    for i,(px,py,sz,rot) in enumerate(pos):
        ins,cl,dome=leaf(px*w,py*h,sz*h*1.1,rot,tints[i%4])
        col=np.where(ins[...,None],cl,col); al=np.where(ins,1.0,al); hh=np.where(ins,0.3+0.15*dome+0.1*i,hh)
    # stem
    # downsample (supersample AA), bleed colour into transparent area to avoid dark halos
    def ds(a): return a.reshape(H,S,W,S,*a.shape[2:]).mean((1,3))
    alp=ds(al); cs=ds(col*al[...,None]); cs=cs/np.maximum(alp[...,None],1e-3)
    cs=np.where(alp[...,None]>0.01,cs,np.array([110,180,90],np.float32))
    return cs,alp,ds(hh)
