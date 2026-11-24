# #335 follow-up (TJ, Oct 26): the per-room Art Deco motifs carried onto the architecture: cornice frieze, door surround, dado / picture rail, keystone medallion.
# Reuses the motif drawing code of ../story-plaques/make_room_plates.py (exec'd up to its room-layout section) and the same room -> motif map.
import numpy as np, json, math, os
from PIL import Image
from scipy.ndimage import gaussian_filter
SRC = open('../story-plaques/make_room_plates.py').read().split('# ---------- room layouts')[0]
M = {}; exec(SRC, M)                                   # Deco, sunburst, fan, scallop_shell, scallop_row, waves, clouds, chevron_*, palm*, peacock, feather_*, volute, fountain, fin_stack, ...
hexc = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)
PAL = {k: hexc(v) for k, v in dict(terracotta='#C8644E', slate='#5E7289', ochre='#F7CC3A', plaster='#F3E6D8', apricot='#F7A66E', coral='#F48A5C', rose='#E9A9A6',
       horizon='#9DB7CF', sage='#8FAE9E', blue='#5E9ADB', bluedeep='#3A6FB8', violet='#9A78CF', violetdeep='#6E4FA8').items()}
rng = np.random.default_rng(3351)

def canvas(w, h, wm):
    M['W'], M['H'], M['WM'] = w, h, wm; return M['Deco']()

