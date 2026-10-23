# Tag-gallery PREVIEW (#251): same method as play-orsay/deploy/gen.py. Separate Pages project, non-main branch, noindex.
import os,base64,json,sys,re
project=sys.argv[1] if len(sys.argv)>1 else 'tjm-tag-gallery-preview'
root='dist'; T={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webmanifest':'application/manifest+json'}
files={}
for d,_,fs in os.walk(root):
    if '/art' in d or '/pbr' in d or '/plaques' in d: continue
    for f in fs:
        p=os.path.join(d,f); k='/'+os.path.relpath(p,root); e=os.path.splitext(f)[1]
        if e in T: files[k]=[T[e],open(p,'rb').read().decode('utf-8'),0]
for f in os.listdir('dist/art'):  # #288: new local art (the cropped Rainier) is not on tjm.art yet, so ship it with the preview
    if '-288' in f or '-317' in f: files['/art/'+f]=['image/webp',open('dist/art/'+f,'rb').read().hex(),1]
for f in os.listdir('dist/courtyard'):  # #296: Visual's mosaic pieces (resized) ship with the preview: medallion, checkout ring, dome glass, room signs
    if '-296' in f: files['/courtyard/'+f]=['image/webp',open('dist/courtyard/'+f,'rb').read().hex(),1]
for f in os.listdir('dist/plaques'):
    b=open('/tmp/'+f[:-4]+'.webp','rb').read().hex()
    files['/plaques/'+f]=['image/webp',b,1]
worker="const F="+json.dumps(files)+""";
const PROXY=[['/art/','https://tjm.art/play/art/'],['/pbr/','https://tjm.art/play/pbr/'],['/tjm/','https://tjm.art/'],['/mva/','https://media.vermillionaurora.com/'],['/img/','https://img.tjm.art/']];
const NI={'x-robots-tag':'noindex, nofollow'};
export default{async fetch(req,env){const u=new URL(req.url);let p=u.pathname;if(p==='/')return Response.redirect(u.origin+'/play/',302);
if(p.startsWith('/play/'))p=p.slice(5);else if(p==='/play')p='/';if(p==='/')p='/index.html';
for(const [a,b] of PROXY)if(!F[p]&&p.startsWith(a)&&/\\.(webp|jpe?g|png|glb)$/i.test(p)){const r=await fetch(b+p.slice(a.length),{cf:{cacheTtl:86400,cacheEverything:true}});
const h=new Headers(NI);h.set('content-type',/\\.glb$/i.test(p)?'model/gltf-binary':(r.headers.get('content-type')||'image/webp'));h.set('cache-control','public, max-age=604800');h.set('access-control-allow-origin','*');return new Response(r.body,{status:r.status,headers:h});}
if(p==='/tjm/neural-dance/'){const r=await fetch('https://tjm.art/neural-dance/',{cf:{cacheTtl:600,cacheEverything:true}});return new Response(r.body,{status:r.status,headers:{...NI,'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=600'}});}
if(p==='/robots.txt')return new Response('User-agent: *\\nDisallow: /\\n',{headers:{'content-type':'text/plain'}});
const f=F[p];if(!f)return new Response('Not found',{status:404,headers:NI});
const body=f[2]?new Uint8Array(f[1].match(/../g).map(h=>parseInt(h,16))):f[1];
return new Response(body,{headers:{...NI,'content-type':f[0],'access-control-allow-origin':'*','cache-control':p.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache'}});}};"""
open('deploy/_worker.js','w').write(worker)
print(len(worker), 'DMT' in worker.upper().replace('\n',''))
