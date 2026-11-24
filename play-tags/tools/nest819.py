# #819 (TJ Oct 28 2026): Maeve walk tour remesh -> 24 stops, maeve-walk/ VO pack (49 clips, manifest durations).
# Idempotent; asserts nest 818/819. Backups /tmp/*.818. Old /play/tour/maeve/ pack untouched (BASE only repointed).
import json, os, shutil, re
for s in ('src/catalog.json','deploy/execute.js','src/tour.js','src/tour-manifest.json'):
    d='/tmp/'+os.path.basename(s)+'.818'
    if not os.path.exists(d): shutil.copy(s,d)
assert 'index-DkjITMZd.js' in open('/tmp/execute.js.818').read(), 'rollback backup is not #818'
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (818,819), T['nest']
W=json.load(open('/workspace/music/hex-tour-maeve/walk-2026-10-28/walk-manifest.json')); assert W['clip_count']==49
ty=lambda i: {'00-welcome':'welcome','01-offer':'offer','02-controls':'controls'}.get(i) or i.split('-')[0]
clips=[dict(order=k['seq'],seq=k['seq'],file=k['file'],room_stop=k['id'],type=ty(k['id']),transcript=k['transcript'],duration_s=k['duration_s']) for k in W['clips']]
spoken=round(sum(k['duration_s'] for k in clips),2)
M=dict(voice='Maeve (soft Irish)',voiceId=W['voiceId'],model=W['model'],speed=W['speed'],base_url='https://img.tjm.art/play/tour/maeve-walk/',pack=W['pack'],route819='24 stops walk script 2026-10-28 -> Kinoteka',spoken_total_s=spoken,clips=clips)
open('src/tour-manifest.json','w').write(json.dumps(M,ensure_ascii=False,indent=1))
S={ # seq -> view (existing titles / murals / kino only)
 3:"{ here: 1 }", # stop 1 START maps (bot shows maps where the visitor stands)
 5:"{ spots: [[0.03, 'Sunrise on Rainier from Denny Blaine'], [0.4, 'Sunrise on Rainier with Eagle'], [0.7, 'Sunrise on Tahoma with motorcycles']] }",
 7:"{ spots: [[0.05, 'Lisa Climbing Tahoma at Sunrise from Denny Blaine'], [0.5, 'Sunrise on Tahoma from Denny Blaine with meditation self-portrait']] }",
 9:"{ spots: [[0.05, 'Devo & Katie @ Bass Coast'], [0.45, 'Devo at Bass Coast'], [0.7, 'Neil at Bass Coast']] }",
 11:"{ spots: [[0.03, 'Sunrise at Bass Coast 2023 #1'], [0.25, 'Sunrise at Bass Coast 2023 #2'], [0.45, 'The Temple, Daytime'], [0.62, 'Burning Man Temple 2022: Flame'], [0.8, 'Mayan Warrior']] }",
 13:"{ spots: [[0.03, 'El Zonte at Dawn'], [0.3, 'Sunset from Atami, El Salvador #1'], [0.55, 'Sunset in El Zonte, El Salvador'], [0.78, 'Sunset in El Tunco, El Salvador']] }",
 14:"{ spots: [[0.05, 'Tipi'], [0.5, 'Son TJ Sedona']] }", # [PASS] dad's fountain gallery, no dwell
 16:"{ spots: [[0.05, 'Untitled — Pacific North West, page 23'], [0.45, 'Rescued Hummingbird'], [0.7, 'TJ Hummingbird Feeder 190']] }",
 18:"{ spots: [[0.03, 'Myself in Skandasana on Playa de los Muertos at Dawn in Puerto Vallarta'], [0.55, 'TJ Beach Sunset 310']] }", # middle sunset after PV
 20:"{ mural: 'cormorant-presiding-over-sunset-on-puget-sound' }",
 22:"{ spots: [[0.05, 'Vision of Ukraine at Peace'], [0.5, 'The Mother of Kiev']] }",
 24:"{ mural: 'friends-club-mural' }",
 26:"{ mural: 'neural-dance' }",
 28:"{ spots: [[0.05, 'Grandpa Howard'], [0.5, 'Myself, my mother Ruth, my grandpa Howard']] }", # infant once (only spot of it)
 30:"{ spots: [[0.03, 'Izzy and Sienna in Austin'], [0.35, 'Tianna and child in Austin'], [0.65, 'Fiona and Joe in Austin']] }",
 32:"{ spots: [[0.05, 'Father Paul'], [0.4, 'Mother Ruth'], [0.7, 'Grandpa Howard']] }", # soft dad line; no infant repeat
 34:"{ at: [0, 0, 0.866, 0.5, 3.2] }", # centre: Reflections on Time lecterns
 36:"{ at: [0, 0, -0.866, 0.5, 2.6] }", # centre: checkout fountain/light
 38:"{ mural: 'berlin-el-salvador-mural' }",
 40:"{ spots: [[0.05, 'Catherine dance series — study 1'], [0.3, 'Catherine dance series — study 2'], [0.6, 'Catherine #1']] }",
 42:"{ spots: [[0.05, 'TJ Peter McCormack'], [0.5, 'TJ Jack Mallers']] }", # Bitcoiners speaker wall
 44:"{ spots: [[0.05, 'Michael Saylor @saylor'], [0.5, 'Nick Szabo @NickSzabo4']] }",
 46:"{ spots: [[0.05, 'Coined in Watercolor Film Poster']] }",
 48:"{ kino: 'kinoteka' }"}
stops=[k for k in clips if k['type']=='stop']; assert len(stops)==24 and set(S)=={k['seq'] for k in stops}, 'STOPS/clip mismatch'
blk='const STOPS = { // #819 walk script 2026-10-28: 24 stops START maps -> Rainier -> ... -> Coined in Watercolor -> Kinoteka. Keys = clip seq.\n'+',\n'.join(f'  {k}: {v}' for k,v in sorted(S.items()))+' };\n'
t=open('src/tour.js').read()
t=re.sub(r"const STOPS = \{.*?\n(?=for \(const k in STOPS\))",lambda m:blk,t,count=1,flags=re.S)
t=t.replace("BASE = 'https://img.tjm.art/play/tour/maeve/'","BASE = 'https://img.tjm.art/play/tour/maeve-walk/' /* #819 walk pack */")
t=t.replace("Media on img.tjm.art/play/tour/maeve/ (#809)","Media on img.tjm.art/play/tour/maeve-walk/ (#819)")
o="    if (st.mural) {"
n="    if (st.at) { c = V(st.at[0], 1.3, st.at[1]); n = V(st.at[2], 0, st.at[3]).normalize(); ds = [st.at[4], st.at[4] - 0.5, st.at[4] + 0.6, st.at[4] - 1, st.at[4] + 1.2]; } /* #819 centre stops */\n    else if (st.mural) {"
if 'st.at[0]' not in t: assert t.count(o)==1; t=t.replace(o,n)
assert "maeve-walk/' /* #819" in t and '48: { kino' in t and "tour/maeve/'" not in t
open('src/tour.js','w').write(t)
T['tour819']=dict(base=M['base_url'],stops=24,clips=49,spoken_s=spoken,old='maeve/ untouched')
T['nest'].update(issue=819,prev=818,note819='#819 Maeve walk tour: 24 stops, maeve-walk/ pack, manifest durations; #814-#816 behaviors kept')
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
print('ok nest 819 spoken',spoken)
