# #780 (TJ via Studio manager, Oct 27 2026): H1 courtyard Friends Club mural on a 40 ft high-cube SHIPPING CONTAINER, pines behind,
# NO plinth (open courts are egg/prop-free, see tags.js OPEN780). Patches LIVE #779 (/tmp/pre780/catalog.json). START untouched.
import json
CAT = 'src/catalog.json'; c = json.load(open(CAT)); T = c['layout']['tags']
assert T['nest']['issue'] == 779 and len(T['openCourts']) == 1
oc = T['openCourts'][0]; w = oc['walls'][0]; assert oc['id'] == 'courtyard-h1' and w['id'] == 'courtyard-outer-wall'
L, D, H, LIFT = 12.192, 2.438, 2.896, 0.1  # 40 ft x 8 ft x 9'6" high-cube, on sleepers
w['container'] = dict(art='friends-club-mural', len=L, depth=D, height=H, lift=LIFT, color='light blue corrugated', ref='gallery-tj-feedback/bitcoin-mural-court/container-far.png')
A = {a['id']: a for a in T['outerCourts'][0]['art']}
fc = A['friends-club-mural']; assert abs(fc['w'] - 12.192) < 1e-3 and abs(fc['h'] - 2.7432) < 1e-3
fc['y'] = round(LIFT + H / 2, 3); fc['movedBy'] = '#780 on the container side (true size 12.192 x 2.743, centred on the 2.896 m high-cube)'
fb = A['friends-club-brass-plaque']; face = 28.579
fb.update(x=-7.08, z=26.672, y=1.45, wallFacing=[0.866, 0.5], movedBy='#780 H12 NE outer face beside the Cormorant plate, nearest the container (the container side is all mural; its ends are outside the court)')
T['nest']['issue'] = 780; T['nest']['prev'] = 779; T['nest']['container780'] = dict(court='courtyard-h1', container=[L, D, H], mural_y=fc['y'], plinth='removed (no eggs in open courts)', trees='pine treeline behind')
open(CAT, 'w').write(json.dumps(c, ensure_ascii=False, separators=(',', ':')))
print(fc['y'], fb['x'], fb['z'])
