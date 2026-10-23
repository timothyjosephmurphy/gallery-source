import json,os,re,csv,math,glob,collections
from PIL import Image
C=json.load(open('/workspace/play-tags/src/catalog.json'));P=C['paintings'];RD=json.load(open('/workspace/play-tags/tools/realdims.json'))
# local source index
idx=collections.defaultdict(list)   # lowercase stem prefix -> (path,w,h)
def hdr(p):
    try:
        with Image.open(p) as im: return im.size
    except Exception: return None
dirs=[d for d in glob.glob('/workspace/*/static/display')]+[d for d in glob.glob('/workspace/*/*/static/display')]
seen=set(); files=[]
for d in dirs:
    for f in os.listdir(d):
        if f.endswith(('.webp','.jpg','.png')): files.append(os.path.join(d,f))
for f in files:
    b=os.path.basename(f); m=re.match(r'(.+?)(?:-[0-9a-f]{8,10})?-(\d{3,4})\.(webp|jpg|png)$',b)
    if m: idx[m.group(1)].append((f,int(m.group(2))))
print('display files',len(files),'keys',len(idx))
split=collections.defaultdict(list)
for f in glob.glob('/workspace/split-paintings/*.png')+glob.glob('/workspace/split-paintings/*.webp'):
    b=os.path.basename(f); k=b.split('__')[0]
    if '__' in b: split[k].append(f)
pxcache={}
def px(f):
    if f not in pxcache: pxcache[f]=hdr(f)
    return pxcache[f]
PPM=1080/(2*2.0*math.tan(math.radians(35)))   # screen px per metre of wall at 2.0 m, 70deg vfov, 1080p
rows=[]
for p in P:
    i=p['id']; rd=RD[i]; w,h=p['w'],p['h']
    base=rd['px']; hi=rd.get('hiPx') if p.get('hi') else None; hiunk=bool(p.get('hi')) and not rd.get('hiPx')
    cur=hi or base           # what is on the wall once the visitor is within ~9 m
    sw,sh=w*PPM,h*PPM
    ratio=min(cur[0]/sw,cur[1]/sh)        # source texels per screen pixel (worst axis)
    want=[min(4096,int(math.ceil(2*sw/64)*64)),min(4096,int(math.ceil(2*sh/64)*64))]
    if max(want)==4096 and want[0]>want[1]: want[1]=int(math.ceil(want[0]*h/w/64)*64)
    elif max(want)==4096: want[0]=int(math.ceil(want[1]*w/h/64)*64)
    # source
    src='';note=''; best=None
    cands=[]
    for k in (i,):
        if k in idx: cands+=idx[k]
    if cands:
        f,wd=max(cands,key=lambda t:t[1]); s=px(f); best=(f,s); src=f.replace('/workspace/','')
    m=re.match(r'(older-work-.+)-original-(\d+)$',i)
    if m and not best:
        k=m.group(1); fl=split.get(k,[])
        if fl:
            big=max((px(f) for f in fl if px(f)),key=lambda s:s[0]*s[1],default=None)
            src=f'split-paintings/{k}__*.png ({len(fl)} files, up to {big[0]}x{big[1]}; exact file for original-{m.group(2)} needs a human match)'; note='local candidates'
    if not src:
        src=p.get('hi') or p['img']; note='remote only (R2/media); no local hi-res found - needs a new scan/photo if the source is not larger'
    note=(note+'; ' if note else '')+('hi-res URL has no measured size in realdims.json (assumed = base px)' if hiunk else '')
    rows.append(dict(slug=i,room=p['room'],status=p['status'],display_m=f"{w:.2f}x{h:.2f}",base_px=f"{base[0]}x{base[1]}",current_px=f"{cur[0]}x{cur[1]}",wanted_px=f"{want[0]}x{want[1]}",screen_px_at_2m=f"{sw:.0f}x{sh:.0f}",texels_per_screen_px=round(ratio,2),source_file=src,note=note,_r=ratio,_curw=cur[0]))
def prio(r):
    s=r['_r']
    if s>=2: return ''
    return 'P1' if s<0.75 else ('P2' if s<1.25 else 'P3')
for r in rows:
    r['priority']=prio(r)
    if r['priority']=='P3' and r['status']=='available': r['priority']='P2'; r['note']=(r['note']+'; ' if r['note'] else '')+'bumped P3->P2: for sale'
flag=[r for r in rows if r['priority']]
order={'P1':0,'P2':1,'P3':2}
flag.sort(key=lambda r:(order[r['priority']],r['_r']))
cols=['slug','current_px','wanted_px','source_file','priority','room','status','display_m','texels_per_screen_px','screen_px_at_2m','base_px','note']
out='/workspace/gallery-courtyard/hq-assets/scan-needs.csv'
with open(out,'w',newline='') as f:
    wr=csv.DictWriter(f,fieldnames=cols,extrasaction='ignore'); wr.writeheader(); wr.writerows(flag)
cnt=collections.Counter(r['priority'] for r in rows)
print(len(rows),dict(cnt))
print(collections.Counter((r['priority'],r['status']) for r in flag))
json.dump([{k:v for k,v in r.items()} for r in rows],open('/tmp/scan_all.json','w'))
print(round(PPM,1)); print(sum(1 for r in flag if r['note']=='' ),sum(1 for r in flag if 'remote' in r['note']),sum(1 for r in flag if r['note']=='local candidates'))
for r in flag[:6]: print(r['slug'],r['display_m'],r['current_px'],r['wanted_px'],r['texels_per_screen_px'],r['priority'])
