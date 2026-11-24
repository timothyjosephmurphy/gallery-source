# #822 = tracker #784 (TJ Oct 28 2026): remesh Maeve tour VO -> maeve-walk-2/ (49 clips, stop-20-portraits-and-studies). BASE repoint +
# local tour-manifest rewrite only; live maeve-walk/ and maeve/ packs untouched. STOPS (#783 plinth etc.) unchanged. Idempotent; backups /tmp/*.821.
import json, os, shutil, re
for s in ('src/catalog.json','src/tour.js','src/tour-manifest.json'):
    d='/tmp/'+os.path.basename(s)+'.821'
    if not os.path.exists(d): shutil.copy(s,d)
assert 'index-BgWbyI9R.js' in open('/tmp/execute.js.821').read(), 'rollback backup is not #821'
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (821,822), T['nest']
W=json.load(open('/tmp/wm822.json')); assert W['clip_count']==49 and W['pack']=='hex-tour-maeve-walk-2026-10-28-v2'
ty=lambda i: {'00-welcome':'welcome','01-offer':'offer','02-controls':'controls'}.get(i) or i.split('-')[0]
clips=[dict(order=k['seq'],seq=k['seq'],file=k['file'],room_stop=k['id'],type=ty(k['id']),transcript=k['transcript'],duration_s=k['duration_s']) for k in W['clips']]
spoken=round(sum(k['duration_s'] for k in clips),2); B2='https://img.tjm.art/play/tour/maeve-walk-2/'
assert any(k['room_stop']=='stop-20-portraits-and-studies' for k in clips)
M=dict(voice='Maeve (soft Irish)',voiceId=W['voiceId'],model=W['model'],speed=W['speed'],base_url=B2,pack=W['pack'],route819='24 stops walk script 2026-10-28 -> Kinoteka',remesh784='maeve-walk-2 (stop-20 Portraits and Studies)',spoken_total_s=spoken,clips=clips)
open('src/tour-manifest.json','w').write(json.dumps(M,ensure_ascii=False,indent=1))
t=open('src/tour.js').read()
blk=re.search(r"const STOPS = \{.*?\n(?=for \(const k in STOPS\))",t,re.S).group(0)
keys={int(k) for k in re.findall(r"^\s+(\d+): \{",blk,re.M)}; stops={k['seq'] for k in clips if k['type']=='stop'}
assert len(stops)==24 and keys==stops, ('STOPS/clip mismatch', keys^stops)
assert '34: { at: [12.375, 7.145, 0.866, 0.5, 3.2] }' in blk
t=t.replace("BASE = 'https://img.tjm.art/play/tour/maeve-walk/' /* #819 walk pack */","BASE = '"+B2+"' /* #784 walk-2 pack (stop-20 Portraits and Studies); #819 maeve-walk/ untouched */")
t=t.replace("Media on img.tjm.art/play/tour/maeve-walk/ (#819)","Media on img.tjm.art/play/tour/maeve-walk-2/ (#784)")
assert "maeve-walk-2/' /* #784" in t and "tour/maeve-walk/'" not in t and 'maeve-walk-2/ (#784)' in t
open('src/tour.js','w').write(t)
T['nest'].update(issue=822,prev=821,note822='tracker #784: Maeve tour VO remeshed to maeve-walk-2/ (49 clips, %ss, stop-20-portraits-and-studies); old maeve-walk/ and maeve/ packs untouched'%spoken)
T['tour784']=dict(base=B2,pack=W['pack'],clips=49,spoken_s=spoken,untouched=['https://img.tjm.art/play/tour/maeve-walk/','https://img.tjm.art/play/tour/maeve/'])
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
print('ok nest 822', spoken)
