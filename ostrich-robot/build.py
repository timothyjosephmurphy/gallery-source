# Purple ostrich guide-bot (original design) for TJ's 3D gallery - studio-tracker #289.
# Run:  ~/opt/blender-4.2.3-linux-x64/blender -b -P build.py            (builds both LODs, compresses, validates, previews)
# Needs: node/npx on PATH (npx @gltf-transform/cli), python3 with PIL for the preview montage.
# Design space used below is (x, f, z) = (right/left, FORWARD, up); P() maps it to Blender (x,-f,z) so that the
# bot faces glTF +Z (three.js forward) after the exporter's Y-up conversion. Bot's own LEFT is +X in glTF.
import bpy, bmesh, math, random, os, sys, json, subprocess, shutil, struct
from math import pi, sin, cos, sqrt
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else '/workspace/ostrich-robot'
OUT = HERE
TMP = '/tmp/ostrich-build'
os.makedirs(TMP, exist_ok=True)
V = Vector
def P(x, f=None, z=None):
    if f is None: x, f, z = x
    return V((x, -f, z))

# ---------- palette (brief) ----------
def lin(h):
    r = []
    for i in (1, 3, 5):
        c = int(h[i:i+2], 16) / 255
        r.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return tuple(r) + (1.0,)
MATS = [  # index, name, hex, metallic, roughness, emissive
    ('Shell_Violet', '#9A78CF', 0.22, 0.30, None),
    ('Shell_Deep',   '#6E4FA8', 0.22, 0.34, None),
    ('Shell_Light',  '#B9A0E0', 0.25, 0.26, None),
    ('Apricot',      '#F7A66E', 0.05, 0.45, None),
    ('Brass',        '#C9A14A', 0.95, 0.28, None),
    ('Dark',         '#23272E', 0.50, 0.40, None),
    ('LED_Cyan',     '#7FE8FF', 0.00, 0.30, 2.5),
    ('Leather_Coral','#E8694A', 0.04, 0.50, None),   # saddle: bright saturated leather tones
    ('Leather_Stitch','#A93D2E', 0.04, 0.55, None),
    ('Leather_Tan',  '#F49A55', 0.04, 0.48, None),
]
VIO, DEEP, LIGHT, APR, BRASS, DARK, LED, CORAL, STITCH, TAN = range(10)
_matcache = {}
def get_mat(i):
    if i in _matcache and _matcache[i].name in bpy.data.materials: return _matcache[i]
    n, h, met, rough, emis = MATS[i]
    m = bpy.data.materials.new(n); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = lin(h)
    b.inputs['Metallic'].default_value = met
    b.inputs['Roughness'].default_value = rough
    if emis:
        b.inputs['Emission Color'].default_value = lin(h)
        b.inputs['Emission Strength'].default_value = emis
    m.use_backface_culling = False  # glTF doubleSided (leaf plates are open shells)
    _matcache[i] = m
    return m

# ---------- LOD parameters ----------
LODS = {
 'lod0': dict(body=(20, 12), rows=8, cols=17, leaf=(2, 3), layer2=True, neck_sides=10, neck_rings=20, neck_plates=(5, 7),
              head=(16, 10), eye=(10, 6), beak=(14, 7), crest=3, blades=5, bleaf=(3, 5), hub=14, plumes=9, pleaf=(3, 6),
              leg_sides=8, foot_sides=18, toes=True, lens_sides=18, joints=True, thigh_plates=3, vis=(8, 2), collars=3, sad=(8, 10), stitch=True, girth=16, strap=4, stir=(10, 3), buckle=True),
 'lod1': dict(body=(14, 8), rows=5, cols=10, leaf=(2, 2), layer2=False, neck_sides=8, neck_rings=12, neck_plates=(0, 0),
              head=(8, 5), eye=(6, 4), beak=(8, 4), crest=0, blades=4, bleaf=(1, 3), hub=8, plumes=5, pleaf=(2, 3),
              leg_sides=5, foot_sides=8, toes=False, lens_sides=8, joints=False, thigh_plates=0, vis=(4, 1), collars=1, sad=(4, 6), stitch=False, girth=8, strap=2, stir=(6, 3), buckle=False),
}

# ---------- mesh builder ----------
class MB:
    def __init__(s, name):
        s.name = name; s.v = []; s.f = []; s.m = []; s.closed = []
    def vert(s, p): s.v.append(P(p)); return len(s.v) - 1
    def face(s, idx, mat, closed=False):
        s.f.append(tuple(idx)); s.m.append(mat); s.closed.append(closed)
    def tris(s): return sum(len(f) - 2 for f in s.f)

def frame(a, hint=V((0, 0, 1))):
    a = a.normalized()
    e1 = hint - a * hint.dot(a)
    if e1.length < 1e-4: e1 = V((1, 0, 0)) - a * a.x
    e1.normalize(); e2 = a.cross(e1).normalized()
    return a, e1, e2

def ellipsoid(mb, c, r, seg, rings, mat, rot=None):
    """UV ellipsoid in design space. rot: 3x3 Matrix applied to local offsets."""
    c = V(c); idx = []
    def pt(x, f, z):
        o = V((x, f, z))
        if rot is not None: o = rot @ o
        return mb.vert(c + o)
    top = pt(0, 0, r[2]); rows = []
    for k in range(1, rings):
        t = pi * k / rings
        rows.append([pt(r[0] * sin(t) * sin(2 * pi * j / seg), r[1] * sin(t) * cos(2 * pi * j / seg), r[2] * cos(t)) for j in range(seg)])
    bot = pt(0, 0, -r[2])
    for j in range(seg):
        mb.face((top, rows[0][(j + 1) % seg], rows[0][j]), mat, True)
    for k in range(len(rows) - 1):
        for j in range(seg):
            a, b = rows[k][j], rows[k][(j + 1) % seg]; cc, d = rows[k + 1][(j + 1) % seg], rows[k + 1][j]
            mb.face((a, b, cc, d), mat, True)
    for j in range(seg):
        mb.face((bot, rows[-1][j], rows[-1][(j + 1) % seg]), mat, True)

def sphere(mb, c, r, seg, rings, mat): ellipsoid(mb, c, (r, r, r), seg, rings, mat)

def tube(mb, pts, radii, sides, mat, caps=(True, True), sq=(1, 1), hint=V((1, 0, 0))):
    pts = [V(p) for p in pts]; rings = []
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)])
        a, e1, e2 = frame(t, hint)
        rings.append([mb.vert(p + (e1 * cos(2 * pi * j / sides) * sq[0] + e2 * sin(2 * pi * j / sides) * sq[1]) * radii[i]) for j in range(sides)])
    for i in range(len(rings) - 1):
        for j in range(sides):
            mb.face((rings[i][j], rings[i][(j + 1) % sides], rings[i + 1][(j + 1) % sides], rings[i + 1][j]), mat, True)
    if caps[0]: mb.face(tuple(reversed(rings[0])), mat, True)
    if caps[1]: mb.face(tuple(rings[-1]), mat, True)

def cyl(mb, p0, p1, r0, r1, sides, mat, caps=(True, True), sq=(1, 1), hint=V((0, 0, 1))):
    tube(mb, [V(p0), V(p1)], [r0, r1], sides, mat, caps, sq, hint)
    # tube() uses a central-difference tangent which for 2 pts equals p1-p0: fine.

def ring(mb, c, axis, R, r, seg, tseg, mat):
    c = V(c); a, e1, e2 = frame(V(axis), V((0, 0, 1)) if abs(V(axis).normalized().z) < .9 else V((1, 0, 0)))
    rs = []
    for i in range(seg):
        u = 2 * pi * i / seg; dirv = e1 * cos(u) + e2 * sin(u); cen = c + dirv * R
        rs.append([mb.vert(cen + dirv * (r * cos(2 * pi * k / tseg)) + a * (r * sin(2 * pi * k / tseg))) for k in range(tseg)])
    for i in range(seg):
        for k in range(tseg):
            mb.face((rs[i][k], rs[(i + 1) % seg][k], rs[(i + 1) % seg][(k + 1) % tseg], rs[i][(k + 1) % tseg]), mat, True)

def leaf(mb, base, d, nref, L, W, curl, cu, cv, mat, arch=0.18, prof=None, ref_flip=False):
    """Curved shield/feather blade. cu quads across, cv along. curl: tip lift along nref (fraction of L)."""
    base = V(base); d = V(d).normalized(); n = V(nref); n = (n - d * n.dot(d)).normalized(); lat = d.cross(n).normalized()
    if prof is None: prof = lambda s: max(0.16, sin(pi * (0.10 + 0.78 * s)))
    grid = []
    for j in range(cv + 1):
        s = j / cv; w = W * 0.5 * prof(s); row = []
        for i in range(cu + 1):
            t = i / cu * 2 - 1
            p = base + d * (L * s) + lat * (t * w) + n * (curl * L * s * s + arch * w * (1 - t * t))
            row.append(mb.vert(p))
        grid.append(row)
    for j in range(cv):
        for i in range(cu):
            q = (grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i])
            va, vb, vc = mb.v[q[0]], mb.v[q[1]], mb.v[q[2]]
            if (vb - va).cross(vc - va).dot(P(n)) < 0: q = q[::-1]
            mb.face(q, mat, False)

