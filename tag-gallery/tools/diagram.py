# Plan diagram of data/layout.json -> diagram/tag-gallery-plan.{svg,pdf,png}
import json, math, textwrap
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Rectangle, FancyArrow
L = json.load(open('data/layout.json')); R = L['rooms']; H = L['hub']; P = L['paintings']
plt.rcParams['font.family'] = 'DejaVu Sans'; plt.rcParams['svg.fonttype'] = 'none'
pts = [(r['center'][0], r['center'][1], r['radius']) for r in R + [H]] + [(q['center'][0], q['center'][1], q['radius']) for q in L['outerCourts']]
x0 = min(x - r for x, z, r in pts) - 3; x1 = max(x + r for x, z, r in pts) + 3; z0 = min(z - r for x, z, r in pts) - 3; z1 = max(z + r for x, z, r in pts) + 3
SIDE = 34  # metres-equivalent width of the full-title index column
W_IN = 84; H_IN = W_IN * (z1 - z0) / (x1 - x0 + SIDE)
fig = plt.figure(figsize=(W_IN, H_IN), dpi=100); ax = fig.add_axes([0, 0, (x1 - x0) / (x1 - x0 + SIDE), 1]); ax.set_xlim(x0, x1); ax.set_ylim(z1, z0); ax.set_aspect('equal'); ax.axis('off')
pal = plt.get_cmap('tab20')
def hexv(c, r): return [(c[0] + r * math.cos(math.radians(30 + 60 * k)), c[1] + r * math.sin(math.radians(30 + 60 * k))) for k in range(6)]
def walls(c, r, doorw, color, DOFF=None):
    ap = r * math.sqrt(3) / 2
    for k in range(6):
        th = math.radians(60 * k); n = (math.cos(th), math.sin(th)); t = (-n[1], n[0]); m = (c[0] + ap * n[0], c[1] + ap * n[1])
        o = (DOFF or {}).get(str(k), (DOFF or {}).get(k, 0.0))
        segs = [(-r / 2, o - 0.8), (o + 0.8, r / 2)] if k in doorw else [(-r / 2, r / 2)]
        for a, b in segs: ax.plot([m[0] + a * t[0], m[0] + b * t[0]], [m[1] + a * t[1], m[1] + b * t[1]], color='#222', lw=3, solid_capstyle='butt', zorder=3)
from matplotlib.patches import Circle, Wedge
def strip(p0, p1, w, fc, ec, z=1):
    dx, dz = p1[0] - p0[0], p1[1] - p0[1]; Ln = math.hypot(dx, dz) or 1; nx, nz = -dz / Ln * w / 2, dx / Ln * w / 2
    ax.add_patch(Polygon([(p0[0] + nx, p0[1] + nz), (p1[0] + nx, p1[1] + nz), (p1[0] - nx, p1[1] - nz), (p0[0] - nx, p0[1] - nz)], closed=True, fc=fc, ec=ec, lw=1, zorder=z))
def columns_on_hex(c, r, every, sides=range(6), dia=0.22):
    vs = hexv(c, r)
    for k in sides:
        v0, v1 = vs[k - 1], vs[k]; n = max(1, int(math.dist(v0, v1) / every))
        for j in range(n + 1): u = j / n; ax.add_patch(Circle((v0[0] + (v1[0] - v0[0]) * u, v0[1] + (v1[1] - v0[1]) * u), dia, fc='#6e5d3a', zorder=4))
