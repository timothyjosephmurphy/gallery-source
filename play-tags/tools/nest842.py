# #842 (TJ Oct 30 2026 walk add): (1) official Bitcoin Film Festival banner hung OUTSIDE the Kinoteka portico, below the gold
# KINOTEKA lintel (plaza face), above the doorway. Texture = bitcoinfilmfest.com/presskit/laurels-assets/bff27-poster-horizontal.png
# (resized 1024x576 webp, public/kino800/bff-banner-842.webp, ships inline). Lintel kinoLintel818 untouched.
# (2) #813 film kiosk moved to just inside the door, immediately on your right as you walk in; picker lists free/YouTube first
# (clickable, play in-gallery) then 'View the rest on IndeeHub' CTA + gated titles. Soft holds untouched. Idempotent; asserts 841/842.
import json
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (841,842), T['nest']
K='src/kino800.js'; s=open(K).read()
if 'bffBanner842' not in s:
    a="/* #818 gold entrance-sign lettering on both lintel faces */"
    assert s.count(a)==1
    s=s.replace(a,a+" { const bt = TL.load(import.meta.env.BASE_URL + 'kino800/bff-banner-842.webp'); bt.colorSpace = THREE.SRGBColorSpace; const bw = 4.0, bh = 2.25, by = y0 + CH + 0.75 - 0.575 - 0.06 - bh / 2, bz = 10.2 - 0.87 - 0.04; const bn = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.MeshBasicMaterial({ map: bt, toneMapped: false })); bn.position.set(0, by, bz); bn.rotation.y = Math.PI; bn.name = 'bffBanner842'; bn.userData.decor800 = true; G.add(bn); const rod = add(M(0xc9a34a, 0.35, 0.8), bw + 0.2, 0.05, 0.05, 0, by + bh / 2 + 0.03, bz); rod.name = 'bffBanner842rod'; } /* #842 official BFF banner (presskit bff27-poster-horizontal) under the KINOTEKA lintel, plaza face, above the door */",1)
    open(K,'w').write(s)
Q='src/kinoKiosk813.js'; s=open(Q).read()
if 'kiosk842' not in s:
    a="st.position.set(-4.75, fy, 12.35); st.rotation.y = 2.2; /* faces the doorway + aisle */"
    assert a in s
    s=s.replace(a,"st.position.set(-1.9, fy, 11.75); st.rotation.y = Math.PI / 2; /* kiosk842: just inside the door, immediately on your right walking in, faces the entry path */")
    a="const films = CAT.films,"; assert a in s
    s=s.replace(a,"const films = [...CAT.films].sort((p, q) => (p.mode === 'gated') - (q.mode === 'gated')) /* kiosk842: free / YouTube first */,",1)
    a="const cardEl = el('div', 'k813c', pnl), list = el('div', '', pnl);"; assert a in s
    s=s.replace(a,"const cardEl = el('div', 'k813c', pnl), list = el('div', '', pnl); const sec = t => { const d = el('div', '', list); d.style.cssText = 'font-size:12px;letter-spacing:.06em;color:#ffd77a;margin:10px 4px 2px'; d.textContent = t; }; sec('▶ WATCH FREE HERE · tap to play'); let ihHead = false;",1)
    a="const rows = films.map(f => { const b = el('button', '', list);"; assert a in s
    s=s.replace(a,"const rows = films.map(f => { if (f.mode === 'gated' && !ihHead) { ihHead = true; const x = el('a', 'k842ih', list); x.href = CAT.home || 'https://indeehub.studio/'; x.target = '_blank'; x.rel = 'noopener'; x.textContent = 'View the rest on IndeeHub ↗'; x.style.cssText = 'display:block;margin:12px 2px 4px;padding:9px;border-radius:6px;text-align:center;text-decoration:none;color:#14100d;background:#ffd77a;font-weight:700'; sec('ON INDEEHUB · ticket holders / subscribe / rent'); } const b = el('button', '', list);",1)
    a="b.lastChild.textContent = f.mode === 'gated' ? 'IndeeHub' : 'Free · here';"; assert a in s
    s=s.replace(a,"b.lastChild.textContent = f.mode === 'gated' ? 'IndeeHub ↗' : f.mode === 'yt' ? '▶ YouTube · here' : '▶ Free · here';")
    open(Q,'w').write(s)
g=open('deploy/gen.py').read()
if 'bff-banner-842' not in g:
    a="for f in os.listdir('dist/plaques'):"; assert a in g
    g=g.replace(a,"for f in (['bff-banner-842.webp'] if os.path.exists('dist/kino800/bff-banner-842.webp') else []):  # #842 official BFF banner ships inline\n    files['/kino800/'+f]=['image/webp',base64.b64encode(open('dist/kino800/'+f,'rb').read()).decode().translate(SW),1]\n"+a,1)
    open('deploy/gen.py','w').write(g)
T['nest']['kiosk813']['at_local_uv']=[-1.9,11.75]
T['nest']['bff842']={'banner':'public/kino800/bff-banner-842.webp','src':'https://bitcoinfilmfest.com/presskit/laurels-assets/bff27-poster-horizontal.png','size_m':[4.0,2.25],'at_local':'u0 v9.29 plaza face under kinoLintel818','kiosk':[-1.9,11.75],'picker':'free/YouTube first, IndeeHub CTA'}
T['nest']['note842']='#842 TJ walk add: official BFF banner under KINOTEKA lintel (outside, plaza face); kiosk just inside door on the right; picker free/YouTube first + View the rest on IndeeHub'
T['nest'].update(issue=842,prev=841)
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
print(842,'ok')
