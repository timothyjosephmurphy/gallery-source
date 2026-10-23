# Purple ostrich guide bot (studio-tracker #289)
Original design. Built with Blender 4.2.3 (`build.py`), compressed with meshopt, checked with gltf-transform.
Rebuild: `~/opt/blender-4.2.3-linux-x64/blender -b -P /workspace/ostrich-robot/build.py` (also needs node/npx and python3 PIL for the preview).

| file | tris | size | budget |
|---|---|---|---|
| ostrich-lod0.glb | 7,818 | 247.1 KB | <8k tris, <300 KB |
| ostrich-lod1.glb (phone) | 2,132 | 147.2 KB | <2.5k tris, <300 KB |

Both have 10 materials (7 plus 3 saddle leathers), no textures and no UVs. Draw calls are 63 primitives (LOD0) and 49 (LOD1). Most of the size is now the 9 animation clips (16 channels each), which are identical in both files.

## Nodes (exact glTF names)
```
OstrichBot            (static root, no animation, so the gallery can move or rotate it freely)
 └ Body               (animated: bob, lean, roll)
    ├ Neck → Head → Beak, Eye_L, Eye_R, ProjectorLens   (hologram anchor on the crown of the head)
    ├ Saddle          (leather seat + girth strap + stirrup straps and stirrups, static mesh)
    ├ RiderSeat       (empty: rider / camera anchor, sits on the saddle seat)
    ├ Wing_L, Wing_R  (stubby wing-fans / hover vanes, pivot at the shoulder hub)
    ├ Tail            (plume fan)
    └ Leg_L → Knee_L → Ankle_L → Foot_L      (same chain mirrored for _R)
```
- The bot faces +Z, up is +Y, units are metres (about 0.62 long, 0.49 wide, 0.86 tall from the pad undersides to the crest). L is the bot's own left, which is +X.
- The rest pose written into the nodes is the first frame of `Hover`.
- **ProjectorLens (hologram anchor) is now on the crown of the head**, a child of `Head`. It is a small brass projector with a cyan glass disc facing up, set just ahead of the plume crest. The node origin is the centre of the glass: local (0, 0.048, 0.038) in Head space, which is about (0.02, 0.44, 0.19) in Body space in the rest pose. Start the beam there and run it up +Y. I chose the crown over the chest because the neck curves up and forward from the chest, so a beam rising from the chest would run through the neck, and because nothing is left on the back to sit on. On the crown the beam is clear of the neck and the rider. The anchor follows the head, so set the beam's orientation from the world up axis (the head tilts during `Fly`, `Flip` and `Point`).
- Materials: Shell_Violet #9A78CF, Shell_Deep #6E4FA8, Shell_Light #B9A0E0, Apricot #F7A66E, Brass #C9A14A, Dark #23272E, and LED_Cyan (emissive, KHR_materials_emissive_strength). The saddle adds Leather_Coral #E8694A, Leather_Tan #F49A55 and Leather_Stitch #A93D2E. All use doubleSided.

## Saddle (replaces the brass projector knob)
- `Saddle` is a child of `Body` and is not animated. It is one mesh with four materials (coral, tan, stitch, brass).
- **Seat:** broad, low and contoured. About 0.17 long (f from -0.125 to +0.046) and up to 0.17 wide at the cantle, narrowing to about 0.10 at the pommel. It has a shallow dish, a raised pommel in front and a raised cantle behind. The tan centre panel is bordered with coral, with a thin rust stitch line inside the edge, and a skirt that drops down to the body. The body shell plates under it are removed.
- **Girth strap:** a flat coral band around the barrel at f = -0.115 (behind the wings, well behind the knees), with a small brass buckle on each side.
- **Stirrups:** two flat straps hang from the front corners of the saddle down the flanks at f = +0.052, each ending in a small brass stirrup with a rust tread bar. They sit ahead of the wing hubs and beside (not under) the knees.
- The wing arm is now 0.04 longer (the fan starts further out), and the tucked wing pose in `Walk` hangs down the flank. Both changes keep the wings off the saddle and straps.
- **Clearance check (built into `build.py`):** I tested the saddle's triangles against the wings, legs, tail, neck and head on every frame of all 9 clips, in both LODs, with BVH triangle overlap. There are 0 overlapping frames in every clip. The check is on the mesh surfaces, not on a thick safety margin, so clearances of a few millimetres are possible in the model's own units (about 1 cm at gallery scale).

