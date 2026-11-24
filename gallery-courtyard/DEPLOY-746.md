# #746 scan -> guidebot+cart -> pull-off. DEPLOYED Tue Oct 27 2026 ~11:52 AM PT
Deployment a1750363-0496-4524-82f0-2658d6b48b09 on preview-251 (replaces d156030b). Entry index-Bejp4mBV.js. Hex-only (play-tags local files); museums untouched.
- Cart mess, root cause: play-tags/src/tags.js clearEggs() moves every /^egg-/ scene object out of painting viewing zones; the trolley is 'egg-cart',
  so while the ostrich pushed it toward a painting it got yanked ~3 m away, then glided back, repeatedly. Fix: 'cart' added to the exclusion regex.
  Plus agents.js (play-tags override): while pushing, the trolley sits rigidly at the bot's hands (same 0.81 m offset + yaw); only jumps >0.5 m glide.
- Slow arrival, root cause: phase 0 sent the bot to a hidden doorway to "fetch" a trolley (follow up to 30 s), and deliverPurchase set D.wait=0, which idle reads as 2 s.
  Fix: the trolley appears at once (bot+trolley pop in beside the painting if >4 m away, else in front of the bot); wait 0.01; push to painting 2.6 m/s (was 1.6).
- Thrusters detached, root cause: ostrichbot.js pins the bird's feet to y=0 (#737) even while the drone root hovers, so the jets (on the drone rig) rose alone.
  Fix: while drone.hover, holder adds root.y-RIDE, so the bird rises with the drone. Drone return object exposes get hover().
- Probe tests/_cart746.mjs (game-time): cart at 0.06-0.1 s (was ~2.6 s idle + doorway trip; 60 s wall run never got a cart), max cart offset 0.169 m (wall stop), yaw 0.1 deg, ostrich detach 0 at 0.76 m lift.
  Local desktop+phone PASS; LIVE desktop PASS; LIVE phone FAIL only because the bot was in 'rejoin' (cart at 1.6 s > 1.5 s probe limit; offset/attach all fine).
- tagsaudit desktop+phone PASS local + LIVE (phone mute check flaked once locally, 3 reruns PASS). _hud738 PASS LIVE; _feet737/_ring739/_hang743 OK local.
- NOT DEPLOYED (in src, built locally only): deliverPurchase also interrupts 'rejoin' and always sets D.wait=0.01 (fixes the LIVE phone 1.6 s case); local cart746 3/3 PASS. Ship with the next deploy.
- Rollback: cp /tmp/tags.js.pre746 /workspace/play-tags/src/tags.js; cp /tmp/ostrichbot.js.pre746 src/ostrichbot.js; cp /tmp/agents.js.pre746 src/museum-eggs/eggs/agents.js; rebuild/gen/splice/execute;
  or re-run /tmp/execute.js.pre746 (restores d156030b). /tmp/execute.js.746 = this deploy.
