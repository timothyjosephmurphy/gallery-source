# #787 (TJ Oct 27 2026): Paul Murphy annex door H5 Family SE (room-05 k5) -> H2 NE (room-02 k0). H5 SE becomes hang wall.
import json
CAT='src/catalog.json'; c=json.load(open(CAT)); T=c['layout']['tags']; assert T['nest']['issue']==786
R={r['id']:r for r in T['rooms']}; PK=T['parked777']; DW=7.75; CID='courtyard-paul'
F=R['room-05']; assert F['neighbours'].get('5')==CID
F['doorWalls']=[k for k in F['doorWalls'] if k!=5]
for d in ('doorWidths','doorOffsets','neighbours'): F[d].pop('5',None)
H=R['room-02']; assert 0 not in H['doorWalls']
H['doorWalls']=sorted(H['doorWalls']+[0]); H['doorWidths']['0']=DW; H['doorOffsets']['0']=0.0; H['neighbours']['0']=CID
P=[p for p in c['paintings'] if p['room']=='room-02' and p['wall']==0]; ids={p['id'] for p in P}
for p in P: p['parkedBy']='#787 door wall room-02 k0 full-width arch into courtyard-paul'
c['paintings']=[p for p in c['paintings'] if p['id'] not in ids]; PK['paintings']+=P
L=[p for p in T['paintings'] if p['id'] in ids]; T['paintings']=[p for p in T['paintings'] if p['id'] not in ids]; PK['layoutPaintings']+=L
oc=[o for o in T['openCourts'] if o['id']==CID][0]
oc['door']=dict(room='room-02',k=0,width=DW,at=[18.562,10.716])
oc['note']='#787 Paul Murphy nestled annex off H2 NE (inner, like other trap courts); H5 SE now hang wall; outer edge = Paul Murphy hang'
T['nest'].update(issue=787,prev=786,paulDoor787=dict(door='room-02 k0 7.75 m',freed='room-05 k5',parked=sorted(ids)))
open(CAT,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(json.dumps(T['nest']['paulDoor787']))
PNF='/workspace/gallery-tj-feedback/hex-plan-honeycomb-nest/plan-nest.json'; PN=json.load(open(PNF))
A=PN['paul_murphy_annex']; A['viewpoint']='standing in H2 Brekkie/Bitcoin B looking out NE (30°)'
for w in A['walls']:
    if w['wall'].startswith('DOOR'): w['wall']='SOUTH-WEST wall (= H5 Family SE outer wall)'; w['program']='hang (solid; #787 door moved to H2)'
    elif w['wall'].startswith('RIGHT'): w['wall']='DOOR wall (= H2 Brekkie/Bitcoin B NE outer wall)'; w['program']='door from H2 — full-width 7.75 m arch (#787)'
A['door']=dict(between=['H2','PAUL_MURPHY_ANNEX'],type='inner',width_m=DW,center_m=[18.562,10.716],wall='H2 Brekkie/Bitcoin B NE outer wall, normal 30°, from (16.5, 14.289) to (20.625, 7.144)',note='#787 TJ Oct 27 2026: centred mid-wall; Father Paul remains in H5 Family; H5 SE is a hang wall')
json.dump(PN,open(PNF,'w'),ensure_ascii=False,indent=2)
