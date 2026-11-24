# #805 B4 world-map pins (TJ approved exhibitions-349 as drafted, Oct 27 2026 ~11:55 PM PT)
LIVE: deployment 206bd5ea-a09e-49a8-8771-d08139628d0b, index-Dw8TCvKW.js (replaces #804 2a2091ce / index-CH4U97Hn.js).
- data/exhibitions-349.json is now approved:true, status approved; copied to play-tags/src/exhibitions-349.json.
- testimap.js shows exhibition and mural pins (7+3) next to 6 collector pins, with duplicates offset. The legend sits bottom right and the title shows all three counts. Cards show the cardLine. The escort button / click again only works when a room is set, via __wallMap.go. Null room = card only.
- The pin sheets and legend ship inline in gen.py at /img/play/preview-251/testimap/exhibitions-*.webp because they are not on R2.
- Audits: DOORCHECK and TAGSAUDIT pass on desktop and phone, local and LIVE. DMT 0. tests/_t805.mjs is the pin and card probe.
- Rollback: /tmp/execute.js.804. Source snapshot: /tmp/pre805/.
