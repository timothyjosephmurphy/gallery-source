// Shared egg switches (#288, TJ Oct 22). false = the egg is not built (assets and code stay, so it can come back by flipping it).
// A gallery can still override per page with ctx.eggFlags = { name: true|false }.
// /play preview override (TJ Oct 23: "get rid of the box Easter egg"): this local copy shadows gallery-core's, so only this build drops the box egg.
export const EGG_FLAGS = {
  slender: false, // the slender figure: off by TJ's request
  box: false, // the box egg (the cardboard box that hides an egg): off by TJ's request, Oct 23
};
