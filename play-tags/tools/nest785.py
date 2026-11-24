# #785 (TJ Oct 27 2026): START open-air trapezoid: near-full-width door H11 k4, low fence across the outer edge, roadster parked beyond.
import json
CAT='src/catalog.json'; c=json.load(open(CAT)); T=c['layout']['tags']; assert T['nest']['issue']==784
R={r['id']:r for r in T['rooms']}; H=R['room-11']; DW=7.75
blk=[p['id'] for p in c['paintings'] if p['room']=='room-11' and p['wall']==4]
H['doorWidths']['4']=DW
OC={o['id']:o for o in T['openCourts']}; S=OC['courtyard-start']; S['door']['width']=DW
S['fences']=[dict(id='courtyard-start-outer-fence',x0=-8.25,z0=-28.68,x1=8.25,z1=-28.68)]
S['roadster']=dict(x=1.6,z=-31.6,yaw=0.35)
S['note']='#785 open-air START trapezoid: full-width door into H11 Portrait, H4 Gallery map | H6 World map, low iron fence across the outer edge, roadster parked beyond'
T['nest'].update(issue=785,prev=784,startCourt=dict(door='room-11 k4 %.2f m'%DW,blocking=blk,fence='16.5 m z -28.68',roadster=S['roadster']))
open(CAT,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print('blocking',blk)
