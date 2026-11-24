// Shared egg switches (#288, TJ Oct 22). false = the egg is not built (assets and code stay, so it can come back by flipping it).
// A gallery can still override per page with ctx.eggFlags = { name: true|false }.
// /play preview override (TJ Oct 23: "get rid of the box Easter egg"): this local copy shadows gallery-core's, so only this build drops the box egg.
export const EGG_FLAGS = {
  slender: false, // the slender figure: off by TJ's request
  box: false, // the box egg (the cardboard box that hides an egg): off by TJ's request, Oct 23
  // #350 (TJ Oct 26, preview-251): ALL easter-egg props off. Only the guide bot (drone + guide = ostrich guide, tour/ride/checkout escort) stays.
  secret: false, untitled4: false, insanity: false, notasoup: false, bobbleheads: false,
  printer: false, satoshi: false, pizza: false, coin: false, banana: false, dune: false, ostrich: false, starship: false,
};
