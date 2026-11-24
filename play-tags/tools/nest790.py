#!/usr/bin/env python3
"""#790: wire blend790 on the Bitcoin courtyard outer wall that holds berlin-el-salvador-mural. Idempotent."""
import json
P='src/catalog.json'; C=json.load(open(P)); T=C['layout']['tags']
art=next(a for oc in T['outerCourts'] for a in oc.get('art',[]) if a['id']=='berlin-el-salvador-mural')
assert art.get('room')=='courtyard-btc', art.get('room')
oc=next(o for o in T['openCourts'] if o['id']=='courtyard-btc'); w=oc['walls'][0]
assert w['id']=='courtyard-btc-outer-wall'
w['blend790']='berlin-el-salvador-mural'; assert T['nest']['issue'] in (794,790); T['nest'].update(issue=790,prev=794,blend790=dict(wall=w['id'],art=art['id']))
open(P,'w').write(json.dumps(C,ensure_ascii=False,separators=(',',':'))); print('blend790 ->',w['id'])
