# Build Cloudflare connector 'execute' code that deploys redirects/redirect-<g>.js as the _worker.js of Pages project tjm-play-<g>
# (same multipart POST as each museum's deploy/gen.py). Usage: python3 gen.py <g> > /tmp/one/exec-<g>.js
import json,re,sys
g=sys.argv[1]; worker=open(f'/workspace/gallery-core/oneapp/redirects/redirect-{g}.js').read()
src=open('/workspace/play-orsay/deploy/gen.py').read(); tpl=re.search(r'code="""(.*?)""" %', src, re.S).group(1)
print(tpl % (json.dumps(worker), 'tjm-play-'+g))
