# Story plaques (#335) — design note

## Copy source (Writer)
Markdown files under `/workspace/creative/artbook/plaques/slug.md`:

```yaml
---
group_id: <kebab>
paintings: [<catalog ids or product slugs>]
title: <max ~60 chars>
status: draft | tj-approved
---
<body ~120 words, first person as TJ, no prices, no emojis>
```

Ship only `status: tj-approved`. Prefer one plaque per gallery-defined group when a shared story covers several paintings.

`story-plaques.json` in this folder is a **derived stub** (8 groups, 26 ids mapped from stories.md / catalog). Writer’s markdown is the contract; regenerate or replace the JSON from those files when integrating.

## Placement
- Plaque face ~0.45×0.28 m at **1.45 m** eye line (existing plaque rule), never blocked.
- One plaque per group, centered near the hung set.
- Face: title + body (~120 words). Expand panel later if needed.
- No prices. Silent when muted. Preview only until TJ OKs live.

## Visual assets
Blank textured plates (desktop + phone, `text_rect_uv`) → `/workspace/gallery-courtyard/story-plaques/` (in progress).

## Open questions (from stub pass)
- Temple "Blue" not found in catalog (`archived-painting-20` maybe).
- Ukraine catalog id/title mismatches; stories.md still asks TJ to confirm titles.
- Bass Coast: only Sunrise 2023 #1–4 in the group (not portraits / Sienna Dawn).
- Sedona: TJ’s Bell Rock / Monuments only (not Paul Murphy’s Sedona set).
- Separate "Sunset in Atami, El Salvador" book-art not in Atami #1–3 group.
