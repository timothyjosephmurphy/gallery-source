# #801 (TJ Oct 27 2026): Kinoteka polish. Paul outer wall pieces either side of the Kinoteka arch -> low parapet (open view from the aisle; collision kept),
# no plaster tympanum over that arch; (kino800.js: interior bronze door removed, house lights dim while the film plays). Idempotent; asserts 800/801.
import json
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (800,801), T['nest']
oc=[o for o in T['openCourts'] if o['id']=='courtyard-paul'][0]; n=0
for w in oc['walls']:
    if w['id'] in ('courtyard-paul-outer-wall','courtyard-paul-outer-wall-b'): w['low801']=True; n+=1
assert n==2
kc=[o for o in T['openCourts'] if o['id']=='kinoteka'][0]
for d in kc['doors800']: d['open801']=True
# #801b: centre aisle through the seats -> each row collider split (gap |u|<0.55)
f=kc['kino800']['f']; t=kc['kino800']['t']; D=kc['kino800']['D']; K=lambda u,v:[round(D[0]+t[0]*u+f[0]*v,3),round(D[1]+t[1]*u+f[1]*v,3)]
seg=lambda i,a,b:dict(id='kino800-'+i,x0=a[0],z0=a[1],x1=b[0],z1=b[1],nx=0,nz=0,kino800=True)
kc['walls']=[w for w in kc['walls'] if not w['id'].startswith('kino800-row')]
for i in range(8):
    v=14.2+0.95*i; kc['walls']+=[seg('row%dl'%i,K(-3.6,v),K(-0.55,v)),seg('row%dr'%i,K(0.55,v),K(3.6,v))]
T['nest'].update(centreAisle801=1.1,archRemoved801=True,issue=801,prev=800,kino801=dict(lowWalls=n,interiorDoor='removed',houseLights='dim while film plays'))
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(801,n)
