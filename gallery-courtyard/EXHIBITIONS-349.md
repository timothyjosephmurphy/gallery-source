# #349 exhibitions map — status (Gallery)

**Writer draft ready** (Oct 26 2026 ~3:50 PM PT):  
- Data: `/workspace/gallery-courtyard/data/exhibitions-349.json` (`status: draft`, `approved: false`)  
- Notes for TJ: `/workspace/gallery-courtyard/data/exhibitions-349-NOTES.md`  
- Six cities / 10 shows; rooms where confidence allows; null for Intiman / Living Room / Cormorant / Friends Club murals.  
- Card lines: `Name · City · Date`; cta only when room is set.

## Gallery hold
- **Do NOT wire** into testimap / wallmap until TJ sets `approved: true` (and resolves open room decisions in the NOTES).  
- Visual still needs a distinct exhibition pin + legend.  
- Overnight: no TJ ping; pack waits for live session via Writer.

## Wire plan (after approve)
- Load exhibitions-349.json into testimap (or sibling) pins.  
- CTA → `__wallMap.go(room)` when room set.  
- Keep murals/null as card-only unless TJ assigns rooms.
