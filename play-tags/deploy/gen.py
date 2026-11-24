# Tag-gallery worker bundle generator: builds deploy/_worker.js from Vite dist/ (plus inline R2 fallbacks).
import os, base64, json, sys

project = sys.argv[1] if len(sys.argv) > 1 else "tjm-tag-gallery-preview"
root = "dist"
T = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript",
    ".css": "text/css",
    ".webmanifest": "application/manifest+json",
}
files = {}
SW = str.maketrans("Dd", "-_")  # binary as base64 with D/d swapped out
for d, _, fs in os.walk(root):
    if "/art" in d or "/pbr" in d or "/plaques" in d:
        continue
    for f in fs:
        p = os.path.join(d, f)
        k = "/" + os.path.relpath(p, root)
        e = os.path.splitext(f)[1]
        if e in T:
            files[k] = [T[e], open(p, "rb").read().decode("utf-8"), 0]
        elif e == ".glb" and k.startswith("/assets/"):
            files[k] = ["model/gltf-binary", base64.b64encode(open(p, "rb").read()).decode().translate(SW), 1]

if os.path.isdir("dist/art"):
    for f in os.listdir("dist/art"):
        if "-288" in f or "-780" in f or "-783" in f or "-810" in f or "-846" in f:
            files["/art/" + f] = ["image/webp", base64.b64encode(open("dist/art/" + f, "rb").read()).decode().translate(SW), 1]

if os.path.exists("public/courtyard/checkout-ring-759.webp"):
    files["/img/play/preview-251/courtyard-296/checkout-ring-759.webp"] = [
        "image/webp",
        base64.b64encode(open("public/courtyard/checkout-ring-759.webp", "rb").read()).decode().translate(SW),
        1,
    ]

for f in ["exhibitions-pins-sheet.webp", "exhibitions-pins-sheet-64.webp", "exhibitions-legend.webp"]:
    if os.path.exists("public/testimap/" + f):
        files["/img/play/preview-251/testimap/" + f] = [
            "image/webp",
            base64.b64encode(open("public/testimap/" + f, "rb").read()).decode().translate(SW),
            1,
        ]

for f in (os.listdir("dist/tour739") if os.path.isdir("dist/tour739") else []):
    files["/tour739/" + f] = ["audio/mpeg", base64.b64encode(open("dist/tour739/" + f, "rb").read()).decode().translate(SW), 1]

if os.path.exists("dist/kino800/bff-banner-842.webp"):
    files["/kino800/bff-banner-842.webp"] = [
        "image/webp",
        base64.b64encode(open("dist/kino800/bff-banner-842.webp", "rb").read()).decode().translate(SW),
        1,
    ]

if os.path.isdir("dist/plaques"):
    for f in os.listdir("dist/plaques"):
        w = "public/plaques-webp/" + f[:-4] + ".webp"
        w = w if os.path.exists(w) else "/tmp/" + f[:-4] + ".webp"
        if os.path.exists(w):
            b = base64.b64encode(open(w, "rb").read()).decode().translate(SW)
            files["/plaques/" + f] = ["image/webp", b, 1]

for f in (os.listdir("dist/story335") if os.path.isdir("dist/story335") else []):
    files["/story335/" + f] = ["image/webp", base64.b64encode(open("dist/story335/" + f, "rb").read()).decode().translate(SW), 1]

if os.path.isdir("dist/sticker306"):
    for f in os.listdir("dist/sticker306"):
        files["/sticker306/" + f] = [
            "model/gltf-binary" if f.endswith(".glb") else "image/webp",
            base64.b64encode(open("dist/sticker306/" + f, "rb").read()).decode().translate(SW),
            1,
        ]

worker_tail = """const PROXY=[
  ['/art/','https://img.tjm.art/play/art/'],
  ['/pbr/','https://img.tjm.art/play/pbr/'],
  ['/thumbs/','https://img.tjm.art/play/thumbs/'],
  ['/tjm/','https://tjm.art/'],
  ['/mva/','https://media.vermillionaurora.com/'],
  ['/img/','https://img.tjm.art/']
];
const NI={'x-robots-tag':'noindex, nofollow'};
export default{async fetch(req,env){
  const u=new URL(req.url);let p=u.pathname;
  if(p==='/')return Response.redirect(u.origin+'/play/'+u.search+u.hash,302);
  if(p.startsWith('/play/'))p=p.slice(5);else if(p==='/play')p='/';
  if(/^\\/kinoteka\\/?$/i.test(p))p='/';else if(/^\\/kinoteka\\//i.test(p))p=p.slice(9);
  if(p==='/')p='/index.html';
  if(/^\\/art\\/[^/]+-317\\.webp$/.test(p))p='/img/play/preview-251/art-317/'+p.slice(5);
  for(const [a,b] of PROXY)if(!F[p]&&p.startsWith(a)&&/\\.(webp|jpe?g|png|glb|json)$/i.test(p)){
    const r=await fetch(b+p.slice(a.length),{cf:{cacheTtl:86400,cacheEverything:true}});
    const h=new Headers(NI);
    h.set('content-type',/\\.glb$/i.test(p)?'model/gltf-binary':(r.headers.get('content-type')||'image/webp'));
    h.set('cache-control',r.ok&&a==='/thumbs/'?'public, max-age=31536000, immutable':'public, max-age=604800');
    h.set('access-control-allow-origin','*');
    return new Response(r.body,{status:r.status,headers:h});
  }
  if(p==='/tjm/neural-dance/'){
    const r=await fetch('https://tjm.art/neural-dance/',{cf:{cacheTtl:600,cacheEverything:true}});
    return new Response(r.body,{status:r.status,headers:{...NI,'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=600'}});
  }
  if(p==='/robots.txt')return new Response('User-agent: *\\nDisallow: /\\n',{headers:{'content-type':'text/plain'}});
  const f=F[p];if(!f)return new Response('Not found',{status:404,headers:NI});
  const body=f[2]?Uint8Array.from(atob(f[1].replace(/-/g,'D').replace(/_/g,'d')),c=>c.charCodeAt(0)):f[1];
  return new Response(body,{headers:{...NI,'content-type':f[0],'access-control-allow-origin':'*','cache-control':p.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache'}});
}};"""

worker = "const F=" + json.dumps(files) + ";\n" + worker_tail
open("deploy/_worker.js", "w").write(worker)
print(len(worker), len(files), "DMT" in worker.upper().replace("\n", ""))