def catmull(pts, per):
    pts = [V(p) for p in pts]; out = []
    ext = [pts[0] * 2 - pts[1]] + pts + [pts[-1] * 2 - pts[-2]]
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i - 1], ext[i], ext[i + 1], ext[i + 2]
        for k in range(per):
            t = k / per
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(pts[-1]); return out

def make_obj(mb, name, origin, parent, coll):
    """Create mesh object from builder. Builder verts are in world rest space (Blender coords); recentre on origin."""
    o_b = P(origin)
    used = sorted(set(mb.m)); remap = {m: i for i, m in enumerate(used)}
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    vs = [bm.verts.new(v - o_b) for v in mb.v]
    fs = []
    for f, m in zip(mb.f, mb.m):
        try: face = bm.faces.new([vs[i] for i in f]); face.material_index = remap[m]; fs.append(face)
        except ValueError: fs.append(None)
    closed = [fc for fc, c in zip(fs, mb.closed) if c and fc is not None]
    bmesh.ops.recalc_face_normals(bm, faces=closed)
    bm.to_mesh(me); bm.free()
    for m in used: me.materials.append(get_mat(m))
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(name, me); coll.objects.link(ob)
    if getattr(mb, 'parts', None): ob['parts'] = json.dumps(mb.parts)   # face-index ranges, used only by clearance_check
    ob.parent = parent
    ob.location = o_b - (parent.matrix_world.translation if parent else V((0, 0, 0)))
    bpy.context.view_layer.update()
    return ob

def empty(name, loc, parent, coll):
    ob = bpy.data.objects.new(name, None); coll.objects.link(ob); ob.parent = parent
    ob.location = P(loc) - (parent.matrix_world.translation if parent else V((0, 0, 0)))
    bpy.context.view_layer.update(); return ob

# ---------- design constants ----------
BODY_R = (0.112, 0.165, 0.105)
NECK_BASE = V((0, 0.118, 0.068))
NECK_PTS = [(0, 0, 0), (0, 0.048, 0.062), (0, 0.072, 0.145), (0, 0.058, 0.225), (0, 0.030, 0.285), (0, 0.036, 0.328)]
HEAD_C = V((0, 0.032, 0.002)); HEAD_R = (0.034, 0.047, 0.031)
HUB = V((0.106, 0.012, 0.040))
TAIL_O = V((0, -0.150, 0.030))
# Ostrich leg chain (design coords x, f, z). Real anatomy: short thigh hidden in the body -> TRUE knee high up under the feathers
# (bends forward) -> long tibiotarsus ("shin") -> ANKLE (intertarsal joint, the visible 'backwards knee', apex points BACK)
# -> long tarsometatarsus -> two-toed foot (big inner toe + claw, smaller outer toe) on a hover pad.
LEG_X = 0.064
HIP = V((0.060, 0.000, -0.050)); KNEE = V((LEG_X, 0.070, -0.072)); ANKLE = V((0.066, -0.060, -0.215)); FOOT = V((0.068, 0.010, -0.375))
SEAT_F, EYE_ABOVE_SEAT = 0.0, 0.29     # RiderSeat anchor: centre of the saddle seat, ~0.29 above it (sitting eye height if the gallery scales the bot ~2.6x)

def build_body(L, rng):
    mb = MB('Body'); sx, sf = L['body']
    ellipsoid(mb, (0, 0, 0), BODY_R, sx, sf, DEEP)
    rx, rf, rz = BODY_R
    layers = [dict(rows=L['rows'], cols=L['cols'], len=0.078, wid=1.75, inset=0.005, curl=-0.14, off=0.0, shade=0)]
    if L['layer2']: layers.append(dict(rows=L['rows'] - 1, cols=L['cols'] - 2, len=0.056, wid=1.6, inset=-0.004, curl=-0.18, off=0.5, shade=1))
    for li, ly in enumerate(layers):
        t0, t1 = 0.10 * pi, 0.80 * pi
        for k in range(ly['rows']):
            t = t0 + (t1 - t0) * k / max(1, ly['rows'] - 1)
            if li == 1: t += 0.5 * (t1 - t0) / max(1, ly['rows'])
            n_k = max(4, round(ly['cols'] * sin(t))); h = cos(t)
            for j in range(n_k):
                psi = 2 * pi * (j + ly['off'] + 0.5 * (k % 2)) / n_k
                pt = V((rx * sin(t) * sin(psi), rf * sin(t) * cos(psi), rz * cos(t)))
                nrm = V((pt.x / rx ** 2, pt.y / rf ** 2, pt.z / rz ** 2)).normalized()
                dv = V((0, -1, -0.6)); dv = (dv - nrm * dv.dot(nrm)).normalized()
                w = min(0.085, ly['wid'] * 2 * pi * 0.13 * max(0.25, sin(t)) / n_k)
                if in_saddle_footprint(pt.x, pt.y, pt.z): continue
                r = rng.random()
                pl = (0.50, 0.40) if h > 0.35 else ((0.28, 0.42) if h > -0.2 else (0.10, 0.30))  # P(light), P(violet) ; rest deep
                if ly['shade']: pl = (min(0.9, pl[0] + 0.25), pl[1])
                mat = LIGHT if r < pl[0] else (VIO if r < pl[0] + pl[1] else DEEP)
                if rng.random() < (0.05 if L['leaf'][1] > 2 else 0.025): mat = APR
                leaf(mb, pt - nrm * ly['inset'], dv, nrm, ly['len'], w, ly['curl'], L['leaf'][0], L['leaf'][1], mat)
    return mb

