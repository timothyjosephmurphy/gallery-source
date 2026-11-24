# #244 never-block — play-tags vs buy-scanner-392 (scout, Oct 26 2026)
Read-only scout; no play-tags edits (#307 deploy in progress), no deploy.

## Verdict: already satisfied for the guide bot + cart (incl. ostrich skin)
- `play-tags/src/museum-eggs/eggs/agents.js:88` guide drone collider `pass:true`; `:161` cart collider `pass:true`.
- Shared core `gallery-core/src/museum-eggs/world.js:167` `pushOut` skips `c.pass` → player walks through both.
- `agents.js:261-276` `slideAside`/`giveWay`: bot and parked cart drift aside off the player's line onto walkable floor.
- Ride/guide ostrich (#314, `ride.js`/`ostrichbot.js`) is a skin on the same drone → inherits pass-through.
- Built `dist/assets/eggs-run-BhjSefyB.js` contains `name:"cart",pass:!0`. #244 is CLOSED (PR vermillionaurora#692, ffdee82).
- buy-scanner-392 pattern (no collision + goal pushed out of 1.5 m cone ahead of player) is equivalent or weaker than live; nothing to port for blocking.

## Gaps (minor)
1. Egg 17 purple ostrich (`agents.js:515`) is a solid collider (r 0.42, no `pass`). It's a shoveable wandering NPC, not the guide, so it's outside #244's wording, but it can block a narrow doorway briefly.
2. `giveWay` is skipped in `tow`/`fetch`/`cart`/`pushing` modes. Pass-through still holds, so these only cause visual overlap, not blocking.
3. No forward-cone goal avoidance (the 392 idea). It's cosmetic: the bot can still park in front of the camera.

## Overnight wire without TJ?
Possible but not needed for #244. Optional follow-up after #307 deploy finishes: add `pass:true` to the egg-17 ostrich collider (one line) + optional 392 cone offset in follow goal. Preview build only, no deploy. Deploy would need TJ's normal sign-off.

## Oct 26 2026: egg-17 follow-up wired (undeployed)
- `play-tags/src/museum-eggs/eggs/agents.js:515` ostrich collider now has `pass: true`, matching the guide drone and cart. It can still be shoved through `E.pushables`.
- Preview build `/tmp/ptbuild-egg17/dist` built OK and includes `name:"ostrich",pass:!0`. Backup of the old file: `/tmp/agents.js.bak-egg17`. NOT deployed.
