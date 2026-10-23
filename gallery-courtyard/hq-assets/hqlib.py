import numpy as np, math
from PIL import Image
from scipy import ndimage as ndi
P={"dawn":"#F3E6D8","apricot":"#F7A66E","rose":"#E9A9A6","terracotta":"#C8644E","coral":"#F48A5C","horizon":"#9DB7CF","slate":"#5E7289","ochre":"#F7CC3A","ash":"#B9AFA4","sage":"#8FAE9E","blue":"#5E9ADB","violet":"#9A78CF","blueL":"#8DB8E8","violetL":"#B9A0E0"}
def hx(s):
    if s in P: s=P[s]
    return np.array([int(s[i:i+2],16) for i in (1,3,5)],np.float32)
def smooth(a,b,x):
    t=np.clip((x-a)/(b-a),0,1); return t*t*(3-2*t)
def mix(a,b,t):
    t=np.asarray(t,np.float32)
    if t.ndim==2: t=t[...,None]
    return a*(1-t)+b*t
def pnoise(h,w,beta,rng,kx=1.0,ky=1.0,fmin=0.0,fmax=None):
    """periodic (tileable) noise, zero mean unit std. beta=spectral slope; kx/ky anisotropy (small k => stretched along that axis)"""
    fy=np.fft.fftfreq(h)[:,None]*h; fx=np.fft.rfftfreq(w)[None,:]*w
    f=np.sqrt((fx/kx)**2+(fy/ky)**2); f[0,0]=1
    amp=f**(-beta); amp[0,0]=0
    if fmin>0: amp*=smooth(fmin*0.7,fmin*1.3,f)
    if fmax: amp*=1-smooth(fmax*0.8,fmax*1.2,f)
    wn=rng.standard_normal((h,w)).astype(np.float32)
    n=np.fft.irfft2(np.fft.rfft2(wn)*amp,s=(h,w)).astype(np.float32)
    return (n-n.mean())/(n.std()+1e-9)
def voronoi(N,G,rng,warp=None,jit=0.85):
    """tileable voronoi. returns d1,d2 (px), cell id (int), local offset vectors (dy,dx) from cell point"""
    C=N/G
    fr=(rng.random((G,G,2)).astype(np.float32)-0.5)*jit+0.5
    yy,xx=np.mgrid[0:N,0:N].astype(np.float32)
    if warp is not None:
        yy=(yy+warp[0])%N; xx=(xx+warp[1])%N
    gi=np.floor(yy/C).astype(np.int32); gj=np.floor(xx/C).astype(np.int32)
    d1=np.full((N,N),1e9,np.float32); d2=d1.copy(); cid=np.zeros((N,N),np.int32)
    oy=np.zeros((N,N),np.float32); ox=oy.copy()
    for a in (-2,-1,0,1,2):
        for b in (-2,-1,0,1,2):
            if abs(a)==2 and abs(b)==2: continue
            ii=(gi+a)%G; jj=(gj+b)%G
            py=(gi+a+fr[ii,jj,0])*C; px=(gj+b+fr[ii,jj,1])*C
            dy=yy-py; dx=xx-px; d=np.sqrt(dy*dy+dx*dx)
            m=d<d1
            d2=np.where(m,d1,np.minimum(d2,d)); d1=np.where(m,d,d1)
            cid=np.where(m,ii*G+jj,cid); oy=np.where(m,dy,oy); ox=np.where(m,dx,ox)
    return d1,d2,cid,oy,ox
def wrap_resize(a,size,pad_frac=0.25):
    """resize tileable array (HxW or HxWxC) to size x size keeping tile continuity"""
    a=np.asarray(a,np.float32); H=a.shape[0]
    if H==size: return a
    p=int(H*pad_frac); pw=((p,p),(p,p))+(((0,0),) if a.ndim==3 else ())
    b=np.pad(a,pw,mode='wrap'); ns=size+2*int(size*pad_frac)
    ch=[b] if a.ndim==2 else [b[...,i] for i in range(a.shape[2])]
    out=[np.asarray(Image.fromarray(c).resize((ns,ns),Image.LANCZOS if size<H else Image.BICUBIC)) for c in ch]
    q=int(size*pad_frac); out=[o[q:q+size,q:q+size] for o in out]
    return out[0] if a.ndim==2 else np.stack(out,-1)
def wrap_resize_xy(a,w,h):
    """resize equirect (wraps horizontally only)"""
    a=np.asarray(a,np.float32); H,W=a.shape[:2]; p=W//8
    b=np.pad(a,((0,0),(p,p),(0,0)),mode='wrap'); nw=w+2*(w//8)
    out=np.stack([np.asarray(Image.fromarray(b[...,i]).resize((nw,h),Image.LANCZOS)) for i in range(3)],-1)
    q=w//8; return out[:,q:q+w]
def normal_map(hgt,size,strength):
    """OpenGL normal map (+Y up) from periodic height 0..1; strength = relief as fraction of tile width"""
    hh=wrap_resize(hgt,size) if hgt.shape[0]!=size else hgt
    gx=(np.roll(hh,-1,1)-np.roll(hh,1,1))*0.5*size*strength
    gy=(np.roll(hh,-1,0)-np.roll(hh,1,0))*0.5*size*strength
    n=np.stack([-gx,gy,np.ones_like(gx)],-1); n/=np.linalg.norm(n,axis=-1,keepdims=True)
    return ((n*0.5+0.5)*255+0.5).clip(0,255).astype(np.uint8)
def u8(c,rng=None,dither=0.0):
    c=np.asarray(c,np.float32)
    if dither and rng is not None: c=c+rng.uniform(-dither,dither,c.shape).astype(np.float32)
    return (c+0.5).clip(0,255).astype(np.uint8)
def save_webp(arr,path,q,gray=False):
    im=Image.fromarray(arr,'L' if gray else 'RGB'); im.save(path,'WEBP',quality=q,method=6)
    import os; return os.path.getsize(path)
def blur(a,s):
    return ndi.gaussian_filter(a,s,mode='wrap')
def seam_stats(a,horiz_only=False):
    """returns [wrap step, mean interior step, max interior step] (0-255 levels), worst axis by wrap/max"""
    a=np.asarray(a,np.float32); res=[]
    for ax in ([1] if horiz_only else [1,0]):
        b=np.moveaxis(a,ax,1)
        wrap=float(np.abs(b[:,0]-b[:,-1]).mean())
        inter=np.abs(np.diff(b,axis=1)).reshape(b.shape[0],b.shape[1]-1,-1).mean(axis=(0,2))
        res.append((wrap,float(inter.mean()),float(inter.max())))
    return max(res,key=lambda r:r[0]/max(r[2],1e-6))