def build_neck(L, rng):
    mb = MB('Neck'); pts = catmull(NECK_PTS, max(1, L['neck_rings'] // (len(NECK_PTS) - 1)))
    n = len(pts); rad = []
    for i in range(n):
        s = i / (n - 1); rad.append(0.0205 + 0.021 * (1 - s) ** 1.6 + 0.0035 * sin(pi * s * 1.0))
    tube(mb, pts, rad, L['neck_sides'], DEEP)
    def at(s):
        i = min(n - 2, int(s * (n - 1))); return i, pts[i], (pts[i + 1] - pts[i]).normalized()
    # shingled neck plates, pointing back down toward the body
    rings_n, per = L['neck_plates']
    for k in range(rings_n):
        s = 0.10 + 0.55 * k / max(1, rings_n - 1); i, p, tg = at(s)
        for j in range(per):
            a = 2 * pi * (j + 0.5 * (k % 2)) / per; radial = V((sin(a), 0, 0)) + V((0, cos(a), 0)) * 1
            radial = (radial - tg * radial.dot(tg)).normalized(); r = rad[i]
            mat = [LIGHT, VIO, LIGHT, VIO, DEEP][(j + k) % 5]
            leaf(mb, p + radial * (r * 0.9), -tg, radial, 0.050, 0.030, -0.10, 2, 2, mat)
    c = L['collars']
    i, p, tg = at(0.015); ring(mb, p, tg, rad[i] * 1.18, 0.0065, 2 * L['neck_sides'], 4 if L['joints'] else 3, BRASS)
    if c >= 2: i, p, tg = at(0.93); ring(mb, p, tg, rad[i] * 1.18, 0.0055, 2 * L['neck_sides'], 4, APR)
    if c >= 3: i, p, tg = at(0.50); ring(mb, p, tg, rad[i] * 1.20, 0.0040, 2 * L['neck_sides'], 4, BRASS)
    return mb, pts[-1]

def surf(c, r, psi, phi, k=1.0):
    return V(c) + V((r[0] * k * cos(phi) * sin(psi), r[1] * k * cos(phi) * cos(psi), r[2] * k * sin(phi)))

def build_head(L):
    mb = MB('Head'); hs, hr = L['head']
    ellipsoid(mb, HEAD_C, HEAD_R, hs, hr, LIGHT)
    # dark visor band wrapped across the face
    vu, vv = L['vis']; grid = []
    for j in range(vv + 1):
        phi = math.radians(-9 + 33 * j / vv); grid.append([mb.vert(surf(HEAD_C, HEAD_R, math.radians(-86 + 172 * i / vu), phi, 1.07)) for i in range(vu + 1)])
    for j in range(vv):
        for i in range(vu):
            q = (grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i])
            va, vb, vc = mb.v[q[0]], mb.v[q[1]], mb.v[q[2]]
            nref = P(V((0, 1, 0)))
            if (vb - va).cross(vc - va).dot(nref) < 0: q = q[::-1]
            mb.face(q, DARK, False)
    # visor rim (brass) along top edge is a thin tube
    if L['joints']:
        pts = [surf(HEAD_C, HEAD_R, math.radians(-86 + 172 * i / 12), math.radians(25), 1.075) for i in range(13)]
        tube(mb, pts, [0.0032] * 13, 4, BRASS, (True, True))
    # plume crest (3 swept leaves), only on LOD0
    for k in range(L['crest']):
        a = (k - (L['crest'] - 1) / 2) * 0.35
        leaf(mb, HEAD_C + V((a * 0.012, -0.020, HEAD_R[2] * 0.82)), V((a * 0.6, -0.6, 0.65)), V((0, 0.4, 1)), 0.060, 0.018, 0.25, 1, 3, [VIO, DEEP, VIO][k % 3], arch=0.1)
    return mb

def build_beak(L):
    mb = MB('Beak'); s, r = L['beak']
    ellipsoid(mb, (0, 0.034, 0.003), (0.0205, 0.038, 0.0075), s, r, APR)
    if L['joints']:
        ellipsoid(mb, (0, 0.027, -0.0045), (0.0155, 0.030, 0.0050), max(6, s - 4), max(3, r - 3), APR)
        ring(mb, (0, 0.0, 0.0), (0, 1, 0), 0.012, 0.0030, 12, 3, BRASS)  # brass collar at the visor-beak joint... 
    return mb

def build_eye(L, sd):
    mb = MB('Eye'); s, r = L['eye']
    ellipsoid(mb, (0, 0, 0), (0.0115, 0.0075, 0.0115), s, r, LED)
    return mb

def lens_origin(head_o):
    """Hologram projector on the CROWN of the head, just ahead of the crest. Origin = centre of the glass disc, beam rises along +Y (glTF)."""
    return V(head_o) + HEAD_C + V((0, 0.006, HEAD_R[2] + 0.015))

def build_lens(L, o):
    mb = MB('ProjectorLens'); s = L['lens_sides']
    def c(z): return o + V((0, 0, z))
    cyl(mb, c(-0.021), c(-0.012), 0.0150, 0.0140, s, BRASS)          # collar, half sunk into the crown
    cyl(mb, c(-0.012), c(-0.006), 0.0088, 0.0088, s, BRASS)          # stem
    cyl(mb, c(-0.006), c(-0.0006), 0.0088, 0.0135, s, BRASS)         # flared barrel
    cyl(mb, c(-0.0006), c(0.0), 0.0105, 0.0105, s, LED, caps=(False, True))   # glass
    return mb

def build_wing(L, sd):
    mb = MB('Wing'); o = HUB.copy(); o.x *= sd
    cyl(mb, o + V((-0.003 * sd, 0, 0)), o + V((0.040 * sd, 0, 0)), 0.021, 0.014, L['hub'], BRASS, hint=V((0, 1, 0)))
    nb = L['blades']; cols = [DEEP, VIO, LIGHT, VIO, DEEP, VIO, LIGHT]
    lens = [0.110, 0.135, 0.150, 0.135, 0.110, 0.085, 0.085]
    for k in range(nb):
        a = math.radians(58 - 135 * k / (nb - 1))
        d = V((cos(a) * sd, sin(a), 0.38))
        mat = APR if (nb >= 5 and k == nb // 2 + 1 and False) else cols[k]
        base = o + V((0.034 * sd, 0, 0.002 * k))
        leaf(mb, base, d, V((0, 0, 1)), lens[k], 0.075 if nb > 4 else 0.068, 0.22, L['bleaf'][0], L['bleaf'][1], mat, arch=0.10,
             prof=lambda s: max(0.22, sin(pi * (0.30 + 0.62 * s))))
    return mb, o

def build_tail(L):
    mb = MB('Tail'); n = L['plumes']
    ring(mb, TAIL_O, (0, -0.8, 0.3), 0.026, 0.0065, 14 if L['joints'] else 7, 4 if L['joints'] else 3, BRASS)
    cols = [DEEP, VIO, LIGHT, VIO, APR, VIO, LIGHT, VIO, DEEP]
    for k in range(n):
        u = (k - (n - 1) / 2) / ((n - 1) / 2); b = u * math.radians(60)
        d = V((sin(b) * 0.75, -cos(b) * 0.80, 0.42 + 0.15 * cos(b)))
        Ln = 0.250 - 0.080 * abs(u) ** 1.4
        cc = cols[k] if n == 9 else [DEEP, VIO, APR, VIO, DEEP][k] if n == 5 else cols[k % 9]
        leaf(mb, TAIL_O + V((0, -0.004, 0.0)), d, V((0, 0.0, 1)) + V((-sin(b) * 0.3, 0, 0)), Ln, 0.072, 0.34, L['pleaf'][0], L['pleaf'][1], cc, arch=0.12,
             prof=lambda s: max(0.10, sin(pi * (0.22 + 0.60 * s)) ** 0.8 * (1 - 0.35 * s)))
    return mb

def sx(v, sd): return V((v.x * sd, v.y, v.z))

def build_thigh(L, sd):
    mb = MB('Leg'); H = sx(HIP, sd); K = sx(KNEE, sd)
    tube(mb, [H - V((0, 0.02, 0)), (H + K) / 2, K], [0.030, 0.032, 0.027], L['leg_sides'], DEEP, hint=V((1, 0, 0)))  # hidden inside the body
    return mb, H

def build_shin(L, sd):
    mb = MB('Knee'); K = sx(KNEE, sd); A = sx(ANKLE, sd); n = L['leg_sides']; d = (A - K)
    sphere(mb, K, 0.019, 8 if L['joints'] else 5, 5 if L['joints'] else 3, BRASS)          # true knee cap (mostly buried in the feathers)
    m1 = K + d * 0.38
    tube(mb, [K, K + d * 0.2, m1], [0.027, 0.022, 0.0145], n, DEEP, hint=V((1, 0, 0)))     # feathered upper shin ("trousers")
    cyl(mb, m1, A, 0.0125, 0.0105, n, DARK, hint=V((1, 0, 0)))                              # bare tibiotarsus
    for k in range(L['thigh_plates']):                                                      # shingled feather plates over the knee
        a = (k - (L['thigh_plates'] - 1) / 2) * 0.9
        leaf(mb, K + V((0.016 * sd * cos(a) + 0.012 * sin(a), 0.012 * cos(a), 0.006)), d.normalized() + V((0.15 * sd * sin(a), 0, 0)), V((sd * cos(a), sin(a), 0.2)), 0.085, 0.040, -0.08, 2, 2, [LIGHT, VIO, LIGHT][k % 3])
    return mb, K

def build_meta(L, sd):
    mb = MB('Ankle'); A = sx(ANKLE, sd); F = sx(FOOT, sd); n = L['leg_sides']
    sphere(mb, A, 0.0185, 8 if L['joints'] else 5, 5 if L['joints'] else 3, BRASS)          # ankle joint: the visible backward-bending 'knee'
    cyl(mb, A, F, 0.0105, 0.0125, n, DARK, hint=V((1, 0, 0)))
    if L['joints']:
        ring(mb, A + (F - A) * 0.5, (F - A), 0.0125, 0.0032, 10, 3, BRASS)
        leaf(mb, A + (F - A) * 0.12 + V((0, 0.012, 0)), (F - A), V((0, 1, 0.1)), 0.085, 0.028, 0.0, 1, 2, LIGHT, arch=0.25)   # shell guard on the front of the tarsus
    return mb, A

def build_foot(L, sd):
    mb = MB('Foot'); F = sx(FOOT, sd); n = L['foot_sides']
    def c(f, z, x=0.0): return F + V((x, f, z))
    sphere(mb, F, 0.0125, 8 if L['joints'] else 5, 5 if L['joints'] else 3, BRASS)
    zc = -0.032
    cyl(mb, c(0.030, zc - 0.006), c(0.030, zc + 0.002), 0.036, 0.036, n, BRASS, sq=(0.95, 1.7), hint=V((1, 0, 0)))   # hover pad rim
    cyl(mb, c(0.030, zc + 0.002), c(0.030, zc + 0.008), 0.033, 0.028, n, APR, sq=(0.95, 1.7), hint=V((1, 0, 0)))     # pad top plate
    cyl(mb, c(0.030, zc - 0.0066), c(0.030, zc - 0.0062), 0.026, 0.026, n, LED, caps=(True, False), sq=(0.95, 1.6), hint=V((1, 0, 0)))  # cyan glow underside
    ts = 8 if L['joints'] else 6; ti = -sd          # inner = toward the midline
    # big inner toe + claw
    t0, t1 = c(0.008, zc + 0.017, ti * 0.016), c(0.098, zc + 0.017, ti * 0.020)
    cyl(mb, t0, t1, 0.0145, 0.0105, ts, DEEP, hint=V((0, 0, 1)))
    cyl(mb, t1, t1 + V((0, 0.030, -0.006)), 0.0105, 0.0016, ts, APR, hint=V((0, 0, 1)))
    # smaller outer toe
    u0, u1 = c(0.008, zc + 0.015, -ti * 0.017), c(0.058, zc + 0.015, -ti * 0.021)
    cyl(mb, u0, u1, 0.0105, 0.0075, ts, DEEP, hint=V((0, 0, 1)))
    cyl(mb, u1, u1 + V((0, 0.016, -0.003)), 0.0075, 0.0014, ts, APR, hint=V((0, 0, 1)))
    return mb, F

# ---------- saddle (leather seat + girth + stirrups), one node: Saddle ----------
SAD_F0, SAD_F1 = float(os.environ.get('OSTRICH_F0', -0.125)), 0.046
def body_z(x, f):
    v = 1 - (x / BODY_R[0]) ** 2 - (f / BODY_R[1]) ** 2
    return BODY_R[2] * sqrt(max(v, 1e-4))
def sad_halfw(v):
    e = sqrt(max(0.0, 1 - abs(2 * v - 1) ** 6))
    return (0.084 - 0.030 * _sm(0.40, 1.0, v)) * max(e, 0.28)           # broad cantle, narrower pommel, rounded ends
def sad_h(u, v):
    dish = -0.009 * (1 - u * u) * max(0.0, 1 - ((v - 0.5) / 0.32) ** 2)       # soft dish in the seat
    pom = 0.026 * math.exp(-((v - 0.86) / 0.07) ** 2) * (0.5 + 0.5 * (1 - u * u))   # raised pommel
    can = 0.024 * math.exp(-((v - 0.08) / 0.10) ** 2) * (0.75 + 0.25 * u * u)       # raised cantle
    return (0.018 + dish + pom + can) * (1 - 0.50 * u ** 4)
def sad_pt(u, v, lift=0.0):
    f = SAD_F0 + v * (SAD_F1 - SAD_F0); x = u * sad_halfw(v)
    return V((x, f, body_z(x, f) + 0.016 + sad_h(u, v) + lift))
def in_saddle_footprint(x, f, z):
    """Body shell plates under the saddle are never seen, so they are skipped (saves tris)."""
    if z < 0.03 or not (SAD_F0 - 0.004 < f < SAD_F1 + 0.004): return False
    v = min(1.0, max(0.0, (f - SAD_F0) / (SAD_F1 - SAD_F0)))
    return abs(x) < sad_halfw(v) + 0.004
def rider_seat_pos():
    return V((0, SEAT_F, sad_pt(0, (SEAT_F - SAD_F0) / (SAD_F1 - SAD_F0)).z + EYE_ABOVE_SEAT))

def loop_tube(mb, pts, r, sides, mat):
    pts = [V(p) for p in pts]; n = len(pts); rings = []
    for i, p in enumerate(pts):
        a, e1, e2 = frame(pts[(i + 1) % n] - pts[i - 1], V((0, 0, 1)))
        rings.append([mb.vert(p + (e1 * cos(2 * pi * j / sides) + e2 * sin(2 * pi * j / sides)) * r) for j in range(sides)])
    for i in range(n):
        for j in range(sides):
            mb.face((rings[i][j], rings[i][(j + 1) % sides], rings[(i + 1) % n][(j + 1) % sides], rings[(i + 1) % n][j]), mat, True)

def surf_off(x_r, z_r, f, phi, off):
    """Point on the body cross-section ellipse at plane f, angle phi, pushed `off` outward along the section normal."""
    s_ = sqrt(max(1e-4, 1 - (f / BODY_R[1]) ** 2)); Rx, Rz = BODY_R[0] * s_, BODY_R[2] * s_
    nx, nz = cos(phi) / Rx, sin(phi) / Rz; nl = math.hypot(nx, nz)
    return V((Rx * cos(phi) + off * nx / nl, f, Rz * sin(phi) + off * nz / nl))

def build_saddle(L):
    mb = MB('Saddle'); nu, nv = L['sad']; mb.parts = []
    def mark(n): mb.parts.append((n, len(mb.f)))
    # --- seat: dished, contoured top surface + skirt that drops to the body ---
    top = [[mb.vert(sad_pt(-1 + 2 * i / nu, j / nv)) for i in range(nu + 1)] for j in range(nv + 1)]
    for j in range(nv):
        for i in range(nu):
            u = -1 + 2 * (i + 0.5) / nu; v = (j + 0.5) / nv
            mat = TAN if (abs(u) < 0.72 and 0.20 < v < 0.76) else CORAL
            q = (top[j][i], top[j][i + 1], top[j + 1][i + 1], top[j + 1][i]); va, vb, vc = mb.v[q[0]], mb.v[q[1]], mb.v[q[2]]
            if (vb - va).cross(vc - va).dot(P(V((0, 0, 1)))) < 0: q = q[::-1]
            mb.face(q, mat, False)
    bnd = [(i, 0) for i in range(nu)] + [(nu, j) for j in range(nv)] + [(i, nv) for i in range(nu, 0, -1)] + [(0, j) for j in range(nv, 0, -1)]
    cen = V((0, (SAD_F0 + SAD_F1) / 2, 0)); low = {}
    for (i, j) in bnd:
        p = sad_pt(-1 + 2 * i / nu, j / nv); low[(i, j)] = mb.vert(V((p.x, p.y, body_z(p.x, p.y) + 0.004)))
    for k, (i, j) in enumerate(bnd):
        i2, j2 = bnd[(k + 1) % len(bnd)]
        q = (top[j][i], top[j2][i2], low[(i2, j2)], low[(i, j)]); p = sad_pt(-1 + 2 * i / nu, j / nv)
        out = V((p.x, p.y - cen.y, 0)); va, vb, vc = mb.v[q[0]], mb.v[q[1]], mb.v[q[2]]
        if (vb - va).cross(vc - va).dot(P(out)) < 0: q = q[::-1]
        mb.face(q, CORAL, False)
    mark('seat')
    # --- stitched edge line (thin rust tube just inside the border, following the dish) ---
    if L['stitch']:
        pts = []; ns, na = 9, 7
        for k in range(na): pts.append(sad_pt(-0.80 + 1.6 * k / na, 0.13, 0.0016))
        for k in range(ns): pts.append(sad_pt(0.80 * (1 - 0.15 * (k / ns) ** 2), 0.13 + 0.74 * k / ns, 0.0016))
        for k in range(na): pts.append(sad_pt(0.80 - 1.6 * k / na, 0.87, 0.0016))
        for k in range(ns): pts.append(sad_pt(-0.80 * (1 - 0.15 * ((ns - k) / ns) ** 2), 0.87 - 0.74 * k / ns, 0.0016))
        loop_tube(mb, pts, 0.0017, 3, STITCH)
    mark('stitch')
    # --- girth strap: hangs from the saddle sides, around the barrel BEHIND the wing hubs and well behind the knees ---
    fg = float(os.environ.get('OSTRICH_FG', -0.115)); n = L['girth']; a0, a1 = math.radians(48), math.radians(-228)
    gp = [surf_off(0, 0, fg, a0 + (a1 - a0) * k / n, 0.013) for k in range(n + 1)]
    tube(mb, gp, [0.0115] * (n + 1), 4, CORAL, (True, True), sq=(1, 0.36), hint=V((0, 1, 0)))
    if L['buckle']:
        for sd in (-1, 1):
            pb = surf_off(0, 0, fg, math.radians(8) if sd > 0 else math.radians(172), 0.017)
            cyl(mb, pb - V((0.004 * sd, 0, 0)), pb + V((0.004 * sd, 0, 0)), 0.0100, 0.0100, 4, BRASS, sq=(0.8, 1.0), hint=V((0, 1, 0)))
    mark('girth')
    # --- stirrup straps + short stirrups, forward of the wing hub and out beside (not under) the knees ---
    for sd in (-1, 1):
        fs = 0.052; k0 = math.radians(70); k1 = math.radians(14); m = L['strap']
        sp = [surf_off(0, 0, fs, k0 + (k1 - k0) * k / m, 0.013) for k in range(m + 1)]
        sp = [V((p.x * sd, p.y, p.z)) for p in sp]
        end = sp[-1]
        sp += [end + V((0.002 * sd, 0, -0.022)), end + V((0.003 * sd, 0, -0.040))]
        tube(mb, sp, [0.0062] * len(sp), 4, CORAL, (True, False), sq=(1, 0.38), hint=V((0, 1, 0)))
        cz = sp[-1] + V((0, 0, -0.016))
        ring(mb, cz, (1, 0, 0), 0.0185, 0.0035, L['stir'][0], L['stir'][1], BRASS)        # stirrup iron: loop seen from the side
        cyl(mb, cz + V((-0.011 * sd, 0, -0.0185)), cz + V((0.011 * sd, 0, -0.0185)), 0.0048, 0.0048, 4, STITCH, hint=V((0, 1, 0)))   # tread bar
    mark('stirrups')
    return mb

# ---------- animation ----------
LOC_NODES = ('Body', 'Neck')   # only these get translation keys; everything else is rotation only
def key_clip(clip, N, fn_map, oneshot=False):
    """fn_map: {obj: fn(p) -> dict(rot=(x,y,z), loc=(dx,dy,dz))}; one NLA track per clip (track name = glTF animation name).
    Loops sample p = fr/N; one-shots sample p = fr/(N-1) so the last key is exactly the end pose."""
    for ob, fn in fn_map.items():
        rest_loc = ob.location.copy()
        ob.animation_data_create(); ad = ob.animation_data
        act = bpy.data.actions.new(f'{clip}_{ob.name}'); ad.action = act
        for fr in range(N):
            r = fn(fr / (N - 1) if oneshot else fr / N); ob.rotation_mode = 'XYZ'
            ob.rotation_euler = r.get('rot', (0, 0, 0)); ob.keyframe_insert('rotation_euler', frame=1 + fr)
            if ob.name in LOC_NODES:
                ob.location = rest_loc + V(r.get('loc', (0, 0, 0))); ob.keyframe_insert('location', frame=1 + fr)
        for fc in act.fcurves:
            for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
        tr = ad.nla_tracks.new(); tr.name = clip
        st = tr.strips.new(clip, 1, act); st.name = clip
        ad.action = None
        ob.rotation_euler = (0, 0, 0); ob.location = rest_loc

# --- leg IK helper: foot target (f, z) in Body space -> Knee / Ankle / Foot pitch (Blender X rotation, + = distal part swings BACK)
_K = (KNEE.y, KNEE.z); _A = (ANKLE.y, ANKLE.z); _F = (FOOT.y, FOOT.z)
_l1 = math.dist(_K, _A); _l2 = math.dist(_A, _F)
def _ang(v): return math.atan2(v[1], -v[0])        # design (f, z) -> angle in Blender's (y, z) plane
def leg_ik(tf, tz, foot_world, body_pitch=0.0):
    dx, dz = tf - _K[0], tz - _K[1]; d = min(max(math.hypot(dx, dz), abs(_l1 - _l2) + 1e-3), _l1 + _l2 - 1e-3)
    th = math.atan2(dz, dx); al = math.acos((_l1 ** 2 + d ** 2 - _l2 ** 2) / (2 * _l1 * d))
    cands = [(_K[0] + _l1 * cos(th + sg * al), _K[1] + _l1 * sin(th + sg * al)) for sg in (1, -1)]
    A = min(cands, key=lambda c: c[0])                 # ankle apex points BACKWARD (ostrich 'backwards knee')
    T = (_K[0] + d * cos(th), _K[1] + d * sin(th))
    knee = _ang((A[0] - _K[0], A[1] - _K[1])) - _ang((_A[0] - _K[0], _A[1] - _K[1]))
    meta = _ang((T[0] - A[0], T[1] - A[1])) - _ang((_F[0] - _A[0], _F[1] - _A[1]))
    ankle = meta - knee
    foot = foot_world - body_pitch - knee - ankle
    return knee, ankle, foot

def _sm(a, b, x):
    t = min(1, max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t)

def walk_target(u):
    """Ostrich stride: stance 45% / swing 55% -> brief floating phase when both feet are up. Returns foot (f, z) in body space + world toe pitch."""
    F0, Fb, Z0, LIFT = 0.120, -0.105, FOOT.z, 0.105
    if u < 0.45:
        s = u / 0.45; toe = 0.30 * _sm(0.78, 1.0, s)                      # toes press down on push-off
        return F0 + (Fb - F0) * s, Z0, toe
    s = (u - 0.45) / 0.55; e = s * s * (3 - 2 * s)
    toe = 0.30 * (1 - _sm(0.0, 0.25, s)) - 0.60 * sin(pi * s)             # toes lift while the foot swings forward
    return Fb + (F0 - Fb) * e, Z0 + LIFT * sin(pi * min(1, s * 1.05)) ** 0.85, toe

# ---- pose "specs": plain tuples so clips can be blended. Rotations are Blender XYZ Euler (X pitch +nose down, Y roll/flap, Z yaw).
# Body/Neck: (rx, ry, rz, lx, ly, lz); Head/WL/WR/Tail: (rx, ry, rz); HipL/HipR: (rx,); TL/TR: foot target (f, z, world toe pitch); IKP: body pitch the IK compensates.
ANIM_NODES = ('Body', 'Neck', 'Head', 'Wing_L', 'Wing_R', 'Tail', 'Leg_L', 'Leg_R', 'Knee_L', 'Knee_R', 'Ankle_L', 'Ankle_R', 'Foot_L', 'Foot_R')
BP = 0.07                                  # walking body tilt (slightly nose-down)
TUCK = (0.0, 1.1, 0.7)                   # wings folded against the body (Wing_L; Wing_R is mirrored)
W = lambda ph, k=1, o=0: sin(2 * pi * (ph * k) + o)
def lerp(a, b, w): return tuple(x + (y - x) * w for x, y in zip(a, b))
def lerp_spec(a, b, w): return {k: lerp(a[k], b[k], w) for k in a}
def bump(t, a, b): return sin(pi * min(1, max(0, (t - a) / (b - a))))   # 0 -> 1 -> 0 over [a, b]

def spec_hover(p):
    return {'Body': (0.035 * W(p, 1, 0.8), 0.03 * W(p, 1, 2.0), 0.0, 0, 0, 0.012 * W(p)),
            'Neck': (0.07 * W(p, 1, -0.6), 0.0, 0.07 * W(p, 1, 1.0), 0, 0, 0), 'Head': (-0.07 * W(p, 1, -0.6), 0.0, 0.22 * W(p, 1, 2.2)),
            'WL': (0.0, 0.24 * W(p, 4), 0.05 * W(p, 4, 1.2)), 'WR': (0.0, -0.24 * W(p, 4), -0.05 * W(p, 4, 1.2)),
            'Tail': (0.09 * W(p, 1, -1.2), 0.0, 0.07 * W(p, 2)), 'HipL': (0.03 * W(p, 1, -1.5),), 'HipR': (0.03 * W(p, 1, -1.0),),
            'TL': (-0.015 + 0.014 * W(p, 1, -1.5), -0.335 + 0.012 * W(p, 1, -1.0), 0.02 + 0.10 * W(p, 1, -0.9)),
            'TR': (-0.015 + 0.014 * W(p, 1, -1.0), -0.335 + 0.012 * W(p, 1, -0.5), 0.02 + 0.10 * W(p, 1, -0.4)), 'IKP': (0.035 * W(p, 1, 0.8),)}

def spec_fly(p):
    return {'Body': (0.34 + 0.03 * W(p, 2), 0.0, 0.0, 0, 0, 0.008 * W(p, 4, 0.5)),
            'Neck': (0.20 + 0.04 * W(p, 2, 0.6), 0.0, 0.0, 0, 0, 0), 'Head': (-0.40 + 0.03 * W(p, 2, 0.2), 0.0, 0.0),
            'WL': (0.0, 0.10 + 0.78 * W(p, 4), 0.16 * W(p, 4, 1.4)), 'WR': (0.0, -0.10 - 0.78 * W(p, 4), -0.16 * W(p, 4, 1.4)),
            'Tail': (-0.38 + 0.07 * W(p, 4, 1.0), 0.0, 0.05 * W(p, 2)), 'HipL': (0.10 + 0.03 * W(p, 4, 0.8),), 'HipR': (0.10 + 0.03 * W(p, 4, 1.1),),
            'TL': (-0.165 + 0.012 * W(p, 4, 0.8), -0.285 + 0.008 * W(p, 4, 0.3), 0.05 + 0.05 * W(p, 4, 0.6)),
            'TR': (-0.165 + 0.012 * W(p, 4, 1.1), -0.285 + 0.008 * W(p, 4, 0.6), 0.05 + 0.05 * W(p, 4, 0.9)), 'IKP': (0.34 + 0.03 * W(p, 2),)}

def spec_walk(p):
    tl, tr = walk_target(p % 1.0), walk_target((p + 0.5) % 1.0)
    return {'Body': (BP, 0.03 * W(p), 0.0, 0, 0, 0.013 * cos(4 * pi * (p - 0.475))),
            'Neck': (0.10 * W(p, 2, 0.3), 0.0, 0.0, 0, -0.020 * W(p, 2, 0.3), 0), 'Head': (-0.16 * W(p, 2, 0.8), 0.0, 0.06 * W(p)),
            'WL': (TUCK[0], TUCK[1] + 0.025 * W(p, 2), TUCK[2]), 'WR': (TUCK[0], -TUCK[1] - 0.025 * W(p, 2), -TUCK[2]),
            'Tail': (0.05 * W(p, 2, 0.5), 0.0, 0.10 * W(p)), 'HipL': (0.05 * W(p),), 'HipR': (-0.05 * W(p),), 'TL': tl, 'TR': tr, 'IKP': (BP,)}

WALK0 = spec_walk(0.0)    # "neutral walking pose": Flip / Land / Point start or end exactly here, so Walk can resume seamlessly

def spec_takeoff(t, T=13 / 24):
    e = _sm(0.10, 0.80, t); sp = lerp_spec(WALK0, spec_fly(0.0), e)
    crouch = -0.035 * bump(t, 0.0, 0.30) ; hop = 0.06 * sin(pi * _sm(0.25, 1.0, t))
    b = list(sp['Body']); b[5] += crouch + hop; sp['Body'] = tuple(b)
    ph = 2 * pi * 4 * T * (t - 1); a = _sm(0.0, 0.4, t)                       # flap phase ends at 0 == Fly(0)
    sp['WL'] = (0.0, lerp((TUCK[1],), (0.10,), e)[0] + 0.78 * a * sin(ph), lerp((TUCK[2],), (0.16 * sin(1.4),), e)[0] + 0.16 * a * sin(ph + 1.4))
    sp['WR'] = (0.0, -sp['WL'][1], -sp['WL'][2])
    for k in ('TL', 'TR'): sp[k] = (sp[k][0], sp[k][1] + 0.03 * sin(pi * e), sp[k][2])
    sp['IKP'] = lerp(WALK0['IKP'], spec_fly(0.0)['IKP'], e)
    return sp

def spec_land(t, T=13 / 24):
    e = _sm(0.20, 0.90, t); sp = lerp_spec(spec_fly(0.0), WALK0, e)
    b = list(sp['Body']); b[5] += 0.05 * (1 - _sm(0.0, 0.7, t)) - 0.04 * bump(t, 0.55, 0.95); sp['Body'] = tuple(b)
    ph = 2 * pi * 4 * T * t; a = 1 - _sm(0.10, 0.70, t)
    sp['WL'] = (0.0, lerp((0.10,), (TUCK[1],), e)[0] + 0.78 * a * sin(ph), lerp((0.16 * sin(1.4),), (TUCK[2],), e)[0] + 0.16 * a * sin(ph + 1.4))
    sp['WR'] = (0.0, -sp['WL'][1], -sp['WL'][2])
    for k in ('TL', 'TR'): sp[k] = (sp[k][0] + 0.05 * sin(pi * e), sp[k][1], sp[k][2])      # feet reach forward for touchdown
    sp['IKP'] = lerp(spec_fly(0.0)['IKP'], WALK0['IKP'], e)
    return sp

def spec_flip(t):
    """Forward somersault (1 s): small crouch, hop arc, 360 deg about the body, legs + neck tucked, wings flare. Starts and ends at WALK0."""
    sp = {k: v for k, v in WALK0.items()}
    tk = _sm(0.0, 0.25, t) * (1 - _sm(0.62, 0.92, t)); fl = _sm(0.08, 0.30, t) * (1 - _sm(0.68, 0.95, t))
    rot = _sm(0.05, 0.95, t)
    b = list(WALK0['Body']); b[0] = BP + 2 * pi * rot; b[5] += 0.14 * sin(pi * t) - 0.025 * bump(t, 0.0, 0.14); sp['Body'] = tuple(b)
    sp['Neck'] = lerp(WALK0['Neck'], (1.05, 0.0, 0.0, 0, 0, 0), tk); sp['Head'] = lerp(WALK0['Head'], (-0.95, 0.0, 0.0), tk)
    flap = 0.30 * sin(2 * pi * 2.5 * t)
    sp['WL'] = lerp(WALK0['WL'], (0.0, -0.15 + flap, -0.05), fl); sp['WR'] = lerp(WALK0['WR'], (0.0, 0.15 - flap, 0.05), fl)
    sp['Tail'] = lerp(WALK0['Tail'], (-0.35, 0.0, 0.0), fl)
    for k in ('TL', 'TR'): sp[k] = lerp(WALK0[k], (0.05, -0.19, 0.25), tk)
    sp['IKP'] = (BP,)                         # keep the feet un-compensated for the body spin
    return sp

def spec_point(t, side):
    """side = -1 -> bot's RIGHT (-X), +1 -> bot's LEFT (+X). Neck rolls out sideways and the head drops so the beak points out/down, clear of the view ahead."""
    out = _sm(0.0, 0.28, t) * (1 - _sm(0.66, 1.0, t)); hold = _sm(0.24, 0.36, t) * (1 - _sm(0.58, 0.68, t))
    sp = {k: v for k, v in WALK0.items()}
    sp['Body'] = (WALK0['Body'][0], WALK0['Body'][1] + 0.06 * side * out, 0.0, 0, 0, WALK0['Body'][5])
    nk = WALK0['Neck']; sp['Neck'] = (nk[0] + 0.45 * out, 1.0 * side * out, 0.18 * side * out, nk[3], nk[4], nk[5])
    hd = WALK0['Head']; sp['Head'] = (hd[0] + 0.55 * out + 0.09 * hold * sin(2 * pi * 3 * t), 0.0, hd[2] + 0.55 * side * out)
    return sp

def spec_to_pose(sp):
    P_ = {'Body': dict(rot=sp['Body'][:3], loc=sp['Body'][3:]), 'Neck': dict(rot=sp['Neck'][:3], loc=sp['Neck'][3:]),
          'Head': dict(rot=sp['Head']), 'Wing_L': dict(rot=sp['WL']), 'Wing_R': dict(rot=sp['WR']), 'Tail': dict(rot=sp['Tail']),
          'Leg_L': dict(rot=(sp['HipL'][0], 0, 0)), 'Leg_R': dict(rot=(sp['HipR'][0], 0, 0))}
    for sd in 'LR':
        k, a, f = leg_ik(*sp['T' + sd], sp['IKP'][0])
        P_['Knee_' + sd] = dict(rot=(k, 0, 0)); P_['Ankle_' + sd] = dict(rot=(a, 0, 0)); P_['Foot_' + sd] = dict(rot=(f, 0, 0))
    return P_

def animate(nodes):
    # Clip table: name -> (frames, one-shot?, spec fn). NLA order: the LAST (top) track defines the rest pose -> Hover last.
    clips = [('Walk', 48, False, spec_walk), ('Fly', 24, False, spec_fly), ('Takeoff', 14, True, spec_takeoff), ('Land', 14, True, spec_land),
             ('Flip', 25, True, spec_flip), ('Point', 37, True, lambda t: spec_point(t, -1)), ('Point_L', 37, True, lambda t: spec_point(t, 1)),
             ('Point_R', 37, True, lambda t: spec_point(t, -1)), ('Hover', 48, False, spec_hover)]
    for name, N, one, fn in clips:
        cache = {}
        def get(p, fn=fn, cache=cache):
            if p not in cache: cache[p] = spec_to_pose(fn(p))
            return cache[p]
        key_clip(name, N, {nodes[n]: (lambda p, n=n, get=get: get(p)[n]) for n in ANIM_NODES}, oneshot=one)
    bpy.context.scene.frame_set(1)

# ---------- assemble one LOD ----------
def assemble(lodname):
    L = LODS[lodname]; rng = random.Random(289); L['name'] = lodname
    bpy.ops.wm.read_factory_settings(use_empty=True); _matcache.clear()
    sc = bpy.context.scene; sc.render.fps = 24; sc.frame_start = 1; sc.frame_end = 48
    coll = sc.collection; N = {}; tri = {}
    def add(mb, name, origin, parent):
        ob = make_obj(mb, name, origin, parent, coll); N[name] = ob; tri[name] = mb.tris(); return ob
    root = empty('OstrichBot', (0, 0, 0), None, coll); N['OstrichBot'] = root
    body = add(build_body(L, rng), 'Body', (0, 0, 0), root)
    # neck: path is local to NECK_BASE, so shift builder verts into world space first
    nk, top = build_neck(L, rng)
    nk.v = [v + P(NECK_BASE) for v in nk.v]
    neck = add(nk, 'Neck', NECK_BASE, body)
    head_o = NECK_BASE + V(top)
    hd = build_head(L); hd.v = [v + P(head_o) for v in hd.v]
    head = add(hd, 'Head', head_o, neck)
    bk = build_beak(L); bk.v = [v + P(head_o + HEAD_C + V((0, HEAD_R[1] * 0.85, 0))) for v in bk.v]
    add(bk, 'Beak', head_o + HEAD_C + V((0, HEAD_R[1] * 0.85, 0)), head)
    for nm, sd in (('Eye_L', 1), ('Eye_R', -1)):
        ep = surf(head_o + HEAD_C, HEAD_R, math.radians(33 * sd), math.radians(9), 1.075)
        e = build_eye(L, sd); e.v = [v + P(ep) for v in e.v]; add(e, nm, ep, head)
    lo = lens_origin(head_o); add(build_lens(L, lo), 'ProjectorLens', lo, head)
    add(build_saddle(L), 'Saddle', (0, 0, 0), body)
    for nm, sd in (('Wing_L', 1), ('Wing_R', -1)):
        w, o = build_wing(L, sd); add(w, nm, o, body)
    add(build_tail(L), 'Tail', TAIL_O, body)
    N['RiderSeat'] = empty('RiderSeat', rider_seat_pos(), body, coll); N['RiderSeat'].empty_display_type = 'ARROWS'; N['RiderSeat'].empty_display_size = 0.05
    for nm, sd in (('L', 1), ('R', -1)):
        lg, H = build_thigh(L, sd); leg = add(lg, 'Leg_' + nm, H, body)
        sh, K = build_shin(L, sd); knee = add(sh, 'Knee_' + nm, K, leg)
        mt, A = build_meta(L, sd); ank = add(mt, 'Ankle_' + nm, A, knee)
        ft, F = build_foot(L, sd); add(ft, 'Foot_' + nm, F, ank)
    for k, ob in N.items(): ob.name = k  # keep exact names
    animate({k: N[k] for k in ANIM_NODES})
    bpy.context.view_layer.update()
    return N, tri

def export(path):
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_apply=True, export_yup=True, export_animations=True,
        export_animation_mode='NLA_TRACKS', export_force_sampling=True, export_cameras=False, export_lights=False,
        export_texcoords=False, export_normals=True, export_extras=False, export_skins=False, export_morph=False, export_optimize_animation_size=False, export_optimize_animation_keep_anim_object=True)

# ---------- preview render ----------
def render_views(prefix):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 40; sc.cycles.device = 'CPU'; sc.cycles.use_denoising = True
    sc.render.resolution_x = sc.render.resolution_y = 640; sc.render.film_transparent = False
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.42, 0.40, 0.50, 1); bg.inputs['Strength'].default_value = 1.0
    sc.view_settings.view_transform = 'Standard'
    def light(loc, e, size):
        d = bpy.data.lights.new('l', 'AREA'); d.energy = e; d.size = size
        o = bpy.data.objects.new('l', d); sc.collection.objects.link(o); o.location = loc
        t = o.constraints.new('TRACK_TO'); t.target = tgt; t.track_axis = 'TRACK_NEGATIVE_Z'; t.up_axis = 'UP_Y'
    tgt = bpy.data.objects.new('tgt', None); sc.collection.objects.link(tgt); tgt.location = (0, 0, 0.04)
    light((-1.0, -1.4, 1.6), 60, 1.2); light((1.6, 0.4, 0.8), 25, 1.0); light((0.3, 1.5, 1.2), 35, 1.0)
    cd = bpy.data.cameras.new('c'); cd.lens = 50; cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
    t = cam.constraints.new('TRACK_TO'); t.target = tgt; t.track_axis = 'TRACK_NEGATIVE_Z'; t.up_axis = 'UP_Y'
    views = {'front': (0, -1.60, 0.10), 'side': (1.65, 0, 0.08), '34': (1.10, -1.18, 0.40)}
    outs = []
    for nm, loc in views.items():
        cam.location = loc; sc.render.filepath = f'{TMP}/{prefix}_{nm}.png'; bpy.ops.render.render(write_still=True); outs.append(sc.render.filepath)
    return outs