# open colonnade ground (everything between pavilion, courtyards and rooms is walkable, paved)
ring_r = max(math.hypot(*r['center']) + r['radius'] for r in R)
ax.add_patch(Circle((0, 0), ring_r * 0.62, fc='#f6eedb', ec='none', zorder=-2))
def court(y, label):
    cx, cz = y['center']; ax.add_patch(Polygon(hexv(y['center'], y['radius']), closed=True, fc='#d8efcf', ec='#7fb069', lw=1.2, zorder=0))
    for fp in y['fountainPaths']: ax.add_patch(Wedge((fp['x'], fp['z']), fp['r1'], 0, 360, width=fp['r1'] - fp['r0'], fc='#efe3c2', ec='#b59f6b', lw=1, zorder=1))
    for spk in y['spokes']: strip((spk.get('x0', cx), spk.get('z0', cz)), (spk['x1'], spk['z1']), spk.get('width', 1.4), '#efe3c2', '#b59f6b', 1)
    for bd in y.get('beds', []): ax.add_patch(Circle((bd['x'], bd['z']), bd['r'], fc='#7fb069', ec='#4b7a33', zorder=2))
    for f in y['fountains']: ax.add_patch(Circle((f['x'], f['z']), f['r'], fc='#a9d6f5', ec='#2e86c1', lw=2, zorder=2)); ax.add_patch(Circle((f['x'], f['z']), 0.3, fc='#2e86c1', zorder=3))
    ax.text(cx, cz - y['radius'] * 0.62, label, ha='center', va='center', fontsize=8, color='#2d6a1f', weight='bold', zorder=7)
for y in L['courtyards']:
    court(y, f"COURTYARD {y['id'][-1]}\n(walkable, fountain)"); columns_on_hex(y['center'], y['radius'] + 0.25, y['peristyle']['columnEvery'])
for q in L['outerCourts']:
    court(q, ('FRIENDS COURT' if q['id'] == 'friends-court' else 'GARDEN COURT') + '\n(open-air, walkable, fountain)')
    columns_on_hex(q['center'], q['radius'] - 0.9, 1.8, sides=[(k + 1) % 6 for k in q['colonnadeSides']])  # colonnade along the room walls
    for a in q['art']:
        if a['kind'] == 'mural':
            wc = a['wallCenter']; fx, fz = a['wallFacing']; tx, tz = -fz, fx; hl = a['wallLength'] / 2
            ax.plot([wc[0] - tx * hl, wc[0] + tx * hl], [wc[1] - tz * hl, wc[1] + tz * hl], color='#444', lw=5, solid_capstyle='butt', zorder=5)
            mx_, mz_ = a['x'], a['z']; hw = a['w'] / 2
            ax.plot([mx_ - tx * hw + fx * 0.15, mx_ + tx * hw + fx * 0.15], [mz_ - tz * hw + fz * 0.15, mz_ + tz * hw + fz * 0.15], color='#e67e22', lw=7, solid_capstyle='butt', zorder=6)
            ax.text(mx_ + fx * 1.3, mz_ + fz * 1.3, f"MURAL: {a['title']}\n{a['w']:.2f} × {a['h']:.2f} m true size, freestanding wall {a['wallLength']} m" + ('  [animals]' if 'animals' in a['tags'] else ''),
                    ha='center', va='center', fontsize=8, weight='bold', color='#a04000', zorder=9, bbox=dict(fc='white', ec='#e67e22', lw=1, pad=1.5))
        elif a['kind'] == 'brass-plaque':
            fx, fz = a['wallFacing']; ax.plot([a['x'] + fx * 0.15], [a['z'] + fz * 0.15], marker='D', ms=10, mfc='#d4ac0d', mec='#7d6608', zorder=8)
        elif a['kind'] == 'projection':
            wc = a['wallCenter']; fx, fz = a['wallFacing']; tx, tz = -fz, fx; hl = a['wallLength'] / 2
            ax.plot([wc[0] - tx * hl, wc[0] + tx * hl], [wc[1] - tz * hl, wc[1] + tz * hl], color='#1a5276', lw=7, solid_capstyle='butt', zorder=6)
            ax.text(wc[0] + fx * 1.6, wc[1] + fz * 1.6, f"Neural Dance (live projection)\nscreen {a['w']} × {a['h']} m on a {a['wallLength']} m court wall", ha='center', va='center', fontsize=8, weight='bold', color='#1a5276', zorder=9, bbox=dict(fc='white', ec='#1a5276', lw=1, pad=1.5))
    pl = [a for a in q['art'] if a['kind'] == 'brass-plaque']
    if pl:
        a0 = pl[0]; fx, fz = a0['wallFacing']
        ax.text(a0['x'] + fx * 3.0, a0['z'] + fz * 3.0, 'Brass plaques (gold diamonds), shown at 3x real size, centred 1.45 m (eye height):\n' + '\n'.join(p_['title'] + f"  {p_['w']*100:.0f} x {p_['h']*100:.0f} cm (real {p_['trueSizeIn'][0]} x {p_['trueSizeIn'][1]} in)" + ('  [animals]' if 'animals' in p_['tags'] else '') for p_ in pl),
                ha='center', va='center', fontsize=7, color='#7d6608', zorder=9, bbox=dict(fc='#fef9e7', ec='#d4ac0d', lw=1, pad=1.5))
