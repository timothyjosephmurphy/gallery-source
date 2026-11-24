# #836: START courtyard - Bosphorus vista811 back (blended, not buried) + day/night tint from clockSunElev. Idempotent.
import json
F='src/fountainIstanbul811.js'; s=open(F).read()
if 'nest836' not in s:
    s=s.replace("import * as THREE from 'three';","import * as THREE from 'three';\nimport { clockSunElev } from './horizon352.js'; // nest836",1)
    old="if (C.behind834) { m.renderOrder = -1000; /* #834 drawn before horizon352 (-900) so mountains paint over it */ } root.add(m);"
    assert old in s
    new=("if (C.behind834) { m.renderOrder = -1000; } else if (C.blend833) { m.renderOrder = C.vistaRO ?? -885; /* #836 just above horizon352 (-900), transparent+no depthWrite = soft blend */ } "
         "{ const day = new THREE.Color(1, 1, 1), nite = new THREE.Color(0.22, 0.27, 0.42), op0 = 1; const U = (window.__ist811 = window.__ist811 || {}); "
         "U.update = () => { const S = window.__ist811S || {}, e = isFinite(S.elev) ? S.elev : (isFinite(S.sunElev) ? S.sunElev : clockSunElev()), t = Math.min(1, Math.max(0, (2 - e) / 8)); "
         "if (U.t === t) return; U.t = t; m.material.color.copy(day).lerp(nite, t); if (m.material.transparent) m.material.opacity = op0 * (1 - 0.35 * t); }; U.mesh = m; U.update(); } root.add(m);")
    s=s.replace(old,new); open(F,'w').write(s)
F='src/courtyard296.js'; s=open(F).read()
if 'nest836' not in s:
    old="if (S.glow358) S.glow358.update(); };"; assert old in s
    s=s.replace(old,"if (S.glow358) S.glow358.update(); if (window.__ist811 && window.__ist811.update) { window.__ist811S = S; window.__ist811.update(); } /* nest836 */ };"); open(F,'w').write(s)
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (835,836)
T['nest'].update(issue=836,prev=835)
for o in T['openCourts']:
    if 'ist811' in o: o['ist811'].pop('behind834',None); o['ist811']['vistaRO']=-885
for o in T['openCourts']:
    if 'vistaD' in o: o.pop('behind834',None); o['vistaRO']=-885
T['note836']='TJ walk fix: START view - Bosphorus vista811 restored (behind834 cleared), blend833 kept, renderOrder -885 over horizon352 (transparent, no depthWrite), day/night tint+opacity from clockSunElev night weight t=clamp((2-elev)/8) via courtyard tick'
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':'))); print('ok')
