# #304 phone controls: brief (Oct 26 2026)

**What shipped** (play-tags only, preview-251, deploy 6e6193dd): src/phone304.js, installed from tags.js. Turns on for touch / coarse-pointer devices.
- Tap-to-move: a quick tap on the floor or a doorway glides you there, with a glowing target ring, and stops short of walls. A tap on a painting farther than the open distance glides you to a viewing spot in front of it. Closer paintings still use tap-to-open.
- Floating stick: press and drag in the lower-left (#tmove) zone. A knob appears under your thumb and disappears on release. Movement uses the existing relative-drag handler.
- Any stick or key input, or a drag, cancels a glide. UI elements keep priority.
- tagsaudit desktop and phone both PASS.

**Tour-overlay gap:** while the tour is on (`window.__tourOn`), and during reading, freeze, chaos, falling, swarm and cart, tap-to-move and the stick are switched off. The tour keeps its own pad. The floating stick does not show over the tour overlay yet, and no audit covers phone input during the tour.

**gallery-core port: on hold.** hex is replacing gallery-core and the old museums, so #304 stays in play-tags only. Nothing was ported.

## Tour-overlay follow-up (Oct 26 2026, NOT deployed)
- Owner: `#tourCtl` in play-tags/src/tour.js (touch branch). On touch it no longer shows the fixed left move pad or the "Left thumb: hold and slide" label. The right look-drag hint stays. Desktop keys panel is unchanged. phone304.js is unchanged, and tap/stick stay off while `__tourOn`.
- Backup: /tmp/tour.js.pre304tour. Build: /tmp/ptbuild-304-tour/dist (vite build OK; tour chunk has no "Left thumb").
- Not deployed, and there is no phone-during-tour audit yet.
