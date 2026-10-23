# tjm.art book-art duplicate check

Generated 2026-10-22 (America/Los_Angeles). Read-only analysis: no site or gallery files were changed.

**Checked:** 127 book-art entries (111 hung in catalog.json, 8 in catalog.json `excluded`, 8 in missing-paintings.json). Compared against 247 non-book-art product pages on tjm.art (live product images) plus local hi-res folders (older-work/final, older-work/src/full/c1, vm-540/static/display, print-masters, gallery-images, split-paintings and others, 1,700+ files).

**Method:** fuzzy title match, then size, then a perceptual hash (64-bit DCT pHash + dHash) and a 24×24 colour-thumbnail correlation (ncc) between the book photo (`media.vermillionaurora.com/images/book-galleries/v1/<hash>.webp`) and the product image (display 960 px / JSON-LD image). Candidates were then checked by eye in side-by-side montages. Confidence: High = visually the same painting and hash/ncc agree (or identical image); Medium-High = visibly the same painting, metrics weakened by crop, frame or exposure; Medium = same subject/composition but a real difference (colour, no product page).

**Probable duplicates:** 23 of 127 book-art entries (14 High, 4 Medium-High, 1 High (exact), 4 Medium). 21 point to a non-book-art product; 2 only to a raw hi-res file.

