# Plan diagram of data/layout.json -> diagram/tag-gallery-plan.{svg,pdf,png}
import json, math, textwrap
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Rectangle, FancyArrow
L = json.load(open('data/layout.json')); R = L['rooms']; H = L['hub']; P = L['paintings']
plt.rcParams['font.family'] = 'DejaVu Sans'; plt.rcParams['svg.fonttype'] = 'none'
pts = [(r['center'][0], r['center'][1], r['radius']) for r in R + [H]] + [(y['center'][0], y['center'][1], y['radius'] * 0.7) for y in L['courtyards']]
x0 = min(x - r for x, z, r in pts) - 3; x1 = max(x + r for x, z, r in pts) + 3; z0 = min(z - r for x, z, r in pts) - 3; z1 = max(z + r for x, z, r in pts) + 3
SIDE = 34  # metres-equivalent width of the full-title index column
W_IN = 84; H_IN = W_IN * (z1 - z0) / (x1 - x0 + SIDE)
fig = plt.figure(figsize=(W_IN, H_IN), dpi=100); ax = fig.add_axes([0, 0, (x1 - x0) / (x1 - x0 + SIDE), 1]); ax.set_xlim(x0, x1); ax.set_ylim(z1, z0); ax.set_aspect('equal'); ax.axis('off')
pal = plt.get_cmap('tab20')
def hexv(c, r): return [(c[0] + r * math.cos(math.radians(30 + 60 * k)), c[1] + r * math.sin(math.radians(30 + 60 * k))) for k in range(6)]
def walls(c, r, doorw, color):
    ap = r * math.sqrt(3) / 2
    for k in range(6):
        th = math.radians(60 * k); n = (math.cos(th), math.sin(th)); t = (-n[1], n[0]); m = (c[0] + ap * n[0], c[1] + ap * n[1])
        segs = [(-r / 2, -0.8), (0.8, r / 2)] if k in doorw else [(-r / 2, r / 2)]
        for a, b in segs: ax.plot([m[0] + a * t[0], m[0] + b * t[0]], [m[1] + a * t[1], m[1] + b * t[1]], color='#222', lw=3, solid_capstyle='butt', zorder=3)
for cdef in L['corridors']:
    (ax_, az), (bx, bz) = cdef['p0'], cdef['p1']; dx, dz = bx - ax_, bz - az; Ln = math.hypot(dx, dz) or 1; nx, nz = -dz / Ln * 0.8, dx / Ln * 0.8
    ax.add_patch(Polygon([(ax_ + nx, az + nz), (bx + nx, bz + nz), (bx - nx, bz - nz), (ax_ - nx, az - nz)], closed=True, fc='#e8dcc0', ec='#222', lw=1.5, zorder=1))
    if cdef['sim'] is not None: ax.text((ax_ + bx) / 2, (az + bz) / 2, f"door\nsim {cdef['sim']:.1f}", ha='center', va='center', fontsize=7, color='#7a5a00', zorder=6)
    else: ax.text((ax_ + bx) / 2, (az + bz) / 2, 'door', ha='center', va='center', fontsize=7, color='#7a5a00', zorder=6)
# honeycomb: every cell at full cell size in hallway colour, so the 2 m colonnade hallways show between cells
from matplotlib.patches import Circle, Wedge
RC = L['spacing'] / math.sqrt(3)
for cc in [r['center'] for r in R] + [H['center']] + [y['center'] for y in L['courtyards']]:
    ax.add_patch(Polygon(hexv(cc, RC), closed=True, fc='#f3ead8', ec='#c9b98f', lw=1, zorder=-1))
