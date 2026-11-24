from PIL import Image, ImageDraw, ImageFont; import glob, json
fp = glob.glob('/usr/share/fonts/**/DejaVuSans.ttf', recursive=True)[0]; F = ImageFont.truetype(fp, 18)
d = json.load(open('room-deco.json'))['rooms']; RH = 200; S = Image.new('RGB', (1700, 30 + RH * 12), '#1d1a17'); D = ImageDraw.Draw(S)
for i, (rid, e) in enumerate(d.items()):
    y = 30 + i * RH; D.text((10, y + 4), f"{rid} {e['title']}: {' + '.join(e['motifs'])}", font=F, fill='#f0e2c0')
    c = Image.open(e['cornice-frieze']['map']).convert('RGB').resize((1024, 128)); S.paste(c, (10, y + 28))
    t = Image.open(e['dado-rail']['map']).convert('RGB').resize((1024, 64)); S.paste(t, (10, y + 128 + 2 + 2))
    dr = Image.open(e['door-surround']['map']).convert('RGB').resize((86, 172)); S.paste(dr, (1050, y + 24))
    dd = Image.open(e["door-surround"]["map"]).convert("RGB"); st = Image.new("RGB", (512, 2048)); st.paste(dd, (0, 0)); st.paste(dd, (0, 1024)); S.paste(st.resize((43, 172)), (1150, y + 24))  # Y-tiling check (2 tiles stacked)
    m = Image.open(e['keystone-medallion']['map']).convert('RGBA').resize((170, 170)); S.paste(m, (1240, y + 24), m)
    cc = Image.open(e['cornice-frieze']['map']).convert('RGB'); seam = Image.new('RGB', (256, 128)); seam.paste(cc.crop((1920, 0, 2048, 256)).resize((128, 128)), (0, 0)); seam.paste(cc.crop((0, 0, 128, 256)).resize((128, 128)), (128, 0)); S.paste(seam, (1430, y + 28))
D.text((10, 4), 'room deco #335: cornice frieze (2048x256, half shown) | dado rail | door surround x2 | keystone | cornice X-seam check (end|start)', font=F, fill='#ffffff')
S.save('preview.png'); print(S.size)
