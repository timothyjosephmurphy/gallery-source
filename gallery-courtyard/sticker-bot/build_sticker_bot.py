# Neural Dance sticker bot v3 - build with: blender -b -P build_sticker_bot.py
# A Silhouette CAMEO 5a (566x176x124 mm; body envelope 0.61x0.19x0.135 m) enclosed in an organic
# sea-creature pod (to be made from sculpted spray foam ~45 mm thick) on taller insect legs.
import bpy, bmesh, math, os, json
from mathutils import Vector
OUT = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def lin(h):
    c = [int(h[i:i+2], 16) / 255 for i in (1, 3, 5)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)
APRICOT, CORAL, ROSE = lin("#F7A66E"), lin("#F48A5C"), lin("#E9A9A6")
VIOLET, BLUEC, TERRA, PLASTER = lin("#6E4FA8"), lin("#5E9ADB"), lin("#C8644E"), lin("#F3E6D8")

def mat(name, rgb, rough=0.45, metal=0.0, emit=None, estr=0.0, alpha=1.0, vcol=False):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1); b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit: b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = estr
    if alpha < 1: b.inputs["Alpha"].default_value = alpha; m.blend_method = 'BLEND'; m.use_backface_culling = False
    if vcol:
        v = nt.nodes.new("ShaderNodeVertexColor"); v.layer_name = "Col"
        nt.links.new(v.outputs["Color"], b.inputs["Base Color"])
    return m
POD = mat("PodFoam", (1, 1, 1), 0.75, vcol=True)
LEGM = mat("LegPlaster", PLASTER, 0.7)
CORALM = mat("JointCoral", CORAL, 0.55)
VIOLETM = mat("JointViolet", VIOLET, 0.5)
PINK = mat("ButtonRose", lin("#E86A8A"), 0.4)
DARK = mat("SlotDark", (0.02, 0.015, 0.03), 0.6)
GREY = mat("WarmGrey", (0.30, 0.27, 0.28), 0.4, 0.3)
GLASS = mat("LensGlass", (0.1, 0.2, 0.5), 0.05, 0, (0.4, 0.6, 1.0), 3.0)
SCREEN = mat("BackScreen", (0.05, 0.05, 0.08), 0.3, 0, (0.6, 0.3, 0.9), 0.6)
BEAM = mat("ProjectorBeam", (0.75, 0.75, 1.0), 0.5, 0, (0.75, 0.7, 1.0), 1.0, alpha=0.05)

root = bpy.data.objects.new("StickerBot", None); sc.collection.objects.link(root)
def link(o, parent=root, name=None, m=None):
    if name: o.name = name
    if o.data and name: o.data.name = name
    if m: o.data.materials.clear(); o.data.materials.append(m)
    mw = o.matrix_world.copy(); o.parent = parent; o.matrix_world = mw
    return o
def empty(name, loc, parent=root, rot=(0,0,0)):
    e = bpy.data.objects.new(name, None); sc.collection.objects.link(e)
    e.empty_display_size = 0.05; e.location = loc; e.rotation_euler = rot
    bpy.context.view_layer.update(); return link(e, parent)
def act(): return bpy.context.active_object
def shade(o):
    for p in o.data.polygons: p.use_smooth = True
def box(name, c, s, m, parent=root):
    bpy.ops.mesh.primitive_cube_add(location=c); o = act(); o.scale = (s[0]/2, s[1]/2, s[2]/2)
    bpy.ops.object.transform_apply(scale=True); bpy.context.view_layer.update(); return link(o, parent, name, m)
def cyl(name, c, r, d, m, v=24, rot=(0,0,0), parent=root):
    bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=d, location=c, rotation=rot)
    o = act(); shade(o); bpy.context.view_layer.update(); return link(o, parent, name, m)

# ---- machine envelope (Blender: -Y front, +Y back, Z up). Body itself is hidden inside the pod -> not modelled.
W, D, H, Z0 = 0.61, 0.19, 0.135, 0.15
ZT = Z0 + H; ZC = Z0 + H/2
slotz = Z0 + 0.055
bx = W/2 - 0.08                       # button x
pcx, pw, ph = -0.10, 0.30, 0.10       # back screen
lx = 0.17                             # projector lens x
YW = D/2 + 0.012                      # depth of window floor (just proud of machine faces)

# ---- Pod: lumpy asymmetric ellipsoid shell, apertures pressed in to the machine surface
A, B, C = 0.352, 0.142, 0.118         # base semi-axes (~45 mm foam over the machine)
def sstep(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t)
def box_w(u, v, hu, hv, m):           # 1 inside rounded rectangle, fades over margin m
    du = max(abs(u) - hu, 0); dv = max(abs(v) - hv, 0); return 1 - sstep(0, m, math.hypot(du, dv))
