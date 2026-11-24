# #303 macro overlays + fountain water. Pillow only, seed 3033.
import random, json
from PIL import Image, ImageChops, ImageFilter, ImageOps, ImageDraw
R = random.Random(3033)
def pnoise(N, g):
    s = Image.new('L', (g, g)); s.putdata([R.randrange(256) for _ in range(g*g)])
    t = Image.new('L', (3*g, 3*g))
    for i in range(3):
        for j in range(3): t.paste(s, (i*g, j*g))
    return t.resize((3*N, 3*N), Image.BICUBIC).crop((N, N, 2*N, 2*N))
def fbm(N, octs):  # [(grid, weight)]
    acc = None; tw = 0
    for g, w in octs:
        n = pnoise(N, g)
        acc = n if acc is None else Image.blend(acc, n, w/(tw+w))
        tw += w
    return ImageOps.autocontrast(acc, cutoff=1)
def wrapblur(im, r):
    N = im.size[0]; t = Image.new(im.mode, (3*N, 3*N))
    for i in range(3):
        for j in range(3): t.paste(im, (i*N, j*N))
    return t.filter(ImageFilter.GaussianBlur(r)).crop((N, N, 2*N, 2*N))
def lut(lo, hi):  # map L 0..255 to RGB between lo(dark) and hi(white-ish)
    return [int(lo[c] + (hi[c]-lo[c])*v/255) for c in range(3) for v in range(256)]
def save(im, name, ph):
    im.save(name+'.png'); im.save(name+'.webp', quality=90, method=6)
    p = im.resize((ph, ph), Image.LANCZOS); p.save(name+'.phone.png'); p.save(name+'.phone.webp', quality=88, method=6)
N = 2048
specs = {  # multiply fields: white = no change; darkest ~ modest warm tint
  'plaster':   ([(4,1),(8,.6),(16,.3),(48,.12)], (214,200,188)),
  'ashlar':    ([(3,1),(7,.7),(14,.35),(40,.15)], (205,192,178)),
  'flagstone': ([(5,1),(10,.6),(22,.35),(64,.15)], (200,190,182)),
}
for k, (o, lo) in specs.items():
    h = wrapblur(fbm(N, o), 6)
    rgb = Image.merge('RGB', [h]*3).point(lut(lo, (255, 252, 247)))
    save(rgb, f'macro-{k}', 1024)
# water: height = periodic ripples
W = 1024
h = fbm(W, [(6,1),(12,.8),(24,.5),(48,.25)])
h2 = fbm(W, [(9,1),(18,.6)])
caus = ImageOps.autocontrast(ImageChops.difference(h, h2)).point(lambda v: 255-v)  # bright thin lines where fields cross
caus = wrapblur(caus, 1.5).point(lambda v: max(0, v-150)*255//105)
base = Image.merge('RGB', [h]*3).point(lut((86,118,124), (130,160,162)))  # calm slate-sage teal
tint = Image.new('RGB', (W, W), (226,234,228))
alb = Image.composite(tint, base, caus.point(lambda v: v*45//100))
alpha = h.point(lambda v: 150 + v*60//255)  # 0.59-0.82 opacity
alb.putalpha(alpha); save(alb, 'water-surface', 512)
hs = wrapblur(h, 2)
def grad(im, dx, dy):
    a = ImageChops.offset(im, -dx, -dy); b = ImageChops.offset(im, dx, dy)
    return ImageChops.subtract(a, b, scale=2, offset=128)  # (a-b)/2+128 ... approximate
gx = Image.eval(grad(hs,1,0), lambda v: 128 + (v-128)*3); gy = Image.eval(grad(hs,0,1), lambda v: 128 + (v-128)*3)
nrm = Image.merge('RGB', [gx.point(lambda v: 255-v), gy, Image.new('L', (W, W), 250)])
save(nrm, 'water-surface_n', 512)
rough = h.point(lambda v: 10 + v*25//255)  # 0.04-0.14 glossy, slight variation
save(Image.merge('RGB', [rough]*3), 'water-surface_r', 512)
# preview: 3x3 tiles of each macro multiplied onto base at 0.2, plus water
pv = Image.new('RGB', (1536, 1024), (240,236,230)); d = ImageDraw.Draw(pv)
bases = {'plaster':'../hq-assets/walls/wall-plaster.webp','ashlar':'../hq-assets/walls/wall-ashlar.webp','flagstone':'../hq-assets/floors/floor-flagstone.webp'}
for i, (k, p) in enumerate(bases.items()):
    b = Image.open(p).convert('RGB').resize((48, 48))
    m = Image.open(f'macro-{k}.png').resize((168, 168))  # macro covers 3.5 tiles
    for row, use in enumerate((False, True)):
        c = Image.new('RGB', (504, 480))
        for x in range(0, 504, 48):
            for y in range(0, 480, 48): c.paste(b, (x, y))
        if use:
            mt = Image.new('RGB', (504, 480))
            for x in range(0, 504, 168):
                for y in range(0, 480, 168): mt.paste(m, (x, y))
            c = Image.blend(c, ImageChops.multiply(c, mt), 0.2)
        pv.paste(c, (i*512+4, row*512+28)); d.text((i*512+8, row*512+8), f"{k} {'+macro x0.2' if use else 'base only'}", fill=(40,40,40))
pv.save('preview.png')
w = Image.open('water-surface.png'); bg = Image.new('RGBA', w.size, (185,175,160,255)); bg.alpha_composite(w)
bg.convert('RGB').resize((512,512)).save('preview-water.png')
