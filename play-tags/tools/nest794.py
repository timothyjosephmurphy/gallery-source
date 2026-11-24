# #794 TJ 6:35 PM PT: Bitcoiners trio same size as Honey Badger (fh 1.59, h 1.5, frame margin 0.09). Uniform scale (aspect kept).
# One row on room-10 wall 1, order HB | Coined (MIDDLE) | Syrenka, centred on old block centre, y=1.45, plaques beside (0.02) and 0.12 gaps. Asserts nest 793.
import json
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue']==793, T['nest']
IDS=['honeybadger-and-cub-with-genesis-block','coined-in-watercolor-film-poster','warszawska-syrenka']
P={p['id']:p for p in c['paintings'] if p['id'] in IDS}; Q={q['id']:q for q in T['paintings'] if q['id'] in IDS}
hb=P[IDS[0]]; H,M=hb['h'],hb['fh']-hb['h']; LOG={}
for i in IDS[1:]:
    p=P[i]; k=H/p['h']; old=(round(p['fw'],4),round(p['fh'],4))
    w=round(p['w']*k,4); p.update(trueW=p['w'],trueH=p['h'],artScale=round(k,4),iw=w,ih=H,w=w,h=H,fw=round(w+M,4),fh=round(H+M,4)); Q[i].update(w=p['w'],h=H,fw=p['fw'],fh=p['fh'])
    LOG[i]=dict(before=old,after=(p['fw'],p['fh']))
# x = 24.75 - s (wall 1, iz=-1); row runs in decreasing x, plaque on the low-x side of each painting
PW,PG,G=0.26,0.02,0.12
seq=[P[i]['fw'] for i in IDS]; total=sum(seq)+3*(PG+PW)+2*G
old_lo=min(P[i]['plaqueAt']['x']-PW/2 for i in IDS); old_hi=max(P[i]['x']+P[i]['fw']/2 for i in IDS)
mid=(old_lo+old_hi)/2; x=mid+total/2; CX=24.75
for i in IDS:
    p=P[i]; fw=p['fw']; px=round(x-fw/2,3); plx=round(x-fw-PG-PW/2,3)
    for d in (p,Q[i]): d['x']=px; d['y']=1.45
    Q[i]['s']=round(CX-px,3)
    for d in (p['plaqueAt'],Q[i]['plaque']): d.update(x=plx,y=1.45,s=round(CX-plx,3))
    x-=fw+PG+PW+G
span=(round(mid-total/2,3),round(mid+total/2,3)); assert CX-4.0<span[0] and span[1]<CX+4.0, span
T['nest'].update(issue=794,prev=793,trio794=dict(sizes=LOG,span=span))
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
print(LOG,span)
