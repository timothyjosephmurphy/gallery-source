# #824 = tracker #787 (TJ walk Oct 28 2026) on LIVE #823 (2d3ef911 / index-Nuvvz0sY.js):
# (1) remove the dark "Warsaw, Poland" board on the Kinoteka entrance (locSigns818 kinoteka/gap801 entry),
# (2) restyle remaining outdoor loc signs as procedural mosaic-tile plaques. KINOTEKA lintel untouched. Idempotent; backups /tmp/*.823.
import json, os, shutil
for s in ('src/catalog.json','src/signs818.js'):
    d='/tmp/'+os.path.basename(s)+'.823'
    if not os.path.exists(d): shutil.copy(s,d)
assert 'index-Nuvvz0sY.js' in open('/tmp/execute.js.823').read(), 'rollback backup is not #823'
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (823,824), T['nest']
L=[{"court":"courtyard-paul","at":"room","label":"Warsaw, Poland"},{"court":"courtyard-paul","label":"Minneapolis, Minnesota"},
   {"court":"courtyard-h1","label":"Lillooet, BC"},{"court":"courtyard-btc","label":"Berlin, El Salvador"},{"court":"courtyard-patio","label":"Seattle, Washington"}]
T['locSigns818']=L
n=T['nest']; 
if n['issue']!=824: n['prev']=n['issue']
n['issue']=824; n['prev']=823; n['note824']='tracker #787: removed Kinoteka entrance Warsaw, Poland board (gap801 posts+bar); remaining 5 outdoor loc signs restyled as procedural mosaic tile plaques; KINOTEKA lintel kept'
json.dump(c,open(F,'w'),ensure_ascii=False,indent=1)
S='src/signs818.js'; t=open(S).read()
MOS=r'''// #824 (tracker #787): procedural mosaic-tile plaque for outdoor loc signs (tesserae border, cream field, slate tile letters, dark grout).
export function mosaicSignTex(text, W = 1536, H = 192) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), ts = 12, cols = Math.floor(W / ts), rows = Math.floor(H / ts);
  const mk = document.createElement('canvas'); mk.width = cols; mk.height = rows; const m = mk.getContext('2d'); let fs = Math.round(rows * 0.6);
  const font = s => `900 ${s}px Impact, "Arial Black", sans-serif`; m.font = font(fs); while (m.measureText(text.toUpperCase()).width > (cols - 8) && fs > 4) m.font = font(--fs);
  m.textAlign = 'center'; m.textBaseline = 'middle'; m.fillStyle = '#fff'; m.fillText(text.toUpperCase(), cols / 2, rows / 2 + 0.5); const md = m.getImageData(0, 0, cols, rows).data;
  let sd = 0; for (const ch of text) sd = (sd * 31 + ch.charCodeAt(0)) >>> 0; const rnd = () => ((sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296);
  const BORD = ['#d9822b', '#c4562a', '#e8a33c', '#b8452a', '#f0b84a'], FIELD = ['#f6efe2', '#efe6d4', '#f9f4ea', '#ece2cf'], ACC = ['#9fb8e0', '#c9a6e0', '#e8c46a', '#8fc0d8'], INK = ['#4e5d6c', '#566676', '#455260', '#5d6b78'];
  const pk = a => a[Math.floor(rnd() * a.length)];
  x.fillStyle = '#3a3330'; x.fillRect(0, 0, W, H);
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) { const b = r < 2 || q < 2 || r >= rows - 2 || q >= cols - 2, ink = md[(r * cols + q) * 4 + 3] > 110;
    x.fillStyle = b ? pk(BORD) : ink ? pk(INK) : (rnd() < 0.06 ? pk(ACC) : pk(FIELD)); const j = () => (rnd() - 0.5) * 1.6;
    x.fillRect(q * ts + 1.2 + j(), r * ts + 1.2 + j(), ts - 2.4, ts - 2.4); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
export function mosaicSignMesh(text, w, h) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: mosaicSignTex(text), side: THREE.FrontSide, toneMapped: false }));
  m.renderOrder = 3; m.raycast = () => {}; m.userData.decor = true; m.userData.mosaic824 = true; return m;
}
export function installSigns818('''
if 'mosaicSignTex' not in t: t=t.replace('export function installSigns818(',MOS,1)
OLD="const m = goldSignMesh(s.label, 3.6, 0.45);"; NEW="const m = mosaicSignMesh(s.label, 3.6, 0.45);"
if OLD in t: t=t.replace(OLD,NEW,1)
assert NEW in t and t.count('mosaicSignTex(')==2
open(S,'w').write(t)
assert 'goldSignMesh' in open('src/kino800.js').read()
print('nest824 ok', [s['court']+':'+s['label'] for s in L])