# ---------- clip inspection (rider height + pose strips) ----------
def solo_clip(name):
    """Mute every NLA track except `name` so frame_set() evaluates only that clip."""
    for ob in bpy.data.objects:
        if ob.animation_data:
            for tr in ob.animation_data.nla_tracks: tr.mute = (tr.name != name)

def rider_stats():
    solo_clip('Walk'); sc = bpy.context.scene; seat = bpy.data.objects['RiderSeat']; feet = [bpy.data.objects['Foot_L'], bpy.data.objects['Foot_R']]
    def foot_min(o): return min((o.matrix_world @ V(c)).z for c in o.bound_box)
    rows = []
    for fr in range(1, 49):
        sc.frame_set(fr); bpy.context.view_layer.update()
        rows.append((seat.matrix_world.translation.z, min(foot_min(o) for o in feet)))
    ground = min(r[1] for r in rows)                       # lowest pad underside in the cycle = floor
    hs = [r[0] - ground for r in rows]
    st = dict(seat_local_gltf=[round(v, 3) for v in (rider_seat_pos().x, rider_seat_pos().z, -rider_seat_pos().y)], seat_above_ground_walk_first=round(hs[0], 3),
              seat_above_ground_walk_min=round(min(hs), 3), seat_above_ground_walk_max=round(max(hs), 3), seat_above_ground_walk_mean=round(sum(hs) / len(hs), 3),
              seat_above_pads_rest=None)
    return st

