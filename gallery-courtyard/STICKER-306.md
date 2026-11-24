# STICKER-306 scout (Oct 26 2026, 3:20 PM PT) — #306 sticker bot, #307 wall stickers

## Assets ready?
**Mostly yes.** `sticker-bot/sticker-bot.glb` (v3 pod, 289 KB, 9,566 tris, preview.png, SIZE.md, Blender build script; v2 kept in `v2/`).
Named nodes ready for code hooks: `Button`, `ButtonRing`, `StickerSlot`, `SlotMouth`, `BackScreen`, `ProjectorLens/Glass/Barrel/Beam`, `Leg_1..4`.
- No baked animations (fine: button press, sticker strip feed/fall and beam are code-driven).
- **Spec gap:** #306 asks for **three** legs; v3 has **four**. Needs a TJ/Visual call or a 3-leg rebuild (script exists, cheap).
- Not draco/meshopt-compressed yet; 289 KB is OK for phones but run gltf-transform before ship.
- Sticker art: no in-game sticker textures/decals yet. `/workspace/moo-cards/stickers-metallic/` has 3 real sticker JPGs (el-zonte-at-dawn, honeybadger-and-cub, warszawska-syrenka) usable as placeholder decals after downscale to webp.
- Not referenced anywhere in gallery code yet (only on the box + staging copy).

## Blocked on Visual?
**No, not hard-blocked.** Gallery can wire with the current GLB. Soft dependencies on Visual: leg count (3 vs 4), final sticker art / Neural Dance pose sprites for #307.

## Overnight wire possible?
- **#306: Yes (local branch only, no deploy).** Place GLB by Neural Dance off walkways, collider/audit check, Button raycast (click/tap/use key), strip-of-stickers feed+fall from `SlotMouth`, beam + projected Neural Dance sim on wall (render-target or existing sim canvas texture), mute-silent, phone perf check.
- **#307: Partial.** Pickup/carry/stick as wall decals with cap (e.g. 24) + painting-exclusion + reset on reload is doable overnight with placeholder art; the Neural Dance pose-capture tie-in is stretch and should follow #306.

Not done: no deploy, no play-tags edits, no Selected Galleries changes.

## LIVE (Oct 26 2026, ~3:26 PM PT)
Deployed to preview-251: https://preview-251.tjm-tag-gallery-preview.pages.dev/play/ (deploy c2d14ea6). tagsaudit desktop+phone PASS. /play/sticker306/ glb + 3 stand-in webps all 200. See DEPLOY-306.md.

- Oct 26 ~3:55 PM PT: 3-leg GLB (85,016 B) wired, legsFound 3, tagsaudit PASS, preview-251 deploy 48909dcf. See DEPLOY-STICKER-3LEG.md.

- #465 (Oct 26): forced ND aim (art → mesh bbox → stub), strip art confirmed as real stickers, comments fixed. Code and audit PASS, not yet deployed.
