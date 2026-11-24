# #306 Sticker bot — 3-leg rebuild
- Legs: 3 (verified in GLB: Leg_1, Leg_2, Leg_3; Leg_4 removed). Leg_1/Leg_2 front pair unchanged; Leg_3 moved to back near centre (hip x +0.01, y 0.05), tripod.
- Kept nodes: Button, SlotMouth, Leg_1..3, ProjectorBarrel/Beam/Glass/Lens.
- Output: sticker-bot.glb = 85,016 bytes (meshopt, EXT_meshopt_compression + KHR_mesh_quantization); target ≤300 KB met.
- Prior 4-leg: sticker-bot.glb.bak (288,756 bytes, uncompressed).
- Method: Blender not on box, so GLB edited with gltf-transform (removed Leg_4 subtree, translated Leg_3, prune, meshopt). build_sticker_bot.py legs list updated to the same 3 legs for future Blender re-runs. preview.png / SIZE.md still show v3 4-leg.
- Time: 0h 3m
- Wired Oct 26 ~3:55 PM PT: play-tags loads this GLB (both sticker306 names), legsFound 3, tagsaudit PASS, preview-251 deploy 48909dcf. See DEPLOY-STICKER-3LEG.md.
