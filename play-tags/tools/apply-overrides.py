# #288: apply src/hang-overrides.json (exclusions + re-hangs) to src/catalog.json. Idempotent: walls are fitted from the
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
# original catalog snapshot (src/catalog.base.json, written on first run), so re-running never compounds.
import json, os, math
B = 'src/catalog.base.json'
if not os.path.exists(B): open(B, 'w').write(open('src/catalog.json').read())
c = json.load(open(B)); O = json.load(open('src/hang-overrides.json'))
R = {p['id']: p for p in c['paintings']}; LP = {p['id']: p for p in c['layout']['tags']['paintings']}
# #299: multi-painting photos split into one frame per shop product (shared list in gallery-core/src/splits.json)
import copy, urllib.request
SPL = json.load(open('/workspace/gallery-core/src/splits.json'))
try: LIVE = {q['id']: q for q in json.load(urllib.request.urlopen(urllib.request.Request('https://tjm.art/checkout/cart/catalog', headers={'User-Agent': 'tjm-gallery-build'}), timeout=30))['products']}
except Exception: LIVE = {}
split_from = []
for sp in SPL['splits']:
    if sp['from'] not in R: continue
    base, lbase = R[sp['from']], LP[sp['from']]; split_from.append(sp['from']); k = 0
    for part in sp['parts']:
        k += 1
        if part.get('existing') or part['id'] in R: continue
        n, ln = copy.deepcopy(base), copy.deepcopy(lbase); live = LIVE.get(part['id'], {})
        n.update(id=part['id'], title=part['title'], url=part['url'], img=part['img'], hi=part['hi'], w=part['w'], h=part['h'], iw=part['w'], ih=part['h'], fw=round(part['w'] + 0.06, 4), fh=round(part['h'] + 0.06, 4),
                 status='available' if live.get('status') == 'available' else 'nfs', price=None, set=None, grid=None, stack=None, splitFrom=sp['from'], approxSize=False)
        ln.update(id=part['id'], w=part['w'], h=part['h'], fw=n['fw'], fh=n['fh'], s=round(ln['s'] + 0.01 * k, 3))
        if ln.get('plaque'): ln['plaque'] = dict(ln['plaque'], s=round(ln['plaque']['s'] + 0.01 * k, 3))
        c['paintings'].append(n); c['layout']['tags']['paintings'].append(ln); R[n['id']] = n; LP[n['id']] = ln
# #323 (TJ, "get rid of the empty courtyard that used to have the common garden mural"): the Cormorant Garden court is removed together with its two outer doors
# (room-03 wall 1, room-12 wall 2), which become plain wall. The Cormorant mural and its plates already hang on an outer wall (#295), so their art records move
# into the Friends court list (they keep their own x/z). Every room keeps its other doors (doorcheck: no dead ends).
_OC = c['layout']['tags']['outerCourts']; _gc = next((o for o in _OC if o['id'] == 'garden-court'), None)
if _gc:
    next(o for o in _OC if o['id'] == 'friends-court')['art'] += _gc['art']; _OC.remove(_gc)
    for _rid, _k in (('room-03', 1), ('room-12', 2)):
        _r = next(r for r in c['layout']['tags']['rooms'] if r['id'] == _rid); _r['doorWalls'] = [x for x in _r['doorWalls'] if x != _k]; (_r.get('doorOffsets') or {}).pop(str(_k), None)
import import309, paulroom
paulroom.add_room(c)  # #310: the Paul Murphy annex room + its door on room-07
NEW309, FLAGS309 = import309.build(c, LP, R, LIVE)
walls = {}
for k, w in O['walls'].items():
    a, b = R[w['fromIds'][0]], R[w['fromIds'][1]]
    sa, sb = a['plaqueAt']['s'] - (LP[a['id']]['plaque']['s'] - LP[a['id']]['s']), None
    sa, sb = LP[a['id']]['s'], LP[b['id']]['s']
    tx, tz = (b['x'] - a['x']) / (sb - sa), (b['z'] - a['z']) / (sb - sa); n = math.hypot(tx, tz); tx, tz = tx / n, tz / n
    walls[k] = dict(room=k.split('/')[0], wall=int(k.split('/')[1]), bx=a['x'] - tx * sa, bz=a['z'] - tz * sa, tx=tx, tz=tz, ix=a['ix'], iz=a['iz'])
