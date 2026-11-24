# Museum-tools cart / checkout proto — status (Oct 26 2026)
**State:** first slice done offline. NOT wired into play-tags / preview; nothing deployed; no issue opened.
**Path:** /workspace/museum-tools/cart-proto/ (index.html, sample-items.json, smoke.mjs, README.md)
**Run:** `cd /workspace/museum-tools/cart-proto && python3 -m http.server 8393` → http://localhost:8393/ (same pattern as buy-scanner-392 on :8392)
**Shipped:** list 3 real catalog paintings (Double portrait $200, Sunrise from Punta El Zonte Hostel $1000, Honeybadger and Cub with Genesis Block $1200), Add/Remove toggle, cart list, running total; disabled "Checkout (stub)".
**Verified:** headless smoke — add #1+#3 → $1400.00, remove #1 → $1200.00; only console error is a favicon 404.
**Buy Scanner #392 recap:** three.js scene with 4 stub paintings; gaze dwell fills scan ring, E adds to in-memory cart, bot fetches mini copy to trolley. Served by python http.server, offline only.
**Deferred (needs TJ OK):** shared cart module between scanner and this page (localStorage), quantities/print sizes from variants, real checkout hook (#130/#152), shipping/tax, mobile polish, wiring into play-tags, any Pages deploy.

## #403 cart polish — Oct 26 2026 (offline)
- New shared module `museum-tools/shared/cart-store.js`: localStorage key `museum-tools.cart.v1`, lines {slug,title,price,qty}; add/setQty/remove/clear/total/count + subscribe (same-tab + cross-tab `storage` sync).
- cart-proto/index.html rewritten: Add (stacks qty), −/+ qty, Remove, line totals, item count, running total, "Empty cart" button, empty-state message. Checkout still disabled stub (#130/#152).
- buy-scanner-392/main.js: E/button adds into the same shared cart (repeat scans = "Add another" → qty+1); HUD shows ×qty, total, link to cart-proto.
- **Run (one origin needed for shared storage):** `cd /workspace/museum-tools && python3 -m http.server 8403` → /buy-scanner-392/ and /cart-proto/. Old :8392/:8393 per-dir serving no longer works (imports ../shared).
- **Smoke:** `node smoke-cart-403.mjs` → SMOKE PASS (scanner add → reload persists → cart page sees it → qty/total $2200 → reload persists → dec/remove/empty/clear, 0 console errors). buy-scanner-392/smoke.mjs also PASS.
- Not deployed; play-tags / preview-251 untouched.
