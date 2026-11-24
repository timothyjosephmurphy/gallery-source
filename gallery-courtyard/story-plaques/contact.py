from PIL import Image, ImageDraw, ImageFont; import json, glob
m = json.load(open('story-plates.json')); x0, y0, x1, y1 = m['text_rect_px_desktop_topleft']
fp = (glob.glob('/usr/share/fonts/**/DejaVuSerif.ttf', recursive=True) or [None])[0]
f1 = ImageFont.truetype(fp, 34) if fp else ImageFont.load_default(); f2 = ImageFont.truetype(fp, 22) if fp else f1
S = Image.new('RGB', (3 * 540 + 20, 2 * 360 + 3 * 40), '#e4ddd2'); d = ImageDraw.Draw(S)
for i, k in enumerate(('dark', 'brass', 'enamel')):
    a = Image.open(f'story-plate-{k}.webp').convert('RGBA'); ink = m['variants'][k]['ink']
    t = a.copy(); td = ImageDraw.Draw(t); td.rectangle((x0, y0, x1, y1), outline='#ff3b7f', width=3)
    td.text((x0 + 10, y0 + 8), 'The Courtyard Story', font=f1, fill=ink)
    for j, line in enumerate(['Sample Writer copy drawn inside text_rect_uv.', 'Pink box = text rect (u %.3f-%.3f, v %.3f-%.3f).' % (m['text_rect_uv']['u0'], m['text_rect_uv']['u1'], m['text_rect_uv']['v0'], m['text_rect_uv']['v1'])]):
        td.text((x0 + 10, y0 + 70 + 34 * j), line, font=f2, fill=ink)
    for r, (im, lab) in enumerate([(a, f'{k} (blank, desktop 1024x640)'), (t, f'{k} with text rect + sample copy')]):
        S.paste(im.resize((520, 325)), (10 + i * 540, 40 + r * 400), im.resize((520, 325)))
        d.text((10 + i * 540, 14 + r * 400), lab, fill='#222', font=f2)
S.save('preview.png'); print(S.size)