import repack as _rp
for rid_, f_ in _rp.FR.items():  # every wall of every room (empty ones too), calibrated on the painting planes
    for wk_, w_ in (f_ or {}).get('walls', {}).items():
        k_ = f'{rid_}/{wk_}'
        if k_ not in walls: walls[k_] = dict(room=rid_, wall=int(wk_), bx=w_['bx'], bz=w_['bz'], tx=w_['iz'], tz=-w_['ix'], ix=w_['ix'], iz=w_['iz'])
for h in O['hang']:
    W = walls[h['wall']]; p, q = R[h['id']], LP[h['id']]
    x, z = W['bx'] + W['tx'] * h['s'], W['bz'] + W['tz'] * h['s']; px, pz = W['bx'] + W['tx'] * h['plaqueS'], W['bz'] + W['tz'] * h['plaqueS']
    for o in (p, q): o.update(room=W['room'], wall=W['wall'], x=round(x, 3), z=round(z, 3), y=h['y'], ix=W['ix'], iz=W['iz'])
    p['cy'] = h.get('cy'); p['stack'] = {'col': h['col'], 'pos': h['pos'], 'n': 2} if h.get('col') else None; p['grid'] = None; q['s'] = h['s']; pl = dict(s=h['plaqueS'], x=round(px, 3), z=round(pz, 3), y=h.get('plaqueY', 1.45), w=0.26, h=0.18)
    p['plaqueAt'] = None if h.get('noPlaque') else dict(pl); q['plaque'] = None if h.get('noPlaque') else dict(pl)
for a in O.get('assets', []):
    p, q = R[a['id']], LP[a['id']]; p.update(**({'img': a['img'], 'hi': a['hi']} if 'img' in a else {}), w=a['w'], h=a['h'], iw=a['w'], ih=a['h'], fw=a['w'] + 0.06, fh=a['h'] + 0.06, photoShape=('img' in a) or p.get('photoShape'))
    q.update(w=a['w'], h=a['h'], fw=a['w'] + 0.06, fh=a['h'] + 0.06)
ex = set(O['exclude']) | set(split_from)
c['paintings'] = [p for p in c['paintings'] if p['id'] not in ex]
import repack, spread
_hung = {h['id'] for h in O['hang']}
# #300: works that a (wider, re-centred) doorway now covers are taken off their wall and re-hung below (own room first)
import math as _m
_R3 = {r['id']: r for r in c['layout']['tags']['rooms']}; DISPLACED = []
for _p in c['paintings']:
    _r = _R3.get(_p.get('room')); _f = repack.FR.get(_p.get('room')) if _r else None
    if not _r or not _f or _p['id'] not in LP or str(_p['wall']) not in _f.get('walls', {}) or str(_p['wall']) not in _r.get('doorOffsets', {}) or int(_p['wall']) not in _r.get('doorWalls', []): continue
    _w = _f['walls'][str(_p['wall'])]; _s = (_p['x'] - _w['bx']) * _w['iz'] + (_p['z'] - _w['bz']) * -_w['ix']; _off = float(_r['doorOffsets'][str(_p['wall'])])
    if abs(_s - _off) < 1.1 + _p['fw'] / 2 + 0.02 + 0.2: DISPLACED.append(_p['id'])
