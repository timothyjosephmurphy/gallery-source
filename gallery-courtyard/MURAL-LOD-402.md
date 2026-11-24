# #402 Mural LOD — landed (build only, not deployed)
Oct 26 2026 3:12 PM PDT
- New: play-tags/src/muralLod402.js (makeMuralLod, updateMuralLods; NEAR 14 m / FAR 20 m hysteresis, checked ~4x/s).
- Far: canvas downsample, max 1024 px (512 on low tier), aniso 2. Near: original full texture, aniso 8 (2 low).
- Hooked in src/tags.js outer-court mural loader (kind 'mural', separate from the painting path) + update(). Murals start far.
- True-size hang untouched: mesh scale/aspect fit uses the full image dims, same as before; only material.map swaps.
- #272 low-tier afterPlayable delay kept. Backup: /tmp/tags.js.pre402
- Build: /tmp/ptbuild-402/dist (vite OK). NOT deployed (#304 deploy in flight). Not browser-tested.
- Note: the full texture is still downloaded once; win is GPU upload/mips + sampling at distance, not bandwidth.
