# #391 plaque WebP status (scout only, no ship) Mon Oct 26 2026 ~7:27 PM PT
- ALREADY LIVE. gen.py embeds public/plaques-webp/*.webp under the /plaques/*.png keys. LIVE fe20c932 /play/plaques/cormorant-label-plaque.png returns content-type image/webp with RIFF/WEBP bytes. All 4 plaques have webps: 344 KB vs 3.7 MB PNG in dist/plaques.
- Remaining (optional, needs TJ OK): rename the URLs/keys to .webp, and/or stop copying the 3.7 MB PNGs into dist (cosmetic only, no payload win). Nothing blocks it.
- Side note: catalog "assets/*-plaque.png" refs (e.g. friends-club-plaque.png) 404 on LIVE. They are probably unused, so verify before touching.

## Prior content (reconstructed from studio-tracker #391 comments; the original file was overwritten by mistake at ~7:27 PM PT)
- ~5:30 PM PT offline measure: JS gzip main 223K, museum.config 174K, eggs-run 122K, and no base64 PNGs in the JS chunks. The 4 plaque PNGs (friends-club, eagle, cormorant-label, friends-club-teaser) are 3.81 MB in total vs 0.36 MB as webp q88. Candidates are in gallery-courtyard/hex-perf-391-webp/.
- Sharpness check: all 4 PASS (PSNR 38.5-43.3, edge energy 98-104%, side-by-side clean).
- PERF invent 2 (~3:45 PM PT): the webps were copied to play-tags/public/plaques-webp/ and gen.py prefers them. Every deploy since then has served webp bytes for /plaques/*.png, which is why the payload win is already live.
- Draw-call/LOD numbers still need a renderer.info browser run.
