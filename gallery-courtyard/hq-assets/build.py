import os, json, sys, time
from hqlib import *
from mat_arch import *
from mat_other import *
OUT=os.path.dirname(os.path.abspath(__file__))
Q=dict(c=94,n=92,r=88)
# slug, category, generator, desktop size, phone size, normal?, rough?, normal px desktop, phone
SPEC=[
 ("wall-plaster","walls",wall_plaster,2048,1024,True,False,1024,512),
 ("wall-ashlar","walls",wall_ashlar,2048,1024,True,False,1024,512),
 ("floor-flagstone","floors",floor_flagstone,2048,1024,True,True,1024,512),
 ("floor-planks","floors",floor_planks,2048,1024,True,True,1024,512),
 ("floor-terrazzo","floors",floor_terrazzo,2048,1024,False,True,1024,512),
 ("ceiling-coffer","ceilings",ceiling_coffer,1024,512,True,False,1024,512),
 ("ceiling-plaster","ceilings",ceiling_plaster,1024,512,False,False,1024,512),
 ("prop-brass","props",prop_brass,1024,512,True,True,1024,512),
 ("prop-walnut","props",prop_walnut,1024,512,True,True,1024,512),
 ("prop-marble","props",prop_marble,1024,512,False,True,1024,512),
 ("prop-linen","props",prop_linen,1024,512,True,False,1024,512),
 ("prop-felt","props",prop_felt,1024,512,False,False,1024,512),
]
only=sys.argv[1:] 
rows=[]; seam={}
def add(path,cat,slug,kind,tier,w,h,replaces):
    rows.append(dict(file=os.path.relpath(path,OUT),category=cat,slug=slug,map=kind,tier=tier,width=w,height=h,bytes=os.path.getsize(path),replaces=replaces))
REPL={
 "wall-plaster":"walls: wall_diff / wall_nor / wall_arm (mo.stone)",
 "wall-ashlar":"walls: wall_diff / wall_nor / wall_arm (mo.stone), stone alternative",
 "floor-flagstone":"floors: floor_diff / floor_nor / floor_arm (mo.floor, wet)",
 "floor-planks":"floors: floor_diff / floor_nor / floor_arm (mo.floor), warm wood alternative",
 "floor-terrazzo":"floors: floor_diff / floor_arm (mo.floor), palette terrazzo alternative",
 "ceiling-coffer":"ceilings: metal_diff / metal_nor tinted 0x6A5850 (mo.ceiling)",
 "ceiling-plaster":"ceilings: metal_diff tinted 0x6A5850 (mo.ceiling), plain alternative",
 "prop-brass":"props/trim: metal_diff / metal_nor / metal_arm (mo.metal)",
 "prop-walnut":"new role: frames, benches, door/handrail wood (no existing texture; was flat colour 0x5a3e26)",
 "prop-marble":"new role: plinths, fountain basin (was flat colours)",
 "prop-linen":"new role: canvas/mat/upholstery weave (new)",
 "prop-felt":"new role: bench cushion/rope-barrier wool felt (new)",
}
for slug,cat,gen,Nd,Np,hasn,hasr,nd,np_ in SPEC:
    if only and slug not in only: continue
    t=time.time(); d=gen(Nd); os.makedirs(f"{OUT}/{cat}",exist_ok=True)
    col=np.clip(d['color'],0,255)
    for tier,N,ns in (("desktop",Nd,nd),("phone",Np,np_)):
        sfx="" if tier=="desktop" else ".phone"
        c=wrap_resize(col,N) if N!=Nd else col
        seam[f"{cat}/{slug}{sfx}.webp"]=[round(x,2) for x in seam_stats(u8(c))]; p=f"{OUT}/{cat}/{slug}{sfx}.webp"; save_webp(u8(c),p,Q['c']); add(p,cat,slug,"color",tier,N,N,REPL[slug])
        if hasn and d['height'] is not None:
            p=f"{OUT}/{cat}/{slug}_n{sfx}.webp"; save_webp(normal_map(d['height'],ns,d['nstr']),p,Q['n']); add(p,cat,slug,"normal",tier,ns,ns,REPL[slug])
        if hasr:
            r=wrap_resize(d['rough'],ns) if ns!=Nd else d['rough']
            p=f"{OUT}/{cat}/{slug}_r{sfx}.webp"; save_webp(u8(r*255),p,Q['r'],gray=True); add(p,cat,slug,"roughness",tier,ns,ns,REPL[slug])
    print(slug,round(time.time()-t,1),flush=True)
if not only or any(s.startswith("sky") for s in only):
    os.makedirs(f"{OUT}/sky",exist_ok=True)
    for slug,mode,seed,rep in (("sky-pnw-day","day",131,"sky: new equirect scene.background (currently flat colour 0xCFE0EA, fog/env 0xD8C4A4)"),("sky-pnw-sunset","sunset",137,"sky: new equirect alternate (golden-hour); same role as sky-pnw-day")):
        a=sky(2048,seed,mode)
        for tier,w,h in (("desktop",2048,1024),("phone",1024,512)):
            sfx="" if tier=="desktop" else ".phone"
            arr=a if w==2048 else u8(wrap_resize_xy(a.astype(np.float32),w,h))
            seam[f"sky/{slug}{sfx}.webp"]=[round(x,2) for x in seam_stats(arr,True)]; p=f"{OUT}/sky/{slug}{sfx}.webp"; save_webp(arr,p,Q['c']); add(p,"sky",slug,"color",tier,w,h,rep)
        print(slug,flush=True)
mp=f"{OUT}/manifest.json"
old=[]
if only and os.path.exists(mp): old=[r for r in json.load(open(mp))['files'] if not any(r['slug']==s for s in only)]
files=old+rows
files.sort(key=lambda r:(r['category'],r['slug'],r['map'],r['tier']))
json.dump(dict(version=1,generated="2026-10-22",task="studio-tracker #303",colorspace="color maps sRGB WebP; _n OpenGL normal (+Y up, linear); _r single-channel roughness (read green channel, linear); metalness: constant (prop-brass = 1.0)",
  budget_desktop=dict(walls_floors=2048,ceiling=1024,sky="2048x1024",props=1024),budget_phone=dict(walls_floors=1024,ceiling=512,sky="1024x512",props=512),files=files),open(mp,"w"),indent=1)

sp=f"{OUT}/previews/seam-raw.json"; prev=json.load(open(sp)) if (only and os.path.exists(sp)) else {}
prev.update(seam); json.dump(prev,open(sp,"w"),indent=1)
