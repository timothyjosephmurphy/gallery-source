# Wall title plates (#354 family): Reiki, Bounty of Satoshi, Ukraine
These are larger header versions of the short labels in `../group-labels-354/`. They use the same mosaic style from palette.md. The field is Dawn Plaster `#F3E6D8` with blue, violet and apricot flecks under a soft watercolor wash. Letters are Dusk Slate `#5E7289`. The border is a Terracotta Ember `#C8644E` outer band with a Gilded Ochre `#F7CC3A` inner line on Grout Ash. Titles are baked in.

## Files
Each plate has `plate-<id>.png` (1536×384 master), `.desktop.webp` (1536×384) and `.phone.webp` (768×192). `plates.json` gives id, title, files, px, worldSizeM [2.0, 0.5] and a pointer to the matching small label.

## Placement
These plates have **no wall ID**, so Gallery assigns the wall. Suggested size is 2.0 × 0.5 m (4:1; don't stretch). Center the plate above the group's hang grid. The bottom edge should be about 0.2 m above the top frame row, roughly 2.3–2.6 m high, or on a door header. Use the large plate on the main wall and the small `label-*` from group-labels-354 on secondary walls or doors.

## Regenerate
`python3 make.py` (Pillow only, seed 3541). It is derived from the group-labels-354 generator, scaled 1.5×. Add more titles in `TITLES`.
