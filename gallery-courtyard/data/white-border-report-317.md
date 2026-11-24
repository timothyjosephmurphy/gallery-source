# #317 white-border scan — every hung painting (analysis only)

Generated Mon Oct 26 2026 (PT). Source: `/workspace/play-tags/src/catalog.json` paintings (312 hung, excluded ids removed) with `hang-overrides.json` asset images applied. Images read from `play-tags/public` (local) or fetched via the vite proxy origins (`mva/`→media.vermillionaurora.com, `img/`→img.tjm.art, `tjm/`→tjm.art) into `/workspace/.cache/wb317`.

Script: `white_border_317.py` (raw: `white-border-317.json`). Margin = run of edge rows/cols where ≥95% of px are near-white (lum ≥225, chroma ≤22), % of height (T/B) or width (L/R). A soft pass (lum ≥195, ≥90%) catches off-white mats.

Verdicts: **trim** = max side ≥3% or ≥2 sides ≥1.5%; **border value** = thin strip 0.5–3% (fix via crop or frame border value); **borderline** = only the soft off-white pass ≥2% (likely white mat/paper or a light sky — eyeball); **clean**.

Counts: trim 1, border value 3, borderline 14, clean 294.

Notes: Sunset from Atami #1–#3 (archived-painting-246/248/247) and Sunset in Atami (book-art-e6f013…) scan clean. The framed piece with white margins in white-border-report-2.png is the neighbouring **El Salvador** card (book-art-a2e53a…/e3293c…); source already points at `-317.webp` crops (Oct 23), so the screenshot is likely a pre-fix preview — residual bottom strip ~1.8% remains. Forest Triptych (#318) panels older-work-forest-triptych-original-1/2/3 are hung and scan clean.

