# Rebuild procedural brass plaque plate (no legible painted plaque in source).
# Also re-crops reference details from the original painting.
import json, numpy as np
from PIL import Image, ImageDraw, ImageFilter
SRC='/workspace/vm-540/gallery-images/sunrise-on-rainier-with-eagle-full-2026.jpg'
src=Image.open(SRC)
src.crop((150,520,360,640)).save('ref-flag-rock-crop.png')   # draped striped cloth on rock
src.crop((2280,580,2400,670)).save('ref-signature-crop.png') # artist signature
W,H=1600,640; rng=np.random.default_rng(354)
y,x=np.mgrid[0:H,0:W]
base=np.array([181,140,62],float)
grain=rng.normal(0,1,(H,W)); g=Image.fromarray(((grain+4)*30).clip(0,255).astype('uint8')).resize((W//40,H)).resize((W,H),Image.BICUBIC)
g=(np.asarray(g,float)/255-.5)*30
sheen=40*np.cos((x/W-.35)*np.pi*1.3)-15*(y/H)
img=(base+(g+sheen)[...,None]*np.array([1,.85,.5])).clip(0,255).astype('uint8')
im=Image.fromarray(img).convert('RGBA')
mask=Image.new('L',(W,H),0); ImageDraw.Draw(mask).rounded_rectangle((0,0,W-1,H-1),36,fill=255)
d=ImageDraw.Draw(im)
for i,c in [(14,(120,88,34)),(22,(222,186,110)),(30,(140,104,44))]:
    d.rounded_rectangle((i,i,W-1-i,H-1-i),36-i//2 if i<60 else 6,outline=c,width=4)
for cx,cy in [(70,70),(W-70,70),(70,H-70),(W-70,H-70)]:
    d.ellipse((cx-18,cy-18,cx+18,cy+18),fill=(110,80,30)); d.ellipse((cx-13,cy-15,cx+9,cy+7),fill=(230,196,120))
    d.line((cx-10,cy,cx+10,cy),fill=(80,56,20),width=4)
im.putalpha(mask); im.save('eagle-brass-plaque.png')
im.resize((800,320),Image.LANCZOS).save('eagle-brass-plaque.desktop.webp',quality=90)
im.resize((400,160),Image.LANCZOS).save('eagle-brass-plaque.phone.webp',quality=85)
pv=Image.new('RGB',(1000,560),(200,200,196)); p=src.copy(); p.thumbnail((1000,280)); pv.paste(p,(0,0))
pv.paste(im.resize((500,200)),(250,320),im.resize((500,200))); pv.save('preview.png')
json.dump({"id":"eagle-brass-plaque","issue":354,"kind":"procedural-plate","hang_next_to":"painting-portrait-with-hat",
 "source_painting":{"slug":"painting-portrait-with-hat","title":"Sunrise on Rainier with Eagle","refs":[SRC,"/workspace/vm-540/static/display/sunrise-on-rainier-with-eagle-full-2026-9da0e29055-1600.webp"]},
 "pixel_size":[W,H],"suggested_world_size_m":[0.40,0.16],"ocr_caption":None,
 "caption_status":"no painted plaque/legible text in painting; Gallery/Writer must set caption text",
 "files":{"master":"eagle-brass-plaque.png","desktop":"eagle-brass-plaque.desktop.webp","phone":"eagle-brass-plaque.phone.webp"}},open('plaque.json','w'),indent=2)
