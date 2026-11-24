# #338/#317 white-border crop pack: wave 2 (Oct 26, 2026, PDT)

The wave-1 items (Catherine #1, Dad Meditating, El Salvador) are in `../white-border-crops-317/` and were not redone here.
Rebuild with `python3 make.py`. It uses the same `margins()` as `data/white_border_317.py` with the soft thresholds (lum≥195, 90% of the line, chroma≤30), plus a 0.4% overshoot to remove the halo. For each id it picks the largest source on the box (social cards and caches are excluded).
Each crop has three outputs: `<id>-317w2.png` (full-res master), `<id>-317w2.webp` (desktop, long side ≤2400) and `<id>-317w2-phone.webp` (half the desktop size).
Numbers are in `borders-wave2.json`. Before/after previews are in `contact-sheet-wave2.jpg`.

## Cropped (7)
- older-work-portraits-319-329-original-4: removed a 9.1% top paper band.
- archived-painting-73: removed a 10.0% top band. Source is the 4372×7007 scan.
- archived-painting-2: removed a 10.1% top band. The band is real, not sky. Source is the 4191×1069 scan.
- older-work-ridge-strips-unindexed-original-6: removed a 3.4% top strip.
- older-work-yakes-todd-dickerson-original-2: removed a 3.3% left strip.
- book-art-74a736000a32427842b1 (Laura paddleboard): removed a 0.8% top sliver. Low value but harmless.
- book-art-596837cb5ff533c620dd (Catherine dance #1): trimmed only 3.7% of empty paper (below the feet and above the hand), keeping 3% padding around the figure.

## Not cropped (eyeballed)
- Catherine dance a61c71, 7bce6e, 9209f1: there is **no croppable mat**. The figures are cut-outs on pure white (255) paper, and their arms and feet run to within about 3% of the frame edges. The large "soft" L/R margin numbers come from pale skin passing the lum≥195 test. A run-length crop cut off arms, heads and feet, so these use a subject-bbox crop with 3% padding instead, which equals the full frame. The `after_pct` values for the Catherine studies are still high for the same reason.
- older-work-lake-hillside-color-wheel-original-3: the wash bleeds into the paper. The paper is part of the composition, and cropping would clip the wash.
- book-art-4bf5a04e40e7d8341378 (Laura Maui): the top strip is pale sky, not a border.

## El Zonte Before Dawn hi-res
The best master on the box with the same composition is still 2400×1145 (`vm-540/gallery-images/el-zonte-before-dawn.jpg`, also the L7 kit copy). The 6400×3600 satoshee file is a different 16:9 alternate crop. Opps L7 already uses the 2400 path.