# pavilion: open column ring on the hex outline, circular walled core with the gates set into it, checkout in the ring walk
ax.add_patch(Polygon(hexv(H['center'], H['radius']), closed=True, fc='#fff4d6', ec='none', zorder=0)); columns_on_hex(H['center'], H['radius'], H['columnRing']['every'], dia=0.28)
rc = H['coreRadius']
for k in range(6):  # core wall arcs between openings at 60k deg (opening 1.6 m)
    half = math.degrees(0.8 / rc)
    th = [math.radians(60 * k + half + (60 - 2 * half) * u / 20) for u in range(21)]
    ax.plot([rc * math.cos(t) for t in th], [rc * math.sin(t) for t in th], color='#222', lw=4, zorder=5)
ax.text(0, -0.6, 'CENTRAL PAVILION', ha='center', va='center', fontsize=15, weight='bold', zorder=7)
ax.text(0, 0.4, 'circular core: gates in the wall', ha='center', va='center', fontsize=8, zorder=7)
ax.add_patch(FancyArrow(0, 1.3, 1.6, 0, width=0.2, head_width=0.6, color='#c0392b', zorder=7)); ax.text(-0.2, 2.0, 'START (facing checkout)', fontsize=7, color='#c0392b', ha='center', zorder=7)
for g in H['gates']:
    if g['id'] == 'checkout':
        ax.add_patch(Rectangle((g['x'] - 0.5, g['z'] - 0.9), 1.0, 1.8, fc='#1e8449', ec='#0b5345', zorder=6))
        ax.text(g['x'] + 1.3, g['z'] + 2.4, 'CHECKOUT\n(ring walk, seen\nfrom the start)', ha='center', va='center', fontsize=8, weight='bold', color='#1e8449', zorder=9, bbox=dict(fc='white', ec='#1e8449', lw=1, pad=1.5))
        continue
    col = '#888' if not g['active'] else '#6c3483'; a = math.radians(g['angle'])
    th = [a - 0.2 + 0.4 * u / 10 for u in range(11)]
    ax.plot([rc * math.cos(t) for t in th], [rc * math.sin(t) for t in th], color=col, lw=9, zorder=6, ls='--' if not g['active'] else '-')
    ax.text(rc * 0.55 * math.cos(a), rc * 0.55 * math.sin(a), g['label'].replace(' (', '\n('), ha='center', va='center', fontsize=6.5, weight='bold', color=col, zorder=9)