BARN = [(-0.20, -0.9, 0.55), (0.06, -0.95, 0.75), (0.29, -0.6, 0.6), (-0.30, 0.5, 0.75), (0.02, 0.4, 0.98), (0.27, 0.9, 0.35), (-0.05, -0.75, -0.55)]
bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=1, location=(0, 0, 0))
pod = act(); me = pod.data
bm = bmesh.new(); bm.from_mesh(me)
col = bm.loops.layers.color.new("Col")
apw = {}
for vt in bm.verts:
    n = vt.co.copy()
    asym = 1 + 0.06 * n.x                                       # right end slightly fuller
    p = Vector((n.x * A, n.y * B * asym, n.z * C * asym))
    lump = 0.007 * math.sin(9 * n.x + 2.1) * math.sin(7 * n.z + 0.5) + 0.005 * math.sin(13 * n.y + 11 * n.x) \
         + 0.004 * math.sin(17 * n.z - 5 * n.x + 1.3)
    hump = 0.045 * math.exp(-((p.x + 0.12) ** 2) / 0.018 - (p.y / 0.12) ** 2) * max(n.z, 0) ** 1.5
    tail = 0.018 * math.exp(-((p.x - 0.28) ** 2) / 0.004) * max(-n.y, 0)  # slight lobe front-right
    barn = 0.0
    for (bxx, by, bz) in BARN:
        q = Vector((bxx, by * B, bz * C)); dd = math.hypot(p.x - q.x, math.hypot(p.y - q.y, p.z - q.z))
        barn += 0.013 * math.exp(-(dd / 0.016) ** 2) - 0.007 * math.exp(-(dd / 0.006) ** 2)
    nrm = Vector((n.x / A, n.y / B, n.z / C)).normalized()
    p += nrm * (lump + hump + tail + barn)
    p.z += ZC
    # apertures (weights), pressing the foam in to the openings
    w_slot = box_w(p.x, p.z - slotz, 0.235, 0.012, 0.022) * (n.y < -0.2)
    w_scr = box_w(p.x - pcx, p.z - ZC, pw/2 + 0.005, ph/2 + 0.005, 0.022) * (n.y > 0.2)
    w_lens = box_w(math.hypot(p.x - lx, p.z - ZC), 0, 0.045, 0, 0.02) * (n.y > 0.2)
    w_btn = box_w(math.hypot(p.x - bx, p.y), 0, 0.034, 0, 0.02) * (n.z > 0.2)
    if w_slot: p.y = p.y + (max(p.y, -YW) - p.y) * w_slot
    if w_scr: p.y = p.y + (min(p.y, YW) - p.y) * w_scr
    if w_lens: p.y = p.y + (min(p.y, YW + 0.02) - p.y) * w_lens
    if w_btn: p.z = p.z + (min(p.z, ZT + 0.004) - p.z) * w_btn
    vt.co = p
    apw[vt.index] = (max(w_slot, w_scr, w_btn), w_lens, n.z, n.x, n.y)
def mix(a, b, t): return tuple(a[i] * (1 - t) + b[i] * t for i in range(3))
for f in bm.faces:
    for lp in f.loops:
        wo, wl, nz, nx, ny = apw[lp.vert.index]; x, y, z = lp.vert.co
        t1 = 0.5 + 0.5 * math.sin(11 * x + 6 * z + 3 * math.sin(20 * y))
        t2 = 0.5 + 0.5 * math.sin(7 * y - 9 * x + 23 * z + 1.7)
        c = mix(mix(APRICOT, CORAL, t1 * 0.85), ROSE, 0.55 * t2 ** 2)
        c = mix(c, TERRA, sstep(0.05, -0.75, nz) * 0.85)              # underside
        rim = sstep(0.0, 0.9, wo)
        c = mix(c, mix(VIOLET, BLUEC, 0.5 + 0.5 * math.sin(30 * x)), rim)
        c = mix(c, mix(BLUEC, VIOLET, 0.3), sstep(0.0, 0.9, wl))
        lp[col] = (*c, 1)
bm.to_mesh(me); bm.free(); shade(pod)
me.color_attributes.active_color = me.color_attributes["Col"]
link(pod, root, "Pod", POD)

