from hqlib import *
def grid(N): return np.mgrid[0:N,0:N].astype(np.float32)

def wall_plaster(N,seed=11,base="dawn",warmth=1.0):
    rng=np.random.default_rng(seed)
    cloud=pnoise(N,N,1.4,rng,fmax=7)
    mid=pnoise(N,N,1.1,rng,fmin=5,fmax=45)
    sh=pnoise(N,N,1.5,rng,kx=0.12,ky=1.0,fmin=2,fmax=60)   # horizontal trowel sweeps
    sv=pnoise(N,N,1.5,rng,kx=1.0,ky=0.12,fmin=2,fmax=60)   # vertical sweeps
    mask=smooth(-0.4,0.4,pnoise(N,N,1.6,rng,fmax=5))
    stroke=sh*mask+sv*(1-mask)
    fine=pnoise(N,N,0.5,rng,fmin=60,fmax=700)
    grain=blur(rng.standard_normal((N,N)).astype(np.float32),0.8)*2.2
    b=hx(base)
    col=np.broadcast_to(b,(N,N,3)).astype(np.float32).copy()
    # painterly lime-wash: warm apricot pooling on high spots, cool horizon blue in hollows
    warm=smooth(0.2,1.8,cloud+0.3*stroke); cool=smooth(0.3,1.9,-cloud-0.25*mid)
    col=mix(col,hx("apricot")*0.9+hx("dawn")*0.1,warm*0.20*warmth)
    col=mix(col,hx("horizon")*0.35+hx("dawn")*0.65,cool*0.10)
    col=mix(col,hx("rose")*0.6+hx("dawn")*0.4,smooth(0.5,2.0,mid)*0.09*warmth)
    lum=1+0.022*cloud+0.020*stroke+0.014*mid+0.010*fine
    col=col*lum[...,None]+grain[...,None]*0.9
    # hairline cracks (sparse, fine)
    wp=(pnoise(N,N,1.4,rng,fmax=10)*N*0.02,pnoise(N,N,1.4,rng,fmax=10)*N*0.02)
    d1,d2,_,_,_=voronoi(N,6,rng,warp=wp)
    e=d2-d1; crack=(1-smooth(0.5,2.4,e))*smooth(1.4,2.2,pnoise(N,N,1.2,rng,fmax=9))
    col*= (1-0.12*crack)[...,None]
    height=(0.5+0.18*stroke+0.10*mid+0.05*fine+0.02*grain-0.45*crack); height=(height-height.min())/(height.max()-height.min())
    rough=np.clip(0.88+0.05*mid+0.05*fine-0.10*crack,0.6,1.0)
    return dict(color=col,height=height,rough=rough,nstr=0.012)

def wall_ashlar(N,seed=21):
    rng=np.random.default_rng(seed)
    R=5; hs=rng.uniform(0.85,1.15,R); hs=np.round(hs/hs.sum()*N).astype(int); hs[-1]+=N-hs.sum()
    yy,xx=grid(N)
    edge=np.zeros((N,N),np.float32); bid=np.zeros((N,N),np.int32); lx=np.zeros((N,N),np.float32)
    y0=0; k=0
    for r in range(R):
        h=hs[r]; nb=int(rng.choice([3,3,4])); w=rng.uniform(0.7,1.3,nb); w=w/w.sum()*N; cuts=np.concatenate([[0],np.cumsum(w)]); off=rng.uniform(0,N)
        x=(np.arange(N)+off)%N
        idx=np.minimum(np.searchsorted(cuts,x,side='right')-1,nb-1)
        left=x-cuts[idx]; right=cuts[idx+1]-x
        ex=np.minimum(left,right)[None,:]
        yrow=np.arange(h)[:,None]; ey=np.minimum(yrow,h-1-yrow).astype(np.float32)
        edge[y0:y0+h]=np.minimum(ex,ey); bid[y0:y0+h]=idx[None,:]+k; lx[y0:y0+h]=((left/(left+right))[None,:])
        k+=nb; y0+=h
    nblk=k
    # per-block palette (warm sandstone, rose clay, pale blue-grey limestone)
    pal=[(230,203,168),(234,210,178),(226,192,160),(238,218,190),(220,200,184),(228,198,168),(232,206,176)]
    pw=np.array([3,3,2,3,1,2,2.]); pw/=pw.sum()
    bc=np.array([pal[i] for i in rng.choice(len(pal),nblk,p=pw)],np.float32)*rng.uniform(0.95,1.04,(nblk,1)).astype(np.float32)
    col=bc[bid]
    cloud=pnoise(N,N,1.3,rng,fmax=10); mid=pnoise(N,N,1.0,rng,fmin=8,fmax=80); fine=pnoise(N,N,0.4,rng,fmin=80,fmax=800)
    strata=np.sin((yy/N*R*9)*2*np.pi*0.5+pnoise(N,N,1.3,rng,fmax=8)*2.2)*0.5+0.5
    col=col*(1+0.05*cloud+0.06*(strata-0.5)+0.045*mid+0.02*fine)[...,None]
    # lichen-like cool mottling + pores
    cool=smooth(0.8,2.2,pnoise(N,N,1.1,rng,fmin=3,fmax=30)); col=mix(col,hx("horizon")*0.8+60*0.2,cool*0.07)
    pore=smooth(1.6,2.6,pnoise(N,N,0.3,rng,fmin=90,fmax=900)); col*= (1-0.25*pore)[...,None]
    mw=4.5+1.5*pnoise(N,N,1,rng,fmax=30)
    mortar=1-smooth(mw-1.5,mw+1.0,edge)
    ao=1-0.35*(1-smooth(0,26,edge))     # AO near joints
    col=col*ao[...,None]
    mcol=mix(hx("ash")*0.95,hx("dawn")*0.8,0.45+0.15*mid)
    col=mix(col,mcol*(0.92+0.06*fine)[...,None],mortar)
    height=0.62*smooth(mw-2,mw+22,edge)+0.20*(0.5+0.3*mid)+0.05*fine-0.3*mortar+0.12*np.clip(cloud,-2,2)*0.2
    height=(height-height.min())/(height.max()-height.min())
    rough=np.clip(0.80+0.07*mid+0.15*mortar+0.05*pore,0.5,1)
    return dict(color=col,height=height,rough=rough,nstr=0.020)

