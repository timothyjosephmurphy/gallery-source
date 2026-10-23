import os, json, time, sys
from hqlib import *
from mat_ext import *
from mat_sign import *
OUT=os.path.dirname(os.path.abspath(__file__))
Q=dict(c=88,cn=72,n=80,r=80)
R={
 "ext-stucco":"courtyard facade skins: play-tags/src/courtyardstyle.js `skin-<hex>` meshes (flat pastel colours, MeshStandardMaterial roughness .92). Albedo is near-neutral light stucco: keep the per-mesh colour as a multiplier (set it a bit lighter).",
 "ext-travertine":"travertine door jambs/lintels, plinth along outer wall foot, central pillar (tags.js PAL.travertine 0xcbb89a / stone 0xcbb89a)",
 "ext-paving":"stone flag lanes + fountain rings (tags.js pathMat PAL.path 0xd9ccb2, `walkRay` meshes, rings)",
 "ext-gravel":"courtyard gravel ground (tags.js `gravel` ground plane PAL.gravel 0xcdbfa3; garden.js jittered gravel fan)",
 "ext-lawn":"plain green courts (tags.js `lawn284` disc 0x5f8f45; garden.js `garden-lawn` panels 0x5f8a3e/0x6a9444/0x577f38). Albedo carries the green: set material colour white.",
 "ext-foliage":"boxwood hedges / cypress / laurel / ground-cover beds (garden.js instanced meshes 0x3f6a34, 0x2c4a2a, 0x48703a). Albedo carries the greens: set instance colours to white (or ~0.85).",
 "ext-roof-tile":"new: terracotta barrel-tile roof/awning surface (no roof texture exists; buildings are flat-topped with a cornice)",
 "ext-cornice-clay":"terracotta roofline cornice caps (tags.js `cornice` std(PAL.terracotta 0xb8673f))",
 "ext-trim-slate":"Dusk Slate door surrounds (`doorSurrounds` 0x5e7289, courtyardstyle.js) + window/shutter trim",
 "ext-ivy-card":"climbing ivy leaf cards (garden.js ivy: PlaneGeometry 0.16 x 0.12 m, instanced, vertexColors 0x3d6b2f/0x4b7a36/0x335c28, DoubleSide). Light-green RGBA: use alphaTest 0.5; set vertex colours near white.",
 "sign-plate-enamel":"door/nave sign plates behind the lettering (labelTex canvas signs, gates-sign 0.22 aspect); enamel version",
 "sign-plate-brass":"sign plate, brass version (metalness 1)",
 "sign-plate-wood":"sign plate, carved/gilded walnut version",
}
SPEC=[ # slug, fn, Nd, Np, normal, rough
 ("ext-stucco",ext_stucco,2048,1024,True,False,Q['c']),
 ("ext-travertine",ext_travertine,1024,512,True,True,Q['c']),
 ("ext-paving",ext_paving,2048,1024,True,True,Q['c']),
 ("ext-gravel",ext_gravel,2048,1024,True,False,Q['cn']),
 ("ext-lawn",ext_lawn,2048,1024,False,False,Q['cn']),
 ("ext-foliage",ext_foliage,1024,512,True,False,Q['cn']),
 ("ext-roof-tile",ext_roof_tile,1024,512,True,False,Q['c']),
 ("ext-cornice-clay",ext_cornice_clay,1024,512,True,True,Q['c']),
 ("ext-trim-slate",ext_trim_slate,1024,512,True,True,Q['c']),
]
only=sys.argv[1:]; rows=[]; seam={}
def add(path,cat,slug,kind,tier,w,h,tileable,extra=None):
    d=dict(file=os.path.relpath(path,OUT),category=cat,slug=slug,map=kind,tier=tier,width=w,height=h,bytes=os.path.getsize(path),tileable=tileable,replaces=R[slug]); d.update(extra or {}); rows.append(d)
def webp(arr,path,q,mode):
    Image.fromarray(arr,mode).save(path,'WEBP',quality=q,method=6,alpha_quality=95)
