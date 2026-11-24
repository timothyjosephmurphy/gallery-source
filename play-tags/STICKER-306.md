# STICKER-306: sticker-bot.glb compression (Oct 26 2026)
- Before: 288,756 B (282 KB) — backup at public/sticker306/sticker-bot.glb.bak (also gallery-courtyard/sticker-bot/sticker-bot.glb.bak)
- After: 152,800 B (~153 KB, -47%) — gltf-transform 4: dedup → prune --keep-leaves → quantize (KHR_mesh_quantization)
- Why not Draco/meshopt: src/stickerBot306.js uses a bare GLTFLoader with no DRACOLoader/MeshoptDecoder set, so those would fail to load. Quantization is decoded natively by GLTFLoader. To go smaller later, add setMeshoptDecoder to the loader and run `gltf-transform meshopt` (~50-70 KB est.).
- Verified: gltf-transform validate = 0 errors/warnings; three GLTFLoader.parse OK, 9,566 tris, all 63 node names identical (Button, SlotMouth, StickerSlot, ProjectorLens/Glass/Beam, Leg_1..Leg_4 — four legs, unchanged).
- Not deployed.
