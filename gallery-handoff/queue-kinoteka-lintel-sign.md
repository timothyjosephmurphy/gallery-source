# Kinoteka lintel sign (TJ walk fix Oct 28 2026 via SM)

Queue: after #817; batch with Paul doorway widen / #818 entrance pack. Fix-only / signage.

## Scope
Add “Kinoteka” on the lintel / awning face of the tall PAUL MURPHY–style facade (four white pillars, protruding awning). Shot: `gallery-handoff/kinoteka-lintel-sign-tj-2026-10-28.png` (gold crosshair on that lintel).

Match gallery entrance-sign style (same family as PAUL MURPHY arch lettering). Keep entrance signs; no on-wall tile/group plaques.

## Notes
- Kinoteka plaza/portico from #800/#801 (`kino800.js`); nest notes kino800/kino801.
- Report LIVE + commit + index when shipped.

## Build hint (live tree)
`src/kino800.js` already draws spaced `K I N O T E K A` on the portico entablature canvas (`#5f5a52` on `#ddd6c8`, mesh `E` at z~10.2, `rotation.y = Math.PI`). TJ shot shows blank lintel with PAUL MURPHY only on the tower attic — so either the text is too low-contrast / wrong face / occluded, or needs restyle to match gold gallery entrance signs (same family as PAUL MURPHY arch lettering). Fix visibility/style; don’t invent a second portico.