## Leg joint structure (real ostrich anatomy)
Each leg is a 4-pivot chain. The pivot is the node origin, and each child hangs off its parent.
| node | pivot is... | mesh on it | motion |
|---|---|---|---|
| `Leg_L/R` | hip | short thigh, hidden inside the body | tiny rock only |
| `Knee_L/R` | TRUE knee, high up at the belly edge, mostly hidden by feather plates and a brass cap | feathered upper shin, then bare tibiotarsus (long shin) | bends **forward** |
| `Ankle_L/R` | ankle (intertarsal) joint, the visible brass joint partway down the leg | long metatarsus with a brass band and a shell guard | apex points **backward** (the "backwards knee"); flexes backward on the lift |
| `Foot_L/R` | base of the metatarsus (toe pivot) | hover pad (brass rim, apricot top, cyan glow underneath) plus **two toes**: a big inner toe with an apricot claw and a smaller outer toe with a small claw | toes lift on the swing, press down on push-off |
Segment lengths are about 0.19 for the shin and 0.175 for the metatarsus. The thigh is about 0.07 and is mostly buried in the body.
The clips drive Knee, Ankle and Foot from one 2-bone IK solver in `build.py` (`leg_ik`, `walk_target`). It always picks the solution whose ankle apex points backward, so the joint never folds the wrong way. That solver is baked to plain rotation keys, so there are no IK nodes in the file.

## RiderSeat (card #314)
- An empty child of `Body`, so it moves with the bob, the tilt and the flip. The glTF axes are +Z forward and +Y up, with no extra rotation.
- **Local position (in Body space, metres):** x = 0, y = **0.426**, z = **0.0**. It is on the centre line, over the middle of the saddle seat. The dished seat surface there is at y 0.136, so the anchor is 0.29 above the seat.
- **Height above the ground in the Walk pose:** about **0.86** (range 0.85 to 0.87 over the cycle, 0.87 at the first frame). The ground is the lowest hover-pad underside in the cycle.
- I chose 0.29 above the seat as a sitting person's eye height, assuming the gallery scales the bot by about 2.6, so a 0.86 m model becomes about 2.2 m. If you use a different scale, scale this node's y offset with it.
- One thing to handle in the gallery: the neck rises directly ahead of the seat, about 0.12 forward, so a camera on this node looks straight into it. Set the camera near plane past it, hide or fade `Neck` and `Head` in rider mode, or offset the camera a little to one side or up. The hologram beam now rises from the head, so it no longer passes through the rider.

## Animation clips (24 fps, all 9 are in both files)
Every clip drives the same 16 channels (rotation on 14 nodes, plus translation on `Body` and `Neck`), so crossfading between any two clips never leaves a node stuck. Clip order in the file is Walk, Fly, Takeoff, Land, Flip, Point, Point_L, Point_R, Hover, so look clips up by name.

