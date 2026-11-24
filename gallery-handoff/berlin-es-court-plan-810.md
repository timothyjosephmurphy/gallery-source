# #810 Bitcoin Courtyard (courtyard-btc) remodel: Berlin, El Salvador court (Oct 28 2026)
LIVE preview-251 deploy 1f9e23a3-99a3-4459-bce4-28f8eb7261b4, index-C5YXbgGz.js (nest 810, prev 809).
Rollback: /tmp/execute.js.809 (= Maeve #809 live, index-B2UgW__D.js) + /tmp/catalog.json.809 (also /workspace/catalog.json.pre810.bak).

## Built vs. refs (berlin-es-court-refs-2026-10-28/01-07)
- Concrete court: weathered grey, with cracks and slab joints. Yellow lines: a sideline along the sidewalk, a centre line, a centre circle, and a key + arc under the hoop (01/04/05).
- White hoop: square concrete post, weathered backboard with a black border, orange rim, white net. It stands left of the sign, facing the court (01/05/07).
- One-storey white building (4.25 m, full 16.7 m wall): grime and rain streaks, pilasters, a dark corrugated roof with an overhang and rafter tails, a yellow lattice gate (left), a barred window, a small cross window, a pipe and a meter box (01/02/05).
- A tile sidewalk and a white curb, with 8 big white concrete blocks. The orange sign rests on the blocks (02/03/06).
- Sign: perspective-rectified crop of TJ's ref 01 (public/art/berlin-es-sign-810.webp, 2048x584). Size is 3.05 x 0.87 m, scaled from TJ in ref 02. It has a plywood edge, and the brown frame is hidden.
- A small soccer goal with a net, right of the blocks (06), and a soccer ball on the court.
- A tree-covered steep mountain rises behind the roof (01/04).
- #784 steeples are kept but shifted aside and scaled to 0.8.
- The red-roof shelter is supported (court810.shelter) but turned off, to keep the court uncrowded.

## Skew fix
The old texture was an angled hero photo with people in it. #790 also extended its edge colours across the wall.
- The texture is now a rectified frontal sign.
- The plane sits 0.20 m off the wall line, in front of the facade (old: 0.14 m).
- Its rotation equals the wall's (ry -1.0472), and its bottom (0.62 m) = the block top.
- blend790 is removed from this wall; the module is kept and is a no-op.

## Files
New: src/berlinCourt810.js, tools/nest810.py, public/art/berlin-es-sign-810.webp, tests/_shot810.mjs and _shot810live.mjs.
Edited: src/tags.js (import + install), src/steeples784.js (optional steeples810 shift), deploy/gen.py (ships -810 art inline), src/catalog.json (via nest810).
