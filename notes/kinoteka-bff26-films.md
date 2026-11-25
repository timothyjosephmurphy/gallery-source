# Kinoteka BFF’26 film kiosk — title list
Source: https://bitcoinfilmfest.com/26/ (SM Oct 28 2026). Festival YT: youtube.com/@BitcoinFilmFest.
Most full films IndeeHub-gated. Kiosk: public full where exists; else trailer/official; Coined default.

## Cinema programme (18)
1. Bitchamler — Freedom on the River (~25m)
2. Bitcoin Castle / Schloss Bitcoin — Bruno Schiebel (~28m) — Golden Rabbit Best Movie + Audience
3. Bitcoin Motorcycle Diaries — Bitcoin Video Magazine (~60m / short chapter at fest)
4. **Coined in Watercolor** — Gavin Robertson (~12m) — DEFAULT — YT i7tvzE_bqM8 via tjm.art/film
5. Crying Baby, Dancing Bee (~11m)
6. Crypto Castle — Viv Ford (~9m)
7. Finding Home Ep. 4 — Avi Burra (~32m)
8. Finding Satoshi — Miele & Tooley (~101m; fest screened trailer)
9. From El Salvador to Global Mission / Bitcoin Beach (~30m)
10. Hummingbird — The Bitcoin Jungle Story — HODL (~75m) — full YT https://www.youtube.com/watch?v=63WbA7slCdg
11. Legend of Landi
12. Little Honeybadger
13. MaxisClub Ep. 3 — Redy (~23m) — Golden Rabbit Best Short
14. Satoshi
15. Satoshi’s Last Will
16. Seeding Bitcoin — Satoshi Labs
17. Self Custody — Garrett Patten / Adrian Grenier (~31m) — trailer YT vo6yEr00cXk; full Prime/Tubi
18. South of Market

## Optional Fri AI/shorts
The Whole Entire Universe, Chainwars, Spaceheater.

## Optional VOD-only section
Bitcoin: Digital Gold, Gimp and the Hitman, Rabbit Hole.

## Behavior
Kiosk in/near Kinoteka lobby; pick → screen plays; default Coined; pause/resume playhead per film.

## IndeeHub outlink (TJ Oct 28 ~12:43 AM PT)
Replace trailer-only fallback with link out to IndeeHub + path to become ticket holder.

### Behavior
- Free full stream (YT or hosted): play in-gallery (Coined default, Hummingbird YT, etc.)
- Gated / no free full: title + blurb + primary CTA **Watch on IndeeHub** → new tab `https://indeehub.studio/film/<slug>` (e.g. Coined `…/film/coined-in-watercolor`). If no film page: Screening Room `https://indeehub.studio/screening-room` or home `https://indeehub.studio/`.
- Secondary: become ticket holder — Screening Room is SVOD; rentals work without membership. Optional tertiary: https://bitcoinfilmfest.com/26/press/faq.html (festival ticket → VOD).
- Do **not** embed IndeeHub player in Three.js; external link only.

### IndeeHub URLs (fill as found)
| Title | IndeeHub slug/URL |
|-------|-------------------|
| Coined in Watercolor | https://indeehub.studio/film/coined-in-watercolor (verified; kiosk plays free in-gallery via kino800 chunks) |
| Hummingbird — The Bitcoin Jungle Story | https://indeehub.studio/film/hummingbird (verified; kiosk plays full free YT 63WbA7slCdg in-gallery) |
| Bitcoin Castle / Schloss Bitcoin | https://indeehub.studio/film/f498ceb5-eb81-4535-8f30-813cc954726f (verified title "Bitcoin Castle") |
| Seeding Bitcoin | https://indeehub.studio/film/0e163a08-820d-4dd4-882b-f2df05f53ddf (verified) |
| Finding Home Ep. 4 | https://indeehub.studio/film/finding-home (verified series page "Finding Home") |
| All other 13 cinema titles (incl. Self Custody) | no film page in indeehub.studio/sitemap.xml (Oct 28 2026) → https://indeehub.studio/screening-room |

#813 kiosk catalogue: play-tags/src/kino-bff26.json (single source for the in-gallery list).
