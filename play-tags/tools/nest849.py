# #849 (TJ Oct 30 2026 5:37 PM PT shot): Bitcoiners walk: Symbiosis #1 (archived-painting-15, room-07 wall 3) size-matched to its orange
# neighbour Hope, the Vermillion Aurora (h 0.8382). Height match, aspect kept (no stretch); plaque slid out along wall. Idempotent; asserts 848/849.
import json, os, shutil
F='src/catalog.json'
for s,d in ((F,'/tmp/catalog.json.848'),('deploy/execute.js','/tmp/execute.js.848b')):
    if not os.path.exists(d): shutil.copy(s,d)
c=json.load(open(F)); T=c['layout']['tags']; N=T['nest']; assert N['issue'] in (848,849), N
ID='archived-painting-15'; NB='hope-the-vermillion-aurora'
cp=[p for p in c['paintings'] if p['id']==ID][0]; lp=[p for p in T['paintings'] if p['id']==ID][0]
nb=[p for p in c['paintings'] if p['id']==NB][0]
H=nb['h']; A=cp['iw']/cp['ih'] if 'orig849' not in cp else cp['orig849'][0]/cp['orig849'][1]
if 'orig849' not in cp: cp['orig849']=[cp['w'],cp['h']]
W=round(H*A,4); m=0.06
tx,tz=0.5,-0.866  # +s along room-07 wall 3 (from plaque offset)
if 'orig849s' not in lp: lp['orig849s']=[lp['s'],lp['x'],lp['z']]
s0,x0,z0=lp['orig849s']
S0=2.86  # clear archived-painting-370 plaque (right edge s 1.934) by 0.01
cx,cz=round(x0+tx*(S0-s0),3),round(z0+tz*(S0-s0),3)
ps=round(S0+W/2+m/2+0.02+0.13,3); d=ps-s0; px,pz=round(x0+tx*d,3),round(z0+tz*d,3)
assert S0-W/2-m/2>=1.934+0.01 and ps+0.13<=4.125-0.06, ps
for P in (cp,lp): P.update(x=cx,z=cz)
lp['s']=S0
cp.update(w=W,h=H,iw=W,ih=H,fw=round(W+m,4),fh=round(H+m,4),sizeMatch849=NB); cp['plaqueAt'].update(x=px,z=pz)
lp.update(w=W,h=H,fw=round(W+m,4),fh=round(H+m,4)); lp['plaque'].update(s=ps,x=px,z=pz)
N.update(issue=849,prev=848)
N['note849']=f'TJ walk shot: {ID} Symbiosis #1 {cp["orig849"][0]:.4f}x{cp["orig849"][1]:.4f} -> {W}x{H} m to peer-match {NB} height ({nb["w"]}x{H}); aspect {A:.4f} kept, listed print sizes smaller (visual peer override per TJ). Centre s 2.721->{S0} to clear 370 plaque; plaque s {ps}. BRASS_HOLD_829 untouched.'
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(N['note849'])