| clip | type | duration | what it does |
|---|---|---|---|
| `Walk` | loop | 2.0 s (2 strides) | Default. Stance 45% / swing 55%, so there is a short floating phase with both feet up. Long, springy strides (about 0.22 m). The ankle flexes backward on the lift and the foot swings forward with toes up. Body level, tilted about 4° forward. Neck and head bob twice per cycle, counter to the steps. Wings tucked (hanging down the flank, clear of the saddle). |
| `Takeoff` | one-shot | 0.54 s | Walk pose, crouch, hop, wings open and flap, legs go to the trailing pose. It ends on the first frame of `Fly`, so crossfade or play it straight into `Fly`. |
| `Fly` | loop | 1.0 s | Body pitched forward about 19°, neck and head stretched forward, fast flap (4 Hz), legs and tail trailing. |
| `Land` | one-shot | 0.54 s | Starts on the first frame of `Fly`. Feet reach forward, the wings flare and slow, the body dips on touchdown, and it ends exactly on the neutral walking pose. |
| `Flip` | one-shot | 1.0 s | Forward somersault (360° nose-down about the body). Small crouch, then a 0.14 m hop arc. Legs and neck tuck in, wings flare and flap, and it lands in the neutral walking pose. |
| `Point` | one-shot | 1.5 s | Same as `Point_R`: points to the bot's **right** (-X). |
| `Point_L` / `Point_R` | one-shot | 1.5 s | Starts and ends on the neutral walking pose (feet planted). The neck rolls out sideways about 57° and tips forward, and the head drops so the beak points out and down. That keeps the neck out of the view straight ahead. It holds for about 0.45 s with a small beak tap, then returns. Body leans slightly toward the side. `Point` and `Point_R` are separate copies of the same motion. |
| `Hover` | loop | 2.0 s | Idle hover: bob, slow neck and head sway, wing flutter, legs hanging relaxed. Its first frame is the rest pose stored in the nodes. |

**Neutral walking pose** is the first frame of `Walk` (left foot planted forward, right foot back, about to lift). `Takeoff` starts there, and `Flip`, `Land` and the `Point` clips end there. `Walk` can resume with no pop.
**One-shots:** play them with `LoopOnce` and `clampWhenFinished = true`, then crossfade back to `Walk` (about 0.2 s).
**Flow:** Walk (default) → Takeoff → Fly → … → Land → Walk. `Flip` is defined as a ground hop that starts and ends in the walking pose, as asked. If you want it mid-air for emphasis (Fly → Flip → Land), crossfade into it and out of it. The flip's start and end poses are walking poses, so expect a visible blend there.
The old duck-style `Waddle` clip is gone (replaced by `Walk`). The clips only move Body and its descendants. They never touch OstrichBot or the world position.

## Checks
- `gltf-transform validate`: 0 errors, 0 warnings (the only info is that the validator doesn't know EXT_meshopt_compression). The uncompressed export also validates with 0 errors, 0 warnings, 0 infos.
- The compressed files decode cleanly (7,818 / 2,132 triangles, no NaNs). The hierarchy and names above are intact in both. All 9 clips are present in both files with the durations in the table (checked after compression).
- Compression: I didn't use the `gltf-transform meshopt` CLI. Its position quantization wrapped every mesh in an extra unnamed child node and broke the named-node layout. `build.py` runs a small node script instead (dedup, prune, resample, reorder, then EXT_meshopt_compression). That keeps names and hierarchy unchanged. The same script also drops scale channels and translation on nodes that only rotate, and re-bases clip times to start at 0. Looping clips get a closing key so there is no held frame.
- GLTFLoader needs `MeshoptDecoder` (`loader.setMeshoptDecoder(MeshoptDecoder)` from three/examples/jsm/libs/meshopt_decoder.module.js). I found no GLTFLoader use in play-tags or tag-gallery yet.
- preview.png: Cycles renders of the built model in its Hover rest pose, with LOD0 on the top row and LOD1 on the bottom row (front, side, 3/4). Below them is a saddle row (top view with the front at the top, side view, and a rider's-eye view from the RiderSeat anchor), then pose strips for `Walk` (side), `Flip` (side) and `Point` (from the front; the head swings out to the bot's right, which is the left of the image). The strips are LOD0 poses evaluated from the animation in Blender. They were not rendered from the compressed .glb, because Blender can't import meshopt. I also rendered Walk, Fly and Hover poses from the uncompressed export as a spot check, and the ankle apex points backward in all three.
