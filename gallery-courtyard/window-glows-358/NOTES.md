# #358 Window glows — night courtyard
Procedural (make.py, seed 358). Apricot #F7A66E body, warm cream core, Terracotta Ember fringe; soft Gaussian bloom, no hard edge.
Sprites: single / mullion (2x3 panes) / arched, each plain + subtle curtain variant. desktop 512x768, phone 256x384 webp (+png master).
Usage (Gallery owns lights): place as quad over facade window, AdditiveBlending, depthWrite false, toneMapped false.
Fade by sun elevation per glows.json (on below -4°, ramp to +2°). Light ~60% windows, ~30% of those curtains, random flicker phase.
Window opening sits at 22–78% x, 18–82% y of sprite; outer area is bloom spill — scale quad ~1.8x window size.
Regenerate: `python3 make.py`.
