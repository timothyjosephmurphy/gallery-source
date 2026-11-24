# #783 (TJ-approved Oct 27 2026): START hex room removed -> open-air START trapezoid courtyard (plan-nest.json "start_courtyard").
# - room 'start' dropped; H11 (room-11) k4 door 7.75 arch -> 1.2 m door at (0,-21.434) -> 'courtyard-start'.
# - openCourts += courtyard-start (no roof, no outer wall: open arrival edge, edge fence from #352).
# - Gallery map -> H4 (room-04) k5 outer face; World/testimonials map -> H6 (room-06) k3 outer face (same spots as before).
# - 6 START-SW overflow works parked (parked777) for the later H11 two-high hang. courtyard-h1 / courtyard-btc untouched.
import json, re
CAT = 'src/catalog.json'; c = json.load(open(CAT)); T = c['layout']['tags']
assert any(r['id'] == 'start' for r in T['rooms']) and len(T['openCourts']) == 2
SC = json.load(open('/workspace/gallery-tj-feedback/hex-plan-honeycomb-nest/plan-nest.json'))['start_courtyard']; V = SC['vertices_m']
T['rooms'] = [r for r in T['rooms'] if r['id'] != 'start']
H = next(r for r in T['rooms'] if r['id'] == 'room-11'); assert H['neighbours']['4'] == 'start'
H['doorWidths']['4'] = 1.2; H['doorOffsets']['4'] = 0.0; H['neighbours']['4'] = 'courtyard-start'
T['sharedWalls'] = [s for s in T['sharedWalls'] if 'start' not in s['rooms']]
PK = T['parked777']; mv = [p for p in c['paintings'] if p['room'] == 'start']; ids = {p['id'] for p in mv}
for p in mv: p['parkedBy'] = '#783 START hex removed (START-SW overflow; awaits H11 two-high hang)'
PK['paintings'] += mv; c['paintings'] = [p for p in c['paintings'] if p['id'] not in ids]
lp = [p for p in T['paintings'] if p['id'] in ids]; PK['layoutPaintings'] += lp; T['paintings'] = [p for p in T['paintings'] if p['id'] not in ids]
PK['note'] += '; #783: 6 START-SW overflow works parked (START hex removed)'
T['openCourts'].append(dict(id='courtyard-start', label='Start Courtyard', poly=V, center=SC['center_m'], radius=8.25, entry=True,
    door=dict(room='room-11', k=4, width=1.2, at=SC['door']['center_m']), walls=[],
    note='#783 open-air START trapezoid between H4 (left: Gallery map) | H11 (door) | H6 (right: World map); outer edge open arrival, hang TBD'))
SP = dict(x=0.0, z=-26.5); c['layout']['start'] = dict(SP, yaw=0.0); T['hub']['start'] = dict(SP, faceAngle=90, note='#783: spawn in the START courtyard facing the H11 Portrait door (north)')
T['nest'].update(issue=783, prev=782, startCourtyard=dict(parked=sorted(ids), door='room-11 k4 1.2 m', maps=dict(map='room-04/5 outer', testi='room-06/3 outer')))
open(CAT, 'w').write(json.dumps(c, ensure_ascii=False, separators=(',', ':')))
S = json.load(open('src/outer-slots.json'))
S['slots']['map'].update(room='room-04', k=5, inside=False); S['slots']['testi'].update(room='room-06', k=3, inside=False)
for o, nk in (('start/2', 'room-04/5o'), ('start/0', 'room-06/3o')):
    w = S['walls'].pop(o); w.update(room=nk.split('/')[0], k=int(nk.split('/')[1][0]), inside=False); S['walls'][nk] = w
S['note'] += '; #783: map/testi on H4/H6 outer faces into the START courtyard'
open('src/outer-slots.json', 'w').write(json.dumps(S, indent=1))
TW = open('src/testimap.js').read(); TW2 = re.sub(r"export const TESTI_WALL = \{[^}]*\}( /\*[^*]*\*/)?", "export const TESTI_WALL = { room: 'room-06', k: 3, inside: false } /* #783 H6 W outer face, into the START courtyard */", TW, count=1)
assert TW2 != TW; open('src/testimap.js', 'w').write(TW2); print('parked', sorted(ids))
