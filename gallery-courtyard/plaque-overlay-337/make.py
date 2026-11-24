#!/usr/bin/env python3
"""#337 readable plaque overlay panel art. Original, procedural (numpy/PIL). Rerun: python3 make.py"""
import json, math, numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
SS = 2
BODY = (21, 16, 11)           # gallery-core #15100b face
BODY_A = 0.86
GOLD_HI, GOLD, GOLD_LO = (247, 220, 140), (201, 158, 72), (110, 78, 32)
OCHRE = (247, 204, 58)        # palette Gilded Ochre

def brass(w, h, seed=337):
    rng = np.random.default_rng(seed)
    y = np.linspace(0, 1, h)[:, None]; x = np.linspace(0, 1, w)[None, :]
    t = 0.5 + 0.5*np.sin((y*1.7 + x*0.35)*math.pi*2)            # broad sheen
    streak = rng.normal(0, 1, (1, w)).repeat(h, 0)*0.04           # brushed
    t = np.clip(t*0.85 + streak + 0.08, 0, 1)[..., None]
    lo, mid, hi = (np.array(c, float) for c in (GOLD_LO, GOLD, GOLD_HI))
    rgb = np.where(t < .5, lo + (mid-lo)*(t/.5), mid + (hi-mid)*((t-.5)/.5))
    return Image.fromarray(rgb.astype(np.uint8), 'RGB')

def rr_mask(size, box, r, width=0):
    m = Image.new('L', size, 0); d = ImageDraw.Draw(m)
    d.rounded_rectangle(box, r, fill=255)
    if width: d.rounded_rectangle([box[0]+width, box[1]+width, box[2]-width, box[3]-width], max(1, r-width), fill=0)
    return m

def fan(d, cx, cy, r, a0, a1, n, col, w):
    """deco quarter fan: rays + concentric arcs"""
    for k in range(n+1):
        a = math.radians(a0 + (a1-a0)*k/n)
        d.line([cx+r*0.28*math.cos(a), cy+r*0.28*math.sin(a), cx+r*math.cos(a), cy+r*math.sin(a)], fill=col, width=w)
    for f in (0.28, 0.62, 1.0):
        d.arc([cx-r*f, cy-r*f, cx+r*f, cy+r*f], a0, a1, fill=col, width=w)