# rooms
idx = []
for ri, r in enumerate(R):
    c = r['center']; col = pal(ri % 20)
    ax.add_patch(Polygon(hexv(c, r['radius']), closed=True, fc=r['wallColor'], ec='none', zorder=0))
    cp = r['centerpiece']; from matplotlib.patches import Circle
    ax.add_patch(Circle((cp['x'], cp['z']), cp['radius'], fc='white', ec='#2c3e50', lw=1.5, ls='--', zorder=2))
    ax.text(cp['x'], cp['z'], 'centerpiece\nzone', ha='center', va='center', fontsize=6.5, color='#2c3e50', zorder=7)
    ax.text(cp['x'], cp['z'] + cp['radius'] + 0.35, 'Suggestion: ' + cp['suggestion'], ha='center', va='top', fontsize=7.5, style='italic', color='#2c3e50', zorder=7)
    for j, sw in enumerate(r['palette']):
        ax.add_patch(Rectangle((c[0] - 2.5 + j * 1.0, c[1] - r['apothem'] * 0.47), 0.9, 0.5, fc=sw, ec='#333', lw=0.6, zorder=7))
    ax.text(c[0] + 2.6, c[1] - r['apothem'] * 0.47 + 0.25, f"wall {r['wallColor']}", fontsize=7, va='center', zorder=7); walls(c, r['radius'], r['doorWalls'], '#222', r.get('doorOffsets'))
    mine = sorted([p for p in P if p['room'] == r['id']], key=lambda p: (p['wall'], p['s']))
    ap = r['apothem']
    for n, p in enumerate(mine, 1):
        tx, tz = -p['iz'], p['ix']; hw = p['fw'] / 2
        ax.plot([p['x'] - tx * hw, p['x'] + tx * hw], [p['z'] - tz * hw, p['z'] + tz * hw], color=col, lw=7, solid_capstyle='butt', zorder=4)
        pq = p['plaque']
        if pq: ax.plot([pq['x'] - tx * 0.13, pq['x'] + tx * 0.13], [pq['z'] - tz * 0.13, pq['z'] + tz * 0.13], color='#555', lw=3, solid_capstyle='butt', zorder=4)
        ax.text(p['x'] + p['ix'] * 0.55, p['z'] + p['iz'] * 0.55, str(n), ha='center', va='center', fontsize=7.5, weight='bold', zorder=8, bbox=dict(boxstyle='circle,pad=0.15', fc='white', ec=col, lw=1))
        if 'animals' in p['tags']: ax.plot([p['x'] + p['ix'] * 1.05], [p['z'] + p['iz'] * 1.05], marker='^', ms=9, mfc='#e67e22', mec='#784212', zorder=9)
        idx.append((r['id'], n, p))
    for sname in {p['set'] for p in mine if p.get('set')}:
        ms = [p for p in mine if p['set'] == sname]; xs = [p['x'] for p in ms]; zs = [p['z'] for p in ms]; ix, iz = ms[0]['ix'], ms[0]['iz']
        a = min(ms, key=lambda p: p['s']); b = max(ms, key=lambda p: p['s']); tx, tz = -ix, iz * 0 + ms[0]['ix']; tx, tz = -ms[0]['iz'], ms[0]['ix']
        p0 = (a['x'] - tx * a['fw'] / 2 + ix * 1.1, a['z'] - tz * a['fw'] / 2 + iz * 1.1); p1 = (b['x'] + tx * b['fw'] / 2 + ix * 1.1, b['z'] + tz * b['fw'] / 2 + iz * 1.1)
        ax.plot([p0[0], p1[0]], [p0[1], p1[1]], color='#c0392b', lw=2.5, zorder=8)
        grid = any(p.get('grid') for p in ms)
        desc = ('2x2 GRID, one wall: top ' + ', '.join(p['title'].split(': ')[-1] for p in ms if p['grid']['row'] == 0) + ' / bottom ' + ', '.join(p['title'].split(': ')[-1] for p in ms if p['grid']['row'] == 1)) if grid else ('SET, one row in order: ' + ' > '.join(f"#{p['setPos']}" for p in sorted(ms, key=lambda p: p['s'])))
        ax.text((p0[0] + p1[0]) / 2 + ix * 0.9, (p0[1] + p1[1]) / 2 + iz * 0.9, desc, ha='center', va='center', fontsize=8, color='#c0392b', weight='bold', zorder=9, bbox=dict(fc='white', ec='#c0392b', lw=1, pad=1.5))
    # label block
    comb = ', '.join(f"{L['tags'][t].get('label', t)} ({k})" for t, k in r['combines'].items())
    ax.text(c[0], c[1] - ap * 0.72, f"{r['id'].upper()}\n{r['label']}", ha='center', va='center', fontsize=12, weight='bold', zorder=7, wrap=True)
    ax.text(c[0], c[1] - ap * 0.66, f"{r['count']} paintings · hex side {r['radius']:.2f} m · {len(r['doorWalls'])} doorways · {r['walkToPavilion']:.0f} m to pavilion", ha='center', va='center', fontsize=10, zorder=7)
    ax.text(c[0], c[1] - ap * 0.6, '\n'.join(textwrap.wrap('Combines: ' + comb, 70)), ha='center', va='top', fontsize=8, color='#333', zorder=7)
    lines = [f"{n:>2}  {p['title'][:28] + ('…' if len(p['title']) > 28 else '')}{'  ~' if p['approxSize'] else ''}{' [A]' if 'animals' in p['tags'] else ''}  {p['w']*100:.0f}×{p['h']*100:.0f} cm" for (rid, n, p) in idx if rid == r['id']]
    half = (len(lines) + 1) // 2; cols = [lines[:half], lines[half:]]
    for j, colL in enumerate(cols):
        ax.text(c[0] + (-ap * 0.66 if j == 0 else ap * 0.04), c[1] + r['centerpiece']['radius'] + 1.6, '\n'.join(colL), ha='left', va='top', fontsize=5.2, family='DejaVu Sans Mono', zorder=7, linespacing=1.25)
