# #792 TJ 6:01 PM PT: big Rainier/Tahoma sunrises onto the first-seen START entry walls (H11 k0/k2). Built on nest791 helpers.
import json,math,re
src=open('tools/nest791.py').read()
pre=src.split('LOG=[]; PARK=')[0].replace("('789','790')","('791',)")
exec(pre)
LOG=[];PARK=set();STILL=[]
exec(src[src.index('def rows2'):src.index('def try_')])
exec(src[src.index('def two_high'):src.index('ES=[')])
def span(ids,rid,k):
    lo,hi=9,-9
    for i in ids:
        p=R[i]; s=sof(rid,k,p['x'],p['z']); lo=min(lo,s-p['fw']/2); hi=max(hi,s+p['fw']/2)
        if p.get('plaqueAt'): q=p['plaqueAt']; s=sof(rid,k,q['x'],q['z']); lo=min(lo,s-q['w']/2); hi=max(hi,s+q['w']/2)
    return lo,hi
def block(ids,rid,k,dst,dk,skip=(),near=None):
    """translate a hung block (keeps relative s,y, stacks, plaques)"""
    p0=R[ids[0]]; lo,hi=span(ids,p0['room'],p0['wall']); w=hi-lo
    iv=[x for x in free(dst,dk,set(ids)|set(skip)) if x[1]-x[0]>=w]
    if not iv: return None
    a,b=max(iv,key=lambda x:x[1]-x[0]) if near is None else min(iv,key=lambda x:abs((x[0]+x[1])/2-near))
    m=(a+b)/2 if near is None else min(max(near,a+w/2),b-w/2); d=m-(lo+hi)/2
    (mx,mz),t,f=frame(dst,dk)
    for i in ids:
        p=R[i]; s=sof(p['room'],p['wall'],p['x'],p['z'])+d; st=p.get('stack'); pa=p.get('plaqueAt'); ps=sof(p['room'],p['wall'],pa['x'],pa['z'])+d if pa else None
        q=LP.setdefault(i,{'id':i})
        for o in (p,q): o.update(room=dst,wall=dk,x=round(mx+t[0]*s,3),z=round(mz+t[1]*s,3),ix=round(f[0],4),iz=round(f[1],4))
        q['s']=round(s,3); PLACED.add(i)
        if st: p['stack']=dict(st,col=re.sub(r'room-\d+-w\d+',f'{dst}-w{dk}',st['col']))
        if pa:
            pa=dict(pa,s=round(ps,3),x=round(mx+t[0]*ps,3),z=round(mz+t[1]*ps,3)); p['plaqueAt']=pa; q['plaque']=dict(pa)
    return (dst,dk,round(w,2),round(m,2))
def ids_on(rid,k): return [p['id'] for p in c['paintings'] if p['room']==rid and p['wall']==k]
HERO='sunrise-on-rainier-from-denny-blaine'; LISA='lisa-climbing-tahoma-at-sunrise-from-denny-blaine'; EAG='painting-portrait-with-hat'
TAH='sunrise-on-tahoma-from-denny-blaine'; MOTO='book-art-deb3358c321671dae1fc'
SUNSET=[HERO,LISA,EAG,TAH,MOTO]
UK=['painting-sunflower-woman','painting-figures-in-wheatfield','girl-wearing-flower-crown']
OV=['book-art-64cfd389b3dbb5cde532','book-art-a627c7b7d19ace6b3e51','book-art-029f45a5fbfd6c90212e','book-art-7123da0440d527299914','book-art-37fe572d9bb47cab3bc7','book-art-6bcf18417734a8e3010a']
K2=ids_on('room-11',2)
print('H11 k2 span',span(K2,'room-11',2),'free H12 k1 w/o hero',free('room-12',1,[HERO]))
# park helpers: mark everything on H11 k0/k2 as movable (excluded from busy until placed)
PARK=set(UK+OV+K2+SUNSET)
# 1) displaced H11 k2 hangs -> H12 k1 (hero's old wall), translated as one block
try_('#792 H11 k2 block -> H12 k1',[lambda:block(K2,'room-11',2,'room-12',1)])
# 2) Ukraine row -> next to them on H12 k1, else H12 k0 freed space
try_('#792 Ukraine row',[lambda rid=rid,k=k:rows2([UK],rid,k,[1.45],skip=UK) for rid,k in [('room-12',1),('room-12',0),('room-12',3),('room-06',0)]])
# 3) H11 k0: Lisa | Rainier hero | Eagle, one row (each with plaque; eagle keeps brass plaque)
eag_pl=dict(R[EAG].get('plaqueAt') or {}); 
def k0row():
    # Eagle (brushed-brass caption plate on its -s side per eagleBrass354.js; etched eagle brass plate on +s side, #789) | Rainier hero | Tahoma with motorcycles
    fr=free('room-11',0,UK+OV+SUNSET); a,b=max(fr,key=lambda x:x[1]-x[0]); G=0.12
    EA=[x for o in T['outerCourts'] for x in o.get('art',[]) if x['id']=='eagle-brass-plaque'][0]
    w=0.44+R[EAG]['fw']+0.04+EA['w']+G+unitw(HERO)+G+unitw(MOTO); assert w<=b-a+1e-6,(w,a,b)
    cur=a+(b-a-w)/2+0.44; sh=cur+R[EAG]['fw']/2; put(EAG,'room-11',0,sh,1.45,None); cur+=R[EAG]['fw']
    (mx,mz),tt,ff=frame('room-11',0); sE=cur+0.04+EA['w']/2; old=(EA['x'],EA['z'])
    EA.update(x=round(mx+tt[0]*sE,3),z=round(mz+tt[1]*sE,3),y=1.45,wallFacing=[round(ff[0],4),round(ff[1],4)],room='room-11',movedBy='#792 moved with painting-portrait-with-hat to H11 wall 0 (was %s)'%(old,))
    cur+=0.04+EA['w']+G
    for i,y in ((HERO,1.45),(MOTO,1.45)): put(i,'room-11',0,cur+R[i]['fw']/2,y,cur+R[i]['fw']+PG+PLQ_W/2); cur+=unitw(i)+G
    return ('room-11',0,round(w,2),(a,b))
try_('#792 H11 k0 Eagle | Rainier hero | Tahoma motorcycles',[k0row])
try_('#792 H11 k2 Lisa + Tahoma',[lambda:rows2([[LISA,TAH]],'room-11',2,[1.45],skip=SUNSET+OV,near=-1.9)])
A,B=[OV[0],OV[2],OV[4]],[OV[1],OV[3],OV[5]]
try_('#792 H11 overflow 6 two-high',[lambda:rows2([A,B],'room-11',2,two_high(A,B),skip=OV),lambda:rows2([A,B],'room-12',0,two_high(A,B),skip=OV),lambda:rows2([A,B],'room-12',3,two_high(A,B),skip=OV)])
for i in PARK: assert i in PLACED, i
T['nest'].update(issue=792,prev=791,hang792=dict(log=[str(x) for x in LOG],still=[list(x) for x in STILL]))
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
for x in LOG: print(x)
print('STILL',STILL)
