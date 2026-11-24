# #335 per-room BRASS story plates with Art Deco relief (motifs from art-deco-style-guide.png).
# Base = story-plate-brass(.webp/_n/_r) from make_plates.py. Deco lives ONLY in the border / corner / side / bottom bands;
# the text rect (x 96..928, y 88..552 @1024x640, text_rect_uv u .09375-.90625 v .1375-.8625) is kept clear (+8 px guard).
import numpy as np, json, math
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter
W, H, S = 1024, 640, 3                    # draw supersampled x3
TX0, TY0, TX1, TY1 = 96, 88, 928, 552; G = 3; WM = 1.7   # WM = relief line weight multiplier
SCREWS = [(52, 52), (W - 53, 52), (52, H - 53), (W - 53, H - 53)]

class Deco:
    def __init__(s):
        s.r = Image.new('L', (W * S, H * S)); s.d = ImageDraw.Draw(s.r)      # raised (polished relief)
        s.c = Image.new('L', (W * S, H * S)); s.e = ImageDraw.Draw(s.c)      # recessed field (engraved panel)
    P = staticmethod(lambda pts: [(x * S, y * S) for x, y in pts])
    def line(s, pts, w=1.6): s.d.line(s.P(pts), fill=255, width=max(1, round(w * WM * S)), joint='curve')
    def arc(s, cx, cy, r, a0, a1, w=1.6):    # degrees, PIL convention (0 = +x, clockwise / y down)
        s.d.arc([(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S], a0, a1, fill=255, width=max(1, round(w * WM * S)))
    def dot(s, x, y, r): s.d.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=255)
    def poly(s, pts, w=1.6): s.line(pts + [pts[0]], w)
    def panel(s, pts): s.e.polygon(s.P(pts), fill=255)
    def pie_panel(s, cx, cy, r, a0, a1): s.e.pieslice([(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S], a0, a1, fill=255)
    def disc_panel(s, cx, cy, r): s.e.ellipse([(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S], fill=255)

pol = lambda cx, cy, r, a: (cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a)))

# ---------- motifs (geometric Deco, after the guide) ----------
def sunburst(D, cx, cy, r, a0=180, a1=360, n=15, base=True):
    D.pie_panel(cx, cy, r, a0, a1)
    for k in range(n + 1):
        a = a0 + (a1 - a0) * k / n; D.line([pol(cx, cy, r * 0.32, a), pol(cx, cy, r * (0.98 if k % 2 == 0 else 0.8), a)], 1.6)
    D.arc(cx, cy, r * 0.3, a0, a1, 2.2); D.arc(cx, cy, r, a0, a1, 1.8); D.arc(cx, cy, r * 0.2, a0, a1, 1.4)
    for k in range(n):                       # stepped-ray tips between the long rays
        a = a0 + (a1 - a0) * (k + 0.5) / n; D.dot(*pol(cx, cy, r * 0.9, a), 1.2)
    if base:                                  # stepped ziggurat base like the guide's gold sunburst
        for i, (hw, y) in enumerate([(r * 1.05, 0), (r * 0.8, -5), (r * 0.55, -10)]):
            D.line([(cx - hw, cy + y), (cx + hw, cy + y)], 2.0)

def fan(D, cx, cy, r, a0, a1, n=9, scallop=True):
    D.pie_panel(cx, cy, r, a0, a1)
    for k in range(n + 1):
        a = a0 + (a1 - a0) * k / n; D.line([(cx, cy), pol(cx, cy, r, a)], 1.4)
    D.arc(cx, cy, r, a0, a1, 2.0); D.arc(cx, cy, r * 0.62, a0, a1, 1.4); D.arc(cx, cy, r * 0.25, a0, a1, 2.2)
    if scallop:                               # scalloped rim between ribs (Deco fan edge)
        for k in range(n):
            a = a0 + (a1 - a0) * (k + 0.5) / n; px, py = pol(cx, cy, r, a); D.arc(px, py, r * math.radians((a1 - a0) / n) * 0.52, a + 90 - 180, a + 90, 1.3) if False else None

