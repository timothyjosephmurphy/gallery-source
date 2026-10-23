# #317: scan every hung painting's served image for near-white margins baked into the file (paper/mat), scanning inward from each edge.
# near-white pixel: min(R,G,B) >= WHITE_MIN and (max-min) <= SAT_MAX.  A row/column counts as margin when >= LINE_FRAC of its pixels are near-white.
# Writes tools/whitemargin317.json {id: {px, margin:{top,bottom,left,right} as fractions of the side, hi?}}.
import json, sys, concurrent.futures as cf
sys.argv = sys.argv[:1]
exec(open('tools/realdims.py').read().split('def border(im)')[0])  # reuse load()/BASE/P (no side effects before def border)
import numpy as np
WHITE_MIN, SAT_MAX, LINE_FRAC = 232, 22, 0.985
def margins(im):
    a = np.asarray(im.convert('RGBA'))
    if a.shape[2] == 4: a = np.where(a[:, :, 3:4] < 128, 255, a[:, :, :3]).astype(np.uint8)  # transparent counts as blank
    a = a[:, :, :3]; mn = a.min(2); mx = a.max(2); wh = (mn >= WHITE_MIN) & ((mx.astype(int) - mn) <= SAT_MAX)
    h, w = wh.shape; out = {}
    rows = wh.mean(1) >= LINE_FRAC; cols = wh.mean(0) >= LINE_FRAC
    def run(v):
        n = 0
        while n < len(v) and v[n]: n += 1
        return n
    out['top'] = run(rows); out['bottom'] = run(rows[::-1]); out['left'] = run(cols); out['right'] = run(cols[::-1])
    full = out['top'] >= h or out['left'] >= w  # blank image
    return {k: round(v / (h if k in ('top', 'bottom') else w), 4) for k, v in out.items()}, (w, h), full, round(float(wh.mean()), 3)
def one(p):
    try:
        im = load(p); m, px, full, wf = margins(im); r = {'px': list(px), 'margin': m, 'whiteFrac': wf, 'blank': full}
        return p['id'], r
    except Exception as e: return p['id'], {'err': str(e)[:120]}
if __name__ == '__main__':
    R = dict(cf.ThreadPoolExecutor(12).map(one, P))
    json.dump(R, open('tools/whitemargin317.json', 'w'), indent=0)
    bad = {k: v for k, v in R.items() if 'margin' in v and max(v['margin'].values()) >= 0.004}
    print(len(R), 'errors', [k for k, v in R.items() if 'err' in v], 'with margin >=0.4%:', len(bad))