# ---- features visible through the openings
box("SlotMouth", (0, -YW + 0.002, slotz), (0.44, 0.006, 0.008), DARK)
empty("StickerSlot", (0, -YW - 0.002, slotz))   # identity -> glTF +Z out front
cyl("ButtonRing", (bx, 0, ZT + 0.006), 0.03, 0.008, GREY, 32)
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.022, depth=0.014, location=(0, 0, 0.007))
o = act(); shade(o); o.location = (bx, 0, ZT + 0.009); bpy.context.view_layer.update(); link(o, root, "Button", PINK)
bpy.ops.mesh.primitive_plane_add(size=1, location=(pcx, YW + 0.001, ZC), rotation=(math.radians(90), 0, math.pi))
o = act(); o.scale = (pw, ph, 1); bpy.ops.object.transform_apply(scale=True)
bpy.context.view_layer.update(); link(o, root, "BackScreen", SCREEN)
LY = 0.165                                       # lens brought out flush with the pod surface
cyl("ProjectorBarrel", (lx, (YW + LY) / 2, ZC), 0.032, LY - YW, GREY, 32, rot=(math.radians(90), 0, 0))
cyl("ProjectorGlass", (lx, LY + 0.0015, ZC), 0.025, 0.003, GLASS, 32, rot=(math.radians(90), 0, 0))
empty("ProjectorLens", (lx, LY + 0.003, ZC), rot=(0, 0, math.pi))  # glTF +Z out the back
def beam():
    L, r0, r1, tilt, n, rings = 0.9, 0.024, 0.15, math.radians(8), 32, 6
    me = bpy.data.meshes.new("ProjectorBeam"); bm = bmesh.new(); ca = bm.loops.layers.color.new("Col"); rs = []
    for j in range(rings + 1):
        t = j / rings; r = r0 + (r1 - r0) * t
        rs.append([bm.verts.new((r * math.cos(2*math.pi*k/n), t * L, r * math.sin(2*math.pi*k/n))) for k in range(n)])
    for j in range(rings):
        for k in range(n):
            f = bm.faces.new((rs[j][k], rs[j][(k+1) % n], rs[j+1][(k+1) % n], rs[j+1][k]))
            for lp in f.loops: lp[ca] = (1, 1, 1, (1 - lp.vert.co.y / L) ** 1.5)
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new("ProjectorBeam", me); sc.collection.objects.link(o)
    o.location = (lx, LY + 0.003, ZC); o.rotation_euler = (tilt, 0, 0)
    for p in me.polygons: p.use_smooth = True
    me.materials.append(BEAM); nt = BEAM.node_tree
    ca_n = nt.nodes.new("ShaderNodeVertexColor"); ca_n.layer_name = "Col"
    mul = nt.nodes.new("ShaderNodeMath"); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = 0.05
    nt.links.new(ca_n.outputs["Alpha"], mul.inputs[0]); nt.links.new(mul.outputs[0], nt.nodes["Principled BSDF"].inputs["Alpha"])
    bpy.context.view_layer.update(); link(o)
beam()

# ---- legs (~25% longer): Leg_n -> Seg1 -> Leg_n_Knee -> Seg2 -> Leg_n_Ankle -> Seg3 + Foot + Claws
def tube(name, a, b, bend, r1, r2, m, parent, rings=6, n=10):
    a, b, bend = Vector(a), Vector(b), Vector(bend)
    me = bpy.data.meshes.new(name); bm = bmesh.new(); rs = []
    pts = [(a*(1-t)**2 + ((a+b)/2+bend)*2*t*(1-t) + b*t*t) - a for t in [j/rings for j in range(rings+1)]]
    for j, p in enumerate(pts):
        t = j / rings; tg = (pts[min(j+1, rings)] - pts[max(j-1, 0)]).normalized()
        q = Vector((0, 0, 1)).rotation_difference(tg); r = r1 + (r2 - r1) * t ** 0.8 + 0.15 * r1 * math.sin(math.pi * t)
        rs.append([bm.verts.new(p + q @ Vector((r*math.cos(2*math.pi*k/n), r*math.sin(2*math.pi*k/n), 0))) for k in range(n)])
    for j in range(rings):
        for k in range(n): bm.faces.new((rs[j][k], rs[j][(k+1)%n], rs[j+1][(k+1)%n], rs[j+1][k]))
    bm.faces.new(rs[-1]); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); sc.collection.objects.link(o); o.location = a
    for p in me.polygons: p.use_smooth = True
    me.materials.append(m); bpy.context.view_layer.update(); return link(o, parent)
def joint(name, c, r, m, parent, sz=(1, 1, 1), seg=12, rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=r, location=c)
    o = act(); o.scale = sz; shade(o); bpy.context.view_layer.update(); return link(o, parent, name, m)