CLIP_FRAMES = {'Walk': 48, 'Fly': 24, 'Takeoff': 14, 'Land': 14, 'Flip': 25, 'Point': 37, 'Point_L': 37, 'Point_R': 37, 'Hover': 48}
def clearance_check():
    """Triangle-triangle overlap of each Saddle part (seat, stitching, girth + buckles, stirrup straps + stirrups) against the wings, legs,
    tail, neck and head on every frame of every clip. Returns per clip: frames with any overlap and {part+node: frames}."""
    from mathutils.bvhtree import BVHTree
    sc = bpy.context.scene; others = ['Wing_L', 'Wing_R', 'Leg_L', 'Leg_R', 'Knee_L', 'Knee_R', 'Ankle_L', 'Ankle_R', 'Foot_L', 'Foot_R', 'Tail', 'Neck', 'Head']
    parts = json.loads(bpy.data.objects['Saddle']['parts'])
    def tree(name, dg, rng_=None):
        ob = bpy.data.objects[name]; ev = ob.evaluated_get(dg); me = ev.to_mesh(); mw = ev.matrix_world
        polys = [tuple(p.vertices) for p in me.polygons]
        if rng_: polys = polys[rng_[0]:rng_[1]]
        t = BVHTree.FromPolygons([mw @ v.co for v in me.vertices], polys); ev.to_mesh_clear(); return t
    res = {}
    for clip, N in CLIP_FRAMES.items():
        solo_clip(clip); bad = 0; hits = {}
        for fr in range(1, N + 1):
            sc.frame_set(fr); dg = bpy.context.evaluated_depsgraph_get(); hit = False
            ots = {o: tree(o, dg) for o in others}; start = 0
            for pn, end in parts:
                pt = tree('Saddle', dg, (start, end)); start = end
                for o, ot in ots.items():
                    if pt.overlap(ot): hits[pn + '|' + o] = hits.get(pn + '|' + o, 0) + 1; hit = True
            bad += hit
        res[clip] = dict(frames=N, frames_with_overlap=bad, pairs=hits)
    for ob in bpy.data.objects:
        if ob.animation_data:
            for tr in ob.animation_data.nla_tracks: tr.mute = False
    sc.frame_set(1)
    return res