for slug,fn,Nd,Np,hn,hr,qc in SPEC:
    if only and slug not in only: continue
    t=time.time(); d=fn(Nd); col=np.clip(d['color'],0,255)
    for tier,N in (("desktop",Nd),("phone",Np)):
        sfx="" if tier=="desktop" else ".phone"; ns=N//2 if Nd==2048 else N
        c=wrap_resize(col,N) if N!=Nd else col
        seam[f"exterior/{slug}{sfx}.webp"]=[round(x,2) for x in seam_stats(u8(c))]
        p=f"{OUT}/exterior/{slug}{sfx}.webp"; save_webp(u8(c),p,qc); add(p,"exterior",slug,"color",tier,N,N,True)
        if hn:
            p=f"{OUT}/exterior/{slug}_n{sfx}.webp"; save_webp(normal_map(d['height'],ns,d['nstr']),p,Q['n']); add(p,"exterior",slug,"normal",tier,ns,ns,True)
        if hr:
            r=wrap_resize(d['rough'],ns) if ns!=Nd else d['rough']
            p=f"{OUT}/exterior/{slug}_r{sfx}.webp"; save_webp(u8(r*255),p,Q['r'],gray=True); add(p,"exterior",slug,"roughness",tier,ns,ns,True)
    print(slug,round(time.time()-t,1),flush=True)
if not only or "ext-ivy-card" in only:
    cs,a,h=ivy_card(512,384)
    for tier,w,hh in (("desktop",512,384),("phone",256,192)):
        sfx="" if tier=="desktop" else ".phone"
        rgba=np.dstack([u8(cs),u8(a*255)]); im=Image.fromarray(rgba,'RGBA')
        if w!=512: im=im.resize((w,hh),Image.LANCZOS)
        p=f"{OUT}/exterior/ext-ivy-card{sfx}.webp"; im.save(p,'WEBP',quality=90,method=6,alpha_quality=95); add(p,"exterior","ext-ivy-card","color+alpha",tier,w,hh,False)
for slug,fn in (("sign-plate-enamel",plate_enamel),("sign-plate-brass",plate_brass),("sign-plate-wood",plate_wood)):
    if only and slug not in only: continue
    d=fn(); col=np.clip(d['color'],0,255); al=d['alpha']
    for tier,W,H in (("desktop",1024,256),("phone",512,128)):
        sfx="" if tier=="desktop" else ".phone"
        rs=lambda a,mode=Image.LANCZOS: np.asarray(Image.fromarray(a.astype(np.float32)).resize((W,H),mode)) if W!=1024 else a
        c=np.stack([rs(col[...,i]) for i in range(3)],-1); a=rs(al)
        p=f"{OUT}/signs/{slug}{sfx}.webp"; Image.fromarray(np.dstack([u8(c),u8(a*255)]),'RGBA').save(p,'WEBP',quality=92,method=6,alpha_quality=95); add(p,"signs",slug,"color+alpha",tier,W,H,False,dict(text_rect_uv=TEXT_RECT,metalness=d['metal']))
        hh=rs(d['height']); p=f"{OUT}/signs/{slug}_n{sfx}.webp"; save_webp(normal_flat(hh,d['nstr']),p,Q['n']); add(p,"signs",slug,"normal",tier,W,H,False)
        p=f"{OUT}/signs/{slug}_r{sfx}.webp"; save_webp(u8(rs(d['rough'])*255),p,Q['r'],gray=True); add(p,"signs",slug,"roughness",tier,W,H,False)
    print(slug,flush=True)
mp=f"{OUT}/manifest.json"; man=json.load(open(mp))
slugs={r['slug'] for r in rows}
files=[r for r in man['files'] if r['slug'] not in slugs]+rows
for r in files: r.setdefault('tileable',True)
files.sort(key=lambda r:(r['category'],r['slug'],r['map'],r['tier'])); man['files']=files; man['version']=2
json.dump(man,open(mp,"w"),indent=1)
sp=f"{OUT}/previews/seam-raw.json"; prev=json.load(open(sp)); prev.update(seam); json.dump(prev,open(sp,"w"),indent=1)