import rows as _rows
_rows.reserve(O.get('rows', [])); _rows.displace(c, O.get('rows', []), DISPLACED)  # #323: whole-wall reserves emptied
PREF300 = {}
for _id in DISPLACED:
    _p = R[_id]; _own = _p['room']; _nb = list((_R3[_own].get('neighbours') or {}).values()); PREF300[_id] = [_own] + [x for x in _nb if x in repack.FR and repack.FR[x]]
    for _o in (_p, LP[_id]): _o['room'] = None; _o['wall'] = None; _o['plaqueAt'] = None if _o is _p else _o.get('plaque'); 
    LP[_id]['plaque'] = None
P309, c['import309'] = spread.place(c, LP, repack.FR, [i for i in NEW309 if i not in _hung], reserve=set(O.get('reserve', [])))
c['import309']['flags'] = FLAGS309
for mv in P309: spread._apply(c, LP, mv, repack.FR)
_left = [i for i in c['import309']['unplaced'] if i not in set(O.get('stayOut', []))] + DISPLACED
if _left:  # relaxed pass: a wall may drop to true size, never overlapping, never in a doorway
    P2, rep2 = spread.place_relaxed(c, LP, repack.FR, _left, pref=PREF300, reserve=set(O.get('reserve', [])))
    for mv in P2: spread._apply(c, LP, mv, repack.FR)
    c['import309']['unplaced'] = rep2['unplaced'] + [i for i in c['import309']['unplaced'] if i in set(O.get('stayOut', []))]; c['import309']['placed300'] = rep2['placed']; c['import309']['displaced300'] = DISPLACED

KEEP_ROWS = _rows.stash(c, LP, O.get('rows', []))  # #323: row members come off the walls until the true-size rows are placed after the repack
_un = set(c['import309']['unplaced'])
c['paintings'] = [p for p in c['paintings'] if p['id'] not in _un]; c['layout']['tags']['paintings'] = [p for p in c['layout']['tags']['paintings'] if p['id'] not in _un]  # not hung: no wall had room
SPREAD, c['spread'] = spread.plan(c, LP, repack.FR, protect=set(O.get('noSpread', [])), reserve=set(O.get('reserve', [])))
for mv in SPREAD: spread._apply(c, LP, mv, repack.FR)
c['repack'] = repack.run(c, LP); c['paintings'] = [p for p in c['paintings'] if p['id'] not in ex]
c['layout']['tags']['paintings'] = [p for p in c['layout']['tags']['paintings'] if p['id'] not in ex]
c['excluded'] = sorted(ex)
c['rows323'] = _rows.place(c, LP, KEEP_ROWS, O.get('rows', []))  # true-size row groups (#318/#319/#320)
NEW310 = paulroom.build(c, LP, R, LIVE); c['paulroom'] = paulroom.place(c, LP)  # after the repack: true size, never rescaled
# final pass (#292): every plaque beside its own painting, at 1.45 m when the final hung painting spans 1.45, else at the painting's centre
for p in c['paintings']:
    q = p.get('plaqueAt')
    if q: fh = p.get('fh') or p['h']; q['y'] = 1.45 if (p['y'] - fh / 2) <= 1.45 <= (p['y'] + fh / 2) else round(p['y'], 3)
# #288 (TJ): Cormorant mural moved into the inner courtyard (court-5 side, between the room rays), at 1.5x (#292) with its plates beside it.
# The Friends Club mural (12.192 x 2.743 m -> 18.29 x 4.11 m at 1.5x) and Neural Dance (6.0 x 3.375 -> 9.0 x 5.06) do not fit and stay put.
for o in c['layout']['tags']['outerCourts']:
    for a in o['art']:
        SL = json.load(open('src/outer-slots.json'))['slots']['cormorant']  # #295: courtyard-facing outer wall (room-10 k3), tools/outerslots.mjs
        F = SL['n']; T = SL['t']; C = SL['mid']
        def at(off, y): return dict(x=round(C[0] + T[0] * off + F[0] * 0.06, 3), z=round(C[1] + T[1] * off + F[1] * 0.06, 3), y=y, wallFacing=F)
        if a['id'] in ('cormorant-presiding-over-sunset-on-puget-sound', 'cormorant-qr-brass-plaque', 'eagle-brass-plaque'): a.pop('wallCenter', None); a.pop('wallLength', None)  # #295: hangs on a real outer wall, no free-standing wall
        if a['id'] == 'cormorant-presiding-over-sunset-on-puget-sound':
            a.update(at(SL['s'], 1.55), w=round(1.524 * 1.5, 3), h=round(1.016 * 1.5, 3), trueW=1.524, trueH=1.016, artScale=1.5, movedBy='#295 outer wall room-10 k3')
        elif a['id'] == 'cormorant-qr-brass-plaque': a.update(at(SL['s'] + 1.4, 1.45))
        elif a['id'] == 'eagle-brass-plaque': a.update(at(SL['s'] + 1.9, 1.45))
