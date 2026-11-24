# #479 facade window mesh cards (for #358) — Oct 26 2026, not deployed
- make.py (Pillow, seed 358): frame-{single,mullion,arched}.png/.webp 512×768 + .phone.webp 256×384. Slate #3A3432 frame, plaster #E9E5DC trim+sill, transparent opening exactly 22–78% x × 18–82% y (arched: semicircle top inside that box). Mullion = 2×3 panes; arched = transom + center bar.
- build_windows.py (Blender 4.2.3 -b): window-{shape}.glb, ~9–10 KB each (WEBP embedded). Root empty Window{Single,Mullion,Arched} → {Name}Frame (alpha-clip textured quad, UV 0–1), {Name}Glass (dark 35% blend quad 5 mm behind), GlowAttach empty at center 1 cm in front. Card 0.667×1.0 m, origin bottom-center; scale to size_m 0.8×1.2 (x1.2 uniform).
- No meshopt (not needed at this size). preview.png = cards over glow-*.png.
- window-glows-358 and play-tags untouched.
