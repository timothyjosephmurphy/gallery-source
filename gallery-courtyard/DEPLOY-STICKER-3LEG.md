# DEPLOY 3-leg sticker bot (#306) — preview-251 (Mon Oct 26 2026, ~3:55 PM PT)

Result: **PASS → deployed (1 deploy)**

- Waited: DEPLOY-DEFER-TESTIMAP.md already present (342b1d3c), no gen/deploy in flight → proceeded.
- Asset: gallery-courtyard/sticker-bot/sticker-bot.glb (85,016 B, meshopt+quantized, Leg_1..3, no Leg_4) copied to play-tags/public/sticker306/sticker-bot.glb AND sticker-bot-meshopt.glb.
- Backups: /tmp/sticker-bot-meshopt.pre3leg.glb (97,132 B), /tmp/sticker-bot.pre3leg.glb (152,800 B), /tmp/stickerBot306.js.pre3leg
- src/stickerBot306.js: header = THREE legs (Visual overnight rebuild); legs: 3; legsFound filter Leg_1..Leg_3.
- Build OK (entry index-Cyq1Nst5.js). Headless (vite preview :4318): state "ready", legsFound 3, no page errors.
- tagsaudit: desktop PASS, phone PASS (n=310, all lists empty, dmt 0, mute silent).
- gen.py → _worker.js 2,801,767 B (sticker306: 2 glb + 3 webp); splice → execute.js 2,868,590 B.
- Cloudflare execute, account 3c1fddf0…, project tjm-tag-gallery-preview, branch preview-251, env preview.
- Deployment id 48909dcf-6353-4f5d-a191-5c28f6dad6e2 (replaces 342b1d3c defer-testimap)
- URLs: https://48909dcf.tjm-tag-gallery-preview.pages.dev/play/ · https://preview-251.tjm-tag-gallery-preview.pages.dev/play/ (200; glb 200 85,016 B; serves index-Cyq1Nst5.js)
- Rollback: restore the /tmp backups, rebuild, redeploy.
- Next invent (not wired): Visual frames-301-wave2 and light-probes-340 landed in gallery-courtyard/.
