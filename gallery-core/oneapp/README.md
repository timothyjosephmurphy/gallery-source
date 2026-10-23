# One app under tjm.art/play (studio-tracker #24, #172)

URLs (static files in vermillionaurora `static/play/`, Workers assets with auto-trailing-slash):

| Gallery | Deep link | Gallery page (runs in the shell's frame) |
|---|---|---|
| TJM Gallery | https://tjm.art/play/ | /play/g/play/ |
| Musée d'Orsay | https://tjm.art/play/orsay/ | /play/g/orsay/ |
| Guggenheim Bilbao | https://tjm.art/play/bilbao/ | /play/g/bilbao/ |
| Uffizi | https://tjm.art/play/uffizi/ | /play/g/uffizi/ |
| Guggenheim New York | https://tjm.art/play/gugg-ny/ | /play/g/gugg-ny/ |

Paths, not `?g=`: each deep link is a real static page with its own title, description, share card and canonical URL.
Query strings and hashes pass through to the gallery (`?resume=1`, `?q=low`, `?display=`, `?via=`).

How it works: `/play/` and `/play/<id>/` are the same small shell (`oneapp/shell.js`). The shell loads the gallery page in a
full-screen frame. A gate calls `window.__gatesNav` (`src/shell-bridge.js`), and the shell loads the next gallery in a hidden
frame while the departing gallery plays its slipgate tunnel. When the new scene is ready, the shell pushes the deep link
(`history.pushState`) and fades over. Then it drops the old frame, which releases its WebGL context and GPU memory.
Back/forward swap the same way. Each gallery's JS/CSS chunks load only when its frame does. Links and page moves go to the
top window. Montreal (Chase's site) is a normal page move.

Build: `python3 gallery-core/oneapp/build.py /tmp/one/site`, then copy into `static/play/`.
Old pages.dev museum URLs: 301 to the deep link, query kept (`oneapp/redirects/`).
Tests: `gallery-core/tests/gates-oneapp.mjs`, `phoneui.mjs`, `cart.mjs`; per gallery eggaudit/audit.mjs on `/play/g/<id>/`.
