import os, json, math, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from hqlib import *
OUT=os.path.dirname(os.path.abspath(__file__)); W=json.load(open('/tmp/world.json'))
X0,Z0,SIZE=-42.0,-29.0,72.0          # world window (m) covered by the plan lightmaps
def raster(N):
    ppm=N/SIZE; S=2
    wall=Image.new('L',(N*S,N*S),0); d=ImageDraw.Draw(wall); P=lambda x,z:((x-X0)*ppm*S,(z-Z0)*ppm*S)
    for q in W['walls']:
        if q['free']: continue
        d.line([P(q['x0'],q['z0']),P(q['x1'],q['z1'])],fill=255,width=max(2,int(0.16*ppm*S)))
    # central pillar 2.2 x 1.0 at hub centre is a collider; approximate with its footprint
    wall=np.asarray(wall.resize((N,N),Image.BOX))>96
    rooms=Image.new('L',(N*S,N*S),0); d=ImageDraw.Draw(rooms)
    for r in W['rooms']:
        if r['kind']=='room' and r['poly']: d.polygon([P(*p) for p in r['poly']],fill=255)
    rooms=np.asarray(rooms.resize((N,N),Image.BOX))>127
    return wall,rooms,ppm
def bake(N):
    wall,rooms,ppm=raster(N)
    dist=ndi.distance_transform_edt(~wall)/ppm            # metres to nearest wall face
    # open courts/outer: contact only; enclosed rooms: stronger + broad corner/room occlusion
    k1=np.where(rooms,0.60,0.40); k2=np.where(rooms,0.24,0.12); k3=np.where(rooms,0.10,0.0)
    ao=1-k1*np.exp(-dist/0.28)-k2*np.exp(-dist/1.25)-k3*np.exp(-dist/4.0)
    ao=ndi.gaussian_filter(ao,0.6)
    ceil=np.where(rooms,1-0.50*np.exp(-dist/0.45)-0.22*np.exp(-dist/1.8)-0.10*np.exp(-dist/5.0),1.0)
    ceil=ndi.gaussian_filter(ceil,0.8)
    return np.clip(ao,0.2,1),np.clip(ceil,0.3,1)
rows=[]
def add(path,slug,kind,tier,w,h,rep,extra=None):
    d=dict(file=os.path.relpath(path,OUT),category="ao",slug=slug,map=kind,tier=tier,width=w,height=h,bytes=os.path.getsize(path),tileable=False,replaces=rep); d.update(extra or {}); rows.append(d)
rng=np.random.default_rng(7)
for tier,N,NC in (("desktop",2048,1024),("phone",1024,512)):
    sfx="" if tier=="desktop" else ".phone"
    f,_=bake(N); _,c=bake(NC)
    for slug,a,n,rep in (("ao-plan-floor",f,N,"baked floor/ground AO lightmap for the whole shell + courtyards (sampled by world x,z); multiply into floor and gravel/lawn ground, or use as aoMap on a floor mesh with matching uv"),("ao-plan-ceiling",c,NC,"baked ceiling AO lightmap (room ceilings only; white elsewhere), sampled by world x,z")):
        p=f"{OUT}/ao/{slug}{sfx}.webp"; save_webp(u8(a*255,rng,0.6),p,90,gray=True); add(p,slug,"ao-gray",tier,n,n,rep,dict(plan=dict(x0=X0,z0=Z0,size=SIZE)))
json.dump(dict(note="ao-plan-*.webp covers world x in [x0,x0+size], z in [z0,z0+size] metres. Sample u=(x-x0)/size, v=(z-z0)/size with texture.flipY=false (image row 0 = z0). White=unoccluded, darker=occluded; use as multiply (aoMap with uv remap, a planar-projected overlay, or onBeforeCompile).",x0=X0,z0=Z0,size=SIZE,
   px=dict(floor_desktop=2048,floor_phone=1024,ceiling_desktop=1024,ceiling_phone=512),recipe="walls rasterised (0.16 m) from play-tags makeWorld(layout.tags); occlusion=1-k1*exp(-d/0.28)-k2*exp(-d/1.25)-k3*exp(-d/4); rooms k=(.60,.24,.10), open courts k=(.40,.12,0); ceiling k=(.50,.22,.10) over rooms only"),open(f"{OUT}/ao/ao-plan.json","w"),indent=1)
# ---- decal strips: RGBA black, alpha = occlusion ----
def rgba(alpha): 
    a=np.clip(alpha,0,1); return np.dstack([np.zeros(a.shape+(3,),np.uint8)[...,0:3].reshape(a.shape+(3,)),u8(a*255,rng,0.7)])
def strip_wall_base(W_,H_):          # u: along wall (tileable), v: image row 0 = top (0.8 m up) .. bottom = floor
    y=(1-(np.arange(H_)+0.5)/H_)*0.8; u=np.arange(W_)
    n=pnoise(1,W_,1.2,np.random.default_rng(3),fmax=24)[0]*0.04
    prof=0.62*np.exp(-y/0.16)+0.20*np.exp(-y/0.45)
    return np.clip(prof[:,None]*(1+n[None,:])*(1-smooth(0.3,0.8,y))[:,None],0,0.9)
