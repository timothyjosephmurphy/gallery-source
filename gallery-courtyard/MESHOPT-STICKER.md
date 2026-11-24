# Meshopt for sticker-bot.glb (Oct 26 2026, overnight invent)
## Decoder already present
- `play-tags/src/ostrichbot.js:7` imports `MeshoptDecoder` from `three/examples/jsm/libs/meshopt_decoder.module.js` (bundled JS w/ inline WASM, no CDN), wired via `loader.setMeshoptDecoder(MeshoptDecoder)` (line 43).
- `src/stickerBot306.js` used a separate bare `new GLTFLoader()` with no decoder, which is why the earlier compress skipped meshopt.
## Measurement
- `npx @gltf-transform/cli@4 meshopt sticker-bot.glb` → **152.8 KB → 97.1 KB (-36%)**.
- extensionsRequired: EXT_meshopt_compression, KHR_mesh_quantization.
- All 63 node names were kept (Button, SlotMouth, StickerSlot, ProjectorLens/Glass/Beam, Leg_1..4 and sub-joints, neural markers' parents). The code's lookups still resolve.
## Undeployed wire (done)
- New file `public/sticker306/sticker-bot-meshopt.glb`. The original `sticker-bot.glb` is untouched.
- `stickerBot306.js`: added the MeshoptDecoder import, and the loader is now `new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(BASE + 'sticker-bot-meshopt.glb', ...)`. Backup: `/tmp/stickerBot306.js.bak` (also `.pre307` in src).
- `npm run build` OK. NOT deployed; live preview 843208d6 is unchanged.
## Risks
- Not yet visually checked in a browser (leg count / button / projector lens behaviour). The decoder is already in the ostrich chunk, so it adds no bundle cost.
- The meshopt filters are lossy-ish. Check for seams on the claws.
## Next step
- Load preview locally and check `st.legsFound===4`, the button press and the projector. Then run tagsaudit and deploy as preview-251 once.
- Revert: change the filename back to `sticker-bot.glb` (the decoder is harmless).