| # | id | title | T / B / L / R % | soft T / B / L / R % | verdict |
|---|---|---|---|---|---|
| 1 | archived-painting-301 | Catherine #1 | 0.0 / 0.0 / 1.3 / 5.9 | 0.0 / 0.0 / 2.1 / 6.3 | trim |
| 2 | book-art-a2e53a8418a8d84f3dc5 | El Salvador | 0.2 / 1.8 / 0.8 / 0.8 | 0.2 / 2.0 / 0.8 / 0.8 | border value |
| 3 | book-art-e3293c73dbb01f94b39b | El Salvador | 0.2 / 1.8 / 0.1 / 0.3 | 0.3 / 2.0 / 0.3 / 0.3 | border value |
| 4 | archived-painting-img-1555 | Dad Meditating in Yellowstone | 1.4 / 0.0 / 0.0 / 0.0 | 3.4 / 0.0 / 0.0 / 0.0 | border value |
| 5 | book-art-596837cb5ff533c620dd | Catherine dance series — study 3 | 0.0 / 0.0 / 0.0 / 0.0 | 7.5 / 28.5 / 43.4 / 12.4 | borderline |
| 6 | book-art-a61c71e5de8cc1b71500 | Catherine dance series — study 2 | 0.0 / 0.0 / 0.0 / 0.0 | 0.9 / 1.9 / 31.4 / 20.2 | borderline |
| 7 | book-art-7bce6e3509027d1f7a0b | Catherine dance series — study 4 | 0.0 / 0.0 / 0.0 / 0.0 | 0.9 / 0.8 / 2.1 / 38.9 | borderline |
| 8 | older-work-shore-figures-original-1 | TJ Figures on a Shore 179 | 0.0 / 0.0 / 0.0 / 0.0 | 38.0 / 0.0 / 0.0 / 0.0 | borderline |
| 9 | older-work-shore-figures-original-2 | TJ Wading Figure 181 | 0.0 / 0.0 / 0.0 / 0.0 | 20.1 / 0.0 / 0.0 / 0.0 | borderline |
| 10 | book-art-9209f1fd7d47f373597f | Catherine dance series — study 1 | 0.0 / 0.0 / 0.0 / 0.0 | 0.4 / 0.6 / 7.1 / 7.5 | borderline |
| 11 | older-work-lake-hillside-color-wheel-original-3 | TJ Color Wheel Study 184 | 0.0 / 0.0 / 0.0 / 0.0 | 9.5 / 0.0 / 4.2 / 1.0 | borderline |
| 12 | archived-painting-73 | Painting #73 | 0.0 / 0.0 / 0.0 / 0.0 | 10.2 / 0.0 / 0.0 / 0.0 | borderline |
| 13 | older-work-portraits-319-329-original-4 | TJ Portrait with Glasses 319 | 0.0 / 0.0 / 0.0 / 0.0 | 9.6 / 0.0 / 0.0 / 0.0 | borderline |
| 14 | archived-painting-2 | Painting #2 | 0.0 / 0.0 / 0.0 / 0.0 | 9.2 / 0.0 / 0.0 / 0.0 | borderline |
| 15 | book-art-4bf5a04e40e7d8341378 | Laura in Maui at Ahihi Kinau natural reserve | 0.0 / 0.0 / 0.0 / 0.0 | 7.6 / 0.0 / 0.0 / 0.0 | borderline |
| 16 | book-art-74a736000a32427842b1 | Laura and Cafécito on paddleboard in Lake Washington | 0.0 / 0.0 / 0.0 / 0.0 | 5.3 / 0.0 / 0.0 / 0.0 | borderline |
| 17 | older-work-ridge-strips-unindexed-original-6 | TJ Ridge Strip Study F | 0.0 / 0.0 / 0.0 / 0.0 | 3.8 / 0.0 / 0.0 / 0.0 | borderline |
| 18 | older-work-yakes-todd-dickerson-original-2 | TJ Peter Todd 331 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 2.9 / 0.0 | borderline |
| 19 | older-work-portraits-319-329-original-2 | TJ José 328 | 0.0 / 0.0 / 0.0 / 0.0 | 1.8 / 0.0 / 0.0 / 1.7 | clean |
| 20 | older-work-bitcoin-voices-original-1 | TJ Jack Mallers | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 1.1 / 0.0 / 1.5 | clean |
| 21 | older-work-shore-figures-original-3 | TJ Crab on Beach 180 | 0.0 / 0.0 / 0.0 / 0.0 | 1.6 / 0.0 / 0.0 / 0.0 | clean |
| 22 | strawberry-point-8 | Strawberry Point Backpacking Trip #8 | 0.0 / 0.0 / 0.0 / 0.0 | 1.0 / 0.0 / 0.0 / 0.0 | clean |
| 23 | book-art-aa4dcced8a2ae6a8111c | Untitled — Pacific North West, page 23 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.8 / 0.0 / 0.0 | clean |
| 24 | older-work-bitcoin-voices-original-4 | TJ Michael Saylor | 0.0 / 0.0 / 0.0 / 0.0 | 0.8 / 0.0 / 0.0 / 0.0 | clean |
| 25 | older-work-portraits-319-329-original-1 | TJ Bernard Parah 329 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.6 / 0.0 | clean |
| 26 | older-work-portraits-319-329-original-3 | TJ Andreas Antonopoulos 327 | 0.0 / 0.0 / 0.0 / 0.0 | 0.4 / 0.0 / 0.0 / 0.0 | clean |
| 27 | sunrise-on-tahoma-from-denny-blaine | Sunrise on Tahoma from Denny Blaine with meditation self-por | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 28 | book-art-6e6d7ac51608e0b7f10f | Moonrise in Santa Monica, photo credit: Paul Murphy | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 29 | rice-paddies-in-vietnam | Rice paddies in Vietnam, Photo Credit: Daniel Goldsmith | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 30 | book-art-94e2edf9a24c90950489 | Inside album cover for Yes: Close to the Edge | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 31 | book-art-f2025e5a72f4a70866c6 | Untitled — Assorted Adventures, page 59 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 32 | archived-painting-4 | Painting #4 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 33 | book-art-66fa2eb4ccbaa13b172e | Untitled — Foreword, page 4 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 34 | archived-painting-1 | Painting #1 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 35 | painting-portrait-with-cheese | Brekkie @BVBTC with polished Bitcoin B | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 36 | painting-studio-figure | Brekkie @BVBTC hoisting a sculpture in progress | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 37 | painting-phoenix-rising | The Bounty of Satoshi: Achievement | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 38 | archived-painting-img-1612 | Bounty of Satoshi: Achievement | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 39 | painting-festival-portrait | The Bounty of Satoshi: Wonder | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 40 | painting-lightburst | Revelation | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 41 | book-art-1fb8762b7bf8fce0d0f9 | Brekkie @BVBTC meditating on uncut stone | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 42 | archived-painting-416 | Brekkie Finishing Orange Calcite B | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 43 | archived-painting-412 | Brekkie Hoisting Orange Calcite B | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 44 | book-art-a26ad79970ed645ce1a9 | Brekkie @BVBTC | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 45 | archived-painting-308 | Self Portrait on Goat Lake | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 46 | book-art-85d951d0a1ea09ef4aa6 | Mt. Shuksan from the Mt. Baker Trail | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 47 | book-art-502372c530af5261540c | Waterfall in Olympic Peninsula | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 48 | book-art-8fde7c978d6cd5d53727 | Untitled — Pacific North West, page 23 — 2 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 49 | painting-moonlit-water | Moonrise Over the Cascades | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 50 | archived-painting-249 | Lake in North Cascades | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 51 | painting-golden-coast | Sunset in the Strait of Juan de Fuca, Patos Island 1 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 52 | painting-sunset-silhouette | Sunset in the Strait of Juan de Fuca, Sucia Island | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 53 | book-art-d1399111a441ed91feaa | Sunset in the Strait of Juan de Fuca, Patos Island 2 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 54 | book-art-471daf14a8bb7883f114 | Myself in Skandasana on Playa de los Muertos at Dawn in Puer | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 55 | book-art-87cf2a732259b313f5ab | Sunrise in Puerto Vallarta | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 56 | book-art-14d2876a55c720cbc908 | Jane and Sid in Zihuatanejo | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 57 | archived-painting-66 | Flamenco Guitarist in Zihuatanejo | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 58 | michael-and-katie-in-yelapa | Romance in Yelapa | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 59 | joaquim-in-zihuatanejo | Joaquim in Zihuatanejo | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 60 | book-art-311b1c39d98767f359b5 | Myself on fire | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 61 | book-art-0f696788184bbba1d236 | Myself | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 62 | book-art-54ff45104a57a68d4beb | Neil at Bass Coast | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 63 | book-art-0d7df713c5f0f67733ae | Dawn at Bass Coast | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 64 | book-art-04f4a52773ffd19b4f67 | Travis at Bass Coast | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 65 | book-art-614d5b68dbe5052e302a | Devo at Bass Coast | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 66 | book-art-4350a257e5a6a5e75a31 | Michael at Bass Coast | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 67 | book-art-f367882aaeb0e32471eb | Jennica at Bass Coast | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 68 | archived-painting-90 | Sienna Dawn at Bass Coast | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 69 | archived-painting-438 | Sunrise at Bass Coast 2023 #4 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 70 | sunrise-in-el-zonte-large | Sunrise in El Zonte (Large) | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 71 | book-art-e97329411fa8b273b508 | Sunrise in Traverse City, photo credit: Paul Murphy | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 72 | book-art-64a80ece808ac08d4877 | Sunrise on Playa | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 73 | archived-painting-20 | The Temple, the Lighting #2 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 74 | burning-man-temple-2022-pink | Burning Man Temple 2022: Pink | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 75 | burning-man-temple-2022-flame | Burning Man Temple 2022: Flame | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 76 | archived-painting-18 | Mayan Warrior | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 77 | book-art-4c6fb3817fed4e5a6195 | Painting in Black Rock City | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 78 | archived-painting-133 | Devo in Front of the Mayan Warrior | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 79 | archived-painting-62 | Painting #62 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 80 | archived-painting-22 | Devo & Katie @ Bass Coast | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 81 | book-art-0a80f9a5da0d39edc80f | Mother Ruth | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 82 | grandpa-howard | Grandpa Howard | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 83 | book-art-466dc684227286c40502 | Sister Claire | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 84 | book-art-82127d1886ae57d5cb6e | Father Paul | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 85 | myself-my-mother-ruth-my-grandpa-howard | Myself, my mother Ruth, my grandpa Howard | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 86 | book-art-1a843fe4506374e2f33e | Sister Chelsea and I | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 87 | book-art-a526883c6ca5fefe7402 | Brother Jack | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 88 | book-art-02b06cbfebb63c2794d9 | Me, Chelsea, Grandpa | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 89 | book-art-5cdcafbf4759d14a793f | Cousin Tina and Aunt Michelle | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 90 | painting-couple-in-color | Aunt Fran and Cousin Hillary | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 91 | archived-painting-241 | On a Trip with Elsa | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 92 | book-art-92fdb3112257f4fb66e8 | Catherine and Owen | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 93 | archived-painting-375 | Painting #375 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 94 | archived-painting-193 | Painting #193 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 95 | archived-painting-226 | Painting #226 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 96 | archived-painting-233 | Painting #233 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 97 | archived-painting-368 | Painting #368 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 98 | archived-painting-369 | Painting #369 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 99 | archived-painting-371 | Painting #371 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 100 | archived-painting-373 | Painting #373 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 101 | book-art-c347459aa3f77f7213ae | Mike and Julie in Leon | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 102 | daniel-portrait-1 | Daniel — portrait 1 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 103 | archived-painting-76 | Painting #76 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 104 | archived-painting-364 | Max Keiser & Michael Saylor | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 105 | archived-painting-15 | Symbiosis #1 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 106 | book-art-5a462e9705ba39d756a2 | Ser at Pacific Bitcoin Festival | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 107 | book-art-d95085ce3029e490bb31 | Cory Klippsten @coryklippsten | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 108 | book-art-3cd168e82a87b1ccf91b | Benny and Kermit, P, Culhane, Bob — portrait 2 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 109 | book-art-65bf0ecd265f1fd96e4a | Sedona: Bell Rock 1 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 110 | book-art-ff6db6906f0ed48ccc3a | Sedona Monuments | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 111 | book-art-27fee33e69f262ecfacb | Sedona: Bell Rock 2 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 112 | archived-painting-370 | Ben & Kermit & Swan | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 113 | book-art-b7a9cd259d8ac51a236b | Rescued Hummingbird | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 114 | archived-painting-354 | Painting #354 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 115 | older-work-nakamoto-hayek-original-1 | TJ Dorian Nakamoto | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 116 | book-art-0351c2ff290526e4f204 | Untitled — Bitcoiners, page 50 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 117 | book-art-481025eb48c792356553 | Benny and Kermit, P, Culhane, Bob — portrait 1 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 118 | archived-painting-367 | Josie, The Redheaded Libertarian | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 119 | archived-painting-362 | Max Keiser & Stacey Herbert | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 120 | el-zonte-before-dawn | El Zonte Before Dawn | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 121 | painting-shoreline-at-dusk | El Zonte at Dawn | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 122 | archived-painting-246 | Sunset from Atami, El Salvador #1 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 123 | archived-painting-248 | Sunset from Atami, El Salvador #2 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 124 | archived-painting-247 | Sunset from Atami, El Salvador #3 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 125 | sunset-in-el-zonte-el-salvador | Sunset in El Zonte, El Salvador | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 126 | sunset-in-el-tunco-el-salvador | Sunset in El Tunco, El Salvador | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 127 | book-art-e6f013fae1925ab77100 | Sunset in Atami, El Salvador | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 128 | painting-insect-garden | El Salvador: Past - Chase Toole Collab | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 129 | painting-emergence | El Salvador: Present - Chase Toole Collab | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 130 | painting-twin-dragons | El Salvador: Future - Chase Toole Collab | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 131 | book-art-1ff2691533c9a9d8b091 | Tianna and child in Austin | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 132 | book-art-df8db0bc08adfeae5829 | Izzy and Sienna in Austin | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 133 | book-art-4a03ad4df3ef51a39639 | Sienna and Michael in Austin | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 134 | book-art-616ff8378f27047b4a91 | Jasmine in Austin | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 135 | book-art-ac338ff3806b66917b3c | Untitled — El Salvador, page 38 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 136 | painting-portrait-in-green | Chase Toole | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 137 | book-art-c33709aeb2717b0c53de | Fiona and Joe in Austin | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 138 | el-zonte-at-sunrise | Sunrise from Punta El Zonte Hostel | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 139 | book-art-edbfc2a7fff1189141f6 | Laura in Maui at Halehaku Point | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 140 | archived-painting-307 | Cross on Maui | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 141 | book-art-9fc2e730b10c7b8c333b | Table Mountain | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 142 | book-art-f7e73a57e2af01359446 | Sunrise on Table Mountain | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 143 | book-art-fe853b565936ef8b2e73 | Sunset on Lion's Head | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 144 | book-art-9f546bff5102042a3ad4 | Sunset on the Twelve Apostles | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 145 | archived-painting-75 | Painting #75 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 146 | older-work-beach-sunsets-original-2 | TJ Beach Sunset 311 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 147 | older-work-beach-sunsets-original-3 | TJ Beach Sunset 309 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 148 | book-art-56e40e02275a8767a802 | Sunset on Camps Bay from Lion's Head | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 149 | older-work-sunset-ridge-strips-original-2 | TJ Sunset Ridge Strip 165 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 150 | older-work-sunset-ridge-strips-original-3 | TJ Sunset Ridge Strip 159 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 151 | older-work-sunset-ridge-strips-original-4 | TJ Sunset Ridge Strip 164 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 152 | older-work-sunset-ridge-strips-original-5 | TJ Sunset Ridge Strip 173 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 153 | older-work-sunset-ridge-strips-original-6 | TJ Sunset Ridge Strip 158 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 154 | older-work-beach-sunsets-original-1 | TJ Beach Sunset 310 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 155 | older-work-sunset-ridge-strips-original-1 | TJ Sunset Ridge Strip 174 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 156 | book-art-e589c9375e23d1de4748 | Sunset in Greece, Photo Credit: Chelsea Murphy | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 157 | painting-red-horizon | Sunset at Kihei on Maui | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 158 | book-art-ec22daff29e72f16eb76 | Tomer Strolight @TomerStrolight | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 159 | book-art-0735a5fb0eb1c613b658 | Michael Saylor @saylor | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 160 | book-art-0ee2717bc04e65d0507e | Kushboo Kullar @DrKhushboo_K | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 161 | book-art-deb92de6e72f7b3ce951 | Untitled — Bitcoiners, page 64 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 162 | book-art-d6e03f6907615dac3797 | Marisa Angeli @MarisaJeanArt | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 163 | book-art-e4bbfe556c3c847d9c90 | Nick Szabo @NickSzabo4 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 164 | book-art-c04c7e48687fe35e65f5 | Maya Parbhoe @MayaPar25 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 165 | book-art-43a3f16ac35df7262254 | Valerie B Love @djvalerieblove | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 166 | book-art-044d157c01c7bb07eeab | Carla @carlabitcoin | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 167 | book-art-6ef848d3ccb6b48184ab | Walker @WalkerAmerica | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 168 | book-art-b57fc2205e7bce68d524 | Peter St. Onge @profstonge | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 169 | book-art-b38b9ae1893908d604da | Alejandra Guajardo @MissBitcoin_sv | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 170 | book-art-4d53927ad111f0259402 | Scott Dedels @LanternBitcoin | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 171 | book-art-4afb5cab4bdbe1ff6845 | Viv @btcviv | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 172 | painting-chef-in-white | Jimmy Song @jimmysong | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 173 | hope-the-vermillion-aurora | Hope, the Vermillion Aurora | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 174 | painting-portrait-in-gold | Dorian Nakamoto | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 175 | book-art-504e3fafdacd7c9bbcd0 | Osisipho Filane @FilaneSisipho | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 176 | book-art-4a0bb9cdd6c404c4e77c | Scarlette Melon @Scarlette_melon | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 177 | book-art-1143b08e177333e43dc7 | Kristine | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 178 | book-art-db933efcbc4fbe01c841 | Steve | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 179 | book-art-64cfd389b3dbb5cde532 | Loree | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 180 | book-art-a627c7b7d19ace6b3e51 | John | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 181 | book-art-029f45a5fbfd6c90212e | Mikyla, Mandy, and Guin | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 182 | book-art-76b81da2337321bf158d | Mathew "Fu" Furst, owner of Grandma's House in Denver | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 183 | painting-guitarist | Girl Tuning Guitar | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 184 | painting-portrait-in-blue-light | MJ | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 185 | book-art-0e4564564eee5d70c105 | Sergey winning at poker | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 186 | book-art-44161b6b117af79e3df4 | Sergey | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 187 | book-art-7df006b029abcb751da2 | Daniel — portrait 2 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 188 | book-art-28bec44600b36ed0766f | Julia's baby shower | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 189 | girl-wearing-flower-crown | Girl Wearing Flower Crown | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 190 | book-art-7123da0440d527299914 | Charlie and Pepper's wedding | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 191 | book-art-37fe572d9bb47cab3bc7 | Brothers | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 192 | book-art-8137549f4fe7a3a1b90d | Colin and Craig | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 193 | book-art-6bcf18417734a8e3010a | Dawn in her Flight Helmet | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 194 | lisa-climbing-tahoma-at-sunrise-from-denny-blaine | Lisa Climbing Tahoma at Sunrise from Denny Blaine | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 195 | sunrise-on-rainier-from-denny-blaine | Sunrise on Rainier from Denny Blaine | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 196 | book-art-b01b8695b2528cb850a3 | Dawn on Mt. Vesper from Denny Blaine | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 197 | book-art-ded6b759e667e3c2a313 | Sunrise on Puget Sound | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 198 | archived-painting-386 | Holding the Line #2 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 199 | archived-painting-387 | Tulsi Gabbard #1 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 200 | archived-painting-389 | Tulsi Gabbard #2 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 201 | archived-painting-390 | Ron Paul | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 202 | archived-painting-363 | Elon & Lil’ X in the Oval Office | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 203 | archived-painting-366 | RFK | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 204 | archived-painting-385 | Holding the Line | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 205 | book-art-164f60d23032b0f718de | Pagoda in Botanical Garden | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 206 | book-art-19d9a8360c1f1df745d6 | Myself at Denny Blaine | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 207 | book-art-ffffb682294d4b12c35e | Meditating in Gas Works Park on Solstice 2016 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 208 | meditation-at-denny-blaine | Meditation at Denny Blaine | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 209 | archived-painting-53 | Self Portrait, Meditation at Denny Blaine | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 210 | painting-portrait-with-hat | Sunrise on Rainier with Eagle | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 211 | book-art-deb3358c321671dae1fc | Sunrise on Tahoma with motorcycles | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 212 | older-work-bitcoin-voices-original-2 | TJ Natalie Brunell | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 213 | older-work-bitcoin-voices-original-3 | TJ Peter McCormack | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 214 | older-work-nakamoto-hayek-original-2 | TJ Hayek 339 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 215 | archived-painting-19 | The Temple, Daytime | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 216 | archived-painting-433 | Sunrise at Bass Coast 2023 #1 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 217 | archived-painting-436 | Sunrise at Bass Coast 2023 #2 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 218 | archived-painting-437 | Sunrise at Bass Coast 2023 #3 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 219 | older-work-ammous-livera-original-1 | TJ Saifedean Ammous 355 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 220 | older-work-ammous-livera-original-2 | TJ Stephan Livera 356 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 221 | older-work-fernandez-moran-pysh-original-1 | TJ Akin Fernandez 351 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 222 | older-work-fernandez-moran-pysh-original-2 | TJ Nico Moran 345 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 223 | older-work-fernandez-moran-pysh-original-3 | TJ Preston Pysh 344 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 224 | older-work-figen-pnut-swoll-original-1 | TJ Figen 341 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 225 | older-work-figen-pnut-swoll-original-2 | TJ PNut Window 338 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 226 | older-work-figen-pnut-swoll-original-3 | TJ Joey Swoll 340 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 227 | older-work-hayek-stark-gomez-el-bawab-original-1 | TJ F.A. Hayek 336 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 228 | older-work-hayek-stark-gomez-el-bawab-original-2 | TJ Elizabeth Stark 335 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 229 | older-work-hayek-stark-gomez-el-bawab-original-3 | TJ Rodrigo Gomez 334 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 230 | older-work-hayek-stark-gomez-el-bawab-original-4 | TJ Noor El Bawab 333 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 231 | older-work-hummingbird-feeder-190 | TJ Hummingbird Feeder 190 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 232 | older-work-lake-hillside-color-wheel-original-1 | TJ Mountain Lake 145 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 233 | older-work-lake-hillside-color-wheel-original-2 | TJ Golden Hillside 141 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 234 | older-work-legend-of-billy-buff-original-1 | TJ The Legend of Billy Buff 2 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 235 | older-work-legend-of-billy-buff-original-2 | TJ The Legend of Billy Buff 1 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 236 | older-work-mountain-layers-original-1 | TJ Blue Mountain Layers 185 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 237 | older-work-mountain-layers-original-2 | TJ Orange Mountain Layers 186 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 238 | older-work-mountain-layers-original-3 | TJ Red Mountain Layers 156 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 239 | older-work-mountain-layers-original-4 | TJ Golden Mountain Layers 153 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 240 | older-work-pitchers-original-1 | TJ Two Pitchers 188 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 241 | older-work-pitchers-original-2 | TJ Blue Pitcher 187 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 242 | older-work-ridge-strips-unindexed-original-1 | TJ Ridge Strip Study A | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 243 | older-work-ridge-strips-unindexed-original-2 | TJ Ridge Strip Study B | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 244 | older-work-ridge-strips-unindexed-original-3 | TJ Ridge Strip Study C | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 245 | older-work-ridge-strips-unindexed-original-4 | TJ Ridge Strip Study D | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 246 | older-work-ridge-strips-unindexed-original-5 | TJ Ridge Strip Study E | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 247 | older-work-ridge-strips-unindexed-original-7 | TJ Ridge Strip Study G | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 248 | older-work-rochard-martinez-original-1 | TJ Pierre Rochard 359 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 249 | older-work-rochard-martinez-original-2 | TJ Morgen Rochard 358 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 250 | older-work-rochard-martinez-original-3 | TJ Aixa Martinez 347 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 251 | older-work-yakes-todd-dickerson-original-1 | TJ Eric Yakes 330 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 252 | older-work-yakes-todd-dickerson-original-3 | TJ Desiree Dickerson 332 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 253 | older-work-forest-triptych-original-1 | TJ Forest 303 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 254 | older-work-forest-triptych-original-2 | TJ Forest 302 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 255 | older-work-forest-triptych-original-3 | TJ Forest 304 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 256 | strawberry-point-1 | Strawberry Point Backpacking Trip #1 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 257 | strawberry-point-2 | Strawberry Point Backpacking Trip #2 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 258 | strawberry-point-3 | Strawberry Point Backpacking Trip #3 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 259 | strawberry-point-4 | Strawberry Point Backpacking Trip #4 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 260 | strawberry-point-5 | Strawberry Point Backpacking Trip #5 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 261 | strawberry-point-6 | Strawberry Point Backpacking Trip #6 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 262 | strawberry-point-7 | Strawberry Point Backpacking Trip #7 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 263 | strawberry-point-9 | Strawberry Point Backpacking Trip #9 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 264 | strawberry-point-10 | Strawberry Point Backpacking Trip #10 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 265 | strawberry-point-11 | Strawberry Point Backpacking Trip #11 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 266 | strawberry-point-12 | Strawberry Point Backpacking Trip #12 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 267 | strawberry-point-13 | Strawberry Point Backpacking Trip #13 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 268 | strawberry-point-14 | Strawberry Point Backpacking Trip #14 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 269 | strawberry-point-15 | Strawberry Point Backpacking Trip #15 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 270 | painting-figures-in-wheatfield | The Mother of Kiev | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 271 | honeybadger-and-cub-with-genesis-block | Honeybadger and Cub with Genesis Block | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 272 | coined-in-watercolor-film-poster | Coined in Watercolor Film Poster | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 273 | warszawska-syrenka | Warszawska Syrenka | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 274 | painting-sunflower-woman | Vision of Ukraine at Peace | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 275 | paul-murphy-painting-1 | Tipi | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 276 | paul-murphy-painting-11 | Puerto Rico Beach | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 277 | paul-murphy-painting-14 | Eagle from Photo 1 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 278 | paul-murphy-painting-15 | Eagle from Photo 2 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 279 | paul-murphy-painting-2 | Leo/Bear Constellation | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 280 | paul-murphy-painting-23 | My Ego | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 281 | paul-murphy-painting-24 | Beach Eglin AFB | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 282 | paul-murphy-painting-25 | Spiritual Sedona Mountains 1 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 283 | paul-murphy-painting-27 | Spiritual Sedona Mountains 2 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 284 | paul-murphy-painting-28 | Spiritual Sedona Mountains 3 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 285 | paul-murphy-painting-3 | Rebel Loon/MN ICE Protest | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 286 | paul-murphy-painting-34 | Spiritual Sedona Mountains 4 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 287 | paul-murphy-painting-35 | Spiritual Sedona Mountains 5 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 288 | paul-murphy-painting-38 | Spiritual Sedona Mountains 6 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 289 | paul-murphy-painting-39 | Spiritual Sedona Mountains 7 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 290 | paul-murphy-painting-40 | Spiritual Sedona Mountains 8 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 291 | paul-murphy-painting-41 | Spiritual Sedona Mountains 9 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 292 | paul-murphy-painting-43 | Spiritual Sedona Mountains 10 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 293 | paul-murphy-painting-44 | Spiritual Sedona Mountains 11 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 294 | paul-murphy-painting-45 | Spiritual Sedona Mountains 12 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 295 | paul-murphy-painting-51 | Puerto Rico Waterfront | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 296 | paul-murphy-painting-55 | Pyramid from Photo | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 297 | paul-murphy-painting-56 | Peach Preserves | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 298 | paul-murphy-painting-57 | Lady in Gold | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 299 | paul-murphy-painting-6 | Son TJ Sedona | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 300 | paul-murphy-painting-62 | Waiting on Your Ship | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 301 | paul-murphy-painting-63 | Slot Canyon Face | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 302 | paul-murphy-painting-64 | Slot Canyon Arizona | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 303 | paul-murphy-painting-65 | Phoenix | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 304 | paul-murphy-painting-7 | Slot Canyon | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 305 | paul-murphy-painting-72 | Dancing Wolf on Moon | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 306 | paul-murphy-painting-73 | Sunset Tree | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 307 | paul-murphy-painting-74 | Music Notes of the Universe | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 308 | paul-murphy-painting-8 | Arizona Slot Cave | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 309 | paul-murphy-painting-83 | Soul Connections 1 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 310 | paul-murphy-painting-84 | Soul Connections 2 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 311 | paul-murphy-painting-85 | Soul Connections 3 | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
| 312 | paul-murphy-painting-86 | My Tipi, on Grand Traverse Bay | 0.0 / 0.0 / 0.0 / 0.0 | 0.0 / 0.0 / 0.0 / 0.0 | clean |
