# #818 (TJ Oct 28 2026 via SM): Paul doorway widen (Kinoteka->Paul low801 gap 2.2 -> 4.4 m), Kinoteka lintel gold sign, outdoor location
# signs (six locked, TJ correction: no fountain-sw, no START), fountain-sw/Festival-side awning trim (end awnings clear the room-04/09 corners),
# Starship tower-catch far behind START (2nd return after Roadster flyaway). Idempotent; asserts nest 817/818. Backups /tmp/*.817.
import json, os, shutil, math
F='src/catalog.json'
for s in (F,'deploy/execute.js','src/kino800.js','src/tags.js'):
    d='/tmp/'+os.path.basename(s)+'.817'
    if not os.path.exists(d): shutil.copy(s,d)
assert 'index-DHw8ql5Z.js' in open('/tmp/execute.js.817').read(), 'rollback backup is not #817'
c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (817,818), T['nest']
prev=T['nest']['issue'] if T['nest']['issue']!=818 else T['nest'].get('prev')
P={o['id']:o for o in T['openCourts']}; pc=P['courtyard-paul']; W0,W1=pc['walls'][0],pc['walls'][1]; d8=P['kinoteka']['doors800'][0]
if not d8.get('widen818'):
    ux,uz=0.5,-0.866; e=1.1
    W0['x1']=round(W0['x1']-ux*e,3); W0['z1']=round(W0['z1']-uz*e,3); W1['x0']=round(W1['x0']+ux*e,3); W1['z0']=round(W1['z0']+uz*e,3)
    d8['width']=4.4; d8['widen818']=True
g=math.hypot(W1['x0']-W0['x1'],W1['z0']-W0['z1']); assert abs(g-4.4)<0.02,g
T['locSigns818']=[dict(court='courtyard-paul',at='room',label='Warsaw, Poland'),     # Bounty (room-02) face of the outdoor arch -> Kinoteka/PKiN view
                  dict(court='kinoteka',at='gap801',label='Warsaw, Poland'),   # Kinoteka plaza opening
                  dict(court='courtyard-paul',label='Minneapolis, Minnesota'),
                  dict(court='courtyard-h1',label='Lillooet, BC'),                  # Friends Club mural court
                  dict(court='courtyard-btc',label='Berlin, El Salvador'),
                  dict(court='courtyard-patio',label='Seattle, Washington')]
I=P['courtyard-fountain-sw']['ist811']; I['awnings']=[{'u':-4.95,'w':4.0,'d':1.2},{'u':0,'w':4.9,'d':1.35},{'u':4.95,'w':4.0,'d':1.2}]; I['awningTrim818']=True
T['nest'].update(issue=818,prev=prev,note818='#818 Paul gap 4.4m, Kinoteka gold lintel, 6 location signs, awning trim, Starship catch at START')
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
k=open('src/kino800.js').read()
o="x.fillStyle = '#ddd6c8'; x.fillRect(0, 0, w, h); x.fillStyle = '#5f5a52'; x.font = 'bold 84px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('K I N O T E K A', w / 2, h / 2 + 4);"
n="x.fillStyle = '#3a2a18'; x.fillRect(0, 0, w, h); x.fillStyle = '#c9a24a'; x.fillRect(0, 6, w, 4); x.fillRect(0, h - 10, w, 4); /* #818 dark band, gold lettering is an overlay */"
if o in k: k=k.replace(o,n)
o2="G.add(E); // text face"; n2="G.add(E); for (const sd of [-1, 1]) { const q = goldSignMesh('KINOTEKA', 6.6, 0.82); q.position.set(0, y0 + CH + 0.75, 10.2 + sd * 0.87); q.rotation.y = sd < 0 ? Math.PI : 0; q.name = 'kinoLintel818'; G.add(q); } /* #818 gold entrance-sign lettering on both lintel faces */ // text face"
if 'kinoLintel818' not in k: assert k.count(o2)==1; k=k.replace(o2,n2)
if "from './signs818.js'" not in k: k=k.replace("import * as THREE from 'three';","import * as THREE from 'three';\nimport { goldSignMesh } from './signs818.js'; // #818",1)
assert n in k and 'signs818' in k; open('src/kino800.js','w').write(k)
t=open('src/tags.js').read()
if 'installSigns818' not in t:
    t=t.replace("import { installKino800 } from './kino800.js';","import { installSigns818, installStarship818 } from './signs818.js'; // #818\nimport { installKino800 } from './kino800.js';",1)
    a="  try { window.__kino800 = installKino800(root, T, LOW);"; assert t.count(a)==1
    t=t.replace(a,"  try { window.__signs818 = installSigns818(root, W, T); window.__starship818 = installStarship818(root, T, LOW); } catch (e) { console.warn('[818]', e); window.__signs818 = { err: String(e) }; } // #818\n"+a)
    open('src/tags.js','w').write(t)
print(818,'prev',prev,'gap',round(g,3))
