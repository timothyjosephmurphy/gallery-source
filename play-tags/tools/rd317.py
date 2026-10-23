# #317: import309.build() rewrites tools/realdims.json from the social-card sizes; put the real image sizes back for the pieces whose image was replaced.
import json
from PIL import Image
def patch(O):
    R = json.load(open('tools/real317.json')); RDp = 'tools/realdims.json'; RD = json.load(open(RDp)); z = dict(top=0.0, bottom=0.0, left=0.0, right=0.0)
    for a in O.get('assets', []):
        if not str(a.get('note', '')).startswith('#317'): continue
        v = R.get(a['id'], {})
        if 'url' in v: RD[a['id']] = dict(px=v['w480'], border=z, hiPx=v['w960'], hiBorder=z)
        else: d = list(Image.open('public/' + a['img']).size); RD[a['id']] = dict(px=d, border=z, hiPx=d, hiBorder=z)
    json.dump(RD, open(RDp, 'w'))
