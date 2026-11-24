# #826 = tracker #785 on LIVE #825 (2ad80942 / index-Nx4ZKZKn.js): Maeve VO wire advice-maeve-1 (advice-manifest.json -> walk-manifest.json -> manifest.json),
# prefer clip duration_s for dwell. Idempotent; backups /tmp/execute.js.825 /tmp/advice785.js.825.
import json
assert 'index-Nx4ZKZKn.js' in open('/tmp/execute.js.825').read(), 'rollback backup is not #825'
F='src/advice785.js'; s=open(F).read()
old="fetch(BASE + 'manifest.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(m => { if (!m) return; const map = {}; const L = Array.isArray(m) ? m : m.clips || m.stops || null;\n    if (L) for (const c of L) { const f = c.url || c.file || c.audio; if (c.id && f) map[c.id] = /^https?:/.test(f) ? f : BASE + f; }"
new="const tryMan = names => names.length ? fetch(BASE + names[0], { cache: 'no-cache' }).then(r => r.ok ? r.json() : tryMan(names.slice(1))).catch(() => tryMan(names.slice(1))) : Promise.resolve(null); /* #826 */\n  tryMan(['advice-manifest.json', 'walk-manifest.json', 'manifest.json']).then(m => { if (!m) return; const map = {}, dur = S.dur = {}; const L = Array.isArray(m) ? m : m.clips || m.stops || null;\n    if (L) for (const c of L) { const f = c.url || c.file || c.audio; for (const k of [c.id, c.paintingId]) if (k && f) { map[k] = /^https?:/.test(f) ? f : BASE + f; if (c.duration_s > 0) dur[k] = +c.duration_s; } }"
if '/* #826 */' not in s:
    assert old in s; s=s.replace(old,new)
    s=s.replace("S.man = map; S.base = BASE; }).catch","S.man = map; S.base = BASE; S.audioReady = Object.keys(map).length >= 200; }).catch")
    o2="const url = S.man && S.man[s.c.id];"
    assert o2 in s; s=s.replace(o2,"const url = S.man && (S.man[s.c.id] || S.man[s.c.p]); const dd = S.dur && (S.dur[s.c.id] || S.dur[s.c.p]); if (url && dd && !muted()) d = Math.max(d, dd + 1);")
    open(F,'w').write(s)
F='src/catalog.json'; c=json.load(open(F)); n=c['layout']['tags']['nest']; assert n['issue'] in (825,826), n
n['issue']=826; n['prev']=825; n['note826']='tracker #785 Maeve VO wire advice-maeve-1 (advice-manifest.json)'
json.dump(c,open(F,'w'),ensure_ascii=False,indent=1); print('nest826 ok')