def render_saddle():
    """Close-ups of the saddle: top view (front = up), side view, and a rider's-eye view from the RiderSeat anchor."""
    sc = bpy.context.scene; sc.render.resolution_x = sc.render.resolution_y = 640; sc.cycles.samples = 40
    solo_clip('Walk'); sc.frame_set(1); bpy.context.view_layer.update()
    cd = bpy.data.cameras.new('c3'); cam = bpy.data.objects.new('c3', cd); sc.collection.objects.link(cam); sc.camera = cam; cd.clip_start = 0.005
    seat = bpy.data.objects['RiderSeat'].matrix_world.translation.copy()
    cd.type = 'ORTHO'; cd.ortho_scale = 0.46; cam.location = (0, 0.0, 3.0); cam.rotation_euler = (0, 0, pi)
    sc.render.filepath = f'{TMP}/saddle_0.png'; bpy.ops.render.render(write_still=True)
    cd.ortho_scale = 0.62; cam.location = (3.0, 0.0, 0.10); cam.rotation_euler = (pi / 2, 0, pi / 2)
    sc.render.filepath = f'{TMP}/saddle_1.png'; bpy.ops.render.render(write_still=True)
    cd.type = 'PERSP'; cd.lens = 20; cam.location = seat; cam.rotation_euler = (math.radians(52), 0, pi)
    sc.render.filepath = f'{TMP}/saddle_2.png'; bpy.ops.render.render(write_still=True)
    for ob in bpy.data.objects:
        if ob.animation_data:
            for tr in ob.animation_data.nla_tracks: tr.mute = False

