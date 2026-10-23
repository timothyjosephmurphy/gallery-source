# Neural Dance sticker bot - build with: blender -b -P build_sticker_bot.py
# Original design inspired by a desktop cutter (Silhouette CAMEO 5a: 566x176x124 mm). Body ~8% larger.
import bpy, math, os
from mathutils import Vector
OUT = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def mat(name, rgb, rough=0.45, metal=0.0, emit=None, estr=0.0, alpha=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1); b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit: b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = estr
    if alpha < 1: b.inputs["Alpha"].default_value = alpha; m.blend_method = 'BLEND'; m.use_backface_culling = False
    return m
CREAM = mat("Cream", (0.86, 0.80, 0.68), 0.5)
ORANGE = mat("SunriseOrange", (1.0, 0.32, 0.04), 0.35)
PINK = mat("SunrisePink", (1.0, 0.12, 0.38), 0.35)
BLUE = mat("SunriseBlue", (0.05, 0.30, 1.0), 0.35)
DARK = mat("SlotDark", (0.03, 0.03, 0.04), 0.6)
GREY = mat("WarmGrey", (0.35, 0.32, 0.30), 0.4, 0.3)
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
def shade(o, ang=40):
    for p in o.data.polygons: p.use_smooth = True
    if hasattr(o.data, "set_sharp_from_angle"): o.data.set_sharp_from_angle(angle=math.radians(ang))
def bevel(o, w, seg):
    md = o.modifiers.new("b", 'BEVEL'); md.width = w; md.segments = seg; md.limit_method = 'ANGLE'
    bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier="b")
def box(name, c, s, m, bw=0, seg=2, parent=root):
    bpy.ops.mesh.primitive_cube_add(location=c); o = act(); o.scale = (s[0]/2, s[1]/2, s[2]/2)
    bpy.ops.object.transform_apply(scale=True)
    if bw: bevel(o, bw, seg)
    shade(o); bpy.context.view_layer.update(); return link(o, parent, name, m)
def cyl(name, c, r, d, m, v=24, rot=(0,0,0), parent=root, r2=None):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=d, location=c, rotation=rot)
    else: bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r, radius2=r2, depth=d, location=c, rotation=rot)
    o = act(); shade(o); bpy.context.view_layer.update(); return link(o, parent, name, m)

# ---- body (Blender: -Y = front, +Y = back, Z up). 0.61 x 0.19 x 0.135 m
W, D, H, Z0 = 0.61, 0.19, 0.135, 0.11
ZT = Z0 + H
box("Body", (0, 0, Z0 + H/2), (W, D, H), CREAM, 0.035, 4)
box("TopLid", (0, 0.01, ZT + 0.004), (W - 0.09, D - 0.06, 0.012), CREAM, 0.005, 2)
box("EndCap_L", (-W/2 + 0.012, 0, Z0 + H/2), (0.03, D + 0.004, H - 0.02), GREY, 0.012, 3)
box("EndCap_R", ( W/2 - 0.012, 0, Z0 + H/2), (0.03, D + 0.004, H - 0.02), GREY, 0.012, 3)
# front sticker slot + sunrise bands
slotz = Z0 + 0.055
box("SlotLip", (0, -D/2 + 0.002, slotz), (W - 0.12, 0.012, 0.022), GREY, 0.004, 2)
box("SlotMouth", (0, -D/2 - 0.0045, slotz), (W - 0.14, 0.004, 0.007), DARK)
for i, (m, z) in enumerate([(ORANGE, 0.030), (PINK, 0.0245), (BLUE, 0.019)]):
    box("Band_%d" % (i+1), (0.0, -D/2 - 0.0005, Z0 + z), (W - 0.16, 0.006, 0.004), m)