# Four legs: front pair splayed forward, back pair at the ends clear of BackScreen, lens and beam
legs = [((-0.24, -0.04), (-0.78, -0.63)), ((0.24, -0.04), (0.78, -0.63)), ((-0.28, 0.05), (-0.62, 0.78)), ((0.30, 0.04), (0.72, 0.69))]
UP = Vector((0, 0, 1)); S = 1.25; HZ = 0.13
for i, ((hx, hy), (dx, dy)) in enumerate(legs, 1):
    d = Vector((dx, dy, 0)).normalized(); hip = Vector((hx, hy, HZ))
    knee = hip + d * 0.10 * S + UP * 0.115 * S
    ankle = hip + d * 0.22 * S + UP * 0.02 * S
    foot = Vector((hip.x + d.x * 0.27 * S, hip.y + d.y * 0.27 * S, 0.008))
    h = empty("Leg_%d" % i, hip)
    joint("Leg_%d_HipJoint" % i, hip, 0.03, CORALM, h)
    tube("Leg_%d_Seg1" % i, hip, knee, -d * 0.018 + UP * 0.015, 0.022, 0.013, LEGM, h)
    k = empty("Leg_%d_Knee" % i, knee, h); joint("Leg_%d_KneeJoint" % i, knee, 0.016, VIOLETM, k)
    tube("Leg_%d_Seg2" % i, knee, ankle, d * 0.025 + UP * 0.035, 0.013, 0.008, LEGM, k)
    a = empty("Leg_%d_Ankle" % i, ankle, k); joint("Leg_%d_AnkleJoint" % i, ankle, 0.01, CORALM, a)
    tube("Leg_%d_Seg3" % i, ankle, foot + UP * 0.004, d * 0.015, 0.008, 0.004, LEGM, a)
    joint("Leg_%d_Foot" % i, foot, 0.013, VIOLETM, a, (1.3, 1.3, 0.45))
    side = Vector((-d.y, d.x, 0))
    for c, off in enumerate((-0.6, 0, 0.6)):
        cd = (d + side * off).normalized()
        tube("Leg_%d_Claw%d" % (i, c+1), foot + cd * 0.01, foot + cd * 0.026 + UP * -0.004, UP * 0.003, 0.0035, 0.0009, VIOLETM, a, rings=3, n=6)

bpy.context.view_layer.update()
# measurements
def bbox(objs):
    pts = [o.matrix_world @ v.co for o in objs for v in o.data.vertices]
    return [min(p[i] for p in pts) for i in range(3)], [max(p[i] for p in pts) for i in range(3)]
meshes = [o for o in sc.objects if o.type == 'MESH']
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes)
pm = bbox([pod]); am = bbox([o for o in meshes if o.name != "ProjectorBeam"])
json.dump({"tris": tris, "pod": pm, "all": am}, open("/tmp/sb_meas.json", "w"), indent=1)

bpy.ops.object.select_all(action='DESELECT')
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "sticker-bot.glb"), export_format='GLB', export_yup=True,
                          export_apply=True, export_extras=False, export_vertex_color='ACTIVE', export_cameras=False, export_lights=False)

# ---- preview render (not exported)
bpy.ops.mesh.primitive_plane_add(size=20); act().data.materials.append(mat("Floor", (0.12, 0.11, 0.13), 0.8))
w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.05, 0.05, 0.07, 1); w.node_tree.nodes["Background"].inputs[1].default_value = 0.7
for loc, e in [((-2, -2.5, 3), 400), ((2.5, 1, 2), 220), ((0, 3, 1.5), 150), ((-3, 0.5, 1), 120)]:
    l = bpy.data.lights.new("L", 'AREA'); l.energy = e; l.size = 2; lo = bpy.data.objects.new("L", l); lo.location = loc
    sc.collection.objects.link(lo); lo.rotation_euler = (Vector((0, 0, 0.15)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
cd = bpy.data.cameras.new("C"); cd.lens = 40; cam = bpy.data.objects.new("C", cd); sc.collection.objects.link(cam); sc.camera = cam
sc.render.engine = 'CYCLES'; sc.cycles.samples = 48; sc.cycles.device = 'CPU'
sc.render.resolution_x, sc.render.resolution_y = 800, 620
for tag, pos, tgt in [("front", (-0.8, -1.2, 0.6), (0, 0, 0.17)), ("back", (1.0, 1.5, 0.7), (0, 0.25, 0.17)),
                      ("side", (-1.6, 0.15, 0.35), (0, 0.05, 0.17))]:
    cam.location = pos; cam.rotation_euler = (Vector(tgt) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = "/tmp/sb_%s.png" % tag; bpy.ops.render.render(write_still=True)