STRIPS = [('walk', 'Walk', [1, 9, 17, 25, 33, 41], 'side'), ('flip', 'Flip', [1, 5, 9, 13, 17, 21, 25], 'side'), ('point', 'Point', [1, 7, 11, 17, 25, 31, 37], 'front')]
def render_strips():
    sc = bpy.context.scene; sc.render.resolution_x = sc.render.resolution_y = 320; sc.cycles.samples = 24
    tgt = [o for o in bpy.data.objects if o.name == 'tgt'][0]; tgt.location = (0, 0, 0.08)
    cd = bpy.data.cameras.new('c2'); cam = bpy.data.objects.new('c2', cd); sc.collection.objects.link(cam); sc.camera = cam
    t = cam.constraints.new('TRACK_TO'); t.target = tgt; t.track_axis = 'TRACK_NEGATIVE_Z'; t.up_axis = 'UP_Y'
    for key, clip, frames, view in STRIPS:
        solo_clip(clip)
        if view == 'side': cd.type = 'ORTHO'; cd.ortho_scale = 1.40 if key == 'walk' else 1.55; cam.location = (3.0, 0, 0.08)
        else: cd.type = 'PERSP'; cd.lens = 50; cam.location = (0.15, -1.55, 0.30)
        for i, fr in enumerate(frames):
            sc.frame_set(fr); sc.render.filepath = f'{TMP}/strip_{key}_{i}.png'; bpy.ops.render.render(write_still=True)
    for ob in bpy.data.objects:
        if ob.animation_data:
            for tr in ob.animation_data.nla_tracks: tr.mute = False

