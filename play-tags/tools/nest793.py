# #793 TJ 6:14 PM PT: rehang every room wall on the eye-level midline (Y=1.45). Each column (stack) / grid unit is shifted vertically
# as ONE unit so its centre sits on the midline; s positions, groupings, grids untouched. #792 H11 sunrises already on 1.45 (unchanged).
# courtyard-paul (HOLD) untouched. Asserts nest 792.
import json
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue']==792, T['nest']
MID,WH,GAP=1.45,4.2,0.30
LP={q['id']:q for q in T['paintings']}; LOG=[]
walls={}
for p in c['paintings']:
    if not str(p['room']).startswith('room-'): continue
    walls.setdefault((p['room'],p['wall']),[]).append(p)
def s_of(p): return p['x']*-p['iz']+p['z']*p['ix']
def ext(p):
    a,b=s_of(p)-p['fw']/2,s_of(p)+p['fw']/2; pa=p.get('plaqueAt')
    if pa: sp=pa['x']*-p['iz']+pa['z']*p['ix']; a,b=min(a,sp-pa['w']/2),max(b,sp+pa['w']/2)
    return a,b
for (rid,k),ps in sorted(walls.items()):
    # columns: union of overlapping s-ranges
    ps=sorted(ps,key=lambda p:ext(p)[0]); cols=[]
    for p in ps:
        lo,hi=ext(p)
        if cols and lo<cols[-1][1]-0.02: cols[-1][1]=max(cols[-1][1],hi); cols[-1][2].append(p)
        else: cols.append([lo,hi,[p]])
    # units: a multi-high column joins adjacent multi-high columns (gap<GAP) -> one grid
    units=[]
    for col in cols:
        multi=len(col[2])>1
        if units and multi and units[-1][0] and col[0]-units[-1][1]<GAP: units[-1][1]=col[1]; units[-1][2]+=col[2]
        else: units.append([multi,col[1],list(col[2])])
    for multi,_,items in units:
        bot=min(p['y']-p['fh']/2 for p in items); top=max(p['y']+p['fh']/2 for p in items)
        d=MID-(bot+top)/2
        if bot+d<0.12: d=0.12-bot
        if top+d>WH-0.25: d=WH-0.25-top
        d=round(d,3)
        if abs(d)<0.005: continue
        for p in items:
            p['y']=round(p['y']+d,3); q=LP.get(p['id'])
            if q: q['y']=p['y']
        LOG.append(f"{rid} w{k} {'grid' if multi else 'col'} n={len(items)} d={d:+.3f}")
# plaque rule (#292 audit): 1.45 m wherever the framed painting spans it, else at the painting's own centre
for ps in walls.values():
    for p in ps:
        pa=p.get('plaqueAt')
        if not pa: continue
        pa['y']=MID if p['y']-p['fh']/2<=MID<=p['y']+p['fh']/2 else p['y']; q=LP.get(p['id'])
        if q and q.get('plaque'): q['plaque']['y']=pa['y']
T['nest'].update(issue=793,prev=792,midline793=dict(mid=MID,log=LOG))
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
print(len(LOG),'units moved'); print('\n'.join(LOG))