Notes: the hash check found **no duplicates between book-art entries themselves**. The two "Sunrise from Punta El Zonte Hostel" book entries (7599e02b and 9b6b4f1c) are two different paintings. About a dozen book photos (e.g. Table Mountain, Lion's Head, Camps Bay, Twelve Apostles, Scarlette Melon, Osisipho Filane) exist as `img-NNNN` files in vm-540/static/display, but those are the same book photos at 960 px, not independent hi-res, so they are not counted as duplicates.

## 1. The 8 unsized book-art pieces in missing-paintings.json

| Book-art id | Title | URL | Hi-res duplicate? | Use this size | Dup (id / url) | Confidence | Hi-res file |
|---|---|---|---|---|---|---|---|
| `book-art-103c2ba59ca485e56a86` | El Salvador (caption: none) | https://tjm.art/products/book-art-103c2ba59ca485e56a86/ | **Yes** → Sunset from Atami, El Salvador #3 | **15 × 24 in (W×H)** | `archived-painting-247` https://tjm.art/products/archived-painting-247/ | High | https://media.vermillionaurora.com/images/Archive/IMG_1618.jpg 4764×7346px |
| `book-art-a2e53a8418a8d84f3dc5` | El Salvador (caption: none) | https://tjm.art/products/book-art-a2e53a8418a8d84f3dc5/ | **No** (no title, size or image match in any product or hi-res folder) | none known; no caption either, needs TJ | — | — | — |
| `book-art-e3293c73dbb01f94b39b` | El Salvador (caption: none) | https://tjm.art/products/book-art-e3293c73dbb01f94b39b/ | **No** (no title, size or image match in any product or hi-res folder) | none known; no caption either, needs TJ | — | — | — |
| `book-art-fc89b36cb40743a90fa8` | El Salvador (caption: 25x15) | https://tjm.art/products/book-art-fc89b36cb40743a90fa8/ | **Yes** → Sunset from Atami, El Salvador #1 | **13.5 × 25.75 in (W×H)** | `archived-painting-246` https://tjm.art/products/archived-painting-246/ | Medium-High | https://media.vermillionaurora.com/images/Archive/IMG_1614.jpg 4263×7535px |
| `book-art-67cc9a4d5823eca2182e` | Katie and Devo at Bass Coast (caption: 24x45) | https://tjm.art/products/book-art-67cc9a4d5823eca2182e/ | **Yes** → Devo & Katie @ Bass Coast | **45 × 24 in (W×H)** | `archived-painting-22` https://tjm.art/products/archived-painting-22/ | Medium | https://media.vermillionaurora.com/images/Archive/IMG_1651.jpg 6882×3303px |
| `book-art-7599e02b4ff7013e7261` | Sunrise from Punta El Zonte Hostel (caption: 36x45) | https://tjm.art/products/book-art-7599e02b4ff7013e7261/ | **Yes** → Sunrise in El Zonte (Large) | **36 × 48 in (W×H)** | `sunrise-in-el-zonte-large` https://tjm.art/products/sunrise-in-el-zonte-large/ | High | display/sunrise-in-el-zonte-large-673f23d562-1600.webp |
| `book-art-9a4b9331f62350fa36fc` | Sunrise at Bass Coast, Merritt, BC 1 (caption: 24x15) | https://tjm.art/products/book-art-9a4b9331f62350fa36fc/ | **Yes** → Sunrise at Bass Coast 2023 #2 | **13.75 × 24.75 in (W×H)** | `archived-painting-436` https://tjm.art/products/archived-painting-436/ | High | https://media.vermillionaurora.com/images/Archive/IMG_1628.jpg 3345×6053px |
| `book-art-c198f09bc8ddad18ed1e` | Sunrise at Bass Coast, Merritt, BC 2 (caption: 24x15) | https://tjm.art/products/book-art-c198f09bc8ddad18ed1e/ | **Yes** → Sunrise at Bass Coast 2023 #1 | **23.25 × 14.75 in (W×H)** | `archived-painting-433` https://tjm.art/products/archived-painting-433/ | Medium-High | https://media.vermillionaurora.com/images/Archive/IMG_1626.jpg 6329×3423px |

Sizes are W × H from the live product page. The book captions are rounded and do not state orientation (24x45 reads as H×W for #22, 24x15 as W×H for #433), so use the product size, not the caption. If a dup is confirmed, the book-art entry should be dropped (or replaced by the hi-res product) rather than hung twice.

## 2. All probable duplicates

| Book-art id | Title | Book-art URL | Book status | Book size | Likely duplicate | Dup size | Dup status | Confidence | Evidence / hi-res file |
|---|---|---|---|---|---|---|---|---|---|
| `book-art-50a7984f819bec72d1c7` | Myself Painting on Mt Baker near Goat Lake | https://tjm.art/products/book-art-50a7984f819bec72d1c7/ | catalog (hung), no hi | ~11.3×15.0 in (catalog, approx) | `archived-painting-308` — Self Portrait on Goat Lake https://tjm.art/products/archived-painting-308/ | 10 × 12 in | catalog (hung), hi | High | hash 4/64, ncc .90; visually identical; hi-res: https://media.vermillionaurora.com/images/Archive/IMG_1545.jpg 4076×5375px |
| `book-art-9b6b4f1ce8b283e14b21` | Sunrise from Punta El Zonte Hostel (catalog: Sunrise from Punta El Zonte Hostel — 2) | https://tjm.art/products/book-art-9b6b4f1ce8b283e14b21/ | catalog (hung), no hi | — | `el-zonte-at-sunrise` — Sunrise from Punta El Zonte Hostel https://tjm.art/products/el-zonte-at-sunrise/ | 24 × 48 in | catalog (hung), hi | High | hash 12/64, ncc .90; title identical; site "related work" link; same photo as vm-540/gallery-images/el-salvador-sunrise.jpeg (803×1600) and print-master 1548×3083; hi-res: vm-540/static/print-masters/3b684b4c… (1548×3083) |
| `book-art-7599e02b4ff7013e7261` | Sunrise from Punta El Zonte Hostel | https://tjm.art/products/book-art-7599e02b4ff7013e7261/ | missing-paintings | caption 36x45 | `sunrise-in-el-zonte-large` — Sunrise in El Zonte (Large) https://tjm.art/products/sunrise-in-el-zonte-large/ | 36 × 48 in | catalog (hung), hi | High | visually identical composition (grey striped sky, headland left, wooden planks); hash 8/64, ncc .69 only due to exposure; title identical to other El Zonte page but that one (24×48) is a different painting; hi-res: display/sunrise-in-el-zonte-large-673f23d562-1600.webp |
| `book-art-7a498f39e7a66a2e8eb5` | Nico @BITVOLT | https://tjm.art/products/book-art-7a498f39e7a66a2e8eb5/ | catalog (hung), no hi | ~13.4×15.0 in (catalog, approx) | `older-work-fernandez-moran-pysh-original-2` — TJ Nico Moran 345 https://tjm.art/products/older-work-fernandez-moran-pysh-original-2/ | 11 × 12 in | missing-paintings | High | hash 10/64, ncc .85; same portrait (Nico / "TJ Nico Moran 345"); hi-res: older-work/final/1528_1.png (1615×1692) |
| `book-art-a6a2c048812a41cee4e4` | Painting #371 (catalog: Benny and Kermit, P, Culhane, Bob — portrait 4) | https://tjm.art/products/book-art-a6a2c048812a41cee4e4/ | catalog (hung), no hi | ~15.0×10.9 in (catalog, approx) | `archived-painting-371` — Painting #371 https://tjm.art/products/archived-painting-371/ | ~15×12 in (est.) | catalog (hung), hi | High | hash 12/64, ncc .82; live page title is "Painting #371"; hi-res: https://media.vermillionaurora.com/images/Archive/IMG_1568.jpg 4815×3533px |
| `book-art-b50262c37f44843487ae` | Catherine #1 | https://tjm.art/products/book-art-b50262c37f44843487ae/ | catalog excluded | — | `archived-painting-301` — Catherine #1 https://tjm.art/products/archived-painting-301/ | 22 × 24 in | catalog (hung), hi | High | hash 2/64, ncc .90; title identical; hi-res: https://media.vermillionaurora.com/images/Archive/IMG_1639.jpg 5620×6037px |
| `book-art-c198f09bc8ddad18ed1e` | Sunrise at Bass Coast, Merritt, BC 2 | https://tjm.art/products/book-art-c198f09bc8ddad18ed1e/ | missing-paintings | caption 24x15 | `archived-painting-433` — Sunrise at Bass Coast 2023 #1 https://tjm.art/products/archived-painting-433/ | 23.25 × 14.75 in | missing-paintings | Medium-High | hash 14/64, ncc .85; same composition (cloud dots, dark left hill, tree right); caption 24x15 ≈ 23.25×14.75; hi-res: https://media.vermillionaurora.com/images/Archive/IMG_1626.jpg 6329×3423px |
| `book-art-9ae261289a3bce952c6f` | Sunrise on Rainier from Denny Blaine (catalog: Lisa Climbing Tahoma at Sunrise from Denny Blaine prototype) | https://tjm.art/products/book-art-9ae261289a3bce952c6f/ | catalog (hung) | — | `sunrise-on-rainier-from-denny-blaine` — Sunrise on Rainier from Denny Blaine https://tjm.art/products/sunrise-on-rainier-from-denny-blaine/ | 45 × 72 in | catalog (hung), no hi | High (exact) | identical image (hash 0/64, ncc 1.0); live page title is the same as the product |
| `book-art-f91504eaa0ab6b936c29` | TJ Beach Sunset 310 | https://tjm.art/products/book-art-f91504eaa0ab6b936c29/ | catalog excluded | — | `older-work-beach-sunsets-original-1` — TJ Beach Sunset 310 https://tjm.art/products/older-work-beach-sunsets-original-1/ | 7 × 5 in | catalog (hung), hi | High | hash 2/64, ncc .94; title identical (TJ Beach Sunset 310); hi-res: older-work/final/1549_0.png (2362×1754) |
| `book-art-cb92d1d647c6f92403c7` | Myself in a Tam | https://tjm.art/products/book-art-cb92d1d647c6f92403c7/ | catalog (hung), no hi | ~8.0×6.0 in (catalog, approx) | `archived-painting-226` — Painting #226 https://tjm.art/products/archived-painting-226/ | ~12.0×8.4 in (catalog) | catalog (hung), hi | High | hash 14/64, ncc .77; same portrait, visually identical; hi-res: https://media.vermillionaurora.com/images/Archive/IMG_1595.jpg 7232×5083px |
| `book-art-d1a4ee225dafe10ba934` | Hank | https://tjm.art/products/book-art-d1a4ee225dafe10ba934/ | catalog (hung), no hi | ~10.4×15.0 in (catalog, approx) | `archived-painting-233` — Painting #233 https://tjm.art/products/archived-painting-233/ | ~11×15 in (est.) | catalog (hung), hi | High | hash 8/64, ncc .91; hi-res: https://media.vermillionaurora.com/images/Archive/IMG_1552.jpg 3413×4801px |
| `book-art-3cd6b3fb3e356c4b1d1d` | Tiana and Michael at Bass Coast | https://tjm.art/products/book-art-3cd6b3fb3e356c4b1d1d/ | catalog (hung), no hi | — | `archived-painting-73` — Painting #73 https://tjm.art/products/archived-painting-73/ | — | catalog (hung), hi | High | hash 8/64, ncc .89; hi-res: https://media.vermillionaurora.com/images/Archive/IMG_1602.jpg 4372×7007px |
| `book-art-55829535637cd4974a88` | Hawaii | https://tjm.art/products/book-art-55829535637cd4974a88/ | catalog (hung) | ~12.0×9.4 in (catalog, approx) | `archived-painting-307` — Cross on Maui https://tjm.art/products/archived-painting-307/ | ~13×10 in (est.) | catalog (hung), hi | High | hash 4/64, ncc .94; hi-res: https://media.vermillionaurora.com/images/Archive/IMG_1547.jpg 6833×5116px |
| `book-art-103c2ba59ca485e56a86` | El Salvador | https://tjm.art/products/book-art-103c2ba59ca485e56a86/ | missing-paintings | — | `archived-painting-247` — Sunset from Atami, El Salvador #3 https://tjm.art/products/archived-painting-247/ | 15 × 24 in | catalog (hung), hi | High | hash 12/64, ncc .91; same sunset composition, slightly different crop. Book title is just "El Salvador"; hi-res: https://media.vermillionaurora.com/images/Archive/IMG_1618.jpg 4764×7346px |
| `book-art-1d0517e85d349222c362` | Benny and Kermit, P, Culhane, Bob — portrait 3 | https://tjm.art/products/book-art-1d0517e85d349222c362/ | catalog (hung), no hi | ~12.0×8.7 in (catalog, approx) | `archived-painting-369` — Painting #369 https://tjm.art/products/archived-painting-369/ | ~15×11 in (est.) | catalog (hung), hi | High | hash 14/64, ncc .89; hi-res: https://media.vermillionaurora.com/images/Archive/IMG_1564.jpg 5072×3673px |
| `book-art-fc89b36cb40743a90fa8` | El Salvador | https://tjm.art/products/book-art-fc89b36cb40743a90fa8/ | missing-paintings | caption 25x15 | `archived-painting-246` — Sunset from Atami, El Salvador #1 https://tjm.art/products/archived-painting-246/ | 13.5 × 25.75 in | catalog (hung), hi | Medium-High | hash 12/64, ncc .90; same clouds, red sun and dock; caption 25x15 ≈ 13.5×25.75; hi-res: https://media.vermillionaurora.com/images/Archive/IMG_1614.jpg 4263×7535px |
| `book-art-9c77e540218eab97ba3d` | Lisa on the floor | https://tjm.art/products/book-art-9c77e540218eab97ba3d/ | catalog (hung), no hi | ~35.0×26.9 in (catalog, approx) | `archived-painting-241` — On a Trip with Elsa https://tjm.art/products/archived-painting-241/ | 26 × 20.5 in | catalog (hung), hi | Medium-High | hash 6/64, ncc .76; same pose and floor; titles differ (Lisa on the floor / On a Trip with Elsa); hi-res: https://media.vermillionaurora.com/images/Archive/IMG_1635.jpg 7370×5613px |
| `book-art-9a4b9331f62350fa36fc` | Sunrise at Bass Coast, Merritt, BC 1 | https://tjm.art/products/book-art-9a4b9331f62350fa36fc/ | missing-paintings | caption 24x15 | `archived-painting-436` — Sunrise at Bass Coast 2023 #2 https://tjm.art/products/archived-painting-436/ | 13.75 × 24.75 in | missing-paintings | High | hash 8/64, ncc .97; caption 24x15 ≈ 13.75×24.75 (H×W); hi-res: https://media.vermillionaurora.com/images/Archive/IMG_1628.jpg 3345×6053px |
| `book-art-d78badff7e21472c00b8` | Sunrise on Rainier with Eagle (catalog: Sunrise on Tahoma from Denny Blaine with Eagle catching fish) | https://tjm.art/products/book-art-d78badff7e21472c00b8/ | catalog (hung), no hi | ~72.0×25.5 in (catalog, approx) | `painting-portrait-with-hat` — Sunrise on Rainier with Eagle https://tjm.art/products/painting-portrait-with-hat/ | 60 × 22 in | catalog (hung), hi | Medium-High | book photo includes the black frame so hash is weak (30/64); same painting visually; live page title identical ("Sunrise on Rainier with Eagle"); hi-res: static/print-masters/06b6660bc24b59597f923ebfa869fe3bcbacae363f1b8cab9a6486a3c73a756a.jpg |
| `book-art-82127d1886ae57d5cb6e` | My Dad, Paul Murphy (catalog: Father Paul) | https://tjm.art/products/book-art-82127d1886ae57d5cb6e/ | catalog (hung), no hi | ~16.9×24.0 in (catalog, approx) | `archived-painting-img-1608` — My Dad, Paul Murphy https://tjm.art/products/archived-painting-img-1608/ | 15 × 24 in | catalog (hung), hi | Medium | live-page title identical ("My Dad, Paul Murphy"); same pose/scarf/glasses; exposure and background tone differ; hash 16/64, ncc .64; hi-res: https://media.vermillionaurora.com/images/Archive/IMG_1608.jpg 3610×6441px |
| `book-art-67cc9a4d5823eca2182e` | Katie and Devo at Bass Coast | https://tjm.art/products/book-art-67cc9a4d5823eca2182e/ | missing-paintings | caption 24x45 | `archived-painting-22` — Devo & Katie @ Bass Coast https://tjm.art/products/archived-painting-22/ | 45 × 24 in | catalog (hung), hi | Medium | same two-figure composition; colours differ a lot (book photo pale, product navy), so possibly study vs finished piece; caption 24x45 = 45×24 in exactly; hi-res: https://media.vermillionaurora.com/images/Archive/IMG_1651.jpg 6882×3303px |
| `book-art-8fde7c978d6cd5d53727` | Untitled — Pacific North West, page 23 — 2 | https://tjm.art/products/book-art-8fde7c978d6cd5d53727/ | catalog (hung), no hi | ~10.0×12.0 in (catalog, approx) | (file only) older-work/src/IMG_1515.jpg (2326×2866) | — | no product | Medium | no product page; matches raw file older-work/src/IMG_1515.jpg (2326×2866; hash 8/64, ncc .87) |
| `book-art-0ee2717bc04e65d0507e` | Kushboo Kullar @DrKhushboo_K | https://tjm.art/products/book-art-0ee2717bc04e65d0507e/ | catalog (hung) | ~13.7×15.0 in (catalog, approx) | (file only) display/img-9104-b8bda03ba4-960.webp | — | no product | Medium | no product page; matches vm-540/static/display/img-9104-b8bda03ba4-960.webp (960×1142; hash 12/64, ncc .89) – same-size copy of the book photo, not true hi-res |

## 3. Book-art entries with no duplicate found

104 entries. Titles are given as on the live page. Most are portraits, family and Bitcoiner-twitter pieces that exist only as book photos.

| Book-art id | Title | Status | Size |
|---|---|---|---|
| `book-art-b38b9ae1893908d604da` | Alejandra Guajardo @MissBitcoin_sv | catalog (hung), no hi | ~13.5×15.0 in (catalog, approx) |
| `book-art-481025eb48c792356553` | Benny and Kermit, P, Culhane, Bob — portrait 1 | catalog (hung), no hi | ~12.0×8.7 in (catalog, approx) |
| `book-art-3cd168e82a87b1ccf91b` | Benny and Kermit, P, Culhane, Bob — portrait 2 | catalog (hung), no hi | ~12.0×8.7 in (catalog, approx) |
| `book-art-a26ad79970ed645ce1a9` | Brekkie @BVBTC | catalog (hung), no hi | ~14.5×24.0 in (catalog, approx) |
| `book-art-1fb8762b7bf8fce0d0f9` | Brekkie @BVBTC meditating on uncut stone | catalog (hung), no hi | — |
| `book-art-a526883c6ca5fefe7402` | Brother Jack | catalog (hung), no hi | ~13.3×24.0 in (catalog, approx) |
| `book-art-37fe572d9bb47cab3bc7` | Brothers | catalog (hung), no hi | ~13.1×15.0 in (catalog, approx) |
| `book-art-044d157c01c7bb07eeab` | Carla @carlabitcoin | catalog (hung), no hi | ~18.7×24.0 in (catalog, approx) |
| `book-art-92fdb3112257f4fb66e8` | Catherine and Owen | catalog (hung), no hi | — |
| `book-art-9209f1fd7d47f373597f` | Catherine dance series — study 1 | catalog (hung), no hi | — |
| `book-art-a61c71e5de8cc1b71500` | Catherine dance series — study 2 | catalog (hung), no hi | — |
| `book-art-596837cb5ff533c620dd` | Catherine dance series — study 3 | catalog (hung), no hi | — |
| `book-art-7bce6e3509027d1f7a0b` | Catherine dance series — study 4 | catalog (hung), no hi | — |
| `book-art-7123da0440d527299914` | Charlie and Pepper's wedding | catalog (hung), no hi | ~17.7×24.0 in (catalog, approx) |
| `book-art-8137549f4fe7a3a1b90d` | Colin and Craig | catalog (hung), no hi | ~24.0×16.5 in (catalog, approx) |
| `book-art-d95085ce3029e490bb31` | Cory Klippsten @coryklippsten | catalog (hung), no hi | ~12.9×15.0 in (catalog, approx) |
| `book-art-5cdcafbf4759d14a793f` | Cousin Tina and Aunt Michelle | catalog (hung), no hi | ~15.0×10.0 in (catalog, approx) |
| `book-art-7df006b029abcb751da2` | Daniel — portrait 2 | catalog (hung), no hi | ~13.0×24.0 in (catalog, approx) |
| `book-art-0c4b161071524e23d519` | Dawn Clowning | catalog excluded | — |
| `book-art-c4a5109c84daedd78291` | Dawn and I in San Pancho | catalog excluded | — |
| `book-art-3a9cba708a8045364e82` | Dawn and her father Pete at Burning Man | catalog excluded | — |
| `book-art-0d7df713c5f0f67733ae` | Dawn at Bass Coast | catalog (hung), no hi | ~13.3×24.0 in (catalog, approx) |
| `book-art-b7410a9f4340e559e4f4` | Dawn in Zihuatanejo | catalog excluded | — |
| `book-art-9c7b9d41bee5615f1d7f` | Dawn in hammock at sunset in Zihuatanejo | catalog excluded | — |
| `book-art-6bcf18417734a8e3010a` | Dawn in her Flight Helmet | catalog (hung), no hi | ~10.8×15.0 in (catalog, approx) |
| `book-art-b01b8695b2528cb850a3` | Dawn on Mt. Vesper from Denny Blaine | catalog (hung), no hi | ~45.0×22.1 in (catalog, approx) |
| `book-art-614d5b68dbe5052e302a` | Devo at Bass Coast | catalog (hung), no hi | ~24.0×21.9 in (catalog, approx) |
| `book-art-e3293c73dbb01f94b39b` | El Salvador | missing-paintings | — |
| `book-art-a2e53a8418a8d84f3dc5` | El Salvador | missing-paintings | — |
| `book-art-c33709aeb2717b0c53de` | Fiona and Joe in Austin | catalog (hung), no hi | ~12.0×9.4 in (catalog, approx) |
| `book-art-94e2edf9a24c90950489` | Inside album cover for Yes: Close to the Edge | catalog (hung) | ~45.0×22.0 in (catalog, approx) |
| `book-art-df8db0bc08adfeae5829` | Izzy and Sienna in Austin | catalog (hung), no hi | ~15.0×10.7 in (catalog, approx) |
| `book-art-14d2876a55c720cbc908` | Jane and Sid in Zihuatanejo | catalog (hung) | ~24.0×17.0 in (catalog, approx) |
| `book-art-616ff8378f27047b4a91` | Jasmine in Austin | catalog (hung) | ~13.8×15.0 in (catalog, approx) |
| `book-art-f367882aaeb0e32471eb` | Jennica at Bass Coast | catalog (hung), no hi | ~23.8×24.0 in (catalog, approx) |
| `book-art-a627c7b7d19ace6b3e51` | John | catalog (hung) | ~13.2×15.0 in (catalog, approx) |
| `book-art-28bec44600b36ed0766f` | Julia's baby shower | catalog (hung) | ~28.4×35.0 in (catalog, approx) |
| `book-art-93957f4169bc931e0a52` | Katie, Julie, and Dawn in Zihuatanejo at Sunset | catalog excluded | — |
| `book-art-1143b08e177333e43dc7` | Kristine | catalog (hung) | — |
| `book-art-74a736000a32427842b1` | Laura and Cafécito on paddleboard in Lake Washington | catalog (hung) | — |
| `book-art-4bf5a04e40e7d8341378` | Laura in Maui at Ahihi Kinau natural reserve | catalog (hung), no hi | ~12.0×10.9 in (catalog, approx) |
| `book-art-edbfc2a7fff1189141f6` | Laura in Maui at Halehaku Point | catalog (hung), no hi | ~10.1×12.0 in (catalog, approx) |
| `book-art-64cfd389b3dbb5cde532` | Loree | catalog (hung) | ~12.6×15.0 in (catalog, approx) |
| `book-art-d6e03f6907615dac3797` | Marisa Angeli @MarisaJeanArt | catalog (hung), no hi | — |
| `book-art-76b81da2337321bf158d` | Mathew "Fu" Furst, owner of Grandma's House in Denver | catalog (hung), no hi | ~13.5×24.0 in (catalog, approx) |
| `book-art-c04c7e48687fe35e65f5` | Maya Parbhoe @MayaPar25 | catalog (hung) | ~13.8×15.0 in (catalog, approx) |
| `book-art-02b06cbfebb63c2794d9` | Me, Chelsea, Grandpa | catalog (hung), no hi | ~12.9×24.0 in (catalog, approx) |
| `book-art-ffffb682294d4b12c35e` | Meditating in Gas Works Park on Solstice 2016 | catalog (hung), no hi | — |
| `book-art-0735a5fb0eb1c613b658` | Michael Saylor @saylor | catalog (hung), no hi | — |
| `book-art-4350a257e5a6a5e75a31` | Michael at Bass Coast | catalog (hung), no hi | ~24.0×21.8 in (catalog, approx) |
| `book-art-c347459aa3f77f7213ae` | Mike and Julie in Leon | catalog (hung) | ~24.0×13.2 in (catalog, approx) |
| `book-art-029f45a5fbfd6c90212e` | Mikyla, Mandy, and Guin | catalog (hung) | ~13.3×24.0 in (catalog, approx) |
| `book-art-6e6d7ac51608e0b7f10f` | Moonrise in Santa Monica, photo credit: Paul Murphy | catalog (hung) | ~15.1×24.0 in (catalog, approx) |
| `book-art-0a80f9a5da0d39edc80f` | Mother Ruth | catalog (hung), no hi | ~16.9×24.0 in (catalog, approx) |
| `book-art-85d951d0a1ea09ef4aa6` | Mt. Shuksan from the Mt. Baker Trail | catalog (hung), no hi | ~24.0×13.4 in (catalog, approx) |
| `book-art-0f696788184bbba1d236` | Myself | catalog (hung) | ~9.3×15.0 in (catalog, approx) |
| `book-art-19d9a8360c1f1df745d6` | Myself at Denny Blaine | catalog (hung), no hi | — |
| `book-art-471daf14a8bb7883f114` | Myself in Skandasana on Playa de los Muertos at Dawn in Puerto Vallarta | catalog (hung) | — |
| `book-art-311b1c39d98767f359b5` | Myself on fire | catalog (hung), no hi | ~3.7×5.0 in (catalog, approx) |
| `book-art-54ff45104a57a68d4beb` | Neil at Bass Coast | catalog (hung), no hi | ~23.6×24.0 in (catalog, approx) |
| `book-art-e4bbfe556c3c847d9c90` | Nick Szabo @NickSzabo4 | catalog (hung), no hi | — |
| `book-art-504e3fafdacd7c9bbcd0` | Osisipho Filane @FilaneSisipho | catalog (hung) | ~10.4×15.0 in (catalog, approx) |
| `book-art-164f60d23032b0f718de` | Pagoda in Botanical Garden | catalog (hung), no hi | — |
| `book-art-4c6fb3817fed4e5a6195` | Painting in Black Rock City | catalog (hung) | — |
| `book-art-b57fc2205e7bce68d524` | Peter St. Onge @profstonge | catalog (hung), no hi | ~13.1×15.0 in (catalog, approx) |
| `book-art-b7a9cd259d8ac51a236b` | Rescued Hummingbird | catalog (hung), no hi | — |
| `book-art-4a0bb9cdd6c404c4e77c` | Scarlette Melon @Scarlette_melon | catalog (hung) | ~10.5×15.0 in (catalog, approx) |
| `book-art-4d53927ad111f0259402` | Scott Dedels @LanternBitcoin | catalog (hung), no hi | ~13.4×15.0 in (catalog, approx) |
| `book-art-ff6db6906f0ed48ccc3a` | Sedona Monuments | catalog (hung) | ~24.0×18.0 in (catalog, approx) |
| `book-art-65bf0ecd265f1fd96e4a` | Sedona: Bell Rock 1 | catalog (hung), no hi | ~15.0×11.1 in (catalog, approx) |
| `book-art-27fee33e69f262ecfacb` | Sedona: Bell Rock 2 | catalog (hung) | — |
| `book-art-5a462e9705ba39d756a2` | Ser at Pacific Bitcoin Festival | catalog (hung), no hi | ~12.7×24.0 in (catalog, approx) |
| `book-art-44161b6b117af79e3df4` | Sergey | catalog (hung) | ~13.5×15.0 in (catalog, approx) |
| `book-art-0e4564564eee5d70c105` | Sergey winning at poker | catalog (hung), no hi | ~12.9×15.0 in (catalog, approx) |
| `book-art-4a03ad4df3ef51a39639` | Sienna and Michael in Austin | catalog (hung), no hi | ~13.5×15.0 in (catalog, approx) |
| `book-art-1a843fe4506374e2f33e` | Sister Chelsea and I | catalog (hung), no hi | — |
| `book-art-466dc684227286c40502` | Sister Claire | catalog (hung) | ~10.1×15.0 in (catalog, approx) |
| `book-art-db933efcbc4fbe01c841` | Steve | catalog (hung) | — |
| `book-art-87cf2a732259b313f5ab` | Sunrise in Puerto Vallarta | catalog (hung) | ~13.6×24.0 in (catalog, approx) |
| `book-art-e97329411fa8b273b508` | Sunrise in Traverse City, photo credit: Paul Murphy | catalog (hung) | — |
| `book-art-64a80ece808ac08d4877` | Sunrise on Playa | catalog (hung), no hi | ~22.5×24.0 in (catalog, approx) |
| `book-art-ded6b759e667e3c2a313` | Sunrise on Puget Sound | catalog (hung), no hi | ~13.0×24.0 in (catalog, approx) |
| `book-art-f7e73a57e2af01359446` | Sunrise on Table Mountain | catalog (hung), no hi | ~15.0×11.3 in (catalog, approx) |
| `book-art-deb3358c321671dae1fc` | Sunrise on Tahoma with motorcycles | catalog (hung) | — |
| `book-art-e6f013fae1925ab77100` | Sunset in Atami, El Salvador | catalog (hung), no hi | ~6.6×12.0 in (catalog, approx) |
| `book-art-e589c9375e23d1de4748` | Sunset in Greece, Photo Credit: Chelsea Murphy | catalog (hung) | ~24.0×13.3 in (catalog, approx) |
| `book-art-d1399111a441ed91feaa` | Sunset in the Strait of Juan de Fuca, Patos Island 2 | catalog (hung) | — |
| `book-art-56e40e02275a8767a802` | Sunset on Camps Bay from Lion's Head | catalog (hung), no hi | ~15.0×11.3 in (catalog, approx) |
| `book-art-fe853b565936ef8b2e73` | Sunset on Lion's Head | catalog (hung), no hi | ~15.0×10.8 in (catalog, approx) |
| `book-art-9f546bff5102042a3ad4` | Sunset on the Twelve Apostles | catalog (hung), no hi | ~15.0×11.1 in (catalog, approx) |
| `book-art-9fc2e730b10c7b8c333b` | Table Mountain | catalog (hung), no hi | ~15.0×11.5 in (catalog, approx) |
| `book-art-1ff2691533c9a9d8b091` | Tianna and child in Austin | catalog (hung), no hi | ~13.2×15.0 in (catalog, approx) |
| `book-art-ec22daff29e72f16eb76` | Tomer Strolight @TomerStrolight | catalog (hung) | — |
| `book-art-04f4a52773ffd19b4f67` | Travis at Bass Coast | catalog (hung), no hi | ~14.3×24.0 in (catalog, approx) |
| `book-art-f2025e5a72f4a70866c6` | Untitled — Assorted Adventures, page 59 | catalog (hung) | ~12.0×9.6 in (catalog, approx) |
| `book-art-0351c2ff290526e4f204` | Untitled — Bitcoiners, page 50 | catalog (hung), no hi | ~45.0×22.4 in (catalog, approx) |
| `book-art-deb92de6e72f7b3ce951` | Untitled — Bitcoiners, page 64 | catalog (hung) | ~13.7×15.0 in (catalog, approx) |
| `book-art-ac338ff3806b66917b3c` | Untitled — El Salvador, page 38 | catalog (hung), no hi | ~12.0×7.1 in (catalog, approx) |
| `book-art-66fa2eb4ccbaa13b172e` | Untitled — Foreword, page 4 | catalog (hung), no hi | ~12.0×8.0 in (catalog, approx) |
| `book-art-aa4dcced8a2ae6a8111c` | Untitled — Pacific North West, page 23 | catalog (hung), no hi | ~8.8×12.0 in (catalog, approx) |
| `book-art-43a3f16ac35df7262254` | Valerie B Love @djvalerieblove | catalog (hung), no hi | ~10.5×12.0 in (catalog, approx) |
| `book-art-4afb5cab4bdbe1ff6845` | Viv @btcviv | catalog (hung), no hi | ~13.7×15.0 in (catalog, approx) |
| `book-art-6ef848d3ccb6b48184ab` | Walker @WalkerAmerica | catalog (hung), no hi | ~19.1×24.0 in (catalog, approx) |
| `book-art-502372c530af5261540c` | Waterfall in Olympic Peninsula | catalog (hung), no hi | ~24.0×7.3 in (catalog, approx) |
