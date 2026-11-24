# Story-board plates (#335): blank albedo/normal/roughness webp planes, same pattern as hq-assets/signs/sign-plate-*.
import numpy as np, json
from PIL import Image, ImageFilter
rng = np.random.default_rng(335)
W, H = 1024, 640                     # 0.45 x 0.28 m face (aspect 1.607 ~ 1.6)
TEXT = (96, 88, 928, 552)            # px (x0, y0, x1, y1), top-left origin, at desktop size
def hexc(h): return np.array([int(h[i:i+2], 16) for i in (1, 3, 5)], float)
from scipy.ndimage import gaussian_filter, uniform_filter
def blur(a, r): return gaussian_filter(a.astype(np.float32), r[::-1] if isinstance(r, tuple) else r)
def noise(r, amp): n = blur(rng.standard_normal((H, W)) * 1.0, r); return n / (n.std() + 1e-6) * amp
yy, xx = np.mgrid[0:H, 0:W].astype(float)
def rrect(m, rad):                   # signed-ish inside mask for a rounded rect inset by m px
    dx = np.maximum(np.maximum(m + rad - xx, xx - (W - 1 - m - rad)), 0); dy = np.maximum(np.maximum(m + rad - yy, yy - (H - 1 - m - rad)), 0)
    return rad - np.hypot(dx, dy)    # >0 inside
def band(d, a, b): return ((d > a) & (d < b)).astype(float)
def screws(col, img, h, r=11):
    for cx, cy in [(52, 52), (W - 53, 52), (52, H - 53), (W - 53, H - 53)]:
        d = np.hypot(xx - cx, yy - cy); m = d < r; sh = 0.75 + 0.35 * np.clip((cx - xx - (cy - yy)) / r, -1, 1)
        img[m] = col * sh[m, None]; h[m] += np.sqrt(np.clip(r * r - d[m] ** 2, 0, None)) / r * 3
        slot = m & (np.abs((xx - cx) - (yy - cy)) < 1.6); img[slot] *= 0.45
def build(kind):
    img = np.zeros((H, W, 3)); h = np.zeros((H, W)); rough = np.zeros((H, W)); d = rrect(4, 22)
    alpha = np.clip(d + 0.5, 0, 1) * 255
    if kind == 'dark':               # gallery-core exhibition boards: #2a2018 frame, #15100b face, thin gilt line
        grain = blur(rng.standard_normal((H, W)), (12, 0.8))
        streak = blur(rng.standard_normal((H, W)), (60, 1.2)); streak = streak / streak.std()
        img[:] = hexc('#2a2018') * (1 + 0.08 * streak[..., None] + 0.03 * grain[..., None])
        inner = rrect(40, 10) > 0
        img[inner] = (hexc('#15100b') * (1 + noise(6, .04)[..., None]))[inner]
        gilt = band(rrect(30, 14), 0, 4) > 0; img[gilt] = hexc('#c9a14a') * (1 + noise(1, .08)[gilt][:, None])
        h += np.clip(d, 0, 6) / 6 * 4 - (inner * 2.0) + gilt * 1.5
        rough[:] = .62; rough[inner] = .85; rough[gilt] = .35; screws(hexc('#b8903e'), img, h)
    elif kind == 'brass':            # brushed brass like sign-plate-brass, engraved double border
        brush = blur(rng.standard_normal((H, W)), (90, 0.5)); brush = brush / brush.std()
        img[:] = hexc('#c99a3e') * (1 + 0.07 * brush[..., None] + noise(60, .05)[..., None])
        for a in (26, 40):
            e = band(rrect(a, 12), 0, 2.2) > 0; img[e] *= 0.55; h[e] -= 2
        h += np.clip(d, 0, 8) / 8 * 3; rough[:] = .38 + 0.05 * brush; screws(hexc('#e0b860'), img, h)
    else:                            # enamel: cream rim + slate-blue enamel field + gilt line, like sign-plate-enamel
        img[:] = hexc('#e8dcc4') * (1 + noise(0.8, .03)[..., None]); speck = rng.random((H, W)) > .996; img[speck] *= .45
        field = rrect(28, 16) > 0
        img[field] = (hexc('#4f6584') * (1 + noise(30, .06)[..., None]))[field]
        g = band(rrect(38, 10), 0, 3) > 0; img[g] = hexc('#d6aa3a'); r2 = band(rrect(46, 8), 0, 1.5) > 0; img[r2] = hexc('#8a5a5a')
        h += field * 2 + g * 1; rough[:] = .55; rough[field] = .22; rough[g] = .3; screws(hexc('#d6aa3a'), img, h)
    edge = band(d, 0, 3) > 0; img[edge] *= 0.7
    gy, gx = np.gradient(blur(h, 1.2)); n = np.dstack([-gx * 1.6, -gy * 1.6, np.ones_like(h)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    out = {'': np.dstack([np.clip(img, 0, 255), alpha]).astype(np.uint8), '_n': ((n * .5 + .5) * 255).astype(np.uint8), '_r': (np.clip(rough, 0, 1) * 255).astype(np.uint8)}
    for suf, a in out.items():
        im = Image.fromarray(a); base = f'story-plate-{kind}{suf}'
        im.save(base + '.webp', quality=88, method=6); im.resize((W // 2, H // 2), Image.LANCZOS).save(base + '.phone.webp', quality=85, method=6)
for k in ('dark', 'brass', 'enamel'): build(k)
x0, y0, x1, y1 = TEXT
meta = {'face_m': [0.45, 0.28], 'tex_px': {'desktop': [W, H], 'phone': [W // 2, H // 2]},
        'text_rect_px_desktop_topleft': list(TEXT),
        'text_rect_uv': {'u0': x0 / W, 'v0': 1 - y1 / H, 'u1': x1 / W, 'v1': 1 - y0 / H, 'note': 'three.js UV (v up, texture.flipY = true default); same fractions at phone size'},
        'text_rect_canvas_frac_topleft': [x0 / W, y0 / H, x1 / W, y1 / H],
        'text_rect_m_from_centre': [round((x0 / W - .5) * .45, 4), round((.5 - y1 / H) * .28, 4), round((x1 / W - .5) * .45, 4), round((.5 - y0 / H) * .28, 4)],
        'variants': {k: {'map': f'story-plate-{k}.webp', 'normalMap': f'story-plate-{k}_n.webp', 'roughnessMap': f'story-plate-{k}_r.webp', 'metalness': {'dark': 0.0, 'brass': 1.0, 'enamel': 0.0}[k],
                         'ink': {'dark': '#e9dcc0', 'brass': '#2a1a0c', 'enamel': '#f3ead6'}[k]} for k in ('dark', 'brass', 'enamel')}}
json.dump(meta, open('story-plates.json', 'w'), indent=1); print(meta['text_rect_uv'])
