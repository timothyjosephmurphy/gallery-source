#!/usr/bin/env python3
# One-app build (#24, #172): builds every TJ gallery with base /play/ and assembles static/play/:
#   /play/            shell (TJM Gallery)        /play/<id>/        shell deep link (orsay, bilbao, uffizi, gugg-ny)
#   /play/g/<id>/     the gallery page itself    /play/assets/      all hashed bundles (each gallery lazy-loads only its own)
import os, re, shutil, subprocess, sys, json, html, filecmp
W = '/workspace'; OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/one/site'
G = [('play', 'play-gallery'), ('orsay', 'play-orsay'), ('bilbao', 'play-bilbao'), ('uffizi', 'play-uffizi'), ('gugg-ny', 'play-gugg-ny'), ('home', 'play-splat')]
SKIP_PUBLIC = {'holo', 'art-hi', 'index.html'}  # holograms/books/hi-res come from img.tjm.art (as live today)
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT + '/assets')
shell_js = open(W + '/gallery-core/oneapp/shell.js').read() + '\n' + open(W + '/gallery-core/oneapp/analytics.js').read()  # #240
for fb in ('nogl2', 'inapp', 'lost', 'stall', 'other'):  # #240: one tiny page per fallback type = a cookie-free virtual page view
    os.makedirs(f'{OUT}/fb/{fb}'); open(f'{OUT}/fb/{fb}/index.html', 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Fallback: {fb}</title></head><body></body></html>')
for gid, d in G:
    src = f'{W}/{d}'; tmp = f'/tmp/one/build-{gid}'
    if gid == 'orsay': shutil.copy(src + '/.env.orsay', src + '/.env.production')
    r = subprocess.run(['npx', 'vite', 'build', '--base', '/play/', '--outDir', tmp, '--emptyOutDir'], cwd=src, capture_output=True, text=True)
    if r.returncode: print(r.stdout[-1500:], r.stderr[-1500:]); sys.exit(f'build failed: {gid}')
    for f in os.listdir(tmp + '/assets'):
        dst = f'{OUT}/assets/{f}'
        if os.path.exists(dst) and not filecmp.cmp(dst, f'{tmp}/assets/{f}', shallow=False): sys.exit(f'asset clash {f}')
        shutil.copy(f'{tmp}/assets/{f}', dst)
    if gid == 'home':  # #211: the scanned room's splat files (small: ~0.2 MB) are served from static/play/scan/; its art is already in /play/art/
        shutil.copytree(tmp + '/scan', OUT + '/scan')
        for f in os.listdir(tmp + '/art'):
            if not os.path.exists(f'{OUT}/art/{f}'): sys.exit(f'home: art/{f} missing from /play/art/')
        for q in json.load(open(src + '/src/picker-paintings.json')):  # #212 picker list: every image it shows must be in /play/art/
            if not os.path.exists(f'{OUT}/{q["img"]}'): sys.exit(f'home picker: {q["img"]} missing from /play/')
    if gid == 'play':
        for f in os.listdir(tmp):
            if f in SKIP_PUBLIC or f == 'assets': continue
            (shutil.copytree if os.path.isdir(f'{tmp}/{f}') else shutil.copy)(f'{tmp}/{f}', f'{OUT}/{f}')
    os.makedirs(f'{OUT}/g/{gid}'); page = open(tmp + '/index.html').read()
    page = page.replace('href="manifest.webmanifest"', 'href="/play/manifest.webmanifest"')
    open(f'{OUT}/g/{gid}/index.html', 'w').write(page)
    # shell for this gallery: same title / description / share tags, then the frame
    head = re.search(r'<head>(.*?)</head>', page, re.S).group(1)
    keep = [m for m in re.findall(r'<(?:title>.*?</title|meta [^>]*|link [^>]*)>', head, re.S) if not re.search(r'stylesheet|modulepreload|rel="icon"|rel="manifest"|charset|name="viewport"', m)]
    url = 'https://tjm.art/play/' + ('' if gid == 'play' else gid + '/')
    keep = [re.sub(r'(rel="canonical" href=|property="og:url" content=)"[^"]*"', r'\1"' + url + '"', m) for m in keep]
    if not any('canonical' in m for m in keep): keep.append(f'<link rel="canonical" href="{url}">')
    shell = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
      '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">'
      '<link rel="manifest" href="/play/manifest.webmanifest"><link rel="icon" href="data:,">' + ''.join(keep) +
      '<style>html,body{margin:0;height:100%;overflow:hidden;background:#000;touch-action:none;overscroll-behavior:none}'
      'iframe.g{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;border:0;display:block;background:#000;transition:opacity .3s}'
      'iframe.g.next{opacity:0;pointer-events:none;z-index:-1}'
      '#sa{position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}</style>'
      f'<link rel="prefetch" href="/play/g/{gid}/"></head><body><div id="sa"></div><script>{shell_js}</script></body></html>')
    p = OUT + '/index.html' if gid == 'play' else f'{OUT}/{gid}/index.html'
    os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'w').write(shell)
    print('built', gid, len(os.listdir(tmp + '/assets')), 'assets')
_forbid = ''.join(chr(c) for c in (68, 77, 84)); bad = subprocess.run(['rg', '-l', r'\b' + _forbid + r'\b', OUT], capture_output=True, text=True).stdout.strip()
if bad: sys.exit('banned word in: ' + bad)
print('site', OUT, sum(len(f) for _, _, f in os.walk(OUT)), 'files')
