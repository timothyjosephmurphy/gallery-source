# #806 (TJ Oct 28 2026 ~12:00 AM PT): Kinoteka centre aisle wider, 1.1 m -> 1.7 m clear. Row colliders split at |u|<0.85,
# outer extent 3.6 -> 4.2 (seats shifted out 0.55; side walls at |u|~5.65). kino800.js seats u=+-(1.15+k*0.55), arms +-(0.875+k*0.55). Idempotent; asserts 805/806.
import json
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (805,806), T['nest']
kc=[o for o in T['openCourts'] if o['id']=='kinoteka'][0]
f=kc['kino800']['f']; t=kc['kino800']['t']; D=kc['kino800']['D']; K=lambda u,v:[round(D[0]+t[0]*u+f[0]*v,3),round(D[1]+t[1]*u+f[1]*v,3)]
seg=lambda i,a,b:dict(id='kino800-'+i,x0=a[0],z0=a[1],x1=b[0],z1=b[1],nx=0,nz=0,kino800=True)
H=0.85; O=4.2
kc['walls']=[w for w in kc['walls'] if not w['id'].startswith('kino800-row')]
for i in range(8):
    v=14.2+0.95*i; kc['walls']+=[seg('row%dl'%i,K(-O,v),K(-H,v)),seg('row%dr'%i,K(H,v),K(O,v))]
T['nest'].update(issue=806,prev=805,centreAisle806=round(2*H,2),kino806=dict(aisleClear_m=round(2*H,2),halfGap=H,rowOuter=O,seatU='+-(1.15+k*0.55)',armU='+-(0.875+k*0.55)',prevAisle_m=1.1))
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print(806,2*H)
