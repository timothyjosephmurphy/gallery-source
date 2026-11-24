import json,sys,os,io,urllib.request
import numpy as np
from PIL import Image
import time
try:
    sys.path.insert(0,"/workspace/token-tools"); from retry import retry
except ImportError:  # token-tools venv (tenacity) missing on box: same policy, 3 tries w/ backoff
    def retry(f):
        def g(*a):
            for i in range(3):
                try: return f(*a)
                except Exception:
                    if i==2: raise
                    time.sleep(2**i)
        return g
S="/workspace/play-tags/src"; cat=json.load(open(f"{S}/catalog.json")); ov=json.load(open(f"{S}/hang-overrides.json"))
exc=set(cat.get("excluded",[]))|set(ov.get("exclude",[])); assets={a["id"]:a for a in ov.get("assets",[])}
LOCAL=["/workspace/play-tags/public","/workspace/play-tags/dist","/workspace/play-uffizi/public"]
REMOTE={"mva/":"https://media.vermillionaurora.com/","img/":"https://img.tjm.art/","tjm/":"https://tjm.art/"}
CACHE="/workspace/.cache/wb317"
@retry
def fetch(u):
    r=urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0"}),timeout=30); return r.read()
def load(p):
    for b in LOCAL:
        if os.path.exists(f"{b}/{p}"): return Image.open(f"{b}/{p}"),"local"
    c=f"{CACHE}/{p.replace('/','__')}"
    if not os.path.exists(c):
        for k,v in REMOTE.items():
            if p.startswith(k): open(c,"wb").write(fetch(v+p[len(k):])); break
        else: raise FileNotFoundError(p)
    return Image.open(c),"remote"
def margins(im,lum_t,frac=0.95,chroma=22):
    a=np.asarray(im.convert("RGB"),dtype=np.int16); L=a.mean(2); C=a.max(2)-a.min(2)
    w=(L>=lum_t)&(C<=chroma); H,W=w.shape; out={}
    def run(lines,n):
        k=0
        for r in lines:
            if r.mean()>=frac: k+=1
            else: break
        return 100*k/n
    out["top"]=run(w,H); out["bottom"]=run(w[::-1],H); out["left"]=run(w.T,W); out["right"]=run(w.T[::-1],W)
    return out
rows=[]
for p in cat["paintings"]:
    if p["id"] in exc: continue
    img=assets.get(p["id"],{}).get("img") or p["img"]
    try: im,src=load(img)
    except Exception as e: rows.append(dict(id=p["id"],title=p["title"],img=img,err=str(e)[:80])); continue
    m=margins(im,225); soft=margins(im,195,0.9,30)
    mx=max(m.values()); sides=sum(v>=1 for v in m.values()); smx=max(soft.values())
    if mx>=3 or (sides>=2 and mx>=1.5): v="trim"
    elif mx>=0.5: v="border value"
    elif smx>=2: v="borderline"
    else: v="clean"
    rows.append(dict(id=p["id"],title=p["title"],img=img,src=src,size=im.size,m=m,soft=soft,v=v,score=sum(m.values())))
json.dump(rows,open("/workspace/gallery-courtyard/data/white-border-317.json","w"),indent=1)
