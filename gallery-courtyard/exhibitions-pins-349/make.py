# Exhibition pin for #349: an indigo diamond badge with a teal ring and a cream square centre, on a short stem.
# Sheet is 3 cells x 128 (default/hover/selected). Tip is bottom-centre at y≈0.97.
from PIL import Image,ImageDraw,ImageFilter
import json,os
OUT=os.path.dirname(os.path.abspath(__file__));S=128
P=dict(pin='#2E3F7A',pin_hover='#3F55A0',pin_sel='#1F8A8A',ring='#2A9D8F',edge='#3A3432',dot='#F3E6D8',spark='#F7CC3A',paper='#F3E6D8')
STATES=[('default','pin',1.0),('hover','pin_hover',1.1),('selected','pin_sel',1.18)]
def cell(key,sc):
    im=Image.new('RGBA',(S,S),(0,0,0,0));d=ImageDraw.Draw(im);c=S/2;tip=S*.97;r=34*sc;cy=tip-r-26*sc
    sh=Image.new('RGBA',(S,S),(0,0,0,0));ImageDraw.Draw(sh).ellipse([c-16,tip-5,c+16,tip+3],fill=(58,52,50,90));im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(2)))
    d.polygon([(c-5*sc,cy+r*.6),(c+5*sc,cy+r*.6),(c,tip)],fill=P['edge'])
    dia=lambda R:[(c,cy-R),(c+R,cy),(c,cy+R),(c-R,cy)]
    d.polygon(dia(r+6),fill=P['edge']);d.polygon(dia(r),fill=P['ring']);d.polygon(dia(r*.8),fill=P[key])
    q=r*.26;d.rectangle([c-q,cy-q,c+q,cy+q],fill=P['dot'])
    if key=='pin_sel':
        for x,y in [(c+r+4,cy-r+2),(c-r-2,cy-r+10)]:d.polygon([(x,y-7),(x+3,y),(x,y+7),(x-3,y)],fill=P['spark'])
    return im
sheet=Image.new('RGBA',(3*S,S))
for i,(_,k,sc) in enumerate(STATES):sheet.alpha_composite(cell(k,sc),(i*S,0))
sheet.save(f'{OUT}/pins-sheet.png',optimize=True);sheet.save(f'{OUT}/pins-sheet.webp',lossless=True,quality=92)
s64=sheet.resize((192,64),Image.LANCZOS);s64.save(f'{OUT}/pins-sheet-64.png',optimize=True);s64.save(f'{OUT}/pins-sheet-64.webp',lossless=True,quality=92)
# legend: collector (testimap cell 0) and exhibition (cell 0)
col=Image.open(f'{OUT}/../testimonials-map/pins-sheet.png').convert('RGBA').crop((0,0,S,S))
L=Image.new('RGBA',(512,160),P['paper']);d=ImageDraw.Draw(L);d.rectangle([2,2,509,157],outline=P['edge'],width=3)
L.alpha_composite(col,(24,16));L.alpha_composite(sheet.crop((0,0,S,S)),(272,16))
d.text((150,72),'COLLECTOR',fill=P['edge']);d.text((398,72),'EXHIBITION',fill=P['edge'])
L.convert('RGB').save(f'{OUT}/legend.png',optimize=True);L.convert('RGB').save(f'{OUT}/legend.webp',quality=92)
json.dump({"tracker":"#349 (studio-tracker #477)","sheet":"pins-sheet.png","sheet_phone":"pins-sheet-64.png","cell_px":S,"cells":3,
 "states":[s for s,_,_ in STATES],"sizes_m":{"default":0.14,"hover":0.16,"selected":0.18,"phone_min":0.16},
 "colors":{k:v for k,v in P.items()},"anchor":{"x":0.5,"y":0.97,"note":"tip at bottom-centre (UV y from top). Sprite center = (0.5, 0.03) in three.js bottom-origin"},
 "shape":"diamond badge on stem","dest":["/img/play/preview-251/testimap/","/img/play/preview-251/exhibitions-pins/"],"gated_on":"exhibitions-349.json approved:true"},open(f'{OUT}/pins.json','w'),indent=1)
pv=Image.new('RGBA',(640,440),P['paper']);t=Image.open(f'{OUT}/../testimonials-map/pins-sheet.png').convert('RGBA')
pv.alpha_composite(t,(16,16));pv.alpha_composite(sheet,(16,152));pv.alpha_composite(s64,(420,190));pv.alpha_composite(L,(16,256))
pv.convert('RGB').save(f'{OUT}/preview.png',optimize=True)
