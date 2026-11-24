# #392 Buy Scanner + cart-bot — status (Oct 26 2026)
**State:** offline prototype done; NOT wired into play-tags / preview-251; nothing deployed; no museum parity.
**Path:** /workspace/museum-tools/buy-scanner-392/ (index.html, main.js, vendor/three, README.md, smoke.mjs, screenshot.png)
**Run:** `cd /workspace/museum-tools/buy-scanner-392 && python3 -m http.server 8392` → http://localhost:8392/
**Verified:** headless smoke — 0 console errors, scan ring fills, E adds to cart, bot fetches mini copy to trolley.
**Patterns:** #359 critically damped trolley follow + speed cap; #360 beak carry (simplified); #244 bot never blocks (no collision, avoids cone ahead of player).
**Stubbed:** 4 placeholder paintings/prices; in-memory cart, no checkout (#130/#152); primitive bot, no navmesh; no touch joystick.
**Remaining estimate to production-wire (needs TJ OK):** ~1.5–2 days (swap in duckbot/ostrich + navmesh, real catalog/checkout hook, mobile, perf tiers).

## Polish — Oct 26 2026 (offline)
- Replaced 4 stub paintings with 3 real shop items (same source as cart-proto: `wt-yelapa/catalog/products.json` via `cart-proto/sample-items.json`): Double portrait $200 · Sunrise from Punta El Zonte Hostel $1000 · Honeybadger and Cub with Genesis Block $1200. Slugs kept on each painting.
- Textures stay colored planes (no network). Paintings re-centered for 3; camera starts at x=0 facing the center painting.
- Cart lines drop "(stub)"; checkout still stubbed. No shared cart with cart-proto (deferred to TJ).
- smoke.mjs now asserts no errors + cart has Sunrise and "Total $1000" → SMOKE PASS.
- Not deployed; play-tags untouched.

## #403 cart polish — Oct 26 2026 (offline)
- New shared module `museum-tools/shared/cart-store.js`: localStorage key `museum-tools.cart.v1`, lines {slug,title,price,qty}; add/setQty/remove/clear/total/count + subscribe (same-tab + cross-tab `storage` sync).
- cart-proto/index.html rewritten: Add (stacks qty), −/+ qty, Remove, line totals, item count, running total, "Empty cart" button, empty-state message. Checkout still disabled stub (#130/#152).
- buy-scanner-392/main.js: E/button adds into the same shared cart (repeat scans = "Add another" → qty+1); HUD shows ×qty, total, link to cart-proto.
- **Run (one origin needed for shared storage):** `cd /workspace/museum-tools && python3 -m http.server 8403` → /buy-scanner-392/ and /cart-proto/. Old :8392/:8393 per-dir serving no longer works (imports ../shared).
- **Smoke:** `node smoke-cart-403.mjs` → SMOKE PASS (scanner add → reload persists → cart page sees it → qty/total $2200 → reload persists → dec/remove/empty/clear, 0 console errors). buy-scanner-392/smoke.mjs also PASS.
- Not deployed; play-tags / preview-251 untouched.