def strip_ceiling(W_,H_):            # row 0 = ceiling
    y=((np.arange(H_)+0.5)/H_)*0.6; n=pnoise(1,W_,1.2,np.random.default_rng(4),fmax=24)[0]*0.04
    prof=0.50*np.exp(-y/0.14)+0.18*np.exp(-y/0.45); return np.clip(prof[:,None]*(1+n[None,:])*(1-smooth(0.2,0.6,y))[:,None],0,0.8)
def strip_corner(W_,H_):             # 0.8 m wide, centred on an inside corner, full wall height
    x=np.abs((np.arange(W_)+0.5)/W_-0.5)*0.8; y=(np.arange(H_)+0.5)/H_
    prof=0.42*np.exp(-x/0.12)+0.16*np.exp(-x/0.4); fade=1-0.7*np.exp(-(1-y)/0.05)*0   # keep full height
    a=prof[None,:]*np.ones((H_,1)); a*= (1-smooth(0.12,0.4,x))[None,:]; return np.clip(a,0,0.7)
def strip_edge(W_,H_):               # one-sided jamb/wall-end: dark at left edge
    x=(np.arange(W_)+0.5)/W_*0.5; prof=0.5*np.exp(-x/0.10)+0.14*np.exp(-x/0.32); a=prof[None,:]*np.ones((H_,1)); a*=(1-smooth(0.12,0.5,x))[None,:]; return np.clip(a,0,0.7)
def blob(S):
    y,x=np.mgrid[0:S,0:S].astype(np.float32); r=np.hypot((x+0.5)/S-0.5,(y+0.5)/S-0.5)*2
    return np.clip(0.62*(1-smooth(0,1,r))**1.6+0.12*(1-smooth(0.2,1,r)),0,0.8)
DEC=[("ao-wall-base",strip_wall_base,(512,256),(256,128),"wall-floor strip: plane 0.8 m high along the wall foot, 3 cm off the face; u repeats along the wall (tileable horizontally, 1 repeat per 2 m); transparent, depthWrite false, polygonOffset"),
     ("ao-wall-ceiling",strip_ceiling,(512,256),(256,128),"wall-ceiling strip: plane 0.6 m high hanging from the ceiling line; same placement as ao-wall-base"),
     ("ao-corner",strip_corner,(128,640),(64,320),"vertical strip 0.8 m wide x 4.2 m tall centred on every inside wall corner (see ao-placement.json corners); one per corner"),
     ("ao-edge",strip_edge,(128,512),(64,256),"one-sided vertical strip 0.5 m wide x 2.7 m: dark edge at left, placed on both jambs of every door (mirror via scale.x=-1 for the right jamb)"),
     ("ao-contact-blob",None,(256,256),(128,128),"radial contact shadow for centre pillar, benches, plinths, fountains, cypress; scale to object footprint x1.6 and lay flat 1 cm above the floor")]
for slug,fn,dsz,psz,rep in DEC:
    for tier,(w,h) in (("desktop",dsz),("phone",psz)):
        sfx="" if tier=="desktop" else ".phone"
        a=blob(w) if fn is None else fn(w,h)
        im=Image.fromarray(rgba(a),'RGBA'); p=f"{OUT}/ao/{slug}{sfx}.webp"; im.save(p,'WEBP',quality=85,method=6,alpha_quality=90); add(p,slug,"ao-decal",tier,w,h,rep)
# ---- placement data ----
corners=[]; 
for r in W['rooms']:
    if r['kind'] in ('room','hub') and r['poly']:
        P=r['poly']; cx,cz=r['center']
        for (x,z) in P:
            ang=math.degrees(math.atan2(cz-z,cx-x)); corners.append(dict(room=r['id'],x=round(x,3),z=round(z,3),yaw_deg_toward_room_centre=round(ang,1)))
walls=[dict(room=q['room'],x0=round(q['x0'],3),z0=round(q['z0'],3),x1=round(q['x1'],3),z1=round(q['z1'],3),nx=round(q['nx'],3),nz=round(q['nz'],3),h=q['h'],length=round(math.hypot(q['x1']-q['x0'],q['z1']-q['z0']),3)) for q in W['walls'] if not q['free']]
doors=[dict(room=d['room'],kind=d['kind'],x=round(d['x'],3),z=round(d['z'],3),nx=round(d['nx'],3),nz=round(d['nz'],3),width=d['width']) for d in W['doors']]
json.dump(dict(source="play-tags makeWorld(layout.tags) read-only dump; metres, x-z plane",wall_faces="place ao-wall-base/-ceiling on both faces of each wall at +/-(0.08+0.03) m along (nx,nz); interior face full strength (material.opacity 1), courtyard face opacity ~0.5",corners=corners,walls=walls,doors=doors,counts=dict(corners=len(corners),walls=len(walls),doors=len(doors))),open(f"{OUT}/ao/ao-placement.json","w"),indent=1)
mp=f"{OUT}/manifest.json"; man=json.load(open(mp)); sl={r['slug'] for r in rows}
man['files']=[r for r in man['files'] if r['slug'] not in sl]+rows; man['files'].sort(key=lambda r:(r['category'],r['slug'],r['map'],r['tier']))
json.dump(man,open(mp,"w"),indent=1)
print(len(rows),len(corners),len(walls))