for y in L['courtyards']:
    cx, cz = y['center']; ax.add_patch(Polygon(hexv(y['center'], y['radius']), closed=True, fc='#d8efcf', ec='none', zorder=0))
    pr = y['paths']['ring']; ax.add_patch(Wedge((cx, cz), pr['r1'], 0, 360, width=pr['r1'] - pr['r0'], fc='#efe3c2', ec='#b59f6b', lw=1, zorder=1))
    for sp in y['paths']['spokes']:
        dx, dz = sp['x1'] - sp['x0'], sp['z1'] - sp['z0']; Ln = math.hypot(dx, dz); nx, nz = -dz / Ln, dx / Ln
        ax.add_patch(Polygon([(sp['x0'] + nx, sp['z0'] + nz), (sp['x1'] + nx, sp['z1'] + nz), (sp['x1'] - nx, sp['z1'] - nz), (sp['x0'] - nx, sp['z0'] - nz)], closed=True, fc='#efe3c2', ec='#b59f6b', lw=1, zorder=1))
    for bd in y['beds']: ax.add_patch(Circle((bd['x'], bd['z']), bd['r'], fc='#7fb069', ec='#4b7a33', zorder=2))
    f = y['fountain']; ax.add_patch(Circle((f['x'], f['z']), f['r'], fc='#a9d6f5', ec='#2e86c1', lw=2, zorder=2)); ax.add_patch(Circle((f['x'], f['z']), 0.4, fc='#2e86c1', zorder=3))
    vs = hexv(y['center'], (y['radius'] + RC) / 2)
    for k in range(6):
        v0, v1 = vs[k - 1], vs[k]; n = max(1, int(math.dist(v0, v1) / y['colonnade']['columnEvery']))
        for j in range(n + 1): u = j / n; ax.add_patch(Circle((v0[0] + (v1[0] - v0[0]) * u, v0[1] + (v1[1] - v0[1]) * u), 0.22, fc='#6e5d3a', zorder=3))
    ax.text(cx, cz - 5.4, f"OPEN-AIR COURTYARD ({y['id']})\nwalkable: ring path + paths to all 6 colonnades", ha='center', va='center', fontsize=10, color='#2d6a1f', weight='bold', zorder=7)
    ax.text(cx, cz + 2.7, 'fountain', ha='center', va='center', fontsize=8, color='#1b4f72', zorder=7)
for w in L['windows']:
    if w['kind'] == 'hallway-window': ax.plot([w['x']], [w['z']], marker='s', ms=13, mfc='#5dade2', mec='#1b4f72', zorder=9)
# hub
ax.add_patch(Polygon(hexv(H['center'], H['radius']), closed=True, fc='#fff4d6', ec='none', zorder=0)); walls(H['center'], H['radius'], H['doorWalls'], '#222')
ax.text(0, -1.2, 'CENTRAL PAVILION', ha='center', va='center', fontsize=22, weight='bold', zorder=7)
ax.text(0, 0.3, 'Checkout + slipgates to the other galleries · start here', ha='center', va='center', fontsize=11, zorder=7)
ax.add_patch(FancyArrow(0, 1.6, -1.6, 0, width=0.25, head_width=0.7, color='#c0392b', zorder=7)); ax.text(0.3, 1.6, 'START, facing checkout', fontsize=10, color='#c0392b', va='center', zorder=7)
for g in H['gates']:
    col = '#1e8449' if g['id'] == 'checkout' else ('#888' if not g['active'] else '#6c3483')
    tx, tz = -g['iz'], g['ix']; hw = g['width'] / 2
    ax.plot([g['x'] - tx * hw, g['x'] + tx * hw], [g['z'] - tz * hw, g['z'] + tz * hw], color=col, lw=9, solid_capstyle='butt', zorder=5, ls='--' if not g['active'] else '-')
    ax.text(g['x'] + g['ix'] * 2.2, g['z'] + g['iz'] * 2.2, ('CHECKOUT' if g['id'] == 'checkout' else 'GATE:\n' + g['label'].replace(' (', '\n(')), ha='center', va='center', fontsize=10, weight='bold', color=col, zorder=7,
            bbox=dict(fc='white', ec=col, lw=1, pad=2))
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
    ax.text(c[0] + 2.6, c[1] - r['apothem'] * 0.47 + 0.25, f"wall {r['wallColor']}", fontsize=7, va='center', zorder=7); walls(c, r['radius'], r['doorWalls'], '#222')
    mine = sorted([p for p in P if p['room'] == r['id']], key=lambda p: (p['wall'], p['s']))
    ap = r['apothem']
    for n, p in enumerate(mine, 1):
        tx, tz = -p['iz'], p['ix']; hw = p['fw'] / 2
        ax.plot([p['x'] - tx * hw, p['x'] + tx * hw], [p['z'] - tz * hw, p['z'] + tz * hw], color=col, lw=7, solid_capstyle='butt', zorder=4)
        pq = p['plaque']
        if pq: ax.plot([pq['x'] - tx * 0.13, pq['x'] + tx * 0.13], [pq['z'] - tz * 0.13, pq['z'] + tz * 0.13], color='#555', lw=3, solid_capstyle='butt', zorder=4)
        ax.text(p['x'] + p['ix'] * 0.55, p['z'] + p['iz'] * 0.55, str(n), ha='center', va='center', fontsize=7.5, weight='bold', zorder=8, bbox=dict(boxstyle='circle,pad=0.15', fc='white', ec=col, lw=1))
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
    lines = [f"{n:>2}  {p['title'][:28] + ('…' if len(p['title']) > 28 else '')}{'  ~' if p['approxSize'] else ''}  {p['w']*100:.0f}×{p['h']*100:.0f} cm" for (rid, n, p) in idx if rid == r['id']]
    half = (len(lines) + 1) // 2; cols = [lines[:half], lines[half:]]
    for j, colL in enumerate(cols):
        ax.text(c[0] + (-ap * 0.66 if j == 0 else ap * 0.04), c[1] + r['centerpiece']['radius'] + 1.6, '\n'.join(colL), ha='left', va='top', fontsize=5.2, family='DejaVu Sans Mono', zorder=7, linespacing=1.25)