box("StatusStrip", (W/2 - 0.09, -D/2 + 0.004, ZT - 0.03), (0.06, 0.01, 0.006), BLUE, 0.002, 1)
empty("StickerSlot", (0, -D/2 - 0.007, slotz))   # identity -> glTF +Z out front
# top button: housing ring + cap (origin = rest position at cap base)
bx, by = W/2 - 0.08, 0.0
cyl("ButtonRing", (bx, by, ZT + 0.004), 0.03, 0.01, ORANGE, 32)
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.022, depth=0.014, location=(0, 0, 0.007))
o = act(); bevel(o, 0.004, 2); shade(o); o.location = (bx, by, ZT + 0.009)
bpy.context.view_layer.update(); link(o, root, "Button", PINK)
# back: flat panel (BackScreen) + projector lens
pw, ph = 0.30, 0.10
pcx = -0.10; pcz = Z0 + H/2
box("BackBezel", (pcx, D/2 - 0.002, pcz), (pw + 0.02, 0.012, ph + 0.02), GREY, 0.004, 2)
bpy.ops.mesh.primitive_plane_add(size=1, location=(pcx, D/2 + 0.0045, pcz), rotation=(math.radians(90), 0, math.pi))
o = act(); o.scale = (pw, ph, 1); bpy.ops.object.transform_apply(scale=True)
bpy.context.view_layer.update(); link(o, root, "BackScreen", SCREEN)
lx, lz = 0.17, pcz
cyl("ProjectorHousing", (lx, D/2 + 0.012, lz), 0.042, 0.03, BLUE, 32, rot=(math.radians(90), 0, 0))
cyl("ProjectorBarrel", (lx, D/2 + 0.034, lz), 0.03, 0.02, GREY, 32, rot=(math.radians(90), 0, 0))
cyl("ProjectorGlass", (lx, D/2 + 0.045, lz), 0.024, 0.003, GLASS, 32, rot=(math.radians(90), 0, 0))
lens = empty("ProjectorLens", (lx, D/2 + 0.047, lz), rot=(0, 0, math.pi))  # glTF +Z out the back
# beam: gentle cone, tilted 8 deg up, 0.9 m long, alpha fades to 0 via COLOR_0 (stays above floor)
import bmesh
def beam():
    L, r0, r1, tilt, n, rings = 0.9, 0.024, 0.15, math.radians(8), 32, 6
    me = bpy.data.meshes.new("ProjectorBeam"); bm = bmesh.new()
    ca = bm.loops.layers.color.new("Col")
    rs = []
    for j in range(rings + 1):
        t = j / rings; r = r0 + (r1 - r0) * t
        rs.append([bm.verts.new((r * math.cos(2*math.pi*k/n), t * L, r * math.sin(2*math.pi*k/n))) for k in range(n)])
    for j in range(rings):
        for k in range(n):
            f = bm.faces.new((rs[j][k], rs[j][(k+1) % n], rs[j+1][(k+1) % n], rs[j+1][k]))
            for lp in f.loops:
                t = lp.vert.co.y / L; lp[ca] = (1, 1, 1, (1 - t) ** 1.5)
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new("ProjectorBeam", me); sc.collection.objects.link(o)
    o.location = (lx, D/2 + 0.047, lz); o.rotation_euler = (tilt, 0, 0)
    for p in me.polygons: p.use_smooth = True
    me.materials.append(BEAM)
    nt = BEAM.node_tree; ca_n = nt.nodes.new("ShaderNodeVertexColor"); ca_n.layer_name = "Col"
    mul = nt.nodes.new("ShaderNodeMath"); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = 0.05
    nt.links.new(ca_n.outputs["Alpha"], mul.inputs[0]); nt.links.new(mul.outputs[0], nt.nodes["Principled BSDF"].inputs["Alpha"])
    bpy.context.view_layer.update(); link(o)
beam()

# ---- legs: insect-like, curved tapered segments. Leg_n (hip) -> Seg1 -> Leg_n_Knee -> Seg2 -> Leg_n_Ankle -> Seg3 + Foot
def tube(name, a, b, bend, r1, r2, m, parent, rings=6, n=10):
    a, b, bend = Vector(a), Vector(b), Vector(bend)
    me = bpy.data.meshes.new(name); bm = bmesh.new(); rs = []
    pts = [(a*(1-t)**2 + (a+b)/2*0 + ((a+b)/2+bend)*2*t*(1-t) + b*t*t) - a for t in [j/rings for j in range(rings+1)]]
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
def joint(name, c, r, m, parent, sz=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=r, location=c)
    o = act(); o.scale = sz; shade(o, 180); bpy.context.view_layer.update(); return link(o, parent, name, m)