def floor_flagstone(N,seed=31):
    rng=np.random.default_rng(seed)
    G=6; w=(pnoise(N,N,1.5,rng,fmax=8)*N*0.03,pnoise(N,N,1.5,rng,fmax=8)*N*0.03)
    d1,d2,cid,oy,ox=voronoi(N,G,rng,warp=w,jit=0.9)
    edge=(d2-d1)*0.5
    pal=np.array([(150,168,188),(152,176,160),(206,164,152),(226,184,146),(188,180,172),(198,136,112),(170,150,170),(214,200,176)],np.float32)
    pw=np.array([3,2,2,2,3,1.3,1,2.]);pw/=pw.sum()
    cc=pal[rng.choice(len(pal),G*G,p=pw)]*rng.uniform(0.92,1.07,(G*G,1)).astype(np.float32)
    cc=cc*0.55+np.array([186,176,166],np.float32)*0.45*(cc.mean(1,keepdims=True)/176)
    col=cc[cid]
    cloud=pnoise(N,N,1.3,rng,fmax=12); mid=pnoise(N,N,1.0,rng,fmin=8,fmax=70); fine=pnoise(N,N,0.4,rng,fmin=80,fmax=800)
    # slight per-stone tilt lighting (stones catch light on one side)
    tilt=(ox*0.5+oy*0.35)/(N/G); tilt=tilt*rng.choice([-1,1],G*G)[cid]
    vein=np.abs(pnoise(N,N,1.2,rng,fmin=4,fmax=26)); vein=1-smooth(0,0.16,vein)
    col=col*(1+0.06*cloud+0.05*mid+0.06*tilt+0.03*fine)[...,None]
    col=mix(col,hx("dawn")*0.95,vein*0.28)           # pale mineral veins
    col=mix(col,hx("slate")*0.7,smooth(1.4,2.6,pnoise(N,N,0.8,rng,fmin=20,fmax=200))*0.10)
    gw=5.0+1.5*pnoise(N,N,1,rng,fmax=30)
    grout=1-smooth(gw-1.5,gw+1.2,edge)
    ao=1-0.30*(1-smooth(0,22,edge)); col=col*ao[...,None]
    gcol=mix(hx("ash")*0.85,hx("slate")*0.7,0.25+0.2*mid)
    col=mix(col,gcol*(0.9+0.05*fine)[...,None],grout)
    dome=smooth(gw,gw+34,edge)
    height=0.55*dome+0.15*(0.5+0.25*mid)+0.04*fine-0.3*grout+0.05*tilt
    height=(height-height.min())/(height.max()-height.min())
    # polished centres, rougher edges; puddly sheen patches
    sheen=smooth(-0.2,1.3,pnoise(N,N,1.4,rng,fmax=9))
    rough=np.clip(0.62-0.30*sheen*smooth(gw+4,gw+60,edge)+0.06*mid+0.35*grout,0.18,1)
    return dict(color=col,height=height,rough=rough,nstr=0.022)

