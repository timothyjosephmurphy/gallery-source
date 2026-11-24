# #843 TJ walk (Paul court): easel centred in the room-08 k3 doorway reading from the room toward the water;
# bistro cafe sets (world 'at') along the far low834 parapets overlooking the water; fountain scaled back up (pre-#831 size).
import json,math
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (842,843), T['nest']
J='src/fountainIstanbul811.js'; s=open(J).read()
if 'cafe843' not in s:
    a="for (const K of C.cafes || []) { const g = G(K.u, K.v, yawIn, 'cafe811');"; assert s.count(a)==1
    s=s.replace(a,"for (const K of C.cafes || []) { const g = K.at ? (() => { const q = new THREE.Group(); q.position.set(K.at[0], 0, K.at[1]); q.rotation.y = K.yaw || 0; q.name = 'cafe843'; root.add(q); return q; })() /* cafe843: world-placed parapet seating */ : G(K.u, K.v, yawIn, 'cafe811');")
    open(J,'w').write(s)
oc=[o for o in T['openCourts'] if o['id']=='courtyard-fountain-sw'][0]; I=oc['ist811']
d=oc['door']['at']; n=oc['inn']
I.setdefault('easel842prev',{'at':I['easel']['at'],'face':I['easel']['face']})
I['easel']['at']=[round(d[0]-0.35*n[0],3),round(d[1]-0.35*n[1],3)]; I['easel']['face']=[0.866,0.5]
cafes=[]
for w in oc['walls'][:2]:
    L=math.hypot(w['x1']-w['x0'],w['z1']-w['z0']); tx,tz=(w['x1']-w['x0'])/L,(w['z1']-w['z0'])/L; mx,mz=(w['x0']+w['x1'])/2,(w['z0']+w['z1'])/2
    for u in (-2.2,2.2): cafes.append({'at':[round(mx+tx*u+w['nx']*1.1,3),round(mz+tz*u+w['nz']*1.1,3)],'yaw':round(math.atan2(w['nx'],w['nz']),4),'wall':w['id']})
I['cafes']=cafes
f=oc['fountain']; f.setdefault('prev843',{'r':f['r'],'vscale':f['vscale']}); f['r']=1.35; f['vscale']=1.0
T['nest']['note843']='#843 TJ walk: Father Paul easel centred in room-08 k3 doorway; 4 bistro sets on low834-0/1 parapet water edge; fountain r 0.675->1.35 (vscale 1.0)'
T['nest'].update(issue=843,prev=842)
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
print(843,I['easel'],cafes)
