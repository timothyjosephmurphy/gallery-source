# Ostrich guide-bot bump / PBR maps — studio-tracker #470
Private invent pack. Original procedural (numpy+Pillow, seed 470); no scraped textures, no game assets. No GLB remesh, no deploy.

## Files
- feather-n / feather-r / feather-ao: .png (2048²) + .webp (2048) + .phone.webp (1024). Normal = OpenGL +Y (three.js default; flip G for DirectX).
- skin-n / skin-r: 1024×256 strips (+ webp, phone 512×128) for legs/neck.
- materials.json — suggested MeshStandardMaterial knobs (metalness 0, roughness 0.45–0.85, normalScale 0.8 feather / 0.5 skin).
- preview.png — purple sphere lit with feather normals + map swatches. make.py — `python3 make.py` regenerates all.

## UV assumptions
- Feather maps tile in both U/V (wrap-safe); feather tips point toward +V-down (image bottom) — orient body UVs so V runs head→tail. Default repeat 4×4; raise for small-UV islands.
- Skin strip: U wraps around leg/neck circumference (rings run along U), V along length; repeat [1,3].
- Use existing GLB UVs. aoMap uses uv (three r15x+ reads aoMap on uv by default; older needs uv2 = uv copy).

## Gallery wiring
Load with TextureLoader, set wrapS/T = RepeatWrapping, colorSpace NoColorSpace (linear) for all maps; assign onto the ostrich's existing body/feather material (keep its purple base color), legs/neck → skin. Phone tier: swap `.phone.webp`, normalScale 0.6. Map play-tags per materials.json `playTags`.

## Links
- Tracker: studio-tracker #470
- Feeds closed #321/#322 polish and #199/#289.

Time: 0h 10m
