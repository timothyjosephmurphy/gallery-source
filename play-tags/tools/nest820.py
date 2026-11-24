# #820 = tracker #782 (TJ Oct 28 2026): inner-courtyard full-width doorways: courtyardstyle skin/fan/slate/reveal and doorLight used a
# semicircle of radius w/2 (overshoots the 4.2 m wall on #777 full-width doors -> flat-cut tan shelf/ledge above). Now follow the same
# elliptical arch (rise = d.rise) as the travertine ring. Idempotent; backups /tmp/*.819.
import json, os, shutil
for s in ('src/catalog.json','src/courtyardstyle.js','src/tags.js'):
    d='/tmp/'+os.path.basename(s)+'.819'
    if not os.path.exists(d): shutil.copy(s,d)
assert 'index-DfD6EcCr.js' in open('/tmp/execute.js.819').read()
F='src/courtyardstyle.js'; t=open(F).read()
R=[("const w2 = d.width / 2, sp = d.spring ?? 2.4, seg = low ? 20 : 40;","const w2 = d.width / 2, sp = d.spring ?? 2.4, seg = low ? 20 : 40, ky782 = d.rise ? d.rise / w2 : 1; /* #782 elliptical on full-width doors */"),
 ("spand.absarc(0, sp, w2, Math.PI, 0, true);","spand.absellipse(0, sp, w2, w2 * ky782, Math.PI, 0, true);"),
 ("fan.translate(0, sp, 0);","fan.scale(1, ky782, 1); fan.translate(0, sp, 0);"),
 ("slate.translate(0, sp, 0);","slate.scale(1, ky782, 1); slate.translate(0, sp, 0);"),
 ("gl.translate(0, sp, 0);","gl.scale(1, ky782, 1); gl.translate(0, sp, 0);")]
for a,b in R:
    if b not in t: assert t.count(a)==1,a; t=t.replace(a,b)
open(F,'w').write(t)
F='src/tags.js'; t=open(F).read()
a="strip.rotation.y = Math.atan2(ox, oz); root.add(strip);"; b="strip.rotation.y = Math.atan2(ox, oz); if (d.rise) strip.scale.y = d.rise / (d.width / 2); /* #782 */ root.add(strip);"
if b not in t: assert t.count(a)==1; t=t.replace(a,b)
open(F,'w').write(t)
F='src/catalog.json'; c=json.load(open(F)); T=c['layout']['tags']; assert T['nest']['issue'] in (819,820)
T['nest'].update(issue=820,prev=819,note820='tracker #782: full arch curve on inner-courtyard full-width doorways (skin/fan/slate/reveal/doorLight elliptical = d.rise); overshooting semicircle shelf/ledge removed')
open(F,'w').write(json.dumps(c,ensure_ascii=False,separators=(',',':')))
print('ok nest 820')
