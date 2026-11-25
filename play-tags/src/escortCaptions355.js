// #355: temporary text captions for wall-map escorts (no audio yet; lines from notes/map-escort-lines-355.md).
// Keyed by room id (tag-gallery/data/layout.json). Ambiguous rooms fall back to GENERIC (see ESCORT-355.md).
export const GENERIC = "Okay, I'll take you there.";
export const LINES = {
  checkout: "Okay, I'll take you to checkout.",
  'room-01': "Okay, I'll take you to the Tahoma and Rainier gallery.",
  'room-02': "Okay, I'll take you to the Brekkie Bitcoin gallery.",
  'room-03': "Okay, I'll take you to the Mexico and Pacific Northwest gallery.",
  'room-04': "Okay, I'll take you to the Festival gallery.",
  'room-05': "Okay, I'll take you to the Family gallery.",
  'room-06': "Okay, I'll take you to Portraits and Studies.",
  'room-07': "Okay, I'll take you to the Bitcoiners gallery.",
  // room-08 "El Salvador · Sunset": skipped (possible Sunset/El Salvador merge, TJ intent unclear) -> GENERIC
  'room-09': "Okay, I'll take you to the Sunset gallery.",
  'room-10': "Okay, I'll take you to the Bitcoiners gallery.",
  'room-11': "Okay, I'll take you to the Portrait gallery.",
  'room-12': "Okay, I'll take you to the Seattle gallery.",
  // friends-court: script has both "Friends gallery" and "Friends Court" (Garden court) rows -> GENERIC
};
export const lineFor = id => LINES[id] || GENERIC;
let el = null, t = 0;
export function showEscortCaption(id, ms = 3200) {
  if (typeof document === 'undefined') return;
  if (!el) { el = document.createElement('div'); el.id = 'escort-caption-355';
    el.style.cssText = 'position:fixed;left:50%;bottom:12%;transform:translateX(-50%);max-width:80vw;padding:10px 18px;border-radius:12px;background:rgba(30,22,14,.82);color:#fff6e6;font:600 18px Georgia,serif;text-align:center;pointer-events:none;z-index:9999;transition:opacity .3s;opacity:0';
    document.body.appendChild(el); }
  el.textContent = lineFor(id); el.style.opacity = '1'; window.__escortCaption = { id, text: el.textContent };
  clearTimeout(t); t = setTimeout(() => { el.style.opacity = '0'; }, ms);
}