def floor_planks(N,seed=41):
    rng=np.random.default_rng(seed)
    NP=16; ph=N//NP; yy,xx=grid(N)
    row=(yy//ph).astype(np.int32); yl=yy-row*ph
    # joints per row
    bid=np.zeros((N,N),np.int32); ex=np.full((N,N),1e3,np.float32); u=np.zeros((N,N),np.float32); k=0
    for r in range(NP):
        nb=int(rng.choice([2,2,3])); w=rng.uniform(0.7,1.3,nb); w=w/w.sum()*N; cuts=np.concatenate([[0],np.cumsum(w)]); off=rng.uniform(0,N)
        x=(np.arange(N)+off)%N; idx=np.minimum(np.searchsorted(cuts,x,side='right')-1,nb-1)
        left=x-cuts[idx]; right=cuts[idx+1]-x
        sl=slice(r*ph,(r+1)*ph); bid[sl]=idx[None,:]+k; ex[sl]=np.minimum(left,right)[None,:]; u[sl]=(left/(left+right))[None,:]; k+=nb
    ey=np.minimum(yl,ph-1-yl); edge=np.minimum(ex,ey)
    nplank=k
    pal=np.array([(204,150,98),(184,128,82),(214,164,112),(194,142,96),(176,124,86),(222,176,124)],np.float32)
    pc=pal[rng.choice(len(pal),nplank)]*rng.uniform(0.94,1.06,(nplank,1)).astype(np.float32)
    ph0=rng.uniform(0,6.28,nplank)[bid]; freq=rng.integers(5,9,nplank)[bid]
    wob=pnoise(N,N,1.4,rng,kx=0.08,ky=1.0,fmin=1,fmax=40)
    cath=pnoise(N,N,1.3,rng,kx=0.05,ky=0.6,fmax=30)
    g=(yl/ph*freq*1.0+0.35*wob+0.5*cath)
    rings=0.5+0.5*np.sin(g*2*np.pi+ph0); rings=rings**1.3
    fine=pnoise(N,N,0.35,rng,kx=0.02,ky=1.0,fmin=2,fmax=900)       # long pores
    pores=smooth(1.2,2.4,fine)
    col=pc[bid]*(0.80+0.30*rings+0.04*wob)[...,None]
    col=mix(col,hx("terracotta")*0.55+hx("slate")*0.1,pores*0.30)
    col*= (1+0.025*pnoise(N,N,1.3,rng,fmax=12))[...,None]
    seam=1-smooth(1.0,3.2,edge); bev=1-smooth(2.5,7,edge)
    col=col*(1-0.28*bev)[...,None]; col=mix(col,np.array([48,30,22],np.float32),seam*0.85)
    height=0.5+0.10*(rings-0.5)-0.55*seam-0.15*bev-0.06*pores+0.02*fine
    height=(height-height.min())/(height.max()-height.min())
    rough=np.clip(0.42+0.10*rings+0.25*pores+0.4*seam+0.05*pnoise(N,N,1.2,rng,fmax=12),0.2,1)
    return dict(color=col,height=height,rough=rough,nstr=0.008)

def floor_terrazzo(N,seed=51):
    rng=np.random.default_rng(seed)
    cloud=pnoise(N,N,1.4,rng,fmax=9); mid=pnoise(N,N,1.0,rng,fmin=8,fmax=60)
    base=mix(hx("dawn")*0.97,hx("rose")*0.35+hx("dawn")*0.65,smooth(-0.2,1.5,cloud)*0.5)
    col=base*(1+0.02*mid)[...,None] if base.ndim==3 else base
    col=np.broadcast_to(col,(N,N,3)).astype(np.float32).copy()
    chip_cols=np.array([hx(n) for n in ["apricot","rose","terracotta","horizon","sage","ochre","slate","blue","violetL","coral","ash","dawn"]],np.float32)
    cw=np.array([3,3,1.6,2.0,2,0.8,1.4,0.6,0.5,1.0,3,3.]);cw/=cw.sum()
    height=np.full((N,N),0.5,np.float32); rough=np.full((N,N),0.34,np.float32)
    for G,dens,rmax in ((64,0.40,0.9),(30,0.30,0.85),(12,0.22,0.8)):
        w=(pnoise(N,N,1.2,rng,fmax=40)*N*0.004,pnoise(N,N,1.2,rng,fmax=40)*N*0.004)
        d1,d2,cid,oy,ox=voronoi(N,G,rng,warp=w,jit=0.9)
        C=N/G; flag=rng.random(G*G)<dens; rad=rng.uniform(0.35,rmax,G*G)*C*0.5*1.4
        ci=rng.choice(len(chip_cols),G*G,p=cw); cc=chip_cols[ci]*rng.uniform(0.88,1.08,(G*G,1)).astype(np.float32)
        inside=(d1<rad[cid])&flag[cid]
        # chips are polished stone; faint speckle inside each chip
        m=1-smooth(0,1.4,np.where(inside,0,1)*0+(d1-rad[cid]))  # soft edge
        m=m*flag[cid]
        shade=(1+0.06*(ox/ C)+0.06*mid)[...,None]
        col=mix(col,cc[cid]*shade,m)
        rim=smooth(0,2.5,(rad[cid]-d1))*m
        col*= (1-0.12*(1-rim)*m)[...,None]
        height=np.where(m>0.5,0.52,height); rough=np.where(m>0.5,0.22,rough)
    # sparse tiny glints/pits
    pit=smooth(2.2,3.0,pnoise(N,N,0.2,rng,fmin=200,fmax=1000)); col*= (1-0.18*pit)[...,None]
    col+=blur(rng.standard_normal((N,N)).astype(np.float32),0.7)[...,None]*1.6
    return dict(color=col,height=height,rough=np.clip(rough+0.05*mid+0.3*pit,0.12,1),nstr=0.0)