def ornament(px):
    """corner ornament, drawn for TOP-LEFT; flip for others. RGBA."""
    S = px*SS; im = Image.new('RGBA', (S, S)); m = Image.new('L', (S, S)); d = ImageDraw.Draw(m)
    w = max(2, S//48)
    fan(d, 0, 0, S*0.92, 0, 90, 7, 255, w)
    for k in range(3):                                            # stepped ziggurat edges
        o = S*0.06 + k*S*0.055
        d.line([o, S*0.96, o, o, S*0.96, o], fill=255, width=w)
    d.ellipse([S*0.13, S*0.13, S*0.27, S*0.27], fill=255)         # screw boss
    im.paste(brass(S, S), (0, 0), m)
    sh = Image.new('RGBA', (S, S), (0, 0, 0, 0)); sh.putalpha(m.filter(ImageFilter.GaussianBlur(S/90)).point(lambda v: v*0.6))
    out = Image.alpha_composite(Image.new('RGBA', (S, S)), sh.transform((S, S), Image.AFFINE, (1, 0, -S/160, 0, 1, -S/160)))
    out = Image.alpha_composite(out, im)
    return out.resize((px, px), Image.LANCZOS)

def panel(W, H, title_h, inset, close=True):
    S = (W*SS, H*SS); s = SS; R = int(min(W, H)*0.035)*s; b = int(min(W, H)*0.022)*s
    out = Image.new('RGBA', S)
    body = Image.new('RGBA', S, BODY + (int(255*BODY_A),))
    out.paste(body, (0, 0), rr_mask(S, [0, 0, S[0]-1, S[1]-1], R))
    # subtle vignette lift in body (kept flat inside text rect)
    trim = brass(*S)
    out.paste(trim, (0, 0), rr_mask(S, [0, 0, S[0]-1, S[1]-1], R, b))           # outer brass frame
    g = b + 6*s
    m = rr_mask(S, [g, g, S[0]-1-g, S[1]-1-g], max(1, R-g), 2*s)                     # fine inner gilt line
    out.paste(Image.new('RGBA', S, OCHRE+(230,)), (0, 0), m)
    # title bar: darker band + brass rule under it
    th = title_h*s; d = ImageDraw.Draw(out)
    d.rectangle([g+3*s, g+3*s, S[0]-g-3*s, th], fill=(12, 9, 6, 235))
    rule = Image.new('L', S); rd = ImageDraw.Draw(rule)
    rd.rectangle([g, th, S[0]-g, th+4*s], fill=255)
    cx = S[0]//2                                                                     # crest diamond on rule
    rd.polygon([(cx, th-12*s), (cx+18*s, th+2*s), (cx, th+16*s), (cx-18*s, th+2*s)], fill=255)
    fan(rd, cx, th+2*s, 46*s, 200, 340, 9, 255, 2*s)
    out.paste(trim, (0, 0), rule)
    # close affordance: brass ring + X, top-right inside title bar
    cb = None
    if close:
        r = int(title_h*0.30)*s; ccx = S[0]-g-int(title_h*0.62)*s; ccy = (g+th)//2
        cm = Image.new('L', S); cd = ImageDraw.Draw(cm)
        cd.ellipse([ccx-r, ccy-r, ccx+r, ccy+r], outline=255, width=3*s)
        k = int(r*0.45)
        cd.line([ccx-k, ccy-k, ccx+k, ccy+k], fill=255, width=4*s); cd.line([ccx-k, ccy+k, ccx+k, ccy-k], fill=255, width=4*s)
        out.paste(trim, (0, 0), cm); cb = (ccx/s, ccy/s, r/s)
    out = out.resize((W, H), Image.LANCZOS)
    # ornaments in the four corners
    op = int(min(W, H)*0.13); o = ornament(op); pad = int(min(W, H)*0.012)
    for fx, fy in ((0, 0), (1, 0), (0, 1), (1, 1)):
        t = o
        if fx: t = t.transpose(Image.FLIP_LEFT_RIGHT)
        if fy: t = t.transpose(Image.FLIP_TOP_BOTTOM)
        if fy == 0: continue  # top corners would clash with title bar -> only bottom; top uses title bar ends
        out.alpha_composite(t, (pad if not fx else W-op-pad, pad if not fy else H-op-pad))
    return out, cb

def uv(W, H, x0, y0, x1, y1):  # pixel (top-left) -> three.js UV (v up)
    return dict(u0=round(x0/W, 4), v0=round(1-y1/H, 4), u1=round(x1/W, 4), v1=round(1-y0/H, 4))

variants = {
  'desktop': dict(W=1600, H=1000, title=150, world=[1.20, 0.75]),
  'phone':   dict(W=900,  H=1200, title=150, world=[0.60, 0.80]),
}
meta = {'issue': 337, 'preview_only': True, 'approved': False,
        'note': 'Gallery owns interaction/layout; Writer owns copy. No text baked.',
        'material_hint': "MeshBasicMaterial({map, transparent:true, depthTest:false, toneMapped:false}) or CSS/DOM background; renderOrder high",
        'alpha': {'body': BODY_A, 'body_rgb': '#15100b', 'trim': 1.0, 'outside_corners': 0.0, 'premultiplied': False,
                  'hint': 'body is translucent: keep scene dimmer or add 0.35 black backdrop behind for WCAG contrast'},
        'ink': {'title': '#F7DC8C', 'body': '#EDE3CF', 'muted': '#B9AFA4'}, 'variants': {}}
for name, v in variants.items():
    W, H, T = v['W'], v['H'], v['title']
    im, cb = panel(W, H, T, 0)
    im.save(f'overlay-{name}.png', optimize=True); im.save(f'overlay-{name}.webp', quality=92, method=6)
    g = int(min(W, H)*0.022)+6; op = int(min(W, H)*0.13)
    title_rect = (g+int(T*0.25), g+8, W-g-int(T*1.05), T-8)
    body_rect = (int(W*0.07), T+40, W-int(W*0.07), H-int(op*0.75))
    meta['variants'][name] = dict(file=f'overlay-{name}.webp', png=f'overlay-{name}.png', px=[W, H],
        world_size_m=v['world'], title_rect_uv=uv(W, H, *title_rect), body_rect_uv=uv(W, H, *body_rect),
        title_rect_px=list(title_rect), body_rect_px=list(body_rect),
        close_hit_px={'cx': round(cb[0]), 'cy': round(cb[1]), 'r': round(cb[2]*1.4)},
        close_hit_uv={'u': round(cb[0]/W, 4), 'v': round(1-cb[1]/H, 4), 'r_u': round(cb[2]*1.4/W, 4)},
        text_px_suggest={'title': round(T*0.38), 'body': 30 if name == 'desktop' else 34, 'line_height': 1.4})
for px in (256, 128):
    o = ornament(px); o.save(f'corner-ornament-{px}.png'); o.save(f'corner-ornament-{px}.webp', quality=92)
meta['corner_ornament'] = {'files': ['corner-ornament-256.webp', 'corner-ornament-128.webp'], 'orientation': 'top-left; flip X/Y for other corners', 'already_baked_in_panel': 'bottom corners'}
json.dump(meta, open('overlay.json', 'w'), indent=2)

# preview: panels over a mid-grey courtyard stand-in, with text rects dashed + lorem
def prev():
    bg = Image.new('RGBA', (2900, 1420), (200, 170, 150, 255))
    bd = ImageDraw.Draw(bg)
    for i in range(0, 3600, 60): bd.line([i, 0, i-600, 1420], fill=(225, 190, 160, 255), width=24)
    try: f1 = ImageFont.truetype('DejaVuSerif-Bold.ttf', 54); f2 = ImageFont.truetype('DejaVuSans.ttf', 30)
    except Exception: f1 = f2 = ImageFont.load_default()
    for name, x in (('desktop', 50), ('phone', 1720)):
        p = Image.open(f'overlay-{name}.png').copy(); m = meta['variants'][name]; d = ImageDraw.Draw(p)
        for k, c in (('title_rect_px', (90, 220, 255)), ('body_rect_px', (90, 255, 140))):
            x0, y0, x1, y1 = m[k]; d.rectangle([x0, y0, x1, y1], outline=c + (200,), width=2)
        x0, y0, x1, y1 = m['title_rect_px']; d.text((x0+8, (y0+y1)//2), 'Lorem Ipsum', font=f1, fill='#F7DC8C', anchor='lm')
        x0, y0, x1, y1 = m['body_rect_px']
        for i in range(6): d.text((x0+10, y0+20+i*44), 'Lorem ipsum dolor sit amet, consectetur.'[: 40 if name == 'desktop' else 30], font=f2, fill='#EDE3CF')
        bg.alpha_composite(p, (x, 150))
    bg.alpha_composite(ornament(256), (2640, 150))
    bg.convert('RGB').save('preview.png', optimize=True)
prev()
print('ok')