def render(D, w, h, band, panel, gilt, wrap_x=True, wrap_y=False, emboss=1.0):
    ra = np.asarray(D.r.resize((w, h), Image.LANCZOS), float) / 255; rc = np.asarray(D.c.resize((w, h), Image.LANCZOS), float) / 255
    mode = ('wrap' if wrap_y else 'nearest', 'wrap' if wrap_x else 'nearest')
    g = lambda a, s: np.dstack([gaussian_filter(a, s, mode=mode)]) [..., 0] if a.ndim == 2 else a
    nz = gaussian_filter(rng.standard_normal((h, w)), 2.0, mode='wrap'); nz /= nz.std()
    img = band * (1 + 0.035 * nz[..., None])
    img = img * (1 - rc[..., None]) + panel * (1 + 0.03 * nz[..., None]) * rc[..., None]           # motif bodies (inlaid relief fields)
    sh = np.clip(g(ra, 1.6) - ra, 0, 1); img *= (1 - 0.5 * np.roll(np.roll(sh, 2, 0), 2, 1))[..., None] # cast relief shadow down-right
    hi = g(ra, 0.5); light = np.clip(1.0 + 0.25 * (np.roll(ra, 1, 0) - ra), 0.7, 1.25)
    img = img * (1 - hi[..., None]) + gilt * light[..., None] * hi[..., None]
    H_ = 2.5 * g(ra, 1.0) * emboss + 0.8 * g(rc, 1.5)
    gy, gx = np.gradient(H_); n = np.dstack([-gx * 1.4, gy * 1.4, np.ones_like(H_)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    return np.clip(img, 0, 255).astype(np.uint8), ((n * .5 + .5) * 255).astype(np.uint8)

def save(base, alb, nrm, out):
    for suf, a in (('', alb), ('_n', nrm)):
        im = Image.fromarray(a); f = f'{base}{suf}'
        im.save(f + '.webp', quality=88, method=6); im.resize((im.width // 2, im.height // 2), Image.LANCZOS).save(f + '.phone.webp', quality=84, method=6)
        out[('map' if suf == '' else 'normalMap')] = f + '.webp'

# ---------------- per-room motif units ----------------
# cornice / dado unit = (main motif at unit centre, filler at the unit seam), band = continuous row along the bottom
def fins_h(D, cx, by, s):                 # aircraft fins pair, horizontal, mirrored
    M['fin_stack'](D, cx + 4, by - s * 0.9, s * 0.9, 4, 1); M['fin_stack'](D, cx - 4, by - s * 0.9, s * 0.9, 4, -1)
def vol_pair(D, cx, by, s):
    M['volute'](D, cx - s * 0.55, by - s * 0.45, s * 0.38, 1, -1); M['volute'](D, cx + s * 0.55, by - s * 0.45, s * 0.38, -1, -1)
def cloud_unit(D, cx, by, s): M['clouds'](D, cx - s * 2.2, cx + s * 2.2, by, s * 0.5)
def feather_fan(D, cx, by, s): M['feather_crest'](D, cx, by, s, 7)
def palm_pair(D, cx, by, s): M['palm'](D, cx, by, s, 200, 340, 6)
def chevron_peak(D, cx, by, s): M['chevron_crest'](D, cx, by, s * 2.2, s * 0.9, 4)
def fountain_u(D, cx, by, s): M['fountain'](D, cx, by, s * 1.8, s * 0.95)
def sun(D, cx, by, s): M['sunburst'](D, cx, by, s, n=17)
def sun_nb(D, cx, by, s): M['sunburst'](D, cx, by, s, n=15, base=False)
def fan_u(D, cx, by, s): M['fan'](D, cx, by, s, 195, 345, n=11)
def peacock_u(D, cx, by, s): M['peacock'](D, cx, by, s, 9)
def shell_u(D, cx, by, s): M['scallop_shell'](D, cx, by, s, 13)
def small_fan(D, cx, by, s): M['fan'](D, cx, by, s * 0.5, 200, 340, n=7)
def small_sun(D, cx, by, s): M['sunburst'](D, cx, by, s * 0.45, n=9, base=False)
def small_peacock(D, cx, by, s): M['peacock'](D, cx, by, s * 0.5, 5)
def small_shell(D, cx, by, s): M['scallop_shell'](D, cx, by, s * 0.45, 9)
def small_chev(D, cx, by, s): M['chevron_crest'](D, cx, by, s * 0.9, s * 0.45, 3)
def small_palm(D, cx, by, s): M['palm'](D, cx, by, s * 0.6, 210, 330, 4)
def small_cloud(D, cx, by, s): M['clouds'](D, cx - s * 0.75, cx + s * 0.75, by, s * 0.32)
def small_feather(D, cx, by, s): M['feather_crest'](D, cx, by, s * 0.55, 5)

def band_waves(D, x0, x1, y, h): M['waves'](D, x0, x1, y, h)
def band_scallop(D, x0, x1, y, h): M['scallop_row'](D, x0, x1, y, h)
def band_chevron(D, x0, x1, y, h): M['chevron_band'](D, x0, x1, y - h * 0.5, h, k=2, step=h * 2)
def band_steps(D, x0, x1, y, h):          # ziggurat dentils (stepped Deco dentil course)
    x = x0
    while x < x1: D.line([(x, y), (x, y - h * .5), (x + h * .5, y - h * .5), (x + h * .5, y - h), (x + h, y - h), (x + h, y - h * .5), (x + h * 1.5, y - h * .5), (x + h * 1.5, y), (x + 2 * h, y)], 1.2); x += 2 * h
def band_none(D, *a): pass

# vertical (door jamb) motifs, drawn along the strip centre line from y0 to y1 with periods that divide the tile height
def v_chev(D, x, y0, y1, w): M['chevron_v'](D, x, y0, y1, w, step=w)
def v_palm(D, x, y0, y1, w): M['palm_v'](D, x, y0, y1, w)
def v_feather(D, x, y0, y1, w): M['feather_v'](D, x, y0, y1, w)
def v_waves(D, x, y0, y1, w): M['wave_band_v'](D, x, y0, y1, w / 1.6)
def v_fins(D, x, y0, y1, w):
    y = y0
    while y < y1: M['fin_stack'](D, x + 6, y + w * 0.3, w * 0.36, 5, 1); M['fin_stack'](D, x - 6, y + w * 0.3, w * 0.36, 5, -1); y += w * 0.5
def v_volute(D, x, y0, y1, w):
    y = y0; s = 1
    while y < y1: M['volute'](D, x, y + w * 0.5, w * 0.4, s, 1); s = -s; y += w
def v_scallop(D, x, y0, y1, w):
    y = y0
    while y < y1: M['scallop_row'](D, x - w, x + w, y + w * 0.5, w * 0.5); y += w * 0.5
def v_sun(D, x, y0, y1, w):
    y = y0
    while y < y1: M['sunburst'](D, x, y + w * 0.75, w * 0.48, n=9, base=False); y += w
def v_cloud(D, x, y0, y1, w):
    y = y0
    while y < y1: M['cloud_corner'](D, x, y + w * 0.6, w * 0.32, 1, 1); y += w
def v_fountain(D, x, y0, y1, w):
    y = y0
    while y < y1: M['fountain'](D, x, y + w, w * 0.8, w * 0.85); y += w
def v_fan(D, x, y0, y1, w):
    y = y0
    while y < y1: M['fan'](D, x, y + w * 0.8, w * 0.48, 200, 340, n=7); y += w
def v_peacock(D, x, y0, y1, w):
    y = y0
    while y < y1: M['peacock'](D, x, y + w * 0.8, w * 0.48, 5); y += w

# room: motifs, frieze band colour, cornice (main, filler, band), dado (unit, band), door (centre column, side columns), medallion
R = {
 '01': dict(m=['SUNBURST', 'CLOUDS'],                 band='terracotta', main=sun,        fill=small_cloud,   strip=band_steps,   dado=small_sun,     dband=band_none,    dc=v_sun,     ds=v_cloud,   med=sun_nb),
 '02': dict(m=['CHEVRON', 'FAN'],                     band='slate',      main=fan_u,      fill=small_chev,    strip=band_chevron, dado=small_fan,     dband=band_chevron, dc=v_fan,     ds=v_chev,    med=fan_u),
 '03': dict(m=['PALM LEAF', 'SCALLOP', 'SUNBURST'],   band='terracotta', main=sun,        fill=small_palm,    strip=band_scallop, dado=small_shell,   dband=band_none,    dc=v_palm,    ds=v_scallop, med=sun_nb),
 '04': dict(m=['FAN', 'PEACOCK', 'WAVES'],            band='slate',      main=peacock_u,  fill=small_fan,     strip=band_waves,   dado=small_fan,     dband=band_waves,   dc=v_peacock, ds=v_waves,   med=peacock_u),
 '05': dict(m=['VOLUTE', 'SCALLOP'],                  band='terracotta', main=shell_u,    fill=vol_pair,      strip=band_scallop, dado=small_shell,   dband=band_none,    dc=v_volute,  ds=v_scallop, med=shell_u),
 '06': dict(m=['FEATHER', 'PEACOCK', 'FAN'],          band='slate',      main=peacock_u,  fill=small_feather, strip=band_none,    dado=small_feather, dband=band_none,    dc=v_feather, ds=v_fan,     med=peacock_u),
 '07': dict(m=['AIRCRAFT FIN', 'CHEVRON'],            band='slate',      main=chevron_peak, fill=fins_h,      strip=band_chevron, dado=small_chev,    dband=band_none,    dc=v_fins,    ds=v_chev,    med=chevron_peak),
 '08': dict(m=['WAVES', 'PALM LEAF', 'SUNBURST'],     band='sage',       main=sun_nb,     fill=small_palm,    strip=band_waves,   dado=small_palm,    dband=band_waves,   dc=v_palm,    ds=v_waves,   med=sun_nb),
 '09': dict(m=['SUNBURST', 'WAVES', 'CLOUDS'],        band='violetdeep', main=sun_nb,    fill=small_cloud,   strip=band_waves,   dado=small_sun,     dband=band_waves,   dc=v_sun,     ds=v_waves,   med=sun_nb),
 '10': dict(m=['FOUNTAIN', 'CHEVRON'],                band='slate',      main=fountain_u, fill=small_chev,    strip=band_steps,   dado=small_chev,    dband=band_none,    dc=v_fountain, ds=v_chev,   med=fountain_u),
 '11': dict(m=['FEATHER', 'VOLUTE'],                  band='slate',      main=feather_fan, fill=vol_pair,     strip=band_none,    dado=small_feather, dband=band_none,    dc=v_feather, ds=v_volute,  med=feather_fan),
 '12': dict(m=['CLOUDS', 'WAVES', 'CHEVRON'],         band='slate',      main=cloud_unit, fill=small_chev,    strip=band_waves,   dado=small_cloud,   dband=band_chevron, dc=v_cloud,   ds=v_chev,    med=cloud_unit)}
PANEL = {'terracotta': PAL['coral'] * 0.92, 'slate': PAL['bluedeep'] * 1.05, 'sage': PAL['bluedeep'] * 0.95, 'violetdeep': PAL['coral'] * 0.95}
GILT = PAL['ochre']

def cornice(k, r):                         # 2048 x 256, tileable in X, 4 units per tile (period 512)
    w, h, P = 2048, 256, 512; D = canvas(w, h, 2.6)
    for x in (0, w): D.line([(x - 1, 12), (x + 1, 12)], 0)
    D.line([(-20, 14), (w + 20, 14)], 2.2); D.line([(-20, 26), (w + 20, 26)], 1.0); D.line([(-20, 244), (w + 20, 244)], 2.2)
    for i in range(-1, 5):
        cx = P * i + P / 2; r['main'](D, cx, 200, 150); r['fill'](D, P * i, 200, 110)
    D.line([(-20, 202), (w + 20, 202)], 1.8); r['strip'](D, -64, w + 64, 236, 16)
    return render(D, w, h, PAL[r['band']], PANEL[r['band']], GILT)

def dado(k, r):                            # 2048 x 128, tileable in X, lighter: plaster rail with terracotta + ochre relief (period 256)
    w, h, P = 2048, 128, 256; D = canvas(w, h, 1.9)
    D.line([(-20, 8), (w + 20, 8)], 1.6); D.line([(-20, 120), (w + 20, 120)], 1.6)
    for i in range(-1, 9): r['dado'](D, P * i + P / 2, 92, 120); D.dot(P * i, 64, 4)
    r['dband'](D, -64, w + 64, 112, 8)
    return render(D, w, h, PAL['plaster'], PAL['apricot'], hexc('#C9962A'), emboss=0.8)

def door(k, r):                            # 512 x 1024, tileable in Y (jambs / arch ring band, u across the band)
    w, h = 512, 1024; T = 3 * h; M['H'] = T
    D = canvas(w, T, 2.6)
    for x in (18, 30, w - 31, w - 19): D.line([(x, -10), (x, T + 10)], 2.0 if x in (18, w - 19) else 1.0)
    D.line([(150, -10), (150, T + 10)], 1.4); D.line([(w - 151, -10), (w - 151, T + 10)], 1.4)
    r['dc'](D, w / 2, 0, T, 256)
    r['ds'](D, 90, 0, T, 96); r['ds'](D, w - 91, 0, T, 96)
    alb, nrm = render(D, w, T, PAL['slate'], PAL['bluedeep'] * 1.05, GILT, wrap_y=True)
    return alb[h:2 * h], nrm[h:2 * h]

def medallion(k, r):                       # 512 square keystone / corner block, gilded on dusk slate, 3 gilt rings
    w = 512; D = canvas(w, w, 2.6)
    for f in (246, 232, 200): D.arc(256, 256, f, 0, 360, 2.2 if f != 232 else 1.0)
    r['med'](D, 256, 330, 175); D.line([(80, 334), (432, 334)], 2.0)
    M['scallop_row'](D, 120, 392, 400, 17)
    alb, nrm = render(D, w, w, PAL['slate'], PAL['bluedeep'] * 1.05, GILT, wrap_x=False)
    yy, xx = np.mgrid[0:w, 0:w]; a = (np.clip(250 - np.hypot(xx - 255.5, yy - 255.5), 0, 1) * 255).astype(np.uint8)
    return np.dstack([alb, a]), nrm

signs = {s['id']: s for s in json.load(open('../signs.json'))['signs']}
out = {'note': '#335 room deco (TJ Oct 26): same motif map as ../story-plaques/story-plates.json rooms', 'rooms': {}}
for k, r in R.items():
    e = {'title': signs.get(f'room-{k}', {}).get('text'), 'motifs': r['m'], 'frieze_band': r['band']}
    for name, fn in (('cornice-frieze', cornice), ('dado-rail', dado), ('door-surround', door), ('keystone-medallion', medallion)):
        o = {}; alb, nrm = fn(k, r); save(f'room-{k}-{name}', alb, nrm, o); e[name] = o
    out['rooms'][f'room-{k}'] = e; print(k, flush=True)
json.dump(out, open('room-deco.files.json', 'w'), indent=1)
