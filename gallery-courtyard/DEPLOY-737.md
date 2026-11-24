# #737 ostrich guide feet on floor DEPLOYED Tue Oct 27 2026 ~10:35 AM PT
Deployment c1c14299-c148-4ae6-9935-d19e8a0f2f73 on preview-251 (replaces 56a62895). Entry index-BD1gE4ZC.js.
- Cause: S.minY came from the bind-pose geometry BB (-0.194 holder units); the real Walk-pose skinned foot min is -0.409, so the feet sank ~0.24 m. The plant also ignored the drone root's Y (it settles from ~0.44 to ~0.105).
- Fix (src/ostrichbot.js only): after the Walk snap, re-measure minY from skinned vertices (applyBoneTransform). Plant = `-root.position.y + 0.03 - minY*scale + F.y` (update + rider-off), i.e. feet on world floor y=0 (floor mesh 0.004).
- Probe tests/_feet737.mjs: foot world min 0.005..0.031 walking (was down to -0.235). Screenshot /tmp/feet737.png.
- tagsaudit local + LIVE desktop/phone PASS. Logs /tmp/au737-*.log
- Rollback: /tmp/ostrichbot.js.pre737 + /tmp/execute.js.pre737 (re-run execute to restore 56a62895).
