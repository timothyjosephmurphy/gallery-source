import bpy,bmesh,math,sys
bpy.ops.wm.read_factory_settings(use_empty=True)
D='/workspace/gallery-courtyard/window-mesh-cards-358/'
W,H=2/3,1.0
for s,name in [('single','WindowSingle'),('mullion','WindowMullion'),('arched','WindowArched')]:
    for o in list(bpy.data.objects): bpy.data.objects.remove(o)
    root=bpy.data.objects.new(name,None); bpy.context.scene.collection.objects.link(root)
    def quad(n,z,mat):
        me=bpy.data.meshes.new(n); bm=bmesh.new()
        v=[bm.verts.new((x*W-W/2,0 if False else -z,y*H)) for x,y in((0,0),(1,0),(1,1),(0,1))]
        f=bm.faces.new(v); uv=bm.loops.layers.uv.new()
        for l,c in zip(f.loops,((0,0),(1,0),(1,1),(0,1))): l[uv].uv=c
        bm.to_mesh(me); o=bpy.data.objects.new(n,me); o.parent=root
        bpy.context.scene.collection.objects.link(o); me.materials.append(mat); return o
    fm=bpy.data.materials.new(f'Frame_{s}'); fm.use_nodes=True; fm.blend_method='CLIP'
    bs=fm.node_tree.nodes['Principled BSDF']; tx=fm.node_tree.nodes.new('ShaderNodeTexImage')
    tx.image=bpy.data.images.load(D+f'frame-{s}.png')
    fm.node_tree.links.new(tx.outputs[0],bs.inputs['Base Color']); fm.node_tree.links.new(tx.outputs[1],bs.inputs['Alpha'])
    gm=bpy.data.materials.new(f'Glass_{s}'); gm.use_nodes=True; gm.blend_method='BLEND'
    b=gm.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value=(.05,.06,.08,1); b.inputs['Alpha'].default_value=.35; b.inputs['Roughness'].default_value=.1
    quad(f'{name}Glass',-0.005,gm)  # glass sits 5mm behind frame
    quad(f'{name}Frame',0,fm)
    e=bpy.data.objects.new('GlowAttach',None); e.parent=root; e.location=(0,-0.01,0.5)
    bpy.context.scene.collection.objects.link(e)
    bpy.ops.export_scene.gltf(filepath=D+f'window-{s}.glb',export_format='GLB',export_image_format='WEBP',export_yup=True)