# side index with full titles
ax2 = fig.add_axes([(x1 - x0) / (x1 - x0 + SIDE), 0, SIDE / (x1 - x0 + SIDE), 1]); ax2.axis('off')
S = L['score']
import textwrap as _tw
_lines = ['TJ Murphy tag gallery: plan v4 (prototype, issue #251)', 'Vermillion Aurora Productions', 'Tags are a proposal, not yet approved by TJ.', '',
    f"{L['counts']['paintings']} paintings · 12 rooms (sized to their paintings) · central pavilion · 6 walkable courtyards",
    f"Cost = sum(sim x hex distance) + walking term: random mean {S['randomMean']:.0f}, greedy {S['greedy']:.0f}, annealed {S['final']:.0f} (similarity part {S['similarityTermFinal']:.0f}).",
    f"Walk to pavilion (room centre to pavilion centre): mean {L['walk']['meanRooms']} m, max {L['walk']['max']} m.",
    f"Loops: {L['loops']['independentLoopsWithoutCourtyardPaths']} via doors and colonnades, {L['loops']['independentLoopsWithCourtyardPaths']} counting courtyard paths (+{L['loops']['extraLoopsFromCourtyards']}). Dead ends: {len(L['loops']['deadEnds'])}. Every room has {L['checks']['minExits']}+ doors.",
    f"Blank room-wall segments: {sum(len(v) for v in L['checks']['blankWallSegments'].values())} of {L['checks']['wallSegmentsTotal']}. Overlaps: {len(L['checks']['overlaps'])}. All at true size.",
    'Fill = proposed wall colour (light tint of the room palette; swatches = dominant painting colours). Dashed circle = clear centerpiece zone (ideas are suggestions only).',
    'Light green band = planted terrace between each room and its cell outline. Tan strips with brown dots = open colonnades (columns on both sides): across each courtyard from a pavilion door, around the pavilion, between courtyards and along courtyard edges. Blue squares = colonnade views into courtyards.',
    'Courtyards: two fountains each (either side of the crossing colonnade), ring paths, paths out to every colonnade, planting beds in the corners. Ceilings 6 m in rooms, 4.5 m in colonnades.',
    'Red brackets: tight sets (triptychs in one row in order; Burning Man Temple 2022 four as a 2x2 grid). Wall markers: coloured bar = painting frame at true width; grey bar = plaque. ~ = estimated size.', '', 'INDEX (room, number, full title, size W x H)']
head = [x for l in _lines for x in (_tw.wrap(l, 110) or [''])]
body = [f"{rid[-2:]}-{n:<3} {p['title']}  ({p['w']*100:.0f}×{p['h']*100:.0f} cm{', est.' if p['approxSize'] else ''}){'  [animals]' if 'animals' in p['tags'] else ''}" for rid, n, p in idx]
ax2.text(0.02, 0.995, '\n'.join(head), ha='left', va='top', fontsize=13, transform=ax2.transAxes)
per = (len(body) + 1) // 2
for j in range(2): ax2.text(0.02 + j * 0.49, 0.85, '\n'.join(t[:70] for t in body[j * per:(j + 1) * per]), ha='left', va='top', fontsize=6.6, family='DejaVu Sans Mono', transform=ax2.transAxes, linespacing=1.2)
for ext in ('svg', 'pdf', 'png'): fig.savefig(f'diagram/tag-gallery-plan.{ext}', dpi=100)
print('size px', W_IN * 100, int(H_IN * 100))