# ---------- gltf helpers ----------
def glb_stats(path):
    with open(path, 'rb') as f:
        data = f.read()
    jl = struct.unpack('<I', data[12:16])[0]; js = json.loads(data[20:20 + jl])
    tris = 0
    for m in js['meshes']:
        for p in m['primitives']:
            tris += js['accessors'][p['indices']]['count'] // 3 if 'indices' in p else js['accessors'][p['attributes']['POSITION']]['count'] // 3
    return dict(kb=round(len(data) / 1024, 1), tris=tris, nodes=[n['name'] for n in js['nodes']], anims=[a['name'] for a in js.get('animations', [])],
                materials=len(js.get('materials', [])), ext=js.get('extensionsUsed', []))

def gt(*args):
    r = subprocess.run(['npx', '--yes', '@gltf-transform/cli', *args], capture_output=True, text=True)
    if r.returncode: print(r.stdout[-1500:], r.stderr[-1500:]); raise SystemExit('gltf-transform failed: ' + ' '.join(args))
    return r.stdout + r.stderr

COMPRESS_MJS = """import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { dedup, prune, resample, reorder } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const [inp, out] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(inp);
// NOTE: not using the CLI `meshopt` command: its position quantization wraps meshes in extra unnamed child nodes,
// which would break the named-node contract (Body, Neck, Head...). Here nodes are untouched; only buffers are compressed.
// The exporter keeps every TRS channel of every animated node. Drop scale and the translation of nodes that only rotate (Body and Neck keep theirs).
for (const anim of doc.getRoot().listAnimations()) {
  for (const ch of anim.listChannels()) {
    const p = ch.getTargetPath(), n = ch.getTargetNode().getName();
    if (p === 'scale' || (p === 'translation' && n !== 'Body' && n !== 'Neck')) { const smp = ch.getSampler(); ch.dispose(); if (smp && smp.listParents().filter(x => x.propertyType === 'AnimationChannel').length === 0) smp.dispose(); }
  }
}
// Blender stamps key times as frame/fps (first key at 1/24 s). Re-base every clip to start at t = 0. Looping clips get one extra key
// (= the first pose) at t = N/24, so the loop period is exactly N frames with no held frame; one-shots end exactly on their last pose.
const LOOPS = ['Walk', 'Fly', 'Hover'], DT = 1 / 24, buf = doc.getRoot().listBuffers()[0];
for (const anim of doc.getRoot().listAnimations()) {
  const loop = LOOPS.includes(anim.getName());
  for (const smp of anim.listSamplers()) {
    const ti = smp.getInput(), to = smp.getOutput(), t = ti.getArray(), o = to.getArray(), n = t.length, es = to.getElementSize(), m = loop ? n + 1 : n;
    const nt = new Float32Array(m), no = new Float32Array(m * es);
    for (let i = 0; i < n; i++) { nt[i] = t[i] - t[0]; for (let k = 0; k < es; k++) no[i * es + k] = o[i * es + k]; }
    if (loop) { nt[n] = t[n - 1] - t[0] + DT; for (let k = 0; k < es; k++) no[n * es + k] = o[k]; }
    smp.setInput(doc.createAccessor().setType('SCALAR').setArray(nt).setBuffer(buf));
    smp.setOutput(doc.createAccessor().setType(to.getType()).setArray(no).setBuffer(buf));
  }
}
await doc.transform(dedup(), prune({ keepLeaves: true }), resample(), reorder({ encoder: MeshoptEncoder, target: 'size' }));
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
await io.write(out, doc);
"""
def meshopt_compress(src, dst):
    nd = f'{TMP}/node'; os.makedirs(nd, exist_ok=True)
    if not os.path.isdir(f'{nd}/node_modules/meshoptimizer'):
        subprocess.run(['npm', 'init', '-y'], cwd=nd, capture_output=True)
        r = subprocess.run(['npm', 'i', '@gltf-transform/core', '@gltf-transform/extensions', '@gltf-transform/functions', 'meshoptimizer'], cwd=nd, capture_output=True, text=True)
        if r.returncode: raise SystemExit('npm install failed: ' + r.stderr[-800:])
    open(f'{nd}/compress.mjs', 'w').write(COMPRESS_MJS)
    r = subprocess.run(['node', 'compress.mjs', src, dst], cwd=nd, capture_output=True, text=True)
    if r.returncode: raise SystemExit('compress failed: ' + r.stderr[-800:])

def main():
    stats = {}
    if os.environ.get('OSTRICH_FAST'):      # dev only: just print saddle clearance for LOD0
        assemble(os.environ.get('OSTRICH_LOD', 'lod0')); r = clearance_check(); print('FAST', {k: (v['frames_with_overlap'], v['pairs']) for k, v in r.items()}); return
    for lod in ('lod0', 'lod1'):
        N, tri = assemble(lod)
        raw = f'{TMP}/{lod}.raw.glb'; export(raw)
        final = f'{OUT}/ostrich-{lod}.glb'
        meshopt_compress(raw, final)
        stats[lod] = glb_stats(final); stats[lod]['raw_kb'] = round(os.path.getsize(raw) / 1024, 1)
        print(lod, {k: v for k, v in stats[lod].items() if k != 'nodes'})
        stats[lod]['validate'] = gt('validate', final)[-900:]
        render_views(lod)
        stats[lod]['clearance'] = clearance_check(); print('clearance', lod, {k: (v['frames_with_overlap'], v['pairs']) for k, v in stats[lod]['clearance'].items()})
        if lod == 'lod0': stats[lod]['rider'] = rider_stats(); render_strips(); render_saddle(); print('rider', stats[lod]['rider'])
    json.dump(stats, open(f'{TMP}/stats.json', 'w'), indent=1)
    # montage (system python3 + PIL; Blender's bundled python has no PIL): row1 LOD0, row2 LOD1
    code = """
import sys, json
from PIL import Image, ImageDraw, ImageFont
TMP, OUT = sys.argv[1], sys.argv[2]; stats = json.load(open(TMP + '/stats.json')); W = 640; T = 320
strips = [('walk', 'Walk (loop, 2.0 s)', 6), ('flip', 'Flip (one-shot, 1.0 s)', 7), ('point', 'Point (one-shot, 1.5 s, to the bot\\'s right)', 7)]
H = W * 3 + T * 3; im = Image.new('RGB', (W * 3, H), 'white'); d = ImageDraw.Draw(im); ft = ImageFont.load_default(size=22); fs = ImageFont.load_default(size=18)
for r, lod in enumerate(('lod0', 'lod1')):
    for c, v in enumerate(('front', 'side', '34')):
        im.paste(Image.open(f'{TMP}/{lod}_{v}.png').convert('RGB'), (c * W, r * W))
        d.text((c * W + 12, r * W + 10), f'{lod.upper()} {["front","side","3/4"][c]}   {stats[lod]["tris"]} tris   {stats[lod]["kb"]} KB', fill=(255, 255, 255), font=ft)
for c, t_ in enumerate(('Saddle: top view (front = up)', 'Saddle: side view', "Rider's-eye view from RiderSeat (looking forward)")):
    im.paste(Image.open(f'{TMP}/saddle_{c}.png').convert('RGB'), (c * W, W * 2)); d.text((c * W + 12, W * 2 + 10), t_, fill=(255, 255, 255), font=ft)
for r, (k, title, n) in enumerate(strips):
    y = W * 3 + r * T; step = W * 3 // n
    for i in range(n):
        tile = Image.open(f'{TMP}/strip_{k}_{i}.png').convert('RGB').resize((min(step, T), T)) if step < T else Image.open(f'{TMP}/strip_{k}_{i}.png').convert('RGB')
        im.paste(tile, (i * step + (step - tile.width) // 2, y))
    d.text((12, y + 8), title, fill=(255, 255, 255), font=ft)
im.resize((W * 2, H * 2 // 3), Image.LANCZOS).save(OUT + '/preview.png')
"""
    subprocess.run(['python3', '-c', code, TMP, OUT], check=True)

main()
