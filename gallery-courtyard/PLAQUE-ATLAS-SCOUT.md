# Plaque atlas SCOUT (Mon Oct 26 2026 ~10:05 PM PT) — scout only, no code change
LIVE preview-251 = b76722e8 (index-D-mszu1_.js). Hex/tag gallery only.

## What actually exists
- `play-tags/src/plaqueTex.js` (`tierPlaqueTex`) is NOT the hang-plaque path. It only serves the **4 `brass-plaque`** room plates
  (tags.js:190-191, images `public/plaques/*` 3.7 MB src -> `public/plaques-webp/*` 344 KB, 4 files; gen.py embeds them as `/plaques/*`).
- The ~310 hang plaques come from the core engine `plaqueMesh()` (main.js.orig:714-722, patched via tools/patch-core.py #8):
  per painting a **512x160 canvas** -> own `CanvasTexture` (sharp()) -> own `MeshBasicMaterial`, shared `unit` plane, scaled
  0.28x0.0875 m (or plaqueAt w/h), parented to the painting's `p.group` (p.plaque).
- `p.group.visible` is toggled per painting each frame (dist<24 or same room) — so most plaques are already culled; the real
  per-frame plaque draw count is "paintings in view range", not 310.

## Estimate
- Draws: theoretical 310 -> 1-2 (InstancedMesh + per-instance UV offset) only if all were visible; realistic in-view savings
  ~20-60 draws in a room (plaques ride the same visibility as their paintings, which still cost their own draws).
- Atlas: 512x160 cells -> 8 cols x 25 rows per 4096^2 page => 2 pages (or 1 4096x8192, not phone-safe; many phones cap 4096).
- GPU memory: current ~310 x 512x160x4 x1.33 ≈ **135 MB** (desktop). Two 4096^2 RGBA pages w/ mips ≈ **179 MB** (padding waste)
  — no saving unless cells shrink (e.g. 384x120 -> 1 page ≈ 89 MB) or low tier uses 2048 pages. Texture uploads 310 -> 2 (startup win).
- Mip bleed between cells needs 4-8 px gutters / clamped UVs; text sharpness at 1 m may drop slightly.

## Risks
- **Picking / plaqueEnlarge337**: show() uses `mesh.material.map.image` / `userData.fullSrc` -> with an atlas it would show the
  whole atlas page. Needs per-plaque canvas/region crop + raycast instanceId -> painting mapping. Hang plaques today are unnamed
  core meshes; PLATE_RE (`plaque|label|brass|wtitle|glabel`) matching must be preserved. HIGH.
- **Per-painting visibility/movement**: plaque follows p.group (culling, state 'wall', temple shared plaque `visible=false`).
  Instancing breaks this unless instance matrices are rewritten per frame. HIGH.
- **softWarnings / builderErrs**: low if fail-soft, but atlas text redraw on status change (sold dot, price) must re-upload a page.
- **gen.py plaques-webp**: unaffected (that path is the 4 brass plates only). Low.
- Core edit means patch-core.py churn shared with other galleries (`//#if tags`) — extra blast radius.

## Recommendation: **HOLD**
Savings are small after existing distance culling, memory does not drop at the same cell size, and enlarge/picking/visibility
would all need rework. Cheaper alternatives if plaques show up in a fresh `_drawscout`: (a) shrink canvas to 384x120 on LOW
(memory -44%, zero behavior change), (b) per-room lazy plaque canvas creation. Revisit only with a measured in-room draw count.