# #323 (TJ, "put a teaser of the Friends Club mural in the inner courtyard"): half-size (20 x 4.5 ft) copy of the Friends Club mural, flat on the courtyard-facing outer wall
# of room-04 (wall 0, court-5 side, 8 m straight run, clear floor in front, no door or path), centred on eye level, with a plate that says what it is. The full-size mural stays in the Friends Court.
_SLX = json.load(open('src/outer-slots.json'))['slots']; _fc = next(o for o in c['layout']['tags']['outerCourts'] if o['id'] == 'friends-court')
if not any(a['id'] == 'friends-club-mural-teaser' for a in _fc['art']):
    _fm = copy.deepcopy(next(a for a in _fc['art'] if a['id'] == 'friends-club-mural')); _tp = _SLX['teaser']; _pp = _SLX['teaser-plaque']
    for k in ('wallCenter', 'wallLength', 'freestanding', 'viewFromColonnade'): _fm.pop(k, None)
    _fm.update(id='friends-club-mural-teaser', title='Friends Club mural: half-size teaser (20 x 4.5 ft; the full 40 x 9 ft mural is in the Friends Court)', w=6.096, h=1.3716, trueW=12.192, trueH=2.7432, artScale=0.5, y=1.6,
               x=round(_tp['mid'][0] + _tp['t'][0] * _tp['s'] + _tp['n'][0] * 0.06, 3), z=round(_tp['mid'][1] + _tp['t'][1] * _tp['s'] + _tp['n'][1] * 0.06, 3), wallFacing=_tp['n'], sizeSource='TJ Oct 23: half-size teaser of the 40 x 9 ft Friends Club mural', movedBy='#323')
    _fc['art'].append(_fm)
    _fc['art'].append(dict(id='friends-club-teaser-plaque', kind='brass-plaque', title='Plate: half-size teaser of the Friends Club mural', w=0.8, h=0.5, mountCentreY=1.45, sizeSource='label plate for the teaser', img='assets/friends-club-teaser-plaque.png', tags=['festival', 'friends'],
        x=round(_pp['mid'][0] + _pp['t'][0] * _pp['s'] + _pp['n'][0] * 0.06, 3), z=round(_pp['mid'][1] + _pp['t'][1] * _pp['s'] + _pp['n'][1] * 0.06, 3), y=1.45, onWallOf='friends-club-mural-teaser', wallFacing=_pp['n']))
for _p in c['paintings']:
    if _p['id'] == 'michael-and-katie-in-yelapa': _p['url'] = 'https://tjm.art/products/romance-in-yelapa/'  # fix: Romance in Yelapa product link
c['layout']['start'] = dict(x=4.7, z=3.4, yaw=-2.19)  # #323 (TJ: can't see the checkout portal): spawn 5.8 m out, facing the whole fountain, not 3.2 m beside it
import rd317; rd317.patch(O)  # #317: real image sizes for the replaced images
open('src/catalog.json', 'w').write(json.dumps(c, ensure_ascii=False, separators=(',', ':')))
print('hung', len(O['hang']), 'excluded', sorted(ex), 'paintings', len(c['paintings']))