# side index with full titles
ax2 = fig.add_axes([(x1 - x0) / (x1 - x0 + SIDE), 0, SIDE / (x1 - x0 + SIDE), 1]); ax2.axis('off')
S = L['score']
head = ['TJ Murphy tag gallery: plan v2 (prototype, issue #251)', 'Vermillion Aurora Productions', 'Tags are a proposal, not yet approved by TJ.', '',
        f"{L['counts']['paintings']} paintings · {L['counts']['rooms']} rooms + entrance hall · {L['counts']['doors']} doorways · every room has 2+ exits, no dead ends",
        f"Cost = sum(sim x hex distance) + walking term: random mean {S['randomMean']:.0f}, greedy {S['greedy']:.0f}, annealed {S['final']:.0f} (similarity part {S['similarityTermFinal']:.0f}). Walk to pavilion: mean {L['walk']['meanRooms']} m, max {L['walk']['max']} m",
        'Fill = proposed wall color (light tint of the room palette; swatches = dominant painting colors). Dashed circle = clear centerpiece zone (ideas are suggestions). Honeycomb: beige strips = 2 m hallways between all cells; brown dots = colonnade columns along courtyard edges (step out between them). Green hex = walkable open-air courtyard: fountain, ring path, paths out to every colonnade, planting beds in the corners. Blue squares = hallway windows looking into courtyards. Ceilings 6 m in rooms, 4.5 m in halls.', f"Loops: {L['loops']['independentLoopsDoorsOnly']} through doorways, {L['loops']['independentLoopsWithCourtyards']} counting courtyard routes (+{L['loops']['extraLoopsFromCourtyards']}). Blank room-wall segments: {sum(len(v) for v in L['checks']['blankWallSegments'].values())} of {L['checks']['wallSegmentsTotal']}.", 'Red brackets: tight sets (triptychs one row in order; Burning Man Temple 2022 four as a 2x2 grid). Wall markers: coloured bar = painting frame at true width; grey bar = plaque. ~ = estimated size.', '', 'INDEX (room, number, full title, size W x H)']
body = [f"{rid[-2:]}-{n:<3} {p['title']}  ({p['w']*100:.0f}×{p['h']*100:.0f} cm{', est.' if p['approxSize'] else ''})" for rid, n, p in idx]
ax2.text(0.02, 0.995, '\n'.join(head), ha='left', va='top', fontsize=13, transform=ax2.transAxes)
per = (len(body) + 1) // 2
for j in range(2): ax2.text(0.02 + j * 0.49, 0.94, '\n'.join(t[:70] for t in body[j * per:(j + 1) * per]), ha='left', va='top', fontsize=6.6, family='DejaVu Sans Mono', transform=ax2.transAxes, linespacing=1.2)
for ext in ('svg', 'pdf', 'png'): fig.savefig(f'diagram/tag-gallery-plan.{ext}', dpi=100)
print('size px', W_IN * 100, int(H_IN * 100))