legs = [((-0.24, -0.02), (-0.86, -0.5)), ((0.24, -0.02), (0.86, -0.5)), ((0.0, 0.05), (0.0, 1.0))]
UP = Vector((0, 0, 1))
for i, ((hx, hy), (dx, dy)) in enumerate(legs, 1):
    d = Vector((dx, dy, 0)).normalized(); hip = Vector((hx, hy, Z0 + 0.012))
    knee = hip + d * 0.10 + UP * 0.10          # femur rises up/outward
    ankle = hip + d * 0.22 + UP * 0.02         # tibia arcs out and down
    foot = Vector((hip.x + d.x * 0.27, hip.y + d.y * 0.27, 0.008))
    h = empty("Leg_%d" % i, hip)
    joint("Leg_%d_HipJoint" % i, hip, 0.026, ORANGE, h)
    tube("Leg_%d_Seg1" % i, hip, knee, -d * 0.015 + UP * 0.012, 0.020, 0.012, CREAM, h)
    k = empty("Leg_%d_Knee" % i, knee, h); joint("Leg_%d_KneeJoint" % i, knee, 0.014, PINK, k)
    tube("Leg_%d_Seg2" % i, knee, ankle, d * 0.02 + UP * 0.03, 0.012, 0.007, CREAM, k)
    a = empty("Leg_%d_Ankle" % i, ankle, k); joint("Leg_%d_AnkleJoint" % i, ankle, 0.009, BLUE, a)
    tube("Leg_%d_Seg3" % i, ankle, foot + UP * 0.004, d * 0.012, 0.007, 0.0035, GREY, a)
    f = joint("Leg_%d_Foot" % i, foot, 0.011, BLUE, a, (1.3, 1.3, 0.45))
    side = Vector((-d.y, d.x, 0))
    for c, off in enumerate((-0.6, 0, 0.6)):   # three small claws
        cd = (d + side * off).normalized()
        tube("Leg_%d_Claw%d" % (i, c+1), foot + cd * 0.008, foot + cd * 0.022 + UP * -0.004, UP * 0.003, 0.003, 0.0008, GREY, a, rings=3, n=6)

bpy.ops.object.select_all(action='DESELECT')
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "sticker-bot.glb"), export_format='GLB', export_yup=True,
                          export_apply=True, export_extras=False, export_vertex_color='ACTIVE', export_cameras=False, export_lights=False)

# ---- preview render (not exported)
bpy.ops.mesh.primitive_plane_add(size=20); act().data.materials.append(mat("Floor", (0.12, 0.11, 0.13), 0.8))
w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.05, 0.05, 0.07, 1); w.node_tree.nodes["Background"].inputs[1].default_value = 0.6
for loc, e in [((-2, -2.5, 3), 400), ((2.5, 1, 2), 200), ((0, 3, 1.5), 100)]:
    l = bpy.data.lights.new("L", 'AREA'); l.energy = e; l.size = 2; lo = bpy.data.objects.new("L", l); lo.location = loc
    sc.collection.objects.link(lo); lo.rotation_euler = (Vector((0, 0, 0.15)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
cd = bpy.data.cameras.new("C"); cd.lens = 40; cam = bpy.data.objects.new("C", cd); sc.collection.objects.link(cam); sc.camera = cam
sc.render.engine = 'CYCLES'; sc.cycles.samples = 64; sc.cycles.device = 'CPU'
sc.render.resolution_x, sc.render.resolution_y = 900, 700
for tag, pos, tgt in [("front", (-0.85, -1.15, 0.6), (0, 0, 0.14)), ("back", (1.1, 1.5, 0.75), (0, 0.3, 0.14))]:
    cam.location = pos; cam.rotation_euler = (Vector(tgt) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = "/tmp/sb_%s.png" % tag; bpy.ops.render.render(write_still=True)
