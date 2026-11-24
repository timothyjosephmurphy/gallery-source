from PIL import Image, ImageDraw, ImageFont; import json, glob
m = json.load(open('story-plates.json')); x0, y0, x1, y1 = m['text_rect_px_desktop_topleft']
fp = glob.glob('/usr/share/fonts/**/DejaVuSerif.ttf', recursive=True)[0]; f = lambda n: ImageFont.truetype(fp, n)
TW, TH, C = 480, 300, 4; S = Image.new('RGB', (C * (TW + 16) + 16, 4 * (TH + 46) + 16), '#1d1a17'); d = ImageDraw.Draw(S)
rooms = list(m['rooms'].items()) + [('sample', None)]
for i, (rid, r) in enumerate(rooms):
    x, y = 16 + (i % C) * (TW + 16), 16 + (i // C) * (TH + 46)
    if r is None:
        rid0, r0 = rooms[3]; a = Image.open(r0['map']).convert('RGBA'); t = ImageDraw.Draw(a)
        t.rectangle((x0, y0, x1, y1), outline='#ff3b7f', width=4)
        t.text((x0 + 24, y0 + 22), r0['title'] or 'Festival', font=f(46), fill='#2a1a0c')
        for j, ln in enumerate(['Sample Writer copy in ink #2a1a0c, drawn inside', 'text_rect_uv u 0.094-0.906, v 0.1375-0.8625.', 'Pink = text rect; deco stays outside it.']):
            t.text((x0 + 24, y0 + 100 + 38 * j), ln, font=f(26), fill='#2a1a0c')
        lab = f'SAMPLE ({rid0}) with text rect + copy'
    else:
        a = Image.open(r['map']).convert('RGBA'); lab = f"{rid} {r['title']}: {' + '.join(r['motifs'])}"
    im = a.resize((TW, TH), Image.LANCZOS); S.paste(im, (x, y + 30), im); d.text((x, y + 6), lab, font=f(15), fill='#f0e2c0')
S.save('preview.png'); print(S.size)