def scallop_shell(D, cx, cy, r, n=11):        # upright shell: ribs radiating from the hinge + fluted rim
    D.pie_panel(cx, cy, r, 180, 360)
    for k in range(n + 1):
        a = 180 + 180 * k / n; D.line([(cx, cy), pol(cx, cy, r * 0.97, a)], 1.5)
    for k in range(n):
        a = 180 + 180 * (k + 0.5) / n; px, py = pol(cx, cy, r * 0.97, a); rr = r * math.sin(math.radians(90 / n)) * 1.02
        D.arc(px, py, rr, a - 90, a + 90, 1.6)
    D.line([(cx - r * 0.32, cy), (cx + r * 0.32, cy)], 2.2); D.arc(cx, cy, r * 0.22, 180, 360, 1.6)

def scallop_row(D, x0, x1, y, h, up=True):    # fish-scale row: arches with an inner arch and a centre rib
    w = h * 2; n = max(1, int((x1 - x0) // w)); off = (x1 - x0 - n * w) / 2
    for i in range(n):
        cx = x0 + off + w * i + h; a0, a1 = (180, 360) if up else (0, 180)
        D.arc(cx, y, h, a0, a1, 1.6); D.arc(cx, y, h * 0.6, a0, a1, 1.2); D.line([(cx, y), (cx, y - h * 0.95 if up else y + h * 0.95)], 1.1)

def waves(D, x0, x1, y, h):                   # seigaiha-style nested semicircles (guide WAVES, blue/gold)
    w = h * 2; n = max(1, int((x1 - x0) // w)); off = (x1 - x0 - n * w) / 2
    for i in range(n):
        cx = x0 + off + w * i + h
        for f in (1.0, 0.72, 0.44): D.arc(cx, y, h * f, 180, 360, 1.5)
    D.line([(x0 + off, y), (x1 - off, y)], 1.6)

def wave_band_v(D, x, y0, y1, h):             # vertical stack of stepped wave crests (side bands)
    n = int((y1 - y0) // (h * 1.6))
    for i in range(n):
        cy = y0 + h * 0.8 + i * h * 1.6
        for f in (1.0, 0.6): D.arc(x, cy, h * f, 0, 180, 1.4)

def clouds(D, x0, x1, y, h):                  # Deco cloud: stacked lobes with curled ends + streamlines
    w = h * 4.2; n = max(1, int((x1 - x0) // w)); off = (x1 - x0 - n * w) / 2
    for i in range(n):
        cx = x0 + off + w * i + w / 2
        D.arc(cx, y, h, 180, 360, 1.7); D.arc(cx, y, h * 0.62, 180, 360, 1.3)
        D.arc(cx - h * 1.25, y, h * 0.55, 180, 360, 1.5); D.arc(cx + h * 1.25, y, h * 0.55, 180, 360, 1.5)
        D.arc(cx - h * 1.25, y, h * 0.25, 180, 360, 1.2); D.arc(cx + h * 1.25, y, h * 0.25, 180, 360, 1.2)
        D.arc(cx - h * 1.8 - h * 0.18, y, h * 0.18, 0, 180, 1.2); D.arc(cx + h * 1.8 + h * 0.18, y, h * 0.18, 0, 180, 1.2)  # curls
    D.line([(x0 + off, y), (x1 - off, y)], 1.6); D.line([(x0 + off + 10, y + 5), (x1 - off - 10, y + 5)], 1.0)

def cloud_corner(D, cx, cy, r, sx, sy):       # spiral cloud curl in a corner
    for f in (1.0, 0.66, 0.36): D.arc(cx, cy, r * f, *((180, 360) if sy > 0 else (0, 180)), 1.5)
    D.line([(cx - r * 1.3 * sx, cy), (cx + r * 1.3 * sx, cy)], 1.4)

def chevron_band(D, x0, x1, y, h, k=3, step=None):    # nested zigzags
    step = step or h * 1.2
    for j in range(k):
        yy = y + j * (h / (k)) * 1.0; pts = []; x = x0; up = True
        while x <= x1 + 1: pts.append((x, yy - h / 2 if up else yy + h / 2 - h * 0.35)); x += step / 2; up = not up
        D.line([(min(p[0], x1), p[1]) for p in pts], 1.5)

def chevron_v(D, x, y0, y1, w, step=26):     # stacked V chevrons in a side band (pointing down)
    y = y0
    while y + w * 0.6 < y1:
        D.line([(x - w / 2, y), (x, y + w * 0.45), (x + w / 2, y)], 1.6); D.line([(x - w / 4, y + 4), (x, y + w * 0.45 - 6), (x + w / 4, y + 4)], 1.1); y += step

def chevron_crest(D, cx, y, w, h, k=4):       # nested ^ peaks (crest)
    for j in range(k):
        f = 1 - j * 0.22; D.line([(cx - w * f / 2, y), (cx, y - h * f), (cx + w * f / 2, y)], 1.8 if j == 0 else 1.3)
    D.panel([(cx - w / 2, y), (cx, y - h), (cx + w / 2, y)])

def palm(D, cx, cy, r, a0, a1, n=7):          # palm-leaf fan: pointed leaves with midribs from a base point
    for k in range(n):
        a = a0 + (a1 - a0) * (k + 0.5) / n; tip = pol(cx, cy, r, a); half = (a1 - a0) / n * 0.42
        l1 = pol(cx, cy, r * 0.62, a - half); l2 = pol(cx, cy, r * 0.62, a + half)
        D.line([(cx, cy), l1, tip, l2, (cx, cy)], 1.4); D.line([(cx, cy), tip], 1.0)
        D.panel([(cx, cy), l1, tip, l2])

def palm_v(D, x, y0, y1, w):                  # vertical palm frond: spine + paired pointed leaflets
    D.line([(x, y0), (x, y1)], 1.6); y = y0 + 10
    while y < y1 - 8:
        D.line([(x, y), (x - w / 2, y + 12), (x, y + 6)], 1.2); D.line([(x, y), (x + w / 2, y + 12), (x, y + 6)], 1.2); y += 16

def peacock(D, cx, cy, r, n=7):               # tiered rows of pointed arches with eye dots (guide PEACOCK)
    D.pie_panel(cx, cy, r, 180, 360)
    for tier, f in enumerate((1.0, 0.71, 0.43)):
        m = n - tier * 2; fi = f - 0.27
        for k in range(m):
            a = 180 + 180 * (k + 0.5) / m; d = 90 / m * 0.92
            D.line([pol(cx, cy, r * fi, a - d), pol(cx, cy, r * (f - 0.06), a - d * 0.35), pol(cx, cy, r * f, a), pol(cx, cy, r * (f - 0.06), a + d * 0.35), pol(cx, cy, r * fi, a + d)], 1.3)
            D.dot(*pol(cx, cy, r * (f - 0.13), a), 2.2 if tier == 0 else 1.7)
        D.arc(cx, cy, r * fi, 180, 360, 1.0)
    D.line([(cx - r, cy), (cx + r, cy)], 1.8)

def feather_v(D, x, y0, y1, w):               # stacked pointed feathers (guide FEATHER): ogive outline + spine + barbs
    hgt = w * 1.5; y = y0
    while y + hgt <= y1:
        top, bot = y, y + hgt
        L = [(x, top)] + [(x - w / 2 * math.sin(math.pi * t), top + hgt * t) for t in np.linspace(0.08, 1, 8)]
        R = [(x + w / 2 * math.sin(math.pi * t), top + hgt * t) for t in np.linspace(1, 0.08, 8)]
        D.line(L + R[::-1][::-1] + [(x, top)], 1.3); D.line([(x, top + 4), (x, bot)], 1.0)
        for t in (0.3, 0.5, 0.7): D.line([(x, top + hgt * t), (x - w * 0.32, top + hgt * (t + 0.12))], 0.9); D.line([(x, top + hgt * t), (x + w * 0.32, top + hgt * (t + 0.12))], 0.9)
        y += hgt * 0.82

def feather_crest(D, cx, cy, r, n=5):         # fan of feathers rising from a point
    for k in range(n):
        a = 200 + 140 * (k + 0.5) / n; tip = pol(cx, cy, r, a); l = pol(cx, cy, r * 0.55, a - 9); rr = pol(cx, cy, r * 0.55, a + 9)
        D.line([(cx, cy), l, tip, rr, (cx, cy)], 1.4); D.line([(cx, cy), tip], 1.0); D.panel([(cx, cy), l, tip, rr])

def volute(D, cx, cy, r, sx, sy, turns=2.2):  # Archimedean scroll (guide VOLUTE), opening toward the plate edge
    pts = []
    for t in np.linspace(0, turns * 2 * math.pi, 90):
        rr = r * (1 - t / (turns * 2 * math.pi) * 0.85); pts.append((cx + sx * rr * math.cos(t), cy + sy * rr * math.sin(t)))
    D.line(pts, 1.6); D.dot(cx, cy, 2.2)
    D.line([(cx + sx * r, cy), (cx + sx * r, cy + sy * r * 1.6)], 1.4)      # tail running along the border

def fountain(D, cx, by, w, h):                # stepped skyscraper fountain (guide FOUNTAIN): tiers + jets + arc
    D.panel([(cx - w / 2, by), (cx - w / 2, by - h * 0.35), (cx - w * 0.3, by - h * 0.35), (cx - w * 0.3, by - h * 0.65), (cx - w * 0.12, by - h * 0.65), (cx, by - h), (cx + w * 0.12, by - h * 0.65), (cx + w * 0.3, by - h * 0.65), (cx + w * 0.3, by - h * 0.35), (cx + w / 2, by - h * 0.35), (cx + w / 2, by)])
    for f, t in ((0.5, 0.35), (0.3, 0.65), (0.12, 0.85)): D.line([(cx - w * f, by), (cx - w * f, by - h * t), (cx + w * f, by - h * t), (cx + w * f, by)], 1.5)
    for k in (-2, -1, 0, 1, 2): D.line([(cx + k * w * 0.05, by - 2), (cx + k * w * 0.05, by - h * (0.95 - abs(k) * 0.12))], 1.1)
    for k in (-1, 1): D.arc(cx + k * w * 0.2, by - h * 0.65, w * 0.2, 180 if k < 0 else 270, 270 if k < 0 else 360, 1.2)
    D.dot(cx, by - h, 2.4)

def fin_stack(D, x, y, w, n=5, sx=1):         # aircraft fins: stacked rounded horizontal blades stepping out (guide AIRCRAFT FIN)
    for i in range(n):
        L = w * (1 - i * 0.14); yy = y + i * 9
        D.line([(x, yy), (x + sx * L, yy), (x + sx * (L + 4), yy + 3), (x + sx * L, yy + 6), (x, yy + 6)], 1.4)
        D.panel([(x, yy), (x + sx * L, yy), (x + sx * (L + 4), yy + 3), (x + sx * L, yy + 6), (x, yy + 6)])

def stepped_corner(D, cx, cy, sx, sy, n=4, s=9):  # ziggurat step corner
    pts = [(cx, cy + sy * n * s)]
    for i in range(n): pts += [(cx + sx * i * s, cy + sy * (n - i) * s), (cx + sx * (i + 1) * s, cy + sy * (n - i) * s)]
    pts.append((cx + sx * n * s, cy)); D.line(pts, 1.4)

# ---------- room layouts: crest (top centre, y < 84), bottom frieze (y > 560), side bands (x < 88 / > 936), corners ----------
TOPC, BOTY, SIDEL, SIDER = W / 2, 600, 66, W - 67
def corners(fn): [fn(cx, cy, 1 if cx < W / 2 else -1, 1 if cy < H / 2 else -1) for cx, cy in SCREWS]
def fan_corner(D, r=36):  corners(lambda cx, cy, sx, sy: fan(D, cx, cy, r, *({(1, 1): (0, 90), (-1, 1): (90, 180), (-1, -1): (180, 270), (1, -1): (270, 360)}[(sx, sy)]), n=6))
def sun_corner(D, r=34):  corners(lambda cx, cy, sx, sy: sunburst(D, cx, cy, r, *({(1, 1): (0, 90), (-1, 1): (90, 180), (-1, -1): (180, 270), (1, -1): (270, 360)}[(sx, sy)]), n=6, base=False))
def scal_corner(D, r=34): corners(lambda cx, cy, sx, sy: [D.arc(cx, cy, r * f, *({(1, 1): (0, 90), (-1, 1): (90, 180), (-1, -1): (180, 270), (1, -1): (270, 360)}[(sx, sy)]), 1.5) for f in (1, .75, .5)])
def vol_corner(D, r=15):  corners(lambda cx, cy, sx, sy: volute(D, cx + sx * 30, cy + sy * 2, r, sx, sy))
def step_corner(D):       corners(lambda cx, cy, sx, sy: stepped_corner(D, cx + sx * 16, cy + sy * 16, sx, sy))
def cloud_corner4(D):     corners(lambda cx, cy, sx, sy: cloud_corner(D, cx + sx * 34, cy + sy * 12, 14, sx, sy))
def crest_panel(D, w, h=62): D.panel([(TOPC - w / 2, 84), (TOPC - w / 2 + 10, 84 - h * 0.1), (TOPC + w / 2 - 10, 84 - h * 0.1), (TOPC + w / 2, 84)])

ROOMS = {
 '01': ('SUNBURST', 'CLOUDS'),  '02': ('CHEVRON', 'FAN'), '03': ('PALM LEAF', 'SCALLOP', 'SUNBURST'), '04': ('FAN', 'PEACOCK', 'WAVES'),
 '05': ('VOLUTE', 'SCALLOP'),   '06': ('FEATHER', 'PEACOCK', 'FAN'), '07': ('AIRCRAFT FIN', 'CHEVRON'), '08': ('WAVES', 'PALM LEAF', 'SUNBURST'),
 '09': ('SUNBURST', 'WAVES', 'CLOUDS'), '10': ('FOUNTAIN', 'CHEVRON'), '11': ('FEATHER', 'VOLUTE'), '12': ('CLOUDS', 'WAVES', 'CHEVRON')}
LAYOUT = {  # what goes where (combination logic per room, also written to story-plates.json)
 '01': 'crest: rising SUNBURST over a stepped horizon; bottom: CLOUDS frieze; corners: quarter sunbursts',
 '02': 'crest: FAN; sides: stacked CHEVRONS; bottom: CHEVRON zigzag frieze; corners: quarter fans',
 '03': 'crest: SUNBURST flanked by PALM LEAF fans; sides: palm fronds; bottom: SCALLOP row; corners: scallop quarters',
 '04': 'crest: PEACOCK tail; corners: FANS; bottom: WAVES frieze',
 '05': 'crest: SCALLOP shell; corners: VOLUTE scrolls; bottom: scallop row',
 '06': 'crest: PEACOCK tail; sides: FEATHER stacks; corners: FANS',
 '07': 'sides: AIRCRAFT FIN stacks; crest: nested CHEVRON peaks; bottom: chevron frieze; corners: ziggurat steps',
 '08': 'crest: SUNBURST rising from WAVES; sides: PALM fronds; bottom: waves frieze',
 '09': 'crest: half SUNBURST setting into WAVES; bottom: waves; corners: CLOUD curls',
 '10': 'crest: stepped FOUNTAIN with jets; sides: stacked CHEVRONS; bottom: low fountain tiers; corners: ziggurat steps (no fins, unlike 07)',
 '11': 'crest: FEATHER fan; sides: feather stacks; corners: VOLUTE scrolls',
 '12': 'crest: CLOUDS; bottom: WAVES frieze; sides: stacked CHEVRONS (rain)'}
FX0, FX1 = 104, W - 104; BB = 628          # bottom frieze baseline (band y 556..630)
SB = (112, 528)                              # side band y range
def room(D, k):
    L, R = SIDEL, SIDER
    if k == '01': sunburst(D, TOPC, 84, 74, n=17); clouds(D, FX0 + 40, FX1 - 40, BB - 2, 20); sun_corner(D, 46)
    if k == '02': fan(D, TOPC, 84, 76, 195, 345, n=11); chevron_v(D, L, SB[0], SB[1], 40, 34); chevron_v(D, R, SB[0], SB[1], 40, 34); chevron_band(D, FX0 + 40, FX1 - 40, BB - 30, 26, k=2, step=40); fan_corner(D, 46)
    if k == '03': sunburst(D, TOPC, 84, 62, n=13); palm(D, TOPC - 118, 84, 72, 200, 272, 4); palm(D, TOPC + 118, 84, 72, 268, 340, 4); palm_v(D, L, SB[0], SB[1], 40); palm_v(D, R, SB[0], SB[1], 40); scallop_row(D, FX0 + 40, FX1 - 40, BB - 2, 22); scal_corner(D, 46)
    if k == '04': peacock(D, TOPC, 84, 78, 9); waves(D, FX0 + 40, FX1 - 40, BB - 2, 22); fan_corner(D, 48)
    if k == '05': scallop_shell(D, TOPC, 84, 76, 13); vol_corner(D, 20); scallop_row(D, FX0 + 80, FX1 - 80, BB - 2, 22); [volute(D, x, 360, 22, sx, 1) for x, sx in ((L - 8, 1), (R + 8, -1))]
    if k == '06': peacock(D, TOPC, 84, 78, 9); feather_v(D, L, SB[0], SB[1], 44); feather_v(D, R, SB[0], SB[1], 44); fan_corner(D, 46)
    if k == '07': chevron_crest(D, TOPC, 84, 260, 72); [fin_stack(D, x, y, 34, 5, sx) for x in (L - 30,) for y in (150, 390) for sx in (1,)]; [fin_stack(D, R + 30, y, 34, 5, -1) for y in (150, 390)]; chevron_band(D, FX0 + 40, FX1 - 40, BB - 30, 24, k=2, step=34); step_corner(D)
    if k == '08': sunburst(D, TOPC, 84, 70, n=15, base=False); waves(D, TOPC - 180, TOPC + 180, 84, 14); palm_v(D, L, SB[0], SB[1], 40); palm_v(D, R, SB[0], SB[1], 40); waves(D, FX0 + 40, FX1 - 40, BB - 2, 22)
    if k == '09': sunburst(D, TOPC, 84, 78, n=19, base=False); waves(D, TOPC - 200, TOPC + 200, 84, 14); waves(D, FX0 + 40, FX1 - 40, BB - 2, 22); cloud_corner4(D)
    if k == '10': fountain(D, TOPC, 84, 170, 78); chevron_v(D, L, SB[0], SB[1], 36, 30); chevron_v(D, R, SB[0], SB[1], 36, 30); [fountain(D, x, BB, 84, 40) for x in np.linspace(FX0 + 80, FX1 - 80, 7)]; step_corner(D)
    if k == '11': feather_crest(D, TOPC, 86, 80, 7); feather_v(D, L, SB[0], SB[1], 44); feather_v(D, R, SB[0], SB[1], 44); vol_corner(D, 20)
    if k == '12': clouds(D, TOPC - 200, TOPC + 200, 82, 22); waves(D, FX0 + 40, FX1 - 40, BB - 2, 22); chevron_v(D, L, SB[0], SB[1], 34, 26); chevron_v(D, R, SB[0], SB[1], 34, 26)

def down(img): return np.asarray(img.resize((W, H), Image.LANCZOS), float) / 255
guard = np.zeros((H, W), bool); guard[TY0 - G:TY1 + G, TX0 - G:TX1 + G] = True
yy, xx = np.mgrid[0:H, 0:W]; ring = (~guard & (xx > 14) & (xx < W - 15) & (yy > 14) & (yy < H - 15)).astype(float); ring = gaussian_filter(ring, 0.8); edge_keep = (xx > 10) & (xx < W - 11) & (yy > 10) & (yy < H - 11)
base = np.asarray(Image.open('story-plate-brass.webp').convert('RGBA'), float)
n0 = np.asarray(Image.open('story-plate-brass_n.webp').convert('RGB'), float) / 127.5 - 1
r0 = np.asarray(Image.open('story-plate-brass_r.webp').convert('L'), float) / 255
GOLD = np.array([255, 214, 120.]); DEEP = np.array([110, 72, 22.])
meta = json.load(open('story-plates.json')); signs = {s['id']: s for s in json.load(open('../signs.json'))['signs']}
meta['rooms'] = {}
for k in ROOMS:
    D = Deco(); room(D, k)
    ra = down(D.r); rc = down(D.c); ra[guard] = 0; rc[guard] = 0; ra *= edge_keep; rc *= edge_keep
    # erase the plain engraved double border where the crest / corner panels sit (so motifs read cleanly)
    img = base[..., :3].copy()
    img = img * (1 - 0.5 * ring[..., None])                                       # recessed antique band round the text field
    img = img * (1 - rc[..., None]) + base[..., :3] * 1.02 * rc[..., None]           # motif bodies: brushed brass relief on the dark band
    hi = gaussian_filter(ra, 0.6)
    img = img * (1 - hi[..., None]) + (GOLD * (0.9 + 0.1 * np.clip(n0[..., 1:2], -1, 1)) * hi[..., None])   # raised polished lines
    shadow = np.clip(gaussian_filter(ra, 1.4) - ra, 0, 1); img *= (1 - 0.45 * np.roll(np.roll(shadow, 1, 0), 1, 1))[..., None]  # bevel shade
    h = 3.0 * gaussian_filter(ra, 0.9) + 1.2 * gaussian_filter(rc, 1.2) - 2.0 * gaussian_filter(ring, 1.5)
    gy, gx = np.gradient(h); n = n0.copy(); n[..., 0] -= gx * 1.5; n[..., 1] += gy * 1.5   # (+y up in normal map, image y down)
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    rough = np.clip(r0 * (1 - 0.45 * hi) + 0.22 * ring * (1 - rc), 0, 1)
    outs = {'': np.dstack([np.clip(img, 0, 255), base[..., 3]]).astype(np.uint8), '_n': ((n * .5 + .5) * 255).astype(np.uint8), '_r': (rough * 255).astype(np.uint8)}
    files = {}
    for suf, a in outs.items():
        im = Image.fromarray(a); fn = f'story-plate-brass-room-{k}{suf}'
        im.save(fn + '.webp', quality=90, method=6); im.resize((W // 2, H // 2), Image.LANCZOS).save(fn + '.phone.webp', quality=86, method=6)
        files[{'': 'map', '_n': 'normalMap', '_r': 'roughnessMap'}[suf]] = fn + '.webp'
    sid = f'room-{k}'; s = signs.get(sid, {})
    meta['rooms'][sid] = {'title': s.get('text'), 'label': s.get('label'), 'motifs': list(ROOMS[k]), 'layout': LAYOUT[k], **files,
                          'phone': {kk: v.replace('.webp', '.phone.webp') for kk, v in files.items()}, 'metalness': 1.0, 'ink': '#2a1a0c'}
    print(k, 'deco px in text rect:', int((ra[guard] > 0).sum()))
meta['rooms_note'] = 'BRASS ONLY for #335 story plaques (TJ, Oct 26). text_rect_uv unchanged; deco confined to border, corners, side bands and bottom frieze.'
json.dump(meta, open('story-plates.json', 'w'), indent=1)
