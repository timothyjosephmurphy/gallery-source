# #340 theater look-dev light probes (preview only)
These are soft gradient LDR equirectangular env maps (2:1). They are procedural, not photographs, and are for a black-box look in the Cassandra concert-hall room (#10). Feed them to three.js PMREM; the snippet is in `probes.json`.

| id | look | exposure | envMapIntensity |
|---|---|---|---|
| probe-warm-key | tungsten key high stage-left + apricot fill | 1.0 | 0.9 |
| probe-cool-wash | cool LED top/side wash | 0.9 | 0.8 |
| probe-magenta-accent | restrained magenta upstage rim + violet | 0.85 | 0.6 (keep ≤0.7) |
| probe-neutral-house | dim warm house lights / walk-in | 0.7 | 0.5 |

Files: `<id>.png` (1024×512 master), `<id>.webp` (1024×512), `<id>.phone.webp` (512×256). Orientation: u=0.5 faces +Z, toward the audience. `probes.json` lists each light's azimuth, elevation and spread so Gallery can match real SpotLights and #340 gobos to them. Pair warm-key with gobo-breakup warm, and cool-wash with gobo-dots. Crossfade probes with the Music #180 cues later.

Regenerate with `python3 make.py` (numpy + Pillow, seed 340).
